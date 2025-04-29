import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link
import {
  Card,
  Button,
  Avatar,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Upload,
  message,
  Select,
  Switch,
  Progress,
  Tag,
  Tooltip,
  Alert,
  Divider,
  Collapse,
  Modal,
  Checkbox,
  Space,
  Steps,
} from "antd";
import {
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
  UploadOutlined,
  SaveOutlined,
  CloseOutlined,
  LinkedinOutlined,
  GithubOutlined,
  TwitterOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  NumberOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  CreditCardOutlined,
  BarcodeOutlined,
  FileProtectOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  FormOutlined,
  FileSearchOutlined,
  CheckSquareOutlined,
  FolderOpenOutlined, // Added for document link
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { Endponit, token } from "../../helper/enpoint";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;
const { Step } = Steps;

const pulseAnimationStyle = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7);
      transform: scale(1);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
      transform: scale(1);
    }
  }
`;

const ClientPlusInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [img_path, setimg_path] = useState("");
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: true,
    showPhone: false,
    showLocation: true,
  });
  const [profile, setProfile] = useState(null);
  const [profileedit, setProfileedit] = useState(null);
  // Updated state for completion details
  const [completionDetails, setCompletionDetails] = useState({
    profile: 0,
    document: 0,
    total: 0,
  });
  const [profileStatus, setProfileStatus] = useState(false);
  // Add new state variables for contract handling
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractCheckbox, setContractCheckbox] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAccountActive, setIsAccountActive] = useState(false);

  // Helper function to determine current activation step
  const getActivationStep = (status, totalCompletion) => {
    if (status === "Actif" || status === "validé") return 3; // Completed
    if (status === "à signer") return 2; // Ready to sign contract
    if (status === "à valider" || totalCompletion === 100) return 1; // Complete profile, pending validation
    return 0; // Incomplete profile
  };

  useEffect(() => {
    // Show a notification when component mounts if contract needs to be signed
    if (profile?.Statut === "à signer") {
      message.info({
        content:
          "Action requise: Veuillez accepter le contrat pour activer votre compte",
        duration: 5,
        icon: <FileProtectOutlined style={{ color: "#1890ff" }} />,
      });
    }

    // Update current step based on profile status and total completion
    if (profile) {
      const newStep = getActivationStep(
        profile.Statut,
        completionDetails.total
      );
      setCurrentStep(newStep);
      setIsAccountActive(
        profile.Statut === "Actif" || profile.Statut === "validé"
      );
    }
  }, [profile?.Statut, completionDetails.total]); // Depend on total completion

  // Show contract modal
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
      const clientId = localStorage.getItem("id");

      // Update client status to "ready"
      const updatePayload = {
        ...profileedit,
        ID_clt: clientId,
        statut: "Actif",
      };

      const response = await axios.put(
        `${Endponit()}/api/client/`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      if (response) {
        setContractAccepted(true);
        setContractModalVisible(false);

        // Update local profile state
        const updatedProfile = {
          ...profileedit,
          statut: "Actif",
        };

        setProfile(updatedProfile);
        setCurrentStep(3); // Update to completed step
        setIsAccountActive(true);
        message.success("Contrat accepté avec succès!");

        // Generate PDF after accepting contract
        generatePDF();

        // Refresh the page
        window.location.reload();
      } else {
        throw new Error("Échec de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
      message.error("Erreur lors de l'acceptation du contrat");
    }
  };

  // Activate client account
  const activateClientAccount = async () => {
    try {
      const clientId = localStorage.getItem("id");

      // Update client status to "validé" instead of "actif"
      const updatePayload = {
        ID_clt: clientId,
        Statut: "validé",
        date_validation: dayjs().format("YYYY-MM-DD"),
      };

      const response = await axios.put(
        `${Endponit()}/api/client/updateStatus`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      if (response.data && response.data.success) {
        // Update local profile state
        const updatedProfile = {
          ...profile,
          Statut: "validé",
          birthDate: dayjs(),
        };

        setProfile(updatedProfile);
        setProfileStatus(true);
        setCurrentStep(3); // Update to completed step
        setIsAccountActive(true);
        message.success("Compte client activé avec succès!");
      } else {
        throw new Error("Échec de l'activation du compte");
      }
    } catch (error) {
      console.error("Error activating account:", error);
      message.error("Erreur lors de l'activation du compte");
    }
  };

  // Generate PDF with client information and contract
  const generatePDF = () => {
    // PDF generation code - unchanged
    // ...
    if (!profile) return;

    try {
      const doc = new jsPDF();
      // All PDF generation code remains the same
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
      doc.text(`${profile.raison_sociale || "[Raison sociale]"}`, 20, 140);
      doc.setFontSize(10);
      doc.text(
        `immatriculée au Registre du Commerce et des sociétés sous le numéro`,
        20,
        147
      );
      doc.text(
        `${profile.siret || "[SIRET]"}, dont le siège social est situé à ${
          profile.address || "[Adresse]"
        }, ${profile.cp || ""} ${profile.ville || ""}.`,
        20,
        154
      );
      doc.text(
        `Représentée par ${
          profile.responsible || "[Représentant]"
        }, dûment habilité au titre des présentes,`,
        20,
        161
      );
      doc.text("", 20, 168); // Empty line for spacing
      doc.text("Ci-après désigné «le Client Final»", 20, 175);
      doc.setFont(undefined, "bold");
      doc.text("D'AUTRE PART", 20, 182);
      doc.setFont(undefined, "normal");

      // Add contract introduction
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
          "1.1 Le présent contrat a pour objet de définir les conditions dans lesquelles le Client peut utiliser la",
          "plateforme MaghrebitConnect pour la recherche et le recrutement de talents IT.",
          "",
          "1.2 MaghrebitConnect est une plateforme digitale permettant la mise en relation entre clients et",
          "entreprises de services numériques (ESN) disposant de consultants qualifiés dans les métiers",
          "de l'informatique et du numérique.",
          "",
          "1.3 En acceptant ce contrat, le Client reconnaît avoir pris connaissance des fonctionnalités de la",
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
          "2.1 MaghrebitConnect s'engage à fournir au Client les services suivants:",
          "",
          "• Accès à un vivier de talents IT qualifiés via les ESN partenaires",
          "• Publication de besoins en compétences IT",
          "• Mise en relation avec des ESN spécialisées",
          "• Outils de gestion et de suivi des missions",
          "• Interface de communication avec les ESN et les consultants",
          "• Tableau de bord de suivi des prestations en cours",
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
          "3.2 Le Client peut à tout moment cesser d'utiliser la plateforme. Toutefois, les missions en cours",
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
      doc.text("Article 4: TARIFICATION ET COMMISSION", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "4.1 Utilisation de la plateforme",
          "",
          "L'inscription et l'utilisation de la plateforme MaghrebitConnect sont gratuites pour les clients.",
          "",
          "4.2 Commission sur les prestations",
          "",
          "Pour chaque mission réalisée via la plateforme MaghrebitConnect, une commission sera prélevée",
          "selon les modalités suivantes:",
          "",
          "• Une commission de 5% sera appliquée sur le montant total HT de la prestation",
          "• Cette commission est facturée au Client en supplément du coût de la prestation",
          "• La commission est calculée sur la base du montant facturé par l'ESN",
          "",
          "4.3 Cas particuliers",
          "",
          "Pour les contrats à long terme ou les volumes importants, des conditions spécifiques pourront",
          "être négociées. Pour plus d'informations, contacter le service commercial.",
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
      doc.text("Article 6: OBLIGATIONS DU CLIENT", 20, 30);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        [
          "Dans le cadre de l'utilisation de la plateforme MaghrebitConnect, le Client s'engage à:",
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
          "7.2 Le Client reconnaît qu'il traite des données personnelles de consultants et s'engage à:",
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

      // Final clause
      doc.setFontSize(12);
      doc.text(
        [
          `Signé le ${dayjs().format("DD/MM/YYYY")} à ${dayjs().format(
            "HH:mm:ss"
          )} par ${profile.responsible || "Representant legal"}.`,
        ],
        105,
        255,
        { align: "center" }
      );

      doc.text("Page 5/5", 105, 282, { align: "center" });

      // Save the PDF
      doc.save(`Contrat_Client_${profile.raison_sociale}.pdf`);
      setPdfGenerated(true);

      // Show success message
      message.success("Contrat téléchargé avec succès!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Erreur lors de la génération du contrat");
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const calculateProfileCompletion = (profileData, documentStatus = {}) => {
    // 1. Define required and optional profile fields with their respective weights
    const requiredFields = {
      raison_sociale: { weight: 10, filled: !!profileData.raison_sociale },
      email: { weight: 10, filled: !!profileData.email },
      responsible: { weight: 5, filled: !!profileData.responsible },
      address: { weight: 5, filled: !!profileData.address },
      ville: { weight: 5, filled: !!profileData.ville },
      siret: { weight: 5, filled: !!profileData.siret },
    };

    const optionalFields = {
      phone: { weight: 3, filled: !!profileData.phone },
      cp: { weight: 2, filled: !!profileData.cp },
      province: { weight: 2, filled: !!profileData.province },
      n_tva: { weight: 3, filled: !!profileData.n_tva },
      iban: { weight: 3, filled: !!profileData.iban },
      bic: { weight: 2, filled: !!profileData.bic },
      banque: { weight: 2, filled: !!profileData.banque },
      linkedin: {
        weight: 1,
        filled: !!(profileData.socialLinks && profileData.socialLinks.linkedin),
      },
      twitter: {
        weight: 1,
        filled: !!(profileData.socialLinks && profileData.socialLinks.twitter),
      },
    };

    // 2. Combine fields and calculate profile completion
    const profileFields = { ...requiredFields, ...optionalFields };
    let profileFilledWeight = 0;
    let profileTotalWeight = 0;

    // Calculate weights
    Object.values(profileFields).forEach((field) => {
      profileTotalWeight += field.weight;
      if (field.filled) {
        profileFilledWeight += field.weight;
      }
    });

    // Calculate profile percentage (0-100%)
    const profilePercent =
      profileTotalWeight > 0
        ? Math.round((profileFilledWeight / profileTotalWeight) * 100)
        : 0;

    // ===== DOCUMENT COMPLETION (50% of total) =====

    // 1. Define required documents with normalized keys
    const requiredDocs = [
      "kbis",
      "Document obligatoire: Attestation de régularité fiscale de moins de 3 mois",
      "Attestation de régularité sociale de moins de 3 mois",
      "rib",
      "dpae",
    ];

    // 2. Count valid documents (not marked as "À uploader")
    const validDocs = requiredDocs.filter(
      (doc) => documentStatus[doc] !== "À uploader"
    ).length;

    console.log("Document Status:", documentStatus);
    console.log("Valid Documents:", validDocs, "out of", requiredDocs.length);
    console.log(
      "Missing Documents:",
      requiredDocs.filter((doc) => documentStatus[doc] === "À uploader")
    );

    // 3. Calculate document percentage (0-100%)
    const documentPercent = Math.round((validDocs / requiredDocs.length) * 100);

    // ===== TOTAL COMPLETION (profile 50% + documents 50%) =====
    const totalPercent = Math.round(
      profilePercent * 0.5 + documentPercent * 0.5
    );

    // NEW: Cap total completion at 95% if documents are incomplete
    let adjustedTotalPercent = totalPercent;
    if (documentPercent < 100 && adjustedTotalPercent > 95) {
      adjustedTotalPercent = 95;
      console.log("Total completion capped at 95% due to incomplete documents");
    }

    // Update client status if profile is 100% complete (now using adjustedTotalPercent)
    if (adjustedTotalPercent === 100 && profile && profile.Statut === "Draft") {
      if (profileedit) {
        updateClientStatus("à valider");
      } else {
        console.warn("Profile edit data not available yet for status update.");
      }
    }

    // Return detailed completion breakdown with adjusted total
    return {
      profile: profilePercent,
      document: documentPercent,
      total: adjustedTotalPercent,
    };
  };

  // Function to update client status
  const updateClientStatus = async (newStatus) => {
    try {
      const clientId = localStorage.getItem("id");

      const updatePayload = {
        mail_contact: profileedit.mail_contact,
        ID_clt: clientId,
        statut: newStatus,
        linkedin: profileedit.linkedin || profile.socialLinks?.linkedin || "",
        twitter: profileedit.twitter || profile.socialLinks?.twitter || "",
        website: profileedit.website || profile.socialLinks?.website || "",
      };

      const response = await axios.put(
        `${Endponit()}/api/client/`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      if (response) {
        const updatedProfile = {
          ...profile,
          Statut: newStatus,
          socialLinks: {
            linkedin: updatePayload.linkedin,
            twitter: updatePayload.twitter,
            website: updatePayload.website,
          },
        };
        setProfile(updatedProfile);
        setCurrentStep(getActivationStep(newStatus, 100)); // Use 100 as completion is implicitly 100
        message.success(
          `Votre profil est complet! Statut mis à jour: ${newStatus}`
        );
      } else {
        throw new Error("Échec de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error updating client status:", error);
      message.error("Erreur lors de la mise à jour du statut");
    }
  };

  const fetchClientData = async () => {
    const id = localStorage.getItem("id");

    try {
      // Fetch client profile data
      const profileResponse = await axios.get(`${Endponit()}/api/api/getUserData`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
        params: {
          clientId: id,
        },
      });

      const client = profileResponse.data.data;
      setProfileedit(client[0]);
      console.log("Client Data:", client[0]);

      const profileData = {
        id: client[0].ID_clt,
        img_path: client[0].img_path,
        raison_sociale: client[0].raison_sociale || "",
        email: client[0].mail_contact,
        phone: client[0].tel_contact || "",
        responsible: client[0].responsible || "",
        address: client[0].adresse || "",
        cp: client[0].cp || "",
        ville: client[0].ville || "",
        province: client[0].province || "",
        siret: client[0].siret || "",
        n_tva: client[0].n_tva || "",
        occupation: client[0].statut || "",
        birthDate: client[0].date_validation
          ? dayjs(client[0].date_validation)
          : null,
        bio: client[0].rce || "",
        industry: client[0].pays || "",
        iban: client[0].iban || "",
        bic: client[0].bic || "",
        banque: client[0].banque || "",
        socialLinks: {
          linkedin: client[0].linkedin || "",
          twitter: client[0].twitter || "",
          website: client[0].website || "",
        },
        Statut: client[0].statut || "",
      };

      // Fetch client document status
      let documentStatus = {
        kbis: "À uploader",
        attestation_fiscale: "À uploader",
        attestation_sociale: "À uploader",
        rib: "À uploader",
        dpae: "À uploader",
      };

      try {
        const docResponse = await axios.get(
          Endponit() + "/api/getDocumentClient/",
          {
            headers: {
              Authorization: `${token()}`,
            },
            params: {
              ClientId: id,
            },
          }
        );

        const fetchedDocs = docResponse.data.data;
        console.log("Fetched Documents:", fetchedDocs);

        const requiredDocKeys = [
          "kbis",
          "attestation_fiscale",
          "attestation_sociale",
          "rib",
          "dpae",
        ];
        fetchedDocs.forEach((doc) => {
          requiredDocKeys.forEach((key) => {
            const normalizedKey = key.replace("_", " ");
            if (doc.Titre && doc.Titre.toLowerCase().includes(normalizedKey)) {
              if (doc.Statut && doc.Statut !== "À uploader") {
                documentStatus[key] = doc.Statut;
              }
            }
          });
        });
        console.log("Processed Document Status:", documentStatus);
      } catch (docError) {
        console.error("Error fetching client documents:", docError);
      }

      // Calculate profile completion details
      const currentCompletionDetails = calculateProfileCompletion(
        profileData,
        documentStatus
      );
      setCompletionDetails(currentCompletionDetails); // Update state with details

      // Set account status
      const isActive =
        client[0].statut?.toLowerCase() === "validé" ||
        client[0].statut?.toLowerCase() === "actif";

      setProfileStatus(isActive);
      setIsAccountActive(isActive);

      // Set contract status
      setContractAccepted(client[0].statut?.toLowerCase() === "actif");

      // Set current step based on status and total completion
      setCurrentStep(
        getActivationStep(client[0].statut, currentCompletionDetails.total)
      );

      setProfile(profileData);
      console.log("profileData set:", profileData);

      form.setFieldsValue({
        ...profileData,
        ...profileData.socialLinks,
      });
    } catch (error) {
      console.error("Error fetching client data:", error);
      message.error(
        "Une erreur s'est produite lors du chargement des données du client."
      );
    }
  };

  const handlePrivacyToggle = (setting) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    message.info(
      `Visibilité de ${setting
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())} mise à jour`
    );
  };

  const handleEdit = useCallback(() => {
    if (isEditing) {
      form
        .validateFields()
        .then(async (values) => {
          const updatedProfilePayload = {
            ID_clt: profile.id,
            raison_sociale: values.raison_sociale,
            mail_contact: values.email,
            tel_contact: values.phone || "",
            adresse: values.address || "",
            cp: values.cp || "",
            ville: values.ville || "",
            responsible: values.responsible || "",
            province: values.province || "",
            siret: values.siret || "",
            n_tva: values.n_tva || "",
            date_validation: values.birthDate
              ? values.birthDate.format("YYYY-MM-DD")
              : null,
            rce: values.bio || "",
            pays: values.industry || "",
            linkedin: values.linkedin || "",
            twitter: values.twitter || "",
            website: values.website || "",
            iban: values.iban || "",
            bic: values.bic || "",
            banque: values.banque || "",
            img_path: img_path || profile.img_path,
          };

          try {
            await axios.put(
              `${Endponit()}/api/client/`,
              updatedProfilePayload,
              {
                headers: {
                  Authorization: `Bearer ${token()}`,
                },
              }
            );

            // Re-fetch data to get updated profile and recalculate completion details
            fetchClientData();
            setIsEditing(false);
            message.success("Profil mis à jour avec succès");
          } catch (error) {
            console.error("Error updating client data:", error);
            message.error(
              "Une erreur s'est produite lors de la mise à jour du profil."
            );
          }
        })
        .catch((error) => {
          console.error("Form validation failed:", error);
          message.error("Veuillez vérifier les champs requis");
        });
    } else {
      setIsEditing(true);
    }
  }, [form, isEditing, profile, img_path, profileedit]); // Added profileedit dependency

  const handleCancelEdit = () => {
    form.setFieldsValue({
      ...profile,
      ...profile.socialLinks,
    });
    setIsEditing(false);
  };

  const handleProfileImageUpload = async (info) => {
    const file = info.file;
    const isImage = file.type.startsWith("image/");
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isImage) {
      message.error("Vous ne pouvez télécharger que des fichiers image!");
      return;
    }

    if (!isLt2M) {
      message.error("L'image doit être inférieure à 2MB!");
      return;
    }

    const formData = new FormData();
    formData.append("uploadedFile", file.originFileObj);
    formData.append("path", "./upload/profile/");

    try {
      const uploadResponse = await axios.post(
        `${Endponit()}/api/saveDoc/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      const imagePath = uploadResponse.data.path;
      setimg_path(imagePath);

      const updatePayload = {
        ID_clt: profile.id,
        img_path: imagePath,
        mail_contact: profile.email,
      };

      await axios.put(`${Endponit()}/api/client/`, updatePayload, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      // Re-fetch data to get updated profile and recalculate completion details
      fetchClientData();
      message.success("Image de profil mise à jour.");
    } catch (error) {
      console.error("Upload Error:", error);
      message.error("Erreur lors du téléchargement de l'image");
    }
  };

  // Contract modal content
  const contractModal = (
    <Modal
      title={
        <div className="text-center">
          <FileProtectOutlined /> Contrat d'Adhésion Client
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
          plateforme MaghrebitConnect par les Clients professionnels.
        </p>

        <h3 className="text-lg font-bold mt-4">1. Objet du contrat</h3>
        <p className="mb-3">
          Ce contrat a pour objet de définir les conditions dans lesquelles le
          Client peut utiliser les services proposés par la plateforme
          MaghrebitConnect.
        </p>

        <h3 className="text-lg font-bold mt-4">2. Obligations du Client</h3>
        <p className="mb-3">Le Client s'engage à :</p>
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
          <li>Accès à des profils de consultants qualifiés</li>
          <li>Services de mise en relation</li>
          <li>Suivi des missions</li>
          <li>Gestion des projets</li>
        </ul>

        <h3 className="text-lg font-bold mt-4">4. Responsabilités</h3>
        <p className="mb-3">MaghrebitConnect ne peut être tenu responsable :</p>
        <ul className="list-disc pl-6 mb-3">
          <li>
            Des inexactitudes ou erreurs dans les informations fournies par le
            Client
          </li>
          <li>De l'utilisation frauduleuse de la plateforme par le Client</li>
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

  // Get guidance message based on current status
  const getStatusGuidance = () => {
    const documentLink = (
      <Link
        onClick={() => {
          location.reload();
          location.href = "/interface-cl?menu=documents";
        }}
        to="/interface-cl?menu=documents"
        className="ml-2 text-sm font-normal text-blue-600 hover:text-blue-800" // Added styling
      >
        (Gérer les documents <FolderOpenOutlined />)
      </Link>
    );

    switch (profile?.Statut) {
      case "Draft":
        return {
          title: "Profil incomplet",
          description:
            "Veuillez compléter votre profil et uploader les documents requis pour activer votre compte.",
          nextStep:
            "Remplissez tous les champs requis et uploader les documents pour passer à l'étape suivante.",
          icon: <FormOutlined style={{ color: "#faad14" }} />,
          color: "warning",
          action: (
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                disabled={isEditing}
              >
                Compléter mon profil
              </Button>
              {/* Show doc button in actions only when profile is incomplete */}
              <Link
                onClick={() => {
                  location.reload();
                  location.href = "/interface-cl?menu=documents";
                }}
                to="/interface-cl?menu=documents"
              >
                <Button icon={<FolderOpenOutlined />}>
                  Gérer les documents
                </Button>
              </Link>
            </Space>
          ),
        };
      case "à valider":
        return {
          title: (
            <>
              En attente de validation
              {documentLink} {/* Include link in title */}
            </>
          ),
          description:
            "Votre profil a été soumis et est en cours d'examen par notre équipe.",
          nextStep:
            "Assurez-vous d'avoir uploadé tous les documents obligatoires. Nous vous contacterons prochainement.",
          icon: <FileSearchOutlined style={{ color: "#1890ff" }} />,
          color: "info",
          action: (
            <Space>
              <Button type="default" disabled>
                Validation en cours...
              </Button>
              {/* Document link is now in the title */}
            </Space>
          ),
        };
      case "à signer":
        return {
          title: (
            <>
              Contrat à signer
              {documentLink} {/* Include link in title */}
            </>
          ),
          description:
            "Votre profil a été validé. Veuillez maintenant accepter les conditions du contrat.",
          nextStep:
            "Après sginateur de contart, vous pourrez accéder à toutes les fonctionnalités de la plateforme.",
          icon: <FileProtectOutlined style={{ color: "#52c41a" }} />,
          color: "info",
          action: (
            <Button
              type="primary"
              icon={<FileProtectOutlined />}
              onClick={showContractModal}
              className="pulse-animation"
              style={{
                boxShadow: "0 0 8px #fa8c16",
                animation: "pulse 1.5s infinite",
                backgroundColor: "#fa8c16",
                borderColor: "#fa8c16",
              }}
            >
              Signer le contrat
            </Button>
          ),
        };
      case "Actif":
      case "validé":
        return {
          title: (
            <>
              Compte activé
              {documentLink} {/* Include link in title */}
            </>
          ),
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
              {/* Document link is now in the title */}
            </Space>
          ),
        };
      default:
        return {
          title: "Statut indéterminé",
          description:
            "Veuillez contacter notre support pour plus d'informations.",
          nextStep: "Nous vous aiderons à résoudre ce problème rapidement.",
          icon: <InfoCircleOutlined style={{ color: "#faad14" }} />,
          color: "warning",
          action: null,
        };
    }
  };

  // Status guidance content
  const statusGuidance = getStatusGuidance();

  // Tooltip title generation
  const getTooltipTitle = () => {
    return `Profil: ${completionDetails.profile}% | Documents: ${completionDetails.document}%`;
  };

  return profile ? (
    <div className="w-full mx-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <style>{pulseAnimationStyle}</style>

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
                  title: "Compléter le profil & Docs",
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

      <Card
        className="shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        bodyStyle={{ padding: 0 }}
      >
        {/* Status guidance alert - Compact version */}
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
            <div className="font-medium text-lg">
              {statusGuidance.title} {/* Title now includes the link */}
            </div>
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

        {/* En-tête avec Progression et Actions de Modification */}
        <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center border-b border-blue-100">
          <div className="w-full mb-4 md:mb-0 md:mr-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold text-blue-900">
                Complétude du profil & Documents
              </h3>
              <Tag
                color={
                  profileStatus
                    ? "success"
                    : completionDetails.total === 100 // Use total completion
                    ? "processing"
                    : "warning"
                }
                className="text-xs"
              >
                {profileStatus ? (
                  <>
                    <CheckCircleOutlined /> {profile.Statut}
                  </>
                ) : (
                  <>{completionDetails.total}%</> // Display total completion
                )}
              </Tag>
            </div>
            {!isAccountActive && (
              <Tooltip title={getTooltipTitle()}>
                {" "}
                {/* Updated Tooltip */}
                <Progress
                  percent={completionDetails.total} // Use total completion
                  status={
                    completionDetails.total === 100 ? "success" : "active"
                  } // Use total completion
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                  strokeWidth={8}
                  className="w-full"
                  size="small"
                />
              </Tooltip>
            )}
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  type="primary"
                  size="middle"
                  icon={<SaveOutlined />}
                  onClick={handleEdit}
                >
                  Enregistrer
                </Button>
                <Button
                  size="middle"
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                size="middle"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Modifier
              </Button>
            )}
            {/* Document button removed from here, link is in title/actions */}
          </div>
        </div>

        {/* Contenu du Profil */}
        <Row gutter={0} className="p-6">
          {/* Colonne de Gauche - Photo et Confidentialité */}
          <Col xs={24} md={8} className="border-r border-blue-100 pr-6">
            <div className="flex flex-col items-center">
              <Avatar
                size={150}
                src={
                  profile.img_path
                    ? `${Endponit()}/media/${profile.img_path}` // Use relative path with endpoint
                    : undefined
                }
                icon={!profile.img_path && <UserOutlined />}
                className="mb-4 border-4 border-blue-500 shadow-lg"
              />
              <Upload
                name="avatar"
                listType="picture"
                className="avatar-uploader"
                showUploadList={false}
                customRequest={() => {}} // Prevent default upload behavior
                beforeUpload={(file) => {
                  // Image type validation
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error(
                      "Vous ne pouvez télécharger que des fichiers image!"
                    );
                    return Upload.LIST_IGNORE; // Prevent upload
                  }

                  // File size validation
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error("L'image doit être inférieure à 2MB!");
                    return Upload.LIST_IGNORE; // Prevent upload
                  }

                  // Manually trigger upload handler
                  handleProfileImageUpload({ file });
                  return false; // Prevent default upload behavior after manual handling
                }}
              >
                <Button
                  icon={<UploadOutlined />}
                  type="dashed"
                  className="mb-4"
                  size="small"
                >
                  Changer de Photo
                </Button>
              </Upload>

              {/* Paramètres de Confidentialité */}
              <div className="w-full bg-blue-50 p-3 rounded-lg shadow-inner">
                <h4 className="text-center mb-2 font-semibold text-blue-800 text-sm">
                  Contrôles de Confidentialité
                </h4>
                <div className="space-y-2">
                  {Object.entries(privacySettings).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center"
                    >
                      <span className="text-blue-700 text-xs">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <Switch
                        checked={value}
                        onChange={() => handlePrivacyToggle(key)}
                        className="bg-blue-500"
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Col>

          {/* Colonne de Droite - Informations */}
          <Col xs={24} md={16} className="pl-6">
            <Form
              form={form}
              layout="vertical"
              disabled={!isEditing}
              className="space-y-3"
              size="middle"
            >
              <Divider orientation="left" className="text-sm">
                Informations de l'entreprise
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="raison_sociale"
                    label="Raison sociale"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez entrer votre raison sociale",
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Raison sociale"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="siret" label="Numéro SIRET">
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="Numéro SIRET"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="responsible" label="Representant legal">
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Representant legal"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="E-mail"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez entrer votre e-mail",
                      },
                      {
                        type: "email",
                        message: "Veuillez entrer un e-mail valide",
                      },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="E-mail"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="phone" label="Téléphone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Numéro de Téléphone"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="industry" label="Secteur d'Activité">
                    <Select
                      placeholder="Sélectionner un Secteur"
                      className="w-full"
                    >
                      <Option value="Technology">Technologie</Option>
                      <Option value="Finance">Finance</Option>
                      <Option value="Healthcare">Santé</Option>
                      <Option value="Education">Éducation</Option>
                      <Option value="Other">Autre</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="n_tva" label="Numéro de TVA">
                <Input
                  prefix={<BarcodeOutlined />}
                  placeholder="Numéro de TVA"
                  className="rounded-lg"
                />
              </Form.Item>

              <Divider orientation="left" className="text-sm">
                Adresse
              </Divider>

              <Form.Item name="address" label="Adresse">
                <Input
                  prefix={<HomeOutlined />}
                  placeholder="Adresse"
                  className="rounded-lg"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item name="cp" label="Code Postal">
                    <Input
                      prefix={<NumberOutlined />}
                      placeholder="Code Postal"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={10}>
                  <Form.Item name="ville" label="Ville">
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Ville"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="province" label="Province/Région">
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Province ou Région"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" className="text-sm">
                Informations bancaires
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="iban"
                    label="IBAN"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) {
                            return Promise.resolve(); // Allow empty field if not required
                          }

                          // Remove spaces and convert to uppercase
                          const cleanedIBAN = value
                            .replace(/\s/g, "")
                            .toUpperCase();

                          // Basic format check
                          const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
                          if (!ibanRegex.test(cleanedIBAN)) {
                            return Promise.reject(
                              new Error("Format IBAN invalide")
                            );
                          }

                          // IBAN checksum validation
                          // Rearrange IBAN: Move first 4 characters to the end
                          const rearranged =
                            cleanedIBAN.substring(4) +
                            cleanedIBAN.substring(0, 4);

                          // Convert letters to numbers (A=10, B=11, etc.)
                          const characters = rearranged.split("");
                          const numbers = characters.map((char) => {
                            return /[A-Z]/.test(char)
                              ? (char.charCodeAt(0) - 55).toString()
                              : char;
                          });

                          // Calculate MOD 97
                          let remainder = numbers.join("");
                          let block;

                          // Process in chunks for large IBANs
                          while (remainder.length > 10) {
                            block = remainder.substring(0, 10);
                            remainder =
                              (parseInt(block, 10) % 97) +
                              remainder.substring(10);
                          }

                          // Valid IBAN should give remainder of 1
                          if (parseInt(remainder, 10) % 97 === 1) {
                            return Promise.resolve();
                          }

                          return Promise.reject(
                            new Error("Numéro IBAN invalide, veuillez vérifier")
                          );
                        },
                      },
                    ]}
                  >
                    <Input
                      prefix={<CreditCardOutlined />}
                      placeholder="IBAN"
                      className="rounded-lg"
                      // Optional: Format IBAN with spaces as user types
                      onChange={(e) => {
                        // Remove existing spaces first
                        let value = e.target.value.replace(/\s/g, "");
                        // Add a space every 4 characters
                        value = value.replace(/(.{4})/g, "$1 ").trim();
                        // Update the form field with formatted value
                        form.setFieldsValue({ iban: value });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="bic" label="BIC">
                    <Input
                      prefix={<CreditCardOutlined />}
                      placeholder="BIC"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="banque" label="Banque">
                <Input
                  prefix={<BankOutlined />}
                  placeholder="Nom de la banque"
                  className="rounded-lg"
                />
              </Form.Item>

              <Divider orientation="left" className="text-sm">
                Informations complémentaires
              </Divider>

              <Form.Item name="bio" label="Description / RCE">
                <TextArea
                  rows={3}
                  placeholder="Description de votre entreprise"
                  className="rounded-lg"
                />
              </Form.Item>

              <Divider orientation="left" className="text-sm">
                Réseaux sociaux et Web
              </Divider>
              <div className="space-y-3">
                <Form.Item name="linkedin" label="LinkedIn">
                  <Input
                    prefix={<LinkedinOutlined />}
                    placeholder="URL LinkedIn"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item name="twitter" label="Twitter">
                  <Input
                    prefix={<TwitterOutlined />}
                    placeholder="URL Twitter"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item name="website" label="Site Web">
                  <Input
                    prefix={<GlobalOutlined />}
                    placeholder="URL Site Web"
                    className="rounded-lg"
                  />
                </Form.Item>
              </div>
            </Form>
          </Col>
        </Row>
      </Card>
      {contractModal}
    </div>
  ) : (
    <div className="flex justify-center items-center p-10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des informations...</p>
      </div>
    </div>
  );
};

export default ClientPlusInfo;
