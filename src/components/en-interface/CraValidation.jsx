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
  Tabs,
  Row,
  Col,
  Typography,
  DatePicker,
  Input,
  Select,
  Spin,
  Form,
  Drawer,
  List,
  Avatar,
  Empty,
  Checkbox,
  Divider,
  Alert,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  HistoryOutlined,
  FileTextOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/fr";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import CraDetailsView from "./CraDetailsView";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// CRA status constants
const CRA_STATUS = {
  A_SAISIR: "À saisir",
  EN_ATTENTE_PRESTATAIRE: "En attente validation prestataire",
  EN_ATTENTE_CLIENT: "En attente validation client",
  VALIDE: "Validé",
};

const CraValidation = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [craList, setCraList] = useState([]);
  const [filteredCraList, setFilteredCraList] = useState([]);
  const [viewType, setViewType] = useState("pending"); // pending, history
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [craDetailVisible, setCraDetailVisible] = useState(false);
  const [selectedCra, setSelectedCra] = useState(null);
  const [selectedCraData, setSelectedCraData] = useState({});
  const [validationNote, setValidationNote] = useState("");
  // New filter states
  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showInfoNote, setShowInfoNote] = useState(true);

  // Fetch CRA data when component mounts
  useEffect(() => {
    fetchCraList();
  }, [viewType]); // Filter CRA list based on search text and date range
  useEffect(() => {
    filterCraList();
  }, [
    searchText,
    dateRange,
    craList,
    selectedClient,
    selectedConsultant,
    selectedPeriod,
    selectedProject,
  ]);
  // Fetch CRA list from API
  const fetchCraList = async () => {
    setLoading(true); // Reset filters, but keep the default status filter
    setSearchText("");
    setDateRange([null, null]);
    setSelectedClient(null);
    setSelectedConsultant(null);
    setSelectedPeriod(null);
    setSelectedProject(null);

    try {
      const esnId = localStorage.getItem("id");
      const token = localStorage.getItem("token");

      if (!esnId || !token) {
        message.error("Information de connexion non trouvée");
        setLoading(false);
        return;
      }

      // Get current period in MM_YYYY format
      const currentPeriod = moment().format("MM_YYYY");

      // Use the new API endpoint for ESN CRAs with period
      const response = await axios.get(`${Endponit()}/api/cra-by-esn-period/`, {
        params: {
          esn_id: esnId,
          period: currentPeriod,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.status) {
        // Process data from the new API format
        const craData = response.data.data || [];
        console.log("CRA data fetched:", craData.length, "entries");

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

        // Extract unique clients, consultants, and periods
        const uniqueClients = [
          ...new Set(
            craData
              .map((cra) => {
                const client = cra.client || {};
                return client.id
                  ? {
                      id: client.id,
                      name: client.raison_sociale || "Client sans nom",
                    }
                  : null;
              })
              .filter(Boolean)
              .map(JSON.stringify)
          ),
        ].map(JSON.parse);

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
        ].map(JSON.parse); // Extract unique statuses
        const uniqueStatuses = [
          ...new Set(
            craData
              .map((cra) => {
                const status = cra.statut || "";
                return status
                  ? {
                      value: status,
                      label: status,
                    }
                  : null;
              })
              .filter(Boolean)
              .map(JSON.stringify)
          ),
        ].map(JSON.parse); // Extract unique projects
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

        setClients(uniqueClients);
        setConsultants(uniqueConsultants);
        setPeriods(uniquePeriods);
        setStatuses(uniqueStatuses);
        setProjects(uniqueProjects);
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la récupération des CRAs"
        );
      }
    } catch (error) {
      console.error("Error fetching CRA validation list:", error);
      message.error("Impossible de charger la liste des CRAs à valider");
      setCraList([]);
      setFilteredCraList([]);
    } finally {
      setLoading(false);
    }
  };
  // Filter CRA list based on search text and date range
  const filterCraList = () => {
    if (!craList || craList.length === 0) {
      setFilteredCraList([]);
      return;
    }
    let filtered = [...craList]; // Always filter for "En attente validation prestataire" status
    filtered = filtered.filter((cra) => {
      return cra.statut === CRA_STATUS.EN_ATTENTE_PRESTATAIRE;
    });

    // Filter by search text
    if (searchText) {
      const searchTextLower = searchText.toLowerCase();
      filtered = filtered.filter((cra) => {
        const consultant = cra.consultant || {};
        const consultantName = `${consultant.prenom || ""} ${
          consultant.nom || ""
        }`.toLowerCase();
        const client = cra.client || {};
        const clientName = (client.raison_sociale || "").toLowerCase();
        const project = cra.project || {};
        const projectName = (project.titre || "").toLowerCase();

        return (
          consultantName.includes(searchTextLower) ||
          clientName.includes(searchTextLower) ||
          projectName.includes(searchTextLower) ||
          (cra.période || "").toLowerCase().includes(searchTextLower)
        );
      });
    }

    // Filter by client
    if (selectedClient) {
      filtered = filtered.filter((cra) => {
        const client = cra.client || {};
        return client.id === selectedClient;
      });
    }

    // Filter by consultant
    if (selectedConsultant) {
      filtered = filtered.filter((cra) => {
        const consultant = cra.consultant || {};
        return consultant.id === selectedConsultant;
      });
    } // Filter by period
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
    // No need for status filter here as we already filtered for EN_ATTENTE_PRESTATAIRE above    // Filter by date range
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
      // Convert period (MM_YYYY) and day to a date object for comparison
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
  const viewCraDetails = async (cra) => {
    setLoading(true);

    // Ensure the CRA has complete ID information before setting it
    const craId = cra.id_imputation || cra.id || cra.key;
    const enhancedCra = {
      ...cra,
      id: craId,
      id_imputation: craId,
      key: craId,
    };

    setSelectedCra(enhancedCra);

    // With the new API format, we already have all the data we need
    // in the cra object, so we can just set the selected CRA data
    setSelectedCraData(enhancedCra);
    setCraDetailVisible(true);
    setLoading(false);
  }; // Handle CRA validation
  const handleValidation = async (approved, craToValidate = null) => {
    setLoading(true);
    try {
      const esnId = localStorage.getItem("id");
      // Use either the passed CRA record or the selectedCra from state
      const recordToUse = craToValidate || selectedCra;

      if (!esnId || !recordToUse) {
        message.error("Information de connexion ou de CRA non trouvée");
        return;
      } // Create a promise that resolves with the CRA record to make sure we have the most up-to-date version
      const getResolvedCra = () =>
        new Promise((resolve) => {
          // Check if we already have a valid ID before proceeding
          if (recordToUse.id_imputation || recordToUse.id) {
            console.log(
              "Already have valid ID:",
              recordToUse.id_imputation || recordToUse.id
            );
            resolve(recordToUse);
            return;
          }

          // Attempt to get the ID again by looking at the craList
          console.log("Attempting to find CRA ID in list...");
          setTimeout(() => resolve(recordToUse), 100); // Small delay to ensure state is updated
        });

      // Wait for the CRA record to be fully resolved
      const resolvedCra = await getResolvedCra();
      console.log("Resolved CRA for validation:", resolvedCra);

      // Primary approach: Use the ID directly from the record
      let craId = resolvedCra.id_imputation || resolvedCra.id;

      // Backup approach 1: Search by matching fields in the craList
      if (!craId) {
        console.log(
          "No direct ID found, searching in craList by full match..."
        );

        const matchingCra = craList.find(
          (cra) =>
            cra.période === resolvedCra.période &&
            cra.jour === resolvedCra.jour &&
            (cra.consultant?.id === resolvedCra.consultant?.id ||
              cra.id_consultan === resolvedCra.id_consultan)
        );

        if (matchingCra) {
          console.log("Found exact matching CRA in list:", matchingCra);
          craId = matchingCra.id_imputation || matchingCra.id;
        }
      }

      // Backup approach 2: Use the key field which might contain the ID
      if (!craId && resolvedCra.key) {
        console.log("Using key as ID fallback:", resolvedCra.key);
        craId = resolvedCra.key;
      }

      // Backup approach 3: Look for any record with the same period and day
      if (!craId) {
        console.log(
          "No exact match found. Searching by period and day only..."
        );

        const periodDayMatch = craList.find(
          (cra) =>
            cra.période === resolvedCra.période && cra.jour === resolvedCra.jour
        );

        if (periodDayMatch) {
          console.log("Found period/day match:", periodDayMatch);
          craId = periodDayMatch.id_imputation || periodDayMatch.id;
        }
      }

      if (!craId) {
        message.error("ID d'imputation CRA non trouvé");
        console.error("Missing CRA ID - Data available:", resolvedCra);
        setLoading(false);
        return;
      }

      console.log("Validating CRA with ID:", craId);

      // Prepare the data for the PUT request with the new structure
      const updatedCraData = {
        période: resolvedCra.période,
        jour: resolvedCra.jour || 1,
        Durée: resolvedCra.Durée || "0",
        type: resolvedCra.type || "travail",
        id_consultan: resolvedCra.id_consultan || resolvedCra.consultant?.id,
        id_esn: parseInt(esnId),
        id_client: resolvedCra.id_client || resolvedCra.client?.id,
        id_bdc: resolvedCra.id_bdc || resolvedCra.project?.id,
        statut: approved ? CRA_STATUS.EN_ATTENTE_CLIENT : CRA_STATUS.A_SAISIR,
        commentaire: validationNote,
      };

      // Send validation using PUT method to the /<id>/ endpoint
      const token = localStorage.getItem("token");

      // Final safety check before API call
      if (!craId) {
        throw new Error("ID d'imputation CRA manquant même après vérification");
      }

      console.log(
        `Sending API request to endpoint: ${Endponit()}/api/cra_imputation/${craId}/`
      );
      console.log("Request payload:", updatedCraData);

      const response = await axios.put(
        `${Endponit()}/api/cra_imputation/${craId}/`,
        updatedCraData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.status) {
        // Store the CRA ID that was just validated in localStorage to track it across reloads
        try {
          const validatedCraIds = JSON.parse(
            localStorage.getItem("validatedCraIds") || "[]"
          );
          validatedCraIds.push(craId);
          localStorage.setItem(
            "validatedCraIds",
            JSON.stringify(validatedCraIds)
          );
        } catch (e) {
          console.error("Could not save validated CRA ID to localStorage", e);
        }

        message.success(
          approved
            ? "Imputation CRA validée avec succès"
            : "Imputation CRA refusée et renvoyée au consultant pour modifications"
        );
        setCraDetailVisible(false);
        setSelectedCra(null);
        setValidationNote("");
        // Refresh the CRA list
        fetchCraList();
      } else {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la validation de l'imputation CRA"
        );
      }
    } catch (error) {
      console.error("Error validating CRA:", error);

      // If we have an ID error but we have the period, day, and consultant info,
      // we can try a different approach: create a new imputation record with POST
      if (
        (error.message && error.message.includes("ID")) ||
        (error.response && error.response.status === 404)
      ) {
        // Only attempt this if we have the minimal required data
        if (
          resolvedCra &&
          resolvedCra.période &&
          (resolvedCra.consultant || resolvedCra.id_consultan)
        ) {
          try {
            console.log("Attempting direct validation with available data...");

            const esnId = localStorage.getItem("id");
            const token = localStorage.getItem("token");

            // Create a new imputation record instead of updating an existing one
            const directValidationData = {
              période: resolvedCra.période,
              jour: resolvedCra.jour || 1,
              Durée: resolvedCra.Durée || "0",
              type: resolvedCra.type || "travail",
              id_consultan:
                resolvedCra.id_consultan || resolvedCra.consultant?.id,
              id_esn: parseInt(esnId),
              id_client: resolvedCra.id_client || resolvedCra.client?.id,
              id_bdc: resolvedCra.id_bdc || resolvedCra.project?.id,
              statut: approved
                ? CRA_STATUS.EN_ATTENTE_CLIENT
                : CRA_STATUS.A_SAISIR,
              commentaire: validationNote,
            };

            // Try a POST request to create/update in one step
            console.log(
              "Sending direct validation with data:",
              directValidationData
            );
            const directResponse = await axios.post(
              `${Endponit()}/api/cra_imputation/`,
              directValidationData,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (directResponse.data?.status) {
              message.success(
                approved
                  ? "Imputation CRA validée avec succès (méthode alternative)"
                  : "Imputation CRA refusée (méthode alternative)"
              );
              setCraDetailVisible(false);
              setSelectedCra(null);
              setValidationNote("");
              // Refresh the CRA list
              fetchCraList();
              return; // Exit the error handler successfully
            }
          } catch (directError) {
            console.error("Direct validation also failed:", directError);
          }
        }

        message.error(
          "Erreur d'identification du CRA. Veuillez rafraîchir la page et réessayer."
        );
      } else if (error.response && error.response.status === 404) {
        message.error(
          "CRA non trouvé sur le serveur. Veuillez rafraîchir la page et réessayer."
        );
      } else {
        message.error(
          "Impossible de valider l'imputation CRA. Erreur: " +
            (error.message || "Inconnue")
        );
      }
      // Log all available data for debugging
      console.log("CRA validation failed. Context:", {
        resolvedCra,
        craList: craList.length > 0 ? `${craList.length} items` : "empty",
        error: error.message || error,
      });
    } finally {
      setLoading(false);
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
      title: "Consultants",
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
      title: "Période",
      dataIndex: "période",
      key: "period",
      render: (text) => formatPeriod(text),
      sorter: (a, b) => {
        const [monthA, yearA] = (a.période || "").split("_");
        const [monthB, yearB] = (b.période || "").split("_");
        return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
      },
    },
    {
      title: "Clients",
      key: "client_name",
      render: (record) => {
        const client = record.client || {};
        return client.raison_sociale || "-";
      },
      sorter: (a, b) => {
        const clientA = a.client || {};
        const clientB = b.client || {};
        return (clientA.raison_sociale || "").localeCompare(
          clientB.raison_sociale || ""
        );
      },
    },
    {
      title: "Projets",
      key: "project_name",
      render: (record) => {
        const project = record.project || {};
        return project.titre || "-";
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
        const status = record.statut || "";
        let color = "default";
        let displayStatus = status;

        if (status === CRA_STATUS.VALIDE) {
          color = "green";
        } else if (status === CRA_STATUS.EN_ATTENTE_CLIENT) {
          color = "orange";
        } else if (status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE) {
          color = "blue";
          displayStatus = "À valider"; // Change display text only
        } else if (status === CRA_STATUS.A_SAISIR) {
          color = "red";
        }

        return <Tag color={color}>{displayStatus || "Non défini"}</Tag>;
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
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => viewCraDetails(record)}
          >
            Voir
          </Button> */}
          {record.statut !== CRA_STATUS.VALIDE && (
            <>
              <Button
                type="primary"
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                icon={<CheckOutlined />}
                onClick={() => {
                  // Ensure the record has all necessary ID fields before setting it
                  const enhancedRecord = {
                    ...record,
                    id: record.id || record.id_imputation || record.key,
                    id_imputation:
                      record.id_imputation || record.id || record.key,
                    key: record.key || record.id_imputation || record.id,
                  };

                  console.log("Validating record:", {
                    id: enhancedRecord.id,
                    id_imputation: enhancedRecord.id_imputation,
                    key: enhancedRecord.key,
                  });

                  // Set the enhanced record with all ID fields populated
                  setSelectedCra(enhancedRecord);

                  // Store a local reference to the record for validation
                  const craToValidate = enhancedRecord;

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
                    onOk: () => {
                      // Pass the craToValidate directly to handleValidation
                      return handleValidation(true, craToValidate);
                    },
                  });
                }}
              >
                Valider
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  // Ensure the record has all necessary ID fields before setting it
                  const enhancedRecord = {
                    ...record,
                    id: record.id || record.id_imputation || record.key,
                    id_imputation:
                      record.id_imputation || record.id || record.key,
                    key: record.key || record.id_imputation || record.id,
                  };

                  console.log("Rejecting record:", {
                    id: enhancedRecord.id,
                    id_imputation: enhancedRecord.id_imputation,
                    key: enhancedRecord.key,
                  });

                  // Set the enhanced record with all ID fields populated
                  setSelectedCra(enhancedRecord);

                  // Store a local reference to the record for validation
                  const craToReject = enhancedRecord;

                  Modal.confirm({
                    title: "Refuser le CRA",
                    content: (
                      <div>
                        <p>Êtes-vous sûr de vouloir refuser ce CRA ?</p>
                        <p>
                          Le CRA sera renvoyé au consultant pour modification.
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
      ),
    },
  ];
  // Function to render CRA details in the drawer
  const renderCraDetails = () => {
    if (!selectedCra) return <Empty description="Aucune donnée disponible" />;
    return <CraDetailsView craEntry={selectedCra} />;
  };
  return (
    <div className="cra-validation-container">
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={24} xl={24} style={{ marginBottom: 8 }}>
            <Input
              placeholder="Recherche générale..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Filtrer par client"
              style={{ width: "100%" }}
              value={selectedClient}
              onChange={setSelectedClient}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {clients.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
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
              ))}{" "}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
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
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Filtrer par projet"
              style={{ width: "100%" }}
              value={selectedProject}
              onChange={(value) => setSelectedProject(value)}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {" "}
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name.length > 30
                    ? `${project.name.substring(0, 30)}...`
                    : project.name}
                </Option>
              ))}{" "}
            </Select>
          </Col>{" "}
        </Row>

        {showInfoNote && (
          <Alert
            message="Note: Seulement les imputations jusqu'à aujourd'hui sont affichées."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setShowInfoNote(false)}
          />
        )}

        <Table
          columns={columns}
          dataSource={filteredCraList.map((item, index) => {
            // Generate a guaranteed unique ID for this item if none exists
            let craId = item.id_imputation || item.id || item.key;

            // If we still don't have an ID, create one using periode, jour, and consultant info
            if (!craId) {
              const periode = item.période || "";
              const jour = item.jour || "";
              const consultantId =
                item.consultant?.id || item.id_consultan || "";

              // Create a unique ID from item properties
              craId = `cra_${periode}_${jour}_${consultantId || index}`;
              console.log(`Generated synthetic ID for CRA: ${craId}`);
            }

            // Return item with all ID fields populated
            return {
              ...item,
              id: craId,
              id_imputation: craId,
              key: craId,
            };
          })}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </Card>{" "}
      <Drawer
        title={`Détails de l'Imputation CRA`}
        placement="right"
        width={800}
        onClose={() => setCraDetailVisible(false)}
        open={craDetailVisible}
        extra={
          selectedCra &&
          selectedCra.statut !== CRA_STATUS.VALIDE && (
            <Space>
              <Button
                type="primary"
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                icon={<CheckOutlined />}
                onClick={() => {
                  console.log("Drawer validate - selectedCra:", {
                    id: selectedCra?.id,
                    id_imputation: selectedCra?.id_imputation,
                    key: selectedCra?.key,
                  });

                  // Make sure all ID fields are populated in selectedCra before proceeding
                  if (selectedCra) {
                    const enhancedCra = {
                      ...selectedCra,
                      id:
                        selectedCra.id ||
                        selectedCra.id_imputation ||
                        selectedCra.key,
                      id_imputation:
                        selectedCra.id_imputation ||
                        selectedCra.id ||
                        selectedCra.key,
                      key:
                        selectedCra.key ||
                        selectedCra.id_imputation ||
                        selectedCra.id,
                    };
                    setSelectedCra(enhancedCra);
                  }

                  Modal.confirm({
                    title: "Validation de l'Imputation",
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
              </Button>{" "}
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  console.log("Drawer reject - selectedCra:", {
                    id: selectedCra?.id,
                    id_imputation: selectedCra?.id_imputation,
                    key: selectedCra?.key,
                  });

                  // Make sure all ID fields are populated in selectedCra before proceeding
                  if (selectedCra) {
                    const enhancedCra = {
                      ...selectedCra,
                      id:
                        selectedCra.id ||
                        selectedCra.id_imputation ||
                        selectedCra.key,
                      id_imputation:
                        selectedCra.id_imputation ||
                        selectedCra.id ||
                        selectedCra.key,
                      key:
                        selectedCra.key ||
                        selectedCra.id_imputation ||
                        selectedCra.id,
                    };
                    setSelectedCra(enhancedCra);
                  }

                  Modal.confirm({
                    title: "Refuser le CRA",
                    content: (
                      <div>
                        <p>Êtes-vous sûr de vouloir refuser ce CRA ?</p>
                        <p>
                          Le CRA sera renvoyé au consultant pour modification.
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
            </Space>
          )
        }
      >
        {loading ? <Spin size="large" /> : renderCraDetails()}{" "}
      </Drawer>
      <style jsx="true">{`
        .cra-validation-container {
          padding: 0;
        }

        .info-item {
          margin-bottom: 8px;
        }

        .weekend-row {
          background-color: #f0f0f0;
        }

        .holiday-row {
          background-color: #fffbe6;
        }

        .cra-validation-tabs {
          margin-bottom: 16px;
        }

        .ant-select-selection-placeholder,
        .ant-select-selection-item {
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .ant-row {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default CraValidation;
