import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Tooltip,
  Dropdown,
  Modal,
  message,
  Radio,
  Row,
  Col,
  Avatar,
  Form,
  Divider,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ExportOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  HomeOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  FileOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { Endponit, token } from "../../helper/enpoint";
import ESNDocumentViewer from "./sub-compo/ESNDocumentViewer";

const { Option } = Select;

const CollaboratorList = () => {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [collaborators, setCollaborators] = useState([]);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  // Add this near the other state declarations
  const [verificationIntent, setVerificationIntent] = useState(false);

  const [esnsWithDocuments, setEsnsWithDocuments] = useState({});
  const API_BASE_URL = Endponit() + "/api/ESN/";

  // City data mapping (simplified - expand based on your needs)
  const cityData = {
    France: ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille"],
    Belgique: ["Bruxelles", "Anvers", "Gand", "Liège", "Bruges"],
    Suisse: ["Genève", "Zurich", "Bâle", "Lausanne", "Berne"],
  };

  const calculateProfileCompletion = (collaborator) => {
    // Define required fields for a complete profile
    const requiredFields = [
      "Raison_sociale",
      "SIRET",
      "mail_Contact",
      "Tel_Contact",
      "Adresse",
      "CP",
      "Ville",
      "Pays",
      "IBAN",
      "BIC",
      "Banque",
    ];

    // Add this function after fetchCollaborators

    // Count filled fields
    const filledFields = requiredFields.filter(
      (field) =>
        collaborator[field] && collaborator[field].toString().trim() !== ""
    ).length;

    // Calculate percentage
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const checkEsnDocuments = async (esnIds) => {
    try {
      const promises = esnIds.map((id) =>
        axios.get(`${Endponit()}/api/getDocumentESN/`, {
          headers: {
            Authorization: `${token()}`,
          },
          params: {
            esnId: id,
          },
        })
      );

      const responses = await Promise.all(promises);
      const documentsMap = {};

      responses.forEach((response, index) => {
        const esnId = esnIds[index];
        const hasDocuments = response.data.data.length > 0;
        documentsMap[esnId] = hasDocuments;
      });

      setEsnsWithDocuments(documentsMap);
    } catch (error) {
      console.error("Error checking ESN documents:", error);
      // Set all to false in case of error
      const documentsMap = {};
      esnIds.forEach((id) => (documentsMap[id] = false));
      setEsnsWithDocuments(documentsMap);
    }
  };

  // Modify this part of fetchCollaborators
  const fetchCollaborators = async (password) => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE_URL, {
        headers: {
          Authorization: `${token()}`,
        },
      });
      const formattedData = response.data.data.map((item) => {
        // Calculate profile completion
        const completionPercentage = calculateProfileCompletion(item);

        return {
          key: item.ID_ESN,
          id: item.ID_ESN,
          nom: item.Raison_sociale,
          email: item.mail_Contact,
          phone: item.Tel_Contact,
          poste: "N/A",
          status: item.Statut,
          Raison_sociale: item.Raison_sociale,
          SIRET: item.SIRET,
          Pays: item.Pays,
          Adresse: item.Adresse,
          CP: item.CP,
          Ville: item.Ville,
          mail_Contact: item.mail_Contact,
          IBAN: item.IBAN,
          BIC: item.BIC,
          Banque: item.Banque,
          completion: completionPercentage,
        };
      });

      setCollaborators(formattedData);

      // After loading collaborators, check for documents
      if (formattedData.length > 0) {
        const esnIds = formattedData.map((esn) => esn.id);
        checkEsnDocuments(esnIds);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des données");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Password prompt modal
  const showPasswordPrompt = () => {
    fetchCollaborators();
  };

  // Export to Excel
  const handleExport = () => {
    const dataToExport = collaborators.map((item) => ({
      ID: item.id,
      "Raison Sociale": item.nom,
      Email: item.email,
      Téléphone: item.phone,
      Status: item.status,
      SIRET: item.SIRET,
      Pays: item.Pays,
      Ville: item.Ville,
      Adresse: item.Adresse,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ESN Data");
    XLSX.writeFile(wb, "esn_export.xlsx");
  };

  // Updated DetailsModal with modern styling and functionality
  const DetailsModal = ({
    visible,
    collaborator,
    onClose,
    verificationIntent,
  }) => {
    const handleVerify = async () => {
      try {
        await axios.put(
          `${Endponit()}/api/ESN/`,
          {
            ...collaborator,
            Statut: "à signer",
            statut: "à signer",
            ID_ESN: collaborator.id,
            password: null,
          },
          {
            headers: {
              Authorization: `${token()}`,
            },
          }
        );
        message.success("ESN marqué comme 'à signer'");
        onClose(true); // Pass true to indicate the list should refresh
      } catch (error) {
        message.error("Erreur lors de la modification du statut");
        console.error("Status change error:", error);
      }
    };

    if (!collaborator) return null;

    const hasDocuments = esnsWithDocuments[collaborator.id] || false;
    const isEnabled = collaborator.completion >= 100 && hasDocuments;

    return (
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold text-gray-800">
              Détails de l'ESN
            </span>
            <Tag
              className="text-base px-3 py-1"
              color={
                collaborator.status === "Draft"
                  ? "orange"
                  : collaborator.status === "à valider"
                  ? "blue"
                  : collaborator.status === "à signer"
                  ? "purple"
                  : collaborator.status === "Actif"
                  ? "green"
                  : "red"
              }
            >
              {collaborator.status === "Draft"
                ? "En cours de création"
                : collaborator.status === "à valider"
                ? "À valider"
                : collaborator.status === "à signer"
                ? "À signer"
                : collaborator.status === "Actif"
                ? "Actif"
                : "Inactif"}
            </Tag>
          </div>
        }
        visible={visible}
        onCancel={() => onClose(false)}
        footer={[
          <Button key="close" onClick={() => onClose(false)}>
            Fermer
          </Button>,
          (verificationIntent || collaborator.status === "à valider") &&
            isEnabled && (
              <Button
                key="verify"
                type="primary"
                onClick={handleVerify}
                icon={<CheckCircleOutlined />}
              >
                Marquer comme "À signer"
              </Button>
            ),
        ].filter(Boolean)}
        width={800}
        className="esn-details-modal"
        bodyStyle={{ padding: "24px" }}
      >
        {/* Completion progress bar at the top */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">
              Complétude du profil
            </span>
            <span className="text-gray-700 font-medium">
              {collaborator.completion}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                collaborator.completion < 50
                  ? "bg-red-500"
                  : collaborator.completion < 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${collaborator.completion}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Informations générales */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <UserOutlined className="text-blue-500 text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-800 m-0">
                Informations générales
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Raison sociale</p>
                <p className="font-medium text-gray-800">
                  {collaborator.nom || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">SIRET</p>
                <p className="font-medium text-gray-800">
                  {collaborator.SIRET || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <MailOutlined className="mr-2 text-gray-400" />
                  {collaborator.email || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <PhoneOutlined className="mr-2 text-gray-400" />
                  {collaborator.phone || "Non spécifié"}
                </p>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <HomeOutlined className="text-green-500 text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-800 m-0">Adresse</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Adresse</p>
                  <p className="font-medium text-gray-800">
                    {collaborator.Adresse || "Non spécifié"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Code postal</p>
                  <p className="font-medium text-gray-800">
                    {collaborator.CP || "Non spécifié"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ville</p>
                  <p className="font-medium text-gray-800">
                    {collaborator.Ville || "Non spécifié"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">Pays</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <GlobalOutlined className="mr-2 text-gray-400" />
                  {collaborator.Pays || "Non spécifié"}
                </p>
              </div>
            </div>
          </div>

          {/* Informations financières */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <BankOutlined className="text-purple-500 text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-800 m-0">
                Informations financières
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Banque</p>
                <p className="font-medium text-gray-800">
                  {collaborator.Banque || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">IBAN</p>
                <p className="font-medium text-gray-800">
                  {collaborator.IBAN || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">BIC</p>
                <p className="font-medium text-gray-800">
                  {collaborator.BIC || "Non spécifié"}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <div className="flex items-center mb-4">
              <FileOutlined className="text-orange-500 text-xl mr-2" />
              <h3 className="text-lg font-medium text-gray-800 m-0">
                Documents
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <ESNDocumentViewer esnId={collaborator.id} />
              {!hasDocuments && (
                <div className="text-center py-3">
                  <p className="text-gray-500">Aucun document disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status change notification */}
        {isEnabled && collaborator.status === "Draft" && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <InfoCircleOutlined className="text-blue-500 text-lg mt-1 mr-3" />
              <div>
                <h4 className="font-medium text-blue-700 m-0">
                  Profil complété à 100%
                </h4>
                <p className="text-blue-600 mt-1 mb-0">
                  Ce profil est complet et peut être marqué comme "À signer"
                  pour validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isEnabled && collaborator.status === "Draft" && (
          <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <WarningOutlined className="text-yellow-500 text-lg mt-1 mr-3" />
              <div>
                <h4 className="font-medium text-yellow-700 m-0">
                  Profil incomplet
                </h4>
                <p className="text-yellow-600 mt-1 mb-0">
                  {collaborator.completion < 100
                    ? "Complétez le profil à 100% "
                    : "Ajoutez au moins un document "}
                  pour pouvoir marquer ce profil comme "À signer".
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    );
  };

  const handlePostError = (response) => {
    const errors = response?.data?.errors;
    console.log(errors.SIRET[0].length > 0);
    if (errors.SIRET[0].length > 0) {
      message.error("Ce numéro SIRET est déjà utilisé");
    }
    if (errors.mail_Contact) {
      message.error("Cette adresse email est déjà utilisée");
    }
  };

  // Update in the handleAddCollaborator function
  const handleAddCollaborator = async (values) => {
    try {
      const response = await axios.post(
        API_BASE_URL,
        { ...values, Statut: "Draft" }, // New ESNs always start with "Draft" status
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );

      if (response.data.status == true) {
        message.success("ESN créé avec succès");
        showPasswordPrompt(); // Refresh with password
      } else {
        handlePostError(response);
      }

      return response;
    } catch (error) {
      message.error("Erreur lors de l'ajout du ENS");
      console.error("Add error:", error);
      throw error;
    }
  };

  // Update Collaborator
  const handleUpdateCollaborator = async (values) => {
    try {
      const payload = {
        ...values,
        ID_ESN: editingCollaborator.id,
        password: null,
      };

      const response = await axios.put(`${API_BASE_URL}`, payload, {
        headers: {
          Authorization: `${token()}`,
        },
      });

      message.success("Collaborateur mis à jour avec succès");
      setEditingCollaborator(null);
      showPasswordPrompt(); // Refresh with password

      return response;
    } catch (error) {
      message.error("Erreur lors de la mise à jour du collaborateur");
      console.error("Update error:", error);
      throw error;
    }
  };

  // Delete Collaborator
  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce collaborateur ?",
      content: `Cette action supprimera définitivement ${record.nom}.`,
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      async onOk() {
        try {
          await axios.delete(`${API_BASE_URL}` + record.id, {
            data: record,
            headers: {
              Authorization: `${token()}`,
            },
          });
          message.success("ENS supprimé avec succès");
          showPasswordPrompt(); // Refresh with password
        } catch (error) {
          message.error("Erreur lors de la suppression du ENS");
          console.error("Delete error:", error);
        }
      },
    });
  };

  useEffect(() => {
    showPasswordPrompt();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleRefresh = () => {
    showPasswordPrompt();
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      width: 80,
    },
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      sorter: (a, b) => a.nom.localeCompare(b.nom),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.nom.toLowerCase().includes(value.toLowerCase()) ||
        record.email.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Poste",
      dataIndex: "poste",
      key: "poste",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color;
        let text;

        switch (status) {
          case "Draft":
            color = "orange";
            text = "En cours de création";
            break;
          case "à valider":
            color = "blue";
            text = "À valider";
            break;
          case "à signer":
            color = "purple";
            text = "À signer";
            break;
          case "Actif":
            color = "green";
            text = "Actif";
            break;
          case "Inactif":
            color = "red";
            text = "Inactif";
            break;
          default:
            color = "default";
            text = status;
        }

        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: "En cours de création", value: "Draft" },
        { text: "À valider", value: "à valider" },
        { text: "À signer", value: "à signer" },
        { text: "Actif", value: "Actif" },
        { text: "Inactif", value: "Inactif" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Complétude",
      dataIndex: "completion",
      key: "completion",
      width: 120,
      sorter: (a, b) => a.completion - b.completion,
      render: (completion) => (
        <Tooltip title={`${completion}% complet`}>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
              <div
                className={`h-2.5 rounded-full ${
                  completion < 50
                    ? "bg-red-500"
                    : completion < 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-center">{completion}%</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <ActionButtons
          record={record}
          handleDelete={handleDelete}
          onEdit={() => setEditingCollaborator(record)}
          onViewDetails={() => {
            setSelectedCollaborator(record);
            setDetailsModalVisible(true);
          }}
        />
      ),
    },
  ];

  // Update the ActionButtons component
  const ActionButtons = ({ record, handleDelete, onEdit, onViewDetails }) => {
    const hasDocuments = esnsWithDocuments[record.id] || false;
    const isEnabled = record.completion >= 100 && hasDocuments;

    const getTooltipMessage = () => {
      if (record.completion <= 0) {
        return "Le profil doit être complet (100%)";
      }
      if (!hasDocuments) {
        return "L'ESN doit avoir au moins un document";
      }
      return "Modifier";
    };

    // Modified to show details first before verifying
    const handleVerifyWithDetails = () => {
      onViewDetails(record, true); // Pass true to indicate verification intent
    };

    return (
      <Space size="middle">
        <Tooltip title={getTooltipMessage()}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={onEdit}
            // disabled={!isEnabled}
          />
        </Tooltip>
        <Tooltip
          title={
            isEnabled
              ? "Validation de l'ESN"
              : "Le profil doit être complet avec documents"
          }
        >
          <Button
            type="text"
            icon={<CheckCircleOutlined />}
            style={{ color: isEnabled ? "#52c41a" : undefined }}
            onClick={isEnabled ? handleVerifyWithDetails : undefined}
            disabled={!isEnabled}
          />
        </Tooltip>
        <Tooltip title="Supprimer">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Tooltip>
      </Space>
    );
  };

  const CardView = ({ data, handleDelete, onEdit, onViewDetails }) => {
    return (
      <Row gutter={[16, 16]}>
        {data.map((collaborator) => {
          const hasDocuments = esnsWithDocuments[collaborator.id] || false;
          const isEnabled = collaborator.completion >= 100 && hasDocuments;

          const getTooltipMessage = () => {
            if (collaborator.completion <= 0) {
              return "Le profil doit être complet (100%)";
            }
            if (!hasDocuments) {
              return "L'ESN doit avoir au moins un document";
            }
            return "Modifier";
          };

          // Modified to show details first before verifying
          const handleVerifyWithDetails = () => {
            onViewDetails(collaborator, true); // Pass true to indicate verification intent
          };

          return (
            <Col xs={24} sm={12} md={8} lg={6} key={collaborator.key}>
              <Card
                hoverable
                actions={[
                  <Tooltip title={getTooltipMessage()} key="edit-tooltip">
                    <span>
                      <EditOutlined
                        key="edit"
                        onClick={
                          isEnabled ? () => onEdit(collaborator) : undefined
                        }
                        style={{
                          color: isEnabled ? undefined : "#d9d9d9",
                          cursor: isEnabled ? "pointer" : "not-allowed",
                        }}
                      />
                    </span>
                  </Tooltip>,
                  <Tooltip
                    title={
                      isEnabled
                        ? "Marquer comme 'à signer'"
                        : "Le profil doit être complet avec documents"
                    }
                    key="verify-tooltip"
                  >
                    <span>
                      <CheckCircleOutlined
                        key="verify"
                        onClick={
                          isEnabled
                            ? () => handleVerifyWithDetails()
                            : undefined
                        }
                        style={{
                          color: isEnabled ? "#52c41a" : "#d9d9d9",
                          cursor: isEnabled ? "pointer" : "not-allowed",
                        }}
                      />
                    </span>
                  </Tooltip>,
                  <Tooltip title="Supprimer" key="delete-tooltip">
                    <DeleteOutlined
                      key="delete"
                      onClick={() => handleDelete(collaborator)}
                    />
                  </Tooltip>,
                ]}
              >
                {/* Card.Meta content unchanged */}
                <Card.Meta
                  avatar={<Avatar icon={<UserOutlined />} size={64} />}
                  title={
                    <div className="flex justify-between items-center">
                      <span>{collaborator.nom}</span>
                      <Tag
                        color={
                          collaborator.completion < 50
                            ? "red"
                            : collaborator.completion < 80
                            ? "orange"
                            : collaborator.completion === 100
                            ? "green"
                            : "gold"
                        }
                      >
                        {collaborator.completion}%
                      </Tag>
                    </div>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Tag
                        color={
                          collaborator.status === "Draft"
                            ? "orange"
                            : collaborator.status === "à valider"
                            ? "blue"
                            : collaborator.status === "à signer"
                            ? "purple"
                            : collaborator.status === "Actif"
                            ? "green"
                            : "red"
                        }
                      >
                        {collaborator.status === "Draft"
                          ? "En cours de création"
                          : collaborator.status === "à valider"
                          ? "À valider"
                          : collaborator.status === "à signer"
                          ? "À signer"
                          : collaborator.status === "Actif"
                          ? "Actif"
                          : "Inactif"}
                      </Tag>
                      <Space>
                        <MailOutlined /> {collaborator.email}
                      </Space>
                      <Space>
                        <PhoneOutlined /> {collaborator.phone}
                      </Space>
                      <Space>{collaborator.poste}</Space>
                      {!hasDocuments && (
                        <Tag color="orange">Aucun document</Tag>
                      )}
                    </Space>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <Card className="w-full">
      <Space className="w-full flex flex-row items-center justify-between bg-white">
        <div className="flex flex-row items-center space-x-5">
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="table">Tableau</Radio.Button>
            <Radio.Button value="card">Cartes</Radio.Button>
          </Radio.Group>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className="flex flex-row items-center space-x-5">
          <AddCollaboratorModal
            onAdd={handleAddCollaborator}
            editingCollaborator={editingCollaborator}
            onUpdate={handleUpdateCollaborator}
            onCancel={() => setEditingCollaborator(null)}
            cityData={cityData}
          />
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
        </div>
      </Space>
      <div className="mt-5"></div>
      {viewMode === "table" ? (
        <>
          <Table
            columns={columns}
            dataSource={collaborators}
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: collaborators.length,
              pageSize: 10,
              showTotal: (total) => `Total ${total} collaborateurs`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            size="middle"
            scroll={{ x: "max-content" }}
          />
          <div style={{ marginTop: 16 }}>
            <span style={{ marginLeft: 8 }}>
              {selectedRowKeys.length > 0
                ? `${selectedRowKeys.length} collaborateur(s) sélectionné(s)`
                : ""}
            </span>
          </div>
        </>
      ) : (
        <CardView
          data={collaborators}
          handleDelete={handleDelete}
          onEdit={setEditingCollaborator}
          onViewDetails={(collaborator) => {
            setSelectedCollaborator(collaborator);
            setDetailsModalVisible(true);
          }}
        />
      )}

      <DetailsModal
        visible={detailsModalVisible}
        collaborator={selectedCollaborator}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedCollaborator(null);
        }}
      />
    </Card>
  );
};

const AddCollaboratorModal = ({
  onAdd,
  editingCollaborator,
  onUpdate,
  onCancel,
  cityData,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [serverErrors, setServerErrors] = useState({});

  // Fetch Countries
  const fetchCountries = async () => {
    try {
      const response = await axios.get("http://51.38.99.75:3100/api/countries");
      console.log(response);

      setCountries(response.data.data);
    } catch (error) {
      message.error("Erreur lors du chargement des pays");
      console.error("Countries fetch error:", error);
    }
  };

  // Fetch Cities for a specific country
  const fetchCities = async (countryName) => {
    try {
      const response = await axios.get(
        `http://51.38.99.75:3100/api/cities/${countryName}`
      );
      setCities(response.data.data);
    } catch (error) {
      message.error("Erreur lors du chargement des villes");
      console.error("Cities fetch error:", error);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleCountryChange = (value) => {
    setSelectedCountry(value);
    form.setFieldValue("Ville", undefined);
    fetchCities(value);
  };

  useEffect(() => {
    if (editingCollaborator) {
      setIsModalVisible(true);
      form.setFieldsValue({
        nom: editingCollaborator.nom,
        email: editingCollaborator.email,
        phone: editingCollaborator.phone,
        status: editingCollaborator.status,
        SIRET: editingCollaborator.SIRET,
        rce: editingCollaborator.rce,
        Pays: editingCollaborator.Pays,
        Adresse: editingCollaborator.Adresse,
        CP: editingCollaborator.CP,
        Ville: editingCollaborator.Ville,
        province: editingCollaborator.province,
        tva: editingCollaborator.tva,
        iban: editingCollaborator.iban,
        bic: editingCollaborator.bic,
        banque: editingCollaborator.banque,
        password: editingCollaborator.password,
      });

      // Set selected country and update cities
      setSelectedCountry(editingCollaborator.Pays);
      if (editingCollaborator.Pays && cityData[editingCollaborator.Pays]) {
        setCities(cityData[editingCollaborator.Pays]);
      }
    }
  }, [editingCollaborator, form, cityData]);

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setSelectedCountry(null);
    setCities([]);
  };

  const handleOk = async () => {
    try {
      // Reset previous server errors
      setServerErrors({});

      const values = await form.validateFields();
      const formattedValues = {
        Raison_sociale: values.nom,
        SIRET: values.SIRET,
        RCE: values.rce,
        Pays: values.Pays,
        Adresse: values.Adresse,
        CP: values.CP,
        Ville: values.Ville,
        Province: values.province,
        mail_Contact: values.email,
        Tel_Contact: values.phone,
        Statut: values.status || "En attente",
        N_TVA: values.tva,
        IBAN: values.iban,
        BIC: values.bic,
        Banque: values.banque,
        password: values.password,
      };

      let response;
      if (editingCollaborator) {
        response = await onUpdate({
          ...formattedValues,
          id: editingCollaborator.id,
        });
      } else {
        response = await onAdd(formattedValues);
      }

      // Check if the response indicates a successful operation
      if (response && response.data && response.data.status === true) {
        setIsModalVisible(false);
        form.resetFields();
        setSelectedCountry(null);
        setCities([]);
      } else {
        // Handle server-side validation errors
        const errors = response?.data?.errors || {};
        setServerErrors(errors);

        // Highlight specific fields with errors
        const errorFields = [];
        if (errors.SIRET) {
          errorFields.push({
            name: "SIRET",
            errors: ["Ce numéro SIRET est déjà utilisé"],
          });
        }
        if (errors.mail_Contact) {
          errorFields.push({
            name: "email",
            errors: ["Cette adresse email est déjà utilisée"],
          });
        }

        form.setFields(errorFields);
      }
    } catch (error) {
      console.log("Validate Failed:", error);
      message.error(
        "Erreur de validation. Veuillez vérifier vos informations."
      );
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedCountry(null);
    setCities([]);
    onCancel && onCancel();
  };

  return (
    <>
      <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
        {editingCollaborator ? "Modifier" : "Nouveau ENS"}
      </Button>
      <Modal
        title={
          <div className="text-xl font-semibold text-gray-800">
            {editingCollaborator ? "Modifier un ENS" : "Ajouter un ENS"}
          </div>
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={editingCollaborator ? "Mettre à jour" : "Ajouter"}
        cancelText="Annuler"
        width={900}
        className="rounded-lg"
        footer={[
          <Button key="back" onClick={handleCancel}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleOk}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {editingCollaborator ? "Mettre à jour" : "Ajouter"}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          name="collaborator_form"
          className="space-y-4"
        >
          <div className="bg-gray-50 p-4 rounded-lg">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">
                      Raison sociale
                    </span>
                  }
                  name="nom"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir la raison sociale",
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Nom de l'entreprise"
                    className="rounded-md"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">SIRET</span>
                  }
                  name="SIRET"
                  rules={[
                    { required: true, message: "Veuillez saisir le SIRET" },
                  ]}
                >
                  <Input placeholder="Numéro SIRET" className="rounded-md" />
                </Form.Item>
              </Col>
            </Row>

            <Divider className="my-4" />

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Pays</span>
                  }
                  name="Pays"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner le pays",
                    },
                  ]}
                >
                  <Select
                    placeholder="Sélectionner un pays"
                    onChange={handleCountryChange}
                    className="w-full"
                  >
                    {countries?.map((country) => (
                      <Option key={country} value={country}>
                        {country}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Ville</span>
                  }
                  name="Ville"
                  rules={[
                    { required: true, message: "Veuillez saisir la ville" },
                  ]}
                >
                  <Select
                    placeholder="Sélectionner une ville"
                    disabled={!selectedCountry}
                    className="w-full"
                  >
                    {cities.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">
                      Code Postal
                    </span>
                  }
                  name="CP"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir le code postal",
                    },
                  ]}
                >
                  <Input placeholder="Code postal" className="rounded-md" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Téléphone</span>
                  }
                  name="phone"
                  rules={[
                    {
                      required: true,
                      message: "Veuillez saisir le numéro de téléphone",
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    placeholder="Numéro de téléphone"
                    className="rounded-md"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Adresse</span>
                  }
                  name="Adresse"
                  rules={[
                    { required: true, message: "Veuillez saisir l'adresse" },
                  ]}
                >
                  <Input
                    prefix={<HomeOutlined className="text-gray-400" />}
                    placeholder="Adresse complète"
                    className="rounded-md"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Email</span>
                  }
                  name="email"
                  rules={[
                    { required: true, message: "Veuillez saisir l'email" },
                    {
                      type: "email",
                      message: "Veuillez saisir un email valide",
                    },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="Email de contact"
                    className="rounded-md"
                  />
                </Form.Item>
              </Col>
              {!editingCollaborator ? (
                <Col span={8}>
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">
                        Mot de passe
                      </span>
                    }
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez saisir le mot de passe",
                      },
                    ]}
                  >
                    <Input
                      // prefix={<Pass className="text-gray-400" />}
                      placeholder="Mot de passe"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
              ) : (
                ""
              )}
            </Row>

            {/* Additional Financial Information */}
            <Divider orientation="left" className="my-4">
              <span className="text-gray-600">Informations financières</span>
            </Divider>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Banque</span>
                  }
                  name="banque"
                >
                  <Input
                    prefix={<BankOutlined className="text-gray-400" />}
                    placeholder="Nom de la banque"
                    className="rounded-md"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">IBAN</span>
                  }
                  name="iban"
                >
                  <Input placeholder="Numéro IBAN" className="rounded-md" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={<span className="font-medium text-gray-700">BIC</span>}
                  name="bic"
                >
                  <Input placeholder="Code BIC" className="rounded-md" />
                </Form.Item>
              </Col>
            </Row>

            {editingCollaborator && (
              <Row className="mt-4">
                <Col span={24}>
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">Statut</span>
                    }
                    name="status"
                  >
                    <Select placeholder="Sélectionnez le statut">
                      <Option value="Draft">En cours de création</Option>
                      <Option value="à valider">À valider</Option>
                      <Option value="à signer">À signer</Option>
                      <Option value="Actif">Actif</Option>
                      <Option value="Inactif">Inactif</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default CollaboratorList;
