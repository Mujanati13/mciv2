import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Select,
} from "antd";
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
  HomeOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";
import * as XLSX from "xlsx";
import { parseJSON } from "date-fns/fp";

const { Option } = Select;

export const ClientList = () => {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [clients, setClients] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Fetch clients from API
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Endponit()}/api/client/`, {
        headers: {
          Authorization: `${token()}`,
        },
      });
      const formattedData = response.data.data.map((client) => ({
        key: client.ID_clt,
        id: client.ID_clt,
        name: client.raison_sociale,
        email: client.mail_contact,
        phone: client.tel_contact,
        status: client.statut,
        address: `${client.adresse}, ${client.cp} ${client.ville}`,
        created: client.date_validation,
        siret: client.siret,
        pays: client.pays,
        province: client.province,
        n_tva: client.n_tva,
        iban: client.iban,
        bic: client.bic,
        banque: client.banque,
        ville: client.ville,
        cp: client.cp,
      }));
      setClients(formattedData);
    } catch (error) {
      message.error("Erreur lors du chargement des clients");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries
  const fetchCountries = async () => {
    try {
      const response = await axios.get(`http://51.38.99.75:3100/api/countries`);
      setCountries(response.data);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // Fetch cities based on country
  const fetchCities = async (countryId) => {
    try {
      const response = await axios.get(`http://51.38.99.75:3100/api/cities/${countryId}`);
      setCities(response.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // Handle country change
  const handleCountryChange = (value) => {
    setSelectedCountry(value);
    fetchCities(value);
  };

  // Export to Excel
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(clients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "clients.xlsx");
  };

  const handlePostError = (response) => {
    const errors = response?.data?.errors;
    console.log("Errors:", errors);
    
    if (errors) {
      if (errors.SIRET || errors.siret) {
        message.error("Ce numéro SIRET est déjà utilisé");
      }
      if (errors.mail_Contact) {
        message.error("Cette adresse email est déjà utilisée");
      }
    }
  };

  // Add/Update client
  const handleClientAction = async (values) => {
    try {
      if (editingClient) {
        await axios.put(
          `${Endponit()}/api/client/${editingClient.id}`,
          { ...values, ID_clt: editingClient.id },
          {
            headers: { Authorization: `${token()}` },
          }
        );
        message.success("Client mis à jour avec succès");
      } else {
        const res = await axios.post(`${Endponit()}/api/client/`, values, {
          headers: { Authorization: `${token()}` },
        });
        if (res.data.status === true) {
          message.success("Client ajouté avec succès");
          // showPasswordPrompt(); // Refresh with password
        } else {
          handlePostError(res);
        } //
      }
      fetchClients();
      setIsModalVisible(false);
      setEditingClient(null);
    } catch (error) {
      // message.error(
      //   editingClient
      //     ? "Erreur lors de la mise à jour du client"
      //     : "Erreur lors de l'ajout du client"
      // );
      handlePostError(error.response);
      console.error("Client action error:", error.response.data.data);
    }
  };

  // Delete client
  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce client?",
      content: `Cette action supprimera définitivement ${record.name}.`,
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      async onOk() {
        try {
          await axios.delete(`${Endponit()}/api/client/${record.id}`, {
            headers: { Authorization: `${token()}` },
          });
          message.success("Client supprimé avec succès");
          fetchClients(); // Refresh the list after deletion
        } catch (error) {
          message.error("Erreur lors de la suppression du client");
          console.error("Delete error:", error);
        }
      },
    });
  };

  // Client Modal Form
  const ClientModalForm = () => {
    const [form] = Form.useForm();

    useEffect(() => {
      if (editingClient) {
        form.setFieldsValue({
          raison_sociale: editingClient.name,
          siret: editingClient.siret,
          mail_contact: editingClient.email,
          tel_contact: editingClient.phone,
          adresse: editingClient.address.split(",")[0].trim(),
          cp: editingClient.cp,
          ville: editingClient.ville,
          pays: editingClient.pays,
        });
        if (editingClient.pays) {
          handleCountryChange(editingClient.pays);
        }
      } else {
        form.resetFields();
      }
    }, [editingClient, form]);

    return (
      <Modal
        title={editingClient ? "Modifier le Client" : "Nouveau Client"}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingClient(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleClientAction}>
          <Form.Item
            name="raison_sociale"
            label="Raison Sociale"
            rules={[
              { required: true, message: "Veuillez saisir la raison sociale" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="siret"
            label="SIRET"
            rules={[{ required: true, message: "Veuillez saisir le SIRET" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="mail_contact"
            label="Email"
            rules={[
              { required: true, message: "Veuillez saisir l'email" },
              { type: "email", message: "Veuillez saisir un email valide" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="tel_contact"
            label="Téléphone"
            rules={[
              { required: true, message: "Veuillez saisir le téléphone" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="adresse"
            label="Adresse"
            rules={[{ required: true, message: "Veuillez saisir l'adresse" }]}
          >
            <Input />
          </Form.Item>
          {!editingClient && (
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[
                { required: true, message: "Veuillez saisir le mot de passe" },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="pays"
            label="Pays"
            rules={[
              { required: true, message: "Veuillez sélectionner le pays" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="ville"
            label="Ville"
            rules={[
              { required: true, message: "Veuillez sélectionner la ville" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cp"
            label="Code Postal"
            rules={[
              { required: true, message: "Veuillez saisir le code postal" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingClient ? "Mettre à jour" : "Ajouter Client"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      width: 80,
    },
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        record.email.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "validé" ? "green" : "red"}>
          {status === "validé" ? "Validé" : "Non Validé"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingClient(record);
                setIsModalVisible(true);
              }}
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
          <Tooltip title="Détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: "Détails du Client",
                  content: (
                    <div>
                      <p>
                        <strong>Raison Sociale:</strong> {record.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {record.email}
                      </p>
                      <p>
                        <strong>Téléphone:</strong> {record.phone}
                      </p>
                      <p>
                        <strong>Adresse:</strong> {record.address}
                      </p>
                      <p>
                        <strong>SIRET:</strong> {record.siret}
                      </p>
                      <p>
                        <strong>N° TVA:</strong> {record.n_tva}
                      </p>
                    </div>
                  ),
                  width: 520,
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Card View Component
  const CardView = ({ data }) => (
    <Row gutter={[16, 16]}>
      {data.map((client) => (
        <Col xs={24} sm={12} md={8} lg={6} key={client.key}>
          <Card
            hoverable
            actions={[
              <EditOutlined
                key="edit"
                onClick={() => {
                  setEditingClient(client);
                  setIsModalVisible(true);
                }}
              />,
              <DeleteOutlined
                key="delete"
                onClick={() => handleDelete(client)}
              />,
              <EyeOutlined
                key="view"
                onClick={() => {
                  Modal.info({
                    title: "Détails du Client",
                    content: (
                      <div>
                        <p>
                          <strong>Raison Sociale:</strong> {client.name}
                        </p>
                        <p>
                          <strong>Email:</strong> {client.email}
                        </p>
                        <p>
                          <strong>Téléphone:</strong> {client.phone}
                        </p>
                        <p>
                          <strong>Adresse:</strong> {client.address}
                        </p>
                        <p>
                          <strong>SIRET:</strong> {client.siret}
                        </p>
                        <p>
                          <strong>N° TVA:</strong> {client.n_tva}
                        </p>
                      </div>
                    ),
                    width: 520,
                  });
                }}
              />,
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={client.name}
              description={
                <Space direction="vertical">
                  <Tag color={client.status === "validé" ? "green" : "red"}>
                    {client.status === "validé" ? "Validé" : "Non Validé"}
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

  // Initialize data
  useEffect(() => {
    fetchClients();
    fetchCountries();
  }, []);

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <Card className="w-full">
      <Space className="w-full flex flex-row items-center justify-between bg-white mb-4">
        <div className="flex flex-row items-center space-x-5">
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
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className="flex flex-row items-center space-x-5">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingClient(null);
              setIsModalVisible(true);
            }}
          >
            Nouveau Client
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={fetchClients} />
          </Tooltip>
        </div>
      </Space>

      {viewMode === "table" ? (
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
            scroll={{ x: "max-content" }}
          />
          {selectedRowKeys.length > 0 && (
            <div className="mt-4">
              <span>{selectedRowKeys.length} client(s) sélectionné(s)</span>
            </div>
          )}
        </>
      ) : (
        <CardView data={clients} />
      )}
      <ClientModalForm />
    </Card>
  );
};

export default ClientList;
