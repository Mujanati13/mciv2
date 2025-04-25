import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Descriptions,
  Spin,
  Tag,
  Button,
  Row,
  Col,
  Divider,
  Space,
  message,
  Breadcrumb,
  Modal,
  Statistic,
  Alert,
  Form,
  DatePicker,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  LeftOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EuroOutlined,
  CheckOutlined,
  CloseOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { Link } from "react-router-dom";
import { Endponit } from "../../helper/enpoint";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Title, Paragraph, Text } = Typography;
const { confirm } = Modal;

const BonCommandeDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [bonCommande, setBonCommande] = useState(null);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [isContractModalVisible, setIsContractModalVisible] = useState(false);
  const [dates, setDates] = useState({
    date_debut: null,
    date_fin: null,
  });

  // Fetch bon de commande details
  useEffect(() => {
    const fetchBonCommande = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Endponit()}/api/bon-de-commande/${id}`);
        setBonCommande(response.data.data);
      } catch (error) {
        console.error("Error fetching bon de commande:", error);
        setError("Erreur lors du chargement des données");
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchBonCommande();
  }, [id]);

  // Helper function to get status tag with proper color and icon
  const getStatusTag = (status) => {
    const statusConfig = {
      pending_client: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En cours",
      },
      pending_admin: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En attente de validation par l'Administrateur",
      },
      pending_esn: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En attente de validation par l'ESN",
      },
      accepted_esn: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Soumis",
      },
      rejected_esn: {
        color: "error",
        icon: <CloseCircleOutlined />,
        text: "Refusé",
      },
    };
    const config = statusConfig[status] || statusConfig["pending_client"];

    return (
      <Tag icon={config.icon} color={config.color}>
        {config.text}
      </Tag>
    );
  };

  // Handle download PDF
  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Bon de Commande", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Numéro BDC: ${bonCommande.numero_bdc}`, 20, 40);
      doc.text(
        `Date de création: ${format(
          new Date(bonCommande.date_creation),
          "dd MMMM yyyy",
          { locale: fr }
        )}`,
        20,
        50
      );
      doc.text(`Montant total: ${bonCommande.montant_total.toFixed(2)} €`, 20, 60);
      doc.text(`Statut: ${bonCommande.statut}`, 20, 70);

      if (bonCommande.description) {
        doc.text("Description:", 20, 90);
        const splitDescription = doc.splitTextToSize(bonCommande.description, 170);
        doc.text(splitDescription, 20, 100);
      }

      doc.save(`BDC_${bonCommande.numero_bdc}.pdf`);
      message.success("Bon de commande téléchargé avec succès");
    } catch (error) {
      message.error("Échec du téléchargement du bon de commande");
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle accept bon de commande
  const handleAccept = async () => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/`, {
        ...bonCommande,
        statut: "pending_admin",
      });
      message.success("Bon de commande accepté avec succès");
      // Refresh data
      const response = await axios.get(`${Endponit()}/api/Bondecommande/${id}`);
      setBonCommande(response.data.data);
    } catch (error) {
      message.error("Échec de l'acceptation du bon de commande");
    }
  };

  // Handle reject bon de commande
  const handleReject = async () => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/`, {
        ...bonCommande,
        statut: "rejected_esn",
      });
      message.success("Bon de commande refusé");
      // Refresh data
      const response = await axios.get(`${Endponit()}/api/Bondecommande/${id}`);
      setBonCommande(response.data.data);
    } catch (error) {
      message.error("Échec du refus du bon de commande");
    }
  };

  // Show accept confirmation
  const showAcceptConfirm = () => {
    confirm({
      title: "Accepter le bon de commande",
      icon: <CheckCircleOutlined className="text-green-500" />,
      content: "Êtes-vous sûr de vouloir accepter ce bon de commande ?",
      okText: "Accepter",
      okType: "primary",
      cancelText: "Annuler",
      onOk() {
        handleAccept();
      },
    });
  };

  // Show reject confirmation
  const showRejectConfirm = () => {
    confirm({
      title: "Refuser le bon de commande",
      icon: <CloseCircleOutlined className="text-red-500" />,
      content: "Êtes-vous sûr de vouloir refuser ce bon de commande ?",
      okText: "Refuser",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        handleReject();
      },
    });
  };

  // Handle create contract
  const handleCreateContract = async () => {
    try {
      const formattedValues = {
        candidature_id: bonCommande?.candidature_id,
        date_signature: format(new Date(), "yyyy-MM-dd"),
        date_debut: dates.date_debut?.format("YYYY-MM-DD"),
        date_fin: dates.date_fin?.format("YYYY-MM-DD"),
        statut: "active",
        montant: bonCommande?.montant_total,
        numero_contrat: `CONTRAT_${bonCommande?.numero_bdc}`,
      };

      const response = await axios.post(
        `${Endponit()}/api/Contrat/`,
        formattedValues
      );

      if (response.data && response.data.id_contrat) {
        const clientId = localStorage.getItem("id");
        await axios.put(`${Endponit()}/api/Bondecommande/`, {
          ...bonCommande,
          has_contract: response.data.id_contrat,
        });

        await axios.post(`${Endponit()}/api/notify_signature_contrat/`, {
          client_id: clientId,
          esn_id: response.data.esn_id,
          contrat_id: response.data.id_contrat,
        });

        message.success("Contrat créé avec succès");
        setIsContractModalVisible(false);
        
        // Refresh data
        const updatedResponse = await axios.get(`${Endponit()}/api/Bondecommande/${id}`);
        setBonCommande(updatedResponse.data.data);
      }
    } catch (error) {
      message.error("Échec de la création du contrat");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <p>Chargement des détails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text type="danger">{error}</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <Link to="/dashboard">Dashboard</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/bons-commande">Bons de commande</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Détails</Breadcrumb.Item>
      </Breadcrumb>
      
      <Card className="shadow-sm">
        <Row justify="space-between" align="middle" style={{ marginBottom: "24px" }}>
          <Col>
            <Link to="/bons-commande">
              <Button icon={<LeftOutlined />}>
                Retour à la liste
              </Button>
            </Link>
          </Col>
          <Col>
            {getStatusTag(bonCommande?.statut)}
          </Col>
        </Row>

        <Title level={2}>
          <FileTextOutlined style={{ marginRight: "8px" }} />
          Bon de Commande: {bonCommande?.numero_bdc}
        </Title>

        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col span={8}>
            <Statistic
              title="Montant Total"
              value={bonCommande?.montant_total}
              precision={2}
              suffix="€"
              prefix={<EuroOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="TJM"
              value={bonCommande?.TJM}
              precision={2}
              suffix="€"
              prefix={<EuroOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Jours"
              value={bonCommande?.jours}
              suffix="jours"
              prefix={<CalendarOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
          <Descriptions.Item label="Date de création">
            <Space>
              <CalendarOutlined />
              {format(new Date(bonCommande?.date_creation), "dd/MM/yyyy", { locale: fr })}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Date de début">
            <Space>
              <CalendarOutlined />
              {format(new Date(bonCommande?.date_debut), "dd/MM/yyyy", { locale: fr })}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Date de fin">
            <Space>
              <CalendarOutlined />
              {format(new Date(bonCommande?.date_fin), "dd/MM/yyyy", { locale: fr })}
            </Space>
          </Descriptions.Item>
          
          {bonCommande?.has_contract && (
            <Descriptions.Item label="Contrat">
              <Tag color="green">Contrat créé</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider orientation="left">Description</Divider>
        <Paragraph>{bonCommande?.description}</Paragraph>

        <Divider />
        
        <Row justify="end" gutter={16}>
          <Col>
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={downloadLoading}
            >
              Télécharger PDF
            </Button>
          </Col>
          
          {bonCommande?.statut === "pending_client" && (
            <>
              <Col>
                <Button 
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={showAcceptConfirm}
                  style={{ backgroundColor: '#52c41a' }}
                >
                  Accepter
                </Button>
              </Col>
              <Col>
                <Button 
                  danger
                  icon={<CloseOutlined />}
                  onClick={showRejectConfirm}
                >
                  Refuser
                </Button>
              </Col>
            </>
          )}
          
          {bonCommande?.statut === "accepted_esn" && !bonCommande?.has_contract && (
            <Col>
              <Button 
                type="primary"
                icon={<FileAddOutlined />}
                onClick={() => setIsContractModalVisible(true)}
              >
                Créer un contrat
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Contract Creation Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Créer un contrat
          </Space>
        }
        visible={isContractModalVisible}
        onCancel={() => setIsContractModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsContractModalVisible(false)}>
            Annuler
          </Button>,
          <Button key="create" type="primary" onClick={handleCreateContract}>
            Créer le contrat
          </Button>,
        ]}
        width={700}
      >
        <Alert
          message="Création d'un contrat"
          description="Veuillez définir les dates de début et de fin du contrat."
          type="info"
          showIcon
          style={{ marginBottom: "20px" }}
        />

        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Date de début"
                name="date_debut"
                rules={[
                  { required: true, message: "Champ requis" },
                  {
                    validator: (_, value) => {
                      if (value && value.isBefore(moment().startOf("day"))) {
                        return Promise.reject("La date doit être dans le futur");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  onChange={(date) => setDates((prev) => ({ ...prev, date_debut: date }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Date de fin"
                name="date_fin"
                rules={[
                  { required: true, message: "Champ requis" },
                  {
                    validator: (_, value) => {
                      if (value && value.isBefore(moment().startOf("day"))) {
                        return Promise.reject("La date doit être dans le futur");
                      }
                      if (value && dates.date_debut && value.isBefore(dates.date_debut)) {
                        return Promise.reject("La date de fin doit être après la date de début");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  onChange={(date) => setDates((prev) => ({ ...prev, date_fin: date }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Descriptions bordered style={{ marginTop: "20px" }}>
            <Descriptions.Item label="Numéro BDC" span={3}>
              {bonCommande?.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Montant total" span={3}>
              <Text strong style={{ color: "#3f8600" }}>
                {bonCommande?.montant_total.toFixed(2)} €
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={3}>
              {bonCommande?.description}
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </Modal>
    </div>
  );
};

export default BonCommandeDetail;