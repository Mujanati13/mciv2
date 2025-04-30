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
  Popover,
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
  InfoCircleOutlined,
  FileOutlined,
  SafetyCertificateOutlined,
  FileDoneOutlined,
  FolderOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit, token } from "../../helper/enpoint";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Link } from "react-router-dom";

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
  const [documents, setDocuments] = useState([]);
  const [documentStatus, setDocumentStatus] = useState({
    total: 5,
    completed: 0,
    percentage: 0,
  });

  // Documents requis
  const requiredDocuments = [
    { key: "kbis", name: "KBIS de moins de 3 mois" },
    {
      key: "attestation_fiscale",
      name: "Attestation de régularité fiscale de moins de 3 mois",
    },
    {
      key: "attestation_sociale",
      name: "Attestation de régularité sociale de moins de 3 mois",
    },
    { key: "rib", name: "RIB" },
    // { key: "dpae", name: "DPAE" },
  ];

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

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    const id = localStorage.getItem("id");
    try {
      const response = await axios.get(baseApiUrl + "/api/getDocumentESN/", {
        headers: {
          Authorization: `${token()}`,
        },
        params: {
          esnId: id,
        },
      });

      if (response.data && response.data.data) {
        const fetchedDocs = response.data.data.map((doc) => ({
          ...doc,
          key: doc.ID_DOC_ESN,
        }));

        setDocuments(fetchedDocs);

        // Calculate document completion
        let validDocCount = 0;

        // Check each required document type
        requiredDocuments.forEach((reqDoc) => {
          const foundDoc = fetchedDocs.find(
            (doc) =>
              doc.Titre.toLowerCase().includes(reqDoc.name.toLowerCase()) ||
              doc.Type?.toLowerCase().includes(reqDoc.name.toLowerCase())
          );

          if (foundDoc && foundDoc.Statut !== "À uploader") {
            validDocCount++;
          }
        });

        const docPercentage = Math.round(
          (validDocCount / requiredDocuments.length) * 100
        );
        setDocumentStatus({
          total: requiredDocuments.length,
          completed: validDocCount,
          percentage: docPercentage,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
    }
  }, [baseApiUrl]);

  // Fetch countries and convert ISO codes to localized names (French)
  const fetchCountries = useCallback(async () => {
    try {
      setCountriesLoading(true);
      const response = await axios.get(
        `https://51.38.99.75:4444/api/countries`,
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
          `https://51.38.99.75:4444/api/cities/${country}`,
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
    fetchDocuments();
  }, [fetchCountries, fetchDocuments]);

  useEffect(() => {
    if (profileData?.Statut === "à signer") {
      message.info({
        content:
          "Action requise: Veuillez Signer le contrat pour activer votre compte",
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

      // ====== PAGE 2: DÉFINITIONS ET OBJET DU CONTRAT ======
      doc.addPage();

      // Header
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("CONTRAT D'ADHÉSION MAGHREBITCONNECT", 105, 10, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);

      // Article 1
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 1: DÉFINITIONS", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "Dans le présent contrat, les termes suivants ont, sauf précision contraire, les significations suivantes:",
          "",
          "• «MaghrebitConnect»: désigne la plateforme en ligne permettant la mise en relation entre ESN et consultants",
          "• «ESN»: désigne toute Entreprise de Services Numériques inscrite sur la plateforme",
          "• «Consultant»: désigne tout professionnel indépendant proposant ses services via la plateforme",
          "• «Utilisateur»: désigne toute personne ayant accès à la plateforme (ESN ou Consultant)",
          "• «Services»: désigne l'ensemble des services proposés par MaghrebitConnect",
          "• «Données Personnelles»: désigne toute information se rapportant à une personne physique identifiée",
          "  ou identifiable conformément à la réglementation applicable",
        ],
        20,
        40
      );

      // Article 2
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 2: OBJET DU CONTRAT", 20, 115);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "Le présent contrat a pour objet de définir:",
          "",
          "2.1 Les conditions dans lesquelles l'ESN peut accéder aux Services proposés par MaghrebitConnect",
          "",
          "2.2 Les droits et obligations des parties dans le cadre de l'utilisation de la plateforme",
          "",
          "2.3 Les conditions financières applicables à l'utilisation des Services",
          "",
          "2.4 Les modalités de traitement des données personnelles",
        ],
        20,
        125
      );

      // Article 3
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 3: DESCRIPTION DES SERVICES", 20, 175);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "MaghrebitConnect propose à l'ESN les services suivants:",
          "",
          "3.1 Accès à une base de données de consultants qualifiés",
          "",
          "3.2 Outils de recherche et de filtrage des profils",
          "",
          "3.3 Système de messagerie intégrée pour communiquer avec les consultants",
          "",
          "3.4 Espace personnel de gestion des missions et des contrats",
          "",
          "3.5 Assistance et support technique",
        ],
        20,
        185
      );

      doc.text("Page 2/5", 105, 282, { align: "center" });

      // ====== PAGE 3: CONDITIONS FINANCIÈRES ======
      doc.addPage();

      // Header
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("CONTRAT D'ADHÉSION MAGHREBITCONNECT", 105, 10, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);

      // Article 4
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 4: DURÉE DU CONTRAT", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "4.1 Le présent contrat entre en vigueur à compter de sa date de signature.",
          "",
          "4.2 Il est conclu pour une durée indéterminée.",
          "",
          "4.3 Chacune des parties peut y mettre fin dans les conditions prévues à l'article 8.",
        ],
        20,
        40
      );

      // Article 5
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 5: CONDITIONS FINANCIÈRES", 20, 80);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "En contrepartie des Services fournis, l'ESN s'engage à payer à MaghrebitConnect:",
          "",
          "5.1 Une commission de 8% calculée sur le montant total HT facturé par le Consultant à l'ESN",
          "    pour chaque mission réalisée via la plateforme.",
          "",
          "5.2 Cette commission sera facturée mensuellement par MaghrebitConnect à l'ESN, à terme échu.",
          "",
          "5.3 Les paiements devront être effectués dans un délai de 30 jours à compter de la date d'émission",
          "    de la facture.",
          "",
          "5.4 Tout retard de paiement entraînera l'application de pénalités de retard au taux d'intérêt légal",
          "    majoré de 5 points, sans mise en demeure préalable.",
        ],
        20,
        90
      );

      doc.text(
        [
          "5.1 Modalités de facturation",
          "",
          "La facturation est établie mensuellement, à terme échu. Le Client recevra une facture détaillant",
          "les prestations réalisées durant le mois et le montant correspondant ainsi que la commission due.",
          "",
          "5.2 Modalités de paiement",
          "",
          "Les paiements sont dus à 30 jours à compter de la date d'émission de la facture.",
          "Les paiements peuvent être effectués par virement bancaire ou par carte bancaire.",
          "",
          "5.3 Retard de paiement",
          "",
          "Tout retard de paiement entraînera de plein droit l'application d'intérêts de retard au taux légal",
          "en vigueur, sans mise en demeure préalable.",
        ],
        20,
        170
      );

      doc.text("Page 3/5", 105, 282, { align: "center" });

      // ====== PAGE 4: RESPONSIBILITIES AND DATA PROTECTION ======
      doc.addPage();

      // Header
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("CONTRAT D'ADHÉSION MAGHREBITCONNECT", 105, 10, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);

      // Article 6 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 6: OBLIGATIONS DE L'ESN", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "Dans le cadre de l'utilisation de la plateforme MaghrebitConnect, l'ESN s'engage à:",
          "",
          "6.1 Fournir des informations exactes et à jour concernant son entreprise, notamment:",
          "• Raison sociale, numéro SIRET, numéro TVA",
          "• Coordonnées complètes (adresse, téléphone, email)",
          "• Identité du responsable légal",
          "",
          "6.2 Respecter les conditions d'utilisation de la plateforme, notamment:",
          "• Ne pas détourner la finalité des services proposés",
          "• Ne pas tenter de contourner le système de commission",
          "• Respecter les droits de propriété intellectuelle de MaghrebitConnect",
          "",
          "6.3 Ne pas utiliser la plateforme à des fins illégales ou frauduleuses",
          "",
          "6.4 Maintenir la confidentialité de ses identifiants de connexion",
          "",
          "6.5 S'acquitter des frais liés à l'utilisation des services selon la grille tarifaire",
        ],
        20,
        40
      );

      // Article 7 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 7: PROTECTION DES DONNÉES", 20, 140);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "7.1 MaghrebitConnect s'engage à respecter les réglementations en vigueur concernant la protection",
          "des données personnelles et à mettre en œuvre toutes les mesures techniques et organisationnelles",
          "appropriées pour assurer la sécurité des données.",
          "",
          "7.2 L'ESN reconnaît qu'elle traite des données personnelles de consultants et s'engage à:",
          "• Utiliser ces données uniquement dans le cadre des missions proposées via la plateforme",
          "• Ne pas conserver ces données au-delà de la durée nécessaire au projet",
          "• Respecter les droits des personnes concernées (droit d'accès, de rectification, d'effacement)",
          "",
          "7.3 Les parties s'engagent mutuellement à notifier sans délai toute violation de données",
          "personnelles susceptible d'avoir un impact sur les droits et libertés des personnes concernées.",
        ],
        20,
        150
      );

      // Article 8 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 8: RÉSILIATION", 20, 220);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "8.1 Chacune des parties peut résilier le contrat moyennant un préavis de 30 jours par lettre",
          "recommandée avec accusé de réception ou par email avec confirmation de lecture.",
          "",
          "8.2 En cas de manquement grave par l'une des parties à l'une de ses obligations, l'autre partie",
          "pourra résilier le contrat de plein droit, sans préavis ni indemnité, après mise en demeure restée",
          "sans effet pendant 15 jours.",
        ],
        20,
        230
      );

      doc.text("Page 4/5", 105, 282, { align: "center" });

      // ====== PAGE 5: COMPANY INFO AND SIGNATURES ======
      doc.addPage();

      // Header
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("CONTRAT D'ADHÉSION MAGHREBITCONNECT", 105, 10, {
        align: "center",
      });
      doc.setTextColor(0, 0, 0);

      // Article 9
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 9: LOI APPLICABLE ET JURIDICTION COMPÉTENTE", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "9.1 Le présent contrat est soumis au droit marocain.",
          "",
          "9.2 Tout litige relatif à l'interprétation, l'exécution ou la rupture du présent contrat sera soumis",
          "à la compétence exclusive des tribunaux de Casablanca, sauf disposition légale contraire.",
        ],
        20,
        40
      );

      // Article 10
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 10: DISPOSITIONS GÉNÉRALES", 20, 70);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "10.1 Le présent contrat constitue l'intégralité de l'accord entre les parties concernant",
          "l'objet des présentes et remplace tout accord ou arrangement antérieur.",
          "",
          "10.2 Toute modification du présent contrat devra faire l'objet d'un avenant écrit signé",
          "par les deux parties.",
          "",
          "10.3 Si l'une quelconque des stipulations du présent contrat s'avérait nulle au regard",
          "d'une règle de droit en vigueur, elle serait alors réputée non écrite, sans pour autant",
          "entraîner la nullité du contrat ni altérer la validité de ses autres dispositions.",
        ],
        20,
        80
      );

      // Signatures
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(
        "Fait à Casablanca, le " + dayjs().format("DD/MM/YYYY"),
        20,
        140
      );
      doc.text("En deux exemplaires originaux", 20, 150);
      doc.setFont(undefined, "normal");

      // Pour MaghrebitConnect
      doc.text("Pour MaghrebitConnect", 60, 170, { align: "center" });
      doc.text("Ahmed Alaoui", 60, 180, { align: "center" });
      doc.text("Directeur Général", 60, 190, { align: "center" });

      // Pour l'ESN
      doc.text(`Pour ${profileData.Raison_sociale}`, 150, 170, {
        align: "center",
      });
      doc.text(profileData.responsible || "[Représentant légal]", 150, 180, {
        align: "center",
      });

      // Final clause
      doc.setFontSize(12);
      doc.text(
        [
          `Signé le ${dayjs().format("DD/MM/YYYY")} à ${dayjs().format(
            "HH:mm:ss"
          )} par ${profileData.responsible || "Representant legal"}.`,
        ],
        105,
        255,
        { align: "center" }
      );

      doc.text("Page 5/5", 105, 282, { align: "center" });

      // Save the PDF
      doc.save(`Contrat_ESN_${profileData.Raison_sociale}.pdf`);
      setPdfGenerated(true);
      message.success("Contrat téléchargé avec succès!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Erreur lors de la génération du contrat");
    }
  };

  const calculateProfileCompletion = (data) => {
    // Pondération des champs du profil (70% du score total)
    const profileWeight = 0.7;
    const documentsWeight = 0.3;

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
      Tel_Contact: { weight: 5, filled: !!data.Tel_Contact },
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

    // Calcul du pourcentage de complétion du profil
    const profileCompletion = Math.round((filledWeight / totalWeight) * 100);

    // S'assurer que documentStatus est défini avant de l'utiliser
    // C'est probablement la source du problème
    const docPercentage =
      documentStatus && typeof documentStatus.percentage === "number"
        ? documentStatus.percentage
        : 100; // Default à 100% si non défini

    console.log("Profile completion:", profileCompletion);
    console.log("Document percentage:", docPercentage);

    // Calcul du score global
    let totalCompletion = Math.round(
      profileCompletion * profileWeight + docPercentage * documentsWeight
    );

    console.log("Raw total completion:", totalCompletion);

    // Plafonner à 95% si les documents ne sont pas tous présents
    // Mais si le profil est déjà validé ou actif, on autorise 100%
    if (
      docPercentage < 100 &&
      totalCompletion > 95 &&
      data.Statut !== "actif" &&
      data.Statut !== "Actif" &&
      data.Statut !== "validé" &&
      data.Statut !== "à signer"
    ) {
      totalCompletion = 95;
      console.log("Total completion capped at 95% due to missing documents");
    }
    // Si tous les champs requis sont remplis, on assure un minimum de 95%
    else if (
      Object.values(requiredFields).every((field) => field.filled) &&
      totalCompletion < 95
    ) {
      totalCompletion = 100;
      console.log(
        "Total completion set to minimum 95% as all required fields are filled"
      );
    }
    // Pour les profils actifs, on force à 100%
    else if (
      data.Statut === "actif" ||
      data.Statut === "Actif" ||
      data.Statut === "validé"
    ) {
      totalCompletion = 100;
      console.log("Total completion set to 100% because profile is active");
    }

    console.log("Final total completion:", totalCompletion);

    setCompletionStatus(totalCompletion);
    const active =
      totalCompletion >= 99 &&
      (data.Statut?.toLowerCase() === "actif" ||
        data.Statut?.toLowerCase() === "validé");
    setIsAccountActive(active);

    // Set current step based on status
    setCurrentStep(getActivationStep(data.Statut, totalCompletion));

    if (
      totalCompletion === 100 &&
      data.Statut !== "à signer" &&
      data.Statut !== "actif" &&
      data.Statut !== "Actif" &&
      data.Statut !== "validé" &&
      data.Statut !== "à valider"
    ) {
      if (totalCompletion === 100 && data.Statut === "Draft") {
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
          description:
            "Veuillez compléter votre profil et soumettre vos documents pour activer votre compte.",
          nextStep:
            "Remplissez tous les champs requis et téléchargez les documents obligatoires pour passer à l'étape suivante.",
          icon: <FormOutlined style={{ color: "#faad14" }} />,
          color: "warning",
        };
      case "à valider":
        return {
          title: "En attente de validation",
          description:
            "Votre profil a été soumis et est en cours d'examen par notre équipe.",
          nextStep:
            "Nous vous contacterons prochainement pour la suite du processus.",
          icon: <FileSearchOutlined style={{ color: "#1890ff" }} />,
          color: "info",
          action: (
            <Link
              onClick={() => {
                location.reload();
                location.href = "/interface-cl?menu=documents";
              }}
              to="/interface-en?menu=documents"
            >
              <Button type="default" icon={<FolderOutlined />}>
                Consulter mes documents
              </Button>
            </Link>
          ),
        };
      case "à signer":
        return {
          title: "Contrat à signer",
          description:
            "Votre profil a été validé. Veuillez maintenant accepter les conditions du contrat.",
          nextStep:
            "Après signateur de contart, vous pourrez accéder à toutes les fonctionnalités de la plateforme.",
          icon: <FileProtectOutlined style={{ color: "#52c41a" }} />,
          color: "info",
          action: (
            <Space>
              <Button
                type="primary"
                icon={<FileProtectOutlined />}
                onClick={showContractModal}
                className="orange-pulse-animation"
              >
                Signer le contrat
              </Button>
              <Link
                onClick={() => {
                  location.reload();
                  location.href = "/interface-cl?menu=documents";
                }}
                to="/interface-en?menu=documents"
              >
                <Button type="default" icon={<FolderOutlined />}>
                  Consulter mes documents
                </Button>
              </Link>
            </Space>
          ),
        };
      case "Actif":
      case "actif":
      case "validé":
        return {
          title: "Compte activé",
          description: "Votre compte est pleinement activé.",
          nextStep:
            "Vous avez maintenant accès à toutes les fonctionnalités de la plateforme.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          color: "success",
          action: (
            <Space>
              <Button
                type="default"
                icon={<FilePdfOutlined />}
                onClick={generatePDF}
              >
                Télécharger le contrat
              </Button>
              <Link
                onClick={() => {
                  location.reload();
                  location.href = "/interface-cl?menu=documents";
                }}
                to="/interface-en?menu=documents"
              >
                <Button type="default" icon={<FolderOutlined />}>
                  Gérer mes documents
                </Button>
              </Link>
            </Space>
          ),
        };
      default:
        return {
          title: "Statut indéterminé",
          description:
            "Veuillez contacter notre support pour plus d'informations.",
          nextStep: "Nous vous aiderons à résoudre ce problème rapidement.",
          icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          color: "warning",
          action: null,
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
                    <Form.Item
                      name="IBAN"
                      label="IBAN"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve(); // Optional field

                            // Remove spaces and convert to uppercase
                            const iban = value.replace(/\s/g, "").toUpperCase();

                            // Basic format check
                            if (iban.length < 15 || iban.length > 34) {
                              return Promise.reject(
                                "La longueur de l'IBAN doit être entre 15 et 34 caractères"
                              );
                            }

                            // Country code check
                            if (!/^[A-Z]{2}/.test(iban)) {
                              return Promise.reject(
                                "L'IBAN doit commencer par un code pays (2 lettres)"
                              );
                            }

                            // Move first 4 chars to end
                            const rearranged =
                              iban.substring(4) + iban.substring(0, 4);

                            // Convert letters to numbers (A=10, B=11, ..., Z=35)
                            const converted = rearranged
                              .split("")
                              .map((char) => {
                                const code = char.charCodeAt(0);
                                // If it's a letter
                                if (code >= 65 && code <= 90) {
                                  return (code - 55).toString();
                                }
                                // If it's a digit
                                return char;
                              })
                              .join("");

                            // Calculate MOD97 using remainder technique for large numbers
                            let remainder = 0;
                            for (let i = 0; i < converted.length; i++) {
                              remainder =
                                (remainder * 10 + parseInt(converted[i], 10)) %
                                97;
                            }

                            // IBAN is valid if remainder is 1
                            if (remainder === 1) {
                              return Promise.resolve();
                            }

                            return Promise.reject(
                              "IBAN invalide - veuillez vérifier le format"
                            );
                          },
                        },
                      ]}
                    >
                      <Input
                        prefix={<CreditCardOutlined />}
                        placeholder="FR7630006000011234567890189"
                        onChange={(e) => {
                          // Format with spaces every 4 characters for readability
                          const value = e.target.value.replace(/\s/g, "");
                          const formatted =
                            value.match(/.{1,4}/g)?.join(" ") || value;
                          e.target.value = formatted;
                        }}
                      />
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
        {/* Welcome Message Card - Added at the top */}
        {/* <Card
          bordered={false}
          className="mb-6 shadow rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50"
        >
          <div className="px-4 py-3 flex items-start">
            <div className="mr-3 mt-1">
              {profileData.Statut === "Draft" ? (
                <FormOutlined style={{ fontSize: "24px", color: "#faad14" }} />
              ) : profileData.Statut === "à valider" ? (
                <FileSearchOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              ) : profileData.Statut === "à signer" ? (
                <FileProtectOutlined style={{ fontSize: "24px", color: "#fa8c16" }} />
              ) : (profileData.Statut === "Actif" || profileData.Statut === "actif" || profileData.Statut === "validé") ? (
                <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
              ) : (
                <InfoCircleOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              )}
            </div>
            <div className="flex-grow">
              <div className="font-medium text-xl">
                {profileData.Statut === "Draft" ? (
                  "Bienvenue sur Maghreb Connect IT"
                ) : profileData.Statut === "à valider" ? (
                  "Bienvenue dans notre réseau!"
                ) : profileData.Statut === "à signer" ? (
                  "Vous y êtes presque!"
                ) : (profileData.Statut === "Actif" || profileData.Statut === "actif" || profileData.Statut === "validé") ? (
                  "Bienvenue sur Maghreb Connect IT"
                ) : (
                  "Bienvenue!"
                )}
              </div>
              <div className="text-md mt-2">
                {profileData.Statut === "Draft" ? (
                  "Complétez votre profil pour rejoindre notre réseau d'ESN et accéder à toutes nos fonctionnalités."
                ) : profileData.Statut === "à valider" ? (
                  "Votre profil est en cours d'examen par notre équipe. Nous vous contacterons très prochainement."
                ) : profileData.Statut === "à signer" ? (
                  "Une dernière étape importante : signez le contrat ci-dessous pour activer complètement votre compte."
                ) : (profileData.Statut === "Actif" || profileData.Statut === "actif" || profileData.Statut === "validé") ? (
                  "Votre compte est entièrement activé. Profitez de toutes nos fonctionnalités et développez votre business!"
                ) : (
                  "Merci de rejoindre MaghrebitConnect. Notre équipe est là pour vous accompagner."
                )}
              </div>
            </div>
          </div>
        </Card> */}

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
                    title: "Compléter le profil",
                    description: null,
                    status:
                      currentStep >= 0
                        ? currentStep > 0
                          ? "finish"
                          : "process"
                        : "wait",
                  },
                  {
                    title: "Validation",
                    description: null,
                    status:
                      currentStep >= 1
                        ? currentStep > 1
                          ? "finish"
                          : "process"
                        : "wait",
                  },
                  {
                    title: "Contrat",
                    description: null,
                    status:
                      currentStep >= 2
                        ? currentStep > 2
                          ? "finish"
                          : "process"
                        : "wait",
                  },
                  {
                    title: "Actif",
                    description: null,
                    status: currentStep >= 3 ? "finish" : "wait",
                  },
                ]}
              />
            </div>
          </Card>
        )}

        {/* Status guidance alert - Compact version */}
        <Card className="mb-6 shadow rounded-xl overflow-hidden bg-white">
          <div
            className={`px-4 py-3 flex items-start ${
              isAccountActive
                ? "bg-green-50 border-b border-green-200"
                : statusGuidance.color === "warning"
                ? "bg-orange-50 border-b border-orange-200"
                : "bg-blue-50 border-b border-blue-200"
            }`}
          >
            <div className="mr-3 mt-1">{statusGuidance.icon}</div>
            <div className="flex-grow">
              <div className="font-medium text-lg">{statusGuidance.title}</div>
              <div className="text-sm mt-1">
                {statusGuidance.description}
                {!isAccountActive && (
                  <div className="mt-1 text-sm text-gray-600">
                    <b>{isAccountActive ? "" : "Prochaine étape :"}</b>{" "}
                    {statusGuidance.nextStep}
                  </div>
                )}
              </div>
              {statusGuidance.action && (
                <div className="mt-2">{statusGuidance.action}</div>
              )}
            </div>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          {/* Company Information Section with Account Active Banner at the top */}
          {/* <Col span={24}>
            {isAccountActive && (
              <Card
                className="mb-6 shadow-lg rounded-xl overflow-hidden bg-green-50"
                bordered={false}
              >
                <div className="flex items-center p-4">
                  <div className="mr-5 flex justify-center items-center bg-white rounded-full p-3 shadow-md">
                    <CheckCircleOutlined
                      style={{ fontSize: "40px", color: "#52c41a" }}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-800 mb-2">
                      Compte activé
                    </h2>
                    <p className="text-green-700 mb-0">
                      Votre compte est pleinement activé. Vous avez accès à
                      toutes les fonctionnalités de la plateforme
                      MaghrebitConnect.
                    </p>
                    <div className="mt-3 space-x-3">
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={startEditing}
                      >
                        Modifier le Profil
                      </Button>
                      <Link to="/interface-en?menu=documents">
                        <Button icon={<FolderOutlined />}>
                          Gérer mes documents
                        </Button>
                      </Link>
                      <Button icon={<FilePdfOutlined />} onClick={generatePDF}>
                        Télécharger le contrat
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

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
                  <Text strong>{profileData.N_TVA || "Non spécifié"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="RCE">
                  <Text strong>{profileData.RCE || "Non spécifié"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Pays">
                  <Text strong>{profileData.Pays}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col> */}
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
                  <Text strong>{profileData.N_TVA || "Non spécifié"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="RCE">
                  <Text strong>{profileData.RCE || "Non spécifié"}</Text>
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
          Signer le contrat
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
