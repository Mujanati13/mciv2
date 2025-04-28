import React, { useState, useEffect, useCallback } from "react";
import {
  Input,
  Button,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Upload,
  Dropdown,
  Menu,
  Select,
  Spin,
  DatePicker,
  Typography,
  Descriptions,
  Space,
  Divider,
  Tag,
  InputNumber,
  Table,
  Switch,
} from "antd";
import {
  InboxOutlined,
  DownOutlined,
  LoadingOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  CloseOutlined 
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { Endponit, token } from "../../helper/enpoint";

const { TextArea } = Input;
const { Paragraph } = Typography;
const { Option } = Select;
const { Dragger } = Upload;
const API_URL = `${Endponit()}/api/collaborateur/`;
const UPLOAD_URL = `${Endponit()}/api/saveDoc/`;

const AppelDOffreInterface = () => {
  // Main state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [skills, setSkills] = useState([]);

  // Modal visibility states
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isAddResponsableModalVisible, setIsAddResponsableModalVisible] =
    useState(false);
  const [isAddConsultantModalVisible, setIsAddConsultantModalVisible] =
    useState(false);

  // Form instances
  const [applyForm] = Form.useForm();
  const [addResponsableForm] = Form.useForm();
  const [addConsultantForm] = Form.useForm();

  // Data for selection
  const [consultants, setConsultants] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [nom_co, setNomCo] = useState("");
  const [nom_resp, setNomResp] = useState("");

  // File upload states for responsable
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  // File upload states for consultant
  const [consultantFileList, setConsultantFileList] = useState([]);
  const [consultantUploadedFileUrl, setConsultantUploadedFileUrl] =
    useState("");
  const [isConsultantFileUploaded, setIsConsultantFileUploaded] =
    useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    fetchSkills();
  }, []);

  // Fetch all projects (appels d'offre)
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Endponit()}/api/appelOffre/`, {
        headers: { Authorization: `${token()}` },
      });
      setData(response.data.data || []);
    } catch (error) {
      message.error("Erreur lors du chargement des appels d'offre");
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch skills list
  const fetchSkills = async () => {
    try {
      const response = await axios.get(`${Endponit()}/api/competences/`);
      if (response.data && response.data.data) {
        setSkills(response.data.data.map((skill) => skill.nom));
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  // Fetch consultants for a project
  const fetchConsultants = useCallback(async (id_project) => {
    const esnId = localStorage.getItem("id") || 3;
    try {
      const response = await axios.get(
        `${Endponit()}/api/consultants-par-esn-et-projet/?esn_id=${esnId}&project_id=${id_project}`,
        { headers: { Authorization: `${token()}` } }
      );
      setConsultants(response.data.data || []);
    } catch (error) {
      message.error("Erreur lors du chargement des consultants");
      console.error("Error fetching consultants:", error);
    }
  }, []);

  // Fetch responsables (commercial role)
  const fetchResponsables = useCallback(async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `${token()}` },
      });

      if (response.data && response.data.data) {
        const commercials = response.data.data.filter(
          (c) => c.Poste === "commercial" && c.Actif
        );
        setResponsables(commercials);
      }
    } catch (error) {
      console.error("Error fetching responsables:", error);
      message.error("Erreur lors du chargement des responsables");
    }
  }, []);

  // Handle selection of consultant
  const handleConsultantSelect = (value, option) => {
    setNomCo(option.children.join(" ").replaceAll("  ", " "));
  };

  // Handle selection of responsable
  const handleResponsableSelect = (value, option) => {
    setNomResp(option.children);
  };

  // Toggle project description expand/collapse
  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open apply modal
  const handleApply = useCallback(
    (record) => {
      setCurrentOffer(record);
      fetchConsultants(record.id);
      fetchResponsables();

      applyForm.resetFields();
      applyForm.setFieldsValue({
        AO_id: record.id,
        date_disponibilite: dayjs().add(1, "week"),
      });
      setIsApplyModalVisible(true);
    },
    [applyForm, fetchConsultants, fetchResponsables]
  );

  // Open details modal
  const handleViewDetails = (record) => {
    setCurrentOffer(record);
    setIsDetailsModalVisible(true);
  };

  // Submit application form
  const handleApplySubmit = () => {
    applyForm.submit();
  };

  // Function to show add new responsable modal
  const showAddResponsableModal = useCallback(() => {
    setIsAddResponsableModalVisible(true);
    addResponsableForm.resetFields();
    setFileList([]);
    setUploadedFileUrl("");
    setIsFileUploaded(false);
  }, [addResponsableForm]);

  // Function to show add new consultant modal
  const showAddConsultantModal = useCallback(() => {
    setIsAddConsultantModalVisible(true);
    addConsultantForm.resetFields();
    setConsultantFileList([]);
    setConsultantUploadedFileUrl("");
    setIsConsultantFileUploaded(false);
  }, [addConsultantForm]);

  // Handle application submission
  const onApplyFinish = async (values) => {
    setSubmitting(true);
    try {
      const esnId = localStorage.getItem("id") || 3;

      // Submit candidature
      const formData = {
        AO_id: currentOffer.id,
        esn_id: esnId,
        responsable_compte: nom_resp,
        id_consultant: values.id_consultant,
        id_responsable: values.id_responsable,
        date_candidature: dayjs().format("YYYY-MM-DD"),
        statut: "En cours",
        tjm: values.tjm,
        date_disponibilite: values.date_disponibilite.format("YYYY-MM-DD"),
        commentaire: values.commentaire,
        nom_cn: nom_co,
      };

      const res_data = await axios.post(
        `${Endponit()}/api/candidature/`,
        formData,
        { headers: { Authorization: `${token()}` } }
      );

      const id = res_data.data.id;
      await axios.post(`${Endponit()}/api/notify_new_candidature/`, {
        appel_offre_id: currentOffer.id,
        condidature_id: id,
        esn_id: Number.parseInt(localStorage.getItem("id")),
      });

      // Send push notification if token exists
      if (res_data.data.token) {
        try {
          await axios.post("http://51.38.99.75:3006/send-notification", {
            deviceToken: res_data.data.token,
            messagePayload: {
              title: "Un nouvel appel",
              body: "Un nouvel candidature est arrivé. Rafraîchissez pour voir",
            },
          });
        } catch (error) {
          console.error(
            `Failed to send notification to token ${res_data.data.token}:`,
            error
          );
        }
      }

      message.success("Votre candidature a été soumise avec succès !");
      setIsApplyModalVisible(false);
      applyForm.resetFields();
    } catch (error) {
      message.error("Erreur lors de la soumission de la candidature");
      console.error("Error submitting application:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle the file change for CV upload (responsable)
  const handleResponsableFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type and size
    const isPDF = file.type === "application/pdf";
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isPDF) {
      message.error("Veuillez télécharger un fichier PDF!");
      return;
    }

    if (!isLt5M) {
      message.error("Le fichier doit être inférieur à 5MB!");
      return;
    }

    // Create form data and upload
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("path", "./uploads/cv/");

    setUploading(true);

    try {
      const response = await axios.post(UPLOAD_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token(),
        },
      });

      if (response.data?.path) {
        setUploadedFileUrl(response.data.path);
        setIsFileUploaded(true);
        setFileList([file]); // Store file for display purposes
        message.success(`${file.name} chargé avec succès`);
      } else {
        throw new Error("URL de fichier non reçue");
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error(`Échec de téléchargement de ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle the file change for CV upload (consultant)
  const handleConsultantFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type and size
    const isPDF = file.type === "application/pdf";
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isPDF) {
      message.error("Veuillez télécharger un fichier PDF!");
      return;
    }

    if (!isLt5M) {
      message.error("Le fichier doit être inférieur à 5MB!");
      return;
    }

    // Create form data and upload
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("path", "./uploads/cv/");

    setUploading(true);

    try {
      const response = await axios.post(UPLOAD_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token(),
        },
      });

      if (response.data?.path) {
        setConsultantUploadedFileUrl(response.data.path);
        setIsConsultantFileUploaded(true);
        setConsultantFileList([file]); // Store file for display purposes
        message.success(`${file.name} chargé avec succès`);
      } else {
        throw new Error("URL de fichier non reçue");
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error(`Échec de téléchargement de ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle file removal for responsable
  const handleClearResponsableFile = () => {
    setIsFileUploaded(false);
    setUploadedFileUrl("");
    setFileList([]);

    // This will clear the file input
    const fileInput = document.getElementById("responsable-cv-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle file removal for consultant
  const handleClearConsultantFile = () => {
    setIsConsultantFileUploaded(false);
    setConsultantUploadedFileUrl("");
    setConsultantFileList([]);

    // This will clear the file input
    const fileInput = document.getElementById("consultant-cv-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };
  
  // Handle adding a new responsable
  const handleAddResponsable = async () => {
    try {
      const values = await addResponsableForm.validateFields();
      setUploading(true);

      if (!isFileUploaded || !uploadedFileUrl) {
        message.error("Veuillez uploader un CV");
        setUploading(false);
        return;
      }

      // Create new collaborator with commercial role
      const newCollaborator = {
        ID_ESN: localStorage.getItem("id"),
        Nom: values.Nom,
        Prenom: values.Prenom,
        Tel: values.Tel,
        Date_naissance: values.Date_naissance,
        Poste: "commercial",
        Actif: true,
        CV: uploadedFileUrl,
        date_debut_activ: values.date_debut_activ,
        Mobilité: values.Mobilité,
        LinkedIN: values.LinkedIN,
      };

      const response = await axios.post(API_URL, newCollaborator, {
        headers: { Authorization: `${token()}` },
      });

      if (response.data) {
        message.success("Nouveau responsable de compte ajouté avec succès");

        // Fetch fresh responsables list to update the dropdown
        await fetchResponsables();
        
        // // Update the form with the new responsable ID
        // const newResponsable = response.data.data;
        
        // // Update the form selection
        // applyForm.setFieldsValue({
        //   id_responsable: newResponsable.ID_collab,
        // });

        // setNomResp(`${newResponsable.Prenom} ${newResponsable.Nom}`);

        // Reset the form and close modal
        setIsAddResponsableModalVisible(false);
        addResponsableForm.resetFields();
        setFileList([]);
        setUploadedFileUrl("");
        setIsFileUploaded(false);
      } else {
        throw new Error("Erreur lors de l'ajout du responsable");
      }
    } catch (error) {
      console.error("Error adding responsable:", error);
      message.error("Erreur lors de l'ajout du responsable de compte");
    } finally {
      setUploading(false);
    }
  };

  // Handle adding a new consultant
  const handleAddConsultant = async () => {
    try {
      const values = await addConsultantForm.validateFields();
      setUploading(true);

      if (!isConsultantFileUploaded || !consultantUploadedFileUrl) {
        message.error("Veuillez uploader un CV");
        setUploading(false);
        return;
      }

      // Create new collaborator with consultant role
      const newCollaborator = {
        ID_ESN: localStorage.getItem("id"),
        Nom: values.Nom,
        Prenom: values.Prenom,
        Tel: values.Tel,
        Date_naissance: values.Date_naissance,
        Poste: "consultant",
        Actif: true,
        CV: consultantUploadedFileUrl,
        date_debut_activ: values.date_debut_activ,
        Mobilité: values.Mobilité,
        LinkedIN: values.LinkedIN,
      };

      const response = await axios.post(API_URL, newCollaborator, {
        headers: { Authorization: `${token()}` },
      });

      if (response.data) {
        message.success("Nouveau consultant ajouté avec succès");

        // Fetch fresh consultants list to update the dropdown
        if (currentOffer) {
          await fetchConsultants(currentOffer.id);
        }
        
        // // Update the consultant list and form selection
        // const newConsultant = response.data.data;

        // // Set the consultant in the form
        // applyForm.setFieldsValue({
        //   id_consultant: newConsultant.ID_collab,
        // });

        // setNomCo(`${newConsultant.Prenom} ${newConsultant.Nom}`);

        // Reset form and close modal
        setIsAddConsultantModalVisible(false);
        addConsultantForm.resetFields();
        setConsultantFileList([]);
        setConsultantUploadedFileUrl("");
        setIsConsultantFileUploaded(false);
      } else {
        throw new Error("Erreur lors de l'ajout du consultant");
      }
    } catch (error) {
      console.error("Error adding consultant:", error);
      message.error("Erreur lors de l'ajout du consultant");
    } finally {
      setUploading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Get status label from numeric status
  const getStatusLabel = (status) => {
    const statusMap = {
      0: "Brouillon",
      1: "Ouvert",
      2: "En cours",
      3: "Fermé",
    };
    return statusMap[status] || status;
  };

  // Get status color for tag
  const getStatusColor = (status) => {
    const statusColorMap = {
      0: "gray",
      1: "green",
      2: "blue",
      3: "red",
    };
    return statusColorMap[status] || "default";
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  // Add Responsable Modal Component
  const AddResponsableModal = () => (
    <Modal
      title="Ajouter un Responsable compte"
      open={isAddResponsableModalVisible}
      onCancel={() => setIsAddResponsableModalVisible(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => setIsAddResponsableModalVisible(false)}
        >
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleAddResponsable}
          loading={uploading}
          disabled={!isFileUploaded}
        >
          Ajouter
        </Button>,
      ]}
      width={700}
    >
      <Form
        form={addResponsableForm}
        layout="vertical"
        initialValues={{
          date_debut_activ: new Date().toISOString().split("T")[0],
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="Nom"
              label="Nom"
              rules={[{ required: true, message: "Veuillez saisir le nom" }]}
            >
              <Input placeholder="Nom" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="Prenom"
              label="Prénom"
              rules={[{ required: true, message: "Veuillez saisir le prénom" }]}
            >
              <Input placeholder="Prénom" />
            </Form.Item>
          </Col>
        </Row>

        {/* <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="Tel"
              label="Téléphone"
              rules={[
                { required: true, message: "Veuillez saisir le téléphone" },
              ]}
            >
              <Input placeholder="Téléphone" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Date de naissance"
              name="Date_naissance"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir la date de naissance",
                },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();

                    const birthDate = new Date(value);
                    const today = new Date();

                    // Calculate age
                    const ageInMilliseconds = today - birthDate;
                    const ageInYears =
                      ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

                    if (ageInYears < 18) {
                      return Promise.reject(
                        "L'âge doit être supérieur ou égal à 18 ans"
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row> */}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date_debut_activ"
              label="Date de recrutement"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Mobilité" name="Mobilité">
              <Select placeholder="Sélectionnez la mobilité">
                <Option value="National">National</Option>
                <Option value="International">International</Option>
                <Option value="Régional">Régional</Option>
                <Option value="Local">Local</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Profil LinkedIn" name="LinkedIN">
          <Input placeholder="https://www.linkedin.com/in/username" />
        </Form.Item>

        <Form.Item
          name="CV"
          label="CV"
          rules={[{ required: true, message: "Veuillez uploader un CV" }]}
          tooltip="Téléchargez le CV du responsable (format PDF, max 5MB)"
        >
          <div className="upload-wrapper">
            <div
              className="upload-container"
              style={{
                border: "1px dashed #d9d9d9",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#fafafa",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div className="upload-icon" style={{ marginBottom: "8px" }}>
                <FilePdfOutlined
                  style={{ fontSize: "48px", color: "#1890ff" }}
                />
              </div>

              <p style={{ margin: "8px 0" }}>
                Cliquez pour sélectionner ou déposez un fichier PDF ici
              </p>

              <p style={{ fontSize: "12px", color: "#888" }}>
                Format accepté: PDF - Taille maximale: 5MB
              </p>

              <input
                id="responsable-cv-upload"
                type="file"
                accept=".pdf"
                onChange={handleResponsableFileChange}
                style={{
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
            </div>

            {fileList.length > 0 && (
              <div className="file-list" style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "4px",
                    border: "1px solid #b7eb8f",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <FilePdfOutlined
                      style={{
                        fontSize: "16px",
                        color: "green",
                        marginRight: "8px",
                      }}
                    />
                    <span>{fileList[0].name}</span>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleClearResponsableFile}
                  />
                </div>
              </div>
            )}

            {isFileUploaded && (
              <div
                className="mt-2 p-2"
                style={{
                  marginTop: "8px",
                  backgroundColor: "#f6ffed",
                  borderRadius: "4px",
                  border: "1px solid #b7eb8f",
                  padding: "8px 12px",
                }}
              >
                <CheckCircleOutlined
                  style={{ color: "green", marginRight: "8px" }}
                />
                CV téléchargé avec succès
              </div>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );

  // Add Consultant Modal Component
  const AddConsultantModal = () => (
    <Modal
      title="Ajouter un Consultant"
      open={isAddConsultantModalVisible}
      onCancel={() => setIsAddConsultantModalVisible(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => setIsAddConsultantModalVisible(false)}
        >
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleAddConsultant}
          loading={uploading}
          disabled={!isConsultantFileUploaded}
        >
          Ajouter
        </Button>,
      ]}
      width={700}
    >
      <Form
        form={addConsultantForm}
        layout="vertical"
        initialValues={{
          date_debut_activ: new Date().toISOString().split("T")[0],
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="Nom"
              label="Nom"
              rules={[{ required: true, message: "Veuillez saisir le nom" }]}
            >
              <Input placeholder="Nom" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="Prenom"
              label="Prénom"
              rules={[{ required: true, message: "Veuillez saisir le prénom" }]}
            >
              <Input placeholder="Prénom" />
            </Form.Item>
          </Col>
        </Row>

        {/* <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="Tel"
              label="Téléphone"
              rules={[
                { required: true, message: "Veuillez saisir le téléphone" },
              ]}
            >
              <Input placeholder="Téléphone" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Date de naissance"
              name="Date_naissance"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir la date de naissance",
                },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();

                    const birthDate = new Date(value);
                    const today = new Date();

                    // Calculate age
                    const ageInMilliseconds = today - birthDate;
                    const ageInYears =
                      ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

                    if (ageInYears < 18) {
                      return Promise.reject(
                        "L'âge doit être supérieur ou égal à 18 ans"
                      );
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row> */}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date_debut_activ"
              label="Date de recrutement"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Mobilité" name="Mobilité">
              <Select placeholder="Sélectionnez la mobilité">
                <Option value="National">National</Option>
                <Option value="International">International</Option>
                <Option value="Régional">Régional</Option>
                <Option value="Local">Local</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Profil LinkedIn" name="LinkedIN">
          <Input placeholder="https://www.linkedin.com/in/username" />
        </Form.Item>

        <Form.Item
          name="CV"
          label="CV"
          rules={[{ required: true, message: "Veuillez uploader un CV" }]}
          tooltip="Téléchargez le CV du consultant (format PDF, max 5MB)"
        >
          <div className="upload-wrapper">
            <div
              className="upload-container"
              style={{
                border: "1px dashed #d9d9d9",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#fafafa",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div className="upload-icon" style={{ marginBottom: "8px" }}>
                <FilePdfOutlined
                  style={{ fontSize: "48px", color: "#1890ff" }}
                />
              </div>

              <p style={{ margin: "8px 0" }}>
                Cliquez pour sélectionner ou déposez un fichier PDF ici
              </p>

              <p style={{ fontSize: "12px", color: "#888" }}>
                Format accepté: PDF - Taille maximale: 5MB
              </p>

              <input
                id="consultant-cv-upload"
                type="file"
                accept=".pdf"
                onChange={handleConsultantFileChange}
                style={{
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
            </div>

            {consultantFileList.length > 0 && (
              <div className="file-list" style={{ marginTop: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: "#f6ffed",
                    borderRadius: "4px",
                    border: "1px solid #b7eb8f",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <FilePdfOutlined
                      style={{
                        fontSize: "16px",
                        color: "green",
                        marginRight: "8px",
                      }}
                    />
                    <span>{consultantFileList[0].name}</span>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleClearConsultantFile}
                  />
                </div>
              </div>
            )}

            {isConsultantFileUploaded && (
              <div
                className="mt-2 p-2"
                style={{
                  marginTop: "8px",
                  backgroundColor: "#f6ffed",
                  borderRadius: "4px",
                  border: "1px solid #b7eb8f",
                  padding: "8px 12px",
                }}
              >
                <CheckCircleOutlined
                  style={{ color: "green", marginRight: "8px" }}
                />
                CV téléchargé avec succès
              </div>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Input.Search
          placeholder="Rechercher un appel d'offre"
          onSearch={(value) => console.log(value)}
          className="w-64"
        />
      </div>

      <Row gutter={[16, 16]}>
        {data
          .filter((item) => item.statut !== "0") // Filter out "Brouillon" status
          .map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                className="h-full"
                actions={[
                  <Button
                    type="primary"
                    onClick={() => handleApply(item)}
                    disabled={item.statut === "3"}
                  >
                    Postuler
                  </Button>,
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item
                          key="view-details"
                          onClick={() => handleViewDetails(item)}
                        >
                          Consulter l'Appel d'Offres
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={["click"]}
                  >
                    <Button>
                      Actions <DownOutlined />
                    </Button>
                  </Dropdown>,
                ]}
              >
                <Card.Meta
                  title={item.titre}
                  description={
                    <div className="space-y-2">
                      <div className="text-sm">
                        {expandedDescriptions[item.id]
                          ? item.description
                          : item.description.length > 100
                          ? `${item.description.substring(0, 100)}...`
                          : item.description}
                        {item.description.length > 100 && (
                          <Button
                            type="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(item.id);
                            }}
                            className="p-0 ml-1"
                            size="small"
                          >
                            {expandedDescriptions[item.id]
                              ? "Voir moins"
                              : "Voir plus"}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">Profil: {item.profil}</p>
                      <p className="text-sm">
                        TJM: {item.tjm_min}€ - {item.tjm_max}€
                      </p>
                      <p className="text-sm">
                        Statut:{" "}
                        <Tag color={getStatusColor(item.statut)}>
                          {getStatusLabel(item.statut)}
                        </Tag>
                      </p>
                      <p className="text-sm">
                        Publication: {formatDate(item.date_publication)}
                      </p>
                      <p className="text-sm">
                        Date limite: {formatDate(item.date_limite)}
                      </p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
      </Row>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined /> Détails de l'appel d'offre
          </Space>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              setIsDetailsModalVisible(false);
              handleApply(currentOffer);
            }}
            disabled={currentOffer?.statut === "3"}
          >
            Postuler
          </Button>,
        ]}
        width={700}
      >
        {currentOffer && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Titre">
                {currentOffer.titre}
              </Descriptions.Item>
              <Descriptions.Item label="Profil">
                {currentOffer.profil}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {currentOffer.description}
              </Descriptions.Item>
              <Descriptions.Item label="TJM">
                {currentOffer.tjm_min}€ - {currentOffer.tjm_max}€
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(currentOffer.statut)}>
                  {getStatusLabel(currentOffer.statut)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Dates importantes</Divider>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" title="Date de publication">
                  {formatDate(currentOffer.date_publication)}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Date limite">
                  {formatDate(currentOffer.date_limite)}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Date de début">
                  {formatDate(currentOffer.date_debut)}
                </Card>
              </Col>
            </Row>

            {currentOffer.competences && (
              <>
                <Divider orientation="left">Compétences requises</Divider>
                <div>
                  {currentOffer.competences.split(",").map((skill, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ margin: "0 8px 8px 0" }}
                    >
                      {skill.trim()}
                    </Tag>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Apply Modal */}
      <Modal
        title="Soumettre une candidature"
        open={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsApplyModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleApplySubmit}
            loading={submitting}
          >
            Soumettre
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={applyForm}
          onFinish={onApplyFinish}
          layout="vertical"
          initialValues={{
            date_candidature: dayjs(),
            date_disponibilite: dayjs().add(1, "week"),
          }}
        >
          <Form.Item name="AO_id" hidden>
            <Input />
          </Form.Item>

          {/* Account Manager Section */}
          <div className="flex justify-between items-center mb-2">
            <Typography.Text strong>Responsable compte</Typography.Text>
            <Button type="primary" onClick={showAddResponsableModal}>
              <PlusOutlined /> Créer Responsable
            </Button>
          </div>

          <Form.Item
            name="id_responsable"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un responsable de compte",
              },
            ]}
          >
            <Select
              placeholder="Sélectionnez un responsable de compte"
              optionFilterProp="children"
              onChange={handleResponsableSelect}
              showSearch
            >
              {responsables.map((responsable) => (
                <Option
                  key={responsable.ID_collab}
                  value={responsable.ID_collab}
                >
                  {`${responsable.Prenom} ${responsable.Nom}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Consultant Section */}
          <div className="flex justify-between items-center mb-2 mt-4">
            <Typography.Text strong>Consultant</Typography.Text>
            <Button type="primary" onClick={showAddConsultantModal}>
              <PlusOutlined /> Créer Consultant
            </Button>
          </div>

          <Form.Item
            name="id_consultant"
            rules={[{ required: true, message: "Sélectionnez un consultant" }]}
          >
            <Select
              placeholder="Sélectionnez un consultant"
              optionFilterProp="children"
              onChange={handleConsultantSelect}
              showSearch
            >
              {consultants &&
                consultants
                  .filter((consultant) => consultant.Poste === "consultant")
                  .map((consultant) => (
                    <Option
                      key={consultant.ID_collab}
                      value={consultant.ID_collab}
                    >
                      {consultant.Prenom} {consultant.Nom}
                    </Option>
                  ))}
            </Select>
          </Form.Item>

          {/* Application Details */}
          <Divider orientation="left">Détails de la candidature</Divider>

          <Form.Item
            name="tjm"
            label="TJM proposé"
            rules={[{ required: true, message: "Veuillez saisir le TJM" }]}
          >
            <InputNumber
              prefix={<DollarOutlined />}
              min={currentOffer?.tjm_min}
              max={currentOffer?.tjm_max}
              style={{ width: "100%" }}
              suffix="€"
              placeholder={`Entre ${currentOffer?.tjm_min} et ${currentOffer?.tjm_max}`}
            />
          </Form.Item>

          <Form.Item
            name="date_disponibilite"
            label="Date de disponibilité"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner une date de disponibilité",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Sélectionnez une date"
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="commentaire"
            label="Commentaire"
            rules={[
              { required: true, message: "Veuillez ajouter un commentaire" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Ajoutez vos commentaires, expériences pertinentes..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Responsable Modal */}
      <AddResponsableModal />

      {/* Add Consultant Modal */}
      <AddConsultantModal />
    </div>
  );
};

export default AppelDOffreInterface;