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
  DownOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Endponit } from "../../helper/enpoint";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const NotificationInterface = () => {
  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [update, setupdate] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        Endponit() +
          "/api/getNotifications/?type=esn&id=" +
          localStorage.getItem("id")
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      // Transform the API data to match our component's structure
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [update]);

  const filteredNotifications = notifications.filter((notification) => {
    return (
      notification.content.toLowerCase().includes(searchText.toLowerCase()) ||
      notification.title.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const handleMarkAsRead = async (id) => {
    // Here you would typically make an API call to update the notification status
    // For now, we'll just update the local state
    const updatedNotifications = notifications.map((notification) => {
      if (notification.id === id) {
        return { ...notification, read: true };
      }
      return notification;
    });
    setupdate(!update);
    setNotifications(updatedNotifications);
  };

  const handleMarkAllRead = async () => {
    // Here you would typically make an API call to mark all as read
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
    setNotifications(updatedNotifications);
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const menu = (
    <Menu>
      <Menu.Item key="mark-all-read" onClick={handleMarkAllRead}>
        Marquer tout comme lu
      </Menu.Item>
      <Menu.Item key="clear-all" onClick={handleClearAll}>
        Effacer toutes les notifications
      </Menu.Item>
    </Menu>
  );

  if (loading) {
    return (
      <Card>
        <div>Chargement des notifications...</div>
      </Card>
    );
  }

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
        <TabPane tab="Tout" key="all">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center justify-between p-4 border-b ${
                notification.read ? "bg-gray-100" : "bg-blue-100"
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
                  color={notification.read ? "gray" : "blue"}
                  onClick={() => handleMarkAsRead(notification.id)}
                  style={{ cursor: "pointer" }}
                >
                  {notification.read ? "Lu" : "Non lu"}
                </Tag>
              </div>
            </div>
          ))}
        </TabPane>
        <TabPane tab="Candidature" key="candidature">
          {filteredNotifications
            .filter((notification) => notification.type === "candidature")
            .map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 border-b ${
                  notification.read ? "bg-gray-100" : "bg-blue-100"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <BellOutlined />
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
                    color={notification.read ? "gray" : "blue"}
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {notification.read ? "Lu" : "Non lu"}
                  </Tag>
                </div>
              </div>
            ))}
        </TabPane>
        <TabPane tab="Système" key="system">
          {filteredNotifications
            .filter((notification) => notification.type === "system")
            .map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 border-b ${
                  notification.read ? "bg-gray-100" : "bg-blue-100"
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
                    color={notification.read ? "gray" : "blue"}
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

export default NotificationInterface;
