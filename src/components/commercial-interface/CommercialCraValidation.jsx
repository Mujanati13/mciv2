import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
  Tabs,
  Row,
  Col,
  Typography,
  DatePicker,
  Input,
  Select,
  Spin,
  Form,
  Drawer,
  List,
  Avatar,
  Empty,
  Checkbox,
  Divider,
  Alert,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  HistoryOutlined,
  FileTextOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/fr";
import { Endponit as Endpoint } from "../../helper/enpoint";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// CRA status constants
const CRA_STATUS = {
  A_SAISIR: "À saisir",
  EN_ATTENTE_PRESTATAIRE: "En attente validation prestataire",
  EN_ATTENTE_COMMERCIAL: "En attente validation commercial",
  EN_ATTENTE_CLIENT: "En attente validation client",
  VALIDE: "Validé",
};

const CommercialCraValidation = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [craList, setCraList] = useState([]);
  const [filteredCraList, setFilteredCraList] = useState([]);
  const [viewType, setViewType] = useState("pending"); // pending, history
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [craDetailVisible, setCraDetailVisible] = useState(false);
  const [selectedCra, setSelectedCra] = useState(null);
  const [selectedCraData, setSelectedCraData] = useState({});
  const [validationNote, setValidationNote] = useState("");
  // Filter states
  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showInfoNote, setShowInfoNote] = useState(true);

  // Fetch CRA data when component mounts
  useEffect(() => {
    fetchCraList();
  }, [viewType]); 
  
  // Filter CRA list based on search text and date range
  useEffect(() => {
    filterCraList();
  }, [
    searchText,
    dateRange,
    craList,
    selectedClient,
    selectedConsultant,
    selectedPeriod,
    selectedProject,
  ]);

  // Fetch CRA list from API
  const fetchCraList = async () => {
    setLoading(true);
    // Reset filters, but keep the default status filter
    setSearchText("");
    setDateRange([null, null]);
    setSelectedClient(null);
    setSelectedConsultant(null);
    setSelectedPeriod(null);
    setSelectedProject(null);

    try {
      const token = localStorage.getItem("unifiedToken");
      const userId = localStorage.getItem("userId");
      
      // For development, using mock data instead of real API call
      /*
      const url = `${Endpoint()}/api/commercial/cra/${
        viewType === "pending" ? "pending" : "history"
      }/${userId}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCraList(data.data);
        setFilteredCraList(data.data);
        
        // Extract unique values for filters
        extractFilterOptions(data.data);
      } else {
        message.error(data.message || "Erreur lors du chargement des CRAs");
      }
      */
      
      // Mock data for development
      setTimeout(() => {
        const mockData = generateMockCraData(viewType);
        setCraList(mockData);
        setFilteredCraList(mockData);
        extractFilterOptions(mockData);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Erreur lors du chargement des CRAs:", error);
      message.error("Impossible de charger la liste des CRAs");
      setLoading(false);
    }
  };

  // Generate mock CRA data for development
  const generateMockCraData = (type) => {
    const statuses = type === "pending" 
      ? [CRA_STATUS.EN_ATTENTE_COMMERCIAL, CRA_STATUS.EN_ATTENTE_PRESTATAIRE]
      : [CRA_STATUS.VALIDE, CRA_STATUS.EN_ATTENTE_CLIENT];
    
    const clients = ["SociétéA", "EntrepriseB", "CompagnieC", "OrganisationD"];
    const consultants = ["Jean Dupont", "Marie Martin", "Pierre Durand", "Sophie Lefevre"];
    const projects = ["Développement Web", "Migration Cloud", "Maintenance Applicative", "Conseil IT"];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      consultant: consultants[Math.floor(Math.random() * consultants.length)],
      client: clients[Math.floor(Math.random() * clients.length)],
      project: projects[Math.floor(Math.random() * projects.length)],
      period: `${Math.floor(Math.random() * 12) + 1}/2025`,
      month: Math.floor(Math.random() * 12) + 1,
      year: 2025,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      submission_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      days_worked: Math.floor(Math.random() * 20) + 5,
      total_hours: (Math.floor(Math.random() * 20) + 5) * 8,
      validation_note: "",
    }));
  };

  // Extract unique values for filter options
  const extractFilterOptions = (data) => {
    const clientsSet = new Set(data.map((cra) => cra.client));
    const consultantsSet = new Set(data.map((cra) => cra.consultant));
    const periodsSet = new Set(data.map((cra) => cra.period));
    const statusesSet = new Set(data.map((cra) => cra.status));
    const projectsSet = new Set(data.map((cra) => cra.project));

    setClients(Array.from(clientsSet));
    setConsultants(Array.from(consultantsSet));
    setPeriods(Array.from(periodsSet));
    setStatuses(Array.from(statusesSet));
    setProjects(Array.from(projectsSet));
  };

  // Filter CRA list based on search text and filters
  const filterCraList = () => {
    let filtered = [...craList];

    // Apply text search
    if (searchText) {
      const lowercasedSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (cra) =>
          cra.consultant.toLowerCase().includes(lowercasedSearch) ||
          cra.client.toLowerCase().includes(lowercasedSearch) ||
          cra.project.toLowerCase().includes(lowercasedSearch)
      );
    }

    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");

      filtered = filtered.filter((cra) => {
        const submissionDate = moment(cra.submission_date);
        return submissionDate.isBetween(startDate, endDate, null, "[]");
      });
    }

    // Apply other filters
    if (selectedClient) {
      filtered = filtered.filter((cra) => cra.client === selectedClient);
    }

    if (selectedConsultant) {
      filtered = filtered.filter((cra) => cra.consultant === selectedConsultant);
    }

    if (selectedPeriod) {
      filtered = filtered.filter((cra) => cra.period === selectedPeriod);
    }

    if (selectedProject) {
      filtered = filtered.filter((cra) => cra.project === selectedProject);
    }

    setFilteredCraList(filtered);
  };

  // Handle viewing CRA details
  const handleViewCraDetails = (cra) => {
    setSelectedCra(cra);
    setSelectedCraData(cra);
    setCraDetailVisible(true);
  };

  // Handle validating a CRA
  const handleValidateCra = (cra) => {
    Modal.confirm({
      title: "Valider le CRA",
      content: (
        <div>
          <p>Êtes-vous sûr de vouloir valider le CRA de {cra.consultant} pour {cra.period} ?</p>
          <Input.TextArea
            placeholder="Ajouter un commentaire (optionnel)"
            value={validationNote}
            onChange={(e) => setValidationNote(e.target.value)}
            rows={4}
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          
          // API call would go here in production
          /*
          const token = localStorage.getItem("unifiedToken");
          const response = await fetch(`${Endpoint()}/api/commercial/cra/validate/${cra.id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              note: validationNote,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            message.success("CRA validé avec succès");
            fetchCraList(); // Refresh list
          } else {
            message.error(data.message || "Erreur lors de la validation du CRA");
          }
          */
          
          // Mock successful validation for development
          setTimeout(() => {
            message.success("CRA validé avec succès");
            // Update the CRA list
            const updatedList = craList.map(item => 
              item.id === cra.id 
                ? {...item, status: CRA_STATUS.EN_ATTENTE_CLIENT, validation_note: validationNote} 
                : item
            );
            setCraList(updatedList);
            setValidationNote("");
            setLoading(false);
          }, 1000);
          
        } catch (error) {
          console.error("Erreur lors de la validation du CRA:", error);
          message.error("Impossible de valider le CRA");
          setLoading(false);
        }
      },
      onCancel: () => {
        setValidationNote("");
      },
    });
  };

  // Handle rejecting a CRA
  const handleRejectCra = (cra) => {
    Modal.confirm({
      title: "Rejeter le CRA",
      content: (
        <div>
          <p>Êtes-vous sûr de vouloir rejeter le CRA de {cra.consultant} pour {cra.period} ?</p>
          <Input.TextArea
            placeholder="Motif du rejet (obligatoire)"
            value={validationNote}
            onChange={(e) => setValidationNote(e.target.value)}
            rows={4}
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      onOk: async () => {
        if (!validationNote.trim()) {
          message.error("Veuillez indiquer le motif du rejet");
          return Promise.reject("Motif obligatoire");
        }

        try {
          setLoading(true);
          
          // API call would go here in production
          /*
          const token = localStorage.getItem("unifiedToken");
          const response = await fetch(`${Endpoint()}/api/commercial/cra/reject/${cra.id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              note: validationNote,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            message.success("CRA rejeté avec succès");
            fetchCraList(); // Refresh list
          } else {
            message.error(data.message || "Erreur lors du rejet du CRA");
          }
          */
          
          // Mock successful rejection for development
          setTimeout(() => {
            message.success("CRA rejeté avec succès");
            // Update the CRA list
            const updatedList = craList.map(item => 
              item.id === cra.id 
                ? {...item, status: CRA_STATUS.A_SAISIR, validation_note: validationNote} 
                : item
            );
            setCraList(updatedList);
            setValidationNote("");
            setLoading(false);
          }, 1000);
          
        } catch (error) {
          console.error("Erreur lors du rejet du CRA:", error);
          message.error("Impossible de rejeter le CRA");
          setLoading(false);
        }
      },
      onCancel: () => {
        setValidationNote("");
      },
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: "Consultant",
      dataIndex: "consultant",
      key: "consultant",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
    },
    {
      title: "Projet",
      dataIndex: "project",
      key: "project",
    },
    {
      title: "Période",
      dataIndex: "period",
      key: "period",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Jours travaillés",
      dataIndex: "days_worked",
      key: "days_worked",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        switch (status) {
          case CRA_STATUS.A_SAISIR:
            color = "default";
            break;
          case CRA_STATUS.EN_ATTENTE_PRESTATAIRE:
            color = "processing";
            break;
          case CRA_STATUS.EN_ATTENTE_COMMERCIAL:
            color = "warning";
            break;
          case CRA_STATUS.EN_ATTENTE_CLIENT:
            color = "orange";
            break;
          case CRA_STATUS.VALIDE:
            color = "success";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Soumis le",
      dataIndex: "submission_date",
      key: "submission_date",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir les détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewCraDetails(record)}
            />
          </Tooltip>
          {(record.status === CRA_STATUS.EN_ATTENTE_COMMERCIAL ||
            record.status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE) && (
            <>
              <Tooltip title="Valider">
                <Button
                  type="text"
                  icon={<CheckOutlined style={{ color: "#52c41a" }} />}
                  onClick={() => handleValidateCra(record)}
                />
              </Tooltip>
              <Tooltip title="Rejeter">
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: "#f5222d" }} />}
                  onClick={() => handleRejectCra(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[0, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>Validation des Comptes Rendus d'Activité (CRA)</Title>
            
            {showInfoNote && (
              <Alert
                message="Information"
                description="En tant que commercial, vous devez valider les CRAs des consultants avant qu'ils ne soient envoyés aux clients pour validation finale."
                type="info"
                showIcon
                closable
                onClose={() => setShowInfoNote(false)}
                style={{ marginBottom: 16 }}
              />
            )}

            <Tabs
              activeKey={viewType}
              onChange={(key) => setViewType(key)}
              type="card"
            >
              <TabPane
                tab={
                  <span>
                    <CalendarOutlined /> CRAs en attente
                  </span>
                }
                key="pending"
              />
              <TabPane
                tab={
                  <span>
                    <HistoryOutlined /> Historique des validations
                  </span>
                }
                key="history"
              />
            </Tabs>

            <div style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={24} md={8} lg={6}>
                  <Input
                    placeholder="Rechercher..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={24} md={16} lg={10}>
                  <RangePicker
                    style={{ width: "100%" }}
                    placeholder={["Date début", "Date fin"]}
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={24} md={24} lg={8} style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchCraList}
                    loading={loading}
                  >
                    Actualiser
                  </Button>
                </Col>
              </Row>

              <Divider style={{ margin: "16px 0" }} />

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Filtrer par client"
                    value={selectedClient}
                    onChange={setSelectedClient}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {clients.map((client) => (
                      <Option key={client} value={client}>
                        {client}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Filtrer par consultant"
                    value={selectedConsultant}
                    onChange={setSelectedConsultant}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {consultants.map((consultant) => (
                      <Option key={consultant} value={consultant}>
                        {consultant}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Filtrer par période"
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                    allowClear
                  >
                    {periods.map((period) => (
                      <Option key={period} value={period}>
                        {period}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Filtrer par projet"
                    value={selectedProject}
                    onChange={setSelectedProject}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {projects.map((project) => (
                      <Option key={project} value={project}>
                        {project}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={filteredCraList}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} sur ${total} CRAs`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    description={
                      <span>
                        Aucun CRA {viewType === "pending" ? "en attente" : "dans l'historique"}
                      </span>
                    }
                  />
                ),
              }}
            />
          </Card>
        </Col>
      </Row>
      
      <Drawer
        title={`Détails du CRA - ${selectedCra?.consultant || ""} (${
          selectedCra?.period || ""
        })`}
        placement="right"
        width={720}
        onClose={() => setCraDetailVisible(false)}
        visible={craDetailVisible}
        extra={
          selectedCra &&
          (selectedCra.status === CRA_STATUS.EN_ATTENTE_COMMERCIAL ||
           selectedCra.status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE) && (
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  setCraDetailVisible(false);
                  handleValidateCra(selectedCra);
                }}
              >
                Valider
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setCraDetailVisible(false);
                  handleRejectCra(selectedCra);
                }}
              >
                Rejeter
              </Button>
            </Space>
          )
        }
      >
        {selectedCra && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Informations générales">
                  <p>
                    <strong>Consultant:</strong> {selectedCra.consultant}
                  </p>
                  <p>
                    <strong>Client:</strong> {selectedCra.client}
                  </p>
                  <p>
                    <strong>Projet:</strong> {selectedCra.project}
                  </p>
                  <p>
                    <strong>Période:</strong> {selectedCra.period}
                  </p>
                  <p>
                    <strong>Statut:</strong> 
                    <Tag 
                      color={
                        selectedCra.status === CRA_STATUS.VALIDE ? "success" : 
                        selectedCra.status === CRA_STATUS.EN_ATTENTE_CLIENT ? "orange" : 
                        selectedCra.status === CRA_STATUS.EN_ATTENTE_COMMERCIAL ? "warning" : 
                        selectedCra.status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE ? "processing" : 
                        "default"
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {selectedCra.status}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Résumé d'activité">
                  <p>
                    <strong>Jours travaillés:</strong> {selectedCra.days_worked} jours
                  </p>
                  <p>
                    <strong>Heures totales:</strong> {selectedCra.total_hours} heures
                  </p>
                  <p>
                    <strong>Soumis le:</strong>{" "}
                    {moment(selectedCra.submission_date).format("DD/MM/YYYY")}
                  </p>
                </Card>
              </Col>
            </Row>

            <Card title="Détail des jours travaillés" style={{ marginTop: 16 }}>
              <Table
                columns={[
                  {
                    title: "Date",
                    dataIndex: "date",
                    key: "date",
                  },
                  {
                    title: "Heures",
                    dataIndex: "hours",
                    key: "hours",
                  },
                  {
                    title: "Description",
                    dataIndex: "description",
                    key: "description",
                  },
                ]}
                dataSource={Array.from({ length: selectedCra.days_worked }, (_, i) => ({
                  key: i,
                  date: moment().startOf('month').add(i, 'days').format('DD/MM/YYYY'),
                  hours: Math.floor(Math.random() * 4) + 5,
                  description: `Travail sur ${selectedCra.project} - ${['Développement', 'Tests', 'Documentation', 'Réunion client'][Math.floor(Math.random() * 4)]}`,
                }))}
                pagination={false}
                size="small"
              />
            </Card>
            
            {selectedCra.validation_note && (
              <Card title="Note de validation" style={{ marginTop: 16 }}>
                <p>{selectedCra.validation_note}</p>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CommercialCraValidation;
