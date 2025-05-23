import React, { useState, useEffect } from "react";
import axios from "axios";
import { Endponit, token } from "../../helper/enpoint";
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
  message,
  Modal,
  Space,
} from "antd";
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
  Cell,
} from "recharts";
import {
  UserOutlined,
  TeamOutlined,
  ProjectOutlined,
  BankOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  EuroOutlined,
  DownloadOutlined ,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Enhanced custom colors for charts with better visual distinction
const COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
];

const ESNFinancialDashboard = () => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get ESN ID from local storage or session
      const esnId =
        localStorage.getItem("id") || sessionStorage.getItem("id") || 42; // Default to 42 for testing

      // Build query parameters
      const params = new URLSearchParams();
      params.append("esn_id", esnId);
      if (selectedPeriod) {
        params.append("period", selectedPeriod);
      }
      if (selectedYear) {
        params.append("year", selectedYear);
      }

      const response = await axios.get(
        `${Endponit()}/api/esn-financial-dashboard/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

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
      <div
        style={{
          textAlign: "center",
          padding: "100px 50px",
          background: "linear-gradient(to right, #f9f9f9, #ffffff)",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
          margin: "20px",
        }}
      >
        <Spin size="large" />
        <p
          style={{
            marginTop: "20px",
            fontSize: "16px",
            color: "#1890ff",
            fontWeight: "bold",
          }}
        >
          Chargement du tableau de bord financier...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: "20px" }}>
        <Alert
          message={
            <Text strong style={{ fontSize: "16px" }}>
              Erreur
            </Text>
          }
          description={error}
          type="error"
          showIcon
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
          }}
        />
      </div>
    );
  }

  if (!financialData) {
    return (
      <div style={{ margin: "20px" }}>
        <Alert
          message={
            <Text strong style={{ fontSize: "16px" }}>
              Aucune donnée
            </Text>
          }
          description="Aucune donnée financière disponible pour les critères sélectionnés."
          type="info"
          showIcon
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
          }}
        />
      </div>
    );
  }

  const {
    esn,
    summary,
    client_breakdown,
    consultant_breakdown,
    expense_breakdown,
    monthly_data,
  } = financialData;

  // Format for currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Add percentage symbol for percentage values
  const formatPercent = (value) => `${value}%`;

  // Client breakdown table columns
  const clientColumns = [
    {
      title: "Client",
      dataIndex: "client_name",
      key: "client_name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Montant Total",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: "Heures",
      dataIndex: "total_hours",
      key: "total_hours",
      sorter: (a, b) => a.total_hours - b.total_hours,
    },
    {
      title: "Consultants",
      dataIndex: "consultant_count",
      key: "consultant_count",
      sorter: (a, b) => a.consultant_count - b.consultant_count,
    },
    {
      title: "Projets",
      dataIndex: "project_count",
      key: "project_count",
      sorter: (a, b) => a.project_count - b.project_count,
    },
  ];

  // Consultant breakdown table columns
  const consultantColumns = [
    {
      title: "Consultant",
      dataIndex: "consultant_name",
      key: "consultant_name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Poste",
      dataIndex: "poste",
      key: "poste",
    },
    {
      title: "Montant",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: "Heures",
      dataIndex: "total_hours",
      key: "total_hours",
      sorter: (a, b) => a.total_hours - b.total_hours,
    },
    {
      title: "Taux d'utilisation",
      dataIndex: "utilization_rate",
      key: "utilization_rate",
      render: (value) => `${value}%`,
      sorter: (a, b) => a.utilization_rate - b.utilization_rate,
    },
    {
      title: "Dépenses",
      dataIndex: "expense_amount",
      key: "expense_amount",
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.expense_amount - b.expense_amount,
    },
  ]; // Handler functions for filters

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const generateInvoiceData = () => {
    if (!selectedPeriod || !financialData) {
      message.warning('Veuillez sélectionner une période pour afficher la facture');
      return null;
    }

    // Extract month and year from the period
    const [month, year] = selectedPeriod.split('_');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthName = monthNames[parseInt(month, 10) - 1];
    
    // Generate a unique invoice number
    const invoiceNumber = `FAC-${year}${month}-${financialData.esn?.id || '000'}`;
    
    // Current date for the invoice
    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Calculate totals from the data we have
    const totalHT = financialData.summary.total_contract_amount || 0;
    const tva = totalHT * 0.20; // 20% TVA
    const totalTTC = totalHT + tva;
    
    // Generate line items from consultant breakdown
    const lineItems = financialData.consultant_breakdown?.map((consultant, idx) => ({
      id: idx + 1,
      description: `Prestations ${consultant.consultant_name} - ${monthName} ${year}`,
      days: consultant.total_hours || 0,
      unitPrice: consultant.total_amount / (consultant.total_hours || 1), // TJM
      total: consultant.total_amount || 0
    })) || [];

    return {
      invoiceNumber,
      date: currentDate,
      period: `${monthName} ${year}`,
      esn: financialData.esn || {
        name: "Votre ESN",
        address: "Adresse de l'ESN",
        city: "Ville",
        zip: "Code Postal",
        country: "Pays",
        email: "email@esn.com",
        phone: "Téléphone",
        siret: "SIRET",
        tva: "N° TVA"
      },
      client: financialData.client_breakdown?.[0] || {
        client_name: "Client",
        address: "Adresse du client",
        city: "Ville",
        zip: "Code Postal",
        country: "Pays"
      },
      lineItems,
      totalHT,
      tva,
      totalTTC
    };
  };

  const handleShowFacturation = () => {
    const invoice = generateInvoiceData();
    if (invoice) {
      setInvoiceData(invoice);
      setInvoiceModalVisible(true);
    }
  };

  const handleDownloadFacturation = async () => {
    if (!selectedPeriod) {
      message.warning('Veuillez sélectionner une période pour télécharger la facture');
      return;
    }

    try {
      // Get ESN ID from local storage or session
      const esnId = localStorage.getItem('id') || sessionStorage.getItem('id') || 42;
      
      // Send request to download facturation
      const response = await axios.get(
        `${Endponit()}/api/esn-facturation/download`, 
        {
          params: {
            esn_id: esnId,
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
    <div style={{ padding: "20px" }}>      <Row align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Card
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
                  placeholder="Période"
                  style={{ width: 120, marginRight: 16 }}
                  value={selectedPeriod}
                  onChange={handlePeriodChange}
                  allowClear
                  dropdownStyle={{ borderRadius: "6px" }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const value = `${month
                      .toString()
                      .padStart(2, "0")}_${selectedYear}`;
                    return (
                      <Select.Option key={month} value={value}>
                        {month.toString().padStart(2, "0")}/{selectedYear}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>              <Col>
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleShowFacturation}
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
      <Divider style={{ margin: "8px 0 24px", background: "#f0f0f0" }} />
      {/* Key Performance Indicators */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>

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
                  Jours
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
                  TJM moyen
                </Text>
              }
              value={summary.avg_tjm}
              prefix={<EuroOutlined style={{ color: "#faad14" }} />}
              precision={2}
              formatter={(value) => formatCurrency(value)}
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
                  Nombre de consultants
                </Text>
              }
              value={summary.consultant_count}
              prefix={<TeamOutlined style={{ color: "#13c2c2" }} />}
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
                  Consultants actifs
                </Text>
              }
              value={summary.active_consultants}
              prefix={<UserOutlined style={{ color: "#eb2f96" }} />}
              valueStyle={{ color: "#eb2f96", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>{" "}
      {/* Tabs for different sections */}
      <Tabs
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
              <RiseOutlined />
            </span>
          }
          key="1"
        >
          <Card
            title={
              <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                Évolution mensuelle
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
                    if (
                      name.includes("montant") ||
                      name.includes("profit") ||
                      name.includes("dépenses")
                    ) {
                      return formatCurrency(value);
                    } else if (name.includes("marge")) {
                      return formatPercent(value);
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
                  yAxisId="left"
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#52c41a"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#52c41a", stroke: "#fff" }}
                />
                {/* <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margin"
                  name="Marge (%)"
                  stroke="#faad14"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#faad14", stroke: "#fff" }}
                /> */}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>{" "}
        {/* Client Breakdown */}
      </Tabs>
      <style jsx global>{`
        .expense-list-item:hover {
          background-color: #f9f9f9;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
        }
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        
        /* Invoice styles */
        .invoice-container {
          padding: 30px;
          background-color: #fff;
          font-family: Arial, sans-serif;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .invoice-title {
          font-size: 24px;
          color: #1890ff;
          margin-bottom: 5px;
        }
        .invoice-number {
          color: #888;
        }
        .invoice-addresses {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .invoice-address {
          margin-right: 60px;
        }
        .invoice-address h3 {
          color: #1890ff;
          margin-bottom: 10px;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .invoice-table th {
          background-color: #f5f5f5;
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .invoice-table td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .invoice-table-footer {
          margin-top: 20px;
          text-align: right;
        }
        .invoice-total-row {
          font-weight: bold;
          font-size: 16px;
        }
      `}</style>

      {/* Invoice Modal */}
      <Modal
        title={
          <div style={{ color: '#1890ff', fontSize: '20px' }}>
            Facture
          </div>
        }
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setInvoiceModalVisible(false)}
          >
            Fermer
          </Button>,
          <Button
            key="print"
            type="primary"
            onClick={() => window.print()}
            icon={<DownloadOutlined />}
          >
            Imprimer
          </Button>
        ]}
        width={800}
      >
        {invoiceData && (
          <div className="invoice-container">
            <div className="invoice-header">
              <div>
                <div className="invoice-title">FACTURE</div>
                <div className="invoice-number">N° {invoiceData.invoiceNumber}</div>
                <div>Date: {invoiceData.date}</div>
                <div>Période: {invoiceData.period}</div>
              </div>
              <div>
                <h2 style={{ color: '#1890ff' }}>{invoiceData.esn.name}</h2>
                <div>{invoiceData.esn.address}</div>
                <div>{invoiceData.esn.zip} {invoiceData.esn.city}</div>
                <div>{invoiceData.esn.country}</div>
                <div>Email: {invoiceData.esn.email}</div>
                <div>Tél: {invoiceData.esn.phone}</div>
                <div>SIRET: {invoiceData.esn.siret}</div>
                <div>N° TVA: {invoiceData.esn.tva}</div>
              </div>
            </div>
            
            <div className="invoice-addresses">
              <div className="invoice-address">
                <h3>Facturé à</h3>
                <div><strong>{invoiceData.client.client_name}</strong></div>
                <div>{invoiceData.client.address}</div>
                <div>{invoiceData.client.zip} {invoiceData.client.city}</div>
                <div>{invoiceData.client.country}</div>
              </div>
            </div>
            
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Jours</th>
                  <th>Prix unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.lineItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.description}</td>
                    <td>{item.days}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="invoice-table-footer">
              <Row>
                <Col span={16}></Col>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row justify="space-between">
                      <Col>Total HT:</Col>
                      <Col>{formatCurrency(invoiceData.totalHT)}</Col>
                    </Row>
                    <Row justify="space-between">
                      <Col>TVA (20%):</Col>
                      <Col>{formatCurrency(invoiceData.tva)}</Col>
                    </Row>
                    <Row justify="space-between" className="invoice-total-row">
                      <Col>Total TTC:</Col>
                      <Col>{formatCurrency(invoiceData.totalTTC)}</Col>
                    </Row>
                  </Space>
                </Col>
              </Row>
            </div>
            
            <div style={{ marginTop: '40px', textAlign: 'center', color: '#888' }}>
              Merci pour votre collaboration
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ESNFinancialDashboard;
