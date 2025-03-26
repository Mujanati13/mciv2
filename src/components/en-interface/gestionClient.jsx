import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    Form
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
    PhoneOutlined,
    MailOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { Endponit } from '../../helper/enpoint';

export const ClientList = () => {
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [viewMode, setViewMode] = useState('table');
    const [clients, setClients] = useState([]);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await axios.get(Endponit()+'/api/clients_par_esn/?esn_id=3');
            const formattedData = response.data.data.map((client, index) => ({
                key: client.ID_clt.toString(),
                id: client.ID_clt,
                name: client.raison_sociale,
                email: client.email,
                phone: client.tel_contact,
                status: client.actif ? 'active' : 'inactive',
                address: client.adresse || 'Non spécifié',
                // created: client.date_creation || new Date().toISOString().split('T')[0],
            }));
            setClients(formattedData);
        } catch (error) {
            message.error('Erreur lors du chargement des clients');
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Êtes-vous sûr de vouloir supprimer ce client?',
            content: `Cette action supprimera définitivement ${record.name}.`,
            okText: 'Oui',
            okType: 'danger',
            cancelText: 'Non',
            onOk: async () => {
                try {
                    // Implement delete API call here
                    message.success('Client supprimé avec succès');
                    fetchClients();
                } catch (error) {
                    message.error('Erreur lors de la suppression');
                }
            },
        });
    };

    const handleRefresh = () => {
        fetchClients();
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
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value, record) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
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
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? 'Actif' : 'Inactif'}
                </Tag>
            ),
            filters: [
                { text: 'Actif', value: 'active' },
                { text: 'Inactif', value: 'inactive' },
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
            {/* <Tooltip title="Modifier">
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => message.info('Modifier ' + record.name)}
                />
            </Tooltip>
            <Tooltip title="Supprimer">
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                />
            </Tooltip> */}
            <Dropdown
                menu={{
                    items: [
                        {
                            key: '1',
                            label: 'Voir détails',
                            onClick: () => message.info('Voir détails de ' + record.name),
                        },
                        {
                            key: '2',
                            label: 'Historique',
                            onClick: () => message.info('Historique de ' + record.name),
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
            {data.map(client => (
                <Col xs={24} sm={12} md={8} lg={6} key={client.key}>
                    <Card
                        hoverable
                        actions={[
                            <EditOutlined key="edit" onClick={() => message.info('Modifier ' + client.name)} />,
                            <DeleteOutlined key="delete" onClick={() => handleDelete(client)} />,
                            <MoreOutlined key="more" onClick={() => message.info('Plus d\'options')} />
                        ]}
                    >
                        <Card.Meta
                            avatar={<Avatar icon={<UserOutlined />} size={64} />}
                            title={client.name}
                            description={
                                <Space direction="vertical" size="small">
                                    <Tag color={client.status === 'active' ? 'green' : 'red'}>
                                        {client.status === 'active' ? 'Actif' : 'Inactif'}
                                    </Tag>
                                    <Space>
                                        <MailOutlined /> {client.email}
                                    </Space>
                                    <Space>
                                        <PhoneOutlined /> {client.phone}
                                    </Space>
                                    <Space>
                                        <HomeOutlined /> {client.address}
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

    const handleAddClient = async (values) => {
        try {
            // Implement add client API call here
            message.success('Nouveau client ajouté avec succès');
            fetchClients();
        } catch (error) {
            message.error('Erreur lors de l\'ajout du client');
        }
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
                    <AddClientModal onAdd={handleAddClient} />
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
                        dataSource={clients}
                        rowSelection={rowSelection}
                        loading={loading}
                        pagination={{
                            total: clients.length,
                            pageSize: 10,
                            showTotal: (total) => `Total ${total} clients`,
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
                                `${selectedRowKeys.length} client(s) sélectionné(s)`
                            ) : (
                                ''
                            )}
                        </span>
                    </div>
                </>
            ) : (
                <CardView data={clients} handleDelete={handleDelete} />
            )}
        </Card>
    );
};

const AddClientModal = ({ onAdd }) => {
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
                Nouveau Client
            </Button> */}
            {/* <Modal
                title="Ajouter un Client"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Ajouter"
                cancelText="Annuler"
            >
                <Form form={form} layout="vertical" name="add_client">
                    <Form.Item
                        label="Nom"
                        name="name"
                        rules={[{ required: true, message: 'Veuillez saisir le nom du client' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, message: 'Veuillez saisir l\'email du client' }, { type: 'email', message: 'Veuillez saisir un email valide' }]}
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
                        label="Adresse"
                        name="address"
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal> */}
        </>
    );
};

