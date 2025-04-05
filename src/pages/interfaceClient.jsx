import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  LogoutOutlined,
  UserOutlined,
  FileOutlined,
  NotificationOutlined,
  ShoppingOutlined,
  TeamOutlined,
  DashboardOutlined,
  ProfileOutlined,
  SearchOutlined,
  FileSearchOutlined,
  UsergroupAddOutlined,
  FileDoneOutlined,
  BankOutlined,
  ProjectOutlined,
  SolutionOutlined,
  BuildOutlined,
  PartitionOutlined,
  CheckOutlined,
  WarningOutlined,
  MenuOutlined,
  GlobalOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  Menu,
  Tag,
  AutoComplete,
  Input,
  Breadcrumb,
  List,
  Button,
  message,
  Badge,
  Modal,
  Tooltip,
  Drawer,
  Select,
  ConfigProvider,
} from "antd";
import { Endponit } from "../helper/enpoint";

import ClientPlusInfo from "../components/cl-interface/plus-info";
import EntrepriseServices from "../components/cl-interface/en-list";
import DocumentManagement from "../components/cl-interface/document";
import AppelDOffreInterface from "../components/cl-interface/ad-interface";
import CandidatureInterface from "../components/cl-interface/list-condi";
import PurchaseOrderInterface from "../components/cl-interface/bd-list";
import ContractList from "../components/cl-interface/contart-cl";
import PartenariatInterface from "../components/cl-interface/partenariat-list";
import ConsultantManagement from "../components/cl-interface/list-consultant";
import { isClientLoggedIn, logoutEsn } from "../helper/db";
import { useNavigate } from "react-router-dom";

// Language Context
const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

