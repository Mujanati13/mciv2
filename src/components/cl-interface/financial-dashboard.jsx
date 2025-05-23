import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Endponit, token } from '../../helper/enpoint';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Spin,
  Alert,
  Tabs,
  Divider,
  Progress,
  List,
  Avatar,
  Select,
  Button,
  message
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  UserOutlined,
  TeamOutlined,
  ProjectOutlined,
  BankOutlined,
  RiseOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  EuroOutlined,
  PercentageOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Enhanced custom colors for charts with better visual distinction
const COLORS = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16'
];

const ClientFinancialDashboard = () => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const fetchData = async () => {
    try {
      setLoading(true);
      // Get client ID from local storage or session
      const clientId = localStorage.getItem('id') || sessionStorage.getItem('id') || 101; // Default to 101 for testing
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      if (selectedPeriod) {
        params.append('period', selectedPeriod);
      }
      if (selectedYear) {
        params.append('year', selectedYear);
      }
      
      const response = await axios.get(`${Endponit()}/api/client-financial-dashboard/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });
      
      if (response.data.status) {
        setFinancialData(response.data);
      } else {
        setError("Failed to fetch financial data");
      }
      
      setLoading(false);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedYear]);
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '100px 50px',
        background: 'linear-gradient(to right, #f9f9f9, #ffffff)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
        margin: '20px'
      }}>
        <Spin size="large" />
        <p style={{ 
          marginTop: '20px', 
          fontSize: '16px',
          color: '#1890ff',
          fontWeight: 'bold' 
        }}>
          Chargement du tableau de bord financier...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: '20px' }}>
        <Alert
          message={<Text strong style={{ fontSize: '16px' }}>Erreur</Text>}
          description={error}
          type="error"
          showIcon
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
          }}
        />
      </div>
    );
  }

  if (!financialData) {
    return (
      <div style={{ margin: '20px' }}>
        <Alert
          message={<Text strong style={{ fontSize: '16px' }}>Aucune donnée</Text>}
          description="Aucune donnée financière disponible pour les critères sélectionnés."
          type="info"
          showIcon
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
          }}
        />
      </div>
    );
  }

  const { client, summary, esn_breakdown, project_breakdown, monthly_data } = financialData;

  // Format for currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // ESN breakdown table columns
  const esnColumns = [
    {
      title: 'ESN',
      dataIndex: 'esn_name',
      key: 'esn_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Montant Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.total_amount - b.total_amount
    },
    {
      title: 'Heures',
      dataIndex: 'total_hours',
      key: 'total_hours',
      sorter: (a, b) => a.total_hours - b.total_hours
    },
    {
      title: 'Consultants',
      dataIndex: 'consultant_count',
      key: 'consultant_count',
      sorter: (a, b) => a.consultant_count - b.consultant_count
    },
    {
      title: 'Projets',
      dataIndex: 'project_count',
      key: 'project_count',
      sorter: (a, b) => a.project_count - b.project_count
    }
  ];

  // Project breakdown table columns
  const projectColumns = [
    {
      title: 'Projet',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Montant Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.total_amount - b.total_amount
    },
    {
      title: 'Heures',
      dataIndex: 'total_hours',
      key: 'total_hours',
      sorter: (a, b) => a.total_hours - b.total_hours
    },
    {
      title: 'Consultants',
      dataIndex: 'consultant_count',
      key: 'consultant_count',
      sorter: (a, b) => a.consultant_count - b.consultant_count
    },
    {
      title: 'ESNs',
      dataIndex: 'esn_count',
      key: 'esn_count',
      sorter: (a, b) => a.esn_count - b.esn_count
    }
  ];
  // Update the fetchData function when period or year changes  // Changed useEffect dependency to listen to selectedPeriod and selectedYear
  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedYear]);
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const handleDownloadFacturation = async () => {
    if (!selectedPeriod) {
      message.warning('Veuillez sélectionner une période pour télécharger la facture');
      return;
    }

    try {
      // Get client ID from local storage or session
      const clientId = localStorage.getItem('id') || sessionStorage.getItem('id') || 101;
      
      // Send request to download facturation
      const response = await axios.get(
        `${Endponit()}/api/client-facturation/download`, 
        {
          params: {
            client_id: clientId,
            period: selectedPeriod,
            year: selectedYear
          },
          headers: {
            Authorization: `Bearer ${token()}`
          },
          responseType: 'blob' // Important for downloading files
        }
      );
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_${selectedPeriod}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Facture téléchargée avec succès');
    } catch (err) {
      message.error(`Erreur lors du téléchargement de la facture: ${err.message}`);
      console.error('Erreur de téléchargement:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      
      {/* Period Filter */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col>          <Card 
            size="small" 
            title={
              <Text strong style={{ color: "#1890ff" }}>
                Filtres
              </Text>
            }
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
              borderRadius: "8px",
              background: "linear-gradient(to right, #f9f9f9, #ffffff)",
            }}
          >
            <Row gutter={16} align="middle">
              <Col>
                <Select
                  placeholder="Année"
                  style={{ width: 120, marginRight: 16 }}
                  value={selectedYear}
                  onChange={handleYearChange}
                  dropdownStyle={{ borderRadius: "6px" }}
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <Select.Option key={year} value={year.toString()}>{year}</Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="Période"
                  style={{ width: 120, marginRight: 16 }}
                  value={selectedPeriod}
                  onChange={handlePeriodChange}
                  allowClear
                  dropdownStyle={{ borderRadius: "6px" }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const value = `${month.toString().padStart(2, '0')}_${selectedYear}`;
                    return (
                      <Select.Option key={month} value={value}>
                        {month.toString().padStart(2, '0')}/{selectedYear}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>
              <Col>
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadFacturation}
                  disabled={!selectedPeriod}
                  style={{ 
                    borderRadius: "6px",
                    background: "#52c41a",
                    borderColor: "#52c41a",
                    boxShadow: "0 2px 0 rgba(0,0,0,0.045)"
                  }}
                >
                  Facture
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      {/* Key Performance Indicators */}      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #1890ff",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Montant total des bons de commande
                </Text>
              }
              value={summary.total_bdc_amount}
              prefix={<EuroOutlined style={{ color: "#1890ff" }} />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #52c41a",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Montant total des contrats
                </Text>
              }
              value={summary.total_contract_amount}
              prefix={<EuroOutlined style={{ color: "#52c41a" }} />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #722ed1",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Heures totales
                </Text>
              }
              value={summary.total_hours}
              prefix={<ClockCircleOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #faad14",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Nombre de projets
                </Text>
              }
              value={summary.project_count}
              prefix={<ProjectOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #13c2c2",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Nombre d'ESNs
                </Text>
              }
              value={summary.esn_count}
              prefix={<BankOutlined style={{ color: "#13c2c2" }} />}
              valueStyle={{ color: "#13c2c2", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #eb2f96",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Nombre de consultants
                </Text>
              }
              value={summary.consultant_count}
              prefix={<TeamOutlined style={{ color: "#eb2f96" }} />}
              valueStyle={{ color: "#eb2f96", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              borderLeft: "4px solid #f5222d",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <Statistic
              title={
                <Text strong style={{ fontSize: "16px" }}>
                  Contrats actifs
                </Text>
              }
              value={summary.active_contracts}
              prefix={<ScheduleOutlined style={{ color: "#f5222d" }} />}
              valueStyle={{ color: "#f5222d", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different sections */}      <Tabs
        defaultActiveKey="1"
        type="card"
        size="large"
        animated={true}
        tabBarStyle={{
          marginBottom: "16px",
          fontWeight: "bold",
        }}
      >
        {/* Monthly Evolution */}
        <TabPane 
          tab={
            <span>
              <RiseOutlined /> Évolution Mensuelle
            </span>
          } 
          key="1">          <Card 
            title={
              <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                Évolution mensuelle des indicateurs clés
              </Text>
            }
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
            }}
          >
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthly_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period_formatted" stroke="#666" />
                <YAxis yAxisId="left" stroke="#1890ff" />
                <YAxis yAxisId="right" orientation="right" stroke="#52c41a" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name.includes('montant')) {
                      return formatCurrency(value);
                    }
                    return value;
                  }}
                  contentStyle={{
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    border: "none",
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: "10px",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_amount"
                  name="Montant total"
                  stroke="#1890ff"
                  strokeWidth={2}
                  activeDot={{ r: 8, fill: "#1890ff", stroke: "#fff" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="total_hours"
                  name="Heures totales"
                  stroke="#52c41a"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#52c41a", stroke: "#fff" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="consultant_count"
                  name="Consultants"
                  stroke="#faad14"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#faad14", stroke: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>

        {/* ESN Breakdown */}
        <TabPane 
          tab={
            <span>
              <BankOutlined /> Répartition par ESN
            </span>
          } 
          key="2">
          <Row gutter={[16, 16]}>
            <Col span={16}>              <Card 
                title={
                  <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                    Liste des ESNs
                  </Text>
                }
                bordered={false}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                }}
              >
                <Table
                  dataSource={esn_breakdown}
                  columns={esnColumns}
                  rowKey="esn_id"
                  pagination={{ pageSize: 5 }}
                  rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                title={
                  <Text strong style={{ fontSize: "18px", color: "#722ed1" }}>
                    Répartition du montant par ESN
                  </Text>
                }
                bordered={false}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                  height: '100%' 
                }}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 40 }}>
                    <Pie
                      data={esn_breakdown}
                      dataKey="total_amount"
                      nameKey="esn_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      fill="#8884d8"
                      labelLine={false} 
                    >
                      {esn_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const percentage = props.payload && props.payload.percent !== undefined 
                                           ? `(${(props.payload.percent * 100).toFixed(1)}%)` 
                                           : '';
                        return [`${formatCurrency(value)} ${percentage}`, name];
                      }}
                      contentStyle={{
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        border: "none",
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: "20px",
                        paddingBottom: "10px"
                      }}
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Project Breakdown */}
        <TabPane 
          tab={
            <span>
              <ProjectOutlined /> Répartition par Projet
            </span>
          } 
          key="3">
          <Card 
            title={
              <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                Liste des projets
              </Text>
            }
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
              marginBottom: "20px" // Added margin for spacing
            }}
          >
            <Table
              dataSource={project_breakdown}
              columns={projectColumns}
              rowKey="project_id"
              pagination={{ pageSize: 5 }}
              rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
            />
          </Card>
          <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
            <Col span={12}>
              <Card 
                title={
                  <Text strong style={{ fontSize: "18px", color: "#8884d8" }}>
                    Budget par projet
                  </Text>
                }
                bordered={false}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                  height: '100%'
                }}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={project_breakdown} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="project_name" 
                      stroke="#666" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} // Adjust height for angled labels
                      interval={0} // Show all labels
                    />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        border: "none",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }}/>
                    <Bar dataKey="total_amount" name="Montant" fill="#8884d8">
                      {project_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title={
                  <Text strong style={{ fontSize: "18px", color: "#82ca9d" }}>
                    Heures par projet
                  </Text>
                }
                bordered={false}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
                  height: '100%'
                }}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={project_breakdown} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="project_name" 
                      stroke="#666" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} // Adjust height for angled labels
                      interval={0} // Show all labels
                    />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        border: "none",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }}/>
                    <Bar dataKey="total_hours" name="Heures totales" fill="#82ca9d">
                      {project_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Resource Allocation */}
        <TabPane 
          tab={
            <span>
              <TeamOutlined /> Allocation des Ressources
            </span>
          } 
          key="4">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Consultants par projet">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={project_breakdown}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="project_name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="consultant_count" name="Nombre de consultants" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="ESNs par projet">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={project_breakdown}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="project_name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="esn_count" name="Nombre d'ESNs" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
            <Col span={24}>
              <Card title="Distribution des consultants et ESNs par projet">
                <List
                  itemLayout="horizontal"
                  dataSource={project_breakdown}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: COLORS[project_breakdown.indexOf(item) % COLORS.length] }}>
                            {item.project_name.charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={item.project_name}
                        description={`Budget: ${formatCurrency(item.total_amount)} | Heures: ${item.total_hours}`}
                      />
                      <div style={{ width: '300px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <Text>Consultants: {item.consultant_count}</Text>
                          <Progress 
                            percent={Math.round((item.consultant_count / summary.consultant_count) * 100)} 
                            size="small"
                            strokeColor="#0088FE" 
                          />
                        </div>
                        <div>
                          <Text>ESNs: {item.esn_count}</Text>
                          <Progress 
                            percent={Math.round((item.esn_count / summary.esn_count) * 100)} 
                            size="small"
                            strokeColor="#00C49F"
                          />
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>    </div>
  );
};

export default ClientFinancialDashboard;

// CSS styles are included directly in the component using the style jsx global tag
