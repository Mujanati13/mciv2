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
  Modal,
  message,
  Radio,
  Row,
  Col,
  Avatar,
  Form,
  Select,
  Divider,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  ExportOutlined,
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  FileOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";
import * as XLSX from "xlsx";
import ClientDocumentViewer from "./sub-compo/ClientDocumentViewer";

const { Option } = Select;

export const ClientList = () => {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [clients, setClients] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const [clientsWithDocuments, setClientsWithDocuments] = useState({});

  // New states for verification modal
  const [verifyingClient, setVerifyingClient] = useState(null);
  const [isVerificationModalVisible, setIsVerificationModalVisible] =
    useState(false);

  // Open verification modal
  const openVerificationModal = (client) => {
    setVerifyingClient(client);
    setIsVerificationModalVisible(true);
  };

  // Close verification modal
  const closeVerificationModal = () => {
    setVerifyingClient(null);
    setIsVerificationModalVisible(false);
  };

  // Confirm verification and update status
  const confirmVerification = () => {
    if (verifyingClient) {
      console.log(verifyingClient);

      handleStatusUpdate(verifyingClient.id, "à signer", verifyingClient.email);
      closeVerificationModal();
    }
  };

  // Status update function
  const handleStatusUpdate = async (clientId, newStatus, mail_Contact) => {
    try {
      await axios.put(
        `${Endponit()}/api/client/${clientId}`,
        { statut: newStatus, ID_clt: clientId, mail_contact: mail_Contact },
        {
          headers: { Authorization: `${token()}` },
        }
      );
      message.success(`Statut du client mis à jour: ${newStatus}`);
      fetchClients(); // Refresh the list after status update
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut");
      console.error("Status update error:", error);
    }
  };

  // Check for client documents
  const checkClientDocuments = async (clientIds) => {
    try {
      const promises = clientIds.map((id) =>
        axios.get(`${Endponit()}/api/getDocumentClient/`, {
          headers: {
            Authorization: `${token()}`,
          },
          params: {
            ClientId: id,
          },
        })
      );

      const responses = await Promise.all(promises);
      const documentsMap = {};

      responses.forEach((response, index) => {
        const clientId = clientIds[index];
        const hasDocuments = response.data.data.length > 0;
        documentsMap[clientId] = hasDocuments;
      });

      setClientsWithDocuments(documentsMap);
    } catch (error) {
      console.error("Error checking client documents:", error);
      // Set all to false in case of error
      const documentsMap = {};
      clientIds.forEach((id) => (documentsMap[id] = false));
      setClientsWithDocuments(documentsMap);
    }
  };

  // Fetch clients data
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Endponit()}/api/client/`, {
        headers: {
          Authorization: `${token()}`,
        },
      });
      const formattedData = response.data.data.map((client) => {
        // Calculate profile completion
        const completionPercentage = calculateProfileCompletion(client);

        return {
          key: client.ID_clt,
          id: client.ID_clt,
          name: client.raison_sociale,
          email: client.mail_contact,
          phone: client.tel_contact,
          status: client.statut,
          address: `${client.adresse}, ${client.cp} ${client.ville}`,
          created: client.date_validation,
          siret: client.siret,
          pays: client.pays,
          n_tva: client.n_tva,
          ville: client.ville,
          cp: client.cp,
          completion: completionPercentage,
        };
      });
      setClients(formattedData);

      // After loading clients, check for documents
      if (formattedData.length > 0) {
        const clientIds = formattedData.map((client) => client.id);
        checkClientDocuments(clientIds);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des clients");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (client) => {
    // Define required fields to check
    const requiredFields = [
      "raison_sociale",
      "mail_contact",
      "tel_contact",
      "adresse",
      "cp",
      "ville",
      "pays",
      "siret",
      "n_tva",
    ];

    // Count filled fields
    const filledFields = requiredFields.filter(
      (field) => client[field] && client[field].toString().trim() !== ""
    ).length;

    // Calculate percentage
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  // Export to Excel
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(clients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "clients.xlsx");
  };

  // Handle opening the modal
  const openModal = (client = null) => {
    setEditingClient(client);
    setIsModalVisible(true);
    // Force modal to reset by changing its key
    setModalKey((prev) => prev + 1);
  };

  // Handle closing the modal
  const closeModal = () => {
    setIsModalVisible(false);
    setEditingClient(null);
  };

  // Delete client
  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce client?",
      content: `Cette action supprimera définitivement ${record.name}.`,
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      async onOk() {
        try {
          await axios.delete(`${Endponit()}/api/client/${record.id}`, {
            headers: { Authorization: `${token()}` },
          });
          message.success("Client supprimé avec succès");
          fetchClients(); // Refresh the list after deletion
        } catch (error) {
          message.error("Erreur lors de la suppression du client");
          console.error("Delete error:", error);
        }
      },
    });
  };

  // Add/Update client
  const handleClientAction = async (values) => {
    try {
      if (editingClient) {
        await axios.put(
          `${Endponit()}/api/client/${editingClient.id}`,
          { ...values, ID_clt: editingClient.id },
          {
            headers: { Authorization: `${token()}` },
          }
        );
        message.success("Client mis à jour avec succès");
      } else {
        const res = await axios.post(
          `${Endponit()}/api/client/`,
          { ...values, statut: "Draft" }, // New clients always start with "Draft" status
          {
            headers: { Authorization: `${token()}` },
          }
        );
        if (res.data.status === true) {
          message.success("Client ajouté avec succès");
        } else {
          message.error("Erreur lors de l'ajout du client");
        }
      }
      fetchClients();
      closeModal();
    } catch (error) {
      const errorMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(", ")
        : "Erreur lors de l'action sur le client";
      message.error(errorMessage);
      console.error("Client action error:", error.response?.data);
    }
  };

  // Table columns
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
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()) ||
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
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = getStatusColor(status);
        let text = getStatusText(status);
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
      render: (_, record) => {
        const hasDocuments = clientsWithDocuments[record.id] || false;
        const isEnabled = record.completion >= 100 && hasDocuments;

        const getTooltipMessage = () => {
          if (record.completion < 100) {
            return "Le profil doit être complet (100%)";
          }
          if (!hasDocuments) {
            return "Le client doit avoir au moins un document";
          }
          return "Modifier";
        };

        return (
          <Space>
            {/* <Tooltip title={getTooltipMessage()}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openModal(record)}
                // disabled={!isEnabled}
              />
            </Tooltip> */}
            <Tooltip title="Supprimer">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
            <Tooltip title="Vérifier et signer">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => openVerificationModal(record)}
                style={{
                  color: !isEnabled ? "#d9d9d9" : "green",
                  cursor: !isEnabled ? "not-allowed" : "pointer",
                }}
                // disabled={!isEnabled}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Updated CardView component
  const CardView = ({ data }) => (
    <Row gutter={[24, 24]}>
      {data.map((client) => {
        const hasDocuments = clientsWithDocuments[client.id] || false;
        const isEnabled = client.completion >= 100 && hasDocuments;

        const getTooltipMessage = () => {
          if (client.completion < 100) {
            return "Le profil doit être complet (100%)";
          }
          if (!hasDocuments) {
            return "Le client doit avoir au moins un document";
          }
          return "Modifier";
        };

        return (
          <Col xs={24} sm={12} md={8} lg={6} key={client.key}>
            <Card
              hoverable
              className="client-card h-full"
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              }}
              actions={[
                // <Tooltip title={getTooltipMessage()} key="edit-tooltip">
                //   <span>
                //     <EditOutlined
                //       key="edit"
                //       onClick={isEnabled ? () => openModal(client) : undefined}
                //       style={{
                //         color: !isEnabled ? "#d9d9d9" : "#1890ff",
                //         cursor: !isEnabled ? "not-allowed" : "pointer",
                //       }}
                //     />
                //   </span>
                // </Tooltip>,
                <Tooltip title="Supprimer" key="delete-tooltip">
                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDelete(client)}
                    style={{ color: "#ff4d4f" }}
                  />
                </Tooltip>,
                <Tooltip title="Vérifier et signer" key="verify-tooltip">
                  <span>
                    <CheckOutlined
                      key="verify"
                      onClick={() => openVerificationModal(client)}
                      style={{
                        color: !isEnabled ? "#d9d9d9" : "green",
                        cursor: !isEnabled ? "not-allowed" : "pointer",
                      }}
                    />
                  </span>
                </Tooltip>,
              ]}
            >
              <div className="flex justify-between items-center mb-3">
                <Tag
                  color={getStatusColor(client.status)}
                  style={{ fontSize: "12px", padding: "2px 8px" }}
                >
                  {getStatusText(client.status)}
                </Tag>
                <Tooltip title={`${client.completion}% complet`}>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-1">
                      <div
                        className={`h-2 rounded-full ${
                          client.completion < 50
                            ? "bg-red-500"
                            : client.completion < 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${client.completion}%` }}
                      />
                    </div>
                    <span className="text-xs">{client.completion}%</span>
                  </div>
                </Tooltip>
              </div>

              <Card.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor:
                        client.status === "Actif" ? "#52c41a" : "#f5f5f5",
                      color: client.status === "Actif" ? "white" : "#999",
                    }}
                    size="large"
                  />
                }
                title={
                  <div className="font-semibold text-lg mb-2">
                    {client.name}
                  </div>
                }
                style={{ marginBottom: "16px" }}
              />

              <div className="mt-3">
                <div className="grid grid-cols-[20px_1fr] gap-2 mb-2">
                  <MailOutlined className="text-gray-500" />
                  <div className="text-sm truncate">{client.email}</div>
                </div>

                <div className="grid grid-cols-[20px_1fr] gap-2 mb-2">
                  <PhoneOutlined className="text-gray-500" />
                  <div className="text-sm">{client.phone}</div>
                </div>

                <div className="grid grid-cols-[20px_1fr] gap-2">
                  <HomeOutlined className="text-gray-500" />
                  <div className="text-sm truncate">{client.address}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {!hasDocuments && (
                  <Tag color="orange" style={{ marginRight: 0 }}>
                    Aucun document
                  </Tag>
                )}
                {client.siret && (
                  <Tag color="blue" style={{ marginRight: 0 }}>
                    SIRET: {client.siret.substring(0, 8)}...
                  </Tag>
                )}
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  // Replace the existing ClientVerificationModal component
  const ClientVerificationModal = ({
    client,
    visible,
    onCancel,
    onConfirm,
  }) => {
    const [activeTab, setActiveTab] = useState("info");
    const hasDocuments = clientsWithDocuments[client?.id] || false;
    const isEnabled = client?.completion >= 100 && hasDocuments;

    return (
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold text-gray-800">
              Détails du client
            </span>
            <Tag
              className="text-base px-3 py-1"
              color={getStatusColor(client?.status)}
            >
              {getStatusText(client?.status)}
            </Tag>
          </div>
        }
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Fermer
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={onConfirm}
            icon={<CheckCircleOutlined />}
            disabled={!isEnabled}
          >
            Valider
          </Button>,
        ]}
        width={800}
        className="client-details-modal"
        bodyStyle={{ padding: "24px" }}
      >
        {/* Completion progress bar at the top */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">
              Complétude du profil
            </span>
            <span className="text-gray-700 font-medium">
              {client?.completion}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                client?.completion < 50
                  ? "bg-red-500"
                  : client?.completion < 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${client?.completion}%` }}
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
                  {client?.name || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">SIRET</p>
                <p className="font-medium text-gray-800">
                  {client?.siret || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <MailOutlined className="mr-2 text-gray-400" />
                  {client?.email || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <PhoneOutlined className="mr-2 text-gray-400" />
                  {client?.phone || "Non spécifié"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">N° TVA</p>
                <p className="font-medium text-gray-800">
                  {client?.n_tva || "Non spécifié"}
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
                    {client?.address?.split(",")[0] || "Non spécifié"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Code postal</p>
                  <p className="font-medium text-gray-800">
                    {client?.cp || "Non spécifié"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ville</p>
                  <p className="font-medium text-gray-800">
                    {client?.ville || "Non spécifié"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">Pays</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <GlobalOutlined className="mr-2 text-gray-400" />
                  {client?.pays || "Non spécifié"}
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
              {client ? (
                <ClientDocumentViewer clientId={client.id} />
              ) : (
                <div className="text-center py-3">
                  <p className="text-gray-500">Chargement des documents...</p>
                </div>
              )}

              {!hasDocuments && (
                <div className="text-center py-3">
                  <p className="text-gray-500">Aucun document disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status change notification */}
        {isEnabled && client?.status === "Draft" && (
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

        {!isEnabled && (
          <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <WarningOutlined className="text-yellow-500 text-lg mt-1 mr-3" />
              <div>
                <h4 className="font-medium text-yellow-700 m-0">
                  Profil incomplet
                </h4>
                <p className="text-yellow-600 mt-1 mb-0">
                  {client?.completion < 100
                    ? "Ce profil client est incomplet. Il est nécessaire de renseigner toutes les informations obligatoires (actuellement à " +
                      client?.completion +
                      "%) "
                    : "Les documents requis n'ont pas été fournis. Veuillez vous assurer qu'au moins un document a été ajouté "}
                  avant de pouvoir faire passer ce client au statut "À signer".
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "orange";
      case "à valider":
        return "blue";
      case "à signer":
        return "purple";
      case "Actif":
        return "green";
      case "Inactif":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Draft":
        return "En cours de création";
      case "à valider":
        return "À valider";
      case "à signer":
        return "À signer";
      case "Actif":
        return "Actif";
      case "Inactif":
        return "Inactif";
      default:
        return status;
    }
  };

  // Client Modal Form Component
  const ClientModalForm = () => {
    const [form] = Form.useForm();

    useEffect(() => {
      if (editingClient) {
        form.setFieldsValue({
          raison_sociale: editingClient.name,
          siret: editingClient.siret,
          mail_contact: editingClient.email,
          tel_contact: editingClient.phone,
          adresse: editingClient.address.split(",")[0].trim(),
          cp: editingClient.cp,
          ville: editingClient.ville,
          pays: editingClient.pays,
          statut: editingClient.status,
        });
      } else {
        form.resetFields();
      }
    }, [editingClient, form]);

    return (
      <Modal
        key={`client-modal-${modalKey}`}
        title={editingClient ? "Modifier le Client" : "Nouveau Client"}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        closeIcon={<CloseOutlined />}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleClientAction}
          preserve={false}
        >
          <Form.Item
            name="raison_sociale"
            label="Raison Sociale"
            rules={[
              { required: true, message: "Veuillez saisir la raison sociale" },
            ]}
          >
            <Input placeholder="Nom de l'entreprise" />
          </Form.Item>
          <Form.Item
            name="siret"
            label="SIRET"
            rules={[{ required: true, message: "Veuillez saisir le SIRET" }]}
          >
            <Input placeholder="Numéro SIRET" />
          </Form.Item>
          <Form.Item
            name="mail_contact"
            label="Email"
            rules={[
              { required: true, message: "Veuillez saisir l'email" },
              { type: "email", message: "Veuillez saisir un email valide" },
            ]}
          >
            <Input placeholder="Adresse email de contact" />
          </Form.Item>
          <Form.Item
            name="tel_contact"
            label="Téléphone"
            rules={[
              { required: true, message: "Veuillez saisir le téléphone" },
            ]}
          >
            <Input placeholder="Numéro de téléphone" />
          </Form.Item>
          <Form.Item
            name="adresse"
            label="Adresse"
            rules={[{ required: true, message: "Veuillez saisir l'adresse" }]}
          >
            <Input placeholder="Adresse complète" />
          </Form.Item>
          {!editingClient && (
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[
                { required: true, message: "Veuillez saisir le mot de passe" },
                {
                  min: 8,
                  message:
                    "Le mot de passe doit contenir au moins 8 caractères",
                },
              ]}
            >
              <Input.Password placeholder="Mot de passe" />
            </Form.Item>
          )}
          <Form.Item
            name="pays"
            label="Pays"
            rules={[
              { required: true, message: "Veuillez sélectionner le pays" },
            ]}
          >
            <Input placeholder="Pays" />
          </Form.Item>
          <Form.Item
            name="ville"
            label="Ville"
            rules={[
              { required: true, message: "Veuillez sélectionner la ville" },
            ]}
          >
            <Input placeholder="Ville" />
          </Form.Item>
          <Form.Item
            name="cp"
            label="Code Postal"
            rules={[
              { required: true, message: "Veuillez saisir le code postal" },
            ]}
          >
            <Input placeholder="Code postal" />
          </Form.Item>
          <Form.Item
            name="statut"
            label="Statut"
            rules={[
              { required: true, message: "Veuillez sélectionner le statut" },
            ]}
          >
            <Select placeholder="Sélectionnez le statut">
              <Option value="Draft">En cours de création</Option>
              <Option value="à valider">À valider</Option>
              <Option value="à signer">À signer</Option>
              <Option value="Actif">Actif</Option>
              <Option value="Inactif">Inactif</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {editingClient ? "Mettre à jour" : "Ajouter Client"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // Initialize data
  useEffect(() => {
    fetchClients();
  }, []);

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <Card className="w-full">
      <Space className="w-full flex flex-row items-center justify-between bg-white mb-4">
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
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className="flex flex-row items-center space-x-5">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Nouveau Client
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={fetchClients} />
          </Tooltip>
        </div>
      </Space>

      {viewMode === "table" ? (
        <>
          <Table
            columns={columns}
            dataSource={clients}
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: clients.length,
              pageSize: 10,
              showTotal: (total) => `Total ${total} clients`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            size="middle"
            scroll={{ x: "max-content" }}
          />
          {selectedRowKeys.length > 0 && (
            <div className="mt-4">
              <span>{selectedRowKeys.length} client(s) sélectionné(s)</span>
            </div>
          )}
        </>
      ) : (
        <CardView data={clients} />
      )}
      <ClientModalForm />
      {verifyingClient && (
        <ClientVerificationModal
          client={verifyingClient}
          visible={isVerificationModalVisible}
          onCancel={closeVerificationModal}
          onConfirm={confirmVerification}
        />
      )}
    </Card>
  );
};

export default ClientList;
