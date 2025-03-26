import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm, 
  Card, 
  Typography,
  DatePicker,
  Switch,
  Row,
  Col,
  Select,
  Tag,
  Tooltip,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  TagOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { Endponit, token } from '../../helper/enpoint';
import Paragraph from 'antd/es/skeleton/Paragraph';

const { Title, Text } = Typography;
const { Option } = Select;

const PartenariatInterface = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [esns, setEsns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCardView, setIsCardView] = useState(false);

  // API Configuration
  const API_BASE_URL = Endponit()+'/api';

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token()}`,
      'Content-Type': 'application/json'
    }
  };

  // Categories and statuses
  const categories = ['Diamond', 'Platinum', 'Gold', 'Silver'];
  const statuses = ['Actif', 'Inactif', 'En attente'];

  const getTagColor = (category) => {
    const colors = {
      'Diamond': 'blue',
      'Platinum': 'purple',
      'Gold': 'orange',
      'Silver': 'default'
    };
    return colors[category] || 'default';
  };

  // Fetch Data Functions
  const fetchPartenariats = async () => {
    try {
      setLoading(true);
      const clientId = localStorage.getItem('id');
      
      if (!clientId) {
        message.error('ID du client non trouvé');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/PartenariatClients/?clientId=${clientId}`, axiosConfig);
      const partnershipsData = response.data.data;
      
      // Fetch related data for each partnership
      const enrichedData = await Promise.all(
        partnershipsData.map(async (partnership) => {
          const [esnResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/ESN/${partnership.id_esn}`, axiosConfig)
          ]);
          
          return {
            ...partnership,
            client: { raison_sociale: partnership.client_name }, // Use the name from the API
            esn: esnResponse.data.data[0]
          };
        })
      );
      
      setData(enrichedData);
    } catch (error) {
      message.error('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/client/`, axiosConfig);
      setClients(response.data.data);
    } catch (error) {
      message.error('Erreur lors du chargement des clients');
      console.error(error);
    }
  };

  const fetchEsns = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ESN/`, axiosConfig);
      setEsns(response.data.data);
    } catch (error) {
      message.error('Erreur lors du chargement des ESNs');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPartenariats();
    fetchClients();
    fetchEsns();
  }, []);

  // Modal Handlers
  const showModal = (record = null) => {
    setEditingId(record?.id_part);
    if (record) {
      form.setFieldsValue({
        ...record,
        date_debut: dayjs(record.date_debut),
        date_fin: dayjs(record.date_fin),
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const showViewModal = (record) => {
    setSelectedRecord(record);
    setIsViewModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        id_client: localStorage.getItem('id'),
        ...values,
        date_debut: values.date_debut.format('YYYY-MM-DD'),
        date_fin: values.date_fin.format('YYYY-MM-DD'),
        id_part : editingId // done by me until now 
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/partenariats/${editingId}`, formattedValues, axiosConfig);
        message.success('Partenariat mis à jour avec succès');
      } else {
        await axios.post(`${API_BASE_URL}/partenariats/`, formattedValues, axiosConfig);
        message.success('Partenariat créé avec succès');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchPartenariats();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/partenariats/${id}`, axiosConfig);
      message.success('Partenariat supprimé avec succès');
      fetchPartenariats();
    } catch (error) {
      message.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  // Table Columns
  const columns = [
    // {
    //   title: 'Client',
    //   dataIndex: ['client', 'raison_sociale'],
    //   key: 'client',
    //   sorter: (a, b) => a.client.raison_sociale.localeCompare(b.client.raison_sociale),
    // },
    // {
    //   title: 'ESN',
    //   dataIndex: ['esn', 'Raison_sociale'],
    //   key: 'esn',
    //   sorter: (a, b) => a.esn.Raison_sociale.localeCompare(b.esn.Raison_sociale),
    // },
    {
      title: 'Catégorie',
      dataIndex: 'categorie',
      key: 'categorie',
      render: (categorie) => (
        <Tag color={getTagColor(categorie)}>{categorie}</Tag>
      ),
      filters: categories.map(cat => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.categorie === value,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => (
        <Tag color={statut === 'Actif' ? 'green' : statut === 'Inactif' ? 'red' : 'orange'}>
          {statut}
        </Tag>
      ),
      filters: statuses.map(status => ({ text: status, value: status })),
      onFilter: (value, record) => record.statut === value,
    },
    {
      title: 'Date début',
      dataIndex: 'date_debut',
      key: 'date_debut',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {date}
        </Space>
      ),
      sorter: (a, b) => new Date(a.date_debut) - new Date(b.date_debut),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir les détails">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
              ghost
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer?"
              onConfirm={() => handleDelete(record.id_part)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Card View Component
  const CardViewItem = ({ item }) => (
    <Col xs={24} sm={12} lg={8} xxl={6} style={{ padding: '8px' }}>
      <Card
        hoverable
        actions={[
          <Tooltip title="Voir les détails">
            <EyeOutlined key="view" onClick={() => showViewModal(item)} />
          </Tooltip>,
          <Tooltip title="Modifier">
            <EditOutlined key="edit" onClick={() => showModal(item)} />
          </Tooltip>,
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer?"
            onConfirm={() => handleDelete(item.id_part)}
            okText="Oui"
            cancelText="Non"
          >
            <DeleteOutlined key="delete" />
          </Popconfirm>
        ]}
      >
        <Card.Meta
          title={item.client.raison_sociale}
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary">{item.esn.Raison_sociale}</Text>
              <Tag color={getTagColor(item.categorie)}>{item.categorie}</Tag>
              <Tag color={item.statut === 'Actif' ? 'green' : 'red'}>{item.statut}</Tag>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <Space>
                  <CalendarOutlined />
                  {item.date_debut} - {item.date_fin}
                </Space>
              </Text>
              <Text ellipsis={{ tooltip: item.description }}>
                {item.description}
              </Text>
            </Space>
          }
        />
      </Card>
    </Col>
  );

  return (
    <div style={{ padding: '0px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          {/* <Title level={4} style={{ margin: 0 }}>Gestion des Partenariats</Title> */}
          <Space>
            <Switch
              checkedChildren={<AppstoreOutlined />}
              unCheckedChildren={<UnorderedListOutlined />}
              checked={isCardView}
              onChange={setIsCardView}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Nouveau Partenariat
            </Button>
          </Space>
        </div>

        {isCardView ? (
          <Row gutter={[16, 16]}>
            {data.map(item => (
              <CardViewItem key={item.id_part} item={item} />
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id_part"
            pagination={{ pageSize: 10 }}
            bordered
            loading={loading}
          />
        )}

        <Modal
          title={editingId ? "Modifier le partenariat" : "Ajouter un partenariat"}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            name="partenariatForm"
          >
            <Row gutter={16}>
              {/* <Col span={12}>
                <Form.Item
                  name="id_client"
                  label="Client"
                  rules={[{ required: true, message: 'Veuillez sélectionner le client' }]}
                >
                  <Select placeholder="Sélectionner le client">
                    {clients.map(client => (
                      <Option key={client.ID_clt} value={client.ID_clt}>
                        {client.raison_sociale}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col> */}
              <Col span={12}>
                <Form.Item
                  name="id_esn"
                  label="ESN"
                  rules={[{ required: true, message: 'Veuillez sélectionner l\'ESN' }]}
                >
                  <Select placeholder="Sélectionner l'ESN">
                    {esns.map(esn => (
                      <Option key={esn.ID_ESN} value={esn.ID_ESN}>
                        {esn.Raison_sociale}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="categorie"
                  label="Catégorie"
                  rules={[{ required: true, message: 'Veuillez sélectionner la catégorie' }]}
                >
                  <Select placeholder="Sélectionner la catégorie">
                    {categories.map(cat => (
                      <Option key={cat} value={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="statut"
                  label="Statut"
                  rules={[{ required: true, message: 'Veuillez sélectionner le statut' }]}
                >
                  <Select placeholder="Sélectionner le statut">
                    {statuses.map(status => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date_debut"
                  label="Date de début"
                  rules={[{ required: true, message: 'Veuillez sélectionner la date de début' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="date_fin"
                  label="Date de fin"
                  rules={[{ required: true, message: 'Veuillez sélectionner la date de fin' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Veuillez entrer la description' }]}
            >
              <Input.TextArea rows={4} placeholder="Description du partenariat" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={<Space><EyeOutlined /> Détails du partenariat</Space>}
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsViewModalVisible(false)}>
              Fermer
            </Button>
          ]}
          width={800}
        >
          {selectedRecord && (
            <div style={{ padding: '20px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card>
                      <Space direction="vertical" size="small">
                        <Title level={4}>{selectedRecord.client.raison_sociale}</Title>
                        <Space>
                          <Tag color={getTagColor(selectedRecord.categorie)}>
                            {selectedRecord.categorie}
                          </Tag>
                          <Tag color={selectedRecord.statut === 'Actif' ? 'green' : 'red'}>
                            {selectedRecord.statut}
                          </Tag>
                        </Space>
                      </Space>
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card title="Informations Client" size="small">
                      <Space direction="vertical">
                        <Text><strong>SIRET:</strong> {selectedRecord.client.siret}</Text>
                        <Text><strong>Email:</strong> {selectedRecord.client.mail_contact}</Text>
                        <Text><strong>Téléphone:</strong> {selectedRecord.client.tel_contact}</Text>
                        <Text>
                          <strong>Adresse:</strong> {selectedRecord.client.adresse}, {selectedRecord.client.cp} {selectedRecord.client.ville}
                        </Text>
                      </Space>
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card title="Informations ESN" size="small">
                      <Space direction="vertical">
                        <Text><strong>Raison sociale:</strong> {selectedRecord.esn.Raison_sociale}</Text>
                        <Text><strong>SIRET:</strong> {selectedRecord.esn.SIRET}</Text>
                        <Text><strong>Email:</strong> {selectedRecord.esn.mail_Contact}</Text>
                        <Text><strong>Téléphone:</strong> {selectedRecord.esn.Tel_Contact}</Text>
                      </Space>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card title="Détails du partenariat" size="small">
                      <Space direction="vertical">
                        <Space>
                          <CalendarOutlined />
                          <Text><strong>Période:</strong> Du {selectedRecord.date_debut} au {selectedRecord.date_fin}</Text>
                        </Space>
                        <div style={{ marginTop: '10px' }}>
                          <Text strong>Description:</Text>
                          <Paragraph style={{ marginTop: '5px' }}>
                            {selectedRecord.description}
                          </Paragraph>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default PartenariatInterface;