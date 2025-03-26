import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Typography,
  Badge,
  Spin,
  message,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Descriptions,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SaveOutlined,
  FilePdfOutlined,
  EyeOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const DetailsModal = ({ bdc, visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (bdc?.id) {
      fetchDetails();
    }
  }, [bdc]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Endponit()}/api/get-combined-info/${bdc.id}`
      );
      setDetails(response.data.data);
    } catch (error) {
      console.error("Error fetching details:", error);
      message.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Non spécifié";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const calculateNetAmount = (montant, percentage) => {
    const reduction = (montant * percentage) / 100;
    return (montant - reduction).toFixed(2);
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          <span>Détails du BDC #{bdc?.numero_bdc}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin />
        </div>
      ) : (
        <div>
          <Descriptions title="Informations Financières" bordered column={2}>
            <Descriptions.Item label="Montant total brut">
              {details?.bon_commande?.montant_total}€
            </Descriptions.Item>
            <Descriptions.Item label="Pourcentage">
              {details?.bon_commande?.percentage || 0}%
            </Descriptions.Item>
            <Descriptions.Item label="Montant total net">
              {calculateNetAmount(
                details?.bon_commande?.montant_total,
                details?.bon_commande?.percentage || 0
              )}
              €
            </Descriptions.Item>
            <Descriptions.Item label="TJM">
              {details?.candidature?.tjm}€
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title="Informations du Bon de Commande"
            bordered
            column={2}
            style={{ marginTop: "20px" }}
          >
            <Descriptions.Item label="Numéro BDC">
              {details?.bon_commande?.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de création">
              {formatDate(details?.bon_commande?.date_creation)}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              {details?.bon_commande?.statut}
            </Descriptions.Item>
            <Descriptions.Item label="Contrat">
              {details?.bon_commande?.has_contract ? "Oui" : "Non"}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {details?.bon_commande?.description || "Aucune description"}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title="Informations ESN"
            bordered
            column={2}
            style={{ marginTop: "20px" }}
          >
            <Descriptions.Item label="Nom ESN">
              {details?.candidature?.nom_esn || "Non spécifié"}
            </Descriptions.Item>
            <Descriptions.Item label="Contact ESN">
              {details?.candidature?.contact_esn || "Non spécifié"}
            </Descriptions.Item>
            <Descriptions.Item label="Email ESN">
              {details?.candidature?.email_esn || "Non spécifié"}
            </Descriptions.Item>
            <Descriptions.Item label="Téléphone ESN">
              {details?.candidature?.telephone_esn || "Non spécifié"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  );
};

const UpdateBDCModal = ({ bdc, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [montantTotal, setMontantTotal] = useState(bdc?.montant_total || 0);
  const [percentage, setPercentage] = useState(bdc?.percentage || 0);

  const calculateNetAmount = (montant, perc) => {
    console.log("====================================");
    console.log(bdc?.montant_total, perc);
    console.log("====================================");
    const reduction = (bdc?.montant_total * perc) / 100;
    return bdc?.montant_total - reduction;
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const netAmount = calculateNetAmount(
        values.montant_total,
        values.percentage
      );
      const transformedValues = {
        ...bdc,
        ...values,
        id_bdc: bdc.id,
        benefit: bdc.montant_total - netAmount,
        montant_total: netAmount,
      };

      await axios.put(
        `${Endponit()}/api/Bondecommande/${bdc.id}`,
        transformedValues
      );
      message.success("Bon de commande mis à jour avec succès");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating BDC:", error);
      message.error("Erreur lors de la mise à jour du bon de commande");
    } finally {
      setLoading(false);
    }
  };

  const initialValues = bdc
    ? {
        ...bdc,
        date_emission: dayjs(bdc.date_emission),
        date_debut_mission: dayjs(bdc.date_debut_mission),
        date_fin_mission: dayjs(bdc.date_fin_mission),
        percentage: bdc.percentage || 0,
        statut: "pending_esn" // Set default status
      }
    : {};

  return (
    <Modal
      title={
        <Space>
          <ShoppingOutlined />
          <span>Validation du Bon de Commande #{bdc?.numero_bdc}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="numero_bdc"
              label="Numéro de BDC"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <Input prefix={<FileTextOutlined />} disabled={true} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="statut"
              
              label="Statut"
              initialValue={"pending_esn"}
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <Select defaultOpen="Accepté par Admin" defaultValue={"pending_esn"} placeholder="Sélectionner un statut">
                <Option value="pending_esn">Accepté par Admin</Option>
                <Option value="cancelled">Refusé par Admin</Option>
                <Option value="cancelled">Annulé</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="montant_total"
              label="Montant total brut"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <InputNumber
                prefix={<DollarOutlined />}
                style={{ width: "100%" }}
                onChange={(value) => setMontantTotal(value)}
                disabled
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="percentage"
              label="Pourcentage"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <InputNumber
                prefix={<PercentageOutlined />}
                style={{ width: "100%" }}
                min={0}
                max={100}
                onChange={(value) => setPercentage(value)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="benefit"
              label="Bénéfice"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <InputNumber
                prefix={<DollarOutlined />}
                style={{ width: "100%" }}
                min={0}
                onChange={(value) => {
                  const newPercentage = (value / montantTotal) * 100;
                  setPercentage(newPercentage);
                  form.setFieldsValue({ percentage: newPercentage });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Montant total net">
              <InputNumber
                prefix={<DollarOutlined />}
                style={{ width: "100%" }}
                value={calculateNetAmount(montantTotal, percentage)}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Commentaire</Divider>

        {/* <Form.Item
        name="esn_comment"
        label="Commentaire pour l'ESN"
      >
        <Input.TextArea 
          rows={4} 
          placeholder="Ajoutez un commentaire ou des instructions pour l'ESN..."
          showCount
          maxLength={500}
        />
      </Form.Item> */}

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Annuler</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Envoyer à l'ESN
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BDCManagement = () => {
  const [stats, setStats] = useState({
    totalBDCs: 0,
    activeBDCs: 0,
    pendingBDCs: 0,
    totalAmount: 0,
  });

  const [bdcs, setBDCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBDC, setSelectedBDC] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Endponit()}/api/Bondecommande`);
      const bdcsData = response.data.data || [];
      const filter = bdcsData.filter(
        (bdc) =>
          bdc.statut == "pending_admin" ||
          bdc.statut == "Actif" ||
          bdc.statut == "pending_esn"
      );
      const transformedBDCs = filter.map(transformBDC);
      setBDCs(transformedBDCs);
      const calculatedStats = calculateStats(bdcsData);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const transformBDC = (bdc) => ({
    ...bdc,
    id: bdc.id_bdc,
    numero_bdc: bdc.numero_bdc || `BDC-${bdc.id_bdc}`,
    date_emission: new Date(bdc.date_emission).toLocaleDateString("fr-FR"),
    date_debut_mission: new Date(bdc.date_debut_mission).toLocaleDateString(
      "fr-FR"
    ),
    date_fin_mission: new Date(bdc.date_fin_mission).toLocaleDateString(
      "fr-FR"
    ),
    montant_total: bdc.montant_total,
    montant_net: bdc.montant_net,
    percentage: bdc.percentage || 0,
    statut: bdc.statut,
    document_path: bdc.document_path,
  });

  const calculateStats = (bdcs) => ({
    totalBDCs: bdcs.length,
    activeBDCs: bdcs.filter((bdc) => bdc.statut === "active").length,
    pendingBDCs: bdcs.filter((bdc) => bdc.statut === "pending_esn").length,
    totalAmount: bdcs.reduce((sum, bdc) => sum + (bdc.montant_net || 0), 0),
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { status: "success", text: "Actif" },
      pending_esn: { status: "processing", text: "En attente ESN" },
      accepted_esn: { status: "processing", text: "Accepté par ESN" },
      rejected_esn: { status: "error", text: "Refusé par ESN" },
      pending_admin: { status: "default", text: "En attente validation admin" },
      cancelled: { status: "error", text: "Annulé" },
    };

    const config = statusConfig[status] || { status: "default", text: status };
    return <Badge status={config.status} text={config.text} />;
  };

  const columns = [
    {
      title: "N° BDC",
      dataIndex: "numero_bdc",
      key: "numero_bdc",
    },
    {
      title: "Montant brut",
      dataIndex: "montant_total",
      key: "montant_total",
      render: (value) => `${value}€`,
    },
    // {
    //   title: "Réduction",
    //   dataIndex: "percentage",
    //   key: "percentage",
    //   render: (value) => `${value}%`,
    // },
    // {
    //   title: "Montant net",
    //   dataIndex: "montant_net",
    //   key: "montant_net",
    //   render: (value) => `${value}€`,
    // },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Document",
      key: "document",
      render: (_, record) =>
        record.document_path ? (
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() =>
              window.open(
                `${Endponit()}/media/${record.document_path}`,
                "_blank"
              )
            }
          >
            Voir document
          </Button>
        ) : (
          <Tag icon={<WarningOutlined />} color="warning">
            Pas de document
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.statut === "pending_admin" && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedBDC(record);
                setUpdateModalVisible(true);
              }}
            >
              Modifier
            </Button>
          )}
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBDC(record);
              setDetailsModalVisible(true);
            }}
          >
            Détails
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: "16px" }}>
            Chargement des données...
          </Text>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total BDCs"
                  value={stats.totalBDCs}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="BDCs Actifs"
                  value={stats.activeBDCs}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="En Attente ESN"
                  value={stats.pendingBDCs}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Montant Total Net"
                  value={stats.totalAmount}
                  prefix={<DollarOutlined />}
                  precision={2}
                  suffix="€"
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>
                <Space>
                  <ShoppingOutlined />
                  Gestion des Bons de Commande
                </Space>
              </Title>
            </div>
            <Table
              columns={columns}
              dataSource={bdcs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} sur ${total} BDCs`,
              }}
            />
          </Card>

          <UpdateBDCModal
            bdc={selectedBDC}
            visible={updateModalVisible}
            onClose={() => {
              setUpdateModalVisible(false);
              setSelectedBDC(null);
            }}
            onSuccess={fetchData}
          />

          <DetailsModal
            bdc={selectedBDC}
            visible={detailsModalVisible}
            onClose={() => {
              setDetailsModalVisible(false);
              setSelectedBDC(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default BDCManagement;
