import React, { useState, useEffect, useMemo } from "react";
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
} from "antd";
// import { getMessaging, onMessage, getToken } from "firebase/messaging";
// import { firebaseApp } from "../helper/firebase/config";
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
// import { messaging } from "../helper/firebase/config";

const NotificationInterface = ({
  notifications,
  onNotificationsUpdate,
  setupdate,
}) => {
  const [loading, setLoading] = useState(false);

  const markAsRead = async (notificationId) => {
    // setLoading(true);
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
    } finally {
      // setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    // setLoading(true);
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
    } finally {
      // setLoading(false);
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
          Tout marquer comme lu{" "}
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
                  marquer comme lu
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
                      status="processing"
                      className="mr-2"
                      style={{ opacity: 0.5 }}
                    />
                  )}
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

const ClientProfile = () => {
  const [current, setCurrent] = useState("dashboard");
  const [searchValue, setSearchValue] = useState("");
  const [breadcrumbItems, setBreadcrumbItems] = useState(["Tableau de Bord"]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [update, setupdate] = useState("");
  const navigate = useNavigate();
  const [esnStatus, setEsnStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [attemptedMenu, setAttemptedMenu] = useState("");

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
        String(data.data[0].statut).toLowerCase() === "validé" || String(data.data[0].statut).toLowerCase() === "actif"
      );
      if (String(data.data.Statut).toLowerCase() !== "actif") {
        // message.warning("Votre compte Client est inactif");
      }
    } catch (error) {
      console.error("Erreur de vérification du statut ESN:", error);
      message.error("Impossible de vérifier le statut du compte");
    }
  };
  
  const isMenuAllowed = (menuKey) => {
    // Only profile and documents section are allowed for inactive accounts
    return menuKey === "Mon-Profil" || menuKey === "documents";
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
        // Get the FCM token
        // const currentToken = await getToken(messaging, {
        //   vapidKey:
        //     "BNr1YPHHD-jYLHyQcJUduQyVZA7BWGIx1q6e8m-bU442LV7Hu28P80AJyJNL998WF563PHdD97BLtZNpYJW-sSw", // Replace with your VAPID key
        // });

        // if (currentToken) {
        //   console.log("FCM Token:", currentToken);

        //   // Send the token to your backend server
        //   await fetch(
        //     Endponit() +
        //       "/api/update-token/?id=" +
        //       localStorage.getItem("id") +
        //       "&token=" +
        //       currentToken +
        //       "&type=client",
        //     {
        //       method: "PUT",
        //       headers: {
        //         "Content-Type": "application/json",
        //       },
        //       body: JSON.stringify({
        //         id: localStorage.getItem("id"), // Replace with the user's ID
        //         token: currentToken,
        //         type: "client",
        //       }),
        //     }
        //   );

        //   console.log("FCM token sent to the server.");
        // } else {
        //   console.log("No registration token available.");
        // }
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
          // Add pending notifications to the state
          setNotifications((prev) => [...pendingNotifications, ...prev]);
          setUnreadNotificationsCount(
            (prev) => prev + pendingNotifications.length
          );
          // Clear pending notifications
          localStorage.removeItem("pendingNotifications");
        }
      } catch (error) {
        console.error("Error checking pending notifications:", error);
      }
    };

    retrieveFCMToken();
    fetchNotifications();
    checkPendingNotifications(); // Check for pending notifications on component mount
  }, [navigate, update]);

  const handleNotificationsUpdate = (updatedNotifications) => {
    setNotifications(updatedNotifications);
    const unreadCount = updatedNotifications.filter((n) => !n.read).length;
    setUnreadNotificationsCount(unreadCount);
  };

  const menuItems = [
    {
      label: "Tableau de Bord",
      key: "dashboard",
      icon: <DashboardOutlined />,
    },
    {
      label: "Mon Espace",
      key: "mon-espace",
      icon: <UserOutlined />,
      group: "Gestion du Compte",
      children: [
        {
          label: "Mon Profil Client",
          key: "Mon-Profil",
          icon: <ProfileOutlined />,
        },
      ],
    },
    {
      label: "Prestataires",
      key: "prestataires",
      icon: <BuildOutlined />,
      group: "Gestion des Services",
      children: [
        {
          label: "ESN Partenaires",
          key: "Entreprise-de-Services",
          icon: <BankOutlined />,
        },
        {
          label: "Consultants",
          key: "consultant",
          icon: <TeamOutlined />,
        },
        {
          label: "Partenariats",
          key: "Partenariat",
          icon: <PartitionOutlined />,
        },
      ],
    },
    {
      label: "Appels d'Offres",
      key: "appels-offres",
      icon: <ProjectOutlined />,
      group: "Gestion Commerciale",
      children: [
        {
          label: "Mes offers",
          key: "Appel-d'offres",
          icon: <FileSearchOutlined />,
        },
        {
          label: "Candidatures",
          key: "Liste-Candidature",
          icon: <UsergroupAddOutlined />,
        },
        {
          label: "Bons de Commande",
          key: "Liste-BDC",
          icon: <ShoppingOutlined />,
        },
        {
          label: "Contrats",
          key: "Contart",
          icon: <FileDoneOutlined />,
        },
      ],
    },
    {
      label: "Documents",
      key: "documents-section",
      icon: <FileOutlined />,
      group: "Documentation",
      children: [
        {
          label: "Gestion Documentaire",
          key: "documents",
          icon: <SolutionOutlined />,
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
          Notifications
        </Badge>
      ),
      key: "notification",
      icon: <NotificationOutlined />,
    },
  ];

  const groupedMenuItems = useMemo(() => {
    const mainItems = menuItems.filter((item) => !item.group);
    const groupedItems = menuItems.reduce((acc, item) => {
      if (item.group && !acc.find((i) => i.label === item.group)) {
        acc.push({
          label: item.group,
          key: item.group.toLowerCase().replace(/\s+/g, "-"),
          children: menuItems
            .filter((i) => i.group === item.group)
            .map((i) => ({
              ...i,
              group: undefined,
            })),
        });
      }
      return acc;
    }, []);

    return [...mainItems, ...groupedItems];
  }, [menuItems, unreadNotificationsCount]);

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
    return ["Tableau de Bord"];
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
    // Check if account is inactive and the selected menu is not allowed
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
    // Check if account is inactive and the selected menu is not allowed
    if (esnStatus === false && !isMenuAllowed(e.key)) {
      setAttemptedMenu(e.key);
      setIsModalVisible(true);
      return;
    }
    
    setCurrent(e.key);
    setBreadcrumbItems(findMenuPath(e.key));
  };

  const renderComponent = () => {
    // If account is inactive and current menu is not allowed, redirect to profile
    if (esnStatus === false && !isMenuAllowed(current) && current !== "dashboard") {
      // Force redirect to profile if trying to access restricted areas
      return <ClientPlusInfo />;
    }
    
    switch (current) {
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
    <div className="w-full">
      {/* Inactive Account Warning Modal */}
      <Modal
        title={
          <div className="flex items-center text-amber-600">
            <WarningOutlined className="mr-2" /> Compte prestataire Inactif
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
            Accéder à mon profil
          </Button>,
          <Button 
            key="cancel" 
            onClick={() => setIsModalVisible(false)}
          >
            Fermer
          </Button>
        ]}
      >
        <div className="p-2">
          <p className="text-base mb-3">Votre compte est actuellement inactif. Vous ne pouvez pas accéder à cette section.</p>
          <p className="text-base mb-3">Pour activer votre compte, complétez toutes les informations requises dans votre profil.</p>
          <p className="text-sm text-gray-500">Seule la section "Mon Profil Client" est accessible jusqu'à l'activation de votre compte.</p>
        </div>
      </Modal>

      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="w-full flex items-center p-4 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Menu
              onClick={handleMenuClick}
              selectedKeys={[current]}
              mode="horizontal"
              items={groupedMenuItems}
              className="border-none flex-1"
            />
          </div>
          <div className="flex space-x-6 items-center">
            <AutoComplete
              value={searchValue}
              options={getSearchOptions(searchValue)}
              onSelect={handleSelect}
              onChange={handleSearch}
              className="w-64"
            >
              <Input
                className="w-full rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                placeholder="Rechercher une interface..."
                suffix={<SearchOutlined className="text-gray-400" />}
              />
            </AutoComplete>
            <Tag color={esnStatus ? "green" : "orange"}>
              {!esnStatus ? "Compte Client inactif" : "Compte actif"}
            </Tag>
            <LogoutOutlined
              onClick={() => {
                logoutEsn();
                navigate("/Login");
              }}
              className="text-red-500 cursor-pointer text-base hover:text-red-600"
              title="Déconnexion"
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
  );
};

export default ClientProfile;