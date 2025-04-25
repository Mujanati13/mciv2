import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Descriptions,
  Spin,
  Tag,
  Button,
  Row,
  Col,
  Divider,
  Space,
  message,
  Breadcrumb,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  EuroOutlined,
  FileTextOutlined,
  LeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { Link } from "react-router-dom";
import { Endponit } from "../../helper/enpoint";

const { Title, Paragraph } = Typography;

const AppelDOffreDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [appelOffre, setAppelOffre] = useState(null);
  const [error, setError] = useState(null);

  // Fetch appel d'offre details
  useEffect(() => {
    const fetchAppelOffre = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Endponit()}/api/appel-offre/${id}`);
        setAppelOffre(response.data.data);
      } catch (error) {
        console.error("Error fetching appel d'offre:", error);
        setError("Erreur lors du chargement des données");
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchAppelOffre();
  }, [id]);

  // Helper function to get status tag with proper color
  const getStatusTag = (status) => {
    if (status === "1") 
      return <Tag color="green">Public</Tag>;
    if (status === "2") 
      return <Tag color="orange">Restreint</Tag>;
    return <Tag color="default">Brouillon</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <p>Chargement des détails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text type="danger">{error}</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <Link to="/dashboard">Dashboard</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/appels-offres">Appels d'offres</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Détails</Breadcrumb.Item>
      </Breadcrumb>
      
      <Card className="shadow-sm">
        <Row justify="space-between" align="middle" style={{ marginBottom: "24px" }}>
          <Col>
            <Link to="/appels-offres">
              <Button icon={<LeftOutlined />}>
                Retour à la liste
              </Button>
            </Link>
          </Col>
          <Col>
            {getStatusTag(appelOffre?.statut)}
          </Col>
        </Row>

        <Title level={2}>
          <FileTextOutlined style={{ marginRight: "8px" }} />
          {appelOffre?.titre}
        </Title>

        <Divider />

        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
          <Descriptions.Item label="Profil recherché" span={2}>
            <Space>
              <UserOutlined />
              {appelOffre?.profil}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="TJM">
            <Space>
              <EuroOutlined />
              {appelOffre?.tjm_min} - {appelOffre?.tjm_max} €
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Durée (jours)">
            <Space>
              <CalendarOutlined />
              {appelOffre?.jours} jours
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Date de publication">
            <Space>
              <CalendarOutlined />
              {moment(appelOffre?.date_publication).format("DD/MM/YYYY")}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Date limite">
            <Space>
              <CalendarOutlined />
              {moment(appelOffre?.date_limite).format("DD/MM/YYYY")}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Date de début">
            <Space>
              <CalendarOutlined />
              {moment(appelOffre?.date_debut).format("DD/MM/YYYY")}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Description</Divider>
        <Paragraph>{appelOffre?.description}</Paragraph>

        <Divider />
        
        <Row justify="end" gutter={16}>
          <Col>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => message.info("Fonctionnalité de téléchargement à implémenter")}
            >
              Télécharger PDF
            </Button>
          </Col>
          {/* <Col>
            <Button type="primary">
              Postuler à cet appel d'offre
            </Button>
          </Col> */}
        </Row>
      </Card>
    </div>
  );
};

export default AppelDOffreDetail;