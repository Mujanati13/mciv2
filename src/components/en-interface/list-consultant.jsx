import React, { useState } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Tooltip,
  Dropdown,
  Modal,
  message,
  Radio,
  Row,
  Col,
  Avatar,Form
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ExportOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  
} from '@ant-design/icons';

const Listconsultant = () => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState(''); // 'table' or 'card'

  // Sample consultant data
  const data = [
    {
      key: '1',
      id: 1,
      nom: 'Jean Dupont',
      email: 'jean.dupont@entreprise.com',
      phone: '+33 6 12 34 56 78',
      poste: 'Développeur',
      status: 'actif',
      created: '2023-06-01',
    },
    {
      key: '2',
      id: 2,
      nom: 'Marie Martin',
      email: 'marie.martin@entreprise.com',
      phone: '+33 6 98 76 54 32',
      poste: 'Chef de projet',
      status: 'inactif',
      created: '2023-09-15',
    },
  ];

  const handleSearch = (value) => {
    setSearchText(value);
    // Add search logic here
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Êtes-vous sûr de vouloir supprimer ce collaborateur ?',
      content: `Cette action supprimera définitivement ${record.nom}.`,
      okText: 'Oui',
      okType: 'danger',
      cancelText: 'Non',
      onOk() {
        message.success('Collaborateur supprimé avec succès');
      },
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Données actualisées');
    }, 1000);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      width: 80,
    },
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
      sorter: (a, b) => a.nom.localeCompare(b.nom),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.nom.toLowerCase().includes(value.toLowerCase()) ||
        record.email.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Poste',
      dataIndex: 'poste',
      key: 'poste',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'actif' ? 'green' : 'red'}>
          {status === 'actif' ? 'Actif' : 'Inactif'}
        </Tag>
      ),
      filters: [
        { text: 'Actif', value: 'actif' },
        { text: 'Inactif', value: 'inactif' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <ActionButtons record={record} handleDelete={handleDelete} />
      ),
    },
  ];

  const ActionButtons = ({ record, handleDelete }) => (
    <Space size="middle">
      <Tooltip title="Modifier">
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => message.info(`Modifier ${record.nom}`)}
        />
      </Tooltip>
      <Tooltip title="Supprimer">
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        />
      </Tooltip>
      <Dropdown
        menu={{
          items: [
            {
              key: '1',
              label: 'Voir détails',
              onClick: () => message.info(`Voir détails de ${record.nom}`),
            },
            {
              key: '2',
              label: 'Historique',
              onClick: () => message.info(`Historique de ${record.nom}`),
            },
          ]
        }}
      >
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    </Space>
  );

  const CardView = ({ data, handleDelete }) => (
    <Row gutter={[16, 16]}>
      {data.map(consultant => (
        <Col xs={24} sm={12} md={8} lg={6} key={consultant.key}>
          <Card
            hoverable
            actions={[
              <EditOutlined key="edit" onClick={() => message.info(`Modifier ${consultant.nom}`)} />,
              <DeleteOutlined key="delete" onClick={() => handleDelete(consultant)} />,
              <MoreOutlined key="more" onClick={() => message.info('Plus d\'options')} />
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<UserOutlined />} size={64} />}
              title={consultant.nom}
              description={
                <Space direction="vertical" size="small">
                  <Tag color={consultant.status === 'actif' ? 'green' : 'red'}>
                    {consultant.status === 'actif' ? 'Actif' : 'Inactif'}
                  </Tag>
                  <Space>
                    <MailOutlined /> {consultant.email}
                  </Space>
                  <Space>
                    <PhoneOutlined /> {consultant.phone}
                  </Space>
                  <Space>
                     {consultant.poste}
                  </Space>
                </Space>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const handleAddconsultant = ()=>{}

  return (
    <Card className='w-full'>
      <Space className='w-full flex flex-row items-center justify-between bg-white'>
        <div className='flex flex-row items-center space-x-5'>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="table">Tableau</Radio.Button>
            <Radio.Button value="card">Cartes</Radio.Button>
          </Radio.Group>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className='flex flex-row items-center space-x-5'>
          <AddconsultantModal onAdd={handleAddconsultant} />
          <Button
            icon={<ExportOutlined />}
            onClick={() => message.info('Exporter les données')}
          >
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            />
          </Tooltip>
        </div>
      </Space>
      <div className='mt-5'></div>
      {viewMode === 'table' ? (
        <>
          <Table
            columns={columns}
            dataSource={data}
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: data.length,
              pageSize: 10,
              showTotal: (total) => `Total ${total} Consultants`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            size="middle"
            onChange={(pagination, filters, sorter) => {
              console.log('Table changed:', { pagination, filters, sorter });
            }}
            scroll={{ x: 'max-content' }}
          />
          <div style={{ marginTop: 16 }}>
            <span style={{ marginLeft: 8 }}>
              {selectedRowKeys.length > 0 ? (
                `${selectedRowKeys.length} collaborateur(s) sélectionné(s)`
              ) : (
                ''
              )}
            </span>
          </div>
        </>
      ) : (
        <CardView data={data} handleDelete={handleDelete} />
      )}
    </Card>
  );
};

const AddconsultantModal = ({ onAdd }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      onAdd(values);
      setIsModalVisible(false);
      form.resetFields();
      message.success('Nouveau collaborateur ajouté avec succès');
    }).catch((info) => {
      console.log('Validate Failed:', info);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <>
      {/* <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
        Nouveau Collaborateur
      </Button> */}
      <Modal
        title="Ajouter un Consultant"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" name="add_consultant">
          <Form.Item
            label="Nom"
            name="nom"
            rules={[{ required: true, message: 'Veuillez saisir le nom du collaborateur' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Veuillez saisir l\'email du collaborateur' }, { type: 'email', message: 'Veuillez saisir un email valide' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Téléphone"
            name="phone"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Poste"
            name="poste"
            rules={[{ required: true, message: 'Veuillez saisir le poste du collaborateur' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Listconsultant;