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
  Checkbox,
  Divider,
  Radio,
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
  TagsOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Endponit } from "../../helper/enpoint";
import parse from 'html-react-parser';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const NotificationInterfaceClient = () => {
  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // New filter states
  const [filterTypes, setFilterTypes] = useState([]);
  const [readStatus, setReadStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchNotifications = async () => {
    setLoading(true);
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

  // Get unique notification types for filter
  const notificationTypes = [...new Set(notifications.map(n => n.type))];

  const getRelativeDateRange = (range) => {
    const today = new Date();
    const result = [new Date(), new Date()];
    
    switch (range) {
      case 'today':
        // Keep today's date for both
        return result;
      case 'yesterday':
        result[0].setDate(today.getDate() - 1);
        result[1].setDate(today.getDate() - 1);
        return result;
      case 'thisWeek':
        // Start of week (Monday)
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        result[0] = new Date(today.setDate(diff));
        result[1] = new Date(); // Today
        return result;
      case 'lastWeek':
        // Previous week (Monday to Sunday)
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        return [lastWeekStart, lastWeekEnd];
      case 'thisMonth':
        result[0] = new Date(today.getFullYear(), today.getMonth(), 1);
        return result;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return [lastMonthStart, lastMonthEnd];
      default:
        return null;
    }
  };

  const filteredNotifications = notifications
    .filter((notification) => {
      // Text search filter
      const textMatch = 
        (notification.originalMessage && 
          notification.originalMessage.toLowerCase().includes(searchText.toLowerCase())) ||
        notification.title.toLowerCase().includes(searchText.toLowerCase());
      
      // Type filter
      const typeMatch = filterTypes.length === 0 || filterTypes.includes(notification.type);
      
      // Read status filter
      const readMatch = 
        readStatus === "all" || 
        (readStatus === "read" && notification.read) || 
        (readStatus === "unread" && !notification.read);
      
      // Date range filter from manual selection
      let dateMatch = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const notificationDate = new Date(notification.timestamp);
        dateMatch = 
          notificationDate >= dateRange[0].startOf('day').toDate() && 
          notificationDate <= dateRange[1].endOf('day').toDate();
      }
      
      // Predefined date filter
      if (dateFilter !== 'all' && dateFilter !== 'custom') {
        const range = getRelativeDateRange(dateFilter);
        if (range) {
          const start = new Date(range[0]);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(range[1]);
          end.setHours(23, 59, 59, 999);
          
          const notificationDate = new Date(notification.timestamp);
          dateMatch = notificationDate >= start && notificationDate <= end;
        }
      }
      
      return textMatch && typeMatch && readMatch && dateMatch;
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
    setFilterTypes([]);
    setReadStatus("all");
    setDateFilter("all");
  };

  const handleFilterTypeChange = (types) => {
    setFilterTypes(types);
  };

  const menu = (
    <Menu>
      <Menu.Item key="mark-all-read" icon={<CheckCircleOutlined />} onClick={handleMarkAllRead}>
        Marquer tout comme lu
      </Menu.Item>
      <Menu.Item key="clear-all" icon={<DeleteOutlined />} onClick={handleClearAll}>
        Effacer toutes les notifications
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="refresh" icon={<ReloadOutlined />} onClick={fetchNotifications}>
        Actualiser
      </Menu.Item>
    </Menu>
  );

  if (error) {
    return (
      <Card className="shadow-md">
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

  // Function to get display name for date filter
  const getDateFilterName = () => {
    switch (dateFilter) {
      case 'today': return "Aujourd'hui";
      case 'yesterday': return "Hier";
      case 'thisWeek': return "Cette semaine";
      case 'lastWeek': return "Semaine dernière";
      case 'thisMonth': return "Ce mois";
      case 'lastMonth': return "Mois dernier";
      default: return "";
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <Text strong className="block mb-2">Type de notification</Text>
                <Select
                  mode="multiple"
                  placeholder="Sélectionner le type..."
                  value={filterTypes}
                  onChange={handleFilterTypeChange}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {notificationTypes.map(type => (
                    <Option key={type} value={type}>
                      {type === 'system' ? 'Système' : 
                       type === 'candidature' ? 'Candidature' : 
                       type.charAt(0).toUpperCase() + type.slice(1)}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Text strong className="block mb-2">Statut de lecture</Text>
                <Radio.Group 
                  value={readStatus} 
                  onChange={e => setReadStatus(e.target.value)}
                  className="w-full"
                >
                  <Radio.Button value="all">Tous</Radio.Button>
                  <Radio.Button value="read">Lus</Radio.Button>
                  <Radio.Button value="unread">Non lus</Radio.Button>
                </Radio.Group>
              </div>
              
              <div>
                <Text strong className="block mb-2">Période prédéfinie</Text>
                <Select
                  value={dateFilter}
                  onChange={value => {
                    setDateFilter(value);
                    if (value === 'custom') {
                      // Keep existing dateRange
                    } else if (value !== 'all') {
                      setDateRange(null); // Clear custom date range
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <Option value="all">Toutes les périodes</Option>
                  <Option value="today">Aujourd'hui</Option>
                  <Option value="yesterday">Hier</Option>
                  <Option value="thisWeek">Cette semaine</Option>
                  <Option value="lastWeek">Semaine dernière</Option>
                  <Option value="thisMonth">Ce mois</Option>
                  <Option value="lastMonth">Mois dernier</Option>
                  <Option value="custom">Période personnalisée</Option>
                </Select>
              </div>
              
              {dateFilter === 'custom' && (
                <div>
                  <Text strong className="block mb-2">Période personnalisée</Text>
                  <RangePicker 
                    className="w-full" 
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder={['Date début', 'Date fin']}
                    allowClear
                  />
                </div>
              )}
              
              <div>
                <Text strong className="block mb-2">Tri</Text>
                <Select 
                  value={sortOrder} 
                  onChange={setSortOrder}
                  style={{ width: '100%' }}
                >
                  <Option value="newest">Plus récentes d'abord</Option>
                  <Option value="oldest">Plus anciennes d'abord</Option>
                  <Option value="unread">Non lues d'abord</Option>
                </Select>
              </div>
            </div>
            <Divider style={{ margin: '8px 0' }} />
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

      {(filterTypes.length > 0 || readStatus !== 'all' || dateFilter !== 'all' || dateRange || sortOrder !== "newest") && (
        <div className="flex mb-3 gap-2 flex-wrap">
          <Text strong>Filtres actifs:</Text>
          
          {filterTypes.length > 0 && (
            <Tag 
              closable 
              onClose={() => setFilterTypes([])}
              icon={<TagsOutlined />}
            >
              Types: {filterTypes.join(', ')}
            </Tag>
          )}
          
          {readStatus !== 'all' && (
            <Tag 
              closable 
              onClose={() => setReadStatus('all')}
              icon={<ReadOutlined />}
            >
              {readStatus === 'read' ? 'Lus uniquement' : 'Non lus uniquement'}
            </Tag>
          )}
          
          {dateFilter !== 'all' && dateFilter !== 'custom' && (
            <Tag 
              closable 
              onClose={() => setDateFilter('all')}
              icon={<CalendarOutlined />}
            >
              {getDateFilterName()}
            </Tag>
          )}
          
          {dateRange && dateFilter === 'custom' && (
            <Tag 
              closable 
              onClose={() => {
                setDateRange(null);
                setDateFilter('all');
              }}
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
              {sortOrder === "oldest" ? "Plus anciennes" : "Non lus d'abord"}
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
        
        <TabPane tab={`Candidature (${candidatureCount})`} key="candidature">
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
        </TabPane>

        <TabPane tab={`Système (${systemCount})`} key="system">
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
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default NotificationInterfaceClient;