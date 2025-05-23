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
  Select,
  Upload,
  Switch,
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
  UploadOutlined,
  FilePdfOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  CompassOutlined,
  LinkedinOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";

const { Dragger } = Upload;
const { Option } = Select;
const API_URL = Endponit() + "/api/collaborateur/";
const UPLOAD_URL = Endponit() + "/api/saveDoc/";

// CV Upload component to reduce duplication
const CVUploader = ({
  fileList,
  setFileList,
  setIsFileUploaded,
  setUploadedFileUrl,
}) => {
  const uploadProps = {
    name: "uploadedFile",
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "./uploads/cv/");

      try {
        const response = await axios.post(UPLOAD_URL, formData, {
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
        });

        if (response.data?.path) {
          setUploadedFileUrl(response.data.path);
          setIsFileUploaded(true);
          setFileList([
            {
              uid: "-1",
              name: file.name,
              status: "done",
              originFileObj: file,
            },
          ]);
          onSuccess(response.data);
          message.success(`${file.name} téléchargé avec succès`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        onError(error);
        message.error(`${file.name} échec du téléchargement.`);
      }
    },
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      if (!isPDF) {
        message.error("Vous pouvez seulement télécharger des fichiers PDF!");
        return false;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Le CV doit être inférieur à 5MB!");
        return false;
      }

      return isPDF && isLt5M;
    },
    onChange: (info) => {
      if (info.file.status === "error") {
        message.error(`${info.file.name} échec du téléchargement.`);
      }
    },
    fileList,
  };

  return (
    <Dragger {...uploadProps}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
      </p>
      <p className="ant-upload-text">Cliquez ou déposez un fichier PDF ici</p>
      <p className="ant-upload-hint">
        Format accepté: PDF - Taille maximale: 5MB
      </p>
    </Dragger>
  );
};

