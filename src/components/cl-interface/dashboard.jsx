import React from 'react';
import { Row, Col, Card, Typography, Button } from 'antd';
import { 
  LineChartOutlined, 
  TeamOutlined, 
  FileTextOutlined, 
  ProjectOutlined,
  RightOutlined
} from '@ant-design/icons';
import ClientFinancialDashboard from './financial-dashboard';

const { Title } = Typography;

const Dashboard = ({ clientStatus, handleMenuClick }) => {
  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <Title level={2}>Tableau de Bord Client</Title>
      
      <ClientFinancialDashboard />
    </div>
  );
};

export default Dashboard;