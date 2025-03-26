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
  Empty,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ProjectOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  EyeOutlined,
  WarningOutlined,
  DollarOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const UpdateContractModal = ({ contract, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      const transformedValues = {
        ...contract,
      };

      await axios.put(`${Endponit()}/api/Contrat/${contract.id_contrat}`, {
        ...transformedValues,
        id_contrat: contract.id_contrat,
      });

      message.success("Contrat mis à jour avec succès");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating contract:", error);
      message.error("Erreur lors de la mise à jour du contrat");
    } finally {
      setLoading(false);
    }
  };

  const initialValues = contract
    ? {
        ...contract,
        date_signature: dayjs(contract.signatureDate, "DD/MM/YYYY"),
        date_debut: dayjs(contract.startDate, "DD/MM/YYYY"),
        date_fin: dayjs(contract.endDate, "DD/MM/YYYY"),
        montant: contract.amount,
        statut: contract.status,
        numero_contrat: contract.number,
      }
    : {};

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Modifier le Contrat {contract?.number}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        {/* <Form.Item
          name="numero_contrat"
          label="Numéro de Contrat"
          rules={[{ required: true, message: "Champ requis" }]}
        >
          <Input disabled={true}  prefix={<FileTextOutlined />} placeholder="CONTRAT-XXX" />
        </Form.Item> */}
        {/* 
        <Form.Item
          name="date_signature"
          label="Date de Signature"
          rules={[{ required: true, message: "Champ requis" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            prefix={<CalendarOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="date_debut"
          label="Date de Début"
          rules={[{ required: true, message: "Champ requis" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            prefix={<CalendarOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="date_fin"
          label="Date de Fin"
          rules={[{ required: true, message: "Champ requis" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            prefix={<CalendarOutlined />}
          />
        </Form.Item> */}

        {/* <Form.Item
          name="montant"
          label="Montant"
          rules={[{ required: true, message: "Champ requis" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            prefix={<DollarOutlined />}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item> */}

        <Form.Item
          name="statut"
          label="Statut"
          rules={[{ required: true, message: "Champ requis" }]}
        >
          <Select>
            <Option value="active">Actif</Option>
            <Option value="processing">En cours</Option>
            <Option value="pending">En attente</Option>
            <Option value="completed">Terminé</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Annuler</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Sauvegarder
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ContractStats = () => {
  const [stats, setStats] = useState({
    totalContracts: 0,
    pendingValidation: 0,
    activeContracts: 0,
    processingContracts: 0,
    totalAmount: 0,
  });

  const [contracts, setContracts] = useState([]);
  const [contractsW, setContractsW] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedContractForUpdate, setSelectedContractForUpdate] =
    useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      //   setLoading(true);
      const response = await axios.get(`${Endponit()}/api/Contrat`);
      const contractsData = response.data.data || [];
      setContractsW(contractsData);
      const transformedContracts = contractsData.map(transformContract);
      setContracts(transformedContracts);

      const calculatedStats = calculateStats(contractsData);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const transformContract = (contract) => ({
    id: contract.id_contrat,
    number: contract.numero_contrat || `CONTRAT-${contract.id_contrat}`,
    candidatureId: contract.candidature_id,
    signatureDate: new Date(contract.date_signature).toLocaleDateString(
      "fr-FR"
    ),
    startDate: new Date(contract.date_debut).toLocaleDateString("fr-FR"),
    endDate: new Date(contract.date_fin).toLocaleDateString("fr-FR"),
    amount: contract.montant,
    status: contract.statut,
    clientDocument: contract.client_trace,
    esnDocument: contract.esn_trace,
    conditions: contract.conditions,
  });

  const calculateStats = (contracts) => {
    const stats = {
      totalContracts: contracts.length,
      pendingValidation: 0,
      activeContracts: 0,
      processingContracts: 0,
      totalAmount: 0,
    };

    contracts.forEach((contract) => {
      stats.totalAmount += contract.montant || 0;

      if (!contract.client_trace || !contract.esn_trace) {
        stats.pendingValidation++;
      }

      if (contract.statut == "active") {
        stats.activeContracts++;
      } else if (contract.statut == "processing") {
        stats.processingContracts++;
      } else {
        stats.pendingValidation++;
      }
    });

    return stats;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { status: "success", text: "Actif" },
      processing: { status: "processing", text: "En cours" },
      pending: { status: "warning", text: "En attente" },
      completed: { status: "default", text: "Terminé" },
    };

    const config = statusConfig[status] || { status: "default", text: status };
    return <Badge status={config.status} text={config.text} />;
  };

  const calculateDuration = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} jours`;
    } catch (error) {
      return "Durée indéterminée";
    }
  };

  const getDocumentStatus = (clientDoc, esnDoc) => {
    if (clientDoc && esnDoc) {
      return <Tag color="success">Documents complets</Tag>;
    } else if (!clientDoc && !esnDoc) {
      return <Tag color="error">Aucun document</Tag>;
    } else {
      return <Tag color="warning">Documents partiels</Tag>;
    }
  };

  const columns = [
    {
      title: "N° Contrat",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Date signature",
      dataIndex: "signatureDate",
      key: "signatureDate",
      render: (date) => (
        <Tag icon={<CalendarOutlined />} color="blue">
          {date}
        </Tag>
      ),
    },
    {
      title: "Date début",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => (
        <Tag icon={<CalendarOutlined />} color="green">
          {date}
        </Tag>
      ),
    },
    {
      title: "Durée",
      key: "duration",
      render: (_, record) => (
        <Tag icon={<ClockCircleOutlined />} color="cyan">
          {calculateDuration(record.startDate, record.endDate)}
        </Tag>
      ),
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <Tag color="purple">
          {amount?.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </Tag>
      ),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Documents",
      key: "documents",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {getDocumentStatus(record.clientDocument, record.esnDocument)}
          {!record.clientDocument && !record.esnDocument ? (
            ""
          ) : (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedContract(record);
                setDocumentModalVisible(true);
              }}
            >
              Voir documents
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            const con = contractsW.find(
              (contract) => contract.id_contrat === record.id
            );
            console.log('====================================');
            console.log(con);
            console.log('====================================');
            setSelectedContractForUpdate(con);
            setUpdateModalVisible(true);
          }}
        >
          Modifier
        </Button>
      ),
    },
  ];

  const renderDocumentSection = (title, document, type) => {
    if (!document) {
      return (
        <Card
          title={title}
          className="mb-4"
          extra={<WarningOutlined style={{ color: "#faad14" }} />}
        >
          <Empty
            description={`Aucun document ${type} n'a été téléchargé`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      );
    }

    return (
      <Card title={title} className="mb-4">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>Nom du fichier: </Text>
            <Text>{document.split("/").pop()}</Text>
          </div>
          <Space>
            <FilePdfOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
            <a
              href={`${Endponit()}/media/${document}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ant-btn ant-btn-link"
            >
              Voir le document
            </a>
          </Space>
        </Space>
      </Card>
    );
  };

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: "16px" }}>
            Chargement des statistiques...
          </Text>
        </div>
      ) : (
        <>
          <Row className="mt-5" gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Contrats"
                  value={stats.totalContracts}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="En Attente de Documents"
                  value={stats.pendingValidation}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Contrats Actifs"
                  value={stats.activeContracts}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Montant Total"
                  value={stats.totalAmount}
                  prefix="€"
                  precision={2}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
          </Row>
          <Card style={{ marginTop: 16 }}>
            <Table columns={columns} dataSource={contracts} rowKey="id" />
          </Card>

          <Modal
            title={
              <Space>
                <FileTextOutlined />
                <span>Documents du Contrat {selectedContract?.number}</span>
              </Space>
            }
            open={documentModalVisible}
            onCancel={() => setDocumentModalVisible(false)}
            footer={null}
            width={800}
          >
            {selectedContract && (
              <div>
                {renderDocumentSection(
                  "Document Client",
                  selectedContract.clientDocument,
                  "client"
                )}
                {renderDocumentSection(
                  "Document ESN",
                  selectedContract.esnDocument,
                  "ESN"
                )}
              </div>
            )}
          </Modal>

          <UpdateContractModal
            contract={selectedContractForUpdate}
            visible={updateModalVisible}
            onClose={() => {
              setUpdateModalVisible(false);
              setSelectedContractForUpdate(null);
            }}
            onSuccess={fetchData}
          />
        </>
      )}
    </div>
  );
};

export default ContractStats;