// Common form fields for adding/editing collaborators
const CollaboratorFormFields = ({ form, isEdit = false }) => (
  <>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="Nom"
          name="Nom"
          rules={[{ required: true, message: "Veuillez saisir le nom" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="Prénom"
          name="Prenom"
          rules={[{ required: true, message: "Veuillez saisir le prénom" }]}
        >
          <Input />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Veuillez saisir un email" },
            { type: "email", message: "Veuillez saisir un email valide" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="exemple@domaine.com" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="Mot de passe"
          name="password"
          rules={[
            { required: !isEdit, message: "Veuillez saisir un mot de passe" },
            {
              min: 6,
              message: "Le mot de passe doit contenir au moins 6 caractères",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Mot de passe"
          />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="Date de naissance"
          name="Date_naissance"
          rules={[
            { required: true, message: "Veuillez saisir la date de naissance" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const birthDate = new Date(value);
                const today = new Date();
                const ageInYears =
                  (today - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
                return ageInYears < 18
                  ? Promise.reject("L'âge doit être supérieur ou égal à 18 ans")
                  : Promise.resolve();
              },
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="Rôle"
          name="Poste"
          rules={[{ required: true, message: "Veuillez saisir le Rôle" }]}
        >
          <Select placeholder="Sélectionnez un Rôle">
            <Option value="consultant">Consultant</Option>
            <Option value="commercial">Commercial</Option>
            <Option value="administrateur">Administrateur</Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Date de recrutement" name="date_debut_activ">
          <Input type="date" />
        </Form.Item>
      </Col>
      {/* <Col span={12}>
        <Form.Item label="Téléphone" name="Telephone">
          <Input prefix={<PhoneOutlined />} placeholder="+212 6XX XXXXXX" />
        </Form.Item>
      </Col> */}
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Mobilité" name="Mobilité">
          <Select placeholder="Sélectionnez la mobilité">
            <Option value="National">National</Option>
            <Option value="International">International</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Profil LinkedIn" name="LinkedIN">
          <Input
            prefix={<LinkedinOutlined />}
            placeholder="https://www.linkedin.com/in/username"
          />
        </Form.Item>
      </Col>
    </Row>

    {isEdit && (
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="Actif" label="Statut" valuePropName="checked">
            <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
          </Form.Item>
        </Col>
      </Row>
    )}
  </>
);

// Action Buttons Component
const ActionButtons = ({ record, handleDelete, fetchCollaborators }) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const showEditModal = () => {
    setIsEditModalVisible(true);
    editForm.setFieldsValue({
      ...record,
      Password: "", // Clear password field for security
    });
    setIsFileUploaded(false);
    setUploadedFileUrl("");

    // Check if the collaborator has a CV
    if (record.CV) {
      setFileList([
        {
          uid: "-1",
          name: "CV existant",
          status: "done",
          url: record.CV,
        },
      ]);
    } else {
      setFileList([]);
    }
  };

  const handleEdit = async () => {
    try {
      setUploading(true);
      const values = await editForm.validateFields();

      // Only include password if it was changed
      const updatedData = {
        ...record,
        ...values,
        Actif: values.Actif !== undefined ? values.Actif : record.Actif,
      };

      // If password field is empty, don't send it
      if (!values.Password) {
        delete updatedData.Password;
      }

      // Send the updated data to the server
      await axios.put(API_URL, updatedData, {
        headers: { Authorization: token() },
      });

      // Handle CV upload if there's a new file
      if (isFileUploaded) {
        const formData = new FormData();
        formData.append("file", fileList[0].originFileObj);
        formData.append("type", "cv");
        formData.append("entity_id", record.ID_collab);
        formData.append("entity_type", "collaborateur");
        formData.append("path", "./uploads/cv/");
      }

      message.success("Collaborateur mis à jour avec succès");
      fetchCollaborators();
      setIsEditModalVisible(false);
      setIsFileUploaded(false);
      setUploadedFileUrl("");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du collaborateur:", error);
      message.error("Erreur lors de la mise à jour du collaborateur");
    } finally {
      setUploading(false);
    }
  };

  const viewCV = () => {
    if (record.CV) {
      window.open(Endponit() + "/media/" + record.CV, "_blank");
    } else {
      message.info("Aucun CV disponible pour ce collaborateur");
    }
  };

  return (
    <>
      <Space size="middle">
        <Tooltip title="Modifier">
          <Button type="text" icon={<EditOutlined />} onClick={showEditModal} />
        </Tooltip>
        <Tooltip title="Supprimer">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Tooltip>
        <Dropdown
          menu={{
            items: [
              {
                key: "1",
                label: "Voir détails",
                onClick: () => {
                  Modal.info({
                    title: null,
                    className: "collaborator-details-modal",
                    width: 520,
                    icon: null,
                    content: (
                      <div style={{ margin: "-20px -24px" }}>
                        {/* Header with background color */}
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                            padding: "30px 24px 40px",
                            borderTopLeftRadius: "2px",
                            borderTopRightRadius: "2px",
                            position: "relative",
                            marginBottom: 60,
                          }}
                        >
                          <h2
                            style={{
                              color: "white",
                              margin: 0,
                              fontSize: 20,
                              marginBottom: 5,
                              textAlign: "center",
                            }}
                          >
                            Détails du Collaborateur
                          </h2>
                        </div>

                        {/* Avatar positioned to overlap header & content */}
                        <div
                          style={{
                            position: "absolute",
                            top: 80,
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Avatar
                            size={100}
                            icon={<UserOutlined />}
                            style={{
                              backgroundColor: "white",
                              color: "#1890ff",
                              border: "4px solid white",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          />
                          <h2
                            style={{
                              margin: "12px 0 4px",
                              fontSize: 18,
                              fontWeight: "bold",
                            }}
                          >
                            {record.fullName}
                          </h2>
                        </div>

                        {/* Information Content */}
                        <div style={{ padding: "80px 24px 24px" }}>
                          {/* Info cards in a grid */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: "16px",
                              marginBottom: "24px",
                            }}
                          >
                            {/* Role Information */}
                            <InfoCard
                              icon={<UserOutlined />}
                              label="Rôle"
                              value={record.Poste}
                              color="#1890ff"
                            />
                            <InfoCard
                              icon={<CalendarOutlined />}
                              label="Date de Début"
                              value={record.date_debut_activ}
                              color="#1890ff"
                            />
                            <InfoCard
                              icon={<CalendarOutlined />}
                              label="Date de Naissance"
                              value={record.Date_naissance}
                              color="#52c41a"
                            />
                            <InfoCard
                              icon={<UserOutlined />}
                              label="Rôle"
                              value={[
                                record.Admin ? "Admin" : null,
                                record.Commercial ? "Commercial" : null,
                                record.Consultant ? "Consultant" : null,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                              color="#52c41a"
                            />
                            <InfoCard
                              icon={<CalendarOutlined />}
                              label="Date de Fin"
                              value={record.date_dé}
                              color="#ff4d4f"
                            />
                            <InfoCard
                              icon={<CompassOutlined />}
                              label="Mobilité"
                              value={record.Mobilité}
                              color="#1890ff"
                            />
                            <InfoCard
                              icon={<CheckCircleOutlined />}
                              label="Disponibilité"
                              value={record.Disponibilité}
                              color="#52c41a"
                            />
                            <InfoCard
                              icon={<LinkedinOutlined />}
                              label="LinkedIn"
                              value={
                                record.LinkedIN ? (
                                  <a
                                    href={record.LinkedIN}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Voir profil
                                  </a>
                                ) : (
                                  "Non spécifié"
                                )
                              }
                              color="#0073b1"
                            />
                          </div>

                          {/* Additional contacts if available */}
                          {(record.Email || record.Telephone) && (
                            <div
                              style={{
                                background: "#f9f9f9",
                                borderRadius: "8px",
                                padding: "16px",
                                marginBottom: "24px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  marginBottom: "12px",
                                }}
                              >
                                Contact
                              </div>

                              {record.Email && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <MailOutlined
                                    style={{
                                      marginRight: "10px",
                                      color: "#1890ff",
                                    }}
                                  />
                                  <a href={`mailto:${record.Email}`}>
                                    {record.Email}
                                  </a>
                                </div>
                              )}

                              {record.Telephone && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <PhoneOutlined
                                    style={{
                                      marginRight: "10px",
                                      color: "#1890ff",
                                    }}
                                  />
                                  <a href={`tel:${record.Telephone}`}>
                                    {record.Telephone}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* CV Button */}
                          {record.CV && (
                            <div style={{ textAlign: "center" }}>
                              <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
                                onClick={viewCV}
                                size="large"
                                style={{
                                  height: "42px",
                                  paddingLeft: "24px",
                                  paddingRight: "24px",
                                  boxShadow: "0 2px 0 rgba(0,0,0,0.045)",
                                }}
                              >
                                Voir CV
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                    okText: "Fermer",
                  });
                },
              },
              {
                key: "2",
                label: "Voir CV",
                onClick: viewCV,
                disabled: !record.CV,
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      </Space>

      {/* Edit Modal */}
      <Modal
        title="Modifier le Collaborateur"
        visible={isEditModalVisible}
        onOk={handleEdit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setIsFileUploaded(false);
          setUploadedFileUrl("");
        }}
        okText="Mettre à jour"
        cancelText="Annuler"
        confirmLoading={uploading}
        width={700}
      >
        <Form form={editForm} layout="vertical">
          <CollaboratorFormFields form={editForm} isEdit={true} />

          <Form.Item
            label="CV"
            name="CV"
            tooltip="Mettre à jour le CV du collaborateur (format PDF, max 5MB)"
          >
            {record.CV && !isFileUploaded && (
              <div
                className="mb-3 p-3"
                style={{ backgroundColor: "#f5f5f5", borderRadius: "4px" }}
              >
                CV actuel:{" "}
                <a
                  href={Endponit() + "/media/" + record.CV}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FilePdfOutlined /> Voir le CV
                </a>
              </div>
            )}

            <CVUploader
              fileList={fileList}
              setFileList={setFileList}
              setIsFileUploaded={setIsFileUploaded}
              setUploadedFileUrl={setUploadedFileUrl}
            />

            {isFileUploaded && (
              <div
                className="mt-2 p-2"
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: "4px",
                  border: "1px solid #b7eb8f",
                }}
              >
                <CheckCircleOutlined style={{ color: "green" }} /> CV téléchargé
                avec succès
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// Helper component for displaying information cards in the details modal
const InfoCard = ({ icon, label, value, color }) => (
  <div
    style={{
      background: "#f5f5f5",
      borderRadius: "8px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    {React.cloneElement(icon, {
      style: { fontSize: "24px", color, marginBottom: "8px" },
    })}
    <div style={{ fontSize: "13px", color: "#8c8c8c", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ fontSize: "16px", fontWeight: "500" }}>
      {value || "Non spécifié"}
    </div>
  </div>
);

// Card View Component
const CardView = ({ data, handleDelete, fetchCollaborators }) => (
  <Row gutter={[16, 16]}>
    {data.map((collaborator) => (
      <Col xs={24} sm={12} md={8} lg={6} key={collaborator.ID_collab}>
        <Card
          hoverable
          actions={[
            <EditOutlined
              key="edit"
              onClick={() => {
                const actionButtons = document.querySelector(
                  `[data-row-key="${collaborator.ID_collab}"] .ant-table-cell-fix-right`
                );
                if (actionButtons) {
                  const editButton = actionButtons.querySelector(
                    ".ant-btn:first-child"
                  );
                  if (editButton) editButton.click();
                }
              }}
            />,
            <DeleteOutlined
              key="delete"
              onClick={() => handleDelete(collaborator)}
            />,
            <FilePdfOutlined
              key="cv"
              onClick={() => {
                if (collaborator.CV) {
                  window.open(
                    Endponit() + "/media/" + collaborator.CV,
                    "_blank"
                  );
                } else {
                  message.info("Aucun CV disponible pour ce collaborateur");
                }
              }}
              style={{ color: collaborator.CV ? "#1890ff" : "#d9d9d9" }}
            />,
          ]}
        >
          <Card.Meta
            avatar={<Avatar icon={<UserOutlined />} size={64} />}
            title={`${collaborator.Nom} ${collaborator.Prenom}`}
            description={
              <Space direction="vertical" size="small">
                <Tag color={collaborator.Actif ? "green" : "red"}>
                  {collaborator.Actif ? "Actif" : "Inactif"}
                </Tag>
                <Space>{collaborator.Poste}</Space>
                {collaborator.Email && (
                  <div style={{ fontSize: "12px" }}>
                    <MailOutlined style={{ marginRight: "5px" }} />
                    {collaborator.Email}
                  </div>
                )}
              </Space>
            }
          />
        </Card>
      </Col>
    ))}
  </Row>
);

// Add Collaborator Modal Component
const AddCollaboratorModal = ({ fetchCollaborators }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
    setIsFileUploaded(false);
    setUploadedFileUrl("");
    setFileList([]);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();

      // Create the collaborator with email, password and CV URL
      const newCollaborator = {
        ID_ESN: localStorage.getItem("id"),
        ...values,
        Actif: true,
        CV: uploadedFileUrl,
        date_debut_activ:
          values.date_debut_activ || new Date().toISOString().split("T")[0],
      };

      const response = await axios.post(API_URL, newCollaborator, {
        headers: { Authorization: `${token()}` },
      });

      message.success("Nouveau collaborateur ajouté avec succès");
      fetchCollaborators();
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      setIsFileUploaded(false);
      setUploadedFileUrl("");
    } catch (error) {
      console.error("Error adding collaborator:", error);
      message.error("Erreur lors de l'ajout du collaborateur");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
        Nouveau Collaborateur
      </Button>
      <Modal
        title="Ajouter un collaborateur"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setFileList([]);
          setIsFileUploaded(false);
          setUploadedFileUrl("");
        }}
        okText="Ajouter"
        cancelText="Annuler"
        confirmLoading={uploading}
        width={700}
      >
        <Form form={form} layout="vertical" name="add_collaborator">
          <CollaboratorFormFields form={form} />

          <Form.Item
            label="CV"
            name="CV"
            help={isFileUploaded ? null : "Ce champ est obligatoire"}
            // rules={[{ required: true, message: "Veuillez uploader un CV" }]}
            tooltip="Téléchargez le CV du collaborateur (format PDF, max 5MB)"
          >
            <CVUploader
              fileList={fileList}
              setFileList={setFileList}
              setIsFileUploaded={setIsFileUploaded}
              setUploadedFileUrl={setUploadedFileUrl}
            />

            {isFileUploaded && (
              <div
                className="mt-2 p-2"
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: "4px",
                  border: "1px solid #b7eb8f",
                }}
              >
                <CheckCircleOutlined style={{ color: "green" }} /> CV téléchargé
                avec succès
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// Main component
const CollaboratorList = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // Utility function to calculate experience
  const calculateExperience = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    let years = today.getFullYear() - start.getFullYear();
    if (
      today.getMonth() < start.getMonth() ||
      (today.getMonth() === start.getMonth() &&
        today.getDate() < start.getDate())
    ) {
      years--;
    }
    return Math.max(0, years);
  };

  // Fetch collaborators
  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        Endponit() +
          "/api/consultants_par_esn/?esn_id=" +
          localStorage.getItem("id"),
        { headers: { Authorization: `${token()}` } }
      );

      const formattedData = response.data.data.map((collab) => ({
        ...collab,
        key: collab.ID_collab,
        fullName: `${collab.Nom} ${collab.Prenom}`,
        status: collab.Actif ? "actif" : "inactif",
      }));

      setCollaborators(formattedData);
    } catch (error) {
      message.error("Erreur lors du chargement des collaborateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  // Delete Collaborator
  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce collaborateur ?",
      content: `Cette action supprimera définitivement ${record.fullName}.`,
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      async onOk() {
        try {
          await axios.delete(`${API_URL}${record.ID_collab}`, {
            headers: { Authorization: `${token()}` },
          });
          message.success("Collaborateur supprimé avec succès");
          fetchCollaborators();
        } catch (error) {
          message.error("Erreur lors de la suppression du collaborateur");
        }
      },
    });
  };

  // Columns for Table View
  const columns = [
    {
      title: "ID",
      dataIndex: "ID_collab",
      key: "ID_collab",
      sorter: (a, b) => a.ID_collab - b.ID_collab,
      width: 80,
    },
    {
      title: "Nom Complet",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.fullName.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "Email",
    },
    {
      title: "Rôle",
      dataIndex: "Poste",
      key: "Poste",
    },
    {
      title: "Date de recrutement",
      dataIndex: "date_debut_activ",
      key: "date_debut_activ",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "actif" ? "green" : "red"}>
          {status === "actif" ? "Actif" : "Inactif"}
        </Tag>
      ),
      filters: [
        { text: "Actif", value: "actif" },
        { text: "Inactif", value: "inactif" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "CV",
      key: "cv",
      render: (_, record) => (
        <Button
          type="link"
          icon={<FilePdfOutlined />}
          disabled={!record.CV}
          onClick={() => {
            if (record.CV) {
              window.open(Endponit() + "/media/" + record.CV, "_blank");
            }
          }}
        >
          {record.CV ? "Voir CV" : "Pas de CV"}
        </Button>
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
          fetchCollaborators={fetchCollaborators}
        />
      ),
    },
  ];

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
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className="flex flex-row items-center space-x-5">
          <AddCollaboratorModal fetchCollaborators={fetchCollaborators} />
          <Button
            icon={<ExportOutlined />}
            onClick={() => message.info("Exporter les données")}
          >
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={fetchCollaborators} />
          </Tooltip>
        </div>
      </Space>
      <div className="mt-5"></div>
      {viewMode === "table" ? (
        <Table
          columns={columns}
          dataSource={collaborators}
          loading={loading}
          pagination={{
            total: collaborators.length,
            pageSize: 7,
            showTotal: (total) => `Total ${total} collaborateurs`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          size="small"
          scroll={{ x: "max-content" }}
          rowKey="ID_collab"
        />
      ) : (
        <CardView
          data={collaborators}
          handleDelete={handleDelete}
          fetchCollaborators={fetchCollaborators}
        />
      )}
    </Card>
  );
};

export default CollaboratorList;
