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
  Form,
  Result,
  Switch,
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
  ShopOutlined,
  DollarOutlined,
  ApartmentOutlined,
  ContactsOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ReloadOutlined,
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
import moment from "moment";
import "moment/locale/fr";
import axios from "axios";
moment.locale("fr"); // Set French locale

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const InterfaceCommercial = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    ID_collab: localStorage.getItem("userId") || "",
    Nom: localStorage.getItem("userName")?.split(" ")[1] || "Commercial",
    Prenom: localStorage.getItem("userName")?.split(" ")[0] || "",
    email: "commercial@example.com",
    Poste: "Responsable Commercial",
    ID_ESN: localStorage.getItem("esnId") || "1",
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const [consultants, setConsultants] = useState([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantsError, setConsultantsError] = useState(null);
  // Projects related state
  const [projectsModalVisible, setProjectsModalVisible] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantProjects, setConsultantProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [frenchHolidays, setFrenchHolidays] = useState([]);
  const [moroccanHolidays, setMoroccanHolidays] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("FR"); // Default to France
  const [showHolidays, setShowHolidays] = useState(true); // State to toggle holidays display
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [clientFilter, setClientFilter] = useState("");

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

    // Check authentication
    const checkAuth = () => {
      const token = localStorage.getItem("unifiedToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!token || !userId || userRole !== "commercial") {
        message.error(
          "Vous devez être connecté en tant que commercial pour accéder à cette page"
        );
        navigate("/unified-login");
        return false;
      }

      // Ensure we don't have any consultant-specific localStorage items
      localStorage.removeItem("consultantProjects");
      localStorage.removeItem("projectsData");

      return true;
    };

    if (!checkAuth()) return; // Load user data
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("unifiedToken");
        const userId = localStorage.getItem("userId");

        // For testing purposes, use mock data if the API isn't available yet
        // In a production environment, you would uncomment the API fetch below
        /*
        const response = await fetch(`${Endpoint()}/api/commercial/profile/${userId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          message.error("Impossible de charger les données utilisateur");
        }
        */

        // Mock data for development
        const mockUserData = {
          ID_collab: userId,
          Nom: localStorage.getItem("userName")?.split(" ")[1] || "Commercial",
          Prenom: localStorage.getItem("userName")?.split(" ")[0] || "",
          email: "commercial@example.com",
          Poste: "Responsable Commercial",
          ID_ESN: localStorage.getItem("esnId") || "1",
          Date_inscription: "2025-05-01",
          // Add any other fields your application needs
        };

        setUserData(mockUserData);
      } catch (error) {
        console.error("Error loading user data:", error);
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    // Load notifications
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem("unifiedToken");
        const userId = localStorage.getItem("userId");

        // For testing purposes, use mock data if the API isn't available yet
        // In a production environment, you would uncomment the API fetch below
        /*
        const response = await fetch(`${Endpoint()}/api/notifications/commercial/${userId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => !n.read).length);
        }
        */

        // Mock notifications for development
        const mockNotifications = [
          {
            id: 1,
            title: "Nouvelle opportunité",
            message: "Une nouvelle opportunité a été ajoutée pour EntrepriseB",
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 2,
            title: "Contrat signé",
            message: "Le contrat avec SociétéA a été signé",
            date: new Date(Date.now() - 86400000).toISOString(),
            read: true,
          },
          {
            id: 3,
            title: "Rappel: Réunion",
            message: "Réunion avec l'équipe commerciale demain à 10h",
            date: new Date(Date.now() - 172800000).toISOString(),
            read: false,
          },
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter((n) => !n.read).length);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadUserData();
    loadNotifications();

    // Extract current page from URL if available
    const path = location.pathname.split("/").pop();
    if (path && path !== "interface-commercial") {
      // Ensure "projects" isn't set as the current page in commercial interface
      if (path === "projects") {
        navigate("/interface-commercial");
      } else {
        setCurrentPage(path);
      }
    }

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, [navigate, location]);
  useEffect(() => {
    if (
      currentPage === "consultants" &&
      !consultants.length &&
      !consultantsLoading
    ) {
      fetchConsultants();
    }
  }, [currentPage, consultants.length, consultantsLoading]);

  // Effect to fetch holidays when the selected month changes while the projects modal is open
  useEffect(() => {
    if (projectsModalVisible && selectedMonth) {
      fetchHolidays(selectedMonth);
    }
  }, [selectedMonth, projectsModalVisible]);

  // Effect to update projects when holiday settings change
  useEffect(() => {
    if (consultantProjects.length > 0) {
      const holidays =
        selectedCountry === "FR" ? frenchHolidays : moroccanHolidays;
      updateProjectsWithHolidays(holidays);
    }
  }, [selectedCountry, showHolidays]);

  const handleLogout = () => {
    Modal.confirm({
      title: "Déconnexion",
      content: "Êtes-vous sûr de vouloir vous déconnecter ?",
      onOk: () => {
        // Clear all authentication and role-specific data
        localStorage.removeItem("unifiedToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("esnId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userType");
        localStorage.removeItem("consultantProjects"); // Clear consultant-specific data if present
        localStorage.removeItem("projectsData"); // Clear consultant-specific data if present

        message.success("Déconnexion réussie");
        navigate("/unified-login");
      },
    });
  };

  const fetchConsultants = async () => {
    setConsultantsLoading(true);
    setConsultantsError(null);
    try {
      const token = localStorage.getItem("unifiedToken");
      const commercialId = localStorage.getItem("userId");

      const response = await fetch(
        `${Endpoint()}/api/consultants-by-commercial/?commercial_id=${commercialId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des consultants");
      }

      const data = await response.json();
      setConsultants(data.data || []);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      setConsultantsError(error.message);
      message.error("Impossible de charger la liste des consultants");
    } finally {
      setConsultantsLoading(false);
    }
  };

  // Function to toggle collapse state of a client group
  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Function to toggle all groups at once
  const toggleAllGroups = (collapsed = false) => {
    if (!consultantProjects.length) return;

    // Get all client groups
    const clientGroups = {};
    consultantProjects.forEach((project) => {
      const clientId = project.client_id || project.clientId || "unknown";
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = true;
      }
    });

    // Set all groups to the specified collapsed state
    const newCollapsedState = {};
    Object.keys(clientGroups).forEach((key) => {
      newCollapsedState[key] = collapsed;
    });

    setCollapsedGroups(newCollapsedState);
  };

  const fetchConsultantProjects = async (
    consultant,
    period = selectedMonth
  ) => {
    setProjectsLoading(true);
    setProjectsError(null);
    setSelectedConsultant(consultant);
    setProjectsModalVisible(true);

    if (period) {
      setSelectedMonth(period);
    }
    try {
      const token = localStorage.getItem("unifiedToken");
      const consultantId = consultant.ID_collab;

      // Format period for API (MM_YYYY)
      const formattedPeriod = period.format("MM_YYYY");

      // Using the same endpoint structure as in MonthlyActivityReport
      const response = await axios.get(
        `${Endpoint()}/api/projects-by-consultant-period/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            consultant_id: consultantId,
            period: formattedPeriod,
          },
        }
      );
      if (response.data?.status) {
        const projectsData = response.data.data || [];

        // Transform data to include client grouping information
        // Update in your fetchConsultantProjects function:
        const transformedData = projectsData.map((project) => ({
          ...project,
          key:
            project.id || `project_${Math.random().toString(36).substr(2, 9)}`,
          client_name: project.client_name || "Client non spécifié",
          client_id: project.client_id || "unknown",
          titre: project.titre || project.nom || "Projet sans titre",
          status: project.status || "En cours",
          // Add contract information with CRA details
          cra_info: project.cra_info || null,
          // Add CRA related data with better property mapping
          craCount: project.days_count || 0,
          craStatus: project.cra_status || "",
          craData: project.daily_data || [],
          // Normalize daily_data to handle different API formats
          daily_data: (project.daily_data || []).map((day) => ({
            ...day,
            // Ensure consistent property names
            date:
              day.date || day.jour
                ? moment(selectedMonth).date(day.jour).format("YYYY-MM-DD")
                : "",
            hours: day.hours || day.Durée || day.duration || 0,
            comment: day.comment || day.commentaire || "",
          })),
        }));

        setConsultantProjects(transformedData);

        // Fetch holidays after loading project data
        fetchHolidays(period);
      } else {
        setConsultantProjects([]);
      }
    } catch (error) {
      console.error("Error fetching consultant projects:", error);
      setProjectsError(error.message);
      message.error("Impossible de charger les projets du consultant");
    } finally {
      setProjectsLoading(false);
    }
  };

  // Function to fetch holidays from Nager.Date API
  const fetchHolidays = async (date) => {
    try {
      const year = date.year();
      const countryCodeFR = "FR"; // France
      const countryCodeMA = "MA"; // Morocco

      // Fetch French holidays
      const frenchResponse = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCodeFR}`
      );

      // Fetch Moroccan holidays
      const moroccanResponse = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCodeMA}`
      );

      // Process holidays for the selected month
      const month = date.month() + 1; // Month is 0-indexed in moment

      const filteredFrenchHolidays = frenchResponse.data
        .filter((holiday) => {
          const holidayDate = moment(holiday.date);
          return holidayDate.month() + 1 === month;
        })
        .map((holiday) => ({
          day: moment(holiday.date).date(),
          name: holiday.name,
          localName: holiday.localName,
          countryCode: holiday.countryCode,
        }));

      const filteredMoroccanHolidays = moroccanResponse.data
        .filter((holiday) => {
          const holidayDate = moment(holiday.date);
          return holidayDate.month() + 1 === month;
        })
        .map((holiday) => ({
          day: moment(holiday.date).date(),
          name: holiday.name,
          localName: holiday.localName,
          countryCode: holiday.countryCode,
        }));

      setFrenchHolidays(filteredFrenchHolidays);
      setMoroccanHolidays(filteredMoroccanHolidays);

      // Update project data with holiday information if we have projects loaded
      if (consultantProjects.length > 0) {
        updateProjectsWithHolidays(
          selectedCountry === "FR"
            ? filteredFrenchHolidays
            : filteredMoroccanHolidays
        );
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      message.error("Impossible de charger les jours fériés");
    }
  };

  // Function to update project data with holiday information
  const updateProjectsWithHolidays = (holidays) => {
    // Only update if we actually have projects
    if (!consultantProjects.length) return;

    // Create a copy of the projects data
    const updatedProjects = [...consultantProjects];

    // Update each project with holiday information
    updatedProjects.forEach((project) => {
      if (project.craData && Array.isArray(project.craData)) {
        // Update each day in the project with holiday info
        project.craData = project.craData.map((day) => {
          const dayNumber = parseInt(day.jour);
          const isHoliday = holidays.some(
            (holiday) => holiday.day === dayNumber
          );
          const holiday = holidays.find((h) => h.day === dayNumber);

          if (isHoliday && showHolidays) {
            return {
              ...day,
              isHoliday: true,
              holidayName: holiday?.localName || holiday?.name,
            };
          } else {
            // Remove holiday flag if holidays are turned off
            return {
              ...day,
              isHoliday: showHolidays ? day.isHoliday : false,
              holidayName: showHolidays ? day.holidayName : undefined,
            };
          }
        });
      }
    });

    setConsultantProjects(updatedProjects);
  };

  // Toggle between French and Moroccan holidays
  const toggleCountry = () => {
    const newCountry = selectedCountry === "FR" ? "MA" : "FR";
    setSelectedCountry(newCountry);

    // Update project data with holidays from the selected country
    if (consultantProjects.length > 0) {
      const holidays = newCountry === "FR" ? frenchHolidays : moroccanHolidays;
      updateProjectsWithHolidays(holidays);
    }
  };

  // Function to count visible client groups after filtering
  const countVisibleClientGroups = () => {
    if (!clientFilter || !consultantProjects.length) return null;

    // Group projects by client
    const clientGroups = {};
    consultantProjects.forEach((project) => {
      const clientId = project.client_id || project.clientId || "unknown";
      const clientName =
        project.client_name || project.client || "Client non spécifié";

      if (!clientGroups[clientId]) {
        clientGroups[clientId] = { name: clientName };
      }
    });

    // Count how many match the filter
    const matchingGroups = Object.values(clientGroups).filter((group) =>
      group.name.toLowerCase().includes(clientFilter.toLowerCase())
    ).length;

    return {
      total: Object.keys(clientGroups).length,
      matching: matchingGroups,
    };
  };

  const userMenu = (
    <Menu>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Déconnexion
      </Menu.Item>
    </Menu>
  );

  const notificationMenu = (
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
      {notifications.length > 0 ? (
        notifications.slice(0, 3).map((notification) => (
          <Menu.Item
            key={notification.id}
            style={{
              background: notification.read ? "transparent" : "#f0f7ff",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <Badge dot={!notification.read} offset={[0, 5]}>
                <Avatar
                  size="small"
                  style={{ backgroundColor: "#1890ff", marginRight: 8 }}
                  icon={<BellOutlined />}
                />
              </Badge>
              <div>
                <div
                  style={{ fontWeight: notification.read ? "normal" : "bold" }}
                >
                  {notification.title}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {notification.message}
                </div>
                <div
                  style={{ fontSize: "11px", color: "#bbb", marginTop: "5px" }}
                >
                  {new Date(notification.date).toLocaleString()}
                </div>
              </div>
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item disabled>
          <Empty
            description="Aucune notification"
            style={{ margin: "20px 0" }}
          />
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="view-all" style={{ textAlign: "center" }}>
        <RouterLink
          to="/interface-commercial/notifications"
          onClick={() => setCurrentPage("notifications")}
        >
          Voir toutes les notifications
        </RouterLink>
      </Menu.Item>
    </Menu>
  );

  // Dashboard Content
  const renderDashboard = () => {
    return (
      <div className="dashboard-content" style={{ animation: "fadeIn 0.5s" }}>
        <Title level={4}>Tableau de bord Commercial</Title>
      </div>
    );
  };

  // Consultants Content - New function to display consultants
  const renderConsultants = () => {
    const columns = [
      {
        title: "Nom",
        key: "name",
        render: (_, record) => `${record.Prenom} ${record.Nom}`,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Poste",
        dataIndex: "Poste",
        key: "poste",
      },
      {
        title: "Statistiques",
        key: "stats",
        render: (_, record) => (
          <Space direction="vertical" size="small">
            <span>
              <Badge
                status="default"
                text={`${record.statistics?.client_count || 0} Clients`}
              />
            </span>
          </Space>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size="small">
            <Button
              icon={<ProjectOutlined />}
              size="small"
              onClick={() => fetchConsultantProjects(record)}
            >
              Projets
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <div className="consultants-content" style={{ animation: "fadeIn 0.5s" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4}>Gestion des Consultants</Title>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchConsultants}
            loading={consultantsLoading}
          >
            Actualiser
          </Button>
        </div>

        <Card>
          {consultantsError && (
            <Alert
              message="Erreur"
              description={consultantsError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" type="primary" onClick={fetchConsultants}>
                  Réessayer
                </Button>
              }
            />
          )}

          <Table
            dataSource={consultants}
            columns={columns}
            rowKey="ID_collab"
            loading={consultantsLoading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: consultantsLoading ? (
                "Chargement..."
              ) : (
                <Empty
                  description="Aucun consultant trouvé"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
      </div>
    );
  };

  // Main content based on current page
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            Chargement de votre espace commercial...
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return renderDashboard();
      case "consultants":
        return renderConsultants();
      default:
        return renderDashboard();
    }
  };

  // Define menu items
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Tableau de bord",
    },
    {
      key: "consultants",
      icon: <UserOutlined />,
      label: "Consultants",
    },
  ];

  // Handle menu selection
  const handleMenuClick = (e) => {
    setCurrentPage(e.key);
    navigate(`/interface-commercial/${e.key === "dashboard" ? "" : e.key}`);
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
                  {userData?.Nom || ""} {userData?.Prenom || ""}
                </Text>
                <Tag color="blue">{userData?.Poste || "Commercial"}</Tag>
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
            <Breadcrumb.Item>Commercial</Breadcrumb.Item>
            <Breadcrumb.Item>
              {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
            </Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: "flex", alignItems: "center" }}>
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
                  {userData
                    ? `${userData.Nom} ${userData.Prenom}`
                    : "Commercial"}
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
          Maghreb IT Connect ©{new Date().getFullYear()} - Espace Commercial
        </Footer>
      </Layout>

      {/* Modal to display consultant projects */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ProjectOutlined style={{ marginRight: 8 }} />
            {selectedConsultant
              ? `Projets de ${selectedConsultant.Prenom} ${selectedConsultant.Nom}`
              : "Projets du consultant"}
          </div>
        }
        open={projectsModalVisible}
        onCancel={() => setProjectsModalVisible(false)}
        width="100vw" // Set width to 100% of viewport width
        style={{ top: 0, padding: 0, maxWidth: "100vw" }} // Position at the top and remove padding
        styles={{
          // Control inner styles
          body: {
            height: "calc(100vh - 55px - 53px)", // Adjust height considering header and footer
            overflowY: "auto", // Make body scrollable
            padding: "24px", // Re-add padding to the body if needed
          },
        }}
        footer={[
          <Button key="close" onClick={() => setProjectsModalVisible(false)}>
            Fermer
          </Button>,
        ]}
      >
        {projectsLoading ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Chargement des projets...</div>
          </div>
        ) : projectsError ? (
          <Alert
            message="Erreur"
            description={projectsError}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  selectedConsultant &&
                  fetchConsultantProjects(selectedConsultant)
                }
              >
                Réessayer
              </Button>
            }
          />
        ) : consultantProjects.length === 0 ? (
          <Empty description="Aucun projet trouvé pour ce consultant" />
        ) : (
          <Card className="consultant-cra-projects">
            {" "}
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {" "}
              <div style={{ display: "flex", alignItems: "center" }}>
                <Text strong>Période: </Text>{" "}
                <input
                  type="month" // Changed to type="month"
                  value={
                    selectedMonth ? selectedMonth.format("YYYY-MM") : "" // Format for input type="month"
                  }
                  style={{
                    marginLeft: 8,
                    width: 150,
                    height: "32px",
                    padding: "4px 11px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "2px",
                  }}
                  onChange={(e) => {
                    const monthString = e.target.value; // Value will be in "YYYY-MM" format
                    if (monthString) {
                      const newDate = moment(monthString, "YYYY-MM");
                      setSelectedMonth(newDate);
                      if (selectedConsultant) {
                        message.info(
                          `Chargement des données pour ${newDate.format(
                            "MMMM YYYY"
                          )}`
                        );
                        fetchConsultantProjects(selectedConsultant, newDate);
                      }
                    } else {
                      setSelectedMonth(null);
                      if (selectedConsultant) {
                        // Optionally refetch or clear data if date is cleared
                        setConsultantProjects([]); // Example: clear projects
                      }
                    }
                  }}
                />
                {/* Holiday toggle controls */}
                <div
                  style={{
                    marginLeft: 16,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Text strong>Jours fériés: </Text>
                  <Switch
                    size="small"
                    checked={showHolidays}
                    onChange={(checked) => {
                      setShowHolidays(checked);
                      // Update projects with holiday visibility
                      if (consultantProjects.length > 0) {
                        const holidays =
                          selectedCountry === "FR"
                            ? frenchHolidays
                            : moroccanHolidays;
                        updateProjectsWithHolidays(holidays);
                      }
                    }}
                    style={{ marginLeft: 8, marginRight: 8 }}
                  />

                  {/* FR/MA country toggle */}
                  <Tooltip
                    title={`Calendrier ${
                      selectedCountry === "FR" ? "Français" : "Marocain"
                    }`}
                  >
                    <Button
                      type="default"
                      size="small"
                      onClick={toggleCountry}
                      disabled={!showHolidays}
                    >
                      {selectedCountry}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className="report-content">
              {clientFilter && (
                <Alert
                  style={{ marginBottom: 16 }}
                  message={
                    <div>
                      Filtre actif: <strong>{clientFilter}</strong>
                      {countVisibleClientGroups() && (
                        <span style={{ marginLeft: 8 }}>
                          ({countVisibleClientGroups().matching} sur{" "}
                          {countVisibleClientGroups().total} clients affichés)
                        </span>
                      )}
                    </div>
                  }
                  type="info"
                  showIcon
                  closable
                  onClose={() => setClientFilter("")}
                />
              )}
              <Table
                columns={[
                  {
                    title: "Client",
                    dataIndex: "client",
                    key: "client",
                    width: 150,
                    fixed: "left",
                    render: (text, record) => {
                      if (record.type === "client_group_header") {
                        return (
                          <div
                            onClick={() => toggleGroupCollapse(record.groupId)}
                            style={{
                              fontSize: "16px",
                              color: "#1890ff",
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            <span style={{ marginRight: "8px" }}>
                              {collapsedGroups[record.groupId] ? "▶️" : "🔽"}
                            </span>
                            {text}
                            {record.projectCount > 1 && (
                              <span
                                style={{
                                  marginLeft: "8px",
                                  fontSize: "12px",
                                  background: "#1890ff",
                                  color: "white",
                                  borderRadius: "10px",
                                  padding: "0 6px",
                                  display: "inline-block",
                                }}
                              >
                                {record.projectCount}
                              </span>
                            )}
                          </div>
                        );
                      }

                      // if (record.type === "project") {
                      //   return (
                      //     <div style={{ paddingLeft: "26px" }}>
                      //       <Tooltip title="Voir détails">
                      //         <Button
                      //           type="link"
                      //           size="small"
                      //           icon={<EyeOutlined />}
                      //           style={{
                      //             fontSize: "16px",
                      //             padding: "0",
                      //             height: "auto",
                      //           }}
                      //         />
                      //       </Tooltip>
                      //       {text || "Sans nom"}
                      //     </div>
                      //   );
                      // }

                      if (
                        record.type === "section" ||
                        record.type === "total"
                      ) {
                        return <strong>{text}</strong>;
                      }

                      return text;
                    },
                  },
                  {
                    title: "Contrat",
                    dataIndex: "contract",
                    key: "contract",
                    width: 200,
                    fixed: "left",
                    render: (text, record) => {
                      if (
                        record.type === "client_group_header" ||
                        record.type === "section" ||
                        record.type === "total"
                      ) {
                        return "";
                      }

                      return (
                        <div>
                          <div style={{ fontSize: "14px" }}>
                            {record.titre || record.name || "Sans titre"}
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    dataIndex: "total",
                    key: "total",
                    width: 80,
                    align: "center",
                    fixed: "left",
                    render: (text, record) => {
                      if (
                        record.type === "section" ||
                        record.type === "total"
                      ) {
                        return (
                          <strong
                            style={{
                              display: "block",
                              textAlign: "center",
                              color: "#1890ff",
                            }}
                          >
                            {typeof text === "number"
                              ? text.toString().replace(".", ",")
                              : text}
                          </strong>
                        );
                      }
                      return (
                        <span style={{ textAlign: "center", display: "block" }}>
                          {text
                            ? typeof text === "number"
                              ? text.toString().replace(".", ",")
                              : text
                            : "0"}
                        </span>
                      );
                    },
                  },
                  {
                    title: "Validation",
                    key: "validation",
                    width: 100,
                    align: "center",
                    fixed: "right",
                    render: (_, record) => {
                      if (record.type === "project") {
                        return (
                          <Button
                            type="primary"
                            size="small"
                            danger={record.craStatus === "Validée"}
                            disabled={record.craStatus === "Validée"}
                            onClick={() => {
                              Modal.confirm({
                                title: "Validation de CRA",
                                content: `Êtes-vous sûr de vouloir valider la CRA pour le projet "${
                                  record.titre || record.name
                                }"?`,
                                okText: "Valider",
                                cancelText: "Annuler",
                                onOk: async () => {
                                  try {
                                    const token =
                                      localStorage.getItem("unifiedToken");
                                    const projectId = record.id;
                                    const consultantId =
                                      selectedConsultant?.ID_collab;
                                    const period =
                                      selectedMonth.format("MM_YYYY");

                                    // This would be the real API call in production
                                    /*
                                  await axios.post(
                                    `${Endpoint()}/api/validate-project-cra/`,
                                    { 
                                      project_id: projectId,
                                      consultant_id: consultantId,
                                      period: period,
                                      validated_by: userData.ID_collab,
                                      validation_type: 'commercial'
                                    },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  */

                                    // For demo purposes, show success message
                                    message.success(
                                      `CRA validée pour le projet "${
                                        record.titre || record.name
                                      }"`
                                    );

                                    // Update local state to reflect validation
                                    const updatedProjects =
                                      consultantProjects.map((p) => {
                                        if (p.id === record.id) {
                                          return { ...p, craStatus: "Validée" };
                                        }
                                        return p;
                                      });
                                    setConsultantProjects(updatedProjects);
                                  } catch (error) {
                                    console.error(
                                      "Error validating CRA:",
                                      error
                                    );
                                    message.error(
                                      "Erreur lors de la validation de la CRA"
                                    );
                                  }
                                },
                              });
                            }}
                          >
                            {record.craStatus === "Validée"
                              ? "Validée"
                              : "Valider"}
                          </Button>
                        );
                      }
                      return "";
                    },
                  }, // Generate days of selected month
                  ...Array.from(
                    { length: moment(selectedMonth).daysInMonth() },
                    (_, i) => {
                      const day = i + 1;
                      const date = moment(selectedMonth).date(day);
                      const isWeekend = date.day() === 0 || date.day() === 6;

                      return {
                        title: (
                          <div>
                            <div>{day}</div>
                            <div>
                              {["D", "L", "M", "M", "J", "V", "S"][date.day()]}
                            </div>
                          </div>
                        ),
                        dataIndex: `day_${day}`,
                        key: `day_${day}`,
                        align: "center",
                        width: 40,
                        className: isWeekend ? "weekend-column" : "", // In your column definition where you render daily cells, replace the current render function:
                        render: (text, record) => {
                          // For group headers, show empty cells
                          if (
                            record.type === "client_group_header" ||
                            record.type === "section" ||
                            record.type === "total"
                          ) {
                            return "";
                          }

                          // Get day of month
                          const dayNumber = day;
                          const date = moment(selectedMonth).date(dayNumber);
                          const dateKey = date.format("YYYY-MM-DD");

                          // Check if weekend
                          const isWeekend =
                            date.day() === 0 || date.day() === 6;

                          // Check if this is a holiday
                          const isHoliday =
                            showHolidays &&
                            (selectedCountry === "FR"
                              ? frenchHolidays
                              : moroccanHolidays
                            ).some((h) => h.day === dayNumber);

                          const holiday = (
                            selectedCountry === "FR"
                              ? frenchHolidays
                              : moroccanHolidays
                          ).find((h) => h.day === dayNumber);

                          if (isWeekend) {
                            return (
                              <div
                                style={{
                                  backgroundColor: "#f0f0f0",
                                  height: "100%",
                                  width: "100%",
                                  borderRadius: "4px",
                                }}
                              ></div>
                            );
                          }

                          if (isHoliday && showHolidays) {
                            return (
                              <Tooltip
                                title={holiday?.localName || holiday?.name}
                              >
                                <div
                                  style={{
                                    backgroundColor: "#f6ffed",
                                    height: "100%",
                                    width: "100%",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    color: "#389e0d",
                                  }}
                                >
                                  F
                                </div>
                              </Tooltip>
                            );
                          }

                          // Improved CRA data handling for daily cells
                          if (record.type === "project") {
                            // Check if this day has CRA data
                            const dailyData =
                              record.craData &&
                              record.craData.find((d) => {
                                // Try different date formats that might come from API
                                return (
                                  d.date === dateKey ||
                                  d.date === date.format("DD/MM/YYYY") ||
                                  d.jour === dayNumber.toString()
                                );
                              });

                            const hasActivity =
                              dailyData &&
                              (dailyData.hours > 0 ||
                                dailyData.Durée > 0 ||
                                dailyData.duration > 0);

                            if (hasActivity) {
                              // Display CRA hours/duration in the cell
                              const duration =
                                dailyData.hours ||
                                dailyData.Durée ||
                                dailyData.duration ||
                                0;
                              return (
                                <Tooltip
                                  title={`${
                                    record.titre || record.name
                                  }: ${duration} heures travaillées`}
                                >
                                  <div
                                    style={{
                                      backgroundColor: "#e6f7ff",
                                      cursor: "pointer",
                                      height: "24px",
                                      width: "100%",
                                      borderRadius: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    onClick={() => {
                                      Modal.info({
                                        title: `Détail d'activité - ${dayNumber}/${date.format(
                                          "MM/YYYY"
                                        )}`,
                                        content: (
                                          <div>
                                            <p>
                                              <strong>Projet:</strong>{" "}
                                              {record.titre || record.name}
                                            </p>
                                            <p>
                                              <strong>Client:</strong>{" "}
                                              {record.client_name ||
                                                record.client}
                                            </p>
                                            <p>
                                              <strong>Type d'activité:</strong>{" "}
                                              {dailyData.activity_type ||
                                                "Jour travaillé"}
                                            </p>
                                            <p>
                                              <strong>Durée:</strong> {duration}{" "}
                                              heure(s)
                                            </p>
                                            <p>
                                              <strong>Commentaire:</strong>{" "}
                                              {dailyData.comment ||
                                                dailyData.commentaire ||
                                                "Pas de commentaire"}
                                            </p>
                                            <p>
                                              <strong>Statut:</strong>{" "}
                                              <Tag
                                                color={
                                                  dailyData.validated
                                                    ? "green"
                                                    : "orange"
                                                }
                                              >
                                                {dailyData.validated
                                                  ? "Validé"
                                                  : "En attente"}
                                              </Tag>
                                            </p>
                                          </div>
                                        ),
                                      });
                                    }}
                                  >
                                    <span>{duration}</span>
                                  </div>
                                </Tooltip>
                              );
                            }
                          }

                          return (
                            <div
                              style={{
                                border: "1px dashed #d9d9d9",
                                height: "24px",
                                width: "100%",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            ></div>
                          );
                        },
                      };
                    }
                  ),
                ]}
                dataSource={(() => {
                  // Group projects by client
                  const clientGroups = {};
                  consultantProjects.forEach((project) => {
                    const clientId =
                      project.client_id || project.clientId || "unknown";
                    const clientName =
                      project.client_name ||
                      project.client ||
                      "Client non spécifié";

                    // Apply client filter if set
                    if (
                      clientFilter &&
                      !clientName
                        .toLowerCase()
                        .includes(clientFilter.toLowerCase())
                    ) {
                      return; // Skip this project if it doesn't match the filter
                    }

                    if (!clientGroups[clientId]) {
                      clientGroups[clientId] = {
                        id: clientId,
                        name: clientName,
                        projects: [],
                        totalDays: 0,
                      };
                    }
                    // Add project to this client group
                    clientGroups[clientId].projects.push({
                      ...project,
                      type: "project",
                      total:
                        project.days_count ||
                        Math.floor(Math.random() * 20) + 1, // Use real data if available
                    });

                    // Add to total days for this client
                    clientGroups[clientId].totalDays +=
                      project.days_count || Math.floor(Math.random() * 20) + 1;
                  });

                  // Convert to table data
                  const data = [];
                  let grandTotal = 0;
                  Object.values(clientGroups).forEach((clientGroup, index) => {
                    // Add client group header row
                    data.push({
                      key: `client_${clientGroup.id}`,
                      type: "client_group_header",
                      client: clientGroup.name,
                      projectCount: clientGroup.projects.length,
                      totalDays: clientGroup.totalDays,
                      groupId: clientGroup.id, // Added for collapse functionality
                    });

                    // Check if this group is collapsed
                    if (!collapsedGroups[clientGroup.id]) {
                      // Only add projects if group is not collapsed
                      clientGroup.projects.forEach((project) => {
                        data.push({
                          key: `project_${project.id}`,
                          ...project,
                        });

                        // Add to grand total
                        grandTotal += project.total || 0;
                      });
                    } else {
                      // If collapsed, still add to grand total
                      clientGroup.projects.forEach((project) => {
                        grandTotal += project.total || 0;
                      });
                    }
                  });

                  // Add grand total row
                  if (data.length > 0) {
                    data.push({
                      key: "grand_total",
                      type: "total",
                      client: "Total",
                      contract: "",
                      total: grandTotal,
                    });
                  }

                  // Add "no activity" row
                  data.push({
                    key: "no_activity",
                    type: "section",
                    client: "Pas d'activité",
                    contract: "",
                    total: "0",
                  });

                  return data;
                })()}
                bordered
                size="middle"
                pagination={false}
                scroll={{ x: "max-content" }}
                rowClassName={(record) => {
                  if (record.type === "section") return "section-row";
                  if (record.type === "client-group-header")
                    return "client-group-header-row";
                  if (record.type === "total") return "grand-total-row";
                  return "";
                }}
                className="cra-monthly-table"
              />{" "}
              {/* Enhanced Legend similar to MonthlyActivityReport */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <Tag
                    color="#f0f0f0"
                    style={{ marginRight: 8, color: "black" }}
                  >
                    Week-end
                  </Tag>
                </div>
                <div>
                  <Tag
                    color="#e6f7ff"
                    style={{ marginRight: 8, color: "black" }}
                  >
                    Jour travaillé
                  </Tag>
                </div>
                <div>
                  <Tag
                    color="#fff"
                    style={{
                      marginRight: 8,
                      border: "1px dashed #d9d9d9",
                      color: "black",
                    }}
                  >
                    Aucune activité
                  </Tag>
                </div>
              </div>
            </div>{" "}
            {/* CSS for styling similar to MonthlyActivityReport */}
            <style jsx>{`
              .cra-monthly-table .section-row {
                background-color: #fafafa;
                font-weight: bold;
              }
              .cra-monthly-table .client-group-header-row {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .cra-monthly-table .grand-total-row {
                background-color: #e6f7ff;
                font-weight: bold;
              }
              .cra-monthly-table .weekend-column {
                background-color: #f9f9f9;
              }
              .cra-monthly-table .ant-table-cell {
                padding: 8px 4px;
              }
              .holiday-cell {
                background-color: #f6ffed !important;
              }
              .absence-cell {
                background-color: #fff1f0 !important;
              }
              .cra-status-saisir {
                background-color: #fff7e6 !important;
              }
              .cra-status-prestataire,
              .cra-status-client {
                background-color: #87e8de !important;
              }
              .cra-status-valide {
                background-color: #d9f7be !important;
              }
              .future-date-cell {
                background-color: #f0f0f0 !important;
                opacity: 0.7;
              }
              .absence-check-cell {
                background-color: #ff7875 !important;
                color: white;
              }
              .absence-check-cell.conge {
                background-color: #fffbe6 !important;
                color: black;
              }
              .absence-check-cell.mixed {
                background: linear-gradient(
                  135deg,
                  #fffbe6 50%,
                  #ff7875 50%
                ) !important;
                color: black;
              }
            `}</style>
          </Card>
        )}
      </Modal>
    </Layout>
  );
};

export default InterfaceCommercial;
