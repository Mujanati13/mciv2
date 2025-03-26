import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Table,
  Button,
  Modal,
  message,
  Tag,
  Typography,
  Space,
  Tooltip,
  Descriptions,
  Alert,
  Form,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Endponit } from "../../helper/enpoint";

const { Text } = Typography;
const { confirm } = Modal;

const OrderInterface = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isContractReviewModalVisible, setIsContractReviewModalVisible] =
    useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState({});

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const esnId = localStorage.getItem("id");
      if (!esnId) {
        message.error("ID ESN non trouvé dans le stockage local");
        return;
      }
      const response = await axios.get(
        `${Endponit()}/api/get_bon_de_commande_by_client/?client_id=${esnId}`
      );
      setPurchaseOrders(response.data.data);
    } catch (error) {
      message.error("Échec de la récupération des bons de commande");
    } finally {
      setLoading(false);
    }
  };

  const [dates, setDates] = useState({
    date_debut: null,
    date_fin: null,
  });

  const handleCreateContract = async () => {
    try {
      const formattedValues = {
        candidature_id: selectedPO?.candidature_id,
        date_signature: format(new Date(), "yyyy-MM-dd"),
        date_debut: dates.date_debut?.format("YYYY-MM-DD"),
        date_fin: dates.date_fin?.format("YYYY-MM-DD"),
        statut: "active",
        montant: selectedPO?.montant_total,
        numero_contrat: `CONTRAT_${selectedPO?.numero_bdc}`,
      };

      const response = await axios.post(
        `${Endponit()}/api/Contrat/`,
        formattedValues
      );

      if (response.data && response.data.id_contrat) {
        const clientId = localStorage.getItem("id");
        // const response = await axios.post(
        //   `${Endponit()}/api/Contrat/`,
        //   formattedValues
        // );

        await axios.put(`${Endponit()}/api/Bondecommande/`, {
          ...selectedPO,
          has_contract: response.data.id_contrat,
        });

        await axios.post(`${Endponit()}/api/notify_signature_contrat/`, {
          client_id: clientId,
          esn_id: response.data.esn_id,
          contrat_id: response.data.id_contrat,
        });

        message.success("Contrat créé avec succès");
        setIsContractReviewModalVisible(false);
        fetchPurchaseOrders();
      }
    } catch (error) {
      message.error("Échec de la création du contrat");
    }
  };

  const downloadContract = async (contractId) => {
    setDownloadLoading((prev) => ({
      ...prev,
      [`contract_${contractId}`]: true,
    }));

    try {
      const response = await axios.get(
        `${Endponit()}/api/download_contract/${contractId}`,
        { responseType: "json" } // Changed to json
      );

      const contractData = response.data.data;
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CONTRAT DE PRESTATION DE SERVICES", 105, 20, {
        align: "center",
      });

      // Contract number and date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`N° ${contractData.numero_contrat}`, 20, 40);
      doc.text(`Date: ${contractData.date_signature}`, 150, 40);

      // Parties
      doc.setFont("helvetica", "bold");
      doc.text("ENTRE LES SOUSSIGNÉS:", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.text(
        [
          "La société " + contractData.esn,
          "Ci-après dénommée « Le Prestataire »",
          "",
          "ET",
          "",
          "La société " + contractData.client,
          "Ci-après dénommée « Le Client »",
        ],
        20,
        70
      );

      // Contract details
      doc.setFont("helvetica", "bold");
      doc.text("IL A ÉTÉ CONVENU CE QUI SUIT:", 20, 120);
      doc.setFont("helvetica", "normal");
      doc.text(
        [
          "Article 1 - Durée du contrat",
          `Date de début: ${contractData.date_debut}`,
          `Date de fin: ${contractData.date_fin}`,
          "",
          "Article 2 - Conditions financières",
          `Montant total de la prestation: ${contractData.montant} €`,
          "",
          "Article 3 - Conditions particulières",
          contractData.conditions,
        ],
        20,
        130
      );

      // Signatures
      doc.setFont("helvetica", "bold");
      doc.text("SIGNATURES DES PARTIES", 105, 220, { align: "center" });
      doc.setFont("helvetica", "normal");

      // Left signature block
      doc.text("Pour le Prestataire", 50, 240, { align: "center" });
      doc.rect(20, 250, 70, 30);
      doc.text("Nom et qualité du signataire:", 20, 290);
      doc.text("Date:", 20, 300);

      // Right signature block
      doc.text("Pour le Client", 160, 240, { align: "center" });
      doc.rect(130, 250, 70, 30);
      doc.text("Nom et qualité du signataire:", 130, 290);
      doc.text("Date:", 130, 300);

      // Footer
      doc.setFontSize(8);
      doc.text(`Page 1/1`, 105, 290, { align: "center" });
      doc.save(`Contract_${contractId}.pdf`);
      message.success("Contrat téléchargé avec succès");
    } catch (error) {
      console.error("Download error:", error);
      message.error("Échec du téléchargement du contrat");
    } finally {
      setDownloadLoading((prev) => ({
        ...prev,
        [`contract_${contractId}`]: false,
      }));
    }
  };
  // Status Helpers
  const getStatusLabel = (status) => {
    const statusMap = {
      pending_esn: "En attente",
      accepted_esn: "Soumis",
      rejected_esn: "Refusé",
    };
    return statusMap[status] || status;
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending_esn: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "En cours",
      },
      accepted_esn: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Soumis",
      },
      rejected_esn: {
        color: "error",
        icon: <CloseCircleOutlined />,
        text: "Refusé",
      },
    };
    const config = statusConfig[status] || statusConfig["pending_esn"];

    return (
      <Tag icon={config.icon} color={config.color}>
        {config.text}
      </Tag>
    );
  };

  const handleAccept = async (id, bdc) => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/${id}`, {
        ...bdc,
        statut: "accepted_esn",
      });
      message.success("Bon de commande accepté avec succès");
      await fetchPurchaseOrders();
    } catch (error) {
      message.error("Échec de l'acceptation du bon de commande");
    }
  };

  const handleReject = async (id, bdc) => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/${id}`, {
        ...bdc,
        statut: "rejected_esn",
      });
      message.success("Bon de commande refusé");
      await fetchPurchaseOrders();
    } catch (error) {
      message.error("Échec du refus du bon de commande");
    }
  };

  const showAcceptConfirm = (record) => {
    confirm({
      title: "Accepter le bon de commande",
      icon: <CheckCircleOutlined className="text-green-500" />,
      content: `Êtes-vous sûr de vouloir accepter le bon de commande n°${record.numero_bdc} ?`,
      okText: "Accepter",
      okType: "primary",
      cancelText: "Annuler",
      onOk() {
        handleAccept(record.id_bdc, record);
      },
    });
  };

  const showRejectConfirm = (record) => {
    confirm({
      title: "Refuser le bon de commande",
      icon: <CloseCircleOutlined className="text-red-500" />,
      content: `Êtes-vous sûr de vouloir refuser le bon de commande n°${record.numero_bdc} ?`,
      okText: "Refuser",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        handleReject(record.id_bdc, record);
      },
    });
  };

  const generatePDF = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Bon de Commande", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Numéro BDC: ${record.numero_bdc}`, 20, 40);
    doc.text(
      `Date de création: ${format(
        new Date(record.date_creation),
        "dd MMMM yyyy",
        {
          locale: fr,
        }
      )}`,
      20,
      50
    );
    doc.text(`Montant total: ${record.montant_total.toFixed(2)} €`, 20, 60);
    doc.text(`Statut: ${getStatusLabel(record.statut)}`, 20, 70);

    if (record.description) {
      doc.text("Description:", 20, 90);
      const splitDescription = doc.splitTextToSize(record.description, 170);
      doc.text(splitDescription, 20, 100);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    return doc;
  };

  const handleDownload = async (record) => {
    setDownloadLoading((prev) => ({ ...prev, [record.id_bdc]: true }));
    try {
      const doc = generatePDF(record);
      doc.save(`BDC_${record.numero_bdc}.pdf`);
      message.success("Bon de commande téléchargé avec succès");
    } catch (error) {
      message.error("Échec du téléchargement du bon de commande");
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [record.id_bdc]: false }));
    }
  };

  const purchaseOrderColumns = [
    {
      title: "Numéro BDC",
      dataIndex: "numero_bdc",
      key: "numero_bdc",
      render: (text) => (
        <Text strong className="text-blue-600">
          {text}
        </Text>
      ),
    },
    {
      title: "Date de création",
      dataIndex: "date_creation",
      key: "date_creation",
      render: (date) => format(new Date(date), "dd MMMM yyyy", { locale: fr }),
    },
    {
      title: "Montant",
      dataIndex: "montant_total",
      key: "montant_total",
      render: (amount) => (
        <Text strong className="text-green-600">
          {amount.toFixed(2)} €
        </Text>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Voir les détails">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setIsDetailsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Télécharger BDC PDF">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              loading={downloadLoading[record.id_bdc]}
            />
          </Tooltip>
          {record.statut === "pending_esn" && (
            <>
              <Tooltip title="Accepter">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  className="bg-green-500"
                  onClick={() => showAcceptConfirm(record)}
                />
              </Tooltip>
              <Tooltip title="Refuser">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => showRejectConfirm(record)}
                />
              </Tooltip>
            </>
          )}
          {record.statut === "accepted_esn" && !record.has_contract && (
            <Tooltip title="Créer un contrat">
              <Button
                type="primary"
                onClick={() => {
                  setSelectedPO(record);
                  setIsContractReviewModalVisible(true);
                }}
                icon={<FileAddOutlined />}
              >
                Créer un contrat
              </Button>
            </Tooltip>
          )}
          {record.has_contract && (
            <Tooltip title="Télécharger le contrat">
              <Button
                icon={<DownloadOutlined />}
                onClick={() => downloadContract(record.has_contract)}
                loading={downloadLoading[`contract_${record.has_contract}`]}
              >
                Télécharger le contrat
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card className="shadow-sm">
      <div className="mb-4">
        <div className="mt-4 mb-2">
          <Input
            placeholder="Rechercher par numéro ou description..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md"
          />
        </div>

        {purchaseOrders?.filter((po) => po.statut === "pending_esn").length >
          0 && (
          <Alert
            message="Bons de commande en attente"
            description={`Vous avez ${
              purchaseOrders?.filter((po) => po.statut === "pending_esn").length
            } bon(s) de commande en attente de validation.`}
            type="info"
            showIcon
            className="mb-4"
          />
        )}
      </div>

      <Table
        columns={purchaseOrderColumns}
        dataSource={purchaseOrders?.filter(
          (po) =>
            po.numero_bdc?.toLowerCase().includes(searchText.toLowerCase()) ||
            po.description?.toLowerCase().includes(searchText.toLowerCase())
        )}
        rowKey="id_bdc"
        loading={loading}
        size="small"
        pagination={{
          pageSize: 4,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
      />

      {/* Purchase Order Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Détails du Bon de Commande
          </Space>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(selectedPO)}
            loading={downloadLoading[selectedPO?.id_bdc]}
          >
            Télécharger
          </Button>,
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Fermer
          </Button>,
          selectedPO?.statut === "pending_esn" && (
            <>
              <Button
                key="accept"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  showAcceptConfirm(selectedPO);
                  setIsDetailsModalVisible(false);
                }}
                className="bg-green-500"
              >
                Accepter
              </Button>
              ,
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  showRejectConfirm(selectedPO);
                  setIsDetailsModalVisible(false);
                }}
              >
                Refuser
              </Button>
            </>
          ),
        ].filter(Boolean)}
        width={700}
      >
        {selectedPO && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro BDC" span={2}>
              {selectedPO.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de création">
              {format(new Date(selectedPO.date_creation), "dd MMMM yyyy", {
                locale: fr,
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              {getStatusTag(selectedPO.statut)}
            </Descriptions.Item>
            <Descriptions.Item label="Montant total" span={2}>
              <Text strong className="text-green-600">
                {selectedPO.montant_total.toFixed(2)} €
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedPO.description}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Contract Review Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Revue du Contrat
          </Space>
        }
        open={isContractReviewModalVisible}
        onCancel={() => setIsContractReviewModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsContractReviewModalVisible(false)}
          >
            Annuler
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={handleCreateContract}
            className="bg-blue-500"
          >
            Créer le Contrat
          </Button>,
        ]}
        width={700}
      >
        <div className="font-medium mt-4">Date de contrat</div>
        <div className="flex items-center space-x-5 ">
          <Form.Item
            label="Date de début"
            name="date_debut"
            rules={[{ required: true }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              onChange={(date) =>
                setDates((prev) => ({ ...prev, date_debut: date }))
              }
            />
          </Form.Item>

          <Form.Item
            label="Date de fin"
            name="date_fin"
            rules={[{ required: true }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              onChange={(date) =>
                setDates((prev) => ({ ...prev, date_fin: date }))
              }
            />
          </Form.Item>
        </div>

        {selectedPO && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro BDC" span={2}>
              {selectedPO.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de signature">
              {format(new Date(), "dd MMMM yyyy", { locale: fr })}
            </Descriptions.Item>
            <Descriptions.Item label="Montant">
              <Text strong className="text-green-600">
                {selectedPO.montant_total.toFixed(2)} €
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Date de début" span={2}>
              {format(
                new Date(selectedPO.date_debut || new Date()),
                "dd MMMM yyyy",
                {
                  locale: fr,
                }
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Date de fin" span={2}>
              {format(
                new Date(selectedPO.date_fin || new Date()),
                "dd MMMM yyyy",
                {
                  locale: fr,
                }
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Description du BDC" span={2}>
              {selectedPO.description}
            </Descriptions.Item>
            <Descriptions.Item label="Conditions du Contrat" span={2}>
              <Text type="secondary">
                Les conditions standard du contrat seront appliquées
                conformément aux termes du bon de commande accepté.
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default OrderInterface;
