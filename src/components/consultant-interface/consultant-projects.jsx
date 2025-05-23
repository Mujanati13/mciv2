import React, { useState, useEffect } from "react";
import {
  Table, Card, Input, Button, Space, Tag, Tooltip, Modal, message,
  Row, Col, Typography, Tabs, Progress, Select, DatePicker, Empty,
  Spin, Badge, Statistic, List, Divider, Form, InputNumber,
  Drawer, Timeline, Dropdown, Menu
} from "antd";
import {
  SearchOutlined, CalendarOutlined, TeamOutlined, FilePdfOutlined,
  ProjectOutlined, EyeOutlined, FileTextOutlined, DownloadOutlined,
  FilterOutlined, PaperClipOutlined, AppstoreOutlined, BarsOutlined,
  ReloadOutlined, CheckCircleOutlined, MoreOutlined, BarChartOutlined,
  FieldTimeOutlined
} from "@ant-design/icons";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;
const { RangePicker } = DatePicker;

const ConsultantProjects = () => {
  // Core state
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  
  // Project details state
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  
  // CRA state
  const [craModalVisible, setCraModalVisible] = useState(false);
  const [selectedProjectForCra, setSelectedProjectForCra] = useState(null);
  const [craForm, setCraForm] = useState({
    période: moment().format('YYYY-MM'),
    jour: moment().date(),
    type_imputation: "Jour Travaillé",
    durée: 1,
    commentaire: "",
    statut: "soumis"
  });
  const [craSubmitting, setCraSubmitting] = useState(false);
  const [craHistoryDrawer, setCraHistoryDrawer] = useState(false);
  const [craHistory, setCraHistory] = useState([]);
  const [craHistoryLoading, setCraHistoryLoading] = useState(false);
  
  // CRA filtering state
  const [craFilterPeriod, setCraFilterPeriod] = useState(moment().format('YYYY-MM'));
  const [craFilterClient, setCraFilterClient] = useState(null);
  const [craFilterBdc, setCraFilterBdc] = useState(null);
  const [clientsList, setClientsList] = useState([]);

  // Fetch initial data
  useEffect(() => {
    fetchProjects();
    fetchClientsList();
  }, []);

  // Filter projects when search criteria change
  useEffect(() => {
    applyFilters();
  }, [searchText, selectedStatus, dateRange, projects]);

  // Helper functions
  const mapCandidatureStatus = status => {
    const statusMap = {
      "Sélectionnée": "En cours",
      "En attente": "En attente",
      "Rejetée": "Terminé"
    };
    return statusMap[status] || "Planifié";
  };

  const determinePriority = (status, startDate) => {
    if (status === "Sélectionnée") return "Élevé";
    
    const daysUntilStart = Math.floor(
      (new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilStart < 7) return "Élevé";
    if (daysUntilStart < 30) return "Moyen";
    return "Faible";
  };

  const calculateProgress = (status, startDate, endDate) => {
    if (status === "Rejetée") return 100;
    if (status !== "Sélectionnée") return 0;
    
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    return Math.floor(((today - start) / (end - start)) * 100);
  };

  const getStatusColor = status => {
    const colors = {
      "En cours": "processing",
      "En attente": "warning",
      "Terminé": "success",
      "Planifié": "default",
      "Bloqué": "error"
    };
    return colors[status] || "default";
  };

  const getPriorityColor = priority => {
    const colors = {
      "Élevé": "#f5222d",
      "Moyen": "#faad14",
      "Faible": "#52c41a"
    };
    return colors[priority] || "#1890ff";
  };
  
  const getCraStatusColor = status => {
    const colors = {
      "validé": "success",
      "en attente": "processing",
      "soumis": "processing",
      "rejeté": "error"
    };
    return colors[status] || "default";
  };

  const formatCraDate = (period, day) => {
    if (!period || !day) return "N/A";
    const paddedDay = String(day).padStart(2, '0');
    const [year, month] = period.split('-');
    return `${paddedDay}/${month}/${year}`;
  };

  // Data fetching functions
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const consultantId = localStorage.getItem("consultantId");
      if (!consultantId) throw new Error("ID consultant non trouvé");

      const token = localStorage.getItem("consultantToken");
      const response = await axios.get(
        `${Endponit()}/api/consultant/${consultantId}/projects/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status) {
        // Transform API data
        const transformedProjects = (response.data.data || []).map(project => ({
          id: project.id,
          name: project.titre,
          client: project.client_name,
          description: project.description,
          status: mapCandidatureStatus(project.candidature?.statut),
          priority: determinePriority(project.candidature?.statut, project.date_debut),
          start_date: project.date_debut,
          deadline: project.date_limite,
          progress: calculateProgress(project.candidature?.statut, project.date_debut, project.date_limite),
          technologies: project.profil ? project.profil.split(',').map(tech => tech.trim()) : [],
          budget: project.candidature?.tjm ? `€${project.candidature.tjm}/jour` : "Non défini",
          location: project.lieu || "Non spécifié",
          team: "À déterminer",
          team_members: [], 
          deliverables: [],
          documents: [],
          candidature: project.candidature || null,
          client_id: project.client_id,
          has_contract: project.candidature?.statut === "Sélectionnée",
          contract: project.candidature?.statut === "Sélectionnée" ? {
            numero: `CT-${new Date().getFullYear()}-${project.id}`,
            signed_date: project.candidature.date_candidature,
            status: "Actif"
          } : null,
          cra_count: 0 // Will be updated after fetching CRA history
        }));
        
        setProjects(transformedProjects);
        setFilteredProjects(transformedProjects);
        
        // Fetch CRA counts
        transformedProjects.forEach(project => fetchCraCount(project.id));
      } else {
        throw new Error(response.data?.message || "Erreur lors de la récupération des projets");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error("Impossible de charger vos projets");
      
      // For development - fall back to mock data
      const mockProjects = generateMockProjects();
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsList = async () => {
    try {
      const consultantId = localStorage.getItem("consultantId");
      if (!consultantId) return;

      const token = localStorage.getItem("consultantToken");
      const response = await axios.get(
        `${Endponit()}/api/consultant/${consultantId}/clients/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status) {
        setClientsList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchCraCount = async (projectId) => {
    try {
      const consultantId = localStorage.getItem("consultantId");
      if (!consultantId) return;

      const token = localStorage.getItem("consultantToken");
      const response = await axios.get(
        `${Endponit()}/api/cra_imputations_by_consultant/${consultantId}/?id_bdc=${projectId}&count=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status) {
        const count = response.data.total || 0;
        updateProjectCraCount(projectId, count);
      }
    } catch (error) {
      console.error(`Error fetching CRA count for project ${projectId}:`, error);
    }
  };
  
  const updateProjectCraCount = (projectId, count) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, cra_count: count } : p
    ));
    
    setFilteredProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, cra_count: count } : p
    ));
  };
  
  const fetchCraHistory = async (projectId = null) => {
    setCraHistoryLoading(true);
    try {
      const consultantId = localStorage.getItem("consultantId");
      if (!consultantId) throw new Error("ID consultant non trouvé");

      const token = localStorage.getItem("consultantToken");
      
      // Build query parameters
      let queryParams = new URLSearchParams();
      
      if (craFilterPeriod) queryParams.append('période', craFilterPeriod);
      if (craFilterClient) queryParams.append('id_client', craFilterClient);
      
      if (projectId) {
        setCraFilterBdc(projectId);
        queryParams.append('id_bdc', projectId);
      } else if (craFilterBdc) {
        queryParams.append('id_bdc', craFilterBdc);
      }
      
      // Make API call with the new endpoint
      const response = await axios.get(
        `${Endponit()}/api/cra_imputations_by_consultant/${consultantId}/?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status) {
        setCraHistory(response.data.data || []);
        
        // If we're filtering by project, update the project's CRA count
        if (projectId) {
          const count = response.data.total || response.data.data?.length || 0;
          updateProjectCraCount(projectId, count);
        }
      } else {
        throw new Error(response.data?.message || "Erreur lors de la récupération de l'historique CRA");
      }
    } catch (error) {
      console.error("Error fetching CRA history:", error);
      message.error("Impossible de charger l'historique CRA");
      setCraHistory([]);
    } finally {
      setCraHistoryLoading(false);
    }
  };

  // CRA functions
  const showCraModal = (project) => {
    setSelectedProjectForCra(project);
    setCraForm({
      ...craForm,
      commentaire: `Travail sur le projet: ${project.name}`
    });
    setCraModalVisible(true);
  };

  const submitCraImputation = async () => {
    setCraSubmitting(true);
    try {
      const consultantId = localStorage.getItem("consultantId");
      if (!consultantId) throw new Error("ID consultant non trouvé");

      const token = localStorage.getItem("consultantToken");
      
      const craData = {
        id_consultan: parseInt(consultantId),
        période: craForm.période,
        jour: craForm.jour,
        type_imputation: craForm.type_imputation,
        durée: craForm.durée,
        id_client: selectedProjectForCra.client_id || 0,
        id_bdc: selectedProjectForCra.id,
        commentaire: craForm.commentaire,
        statut: craForm.statut
      };

      const response = await axios.post(
        `${Endponit()}/api/cra_imputation/`,
        craData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data?.status) {
        message.success("Imputation CRA enregistrée avec succès");
        setCraModalVisible(false);
        
        // Update project with incremented CRA count
        updateProjectCraCount(
          selectedProjectForCra.id, 
          (selectedProjectForCra.cra_count || 0) + 1
        );
        
        // Refresh CRA history if drawer is open
        if (craHistoryDrawer) {
          fetchCraHistory(selectedProjectForCra.id);
        }
      } else {
        throw new Error(response.data?.message || "Erreur lors de l'enregistrement du CRA");
      }
    } catch (error) {
      console.error("Error submitting CRA:", error);
      message.error("Impossible d'enregistrer l'imputation CRA");
    } finally {
      setCraSubmitting(false);
    }
  };
  
  const showCraHistory = (project = null) => {
    if (project) {
      setSelectedProjectForCra(project);
      setCraFilterBdc(project.id);
    }
    fetchCraHistory(project?.id);
    setCraHistoryDrawer(true);
  };
  
  const clearCraFilters = () => {
    setCraFilterPeriod(moment().format('YYYY-MM'));
    setCraFilterClient(null);
    fetchCraHistory(craFilterBdc);
  };

  // Project list functions
  const applyFilters = () => {
    let result = [...projects];

    // Filter by search text
    if (searchText) {
      const normalizedSearch = searchText.toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(normalizedSearch) ||
          project.client.toLowerCase().includes(normalizedSearch) ||
          project.description.toLowerCase().includes(normalizedSearch)
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      result = result.filter((project) => project.status === selectedStatus);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");
      
      result = result.filter((project) => {
        const projectStartDate = new Date(project.start_date);
        return projectStartDate >= startDate.toDate() && 
               projectStartDate <= endDate.toDate();
      });
    }

    setFilteredProjects(result);
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedStatus("all");
    setDateRange(null);
    setFilteredProjects(projects);
  };

  const viewProjectDetails = (project) => {
    setSelectedProject(project);
    setDetailsModalVisible(true);
    fetchCraHistory(project.id);
  };

  // Mock data generation
  const generateMockProjects = () => {
    return [
      {
        id: 1,
        name: "Développement Plateforme E-Commerce",
        client: "Tech Solutions SARL",
        description: "Conception et développement d'une plateforme e-commerce complète avec système de paiement intégré.",
        status: "En cours",
        priority: "Élevé",
        start_date: "2025-04-15",
        deadline: "2025-08-30",
        progress: 45,
        technologies: ["React", "Node.js", "MongoDB", "AWS"],
        budget: "€45,000",
        location: "Paris / Télétravail",
        team: "5 personnes",
        client_id: 123,
        team_members: [
          { id: 1, name: "Sophie Martin", role: "Chef de projet" },
          { id: 2, name: "Lucas Dubois", role: "Développeur Backend" }
        ],
        deliverables: [
          { id: 1, item: "Maquettes UI/UX", deadline: "2025-05-01", status: "Terminé" }
        ],
        documents: [
          { id: 1, name: "Cahier des charges.pdf", date: "2025-04-10", type: "PDF" }
        ],
        contract: {
          numero: "CT-2025-089",
          signed_date: "2025-04-12",
          status: "Actif"
        },
        has_contract: true,
        cra_count: 8
      },
      {
        id: 2,
        name: "Migration Système Legacy",
        client: "BanquePlus SA",
        description: "Migration d'un système bancaire legacy vers une architecture microservices.",
        status: "Planifié",
        priority: "Moyen",
        start_date: "2025-06-01",
        deadline: "2025-12-15",
        progress: 0,
        technologies: ["Java", "Spring Boot", "Kubernetes"],
        budget: "€120,000",
        location: "Lyon",
        team: "8 personnes",
        client_id: 124,
        has_contract: false,
        cra_count: 0
      },
      {
        id: 3,
        name: "Maintenance Application Mobile",
        client: "Santé Connect",
        description: "Maintenance évolutive et corrective de l'application mobile de suivi médical.",
        status: "Terminé",
        priority: "Faible",
        start_date: "2025-01-10",
        deadline: "2025-04-10",
        progress: 100,
        technologies: ["Flutter", "Firebase"],
        budget: "€22,000",
        location: "Télétravail",
        team: "3 personnes",
        client_id: 125,
        contract: {
          numero: "CT-2025-045",
          signed_date: "2025-01-05",
          status: "Terminé"
        },
        has_contract: true,
        cra_count: 42
      }
    ];
  };

  // UI Components
  const ProjectCards = () => (
    <Row gutter={[16, 16]}>
      {loading ? (
        <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </Col>
      ) : filteredProjects.length === 0 ? (
        <Col span={24}>
          <Empty 
            description="Aucun projet ne correspond à vos critères de recherche" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
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
                  <EyeOutlined key="view" onClick={() => viewProjectDetails(project)} />
                </Tooltip>,
                <Tooltip title="Ajouter CRA">
                  <FieldTimeOutlined key="cra" onClick={() => showCraModal(project)} />
                </Tooltip>,
                <Dropdown 
                  overlay={
                    <Menu>
                      <Menu.Item 
                        key="history" 
                        icon={<BarChartOutlined />}
                        onClick={() => showCraHistory(project)}
                      >
                        Historique CRA ({project.cra_count || 0})
                      </Menu.Item>
                      {project.has_contract && (
                        <Menu.Item key="contract" icon={<FileTextOutlined />}>
                          Voir le contrat
                        </Menu.Item>
                      )}
                      {/* <Menu.Item key="documents" icon={<PaperClipOutlined />}>
                        Documents
                      </Menu.Item> */}
                    </Menu>
                  } 
                  trigger={['click']}
                >
                  <MoreOutlined key="more" />
                </Dropdown>
              ]}
            >
              <div style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <Tag color={getStatusColor(project.status)}>
                  {project.status}
                </Tag>
                {/* {project.priority === "Élevé" && (
                  <Tag color="red">Priorité élevée</Tag>
                )} */}
              </div>

              <Card.Meta
                title={
                  <span style={{ cursor: "pointer" }} onClick={() => viewProjectDetails(project)}>
                    {project.name}
                  </span>
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
                            ? new Date(project.start_date).toLocaleDateString()
                            : "Non défini"}
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Date de fin:</Text>
                          <br />
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString()
                            : "Non défini"}
                        </Col>
                      </Row>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      {project.technologies?.map((tech, index) => (
                        <Tag key={index} style={{ marginRight: 4, marginBottom: 4 }}>
                          {tech}
                        </Tag>
                      ))}
                    </div>
                    <div>
                      <Progress
                        percent={project.progress || 0}
                        size="small"
                        status={project.progress === 100 ? "success" : "active"}
                      />
                    </div>

                    {project.has_contract && (
                      <div style={{ marginTop: 16 }}>
                        <Tag color="green">Contrat signé</Tag>
                        {project.contract && (
                          <div style={{ marginTop: 8 }}>
                            <Text strong>Numéro:</Text>{" "}
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
  );

  const ProjectTable = () => {
    const columns = [
      {
        title: "Projet",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <a onClick={() => viewProjectDetails(record)}>{text}</a>
        ),
      },
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
      },
      {
        title: "Statut",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Badge status={getStatusColor(status)} text={status} />
        ),
      },
      {
        title: "Priorité",
        dataIndex: "priority",
        key: "priority",
        render: (priority) => {
          const color = 
            priority === "Élevé" ? "red" : 
            priority === "Moyen" ? "orange" : "green";
          return <Tag color={color}>{priority}</Tag>;
        },
      },
      {
        title: "Progression",
        dataIndex: "progress",
        key: "progress",
        render: (progress) => (
          <Progress 
            percent={progress} 
            size="small" 
            status={progress === 100 ? "success" : "active"}
          />
        ),
      },
      {
        title: "Date début",
        dataIndex: "start_date",
        key: "start_date",
        render: (date) => new Date(date).toLocaleDateString(),
      },
      {
        title: "CRA",
        dataIndex: "cra_count",
        key: "cra_count",
        render: (count, record) => (
          <Button 
            type={count > 0 ? "link" : "text"} 
            onClick={() => showCraHistory(record)}
          >
            {count} CRA{count !== 1 ? 's' : ''}
          </Button>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => viewProjectDetails(record)} 
              size="small"
            >
              Détails
            </Button>
            <Button 
              icon={<FieldTimeOutlined />}
              onClick={() => showCraModal(record)}
              size="small"
              type="primary"
            >
              CRA
            </Button>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item 
                    key="cra-history" 
                    icon={<BarChartOutlined />}
                    onClick={() => showCraHistory(record)}
                  >
                    Historique CRA
                  </Menu.Item>
                  {record.has_contract && (
                    <Menu.Item key="contract" icon={<FileTextOutlined />}>
                      Voir le contrat
                    </Menu.Item>
                  )}
                </Menu>
              }
            >
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={filteredProjects}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Aucun projet trouvé" }}
      />
    );
  };

  const ProjectDetailsModal = () => {
    if (!selectedProject) return null;
    
    return (
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>{selectedProject.name}</Title>
              <div style={{ marginTop: 8 }}>
                <Tag color={getStatusColor(selectedProject.status)}>{selectedProject.status}</Tag>
                {/* {selectedProject.priority === "Élevé" && <Tag color="red">Priorité élevée</Tag>}
                <Tag color="blue">{selectedProject.client}</Tag> */}
              </div>
            </div>
            <Progress
              type="circle"
              percent={selectedProject.progress}
              width={60}
              status={selectedProject.progress === 100 ? "success" : "active"}
            />
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="cra" type="primary" onClick={() => {
            setDetailsModalVisible(false);
            showCraModal(selectedProject);
          }}>
            <FieldTimeOutlined /> Ajouter CRA
          </Button>,
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Fermer
          </Button>,
        ]}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><ProjectOutlined /> Aperçu</span>} key="1">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <Card title="Description du projet" bordered={false}>
                  <Paragraph>{selectedProject.description}</Paragraph>
                  
                  <Divider />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Date de début"
                        value={new Date(selectedProject.start_date).toLocaleDateString()}
                        prefix={<CalendarOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Date de fin prévue"
                        value={new Date(selectedProject.deadline).toLocaleDateString()}
                        prefix={<CalendarOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Budget" value={selectedProject.budget} />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Équipe"
                        value={selectedProject.team}
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <div>
                    <Title level={5}>Technologies</Title>
                    <div>
                      {selectedProject.technologies.map((tech, index) => (
                        <Tag key={index} color="blue" style={{ margin: "0 8px 8px 0" }}>
                          {tech}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>
                
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Historique CRA</span>
                      <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => showCraHistory(selectedProject)}
                      >
                        Voir tout
                      </Button>
                    </div>
                  } 
                  style={{ marginTop: 24 }}
                >
                  {craHistoryLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Spin />
                    </div>
                  ) : craHistory.length > 0 ? (
                    <Timeline>
                      {craHistory.slice(0, 3).map(cra => (
                        <Timeline.Item 
                          key={cra.id}
                          color={getCraStatusColor(cra.statut)}
                          dot={cra.statut === 'validé' && 
                            <CheckCircleOutlined style={{ fontSize: '16px' }} />
                          }
                        >
                          <p><strong>{formatCraDate(cra.période, cra.jour)}</strong> - {cra.type_imputation}</p>
                          <p>{cra.commentaire}</p>
                        </Timeline.Item>
                      ))}
                      {craHistory.length > 3 && (
                        <Timeline.Item color="gray">
                          <Button 
                            type="link" 
                            onClick={() => showCraHistory(selectedProject)}
                          >
                            Voir les {craHistory.length - 3} autres entrées...
                          </Button>
                        </Timeline.Item>
                      )}
                    </Timeline>
                  ) : (
                    <Empty 
                      description="Aucun CRA enregistré pour ce projet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Card>
              </Col>
              
            
            </Row>
          </TabPane>
          
          <TabPane tab={<span><FieldTimeOutlined /> CRA</span>} key="2">
            <Card>
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5} style={{ margin: 0 }}>Historique des imputations CRA</Title>
                {/* <Button 
                  type="primary" 
                  icon={<FieldTimeOutlined />}
                  onClick={() => showCraModal(selectedProject)}
                >
                  Nouvelle imputation
                </Button> */}
              </div>
              
              {craHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                </div>
              ) : craHistory.length > 0 ? (
                <Timeline>
                  {craHistory.map(cra => (
                    <Timeline.Item 
                      key={cra.id}
                      color={getCraStatusColor(cra.statut)}
                      dot={cra.statut === 'validé' && 
                        <CheckCircleOutlined style={{ fontSize: '16px' }} />
                      }
                    >
                      <p>
                        <strong>{formatCraDate(cra.période, cra.jour)}</strong> - 
                        {cra.type_imputation} ({cra.durée} jour{cra.durée > 1 ? 's' : ''})
                      </p>
                      <p>{cra.commentaire}</p>
                      <p>
                        <Tag color={getCraStatusColor(cra.statut)}>
                          {cra.statut.charAt(0).toUpperCase() + cra.statut.slice(1)}
                        </Tag>
                        {cra.date_soumission && (
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            Soumis le {new Date(cra.date_soumission).toLocaleString()}
                          </Text>
                        )}
                      </p>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty 
                  description="Aucun CRA enregistré pour ce projet" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Modal>
    );
  };
  
  const CraImputationModal = () => {
    if (!selectedProjectForCra) return null;
    
    const disabledDate = current => 
      current && (current > moment().endOf('day') || 
                 current < moment().subtract(30, 'days').startOf('day'));
    
    return (
      <Modal
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>Saisie CRA</Title>
            <Text type="secondary">Projet: {selectedProjectForCra.name}</Text>
          </div>
        }
        open={craModalVisible}
        onCancel={() => setCraModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCraModalVisible(false)}>
            Annuler
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={craSubmitting}
            onClick={submitCraImputation}
          >
            Enregistrer
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Période">
                <DatePicker
                  picker="month"
                  value={moment(craForm.période)}
                  format="YYYY-MM"
                  onChange={(date) => setCraForm({...craForm, période: date ? date.format('YYYY-MM') : ''})}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Jour">
                <DatePicker
                  value={moment(craForm.période + '-' + String(craForm.jour).padStart(2, '0'))}
                  disabledDate={disabledDate}
                  onChange={(date) => setCraForm({...craForm, jour: date ? date.date() : 1})}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="Type d'imputation">
            <Select
              value={craForm.type_imputation}
              onChange={(value) => setCraForm({...craForm, type_imputation: value})}
              style={{ width: '100%' }}
            >
              <Option value="Jour Travaillé">Jour Travaillé</Option>
              <Option value="Congé">Congé</Option>
              <Option value="Maladie">Maladie</Option>
              <Option value="Formation">Formation</Option>
              <Option value="Autre">Autre</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Durée (jours)">
            <InputNumber
              min={0.5}
              max={1}
              step={0.5}
              value={craForm.durée}
              onChange={(value) => setCraForm({...craForm, durée: value})}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="Commentaire">
            <Input.TextArea
              rows={4}
              value={craForm.commentaire}
              onChange={(e) => setCraForm({...craForm, commentaire: e.target.value})}
              placeholder="Décrivez le travail effectué..."
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  };
  
  const CraHistoryDrawer = () => {
    if (!selectedProjectForCra) return null;
    
    return (
      <Drawer
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>Historique CRA</Title>
            <Text type="secondary">Projet: {selectedProjectForCra.name}</Text>
          </div>
        }
        width={600}
        onClose={() => setCraHistoryDrawer(false)}
        open={craHistoryDrawer}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Button 
            type="primary" 
            icon={<FieldTimeOutlined />}
            onClick={() => {
              setCraHistoryDrawer(false);
              showCraModal(selectedProjectForCra);
            }}
          >
            Nouvelle imputation
          </Button>
        }
      >
        {/* Filtering controls */}
        <Card style={{ marginBottom: 16 }}>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Période">
                  <DatePicker
                    picker="month"
                    value={craFilterPeriod ? moment(craFilterPeriod) : null}
                    format="YYYY-MM"
                    onChange={(date) => setCraFilterPeriod(date ? date.format('YYYY-MM') : null)}
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* <Form.Item label="Client">
                  <Select
                    placeholder="Tous les clients"
                    value={craFilterClient}
                    onChange={(value) => setCraFilterClient(value)}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {clientsList.map(client => (
                      <Option key={client.id} value={client.id}>
                        {client.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item> */}
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ textAlign: 'right' }}>
                <Space>
                  {/* <Button onClick={clearCraFilters}>Réinitialiser</Button> */}
                  <Button 
                    type="primary"
                    onClick={() => fetchCraHistory(craFilterBdc)}
                    icon={<SearchOutlined />}
                  >
                    Rechercher
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* CRA history display */}
        {craHistoryLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : craHistory.length > 0 ? (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                {craHistory.length} enregistrement{craHistory.length > 1 ? 's' : ''} trouvé{craHistory.length > 1 ? 's' : ''}
              </Text>
              <Text>
                Total: {craHistory.reduce((sum, cra) => sum + cra.durée, 0)} jour(s)
              </Text>
            </div>
            <Timeline>
              {craHistory.map(cra => (
                <Timeline.Item
                  key={cra.id}
                  color={getCraStatusColor(cra.statut)}
                  dot={cra.statut === 'validé' && 
                    <CheckCircleOutlined style={{ fontSize: '16px' }} />
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>{formatCraDate(cra.période, cra.jour)}</strong> - 
                    {cra.type_imputation} ({cra.durée} jour{cra.durée > 1 ? 's' : ''})
                  </div>
                  <div style={{ marginBottom: 8 }}>{cra.commentaire}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Tag color={getCraStatusColor(cra.statut)}>
                        {cra.statut.charAt(0).toUpperCase() + cra.statut.slice(1)}
                      </Tag>
                      {cra.date_soumission && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          Soumis le {new Date(cra.date_soumission).toLocaleString()}
                        </Text>
                      )}
                    </span>
                    {cra.project_name && <Tag color="blue">{cra.project_name}</Tag>}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        ) : (
          <Empty 
            description="Aucun CRA ne correspond à vos critères de recherche" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Drawer>
    );
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} justify="space-between" align="middle">
            <Col xs={24} md={12}>
              <Title level={4} style={{ margin: 0 }}>Mes projets</Title>
              <Text type="secondary">
                {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''}
                {selectedStatus !== 'all' ? ` avec le statut "${selectedStatus}"` : ''}
              </Text>
            </Col>
            
            <Col xs={24} md={12} style={{ textAlign: "right" }}>
              <Space>
                <Tooltip title="Vue en cartes">
                  <Button
                    type={viewMode === "card" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("card")}
                  />
                </Tooltip>
                <Tooltip title="Vue en tableau">
                  <Button
                    type={viewMode === "table" ? "primary" : "default"}
                    icon={<BarsOutlined />}
                    onClick={() => setViewMode("table")}
                  />
                </Tooltip>
                <Tooltip title="Actualiser">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchProjects}
                    loading={loading}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Search
                placeholder="Rechercher un projet..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(value) => setSearchText(value)}
              />
            </Col>
            
            <Col xs={24} md={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="Filtrer par statut"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
              >
                <Option value="all">Tous les statuts</Option>
                <Option value="En cours">En cours</Option>
                <Option value="En attente">En attente</Option>
                <Option value="Planifié">Planifié</Option>
                <Option value="Terminé">Terminé</Option>
                <Option value="Bloqué">Bloqué</Option>
              </Select>
            </Col>
            
            <Col xs={24} md={8}>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["Date début", "Date fin"]}
                value={dateRange}
                onChange={setDateRange}
                allowClear
              />
            </Col>
            
            {/* <Col xs={24} md={2}>
              <Button 
                icon={<FilterOutlined />} 
                onClick={resetFilters}
                disabled={!searchText && selectedStatus === "all" && !dateRange}
              >
                Réinitialiser
              </Button>
            </Col> */}
          </Row>
        </div>

        {viewMode === "card" ? <ProjectCards /> : <ProjectTable />}
        <ProjectDetailsModal />
        <CraImputationModal />
        <CraHistoryDrawer />
      </Card>
    </div>
  );
};

export {ConsultantProjects};