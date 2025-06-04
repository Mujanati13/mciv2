import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Typography,
  Dropdown,
  message,
  Spin,
  Breadcrumb,
  Card,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Modal,
  Progress,
  Tabs,
  Badge,
  Timeline,
  Input,
  Select,
  DatePicker,
  Empty,
  Tooltip,
  Divider,
  Alert,
  Table,
  Space,
  // Comment,
  Form,
  Result,
  Upload,
  InputNumber,
} from "antd";
import {
  UserOutlined,
  DashboardOutlined,
  BellOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SearchOutlined,
  FileAddOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlusOutlined,
  PaperClipOutlined,
  CloudUploadOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  ProjectOutlined,
  ArrowLeftOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  useNavigate,
  Routes,
  Route,
  Link as RouterLink,
  useParams,
  useLocation,
} from "react-router-dom";
import { Endponit as Endpoint } from "../helper/enpoint";
import {
  isConsultantLoggedIn,
  isUnifiedConsultantLoggedIn,
  getAuthToken,
  getUserId,
  logoutConsultant,
} from "../helper/db";
import MonthlyActivityReport from "../components/consultant-interface/MonthlyActivityReport";
import ExpenseReports from "../components/consultant-interface/ExpenseReports";

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Dashboard component - will be the default view
const Dashboard = ({ consultantData, dashboardData }) => {
  const [loading, setLoading] = useState(false);

  // Get current date
  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "processing";
      case "En attente":
        return "warning";
      case "Terminé":
        return "success";
      case "Bloqué":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Élevé":
        return "#f5222d";
      case "Moyen":
        return "#faad14";
      case "Faible":
        return "#52c41a";
      default:
        return "#1890ff";
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      {/* Welcome banner */}
      <Card
        className="welcome-card"
        style={{
          marginBottom: 24,
          borderRadius: 8,
          background: "linear-gradient(to right, #1890ff, #096dd9)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ color: "white", marginBottom: 4 }}>
              Bonjour, {consultantData?.Nom || "Consultant"}!
            </Title>
            <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 16 }}>
              {currentDate} · Bienvenue dans votre espace consultant
            </Text>
            <Paragraph
              style={{ color: "rgba(255, 255, 255, 0.85)", marginTop: 8 }}
            >
              Vous avez {dashboardData?.stats?.unreadNotifications || 0}{" "}
              notification
              {dashboardData?.stats?.unreadNotifications !== 1 ? "s" : ""} non
              lue
              {dashboardData?.stats?.unreadNotifications !== 1 ? "s" : ""}
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Recent notifications */}
      <Card title="Notifications récentes" style={{ marginBottom: 24 }}>
        {dashboardData?.notifications?.length > 0 ? (
          <List
            dataSource={dashboardData.notifications.slice(0, 5)}
            renderItem={(notification) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Badge dot={notification.status === "Not_read"}>
                      <Avatar
                        icon={<BellOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                      />
                    </Badge>
                  }
                  title={notification.message}
                  description={
                    <div>
                      <Text type="secondary">
                        {new Date(notification.created_at).toLocaleString()}
                      </Text>
                      {notification.event && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {notification.event}
                        </Tag>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Aucune notification" />
        )}
        {dashboardData?.notifications?.length > 5 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <RouterLink to="/interface-consultant/notifications">
              <Button type="primary">Voir toutes les notifications</Button>
            </RouterLink>
          </div>
        )}
      </Card>
    </div>
  );
};

