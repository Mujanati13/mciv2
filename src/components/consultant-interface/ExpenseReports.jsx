import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Typography,
  Button,
  Card,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Divider,
  Upload,
  InputNumber,
  Spin,
  Progress,
  Descriptions,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  UploadOutlined,
  FilterOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Endponit as Endpoint } from "../../helper/enpoint";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ExpenseReports = ({ consultantData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [form] = Form.useForm();
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filterParams, setFilterParams] = useState({
    period: null,
    status: null,
    esn_id: null,
    client_id: null,
    bdc_id: null,
  });
  const [fileList, setFileList] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState({});
  const [esnList, setEsnList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [bdcList, setBdcList] = useState([]);
  const [esnLoading, setEsnLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [bdcLoading, setBdcLoading] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState({
    esn_id: false,
    client_id: false,
  });

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 50) => {
    if (!text) return text;
    const textStr = Array.isArray(text) ? text.join(", ") : text.toString();
    return textStr.length > maxLength ? `${textStr.substring(0, maxLength)}...` : textStr;
  };

  // Function to show expense details modal
  const showDetailModal = (record) => {
    setSelectedExpense(record);
    setIsDetailModalVisible(true);
  };

  // Function to get authentication information
  const getAuthInfo = () => {
    const consultantId =
      localStorage.getItem("consultantId") || localStorage.getItem("userId");
    const token =
      localStorage.getItem("consultantToken") ||
      localStorage.getItem("unifiedToken");

    if (!consultantId || !token) {
      throw new Error("Authentication information missing");
    }

    return { consultantId, token };
  };

  // Function to fetch ESNs from API
  const fetchEsns = async () => {
    setEsnLoading(true);
    try {
      const { token } = getAuthInfo();

      const response = await fetch(`${Endpoint()}/api/esn-list/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching ESNs: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "Failed to fetch ESNs");
      }

      // Transform API data to match our component's select needs
      const transformedData = data.data.map((item) => ({
        id: item.id,
        name: item.name,
      }));

      setEsnList(transformedData);
    } catch (error) {
      console.error("Error fetching ESNs:", error);
      message.error(
        `Impossible de charger la liste des ESNs: ${error.message}`
      );
    } finally {
      setEsnLoading(false);
    }
  };

  // Function to fetch Clients from API
  const fetchClients = async () => {
    setClientLoading(true);
    try {
      const { token } = getAuthInfo();

      const response = await fetch(`${Endpoint()}/api/client-list/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching clients: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "Failed to fetch clients");
      }

      // Transform API data to match our component's select needs
      const transformedData = data.data.map((item) => ({
        id: item.id,
        name: item.name,
      }));

      setClientList(transformedData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      message.error(
        `Impossible de charger la liste des clients: ${error.message}`
      );
    } finally {
      setClientLoading(false);
    }
  };

  // Function to fetch BDCs from API
  const fetchBdcs = async () => {
    setBdcLoading(true);
    try {
      const { consultantId, token } = getAuthInfo();

      const response = await fetch(`${Endpoint()}/api/bdc-list/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching BDCs: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "Failed to fetch BDCs");
      }

      // Transform API data to match our component's select needs
      const transformedData = data.data.map((item) => ({
        id: item.bdc_id,
        number: item.bdc_number,
        esn_id: item.esn_id,
        client_id: item.client_id,
      }));

      setBdcList(transformedData);
    } catch (error) {
      console.error("Error fetching BDCs:", error);
      message.error(
        `Impossible de charger la liste des BDCs: ${error.message}`
      );
    } finally {
      setBdcLoading(false);
    }
  };

  // Function to handle BDC selection
  const handleBdcChange = (bdcId) => {
    if (!bdcId) {
      // Clear auto-filled fields when BDC is cleared
      setAutoFilledFields({
        esn_id: false,
        client_id: false,
      });
      form.setFieldsValue({
        esn_id: undefined,
        client_id: undefined,
      });
      return;
    }

    // Find the selected BDC
    const selectedBdc = bdcList.find((bdc) => bdc.id === bdcId);

    if (selectedBdc) {
      // Update the form with ESN and client from the selected BDC
      form.setFieldsValue({
        esn_id: selectedBdc.esn_id,
        client_id: selectedBdc.client_id,
      });

      // Mark these fields as auto-filled
      setAutoFilledFields({
        esn_id: true,
        client_id: true,
      });
    }
  };

  // Function to fetch expense reports from API
  const fetchExpenseReports = async (params = {}) => {
    setFetchLoading(true);
    try {
      const { consultantId, token } = getAuthInfo();

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("consultant_id", consultantId);

      // Add optional filter parameters if they exist
      if (params.period) queryParams.append("period", params.period);
      if (params.status && params.status !== "all")
        queryParams.append("status", params.status);
      if (params.esn_id) queryParams.append("esn_id", params.esn_id);
      if (params.client_id) queryParams.append("client_id", params.client_id);
      if (params.bdc_id) queryParams.append("bdc_id", params.bdc_id);

      // Add pagination parameters
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.offset) queryParams.append("offset", params.offset);

      const response = await fetch(
        `${Endpoint()}/api/ndf-consultant-by-consultant/?${queryParams.toString()}`,
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

      // Transform API data to match our component's data structure
      const transformedData = data.data.map((item) => ({
        id: item.id_ndf,
        date: `${item.période.split("_")[1]}-${
          item.période.split("_")[0]
        }-${item.jour.toString().padStart(2, "0")}`, // Convert back to YYYY-MM-DD format
        description: item.description || "Sans description",
        category: item.type_frais ? 
          (item.type_frais.includes(",") ? 
            item.type_frais.split(",").map(cat => cat.trim()) : 
            item.type_frais
          ) : "Autre", // Handle both single and multiple categories
        amount: parseFloat(item.montant_ht) || 0,
        amount_ttc: parseFloat(item.montant_ttc) || 0,
        status: item.statut || "en attente",
        attachments: item.justificatif ? item.justificatif.split(",") : [],
        // Add any additional fields from the API response
        esn: item.esn_name,
        client: item.client_name,
        esn_id: item.id_esn,
        client_id: item.id_client,
        bdc_id: item.id_bdc,
        consultant_name: item.consultant_name,
        currency: item.devise,
      }));

      setExpenses(transformedData);
      setPagination({
        ...pagination,
        total: data.total || transformedData.length,
      });
    } catch (error) {
      console.error("Error fetching expense reports:", error);
      message.error(
        `Impossible de charger les notes de frais: ${error.message}`
      );
      // Fallback to mock data in case of error
      setExpenses([
        {
          id: 1,
          date: "2025-05-15",
          description: "Déplacement client Paris",
          category: "Déplacement",
          amount: 120.5,
          status: "En attente",
          attachments: ["recu_train.pdf"],
        },
        {
          id: 2,
          date: "2025-05-10",
          description: "Repas d'affaires",
          category: "Restauration",
          amount: 65.3,
          status: "Approuvé",
          attachments: ["facture_restaurant.pdf"],
        },
        {
          id: 3,
          date: "2025-04-28",
          description: "Matériel informatique",
          category: "Équipement",
          amount: 250.0,
          status: "Remboursé",
          attachments: ["facture_ordinateur.pdf"],
        },
      ]);
    } finally {
      setFetchLoading(false);
    }
  };

  // Function to create a new expense report
  const createExpenseReport = async (values) => {
    setLoading(true);
    try {
      const { consultantId, token } = getAuthInfo();

      // Upload files first using saveDoc API
      const uploadedFiles = [];
      if (fileList.length > 0) {
        for (const file of fileList) {
          if (file.originFileObj) {
            try {
              const uploadResult = await uploadFileWithSaveDoc(
                file.originFileObj
              );
              uploadedFiles.push({
                fileName: uploadResult.fileName,
                filePath: uploadResult.path,
              });

              // Update file status to show successful upload
              setFileList((prevList) =>
                prevList.map((f) =>
                  f.uid === file.uid
                    ? { ...f, status: "done", response: uploadResult }
                    : f
                )
              );
            } catch (uploadError) {
              message.error(
                `Erreur lors du téléchargement de ${file.name}: ${uploadError.message}`
              );

              // Update file status to show error
              setFileList((prevList) =>
                prevList.map((f) =>
                  f.uid === file.uid
                    ? { ...f, status: "error", error: uploadError.message }
                    : f
                )
              );
              throw uploadError; // Stop the process if file upload fails
            }
          }
        }
      }

      // Parse date to extract day and period
      const dateObj = new Date(values.date);
      const day = dateObj.getDate();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const year = dateObj.getFullYear().toString();
      const period = `${month}_${year}`;

      // Calculate montant_ttc (assuming 20% VAT if not transport)
      const montant_ht = parseFloat(values.amount);
      const categories = Array.isArray(values.category) ? values.category : [values.category];
      const hasTransport = categories.some(cat => cat.toLowerCase() === "transport");
      const montant_ttc = hasTransport
        ? montant_ht
        : parseFloat((montant_ht * 1.2).toFixed(2));

      // Prepare JSON payload according to API structure
      const payload = {
        période: period,
        jour: day,
        type_frais: categories.map(cat => cat.toLowerCase()).join(","), // Join multiple categories
        id_consultan: parseInt(consultantId),
        montant_ht: montant_ht,
        montant_ttc: montant_ttc,
        devise: "EUR",
        description: values.description,
        statut: "en attente",
      };

      // Add optional fields if provided
      if (values.esn_id) payload.id_esn = parseInt(values.esn_id);
      if (values.client_id) payload.id_client = parseInt(values.client_id);
      if (values.bdc_id) payload.id_bdc = parseInt(values.bdc_id);

      // Add uploaded file paths as justificatif (comma-separated for multiple files)
      if (uploadedFiles.length > 0) {
        payload.justificatif = uploadedFiles
          .map((file) => file.fileName)
          .join(",");
      }

      const response = await fetch(`${Endpoint()}/api/ndf-consultant-view/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Error creating expense report: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to create expense report");
      }

      // Save file paths as JSON metadata for tracking
      if (uploadedFiles.length > 0) {
        saveFilePathsAsJson(uploadedFiles, data.expenseId || data.id || "temp");
      }

      message.success("Note de frais ajoutée avec succès");

      // Reset form and file list
      form.resetFields();
      setFileList([]);
      setIsModalVisible(false);

      // Refresh the expense reports list
      fetchExpenseReports({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...filterParams,
      });
    } catch (error) {
      console.error("Error creating expense report:", error);
      message.error(`Impossible de créer la note de frais: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to update an existing expense report
  const updateExpenseReport = async (id, values) => {
    setLoading(true);
    try {
      const { consultantId, token } = getAuthInfo();

      // Upload new files first using saveDoc API
      const uploadedFiles = [];
      if (fileList.length > 0) {
        for (const file of fileList) {
          if (file.originFileObj) {
            try {
              const uploadResult = await uploadFileWithSaveDoc(
                file.originFileObj
              );
              uploadedFiles.push({
                fileName: uploadResult.fileName,
                filePath: uploadResult.path,
              });

              // Update file status to show successful upload
              setFileList((prevList) =>
                prevList.map((f) =>
                  f.uid === file.uid
                    ? { ...f, status: "done", response: uploadResult }
                    : f
                )
              );
            } catch (uploadError) {
              message.error(
                `Erreur lors du téléchargement de ${file.name}: ${uploadError.message}`
              );

              // Update file status to show error
              setFileList((prevList) =>
                prevList.map((f) =>
                  f.uid === file.uid
                    ? { ...f, status: "error", error: uploadError.message }
                    : f
                )
              );
              throw uploadError; // Stop the process if file upload fails
            }
          } else if (file.url) {
            // Keep existing files
            uploadedFiles.push({
              fileName: file.name,
              filePath: file.url,
            });
          }
        }
      }

      // Parse date to extract day and period
      const dateObj = new Date(values.date);
      const day = dateObj.getDate();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const year = dateObj.getFullYear().toString();
      const period = `${month}_${year}`;

      // Calculate montant_ttc (assuming 20% VAT if not transport)
      const montant_ht = parseFloat(values.amount);
      const categories = Array.isArray(values.category) ? values.category : [values.category];
      const hasTransport = categories.some(cat => cat.toLowerCase() === "transport");
      const montant_ttc = hasTransport
        ? montant_ht
        : parseFloat((montant_ht * 1.2).toFixed(2));

      // Prepare JSON payload according to API structure
      const payload = {
        période: period,
        jour: day,
        type_frais: categories.map(cat => cat.toLowerCase()).join(","), // Join multiple categories
        id_consultan: parseInt(consultantId),
        montant_ht: montant_ht,
        montant_ttc: montant_ttc,
        devise: "EUR",
        description: values.description,
        statut: "en attente",
      };

      // Add optional fields if provided
      if (values.esn_id) payload.id_esn = parseInt(values.esn_id);
      if (values.client_id) payload.id_client = parseInt(values.client_id);
      if (values.bdc_id) payload.id_bdc = parseInt(values.bdc_id);

      // Add uploaded file paths as justificatif (comma-separated for multiple files)
      if (uploadedFiles.length > 0) {
        payload.justificatif = uploadedFiles
          .map((file) => file.fileName)
          .join(",");
      }

      const response = await fetch(
        `${Endpoint()}/api/ndf-consultant-view/${id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error updating expense report: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to update expense report");
      }

      // Save file paths as JSON metadata for tracking
      if (uploadedFiles.length > 0) {
        saveFilePathsAsJson(uploadedFiles, id);
      }

      message.success("Note de frais mise à jour avec succès");

      // Reset form and file list
      form.resetFields();
      setFileList([]);
      setIsModalVisible(false);

      // Refresh the expense reports list
      fetchExpenseReports({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...filterParams,
      });
    } catch (error) {
      console.error("Error updating expense report:", error);
      message.error(
        `Impossible de mettre à jour la note de frais: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to delete an expense report
  const deleteExpenseReportAPI = async (id) => {
    try {
      const { token } = getAuthInfo();

      const response = await fetch(
        `${Endpoint()}/api/ndf-consultant-view/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error deleting expense report: ${response.statusText}`
        );
      }

      // Some APIs return no content on successful deletion
      if (response.status === 204) {
        return true;
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "Failed to delete expense report");
      }

      message.success("Note de frais supprimée avec succès");

      // Refresh the expense reports list
      fetchExpenseReports({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...filterParams,
      });

      return true;
    } catch (error) {
      console.error("Error deleting expense report:", error);
      message.error(
        `Impossible de supprimer la note de frais: ${error.message}`
      );
      return false;
    }
  };
  
  // Function to submit an expense report (change status to EVP)
  const submitExpenseReport = async (id) => {
    Modal.confirm({
      title: "Soumettre la note de frais",
      content:
        'Êtes-vous sûr de vouloir soumettre cette note de frais ? Elle passera au statut "EVP" (En Attente Validation Prestataire).',
      okText: "Oui, soumettre",
      okType: "primary",
      cancelText: "Annuler",
      icon: <SendOutlined style={{ color: "#1890ff" }} />,
      onOk: async () => {
        try {
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
                statut: "EVP",
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error submitting expense report: ${response.statusText}`
            );
          }

          const data = await response.json();

          if (!data.status) {
            throw new Error(data.message || "Failed to submit expense report");
          }

          message.success(
            "Note de frais soumise avec succès. Statut changé vers EVP."
          );

          // Refresh the expense reports list
          fetchExpenseReports({
            limit: pagination.pageSize,
            offset: (pagination.current - 1) * pagination.pageSize,
            ...filterParams,
          });
        } catch (error) {
          console.error("Error submitting expense report:", error);
          message.error(
            `Impossible de soumettre la note de frais: ${error.message}`
          );
        }
      },
    });
  };

  // Initial fetch on component mount
  useEffect(() => {
    const initialParams = {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize,
      ...filterParams,
    };

    // Clean up expired file metadata on component mount
    cleanupExpiredMetadata();

    fetchExpenseReports(initialParams);
    fetchEsns();
    fetchClients();
    fetchBdcs();
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

    return (
      expense.description.toLowerCase().includes(searchText.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchText.toLowerCase()) ||
      (expense.esn &&
        expense.esn.toLowerCase().includes(searchText.toLowerCase())) ||
      (expense.client &&
        expense.client.toLowerCase().includes(searchText.toLowerCase())) ||
      (expense.consultant_name &&
        expense.consultant_name
          .toLowerCase()
          .includes(searchText.toLowerCase()))
    );
  });

  // Handle file upload
  const handleFileChange = ({ fileList: newFileList }) => {
    // Enforce 5-file limit
    if (newFileList.length > 5) {
      message.warning("Vous ne pouvez télécharger que 5 fichiers maximum");
      return;
    }
    setFileList(newFileList);
  };

  // Upload individual file using saveDoc API
  const uploadFileWithSaveDoc = async (file) => {
    try {
      const { token } = getAuthInfo();

      // Start upload progress tracking
      setUploadingFiles((prev) => new Set([...prev, file.uid]));
      setUploadProgress((prev) => ({ ...prev, [file.uid]: 0 }));

      // Validate file type (allow common document types)
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Type de fichier non autorisé. Utilisez PDF, Word, Excel, images ou fichiers texte."
        );
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("Le fichier doit être inférieur à 5MB");
      }

      // Create FormData for saveDoc API
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("path", "./uploads/expense-reports/");

      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const currentProgress = prev[file.uid] || 0;
          if (currentProgress < 90) {
            return { ...prev, [file.uid]: currentProgress + 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch(`${Endpoint()}/api/saveDoc/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(
          `Erreur lors du téléchargement: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "Échec du téléchargement du fichier");
      }

      // Complete upload progress
      setUploadProgress((prev) => ({ ...prev, [file.uid]: 100 }));

      return {
        status: true,
        path: data.path,
        fileName: file.name,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      // Clean up upload tracking
      setTimeout(() => {
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(file.uid);
          return newSet;
        });
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.uid];
          return newProgress;
        });
      }, 1000);
    }
  };

  // Save file paths as JSON with enhanced metadata
  const saveFilePathsAsJson = (uploadedFiles, expenseId) => {
    try {
      const fileData = {
        expenseReportId: expenseId,
        uploadedFiles: uploadedFiles.map((file, index) => ({
          id: `file_${expenseId}_${index + 1}`,
          originalName: file.fileName,
          savedPath: file.filePath,
          uploadDate: new Date().toISOString(),
          fileSize: file.size || "unknown",
          fileType: file.type || "unknown",
          uploadOrder: index + 1,
          status: "uploaded",
        })),
        uploadSummary: {
          totalFiles: uploadedFiles.length,
          uploadDate: new Date().toISOString(),
          consultant:
            localStorage.getItem("consultantId") ||
            localStorage.getItem("userId"),
          uploadSessionId: `session_${Date.now()}`,
          appVersion: "1.0.0",
        },
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      // Create a blob with the JSON data
      const jsonBlob = new Blob([JSON.stringify(fileData, null, 2)], {
        type: "application/json",
      });

      // Store in localStorage as backup with expiration (30 days)
      const storageData = {
        data: fileData,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
      localStorage.setItem(
        `expense-files-${expenseId}`,
        JSON.stringify(storageData)
      );

      // Log successful save for debugging
      console.log("File paths saved as JSON:", fileData);

      return fileData;
    } catch (error) {
      console.error("Error saving file paths as JSON:", error);
      message.error(
        "Erreur lors de la sauvegarde des métadonnées des fichiers"
      );
      return null;
    }
  };

  // Retrieve file metadata from localStorage
  const getFileMetadata = (expenseId) => {
    try {
      const storedData = localStorage.getItem(`expense-files-${expenseId}`);
      if (!storedData) return null;

      const parsed = JSON.parse(storedData);

      // Check if data has expired (30 days)
      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        localStorage.removeItem(`expense-files-${expenseId}`);
        return null;
      }

      return parsed.data || parsed; // Handle both new and old format
    } catch (error) {
      console.error("Error retrieving file metadata:", error);
      return null;
    }
  };

  // Clean up expired file metadata from localStorage
  const cleanupExpiredMetadata = () => {
    try {
      const keys = Object.keys(localStorage);
      const expenseFileKeys = keys.filter((key) =>
        key.startsWith("expense-files-")
      );

      expenseFileKeys.forEach((key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error cleaning up expired metadata:", error);
    }
  };

  const showModal = (record = null) => {
    setEditingExpense(record);

    // Reset file list and auto-filled state
    setFileList([]);
    setAutoFilledFields({
      esn_id: false,
      client_id: false,
    });

    if (record) {
      // For date picker to work properly, convert string date to dayjs object
      const dateValue = record.date ? dayjs(record.date) : null;      form.setFieldsValue({
        date: dateValue,
        description: record.description,
        category: record.category,
        amount: record.amount,
        amount_ttc: record.amount_ttc,
        esn_id: record.esn_id,
        client_id: record.client_id,
        bdc_id: record.bdc_id,
      });

      // Set file list for existing attachments
      if (record.attachments && record.attachments.length > 0) {
        const existingFiles = record.attachments.map((file, index) => ({
          uid: `-${index}`,
          name: file,
          status: "done",
          url: `${Endpoint()}/media/attachments/${file}`, // Adjust the URL according to your API
        }));
        setFileList(existingFiles);
      }
    } else {
      form.resetFields();
    }

    setIsModalVisible(true);
  };

  // Function to delete an expense report with confirmation
  const deleteExpense = (id) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette note de frais ?",
      okText: "Oui, supprimer",
      okType: "danger",
      cancelText: "Annuler",
      icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
      onOk: async () => {
        try {
          await deleteExpenseReportAPI(id);
          message.success("Note de frais supprimée avec succès");

          // Refresh the expense reports list
          fetchExpenseReports({
            limit: pagination.pageSize,
            offset: (pagination.current - 1) * pagination.pageSize,
            ...filterParams,
          });
        } catch (error) {
          console.error("Error deleting expense report:", error);
          message.error(
            `Impossible de supprimer la note de frais: ${error.message}`
          );
        }
      },
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
    setAutoFilledFields({
      esn_id: false,
      client_id: false,
    });
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {        // Format date to string if it's a dayjs object
        const formattedValues = {
          ...values,
          date: values.date ? values.date.format("YYYY-MM-DD") : "",
          // Ensure both HT and TTC amounts are included
          amount: values.amount,
          amount_ttc: values.amount_ttc,
        };

        if (editingExpense) {
          // Update existing expense report
          updateExpenseReport(editingExpense.id, formattedValues);
        } else {
          // Create new expense report
          createExpenseReport(formattedValues);
        }
      })
      .catch((errorInfo) => {
        console.log("Failed:", errorInfo);
      });
  };

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <span title={text}>
          {truncateText(text, 30)}
        </span>
      ),
    },
    {
      title: "Catégorie",
      dataIndex: "category",
      key: "category",
      render: (category) => {
        // Handle both single string (old data) and array (new multi-select data)
        const categories = Array.isArray(category) ? category : [category];
        const displayCategories = categories.slice(0, 2); // Show max 2 categories
        const remainingCount = categories.length - displayCategories.length;
        
        return (
          <div>
            {displayCategories.map((cat, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: '2px', fontSize: '11px' }}>
                {truncateText(cat, 15)}
              </Tag>
            ))}
            {remainingCount > 0 && (
              <Tag color="gray" style={{ fontSize: '10px' }}>
                +{remainingCount}
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
      render: (amount) => `${amount.toFixed(2)} €`,
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color;
        switch (status) {
          case "en attente":
            color = "orange";
            break;
          case "EVP":
            color = "purple";
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
      render: (attachments) => (
        <>
          {attachments && attachments.length > 0 ? (
            <div>
              <PaperClipOutlined style={{ color: '#1890ff', marginRight: 4 }} />
              <span style={{ fontSize: '12px' }}>
                {attachments.length} fichier{attachments.length > 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>Aucune</Text>
          )}
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
          >
            Voir détails
          </Button>          {(record.status === "en attente" || record.status === "refusé") && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => showModal(record)}
              >
                Modifier
              </Button>
              <Button
                type="default"
                size="small"
                icon={<SendOutlined />}
                onClick={() => submitExpenseReport(record.id)}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  color: "white",
                }}
              >
                {record.status === "refusé" ? "Resoumettre" : "Soumettre"}
              </Button>
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => deleteExpense(record.id)}
              >
                Supprimer
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Nouvelle note de frais
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
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
            <Option value="approuvé">Approuvé</Option>
            <Option value="remboursé">Remboursé</Option>
            <Option value="refusé">Refusé</Option>
          </Select>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={applyFilters}
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
          pagination={pagination}
          onChange={handleTableChange}
          locale={{
            emptyText: fetchLoading ? <Spin /> : "Aucune note de frais",
          }}
          size="small"
        />

      </Card>

      {/* Detail Modal */}
      <Modal
        title="Détails de la note de frais"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Fermer
          </Button>,
        ]}
        width={800}
      >
        {selectedExpense && (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Descriptions
                  title="Informations générales"
                  bordered
                  column={1}
                  size="small"
                >
                  <Descriptions.Item label="Date">
                    {new Date(selectedExpense.date).toLocaleDateString("fr-FR")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {selectedExpense.description}
                  </Descriptions.Item>
                  <Descriptions.Item label="Statut">
                    <Tag
                      color={
                        selectedExpense.status === "en attente"
                          ? "orange"
                          : selectedExpense.status === "EVP"
                          ? "purple"
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
                </Descriptions>
              </Col>
              <Col xs={24} sm={12}>
                <Descriptions
                  title="Montants"
                  bordered
                  column={1}
                  size="small"
                >
                  <Descriptions.Item label="Montant HT">
                    {selectedExpense.amount?.toFixed(2)} €
                  </Descriptions.Item>
                  <Descriptions.Item label="Montant TTC">
                    {selectedExpense.amount_ttc?.toFixed(2)} €
                  </Descriptions.Item>
                  <Descriptions.Item label="Devise">
                    {selectedExpense.currency || "EUR"}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Descriptions
                  title="Catégories"
                  bordered
                  column={1}
                  size="small"
                >
                  <Descriptions.Item label="Types de frais">
                    <div>
                      {Array.isArray(selectedExpense.category) ? (
                        selectedExpense.category.map((cat, index) => (
                          <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                            {cat}
                          </Tag>
                        ))
                      ) : (
                        <Tag color="blue">{selectedExpense.category}</Tag>
                      )}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider />

            <Descriptions
              title="Pièces justificatives"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Fichiers">
                {selectedExpense.attachments && selectedExpense.attachments.length > 0 ? (
                  <div>
                    {selectedExpense.attachments.map((file, index) => (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <Button
                          type="link"
                          icon={<PaperClipOutlined />}
                          onClick={() =>
                            window.open(
                              `${Endpoint()}/media/attachments/${file}`,
                              "_blank"
                            )
                          }
                          style={{ padding: 0 }}
                        >
                          {file}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">Aucune pièce justificative</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        title={
          editingExpense
            ? "Modifier la note de frais"
            : "Nouvelle note de frais"
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {editingExpense ? "Mettre à jour" : "Ajouter"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="Date"
            rules={[
              { required: true, message: "Veuillez sélectionner une date" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
         
          <Form.Item
            name="category"
            label="Type de frais"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner au moins un type de frais",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Sélectionner un ou plusieurs types de frais"
              allowClear
              maxTagCount="responsive"
              style={{ width: "100%" }}
            >
              <Option value="Transport">Transport</Option>
              <Option value="Restauration">Restauration</Option>
              <Option value="Hébergement">Hébergement</Option>
              <Option value="Équipement">Équipement</Option>
              <Option value="Formation">Formation</Option>
              <Option value="Télécommunications">Télécommunications</Option>
              <Option value="Fournitures">Fournitures</Option>
              <Option value="Autre">Autre</Option>
            </Select>
          </Form.Item>          <Form.Item
            name="amount_ttc"
            label="Montant TTC (€)"
            rules={[
              { required: true, message: "Veuillez entrer un montant TTC" },
              {
                type: "number",
                min: 0.01,
                message: "Le montant doit être positif",
              },
            ]}
            extra="Le montant HT sera calculé automatiquement (TVA 20%)"
          >
            <InputNumber
              style={{ width: "100%" }}
              step={0.01}
              precision={2}
              formatter={(value) => `${value} €`}
              parser={(value) => value.replace(" €", "")}
              onChange={(value) => {
                if (value && value > 0) {
                  // Calculate HT from TTC (TTC / 1.20)
                  const htAmount = value / 1.20;
                  form.setFieldValue("amount", parseFloat(htAmount.toFixed(2)));
                } else {
                  form.setFieldValue("amount", undefined);
                }
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="amount"
            label="Montant HT (€)"
            extra="Calculé automatiquement à partir du montant TTC"
          >
            <InputNumber
              style={{ width: "100%" }}
              step={0.01}
              precision={2}
              formatter={(value) => `${value} €`}
              parser={(value) => value.replace(" €", "")}
              disabled
              placeholder="Sera calculé automatiquement"
            />
          </Form.Item>
          <Form.Item name="bdc_id" label="Bon de Commande (BDC)">
            <Select
              placeholder="Sélectionner un BDC"
              allowClear
              loading={bdcLoading}
              onChange={handleBdcChange}
            >
              {bdcList.map((bdc) => (
                <Option key={bdc.id} value={bdc.id}>
                  {bdc.number}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {/* Show ESN field only if not auto-filled from BDC */}
          {!autoFilledFields.esn_id && (
            <Form.Item name="esn_id" label="ESN">
              <Select
                placeholder="Sélectionner une ESN"
                allowClear
                loading={esnLoading}
                onChange={() =>
                  setAutoFilledFields((prev) => ({ ...prev, esn_id: false }))
                }
              >
                {esnList.map((esn) => (
                  <Option key={esn.id} value={esn.id}>
                    {esn.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Show selected ESN as read-only if auto-filled */}
          {autoFilledFields.esn_id && (
            <Form.Item label="ESN (Auto-rempli depuis BDC)">
              <Input
                value={
                  esnList.find((esn) => esn.id === form.getFieldValue("esn_id"))
                    ?.name || "ESN sélectionnée"
                }
                disabled
                style={{ backgroundColor: "#f5f5f5", color: "#666" }}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      form.setFieldValue("esn_id", undefined);
                      setAutoFilledFields((prev) => ({
                        ...prev,
                        esn_id: false,
                      }));
                    }}
                  >
                    ✕
                  </Button>
                }
              />
            </Form.Item>
          )}

          {/* Show Client field only if not auto-filled from BDC */}
          {!autoFilledFields.client_id && (
            <Form.Item name="client_id" label="Client">
              <Select
                placeholder="Sélectionner un client"
                allowClear
                loading={clientLoading}
                onChange={() =>
                  setAutoFilledFields((prev) => ({ ...prev, client_id: false }))
                }
              >
                {clientList.map((client) => (
                  <Option key={client.id} value={client.id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Show selected Client as read-only if auto-filled */}
          {autoFilledFields.client_id && (
            <Form.Item label="Client (Auto-rempli depuis BDC)">
              <Input
                value={
                  clientList.find(
                    (client) => client.id === form.getFieldValue("client_id")
                  )?.name || "Client sélectionné"
                }
                disabled
                style={{ backgroundColor: "#f5f5f5", color: "#666" }}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      form.setFieldValue("client_id", undefined);
                      setAutoFilledFields((prev) => ({
                        ...prev,
                        client_id: false,
                      }));
                    }}
                  >
                    ✕
                  </Button>
                }
              />
            </Form.Item>
          )}
           <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Veuillez entrer une description" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Décrivez en détail les frais engagés..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item
            name="attachments"
            label={
              <span>
                Pièces justificatives
                <span
                  style={{ color: "#666", fontSize: "12px", marginLeft: "8px" }}
                >
                  (Maximum 5 fichiers - PDF, Images, Word, Excel - 5MB max
                  chacun)
                </span>
              </span>
            }
          >
            <Upload
              listType="text"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={(file) => {
                // Validate file type
                const allowedTypes = [
                  "application/pdf",
                  "image/jpeg",
                  "image/jpg",
                  "image/png",
                  "image/gif",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  "text/plain",
                ];

                if (!allowedTypes.includes(file.type)) {
                  message.error(
                    `${file.name} n'est pas un type de fichier autorisé`
                  );
                  return Upload.LIST_IGNORE;
                }

                // Validate file size (5MB)
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                  message.error(
                    `${file.name} est trop volumineux (maximum 5MB)`
                  );
                  return Upload.LIST_IGNORE;
                }

                return false; // Prevent auto upload
              }}
              multiple
              disabled={fileList.length >= 5}
              showUploadList={{
                showPreviewIcon: true,
                showDownloadIcon: false,
                showRemoveIcon: true,
              }}
              itemRender={(originNode, file) => {
                // Custom render for each file item to show upload progress
                const isUploading = uploadingFiles.has(file.uid);
                const progress = uploadProgress[file.uid] || 0;

                return (
                  <div style={{ margin: "4px 0" }}>
                    {originNode}
                    {isUploading && (
                      <div style={{ marginTop: "4px" }}>
                        <Progress
                          percent={progress}
                          size="small"
                          status={progress === 100 ? "success" : "active"}
                          format={() => `${progress}%`}
                        />
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          Téléchargement en cours...
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            >
              <Button icon={<UploadOutlined />} disabled={fileList.length >= 5}>
                {fileList.length >= 5
                  ? "Limite atteinte (5 fichiers)"
                  : "Télécharger des fichiers"}
              </Button>
            </Upload>
            {fileList.length > 0 && (
              <div
                style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
              >
                {fileList.length}/5 fichiers sélectionnés
                {uploadingFiles.size > 0 && (
                  <div style={{ marginTop: "4px", color: "#1890ff" }}>
                    <Spin size="small" style={{ marginRight: "8px" }} />
                    {uploadingFiles.size} fichier(s) en cours de
                    téléchargement...
                  </div>
                )}
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseReports;