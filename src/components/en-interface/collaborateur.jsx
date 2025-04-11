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
  LinkedinOutlined
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";

const { Dragger } = Upload;
const API_URL = Endponit() + "/api/collaborateur/";
const UPLOAD_URL = Endponit() + "/api/saveDoc/";

const CollaboratorList = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  // Fetch collaborators
  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        Endponit() +
          "/api/consultants_par_esn/?esn_id=" +
          localStorage.getItem("id"),
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );
      const formattedData = response.data.data.map((collab) => ({
        ...collab,
        key: collab.ID_collab,
        fullName: `${collab.Nom} ${collab.Prenom}`,
        status: collab.Actif ? "actif" : "inactif",
      }));
      setCollaborators(formattedData);
      setLoading(false);
    } catch (error) {
      message.error("Erreur lors du chargement des collaborateurs");
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
            headers: {
              Authorization: `${token()}`,
            },
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
      title: "Poste",
      dataIndex: "Poste",
      key: "Poste",
    },
    {
      title: "Date de Début",
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
            if (record.cv_url) {
              window.open(Endponit()+"/media/"+record.CV, "_blank");
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
      editForm.setFieldsValue(record);
      setIsFileUploaded(false);
      setUploadedFileUrl("");

      // Check if the collaborator has a CV
      if (record.cv_url) {
        setFileList([
          {
            uid: "-1",
            name: "CV existant",
            status: "done",
            url: record.cv_url,
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

        // Merge the form values with the existing record data
        const updatedData = {
          ...record,
          ...values,
          Actif: values.Actif !== undefined ? values.Actif : record.Actif,
        };

        // Send the updated data to the server
        await axios.put(API_URL, updatedData, {
          headers: {
            Authorization: token(),
          },
        });

        // Handle CV upload if there's a new file
        if (isFileUploaded) {
          const formData = new FormData();
          formData.append("file", fileList[0].originFileObj);
          formData.append("type", "cv");
          formData.append("entity_id", record.ID_collab);
          formData.append("entity_type", "collaborateur");
          formData.append("path", "./uploads/cv/");

          await axios.post(UPLOAD_URL, formData, {
            headers: {
              Authorization: `${token()}`,
              "Content-Type": "multipart/form-data",
            },
          });
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

    // Upload configuration - using the same approach as in clientDocumen.jsx
    const uploadProps = {
      name: "uploadedFile",
      customRequest: async ({ file, onSuccess, onError, onProgress }) => {
        const formData = new FormData();
        formData.append("uploadedFile", file);
        formData.append("path", "./uploads/cv/");

        try {
          const saveDocResponse = await axios.post(UPLOAD_URL, formData, {
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

          if (saveDocResponse.data && saveDocResponse.data.path) {
            setUploadedFileUrl(saveDocResponse.data.path);
            setIsFileUploaded(true);
            setFileList([
              {
                uid: "-1",
                name: file.name,
                status: "done",
                originFileObj: file,
              },
            ]);
            onSuccess(saveDocResponse.data);
            message.success(`${file.name} téléchargé avec succès`);
          }
        } catch (error) {
          console.error("Upload error:", error);
          onError(error);
          message.error(`${file.name} échec du téléchargement.`);
        }
      },
      beforeUpload: (file) => {
        // Check if file is PDF
        const isPDF = file.type === "application/pdf";
        if (!isPDF) {
          message.error("Vous pouvez seulement télécharger des fichiers PDF!");
          return false;
        }

        // Check file size (limit to 5MB)
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

    const viewCV = () => {
      if (record.cv_url) {
        window.open(record.cv_url, "_blank");
      } else {
        message.info("Aucun CV disponible pour ce collaborateur");
      }
    };

    return (
      <>
        <Space size="middle">
          {/* <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={showEditModal}
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
                        <div style={{ margin: '-20px -24px' }}>
                          {/* Header with background color */}
                          <div 
                            style={{ 
                              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                              padding: '30px 24px 40px',
                              borderTopLeftRadius: '2px',
                              borderTopRightRadius: '2px',
                              position: 'relative',
                              marginBottom: 60
                            }}
                          >
                            <h2 style={{ 
                              color: 'white', 
                              margin: 0, 
                              fontSize: 20, 
                              marginBottom: 5,
                              textAlign: 'center'
                            }}>
                              Détails du Collaborateur
                            </h2>
                          </div>
                          
                          {/* Avatar positioned to overlap header & content */}
                          <div style={{ 
                            position: 'absolute', 
                            top: 80, 
                            left: '50%', 
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <Avatar 
                              size={100} 
                              icon={<UserOutlined />} 
                              style={{ 
                                backgroundColor: 'white',
                                color: '#1890ff',
                                border: '4px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }} 
                            />
                            <h2 style={{ 
                              margin: '12px 0 4px', 
                              fontSize: 18, 
                              fontWeight: 'bold' 
                            }}>
                              {record.fullName}
                            </h2>
                           
                          </div>
                          
                          {/* Information Content */}
                          <div style={{ padding: '80px 24px 24px' }}>
                            {/* Info cards in a grid */}
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(2, 1fr)', 
                              gap: '16px',
                              marginBottom: '24px'
                            }}>
                              {/* Card 1: Position */}
                              <div style={{ 
                                background: '#f5f5f5', 
                                borderRadius: '8px', 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}>
                                <UserOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '4px' }}>Poste</div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>{record.Poste || "Non spécifié"}</div>
                              </div>
                              
                              {/* Card 2: Start Date */}
                              <div style={{ 
                                background: '#f5f5f5', 
                                borderRadius: '8px', 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}>
                                <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '4px' }}>Date de Début</div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>{record.date_debut_activ || "Non spécifié"}</div>
                              </div>
                              
                              {/* Card 3: Mobility */}
                              <div style={{ 
                                background: '#f5f5f5', 
                                borderRadius: '8px', 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}>
                                <CompassOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '4px' }}>Mobilité</div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>{record.Mobilité || "Non spécifié"}</div>
                              </div>
                              
                              {/* Card 4: LinkedIn */}
                              <div style={{ 
                                background: '#f5f5f5', 
                                borderRadius: '8px', 
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}>
                                <LinkedinOutlined style={{ fontSize: '24px', color: '#0073b1', marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '4px' }}>LinkedIn</div>
                                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                                  {record.LinkedIN ? (
                                    <a href={record.LinkedIN} target="_blank" rel="noopener noreferrer">
                                      Voir profil
                                    </a>
                                  ) : (
                                    "Non spécifié"
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Additional contacts if available */}
                            {(record.Email || record.Telephone) && (
                              <div style={{ 
                                background: '#f9f9f9', 
                                borderRadius: '8px', 
                                padding: '16px',
                                marginBottom: '24px'
                              }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                                  Contact
                                </div>
                                
                                {record.Email && (
                                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                    <MailOutlined style={{ marginRight: '10px', color: '#1890ff' }} />
                                    <a href={`mailto:${record.Email}`}>{record.Email}</a>
                                  </div>
                                )}
                                
                                {record.Telephone && (
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <PhoneOutlined style={{ marginRight: '10px', color: '#1890ff' }} />
                                    <a href={`tel:${record.Telephone}`}>{record.Telephone}</a>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* CV Button */}
                            {record.cv_url && (
                              <div style={{ textAlign: 'center' }}>
                                <Button 
                                  type="primary" 
                                  icon={<FilePdfOutlined />} 
                                  onClick={viewCV}
                                  size="large"
                                  style={{ 
                                    height: '42px', 
                                    paddingLeft: '24px', 
                                    paddingRight: '24px',
                                    boxShadow: '0 2px 0 rgba(0,0,0,0.045)'
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
                  disabled: !record.cv_url,
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
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="Nom"
              label="Nom"
              rules={[{ required: true, message: "Veuillez saisir le nom" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Prenom"
              label="Prénom"
              rules={[{ required: true, message: "Veuillez saisir le prénom" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Poste"
              label="Poste"
              rules={[{ required: true, message: "Veuillez saisir le poste" }]}
            >
              <Select placeholder="Sélectionnez un poste">
                <Select.Option value="consultant">Consultant</Select.Option>
                <Select.Option value="commercial">Commercial</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="Actif" label="Statut">
              <Select>
                <Select.Option value={true}>Actif</Select.Option>
                <Select.Option value={false}>Inactif</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="CV"
              name="CV"
              tooltip="Mettre à jour le CV du collaborateur (format PDF, max 5MB)"
            >
              {record.cv_url && !isFileUploaded && (
                <div
                  className="mb-3 p-3"
                  style={{ backgroundColor: "#f5f5f5", borderRadius: "4px" }}
                >
                  CV actuel:{" "}
                  <a
                    href={record.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FilePdfOutlined /> Voir le CV
                  </a>
                </div>
              )}

              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined
                    style={{ fontSize: "48px", color: "#1890ff" }}
                  />
                </p>
                <p className="ant-upload-text">
                  Cliquez ou déposez un fichier PDF ici
                </p>
                <p className="ant-upload-hint">
                  Format accepté: PDF - Taille maximale: 5MB
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
                  <CheckCircleOutlined style={{ color: "green" }} /> CV
                  téléchargé avec succès
                </div>
              )}
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

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
                  /* Edit logic - should be implemented */
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
                  if (collaborator.cv_url) {
                    window.open(collaborator.cv_url, "_blank");
                  } else {
                    message.info("Aucun CV disponible pour ce collaborateur");
                  }
                }}
                style={{ color: collaborator.cv_url ? "#1890ff" : "#d9d9d9" }}
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
                </Space>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Add Collaborator Modal
  const AddCollaboratorModal = () => {
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

        // First create the collaborator with the CV URL
        const newCollaborator = {
          ID_ESN: localStorage.getItem("id"),
          ...values,
          Actif: true,
          CV: uploadedFileUrl, // Add the uploaded CV URL directly to the collaborator record
          date_debut_activ: new Date().toISOString().split("T")[0],
        };

        const response = await axios.post(API_URL, newCollaborator, {
          headers: {
            Authorization: `${token()}`,
          },
        });

        // If there's a CV file to upload and it's not already included in the collaborator record
        // This is for the file association in case your backend needs a separate record
        // if (isFileUploaded) {
        //   const formData = new FormData();
        //   formData.append("file", fileList[0].originFileObj);
        //   formData.append("type", "cv");
        //   formData.append(
        //     "entity_id",
        //     response.data.id || response.data.ID_collab
        //   );
        //   formData.append("entity_type", "collaborateur");
        //   formData.append("path", "./uploads/cv/");

        //   // This might be redundant if you've already included the URL in the collaborator record
        //   // but keeping it for compatibility with your other code
        //   await axios.post(UPLOAD_URL, formData, {
        //     headers: {
        //       Authorization: `${token()}`,
        //       "Content-Type": "multipart/form-data",
        //     },
        //   });
        // }

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

    const handleCancel = () => {
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      setIsFileUploaded(false);
      setUploadedFileUrl("");
    };

    // Upload configuration for Add Modal - using the same approach as in clientDocumen.jsx
    const props = {
      name: "uploadedFile",
      customRequest: async ({ file, onSuccess, onError, onProgress }) => {
        const formData = new FormData();
        formData.append("uploadedFile", file);
        formData.append("path", "./uploads/cv/");

        try {
          const saveDocResponse = await axios.post(UPLOAD_URL, formData, {
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

          if (saveDocResponse.data && saveDocResponse.data.path) {
            setUploadedFileUrl(saveDocResponse.data.path);
            setIsFileUploaded(true);
            setFileList([
              {
                uid: "-1",
                name: file.name,
                status: "done",
                originFileObj: file,
              },
            ]);
            onSuccess(saveDocResponse.data);
            message.success(`${file.name} téléchargé avec succès`);
          }
        } catch (error) {
          console.error("Upload error:", error);
          onError(error);
          message.error(`${file.name} échec du téléchargement.`);
        }
      },
      beforeUpload: (file) => {
        // Check if file is PDF
        const isPDF = file.type === "application/pdf";
        if (!isPDF) {
          message.error("Vous pouvez seulement télécharger des fichiers PDF!");
          return false;
        }

        // Check file size (limit to 5MB)
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
      <>
        <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
          Nouveau Collaborateur
        </Button>
        <Modal
          title="Ajouter un collaborateur"
          visible={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Ajouter"
          cancelText="Annuler"
          confirmLoading={uploading}
        >
          <Form form={form} layout="vertical" name="add_collaborator">
            <Form.Item
              label="Nom"
              name="Nom"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le nom du collaborateur",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Prénom"
              name="Prenom"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le prénom du collaborateur",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Poste"
              name="Poste"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le poste du collaborateur",
                },
              ]}
            >
              <Select placeholder="Sélectionnez un poste">
                <Select.Option value="consultant">Consultant</Select.Option>
                <Select.Option value="commercial">Commercial</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Mobilité" name="Mobilité">
              <Select>
                <Option value="National">National</Option>
                <Option value="International">International</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="CV"
              name="CV"
              tooltip="Téléchargez le CV du collaborateur (format PDF, max 5MB)"
            >
              <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined
                    style={{ fontSize: "48px", color: "#1890ff" }}
                  />
                </p>
                <p className="ant-upload-text">
                  Cliquez ou déposez un fichier PDF ici
                </p>
                <p className="ant-upload-hint">
                  Format accepté: PDF - Taille maximale: 5MB
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
                  <CheckCircleOutlined style={{ color: "green" }} /> CV
                  téléchargé avec succès
                </div>
              )}
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
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
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className="flex flex-row items-center space-x-5">
          <AddCollaboratorModal />
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
