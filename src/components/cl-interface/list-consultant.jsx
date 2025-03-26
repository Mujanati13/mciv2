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
  Avatar,
  Form,
  DatePicker,
  Select
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
  LinkedinOutlined,
  FileOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { Endponit } from '../../helper/enpoint';

const ConsultantManagement = () => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [consultants, setConsultants] = useState([]);

  const fetchConsultants = async () => {
    const id = localStorage.getItem("id");
    setLoading(true);
    try {
      const response = await axios.get(`${Endponit()}/api/consultants_par_client/?client_id=${id}`);
      setConsultants(response.data.data);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      message.error('Failed to fetch consultants');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConsultants();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Êtes-vous sûr de vouloir supprimer ce consultant ?',
      content: `Cette action supprimera définitivement ${record.Nom} ${record.Prenom}.`,
      okText: 'Oui',
      okType: 'danger',
      cancelText: 'Non',
      onOk() {
        message.success('Consultant supprimé avec succès');
      },
    });
  };

  const handleRefresh = () => {
    fetchConsultants();
    message.success('Données actualisées');
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'Nom',
      key: 'Nom',
      sorter: (a, b) => a.Nom.localeCompare(b.Nom),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.Nom.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Prénom',
      dataIndex: 'Prenom',
      key: 'Prenom',
      sorter: (a, b) => a.Prenom.localeCompare(b.Prenom),
    },
    {
      title: 'Date de naissance',
      dataIndex: 'Date_naissance',
      key: 'Date_naissance',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Non renseigné',
    },
    {
      title: 'Poste',
      dataIndex: 'Poste',
      key: 'Poste',
    },
    {
      title: 'Mobilité',
      dataIndex: 'Mobilité',
      key: 'Mobilité',
    },
    {
      title: 'Status',
      dataIndex: 'Actif',
      key: 'Actif',
      render: (actif) => (
        <Tag color={actif ? 'green' : 'red'}>
          {actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
      filters: [
        { text: 'Actif', value: true },
        { text: 'Inactif', value: false },
      ],
      onFilter: (value, record) => record.Actif === value,
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
      <Dropdown
        menu={{
          items: [
            {
              key: '1',
              label: 'Voir détails',
              icon: <UserOutlined />,
              onClick: () => message.info(`Voir détails de ${record.Nom}`),
            },
            {
              key: '2',
              label: 'CV',
              icon: <FileOutlined />,
              onClick: () => window.open(record.CV, '_blank'),
              disabled: !record.CV,
            },
            {
              key: '3',
              label: 'LinkedIn',
              icon: <LinkedinOutlined />,
              onClick: () => window.open(record.LinkedIN, '_blank'),
              disabled: !record.LinkedIN,
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
        <Col xs={24} sm={12} md={8} lg={6} key={consultant.ID_collab}>
          <Card
            hoverable
            actions={[
              <MoreOutlined key="more" onClick={() => message.info('Plus d\'options')} />
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<UserOutlined />} size={64} />}
              title={`${consultant.Nom} ${consultant.Prenom}`}
              description={
                <Space direction="vertical" size="small">
                  <Tag color={consultant.Actif ? 'green' : 'red'}>
                    {consultant.Actif ? 'Actif' : 'Inactif'}
                  </Tag>
                  {consultant.Poste && (
                    <div>
                      <strong>Poste:</strong> {consultant.Poste}
                    </div>
                  )}
                  {consultant.Mobilité && (
                    <div>
                      <strong>Mobilité:</strong> {consultant.Mobilité}
                    </div>
                  )}
                  {consultant.date_debut_activ && (
                    <div>
                      <strong>Début d'activité:</strong> {dayjs(consultant.date_debut_activ).format('DD/MM/YYYY')}
                    </div>
                  )}
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
              loading={loading}
            />
          </Tooltip>
        </div>
      </Space>
      <div className='mt-5'></div>
      {viewMode === 'table' ? (
        <>
          <Table
            columns={columns}
            dataSource={consultants}
            rowSelection={rowSelection}
            loading={loading}
            rowKey="ID_collab"
            pagination={{
              total: consultants?.length,
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
                `${selectedRowKeys.length} consultant(s) sélectionné(s)`
              ) : (
                ''
              )}
            </span>
          </div>
        </>
      ) : (
        <CardView data={consultants} handleDelete={handleDelete} />
      )}
    </Card>
  );
};

export default ConsultantManagement;