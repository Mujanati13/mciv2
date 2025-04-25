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
  FilePdfOutlined,
  InfoCircleOutlined,
  FileTextOutlined 
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
  // État pour stocker la correspondance entre candidatures et BDC
  const [candidatureBdcMapping, setCandidatureBdcMapping] = useState({});

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
      
      // Charger les bons de commande existants pour les candidatures
      await loadBonDeCommandeMapping(clientId);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger la correspondance entre candidatures et bons de commande
  const loadBonDeCommandeMapping = async (clientId) => {
    try {
      const response = await axios.get(
        `${Endponit()}/api/get_bon_de_commande_by_client/?client_id=${clientId}`
      );
      
      const mapping = {};
      if (response.data && response.data.data) {
        response.data.data.forEach(bdc => {
          if (bdc.candidature_id) {
            mapping[bdc.candidature_id] = bdc.id_bdc;
          }
        });
      }
      
      setCandidatureBdcMapping(mapping);
    } catch (error) {
      console.error("Erreur lors du chargement des bons de commande:", error);
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
      const workingDays = selectedProject.jours;

      // Récupérer les informations du consultant pour la description
      const collaboratorResponse = await axios.get(
        `${Endponit()}/api/get_collaborateur_by_id/${candidate.id_consultant}`
      );
      const collaborator = collaboratorResponse.data.data;

      // Créer une description détaillée
      const defaultDescription = `${collaborator.Poste || "Consultant"} - ${collaborator.Nom || ""} ${collaborator.Prenom || ""}
Experience professionnelle: ${collaborator.date_debut_activ ? new Date().getFullYear() - new Date(collaborator.date_debut_activ).getFullYear() : "N/A"} ans
Mobilité: ${collaborator.Mobilité || "Non spécifiée"}

${selectedProject.titre} - Candidat: ${candidate.responsable_compte}
Durée: ${workingDays} jours
TJM: ${candidate.tjm}€`;

      const bonDeCommandeData = {
        candidature_id: candidate.id_cd,
        numero_bdc: `BDC-${Date.now()}`,
        client_id: localStorage.getItem("id"),
        montant_total: candidate.tjm * workingDays,
        statut: "pending_client",
        description: defaultDescription,
        TJM: candidate.tjm,
        jours: workingDays,
        date_creation: new Date().toISOString().split('T')[0],
        date_debut: startDate.toISOString().split('T')[0],
        date_fin: endDate.toISOString().split('T')[0],
      };

      const response = await axios.post(`${Endponit()}/api/Bondecommande/`, bonDeCommandeData);

      if (response.data) {
        // Mettre à jour le mapping
        setCandidatureBdcMapping(prev => ({
          ...prev,
          [candidate.id_cd]: response.data.id
        }));

        // Envoyer une notification
        try {
        setTimeout( async() => {
          const clientId = localStorage.getItem("id");
          const restd = await axios.post(`${Endponit()}/api/notify_bon_de_commande/`, {
            esn_id: candidate.esn_id,
            client_id: clientId,
            bon_de_commande_id: response.data.id,
          });

          if (restd.data.client_token != null) {
            try {
                await axios.post("http://51.38.99.75:3006/send-notification", {
                deviceToken: restd.data.client_token,
                messagePayload: {
                  title: "Un bon de commande a été généré.",
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
        }, 2000);

        } catch (notifyError) {
          console.error("Erreur lors de l'envoi de la notification:", notifyError);
        }

        return response.data;
      }
      throw new Error("Réponse invalide lors de la création du bon de commande");
    } catch (error) {
      console.error("Error creating bon de commande:", error);
      throw error;
    }
  };

  // Fonction pour naviguer vers un bon de commande
  const navigateToBDC = (bdcId) => {
    // Redirection vers la page des bons de commande avec l'ID du BDC à afficher
    window.location.href = `/bdc-list?id=${bdcId}`;
    
    // Alternativement, si vous utilisez react-router:
    // history.push(`/bdc-list?id=${bdcId}`);
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
        // Create Bon de commande when accepting a candidate
        try {
          const bonDeCommande = await createBonDeCommande(candidate);
          message.success("Candidature acceptée et bon de commande créé");
          
          // Afficher une confirmation avec option pour aller au BDC
            Modal.confirm({
            title: "Bon de commande créé avec succès",
            content: "Souhaitez-vous consulter le bon de commande maintenant ?",
            okText: "Oui, voir le bon de commande",
            cancelText: "Non, plus tard",
            onOk: () => {
              // navigateToBDC(bonDeCommande.id_bdc);
            },
            okButtonProps: { disabled: true }, // Disable the "Oui, voir le bon de commande" button
            });
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

      // Ne pas afficher ce message si on vient d'accepter (car on a déjà montré un message)
      if (newStatus.toLowerCase() !== "accepté") {
        message.success(`Candidature ${newStatus.toLowerCase()}e avec succès`);
      }
      
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
      title: "Responsable de compte",
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
    // Fix for CV column in the table
    {
      title: "CV",
      key: "cv",
      render: (_, record) => {
        // Check if collaborateur exists and has a CV
        const hasCV = record.collaborateur && record.collaborateur.CV;

        return (
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => {
              if (hasCV) {
                window.open(
                  Endponit() + "/media/" + record.collaborateur.CV,
                  "_blank"
                );
              } else {
                message.info("Aucun CV disponible pour ce candidat");
              }
            }}
            disabled={!hasCV}
          >
            {hasCV ? "Voir CV" : "Pas de CV"}
          </Button>
        );
      },
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
        const isCurrentCandidateAccepted = record.statut.toLowerCase() === "accepté";
        const hasBDC = candidatureBdcMapping[record.id_cd];

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
            
            {isCurrentCandidateAccepted && hasBDC && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => navigateToBDC(candidatureBdcMapping[record.id_cd])}
                className="bg-green-600"
                disabled={true}
              >
                Aller au BDC
              </Button>
            )}
            
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

  const renderCandidateDetails = () => {
    const hasCV =
      currentCandidate?.collaborateur && currentCandidate?.collaborateur.CV;
    const collaborateur = currentCandidate?.collaborateur || {};
    const isAccepted = currentCandidate?.statut.toLowerCase() === "accepté";
    const hasBDC = candidatureBdcMapping[currentCandidate?.id_cd];

    // Find the associated project for this candidate
    const associatedProject = appelsOffre.find(
      (offre) => offre.id === currentCandidate?.AO_id
    );

    return (
      <Card>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card
              type="inner"
              title={
                <Space>
                  <UserOutlined
                    style={{ fontSize: "18px", color: "#1890ff" }}
                  />
                  Informations du candidat
                </Space>
              }
              style={{ marginBottom: "20px" }}
            >
              <Descriptions
                bordered
                column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              >
                <Descriptions.Item label={<strong>Nom complet</strong>}>
                  {`${currentCandidate?.nom_cn || ""}`}
                </Descriptions.Item>

                <Descriptions.Item label={<strong>Poste</strong>}>
                  {collaborateur.Poste || "Non spécifié"}
                </Descriptions.Item>

                <Descriptions.Item
                  label={<strong>Statut de la candidature</strong>}
                >
                  {getStatusTag(currentCandidate?.statut)}
                </Descriptions.Item>

                <Descriptions.Item label={<strong>TJM Proposé</strong>}>
                  <Tag color="blue" style={{ fontSize: "14px" }}>
                    <DollarOutlined /> {`${currentCandidate?.tjm} €`}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item
                  label={<strong>Responsable de compte</strong>}
                >
                  {currentCandidate?.responsable_compte || "Non spécifié"}
                </Descriptions.Item>

                <Descriptions.Item label={<strong>Date de candidature</strong>}>
                  <CalendarOutlined />{" "}
                  {currentCandidate?.date_candidature &&
                    new Date(
                      currentCandidate.date_candidature
                    ).toLocaleDateString()}
                </Descriptions.Item>

                <Descriptions.Item label={<strong>Disponibilité</strong>}>
                  <ClockCircleOutlined />{" "}
                  {currentCandidate?.date_disponibilite &&
                    new Date(
                      currentCandidate.date_disponibilite
                    ).toLocaleDateString()}
                </Descriptions.Item>

                <Descriptions.Item label={<strong>Mobilité</strong>}>
                  {collaborateur.Mobilité || "Non spécifiée"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {associatedProject && (
            <Col span={24}>
              <Card
                type="inner"
                title={
                  <Space>
                    <FilePdfOutlined
                      style={{ fontSize: "18px", color: "#1890ff" }}
                    />
                    Projet associé
                  </Space>
                }
                style={{ marginBottom: "20px" }}
              >
                <Descriptions bordered column={1}>
                  <Descriptions.Item label={<strong>Titre</strong>}>
                    {associatedProject.titre}
                  </Descriptions.Item>

                  <Descriptions.Item label={<strong>Description</strong>}>
                    {associatedProject.description}
                  </Descriptions.Item>

                  <Descriptions.Item label={<strong>Fourchette TJM</strong>}>
                    <Tag color="blue">{`${associatedProject.tjm_min} - ${associatedProject.tjm_max} €`}</Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label={<strong>Période</strong>}>
                    <Space>
                      <span>
                        Du{" "}
                        {new Date(
                          associatedProject.date_debut
                        ).toLocaleDateString()}
                      </span>
                      <span>
                        au{" "}
                        {new Date(
                          associatedProject.date_limite
                        ).toLocaleDateString()}
                      </span>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          )}

          <Col span={24}>
            <Row gutter={[16, 16]}>
              {hasCV && (
                <Col span={12}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        <FilePdfOutlined
                          style={{ fontSize: "18px", color: "#1890ff" }}
                        />
                        CV du candidat
                      </Space>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "20px",
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        size="large"
                        onClick={() => {
                          window.open(
                            Endponit() +
                              "/media/" +
                              currentCandidate.collaborateur.CV,
                            "_blank"
                          );
                        }}
                      >
                        Voir le CV
                      </Button>
                    </div>
                  </Card>
                </Col>
              )}

              {currentCandidate?.commentaire && (
                <Col span={hasCV ? 12 : 24}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        <InfoCircleOutlined
                          style={{ fontSize: "18px", color: "#1890ff" }}
                        />
                        Commentaire
                      </Space>
                    }
                  >
                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        minHeight: "100px",
                      }}
                    >
                      {currentCandidate.commentaire}
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </Col>
        </Row>

        {currentCandidate?.statut.toLowerCase() === "en cours" && (
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() =>
                  updateCandidatureStatus(currentCandidate, "Accepté")
                }
                disabled={actionLoading}
              >
                Accepter cette candidature
              </Button>
              <Button
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() =>
                  updateCandidatureStatus(currentCandidate, "Refusé")
                }
                disabled={actionLoading}
              >
                Refuser
              </Button>
            </Space>
          </div>
        )}

        {isAccepted && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Space direction="vertical" size="large">
              <Tag
                color="success"
                icon={<CheckCircleOutlined />}
                style={{ fontSize: "16px", padding: "8px 15px" }}
              >
                Cette candidature a été acceptée
              </Tag>
              
              {hasBDC && (
                <Button
                  type="primary"
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={() => navigateToBDC(candidatureBdcMapping[currentCandidate.id_cd])}
                >
                  Voir le bon de commande associé
                </Button>
              )}
            </Space>
          </div>
        )}

        {currentCandidate?.statut.toLowerCase() === "refusé" && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Tag
              color="error"
              icon={<CloseCircleOutlined />}
              style={{ fontSize: "16px", padding: "8px 15px" }}
            >
              Cette candidature a été refusée
            </Tag>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Le reste du code reste inchangé */}
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