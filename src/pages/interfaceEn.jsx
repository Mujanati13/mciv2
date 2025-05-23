import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  LogoutOutlined,
  MacCommandOutlined,
  NotificationOutlined,
  UserOutlined,  FileOutlined,
  UsergroupAddOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SearchOutlined,
  FileDoneOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  SolutionOutlined,
  BankOutlined,
  ProjectOutlined,
  CheckOutlined,
  WarningOutlined,
  MoreOutlined,
  MenuOutlined,
  ReloadOutlined,
  FilterOutlined,  CalendarOutlined,
  SortAscendingOutlined
} from "@ant-design/icons";
import {
  Menu,
  Badge,
  AutoComplete,
  Input,
  Breadcrumb,
  List,
  Button,
  message,
  Tag,
  Modal,
  Tooltip,
  Drawer,
  Select,
  notification,
  Empty,
  Card,
  Spin,
  Space,
  DatePicker,
  Typography
} from "antd";

import { Endponit } from "../helper/enpoint";
import parse from "html-react-parser";
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;
import { ClientList } from "../components/en-interface/gestionClient";
import EmployeeManagement from "../components/en-interface/collaborateur";
import ClientDocumentManagement from "../components/en-interface/clientDocumen";
import AppelDOffreInterface from "../components/en-interface/add-condi";
import BonDeCommandeInterface from "../components/en-interface/bdc-list";
import ClientPartenariatInterface from "../components/en-interface/partenariat-list";
import ContractList from "../components/en-interface/contart-en";
import { isEsnLoggedIn, logoutEsn } from "../helper/db";
import { useNavigate, useSearchParams } from "react-router-dom";
import ESNCandidatureInterface from "../components/en-interface/me-codi";
import ESNProfilePageFrancais from "../components/en-interface/profile";
import CraValidation from "../components/en-interface/CraValidation";
import ESNFinancialDashboard from "../components/en-interface/financial-dashboard";
import {
  messaging,
  requestNotificationPermission,
} from "../helper/firebase/config";
import { onMessage } from "firebase/messaging";
import axios from "axios";

// Language Context
const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

// Translations
const translations = {
  fr: {
    dashboard: "Tableau de Bord",
    administration: "Administration",
    profile: "Mon Profil ESN",
    collaborators: "Gestion des Collaborateurs",
    clientManagement: "Mes Clients",
    clientDirectory: "Répertoire Clients",    partnerships: "Partenariats",
    commercialManagement: "Gestion Commerciale",
    tenders: "Appels d'Offres",
    applications: "Mes Candidatures",
    purchaseOrders: "Bons de Commande",
    contracts: "Contrats",
    craValidation: "Validation des CRAs",
    documentation: "Mes Documents",
    clientDocuments: "Documents",
    notifications: "Notifications",
    disconnect: "Déconnexion",
    markAllAsRead: "Marquer tout comme lu",
    markAsRead: "Marquer comme lu",
    search: "Rechercher dans le menu...",
    inactiveAccount: "Compte ESN Inactif",
    inactiveWarning:
      "Votre compte ESN est actuellement inactif. Vous ne pouvez pas accéder à cette section.",
    completeProfile:
      "Pour activer votre compte, complétez toutes les informations requises dans votre profil ESN.",
    limitedAccess:
      "Seule la section \"Mon Profil ESN\" est accessible jusqu'à l'activation de votre compte.",
    accessProfile: "Accéder à mon profil ESN",
    close: "Fermer",
    inactiveProvider: "Compte prestataire inactif",
    activeAccount: "Compte actif",
    menu: "Menu",
    languageFr: "Français",
    languageEn: "English",
    breadcrumbHome: "Accueil",
    notificationReceived: "Nouvelle notification reçue",
    notificationPermissionDenied: "Permissions de notification refusées",
    notificationError: "Erreur de notification",
    // Nouvelles traductions pour l'interface de notification
    searchNotifications: "Rechercher des notifications...",
    filters: "Filtres",
    period: "Période",
    startDate: "Date début",
    endDate: "Date fin",
    sort: "Tri",
    newestFirst: "Plus récentes d'abord",
    oldestFirst: "Plus anciennes d'abord",
    unreadFirst: "Non lues d'abord",
    reset: "Réinitialiser",
    apply: "Appliquer",
    activeFilters: "Filtres actifs",
    clearAll: "Effacer tous",
    noNotifications: "Aucune notification",
    refresh: "Actualiser",
  },
  en: {
    dashboard: "Dashboard",
    administration: "Administration",
    profile: "My ESN Profile",
    collaborators: "Collaborator Management",
    clientManagement: "Client Management",
    clientDirectory: "Client Directory",    partnerships: "Partnerships",
    commercialManagement: "Commercial Management",
    tenders: "Tenders",
    applications: "My Applications",
    purchaseOrders: "Purchase Orders",
    contracts: "Contracts",
    craValidation: "CRA Validation",
    documentation: "Documentation",
    clientDocuments: "Client Documents",
    notifications: "Notifications",
    disconnect: "Logout",
    markAllAsRead: "Mark all as read",
    markAsRead: "Mark as read",
    search: "Search in menu...",
    inactiveAccount: "Inactive ESN Account",
    inactiveWarning:
      "Your ESN account is currently inactive. You cannot access this section.",
    completeProfile:
      "To activate your account, please complete all required information in your ESN profile.",
    limitedAccess:
      'Only the "My ESN Profile" section is accessible until your account is activated.',
    accessProfile: "Access my ESN profile",
    close: "Close",
    inactiveProvider: "Inactive provider account",
    activeAccount: "Active account",
    menu: "Menu",
    languageFr: "Français",
    languageEn: "English",
    breadcrumbHome: "Home",
    notificationReceived: "New notification received",
    notificationPermissionDenied: "Notification permission denied",
    notificationError: "Notification error",
    // New translations for notification interface
    searchNotifications: "Search notifications...",
    filters: "Filters",
    period: "Period",
    startDate: "Start date",
    endDate: "End date",
    sort: "Sort",
    newestFirst: "Newest first",
    oldestFirst: "Oldest first",
    unreadFirst: "Unread first",
    reset: "Reset",
    apply: "Apply",
    activeFilters: "Active filters",
    clearAll: "Clear all",
    noNotifications: "No notifications",
    refresh: "Refresh",
  },
};

