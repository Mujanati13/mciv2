import {
  Card,
  Button,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  Table,
  Badge,
  Tag,
  Descriptions,
  Collapse,
  Progress,
  List,
  message,
  Tabs,
  Upload,
  Modal,
  Spin,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UploadOutlined,
  ProjectOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileSearchOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  BarsOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedContract, setExpandedContract] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentContractId, setCurrentContractId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const transformContract = (contract) => ({
    id: contract.id_contrat,
    candidature_id: contract.candidature_id,
    esn_trace: contract.esn_trace,
    client_trace: contract.client_trace,
    status: getStatusMapping(contract.statut),
    projectDetails: {
      title: `Contrat ${contract.numero_contrat}`,
      startDate: new Date(contract.date_debut).toLocaleDateString("fr-FR"),
      endDate: new Date(contract.date_fin).toLocaleDateString("fr-FR"),
      duration: calculateDuration(contract.date_debut, contract.date_fin),
      budget: `${contract.montant.toLocaleString()} €`,
      location: "France",
      team: "Équipe projet",
    },
    esnSigned:
      contract.statut === "processing" || contract.statut === "Terminé",
    conditions: contract.conditions,
    deliverables: [
      {
        key: "1",
        item: "Début de mission",
        deadline: new Date(contract.date_debut).toLocaleDateString("fr-FR"),
        status: "En cours",
      },
      {
        key: "2",
        item: "Fin de mission",
        deadline: new Date(contract.date_fin).toLocaleDateString("fr-FR"),
        status: "En attente",
      },
    ],
    contractFile: contract.contract_file || null,
    numero_contrat: contract.numero_contrat,
    date_signature: contract.date_signature,
    date_debut: contract.date_debut,
    date_fin: contract.date_fin,
    montant: contract.montant,
    esn: contract.esn,
    client: contract.client,
  });

  const fetchContracts = async () => {
    try {
      const clientId = localStorage.getItem("id");
      if (!clientId) {
        throw new Error("Client ID not found");
      }

      const response = await axios.get(
        `${Endponit()}/api/contrat_by_idClient/?clientId=${clientId}`
      );

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response format");
      }

      const transformedContracts = response.data.data.map(transformContract);
      setContracts(transformedContracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      message.error("Erreur lors du chargement des contrats");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} jours`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "Durée indéterminée";
    }
  };

  const getStatusMapping = (apiStatus) => {
    const statusMap = {
      "En cours": "processing",
      Terminé: "success",
      "En attente": "pending",
    };
    return statusMap[apiStatus] || "default";
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "warning",
      processing: "processing",
      success: "success",
      default: "default",
    };
    return colorMap[status] || "default";
  };

  const getStatusText = (status) => {
    const textMap = {
      pending: "En attente",
      processing: "En cours",
      success: "Terminé",
    };
    return textMap[status] || status;
  };

  const handleUpload = async (file) => {
    if (file.type !== "application/pdf") {
      message.error("Veuillez télécharger uniquement des fichiers PDF");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      message.error("Le fichier ne doit pas dépasser 5MB");
      return false;
    }

    setUploadedFile(file);
    return false; // Prevent automatic upload
  };

  const handleSignature = (contractId) => {
    setCurrentContractId(contractId);
    setIsModalVisible(true);
  };

  const updateContractStatus = async (contractId, status, path) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    try {
      await axios.put(`${Endponit()}/api/Contrat/${contractId}`, {
        id_contrat: contractId,
        candidature_id: contract.candidature_id,
        date_signature: contract.date_signature,
        numero_contrat: contract.numero_contrat,
        date_debut: contract.date_debut,
        date_fin: contract.date_fin,
        montant: contract.montant,
        conditions: contract.conditions,
        esn: contract.esn,
        client: contract.client,
        statut: "processing",
        client_trace: path,
      });

      return true;
    } catch (error) {
      console.error("Error updating contract status:", error);
      return false;
    }
  };

  const handleSignatureSubmit = async () => {
    if (!uploadedFile) {
      message.error("Veuillez télécharger le contrat signé");
      return;
    }

    setSignatureLoading(true);

    try {
      const formData = new FormData();
      formData.append("uploadedFile", uploadedFile);
      formData.append("path", "./upload/");
      formData.append("contract_id", currentContractId);

      const path = await axios.post(`${Endponit()}/api/saveDoc/`, formData);

      const statusUpdated = await updateContractStatus(
        currentContractId,
        "processing",
        path.data.path
      );

      if (!statusUpdated) {
        throw new Error("Failed to update contract status");
      }

      // Update local state
      setContracts((prevContracts) =>
        prevContracts.map((contract) =>
          contract.id === currentContractId
            ? {
                ...contract,
                esnSigned: true,
                status: "processing",
                contractFile: uploadedFile.name,
              }
            : contract
        )
      );

      message.success("Contrat signé téléchargé avec succès");
      setIsModalVisible(false);
      setUploadedFile(null);
    } catch (error) {
      console.error("Error uploading signed contract:", error);
      message.error("Erreur lors du téléchargement du contrat signé");
    } finally {
      setSignatureLoading(false);
    }
  };

  const renderExpandedContent = (contract) => (
    <div style={{ padding: "0 24px" }}>
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <ProjectOutlined />
              Détails du Projet
            </span>
          }
          key="1"
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item
              label={
                <>
                  <ProjectOutlined /> Projet
                </>
              }
            >
              {contract.projectDetails.title}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <CalendarOutlined /> Date de début
                </>
              }
            >
              {contract.projectDetails.startDate}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <ClockCircleOutlined /> Durée
                </>
              }
            >
              {contract.projectDetails.duration}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <DollarOutlined /> Budget
                </>
              }
            >
              {contract.projectDetails.budget}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <EnvironmentOutlined /> Localisation
                </>
              }
            >
              {contract.projectDetails.location}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <TeamOutlined /> Équipe
                </>
              }
            >
              {contract.projectDetails.team}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={4}>
            <BarsOutlined /> Livrables
          </Title>
          <Table
            dataSource={contract.deliverables}
            columns={[
              {
                title: "Livrable",
                dataIndex: "item",
                key: "item",
              },
              {
                title: "Date limite",
                dataIndex: "deadline",
                key: "deadline",
                render: (text) => (
                  <Tag icon={<CalendarOutlined />} color="blue">
                    {text}
                  </Tag>
                ),
              },
              {
                title: "Statut",
                dataIndex: "status",
                key: "status",
                render: (status) => <Badge status="processing" text={status} />,
              },
            ]}
            pagination={false}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileSearchOutlined />
              Conditions
            </span>
          }
          key="2"
        >
          <Collapse defaultActiveKey={["1"]}>
            <Panel header="Conditions Générales" key="1">
              <Paragraph>{contract.conditions}</Paragraph>
            </Panel>
          </Collapse>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CheckCircleOutlined />
              Signatures
            </span>
          }
          key="3"
        >
          <Card type="inner" title="Signature Client">
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical">
                  <Text strong>Représentant le Client</Text>
                  <Text type="secondary">Autorité signataire désignée</Text>
                  {contract.client_trace && (
                    <div>
                      <Tag icon={<FilePdfOutlined />} color="success">
                        Contrat signé disponible
                      </Tag>
                      <a
                        target="_blank"
                        href={Endponit() + "/media/" + contract.client_trace}
                      >
                        Télécharger
                      </a>
                    </div>
                  )}
                </Space>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={
                    contract.client_trace ? (
                      <CheckCircleOutlined />
                    ) : (
                      <UploadOutlined />
                    )
                  }
                  onClick={() => handleSignature(contract.id)}
                  disabled={contract.client_trace}
                  size="large"
                >
                  {contract.client_trace ? "Signé" : "Signer"}
                </Button>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );

  return (
    <div>
      <List
        loading={loading}
        dataSource={contracts}
        renderItem={(contract) => (
          <Card style={{ marginBottom: 16, borderRadius: 8 }} key={contract.id}>
            <Row justify="space-between" align="middle">
              <Col span={8}>
                <Space direction="vertical">
                  <Title level={4} style={{ margin: 0 }}>
                    {contract.projectDetails.title}
                  </Title>
                  <Space>
                    <Tag icon={<CalendarOutlined />} color="blue">
                      Début: {contract.projectDetails.startDate}
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />} color="cyan">
                      {contract.projectDetails.duration}
                    </Tag>
                  </Space>
                </Space>
              </Col>
              <Col span={8} style={{ textAlign: "center" }}>
                <Space direction="vertical">
                  <Badge
                    status={getStatusColor((contract?.esn_trace && contract?.client_trace) ? true : false)}
                    text={getStatusText(
                      contract?.esn_trace && contract?.client_trace
                        ? "Complété"
                        : "En cours"
                    )}
                  />
                  <Progress
                    percent={
                      contract?.esn_trace && contract?.client_trace
                        ? 100
                        : contract?.esn_trace
                        ? 50
                        : 0
                    }
                    size="large"
                    status={
                      contract.esn_trace & contract.client_trace
                        ? "success"
                        : "active"
                    }
                  />
                </Space>
              </Col>
              <Col span={8} style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    setExpandedContract(
                      expandedContract === contract.id ? null : contract.id
                    )
                  }
                >
                  {expandedContract === contract.id
                    ? "Masquer"
                    : "Voir détails"}
                </Button>
              </Col>
            </Row>
            {expandedContract === contract.id && (
              <div style={{ marginTop: 24 }}>
                {renderExpandedContent(contract)}
              </div>
            )}
          </Card>
        )}
      />

      <Modal
        title="Télécharger le contrat signé"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setUploadedFile(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setUploadedFile(null);
            }}
          >
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={signatureLoading}
            onClick={handleSignatureSubmit}
            disabled={!uploadedFile}
          >
            Confirmer
          </Button>,
        ]}
      >
        <Upload
          beforeUpload={handleUpload}
          accept=".pdf"
          maxCount={1}
          showUploadList={true}
        >
          <Button icon={<UploadOutlined />}>Sélectionner le PDF</Button>
        </Upload>
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          Veuillez télécharger le contrat signé au format PDF
        </Text>
      </Modal>

      {/* Error Handling Modal */}
      <Modal
        title="Erreur"
        open={!!error}
        onOk={() => setError(null)}
        onCancel={() => setError(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setError(null)}>
            OK
          </Button>,
        ]}
      >
        <Text type="danger">{error}</Text>
      </Modal>

      {/* Success Modal */}
      <Modal
        title="Succès"
        open={!!successMessage}
        onOk={() => setSuccessMessage(null)}
        onCancel={() => setSuccessMessage(null)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setSuccessMessage(null)}
          >
            OK
          </Button>,
        ]}
      >
        <Text type="success">{successMessage}</Text>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text>Chargement des contrats...</Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default ContractList;
