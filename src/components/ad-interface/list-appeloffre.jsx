import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Tag,
  Space,
  Row,
  Col,
  Card,
  Modal,
  Descriptions,
  Divider,
  Typography
} from "antd";
import { EyeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { Endponit } from "../../helper/enpoint";

const API_BASE_URL = Endponit() + "/api";
const { Paragraph } = Typography;

const ListeAppelOffre = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);

  // Fetch data from API using the existing endpoint
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/appelOffre/`);
      
      const formattedData = response.data.data
        .filter(item => item.statut !== "3") // Filter out "Closed" status
        .map((item) => ({
          key: item.id.toString(),
          id: item.id,
          title: item.titre,
          description: item.description,
          profile: item.profil,
          tjm_min: item.tjm_min,
          tjm_max: item.tjm_max,
          status: item.statut === "1" ? "Public" : "Restreint",
          publication_date: item.date_publication,
          deadline: item.date_limite,
          start_date: item.date_debut,
          client_id: item.client_id,
          client_name: item.client_name || "Client",
          competences: item.competences,
          contexte: item.contexte,
          statut: item.statut
        }));
      setData(formattedData);
    } catch (error) {
      message.error("Erreur lors du chargement des données");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetails = (record) => {
    setCurrentOffer(record);
    setIsDetailsModalVisible(true);
  };

  // Filter data based on search text
  const filteredData = data.filter(
    (item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase()) ||
      item.profile.toLowerCase().includes(searchText.toLowerCase()) ||
      item.client_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusLabel = (status) => {
    const statusMap = {
      "0": "Brouillon",
      "1": "Ouvert",
      "2": "En cours",
      "3": "Fermé",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColorMap = {
      "0": "gray",
      "1": "green",
      "2": "blue",
      "3": "red",
    };
    return statusColorMap[status] || "default";
  };

  const formatDate = (dateString) => {
    return moment(dateString).format("DD/MM/YYYY");
  };

  const columns = [
    {
      title: "Client",
      dataIndex: "client_name",
      key: "client_name",
      sorter: (a, b) => a.client_name.localeCompare(b.client_name),
    },
    {
      title: "Titre",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Profil",
      dataIndex: "profile",
      key: "profile",
      filters: [
        { text: "Junior", value: "Junior" },
        { text: "Confirmé", value: "Confirmé" },
        { text: "Expert", value: "Expert" },
      ],
      onFilter: (value, record) => record.profile === value,
    },
    {
      title: "TJM",
      render: (_, record) => `${record.tjm_min} - ${record.tjm_max} €`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Public", value: "Public" },
        { text: "Restreint", value: "Restreint" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={status === "Public" ? "green" : "orange"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Date de publication",
      dataIndex: "publication_date",
      key: "publication_date",
      render: (date) => moment(date).format("DD/MM/YYYY"),
      sorter: (a, b) => moment(a.publication_date).unix() - moment(b.publication_date).unix(),
    },
    {
      title: "Date limite",
      dataIndex: "deadline",
      key: "deadline",
      render: (date) => moment(date).format("DD/MM/YYYY"),
      sorter: (a, b) => moment(a.deadline).unix() - moment(b.deadline).unix(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetails(record)}
        >
          Consulter l'Appel d'Offres
        </Button>
      ),
    },
  ];

  return (
    <Card title="Liste des Appels d'Offres" bordered={false}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Input.Search
          placeholder="Rechercher un appel d'offre"
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(value) => setSearchText(value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
      
      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined /> Détails de l'appel d'offre
          </Space>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Fermer
          </Button>
        ]}
        width={700}
      >
        {currentOffer && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Client">
                {currentOffer.client_name}
              </Descriptions.Item>
              <Descriptions.Item label="Titre">
                {currentOffer.title}
              </Descriptions.Item>
              <Descriptions.Item label="Profil">
                {currentOffer.profile}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {currentOffer.description}
              </Descriptions.Item>
              <Descriptions.Item label="TJM">
                {currentOffer.tjm_min}€ - {currentOffer.tjm_max}€
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(currentOffer.statut)}>
                  {getStatusLabel(currentOffer.statut)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Dates importantes</Divider>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" title="Date de publication">
                  {formatDate(currentOffer.publication_date)}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Date limite">
                  {formatDate(currentOffer.deadline)}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Date de début">
                  {formatDate(currentOffer.start_date)}
                </Card>
              </Col>
            </Row>

            {currentOffer.competences && (
              <>
                <Divider orientation="left">Compétences requises</Divider>
                <div>
                  {currentOffer.competences.split(",").map((skill, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ margin: "0 8px 8px 0" }}
                    >
                      {skill.trim()}
                    </Tag>
                  ))}
                </div>
              </>
            )}

            {currentOffer.contexte && (
              <>
                <Divider orientation="left">Contexte</Divider>
                <Paragraph>{currentOffer.contexte}</Paragraph>
              </>
            )}
          </>
        )}
      </Modal>
    </Card>
  );
};

export default ListeAppelOffre;