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
  Form,
  DatePicker,
  message,
  Tag,
  Divider,
  Typography,
  Steps,
  Space,
  Tooltip,
  Select,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  SendOutlined,
  DollarOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import moment from "moment";
import { Endponit } from "../../helper/enpoint";

const { TextArea } = Input;
const { Step } = Steps;
const { Option } = Select;

const BonDeCommandeInterface = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const downloadContract = async (contractId) => {
    setDownloadLoading((prev) => ({
      ...prev,
      [`contract_${contractId}`]: true,
    }));

    try {
      const response = await axios.get(
        `${Endponit()}/api/download_contract/${contractId}`,
        { responseType: "json" }
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

  useEffect(() => {
    fetchPurchaseOrders();
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      const response = await axios.get(
        `${Endponit()}/api/get-candidatures-by-esn/?esn_id=${clientId}`
      );
      const selectedCandidates = response.data.data.filter(
        (candidate) => candidate.statut === "Sélectionnée"
      );
      setCandidates(response.data.data);
    } catch (error) {
      message.error("Échec de la récupération des candidatures");
    } finally {
      setCandidatesLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      const response = await axios.get(
        `${Endponit()}/api/get_bon_de_commande_by_esn/?esn_id=${clientId}`
      );
      const data = response.data.data.filter(
        (po) =>
          po.statut == "pending_esn" ||
          po.statut == "Actif" ||
          po.statut == "rejected_esn" || 
          po.statut == "accepted_esn"
      ).sort((a, b) => b.id_bdc - a.id_bdc);;
      setPurchaseOrders(data);
    } catch (error) {
      message.error("Échec de la récupération des bons de commande");
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidateId) => {
    const selectedCandidate = candidates.find((c) => c.id_cd === candidateId);
    if (selectedCandidate) {
      const monthlyAmount = selectedCandidate.tjm * 20;
      form.setFieldsValue({
        montant_total: monthlyAmount,
      });
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending_esn: "En attente de validation",
      accepted_esn: "Soumis",
      rejected_esn: "Rejeté",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_esn: "warning",
      accepted_esn: "success",
      rejected_esn: "error",
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

  const handleUpdateStatus = async (record, newStatus) => {
    try {
      await axios.put(`${Endponit()}/api/Bondecommande/${record.id_bdc}`, {
        ...record,
        statut: newStatus
        });
      fetchPurchaseOrders();
      message.success("Statut mis à jour avec succès");
    } catch (error) {
      message.error("Échec de la mise à jour du statut");
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
          {amount.toFixed(2)} €
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
          {/* <Tooltip title="Télécharger BDC">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              loading={downloadLoading[record.id_bdc]}
            />
          </Tooltip> */}
          {/* {record.has_contract && (
            <Tooltip title="Télécharger le contrat">
              <Button
                icon={<DownloadOutlined />}
                onClick={() => downloadContract(record.has_contract)}
                loading={downloadLoading[`contract_${record.has_contract}`]}
              >
                Contrat
              </Button>
            </Tooltip>
          )} */}
          {/* {record.statut !== 'accepted_esn' && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              title="Modifier"
            />
          )} */}

          {record.statut === "pending_esn" && (
            <>
              <Button
                type="primary"
                onClick={() =>
                  handleUpdateStatus(record, "accepted_esn")
                }
              >
                Accepter
              </Button>
              <Button
                danger
                onClick={() =>
                  handleUpdateStatus(record, "rejected_esn")
                }
              >
                Refuser
              </Button>
            </>
          )}
          {/* <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id_bdc)}
            disabled={record.statut === "accepted_esn"}
            title="Supprimer"
          /> */}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setCurrentPurchaseOrder(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
      date_creation: moment(record.date_creation),
    });
    setCurrentPurchaseOrder(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${Endponit()}/api/Bondecommande/${id}`);
      fetchPurchaseOrders();
      message.success("Bon de commande supprimé avec succès");
    } catch (error) {
      message.error("Échec de la suppression du bon de commande");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const clientId = localStorage.getItem("id");
      const formattedValues = {
        ...values,
        date_creation: values.date_creation.toISOString(),
        client_id: clientId,
      };

      if (currentPurchaseOrder) {
        await axios.put(`${Endponit()}/api/Bondecommande/`, {
          ...formattedValues,
          id_bdc: currentPurchaseOrder.id_bdc,
        });
        message.success("Bon de commande mis à jour avec succès");
      } else {
        await axios.post(`${Endponit()}/api/Bondecommande/`, {
          ...formattedValues,
          statut: "pending_esn",
        });
        message.success("Nouveau bon de commande créé avec succès");
      }
      setIsModalVisible(false);
      fetchPurchaseOrders();
    } catch (error) {
      message.error("Échec de la soumission du bon de commande");
    }
  };

  return (
    <Card className="shadow-sm">
      <div className="mb-6">
        <Steps size="small" className="mb-6">
          <Step title="Création" icon={<FileDoneOutlined />} />
        </Steps>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Rechercher des bons de commande"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            className="w-64"
          />
          {/* <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Nouveau bon de commande
          </Button> */}
        </div>
      </div>

      <Table
        columns={columns}
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

      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="mr-2" />
            {currentPurchaseOrder
              ? "Modifier le bon de commande"
              : "Créer un bon de commande"}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!currentPurchaseOrder && (
            <Form.Item
              label="Sélectionner une candidature"
              name="candidature_id"
              rules={[
                {
                  required: true,
                  message: "Veuillez sélectionner une candidature",
                },
              ]}
            >
              <Select
                loading={candidatesLoading}
                onChange={handleCandidateSelect}
                placeholder="Sélectionner une candidature"
              >
                {candidates.map((candidate) => (
                  <Option key={candidate.id_cd} value={candidate.id_cd}>
                    <Space>
                      <UserOutlined />
                      {`${candidate.responsable_compte} - TJM: ${
                        candidate.tjm
                      }€ - Disponible le: ${format(
                        new Date(candidate.date_disponibilite),
                        "dd/MM/yyyy"
                      )}`}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Numéro du bon de commande"
              name="numero_bdc"
              rules={[
                {
                  required: true,
                  message: "Veuillez entrer le numéro du bon de commande",
                },
              ]}
            >
              <Input prefix={<FileTextOutlined />} />
            </Form.Item>

            <Form.Item
              label="Date de création"
              name="date_creation"
              rules={[
                { required: true, message: "Veuillez sélectionner une date" },
              ]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Veuillez fournir une description" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Description du bon de commande..."
            />
          </Form.Item>

          <Form.Item
            label="Montant total (€)"
            name="montant_total"
            rules={[{ required: true, message: "Veuillez entrer le montant" }]}
          >
            <Input prefix={<DollarOutlined />} type="number" step="0.01" />
          </Form.Item>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalVisible(false)}>Annuler</Button>
            <Button type="primary" htmlType="submit">
              {currentPurchaseOrder ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Details Modal */}
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
            onClick={() => handleDownload(currentPurchaseOrder)}
            loading={downloadLoading[currentPurchaseOrder?.id_bdc]}
          >
            Télécharger
          </Button>,
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Fermer
          </Button>,
        ]}
        width={700}
      >
        {currentPurchaseOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Numéro BDC" span={2}>
              {currentPurchaseOrder.numero_bdc}
            </Descriptions.Item>
            <Descriptions.Item label="Date de création">
              {format(
                new Date(currentPurchaseOrder.date_creation),
                "dd MMMM yyyy",
                {
                  locale: fr,
                }
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Tag color={getStatusColor(currentPurchaseOrder.statut)}>
                {getStatusLabel(currentPurchaseOrder.statut)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Montant total" span={2}>
              <span className="font-medium text-green-600">
                {currentPurchaseOrder.montant_total.toFixed(2)} €
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {currentPurchaseOrder.description}
            </Descriptions.Item>
            {currentPurchaseOrder.candidature_id && (
              <Descriptions.Item label="Candidature associée" span={2}>
                {candidates.find(
                  (c) => c.id_cd === currentPurchaseOrder.candidature_id
                )?.responsable_compte || "Non trouvé"}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default BonDeCommandeInterface;
