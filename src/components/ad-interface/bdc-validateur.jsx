import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Typography,
  Badge,
  Spin,
  message,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Descriptions,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SaveOutlined,
  FilePdfOutlined,
  EyeOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const DetailsModal = ({ bdc, visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (bdc?.id) {
      fetchDetails();
    }
  }, [bdc]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Endponit()}/api/get-combined-info/${bdc.id}`
      );
      setDetails(response.data.data);
    } catch (error) {
      console.error("Error fetching details:", error);
      message.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Non spécifié";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const calculateNetAmount = (montant, percentage) => {
    const reduction = (montant * percentage) / 100;
    return (montant - reduction).toFixed(2);
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          <span>Détails du BDC #{bdc?.numero_bdc}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin />
        </div>
      ) : (
        <div>
          <Descriptions title="Informations Financières" bordered column={2}>
            <Descriptions.Item label="Montant total brut">
              {details?.bon_commande?.montant_total}€
            </Descriptions.Item>
            <Descriptions.Item label="Pourcentage">
              {details?.bon_commande?.percentage || 0}%
            </Descriptions.Item>
            <Descriptions.Item label="Montant total net">
              {calculateNetAmount(
                details?.bon_commande?.montant_total,
                details?.bon_commande?.percentage || 0
              )}
              €
            </Descriptions.Item>
            <Descriptions.Item label="TJM">
              {details?.candidature?.tjm}€
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title="Informations du Bon de Commande"
            bordered
            column={2}
            style={{ marginTop: "20px" }}
          >
            <Descriptions.Item label="Numéro BDC">
              {details?.bon_commande?.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de création">
              {formatDate(details?.bon_commande?.date_creation)}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              {details?.bon_commande?.statut}
            </Descriptions.Item>
            <Descriptions.Item label="Contrat">
              {details?.bon_commande?.has_contract ? "Oui" : "Non"}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {details?.bon_commande?.description || "Aucune description"}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title="Informations ESN"
            bordered
            column={2}
            style={{ marginTop: "20px" }}
          >
            <Descriptions.Item label="Nom ESN">
              {details?.candidature?.nom_esn || "Non spécifié"}
            </Descriptions.Item>
            <Descriptions.Item label="Contact ESN">
              {details?.candidature?.contact_esn || "Non spécifié"}
            </Descriptions.Item>
            <Descriptions.Item label="Email ESN">
              {details?.candidature?.email_esn || "Non spécifié"}
            </Descriptions.Item>
            <Descriptions.Item label="Téléphone ESN">
              {details?.candidature?.telephone_esn || "Non spécifié"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  );
};

const UpdateBDCModal = ({ bdc, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [montantAchatPrestataire, setMontantAchatPrestataire] = useState(0);
  const [pourcentageMarge, setPourcentageMarge] = useState(0);
  const [montantMarge, setMontantMarge] = useState(0);
  const [montantVenteClient, setMontantVenteClient] = useState(0);
  const [isTTC, setIsTTC] = useState(true); // Par défaut en TTC
  const [tauxTVA, setTauxTVA] = useState(20); // 20% par défaut

  // Initialize values when BDC changes
  useEffect(() => {
    if (bdc) {
      const achatPrestataire = bdc.montant_total || 0;
      const marge = bdc.percentage || 0;
      const montantMargeCalcule = (achatPrestataire * marge) / 100;
      const venteClient = achatPrestataire + montantMargeCalcule;

      setMontantAchatPrestataire(achatPrestataire);
      setPourcentageMarge(marge);
      setMontantMarge(montantMargeCalcule);
      setMontantVenteClient(venteClient);
      setIsTTC(bdc.is_ttc === undefined ? true : bdc.is_ttc);

      // Set form values
      form.setFieldsValue({
        ...bdc,
        montant_achat_prestataire: achatPrestataire,
        pourcentage_marge: marge,
        montant_marge: montantMargeCalcule,
        montant_vente_client: venteClient,
        is_ttc: bdc.is_ttc === undefined ? true : bdc.is_ttc,
        taux_tva: bdc.taux_tva || 20,
        date_emission: bdc.date_emission ? dayjs(bdc.date_emission) : null,
        date_debut_mission: bdc.date_debut_mission
          ? dayjs(bdc.date_debut_mission)
          : null,
        date_fin_mission: bdc.date_fin_mission
          ? dayjs(bdc.date_fin_mission)
          : null,
        statut: bdc.statut || "pending_esn",
      });
    }
  }, [bdc, form]);

  const calculerMontantsAvecTaxes = (montant, estTTC, taux = tauxTVA) => {
    if (estTTC) {
      // Si TTC, calculer le montant HT
      const montantHT = montant / (1 + taux / 100);
      return {
        montantHT: montantHT.toFixed(2),
        montantTTC: montant.toFixed(2),
        montantTVA: (montant - montantHT).toFixed(2),
      };
    } else {
      // Si HT, calculer le montant TTC
      const montantTTC = montant * (1 + taux / 100);
      return {
        montantHT: montant.toFixed(2),
        montantTTC: montantTTC.toFixed(2),
        montantTVA: (montantTTC - montant).toFixed(2),
      };
    }
  };

  // Update calculations when percentage changes
  const handlePourcentageMargeChange = (value) => {
    if (value === null || isNaN(value)) value = 0;

    const newPourcentage = parseFloat(value);
    const newMontantMarge = (montantAchatPrestataire * newPourcentage) / 100;
    const newMontantVenteClient = montantAchatPrestataire + newMontantMarge;

    setPourcentageMarge(newPourcentage);
    setMontantMarge(newMontantMarge);
    setMontantVenteClient(newMontantVenteClient);

    form.setFieldsValue({
      montant_marge: newMontantMarge,
      montant_vente_client: newMontantVenteClient,
    });
  };

  // Update calculations when margin amount changes
  const handleMontantMargeChange = (value) => {
    if (value === null || isNaN(value)) value = 0;

    const newMontantMarge = parseFloat(value);
    const newPourcentage =
      montantAchatPrestataire > 0
        ? (newMontantMarge / montantAchatPrestataire) * 100
        : 0;
    const newMontantVenteClient = montantAchatPrestataire + newMontantMarge;

    setMontantMarge(newMontantMarge);
    setPourcentageMarge(newPourcentage);
    setMontantVenteClient(newMontantVenteClient);

    form.setFieldsValue({
      pourcentage_marge: newPourcentage,
      montant_vente_client: newMontantVenteClient,
    });
  };

  // Toggle between HT and TTC
  const handleTaxTypeChange = (value) => {
    setIsTTC(value === "TTC");
    form.setFieldsValue({
      is_ttc: value === "TTC",
    });
  };

  // Update tax rate
  const handleTauxTVAChange = (value) => {
    setTauxTVA(value);

    // Recalculate with new tax rate
    const current = isTTC ? montantVenteClient : montantAchatPrestataire;
    const taxInfo = calculerMontantsAvecTaxes(current, isTTC, value);

    form.setFieldsValue({
      taux_tva: value,
    });
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Prepare data for submission with renamed fields
      const transformedValues = {
        ...bdc,
        ...values,
        id_bdc: bdc.id,
        montant_achat_prestataire: montantAchatPrestataire,
        montant_total: montantAchatPrestataire, // Keep original field for backward compatibility
        pourcentage_marge: pourcentageMarge,
        percentage: pourcentageMarge, // Keep original field for backward compatibility
        montant_marge: montantMarge,
        benefit: montantMarge, // Keep original field for backward compatibility
        montant_vente_client: montantVenteClient,
        montant_net: montantVenteClient, // Keep original field for backward compatibility
        is_ttc: isTTC,
        taux_tva: tauxTVA,
      };

      const response = await axios.put(
        `${Endponit()}/api/Bondecommande/${bdc.id}`,
        transformedValues
      );

      const resData = await axios.post(
        `${Endponit()}/api/notify_admin_verify_bon_de_commande/`,
        {
          bon_de_commande_id: bdc.id,
          status: values.statut,
        }
      );

      const token = resData.data.client_token;
      if (token != null) {
        console.info("Sending notification to token:", token);
        try {
          await axios.post("http://51.38.99.75:3006/send-notification", {
            deviceToken: token,
            messagePayload: {
              title: "Le bon de commande a été mis à jour",
              body: "",
            },
          });
        } catch (error) {
          console.error(
            `Failed to send notification to token ${token}:`,
            error
          );
        }
      }

      const token2 = resData.data.esn_token;
      if (token2 != null) {
        console.info("Sending notification to token:", token);
        try {
          await axios.post("http://51.38.99.75:3006/send-notification", {
            deviceToken: token2,
            messagePayload: {
              title: "Le bon de commande a été mis à jour",
              body: "",
            },
          });
        } catch (error) {
          console.error(
            `Failed to send notification to token ${token}:`,
            error
          );
        }
      }

      message.success("Bon de commande mis à jour avec succès");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating BDC:", error);
      message.error("Erreur lors de la mise à jour du bon de commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ShoppingOutlined />
          <span>Validation du Bon de Commande #{bdc?.numero_bdc}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="numero_bdc"
              label="Numéro de BDC"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <Input prefix={<FileTextOutlined />} disabled={true} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="statut"
              label="Statut"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <Select placeholder="Sélectionner un statut">
                <Option value="pending_esn">Accepté par Admin</Option>
                <Option value="cancelled">Refusé par Admin</Option>
                <Option value="cancelled">Annulé</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="taux_tva"
              label="Taux de TVA"
              initialValue={tauxTVA}
            >
              <InputNumber
                min={0}
                max={100}
                formatter={(value) => `${value}%`}
                parser={(value) => value.replace("%", "")}
                style={{ width: "100%" }}
                onChange={handleTauxTVAChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Informations financières</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="montant_achat_prestataire"
              label="Montant total d'achat prestataire"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <InputNumber
                prefix={<DollarOutlined />}
                style={{ width: "100%" }}
                formatter={(value) => `${value}€`}
                parser={(value) => value.replace("€", "")}
                disabled
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="pourcentage_marge"
              label="Pourcentage de la marge"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <InputNumber
                prefix={<PercentageOutlined />}
                style={{ width: "100%" }}
                min={0}
                max={100}
                formatter={(value) => `${value}%`}
                parser={(value) => value.replace("%", "")}
                onChange={handlePourcentageMargeChange}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="montant_marge"
              label="Montant de la marge"
              rules={[{ required: true, message: "Champ requis" }]}
            >
              <InputNumber
                prefix={<DollarOutlined />}
                style={{ width: "100%" }}
                min={0}
                formatter={(value) => `${value}€`}
                parser={(value) => value.replace("€", "")}
                onChange={handleMontantMargeChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="montant_vente_client"
              label="Montant total de vente client"
            >
              <InputNumber
                prefix={<DollarOutlined />}
                style={{ width: "100%" }}
                value={montantVenteClient}
                formatter={(value) => `${value}€`}
                parser={(value) => value.replace("€", "")}
                disabled
              />
            </Form.Item>
          </Col>

          {/* Tax information display */}
          <Col span={16}>
            <div style={{ marginBottom: 24 }}>
              <Text strong>Détails fiscaux:</Text>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <Text>
                    Montant HT:{" "}
                    {
                      calculerMontantsAvecTaxes(montantVenteClient, isTTC)
                        .montantHT
                    }
                    €
                  </Text>
                </Col>
                <Col span={8}>
                  <Text>
                    TVA:{" "}
                    {
                      calculerMontantsAvecTaxes(montantVenteClient, isTTC)
                        .montantTVA
                    }
                    €
                  </Text>
                </Col>
                <Col span={8}>
                  <Text>
                    Montant TTC:{" "}
                    {
                      calculerMontantsAvecTaxes(montantVenteClient, isTTC)
                        .montantTTC
                    }
                    €
                  </Text>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        <Divider>Commentaire</Divider>

        <Form.Item name="admin_comment" label="Commentaire administratif">
          <Input.TextArea
            rows={4}
            placeholder="Ajoutez un commentaire ou des instructions..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Annuler</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Envoyer à l'ESN
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BDCManagement = () => {
  const [stats, setStats] = useState({
    totalBDCs: 0,
    activeBDCs: 0,
    pendingBDCs: 0,
    totalAmount: 0,
  });

  const [bdcs, setBDCs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBDC, setSelectedBDC] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // Add status filter state
  const [allBDCs, setAllBDCs] = useState([]); // Store all BDCs for filtering

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filter when statusFilter changes
  useEffect(() => {
    if (allBDCs.length > 0) {
      applyFilters();
    }
  }, [statusFilter, allBDCs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Endponit()}/api/Bondecommande`);
      const bdcsData = response.data.data || [];
      const filter = bdcsData.filter(
        (bdc) =>
          bdc.statut == "pending_admin" ||
          bdc.statut == "active" ||
          bdc.statut == "pending_esn"
      );
      const transformedBDCs = filter.map(transformBDC);
      setAllBDCs(transformedBDCs); // Store all BDCs
      setBDCs(transformedBDCs); // Initially show all BDCs
      const calculatedStats = calculateStats(bdcsData);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (statusFilter === "all") {
      setBDCs(allBDCs);
    } else {
      const filteredBDCs = allBDCs.filter((bdc) => bdc.statut === statusFilter);
      setBDCs(filteredBDCs);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const transformBDC = (bdc) => ({
    ...bdc,
    id: bdc.id_bdc,
    numero_bdc: bdc.numero_bdc || `BDC-${bdc.id_bdc}`,
    date_emission: new Date(bdc.date_emission).toLocaleDateString("fr-FR"),
    date_debut_mission: new Date(bdc.date_debut_mission).toLocaleDateString(
      "fr-FR"
    ),
    date_fin_mission: new Date(bdc.date_fin_mission).toLocaleDateString(
      "fr-FR"
    ),
    montant_total: bdc.montant_total,
    montant_net: bdc.montant_net,
    percentage: bdc.percentage || 0,
    statut: bdc.statut,
    document_path: bdc.document_path,
  });

  const calculateStats = (bdcs) => ({
    totalBDCs: bdcs.length,
    activeBDCs: bdcs.filter((bdc) => bdc.statut === "active").length,
    pendingBDCs: bdcs.filter((bdc) => bdc.statut === "pending_esn").length,
    totalAmount: bdcs.reduce((sum, bdc) => sum + (bdc.montant_net || 0), 0),
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { status: "success", text: "Actif" },
      pending_esn: { status: "processing", text: "En attente ESN" },
      accepted_esn: { status: "processing", text: "Accepté par ESN" },
      rejected_esn: { status: "error", text: "Refusé par ESN" },
      pending_admin: { status: "default", text: "En attente validation admin" },
      cancelled: { status: "error", text: "Annulé" },
    };

    const config = statusConfig[status] || { status: "default", text: status };
    return <Badge status={config.status} text={config.text} />;
  };

  const columns = [
    {
      title: "N° BDC",
      dataIndex: "numero_bdc",
      key: "numero_bdc",
    },
    {
      title: "Montant brut",
      dataIndex: "montant_total",
      key: "montant_total",
      render: (value) => `${value}€`,
    },
    // {
    //   title: "Réduction",
    //   dataIndex: "percentage",
    //   key: "percentage",
    //   render: (value) => `${value}%`,
    // },
    // {
    //   title: "Montant net",
    //   dataIndex: "montant_net",
    //   key: "montant_net",
    //   render: (value) => `${value}€`,
    // },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => getStatusBadge(status),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.statut === "pending_admin" && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedBDC(record);
                setUpdateModalVisible(true);
              }}
            >
              Accepter
            </Button>
          )}
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBDC(record);
              setDetailsModalVisible(true);
            }}
          >
            Détails
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: "16px" }}>
            Chargement des données...
          </Text>
        </div>
      ) : (
        <>
          {/* Status Filter */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col>
              <Space align="center">
                <FilterOutlined />
                <Text strong>Filtrer par statut:</Text>
                <Select
                  defaultValue="all"
                  style={{ width: 200 }}
                  onChange={handleStatusFilterChange}
                  value={statusFilter}
                >
                  <Option value="all">Tous les BDCs</Option>
                  <Option value="pending_admin">
                    En attente validation admin
                  </Option>
                  <Option value="pending_esn">En attente ESN</Option>
                  <Option value="active">Actif</Option>
                  <Option value="cancelled">Annulé</Option>
                </Select>
              </Space>
            </Col>
          </Row>

          <Card style={{ marginTop: 16 }}>
            <Table
              columns={columns}
              dataSource={bdcs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} sur ${total} BDCs`,
              }}
            />
          </Card>

          <UpdateBDCModal
            bdc={selectedBDC}
            visible={updateModalVisible}
            onClose={() => {
              setUpdateModalVisible(false);
              setSelectedBDC(null);
            }}
            onSuccess={fetchData}
          />

          <DetailsModal
            bdc={selectedBDC}
            visible={detailsModalVisible}
            onClose={() => {
              setDetailsModalVisible(false);
              setSelectedBDC(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default BDCManagement;
