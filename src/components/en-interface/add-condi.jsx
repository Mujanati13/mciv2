import React, { useState, useEffect } from "react";
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
  Radio,
  Avatar,
  Tooltip,
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
  SwapOutlined,
  FilePdfOutlined,
  UploadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import moment from "moment";
import { Endponit, token } from "../../helper/enpoint";

const { TextArea } = Input;
const { Paragraph } = Typography;
const { Option } = Select;
const { Dragger } = Upload;
const API_URL = Endponit() + "/api/collaborateur/";
const UPLOAD_URL = Endponit() + "/api/saveDoc/";

const AppelDOffreInterface = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [applyForm] = Form.useForm();
  const [consultants, setConsultants] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [nom_co, setNomCo] = useState("");
  const [nom_resp, setNomResp] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [createNewConsultant, setCreateNewConsultant] = useState(false);
  const [createNewManager, setCreateNewManager] = useState(false);
  const [consultantCvFile, setConsultantCvFile] = useState(null);
  const [managerCvFile, setManagerCvFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [isCollaboratorModalVisible, setIsCollaboratorModalVisible] =
    useState(false);
  const [isAddResponsableModalVisible, setIsAddResponsableModalVisible] =
    useState(false);
  const [isAddConsultantModalVisible, setIsAddConsultantModalVisible] =
    useState(false);
  const [addResponsableForm] = Form.useForm();
  const [addConsultantForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [consultantFileList, setConsultantFileList] = useState([]);
  const [consultantUploadedFileUrl, setConsultantUploadedFileUrl] =
    useState("");
  const [isConsultantFileUploaded, setIsConsultantFileUploaded] =
    useState(false);

  // Function to show add new responsable modal
  const showAddResponsableModal = () => {
    // setIsAddResponsableModalVisible(true);
    // addResponsableForm.resetFields();
    // setFileList([]);
    // setUploadedFileUrl("");
    // setIsFileUploaded(false);
    location.reload();
    location.href = "/interface-en?menu=collaborateur";
  };

  // Function to show add new consultant modal
  const showAddConsultantModal = () => {
    // setIsAddConsultantModalVisible(true);
    // addConsultantForm.resetFields();
    // setConsultantFileList([]);
    // setConsultantUploadedFileUrl("");
    // setIsConsultantFileUploaded(false);
    location.reload();
    location.href = "/interface-en?menu=collaborateur";
  };

  useEffect(() => {
    fetchData();
    fetchSkills();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(Endponit() + "/api/appelOffre/", {
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

  const fetchSkills = async () => {
    try {
      const response = await axios.get(Endponit() + "/api/competences/");
      if (response.data && response.data.data) {
        setSkills(response.data.data.map((skill) => skill.nom));
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchConsultants = async (id_project) => {
    const esnId = localStorage.getItem("id") || 3;
    try {
      const response = await axios.get(
        `${Endponit()}/api/consultants-par-esn-et-projet/?esn_id=${esnId}&project_id=${id_project}`,
        { headers: { Authorization: `${token()}` } }
      );
      setConsultants(response.data.data);
    } catch (error) {
      message.error("Erreur lors du chargement des consultants");
      console.error("Error fetching consultants:", error);
    }
  };

  // Function to fetch responsables (commercial role)
  const fetchResponsables = async () => {
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
  };

  const handleConsultantSelect = (value, option) => {
    console.log(option.children.join(" ").replaceAll("  ", " "));
    setNomCo(option.children.join(" ").replaceAll("  ", " "));
  };

  const handleResponsableSelect = (value, option) => {
    setNomResp(option.children);
  };

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApply = (record) => {
    setCurrentOffer(record);
    fetchConsultants(record.id);
    fetchResponsables(); // Fetch responsables when applying
    applyForm.resetFields();
    applyForm.setFieldsValue({
      AO_id: record.id,
      date_disponibilite: dayjs().add(1, "week"),
    });
    setIsApplyModalVisible(true);
  };

  const handleViewDetails = (record) => {
    setCurrentOffer(record);
    setIsDetailsModalVisible(true);
  };

  const handleApplySubmit = () => {
    applyForm.submit();
  };

  const onApplyFinish = async (values) => {
    setSubmitting(true);
    try {
      // Application submission logic
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
        Endponit() + "/api/candidature/",
        formData,
        { headers: { Authorization: `${token()}` } }
      );
      const id = res_data.data.id
      await axios.post(`${Endponit()}/api/notify_new_candidature/`, {
        appel_offre_id: currentOffer.id,
        condidature_id: id,
        esn_id : Number.parseInt(localStorage.getItem("id")),
      });

      console.info("Notification sent to client:", res_data.data);
      if (res_data.data.token != null) {
        console.info("Sending notification to token:", res_data.data.token);
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
        Nom: values.nom,
        Prenom: values.prenom,
        Email: values.email,
        Tel: values.telephone,
        Poste: "commercial", // Set as commercial since it's a responsable compte
        Actif: true,
        CV: uploadedFileUrl,
        date_debut_activ: values.date_debut_activ.format("YYYY-MM-DD"),
      };

      const response = await axios.post(API_URL, newCollaborator, {
        headers: {
          Authorization: `${token()}`,
        },
      });

      if (response.data && response.data.error === false) {
        message.success("Nouveau responsable de compte ajouté avec succès");

        // Update the form with the new responsable
        const newResponsable = response.data.data;

        // Add to responsables array
        setResponsables((prev) => [...prev, newResponsable]);

        // Update the form
        applyForm.setFieldsValue({
          id_responsable: newResponsable.ID_collab,
        });

        setNomResp(`${newResponsable.Prenom} ${newResponsable.Nom}`);

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
        Nom: values.nom,
        Prenom: values.prenom,
        Email: values.email,
        Tel: values.telephone,
        Poste: "consultant", // Set as consultant
        Actif: true,
        CV: consultantUploadedFileUrl,
        date_debut_activ: values.date_debut_activ.format("YYYY-MM-DD"),
      };

      const response = await axios.post(API_URL, newCollaborator, {
        headers: {
          Authorization: `${token()}`,
        },
      });

      if (response.data && response.data.error === false) {
        message.success("Nouveau consultant ajouté avec succès");

        // Update the consultant list and form selection
        const newConsultant = response.data.data;

        // Add to the consultants array
        const updatedConsultants = [
          ...consultants,
          {
            ...newConsultant,
            ID_collab: newConsultant.ID_collab,
            Poste: "consultant",
          },
        ];

        setConsultants(updatedConsultants);

        // Set the consultant in the form
        applyForm.setFieldsValue({
          id_consultant: newConsultant.ID_collab,
        });

        setNomCo(`${newConsultant.Prenom} ${newConsultant.Nom}`);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      0: "Brouillon",
      1: "Ouvert",
      2: "En cours",
      3: "Fermé",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColorMap = {
      0: "gray",
      1: "green",
      2: "blue",
      3: "red",
    };
    return statusColorMap[status] || "default";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  // File upload props for Add Responsable - Updated to match collaborateur.jsx
  const uploadProps = {
    name: "uploadedFile",
    multiple: false,
    maxCount: 1,
    accept: ".pdf,.doc,.docx",
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "./uploads/cv/");

      try {
        setUploading(true);
        const response = await axios.post(UPLOAD_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `${token()}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({ percent });
          },
        });

        if (response.data && response.data.url) {
          setUploadedFileUrl(response.data.url);
          setIsFileUploaded(true);
          onSuccess(response.data);
          message.success(`${file.name} chargé avec succès`);
        } else {
          throw new Error("URL de fichier non reçue");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setIsFileUploaded(false);
        onError(error);
        message.error(`Échec de téléchargement de ${file.name}`);
      } finally {
        setUploading(false);
      }
    },
    onChange: (info) => {
      let newFileList = [...info.fileList];
      newFileList = newFileList.slice(-1);
      setFileList(newFileList);

      // Reset the upload status if file list is cleared
      if (newFileList.length === 0) {
        setIsFileUploaded(false);
        setUploadedFileUrl("");
      }
    },
    beforeUpload: (file) => {
      // Check file type
      const isPDF = file.type === "application/pdf";
      const isDoc =
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const isValidType = isPDF || isDoc;

      if (!isValidType) {
        message.error("Veuillez télécharger un fichier PDF ou Word!");
        return false;
      }

      // Check file size (limit to 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Le fichier doit être inférieur à 5MB!");
        return false;
      }

      return isValidType && isLt5M;
    },
    fileList,
    onRemove: () => {
      setIsFileUploaded(false);
      setUploadedFileUrl("");
      setFileList([]);
      return true;
    },
  };

  // File upload props for Add Consultant - Updated to match collaborateur.jsx
  const consultantUploadFormProps = {
    name: "uploadedFile",
    multiple: false,
    maxCount: 1,
    accept: ".pdf,.doc,.docx",
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "./uploads/cv/");

      try {
        setUploading(true);
        const response = await axios.post(UPLOAD_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `${token()}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({ percent });
          },
        });

        if (response.data && response.data.url) {
          setConsultantUploadedFileUrl(response.data.url);
          setIsConsultantFileUploaded(true);
          onSuccess(response.data);
          message.success(`${file.name} chargé avec succès`);
        } else {
          throw new Error("URL de fichier non reçue");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setIsConsultantFileUploaded(false);
        onError(error);
        message.error(`Échec de téléchargement de ${file.name}`);
      } finally {
        setUploading(false);
      }
    },
    onChange: (info) => {
      let newFileList = [...info.fileList];
      newFileList = newFileList.slice(-1);
      setConsultantFileList(newFileList);

      // Reset the upload status if file list is cleared
      if (newFileList.length === 0) {
        setIsConsultantFileUploaded(false);
        setConsultantUploadedFileUrl("");
      }
    },
    beforeUpload: (file) => {
      // Check file type
      const isPDF = file.type === "application/pdf";
      const isDoc =
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const isValidType = isPDF || isDoc;

      if (!isValidType) {
        message.error("Veuillez télécharger un fichier PDF ou Word!");
        return false;
      }

      // Check file size (limit to 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Le fichier doit être inférieur à 5MB!");
        return false;
      }

      return isValidType && isLt5M;
    },
    fileList: consultantFileList,
    onRemove: () => {
      setIsConsultantFileUploaded(false);
      setConsultantUploadedFileUrl("");
      setConsultantFileList([]);
      return true;
    },
  };

  // Add Responsable Modal
  const AddResponsableModal = () => {
    return (
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
        width={600}
      >
        <Form
          form={addResponsableForm}
          layout="vertical"
          initialValues={{
            date_debut_activ: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nom"
                label="Nom"
                rules={[{ required: true, message: "Veuillez saisir le nom" }]}
              >
                <Input placeholder="Nom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="prenom"
                label="Prénom"
                rules={[
                  { required: true, message: "Veuillez saisir le prénom" },
                ]}
              >
                <Input placeholder="Prénom" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Veuillez saisir l'email" },
                  { type: "email", message: "Format d'email invalide" },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="telephone"
                label="Téléphone"
                rules={[
                  { required: true, message: "Veuillez saisir le téléphone" },
                ]}
              >
                <Input placeholder="Téléphone" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="date_debut_activ"
            label="Date de recrutement"
            rules={[
              { required: true, message: "Veuillez sélectionner une date" },
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="cv"
            label="CV"
            rules={[{ required: true, message: "Veuillez uploader un CV" }]}
            tooltip="Téléchargez le CV du responsable (format PDF ou Word, max 5MB)"
            extra="Formats acceptés: PDF, DOC, DOCX - Taille maximale: 5MB"
          >
            <Upload.Dragger {...uploadProps} listType="picture">
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Cliquez ou déposez un fichier ici
              </p>
            </Upload.Dragger>

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
    );
  };

  // Add Consultant Modal
  const AddConsultantModal = () => {
    return (
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
        width={600}
      >
        <Form
          form={addConsultantForm}
          layout="vertical"
          initialValues={{
            date_debut_activ: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nom"
                label="Nom"
                rules={[{ required: true, message: "Veuillez saisir le nom" }]}
              >
                <Input placeholder="Nom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="prenom"
                label="Prénom"
                rules={[
                  { required: true, message: "Veuillez saisir le prénom" },
                ]}
              >
                <Input placeholder="Prénom" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Veuillez saisir l'email" },
                  { type: "email", message: "Format d'email invalide" },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="telephone"
                label="Téléphone"
                rules={[
                  { required: true, message: "Veuillez saisir le téléphone" },
                ]}
              >
                <Input placeholder="Téléphone" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="date_debut_activ"
            label="Date de recrutement"
            rules={[
              { required: true, message: "Veuillez sélectionner une date" },
            ]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="cv"
            label="CV"
            rules={[{ required: true, message: "Veuillez uploader un CV" }]}
            tooltip="Téléchargez le CV du consultant (format PDF ou Word, max 5MB)"
            extra="Formats acceptés: PDF, DOC, DOCX - Taille maximale: 5MB"
          >
            <Upload.Dragger {...consultantUploadFormProps} listType="picture">
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Cliquez ou déposez un fichier ici
              </p>
            </Upload.Dragger>

            {isConsultantFileUploaded && (
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
    );
  };

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
            <Button type="primary" onClick={() => showAddResponsableModal()}>
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
            <Button type="primary" onClick={() => showAddConsultantModal()}>
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
