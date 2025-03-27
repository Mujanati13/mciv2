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
  Select,
  Modal,
  Checkbox,
  Spin,
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
} from "@ant-design/icons";
import axios from "axios";
import { Endponit, token } from "../../helper/enpoint";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";
const { Text, Paragraph } = Typography;
const { Option } = Select;

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
  const baseApiUrl = Endponit(); // Store base URL to reuse

  // Add country fetching function
  const fetchCountries = useCallback(async () => {
    try {
      setCountriesLoading(true);
      const response = await axios.get(
        `http://51.38.99.75:3100/api/countries`,
        axiosConfig
      );

      if (response.data.success) {
        setCountries(response.data.data);
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

  // Add city fetching function
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
    // Clear city when country changes
    form.setFieldsValue({ Ville: undefined });

    // Fetch cities for the selected country
    fetchCities(value);
  };

  // Load countries on mount
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Show notification for contract signing if needed
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

  // Effect to load cities when editing starts and country is already selected
  useEffect(() => {
    if (isEditing && profileData?.Pays) {
      fetchCities(profileData.Pays);
    }
  }, [isEditing, profileData?.Pays, fetchCities]);

  // Handle opening contract modal
  const showContractModal = () => {
    setContractModalVisible(true);
  };

  // Handle contract acceptance
  const handleContractAcceptance = async () => {
    if (!contractCheckbox) {
      message.warning("Veuillez accepter les termes du contrat");
      return;
    }

    try {
      setLoading(true);
      const esnId = localStorage.getItem("id");

      // Update ESN status to "ready"
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

        // Update local profileData state
        setProfileData({
          ...profileData,
          Statut: "Actif",
        });

        message.success("Contrat accepté avec succès!");
        // Generate PDF after accepting the contract
        generatePDF();
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

  // Handle activating ESN account
  const activateESNAccount = async () => {
    try {
      setLoading(true);
      const esnId = localStorage.getItem("id");

      // Update ESN status to "actif"
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
        // Update local profileData state
        setProfileData({
          ...profileData,
          Statut: "actif",
          Date_validation: dayjs(),
        });

        setIsAccountActive(true);
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

  // Generate PDF with ESN information and contract
  const generatePDF = () => {
    if (!profileData) return;

    try {
      const doc = new jsPDF();
      // ====== PAGE 1: TITLE AND PARTIES ======
      // Add title
      doc.setFontSize(22);
      doc.setTextColor(0, 51, 102);
      doc.text("CONTRAT D'ADHÉSION", 105, 20, { align: "center" });
      doc.setFontSize(18);
      doc.text("MAGHREBITCONNECT", 105, 30, { align: "center" });

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${dayjs().format("DD/MM/YYYY")}`, 105, 40, {
        align: "center",
      });

      // Add parties information - Full width
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
      doc.setFont(undefined, "normal"); // Add contract introduction
      doc.setFontSize(12);
      doc.text("IL A ÉTÉ CONVENU CE QUI SUIT:", 105, 200, { align: "center" });

      doc.text("Page 1/5", 105, 282, { align: "center" });

      // ====== PAGE 2: CONTRACT TERMS ======
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

      // Article 1 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 1: OBJET DU CONTRAT", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "1.1 Le présent contrat a pour objet de définir les conditions dans lesquelles l'ESN peut utiliser la",
          "plateforme MaghrebitConnect pour la recherche et le recrutement de talents IT.",
          "",
          "1.2 MaghrebitConnect est une plateforme digitale permettant la mise en relation entre entreprises",
          "de services numériques et candidats qualifiés dans les métiers de l'informatique et du numérique.",
          "",
          "1.3 En acceptant ce contrat, l'ESN reconnaît avoir pris connaissance des fonctionnalités de la",
          "plateforme et les estime conformes à ses besoins.",
        ],
        20,
        40
      );

      // Article 2 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 2: SERVICES FOURNIS", 20, 90);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "2.1 MaghrebitConnect s'engage à fournir à l'ESN les services suivants:",
          "",
          "• Publication d'offres d'emploi sur la plateforme",
          "• Accès à une base de données de profils IT qualifiés",
          "• Outils de filtrage et de sélection des candidats",
          "• Gestion des candidatures et du processus de recrutement",
          "• Interface de communication avec les candidats",
          "• Tableau de bord de suivi des recrutements",
          "",
          "2.2 Support technique",
          "",
          "MaghrebitConnect met à disposition un support technique accessible aux horaires suivants:",
          "Du lundi au vendredi, de 9h à 18h (heure marocaine), hors jours fériés.",
          "Le support est joignable par email à support@maghrebitconnect.com",
        ],
        20,
        100
      );

      // Article 3 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 3: DURÉE ET CONDITIONS", 20, 190);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "3.1 Le présent contrat est conclu pour une durée indéterminée à compter de son acceptation.",
          "",
          "3.2 L'ESN peut à tout moment cesser d'utiliser la plateforme. Toutefois, les missions en cours",
          "devront être honorées selon les conditions établies initialement.",
          "",
          "3.3 MaghrebitConnect se réserve le droit de modifier les conditions générales d'utilisation",
          "moyennant un préavis de 30 jours.",
        ],
        20,
        200
      );

      doc.text("Page 2/5", 105, 282, { align: "center" });

      // ====== PAGE 3: PRICING ======
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

      // Article 4 - Full width with pricing as text, not table
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 4: TARIFICATION", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "4.1 Grille tarifaire",
          "",
          "Les tarifs appliqués varient selon le pays d'établissement de l'ESN. Ils sont exprimés par mois et par",
          "mission active sur la plateforme. Une mission est considérée comme active dès sa publication et",
          "jusqu'à sa clôture par l'ESN.",
          "",
          "La grille tarifaire ci-dessous s'applique à compter de la signature du présent contrat:",
          "",
          "• France: 18€/mois/mission",
          "• Belgique: 18€/mois/mission",
          "• Suisse: 30CHF/mois/mission",
          "• Royaume Uni: 18£/mois/mission",
          "• Maroc: 180MAD/mois/mission",
          "• Espagne: 18€/mois/mission",
          "• Pays-Bas: 18€/mois/mission",
          "• Italie: 18€/mois/mission",
          "• Canada: 30CA$/mois/mission",
          "• Allemagne: 18€/mois/mission",
          "• Autres pays: 30US$/mois/mission",
        ],
        20,
        40
      );

      // Article 5 - Full width
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Article 5: CONDITIONS FINANCIÈRES", 20, 160);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "5.1 Modalités de facturation",
          "",
          "La facturation est établie mensuellement, à terme échu. L'ESN recevra une facture détaillant",
          "les missions actives pendant le mois et le montant correspondant.",
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
          "• Ne pas tenter de contourner le système de facturation",
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
          "7.2 L'ESN reconnaît qu'elle traite des données personnelles de candidats et s'engage à:",
          "• Utiliser ces données uniquement dans le cadre du processus de recrutement",
          "• Ne pas conserver ces données au-delà de la durée nécessaire au recrutement",
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

      // Company information summary - Full width, not in a table
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");

      // Replace the electronic acceptance text
      doc.setFontSize(12);
      doc.text(
        [
          `Signé le ${dayjs().format("DD/MM/YYYY")} à ${dayjs().format(
            "HH:mm:ss"
          )} par ${profileData.responsible || "le responsable"}.`,
        ],
        105,
        255,
        { align: "center" }
      );

      doc.text("Page 5/5", 105, 282, { align: "center" });

      // Save the PDF
      doc.save(`Contrat_ESN_${profileData.Raison_sociale}.pdf`);
      setPdfGenerated(true);

      // Show success message
      message.success("Contrat téléchargé avec succès!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Erreur lors de la génération du contrat");
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (data) => {
    // Required fields with higher weights
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

    // Account is considered active if completion is >= 80% and status is "actif"
    const active = completion >= 99 && data.Statut?.toLowerCase() === "actif";
    setIsAccountActive(active);

    // Auto-update status to "à valider" when profile is 100% complete
    if (
      completion === 100 &&
      data.Statut !== "à signer" &&
      data.Statut !== "actif" &&
      data.Statut !== "à valider"
    ) {
      if (completion === 100 && data.Statut === "Draft") {
        // Only update if current status is specifically "Draft"
        updateProfileStatus(data);
      }
    }
  };

  // Add this new function to handle the automatic status update
  const updateProfileStatus = async (data) => {
    try {
      const esnId = localStorage.getItem("id");

      const updatePayload = {
        ...data,
        ID_ESN: esnId,
        Statut: "à valider",
        password: null,
      };

      const response = await axios.put(
        `${baseApiUrl}/api/ESN/`,
        updatePayload,
        axiosConfig
      );

      if (response.data) {
        // Update local state
        setProfileData({
          ...data,
          Statut: "à valider",
        });
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
          // Convert Date_validation to dayjs if it exists
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
    // Set initial form values when starting edit mode
    form.setFieldsValue(profileData);
    setIsEditing(true);

    // Pre-load cities if country is already selected
    if (profileData?.Pays) {
      fetchCities(profileData.Pays);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(true);
      const esnId = localStorage.getItem("id");

      // Get form values directly to ensure we have the latest values
      const formValues = form.getFieldsValue(true);

      // Create update payload with form values
      let updatePayload = {
        ...profileData, // Keep existing data
        ...formValues, // Overwrite with new form values
        ID_ESN: esnId,
        password: null, // Don't send password
        Date_validation: formValues.Date_validation
          ? formValues.Date_validation.format("YYYY-MM-DD")
          : null,
      };

      // Calculate completion with updated data
      let tempCompletion = 0;
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

      // If profile is complete and status isn't already set to higher level, update to "à valider"
      if (
        allFieldsFilled &&
        profileData.Statut !== "ready" &&
        profileData.Statut !== "Actif" &&
        profileData.Statut !== "à valider"
      ) {
        updatePayload.Statut = "à valider";
      }

      console.log("Sending update payload:", updatePayload);

      const response = await axios.put(
        `${baseApiUrl}/api/ESN/`,
        updatePayload,
        axiosConfig
      );

      if (response.data) {
        // Refresh data from server to ensure we have the latest state
        const refreshResponse = await axios.get(
          `${baseApiUrl}/api/getEsnData/?esnId=${esnId}`,
          axiosConfig
        );

        if (refreshResponse.data && refreshResponse.data.data) {
          const refreshedData =
            refreshResponse.data.data[0] || refreshResponse.data.data;
          // Convert Date_validation to dayjs if it exists
          if (refreshedData.Date_validation) {
            refreshedData.Date_validation = dayjs(
              refreshedData.Date_validation
            );
          }

          // Update local state with refreshed data
          setProfileData(refreshedData);
          calculateProfileCompletion(refreshedData);
        }

        // Show specific message based on status
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
                    <Form.Item name="responsible" label="Responsable">
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="Nom du responsable"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24} md={12}>
                    <Form.Item name="RCE" label="RCE">
                      <Input prefix={<IdcardOutlined />} />
                    </Form.Item>
                  </Col>
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
                            <option key={country} value={country}>
                              {country}
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
                  <Col span={24} md={4}>
                    <Form.Item
                      name="Ville"
                      label="Ville"
                      rules={[{ required: true, message: "Champ requis" }]}
                    >
                      <Input
                        prefix={<EnvironmentOutlined />}
                        placeholder="Ville"
                      />
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
        {/* Profile Completion Progress Section */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card bordered={false}>
              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <div className="mb-4 md:mb-0 w-full">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-blue-900 mr-3">
                      Complétude du profil
                    </h3>
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={startEditing}
                >
                  Modifier le Profil
                </Button>
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

              {!isAccountActive && completionStatus < 80 && (
                <Alert
                  message="Pour activer votre compte ESN, complétez votre profil"
                  description="Les informations essentielles sont nécessaires pour activer votre compte et accéder à toutes les fonctionnalités."
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24} className="text-center">
            <div className="mt-4">
              <Tag
                color={isAccountActive ? "success" : "warning"}
                icon={
                  isAccountActive ? (
                    <CheckCircleOutlined />
                  ) : (
                    <ExclamationCircleOutlined />
                  )
                }
                className="text-base px-4 py-1"
              >
                {profileData.Statut || "En attente d'activation"}
              </Tag>
            </div>
          </Col>

          {/* Contract Status and Buttons */}
          <Col span={24}>
            <Card bordered={false}>
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Statut du contrat:{" "}
                    <Tag
                      color={
                        contractAccepted ||
                        profileData.Statut === "ready" ||
                        profileData.Statut === "Actif"
                          ? "green"
                          : "orange"
                      }
                    >
                      {contractAccepted ||
                      profileData.Statut === "ready" ||
                      profileData.Statut === "Actif"
                        ? "Contrat accepté"
                        : "En attente de signature"}
                    </Tag>
                  </h3>
                  <p className="text-gray-600">
                    {contractAccepted ||
                    profileData.Statut === "ready" ||
                    profileData.Statut === "Actif"
                      ? "Vous avez accepté les conditions générales d'utilisation."
                      : "Pour activer votre compte, veuillez accepter les conditions générales d'utilisation."}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  {!contractAccepted && profileData.Statut == "à signer" && (
                    <Button
                      type="primary"
                      icon={<FileProtectOutlined />}
                      onClick={showContractModal}
                      className="orange-pulse-animation mr-2"
                      style={{
                        borderColor: "#ff8c00",
                      }}
                    >
                      Accepter le contrat
                    </Button>
                  )}
                  {(contractAccepted || profileData.Statut === "Actif") && (
                    <Button
                      type="default"
                      icon={<FilePdfOutlined />}
                      onClick={generatePDF}
                    >
                      Télécharger le contrat
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </Col>
          {/* Company Information Section */}
          <Col span={24}>
            <Divider orientation="center" className="text-2xl font-semibold">
              <Space>
                <SafetyOutlined />
                Informations de l'Entreprise
              </Space>
            </Divider>

            <Card bordered={false}>
              <Descriptions
                layout="vertical"
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                className="bg-white p-4"
              >
                <Descriptions.Item label="Raison Sociale">
                  <Text strong>{profileData.Raison_sociale}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Responsable">
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

            <Card bordered={false}>
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

            <Card bordered={false}>
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

  // Contract modal content
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
