import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Input,
  Modal,
  Tag,
  Space,
  Select,
  Divider,
  Spin,
  Typography,
  Descriptions,
  Row,
  Col,
} from "antd";
import {
  FilterOutlined,
  CheckOutlined,
  CloseOutlined,
  PaperClipOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Endponit as Endpoint } from "../../helper/enpoint";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const ExpenseReportsValidation = () => {
  // States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filterParams, setFilterParams] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Get auth info
  const getAuthInfo = () => {
    return {
      responsableId:
        localStorage.getItem("responsableId") || localStorage.getItem("userId"),
      token: localStorage.getItem("token"),
    };
  };

  // Function to fetch expense reports from API
  const fetchExpenseReports = async (params = {}) => {
    try {
      setFetchLoading(true);
      const { responsableId, token } = getAuthInfo();

      // Get current month and year if no date range is specified
      if (!params.period) {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const year = now.getFullYear().toString();
        params.period = `${month}_${year}`;
      }

      // Construct the query parameters
      const queryParams = new URLSearchParams({
        responsable_id: responsableId,
        view_type: "validation", // Add a view_type parameter for validation
        ...params,
      }).toString();

      const response = await fetch(
        `${Endpoint()}/api/ndf-consultant-view/?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching expense reports: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "Failed to fetch expense reports");
      }

      // Transform the data to match our component's expected format
      const transformedExpenses = data.data.map((report) => {
        // Handle amount fields that could be objects or direct values
        const getAmountValue = (amount) => {
          if (amount && typeof amount === "object" && "parsedValue" in amount) {
            return amount.parsedValue;
          }
          return parseFloat(amount);
        };

        return {
          id: report.id_ndf,
          date: `${report.période?.split("_")[1]}-${
            report.période?.split("_")[0]
          }-${report.jour?.toString().padStart(2, "0")}`, // Format YYYY-MM-DD
          jour: report.jour,
          periode: report.période,
          description: report.description,
          category: report.type_frais
            ? report.type_frais.includes(",")
              ? report.type_frais.split(",").map((cat) => cat.trim())
              : [report.type_frais]
            : [], // Handle both single and multiple categories
          amount: getAmountValue(report.montant_ht),
          amount_ttc: getAmountValue(report.montant_ttc),
          devise: report.devise,
          status: report.statut,
          esn_id: report.id_esn || report.consultant?.id_esn,
          esn: report.esn_name || "N/A",
          client_id: report.id_client || report.client?.id,
          client: report.client_name || report.client?.name || "N/A",
          bdc_id: report.id_bdc || report.bdc?.id,
          bdc_number: report.bdc_number || report.bdc?.number,
          consultant_id: report.id_consultant || report.consultant?.id,
          consultant_name:
            report.consultant_name || report.consultant?.name || "N/A",
          consultant_email: report.consultant_email || report.consultant?.email,
          attachments: report.justificatif
            ? report.justificatif.split(",")
            : [],
        };
      });

      setExpenses(transformedExpenses);
      setPagination({
        ...pagination,
        current: params.offset / params.limit + 1 || 1,
        total: data.total || transformedExpenses.length,
      });
    } catch (error) {
      console.error("Error fetching expense reports:", error);
      Modal.error({
        title: "Erreur",
        content: `Impossible de récupérer les notes de frais: ${error.message}`,
      });
    } finally {
      setFetchLoading(false);
    }
  };

  // Function to validate an expense report (change status to EVC)
  const validateExpenseReport = async (id) => {
    Modal.confirm({
      title: "Valider la note de frais",
      okText: "Oui, valider",
      okType: "primary",
      cancelText: "Annuler",
      icon: <ExclamationCircleOutlined style={{ color: "#1890ff" }} />,
      onOk: async () => {
        try {
          setLoading(true);
          const { token } = getAuthInfo();
          const response = await fetch(
            `${Endpoint()}/api/ndf-consultant-view/${id}/`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                statut: "EVC",
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error validating expense report: ${response.statusText}`
            );
          }

          const data = await response.json();

          if (!data.status) {
            throw new Error(
              data.message || "Failed to validate expense report"
            );
          }

          // Update the local state to reflect the change
          setExpenses(
            expenses.map((expense) =>
              expense.id === id ? { ...expense, status: "EVC" } : expense
            )
          );          Modal.success({
            title: "Succès",
            content:
              "Note de frais validée avec succès. Statut changé vers EVC.",
          });
        } catch (error) {
          console.error("Error validating expense report:", error);
          Modal.error({
            title: "Erreur",
            content: `Impossible de valider la note de frais: ${error.message}`,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Function to reject an expense report (change status to refusé)
  const rejectExpenseReport = async (id) => {
    Modal.confirm({
      title: "Refuser la note de frais",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: "Êtes-vous sûr de vouloir refuser cette note de frais ?",
      okText: "Oui, refuser",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setLoading(true);
          const { token } = getAuthInfo();
          const response = await fetch(
            `${Endpoint()}/api/ndf-consultant-view/${id}/`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                statut: "refusé",
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error rejecting expense report: ${response.statusText}`
            );
          }

          const data = await response.json();

          if (!data.status) {
            throw new Error(
              data.message || "Failed to reject expense report"
            );
          }

          // Update the local state to reflect the change
          setExpenses(
            expenses.map((expense) =>
              expense.id === id ? { ...expense, status: "refusé" } : expense
            )
          );

          Modal.success({
            title: "Succès",
            content:
              "Note de frais refusée avec succès. Statut changé vers refusé.",
          });
        } catch (error) {
          console.error("Error rejecting expense report:", error);
          Modal.error({
            title: "Erreur",
            content: `Impossible de refuser la note de frais: ${error.message}`,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Function to show expense details
  const showExpenseDetails = (expense) => {
    setSelectedExpense(expense);
    setDetailsVisible(true);
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Initial fetch on component mount
  useEffect(() => {
    const initialParams = {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize,
      ...filterParams,
    };

    fetchExpenseReports(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle table pagination change
  const handleTableChange = (newPagination, filters, sorter) => {
    const params = {
      limit: newPagination.pageSize,
      offset: (newPagination.current - 1) * newPagination.pageSize,
      ...filterParams,
    };

    setPagination(newPagination);
    fetchExpenseReports(params);
  };

  // Apply filters
  const applyFilters = () => {
    const params = {
      limit: pagination.pageSize,
      offset: 0, // Reset to first page when filtering
      ...filterParams,
    };

    // Convert date range to period format if present
    if (dateRange && dateRange[0]) {
      params.period = dateRange[0].format("MM_YYYY");
    }

    // Update status filter if set
    if (filterStatus && filterStatus !== "all") {
      params.status = filterStatus;
    } else {
      delete params.status;
    }

    setPagination({
      ...pagination,
      current: 1, // Reset to first page
    });

    fetchExpenseReports(params);
  };

  // Handle text search
  const handleSearch = (value) => {
    setSearchText(value);
    // Note: If the API doesn't support text search, we'll filter client-side
  };

  // Client-side filtering for text search (if API doesn't support it)
  const filteredExpenses = expenses.filter((expense) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();

    return (
      (expense.description &&
        expense.description.toLowerCase().includes(searchLower)) ||
      (expense.category &&
        expense.category.some((cat) =>
          cat.toLowerCase().includes(searchLower)
        )) ||
      (expense.esn && expense.esn.toLowerCase().includes(searchLower)) ||
      (expense.client && expense.client.toLowerCase().includes(searchLower)) ||
      (expense.consultant_name &&
        expense.consultant_name.toLowerCase().includes(searchLower)) ||
      (expense.bdc_number &&
        expense.bdc_number.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: "Consultant",
      dataIndex: "consultant_name",
      key: "consultant_name",
      width: 150,
      render: (text) => truncateText(text, 20),
    },
    {
      title: "Catégorie",
      dataIndex: "category",
      key: "category",
      width: 180,
      render: (category) => {
        // Handle both single string (old data) and array (new multi-select data)
        const categories = Array.isArray(category) ? category : [category];
        const maxVisible = 2;
        
        return (
          <div>
            {categories.slice(0, maxVisible).map((cat, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: "2px", fontSize: "11px" }}>
                {truncateText(cat, 15)}
              </Tag>
            ))}
            {categories.length > maxVisible && (
              <Tag color="default" style={{ fontSize: "11px" }}>
                +{categories.length - maxVisible}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Montant TTC",
      dataIndex: "amount_ttc",
      key: "amount_ttc",
      width: 120,
      render: (amount, record) =>
        `${parseFloat(amount).toFixed(2)} ${record.devise || "€"}`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        let color;
        switch (status) {
          case "en attente":
            color = "orange";
            break;
          case "EVP":
            color = "purple";
            break;
          case "EVC":
            color = "geekblue";
            break;
          case "approuvé":
            color = "green";
            break;
          case "remboursé":
            color = "cyan";
            break;
          case "refusé":
            color = "red";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Pièces jointes",
      dataIndex: "attachments",
      key: "attachments",
      width: 120,
      render: (attachments) => {
        if (!attachments || attachments.length === 0) {
          return <Text type="secondary" style={{ fontSize: "12px" }}>Aucune</Text>;
        }

        if (attachments.length === 1) {
          return (
            <Button
              type="link"
              icon={<PaperClipOutlined />}
              size="small"
              style={{ padding: 0, fontSize: "12px" }}
              onClick={() =>
                window.open(
                  `${Endpoint()}/media/attachments/${attachments[0]}`,
                  "_blank"
                )
              }
            >
              {truncateText(attachments[0], 15)}
            </Button>
          );
        }

        return (
          <div>
            <Button
              type="link"
              icon={<PaperClipOutlined />}
              size="small"
              style={{ padding: 0, fontSize: "12px" }}
              onClick={() =>
                window.open(
                  `${Endpoint()}/media/attachments/${attachments[0]}`,
                  "_blank"
                )
              }
            >
              {truncateText(attachments[0], 10)}
            </Button>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              +{attachments.length - 1}
            </Text>
          </div>
        );
      },
    },    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showExpenseDetails(record)}
          >
            Détails
          </Button>
          {record.status === "EVP" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => validateExpenseReport(record.id)}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                }}
              >
                Valider
              </Button>
              <Button
                type="primary"
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => rejectExpenseReport(record.id)}
              >
                Refuser
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <Search
            placeholder="Rechercher une note de frais..."
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          <Select
            style={{ width: 200 }}
            placeholder="Filtrer par statut"
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
          >
            <Option value="all">Tous les statuts</Option>
            <Option value="en attente">En attente</Option>
            <Option value="EVP">EVP</Option>
            <Option value="EVC">EVC</Option>
            <Option value="approuvé">Approuvé</Option>
            <Option value="remboursé">Remboursé</Option>
            <Option value="refusé">Refusé</Option>
          </Select>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={applyFilters}
            loading={fetchLoading}
          >
            Appliquer les filtres
          </Button>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <Table
          dataSource={filteredExpenses}
          columns={columns}
          rowKey="id"
          loading={fetchLoading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) =>
              `Total: ${total} note${total > 1 ? "s" : ""} de frais`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: fetchLoading ? <Spin /> : "Aucune note de frais trouvée",
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Détails de la note de frais"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Fermer
          </Button>,
          selectedExpense?.status === "EVP" && (
            <Button
              key="validate"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                validateExpenseReport(selectedExpense.id);
                setDetailsVisible(false);
              }}
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
              }}
            >
              Valider
            </Button>
          ),
          selectedExpense?.status === "EVP" && (
            <Button
              key="reject"
              type="primary"
              danger
              icon={<CloseOutlined />}
              onClick={() => {
                rejectExpenseReport(selectedExpense.id);
                setDetailsVisible(false);
              }}
            >
              Refuser
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedExpense && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Consultant" span={2}>
              {selectedExpense.consultant_name}
            </Descriptions.Item>
            <Descriptions.Item label="Date" span={2}>
              {selectedExpense.periode && selectedExpense.jour
                ? (() => {
                    const [month, year] = selectedExpense.periode.split("_");
                    const dateStr = `${year}-${month}-${String(
                      selectedExpense.jour
                    ).padStart(2, "0")}`;
                    return new Date(dateStr).toLocaleDateString("fr-FR");
                  })()
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedExpense.description || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Catégories" span={2}>
              <div>
                {selectedExpense.category &&
                  selectedExpense.category.map((cat, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: "4px" }}>
                      {cat}
                    </Tag>
                  ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Montant HT">
              {`${parseFloat(selectedExpense.amount).toFixed(2)} ${
                selectedExpense.devise || "€"
              }`}
            </Descriptions.Item>
            <Descriptions.Item label="Montant TTC">
              {`${parseFloat(selectedExpense.amount_ttc).toFixed(2)} ${
                selectedExpense.devise || "€"
              }`}
            </Descriptions.Item>
            <Descriptions.Item label="Statut" span={2}>
              <Tag
                color={
                  selectedExpense.status === "en attente"
                    ? "orange"
                    : selectedExpense.status === "EVP"
                    ? "purple"
                    : selectedExpense.status === "EVC"
                    ? "geekblue"
                    : selectedExpense.status === "approuvé"
                    ? "green"
                    : selectedExpense.status === "remboursé"
                    ? "cyan"
                    : selectedExpense.status === "refusé"
                    ? "red"
                    : "default"
                }
              >
                {selectedExpense.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Pièces jointes" span={2}>
              {selectedExpense.attachments && selectedExpense.attachments.length > 0 ? (
                <div>
                  {selectedExpense.attachments.map((file, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <Button
                        type="link"
                        icon={<PaperClipOutlined />}
                        onClick={() =>
                          window.open(
                            `${Endpoint()}/media/attachments/${file}`,
                            "_blank"
                          )
                        }
                      >
                        {file}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">Aucune pièce jointe</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ExpenseReportsValidation;