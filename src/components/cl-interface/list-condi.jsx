import React, { useState, useEffect } from "react";
import {
  Collapse,
  Card,
  Button,
  Modal,
  Descriptions,
  Tag,
  Typography,
  Table,
  message,
  Empty,
  Space,
  Spin,
  Row,
  Col,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";

const { Panel } = Collapse;
const { Text } = Typography;

const CandidatureInterface = () => {
  const [appelsOffre, setAppelsOffre] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      if (!clientId) {
        throw new Error("Client ID not found");
      }

      const appelsOffreRes = await fetch(
        `${Endponit()}/api/getAppelOffre/?clientId=${clientId}`
      );
      const appelsOffreData = await appelsOffreRes.json();
      setAppelsOffre(appelsOffreData.data);

      const candidatesPromises = appelsOffreData.data.map(async (offre) => {
        const candidatesRes = await fetch(
          `${Endponit()}/api/get-candidatures-by-project-and-client/?project_id=${
            offre.id
          }&client_id=${clientId}`
        );
        const candidatesData = await candidatesRes.json();
        return candidatesData.data || [];
      });

      const candidatesResults = await Promise.all(candidatesPromises);
      setCandidates(candidatesResults.flat());
    } catch (error) {
      message.error("Erreur lors du chargement des données");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createBonDeCommande = async (candidate) => {
    try {
      const selectedProject = appelsOffre.find(
        (ao) => ao.id === candidate.AO_id
      );
      if (!selectedProject) {
        throw new Error("Project not found");
      }

      // Calculate the duration in days between project start and end dates
      const startDate = new Date(selectedProject.date_debut);
      const endDate = new Date(selectedProject.date_limite);
      const workingDays =selectedProject.jours

      const bonDeCommandeData = {
        candidature_id: candidate.id_cd,
        numero_bdc: `BDC-${Date.now()}`,
        montant_total: candidate.tjm * workingDays,
        statut: "pending_esn",
        description: `Bon de commande pour ${selectedProject.titre} - Candidat: ${candidate.responsable_compte}
        Durée: ${workingDays} jours
        TJM: ${candidate.tjm}€`,
        TJM: candidate.tjm,
        date_debut: startDate,
        date_fin: endDate,
      };

      const response = await fetch(`${Endponit()}/api/Bondecommande/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bonDeCommandeData),
      });

      if (!response.ok) {
        throw new Error("Failed to create Bon de commande");
      }

      const bonDeCommandeResponse = await response.json();
      const clientId = localStorage.getItem("id");

      // Send notification for bon de commande
      const notificationResponse = await axios.post(
        `${Endponit()}/api/notify_bon_de_commande/`,
        {
          esn_id: candidate.esn_id,
          client_id: clientId,
          bon_de_commande_id: bonDeCommandeResponse.id,
        }
      );

      // if (notificationResponse.data.data) {
      //   try {
      //     await axios.post("http://http://51.38.99.75:3006/send-notification", {
      //       deviceToken: notificationResponse.data.data,
      //       messagePayload: {
      //         title: "Nouveau bon de commande",
      //         body: `Un bon de commande a été créé pour le projet ${selectedProject.titre}`,
      //       },
      //     });
      //   } catch (error) {
      //     console.error("Failed to send notification:", error);
      //   }
      // }

      return bonDeCommandeResponse;
    } catch (error) {
      console.error("Error creating bon de commande:", error);
      throw error;
    }
  };

  const getCandidateStats = (projectId) => {
    const projectCandidates = candidates.filter(
      (candidate) => candidate.AO_id === projectId
    );

    return {
      total: projectCandidates.length,
      accepted: projectCandidates.filter(
        (c) => c.statut.toLowerCase() === "accepté"
      ).length,
      rejected: projectCandidates.filter(
        (c) => c.statut.toLowerCase() === "refusé"
      ).length,
      pending: projectCandidates.filter(
        (c) => c.statut.toLowerCase() === "en cours"
      ).length,
    };
  };

  const checkIfProjectHasAcceptedCandidate = (projectId) => {
    return candidates.some(
      (candidate) =>
        candidate.AO_id === projectId &&
        candidate.statut.toLowerCase() === "accepté"
    );
  };

  const updateCandidatureStatus = async (candidate, newStatus) => {
    setActionLoading(true);
    try {
      if (newStatus.toLowerCase() === "accepté") {
        // if (checkIfProjectHasAcceptedCandidate(candidate.AO_id)) {
        //   message.error(
        //     "Ce projet a déjà un candidat accepté. Vous ne pouvez pas accepter plus d'un candidat par projet."
        //   );
        //   return;
        // }

        // Create Bon de commande when accepting a candidate
        try {
          const bonDeCommande = await createBonDeCommande(candidate);
          message.success("Bon de commande créé avec succès");
        } catch (error) {
          message.error("Erreur lors de la création du bon de commande");
          return;
        }
      }

      const response = await fetch(
        `${Endponit()}/api/update-candidature-status/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...candidate,
            statut: newStatus,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      if (newStatus.toLowerCase() === "accepté") {
        const otherCandidates = candidates.filter(
          (c) =>
            c.AO_id === candidate.AO_id &&
            c.id_cd !== candidate.id_cd &&
            c.statut.toLowerCase() === "en cours"
        );

        for (const otherCandidate of otherCandidates) {
          await fetch(`${Endponit()}/api/update-candidature-status/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...otherCandidate,
              statut: "Refusé",
            }),
          });
        }

        const token = await axios.post(
          `${Endponit()}/api/notify_candidature_accepted/`,
          {
            candidature_id: candidate.id_cd,
            esn_id: candidate.esn_id,
          }
        );

        if (token.data.data != null) {
          try {
            await axios.post("http://51.38.99.75:3006/send-notification", {
              deviceToken: token.data.data,
              messagePayload: {
                title: "Votre candidature a été acceptée.",
                body: "",
              },
            });
          } catch (error) {
            console.error(
              `Failed to send notification to token ${token}:`,
              error
            );
          }
        }
      }

      message.success(`Candidature ${newStatus.toLowerCase()}e avec succès`);
      await fetchData();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut");
      console.error("Error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      accepté: {
        color: "success",
        icon: <CheckCircleOutlined />,
      },
      refusé: {
        color: "error",
        icon: <CloseCircleOutlined />,
      },
      "en cours": {
        color: "processing",
        icon: <ClockCircleOutlined />,
      },
    };

    const config = statusConfig[status?.toLowerCase()] || {
      color: "default",
      icon: <ClockCircleOutlined />,
    };

    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Candidat",
      dataIndex: "responsable_compte",
      key: "nom",
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "TJM Proposé",
      dataIndex: "tjm",
      key: "tjm",
      render: (tjm) => (
        <Space>
          <DollarOutlined />
          {`${tjm} €`}
        </Space>
      ),
    },
    {
      title: "Date Candidature",
      dataIndex: "date_candidature",
      key: "dateCandidature",
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
    },
    {
      title: "Disponibilité",
      dataIndex: "date_disponibilite",
      key: "dateDisponibilite",
      render: (date) => (
        <Space>
          <ClockCircleOutlined />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (statut) => getStatusTag(statut),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const hasAcceptedCandidate = checkIfProjectHasAcceptedCandidate(
          record.AO_id
        );
        const isCurrentCandidateAccepted =
          record.statut.toLowerCase() === "accepté";

        return (
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => {
                setCurrentCandidate(record);
                setIsModalVisible(true);
              }}
            >
              Voir
            </Button>
            {record.statut.toLowerCase() === "en cours" && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => updateCandidatureStatus(record, "Accepté")}
                  disabled={actionLoading}
                >
                  Accepter
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => updateCandidatureStatus(record, "Refusé")}
                  disabled={actionLoading}
                >
                  Refuser
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  const renderCandidateDetails = () => (
    <Card>
      <Descriptions bordered column={1}>
        <Descriptions.Item
          label={
            <Space>
              <UserOutlined /> Nom complet
            </Space>
          }
        >
          {`${currentCandidate?.nom} ${currentCandidate?.prenom}`}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <DollarOutlined /> TJM Proposé
            </Space>
          }
        >
          {`${currentCandidate?.tjm} €`}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <CalendarOutlined /> Date de candidature
            </Space>
          }
        >
          {currentCandidate?.date_candidature &&
            new Date(currentCandidate.date_candidature).toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <ClockCircleOutlined /> Disponibilité
            </Space>
          }
        >
          {currentCandidate?.date_disponibilite &&
            new Date(currentCandidate.date_disponibilite).toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item label="Statut">
          {getStatusTag(currentCandidate?.statut)}
        </Descriptions.Item>
      </Descriptions>

      {currentCandidate?.statut.toLowerCase() === "en cours" && (
        <Row justify="end" style={{ marginTop: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() =>
                updateCandidatureStatus(currentCandidate, "Accepté")
              }
              disabled={actionLoading}
            >
              Accepter
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() =>
                updateCandidatureStatus(currentCandidate, "Refusé")
              }
              disabled={actionLoading}
            >
              Refuser
            </Button>
          </Space>
        </Row>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-2">
      <Collapse accordion className="mb-4">
        {appelsOffre.map((offre) => {
          const relatedCandidates = candidates.filter(
            (candidate) => candidate.AO_id === offre.id
          );
          const stats = getCandidateStats(offre.id);

          return (
            <Panel
              header={
                <Row justify="space-between" align="middle">
                  <Col flex="auto">
                    <div className="font-medium" style={{ margin: 0 }}>
                      {offre.titre}
                    </div>
                    <Text type="secondary">{offre.description}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Space size="middle">
                        <Badge count={stats.total} showZero>
                          <Tag>Total Candidats</Tag>
                        </Badge>
                        <Badge count={stats.accepted} showZero color="#52c41a">
                          <Tag color="success">Acceptés</Tag>
                        </Badge>
                        <Badge count={stats.rejected} showZero color="#f5222d">
                          <Tag color="error">Refusés</Tag>
                        </Badge>
                        <Badge count={stats.pending} showZero color="#1890ff">
                          <Tag color="processing">En Cours</Tag>
                        </Badge>
                      </Space>
                    </div>
                  </Col>
                  <Col>
                    <Space direction="vertical" align="end">
                      <Tag color="blue">{`TJM: ${offre.tjm_min} - ${offre.tjm_max} €`}</Tag>
                      <Tag color={offre.statut === "1" ? "green" : "red"}>
                        {offre.statut === "1" ? "Actif" : "Inactif"}
                      </Tag>
                    </Space>
                  </Col>
                </Row>
              }
              key={offre.id}
            >
              <Card>
                <Row gutter={[16, 16]} className="mb-4">
                  <Col span={12}>
                    <Text type="secondary">
                      <CalendarOutlined /> Date limite:{" "}
                      {new Date(offre.date_limite).toLocaleDateString()}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">
                      <CalendarOutlined /> Date début:{" "}
                      {new Date(offre.date_debut).toLocaleDateString()}
                    </Text>
                  </Col>
                </Row>

                {relatedCandidates.length > 0 ? (
                  <Table
                    dataSource={relatedCandidates}
                    columns={columns}
                    rowKey="id_cd"
                    pagination={{ pageSize: 5 }}
                  />
                ) : (
                  <Empty description="Aucun candidat pour cet appel d'offre" />
                )}
              </Card>
            </Panel>
          );
        })}
      </Collapse>

      <Modal
        title="Détails de la candidature"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentCandidate && renderCandidateDetails()}
      </Modal>
    </div>
  );
};

export default CandidatureInterface;