// Translations
const translations = {
  fr: {
    dashboard: "Tableau de Bord",
    mySpace: "Mon Espace",
    myProfile: "Mon Profil Client",
    providers: "Prestataires",
    esnPartners: "ESN Partenaires",
    consultants: "Consultants",
    partnerships: "Partenariats",
    tenders: "Appels d'Offres",
    myOffers: "Mes offres",
    applications: "Candidatures",
    purchaseOrders: "Bons de Commande",
    contracts: "Contrats",
    documents: "Mes Documents",
    documentManagement: " Gestion Documentaire",
    notifications: "Notifications",
    inactiveAccount: "Compte prestataire Inactif",
    inactiveWarning:
      "Votre compte est actuellement inactif. L'accès aux fonctionnalités est limité.",
    completeProfile:
      "Pour activer votre compte, complétez toutes les informations requises dans votre profil.",
    limitedAccess:
      "Sections accessibles: Tableau de Bord, Mon Profil Client et Gestion Documentaire",
    restrictedSections:
      "Sections restreintes: Prestataires, Appels d'Offres et Notifications",
    accessProfile: "Accéder à mon profil",
    close: "Fermer",
    inactiveClientAccount: "Compte Client inactif",
    activeAccount: "Compte actif",
    menu: "Menu",
    search: "Rechercher une interface...",
    disconnect: "Déconnexion",
    accountManagement: "Gestion du Compte",
    serviceManagement: "Gestion des Services",
    commercialManagement: "Gestion Commerciale",
    documentation: "Documentation",
    markAllAsRead: "Tout marquer comme lu",
    markAsRead: "marquer comme lu",
    welcomeMessage: "Bienvenue sur votre espace client",
    profileIncomplete: "Votre profil est incomplet",
    completeYourProfile:
      "Complétez votre profil pour accéder à toutes les fonctionnalités",
    goToProfile: "Aller au profil",
    languageFr: "Français",
    languageEn: "English",
  },
  en: {
    dashboard: "Dashboard",
    mySpace: "My Space",
    myProfile: "My Client Profile",
    providers: "Providers",
    esnPartners: "ESN Partners",
    consultants: "Consultants",
    partnerships: "Partnerships",
    tenders: "Tenders",
    myOffers: "My Offers",
    applications: "Applications",
    purchaseOrders: "Purchase Orders",
    contracts: "Contracts",
    documents: "Documents",
    documentManagement: "Document Management",
    notifications: "Notifications",
    inactiveAccount: "Inactive Provider Account",
    inactiveWarning:
      "Your account is currently inactive. Access to features is limited.",
    completeProfile:
      "To activate your account, complete all required information in your profile.",
    limitedAccess:
      "Accessible sections: Dashboard, My Client Profile and Document Management",
    restrictedSections:
      "Restricted sections: Providers, Tenders and Notifications",
    accessProfile: "Access my profile",
    close: "Close",
    inactiveClientAccount: "Inactive Client Account",
    activeAccount: "Active Account",
    menu: "Menu",
    search: "Search for an interface...",
    disconnect: "Logout",
    accountManagement: "Account Management",
    serviceManagement: "Service Management",
    commercialManagement: "Commercial Management",
    documentation: "Mes documents",
    markAllAsRead: "Mark all as read",
    markAsRead: "Mark as read",
    welcomeMessage: "Welcome to your client portal",
    profileIncomplete: "Your profile is incomplete",
    completeYourProfile: "Complete your profile to access all features",
    goToProfile: "Go to profile",
    languageFr: "Français",
    languageEn: "English",
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
      setupdate(Math.random() * 1000);
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        read: true,
      }));

      onNotificationsUpdate(updatedNotifications);
      message.success("Notification marked as read");
    } catch (error) {
      console.error("Error updating notification status:", error);
      message.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      const updatePromises = unreadNotifications.map((notification) =>
        fetch(Endponit() + "/api/notification/" + notification.id, {
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...notification,
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
                  {!item.read && <Badge status="processing" className="mr-2" />}
                  <span>{item.title}</span>
                </div>
              }
              description={
                <div>
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

// Dashboard component for the homepage
const Dashboard = ({ clientStatus, t, language, handleMenuClick }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg p-6 text-white shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">
              {t.welcomeMessage}
            </h1>
            {!clientStatus && (
              <div className="mt-4 bg-white bg-opacity-20 p-3 rounded-md">
                <div className="flex items-start">
                  <WarningOutlined className="text-yellow-300 text-lg mt-1 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t.profileIncomplete}
                    </h3>
                    <p className="mb-2">{t.completeYourProfile}</p>
                    <Button
                      type="primary"
                      ghost
                      onClick={() => handleMenuClick({ key: "Mon-Profil" })}
                    >
                      {t.goToProfile}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">
              {language === "fr" ? "Accès rapides" : "Quick Access"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="default"
                icon={<UserOutlined />}
                className="flex items-center justify-center"
                onClick={() => handleMenuClick({ key: "Mon-Profil" })}
              >
                {t.myProfile}
              </Button>
              <Button
                type="default"
                icon={<FileOutlined />}
                className="flex items-center justify-center"
                onClick={() => handleMenuClick({ key: "documents" })}
              >
                {t.documents}
              </Button>
              {clientStatus && (
                <>
                  <Button
                    type="default"
                    icon={<BankOutlined />}
                    className="flex items-center justify-center"
                    onClick={() =>
                      handleMenuClick({ key: "Entreprise-de-Services" })
                    }
                  >
                    {t.esnPartners}
                  </Button>
                  <Button
                    type="default"
                    icon={<ProjectOutlined />}
                    className="flex items-center justify-center"
                    onClick={() => handleMenuClick({ key: "Appel-d'offres" })}
                  >
                    {t.tenders}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientProfile = () => {
  const [current, setCurrent] = useState("dashboard");
  const [searchValue, setSearchValue] = useState("");
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [update, setupdate] = useState("");
  const navigate = useNavigate();
  const [esnStatus, setEsnStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [attemptedMenu, setAttemptedMenu] = useState("");

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
    const path = findMenuPath(current);
    if (path) {
      setBreadcrumbItems(path);
    }
  };

  // Responsive states
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024
  );
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Update breadcrumb items with the correct language
  useEffect(() => {
    setBreadcrumbItems([t.dashboard]);
  }, [language, t.dashboard]);

  // Detect window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to check ESN status
  const checkEsnStatus = async () => {
    try {
      const response = await fetch(
        Endponit() + "/api/getUserData/?clientId=" + localStorage.getItem("id")
      );

      if (!response.ok) {
        throw new Error("Échec de la vérification du statut");
      }

      const data = await response.json();
      setEsnStatus(
        String(data.data[0].statut).toLowerCase() === "validé" ||
          String(data.data[0].statut).toLowerCase() === "actif"
      );
    } catch (error) {
      console.error("Erreur de vérification du statut ESN:", error);
      message.error("Impossible de vérifier le statut du compte");
    }
  };

  const isMenuAllowed = (menuKey) => {
    // Only "Mon-Profil" and "documents" sections are allowed for inactive accounts
    return (
      menuKey === "Mon-Profil" ||
      menuKey === "documents" ||
      menuKey === "dashboard"
    );
  };

  useEffect(() => {
    checkEsnStatus();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        Endponit() +
          "/api/getNotifications/?type=client&id=" +
          localStorage.getItem("id")
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      const transformedNotifications = data.data.map((notification) => ({
        id: notification.id,
        type: notification.categorie.toLowerCase(),
        title: notification.categorie,
        content: notification.message,
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

  const retrieveFCMToken = async () => {
    try {
      // Request permission for notifications
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Token retrieval code would go here
      } else {
        console.log("Permission denied for notifications.");
      }
    } catch (error) {
      console.error("Error retrieving FCM token:", error);
    }
  };

  useEffect(() => {
    const auth = isClientLoggedIn();
    if (auth === false) {
      navigate("/Login");
    }

    // Check for pending notifications from background messages
    const checkPendingNotifications = () => {
      try {
        const pendingNotifications = JSON.parse(
          localStorage.getItem("pendingNotifications") || "[]"
        );
        if (pendingNotifications.length > 0) {
          setNotifications((prev) => [...pendingNotifications, ...prev]);
          setUnreadNotificationsCount(
            (prev) => prev + pendingNotifications.length
          );
          localStorage.removeItem("pendingNotifications");
        }
      } catch (error) {
        console.error("Error checking pending notifications:", error);
      }
    };

    retrieveFCMToken();
    fetchNotifications();
    checkPendingNotifications();
  }, [navigate, update]);

  const handleNotificationsUpdate = (updatedNotifications) => {
    setNotifications(updatedNotifications);
    const unreadCount = updatedNotifications.filter((n) => !n.read).length;
    setUnreadNotificationsCount(unreadCount);
  };

  // Function to get menu items with current language
  // Function to get menu items with current language
  const getMenuItems = () => {
    return [
      {
        label: t.dashboard,
        key: "dashboard",
        icon: <DashboardOutlined />,
      },
      {
        label: t.mySpace,
        key: "mon-espace",
        icon: <UserOutlined />,
        children: [
          {
            label: t.myProfile,
            key: "Mon-Profil",
            icon: <ProfileOutlined />,
          },
        ],
      },
      {
        label: t.documents,
        key: "documents",
        icon: <FileOutlined />,
        // children: [
        //   {
        //     label: t.documentManagement,
        //     key: "documents",
        //     icon: <SolutionOutlined />,
        //   },
        // ],
      },
      {
        label: t.providers,
        key: "providers-group",
        icon: <BuildOutlined />,
        disabled: !esnStatus,
        children: [
          {
            label: t.esnPartners,
            key: "Entreprise-de-Services",
            icon: <BankOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.consultants,
            key: "consultant",
            icon: <TeamOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.partnerships,
            key: "Partenariat",
            icon: <PartitionOutlined />,
            disabled: !esnStatus,
          },
        ],
      },
      {
        label: t.commercialManagement,
        key: "commercial-management",
        icon: <ShoppingOutlined />,
        disabled: !esnStatus,
        children: [
          {
            label: t.tenders,
            key: "Appel-d'offres",
            icon: <ProjectOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.applications,
            key: "Liste-Candidature",
            icon: <UsergroupAddOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.purchaseOrders,
            key: "Liste-BDC",
            icon: <ShoppingOutlined />,
            disabled: !esnStatus,
          },
          {
            label: t.contracts,
            key: "Contart",
            icon: <FileDoneOutlined />,
            disabled: !esnStatus,
          },
        ],
      },
      {
        label: (
          <Badge
            maxCount={9}
            overflowCount={9}
            style={{ opacity: 1, position: "relative", left: 0 }}
            count={unreadNotificationsCount}
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
        acc.push({
          label: item.group,
          key: item.group.toLowerCase().replace(/\s+/g, "-"),
          children,
          disabled: item.disabled,
        });
      }
      return acc;
    }, []);

    return [...mainItems, ...groupedItems];
  }, [menuItems, t.inactiveWarning]);

  const findMenuPath = (key) => {
    for (const item of menuItems) {
      if (item.key === key) {
        return [item.label];
      }
      if (item.children) {
        const childPath = item.children.find((child) => child.key === key);
        if (childPath) {
          return [item.label, childPath.label];
        }
      }
    }
    return [t.dashboard];
  };

  const getSearchOptions = (searchText) => {
    if (!searchText) return [];
    const search = searchText.toLowerCase();
    const flattenedItems = menuItems.reduce((acc, item) => {
      if (item.children) {
        return [...acc, ...item.children];
      }
      return [...acc, item];
    }, []);
    return flattenedItems
      .filter((item) => item.label?.toString().toLowerCase().includes(search))
      .map((item) => ({
        value: item.key,
        label: (
          <div className="flex items-center gap-2 py-2">
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
    setSearchValue("");
    setBreadcrumbItems(findMenuPath(value));
  };

  const handleMenuClick = (e) => {
    if (esnStatus === false && !isMenuAllowed(e.key)) {
      setAttemptedMenu(e.key);
      setIsModalVisible(true);
      return;
    }
    setCurrent(e.key);
    setBreadcrumbItems(findMenuPath(e.key));
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const renderComponent = () => {
    if (
      esnStatus === false &&
      current !== "dashboard" &&
      !isMenuAllowed(current)
    ) {
      return <ClientPlusInfo />;
    }
    switch (current) {
      case "dashboard":
        return (
          <Dashboard
            clientStatus={esnStatus}
            t={t}
            language={language}
            handleMenuClick={handleMenuClick}
          />
        );
      case "Mon-Profil":
        return <ClientPlusInfo />;
      case "Entreprise-de-Services":
        return <EntrepriseServices />;
      case "documents":
        return <DocumentManagement />;
      case "consultant":
        return <ConsultantManagement />;
      case "Appel-d'offres":
        return <AppelDOffreInterface />;
      case "Liste-Candidature":
        return <CandidatureInterface />;
      case "notification":
        return (
          <NotificationInterface
            notifications={notifications}
            onNotificationsUpdate={handleNotificationsUpdate}
            setupdate={setupdate}
            t={t}
          />
        );
      case "Contart":
        return <ContractList />;
      case "Liste-BDC":
        return <PurchaseOrderInterface />;
      case "Partenariat":
        return <PartenariatInterface />;
      default:
        return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#10b981", // Green theme for client interface
          borderRadius: 6,
        },
        components: {
          Menu: {
            itemSelectedColor: "#10b981",
            itemSelectedBg: "#ecfdf5",
          },
        },
      }}
    >
      <LanguageContext.Provider value={{ language, changeLanguage, t }}>
        <div className="w-full min-h-screen bg-gray-50">
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
                  setCurrent("Mon-Profil");
                  setBreadcrumbItems(findMenuPath("Mon-Profil"));
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
              <p className="text-sm text-gray-500">{t.restrictedSections}</p>
            </div>
          </Modal>

          {/* Header */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
            <div className="w-full flex items-center justify-between p-4">
              {isMobile || isTablet ? (
                <>
                  <div className="flex items-center">
                    <Button
                      type="text"
                      icon={<MenuOutlined />}
                      onClick={toggleDrawer}
                      aria-label="Toggle menu"
                    />
                    <Tag
                      color={esnStatus ? "green" : "orange"}
                      className="ml-3"
                    >
                      {!esnStatus ? t.inactiveClientAccount : t.activeAccount}
                    </Tag>
                  </div>
                  <Drawer
                    title={
                      <div className="flex justify-between items-center">
                        <span>{t.menu}</span>
                        <Select
                          value={language}
                          onChange={changeLanguage}
                          bordered={false}
                          dropdownMatchSelectWidth={false}
                          style={{ width: 80 }}
                          size="small"
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
                      </div>
                    }
                    placement="left"
                    onClose={toggleDrawer}
                    open={drawerVisible}
                    width={screenSize.width < 400 ? "85%" : 320}
                    bodyStyle={{ padding: "12px" }}
                  >
                    <div className="mb-4">
                      <AutoComplete
                        value={searchValue}
                        options={getSearchOptions(searchValue)}
                        onSelect={(value) => {
                          handleSelect(value);
                          toggleDrawer();
                        }}
                        onChange={handleSearch}
                        style={{ width: "100%" }}
                      >
                        <Input
                          placeholder={t.search}
                          suffix={<SearchOutlined />}
                          size={screenSize.width < 400 ? "middle" : "large"}
                        />
                      </AutoComplete>
                    </div>
                    <Menu
                      onClick={(e) => {
                        handleMenuClick(e);
                        toggleDrawer();
                      }}
                      selectedKeys={[current]}
                      mode="vertical"
                      items={groupedMenuItems}
                      className="border-none"
                      style={{
                        overflowY: "auto",
                        maxHeight: "calc(100vh - 180px)",
                      }}
                    />
                    <div className="absolute bottom-4 left-0 right-0 px-6 flex flex-col space-y-2">
                      <Button
                        danger
                        block
                        icon={<LogoutOutlined />}
                        onClick={() => {
                          logoutEsn();
                          navigate("/Login");
                        }}
                      >
                        {t.disconnect}
                      </Button>
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
                      className="rounded-lg border border-gray-200 focus:outline-none focus:border-green-500"
                      placeholder={t.search}
                      suffix={<SearchOutlined className="text-gray-400" />}
                    />
                  </AutoComplete>
                </div>
              )}
              <div
                className={`flex space-x-2 items-center ${
                  isMobile || isTablet ? "" : "ml-4"
                } flex-shrink-0`}
              >
                {!isMobile && !isTablet && (
                  <>
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
                      {!esnStatus ? t.inactiveClientAccount : t.activeAccount}
                    </Tag>
                  </>
                )}
                <Tooltip title={t.disconnect}>
                  <Button
                    type="text"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      logoutEsn();
                      navigate("/Login");
                    }}
                    aria-label="Logout"
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div
            className={`pt-20 ${isMobile ? "px-3" : "px-5"} mt-3 md:mt-5 pb-8`}
          >
            <Breadcrumb className="mb-4">
              {breadcrumbItems.map((item, index) => (
                <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
              ))}
            </Breadcrumb>
            <div className="mt-2 md:mt-4">{renderComponent()}</div>
          </div>
        </div>
      </LanguageContext.Provider>
    </ConfigProvider>
  );
};

export default ClientProfile;
