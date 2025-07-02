import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
  Row,
  Col,
  Typography,
  DatePicker,
  Input,
  Select,
  Spin,
  Form,
  Drawer,
  Empty,
  Alert,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/fr";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import InvoiceService from "../../services/invoiceService";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// CRA status constants
const CRA_STATUS = {
  A_SAISIR: "À saisir",
  EN_ATTENTE_PRESTATAIRE: "En attente validation prestataire",
  EN_ATTENTE_CLIENT: "En attente validation client",
  VALIDE: "Validé",
};

const ClientCraValidation = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [craList, setCraList] = useState([]);
  const [filteredCraList, setFilteredCraList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [craDetailVisible, setCraDetailVisible] = useState(false);
  const [selectedCra, setSelectedCra] = useState(null);
  const [validationNote, setValidationNote] = useState("");
  const [showInfoNote, setShowInfoNote] = useState(true);
  // Add state for CRA status tracking
  const [craStatusMap, setCraStatusMap] = useState(new Map());

  // Filter states
  const [consultants, setConsultants] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [esns, setEsns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedEsn, setSelectedEsn] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);

  // Fetch CRA data when component mounts
  useEffect(() => {
    fetchCraList();
  }, []);

  // Filter CRA list based on search text and filters
  useEffect(() => {
    filterCraList();
  }, [
    searchText,
    dateRange,
    craList,
    selectedConsultant,
    selectedPeriod,
    selectedEsn,
    selectedProject,
  ]);

  // Fetch CRA list from API
  const fetchCraList = async () => {
    setLoading(true);
    // Reset filters
    setSearchText("");
    setDateRange([null, null]);
    setSelectedConsultant(null);
    setSelectedPeriod(null);
    setSelectedEsn(null);
    setSelectedProject(null);

    try {
      const clientId = localStorage.getItem("id");
      const token = localStorage.getItem("token");

      if (!clientId || !token) {
        message.error("Information de connexion non trouvée");
        setLoading(false);
        return;
      }

      // Get current period in MM_YYYY format
      const currentPeriod = moment().format("MM_YYYY");

      // Use the client-specific API endpoint with period
      const response = await axios.get(
        `${Endponit()}/api/cra-by-client-period/`,
        {
          params: {
            client_id: clientId,
            period: currentPeriod,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.status) {
        // Process data from the API response
        const craData = response.data.data || [];
        console.log("CRA data fetched:", craData.length, "entries");

        // Set client info
        setClientInfo(response.data.client || null);

        // Apply initial filter for entries up to the current day
        const currentDate = moment();
        const filteredData = craData.filter((cra) => {
          const periode = cra.période || "";
          const jour = cra.jour || "1";
          const [month, year] = periode.split("_");
          if (!month || !year) return false;

          const craDate = moment(`${year}-${month}-${jour}`);
          return craDate.isSameOrBefore(currentDate, "day");
        });
        console.log(
          "CRA data up to current day:",
          filteredData.length,
          "entries"
        );

        setCraList(craData);
        setFilteredCraList(filteredData);

        // Extract unique consultants, ESNs, periods, and projects
        const uniqueConsultants = [
          ...new Set(
            craData
              .map((cra) => {
                const consultant = cra.consultant || {};
                return consultant.id
                  ? {
                      id: consultant.id,
                      name:
                        `${consultant.prenom || ""} ${
                          consultant.nom || ""
                        }`.trim() || "Consultant sans nom",
                    }
                  : null;
              })
              .filter(Boolean)
              .map(JSON.stringify)
          ),
        ].map(JSON.parse);

        const uniqueEsns = [
          ...new Set(
            craData
              .map((cra) => {
                const consultant = cra.consultant || {};
                const esn = consultant.esn || {};
                return esn.id
                  ? {
                      id: esn.id,
                      name: esn.name || "ESN sans nom",
                    }
                  : null;
              })
              .filter(Boolean)
              .map(JSON.stringify)
          ),
        ].map(JSON.parse);

        const uniquePeriods = [
          ...new Set(
            craData
              .map((cra) => {
                const periode = cra.période || "";
                return periode
                  ? {
                      value: periode,
                      label: formatPeriod(periode),
                    }
                  : null;
              })
              .filter(Boolean)
              .map(JSON.stringify)
          ),
        ].map(JSON.parse);

        const uniqueProjects = [
          ...new Set(
            craData
              .map((cra) => {
                const project = cra.project || {};
                return project.id
                  ? {
                      id: project.id,
                      name: project.titre || "Projet sans nom",
                    }
                  : null;
              })
              .filter(Boolean)
              .map(JSON.stringify)
          ),
        ].map(JSON.parse);
        setConsultants(uniqueConsultants);
        setEsns(uniqueEsns);
        setPeriods(uniquePeriods);
        setProjects(uniqueProjects);

        // Fetch CRA status for unique consultant/period combinations
        const consultantPeriodCombinations = [
          ...new Set(
            craData
              .map((cra) => {
                const consultant = cra.consultant || {};
                const periode = cra.période || "";
                return consultant.id && periode
                  ? `${consultant.id}_${periode}`
                  : null;
              })
              .filter(Boolean)
          ),
        ];

        // Fetch CRA status for each combination
        const statusPromises = consultantPeriodCombinations.map(
          async (combination) => {
            const [consultantId, period] = combination.split("_");
            const status = await fetchCraStatus(consultantId, period);
            return { key: combination, status };
          }
        );

        const statusResults = await Promise.all(statusPromises);
        const newStatusMap = new Map();
        statusResults.forEach(({ key, status }) => {
          newStatusMap.set(key, status);
        });
        setCraStatusMap(newStatusMap);
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la récupération des CRAs"
        );
      }
    } catch (error) {
      console.error("Error fetching client CRA validation list:", error);
      message.error("Impossible de charger la liste des CRAs à valider");
      setCraList([]);
      setFilteredCraList([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch CRA status from API
  const fetchCraStatus = async (consultantId, period) => {
    try {
      const token = localStorage.getItem("token");

      if (!consultantId || !period || !token) {
        return CRA_STATUS.A_SAISIR; // Default status
      }

      const response = await axios.get(`${Endponit()}/api/cra_consultant/`, {
        params: {
          consultant_id: consultantId,
          period: period,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status && response.data?.data) {
        const apiStatus = response.data.data.status;

        // Map API status values to internal constants
        const statusMapping = {
          saisi: CRA_STATUS.A_SAISIR,
          en_attente_prestataire: CRA_STATUS.EN_ATTENTE_PRESTATAIRE,
          en_attente_client: CRA_STATUS.EN_ATTENTE_CLIENT,
          valide: CRA_STATUS.VALIDE,
        };

        return statusMapping[apiStatus] || CRA_STATUS.A_SAISIR;
      }

      return CRA_STATUS.A_SAISIR; // Default if no record found
    } catch (error) {
      console.error("Error fetching CRA status:", error);
      return CRA_STATUS.A_SAISIR; // Default on error
    }
  };

  // Update CRA status for a consultant/period combination
  const updateCraStatusMap = async (consultantId, period) => {
    const status = await fetchCraStatus(consultantId, period);
    const key = `${consultantId}_${period}`;

    setCraStatusMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(key, status);
      return newMap;
    });

    return status;
  };

  // Get CRA status from map or fetch if not available
  const getCraStatus = (consultantId, period) => {
    const key = `${consultantId}_${period}`;
    return craStatusMap.get(key) || CRA_STATUS.A_SAISIR;
  };

  // Filter CRA list based on search text and filters
  const filterCraList = () => {
    if (!craList || craList.length === 0) {
      setFilteredCraList([]);
      return;
    }

    let filtered = [...craList];

    // Always filter for "En attente validation client" status
    filtered = filtered.filter((cra) => {
      return cra.statut === CRA_STATUS.EN_ATTENTE_CLIENT;
    });

    // Filter by search text
    if (searchText) {
      const searchTextLower = searchText.toLowerCase();
      filtered = filtered.filter((cra) => {
        const consultant = cra.consultant || {};
        const consultantName = `${consultant.prenom || ""} ${
          consultant.nom || ""
        }`.toLowerCase();
        const esn = consultant.esn || {};
        const esnName = (esn.name || "").toLowerCase();
        const project = cra.project || {};
        const projectName = (project.titre || "").toLowerCase();
        const bdc = cra.bdc || {};
        const bdcNumber = (bdc.numero || "").toLowerCase();

        return (
          consultantName.includes(searchTextLower) ||
          esnName.includes(searchTextLower) ||
          projectName.includes(searchTextLower) ||
          bdcNumber.includes(searchTextLower) ||
          (cra.période || "").toLowerCase().includes(searchTextLower)
        );
      });
    }

    // Filter by consultant
    if (selectedConsultant) {
      filtered = filtered.filter((cra) => {
        const consultant = cra.consultant || {};
        return consultant.id === selectedConsultant;
      });
    }

    // Filter by ESN
    if (selectedEsn) {
      filtered = filtered.filter((cra) => {
        const consultant = cra.consultant || {};
        const esn = consultant.esn || {};
        return esn.id === selectedEsn;
      });
    }

    // Filter by period
    if (selectedPeriod) {
      filtered = filtered.filter((cra) => {
        return cra.période === selectedPeriod;
      });
    }

    // Filter by project
    if (selectedProject) {
      filtered = filtered.filter((cra) => {
        const project = cra.project || {};
        return project.id === selectedProject;
      });
    }

    // Filter by date range
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");

      filtered = filtered.filter((cra) => {
        // Convert period (MM_YYYY) and day to a date object for comparison
        const periode = cra.période || "";
        const jour = cra.jour || "1";
        const [month, year] = periode.split("_");
        if (!month || !year) return false;

        const craDate = moment(`${year}-${month}-${jour}`);
        return craDate.isBetween(startDate, endDate, null, "[]");
      });
    }

    // Filter CRAs to only include entries up to the current day
    const currentDate = moment();
    filtered = filtered.filter((cra) => {
      const periode = cra.période || "";
      const jour = cra.jour || "1";
      const [month, year] = periode.split("_");
      if (!month || !year) return false;

      const craDate = moment(`${year}-${month}-${jour}`);
      return craDate.isSameOrBefore(currentDate, "day");
    });

    setFilteredCraList(filtered);
  };

  // View CRA details
  const viewCraDetails = (cra) => {
    setSelectedCra(cra);
    setCraDetailVisible(true);
  };

  // Handle CRA validation
  const handleValidation = async (approved) => {
    setLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      const token = localStorage.getItem("token");

      if (!clientId || !selectedCra) {
        message.error("Information de connexion ou de CRA non trouvée");
        return;
      }

      const craId = selectedCra.id_imputation;

      if (!craId) {
        message.error("ID d'imputation CRA non trouvé");
        console.error("Missing CRA ID - Data available:", selectedCra);
        setLoading(false);
        return;
      }

      console.log("Validating CRA with ID:", craId);

      // Prepare the data for the PUT request
      const updatedCraData = {
        période: selectedCra.période,
        jour: selectedCra.jour || 1,
        Durée: selectedCra.Durée || "0",
        type: selectedCra.type || "travail",
        id_consultan: selectedCra.id_consultan || selectedCra.consultant?.id,
        id_esn: selectedCra.id_esn,
        id_client: parseInt(clientId),
        id_bdc: selectedCra.id_bdc || selectedCra.project?.id,
        statut: approved
          ? CRA_STATUS.VALIDE
          : CRA_STATUS.EN_ATTENTE_PRESTATAIRE,
        commentaire: validationNote,
      };

      const response = await axios.put(
        `${Endponit()}/api/cra_imputation/${craId}/`,
        updatedCraData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.status) {
        // Si le CRA est validé, générer automatiquement les factures
        if (approved) {
          try {
            // Récupérer le TJM depuis le BDC en priorité, puis candidature en fallback
            let finalTjm = 500; // Valeur par défaut
            
            const consultant = selectedCra.consultant || {};
            const candidature = selectedCra.candidature || {};
            const bdcId = selectedCra.id_bdc;
            const consultantId = consultant.id || selectedCra.id_consultan;

            console.log("Récupération du TJM pour la génération de factures:", {
              bdcId: bdcId,
              consultantId: consultantId,
              candidature: candidature,
              selectedCra: selectedCra
            });

            // 1. Essayer de récupérer le TJM depuis l'API BDC
            if (bdcId && consultantId) {
              const tjmFromBdc = await fetchTjmFromBdc(bdcId, consultantId);
              if (tjmFromBdc && tjmFromBdc > 0) {
                finalTjm = tjmFromBdc;
                console.log("TJM récupéré depuis BDC:", finalTjm);
              } else {
                console.warn("TJM non trouvé dans BDC, tentative avec candidature");
              }
            }

            // 2. Si pas de TJM depuis BDC, utiliser la candidature
            if (finalTjm === 500 && candidature.tjm) {
              const tjmFromCandidature = parseFloat(candidature.tjm) || 0;
              if (tjmFromCandidature > 0) {
                finalTjm = tjmFromCandidature;
                console.log("TJM récupéré depuis candidature:", finalTjm);
              }
            }

            // 3. Log final TJM
            if (finalTjm === 500) {
              console.warn("Aucun TJM trouvé, utilisation de la valeur par défaut:", finalTjm);
            } else {
              console.log("TJM final utilisé pour les factures:", finalTjm);
            }

            const craDataForInvoice = {
              consultant: selectedCra.consultant,
              esn: selectedCra.consultant?.esn,
              client: { id: parseInt(clientId) },
              periode: selectedCra.période,
              tjm: finalTjm,
              jours_travailles: parseFloat(selectedCra.Durée) || 1,
              bdc_id: selectedCra.id_bdc,
            };            console.log("Génération des factures pour:", craDataForInvoice);
            console.log("TJM utilisé:", craDataForInvoice.tjm);

            const invoiceResult =
              await InvoiceService.generateInvoicesAfterCRAValidation(
                craDataForInvoice
              );

            if (invoiceResult.success) {
              message.success(
                `CRA validé avec succès ! ${invoiceResult.factures.length} factures générées automatiquement.`
              );
            } else {
              message.warning(
                `CRA validé mais erreur lors de la génération des factures: ${invoiceResult.message}`
              );
            }
          } catch (invoiceError) {
            console.error(
              "Erreur lors de la génération des factures:",
              invoiceError
            );
            message.warning(
              "CRA validé mais erreur lors de la génération automatique des factures"
            );
          }
        } else {
          message.success(
            "CRA refusé et renvoyé au prestataire pour modifications"
          );
        }

        setCraDetailVisible(false);
        setSelectedCra(null);
        setValidationNote("");
        // Refresh the CRA list
        fetchCraList();
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la validation du CRA"
        );
      }
    } catch (error) {
      console.error("Error validating CRA:", error);
      message.error(
        "Impossible de valider le CRA: " + (error.message || "Erreur inconnue")
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch TJM from Bon de Commande API
  const fetchTjmFromBdc = async (bdcId, consultantId) => {
    try {
      const token = localStorage.getItem("token");

      if (!bdcId || !token) {
        console.warn("BDC ID ou token manquant pour récupérer le TJM");
        return null;
      }

      console.log("Récupération du TJM pour BDC:", bdcId, "Consultant:", consultantId);      const response = await axios.get(
        `${Endponit()}/api/Bondecommande/${bdcId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.status && response.data?.data) {
        const bdcData = response.data.data;
        console.log("Données BDC récupérées:", bdcData);

        // Look for the TJM in the BDC data - it might be in candidatures or direct field
        let tjm = null;

        // Check if TJM is directly in BDC data
        if (bdcData.tjm) {
          tjm = parseFloat(bdcData.tjm);
        }
        // Check if there are candidatures associated with this consultant
        else if (bdcData.candidatures && Array.isArray(bdcData.candidatures)) {
          const consultantCandidature = bdcData.candidatures.find(
            (candidature) => candidature.id_consultant === consultantId || candidature.consultant_id === consultantId
          );
          if (consultantCandidature && consultantCandidature.tjm) {
            tjm = parseFloat(consultantCandidature.tjm);
          }
        }
        // Check if there's a selected candidature
        else if (bdcData.candidature && bdcData.candidature.tjm) {
          tjm = parseFloat(bdcData.candidature.tjm);
        }

        console.log("TJM trouvé dans BDC:", tjm);
        return tjm;
      } else {
        console.error("Erreur API BDC:", response.data);
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du TJM depuis BDC:", error);
      return null;
    }
  };

  // Format period string (MM_YYYY) to more readable format
  const formatPeriod = (period) => {
    if (!period) return "";
    const [month, year] = period.split("_");
    if (!month || !year) return period; // Return original if can't split
    return moment(`${year}-${month}-01`).format("MMMM YYYY");
  };

  // Table columns
  const columns = [
    {
      title: "Consultant",
      key: "consultant_name",
      render: (record) => {
        const consultant = record.consultant || {};
        return `${consultant.prenom || ""} ${consultant.nom || ""}`;
      },
      sorter: (a, b) => {
        const consultantA = a.consultant || {};
        const consultantB = b.consultant || {};
        const nameA = `${consultantA.prenom || ""} ${consultantA.nom || ""}`;
        const nameB = `${consultantB.prenom || ""} ${consultantB.nom || ""}`;
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: "ESN",
      key: "esn_name",
      render: (record) => {
        const consultant = record.consultant || {};
        const esn = consultant.esn || {};
        return esn.name || "-";
      },
      sorter: (a, b) => {
        const consultantA = a.consultant || {};
        const consultantB = b.consultant || {};
        const esnA = consultantA.esn || {};
        const esnB = consultantB.esn || {};
        return (esnA.name || "").localeCompare(esnB.name || "");
      },
    },
    {
      title: "Projet",
      key: "project_name",
      render: (record) => {
        const project = record.project || {};
        return project.titre || "-";
      },
      sorter: (a, b) => {
        const projectA = a.project || {};
        const projectB = b.project || {};
        return (projectA.titre || "").localeCompare(projectB.titre || "");
      },
    },

    {
      title: "Date",
      key: "date",
      render: (record) => {
        const periode = record.période || "";
        const jour = record.jour || "1";
        const [month, year] = periode.split("_");
        return jour && month && year ? `${jour}/${month}/${year}` : "-";
      },
      sorter: (a, b) => {
        const periodeA = a.période || "";
        const jourA = a.jour || "1";
        const [monthA, yearA] = periodeA.split("_");

        const periodeB = b.période || "";
        const jourB = b.jour || "1";
        const [monthB, yearB] = periodeB.split("_");

        return (
          new Date(yearA, monthA - 1, jourA) -
          new Date(yearB, monthB - 1, jourB)
        );
      },
    },
    {
      title: "Durée (j)",
      dataIndex: "Durée",
      key: "duration",
      render: (text) => text || "0",
      sorter: (a, b) => (parseFloat(a.Durée) || 0) - (parseFloat(b.Durée) || 0),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text) => {
        const type = text || "";
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
    },
    {
      title: "Statut",
      key: "status",
      render: (record) => {
        // Get consultant ID and period from record
        const consultant = record.consultant || {};
        const consultantId = consultant.id;
        const periode = record.période || "";

        // Get CRA status from API or use default
        const craStatus = getCraStatus(consultantId, periode);

        let color = "default";
        let displayStatus = craStatus;

        if (craStatus === CRA_STATUS.VALIDE) {
          color = "green";
        } else if (craStatus === CRA_STATUS.EN_ATTENTE_CLIENT) {
          color = "orange";
          displayStatus = "À valider"; // Change display text for client validation
        } else if (craStatus === CRA_STATUS.EN_ATTENTE_PRESTATAIRE) {
          color = "blue";
        } else if (craStatus === CRA_STATUS.A_SAISIR) {
          color = "red";
        }

        return <Tag color={color}>{displayStatus || "Non défini"}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => {
        // Get consultant ID and period from record
        const consultant = record.consultant || {};
        const consultantId = consultant.id;
        const periode = record.période || "";

        // Get CRA status from API
        const craStatus = getCraStatus(consultantId, periode);

        return (
          <Space size="middle">
            {craStatus === CRA_STATUS.EN_ATTENTE_CLIENT && (
              <>
                <Button
                  type="primary"
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setSelectedCra(record);
                    Modal.confirm({
                      title: "Validation du CRA",
                      content: (
                        <div>
                          <p>
                            Êtes-vous sûr de vouloir valider cette imputation ?
                          </p>
                          {/* <Input.TextArea
                            placeholder="Ajouter un commentaire (optionnel)"
                            rows={4}
                            value={validationNote}
                            onChange={(e) => setValidationNote(e.target.value)}
                          /> */}
                        </div>
                      ),
                      okText: "Valider",
                      cancelText: "Annuler",
                      onOk: () => handleValidation(true),
                    });
                  }}
                >
                  Valider
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setSelectedCra(record);
                    Modal.confirm({
                      title: "Refuser le CRA",
                      content: (
                        <div>
                          <p>Êtes-vous sûr de vouloir refuser ce CRA ?</p>
                          <p>
                            Le CRA sera renvoyé au prestataire pour
                            modification.
                          </p>
                          <Input.TextArea
                            placeholder="Veuillez indiquer la raison du refus"
                            rows={4}
                            value={validationNote}
                            onChange={(e) => setValidationNote(e.target.value)}
                            required
                          />
                        </div>
                      ),
                      okText: "Refuser",
                      cancelText: "Annuler",
                      okButtonProps: { danger: true },
                      onOk: () => {
                        if (!validationNote.trim()) {
                          message.error("Veuillez indiquer la raison du refus");
                          return Promise.reject();
                        }
                        return handleValidation(false);
                      },
                    });
                  }}
                >
                  Refuser
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // Function to render CRA details in the modal
  const renderCraDetails = () => {
    if (!selectedCra) return <Empty description="Aucune donnée disponible" />;

    const consultant = selectedCra.consultant || {};
    const project = selectedCra.project || {};
    const bdc = selectedCra.bdc || {};
    const candidature = selectedCra.candidature || {};
    const esn = consultant.esn || {};

    const periode = selectedCra.période || "";
    const jour = selectedCra.jour || "1";
    const [month, year] = periode.split("_");
    const craDate =
      month && year
        ? moment(`${year}-${month}-${jour}`).format("DD/MM/YYYY")
        : "-";

    return (
      <div className="cra-details">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Détails de l'imputation" bordered={false}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Date:</Text> {craDate}
                </Col>
                <Col span={12}>
                  <Text strong>Durée:</Text> {selectedCra.Durée || "0"} jour(s)
                </Col>
                <Col span={12}>
                  <Text strong>Type:</Text> {selectedCra.type || "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Statut:</Text> {selectedCra.statut || "-"}
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Informations Consultant" bordered={false}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Nom:</Text> {consultant.nom || "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Prénom:</Text> {consultant.prenom || "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Email:</Text> {consultant.email || "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Poste:</Text> {consultant.poste || "-"}
                </Col>
                <Col span={24}>
                  <Text strong>ESN:</Text> {esn.name || "-"}
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Projet et Bon de Commande" bordered={false}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong>Projet:</Text> {project.titre || "-"}
                </Col>
                <Col span={24}>
                  <Text strong>Description:</Text> {project.description || "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Date début:</Text>{" "}
                  {project.date_debut
                    ? moment(project.date_debut).format("DD/MM/YYYY")
                    : "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Date fin:</Text>{" "}
                  {project.date_limite
                    ? moment(project.date_limite).format("DD/MM/YYYY")
                    : "-"}
                </Col>
                <Col span={12}>
                  <Text strong>BDC N°:</Text> {bdc.numero || "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Montant BDC:</Text>{" "}
                  {bdc.montant ? `${bdc.montant} €` : "-"}
                </Col>
                <Col span={12}>
                  <Text strong>Statut BDC:</Text> {bdc.statut || "-"}
                </Col>                <Col span={12}>
                  <Text strong>TJM:</Text>{" "}
                  {candidature.tjm ? (
                    <span>
                      <Tag color="purple">{candidature.tjm} €</Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        (depuis candidature)
                      </Text>
                    </span>
                  ) : (
                    <span>
                      <Text>-</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {" "}(sera récupéré depuis BDC)
                      </Text>
                    </span>
                  )}
                </Col>
              </Row>
            </Card>
          </Col>

          {selectedCra.commentaire && (
            <Col span={24}>
              <Card title="Commentaires" bordered={false}>
                <p>{selectedCra.commentaire}</p>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    );
  };

  return (
    <div className="client-cra-validation-container">
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={24} xl={24} style={{ marginBottom: 8 }}>
            <Input
              placeholder="Rechercher un consultant, projet, ESN..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrer par consultant"
              style={{ width: "100%" }}
              value={selectedConsultant}
              onChange={setSelectedConsultant}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {consultants.map((consultant) => (
                <Option key={consultant.id} value={consultant.id}>
                  {consultant.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrer par ESN"
              style={{ width: "100%" }}
              value={selectedEsn}
              onChange={setSelectedEsn}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {esns.map((esn) => (
                <Option key={esn.id} value={esn.id}>
                  {esn.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrer par période"
              style={{ width: "100%" }}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              allowClear
            >
              {periods.map((period) => (
                <Option key={period.value} value={period.value}>
                  {period.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrer par projet"
              style={{ width: "100%" }}
              value={selectedProject}
              onChange={setSelectedProject}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name.length > 30
                    ? `${project.name.substring(0, 30)}...`
                    : project.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredCraList.map((item) => ({
            ...item,
            key: item.id_imputation,
          }))}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: loading
              ? "Chargement..."
              : "Aucune imputation à valider",
          }}
        />
      </Card>

      <Modal
        title="Détails de l'Imputation"
        open={craDetailVisible}
        onCancel={() => setCraDetailVisible(false)}
        width={800}
        footer={
          selectedCra && selectedCra.statut === CRA_STATUS.EN_ATTENTE_CLIENT
            ? [
                <Button key="back" onClick={() => setCraDetailVisible(false)}>
                  Fermer
                </Button>,
                <Button
                  key="reject"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: "Refuser le CRA",
                      content: (
                        <div>
                          <p>Êtes-vous sûr de vouloir refuser ce CRA ?</p>
                          <p>
                            Le CRA sera renvoyé au prestataire pour
                            modification.
                          </p>
                          <Input.TextArea
                            placeholder="Veuillez indiquer la raison du refus"
                            rows={4}
                            value={validationNote}
                            onChange={(e) => setValidationNote(e.target.value)}
                            required
                          />
                        </div>
                      ),
                      okText: "Refuser",
                      cancelText: "Annuler",
                      okButtonProps: { danger: true },
                      onOk: () => {
                        if (!validationNote.trim()) {
                          message.error("Veuillez indiquer la raison du refus");
                          return Promise.reject();
                        }
                        return handleValidation(false);
                      },
                    });
                  }}
                >
                  Refuser
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: "Validation du CRA",
                      content: (
                        <div>
                          <p>
                            Êtes-vous sûr de vouloir valider cette imputation ?
                          </p>
                        </div>
                      ),
                      okText: "Valider",
                      cancelText: "Annuler",
                      onOk: () => handleValidation(true),
                    });
                  }}
                >
                  Valider
                </Button>,
              ]
            : [
                <Button key="back" onClick={() => setCraDetailVisible(false)}>
                  Fermer
                </Button>,
              ]
        }
      >
        {loading ? <Spin size="large" /> : renderCraDetails()}
      </Modal>

      <style jsx="true">{`
        .client-cra-validation-container {
          padding: 0;
        }

        .cra-details .ant-card {
          margin-bottom: 16px;
        }

        .cra-details .ant-card-head {
          background-color: #f5f5f5;
        }

        .cra-details .ant-row {
          margin-bottom: 8px;
        }

        .ant-select-selection-placeholder,
        .ant-select-selection-item {
          text-overflow: ellipsis;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ClientCraValidation;
