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
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const DocumentManagement = () => {
  const [isTableView, setIsTableView] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [editForm] = Form.useForm();

  // Fetch documents
  const fetchDocuments = async () => {
    const id = localStorage.getItem("id");
    try {
      setLoading(true);
      const response = await axios.get(Endponit() + "/api/getDocumentClient/", {
        headers: {
          Authorization: `${token()}`,
        },
        params: {
          ClientId: id,
        },
      });
      setDocuments(
        response.data.data.map((doc) => ({
          ...doc,
          key: doc.ID_DOC_ESN,
        }))
      );
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

    try {
      const documentData = {
        ...values,
        ID_CLT: localStorage.getItem("id"),
        Doc_URL: uploadedFileUrl,
      };

      const response = await axios.post(
        Endponit() + "/api/documentClient/",
        documentData,
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
      const documentData = {
        ...values,
        ID_CLT: localStorage.getItem("id"),
        ID_DOC_CLT: selectedDocument?.ID_DOC_CLT,
        Doc_URL: isFileUploaded ? uploadedFileUrl : selectedDocument?.Doc_URL, // Use new URL only if file was uploaded
      };

      const response = await axios.put(
        Endponit() + "/api/documentClient/",
        documentData,
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
          await axios.delete(
            `${Endponit()}/api/documentClient/${record.ID_DOC_CLT}`,
            {
              headers: {
                Authorization: `${token()}`,
              },
            }
          );
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
        Date_Valid: record.Date_Valid,
        Statut: record.Statut,
        esn: record.esn,
      });
    }
  };

  // Upload configuration
  const uploadProps = {
    name: "uploadedFile",
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "./upload/");

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
  };

  // Table columns configuration
  const columns = [
    {
      title: "Titre",
      dataIndex: "Titre",
      key: "Titre",
      sorter: (a, b) => a.Titre.localeCompare(b.Titre),
    },
    {
      title: "Date Validité",
      dataIndex: "Date_Valid",
      key: "Date_Valid",
    },
    {
      title: "Statut",
      dataIndex: "Statut",
      key: "Statut",
      render: (status) => (
        <Tag color={status === "Validé" ? "green" : "orange"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  // Search Filter
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.Titre.toLowerCase().includes(searchText.toLowerCase()) ||
      (doc.esn && doc.esn.toLowerCase().includes(searchText.toLowerCase())) ||
      doc.Statut.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-1">
      <div className="mb-5">
        <Radio.Group
          value={isTableView}
          onChange={(e) => setIsTableView(!isTableView)}
          buttonStyle="solid"
        >
          <Radio.Button value={true}>Tableau</Radio.Button>
          <Radio.Button value={false}>Cartes</Radio.Button>
        </Radio.Group>
      </div>
      <div className="flex justify-between mb-5">
        <Search
          placeholder="Rechercher un document..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          icon={<UploadOutlined />}
          type="primary"
          onClick={() => openEditModal({}, true)}
        >
          Ajouter un Document
        </Button>
      </div>

      {isTableView ? (
        <Table
          columns={columns}
          dataSource={filteredDocuments}
          pagination={{ pageSize: 10 }}
          bordered
          loading={loading}
        />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.ID_DOC_ESN}
              style={{ width: 300 }}
              actions={[
                <EditOutlined key="edit" onClick={() => openEditModal(doc)} />,
                <DeleteOutlined
                  key="delete"
                  onClick={() => handleDelete(doc)}
                />,
              ]}
            >
              <Card.Meta
                avatar={<Avatar icon={<FileOutlined />} />}
                title={doc.Titre}
                description={
                  <>
                    <p>Date Validité: {doc.Date_Valid}</p>
                    <p>
                      Statut:{" "}
                      <Tag color={doc.Statut === "Validé" ? "green" : "orange"}>
                        {doc.Statut}
                      </Tag>
                    </p>
                    <a
                      href={doc.Doc_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir le document
                    </a>
                  </>
                }
              />
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Add Document Modal */}
      <Modal
        title={
          selectedDocument?.ID_DOC_CLT
            ? "Modifier le Document"
            : "Ajouter un Document"
        }
        visible={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setUploadedFileUrl("");
          setIsFileUploaded(false);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={
            selectedDocument?.ID_DOC_CLT
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

          <Form.Item name="Description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Document">
            {
              <p>
                Document actuel:{" "}
                <a
                  href={Endponit() + "/media/" + selectedDocument?.Doc_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir le document
                </a>
              </p>
            }

            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {selectedDocument?.ID_DOC_CLT
                  ? "Déposez un nouveau fichier pour remplacer l'actuel (optionnel)"
                  : "Cliquez ou déposez un fichier ici"}
              </p>
              <p className="ant-upload-hint">Taille maximale: 10MB</p>
            </Dragger>
          </Form.Item>

          <Form.Item name="Date_Valid" label="Date de Validité">
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
            <Button type="primary" htmlType="submit">
              {selectedDocument?.ID_DOC_ESN ? "Modifier" : "Ajouter"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagement;
