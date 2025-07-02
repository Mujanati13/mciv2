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
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import InvoiceService from "../../services/invoiceService";
import PDFService from "../../services/pdfService";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ESNInvoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmingInvoice, setConfirmingInvoice] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [statistics, setStatistics] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
    commissionAmount: 0,
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
  // Récupérer les factures de l'ESN
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const esnId = localStorage.getItem("id");
      if (!esnId) {
        message.error("ID ESN non trouvé");
        setInvoices([]);
        setFilteredInvoices([]);
        return;
      }
      const response = await InvoiceService.getInvoicesByESN(esnId);

      // S'assurer que la réponse est un tableau
      const invoicesData = Array.isArray(response) ? response : [];      // Filtrer pour afficher seulement les factures ESN_TO_MITC (CRA et NDF) pour les ESN
      const esnInvoices = invoicesData.filter(
        (invoice) => invoice.type_facture.includes("ESN_TO_MITC")
      );

      console.log(`Factures totales récupérées: ${invoicesData.length}`);
      console.log(`Factures ESN (ESN_TO_MITC + NDF): ${esnInvoices.length}`);

      setInvoices(esnInvoices);
      calculateStatistics(esnInvoices);
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
      setInvoices([]);
      setFilteredInvoices([]);
      // message.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }; // Calculer les statistiques
  const calculateStatistics = (invoiceList) => {
    // S'assurer que invoiceList est un tableau
    const validInvoices = Array.isArray(invoiceList) ? invoiceList : [];

    const stats = {
      total: validInvoices.length,
      paid: validInvoices.filter(
        (inv) => inv.statut === "Payée" || inv.statut === "Reçue"
      ).length,
      pending: validInvoices.filter((inv) => inv.statut === "En attente")
        .length,
      totalAmount: validInvoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.montant_ttc) || 0),
        0
      ),
      commissionAmount: validInvoices
        .filter((inv) => inv.type_facture.includes("ESN_TO_MITC"))
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
  }; // Télécharger la facture PDF
  const downloadInvoice = async (invoice) => {
    try {
      if (!PDFService.isDownloadAllowed(invoice, "esn")) {
        message.warning(
          "Le téléchargement n'est autorisé qu'après confirmation de réception du paiement"
        );
        return;
      }

      // Fetch additional information if needed
      const esnId = localStorage.getItem("id");
      const additionalInfo = {
        esnInfo: { nom: `ESN #${esnId}` },
        consultantInfo: { nom: `Consultant #${invoice.consultant_id}` },
      };

      const result = PDFService.downloadInvoicePDF(
        invoice,
        "esn",
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

  // Ouvrir le modal de confirmation de paiement
  const showConfirmModal = (invoice) => {
    setConfirmingInvoice(invoice);
    setConfirmModalVisible(true);
  };
  // Confirmer ou refuser le paiement reçu de l'admin
  const handlePaymentConfirmation = async (confirmed) => {
    if (!confirmingInvoice) {
      message.error("Aucune facture sélectionnée");
      return;
    }

    try {
      // Mettre à jour le statut de la facture
      const newStatus = confirmed ? "Reçue" : "Rejetée";
      
      // Utiliser la méthode qui efface l'attachment lors du rejet pour permettre le re-upload
      const updateResponse = await InvoiceService.updateInvoiceStatusWithAttachmentReset(
        confirmingInvoice.id_facture,
        newStatus
      );

      if (updateResponse.success) {
        if (confirmed) {
          message.success(
            "Paiement confirmé ! La facture est maintenant marquée comme reçue."
          );
        } else {
          message.warning(
            "Paiement contesté. L'admin pourra maintenant télécharger un nouveau justificatif de paiement."
          );
        }

        // Actualiser la liste des factures
        await fetchInvoices();

        // Fermer le modal
        setConfirmModalVisible(false);
        setConfirmingInvoice(null);
      } else {
        throw new Error(
          updateResponse.message || "Erreur lors de la mise à jour"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      message.error("Erreur lors de la confirmation du paiement");
    }
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
          <Tag color={isNDF ? "orange" : "green"}>
            {isNDF ? "NDF" : "CRA"}
            {batchId && batchId !== "MITC" && batchId !== "NDF" && (
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
          {" "}
          <Tooltip title="Voir les détails">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showInvoiceDetail(record)}
            />
          </Tooltip>
          {/* Download PDF button - only for paid and received invoices */}
          {PDFService.isDownloadAllowed(record, "esn") && (
            <Tooltip title="Télécharger PDF">
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadInvoice(record)}
                style={{ color: "#52c41a", borderColor: "#52c41a" }}
              />
            </Tooltip>
          )}
          {/* Disabled download button for non-received payments */}
          {!PDFService.isDownloadAllowed(record, "esn") && (
            <Tooltip title="Téléchargement disponible après confirmation de réception">
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                disabled
                style={{ opacity: 0.5 }}
              />
            </Tooltip>
          )}
          {/* Accept/Refuse payment button for paid invoices */}
          {record.statut === "Payée" && record.attachment && (
            <Tooltip title="Confirmer/Refuse le paiement reçu">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => showConfirmModal(record)}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              />
            </Tooltip>
          )}
          {/* View payment attachment button */}
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
          {/* Payment received status indicator */}
          {record.statut === "Reçue" && (
            <Tooltip title="Paiement confirmé reçu">
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                disabled
                style={{ color: "#52c41a", borderColor: "#52c41a" }}
              />
            </Tooltip>
          )}
          {/* Payment contested status indicator */}
          {record.statut === "Rejetée" && (
            <Tooltip title="Paiement rejeté, en attente de nouveau justificatif">
              <Button
                type="default"
                size="small"
                icon={<CloseCircleOutlined />}
                disabled
                style={{ color: "#ff4d4f", borderColor: "#ff4d4f" }}
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
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
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
                  <Option value="Reçue">Reçue</Option>
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
                  <Option value="ESN_TO_MITC">CRA</Option>
                  <Option value="ESN_TO_MITC_NDF">NDF</Option>
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
            <Descriptions.Item label="Type">
              {selectedInvoice.type_facture === "ESN_TO_MITC"
                ? "Commission MITC"
                : "Facture Client"}
            </Descriptions.Item>
            <Descriptions.Item label="Peroide">
              {moment(selectedInvoice.peroide).format("DD/MM/YYYY")}
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
            </Descriptions.Item>
            <Descriptions.Item label="Statut" span={2}>
              <Tag
                color={
                  InvoiceService.getStatusTag(selectedInvoice.statut).color
                }
              >
                {InvoiceService.getStatusTag(selectedInvoice.statut).text}
              </Tag>
            </Descriptions.Item>{" "}
          </Descriptions>
        )}
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            <span>
              Confirmation de paiement - FAC-
              {String(confirmingInvoice?.id_facture || "").padStart(6, "0")}
            </span>
          </Space>
        }
        open={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          setConfirmingInvoice(null);
        }}
        footer={[
          <Button
            key="contest"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handlePaymentConfirmation(false)}
          >
            Refuse
          </Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handlePaymentConfirmation(true)}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Confirmer réception
          </Button>,
        ]}
        width={600}
      >
        {confirmingInvoice && (
          <div style={{ padding: "20px 0" }}>
            <Descriptions bordered column={1} style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Facture">
                <Text code>
                  FAC-{String(confirmingInvoice.id_facture).padStart(6, "0")}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="green">ESN</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Période">
                {confirmingInvoice.periode}
              </Descriptions.Item>
              <Descriptions.Item label="Montant">
                <Text strong style={{ color: "#1890ff" }}>
                  {formatAmount(confirmingInvoice.montant_ttc)} €
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Statut actuel">
                <Tag
                  color={
                    InvoiceService.getStatusTag(confirmingInvoice.statut).color
                  }
                >
                  {InvoiceService.getStatusTag(confirmingInvoice.statut).text}
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
                Justificatif de paiement de l'admin
              </Text>
              {confirmingInvoice.attachment && (
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={() => viewAttachment(confirmingInvoice.attachment)}
                  style={{ marginBottom: "15px" }}
                >
                  Consulter le justificatif
                </Button>
              )}
            </div>            <div
              style={{
                padding: "15px",
                backgroundColor: "#fff7e6",
                borderRadius: "6px",
              }}
            >
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <strong>Note:</strong> Cette action confirme que vous avez
                vérifié le paiement de votre commission par l'admin MITC. En cas
                de contestation, l'admin sera automatiquement autorisé à télécharger 
                un nouveau justificatif de paiement.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ESNInvoices;
