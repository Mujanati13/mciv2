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
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Endponit, token } from "../../helper/enpoint";

const API_URL = Endponit() + "/api/collaborateur/";

const CollaboratorList = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  // Fetch collaborators
  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        Endponit() +
          "/api/consultants_par_esn/?esn_id=" +
          localStorage.getItem("id"),
        {
          headers: {
            Authorization: `${token()}`,
          },
        }
      );
      const formattedData = response.data.data.map((collab) => ({
        ...collab,
        key: collab.ID_collab,
        fullName: `${collab.Nom} ${collab.Prenom}`,
        status: collab.Actif ? "actif" : "inactif",
      }));
      setCollaborators(formattedData);
      setLoading(false);
    } catch (error) {
      message.error("Erreur lors du chargement des collaborateurs");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  // Delete Collaborator
  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce collaborateur ?",
      content: `Cette action supprimera définitivement ${record.fullName}.`,
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      async onOk() {
        try {
          await axios.delete(`${API_URL}${record.ID_collab}`, {
            headers: {
              Authorization: `${token()}`,
            },
          });
          message.success("Collaborateur supprimé avec succès");
          fetchCollaborators();
        } catch (error) {
          message.error("Erreur lors de la suppression du collaborateur");
        }
      },
    });
  };

  // Columns for Table View
  const columns = [
    {
      title: "ID",
      dataIndex: "ID_collab",
      key: "ID_collab",
      sorter: (a, b) => a.ID_collab - b.ID_collab,
      width: 80,
    },
    {
      title: "Nom Complet",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.fullName.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Poste",
      dataIndex: "Poste",
      key: "Poste",
    },
    {
      title: "Date de Début",
      dataIndex: "date_debut_activ",
      key: "date_debut_activ",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "actif" ? "green" : "red"}>
          {status === "actif" ? "Actif" : "Inactif"}
        </Tag>
      ),
      filters: [
        { text: "Actif", value: "actif" },
        { text: "Inactif", value: "inactif" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <ActionButtons
          record={record}
          handleDelete={handleDelete}
          fetchCollaborators={fetchCollaborators}
        />
      ),
    },
  ];

  // Action Buttons Component
  const ActionButtons = ({ record, handleDelete, fetchCollaborators }) => {
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm] = Form.useForm();

    const showEditModal = () => {
      setIsEditModalVisible(true);
      editForm.setFieldsValue(record);
    };

    const handleEdit = async () => {
      try {
        const values = await editForm.validateFields();

        // Merge the form values with the existing record data
        const updatedData = {
          ...record,
          ...values,
          Actif: values.Actif !== undefined ? values.Actif : record.Actif,
        };

        // Send the updated data to the server
        await axios.put(API_URL, updatedData, {
          headers: {
            Authorization: token(), // Ensure token() returns the token string
          },
        });

        // Notify the user and refresh data
        message.success("Collaborateur mis à jour avec succès");
        fetchCollaborators();
        setIsEditModalVisible(false);
      } catch (error) {
        console.error("Erreur lors de la mise à jour du collaborateur:", error);
        message.error("Erreur lors de la mise à jour du collaborateur");
      }
    };

    return (
      <>
        <Space size="middle">
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={showEditModal}
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
                  key: "1",
                  label: "Voir détails",
                  onClick: () => {
                    Modal.info({
                      title: "Détails du Collaborateur",
                      content: (
                        <div>
                          <p>Nom: {record.fullName}</p>
                          <p>Poste: {record.Poste}</p>
                          <p>Date de Début: {record.date_debut_activ}</p>
                          <p>Mobilité: {record.Mobilité}</p>
                          <p>LinkedIn: {record.LinkedIN}</p>
                        </div>
                      ),
                    });
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>

        {/* Edit Modal */}
        <Modal
          title="Modifier le Collaborateur"
          visible={isEditModalVisible}
          onOk={handleEdit}
          onCancel={() => setIsEditModalVisible(false)}
          okText="Mettre à jour"
          cancelText="Annuler"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="Nom"
              label="Nom"
              rules={[{ required: true, message: "Veuillez saisir le nom" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Prenom"
              label="Prénom"
              rules={[{ required: true, message: "Veuillez saisir le prénom" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Poste"
              label="Poste"
              rules={[{ required: true, message: "Veuillez saisir le poste" }]}
            >
              <Select placeholder="Sélectionnez un poste">
                <Select.Option value="consultant">Consultant</Select.Option>
                <Select.Option value="commercial">Commercial</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="Actif" label="Statut">
              <Select>
                <Select.Option value={true}>Actif</Select.Option>
                <Select.Option value={false}>Inactif</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  // Card View Component
  const CardView = ({ data, handleDelete, fetchCollaborators }) => (
    <Row gutter={[16, 16]}>
      {data.map((collaborator) => (
        <Col xs={24} sm={12} md={8} lg={6} key={collaborator.ID_collab}>
          <Card
            hoverable
            actions={[
              <EditOutlined
                key="edit"
                onClick={() => {
                  /* Edit logic */
                }}
              />,
              <DeleteOutlined
                key="delete"
                onClick={() => handleDelete(collaborator)}
              />,
              <MoreOutlined
                key="more"
                onClick={() => {
                  /* More options logic */
                }}
              />,
            ]}
          >
            <Card.Meta
              avatar={<Avatar icon={<UserOutlined />} size={64} />}
              title={`${collaborator.Nom} ${collaborator.Prenom}`}
              description={
                <Space direction="vertical" size="small">
                  <Tag color={collaborator.Actif ? "green" : "red"}>
                    {collaborator.Actif ? "Actif" : "Inactif"}
                  </Tag>
                  <Space>{collaborator.Poste}</Space>
                </Space>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Add Collaborator Modal
  const AddCollaboratorModal = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const showModal = () => {
      setIsModalVisible(true);
    };

    const handleOk = async () => {
      try {
        const values = await form.validateFields();
        const newCollaborator = {
          ID_ESN: localStorage.getItem("id"),
          ...values,
          Actif: true,
          date_debut_activ: new Date().toISOString().split("T")[0],
        };

        await axios.post(API_URL, newCollaborator, {
          headers: {
            Authorization: `${token()}`,
          },
        });
        message.success("Nouveau collaborateur ajouté avec succès");
        fetchCollaborators();
        setIsModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error("Erreur lors de l'ajout du collaborateur");
      }
    };

    const handleCancel = () => {
      setIsModalVisible(false);
      form.resetFields();
    };

    return (
      <>
        <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>
          Nouveau Collaborateur
        </Button>
        <Modal
          title="Ajouter un collaborateur"
          visible={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Ajouter"
          cancelText="Annuler"
        >
          <Form form={form} layout="vertical" name="add_collaborator">
            <Form.Item
              label="Nom"
              name="Nom"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le nom du collaborateur",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Prénom"
              name="Prenom"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le prénom du collaborateur",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Poste"
              name="Poste"
              rules={[
                {
                  required: true,
                  message: "Veuillez saisir le poste du collaborateur",
                },
              ]}
            >
              <Select placeholder="Sélectionnez un poste">
                <Select.Option value="consultant">Consultant</Select.Option>
                <Select.Option value="commercial">Commercial</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Mobilité" name="Mobilité">
              <Select>
                <Select.Option value="National">National</Select.Option>
                <Select.Option value="International">
                  International
                </Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  return (
    <Card className="w-full">
      <Space className="w-full flex flex-row items-center justify-between bg-white">
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
          <AddCollaboratorModal />
          <Button
            icon={<ExportOutlined />}
            onClick={() => message.info("Exporter les données")}
          >
            Exporter
          </Button>
          <Tooltip title="Actualiser">
            <Button icon={<ReloadOutlined />} onClick={fetchCollaborators} />
          </Tooltip>
        </div>
      </Space>
      <div className="mt-5"></div>
      {viewMode === "table" ? (
        <Table
          columns={columns}
          dataSource={collaborators}
          loading={loading}
          pagination={{
            total: collaborators.length,
            pageSize: 10,
            showTotal: (total) => `Total ${total} collaborateurs`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          size="middle"
          scroll={{ x: "max-content" }}
        />
      ) : (
        <CardView
          data={collaborators}
          handleDelete={handleDelete}
          fetchCollaborators={fetchCollaborators}
        />
      )}
    </Card>
  );
};

export default CollaboratorList;
