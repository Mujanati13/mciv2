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
  Empty,
  Spin,
  Button,
  message,
  Tooltip,
  DatePicker,
  Select,
  Space,
  Collapse,
} from "antd";
import {
  SearchOutlined,
  BellOutlined,
  MailOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  ReloadOutlined,
  FilterOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Endponit } from "../../helper/enpoint";
import parse from 'html-react-parser';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

const NotificationInterfaceClient = () => {
  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
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
        title: notification.event,
        originalMessage: notification.message,
        content: parse(notification.message),
        timestamp: notification.created_at,
        read: notification.status === "Read",
      }));
      setNotifications(transformedNotifications);
    } catch (err) {
      setError(err.message);
      message.error("Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications
    .filter((notification) => {
      // Text search filter
      const textMatch = 
        (notification.originalMessage && 
          notification.originalMessage.toLowerCase().includes(searchText.toLowerCase())) ||
        notification.title.toLowerCase().includes(searchText.toLowerCase());
      
      // Date range filter
      let dateMatch = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const notificationDate = new Date(notification.timestamp);
        dateMatch = 
          notificationDate >= dateRange[0].startOf('day').toDate() && 
          notificationDate <= dateRange[1].endOf('day').toDate();
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
      message.success("Notification marquée comme lue");
    } catch (error) {
      console.error("Erreur:", error);
      message.error("Erreur lors de la mise à jour de la notification");
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
      message.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Erreur:", error);
      message.error("Erreur lors de la mise à jour des notifications");
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
      message.success("Toutes les notifications ont été supprimées");
    } catch (error) {
      console.error("Erreur:", error);
      message.error("Erreur lors de la suppression des notifications");
    }
  };

  const resetFilters = () => {
    setSearchText("");
    setDateRange(null);
    setSortOrder("newest");
    setShowFilters(false);
  };

  const menu = (
    <Menu>
      <Menu.Item key="mark-all-read" icon={<CheckCircleOutlined />} onClick={handleMarkAllRead}>
        Marquer tout comme lu
      </Menu.Item>
    </Menu>
  );

  if (error) {
    return (
      <Card>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span>Erreur: {error}</span>}
        >
          <Button type="primary" onClick={fetchNotifications}>
            Réessayer
          </Button>
        </Empty>
      </Card>
    );
  }

  // Count notifications by type
  const unreadCount = notifications.filter(notification => !notification.read).length;
  const systemCount = notifications.filter(notification => notification.type === "system").length;
  const candidatureCount = notifications.filter(notification => notification.type === "candidature").length;

  const renderNotificationItem = (notification) => (
    <div
      key={notification.id}
      className={`flex items-center justify-between p-4 border-b hover:bg-gray-100 transition-colors duration-200 ${
        notification.read ? "bg-gray-50" : "bg-blue-50"
      }`}
    >
      <div className="flex items-center space-x-4">
        {notification.type === "candidature" && 
          <Tooltip title="Notification de candidature">
            <BellOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </Tooltip>
        }
        {notification.type === "system" && 
          <Tooltip title="Notification système">
            <MailOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
          </Tooltip>
        }
        <div className="max-w-3xl">
          <Title level={5} style={{ margin: '0 0 8px 0' }}>{notification.title}</Title>
          <div className="text-gray-700">{notification.content}</div>
          <div className="mt-2">
            <Text type="secondary" style={{ fontSize: '12px' }}>
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
          className="hover:scale-105 transition-transform duration-200"
        >
          {notification.read ? "Lu" : "Non lu"}
        </Tag>
      </div>
    </div>
  );

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="Aucune notification"
    >
      <Button type="primary" onClick={fetchNotifications}>
        Actualiser
      </Button>
    </Empty>
  );

  return (
    <Card className="shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div className="flex items-center flex-grow md:flex-grow-0 w-full md:w-auto">
          <Input
            placeholder="Rechercher des notifications..."
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
            Filtres
          </Button>
        </div>
        <div className="flex space-x-3 w-full md:w-auto justify-end">
          <Tooltip title="Rafraîchir">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchNotifications}
              className="mr-2"
            />
          </Tooltip>
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button 
              icon={<SettingOutlined />}
              onClick={(e) => e.preventDefault()}
            >
              Options
            </Button>
          </Dropdown>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded mb-4 border">
          <Space direction="vertical" className="w-full">
            <div className="flex flex-col md:flex-row gap-4 mb-3">
              <div className="flex-1">
                <Text strong className="block mb-1">Période</Text>
                <RangePicker 
                  className="w-full" 
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={['Date début', 'Date fin']}
                  allowClear
                />
              </div>
              <div>
                <Text strong className="block mb-1">Tri</Text>
                <Select 
                  value={sortOrder} 
                  onChange={setSortOrder}
                  style={{ width: 200 }}
                >
                  <Option value="newest">Plus récentes d'abord</Option>
                  <Option value="oldest">Plus anciennes d'abord</Option>
                  <Option value="unread">Non lues d'abord</Option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={resetFilters} className="mr-2">
                Réinitialiser
              </Button>
              <Button type="primary" onClick={() => setShowFilters(false)}>
                Appliquer
              </Button>
            </div>
          </Space>
        </div>
      )}

      {(dateRange || sortOrder !== "newest") && (
        <div className="flex mb-3 gap-2 flex-wrap">
          <Text strong>Filtres actifs:</Text>
          {dateRange && (
            <Tag 
              closable 
              onClose={() => setDateRange(null)}
              icon={<CalendarOutlined />}
            >
              {format(dateRange[0].toDate(), "dd/MM/yyyy")} - {format(dateRange[1].toDate(), "dd/MM/yyyy")}
            </Tag>
          )}
          {sortOrder !== "newest" && (
            <Tag 
              closable 
              onClose={() => setSortOrder("newest")}
            >
              {sortOrder === "oldest" ? "Plus anciennes" : "Non lues d'abord"}
            </Tag>
          )}
          <Button 
            type="link" 
            size="small" 
            onClick={resetFilters}
          >
            Effacer tous
          </Button>
        </div>
      )}

      <Tabs 
        defaultActiveKey="all" 
        activeKey={activeTab}
        onChange={setActiveTab}
        animated
      >
        <TabPane tab={`Toutes (${notifications.length})`} key="all">
          <Spin spinning={loading}>
            {filteredNotifications.length === 0 ? (
              emptyState
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications.map(renderNotificationItem)}
              </div>
            )}
          </Spin>
        </TabPane>
        
        <TabPane tab={`Non lues (${unreadCount})`} key="unread">
          <Spin spinning={loading}>
            {filteredNotifications.filter(n => !n.read).length === 0 ? (
              emptyState
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications
                  .filter((notification) => !notification.read)
                  .map(renderNotificationItem)}
              </div>
            )}
          </Spin>
        </TabPane>
        
        {/* <TabPane tab={`Système (${systemCount})`} key="system">
          <Spin spinning={loading}>
            {filteredNotifications.filter(n => n.type === "system").length === 0 ? (
              emptyState
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications
                  .filter((notification) => notification.type === "system")
                  .map(renderNotificationItem)}
              </div>
            )}
          </Spin>
        </TabPane> */}
        
        {/* <TabPane tab={`Candidatures (${candidatureCount})`} key="candidature">
          <Spin spinning={loading}>
            {filteredNotifications.filter(n => n.type === "candidature").length === 0 ? (
              emptyState
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications
                  .filter((notification) => notification.type === "candidature")
                  .map(renderNotificationItem)}
              </div>
            )}
          </Spin>
        </TabPane> */}
      </Tabs>
    </Card>
  );
};

export default NotificationInterfaceClient;