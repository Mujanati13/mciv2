import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Divider,
  Avatar,
  Space,
  Button,
  Row,
  Col,
  message,
  Form,
  Input,
  DatePicker,
  Progress,
  Alert,
  Tooltip,
  Modal,
  Checkbox,
  Spin,
  Steps,
} from "antd";
import {
  BuildOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  SafetyOutlined,
  LoadingOutlined,
  EditOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  CreditCardOutlined,
  BarcodeOutlined,
  NumberOutlined,
  FileProtectOutlined,
  FilePdfOutlined,
  UserOutlined,
  FormOutlined,
  FileSearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit, token } from "../../helper/enpoint";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Import and register i18n‑iso‑countries for localized country names
import countriesLib from "i18n-iso-countries";
import frLocale from "i18n-iso-countries/langs/fr.json";
countriesLib.registerLocale(frLocale);

const { Text, Paragraph } = Typography;

const axiosConfig = {
  headers: {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
  },
};

const pulseAnimationStyle = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(255, 215, 0, 0.4);
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 140, 0, 0);
      transform: scale(1);
    }
  }
  .orange-pulse-animation {
    animation: pulse 1.5s infinite;
    background: linear-gradient(45deg, #ff8c00, #ffd700);
    border-color: #ff8c00;
  }
`;

const ESNProfilePageFrancais = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [completionStatus, setCompletionStatus] = useState(0);
  const [isAccountActive, setIsAccountActive] = useState(false);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractCheckbox, setContractCheckbox] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const pdfRef = useRef(null);
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const baseApiUrl = Endponit();
  const [currentStep, setCurrentStep] = useState(0);

  // Get activation step based on status
  const getActivationStep = (status, completionPercentage) => {
    if (!status) return 0;
    
    switch (status.toLowerCase()) {
      case "draft":
        return completionPercentage === 100 ? 1 : 0;
      case "à valider":
        return 1;
      case "à signer":
        return 2;
      case "actif":
      case "validé":
        return 3;
      default:
        return 0;
    }
  };

  // Fetch countries and convert ISO codes to localized names (French)
  const fetchCountries = useCallback(async () => {
    try {
      setCountriesLoading(true);
      const response = await axios.get(
        `http://51.38.99.75:3100/api/countries`,
        axiosConfig
      );
      if (response.data.success) {
        // Map each ISO code to an object with code and localized name
        const countryList = response.data.data.map((countryCode) => {
          const localizedName =
            countriesLib.getName(countryCode, "fr") || countryCode;
          return { code: countryCode, name: localizedName };
        });
        setCountries(countryList);
      } else {
        message.error("Impossible de charger la liste des pays");
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      message.error("Erreur lors du chargement des pays");
    } finally {
      setCountriesLoading(false);
    }
  }, [baseApiUrl]);

  // Fetch cities for a given country
  const fetchCities = useCallback(
    async (country) => {
      if (!country) {
        setCities([]);
        return;
      }
      try {
        setCitiesLoading(true);
        const response = await axios.get(
          `http://51.38.99.75:3100/api/cities/${country}`,
          axiosConfig
        );
        if (response.data.success) {
          setCities(response.data.data || []);
        } else {
          message.warning(`Aucune ville disponible pour ${country}`);
          setCities([]);
        }
      } catch (error) {
        console.error(`Failed to fetch cities for ${country}:`, error);
        message.error(`Erreur lors du chargement des villes pour ${country}`);
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    },
    [baseApiUrl]
  );

  const handleCountryChange = (value) => {
    // Clear the city field when the country changes
    form.setFieldsValue({ Ville: undefined });
    fetchCities(value);
  };

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (profileData?.Statut === "à signer") {
      message.info({
        content:
          "Action requise: Veuillez accepter le contrat pour activer votre compte",
        duration: 5,
        icon: <FileProtectOutlined style={{ color: "#1890ff" }} />,
      });
    }
  }, [profileData?.Statut]);

  useEffect(() => {
    if (isEditing && profileData?.Pays) {
      fetchCities(profileData.Pays);
    }
  }, [isEditing, profileData?.Pays, fetchCities]);

  const showContractModal = () => {
    setContractModalVisible(true);
  };

  const handleContractAcceptance = async () => {
    if (!contractCheckbox) {
      message.warning("Veuillez accepter les termes du contrat");
      return;
    }
    try {
      setLoading(true);
      const esnId = localStorage.getItem("id");
      const updatePayload = {
        ...profileData,
        ID_ESN: esnId,
        Statut: "Actif",
      };
      const response = await axios.put(
        `${baseApiUrl}/api/ESN/`,
        updatePayload,
        axiosConfig
      );
      if (response) {
        setContractAccepted(true);
        setContractModalVisible(false);
        setProfileData({
          ...profileData,
          Statut: "Actif",
        });
        setCurrentStep(3);
        message.success("Contrat accepté avec succès!");
        generatePDF();
        // Refresh the page after contract acceptance and PDF generation
        window.location.reload();
      } else {
        throw new Error("Échec de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
      message.error("Erreur lors de l'acceptation du contrat");
    } finally {
      setLoading(false);
    }
  };

  const activateESNAccount = async () => {
    try {
      setLoading(true);
      const esnId = localStorage.getItem("id");
      const updatePayload = {
        ID_ESN: esnId,
        Statut: "actif",
        Date_validation: dayjs().format("YYYY-MM-DD"),
      };
      const response = await axios.put(
        `${baseApiUrl}/api/ESN/updateStatus`,
        updatePayload,
        axiosConfig
      );
      if (response.data && response.data.success) {
        setProfileData({
          ...profileData,
          Statut: "actif",
          Date_validation: dayjs(),
        });
        setIsAccountActive(true);
        setCurrentStep(3);
        message.success("Compte ESN activé avec succès!");
      } else {
        throw new Error("Échec de l'activation du compte");
      }
    } catch (error) {
      console.error("Error activating account:", error);
      message.error("Erreur lors de l'activation du compte");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!profileData) return;
    try {
      const doc = new jsPDF();
      // Page 1: Title & Parties
      doc.setFontSize(22);
      doc.setTextColor(0, 51, 102);
      doc.text("CONTRAT D'ADHÉSION", 105, 20, { align: "center" });
      doc.setFontSize(18);
      doc.text("MAGHREBITCONNECT", 105, 30, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${dayjs().format("DD/MM/YYYY")}`, 105, 40, {
        align: "center",
      });
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("ENTRE LES PARTIES SOUSSIGNÉES:", 20, 60);
      doc.setFontSize(11);
      doc.text("MAGHREBITCONNECT", 20, 75);
      doc.setFontSize(10);
      doc.text(
        "Société par actions simplifiée, au capital de 100.000 Dirhams,",
        20,
        82
      );
      doc.text(
        "immatriculée au Registre du Commerce de Casablanca sous le numéro RC123456,",
        20,
        89
      );
      doc.text(
        "dont le siège social est situé 123 Boulevard Mohammed V, à Casablanca (20000),",
        20,
        96
      );
      doc.text(
        "Représentée par Monsieur Ahmed Alaoui, en qualité de Directeur Général,",
        20,
        103
      );
      doc.text("Ci-après désignée «MaghrebitConnect»", 20, 110);
      doc.setFont(undefined, "bold");
      doc.text("D'UNE PART", 20, 117);
      doc.setFont(undefined, "normal");
      doc.text("ET", 105, 125, { align: "center" });
      doc.setFontSize(11);
      doc.text(`${profileData.Raison_sociale || "[Raison sociale]"}`, 20, 140);
      doc.setFontSize(10);
      doc.text(
        `immatriculée au Registre du Commerce et des sociétés sous le numéro`,
        20,
        147
      );
      doc.text(
        `${profileData.SIRET || "[SIRET]"}, dont le siège social est situé à ${
          profileData.Adresse || "[Adresse]"
        }, ${profileData.CP || ""} ${profileData.Ville || ""}.`,
        20,
        154
      );
      doc.text(
        `Représentée par ${
          profileData.responsible || "[Représentant]"
        }, dûment habilité au titre des présentes,`,
        20,
        161
      );
      doc.text("Ci-après dénommée, le « Prestataire »", 20, 175);
      doc.setFont(undefined, "bold");
      doc.text("D'AUTRE PART", 20, 182);
      doc.setFont(undefined, "normal");
      doc.setFontSize(12);
      doc.text("IL A ÉTÉ CONVENU CE QUI SUIT:", 105, 200, { align: "center" });
      doc.text("Page 1/5", 105, 282, { align: "center" });
      // Additional pages omitted for brevity...
      doc.save(`Contrat_ESN_${profileData.Raison_sociale}.pdf`);
      setPdfGenerated(true);
      message.success("Contrat téléchargé avec succès!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Erreur lors de la génération du contrat");
    }
  };

  const calculateProfileCompletion = (data) => {
    const requiredFields = {
      Raison_sociale: { weight: 15, filled: !!data.Raison_sociale },
      mail_Contact: { weight: 15, filled: !!data.mail_Contact },
      Adresse: { weight: 10, filled: !!data.Adresse },
    };
    const importantFields = {
      SIRET: { weight: 10, filled: !!data.SIRET },
      CP: { weight: 5, filled: !!data.CP },
      Ville: { weight: 5, filled: !!data.Ville },
      N_TVA: { weight: 5, filled: !!data.N_TVA },
    };
    const additionalFields = {
      Pays: { weight: 3, filled: !!data.Pays },
      RCE: { weight: 5, filled: !!data.RCE },
      IBAN: { weight: 7, filled: !!data.IBAN },
      BIC: { weight: 5, filled: !!data.BIC },
      Banque: { weight: 5, filled: !!data.Banque },
      responsible: { weight: 5, filled: !!data.responsible },
    };
    const allFields = {
      ...requiredFields,
      ...importantFields,
      ...additionalFields,
    };
    let totalWeight = 0;
    let filledWeight = 0;
    Object.values(allFields).forEach((field) => {
      totalWeight += field.weight;
      if (field.filled) {
        filledWeight += field.weight;
      }
    });
    const completion = Math.round((filledWeight / totalWeight) * 100);
    setCompletionStatus(completion);
    const active = completion >= 99 && data.Statut?.toLowerCase() === "actif";
    setIsAccountActive(active);
    
    // Set current step based on status
    setCurrentStep(getActivationStep(data.Statut, completion));
    
    if (
      completion === 100 &&
      data.Statut !== "à signer" &&
      data.Statut !== "actif" &&
      data.Statut !== "à valider"
    ) {
      if (completion === 100 && data.Statut === "Draft") {
        updateProfileStatus(data);
      }
    }
  };

  const updateProfileStatus = async (data) => {
    try {
      const esnId = localStorage.getItem("id");
      const updatePayload = {
        ...data,
        ID_ESN: esnId,
        Statut: "à valider",
      };
      const response = await axios.put(
        `${baseApiUrl}/api/ESN/`,
        updatePayload,
        axiosConfig
      );
      if (response.data) {
        setProfileData({
          ...data,
          Statut: "à valider",
        });
        setCurrentStep(1);
        message.success(
          "Votre profil est complet! Statut mis à jour: à valider"
        );
      }
    } catch (error) {
      console.error("Error updating ESN status:", error);
      message.error("Erreur lors de la mise à jour automatique du statut");
    }
  };

  useEffect(() => {
    const fetchESNData = async () => {
      try {
        const esnId = localStorage.getItem("id");
        if (!esnId) {
          throw new Error("ESN ID not found in localStorage");
        }
        const response = await axios.get(
          `${baseApiUrl}/api/getEsnData/?esnId=${esnId}`
        );
        if (response.data && response.data.data) {
          const data = response.data.data[0] || response.data.data;
          if (data.Date_validation) {
            data.Date_validation = dayjs(data.Date_validation);
          }
          setProfileData(data);
          calculateProfileCompletion(data);
        } else {
          throw new Error("No ESN data found");
        }
      } catch (err) {
        setError(err.message);
        message.error("Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchESNData();
  }, [baseApiUrl]);

  const startEditing = () => {
    form.setFieldsValue(profileData);
    setIsEditing(true);
    if (profileData?.Pays) {
      fetchCities(profileData.Pays);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(true);
      const esnId = localStorage.getItem("id");
      const formValues = form.getFieldsValue(true);
      let updatePayload = {
        ...profileData,
        ...formValues,
        ID_ESN: esnId,
        Date_validation: formValues.Date_validation
          ? formValues.Date_validation.format("YYYY-MM-DD")
          : null,
      };
      const requiredFields = [
        "Raison_sociale",
        "mail_Contact",
        "Adresse",
        "SIRET",
        "CP",
        "Ville",
        "Tel_Contact",
      ];
      const allFieldsFilled = requiredFields.every(
        (field) => updatePayload[field]
      );
      if (
        allFieldsFilled &&
        profileData.Statut !== "ready" &&
        profileData.Statut !== "Actif" &&
        profileData.Statut !== "à valider"
      ) {
        updatePayload.Statut = "à valider";
        setCurrentStep(1);
      }
      console.log("Sending update payload:", updatePayload);
      const response = await axios.put(
        `${baseApiUrl}/api/ESN/`,
        updatePayload,
        axiosConfig
      );
      if (response.data) {
        const refreshResponse = await axios.get(
          `${baseApiUrl}/api/getEsnData/?esnId=${esnId}`,
          axiosConfig
        );
        if (refreshResponse.data && refreshResponse.data.data) {
          const refreshedData =
            refreshResponse.data.data[0] || refreshResponse.data.data;
          if (refreshedData.Date_validation) {
            refreshedData.Date_validation = dayjs(
              refreshedData.Date_validation
            );
          }
          setProfileData(refreshedData);
          calculateProfileCompletion(refreshedData);
        }
        if (updatePayload.Statut === "à valider") {
          message.success("Profil complété et soumis pour validation!");
        } else {
          message.success("Profil mis à jour avec succès");
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update error:", error);
      message.error("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  // Get status guidance based on current status
  const getStatusGuidance = () => {
    if (!profileData) return {};
    
    switch (profileData.Statut) {
      case "Draft":
        return {
          title: "Profil incomplet",
          description: "Veuillez compléter votre profil pour activer votre compte.",
          nextStep: "Remplissez tous les champs requis pour passer à l'étape suivante.",
          icon: <FormOutlined style={{ color: "#faad14" }} />,
          color: "warning",
          action: (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={startEditing}
              disabled={isEditing}>
              Compléter mon profil
            </Button>
          )
        };
      case "à valider":
        return {
          title: "En attente de validation",
          description: "Votre profil a été soumis et est en cours d'examen par notre équipe.",
          nextStep: "Nous vous contacterons prochainement pour la suite du processus.",
          icon: <FileSearchOutlined style={{ color: "#1890ff" }} />,
          color: "info",
          action: (
            <Button type="default" disabled>
              Validation en cours...
            </Button>
          )
        };
      case "à signer":
        return {
          title: "Contrat à signer",
          description: "Votre profil a été validé. Veuillez maintenant accepter les conditions du contrat.",
          nextStep: "Après acceptation, vous pourrez accéder à toutes les fonctionnalités de la plateforme.",
          icon: <FileProtectOutlined style={{ color: "#52c41a" }} />,
          color: "info",
          action: (
            <Button 
              type="primary" 
              icon={<FileProtectOutlined />} 
              onClick={showContractModal}
              className="orange-pulse-animation">
              Accepter le contrat
            </Button>
          )
        };
      case "Actif":
      case "actif":
      case "validé":
        return {
          title: "Compte activé",
          description: "Votre compte est pleinement activé.",
          nextStep: "Vous avez maintenant accès à toutes les fonctionnalités de la plateforme.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          color: "success",
          action: (
            <Button 
              type="default" 
              icon={<FilePdfOutlined />} 
              onClick={generatePDF}>
              Télécharger le contrat
            </Button>
          )
        };
      default:
        return {
          title: "Statut indéterminé",
          description: "Veuillez contacter notre support pour plus d'informations.",
          nextStep: "Nous vous aiderons à résoudre ce problème rapidement.",
          icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          color: "warning",
          action: null
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space direction="vertical" align="center">
          <LoadingOutlined style={{ fontSize: 48, color: "#1890ff" }} />
          <Text>Chargement des données...</Text>
        </Space>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <Typography.Title level={4} type="danger">
            Erreur de Chargement
          </Typography.Title>
          <Text>{error || "Aucune donnée disponible"}</Text>
        </Card>
      </div>
    );
  }

  // Status guidance content
  const statusGuidance = getStatusGuidance();

  const renderContent = () => {
    const formItemLayout = {
      labelCol: { span: 24 },
      wrapperCol: { span: 24 },
    };

    if (isEditing) {
      return (
        <Form
          form={form}
          layout="vertical"
          initialValues={profileData}
          onFinish={handleUpdate}
          {...formItemLayout}
        >
          <Row gutter={[16, 16]}>
            {/* Company Icon/Avatar */}
            <Col span={24} className="text-center mb-6">
              <Avatar
                size={100}
                icon={<BuildOutlined />}
                className="mb-4 border-4 border-blue-500"
              />
            </Col>
            {/* Company Information */}
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <SafetyOutlined />
                    Informations de l'Entreprise
                  </Space>
                }
                bordered={false}
              >
                <Row gutter={16}>
                  <Col span={24} md={8}>
                    <Form.Item
                      name="Raison_sociale"
                      label="Raison sociale"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <Input prefix={<BuildOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={8}>
                    <Form.Item
                      name="SIRET"
                      label="Numéro SIRET"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <Input prefix={<IdcardOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={8}>
                    <Form.Item name="N_TVA" label="Numéro de TVA">
                      <Input prefix={<BarcodeOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="responsible" label="Representant legal">
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="Representant legal"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={12}>
                    <Form.Item name="RCE" label="RCE">
                      <Input prefix={<IdcardOutlined />} />
                    </Form.Item>
                  </Col>
                  {/* Pays Field using localized country names */}
                  <Col span={24} md={12}>
                    <Form.Item
                      name="Pays"
                      label="Pays"
                      rules={[
                        {
                          required: true,
                          message: "Veuillez sélectionner un pays",
                        },
                      ]}
                    >
                      <div style={{ position: "relative" }}>
                        {countriesLoading && (
                          <div
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 1,
                            }}
                          >
                            <Spin size="small" />
                          </div>
                        )}
                        <select
                          className="ant-input"
                          style={{
                            width: "100%",
                            height: "32px",
                            padding: "4px 11px",
                            color: "rgba(0, 0, 0, 0.85)",
                            border: "1px solid #d9d9d9",
                            borderRadius: "2px",
                            backgroundColor: "#fff",
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            form.setFieldsValue({ Pays: value });
                            handleCountryChange(value);
                          }}
                          disabled={countriesLoading}
                          value={form.getFieldValue("Pays") || ""}
                        >
                          <option value="">Sélectionnez votre pays</option>
                          {countries.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            {/* Contact Information */}
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <GlobalOutlined />
                    Coordonnées de Contact
                  </Space>
                }
                bordered={false}
              >
                <Row gutter={16}>
                  <Col span={24} md={6}>
                    <Form.Item
                      name="mail_Contact"
                      label="E-mail"
                      rules={[
                        { required: true, message: "Champ requis" },
                        { type: "email", message: "E-mail invalide" },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={6}>
                    <Form.Item
                      name="Tel_Contact"
                      label="Téléphone"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={12}>
                    <Form.Item
                      name="Adresse"
                      label="Adresse"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <Input prefix={<HomeOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={4}>
                    <Form.Item
                      name="CP"
                      label="Code Postal"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <Input prefix={<NumberOutlined />} />
                    </Form.Item>
                  </Col>
                  {/* Ville Field now as a dropdown using cities data */}
                  <Col span={24} md={4}>
                    <Form.Item
                      name="Ville"
                      label="Ville"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <div style={{ position: "relative" }}>
                        {citiesLoading && (
                          <div
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 1,
                            }}
                          >
                            <Spin size="small" />
                          </div>
                        )}
                        <select
                          className="ant-input"
                          style={{
                            width: "100%",
                            height: "32px",
                            padding: "4px 11px",
                            color: "rgba(0, 0, 0, 0.85)",
                            border: "1px solid #d9d9d9",
                            borderRadius: "2px",
                            backgroundColor: "#fff",
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            form.setFieldsValue({ Ville: value });
                          }}
                          disabled={citiesLoading}
                          value={form.getFieldValue("Ville") || ""}
                        >
                          <option value="">Sélectionnez votre ville</option>
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={24} md={4}>
                    <Form.Item name="Province" label="Province/Région">
                      <Input prefix={<EnvironmentOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            {/* Bank Information */}
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <BankOutlined />
                    Informations Bancaires
                  </Space>
                }
                bordered={false}
              >
                <Row gutter={16}>
                  <Col span={24} md={8}>
                    <Form.Item name="Banque" label="Banque">
                      <Input prefix={<BankOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={8}>
                    <Form.Item name="IBAN" label="IBAN">
                      <Input prefix={<CreditCardOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={8}>
                    <Form.Item name="BIC" label="Code BIC">
                      <Input prefix={<CreditCardOutlined />} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            {/* Form Actions */}
            <Col span={24} className="text-center">
              <Space>
                <Button type="default" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Enregistrer
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      );
    }
    
    return (
      <div>
        {/* Steps for activation process - Only show when account is not active */}
        {!isAccountActive && (
          <Card className="mb-6 shadow rounded-xl overflow-hidden bg-white">
            <div className="p-3">
              <Steps 
                current={currentStep}
                labelPlacement="vertical"
                progressDot
                size="small"
                className="my-2"
                items={[
                  {
                    title: 'Compléter le profil',
                    description: null,
                    status: currentStep >= 0 ? (currentStep > 0 ? 'finish' : 'process') : 'wait',
                  },
                  {
                    title: 'Validation',
                    description: null,
                    status: currentStep >= 1 ? (currentStep > 1 ? 'finish' : 'process') : 'wait',
                  },
                  {
                    title: 'Contrat',
                    description: null,
                    status: currentStep >= 2 ? (currentStep > 2 ? 'finish' : 'process') : 'wait',
                  },
                  {
                    title: 'Actif',
                    description: null,
                    status: currentStep >= 3 ? 'finish' : 'wait',
                  },
                ]}
              />
            </div>
          </Card>
        )}

        {/* Status guidance alert - Compact version */}
        <Card className="mb-6 shadow rounded-xl overflow-hidden bg-white">
          <div className={`px-4 py-3 flex items-start ${
            isAccountActive ? 'bg-green-50 border-b border-green-200' : 
            statusGuidance.color === 'warning' ? 'bg-orange-50 border-b border-orange-200' : 
            'bg-blue-50 border-b border-blue-200'
          }`}>
            <div className="mr-3 mt-1">
              {statusGuidance.icon}
            </div>
            <div className="flex-grow">
              <div className="font-medium text-lg">
                {statusGuidance.title}
              </div>
              <div className="text-sm mt-1">
                {statusGuidance.description}
                {!isAccountActive && (
                  <div className="mt-1 text-sm text-gray-600">
                    <b>{isAccountActive ? '' : 'Prochaine étape :'}</b> {statusGuidance.nextStep}
                  </div>
                )}
              </div>
              {statusGuidance.action && (
                <div className="mt-2">
                  {statusGuidance.action}
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Profile Completion Progress */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card bordered={false} className="shadow rounded-xl overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <div className="mb-4 md:mb-0 w-full">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-blue-900 mr-3">
                      Complétude du profil
                    </h3>
                    <Tag
                      color={profileData.Statut === "Actif" || profileData.Statut === "actif" ? "success" : 
                            completionStatus === 100 ? "processing" : "warning"}
                      className="text-xs">
                      {profileData.Statut === "Actif" || profileData.Statut === "actif" ? (
                        <>
                          <CheckCircleOutlined /> {profileData.Statut}
                        </>
                      ) : (
                        <>
                          {completionStatus}%
                        </>
                      )}
                    </Tag>
                  </div>
                  <Tooltip title={`Profil ${completionStatus}% complété`}>
                    <Progress
                      percent={completionStatus}
                      status={completionStatus === 100 ? "success" : "active"}
                      strokeColor={{
                        "0%": "#108ee9",
                        "100%": "#87d068",
                      }}
                      strokeWidth={10}
                      className="w-full"
                    />
                  </Tooltip>
                </div>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={startEditing}
                >
                  Modifier le Profil
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          {/* Company Information Section */}
          <Col span={24}>
            <Divider orientation="center" className="text-2xl font-semibold">
              <Space>
                <SafetyOutlined />
                Informations de l'Entreprise
              </Space>
            </Divider>
            <Card bordered={false} className="shadow-sm rounded-xl">
              <Descriptions
                layout="vertical"
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                className="bg-white p-4"
              >
                <Descriptions.Item label="Raison Sociale">
                  <Text strong>{profileData.Raison_sociale}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Representant legal">
                  <Text strong>
                    {profileData.responsible || "Non spécifié"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Numéro SIRET">
                  <Text strong>{profileData.SIRET}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Numéro de TVA">
                  <Text strong>{profileData.N_TVA}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="RCE">
                  <Text strong>{profileData.RCE}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Pays">
                  <Text strong>{profileData.Pays}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          {/* Contact Information Section */}
          <Col span={24}>
            <Divider orientation="center" className="text-2xl font-semibold">
              <Space>
                <GlobalOutlined />
                Coordonnées de Contact
              </Space>
            </Divider>
            <Card bordered={false} className="shadow-sm rounded-xl">
              <Descriptions
                layout="vertical"
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                className="bg-white p-4"
              >
                <Descriptions.Item label="Adresse" span={2}>
                  <Paragraph copyable className="mb-0 text-base">
                    {profileData.Adresse}, {profileData.CP} {profileData.Ville}
                  </Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="Province/Région">
                  <Space>
                    <EnvironmentOutlined />{" "}
                    {profileData.Province || "Non spécifié"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="E-mail">
                  <Space>
                    <MailOutlined /> {profileData.mail_Contact}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone">
                  <Space>
                    <PhoneOutlined />{" "}
                    {profileData.Tel_Contact || "Non spécifié"}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          {/* Bank Information Section */}
          <Col span={24}>
            <Divider orientation="center" className="text-2xl font-semibold">
              <Space>
                <BankOutlined />
                Informations Bancaires
              </Space>
            </Divider>
            <Card bordered={false} className="shadow-sm rounded-xl">
              <Descriptions
                layout="vertical"
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                className="bg-white p-4"
              >
                <Descriptions.Item label="Banque">
                  {profileData.Banque || "Non spécifié"}
                </Descriptions.Item>
                <Descriptions.Item label="IBAN">
                  {profileData.IBAN || "Non spécifié"}
                </Descriptions.Item>
                <Descriptions.Item label="Code BIC">
                  {profileData.BIC || "Non spécifié"}
                </Descriptions.Item>
                <Descriptions.Item label="Date de Validation" span={2}>
                  {profileData.Date_validation
                    ? profileData.Date_validation.format("DD/MM/YYYY")
                    : "Non spécifié"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const contractModal = (
    <Modal
      title={
        <div className="text-center">
          <FileProtectOutlined /> Contrat d'Adhésion ESN
        </div>
      }
      open={contractModalVisible}
      onCancel={() => setContractModalVisible(false)}
      footer={[
        <Button key="back" onClick={() => setContractModalVisible(false)}>
          Annuler
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!contractCheckbox}
          onClick={handleContractAcceptance}
        >
          Accepter et Continuer
        </Button>,
      ]}
      width={800}
    >
      <div className="contract-content p-4 max-h-96 overflow-auto border rounded mb-4">
        <h2 className="text-xl mb-4">CONDITIONS GÉNÉRALES D'UTILISATION</h2>
        <p className="mb-3">
          Le présent contrat définit les conditions d'utilisation de la
          plateforme MaghrebitConnect par les Entreprises de Services Numériques
          (ESN).
        </p>
        <h3 className="text-lg font-bold mt-4">1. Objet du contrat</h3>
        <p className="mb-3">
          Ce contrat a pour objet de définir les conditions dans lesquelles
          l'ESN peut utiliser les services proposés par la plateforme
          MaghrebitConnect.
        </p>
        <h3 className="text-lg font-bold mt-4">2. Obligations de l'ESN</h3>
        <p className="mb-3">L'ESN s'engage à :</p>
        <ul className="list-disc pl-6 mb-3">
          <li>
            Fournir des informations exactes et à jour concernant son entreprise
          </li>
          <li>Respecter les conditions d'utilisation de la plateforme</li>
          <li>
            Ne pas utiliser la plateforme à des fins illégales ou frauduleuses
          </li>
          <li>Maintenir la confidentialité de ses identifiants de connexion</li>
        </ul>
        <h3 className="text-lg font-bold mt-4">3. Services fournis</h3>
        <p className="mb-3">
          MaghrebitConnect s'engage à fournir un accès aux services suivants :
        </p>
        <ul className="list-disc pl-6 mb-3">
          <li>Publication d'offres d'emploi</li>
          <li>Recherche de profils</li>
          <li>Gestion des candidatures</li>
          <li>Suivi des recrutements</li>
        </ul>
        <h3 className="text-lg font-bold mt-4">4. Responsabilités</h3>
        <p className="mb-3">MaghrebitConnect ne peut être tenu responsable :</p>
        <ul className="list-disc pl-6 mb-3">
          <li>
            Des inexactitudes ou erreurs dans les informations fournies par
            l'ESN
          </li>
          <li>De l'utilisation frauduleuse de la plateforme par l'ESN</li>
          <li>Des interruptions temporaires de service pour maintenance</li>
        </ul>
        <h3 className="text-lg font-bold mt-4">5. Durée du contrat</h3>
        <p className="mb-3">
          Le présent contrat est conclu pour une durée indéterminée à compter de
          son acceptation.
        </p>
        <h3 className="text-lg font-bold mt-4">6. Résiliation</h3>
        <p className="mb-3">
          Chacune des parties peut résilier le contrat moyennant un préavis de
          30 jours.
        </p>
      </div>
      <div className="text-center">
        <Checkbox
          onChange={(e) => setContractCheckbox(e.target.checked)}
          checked={contractCheckbox}
        >
          J'ai lu et j'accepte les conditions générales d'utilisation
        </Checkbox>
      </div>
    </Modal>
  );

  return (
    <div className="min-h-screen p-6">
      <style>{pulseAnimationStyle}</style>
      <Card className="max-w-6xl mx-auto" bordered={false}>
        {renderContent()}
      </Card>
      {contractModal}
    </div>
  );
};

export default ESNProfilePageFrancais;