const NotificationInterface = ({
  notifications,
  onNotificationsUpdate,
  setupdate,
  t,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const { language } = useContext(LanguageContext);

  // Filter notifications based on search, date range, and sorting preference
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        // Text search filter
        const title = notification.title || "";
        const content = notification.content || "";
        const contentStr = typeof content === "object" ? "" : String(content);

        const textMatch =
          searchText === "" ||
          title.toLowerCase().includes(searchText.toLowerCase()) ||
          contentStr.toLowerCase().includes(searchText.toLowerCase());

        // Date range filter
        let dateMatch = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
          try {
            const notifDate = new Date(notification.timestamp);
            const startDate = new Date(dateRange[0]);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateRange[1]);
            endDate.setHours(23, 59, 59, 999);

            dateMatch = notifDate >= startDate && notifDate <= endDate;
          } catch (error) {
            console.error("Error in date filtering:", error);
            dateMatch = true;
          }
        }

        return textMatch && dateMatch;
      })
      .sort((a, b) => {
        // Sort based on user preference
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);

        if (sortOrder === "newest") {
          return dateB - dateA;
        } else if (sortOrder === "oldest") {
          return dateA - dateB;
        } else if (sortOrder === "unread") {
          return a.read === b.read ? 0 : a.read ? 1 : -1;
        }
        return 0;
      });
  }, [notifications, searchText, dateRange, sortOrder]);

  const resetFilters = () => {
    setSearchText("");
    setDateRange(null);
    setSortOrder("newest");
    setShowFilters(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      setLoading(true);
      const response = await fetch(
        Endponit() + "/api/notification/" + notificationId.id,
        {
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...notificationId,
            status: "Read",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update notification status");
      }

      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId.id
          ? { ...notification, read: true }
          : notification
      );

      onNotificationsUpdate(updatedNotifications);
      setupdate(Math.random() * 100);
      message.success("Notification marked as read");
    } catch (error) {
      console.error("Error updating notification status:", error);
      message.error("Failed to mark notification as read");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const unreadNotifications = notifications.filter((n) => !n.read);

      if (unreadNotifications.length === 0) {
        message.info("No unread notifications");
        setLoading(false);
        return;
      }

      const updatePromises = unreadNotifications.map((notification) =>
        fetch(Endponit() + "/api/updateNotificationStatus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notification.id,
            status: "Read",
          }),
        })
      );

      await Promise.all(updatePromises);

      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        read: true,
      }));

      onNotificationsUpdate(updatedNotifications);
      message.success("All notifications marked as read");
      setupdate(Math.random() * 100);
    } catch (error) {
      console.error("Error updating notification statuses:", error);
      message.error("Failed to mark all notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={t.noNotifications || "No notifications"}
    >
      <Button
        type="primary"
        onClick={() => setupdate(Math.random() * 100)}
        icon={<ReloadOutlined />}
      >
        {t.refresh || "Refresh"}
      </Button>
    </Empty>
  );

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const formatTagDate = (date) => {
    try {
      if (!date) return "";
      return new Date(date).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  return (
    <Card className="shadow-md rounded-lg border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div className="flex items-center flex-grow md:flex-grow-0 w-full md:w-auto">
          <Input
            placeholder={t.searchNotifications || "Search notifications..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            className="mr-4 w-full md:w-64"
            allowClear
          />
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? "primary" : "default"}
            className="mr-2"
          >
            {t.filters || "Filters"}
          </Button>
        </div>
        <div className="flex space-x-3 w-full md:w-auto justify-end">
          <Button
            type="primary"
            onClick={markAllAsRead}
            loading={loading}
            disabled={!notifications.some((n) => !n.read)}
            icon={<CheckOutlined />}
          >
            {t.markAllAsRead}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
          <Space direction="vertical" className="w-full">
            <div className="flex flex-col md:flex-row gap-4 mb-3">
              <div className="flex-1">
                <Text strong className="block mb-1">
                  {t.period || "Period"}
                </Text>
                <RangePicker
                  className="w-full"
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={[
                    t.startDate || "Start date",
                    t.endDate || "End date",
                  ]}
                  allowClear
                  format="DD/MM/YYYY"
                />
              </div>
              <div>
                <Text strong className="block mb-1">
                  {t.sort || "Sort"}
                </Text>
                <Select
                  value={sortOrder}
                  onChange={setSortOrder}
                  style={{ width: 200 }}
                >
                  <Option value="newest">
                    {t.newestFirst || "Newest first"}
                  </Option>
                  <Option value="oldest">
                    {t.oldestFirst || "Oldest first"}
                  </Option>
                  <Option value="unread">
                    {t.unreadFirst || "Unread first"}
                  </Option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={resetFilters} className="mr-2">
                {t.reset || "Reset"}
              </Button>
              <Button type="primary" onClick={() => setShowFilters(false)}>
                {t.apply || "Apply"}
              </Button>
            </div>
          </Space>
        </div>
      )}

      {(searchText || dateRange || sortOrder !== "newest") && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
          <Text strong className="mr-1">
            {t.activeFilters || "Active filters"}:
          </Text>
          {searchText && (
            <Tag
              closable
              onClose={() => setSearchText("")}
              icon={<SearchOutlined />}
            >
              {searchText}
            </Tag>
          )}
          {dateRange && (
            <Tag
              closable
              onClose={() => setDateRange(null)}
              icon={<CalendarOutlined />}
            >
              {formatTagDate(dateRange[0])} - {formatTagDate(dateRange[1])}
            </Tag>
          )}
          {sortOrder !== "newest" && (
            <Tag
              closable
              onClose={() => setSortOrder("newest")}
              icon={<SortAscendingOutlined />}
            >
              {sortOrder === "oldest"
                ? t.oldestFirst || "Oldest first"
                : t.unreadFirst || "Unread first"}
            </Tag>
          )}
          <Button type="link" size="small" onClick={resetFilters}>
            {t.clearAll || "Clear all"}
          </Button>
        </div>
      )}

      <Spin spinning={loading}>
        {filteredNotifications.length === 0 ? (
          emptyState
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredNotifications}
            className="max-h-[600px] overflow-y-auto"
            renderItem={(item) => (
              <List.Item
                className={`rounded-lg mb-2 p-4 hover:bg-gray-100 transition-colors duration-200 ${
                  item.read ? "bg-gray-50" : "bg-blue-50"
                }`}
                actions={[
                  !item.read && (
                    <Button
                      key="mark-read"
                      type="text"
                      icon={<CheckOutlined />}
                      onClick={() => markAsRead(item)}
                      loading={loading}
                    >
                      {t.markAsRead}
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  className="pl-2"
                  title={
                    <div className="flex items-center">
                      {!item.read && (
                        <Badge status="processing" className="mr-2" />
                      )}
                      <span className="font-medium text-gray-800">
                        {item.title}
                      </span>
                    </div>
                  }
                  description={
                    <div className="mt-2">
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {typeof item.content === "object"
                          ? item.content
                          : item.content}
                      </div>
                      <div className="mt-2">
                        <small className="text-gray-500">
                          {formatDate(item.timestamp)}
                        </small>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  );
};

const InterfaceEn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [current, setCurrent] = useState(() => {
    const menuParam = searchParams.get("menu");
    return menuParam || "dashboard";
  });
  const [searchValue, setSearchValue] = useState("");
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [update, setupdate] = useState([]);
  const navigate = useNavigate();
  const [esnStatus, setEsnStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [attemptedMenu, setAttemptedMenu] = useState("");
  const [fcmToken, setFcmToken] = useState(null);

  // Language state
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || "fr"; // Default to French
  });
  const t = translations[language] || translations.fr;

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Function to change language
  const changeLanguage = (lang) => {
    setLanguage(lang);
    // Update breadcrumbs when language changes
    const path = findMenuPath(current, getMenuItems());
    if (path) {
      setBreadcrumbItems(path);
    }
  };

  // Responsive state for mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize breadcrumb items with the correct language
  useEffect(() => {
    setBreadcrumbItems([t.dashboard]);
  }, [language, t.dashboard]);

  // Set initial view based on URL query parameter
  useEffect(() => {
    const menuParam = searchParams.get("menu");
    if (menuParam) {
      setCurrent(menuParam);
      const path = findMenuPath(menuParam, getMenuItems());
      if (path) {
        setBreadcrumbItems(path);
      }
    }
  }, []);

  // Function to check ESN status
  const checkEsnStatus = async () => {
    try {
      const response = await fetch(
        Endponit() + "/api/getEsnData/?esnId=" + localStorage.getItem("id")
      );

      if (!response.ok) {
        throw new Error("Échec de la vérification du statut");
      }

      const data = await response.json();
      setEsnStatus(
        String(data.data[0].Statut).toLowerCase() === "actif" ? true : false
      );
      console.log("ESN Status:", data.data[0].Statut);
    } catch (error) {
      console.error("Erreur de vérification du statut ESN:", error);
      // message.error("Impossible de vérifier le statut du compte");
    }
  };

  // Check if menu is allowed for inactive accounts
  const isMenuAllowed = (menuKey) => {
    // Only profile and "documents" are allowed for inactive accounts
    return menuKey === "Profile" || menuKey === "documents";
  };

  useEffect(() => {
    checkEsnStatus();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        Endponit() +
          "/api/getNotifications/?type=esn&id=" +
          localStorage.getItem("id")
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      const transformedNotifications = data.data.map((notification) => ({
        id: notification.id,
        type: notification.categorie.toLowerCase(),
        title: notification.event,
        content: parse(notification.message),
        timestamp: notification.created_at,
        read: notification.status === "Read",
        dest_id: notification.dest_id,
        event_id: notification.event_id,
      }));
      setNotifications(transformedNotifications);

      const unreadCount = transformedNotifications.filter(
        (n) => !n.read
      ).length;
      setUnreadNotificationsCount(unreadCount);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Register FCM token with backend
  const registerTokenWithServer = async (token) => {
    try {
      const id = localStorage.getItem("id");
      const type = "esn"; // Set user type as ESN

      await axios.put(`${Endponit()}/api/update-token/`, {
        id,
        type,
        token: token,
      });

      console.log("FCM token registered with server successfully");
    } catch (error) {
      console.error("Error registering FCM token with server:", error);
    }
  };

  // Set up message handler for Firebase Cloud Messaging
  const setupMessageHandler = () => {
    if (!messaging) return null;

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);

      // Display notification using Ant Design notification component
      notification.open({
        message: payload.notification?.title || t.notificationReceived,
        description: payload.notification?.body || "",
        icon: <NotificationOutlined style={{ color: "#1890ff" }} />,
        duration: 5,
        onClick: () => {
          // Navigate to notification tab when clicked
          setCurrent("notification");
          setSearchParams({ menu: "notification" });
          const path = findMenuPath("notification", getMenuItems());
          if (path) {
            setBreadcrumbItems(path);
          }
        },
      });

      // Increment the badge count immediately
      setUnreadNotificationsCount((prevCount) => prevCount + 1);

      // Then fetch the updated notification list from the server
      fetchNotifications();
    });

    // Return the unsubscribe function for cleanup
    return unsubscribe;
  };

  useEffect(() => {
    fetchNotifications();
  }, [update]);

  useEffect(() => {
    const auth = isEsnLoggedIn();
    if (auth === false) {
      navigate("/Login");
      return;
    }

    // Initialize Firebase messaging and request permission
    const initializeNotifications = async () => {
      try {
        // Use the requestNotificationPermission function from config file
        const token = await requestNotificationPermission();

        if (token) {
          console.log("FCM Token received:", token);
          setFcmToken(token);

          // Register token with backend
          await registerTokenWithServer(token);
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
        message.error(t.notificationError);
      }
    };

    initializeNotifications();

    // Set up message handler and store cleanup function
    const unsubscribe = setupMessageHandler();

    // Return cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [navigate, t.notificationError]);

  const handleNotificationsUpdate = (updatedNotifications) => {
    setNotifications(updatedNotifications);
    const unreadCount = updatedNotifications.filter((n) => !n.read).length;
    setUnreadNotificationsCount(unreadCount);
  };

  // Function to get menu items with current language
  const getMenuItems = () => {
    return [
      {
        label: t.dashboard,
        key: "dashboard",
        icon: <DashboardOutlined />,
      },
      {
        label: t.administration,
        key: "administration",
        icon: <SettingOutlined />,
        children: [
          {
            label: t.profile,
            key: "Profile",
            icon: <UserOutlined />,
          },
          {
            label: t.collaborators,
            key: "collaborateur",
            icon: <UsergroupAddOutlined />,
            disabled: !esnStatus,
          },
        ],
      },
      {
        label: t.documentation,
        key: "documentation",
        icon: <FileOutlined />,
        children: [
          {
            label: t.clientDocuments,
            key: "documents",
            icon: <FileTextOutlined />,
          },
        ],
      },

      {
        label: t.commercialManagement,
        key: "commercial-management",
        icon: <ShoppingCartOutlined />,
        disabled: !esnStatus,
        children: [
          {
            label: t.tenders,
            key: "Liste-des-Appels-d'Offres",
            icon: <ProjectOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.applications,
            key: "Mes-condidateur",
            icon: <UserSwitchOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.purchaseOrders,            key: "Bon-de-Commande",
            icon: <MacCommandOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.craValidation,
            key: "cra-validation",
            icon: <CalendarOutlined />,
            disabled: !esnStatus,
          },
          // {
          //   label: t.contracts,
          //   key: "Contart",
          //   icon: <FileDoneOutlined />,
          //   disabled: !esnStatus,
          // },
        ],
      },
      {
        label: t.clientManagement,
        key: "client-management",
        icon: <TeamOutlined />,
        disabled: !esnStatus,
        children: [
          {
            label: t.clientDirectory,
            key: "Liste-des-Clients",
            icon: <SolutionOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.partnerships,
            key: "Partenariat",
            icon: <BankOutlined />,
            disabled: !esnStatus,
          },
        ],
      },

      {
        label: (
          <Badge
            count={unreadNotificationsCount}
            overflowCount={9}
            offset={[5, 0]}
            style={{ backgroundColor: "#ff4d4f" }}
          >
            {t.notifications}
          </Badge>
        ),
        key: "notification",
        icon: <NotificationOutlined />,
        disabled: !esnStatus,
      },
    ];
  };

  const menuItems = useMemo(
    () => getMenuItems(),
    [t, unreadNotificationsCount, esnStatus]
  );

  const groupedMenuItems = useMemo(() => {
    // Handle main items with tooltips for disabled ones
    const mainItems = menuItems
      .filter((item) => !item.group)
      .map((item) => {
        if (item.disabled) {
          return {
            ...item,
            label: <Tooltip title={t.inactiveWarning}>{item.label}</Tooltip>,
          };
        }
        return item;
      });

    // Handle grouped items with tooltips for disabled ones
    const groupedItems = menuItems.reduce((acc, item) => {
      if (item.group && !acc.find((i) => i.label === item.group)) {
        const children = menuItems
          .filter((i) => i.group === item.group)
          .map((i) => {
            const childItem = { ...i, group: undefined };
            if (childItem.disabled) {
              childItem.label = (
                <Tooltip title={t.inactiveWarning}>{childItem.label}</Tooltip>
              );
            }
            return childItem;
          });

        const groupItem = {
          label: item.group,
          key: item.group.toLowerCase().replace(/\s+/g, "-"),
          children,
        };

        if (item.disabled) {
          groupItem.disabled = true;
          groupItem.label = (
            <Tooltip title={t.inactiveWarning}>{groupItem.label}</Tooltip>
          );
        }

        acc.push(groupItem);
      }
      return acc;
    }, []);

    return [...mainItems, ...groupedItems];
  }, [menuItems, t.inactiveWarning]);

  const findMenuPath = (key, items, path = []) => {
    for (const item of items) {
      if (item.key === key) {
        return [...path, item.label];
      }
      if (item.children) {
        const result = findMenuPath(key, item.children, [...path, item.label]);
        if (result) return result;
      }
    }
    return null;
  };

  const flattenMenuItems = (items) => {
    return items.reduce((acc, item) => {
      if (item.children) {
        return [...acc, ...flattenMenuItems(item.children)];
      }
      return [...acc, { key: item.key, label: item.label, icon: item.icon }];
    }, []);
  };

  const getSearchOptions = (searchText) => {
    if (!searchText) return [];
    const search = searchText.toLowerCase();
    const flatItems = flattenMenuItems(menuItems);
    return flatItems
      .filter((item) => {
        if (!item?.label) return false;
        const label = String(item.label);
        return label.toLowerCase().includes(search);
      })
      .map((item) => ({
        value: item.key,
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 0",
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ),
      }));
  };

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  const handleSelect = (value) => {
    if (esnStatus === false && !isMenuAllowed(value)) {
      setAttemptedMenu(value);
      setIsModalVisible(true);
      return;
    }
    setCurrent(value);
    setSearchParams({ menu: value });
    setSearchValue("");
    const path = findMenuPath(value, menuItems);
    if (path) {
      setBreadcrumbItems(path);
    }
  };

  const handleMenuClick = (e) => {
    if (esnStatus === false && !isMenuAllowed(e.key)) {
      setAttemptedMenu(e.key);
      setIsModalVisible(true);
      return;
    }
    setCurrent(e.key);
    setSearchParams({ menu: e.key });
    const path = findMenuPath(e.key, menuItems);
    if (path) {
      setBreadcrumbItems(path);
    }
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const renderComponent = () => {
    if (
      esnStatus === false &&
      !isMenuAllowed(current) &&
      current !== "dashboard"
    ) {
      return <ESNProfilePageFrancais />;
    }
    switch (current) {
      case "dashboard":
        return <ESNFinancialDashboard />;
      case "Liste-des-Clients":
        return <ClientList />;
      case "Liste-des-Appels-d'Offres":
        return <AppelDOffreInterface />;
      case "collaborateur":
        return <EmployeeManagement />;
      case "documents":
        return <ClientDocumentManagement />;
      case "notification":
        return (
          <NotificationInterface
            notifications={notifications}
            onNotificationsUpdate={handleNotificationsUpdate}
            setupdate={setupdate}
            t={t}
          />
        );
      case "Mes-condidateur":
        return <ESNCandidatureInterface />;      case "Bon-de-Commande":
        return <BonDeCommandeInterface />;
      case "cra-validation":
        return <CraValidation />;
      case "Contart":
        return <ContractList />;
      case "Partenariat":
        return <ClientPartenariatInterface />;
      case "Profile":
        return <ESNProfilePageFrancais />;
      default:
        return null;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      <div className="w-full">
        {/* Inactive Account Warning Modal */}
        <Modal
          title={
            <div className="flex items-center text-amber-600">
              <WarningOutlined className="mr-2" /> {t.inactiveAccount}
            </div>
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button
              key="profile"
              type="primary"
              onClick={() => {
                setCurrent("Profile");
                setSearchParams({ menu: "Profile" });
                const path = findMenuPath("Profile", menuItems);
                if (path) {
                  setBreadcrumbItems(path);
                }
                setIsModalVisible(false);
              }}
            >
              {t.accessProfile}
            </Button>,
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              {t.close}
            </Button>,
          ]}
        >
          <div className="p-2">
            <p className="text-base mb-3">{t.inactiveWarning}</p>
            <p className="text-base mb-3">{t.completeProfile}</p>
            <p className="text-sm text-gray-500">{t.limitedAccess}</p>
          </div>
        </Modal>

        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="w-full flex items-center justify-between p-4">
            {isMobile ? (
              <>
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={toggleDrawer}
                />
                <Drawer
                  title={t.menu}
                  placement="left"
                  onClose={toggleDrawer}
                  open={drawerVisible}
                >
                  <Menu
                    onClick={(e) => {
                      handleMenuClick(e);
                      toggleDrawer();
                    }}
                    selectedKeys={[current]}
                    mode="vertical"
                    items={groupedMenuItems}
                  />
                  <div className="mt-4">
                    <AutoComplete
                      value={searchValue}
                      options={getSearchOptions(searchValue)}
                      onSelect={handleSelect}
                      onChange={handleSearch}
                      style={{ width: "100%" }}
                    >
                      <Input
                        placeholder={t.search}
                        suffix={<SearchOutlined />}
                      />
                    </AutoComplete>
                  </div>
                  <div className="mt-4">
                    <Select
                      value={language}
                      onChange={changeLanguage}
                      style={{ width: "100%" }}
                    >
                      <Select.Option value="fr">
                        <div className="flex items-center">
                          <span className="mr-2">🇫🇷</span>
                          {t.languageFr}
                        </div>
                      </Select.Option>
                      <Select.Option value="en">
                        <div className="flex items-center">
                          <span className="mr-2">🇬🇧</span>
                          {t.languageEn}
                        </div>
                      </Select.Option>
                    </Select>
                  </div>
                </Drawer>
              </>
            ) : (
              <div className="flex items-center flex-grow overflow-hidden">
                <Menu
                  onClick={handleMenuClick}
                  selectedKeys={[current]}
                  mode="horizontal"
                  items={groupedMenuItems}
                  className="border-none flex-grow"
                  overflowedIndicator={
                    <MoreOutlined style={{ fontSize: "18px" }} />
                  }
                />
                <AutoComplete
                  value={searchValue}
                  options={getSearchOptions(searchValue)}
                  onSelect={handleSelect}
                  onChange={handleSearch}
                  className="ml-4 w-64 flex-shrink-0"
                >
                  <Input
                    className="rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                    placeholder={t.search}
                    suffix={<SearchOutlined className="text-gray-400" />}
                  />
                </AutoComplete>
              </div>
            )}
            <div className="flex space-x-3 items-center ml-4 flex-shrink-0">
              <Select
                value={language}
                onChange={changeLanguage}
                bordered={false}
                dropdownMatchSelectWidth={false}
                style={{ width: 100 }}
              >
                <Select.Option value="fr">
                  <div className="flex items-center">
                    <span className="mr-2">🇫🇷</span>
                    FR
                  </div>
                </Select.Option>
                <Select.Option value="en">
                  <div className="flex items-center">
                    <span className="mr-2">🇬🇧</span>
                    EN
                  </div>
                </Select.Option>
              </Select>
              <Tag color={esnStatus ? "green" : "orange"}>
                {!esnStatus ? t.inactiveProvider : t.activeAccount}
              </Tag>
              <LogoutOutlined
                onClick={() => {
                  logoutEsn();
                  navigate("/Login");
                }}
                className="text-red-500 cursor-pointer text-base hover:text-red-600"
                title={t.disconnect}
              />
            </div>
          </div>
        </div>

        <div className="pt-20 px-5 mt-5">
          <Breadcrumb className="mb-4">
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
          <div className="mt-3">{renderComponent()}</div>
        </div>
      </div>
    </LanguageContext.Provider>
  );
};

export default InterfaceEn;