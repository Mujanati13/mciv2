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
  UserOutlined,
  FileOutlined,
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
  GlobalOutlined,
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
} from "antd";

import { Endponit } from "../helper/enpoint";
import parse from 'html-react-parser';

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
import { messaging, requestNotificationPermission } from "../helper/firebase/config";
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
    clientDirectory: "Répertoire Clients",
    partnerships: "Partenariats",
    commercialManagement: "Gestion Commerciale",
    tenders: "Appels d'Offres",
    applications: "Mes Candidatures",
    purchaseOrders: "Bons de Commande",
    contracts: "Contrats",
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
  },
  en: {
    dashboard: "Dashboard",
    administration: "Administration",
    profile: "My ESN Profile",
    collaborators: "Collaborator Management",
    clientManagement: "Client Management",
    clientDirectory: "Client Directory",
    partnerships: "Partnerships",
    commercialManagement: "Commercial Management",
    tenders: "Tenders",
    applications: "My Applications",
    purchaseOrders: "Purchase Orders",
    contracts: "Contracts",
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
  },
};

const NotificationInterface = ({
  notifications,
  onNotificationsUpdate,
  setupdate,
  t,
}) => {
  const [loading, setLoading] = useState(false);

  const markAsRead = async (notificationId) => {
    try {
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
      message.error("Impossible de marquer la notification comme lue");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
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

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <Button
          type="primary"
          onClick={markAllAsRead}
          loading={loading}
          disabled={!notifications.some((n) => !n.read)}
        >
          {t.markAllAsRead}
        </Button>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            className={`rounded-lg mb-2 p-4 ${
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
              className="pl-4"
              title={
                <div className="flex items-center">
                  {!item.read && (
                    <Badge
                      style={{ opacity: 0.5 }}
                      status="processing"
                      className="mr-2"
                    />
                  )}
                  <span>{item.title}</span>
                </div>
              }
              description={
                <div className="">
                  <p>{item.content}</p>
                  <small className="text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </small>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

const InterfaceEn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [current, setCurrent] = useState(() => {
    const menuParam = searchParams.get('menu');
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
    const menuParam = searchParams.get('menu');
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
      message.error("Impossible de vérifier le statut du compte");
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
        token: token
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
        icon: <NotificationOutlined style={{ color: '#1890ff' }} />,
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
      setUnreadNotificationsCount(prevCount => prevCount + 1);
      
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
      if (unsubscribe && typeof unsubscribe === 'function') {
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
            label: t.purchaseOrders,
            key: "Bon-de-Commande",
            icon: <MacCommandOutlined />,
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
            style={{ backgroundColor: '#ff4d4f' }}
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
        return null;
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
        return <ESNCandidatureInterface />;
      case "Bon-de-Commande":
        return <BonDeCommandeInterface />;
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