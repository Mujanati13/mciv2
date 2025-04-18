import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Upload,
  Button,
  message,
  Space,
  Modal,
  Tag,
  Typography,
  Input,
  Card,
  Avatar,
  Radio,
  Form,
  Select,
  List,
  Divider,
  Tabs,
  Col,
  Row,
  Badge,
  Progress,
  Empty,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  UploadOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileOutlined,
  EditOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Dragger } = Upload;
const { TabPane } = Tabs;

const ClientDocumentManagement = () => {
  const [isTableView, setIsTableView] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [editForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [currentDocType, setCurrentDocType] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState("1");

  // Function to check if a date is within the last 3 months
  const isWithinLastThreeMonths = (dateString) => {
    if (!dateString) return false;
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    
    // Calculate date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    return selectedDate >= threeMonthsAgo;
  };

  // Function to check if document type requires 3-month validation
  const requiresRecentValidation = (docType) => {
    if (!docType) return false;
    
    const typesRequiring3MonthValidation = [
      "KBIS de moins de 3 mois",
      "Attestation de régularité fiscale de moins de 3 mois",
      "Attestation de régularité sociale de moins de 3 mois",
      "kbis",
      "attestation_fiscale", 
      "attestation_sociale"
    ];
    
    return typesRequiring3MonthValidation.some(type => 
      docType.toLowerCase().includes(type.toLowerCase())
    );
  };

  // Required document types with their initial states
  const initialRequiredDocs = [
    {
      key: "kbis",
      name: "KBIS de moins de 3 mois",
      status: "À uploader",
      docId: null,
      icon: <FilePdfOutlined />,
    },
    {
      key: "attestation_fiscale",
      name: "Attestation de régularité fiscale de moins de 3 mois",
      status: "À uploader",
      docId: null,
      icon: <FilePdfOutlined />,
    },
    {
      key: "attestation_sociale",
      name: "Attestation de régularité sociale de moins de 3 mois",
      status: "À uploader",
      docId: null,
      icon: <FilePdfOutlined />,
    },
    {
      key: "rib",
      name: "RIB",
      status: "À uploader",
      docId: null,
      icon: <FilePdfOutlined />,
    },
    // {
    //   key: "dpae",
    //   name: "DPAE",
    //   status: "À uploader",
    //   docId: null,
    //   icon: <FilePdfOutlined />,
    // },
  ];

  const [requiredDocs, setRequiredDocs] = useState(initialRequiredDocs);

  // Calculate document completion percentage
  const calculateCompletionPercentage = () => {
    const validDocs = requiredDocs.filter(
      (doc) => doc.status !== "À uploader"
    ).length;
    return Math.round((validDocs / requiredDocs.length) * 100);
  };

  // Fetch documents
  const fetchDocuments = async () => {
    const id = localStorage.getItem("id");
    try {
      setLoading(true);
      const response = await axios.get(Endponit() + "/api/getDocumentESN/", {
        headers: {
          Authorization: `${token()}`,
        },
        params: {
          esnId: id,
        },
      });

      const fetchedDocs = response.data.data.map((doc) => ({
        ...doc,
        key: doc.ID_DOC_ESN,
      }));

      setDocuments(fetchedDocs);

      // Update status of required documents based on fetched data
      const updatedRequiredDocs = [...initialRequiredDocs];
      fetchedDocs.forEach((doc) => {
        initialRequiredDocs.forEach((reqDoc, index) => {
          if (
            doc.Titre.toLowerCase().includes(reqDoc.name.toLowerCase()) ||
            doc.Titre.toLowerCase().includes(reqDoc.key.toLowerCase())
          ) {
            updatedRequiredDocs[index] = {
              ...reqDoc,
              status: doc.Statut,
              docId: doc.ID_DOC_ESN,
              docUrl: doc.Doc_URL,
              date: doc.Date_Valid,
            };
          }
        });
      });

      setRequiredDocs(updatedRequiredDocs);
    } catch (error) {
      message.error("Erreur lors du chargement des documents");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Add Document Handler
  const handleAddDocument = async (values) => {
    if (!uploadedFileUrl) {
      message.error("Veuillez télécharger un fichier");
      return;
    }

    const id = localStorage.getItem("id");
    try {
      const response = await axios.post(
        Endponit() + "/api/docEsn/",
        { ...values, ID_ESN: id, Doc_URL: uploadedFileUrl },
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );
      message.success("Document ajouté avec succès");
      fetchDocuments();
      setIsEditModalVisible(false);
      setUploadedFileUrl("");
      setIsFileUploaded(false);
    } catch (error) {
      message.error("Erreur lors de l'ajout du document");
      console.error("Add error:", error);
    }
  };

  // Edit Document Handler
  const handleEditDocument = async (values) => {
    try {
      await axios.put(
        `${Endponit()}/api/docEsn/${selectedDocument.ID_DOC_ESN}`,
        {
          ...values,
          ID_DOC_ESN: selectedDocument.ID_DOC_ESN,
          ID_ESN: selectedDocument.ID_ESN,
          Doc_URL: isFileUploaded ? uploadedFileUrl : selectedDocument.Doc_URL,
        },
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );
      message.success("Document modifié avec succès");
      fetchDocuments();
      setIsEditModalVisible(false);
      setUploadedFileUrl("");
      setIsFileUploaded(false);
    } catch (error) {
      message.error("Erreur lors de la modification du document");
      console.error("Edit error:", error);
    }
  };

  // Delete Document Handler
  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce document ?",
      content: `Cette action supprimera définitivement ${record.Titre}`,
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      async onOk() {
        try {
          await axios.delete(`${Endponit()}/api/docEsn/${record.ID_DOC_ESN}`, {
            headers: {
              Authorization: `${token()}`,
            },
          });
          message.success("Document supprimé avec succès");
          fetchDocuments();
        } catch (error) {
          message.error("Erreur lors de la suppression du document");
          console.error("Delete error:", error);
        }
      },
    });
  };

  // Open Edit Modal
  const openEditModal = (record, isNewDocument = false) => {
    setSelectedDocument(record);
    setIsEditModalVisible(true);
    setIsFileUploaded(false);
    setUploadedFileUrl("");

    if (isNewDocument) {
      editForm.resetFields();
    } else {
      editForm.setFieldsValue({
        Titre: record.Titre,
        Description: record.Description,
        Doc_URL: record.Doc_URL,
        Date_Valid: record.Date_Valid,
        Statut: record.Statut,
        Type: record.Type,
        esn: localStorage.getItem("id"),
      });
    }
  };

  // Open Upload Modal for required document
  const openUploadModal = (docType) => {
    setCurrentDocType(docType);
    setIsUploadModalVisible(true);
    setIsFileUploaded(false);
    setUploadedFileUrl("");
    uploadForm.resetFields();
  };

  // Upload handler for required documents
  const handleUploadRequiredDoc = async (values) => {
    if (!uploadedFileUrl) {
      message.error("Veuillez télécharger un fichier");
      return;
    }

    try {
      // Find if document already exists and needs update
      const existingDocIndex = requiredDocs.findIndex(
        (doc) => doc.key === currentDocType.key
      );
      const existingDoc = requiredDocs[existingDocIndex];

      let response;
      if (existingDoc.docId) {
        // Update existing document
        const documentData = {
          Titre: currentDocType.name,
          Description: `Document obligatoire: ${currentDocType.name}`,
          ID_ESN: localStorage.getItem("id"),
          ID_DOC_ESN: existingDoc.docId,
          Doc_URL: uploadedFileUrl,
          Statut: "En attente",
          Date_Valid:
            values.Date_Valid || new Date().toISOString().split("T")[0],
          Type: currentDocType.name,
        };

        response = await axios.put(
          `${Endponit()}/api/docEsn/${existingDoc.docId}`,
          documentData,
          {
            headers: {
              Authorization: `${token()}`,
            },
          }
        );
        message.success(
          `Document ${currentDocType.name} mis à jour avec succès`
        );
      } else {
        // Create new document
        const documentData = {
          Titre: currentDocType.name,
          Description: `Document obligatoire: ${currentDocType.name}`,
          ID_ESN: localStorage.getItem("id"),
          Doc_URL: uploadedFileUrl,
          Statut: "En attente",
          Date_Valid:
            values.Date_Valid || new Date().toISOString().split("T")[0],
          Type: currentDocType.name,
        };

        response = await axios.post(Endponit() + "/api/docEsn/", documentData, {
          headers: {
            Authorization: `${token()}`,
          },
        });
        message.success(`Document ${currentDocType.name} ajouté avec succès`);
      }

      // Update document status locally
      const updatedDocs = [...requiredDocs];
      updatedDocs[existingDocIndex] = {
        ...updatedDocs[existingDocIndex],
        status: "En attente",
        docId: response.data.ID_DOC_ESN || existingDoc.docId,
        docUrl: uploadedFileUrl,
        date: values.Date_Valid || new Date().toISOString().split("T")[0],
      };
      setRequiredDocs(updatedDocs);

      fetchDocuments();
      setIsUploadModalVisible(false);
      setUploadedFileUrl("");
      setIsFileUploaded(false);
      setCurrentDocType(null);
    } catch (error) {
      message.error("Erreur lors de l'ajout du document");
      console.error("Upload error:", error);
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status) {
      case "Validé":
        return (
          <CheckCircleOutlined style={{ color: "green", fontSize: "20px" }} />
        );
      case "En attente":
        return (
          <ClockCircleOutlined style={{ color: "orange", fontSize: "20px" }} />
        );
      case "À uploader":
        return (
          <ExclamationCircleOutlined
            style={{ color: "red", fontSize: "20px" }}
          />
        );
      default:
        return (
          <ExclamationCircleOutlined
            style={{ color: "red", fontSize: "20px" }}
          />
        );
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Validé":
        return "success";
      case "En attente":
        return "warning";
      case "À uploader":
      default:
        return "error";
    }
  };

  // Upload configuration
  const uploadProps = {
    name: "uploadedFile",
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "./upload");

      try {
        const saveDocResponse = await axios.post(
          Endponit() + "/api/saveDoc/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `${token()}`,
            },
            onUploadProgress: (progressEvent) => {
              const percent = Math.floor(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              onProgress({ percent });
            },
          }
        );

        if (saveDocResponse.data && saveDocResponse.data.path) {
          setUploadedFileUrl(saveDocResponse.data.path);
          setIsFileUploaded(true);
          onSuccess(saveDocResponse.data);
          message.success(`${file.name} fichier téléchargé avec succès`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        onError(error);
        message.error(`${file.name} échec du téléchargement.`);
      }
    },
    beforeUpload: (file) => {
      const isPDForDOC =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isPDForDOC) {
        message.error(`${file.name} n'est pas un fichier PDF ou DOC`);
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Le fichier doit être inférieur à 10MB!");
        return false;
      }

      return isPDForDOC && isLt10M;
    },
    onChange: (info) => {
      if (info.file.status === "error") {
        message.error(`${info.file.name} échec du téléchargement.`);
      }
    },
  };

  // Table columns configuration
  const columns = [
    {
      title: "Titre",
      dataIndex: "Titre",
      key: "Titre",
      sorter: (a, b) => a.Titre.localeCompare(b.Titre),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "Type",
      key: "Type",
      render: (type) => type || "Non spécifié",
    },
    {
      title: "Date Validité",
      dataIndex: "Date_Valid",
      key: "Date_Valid",
      render: (date) => date || "Non spécifiée",
    },
    {
      title: "Statut",
      dataIndex: "Statut",
      key: "Statut",
      render: (status) => (
        <Tag
          color={
            status === "Validé"
              ? "success"
              : status === "En attente"
              ? "warning"
              : "error"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          {record.Doc_URL && (
            <Tooltip title="Voir le document">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="small"
                onClick={() =>
                  window.open(Endponit() + "/media/" + record.Doc_URL, "_blank")
                }
              />
            </Tooltip>
          )}
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Search Filter
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.Titre.toLowerCase().includes(searchText.toLowerCase()) ||
      (doc.esn && doc.esn.toLowerCase().includes(searchText.toLowerCase())) ||
      (doc.Type && doc.Type.toLowerCase().includes(searchText.toLowerCase())) ||
      doc.Statut.toLowerCase().includes(searchText.toLowerCase())
  );

  // Tab change handler
  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };

  const completionPercentage = calculateCompletionPercentage();

  return (
    <div className="p-4">
      <Tabs activeKey={activeTabKey} onChange={handleTabChange} type="card">
        <TabPane
          tab={
            <span>
              <Badge
                count={
                  requiredDocs.filter((doc) => doc.status === "À uploader")
                    .length
                }
                offset={[15, 0]}
              >
                Documents Obligatoires
              </Badge>
            </span>
          }
          key="1"
        >
          <Card>
            <List
              itemLayout="horizontal"
              dataSource={requiredDocs}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => openUploadModal(item)}
                    >
                      {item.status === "À uploader"
                        ? "Uploader"
                        : "Mettre à jour"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={item.icon}
                        style={{
                          backgroundColor:
                            item.status === "Validé" ? "#52c41a" : "#1890ff",
                        }}
                        size="large"
                      />
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Text strong>{item.name}</Text>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status}
                        </Tag>
                      </div>
                    }
                    description={
                      <>
                        {item.status !== "À uploader" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "16px",
                              marginTop: "8px",
                            }}
                          >
                            {item.date && (
                              <Text type="secondary">
                                <span style={{ marginRight: "5px" }}>
                                  Date de validité:
                                </span>
                                {item.date}
                              </Text>
                            )}
                            {item.docUrl && (
                              <a
                                href={Endponit() + "/media/" + item.docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileOutlined /> Voir le document
                              </a>
                            )}
                          </div>
                        ) : (
                          <Text
                            type="secondary"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <InfoCircleOutlined /> Ce document est requis pour
                            finaliser votre dossier
                          </Text>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Edit/Add Document Modal */}
      <Modal
        title={
          selectedDocument?.ID_DOC_ESN
            ? "Modifier le Document"
            : "Ajouter un Document"
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setUploadedFileUrl("");
          setIsFileUploaded(false);
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={
            selectedDocument?.ID_DOC_ESN
              ? handleEditDocument
              : handleAddDocument
          }
        >
          <Form.Item
            name="Titre"
            label="Titre"
            rules={[{ required: true, message: "Veuillez saisir un titre" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="Type"
            label="Type de Document"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un type de document",
              },
            ]}
          >
            <Select placeholder="Sélectionner un type de document">
              <Option value="KBIS de moins de 3 mois">
                KBIS de moins de 3 mois
              </Option>
              <Option value="Attestation de régularité fiscale de moins de 3 mois">
                Attestation de régularité fiscale de moins de 3 mois
              </Option>
              <Option value="Attestation de régularité sociale de moins de 3 mois">
                Attestation de régularité sociale de moins de 3 mois
              </Option>
              <Option value="RIB">RIB</Option>
              <Option value="DPAE">DPAE</Option>
              <Option value="Autre">Autre</Option>
            </Select>
          </Form.Item>

          <Form.Item name="Description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Document">
            {selectedDocument?.Doc_URL && (
              <div
                className="mb-3 p-3"
                style={{ backgroundColor: "#f5f5f5", borderRadius: "4px" }}
              >
                Document actuel:{" "}
                <a
                  href={Endponit() + "/media/" + selectedDocument?.Doc_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileOutlined /> Voir le document
                </a>
              </div>
            )}

            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Cliquez ou déposez un fichier ici
              </p>
              <p className="ant-upload-hint">
                Formats acceptés: PDF, DOC, DOCX - Taille maximale: 10MB
              </p>
            </Dragger>

            {isFileUploaded && (
              <div
                className="mt-2 p-2"
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: "4px",
                  border: "1px solid #b7eb8f",
                }}
              >
                <CheckCircleOutlined style={{ color: "green" }} /> Fichier
                téléchargé avec succès
              </div>
            )}
          </Form.Item>

          <Form.Item 
            name="Date_Valid" 
            label="Date de Validité"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const docType = getFieldValue('Type');
                  if (!value || !requiresRecentValidation(docType)) {
                    return Promise.resolve();
                  }
                  if (isWithinLastThreeMonths(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('La date doit être dans les 3 derniers mois'));
                },
              }),
            ]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="Statut"
            label="Statut"
            rules={[
              { required: true, message: "Veuillez sélectionner un statut" },
            ]}
          >
            <Select>
              <Option value="Validé">Validé</Option>
              <Option value="En attente">En attente</Option>
              <Option value="Expiré">Expiré</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={
                  selectedDocument?.ID_DOC_ESN ? (
                    <EditOutlined />
                  ) : (
                    <UploadOutlined />
                  )
                }
                disabled={!selectedDocument?.ID_DOC_ESN && !isFileUploaded}
              >
                {selectedDocument?.ID_DOC_ESN ? "Modifier" : "Ajouter"}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setUploadedFileUrl("");
                  setIsFileUploaded(false);
                }}
              >
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Required Document Modal */}
      <Modal
        title={`Uploader ${currentDocType?.name || "document"}`}
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setUploadedFileUrl("");
          setIsFileUploaded(false);
          setCurrentDocType(null);
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUploadRequiredDoc}
        >
          <div
            className="mb-4 p-3"
            style={{ backgroundColor: "#f0f9ff", borderRadius: "8px" }}
          >
            <Text strong>
              <InfoCircleOutlined /> À propos de ce document
            </Text>
            <p style={{ marginTop: "8px", marginBottom: "0" }}>
              {currentDocType?.name} - Ce document est requis pour la conformité
              de votre dossier.
            </p>
          </div>

          <Form.Item label="Document">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Cliquez ou déposez un fichier ici
              </p>
              <p className="ant-upload-hint">
                Formats acceptés: PDF, DOC, DOCX - Taille maximale: 10MB
              </p>
            </Dragger>
            {isFileUploaded && (
              <div
                className="mt-2 p-2"
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: "4px",
                  border: "1px solid #b7eb8f",
                }}
              >
                <CheckCircleOutlined style={{ color: "green" }} /> Fichier
                téléchargé avec succès
              </div>
            )}
          </Form.Item>

          <Form.Item 
            name="Date_Valid" 
            label="Date de Validité"
            rules={[
              {
                validator(_, value) {
                  if (!value || !requiresRecentValidation(currentDocType?.key || currentDocType?.name)) {
                    return Promise.resolve();
                  }
                  if (isWithinLastThreeMonths(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('La date doit être dans les 3 derniers mois'));
                },
              },
            ]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!isFileUploaded}
                icon={<UploadOutlined />}
              >
                Soumettre
              </Button>
              <Button
                onClick={() => {
                  setIsUploadModalVisible(false);
                  setUploadedFileUrl("");
                  setIsFileUploaded(false);
                  setCurrentDocType(null);
                }}
              >
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientDocumentManagement;