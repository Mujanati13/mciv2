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
  Switch,
  InputNumber,
} from "antd";
import {
  InboxOutlined,
  DownOutlined,
  LoadingOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  CommentOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SwapOutlined,
  FilePdfOutlined,
  UploadOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  BankOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import moment from "moment";
import { Endponit, token } from "../../helper/enpoint";

const { TextArea } = Input;
const { Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;
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
  const [nom_co, setNomCo] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [createNewConsultant, setCreateNewConsultant] = useState(false);
  const [createNewManager, setCreateNewManager] = useState(false);
  const [consultantCvFile, setConsultantCvFile] = useState(null);
  const [managerCvFile, setManagerCvFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [searchText, setSearchText] = useState("");

  const columns = [
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

  // Calculates experience based on start date
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

  // Fetch available skills for dropdown
  useEffect(() => {
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

    fetchSkills();
  }, []);

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelect = (value, option) => {
    setNomCo(option.dataName);
    console.log("Selected ID:", value);
    console.log("Selected Name:", option.dataName);
  };

  const fetchConsultants = async (id_project) => {
    const esnId = localStorage.getItem("id") || 3;
    try {
      const response = await axios.get(
        `${Endponit()}/api/consultants-par-esn-et-projet/?esn_id=${esnId}&project_id=${id_project}`,
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );
      setConsultants(response.data.data);
    } catch (error) {
      message.error("Erreur lors du chargement des consultants");
      console.error("Error fetching consultants:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(Endponit() + "/api/appelOffre/", {
        headers: {
          Authorization: `${token()}`,
        },
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async (value) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${Endponit()}/api/appelOffre/?search=${value}`,
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );
      setData(response.data.data);
    } catch (error) {
      message.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (record) => {
    setCurrentOffer(record);
    fetchConsultants(record.id);
    applyForm.resetFields();
    applyForm.setFieldsValue({
      AO_id: record.id,
      date_disponibilite: dayjs().add(1, "week"),
      new_consultant_date_recrutement: dayjs(),
      new_manager_date_recrutement: dayjs(),
    });
    setCreateNewConsultant(false);
    setCreateNewManager(false);
    setConsultantCvFile(null);
    setManagerCvFile(null);
    setIsApplyModalVisible(true);
  };

  const handleViewDetails = (record) => {
    setCurrentOffer(record);
    setIsDetailsModalVisible(true);
  };

  const handleApplySubmit = () => {
    applyForm.submit();
  };

  // File upload props for consultant CV
  const consultantUploadProps = {
    name: "uploadedFile",
    multiple: false,
    maxCount: 1,
    accept: ".pdf,.doc,.docx",
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
          setConsultantCvFile(file);
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
      // Check if file is PDF or Word
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isValidType) {
        message.error("Seuls les fichiers PDF et DOC/DOCX sont acceptés!");
        return Upload.LIST_IGNORE;
      }

      // Check file size (limit to 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Le CV doit être inférieur à 5MB!");
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    onChange: (info) => {
      if (info.file.status === "error") {
        message.error(`${info.file.name} échec du téléchargement.`);
      }
    },
  };

  // File upload props for manager CV
  const managerUploadProps = {
    name: "uploadedFile",
    multiple: false,
    maxCount: 1,
    accept: ".pdf,.doc,.docx",
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
          setManagerCvFile(file);
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
      // Check if file is PDF or Word
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isValidType) {
        message.error("Seuls les fichiers PDF et DOC/DOCX sont acceptés!");
        return Upload.LIST_IGNORE;
      }

      // Check file size (limit to 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Le CV doit être inférieur à 5MB!");
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    onChange: (info) => {
      if (info.file.status === "error") {
        message.error(`${info.file.name} échec du téléchargement.`);
      }
    },
  };

  // Helper function to upload CV
  const uploadCV = async (file, collaborateurId, esnId) => {
    if (!file) return null;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("collaborateur_id", collaborateurId);
      formData.append("esn_id", esnId);
      formData.append("type", "cv");

      const response = await axios.post(UPLOAD_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `${token()}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading CV:", error);
      throw new Error("Échec du téléchargement du CV");
    }
  };

  // Handle form submission
  const onApplyFinish = async (values) => {
    setSubmitting(true);
    try {
      const esnId = localStorage.getItem("id") || 3;
      let consultantId = values.id_consultant;
      let responsableCompte = values.responsable_compte;
      let consultantName = nom_co;

      // Handle creation of new consultant if needed
      if (createNewConsultant) {
        try {
          const newConsultantData = {
            esn_id: esnId,
            Nom: values.new_consultant_nom,
            Prenom: values.new_consultant_prenom,
            Email: values.new_consultant_email,
            Telephone: values.new_consultant_telephone,
            Poste: "consultant",
            Actif: true,
            status: "actif",
            date_debut_activ: values.new_consultant_date_recrutement
              ? values.new_consultant_date_recrutement.format("YYYY-MM-DD")
              : dayjs().format("YYYY-MM-DD"),
            Date_naissance: values.new_consultant_date_naissance
              ? values.new_consultant_date_naissance.format("YYYY-MM-DD")
              : null,
            competences: values.new_consultant_skills
              ? values.new_consultant_skills.join(",")
              : "",
            experience: values.new_consultant_experience || 0,
            tjm_actuel: values.new_consultant_tjm || 0,
            nationalite: values.new_consultant_nationalite || "",
            adresse: values.new_consultant_adresse || "",
            code_postal: values.new_consultant_code_postal || "",
            ville: values.new_consultant_ville || "",
            rib: values.new_consultant_rib || "",
            LinkedIN: values.new_consultant_linkedin || "",
            Mobilité: values.new_consultant_mobilite || "",
          };

          // Create the consultant
          const consultantRes = await axios.post(API_URL, newConsultantData, {
            headers: {
              Authorization: `${token()}`,
            },
          });
          consultantId = consultantRes.data.id;
          consultantName = `${values.new_consultant_prenom} ${values.new_consultant_nom}`;

          // Upload CV if provided
          if (consultantCvFile) {
            const formData = new FormData();
            formData.append("file", consultantCvFile);
            formData.append("collaborateur_id", consultantId);
            formData.append("esn_id", esnId);
            formData.append("type", "cv");

            await axios.post(UPLOAD_URL, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token()}`,
              },
            });
          }

          message.success(`Consultant ${consultantName} créé avec succès!`);
        } catch (error) {
          console.error("Error creating new consultant:", error);
          message.error(
            "Erreur lors de la création du consultant: " +
              (error.response?.data?.message || error.message)
          );
          setSubmitting(false);
          return;
        }
      }

      // Handle creation of new account manager if needed
      if (createNewManager) {
        try {
          const newManagerData = {
            esn_id: esnId,
            Nom: values.new_manager_nom,
            Prenom: values.new_manager_prenom,
            Email: values.new_manager_email,
            Telephone: values.new_manager_telephone,
            Poste: "commercial",
            Actif: true,
            status: "actif",
            date_debut_activ: values.new_manager_date_recrutement
              ? values.new_manager_date_recrutement.format("YYYY-MM-DD")
              : dayjs().format("YYYY-MM-DD"),
            Date_naissance: values.new_manager_date_naissance
              ? values.new_manager_date_naissance.format("YYYY-MM-DD")
              : null,
            experience: values.new_manager_experience || 0,
            nationalite: values.new_manager_nationalite || "",
            adresse: values.new_manager_adresse || "",
            code_postal: values.new_manager_code_postal || "",
            ville: values.new_manager_ville || "",
            LinkedIN: values.new_manager_linkedin || "",
            Mobilité: values.new_manager_mobilite || "",
          };

          // Create the manager
          const managerRes = await axios.post(API_URL, newManagerData, {
            headers: {
              Authorization: `${token()}`,
            },
          });
          const managerId = managerRes.data.id;
          responsableCompte = `${values.new_manager_prenom} ${values.new_manager_nom}`;

          // Upload CV if provided
          if (managerCvFile) {
            const formData = new FormData();
            formData.append("file", managerCvFile);
            formData.append("collaborateur_id", managerId);
            formData.append("esn_id", esnId);
            formData.append("type", "cv");

            await axios.post(UPLOAD_URL, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `${token()}`,
              },
            });
          }

          message.success(
            `Responsable de compte ${responsableCompte} créé avec succès!`
          );
        } catch (error) {
          console.error("Error creating new account manager:", error);
          message.error(
            "Erreur lors de la création du responsable de compte: " +
              (error.response?.data?.message || error.message)
          );
          setSubmitting(false);
          return;
        }
      }

      // Submit candidature
      const formData = {
        AO_id: currentOffer.id,
        esn_id: esnId,
        responsable_compte: responsableCompte,
        id_consultant: consultantId,
        date_candidature: dayjs().format("YYYY-MM-DD"),
        statut: "En cours",
        tjm: values.tjm,
        date_disponibilite: values.date_disponibilite.format("YYYY-MM-DD"),
        commentaire: values.commentaire,
        nom_cn: consultantName,
      };

      const res_data = await axios.post(
        Endponit() + "/api/candidature/",
        formData,
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );

      // Send notification
      await axios.post(
        Endponit() + "/api/notify_new_candidature/",
        {
          condidature_id: res_data.data.id,
          appel_offre_id: currentOffer.id,
          client_id: currentOffer.id_client,
        },
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );

      message.success("Votre candidature a été soumise avec succès !");

      // Reset file states when done
      setConsultantCvFile(null);
      setManagerCvFile(null);

      setIsApplyModalVisible(false);
      applyForm.resetFields();
    } catch (error) {
      message.error(
        "Erreur lors de la soumission de la candidature: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Error submitting application:", error);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Input.Search
          placeholder="Rechercher un appel d'offre"
          onSearch={handleSearch}
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
                      <p className="text-sm">
                        Début: {formatDate(item.date_debut)}
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

            {currentOffer.contexte && (
              <>
                <Divider orientation="left">Contexte</Divider>
                <Paragraph>{currentOffer.contexte}</Paragraph>
              </>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="Soumettre une candidature"
        open={isApplyModalVisible}
        onCancel={() => {
          setIsApplyModalVisible(false);
          setCreateNewConsultant(false);
          setCreateNewManager(false);
          setConsultantCvFile(null);
          setManagerCvFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsApplyModalVisible(false);
              setCreateNewConsultant(false);
              setCreateNewManager(false);
              setConsultantCvFile(null);
              setManagerCvFile(null);
            }}
          >
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
        width={800} // Increased width for better form layout
      >
        <Form
          form={applyForm}
          onFinish={onApplyFinish}
          layout="vertical"
          initialValues={{
            date_candidature: dayjs(),
            date_disponibilite: dayjs().add(1, "week"),
            new_consultant_date_recrutement: dayjs(),
            new_manager_date_recrutement: dayjs(),
          }}
        >
          <Form.Item name="AO_id" hidden>
            <Input />
          </Form.Item>

          {/* Account Manager Section */}
          <div className="flex justify-between items-center mb-2">
            <Typography.Text strong>Responsable compte</Typography.Text>
            <Button
              type="link"
              onClick={() => setCreateNewManager(!createNewManager)}
              icon={createNewManager ? <SwapOutlined /> : <PlusOutlined />}
            >
              {createNewManager ? "Sélectionner existant" : "Ajouter nouveau"}
            </Button>
          </div>

          {!createNewManager ? (
            <Form.Item
              name="responsable_compte"
              rules={[
                {
                  required: !createNewManager,
                  message: "Sélectionnez un responsable de compte",
                },
              ]}
            >
              <Select
                placeholder="Sélectionnez un responsable de compte"
                allowClear
                optionFilterProp="children"
              >
                {consultants &&
                  consultants.map((consultant) =>
                    consultant.Poste === "commercial" ? (
                      <Select.Option
                        key={consultant.ID_collab}
                        value={`${consultant.Nom} ${consultant.Prenom}`}
                      >
                        {consultant.Prenom} {consultant.Nom} -{" "}
                        {consultant.Poste}
                      </Select.Option>
                    ) : null
                  )}
              </Select>
            </Form.Item>
          ) : (
            <div className="bg-gray-50 p-3 rounded mb-4">
              <Divider orientation="left">Informations personnelles</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="new_manager_nom"
                    label="Nom"
                    rules={[
                      { required: createNewManager, message: "Nom requis" },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nom" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="new_manager_prenom"
                    label="Prénom"
                    rules={[
                      { required: createNewManager, message: "Prénom requis" },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Prénom" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="new_manager_date_naissance"
                    label="Date de naissance"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const birthDate = new Date(value);
                          const today = new Date();
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
                    <DatePicker
                      placeholder="Date de naissance"
                      format="DD/MM/YYYY"
                      className="w-full"
                      disabledDate={(current) =>
                        current && current > moment().subtract(18, "years")
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">
                Informations professionnelles
              </Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="new_manager_date_recrutement"
                    label="Date de recrutement"
                    initialValue={dayjs()}
                  >
                    <DatePicker
                      placeholder="Date de recrutement"
                      format="DD/MM/YYYY"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Mobilité" name="new_manager_mobilite">
                    <Select placeholder="Sélectionnez la mobilité">
                      <Select.Option value="National">National</Select.Option>
                      <Select.Option value="International">
                        International
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Profil LinkedIn"
                    name="new_manager_linkedin"
                  >
                    <Input placeholder="https://www.linkedin.com/in/username" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="new_manager_cv"
                label="CV"
                tooltip="Téléchargez le CV du responsable (format PDF ou DOC/DOCX, max 5MB)"
              >
                <Upload {...managerUploadProps} listType="picture">
                  <Button icon={<UploadOutlined />}>Télécharger CV</Button>
                </Upload>
                <div className="flex justify-end mt-2 mb-4">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateNewManager(true)}
                    // disabled={createNewManager}
                  >
                    Ajouter responsable de compte
                  </Button>
                </div>
              </Form.Item>
            </div>
          )}

          {/* Consultant Section */}
          <div className="flex justify-between items-center mb-2 mt-4">
            <Typography.Text strong>Consultant</Typography.Text>
            <Button
              type="link"
              onClick={() => setCreateNewConsultant(!createNewConsultant)}
              icon={createNewConsultant ? <SwapOutlined /> : <PlusOutlined />}
            >
              {createNewConsultant
                ? "Sélectionner existant"
                : "Ajouter nouveau"}
            </Button>
          </div>

          {!createNewConsultant ? (
            <Form.Item
              name="id_consultant"
              rules={[
                {
                  required: !createNewConsultant,
                  message: "Sélectionnez un consultant",
                },
              ]}
            >
              <Select
                placeholder="Sélectionnez un consultant"
                optionFilterProp="children"
                onSelect={handleSelect}
              >
                {consultants &&
                  consultants.map((consultant) =>
                    consultant.Poste === "consultant" ? (
                      <Select.Option
                        key={consultant.ID_collab}
                        value={consultant.ID_collab}
                        dataName={`${consultant.Prenom} ${consultant.Nom}`}
                      >
                        {consultant.Prenom} {consultant.Nom} -{" "}
                        {consultant.Poste}
                      </Select.Option>
                    ) : (
                      ""
                    )
                  )}
              </Select>
            </Form.Item>
          ) : (
            <div className="bg-gray-50 p-3 rounded mb-4">
              <Divider orientation="left">Informations personnelles</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="new_consultant_nom"
                    label="Nom"
                    rules={[
                      { required: createNewConsultant, message: "Nom requis" },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nom" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="new_consultant_prenom"
                    label="Prénom"
                    rules={[
                      {
                        required: createNewConsultant,
                        message: "Prénom requis",
                      },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Prénom" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="new_consultant_date_naissance"
                    label="Date de naissance"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const birthDate = new Date(value);
                          const today = new Date();
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
                    <DatePicker
                      placeholder="Date de naissance"
                      format="DD/MM/YYYY"
                      className="w-full"
                      disabledDate={(current) =>
                        current && current > moment().subtract(18, "years")
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">
                Informations professionnelles
              </Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="new_consultant_date_recrutement"
                    label="Date de recrutement"
                    initialValue={dayjs()}
                  >
                    <DatePicker
                      placeholder="Date de recrutement"
                      format="DD/MM/YYYY"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Mobilité" name="new_consultant_mobilite">
                    <Select placeholder="Sélectionnez la mobilité">
                      <Select.Option value="National">National</Select.Option>
                      <Select.Option value="International">
                        International
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Profil LinkedIn"
                    name="new_consultant_linkedin"
                  >
                    <Input placeholder="https://www.linkedin.com/in/username" />
                  </Form.Item>
                </Col>
              </Row>

              {/* CV upload for consultant */}
              <Form.Item
                name="new_consultant_cv"
                label="CV"
                tooltip="Téléchargez le CV du consultant (format PDF ou DOC/DOCX, max 5MB)"
              >
                <Upload {...consultantUploadProps} listType="picture">
                  <Button icon={<UploadOutlined />}>Télécharger CV</Button>
                </Upload>
              </Form.Item>
            </div>
          )}

          {/* Application Details */}
          <Divider orientation="left">Détails de la candidature</Divider>

          <Form.Item
            name="tjm"
            label="TJM proposé"
            rules={[
              { required: true, message: "Veuillez saisir le TJM" },
              {
                validator: (_, value) => {
                  if (
                    value &&
                    (value < currentOffer?.tjm_min ||
                      value > currentOffer?.tjm_max)
                  ) {
                    return Promise.reject(
                      `Le TJM doit être entre ${currentOffer?.tjm_min}€ et ${currentOffer?.tjm_max}€`
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
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
              {
                validator: (_, value) => {
                  if (value && value.isBefore(moment().startOf("day"))) {
                    return Promise.reject(
                      "La date de disponibilité doit être dans le futur"
                    );
                  }
                  return Promise.resolve();
                },
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
    </div>
  );
};

export default AppelDOffreInterface;
