import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Upload,
  Dropdown,
  Menu,
  Select,
  Spin,
  DatePicker,
  Typography,
  Descriptions,
  Space,
  Divider,
  Tag,
} from "antd";
import {
  InboxOutlined,
  DownOutlined,
  LoadingOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  CommentOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { Endponit } from "../../helper/enpoint";

const { TextArea } = Input;
const { Paragraph } = Typography;

const AppelDOffreInterface = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [applyForm] = Form.useForm();
  const [consultants, setConsultants] = useState([]);
  const [nom_co, setNomCo] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelect = (value, option) => {
    // option.dataName contains the concatenated name
    setNomCo(option.dataName);
    console.log("Selected ID:", value);
    console.log("Selected Name:", option.dataName);
  };

  const fetchConsultants = async (id_project) => {
    const esnId = localStorage.getItem("id") || 3;
    try {
      const response = await axios.get(
        `${Endponit()}/api/consultants-par-esn-et-projet/?esn_id=${esnId}&project_id=${id_project}`
      );
      setConsultants(response.data.data);
    } catch (error) {
      message.error("Erreur lors du chargement des consultants");
      console.error("Error fetching consultants:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(Endponit() + "/api/appelOffre/");
      setData(response.data.data || []); // Ensure data is always an array
    } catch (error) {
      message.error("Erreur lors du chargement des appels d'offre");
      console.error("Error fetching data:", error);
      setData([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // fetchConsultants();
  }, []);

  const handleSearch = async (value) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${Endponit()}/api/appelOffre/?search=${value}`
      );
      setData(response.data.data);
    } catch (error) {
      message.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (record) => {
    setCurrentOffer(record);
    fetchConsultants(record.id);
    applyForm.resetFields();
    applyForm.setFieldsValue({
      AO_id: record.id,
    });
    setIsApplyModalVisible(true);
  };

  const handleViewDetails = (record) => {
    setCurrentOffer(record);
    setIsDetailsModalVisible(true);
  };

  const handleApplySubmit = () => {
    applyForm.submit();
  };

  const onApplyFinish = async (values) => {
    setSubmitting(true);
    try {
      const formData = {
        AO_id: currentOffer.id,
        esn_id: localStorage.getItem("id") || 3, // This should come from user context or configuration
        responsable_compte: values.responsable_compte,
        id_consultant: values.id_consultant,
        date_candidature: dayjs().format("YYYY-MM-DD"),
        statut: "En cours",
        tjm: values.tjm,
        date_disponibilite: values.date_disponibilite.format("YYYY-MM-DD"),
        commentaire: values.commentaire,
        nom_cn: nom_co,
      };

      const res_data = await axios.post(
        Endponit() + "/api/candidature/",
        formData
      );
      await axios.post(Endponit() + "/api/notify_new_candidature/", {
        condidature_id: res_data.data.id,
        appel_offre_id: currentOffer.id,
        client_id: currentOffer.id_client,
      });

      // const tokenClient = res_data.data.token;
      // if (tokenClient != null) {
      //   try {
      //     await axios.post("http://51.38.99.75:3006/send-notification", {
      //       deviceToken: tokenClient,
      //       messagePayload: {
      //         title: "une nouvelle candidature",
      //         body: "Vous avez reçu une nouvelle candidature",
      //       },
      //     });
      //   } catch (error) {
      //     console.error(
      //       `Failed to send notification to token ${token}:`,
      //       error
      //     );
      //   }
      // }

      message.success("Votre candidature a été soumise avec succès !");

      setIsApplyModalVisible(false);
      applyForm.resetFields();
    } catch (error) {
      message.error("Erreur lors de la soumission de la candidature");
      console.error("Error submitting application:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      1: "Ouvert",
      2: "En cours",
      3: "Fermé",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColorMap = {
      1: "green",
      2: "blue",
      3: "red",
    };
    return statusColorMap[status] || "default";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Input.Search
          placeholder="Rechercher un appel d'offre"
          onSearch={handleSearch}
          className="w-64"
        />
      </div>

      <Row gutter={[16, 16]}>
        {data.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              className="h-full"
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleApply(item)}
                  disabled={item.statut === "3"}
                >
                  Postuler
                </Button>,
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="view-details" onClick={() => handleViewDetails(item)}>
                        Voir les détails
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={["click"]}
                >
                  <Button>
                    Actions <DownOutlined />
                  </Button>
                </Dropdown>,
              ]}
            >
              <Card.Meta
                title={item.titre}
                description={
                  <div className="space-y-2">
                    <div className="text-sm">
                      {expandedDescriptions[item.id] 
                        ? item.description 
                        : (item.description.length > 100 
                          ? `${item.description.substring(0, 100)}...` 
                          : item.description)
                      }
                      {item.description.length > 100 && (
                        <Button 
                          type="link" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDescription(item.id);
                          }}
                          className="p-0 ml-1"
                          size="small"
                        >
                          {expandedDescriptions[item.id] ? "Voir moins" : "Voir plus"}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">Profil: {item.profil}</p>
                    <p className="text-sm">
                      TJM: {item.tjm_min}€ - {item.tjm_max}€
                    </p>
                    <p className="text-sm">
                      Statut: <Tag color={getStatusColor(item.statut)}>{getStatusLabel(item.statut)}</Tag>
                    </p>
                    <p className="text-sm">
                      Publication: {formatDate(item.date_publication)}
                    </p>
                    <p className="text-sm">
                      Date limite: {formatDate(item.date_limite)}
                    </p>
                    <p className="text-sm">
                      Début: {formatDate(item.date_debut)}
                    </p>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Details Modal */}
      <Modal
        title={<Space><InfoCircleOutlined /> Détails de l'appel d'offre</Space>}
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsDetailsModalVisible(false)}
          >
            Fermer
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              setIsDetailsModalVisible(false);
              handleApply(currentOffer);
            }}
            disabled={currentOffer?.statut === "3"}
          >
            Postuler
          </Button>,
        ]}
        width={700}
      >
        {currentOffer && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Titre">{currentOffer.titre}</Descriptions.Item>
              <Descriptions.Item label="Profil">{currentOffer.profil}</Descriptions.Item>
              <Descriptions.Item label="Description">{currentOffer.description}</Descriptions.Item>
              <Descriptions.Item label="TJM">{currentOffer.tjm_min}€ - {currentOffer.tjm_max}€</Descriptions.Item>
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
                  {formatDate(currentOffer.date_publication)}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Date limite">
                  {formatDate(currentOffer.date_limite)}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Date de début">
                  {formatDate(currentOffer.date_debut)}
                </Card>
              </Col>
            </Row>

            {currentOffer.competences && (
              <>
                <Divider orientation="left">Compétences requises</Divider>
                <div>
                  {currentOffer.competences.split(',').map((skill, index) => (
                    <Tag key={index} color="blue" style={{ margin: '0 8px 8px 0' }}>
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

      {/* Apply Modal */}
      <Modal
        title="Soumettre une candidature"
        open={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsApplyModalVisible(false)}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleApplySubmit}
            loading={submitting}
          >
            Soumettre
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={applyForm}
          onFinish={onApplyFinish}
          layout="vertical"
          initialValues={{
            date_candidature: dayjs(),
          }}
        >
          <Form.Item name="AO_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="responsable_compte"
            label="Responsable compte"
            rules={[{ required: true, message: "Sélectionnez un consultant" }]}
          >
            <Select
              placeholder="Sélectionnez un consultants"
              allowClear // This allows clearing the selection
              optionFilterProp="children"
            >
              {consultants &&
                consultants.map((consultant) =>
                  consultant.Poste === "commercial" ? (
                    <Select.Option
                      key={consultant.ID_collab}
                      value={`${consultant.Nom} ${consultant.Prenom}`} // Adjusted value format
                    >
                      {consultant.Prenom} {consultant.Nom} - {consultant.Poste}
                    </Select.Option>
                  ) : null
                )}
            </Select>
          </Form.Item>

          <Form.Item
            name="id_consultant"
            label="Consultants"
            rules={[{ required: true, message: "Sélectionnez un consultant" }]}
          >
            <Select
              placeholder="Sélectionnez un consultant"
              optionFilterProp="children"
              onSelect={handleSelect}
            >
              {consultants &&
                consultants.map((consultant) =>
                  consultant.Poste === "consultant" ? (
                    <Select.Option
                      key={consultant.ID_collab}
                      value={consultant.ID_collab}
                      dataName={`${consultant.Prenom} ${consultant.Nom}`}
                    >
                      {consultant.Prenom} {consultant.Nom} - {consultant.Poste}
                    </Select.Option>
                  ) : (
                    ""
                  )
                )}
            </Select>
          </Form.Item>

          <Form.Item
            name="tjm"
            label="TJM proposé"
            rules={[
              { required: true, message: "Veuillez saisir le TJM" },
              {
                validator: (_, value) => {
                  if (value && currentOffer) {
                    if (
                      value < currentOffer.tjm_min ||
                      value > currentOffer.tjm_max
                    ) {
                      return Promise.reject(
                        `Le TJM doit être entre ${currentOffer.tjm_min}€ et ${currentOffer.tjm_max}€`
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<DollarOutlined />}
              type="number"
              suffix="€"
              placeholder={`Entre ${currentOffer?.tjm_min} et ${currentOffer?.tjm_max}`}
            />
          </Form.Item>

          <Form.Item
            name="date_disponibilite"
            label="Date de disponibilité"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner une date de disponibilité",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Sélectionnez une date"
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="commentaire"
            label="Commentaire"
            rules={[
              { required: true, message: "Veuillez ajouter un commentaire" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Ajoutez vos commentaires, expériences pertinentes..."
              prefix={<CommentOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppelDOffreInterface;