import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Card,
  Input,
  Table,
  Button,
  Modal,
  Tag,
  Space,
  Tooltip,
  Descriptions,
  Radio,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Endponit } from "../../helper/enpoint";

const { Title } = Typography;

const ConsulterBDC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(null);
  const [filterMode, setFilterMode] = useState("active");

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Endponit()}/api/Bondecommande`);
      setPurchaseOrders(response.data.data.sort((a, b) => b.id_bdc - a.id_bdc));
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      message.error("Échec de la récupération des bons de commande");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending_esn: "En attente de validation",
      accepted_esn: "Soumis",
      rejected_esn: "Rejeté",
      Actif: "Actif",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_esn: "warning",
      accepted_esn: "processing",
      rejected_esn: "error",
      Actif: "success",
    };
    return colors[status];
  };

  const generatePDF = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Bon de Commande", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Numéro BDC: ${record.numero_bdc}`, 20, 40);
    doc.text(
      `Date de création: ${format(new Date(record.date_creation), "dd MMMM yyyy", {
        locale: fr,
      })}`,
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

  const columns = [
    {
      title: "Numéro",
      dataIndex: "numero_bdc",
      key: "numero_bdc",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Client",
      dataIndex: "client_id",
      key: "client_id",
      render: (clientId) => <span>{clientId}</span>,
    },
    {
      title: "Date de création",
      dataIndex: "date_creation",
      key: "date_creation",
      render: (date) => format(new Date(date), "dd MMMM yyyy", { locale: fr }),
    },
    {
      title: "Montant Total",
      dataIndex: "montant_total",
      key: "montant_total",
      render: (amount) => (
        <span className="font-medium">
          <DollarOutlined className="mr-1" />
          {amount?.toFixed(2)} €
        </span>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir les détails">
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                setCurrentPurchaseOrder(record);
                setIsDetailsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Télécharger">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              loading={downloadLoading[record.id_bdc]}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Filter POs based on selected filter mode and search text
  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    // Apply status filter
    const statusFilter = filterMode == "active" ? po.statut == "active" : true;
    
    // Apply search filter
    const searchFilter =
      po.numero_bdc?.toLowerCase().includes(searchText.toLowerCase()) ||
      po.description?.toLowerCase().includes(searchText.toLowerCase());
      
    return statusFilter && searchFilter;
  });

  return (
    <Card className="shadow-sm">
      <div className="mb-6">
        {/* <Title level={4}>Consulter les Bons de Commande</Title> */}
        
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <Radio.Group
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="active">Bons de commande actifs</Radio.Button>
              <Radio.Button value="all">Tous les bons de commande</Radio.Button>
            </Radio.Group>
            
            <Input
              placeholder="Rechercher des bons de commande"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />
          </div>
          
          <div className="text-right">
            <span className="text-sm text-gray-500">
              {filteredPurchaseOrders.length} bons de commande trouvés
            </span>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPurchaseOrders}
        rowKey="id_bdc"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
        }}
      />

      {/* Details Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <FileTextOutlined />
            <span>Détails du Bon de Commande</span>
            {currentPurchaseOrder && (
              <Tag color={getStatusColor(currentPurchaseOrder.statut)} className="ml-2">
                {getStatusLabel(currentPurchaseOrder.statut)}
              </Tag>
            )}
          </div>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(currentPurchaseOrder)}
            loading={downloadLoading[currentPurchaseOrder?.id_bdc]}
          >
            Télécharger
          </Button>,
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Fermer
          </Button>
        ]}
        width={700}
      >
        {currentPurchaseOrder && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small" className="rounded-lg overflow-hidden">
              <Descriptions.Item label="Numéro BDC" span={2}>
                {currentPurchaseOrder.numero_bdc}
              </Descriptions.Item>
              <Descriptions.Item label="Date de création">
                {format(
                  new Date(currentPurchaseOrder.date_creation),
                  "dd MMMM yyyy",
                  { locale: fr }
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(currentPurchaseOrder.statut)}>
                  {getStatusLabel(currentPurchaseOrder.statut)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Montant total" span={2}>
                <span className="font-medium text-green-600">
                  {currentPurchaseOrder.montant_total?.toFixed(2)}€
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {currentPurchaseOrder.description}
              </Descriptions.Item>
            </Descriptions>

            {currentPurchaseOrder.statut === "pending_esn" && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-5">
                <div className="flex items-start">
                  <div className="text-blue-500 text-lg mt-1 mr-3">
                    <InfoCircleOutlined />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 m-0">
                      Information
                    </h4>
                    <p className="text-blue-600 mt-1 mb-0">
                      Ce bon de commande est en attente de validation par l'ESN.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ConsulterBDC;