import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Checkbox,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { Endponit } from "../../helper/enpoint";
import { calc } from "antd/es/theme/internal";

const API_BASE_URL = Endponit() + "/api";

const AppelDOffreInterface = () => {
  const [data, setData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/appelOffre`);
      const formattedData = response.data.data.map((item) => ({
        key: item.id.toString(),
        title: item.titre,
        description: item.description,
        profile: item.profil,
        tjm_min: item.tjm_min,
        tjm_max: item.tjm_max,
        status: item.statut === "1" ? "Ouvert" : "Fermé",
        publication_date: item.date_publication,
        deadline: item.date_limite,
        start_date: item.date_debut,
        client_id: item.client_id,
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

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.key);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      profile: record.profile,
      tjm_min: record.tjm_min,
      tjm_max: record.tjm_max,
      status: record.status,
      publication_date: moment(record.publication_date),
      deadline: moment(record.deadline),
      start_date: moment(record.start_date),
      workingdayes: calculateWorkingDays(
        moment(record.start_date),
        moment(record.deadline)
      ),
    });
    setIsModalVisible(true);
  };

  const calculateWorkingDays = (
    startDate,
    endDate,
    includeWeekends = false
  ) => {
    if (!startDate || !endDate) return 0;

    const start = moment(startDate).startOf("day");
    const end = moment(endDate).startOf("day");

    if (start.isAfter(end)) return 0;

    let count = 0;
    let current = start.clone();

    while (current.isSameOrBefore(end)) {
      const dayOfWeek = current.day();

      if (includeWeekends) {
        count++;
      } else {
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
      }

      current.add(1, "day");
    }

    return count;
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/appelOffre/${id}`);
      message.success("Appel d'offre supprimé avec succès");
      fetchData();
    } catch (error) {
      message.error("Erreur lors de la suppression");
      console.error("Error deleting item:", error);
    }
  };

  const onFinish = async (values) => {
    try {
      const formData = {
        client_id: localStorage.getItem("id"), // You might want to make this dynamic
        titre: values.title,
        description: values.description,
        profil: values.profile,
        tjm_min: values.tjm_min,
        tjm_max: values.tjm_max,
        date_publication: moment().format("YYYY-MM-DD"),
        date_limite: values.deadline.format("YYYY-MM-DD"),
        date_debut: values.start_date.format("YYYY-MM-DD"),
        statut: values.status === "Ouvert" ? "1" : "0",
        jours: values.workingdayes,
      };

      if (editingId) {
        // Update existing record
        await axios.put(`${API_BASE_URL}/appelOffre/`, {
          ...formData,
          id: editingId,
        });
        message.success("Appel d'offre modifié avec succès");
      } else {
        // Create new record
        const res_data = await axios.post(
          `${API_BASE_URL}/appelOffre/`,
          formData
        );
        await axios.post(`${API_BASE_URL}/notify_expiration_ao/`, {
          ao_id: res_data.data.id,
          client_id: localStorage.getItem("id"),
          // esn_list
        });
        res_data.data.esn_tokens.forEach(async (token) => {
          if (token != null) {
            try {
              await axios.post("http://51.38.99.75:3006/send-notification", {
                deviceToken: token,
                messagePayload: {
                  title: "Un nouvel appel",
                  body: "Un nouvel appel d'offres est arrivé. Rafraîchissez pour voir",
                },
              });
            } catch (error) {
              console.error(
                `Failed to send notification to token ${token}:`,
                error
              );
            }
          }
        });
        message.success("Appel d'offre créé avec succès");
      }

      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error("Erreur lors de l'enregistrement");
      console.error("Error saving data:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const columns = [
    {
      title: "Titre",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Profil",
      dataIndex: "profile",
      key: "profile",
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
        { text: "Ouvert", value: "Ouvert" },
        { text: "Fermé", value: "Fermé" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span style={{ color: status === "Ouvert" ? "#52c41a" : "#ff4d4f" }}>
          {status}
        </span>
      ),
    },
    {
      title: "Date de publication",
      dataIndex: "publication_date",
      key: "publication_date",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Date limite",
      dataIndex: "deadline",
      key: "deadline",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Row gutter={8}>
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.key)}
            />
          </Col>
        </Row>
      ),
    },
  ];

  const handleDateChange = () => {
    const startDate = form.getFieldValue("start_date");
    const deadline = form.getFieldValue("deadline");
    const includeWeekends = form.getFieldValue("include_weekends") || false;

    if (startDate && deadline) {
      const days = calculateWorkingDays(
        new Date(startDate),
        new Date(deadline),
        includeWeekends
      );
      form.setFieldsValue({ workingdayes: days });
    }
  };
  return (
    <div style={{ padding: 0 }}>
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
          onSearch={(value) => console.log(value)}
        />
        <Button type="primary" onClick={handleAdd} icon={<PlusOutlined />}>
          Nouvel appel d'offre
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />

      <Modal
        title={editingId ? "Modifier l'appel d'offre" : "Nouvel appel d'offre"}
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            Annuler
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {editingId ? "Modifier" : "Créer"}
          </Button>,
        ]}
        width={800}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          {/* </Form.Item> */}

          <Form.Item
            name="title"
            label="Titre"
            rules={[{ required: true, message: "Veuillez saisir un titre" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Veuillez saisir une description" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="profile"
            label="Profil"
            rules={[
              { required: true, message: "Veuillez sélectionner un profil" },
            ]}
          >
            <Select>
              <Select.Option value="Junior">Junior</Select.Option>
              <Select.Option value="Confirmé">Confirmé</Select.Option>
              <Select.Option value="Expert">Expert</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tjm_min"
                label="TJM Minimum"
                rules={[
                  { required: true, message: "Veuillez saisir un TJM minimum" },
                ]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tjm_max"
                label="TJM Maximum"
                rules={[
                  { required: true, message: "Veuillez saisir un TJM maximum" },
                ]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="start_date"
                label="Date de début"
                rules={[
                  { required: true, message: "Veuillez sélectionner une date" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  onChange={handleDateChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deadline"
                label="Date limite"
                rules={[
                  { required: true, message: "Veuillez sélectionner une date" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  onChange={handleDateChange}
                />
              </Form.Item>
            </Col>
            <Form.Item
              name="workingdayes"
              label="Jours ouvrés"
              rules={[
                { required: true, message: "Champ requis" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue("start_date");
                    const deadline = getFieldValue("deadline");
                    const maxWorkingDays = calculateWorkingDays(
                      new Date(startDate),
                      new Date(deadline)
                    );

                    if (
                      !value ||
                      (Number(value) >= 0 && Number(value) <= maxWorkingDays)
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        `Le nombre doit être entre 1 et ${maxWorkingDays}`
                      )
                    );
                  },
                }),
              ]}
            >
              <Input type="number" />
            </Form.Item>
          </Row>
          <Form.Item name="include_weekends" valuePropName="checked">
            <Checkbox onChange={handleDateChange}>
              Inclure les week-ends dans le calcul des jours
            </Checkbox>
          </Form.Item>
          <Form.Item
            name="status"
            label="Statut"
            rules={[
              { required: true, message: "Veuillez sélectionner un statut" },
            ]}
          >
            <Select>
              <Select.Option value="Ouvert">Ouvert</Select.Option>
              <Select.Option value="Fermé">Fermé</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppelDOffreInterface;
