import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Input,
  Modal,
  Descriptions,
  message,
  Spin,
  Empty,
  Tooltip,
  Badge,
  Form,
  Divider,
  Upload,
  Progress,
} from "antd";
import {
  EuroOutlined,
  FilePdfOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  FileTextOutlined,
  EditOutlined,
  DollarOutlined,
  SettingOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import moment from "moment";
import InvoiceService from "../../services/invoiceService";
import PDFService from "../../services/pdfService";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminInvoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [editForm] = Form.useForm();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [acceptingInvoice, setAcceptingInvoice] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
    commissionAmount: 0,
    clientAmount: 0,
  });

  // Fonction utilitaire pour convertir les montants
  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount.toFixed(2);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchText, statusFilter, typeFilter, dateRange]);
  // Récupérer toutes les factures
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await InvoiceService.getAllInvoices(); // S'assurer que la réponse est un tableau
      const invoicesData = Array.isArray(response) ? response : [];

      console.log(
        `Admin - Factures totales récupérées: ${invoicesData.length}`
      );
      const mitcToClientCount = invoicesData.filter(
        (inv) => inv.type_facture === "MITC_TO_CLIENT"
      ).length;
      const esnToMitcCount = invoicesData.filter(
        (inv) => inv.type_facture === "ESN_TO_MITC"
      ).length;
      console.log(`Admin - Factures MITC_TO_CLIENT: ${mitcToClientCount}`);
      console.log(`Admin - Factures ESN_TO_MITC: ${esnToMitcCount}`);

      setInvoices(invoicesData);
      calculateStatistics(invoicesData);
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
      setInvoices([]);
      setFilteredInvoices([]);
      // message.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };
  // Calculer les statistiques
  const calculateStatistics = (invoiceList) => {
    // S'assurer que invoiceList est un tableau
    const validInvoices = Array.isArray(invoiceList) ? invoiceList : [];

    const stats = {
      total: validInvoices.length,
      paid: validInvoices.filter((inv) => inv.statut === "Payée").length,
      pending: validInvoices.filter((inv) => inv.statut === "En attente")
        .length,
      totalAmount: validInvoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.montant_ttc) || 0),
        0
      ),
      commissionAmount: validInvoices
        .filter((inv) => inv.type_facture.includes("ESN_TO_MITC"))
        .reduce((sum, inv) => sum + (parseFloat(inv.montant_ttc) || 0), 0),
      clientAmount: validInvoices
        .filter((inv) => inv.type_facture.includes("MITC_TO_CLIENT"))
        .reduce((sum, inv) => sum + (parseFloat(inv.montant_ttc) || 0), 0),
    };
    setStatistics(stats);
  };
  // Filtrer les factures
  const filterInvoices = () => {
    // S'assurer que invoices est un tableau
    if (!Array.isArray(invoices)) {
      setFilteredInvoices([]);
      return;
    }

    let filtered = [...invoices]; // Filtre par texte de recherche
    if (searchText) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.id_facture?.toString().includes(searchText) ||
          invoice.periode?.includes(searchText)
      );
    }

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter((invoice) => invoice.statut === statusFilter);
    }

    // Filtre par type
    if (typeFilter) {
      filtered = filtered.filter((invoice) => {
        // Pour les nouveaux types avec batch ID, comparer avec le type de base
        const baseType = invoice.type_facture.split('_').slice(0, 3).join('_');
        const fullBaseType = invoice.type_facture.includes('NDF') 
          ? baseType + '_NDF' 
          : baseType;
        
        return invoice.type_facture === typeFilter || fullBaseType === typeFilter;
      });
    }

    // Filtre par date
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((invoice) => {
        const invoiceDate = moment(invoice.date_emission);
        return invoiceDate.isBetween(dateRange[0], dateRange[1], "day", "[]");
      });
    }

    setFilteredInvoices(filtered);
  };

  // Afficher le détail d'une facture
  const showInvoiceDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalVisible(true);
  };

  // Modifier une facture
  const editInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    editForm.setFieldsValue({
      statut: invoice.statut,
      montant_ht: invoice.montant_ht,
      montant_ttc: invoice.montant_ttc,
      taux_tva: invoice.taux_tva,
      description: invoice.description,
    });
    setEditModalVisible(true);
  };

  // Sauvegarder les modifications
  const handleEditSave = async (values) => {
    try {
      await InvoiceService.updateInvoice(selectedInvoice.id, values);
      message.success("Facture mise à jour avec succès");
      setEditModalVisible(false);
      fetchInvoices();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      message.error("Erreur lors de la mise à jour de la facture");
    }
  }; // Télécharger la facture PDF
  const downloadInvoice = async (invoice) => {
    try {
      // Fetch additional information if needed
      const additionalInfo = {
        clientInfo: { nom: `Client #${invoice.id_client}` },
        esnInfo: { nom: `ESN #${invoice.id_esn}` },
        consultantInfo: { nom: `Consultant #${invoice.consultant_id}` },
      };

      const result = PDFService.downloadInvoicePDF(
        invoice,
        "admin",
        additionalInfo
      );

      if (result.success) {
        message.success("Facture téléchargée avec succès");
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      message.error("Erreur lors du téléchargement de la facture");
    }
  };

  // Ouvrir le modal d'upload pour une facture ESN commission
  const showUploadModal = (invoice) => {
    setUploadingInvoice(invoice);
    setUploadModalVisible(true);
    setUploadProgress(0);
  };

  // Gérer l'upload du justificatif de paiement pour ESN commission
  const handleUpload = async (file) => {
    if (!uploadingInvoice) {
      message.error("Aucune facture sélectionnée");
      return false;
    }

    // Vérifier le format du fichier
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      message.error(
        "Format de fichier non supporté. Veuillez utiliser PDF, JPG ou PNG."
      );
      return false;
    }

    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error("Le fichier est trop volumineux. Taille maximale : 10MB");
      return false;
    }

    try {
      setUploadProgress(0);

      // Préparer les données pour l'API saveDoc
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "documents/admin/esn_commissions/");

      // Simuler le progrès d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Appel à l'API saveDoc
      const uploadResponse = await InvoiceService.uploadDocument(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadResponse.status) {
        // Mettre à jour la facture avec le chemin du fichier et changer le statut
        const updateResponse = await InvoiceService.updateInvoiceWithAttachment(
          uploadingInvoice.id_facture,
          uploadResponse.path,
          "Payée"
        );

        if (updateResponse.success) {
          message.success(
            "Justificatif uploadé avec succès ! Le statut de la facture ESN a été mis à jour."
          );

          // Actualiser la liste des factures
          await fetchInvoices();

          // Fermer le modal
          setUploadModalVisible(false);
          setUploadingInvoice(null);
        } else {
          throw new Error(
            updateResponse.message ||
              "Erreur lors de la mise à jour de la facture"
          );
        }
      } else {
        throw new Error(uploadResponse.msg || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      message.error("Erreur lors de l'upload du justificatif");
      setUploadProgress(0);
    }

    return false; // Empêcher l'upload automatique d'Ant Design
  };
  // Voir un justificatif attaché
  const viewAttachment = (attachmentPath) => {
    if (attachmentPath) {
      // Construire l'URL complète du fichier
      const fileUrl = `${InvoiceService.getEndpoint()}/${attachmentPath}`;
      window.open(fileUrl, "_blank");
    } else {
      message.error("Aucun justificatif trouvé");
    }
  };

  // Ouvrir le modal d'acceptation pour un justificatif client
  const showAcceptModal = (invoice) => {
    setAcceptingInvoice(invoice);
    setAcceptModalVisible(true);
  };
  // Accepter un justificatif de paiement client
  const handleAcceptAttachment = async (approved) => {
    if (!acceptingInvoice) {
      message.error("Aucune facture sélectionnée");
      return;
    }

    try {
      // Mettre à jour le statut de la facture
      const newStatus = approved ? "Acceptée" : "Rejetée";
      
      // Utiliser la méthode qui efface l'attachment lors du rejet pour permettre le re-upload
      const updateResponse = await InvoiceService.updateInvoiceStatusWithAttachmentReset(
        acceptingInvoice.id_facture,
        newStatus
      );

      if (updateResponse.success) {
        if (approved) {
          message.success(
            "Justificatif client accepté ! La facture est maintenant validée."
          );
        } else {
          message.warning(
            "Justificatif client rejeté. Le client peut maintenant télécharger un nouveau justificatif."
          );
        }

        // Actualiser la liste des factures
        await fetchInvoices();

        // Fermer le modal
        setAcceptModalVisible(false);
        setAcceptingInvoice(null);
      } else {
        throw new Error(
          updateResponse.message || "Erreur lors de la mise à jour"
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
      message.error("Erreur lors de l'acceptation du justificatif");
    }
  };
  // Vérifier si l'upload ESN est autorisé (client doit avoir payé ET être accepté par admin)
  const isESNUploadAllowed = (invoice) => {
    // Pour une facture ESN (CRA ou NDF), vérifier s'il existe une facture client correspondante qui est ACCEPTÉE par l'admin
    if (!invoice.type_facture.includes("ESN_TO_MITC")) return false;

    // Extraire le batch ID de la facture ESN
    const esnTypeWithoutBatch = invoice.type_facture.split('_').slice(0, 3).join('_'); // ESN_TO_MITC ou ESN_TO_MITC_NDF
    const batchId = invoice.type_facture.split('_').slice(-1)[0]; // Dernier élément après le dernier underscore
    
    // Si pas de batch ID, utiliser l'ancienne logique pour compatibilité
    if (!batchId || batchId === esnTypeWithoutBatch) {
      const isNDF = invoice.type_facture.includes("NDF");
      const clientInvoiceType = isNDF ? "MITC_TO_CLIENT_NDF" : "MITC_TO_CLIENT";
      
      const correspondingClientInvoice = invoices.find(
        (inv) =>
          inv.type_facture === clientInvoiceType &&
          inv.periode === invoice.periode &&
          inv.consultant_id === invoice.consultant_id &&
          inv.statut === "Acceptée"
      );
      
      return !!correspondingClientInvoice;
    }

    // Déterminer le type de facture client correspondante avec le même batch ID
    const isNDF = invoice.type_facture.includes("NDF");
    const clientInvoiceType = isNDF ? `MITC_TO_CLIENT_NDF_${batchId}` : `MITC_TO_CLIENT_${batchId}`;

    // Chercher la facture client correspondante avec le même batch ID
    const correspondingClientInvoice = invoices.find(
      (inv) =>
        inv.type_facture === clientInvoiceType &&
        inv.statut === "Acceptée" // Seules les factures acceptées par l'admin permettent l'upload ESN
    );

    return !!correspondingClientInvoice;
  };

  // Colonnes du tableau
  const columns = [
    {
      title: "N° Facture",
      dataIndex: "id_facture",
      key: "id_facture",
      render: (id) => <Text code>FAC-{String(id).padStart(6, "0")}</Text>,
    },
    {
      title: "Periode",
      dataIndex: "periode",
      key: "periode",
      // render: (date) => moment(date).format("DD/MM/YYYY"),
      sorter: (a, b) =>
        moment(a.date_emission).unix() - moment(b.date_emission).unix(),
    },
    {
      title: "Cible",
      dataIndex: "type_facture",
      key: "type_facture",
      render: (type) => {
        // Extraire le type de base (sans le batch ID)
        const baseType = type.split('_').slice(0, 3).join('_');
        const isNDF = type.includes("NDF");
        const batchId = type.split('_').slice(-1)[0];
        
        if (baseType === "MITC_TO_CLIENT" || type === "MITC_TO_CLIENT") {
          return (
            <Tag color="blue">
              {isNDF ? "Client NDF" : "Client"}
              {batchId && batchId !== "CLIENT" && batchId !== "NDF" && (
                <Text style={{ fontSize: "10px", marginLeft: "4px" }}>#{batchId}</Text>
              )}
            </Tag>
          );
        } else if (baseType === "ESN_TO_MITC" || type === "ESN_TO_MITC") {
          return (
            <Tag color="green">
              {isNDF ? "ESN NDF" : "ESN"}
              {batchId && batchId !== "MITC" && batchId !== "NDF" && (
                <Text style={{ fontSize: "10px", marginLeft: "4px" }}>#{batchId}</Text>
              )}
            </Tag>
          );
        }
        
        // Fallback pour les anciens types
        if (type === "MITC_TO_CLIENT_NDF") {
          return <Tag color="purple">Client NDF</Tag>;
        } else if (type === "ESN_TO_MITC_NDF") {
          return <Tag color="orange">ESN NDF</Tag>;
        }
        
        return <Tag>{type}</Tag>;
      },
    },

    {
      title: "Montant HT",
      dataIndex: "montant_ht",
      key: "montant_ht",
      render: (amount) => `${formatAmount(amount)} €`,
      sorter: (a, b) =>
        (parseFloat(a.montant_ht) || 0) - (parseFloat(b.montant_ht) || 0),
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      key: "montant_ttc",
      render: (amount) => (
        <Text strong style={{ color: "#1890ff" }}>
          {formatAmount(amount)} €
        </Text>
      ),
      sorter: (a, b) =>
        (parseFloat(a.montant_ttc) || 0) - (parseFloat(b.montant_ttc) || 0),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => {
        const config = InvoiceService.getStatusTag(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir les détails">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showInvoiceDetail(record)}
            />
          </Tooltip>{" "}
          {/* <Tooltip title="Modifier">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editInvoice(record)}
            />
          </Tooltip> */}
          {/* Download PDF button - Admin can always download */}
          <Tooltip title="Télécharger PDF">
            <Button
              type="default"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadInvoice(record)}
            />
          </Tooltip>          {/* Upload attachment button for ESN commissions - only if client payment is accepted */}
          {record.type_facture.includes("ESN_TO_MITC") &&
            (record.statut === "En attente" || record.statut === "Rejetée") &&
            isESNUploadAllowed(record) && (
              <Tooltip title={
                record.statut === "Rejetée" 
                  ? `Re-uploader justificatif de paiement ${record.type_facture.includes('NDF') ? 'ESN NDF' : 'ESN'} (document rejeté)`
                  : `Uploader justificatif de paiement ${record.type_facture.includes('NDF') ? 'ESN NDF' : 'ESN'}`
              }>
                <Button
                  type="primary"
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => showUploadModal(record)}
                  style={{ 
                    backgroundColor: record.statut === "Rejetée" ? "#ff7875" : "#52c41a", 
                    borderColor: record.statut === "Rejetée" ? "#ff7875" : "#52c41a" 
                  }}
                />
              </Tooltip>
            )}{" "}
          {/* Disabled upload button for ESN if client hasn't paid */}
          {record.type_facture.includes("ESN_TO_MITC") &&
            (record.statut === "En attente" || record.statut === "Rejetée") &&
            !isESNUploadAllowed(record) && (
              <Tooltip title="Justificatif client doit être accepté par l'admin avant upload ESN">
                <Button
                  type="default"
                  size="small"
                  icon={<UploadOutlined />}
                  disabled
                  style={{ opacity: 0.5 }}
                />
              </Tooltip>
            )}
          {/* Accept client attachment button */}
          {record.type_facture.includes("MITC_TO_CLIENT") &&
            record.statut === "Payée" &&
            record.attachment && (
              <Tooltip title={`Accepter/Rejeter le justificatif ${record.type_facture.includes('NDF') ? 'client NDF' : 'client'}`}>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => showAcceptModal(record)}
                  style={{ backgroundColor: "#ff9500", borderColor: "#ff9500" }}
                />
              </Tooltip>
            )}
          {/* View attachment button */}
          {record.attachment && (
            <Tooltip title="Voir justificatif de paiement">
              <Button
                type="default"
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => viewAttachment(record.attachment)}
                style={{ color: "#1890ff", borderColor: "#1890ff" }}
              />
            </Tooltip>
          )}
          {/* Paid status indicator */}
          {record.type_facture.includes("ESN_TO_MITC") &&
            record.statut === "Payée" &&
            !record.attachment && (
              <Tooltip title="Facture payée">
                <Button
                  type="default"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  disabled
                  style={{ color: "#52c41a", borderColor: "#52c41a" }}
                />
              </Tooltip>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>
        {/* Filtres */}
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                {" "}
                <Select
                  placeholder="Filtrer par statut"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Option value="En attente">En attente</Option>
                  <Option value="Payée">Payée</Option>
                  <Option value="Acceptée">Acceptée</Option>
                  <Option value="Rejetée">Rejetée</Option>
                  <Option value="Reçue">Reçue</Option>
                  <Option value="Contestée">Contestée</Option>
                  <Option value="Annulée">Annulée</Option>
                </Select>{" "}
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Filtrer par type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Option value="MITC_TO_CLIENT">Factures clients</Option>
                  <Option value="ESN_TO_MITC">Commissions ESN</Option>
                  <Option value="MITC_TO_CLIENT_NDF">Factures clients NDF</Option>
                  <Option value="ESN_TO_MITC_NDF">Commissions ESN NDF</Option>
                </Select>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchInvoices}
                  loading={loading}
                >
                  Actualiser
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Tableau des factures */}
        <Col span={24}>
          <Card>
            <Spin spinning={loading}>
              {filteredInvoices.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={filteredInvoices}
                  rowKey="id_facture"
                  size="small"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} de ${total} factures`,
                  }}
                  scroll={{ x: 1400 }}
                />
              ) : (
                <Empty
                  description="Aucune facture trouvée"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Modal de détail de facture */}
      <Modal
        title={
          <Space>
            <FilePdfOutlined />
            <span>
              Détail de la facture FAC-
              {String(selectedInvoice?.id_facture || "").padStart(6, "0")}
            </span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              editInvoice(selectedInvoice);
            }}
          >
            Modifier
          </Button>,
        ]}
        width={800}
      >
        {selectedInvoice && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro" span={2}>
              <Text code>
                FAC-{String(selectedInvoice.id_facture).padStart(6, "0")}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Periode">
              {moment(selectedInvoice.periode).format("DD/MM/YYYY")}
            </Descriptions.Item>

            {/* <Descriptions.Item label="Client/ESN">
              {selectedInvoice.type_facture === "MITC_TO_CLIENT"
                ? `Client #${selectedInvoice.id_client}`
                : `ESN #${selectedInvoice.id_esn}`}
            </Descriptions.Item> */}
            <Descriptions.Item label="Montant HT">
              {formatAmount(selectedInvoice.montant_ht)} €
            </Descriptions.Item>
            <Descriptions.Item label="Taux TVA">
              {parseFloat(selectedInvoice.taux_tva) || 20}%
            </Descriptions.Item>
            <Descriptions.Item label="Montant TVA">
              {formatAmount(
                (parseFloat(selectedInvoice.montant_ttc) || 0) -
                  (parseFloat(selectedInvoice.montant_ht) || 0)
              )}{" "}
              €
            </Descriptions.Item>
            <Descriptions.Item label="Montant TTC">
              <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                {formatAmount(selectedInvoice.montant_ttc)} €
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Statut" span={2}>
              <Tag
                color={
                  InvoiceService.getStatusTag(selectedInvoice.statut).color
                }
              >
                {InvoiceService.getStatusTag(selectedInvoice.statut).text}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal d'édition */}
      <Modal
        title="Modifier la facture"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
          <Form.Item
            name="statut"
            label="Statut"
            rules={[
              { required: true, message: "Veuillez sélectionner un statut" },
            ]}
          >
            {" "}
            <Select>
              <Option value="En attente">En attente</Option>
              <Option value="Payée">Payée</Option>
              <Option value="Acceptée">Acceptée</Option>
              <Option value="Rejetée">Rejetée</Option>
              <Option value="Reçue">Reçue</Option>
              <Option value="Contestée">Contestée</Option>
              <Option value="Annulée">Annulée</Option>
              <Option value="Brouillon">Brouillon</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="montant_ht"
                label="Montant HT"
                rules={[
                  { required: true, message: "Veuillez saisir le montant HT" },
                ]}
              >
                <Input prefix="€" type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taux_tva"
                label="Taux TVA (%)"
                rules={[
                  { required: true, message: "Veuillez saisir le taux TVA" },
                ]}
              >
                <Input suffix="%" type="number" step="0.01" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="montant_ttc"
            label="Montant TTC"
            rules={[
              { required: true, message: "Veuillez saisir le montant TTC" },
            ]}
          >
            <Input prefix="€" type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Divider />
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                Sauvegarder
              </Button>
            </Space>
          </Form.Item>{" "}
        </Form>
      </Modal>

      {/* Upload Modal for ESN Commission Invoices */}
      <Modal        title={
          <Space>
            <UploadOutlined />
            <span>
              {uploadingInvoice?.statut === "Rejetée" 
                ? "Re-uploader justificatif de paiement ESN - FAC-"
                : "Uploader justificatif de paiement ESN - FAC-"
              }
              {String(uploadingInvoice?.id_facture || "").padStart(6, "0")}
            </span>
          </Space>
        }
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadingInvoice(null);
          setUploadProgress(0);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setUploadModalVisible(false);
              setUploadingInvoice(null);
              setUploadProgress(0);
            }}
          >
            Annuler
          </Button>,
        ]}
        width={600}
      >
        {uploadingInvoice && (
          <div style={{ padding: "20px 0" }}>
            <Descriptions bordered column={1} style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Facture">
                <Text code>
                  FAC-{String(uploadingInvoice.id_facture).padStart(6, "0")}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="green">ESN</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ESN">
                <Text>ESN #{uploadingInvoice.id_esn}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Montant">
                <Text strong style={{ color: "#1890ff" }}>
                  {formatAmount(uploadingInvoice.montant_ttc)} €
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Statut actuel">
                <Tag
                  color={
                    InvoiceService.getStatusTag(uploadingInvoice.statut).color
                  }
                >
                  {InvoiceService.getStatusTag(uploadingInvoice.statut).text}
                </Tag>{" "}
              </Descriptions.Item>
            </Descriptions>

            {/* Show corresponding client invoice status */}
            {uploadingInvoice &&
              (() => {
                const correspondingClientInvoice = invoices.find(
                  (inv) =>
                    inv.type_facture === "MITC_TO_CLIENT" &&
                    inv.periode === uploadingInvoice.periode &&
                    inv.consultant_id === uploadingInvoice.consultant_id
                );
              })()}

            <div style={{ textAlign: "center" }}>
              <Upload.Dragger
                beforeUpload={handleUpload}
                multiple={false}
                accept=".pdf,.jpg,.jpeg,.png"
                showUploadList={false}
                style={{ marginBottom: "20px" }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined
                    style={{ fontSize: "48px", color: "#1890ff" }}
                  />
                </p>                <p className="ant-upload-text">
                  {uploadingInvoice.statut === "Rejetée"
                    ? "Cliquez ou glissez le nouveau justificatif de paiement ESN ici"
                    : "Cliquez ou glissez le justificatif de paiement ESN ici"
                  }
                </p>
                <p className="ant-upload-hint">
                  Formats acceptés: PDF, JPG, PNG (max 10MB)
                </p>
              </Upload.Dragger>

              {uploadProgress > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <Progress
                    percent={uploadProgress}
                    status={uploadProgress === 100 ? "success" : "active"}
                    strokeColor={uploadProgress === 100 ? "#52c41a" : "#1890ff"}
                  />
                  <p style={{ marginTop: "10px", color: "#666" }}>
                    {uploadProgress === 100
                      ? "Upload terminé! Mise à jour du statut..."
                      : "Upload en cours..."}
                  </p>
                </div>
              )}              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: uploadingInvoice.statut === "Rejetée" ? "#fff2e8" : "#f0f9ff",
                  borderRadius: "6px",
                }}
              >
                {" "}
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <strong>Information:</strong> 
                  {uploadingInvoice.statut === "Rejetée" 
                    ? " Ce justificatif a été rejeté par l'ESN. Vous pouvez maintenant télécharger un nouveau justificatif de paiement."
                    : " Cette fonction est disponible car le justificatif de paiement client a été accepté par l'admin."
                  } Une fois le justificatif ESN uploadé, le statut de la
                  facture sera automatiquement mis à jour en "Payée".
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Accept/Reject Client Attachment Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            <span>
              Validation justificatif client - FAC-
              {String(acceptingInvoice?.id_facture || "").padStart(6, "0")}
            </span>
          </Space>
        }
        open={acceptModalVisible}
        onCancel={() => {
          setAcceptModalVisible(false);
          setAcceptingInvoice(null);
        }}
        footer={[
          <Button
            key="reject"
            danger
            onClick={() => handleAcceptAttachment(false)}
          >
            Rejeter
          </Button>,
          <Button
            key="accept"
            type="primary"
            onClick={() => handleAcceptAttachment(true)}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Accepter
          </Button>,
        ]}
        width={600}
      >
        {acceptingInvoice && (
          <div style={{ padding: "20px 0" }}>
            <Descriptions bordered column={1} style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Facture">
                <Text code>
                  FAC-{String(acceptingInvoice.id_facture).padStart(6, "0")}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">Client</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Client">
                <Text>Client #{acceptingInvoice.id_client}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Montant">
                <Text strong style={{ color: "#1890ff" }}>
                  {formatAmount(acceptingInvoice.montant_ttc)} €
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Statut actuel">
                <Tag
                  color={
                    InvoiceService.getStatusTag(acceptingInvoice.statut).color
                  }
                >
                  {InvoiceService.getStatusTag(acceptingInvoice.statut).text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Text
                strong
                style={{
                  fontSize: "16px",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                Justificatif de paiement soumis par le client
              </Text>
              {acceptingInvoice.attachment && (
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={() => viewAttachment(acceptingInvoice.attachment)}
                  style={{ marginBottom: "15px" }}
                >
                  Consulter le justificatif
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminInvoices;
