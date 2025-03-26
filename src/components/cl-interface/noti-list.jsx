import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Tabs,
  Tag,
  Typography,
  Dropdown,
  Menu,
  Badge,
} from "antd";
import {
  SearchOutlined,
  BellOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Endponit } from "../../helper/enpoint";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const NotificationInterfaceClient = () => {
  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        Endponit() + "/api/getNotifications/?type=client&id=" + localStorage.getItem("id")
      );
      if (!response.ok) {
        throw new Error("Échec du chargement des notifications");
      }
      const data = await response.json();
      const transformedNotifications = data.data.map((notification) => ({
        id: notification.id,
        type: notification.categorie.toLowerCase(),
        title: notification.categorie,
        content: notification.message,
        timestamp: notification.created_at,
        read: notification.status === "Read",
      }));
      setNotifications(transformedNotifications);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    return (
      notification.content.toLowerCase().includes(searchText.toLowerCase()) ||
      notification.title.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(
        `${Endponit()}/api/markNotificationAsRead/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Échec de la mise à jour de la notification");
      }

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(
        `${Endponit()}/api/markAllNotificationsAsRead`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: localStorage.getItem("id")
          })
        }
      );

      if (!response.ok) {
        throw new Error("Échec de la mise à jour des notifications");
      }

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await fetch(
        `${Endponit()}/api/clearAllNotifications`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: localStorage.getItem("id")
          })
        }
      );

      if (!response.ok) {
        throw new Error("Échec de la suppression des notifications");
      }

      setNotifications([]);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="mark-all-read" onClick={handleMarkAllRead}>
        Marquer tout comme lu
      </Menu.Item>
      <Menu.Item key="clear-all" onClick={handleClearAll}>
        Supprimer toutes les notifications
      </Menu.Item>
    </Menu>
  );

  if (error) {
    return (
      <Card>
        <div>Erreur: {error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Input
            placeholder="Rechercher des notifications..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            className="mr-4"
          />
          <div className="flex space-x-3">
            <Dropdown overlay={menu} trigger={["click"]}>
              <a
                className="ant-dropdown-link"
                onClick={(e) => e.preventDefault()}
              >
                Options
              </a>
            </Dropdown>
          </div>
        </div>
      </div>
      <Tabs defaultActiveKey="all">
        <TabPane tab="Toutes" key="all">
          {filteredNotifications.length === 0 ? (
            <div className="text-center p-4">
              Aucune notification
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 border-b ${
                  notification.read ? "bg-gray-50" : "bg-blue-50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  {notification.type === "candidature" && <BellOutlined />}
                  {notification.type === "system" && <MailOutlined />}
                  <div>
                    <Title level={5}>{notification.title}</Title>
                    <Text>{notification.content}</Text>
                    <div>
                      <Text type="secondary">
                        {format(
                          new Date(notification.timestamp),
                          "dd MMMM yyyy HH:mm",
                          { locale: fr }
                        )}
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {!notification.read && <Badge count={1} className="mr-2" />}
                  <Tag
                    color={notification.read ? "default" : "blue"}
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {notification.read ? "Lu" : "Non lu"}
                  </Tag>
                </div>
              </div>
            ))
          )}
        </TabPane>
        <TabPane tab="Système" key="system">
          {filteredNotifications
            .filter((notification) => notification.type === "system")
            .map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 border-b ${
                  notification.read ? "bg-gray-50" : "bg-blue-50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <MailOutlined />
                  <div>
                    <Title level={5}>{notification.title}</Title>
                    <Text>{notification.content}</Text>
                    <div>
                      <Text type="secondary">
                        {format(
                          new Date(notification.timestamp),
                          "dd MMMM yyyy HH:mm",
                          { locale: fr }
                        )}
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {!notification.read && <Badge count={1} className="mr-2" />}
                  <Tag
                    color={notification.read ? "default" : "blue"}
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {notification.read ? "Lu" : "Non lu"}
                  </Tag>
                </div>
              </div>
            ))}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default NotificationInterfaceClient;