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

const ClientInvoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [statistics, setStatistics] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
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
  // Récupérer les factures du client
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      if (!clientId) {
        message.error("ID client non trouvé");
        setInvoices([]);
        setFilteredInvoices([]);
        return;
      }      const response = await InvoiceService.getInvoicesByClient(clientId);

      // S'assurer que la réponse est un tableau
      const invoicesData = Array.isArray(response) ? response : [];      // Filtrer pour afficher seulement les factures MITC_TO_CLIENT (CRA et NDF) pour les clients
      const clientInvoices = invoicesData.filter(invoice => 
        invoice.type_facture.includes("MITC_TO_CLIENT")
      );

      console.log(`Factures totales récupérées: ${invoicesData.length}`);
      console.log(`Factures client (MITC_TO_CLIENT + NDF): ${clientInvoices.length}`);

      setInvoices(clientInvoices);
      calculateStatistics(clientInvoices);
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
      setInvoices([]);
      setFilteredInvoices([]);
      // Pas de message d'erreur si c'est juste qu'il n'y a pas de factures
    } finally {
      setLoading(false);
    }
  }; // Calculer les statistiques
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
      filtered = filtered.filter((invoice) => invoice.type_facture === typeFilter);
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
  };  // Télécharger la facture PDF
  const downloadInvoice = async (invoice) => {
    try {
      if (!PDFService.isDownloadAllowed(invoice, 'client')) {
        message.warning('Le téléchargement n\'est autorisé qu\'après acceptation de votre paiement par l\'admin');
        return;
      }

      // Fetch additional information if needed
      const clientId = localStorage.getItem("id");
      const additionalInfo = {
        clientInfo: { nom: `Client #${clientId}` },
        consultantInfo: { nom: `Consultant #${invoice.consultant_id}` }
      };

      const result = PDFService.downloadInvoicePDF(invoice, 'client', additionalInfo);
      
      if (result.success) {
        message.success('Facture téléchargée avec succès');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      message.error('Erreur lors du téléchargement de la facture');
    }
  };

  // Voir/télécharger le justificatif de paiement
  const viewAttachment = (attachmentPath) => {
    if (!attachmentPath) {
      message.error("Aucun justificatif trouvé");
      return;
    }
    
    // Construire l'URL complète du fichier
    const fileUrl = `${InvoiceService.getEndpoint()}/${attachmentPath}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(fileUrl, '_blank');
  };

  // Ouvrir le modal d'upload pour une facture
  const showUploadModal = (invoice) => {
    setUploadingInvoice(invoice);
    setUploadModalVisible(true);
    setUploadProgress(0);
  };
  // Gérer l'upload du justificatif de paiement
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

      // Préparer les données pour l'API saveDoc selon votre format
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "documents/clients/justificatifs/");

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
            "Justificatif uploadé avec succès ! Le statut de la facture a été mis à jour."
          );

          // Actualiser la liste des factures
          await fetchInvoices();

          // Fermer le modal
          setUploadModalVisible(false);
          setUploadingInvoice(null);
        } else {
          throw new Error(updateResponse.message || "Erreur lors de la mise à jour de la facture");
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
      title: "Type",
      dataIndex: "type_facture",
      key: "type_facture",
      render: (type) => {
        const isNDF = type.includes("NDF");
        const batchId = type.split('_').slice(-1)[0];
        
        return (
          <Tag color={isNDF ? "purple" : "blue"}>
            {isNDF ? "NDF" : "CRA"}
            {batchId && batchId !== "CLIENT" && batchId !== "NDF" && (
              <Text style={{ fontSize: "10px", marginLeft: "4px" }}>#{batchId}</Text>
            )}
          </Tag>
        );
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
    // {
    //   title: "TVA",
    //   dataIndex: "taux_tva",
    //   key: "taux_tva",
    //   render: (taux) => `${parseFloat(taux) || 20}%`,
    // },
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
    },    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status, record) => {
        const config = InvoiceService.getStatusTag(status);
        return (
          <Space direction="vertical" size="small">
            <Tag color={config.color}>{config.text}</Tag>
            {record.attachment && (
              <Tag color="blue" icon={<FilePdfOutlined />} style={{ fontSize: '10px' }}>
                Justificatif
              </Tag>
            )}
          </Space>
        );
      },      filters: [
        { text: "En attente", value: "En attente" },
        { text: "Payée", value: "Payée" },
        { text: "Rejetée", value: "Rejetée" },
        { text: "Annulée", value: "Annulée" },
      ],
      onFilter: (value, record) => record.statut === value,
    },    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>          <Tooltip title="Voir les détails">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showInvoiceDetail(record)}
            />
          </Tooltip>
          {/* Download PDF button - only for accepted invoices */}
          {PDFService.isDownloadAllowed(record, 'client') && (
            <Tooltip title="Télécharger PDF">
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadInvoice(record)}
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
          {/* Disabled download button for non-accepted invoices */}
          {!PDFService.isDownloadAllowed(record, 'client') && (
            <Tooltip title="Téléchargement disponible après acceptation par l'admin">
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                disabled
                style={{ opacity: 0.5 }}
              />
            </Tooltip>
          )}
          {record.attachment && (
            <Tooltip title="Voir justificatif de paiement">
              <Button
                type="default"
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => viewAttachment(record.attachment)}
                style={{ color: '#1890ff', borderColor: '#1890ff' }}
              />
            </Tooltip>
          )}          {(record.statut === "En attente" || record.statut === "Rejetée") && (
            <Tooltip title={
              record.statut === "Rejetée" 
                ? "Re-uploader justificatif de paiement (document rejeté)" 
                : "Uploader justificatif de paiement"
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
          )}
          {record.statut === "Payée" && !record.attachment && (
            <Tooltip title="Facture payée">
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                disabled
                style={{ color: "#52c41a" }}
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
        {/* En-tête avec statistiques */}

        {/* Filtres */}
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>                <Select
                  placeholder="Filtrer par statut"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Option value="En attente">En attente</Option>
                  <Option value="Payée">Payée</Option>
                  <Option value="Rejetée">Rejetée</Option>
                  <Option value="Annulée">Annulée</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Filtrer par type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: "100%" }}
                  allowClear
                >
                  <Option value="MITC_TO_CLIENT">CRA</Option>
                  <Option value="MITC_TO_CLIENT_NDF">NDF</Option>
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
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} de ${total} factures`,
                  }}
                  scroll={{ x: 1200 }}
                  size="small"
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
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => downloadInvoice(selectedInvoice)}
          >
            Télécharger PDF
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
            </Descriptions.Item>            <Descriptions.Item label="Statut" span={2}>
              <Space>
                <Tag
                  color={
                    InvoiceService.getStatusTag(selectedInvoice.statut).color
                  }
                >
                  {InvoiceService.getStatusTag(selectedInvoice.statut).text}
                </Tag>
                {selectedInvoice.attachment && (
                  <Button
                    type="link"
                    size="small"
                    icon={<FilePdfOutlined />}
                    onClick={() => viewAttachment(selectedInvoice.attachment)}
                  >
                    Voir justificatif
                  </Button>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal d'upload du justificatif de paiement */}
      <Modal        title={
          <Space>
            <UploadOutlined />
            <span>
              {uploadingInvoice?.statut === "Rejetée" ? "Re-uploader" : "Uploader"} justificatif de paiement - FAC-
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
                </Tag>
              </Descriptions.Item>
            </Descriptions>

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
                    ? "Cliquez ou glissez votre nouveau justificatif de paiement ici"
                    : "Cliquez ou glissez votre justificatif de paiement ici"
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
                  backgroundColor: uploadingInvoice.statut === "Rejetée" ? "#fff2f0" : "#f0f9ff",
                  borderRadius: "6px",
                  border: uploadingInvoice.statut === "Rejetée" ? "1px solid #ffccc7" : "1px solid #d6f7ff",
                }}
              >
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <strong>
                    {uploadingInvoice.statut === "Rejetée" ? "Attention:" : "Information:"}
                  </strong>{" "}
                  {uploadingInvoice.statut === "Rejetée" 
                    ? "Votre précédent justificatif a été rejeté. Veuillez uploader un nouveau document conforme. Une fois uploadé, le statut sera remis à 'Payée' en attente de validation."
                    : "Une fois votre justificatif uploadé, le statut de votre facture sera automatiquement mis à jour en 'Payée'."
                  }
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientInvoices;