// Projects component - will show all consultant's projects
const Projects = ({ dashboardData }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  // Filter projects based on search and status
  const filteredProjects =
    dashboardData?.projects?.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.client.toLowerCase().includes(searchText.toLowerCase()) ||
        project.description.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || project.status === selectedStatus;

      return matchesSearch && matchesStatus;
    }) || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "processing";
      case "En attente":
        return "warning";
      case "Terminé":
        return "success";
      case "Planifié":
        return "default";
      case "Bloqué":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Élevé":
        return "#f5222d";
      case "Moyen":
        return "#faad14";
      case "Faible":
        return "#52c41a";
      default:
        return "#1890ff";
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>Mes Projets</Title>
        {/* <Button type="primary" icon={<PlusOutlined />}>
          Nouveau projet
        </Button> */}
      </div>

      <Card style={{ marginBottom: 24, borderRadius: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <Search
            placeholder="Rechercher un projet..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Select
            style={{ width: 200 }}
            placeholder="Filtrer par statut"
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tous les statuts</Option>
            <Option value="En cours">En cours</Option>
            <Option value="En attente">En attente</Option>
            <Option value="Planifié">Planifié</Option>
            <Option value="Terminé">Terminé</Option>
            <Option value="Bloqué">Bloqué</Option>
          </Select>

          <DatePicker.RangePicker
            placeholder={["Date début", "Date fin"]}
            style={{ width: 300 }}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {loading ? (
          <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </Col>
        ) : filteredProjects.length === 0 ? (
          <Col span={24}>
            <Empty description="Aucun projet ne correspond à vos critères de recherche" />
          </Col>
        ) : (
          filteredProjects.map((project) => (
            <Col xs={24} md={12} xl={8} key={project.id}>
              <Card
                hoverable
                className="project-card"
                style={{
                  height: "100%",
                  borderRadius: 8,
                  borderTop: `3px solid ${getPriorityColor(project.priority)}`,
                }}
                actions={[
                  <Tooltip title="Voir les détails">
                    <RouterLink
                      to={`/interface-consultant/projects/${project.id}`}
                    >
                      <EyeOutlined key="view" />
                    </RouterLink>
                  </Tooltip>,
                  <Tooltip title="Éditer">
                    <EditOutlined key="edit" />
                  </Tooltip>,
                  <Tooltip title="Documents">
                    <PaperClipOutlined key="documents" />
                  </Tooltip>,
                ]}
              >
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Tag color={getStatusColor(project.status)}>
                    {project.status}
                  </Tag>
                  {project.priority === "Élevé" && (
                    <Tag color="red">Priorité élevée</Tag>
                  )}
                </div>

                <Card.Meta
                  title={
                    <RouterLink
                      to={`/interface-consultant/projects/${project.id}`}
                    >
                      {project.name}
                    </RouterLink>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Client:</Text> {project.client}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text
                          type="secondary"
                          ellipsis={{ tooltip: project.description }}
                        >
                          {project.description}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Row>
                          <Col span={12}>
                            <Text type="secondary">Début:</Text>
                            <br />
                            {project.start_date
                              ? new Date(
                                  project.start_date
                                ).toLocaleDateString()
                              : "Non défini"}
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Échéance:</Text>
                            <br />
                            {project.deadline
                              ? new Date(project.deadline).toLocaleDateString()
                              : "Non défini"}
                          </Col>
                        </Row>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        {project.technologies &&
                          project.technologies.map((tech, index) => (
                            <Tag
                              key={index}
                              style={{ marginRight: 4, marginBottom: 4 }}
                            >
                              {tech}
                            </Tag>
                          ))}
                      </div>
                      <div>
                        <Progress
                          percent={project.progress || 0}
                          size="small"
                          status={
                            project.progress === 100 ? "success" : "active"
                          }
                        />
                      </div>

                      {project.has_contract && (
                        <div style={{ marginTop: 16 }}>
                          <Tag color="green">Contrat signé</Tag>
                          {project.contract && (
                            <div style={{ marginTop: 8 }}>
                              <Text strong>Numéro de contrat:</Text>{" "}
                              {project.contract.numero || "N/A"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
};

// Notifications component - for viewing all notifications
const Notifications = ({ dashboardData }) => {
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <Title level={2}>Notifications</Title>
      <Text type="secondary">Toutes vos notifications</Text>

      <Card style={{ marginTop: 24 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : dashboardData?.notifications?.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={dashboardData.notifications}
            renderItem={(notification) => (
              <List.Item
                actions={[
                  notification.status === "Not_read" && (
                    <Button type="link" size="small">
                      Marquer comme lu
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={notification.status === "Not_read"}>
                      <Avatar
                        icon={<BellOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                      />
                    </Badge>
                  }
                  title={
                    <div>
                      {notification.message}
                      {notification.status === "Not_read" && (
                        <Badge
                          status="processing"
                          text="Nouveau"
                          style={{ marginLeft: 8, fontSize: "12px" }}
                        />
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        {new Date(notification.created_at).toLocaleString()}
                      </Text>
                      {notification.event && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {notification.event}
                        </Tag>
                      )}
                      {notification.categorie && (
                        <Tag color="purple" style={{ marginLeft: 8 }}>
                          {notification.categorie}
                        </Tag>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{
              onChange: (page) => {
                console.log(page);
              },
              pageSize: 10,
            }}
          />
        ) : (
          <Empty description="Aucune notification" />
        )}
      </Card>
    </div>
  );
};

// Profile component - for viewing and editing profile
const Profile = ({ consultantData, onUpdateProfile }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    Nom: consultantData?.Nom || "",
    Prenom: consultantData?.Prenom || "",
    Poste: consultantData?.Poste || "",
    email: consultantData?.email || "",
    Date_naissance: consultantData?.Date_naissance || "",
    Mobilité: consultantData?.Mobilité || "National",
    Disponibilité: consultantData?.Disponibilité || "",
  });

  const handleChange = (name, value) => {
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${Endpoint()}/api/consultants/${consultantData.ID_collab}/profile/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("consultantToken")}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (data.status) {
        message.success("Profil mis à jour avec succès");
        setEditing(false);
        if (onUpdateProfile) {
          onUpdateProfile(data.data);
        }
      } else {
        message.error(
          data.message || "Erreur lors de la mise à jour du profil"
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      message.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>Mon Profil</Title>
        {!editing ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setEditing(true)}
          >
            Modifier
          </Button>
        ) : (
          <div>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => setEditing(false)}
            >
              Annuler
            </Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <Avatar size={100} icon={<UserOutlined />} src={null} />
              <div style={{ marginTop: 16 }}>
                <Title level={4}>
                  {consultantData?.Nom} {consultantData?.Prenom}
                </Title>
                <Text type="secondary">
                  {consultantData?.Poste || "Consultant"}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">
                    {consultantData?.Mobilité || "National"}
                  </Tag>
                </div>
              </div>
              {editing && (
                <div style={{ marginTop: 16 }}>
                  <Button icon={<CloudUploadOutlined />}>
                    Changer la photo
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <div>
              <Text strong>Email:</Text>
              {editing ? (
                <Input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  style={{ marginTop: 8 }}
                />
              ) : (
                <div>{consultantData?.email}</div>
              )}
            </div>

            <Divider />

            <div>
              <Text strong>ESN:</Text>
              <div>{consultantData?.esn_name || "Non spécifié"}</div>
            </div>

            <Divider />

            <div>
              <Text strong>Date de naissance:</Text>
              {editing ? (
                <DatePicker style={{ marginTop: 8, width: "100%" }} />
              ) : (
                <div>
                  {consultantData?.Date_naissance
                    ? new Date(
                        consultantData.Date_naissance
                      ).toLocaleDateString()
                    : "Non spécifiée"}
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Informations personnelles">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Nom:</Text>
                {editing ? (
                  <Input
                    value={form.Nom}
                    onChange={(e) => handleChange("Nom", e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <div>{consultantData?.Nom}</div>
                )}
              </Col>
              <Col span={12}>
                <Text strong>Prénom:</Text>
                {editing ? (
                  <Input
                    value={form.Prenom}
                    onChange={(e) => handleChange("Prenom", e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <div>{consultantData?.Prenom}</div>
                )}
              </Col>
              <Col span={12}>
                <Text strong>Poste:</Text>
                {editing ? (
                  <Input
                    value={form.Poste}
                    onChange={(e) => handleChange("Poste", e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <div>{consultantData?.Poste || "Non spécifié"}</div>
                )}
              </Col>
              <Col span={12}>
                <Text strong>Mobilité:</Text>
                {editing ? (
                  <Select
                    value={form.Mobilité}
                    onChange={(value) => handleChange("Mobilité", value)}
                    style={{ marginTop: 8, width: "100%" }}
                  >
                    <Option value="National">National</Option>
                    <Option value="International">International</Option>
                    <Option value="Autres">Autres</Option>
                  </Select>
                ) : (
                  <div>{consultantData?.Mobilité || "National"}</div>
                )}
              </Col>
              <Col span={12}>
                <Text strong>Date de début d'activité:</Text>
                <div>
                  {consultantData?.date_debut_activ
                    ? new Date(
                        consultantData.date_debut_activ
                      ).toLocaleDateString()
                    : "Non spécifiée"}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Disponibilité:</Text>
                {editing ? (
                  <DatePicker style={{ marginTop: 8, width: "100%" }} />
                ) : (
                  <div>
                    {consultantData?.Disponibilité
                      ? new Date(
                          consultantData.Disponibilité
                        ).toLocaleDateString()
                      : "Non spécifiée"}
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          <Card title="Expérience et compétences" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>CV:</Text>
                <div>
                  {consultantData?.CV ? (
                    <Button type="link" icon={<DownloadOutlined />}>
                      Télécharger le CV
                    </Button>
                  ) : (
                    <Text type="secondary">Aucun CV téléchargé</Text>
                  )}
                  {editing && (
                    <Button icon={<CloudUploadOutlined />}>
                      Ajouter un CV
                    </Button>
                  )}
                </div>
              </Col>
              <Col span={24}>
                <Text strong>LinkedIn:</Text>
                {editing ? (
                  <Input
                    value={form.LinkedIN}
                    onChange={(e) => handleChange("LinkedIN", e.target.value)}
                    style={{ marginTop: 8 }}
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                ) : (
                  <div>
                    {consultantData?.LinkedIN ? (
                      <a
                        href={consultantData.LinkedIN}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {consultantData.LinkedIN}
                      </a>
                    ) : (
                      "Non spécifié"
                    )}
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ProjectDetails component - for viewing individual project details
const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("1");

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch the project details from the API
        // For now, we'll simulate a project data structure
        const consultantId = localStorage.getItem("consultantId");
        const token = localStorage.getItem("consultantToken");

        // Mock data for demonstration - in production this would be an API call
        setTimeout(() => {
          const mockProject = {
            id: projectId,
            name: "Développement Plateforme E-Commerce",
            client: "Tech Solutions SARL",
            description:
              "Conception et développement d'une plateforme e-commerce complète avec système de paiement intégré et gestion des stocks en temps réel.",
            status: "En cours",
            priority: "Élevé",
            start_date: "2025-04-15",
            deadline: "2025-08-30",
            progress: 45,
            technologies: ["React", "Node.js", "MongoDB", "AWS"],
            budget: "€45,000",
            location: "Paris / Télétravail",
            team: "5 personnes",
            team_members: [
              { id: 1, name: "Sophie Martin", role: "Chef de projet" },
              { id: 2, name: "Lucas Dubois", role: "Développeur Backend" },
              { id: 3, name: "Emma Bernard", role: "Développeur Frontend" },
              { id: 4, name: "Thomas Leroux", role: "Designer UI/UX" },
              { id: 5, name: "Julie Moreau", role: "QA Tester" },
            ],
            deliverables: [
              {
                id: 1,
                item: "Maquettes UI/UX",
                deadline: "2025-05-01",
                status: "Terminé",
              },
              {
                id: 2,
                item: "Architecture Backend",
                deadline: "2025-05-15",
                status: "Terminé",
              },
              {
                id: 3,
                item: "Développement Frontend - Phase 1",
                deadline: "2025-06-15",
                status: "En cours",
              },
              {
                id: 4,
                item: "Intégration Système de Paiement",
                deadline: "2025-07-01",
                status: "Non commencé",
              },
              {
                id: 5,
                item: "Tests et Optimisation",
                deadline: "2025-08-15",
                status: "Non commencé",
              },
            ],
            documents: [
              {
                id: 1,
                name: "Cahier des charges.pdf",
                date: "2025-04-10",
                type: "PDF",
              },
              {
                id: 2,
                name: "Maquettes UI.fig",
                date: "2025-04-20",
                type: "Figma",
              },
              {
                id: 3,
                name: "Plan de développement.xlsx",
                date: "2025-04-25",
                type: "Excel",
              },
            ],
            contract: {
              numero: "CT-2025-089",
              signed_date: "2025-04-12",
              status: "Actif",
            },
          };

          setProject(mockProject);
          setLoading(false);

          // Mock comments
          setComments([
            {
              author: "Sophie Martin",
              avatar: <UserOutlined />,
              content:
                "La phase de maquettage est terminée. Les designs sont disponibles dans l'espace partagé.",
              datetime: "2025-04-22 09:15",
            },
            {
              author: "Thomas Leroux",
              avatar: <UserOutlined />,
              content:
                "J'ai commencé l'intégration des composants React selon les maquettes validées.",
              datetime: "2025-04-25 14:30",
            },
          ]);
        }, 1000);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des détails du projet:",
          error
        );
        message.error("Impossible de charger les détails du projet");
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;

    const comment = {
      author:
        `${consultantData?.Nom || ""} ${consultantData?.Prenom || ""}`.trim() ||
        "Consultant",
      avatar: <UserOutlined />,
      content: newComment,
      datetime: new Date().toLocaleString(),
    };

    setComments([...comments, comment]);
    setNewComment("");

    message.success("Commentaire ajouté");
    // In a real app, you would send this to your API
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
        return "processing";
      case "Terminé":
        return "success";
      case "Non commencé":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Chargement des détails du projet...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <Result
        status="404"
        title="Projet non trouvé"
        subTitle="Désolé, le projet que vous recherchez n'existe pas."
        extra={
          <Button
            type="primary"
            onClick={() => navigate("/interface-consultant/projects")}
          >
            Retour aux projets
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/interface-consultant/projects")}
          style={{ marginRight: 16 }}
        >
          Retour aux projets
        </Button>
      </div>

      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {project.name}
              </Title>
              <div style={{ marginTop: 8 }}>
                <Tag color={getStatusColor(project.status)}>
                  {project.status}
                </Tag>
                {project.priority === "Élevé" && (
                  <Tag color="red">Priorité élevée</Tag>
                )}
                <Tag color="blue">{project.client}</Tag>
              </div>
            </div>
            <div>
              <Progress
                type="circle"
                percent={project.progress}
                width={80}
                status={project.progress === 100 ? "success" : "active"}
              />
            </div>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <ProjectOutlined /> Aperçu
              </span>
            }
            key="1"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <Card title="Description du projet" bordered={false}>
                  <Paragraph>{project.description}</Paragraph>

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Date de début"
                        value={new Date(
                          project.start_date
                        ).toLocaleDateString()}
                        prefix={<CalendarOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Date de fin prévue"
                        value={new Date(project.deadline).toLocaleDateString()}
                        prefix={<CalendarOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Budget"
                        value={project.budget}
                        prefix={<span style={{ fontSize: "16px" }}>€</span>}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Équipe"
                        value={project.team}
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <div>
                    <Title level={5}>Technologies</Title>
                    <div>
                      {project.technologies.map((tech, index) => (
                        <Tag
                          key={index}
                          color="blue"
                          style={{ margin: "0 8px 8px 0" }}
                        >
                          {tech}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card title="Livrables" style={{ marginTop: 24 }}>
                  <Table
                    dataSource={project.deliverables}
                    pagination={false}
                    rowKey="id"
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
                        render: (date) => (
                          <Tag icon={<CalendarOutlined />} color="blue">
                            {new Date(date).toLocaleDateString()}
                          </Tag>
                        ),
                      },
                      {
                        title: "Statut",
                        dataIndex: "status",
                        key: "status",
                        render: (status) => (
                          <Badge
                            status={getStatusColor(status)}
                            text={status}
                          />
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card title="Informations contrat" bordered={false}>
                  {project.contract ? (
                    <>
                      <p>
                        <strong>Numéro:</strong> {project.contract.numero}
                      </p>
                      <p>
                        <strong>Date de signature:</strong>{" "}
                        {new Date(
                          project.contract.signed_date
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Statut:</strong>{" "}
                        <Tag color="green">{project.contract.status}</Tag>
                      </p>
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        block
                        style={{ marginTop: 16 }}
                      >
                        Voir le contrat
                      </Button>
                    </>
                  ) : (
                    <Empty description="Aucun contrat associé" />
                  )}
                </Card>

                <Card title="Équipe projet" style={{ marginTop: 24 }}>
                  <List
                    dataSource={project.team_members}
                    renderItem={(member) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={member.name}
                          description={member.role}
                        />
                      </List.Item>
                    )}
                  />
                </Card>

                <Card title="Documents" style={{ marginTop: 24 }}>
                  <List
                    dataSource={project.documents}
                    renderItem={(doc) => (
                      <List.Item
                        actions={[
                          <Button type="link" icon={<DownloadOutlined />}>
                            Télécharger
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor:
                                  doc.type === "PDF"
                                    ? "#ff4d4f"
                                    : doc.type === "Figma"
                                    ? "#722ed1"
                                    : "#52c41a",
                              }}
                            >
                              {doc.type.charAt(0)}
                            </Avatar>
                          }
                          title={doc.name}
                          description={new Date(doc.date).toLocaleDateString()}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <span>
                <CommentOutlined /> Discussions
              </span>
            }
            key="2"
          >
            <Card bordered={false}>
              <List
                className="comment-list"
                header={`${comments.length} commentaires`}
                itemLayout="horizontal"
                dataSource={comments}
                renderItem={(item) => (
                  <li>
                    {/* <Comment
                      author={item.author}
                      avatar={<Avatar icon={item.avatar} />}
                      content={item.content}
                      datetime={item.datetime}
                    /> */}
                  </li>
                )}
              />

              <Divider />

              <Form.Item>
                <Input.TextArea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                />
              </Form.Item>
              <Form.Item>
                <Button
                  htmlType="submit"
                  type="primary"
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                >
                  Ajouter un commentaire
                </Button>
              </Form.Item>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

// Main Consultant Interface component
const InterfaceConsultant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultantData, setConsultantData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [notificationCount, setNotificationCount] = useState(0);
  useEffect(() => {
    // Add some CSS for animations
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .ant-card {
        transition: all 0.3s;
      }
      .ant-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);

    // Check if consultant is logged in through either authentication method
    const checkAuth = () => {
      // Check legacy authentication
      const consultantToken = localStorage.getItem("consultantToken");
      const consultantId = localStorage.getItem("consultantId");

      // Check unified authentication
      const unifiedToken = localStorage.getItem("unifiedToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (
        (!consultantToken || !consultantId) &&
        (!unifiedToken || !userId || userRole !== "consultant")
      ) {
        message.warning(
          "Vous n'êtes pas connecté. Redirection vers la page de connexion..."
        );

        // Check if using unified system but wrong role
        if (unifiedToken && userId && userRole && userRole !== "consultant") {
          message.error("Vous n'avez pas les droits d'accès à cette page");
          // If they're commercial, send them to the commercial interface
          if (userRole === "commercial") {
            navigate("/interface-commercial");
            return false;
          }
        }

        // Redirect to appropriate login page
        if (unifiedToken) {
          navigate("/unified-login");
        } else {
          navigate("/loginConsultant");
        }
        return false;
      }

      return true;
    };

    if (!checkAuth()) return;

    // Fetch consultant data and dashboard data
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get consultant ID from either authentication method
        const consultantId =
          localStorage.getItem("consultantId") ||
          localStorage.getItem("userId") ||
          "";
        const token =
          localStorage.getItem("consultantToken") ||
          localStorage.getItem("unifiedToken") ||
          "";

        if (!consultantId) {
          throw new Error("ID consultant non trouvé");
        }

        // Fetch profile data
        const profileResponse = await fetch(
          `${Endpoint()}/api/consultants/${consultantId}/profile/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!profileResponse.ok) {
          throw new Error(
            `Erreur lors de la récupération du profil: ${profileResponse.statusText}`
          );
        }

        const profileData = await profileResponse.json();

        if (!profileData.status) {
          throw new Error(
            profileData.message || "Erreur lors de la récupération du profil"
          );
        }

        setConsultantData(profileData.data);

        // Here you would add your fetch for dashboard data
        // For now we'll set a mock empty structure
        setDashboardData({
          stats: { unreadNotifications: 0 },
          projects: [],
          notifications: [],
        });
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        message.error(
          "Impossible de charger vos informations: " + error.message
        );
      } finally {
        setLoading(false);
      }
    };    fetchData();    // Listen for route changes
    const path = location.pathname;
    console.log("Full pathname:", path); // Debug log
    
    // Special case for '2/interface-consultant/notes-de-frais'
    if (path.includes("2/interface-consultant/notes-de-frais")) {
      console.log("Detected special path with prefix '2'");
      setCurrentPage("notes-de-frais");
      return;
    }
    
    if (path.includes("/interface-consultant/")) {
      const pathPart = path.split("/interface-consultant/")[1] || "dashboard";
      console.log("Path part after split:", pathPart); // Debug log
      // Extract the main page from the path (handle any subroutes)
      const page = pathPart.split("/")[0] || "dashboard";
      console.log("Current page from path:", page); // Debug log
      setCurrentPage(page);
    }

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, [navigate, location]);

  const handleLogout = () => {
    Modal.confirm({
      title: "Déconnexion",
      content: "Êtes-vous sûr de vouloir vous déconnecter ?",
      onOk: () => {
        // Check which authentication method is being used
        const consultantToken = localStorage.getItem("consultantToken");
        const unifiedToken = localStorage.getItem("unifiedToken");

        if (consultantToken) {
          // Legacy logout
          localStorage.removeItem("consultantToken");
          localStorage.removeItem("consultantId");
        }

        if (unifiedToken) {
          // Unified login logout
          localStorage.removeItem("unifiedToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          localStorage.removeItem("esnId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userType");
        }

        message.success("Vous avez été déconnecté avec succès");

        // Redirect to appropriate login page
        if (unifiedToken) {
          navigate("/unified-login");
        } else {
          navigate("/loginConsultant");
        }
      },
    });
  };

  const handleUpdateProfile = (updatedData) => {
    setConsultantData(updatedData);
  };

  const userMenu = (
    <Menu>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Déconnexion
      </Menu.Item>
    </Menu>
  );

  const notificationsMenu = (
    <Menu style={{ width: 300 }}>
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
          fontWeight: "bold",
        }}
      >
        Notifications récentes
      </div>
      {dashboardData?.notifications?.slice(0, 3).map((notification, index) => (
        <Menu.Item key={`notif-${index}`}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Badge dot={notification.status === "Not_read"} offset={[0, 5]}>
              <Avatar
                size="small"
                style={{ backgroundColor: "#1890ff", marginRight: 8 }}
                icon={<BellOutlined />}
              />
            </Badge>
            <div>
              <div>{notification.message}</div>
              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)" }}>
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </Menu.Item>
      ))}
      <Menu.Divider />
      <Menu.Item key="viewall" style={{ textAlign: "center" }}>
        <RouterLink
          to="/interface-consultant/notifications"
          onClick={() => setCurrentPage("notifications")}
        >
          Voir toutes les notifications
        </RouterLink>
      </Menu.Item>
      {/* <Menu.Item key="markasread" style={{ textAlign: "center" }}>
        Marquer tout comme lu
      </Menu.Item> */}
    </Menu>
  );  // Define menu items
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Tableau de bord",
    },
    {
      key: "cra-monthly",
      icon: <CalendarOutlined />,
      label: "Rapport d'activité mensuel",
    },
    {
      key: "notes-de-frais",
      icon: <FileTextOutlined />,
      label: "Notes de frais",
    },
  ];  // Handle menu selection
  const handleMenuClick = (e) => {
    console.log("Menu clicked:", e.key); // Debug log
    setCurrentPage(e.key);
    const route = `/interface-consultant/${e.key === "dashboard" ? "" : e.key}`;
    console.log("Navigating to:", route); // Debug log
    navigate(route);
  };
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            Chargement de votre espace consultant...
          </div>
        </div>
      );
    }

    // Debug log
    console.log("Current location:", location.pathname);

    // Handle the specific error case with '2/interface-consultant/notes-de-frais'
    if (location.pathname.includes("2/interface-consultant/notes-de-frais")) {
      console.log("Handling special case with prefix '2'");
      return <ExpenseReports consultantData={consultantData} />;
    }

    // Check if we're on a project detail page
    if (location.pathname.match(/\/interface-consultant\/cra-monthly\/\d+/)) {
      return <ProjectDetails />;
    }switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            consultantData={consultantData}
            dashboardData={dashboardData}
          />
        );
      case "projects":
        return <Projects dashboardData={dashboardData} />;
      case "cra-monthly":
        return <MonthlyActivityReport />;
      case "notes-de-frais":
        return <ExpenseReports consultantData={consultantData} />;
      case "profile":
        return (
          <Profile
            consultantData={consultantData}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case "notifications":
        return <Notifications dashboardData={dashboardData} />;
      default:
        return (
          <Dashboard
            consultantData={consultantData}
            dashboardData={dashboardData}
          />
        );
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
          zIndex: 999,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
        width={250}
      >
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "0" : "0 16px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {!collapsed && (
            <Title level={4} style={{ margin: 0 }}>
              Maghreb IT Connect
            </Title>
          )}
        </div>

        <div style={{ padding: collapsed ? "16px 0" : "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "16px",
              padding: "16px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Avatar
              size={collapsed ? 40 : 64}
              icon={<UserOutlined />}
              src={null}
              style={{
                backgroundColor: "#1890ff",
                marginBottom: collapsed ? "8px" : "16px",
              }}
            />
            {!collapsed && (
              <>
                <Text
                  strong
                  style={{ textAlign: "center", marginBottom: "4px" }}
                >
                  {consultantData?.Nom || ""} {consultantData?.Prenom || ""}
                </Text>
                <Tag color="blue">{consultantData?.Poste || "Consultant"}</Tag>
              </>
            )}
          </div>
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />

        {!collapsed && (
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid #f0f0f0",
              position: "absolute",
              bottom: "48px",
              width: "100%",
            }}
          >
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
            >
              Déconnexion
            </Button>
          </div>
        )}
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 998,
            width: "100%",
          }}
        >
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>Consultant</Breadcrumb.Item>
            <Breadcrumb.Item>
              {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
            </Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: "flex", alignItems: "center" }}>
            <Dropdown
              overlay={notificationsMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Badge count={notificationCount} dot={false}>
                <Button
                  icon={<BellOutlined />}
                  style={{
                    marginRight: 16,
                    border: notificationCount ? "1px solid #1890ff" : "none",
                  }}
                  type={notificationCount ? "primary" : "default"}
                  shape="circle"
                />
              </Badge>
            </Dropdown>

            <Dropdown
              overlay={userMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  src={null}
                  style={{ marginRight: 8, backgroundColor: "#1890ff" }}
                />
                <span style={{ marginRight: 8 }}>
                  {consultantData
                    ? `${consultantData.Nom} ${consultantData.Prenom}`
                    : "Consultant"}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{ padding: "24px", background: "#f5f5f5", minHeight: 280 }}
        >
          {renderContent()}
        </Content>

        <Footer style={{ textAlign: "center", padding: "12px 50px" }}>
          Maghreb IT Connect ©{new Date().getFullYear()} - Espace Consultant
        </Footer>
      </Layout>
    </Layout>
  );
};

export default InterfaceConsultant;
