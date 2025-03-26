import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Table,
  Button,
  Modal,
  message,
  Tag,
  Typography,
  Space,
  Tooltip,
  Descriptions,
  Alert,
  Form,
  DatePicker,
  Select,
  Divider,
  notification,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FileAddOutlined,
  DollarOutlined,
  PlusOutlined,
  UserOutlined,
  EuroOutlined,
  CalendarOutlined,
  LinkedinOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Endponit } from "../../helper/enpoint";
import moment from "moment";

const { Text } = Typography;
const { confirm } = Modal;
const { TextArea } = Input;

const OrderInterface = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isContractReviewModalVisible, setIsContractReviewModalVisible] =
    useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(null);
  const [form] = Form.useForm();
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [projects, SetProjects] = useState([]);
  const [bdcNumber, setBdcNumber] = useState("");
  const [tjm, setTjm] = useState(0);
  const [description, setdescription] = useState(0);
  const [jours, setJours] = useState(0);
  const [collaboratorInfo, setCollaboratorInfo] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [recordToEdit, setRecordToEdit] = useState(null);

  const generateBDCNumber = () => {
    return `BDC-${Date.now()}`;
  };

  const fetchCollaboratorInfo = async (candidatureId) => {
    try {
      const response = await axios.get(
        `${Endponit()}/api/get_collaborateur_by_id/${candidatureId}`
      );
      setCollaboratorInfo(response.data.data);

      // Update description field with collaborator info
      const description = `${response.data.data.Poste} - ${
        response.data.data.Nom
      } ${response.data.data.Prenom}
Experience professionnelle: ${moment().diff(
        moment(response.data.data.date_debut_activ),
        "years"
      )} ans
Mobilité: ${response.data.data.Mobilité}
Disponibilité: ${moment(response.data.data.Disponibilité).format(
        "DD/MM/YYYY"
      )}`;

      form.setFieldValue("description", description);
      setdescription(description);

      // Show collaborator info notification
      notification.info({
        message: "Informations du Collaborateur",
        description: (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <UserOutlined className="text-blue-500" />
              <span>{`${response.data.data.Nom} ${response.data.data.Prenom}`}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CalendarOutlined className="text-green-500" />
              <span>
                Né(e) le{" "}
                {moment(response.data.data.Date_naissance).format("DD/MM/YYYY")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <EnvironmentOutlined className="text-red-500" />
              <span>Mobilité: {response.data.data.Mobilité}</span>
            </div>
            {response.data.data.LinkedIN && (
              <div className="flex items-center space-x-2">
                <LinkedinOutlined className="text-blue-600" />
                <a
                  href={response.data.data.LinkedIN}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Profil LinkedIn
                </a>
              </div>
            )}
          </div>
        ),
        duration: 0,
        placement: "topRight",
        className: "custom-notification",
      });
    } catch (error) {
      message.error(
        "Erreur lors de la récupération des informations du collaborateur"
      );
    }
  };

  useEffect(() => {
    if (!bdcNumber) {
      console.log("Generating BDC number");
      setBdcNumber(generateBDCNumber());
    }
  }, []);

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      const response = await axios.get(
        `${Endponit()}/api/get_candidatures_by_client/?client_id=${clientId}`
      );
      const selectedCandidates = response.data.data.filter(
        (candidate) => candidate.statut === "Accepté"
      );
      setCandidates(selectedCandidates);
    } catch (error) {
      message.error("Échec de la récupération des candidatures");
    } finally {
      setCandidatesLoading(false);
    }
  };

  const fetchProjects = async () => {
    setCandidatesLoading(true);
    try {
      const response = await axios.get(`${Endponit()}/api/appelOffre`);
      SetProjects(response.data.data);
    } catch (error) {
      message.error("Échec de la récupération des appel Offre");
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchCandidates();
    fetchProjects();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const esnId = localStorage.getItem("id");
      if (!esnId) {
        message.error("ID ESN non trouvé dans le stockage local");
        return;
      }
      const response = await axios.get(
        `${Endponit()}/api/get_bon_de_commande_by_client/?client_id=${esnId}`
      );
      setPurchaseOrders(response.data.data);
    } catch (error) {

      message.error("Échec de la récupération des bons de commande");
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = async (candidateId) => {
    const selectedCandidate = candidates.find((c) => c.id_cd === candidateId);
    const project = projects.find((p) => p.id === selectedCandidate.AO_id);

    if (selectedCandidate) {
      const tjmValue = Number(selectedCandidate.tjm.replace("€", "").trim());
      form.setFieldValue("tjm", tjmValue);
      form.setFieldValue("jours", project.jours);
      form.setFieldValue("montant_total", tjmValue * project.jours);
      setJours(project.jours);

      await fetchCollaboratorInfo(selectedCandidate.id_consultant);
    }
  };

  const [dates, setDates] = useState({
    date_debut: null,
    date_fin: null,
  });

  const handleCreateContract = async () => {
    try {
      const formattedValues = {
        candidature_id: selectedPO?.candidature_id,
        date_signature: format(new Date(), "yyyy-MM-dd"),
        date_debut: dates.date_debut?.format("YYYY-MM-DD"),
        date_fin: dates.date_fin?.format("YYYY-MM-DD"),
        statut: "active",
        montant: selectedPO?.montant_total,
        numero_contrat: `CONTRAT_${selectedPO?.numero_bdc}`,
      };

      const response = await axios.post(
        `${Endponit()}/api/Contrat/`,
        formattedValues
      );

      if (response.data && response.data.id_contrat) {
        const clientId = localStorage.getItem("id");
        // const response = await axios.post(
        //   `${Endponit()}/api/Contrat/`,
        //   formattedValues
        // );

        await axios.put(`${Endponit()}/api/Bondecommande/`, {
          ...selectedPO,
          has_contract: response.data.id_contrat,
        });

        await axios.post(`${Endponit()}/api/notify_signature_contrat/`, {
          client_id: clientId,
          esn_id: response.data.esn_id,
          contrat_id: response.data.id_contrat,
        });

        message.success("Contrat créé avec succès");
        setIsContractReviewModalVisible(false);
        fetchPurchaseOrders();
      }
    } catch (error) {
      message.error("Échec de la création du contrat");
    }
  };

  const downloadContract = async (contractId) => {
    setDownloadLoading((prev) => ({
      ...prev,
      [`contract_${contractId}`]: true,
    }));

    try {
      const response = await axios.get(
        `${Endponit()}/api/download_contract/${contractId}`,
        { responseType: "json" } // Changed to json
      );

      const contractData = response.data.data;
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRAT DE PRESTATION DE SERVICES", 105, 20, {
        align: "center",
      });

      // Contract number and date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`N° ${contractData.numero_contrat}`, 20, 40);
      doc.text(`Date: ${contractData.date_signature}`, 150, 40);

      // Parties
      doc.setFont("helvetica", "bold");
      doc.text("ENTRE LES SOUSSIGNÉS:", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.text(
        [
          "La société " + contractData.esn,
          "Ci-après dénommée « Le Prestataire »",
          "",
          "ET",
          "",
          "La société " + contractData.client,
          "Ci-après dénommée « Le Client »",
        ],
        20,
        70
      );

      // Contract details
      doc.setFont("helvetica", "bold");
      doc.text("IL A ÉTÉ CONVENU CE QUI SUIT:", 20, 120);
      doc.setFont("helvetica", "normal");
      doc.text(
        [
          "Article 1 - Durée du contrat",
          `Date de début: ${contractData.date_debut}`,
          `Date de fin: ${contractData.date_fin}`,
          "",
          "Article 2 - Conditions financières",
          `Montant total de la prestation: ${contractData.montant} €`,
          "",
          "Article 3 - Conditions particulières",
          contractData.conditions,
        ],
        20,
        130
      );

      // Signatures
      doc.setFont("helvetica", "bold");
      doc.text("SIGNATURES DES PARTIES", 105, 220, { align: "center" });
      doc.setFont("helvetica", "normal");

      // Left signature block
      doc.text("Pour le Prestataire", 50, 240, { align: "center" });
      doc.rect(20, 250, 70, 30);
      doc.text("Nom et qualité du signataire:", 20, 290);
      doc.text("Date:", 20, 300);

      // Right signature block
      doc.text("Pour le Client", 160, 240, { align: "center" });
      doc.rect(130, 250, 70, 30);
      doc.text("Nom et qualité du signataire:", 130, 290);
      doc.text("Date:", 130, 300);

      // Footer
      doc.setFontSize(8);
      doc.text(`Page 1/1`, 105, 290, { align: "center" });
      doc.save(`Contract_${contractId}.pdf`);
      message.success("Contrat téléchargé avec succès");
    } catch (error) {
      console.error("Download error:", error);
      message.error("Échec du téléchargement du contrat");
    } finally {
      setDownloadLoading((prev) => ({
        ...prev,
        [`contract_${contractId}`]: false,
      }));
    }
  };
  // Status Helpers
  const getStatusLabel = (status) => {
    const statusMap = {
      pending_client: "En attente",
      accepted_esn: "Soumis",
      rejected_esn: "Refusé",
      pending_esn: "EN attente ESN",
    };
    return statusMap[status] || status;
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending_client: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En cours",
      },
      pending_admin: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En attente de validation par l'Administrateur.",
      },
      pending_esn: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En attente de validation par l'ESN.",
      },
      accepted_esn: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Soumis",
      },
      rejected_esn: {
        color: "error",
        icon: <CloseCircleOutlined />,
        text: "Refusé",
      },
    };
    const config = statusConfig[status] || statusConfig["pending_client"];

    return (
      <Tag icon={config.icon} color={config.color}>
        {config.text}
      </Tag>
    );
  };

  const handleAccept = async (id, bdc) => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/${id}`, {
        ...bdc,
        statut: "pending_admin",
        numero_bdc : bdcNumber
      });
      message.success("Bon de commande accepté avec succès");
      await fetchPurchaseOrders();
      setIsEditModalVisible(false);
    } catch (error) {
      message.error("Échec de l'acceptation du bon de commande");
    }
  };

  const handleReject = async (id, bdc) => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/${id}`, {
        ...bdc,
        statut: "rejected_esn",
      });
      message.success("Bon de commande refusé");
      await fetchPurchaseOrders();
    } catch (error) {
      message.error("Échec du refus du bon de commande");
    }
  };

  const showAcceptConfirm = (record) => {
    setRecordToEdit(record);
    editForm.setFieldsValue({
      description: record.description,
      montant_total: record.montant_total,
      tjm: record.TJM,
      jours: record.jours,
    });
    setIsEditModalVisible(true);
  };

  const showRejectConfirm = (record) => {
    confirm({
      title: "Refuser le bon de commande",
      icon: <CloseCircleOutlined className="text-red-500" />,
      content: `Êtes-vous sûr de vouloir refuser le bon de commande n°${record.numero_bdc} ?`,
      okText: "Refuser",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        handleReject(record.id_bdc, record);
      },
    });
  };

  const generatePDF = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Bon de Commande", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Numéro BDC: ${record.numero_bdc}`, 20, 40);
    doc.text(
      `Date de création: ${format(
        new Date(record.date_creation),
        "dd MMMM yyyy",
        {
          locale: fr,
        }
      )}`,
      20,
      50
    );
    doc.text(`Montant total: ${record.montant_total.toFixed(2)} €`, 20, 60);
    doc.text(`Statut: ${getStatusLabel(record.statut)}`, 20, 70);

    if (record.description) {
      doc.text("Description:", 20, 90);
      const splitDescription = doc.splitTextToSize(record.description, 170);
      doc.text(splitDescription, 20, 100);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    return doc;
  };

  const handleDownload = async (record) => {
    setDownloadLoading((prev) => ({ ...prev, [record.id_bdc]: true }));
    try {
      const doc = generatePDF(record);
      doc.save(`BDC_${record.numero_bdc}.pdf`);
      message.success("Bon de commande téléchargé avec succès");
    } catch (error) {
      message.error("Échec du téléchargement du bon de commande");
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [record.id_bdc]: false }));
    }
  };

  const purchaseOrderColumns = [
    {
      title: "Numéro BDC",
      dataIndex: "numero_bdc",
      key: "numero_bdc",
      render: (text) => (
        <Text strong className="text-blue-600">
          {text}
        </Text>
      ),
    },
    {
      title: "Date de création",
      dataIndex: "date_creation",
      key: "date_creation",
      render: (date) => format(new Date(date), "dd MMMM yyyy", { locale: fr }),
    },
    {
      title: "Montant",
      dataIndex: "montant_total",
      key: "montant_total",
      render: (amount) => (
        <Text strong className="text-green-600">
          {amount.toFixed(2)} €
        </Text>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Voir les détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setIsDetailsModalVisible(true);
              }}
            />
          </Tooltip>
          {/* <Tooltip title="Télécharger BDC PDF">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              loading={downloadLoading[record.id_bdc]}
            />
          </Tooltip> */}
          {record.statut === "pending_client" && (
            <>
              <Tooltip title="Accepter">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  className="bg-green-500"
                  onClick={() => showAcceptConfirm(record)}
                />
              </Tooltip>
              <Tooltip title="Refuser">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => showRejectConfirm(record)}
                />
              </Tooltip>
            </>
          )}
          {/* {record.statut === "accepted_esn" && !record.has_contract && (
            <Tooltip title="Créer un contrat">
              <Button
                type="primary"
                onClick={() => {
                  setSelectedPO(record);
                  setIsContractReviewModalVisible(true);
                }}
                icon={<FileAddOutlined />}
              >
                Créer un contrat
              </Button>
            </Tooltip>
          )} */}
          {/* {record.has_contract && (
            <Tooltip title="Télécharger le contrat">
              <Button
                icon={<DownloadOutlined />}
                onClick={() => downloadContract(record.has_contract)}
                loading={downloadLoading[`contract_${record.has_contract}`]}
              >
                Télécharger le contrat
              </Button>
            </Tooltip>
          )} */}
        </Space>
      ),
    },
  ];
  const handleSubmit = async (values) => {
    try {
      const clientId = localStorage.getItem("id");
      const formattedValues = {
        ...values,
        date_creation: format(new Date(), "yyyy-MM-dd"),
        client_id: clientId,
        date_debut: format(new Date(values.date_debut), "yyyy-MM-dd"),
        date_fin: format(new Date(values.date_fin), "yyyy-MM-dd"),
        numero_bdc: bdcNumber,
      };

      if (currentPurchaseOrder) {
        await axios.put(`${Endponit()}/api/Bondecommande/`, {
          ...formattedValues,
          id_bdc: currentPurchaseOrder.id_bdc,
        });
        message.success("Bon de commande mis à jour avec succès");
      } else {
        await axios.post(`${Endponit()}/api/Bondecommande/`, {
          ...formattedValues,
          statut: "pending_admin",
        });
        message.success("Nouveau bon de commande créé avec succès");
      }
      setIsModalVisible(false);
      fetchPurchaseOrders();
    } catch (error) {
      console.log("Error:", error);
      message.error("Échec de la soumission du bon de commande");
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setCurrentPurchaseOrder(null);
    setIsModalVisible(true);
  };

  const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0; // Return 0 if either date is missing

    const start = moment(startDate).startOf("day");
    const end = moment(endDate).startOf("day");
    console.log(start, end);

    if (start.isAfter(end)) return 0; // Return 0 if start date is after end date

    let count = 0;
    let current = start.clone();

    while (current.isSameOrBefore(end)) {
      const dayOfWeek = current.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++; // Count only if it's a weekday (Monday - Friday)
      }
      current.add(1, "day");
    }

    return count;
  };

  return (
    <Card className="shadow-sm">
      <Modal
        title={
          <Space>
            <CheckCircleOutlined className="text-green-500" />
            Valider et modifier le bon de commande
          </Space>
        }
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-green-500"
            onClick={() => handleAccept(recordToEdit?.id_bdc, recordToEdit)}
          >
            Soumettre à l'administrateur
          </Button>,
        ]}
        width={700}
      >
        <Alert
          message="Validation du bon de commande"
          description="Vous pouvez modifier les détails du bon de commande avant de le soumettre à l'administrateur pour validation finale."
          type="info"
          showIcon
          className="mb-4"
        />

        <Form form={editForm} layout="vertical">
          <Form.Item
            label={
              <span className="flex items-center">
                <FileTextOutlined className="mr-2" />
                Description
              </span>
            }
            name="description"
            rules={[{ required: true, message: "La description est requise" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={
                <span className="flex items-center">
                  <DollarOutlined className="mr-2" />
                  TJM (€)
                </span>
              }
              name="tjm"
              rules={[{ required: true, message: "Le TJM est requis" }]}
            >
              <Input type="number" prefix="€" />
            </Form.Item>

            <Form.Item
              label={
                <span className="flex items-center">
                  <CalendarOutlined className="mr-2" />
                  Jours
                </span>
              }
              name="jours"
              rules={[
                { required: true, message: "Le nombre de jours est requis" },
              ]}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item
              label={
                <span className="flex items-center">
                  <EuroOutlined className="mr-2" />
                  Montant total
                </span>
              }
              name="montant_total"
              rules={[
                { required: true, message: "Le montant total est requis" },
              ]}
            >
              <Input type="number" prefix="€" disabled />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="mr-2" />
            {currentPurchaseOrder
              ? "Modifier le bon de commande"
              : `Créer un bon de commande n°${bdcNumber} - ${format(
                  new Date(),
                  "dd MMMM yyyy",
                  { locale: fr }
                )}`}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!currentPurchaseOrder && (
            <Form.Item
              label="Sélectionner une candidature"
              name="candidature_id"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner une candidature",
                },
              ]}
            >
              <Select
                loading={candidatesLoading}
                onChange={handleCandidateSelect}
                placeholder="Sélectionner une candidature"
              >
                {candidates.map((candidate) => {
                  const matchedProject = projects.find(
                    (project) => project.id === candidate.AO_id
                  );
                  const appelOfferName = matchedProject
                    ? matchedProject.titre
                    : "N/A";
                  // setTjm(candidate.tjm)
                  return (
                    <Option key={candidate.id_cd} value={candidate.id_cd}>
                      <Space>
                        <UserOutlined />
                        {`${candidate.nom_cn} - TJM: ${
                          candidate.tjm
                        }€ - Disponible le: ${format(
                          new Date(candidate.date_disponibilite),
                          "dd/MM/yyyy"
                        )} - Appel Offres: `}
                        <Tag color="green" style={{ fontSize: 14 }}>
                          {appelOfferName}
                        </Tag>
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          )}
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">
                <FileTextOutlined className="mr-2" />
                Profile de consultant
              </span>
            }
            name="description"
            initialValue={description}
            rules={[
              {
                required: true,
                message: "Veuillez fournir le profile du consultant",
              },
            ]}
          >
            <TextArea
              rows={4}
              value={description}
              placeholder="Décrivez le profile, les compétences et l'expérience du consultant..."
              className="rounded-lg border-2 border-gray-300 focus:border-blue-500 
               hover:border-blue-400 transition-colors duration-200
               p-4 text-gray-700 text-base leading-relaxed
               resize-none shadow-sm"
              style={{ minHeight: "120px" }}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Date de debut"
              name="date_debut"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                onChange={(date) => {
                  const calculatedDays = calculateWorkingDays(
                    date,
                    form.getFieldValue("date_fin")
                  );
                  form.setFieldsValue({
                    jours: calculatedDays,
                    montant_total: calculatedDays * tjm,
                  });
                  setJours(calculatedDays);
                }}
              />
            </Form.Item>

            <Form.Item
              label="Date de fin"
              name="date_fin"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                onChange={(date) => {
                  const calculatedDays = calculateWorkingDays(
                    form.getFieldValue("date_debut"),
                    date
                  );
                  form.setFieldsValue({
                    jours: calculatedDays,
                    montant_total: calculatedDays * tjm,
                  });
                  setJours(calculatedDays);
                }}
              />
            </Form.Item>
            <Form.Item
              label="Jours ouvrés"
              name="jours"
              initialValue={jours}
              rules={[
                { required: true, message: "Veuillez entrer les jours ouvrés" },
                () => ({
                  validator(_, value) {
                    const calculatedDays = calculateWorkingDays(
                      new Date(form.getFieldValue("date_debut")),
                      new Date(form.getFieldValue("date_fin"))
                    );
                    if (!value) {
                      return Promise.resolve();
                    }
                    if (value > calculatedDays) {
                      return Promise.reject(
                        `Le nombre de jours saisi (${value}) ne peut pas être supérieur aux jours calculés (${calculatedDays})`
                      );
                    }
                    // Update total amount when days change
                    const tjm = form.getFieldValue("tjm") || 0;
                    form.setFieldsValue({ montant_total: tjm * value });
                    return Promise.resolve();
                  },
                }),
              ]}
              help={`Jours calculés: ${calculateWorkingDays(
                new Date(form.getFieldValue("date_debut")),
                new Date(form.getFieldValue("date_fin"))
              )}`}
            >
              <Input
                type="number"
                min={1}
                max={calculateWorkingDays(
                  new Date(form.getFieldValue("date_debut")),
                  new Date(form.getFieldValue("date_fin"))
                )}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 0;
                  const tjm = form.getFieldValue("tjm") || 0;
                  form.setFieldsValue({ montant_total: tjm * days });
                }}
              />
            </Form.Item>

            <Form.Item
              label="TJM"
              name="TJM"
              dependencies={["candidature_id"]}
              initialValue={tjm}
              // rules={[
              //   { required: true, message: "Veuillez entrer le TJM" },
              //   {
              //     type: "number",
              //     min: 1,
              //     message: "Le TJM doit être supérieur à 0",
              //   },
              // ]}
              // help="Taux Journalier Moyen en euros"
            >
              <Input
                prefix={<EuroOutlined style={{ color: "#1890ff" }} />}
                type="number"
                min={1}
                value={tjm}
                style={{ width: "100%" }}
                onChange={(e) => {
                  const newValue = Math.max(1, parseInt(e.target.value) || 0);
                  setTjm(newValue);
                  const currentDays = form.getFieldValue("jours") || 0;
                  form.setFieldsValue({
                    tjm: newValue,
                    montant_total: newValue * currentDays,
                  });
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (!value || value < 1) {
                    form.setFieldsValue({ tjm: 1 });
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              label="Montant Total (€)"
              name="montant_total"
              rules={[
                { required: true, message: "Le montant total est requis" },
              ]}
              help={`Calculé automatiquement: TJM (${
                form.getFieldValue("tjm") || 0
              }€) × Jours (${form.getFieldValue("jours") || 0})`}
            >
              <Input
                type="number"
                disabled
                prefix="€"
                style={{ width: "100%", color: "#1890ff", fontWeight: "bold" }}
              />
            </Form.Item>
          </div>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalVisible(false)}>Annuler</Button>
            <Button type="primary" htmlType="submit">
              {currentPurchaseOrder ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </Form>
      </Modal>
      <div className="mb-4">
        <div className="mt-4 mb-2 flex items-center justify-between">
          <Input
            placeholder="Rechercher par numéro ou description..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Nouveau bon de commande
          </Button>
        </div>

        {purchaseOrders?.filter((po) => po.statut === "pending_client").length >
          0 && (
          <Alert
            message="Bons de commande en attente"
            description={`Vous avez ${
              purchaseOrders?.filter((po) => po.statut === "pending_client")
                .length
            } bon(s) de commande en attente de validation.`}
            type="info"
            showIcon
            className="mb-4"
          />
        )}
      </div>

      <Table
        columns={purchaseOrderColumns}
        dataSource={purchaseOrders?.filter(
          (po) =>
            po.numero_bdc?.toLowerCase().includes(searchText.toLowerCase()) ||
            po.description?.toLowerCase().includes(searchText.toLowerCase())
        )}
        rowKey="id_bdc"
        loading={loading}
        size="small"
        pagination={{
          pageSize: 4,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
      />

      {/* Purchase Order Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Détails du Bon de Commande
          </Space>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          // <Button
          //   key="download"
          //   icon={<DownloadOutlined />}
          //   onClick={() => handleDownload(selectedPO)}
          //   loading={downloadLoading[selectedPO?.id_bdc]}
          // >
          //   Télécharger
          // </Button>,
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Fermer
          </Button>,
          selectedPO?.statut === "pending_client" && (
            <>
              <Button
                key="accept"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  showAcceptConfirm(selectedPO);
                  setIsDetailsModalVisible(false);
                }}
                className="bg-green-500"
              >
                Accepter
              </Button>
              ,
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  showRejectConfirm(selectedPO);
                  setIsDetailsModalVisible(false);
                }}
              >
                Refuser
              </Button>
            </>
          ),
        ].filter(Boolean)}
        width={700}
      >
        {selectedPO && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro BDC" span={2}>
              {selectedPO.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de création">
              {format(new Date(selectedPO.date_creation), "dd MMMM yyyy", {
                locale: fr,
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              {getStatusTag(selectedPO.statut)}
            </Descriptions.Item>
            <Descriptions.Item label="Montant total" span={2}>
              <Text strong className="text-green-600">
                {selectedPO.montant_total.toFixed(2)} €
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedPO.description}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Contract Review Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Revue du Contrat
          </Space>
        }
        open={isContractReviewModalVisible}
        onCancel={() => setIsContractReviewModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsContractReviewModalVisible(false)}
          >
            Annuler
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={handleCreateContract}
            className="bg-blue-500"
          >
            Créer le Contrat
          </Button>,
        ]}
        width={700}
      >
        <div className="font-medium mt-4">Date de contrat</div>
        <div className="flex items-center space-x-5 ">
          <Form.Item
            label="Date de début"
            name="date_debut"
            rules={[{ required: true }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              onChange={(date) =>
                setDates((prev) => ({ ...prev, date_debut: date }))
              }
            />
          </Form.Item>

          <Form.Item
            label="Date de fin"
            name="date_fin"
            rules={[{ required: true }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              onChange={(date) =>
                setDates((prev) => ({ ...prev, date_fin: date }))
              }
            />
          </Form.Item>
        </div>

        {selectedPO && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro BDC" span={2}>
              {selectedPO.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de signature">
              {format(new Date(), "dd MMMM yyyy", { locale: fr })}
            </Descriptions.Item>
            <Descriptions.Item label="Montant">
              <Text strong className="text-green-600">
                {selectedPO.montant_total.toFixed(2)} €
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Date de début" span={2}>
              {format(
                new Date(selectedPO.date_debut || new Date()),
                "dd MMMM yyyy",
                {
                  locale: fr,
                }
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Date de fin" span={2}>
              {format(
                new Date(selectedPO.date_fin || new Date()),
                "dd MMMM yyyy",
                {
                  locale: fr,
                }
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Description du BDC" span={2}>
              {selectedPO.description}
            </Descriptions.Item>
            <Descriptions.Item label="Conditions du Contrat" span={2}>
              <Text type="secondary">
                Les conditions standard du contrat seront appliquées
                conformément aux termes du bon de commande accepté.
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default OrderInterface;
