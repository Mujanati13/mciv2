import React, { useState, useEffect } from "react";
import {
  Collapse,
  Card,
  Modal,
  Descriptions,
  Tag,
  Typography,
  Table,
  message,
  Button,
  Tooltip,
  Space,
} from "antd";
import {
  LoadingOutlined,
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  UserOutlined,
  EuroOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { Endponit } from "../../helper/enpoint";

const { Panel } = Collapse;
const { Title, Text } = Typography;

const ESNCandidatureInterface = () => {
  const [missions, setMissions] = useState([]);
  const [missionCandidatures, setMissionCandidatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentCandidature, setCurrentCandidature] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const missionsRes = await fetch(
        `${Endponit()}/api/get-appel-offre-with-candidatures-by-esn/?esn_id=${localStorage.getItem("id")}`
      );
      const missionsData = await missionsRes.json();
      const missions = missionsData.data;
      setMissions(missions);

      const candidaturesMap = {};
      await Promise.all(
        missions.map(async (mission) => {
          const candidaturesRes = await fetch(
            `${Endponit()}/api/get-candidatures/?esn_id=${localStorage.getItem('id')}&project_id=${mission.id}`
          );
          const candidaturesData = await candidaturesRes.json();
          candidaturesMap[mission.id] = candidaturesData.data;
        })
      );
      setMissionCandidatures(candidaturesMap);
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

  const handleViewCandidature = (candidature) => {
    setCurrentCandidature(candidature);
    setIsModalVisible(true);
  };

  const getStatusColor = (statut) => {
    switch (statut?.toLowerCase()) {
      case "accepté":
        return "success";
      case "refusé":
        return "error";
      case "en cours":
        return "processing";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const columns = [
    {
      title: "Responsable",
      dataIndex: "responsable_compte",
      key: "responsable",
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "TJM",
      dataIndex: "tjm",
      key: "tjm",
      render: (tjm) => (
        <Tooltip title="Tarif Journalier Moyen">
          <Space>
            <EuroOutlined />
            {`${tjm} €`}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: "Date de candidature",
      dataIndex: "date_candidature",
      key: "date_candidature",
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {formatDate(date)}
        </Space>
      ),
    },
    {
      title: "Date de disponibilité",
      dataIndex: "date_disponibilite",
      key: "date_disponibilite",
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {formatDate(date)}
        </Space>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (statut) => (
        <Tag color={getStatusColor(statut)}>
          {statut}
        </Tag>
      ),
    },
    {
      title: "Commentaire",
      dataIndex: "commentaire",
      key: "commentaire",
      render: (comment) => (
        comment ? (
          <Tooltip title={comment}>
            <Button type="text" icon={<CommentOutlined />}>
              Voir
            </Button>
          </Tooltip>
        ) : "-"
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingOutlined style={{ fontSize: 24 }} spin />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* <Title level={2}>Gestion des Candidatures</Title> */}
      <Collapse accordion className="shadow-sm">
        {missions.map((mission) => (
          <Panel
            header={
              <div>
                <div className="flex justify-between items-center">
                  <Space size="middle">
                    <div className="font-medium text-lg" level={6} style={{ margin: 0 }}>{mission.titre}</div>
                    <Tag color="blue">
                      {missionCandidatures[mission.id]?.length || 0} candidature(s)
                    </Tag>
                  </Space>
                </div>
                <Text type="secondary">{mission.description}</Text>
              </div>
            }
            key={mission.id}
          >
            <Card className="shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Text type="secondary">TJM Client:</Text>
                  <div className="font-semibold">{`${mission.tjm_client} €`}</div>
                </div>
                <div>
                  <Text type="secondary">Statut:</Text>
                  <div>
                    <Tag color={getStatusColor(mission.statut)}>
                      {mission.statut}
                    </Tag>
                  </div>
                </div>
                <div>
                  <Text type="secondary">Date début:</Text>
                  <div className="font-semibold">
                    {formatDate(mission.date_debut)}
                  </div>
                </div>
                <div>
                  <Text type="secondary">Durée:</Text>
                  {/* <div className="font-semibold">{`${mission.date_disponibilite}`}</div> */}
                </div>
              </div>

              <Table
                dataSource={missionCandidatures[mission.id] || []}
                columns={columns}
                rowKey="id_cd"
                onRow={(record) => ({
                  onClick: () => handleViewCandidature(record),
                  className: 'cursor-pointer hover:bg-gray-50'
                })}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} candidatures`
                }}
              />
            </Card>
          </Panel>
        ))}
      </Collapse>

      <Modal
        title={
          <Space>
            <UserOutlined />
            {`Candidature de ${currentCandidature?.responsable_compte}`}
          </Space>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Descriptions bordered column={1} className="mt-4">
          <Descriptions.Item label="ID Candidature">
            {currentCandidature?.id_cd}
          </Descriptions.Item>
          <Descriptions.Item label="Responsable">
            {currentCandidature?.responsable_compte}
          </Descriptions.Item>
          <Descriptions.Item label="TJM">
            {`${currentCandidature?.tjm} €`}
          </Descriptions.Item>
          <Descriptions.Item label="Date de candidature">
            {currentCandidature && formatDate(currentCandidature.date_candidature)}
          </Descriptions.Item>
          <Descriptions.Item label="Date de disponibilité">
            {currentCandidature && formatDate(currentCandidature.date_disponibilite)}
          </Descriptions.Item>
          <Descriptions.Item label="Statut">
            <Tag color={getStatusColor(currentCandidature?.statut)}>
              {currentCandidature?.statut}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Commentaire">
            {currentCandidature?.commentaire || 'Aucun commentaire'}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default ESNCandidatureInterface;