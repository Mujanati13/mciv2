// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Form,
//   Input,
//   Select,
//   Button,
//   Table,
//   Tag,
//   Space,
//   message,
//   Modal,
//   Row,
//   Col,
//   Typography,
//   Spin,
//   Badge,
// } from "antd";
// import {
//   SearchOutlined,
//   ClearOutlined,
//   CalendarOutlined,
//   CheckOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import axios from "axios";
// import { Endponit } from "../helper/enpoint";
// import moment from "moment";

// const { Option } = Select;
// const { Text, Title } = Typography;

// // CRA status constants
// const CRA_STATUS = {
//   A_SAISIR: "À saisir",
//   EN_ATTENTE_PRESTATAIRE: "En attente validation prestataire",
//   EN_ATTENTE_CLIENT: "En attente validation client",
//   VALIDE: "Validé",
//   ANNULE: "Annulé",
// };

// const InterfaceCommercial = () => {
//   const [form] = Form.useForm();
//   const [craData, setCraData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [total, setTotal] = useState(0);
//   const [commercialInfo, setCommercialInfo] = useState(null);

//   // CRA tracking modal states
//   const [craModalVisible, setCraModalVisible] = useState(false);
//   const [selectedConsultant, setSelectedConsultant] = useState(null);
//   const [selectedBdc, setSelectedBdc] = useState(null);
//   const [selectedPeriod, setSelectedPeriod] = useState(null);
//   const [craWorkDays, setCraWorkDays] = useState([]);
//   const [craModalLoading, setCraModalLoading] = useState(false);

//   // Store the selected CRA record and its status from API
//   const [selectedCraRecord, setSelectedCraRecord] = useState(null);

//   // Validation states
//   const [validationNote, setValidationNote] = useState("");
//   const [validationLoading, setValidationLoading] = useState(false);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);

//   const statusOptions = [
//     { value: "Validé", color: "green" },
//     { value: "saisi", color: "yellow" },
//     { value: "EVC", color: "orange" },
//     { value: "EVP", color: "blue" },
//     { value: "Annulé", color: "magenta" },
//   ];

//   // Filtered status options for commercial
//   const filterStatusOptions = [
//     { value: "EVC", color: "orange" },
//     { value: "EVP", color: "blue" },
//     { value: "Validé", color: "green" },
//     { value: "Annulé", color: "magenta" },
//   ];

//   const getDisplayStatus = (status) => {
//     const statusMap = {
//       annule: "Annulé",
//       validé: "Validé",
//       evc: "EVC",
//       evp: "EVP",
//       // Add other mappings as needed
//     };

//     return statusMap[status?.toLowerCase()] || status;
//   };

//   useEffect(() => {
//     const currentPeriod = moment().format("MM_YYYY");
//     fetchCraData({ period: currentPeriod });
//   }, []);

//   const fetchCraData = async (values) => {
//     const commercialId = localStorage.getItem("userId") || localStorage.getItem("id");
//     const token = localStorage.getItem("unifiedToken") || localStorage.getItem("token");

//     if (!commercialId) {
//       message.error("Commercial ID not found");
//       return;
//     }

//     setLoading(true);

//     try {
//       const currentPeriod = moment().format("MM_YYYY");
//       const params = {
//         commercial_id: commercialId,
//         period: values.period || currentPeriod,
//         ...(values.status && { status: values.status }),
//       };

//       const response = await axios.get(
//         `${Endponit()}/api/cra-consultants/commercial/`,
//         {
//           params: params,
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (response.data?.status) {
//         const rawData = response.data.data || [];
//         setCommercialInfo(response.data.commercial || null);

//         const groupedData = groupConsultantsByBdc(rawData);
//         setCraData(groupedData);
//         setTotal(response.data.total || groupedData.length);
//       } else {
//         message.error(response.data.message || "Failed to fetch CRA data");
//         setCraData([]);
//         setTotal(0);
//       }
//     } catch (error) {
//       message.error(`Error: ${error.response?.data?.message || error.message}`);
//       setCraData([]);
//       setTotal(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle bulk validation for all work days of the selected CRA
//   const handleBulkValidation = async (approved) => {
//     setValidationLoading(true);
//     try {
//       const commercialId = localStorage.getItem("userId") || localStorage.getItem("id");
//       const token = localStorage.getItem("unifiedToken") || localStorage.getItem("token");

//       if (!commercialId || !selectedCraRecord) {
//         message.error("Information de connexion ou CRA non trouvée");
//         return;
//       }

//       // Use the selected CRA record ID
//       const craId = selectedCraRecord.id_CRA;

//       if (!craId) {
//         message.error("ID CRA non trouvé");
//         return;
//       }

//       // Update the CRA status using the cra_consultant endpoint
//       const response = await axios.put(
//         `${Endponit()}/api/cra_consultant/${craId}/`,
//         {
//           statut: approved ? "EVC" : "annule",
//           commentaire: approved
//             ? `CRA validé par le commercial - ${formatPeriod(selectedPeriod)}`
//             : validationNote || `CRA refusé par le commercial - ${formatPeriod(selectedPeriod)}`,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data?.status) {
//         message.success(
//           approved
//             ? "CRA validé avec succès"
//             : "CRA refusé et renvoyé au client"
//         );

//         // Refresh data
//         await fetchCraWorkDays(
//           selectedConsultant.id,
//           selectedBdc.id,
//           selectedPeriod
//         );
//         fetchCraData({ period: selectedPeriod });

//         setValidationNote("");
//       } else {
//         message.error("Failed to update CRA status");
//       }
//     } catch (error) {
//       console.error("Error validating CRA:", error);
//       message.error(
//         "Impossible de valider le CRA: " + (error.response?.data?.message || error.message || "Erreur inconnue")
//       );
//     } finally {
//       setValidationLoading(false);
//     }
//   };

//   const groupConsultantsByBdc = (data) => {
//     const groups = {};

//     data.forEach((item) => {
//       const key = `${item.id_consultan}_${item.id_bdc}`;

//       if (!groups[key]) {
//         groups[key] = {
//           id: key,
//           id_CRA: item.id_CRA,
//           id_consultan: item.id_consultan,
//           id_bdc: item.id_bdc,
//           id_esn: item.id_esn,
//           id_client: item.id_client,
//           période: item.période,
//           consultant_name: item.consultant_name,
//           consultant_email: item.consultant_email,
//           client_name: item.client_name,
//           n_jour: item.n_jour,
//           commentaire: item.commentaire,
//           statut: item.statut,
//           total_days: 0,
//           work_days: [],
//           statuses: new Set(),
//         };
//       }

//       if (item.n_jour) {
//         groups[key].total_days += parseFloat(item.n_jour || 0);
//       }
//       groups[key].work_days.push(item);
//       groups[key].statuses.add(item.statut);
//     });

//     return Object.values(groups).map((group) => ({
//       ...group,
//       total_entries: group.work_days.length,
//     }));
//   };

//   const fetchCraWorkDays = async (consultantId, bdcId, period) => {
//     setCraModalLoading(true);
//     try {
//       const commercialId = localStorage.getItem("userId") || localStorage.getItem("id");
//       const token = localStorage.getItem("unifiedToken") || localStorage.getItem("token");

//       const response = await axios.get(
//         `${Endponit()}/api/cra-by-commercial-period/`,
//         {
//           params: { commercial_id: commercialId, period: period },
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (response.data?.status) {
//         const filteredData = response.data.data.filter(
//           (item) => item.id_consultan === consultantId && item.id_bdc === bdcId
//         );
//         setCraWorkDays(filteredData);
//       } else {
//         message.error("Failed to fetch CRA work days");
//         setCraWorkDays([]);
//       }
//     } catch (error) {
//       message.error(`Error fetching CRA work days: ${error.message}`);
//       setCraWorkDays([]);
//     } finally {
//       setCraModalLoading(false);
//     }
//   };

//   const handleCraClick = (record) => {
//     const consultantId = record.id_consultan;
//     const bdcId = record.id_bdc;
//     const period = record.période;

//     // Store the selected CRA record with its API status
//     setSelectedCraRecord(record);

//     setSelectedConsultant({
//       id: consultantId,
//       name: record.consultant_name,
//       email: record.consultant_email,
//       period: period,
//     });
//     setSelectedBdc({
//       id: bdcId,
//       project: `BDC ${bdcId}`,
//       description: record.client_name,
//     });
//     setSelectedPeriod(period);
//     setCraModalVisible(true);
//     fetchCraWorkDays(consultantId, bdcId, period);
//   };

//   const handleSearch = (values) => {
//     fetchCraData(values);
//   };

//   const handleReset = () => {
//     form.resetFields();
//     const currentPeriod = moment().format("MM_YYYY");
//     form.setFieldsValue({ period: currentPeriod });
//     fetchCraData({ period: currentPeriod });
//   };

//   const getStatusColor = (status) => {
//     const statusOption = statusOptions.find((opt) => opt.value === status);
//     return statusOption ? statusOption.color : "default";
//   };

//   const formatPeriod = (period) => {
//     if (!period) return "";
//     const [month, year] = period.split("_");
//     if (!month || !year) return period;
//     return moment(`${year}-${month}-01`).format("MMMM YYYY");
//   };

//   const craWorkDaysColumns = [
//     {
//       title: "Date",
//       key: "date",
//       render: (record) => {
//         const periode = record.période || "";
//         const jour = String(record.jour || "1");
//         const [month, year] = periode.split("_");
//         return jour && month && year
//           ? `${jour.padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
//           : "-";
//       },
//       sorter: (a, b) => {
//         const periodeA = a.période || "";
//         const jourA = parseInt(a.jour || "1");
//         const [monthA, yearA] = periodeA.split("_");

//         const periodeB = b.période || "";
//         const jourB = parseInt(b.jour || "1");
//         const [monthB, yearB] = periodeB.split("_");

//         return (
//           new Date(yearA, monthA - 1, jourA) -
//           new Date(yearB, monthB - 1, jourB)
//         );
//       },
//     },
//     {
//       title: "Durée (j)",
//       dataIndex: "Durée",
//       key: "duration",
//       render: (text) => <Tag color="blue">{text || "0"}</Tag>,
//       sorter: (a, b) => (parseFloat(a.Durée) || 0) - (parseFloat(b.Durée) || 0),
//     },
//     {
//       title: "Type",
//       dataIndex: "type",
//       key: "type",
//       render: (text) => {
//         const type = text || "travail";
//         return type.charAt(0).toUpperCase() + type.slice(1);
//       },
//     },
//     {
//       title: "Project",
//       key: "project",
//       render: (record) => record.project?.titre || `BDC ${record.id_bdc}`,
//     },
//     {
//       title: "TJM",
//       key: "tjm",
//       render: (record) => `${record.candidature?.tjm || 0}€`,
//     },
//   ];

//   const columns = [
//     {
//       title: "Period",
//       dataIndex: "période",
//       key: "période",
//       // width: 120,
//       render: (text) => formatPeriod(text),
//     },
//     // {
//     //   title: "Jours",
//     //   dataIndex: "n_jour",
//     //   key: "n_jour",
//     //   render: (text) => <Tag color="blue">{text}</Tag>,
//     //   sorter: (a, b) => a.n_jour - b.n_jour,
//     // },
//     {
//       title: "CRA Status",
//       dataIndex: "statut",
//       key: "statut",
//       // width: 120,
//       render: (status) => {
//         const displayStatus = getDisplayStatus(status);
//         return <Tag color={getStatusColor(displayStatus)}>{displayStatus}</Tag>;
//       },
//       filters: statusOptions.map((option) => ({
//         text: option.value,
//         value: option.value,
//       })),
//       onFilter: (value, record) => {
//         const displayStatus = getDisplayStatus(record.statut);
//         return displayStatus === value;
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       // width: 100,
//       fixed: "right",
//       render: (_, record) => (
//         <Button
//           type="primary"
//           icon={<CalendarOutlined />}
//           size="small"
//           onClick={() => handleCraClick(record)}
//         >
//           CRA
//         </Button>
//       ),
//     },
//   ];

//   const closeModal = () => {
//     setCraModalVisible(false);
//     setSelectedConsultant(null);
//     setSelectedBdc(null);
//     setSelectedPeriod(null);
//     setCraWorkDays([]);
//     setValidationNote("");
//     setSelectedCraRecord(null);
//     setRejectModalVisible(false);
//   };

//   // Check if the selected CRA status from API is EVP (for commercial validation)
//   const hasEvpEntries =
//     selectedCraRecord &&
//     (selectedCraRecord.statut === "EVP" ||
//       selectedCraRecord.statut === "En attente validation prestataire");

//   return (
//     <div
//       style={{
//         padding: "20px",
//         backgroundColor: "#f0f2f5",
//         minHeight: "100vh",
//       }}
//     >
//       <Card style={{ marginBottom: "20px" }}>
//         <Form
//           form={form}
//           layout="inline"
//           onFinish={handleSearch}
//           initialValues={{ period: moment().format("MM_YYYY") }}
//         >
//           <Form.Item
//             label="Period"
//             name="period"
//             rules={[{ required: true, message: "Period is required" }]}
//           >
//             <Input
//               placeholder="MM_YYYY (e.g., 05_2025)"
//               style={{ width: 200 }}
//             />
//           </Form.Item>

//           <Form.Item label="Status" name="status">
//             <Select
//               placeholder="Select status"
//               style={{ width: 150 }}
//               allowClear
//             >
//               {filterStatusOptions.map((option) => (
//                 <Option key={option.value} value={option.value}>
//                   <Tag color={option.color}>{option.value}</Tag>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 icon={<SearchOutlined />}
//                 loading={loading}
//               >
//                 Search
//               </Button>
//               <Button icon={<ClearOutlined />} onClick={handleReset}>
//                 Reset
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>

//       <Card>
//         <Table
//           columns={columns}
//           dataSource={craData}
//           rowKey="id_CRA"
//           loading={loading}
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) =>
//               `${range[0]}-${range[1]} of ${total} records`,
//           }}
//           scroll={{ x: 1400 }}
//           size="small"
//         />
//       </Card>

//       <Modal
//         title={
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               width: "100%",
//               padding: "0 19px",
//             }}
//           >
//             <div>
//               <CalendarOutlined style={{ marginRight: 8 }} />
//               {selectedConsultant && selectedBdc
//                 ? `CRA Details - ${formatPeriod(selectedPeriod)}`
//                 : "CRA Work Days"}
//             </div>
//             {hasEvpEntries && (
//               <Space>
//                 <Button
//                   type="primary"
//                   style={{ background: "#52c41a", borderColor: "#52c41a" }}
//                   icon={<CheckOutlined />}
//                   size="small"
//                   loading={validationLoading}
//                   onClick={() => {
//                     Modal.confirm({
//                       title: "Validation des CRA",
//                       content: (
//                         <div>
                         
//                         </div>
//                       ),
//                       okText: "Valider",
//                       cancelText: "Annuler",
//                       onOk: () => handleBulkValidation(true),
//                     });
//                   }}
//                 >
//                   Valider
//                 </Button>
//                 <Button
//                   danger
//                   icon={<CloseOutlined />}
//                   size="small"
//                   loading={validationLoading}
//                   onClick={() => {
//                     setValidationNote("");
//                     setRejectModalVisible(true);
//                   }}
//                 >
//                   Refuser
//                 </Button>
//               </Space>
//             )}
//           </div>
//         }
//         open={craModalVisible}
//         onCancel={closeModal}
//         width={1300}
//         footer={[
//           <Button key="close" onClick={closeModal}>
//             Close
//           </Button>,
//         ]}
//       >
//         {craModalLoading ? (
//           <div style={{ textAlign: "center", padding: "50px" }}>
//             <Spin size="large" />
//             <div style={{ marginTop: 16 }}>Loading work days...</div>
//           </div>
//         ) : (
//           <Row gutter={[16, 16]}>
            
//             <Col span={24}>
//               <Card  size="small">
//                 <Table
//                   columns={craWorkDaysColumns}
//                   dataSource={craWorkDays}
//                   rowKey="id_imputation"
//                   size="small"
//                   pagination={{ pageSize: 10 }}
//                   locale={{
//                     emptyText:
//                       "No work days found for this consultant-project combination",
//                   }}
//                   summary={() => {
//                     const totalDays = craWorkDays.reduce(
//                       (sum, item) => sum + parseFloat(item.Durée || 0),
//                       0
//                     );
//                     const totalAmount = craWorkDays.reduce(
//                       (sum, item) =>
//                         sum +
//                         parseFloat(item.Durée || 0) *
//                           parseFloat(item.candidature?.tjm || 0),
//                       0
//                     );

//                     return (
//                       <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
//                         <Table.Summary.Cell index={0}>
//                           <strong>Total</strong>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={1}>
//                           <Tag color="green">
//                             <strong>{totalDays} days</strong>
//                           </Tag>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
//                         <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
//                         <Table.Summary.Cell index={4}>
//                           <Tag color="orange">
//                             <strong>{totalAmount.toFixed(2)}€</strong>
//                           </Tag>
//                         </Table.Summary.Cell>
//                       </Table.Summary.Row>
//                     );
//                   }}
//                 />
//               </Card>
//             </Col>
//           </Row>
//         )}
//       </Modal>

//       {/* Reject Modal */}
//       <Modal
//         title="Refuser les CRA"
//         open={rejectModalVisible}
//         onCancel={() => {
//           setRejectModalVisible(false);
//           setValidationNote("");
//         }}
//         onOk={() => {
//           if (!validationNote.trim()) {
//             message.error("Veuillez indiquer la raison du refus");
//             return;
//           }
//           setRejectModalVisible(false);
//           handleBulkValidation(false);
//         }}
//         okText="Refuser"
//         cancelText="Annuler"
//         okButtonProps={{ danger: true }}
//       >
//         <div>
        
//           <Input.TextArea
//             placeholder="Veuillez indiquer la raison du refus"
//             rows={4}
//             value={validationNote}
//             onChange={(e) => setValidationNote(e.target.value)}
//             style={{ marginTop: 16 }}
//           />
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default InterfaceCommercial;

import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Typography,
  Dropdown,
  message,
  Spin,
  Breadcrumb,
  Card,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Modal,
  Progress,
  Tabs,
  Badge,
  Timeline,
  Input,
  Select,
  DatePicker,
  Empty,
  Tooltip,
  Divider,
  Alert,
  Table,
  Space,
  Form,
  Result,
  Switch,
  Drawer,
} from "antd";
import {
  UserOutlined,
  DashboardOutlined,
  BellOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SearchOutlined,
  FileAddOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlusOutlined,
  PaperClipOutlined,
  CloudUploadOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  ProjectOutlined,
  ArrowLeftOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ShopOutlined,
  DollarOutlined,
  ApartmentOutlined,
  ContactsOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckOutlined,
  LeftOutlined,
  RightOutlined,
  ExpandOutlined,
  CompressOutlined,
} from "@ant-design/icons";
import {
  useNavigate,
  Routes,
  Route,
  Link as RouterLink,
  useParams,
  useLocation,
} from "react-router-dom";
import { Endponit as Endpoint } from "../helper/enpoint";
import moment from "moment";
import "moment/locale/fr";
import axios from "axios";
moment.locale("fr");

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const InterfaceCommercial = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    ID_collab: localStorage.getItem("userId") || "",
    Nom: localStorage.getItem("userName")?.split(" ")[1] || "Commercial",
    Prenom: localStorage.getItem("userName")?.split(" ")[0] || "",
    email: "commercial@example.com",
    Poste: "Responsable Commercial",
    ID_ESN: localStorage.getItem("esnId") || "1",
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const [consultants, setConsultants] = useState([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantsError, setConsultantsError] = useState(null);
  // Add these state variables after the existing validationModalVisible state
  // CRA-related state
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantCraVisible, setConsultantCraVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [craData, setCraData] = useState(null);
  const [craLoading, setCraLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsById, setProjectsById] = useState({});
  const [clientsById, setClientsById] = useState({});
  const [frenchHolidays, setFrenchHolidays] = useState([]);
  const [moroccanHolidays, setMoroccanHolidays] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("FR");
  const [showHolidays, setShowHolidays] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [clientFilter, setClientFilter] = useState("");
  const [validationLoading, setValidationLoading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [contractStatuses, setContractStatuses] = useState({});  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [craEntriesToSubmit, setCraEntriesToSubmit] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // State variables for cancel modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelComment, setCancelComment] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedCancelContract, setSelectedCancelContract] = useState(null);

  // Add this function after the fetchHolidays function
  const fetchContractStatuses = async (consultantId, date) => {
    try {
      const token = localStorage.getItem("unifiedToken");
      const period = date.format("MM_YYYY");

      const response = await axios.get(`${Endpoint()}/api/cra_consultant/`, {
        params: {
          consultant_id: consultantId,
          period: period,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response) {
        // Create a map of contract ID to status
        const statusMap = {};
        response.data.data.forEach((cra) => {
          if (cra.id_bdc) {
            statusMap[cra.id_bdc] = {
              statut: cra.statut,
              n_jour: cra.n_jour,
              commentaire: cra.commentaire,
              id_CRA: cra.id_CRA,
            };
          }
        });
        setContractStatuses(statusMap);
      } else {
        setContractStatuses({});
      }
    } catch (error) {
      console.error("Error fetching contract statuses:", error);
      setContractStatuses({});
    }
  };

    // CRA status constants
  const CRA_STATUS = {
    A_SAISIR: "À saisir",
    EN_ATTENTE_PRESTATAIRE: "EVP",
    EN_ATTENTE_CLIENT: "En attente validation client",
    VALIDE: "Validé",
  };
  
  // Function to handle CRA cancellation with comment
  const handleCancelCRA = async () => {
    // Validate that a comment was entered
    if (!cancelComment.trim()) {
      message.error("Veuillez saisir un motif d'annulation");
      return;
    }
    
    try {
      setCancelLoading(true);
      const token = localStorage.getItem("unifiedToken");
      
      // Create JSON formatted comment with timestamp and user info
      const commentObject = {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        user: {
          id: userData.ID_collab,
          name: `${userData.Prenom} ${userData.Nom}`,
          role: userData.Poste
        },
        reason: cancelComment,
        previousStatus: selectedCancelContract.statut
      };
      
      // Convert to JSON string
      const jsonComment = JSON.stringify(commentObject);
      
      // Make API call
      await axios.put(
        `${Endpoint()}/api/cra_consultant/${selectedCancelContract.id_CRA}/`,
        {
          statut: "annule",
          commentaire: jsonComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      message.success("CRA annulé avec succès");
      
      // Reset state
      setCancelModalVisible(false);
      setCancelComment('');
      setSelectedCancelContract(null);
      
      // Refresh the CRA data
      await fetchConsultantCra(selectedConsultant, selectedMonth);
    } catch (error) {
      console.error("Error canceling CRA:", error);
      message.error("Erreur lors de l'annulation du CRA");
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    // Add some CSS for animations
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .ant-card {
        transition: all 0.3s;
      }
      .ant-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .cra-table {
        font-size: 12px;
      }
      .cra-table .ant-table-thead > tr > th {
        padding: 8px 4px;
        text-align: center;
        font-weight: bold;
        background: #fafafa;
        border: 1px solid #d9d9d9;
      }
      .cra-table .ant-table-tbody > tr > td {
        padding: 4px 2px;
        text-align: center;
        border: 1px solid #d9d9d9;
        min-width: 30px;
        max-width: 40px;
        vertical-align: middle;
      }
      .cra-table .ant-table-tbody > tr:hover > td {
        background: #e6f7ff !important;
      }
      .weekend-cell {
        background-color: #f5f5f5 !important;
        color: #999;
      }
      .holiday-cell {
        background-color: #fff2e8 !important;
        color: #fa8c16;
      }
      .work-cell {
        background-color: #f6ffed;
        color: #52c41a;
        cursor: pointer;
      }
      .absence-cell {
        background-color: #fff1f0;
        color: #ff4d4f;
      }
      .status-a-saisir {
        background-color: #fff7e6;
        border-left: 3px solid #fa8c16;
      }
      .status-en-attente-prestataire {
        background-color: #e6f7ff;
        border-left: 3px solid #1890ff;
      }
      .status-en-attente-client {
        background-color: #f6ffed;
        border-left: 3px solid #52c41a;
      }
      .status-valide {
        background-color: #f9f0ff;
        border-left: 3px solid #722ed1;
      }
      .client-header {
        background-color: #001529 !important;
        color: white !important;
        font-weight: bold;
      }
      .project-row:hover {
        background-color: #f0f7ff;
      }
      .sticky-columns {
        position: sticky;
        left: 0;
        z-index: 1;
        background: white;
      }
    `;
    document.head.appendChild(style);

    // Check authentication
    const checkAuth = () => {
      const token = localStorage.getItem("unifiedToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!token || !userId || userRole !== "commercial") {
        message.error(
          "Vous devez être connecté en tant que commercial pour accéder à cette page"
        );
        navigate("/unified-login");
        return false;
      }

      // Ensure we don't have any consultant-specific localStorage items
      localStorage.removeItem("consultantProjects");
      localStorage.removeItem("projectsData");

      return true;
    };

    if (!checkAuth()) return;

    // Load user data
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("unifiedToken");
        const userId = localStorage.getItem("userId");

        // Mock data for development
        const mockUserData = {
          ID_collab: userId,
          Nom: localStorage.getItem("userName")?.split(" ")[1] || "Commercial",
          Prenom: localStorage.getItem("userName")?.split(" ")[0] || "",
          email: "commercial@example.com",
          Poste: "Responsable Commercial",
          ID_ESN: localStorage.getItem("esnId") || "1",
          Date_inscription: "2025-05-01",
        };

        setUserData(mockUserData);
      } catch (error) {
        console.error("Error loading user data:", error);
        message.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    // Load notifications
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem("unifiedToken");
        const userId = localStorage.getItem("userId");

        // Mock notifications for development
        const mockNotifications = [
          {
            id: 1,
            title: "Nouvelle opportunité",
            message: "Une nouvelle opportunité a été ajoutée pour EntrepriseB",
            date: new Date().toISOString(),
            read: false,
          },
          {
            id: 2,
            title: "Contrat signé",
            message: "Le contrat avec SociétéA a été signé",
            date: new Date(Date.now() - 86400000).toISOString(),
            read: true,
          },
          {
            id: 3,
            title: "Rappel: Réunion",
            message: "Réunion avec l'équipe commerciale demain à 10h",
            date: new Date(Date.now() - 172800000).toISOString(),
            read: false,
          },
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter((n) => !n.read).length);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadUserData();
    loadNotifications();

    // Extract current page from URL if available
    // const path = location.pathname.split("/").pop();
    // if (path && path !== "interface-commercial") {
    //   if (path === "projects") {
    //     navigate("/interface-commercial");
    //   } else {
    //     setCurrentPage(path);
    //   }
    // }

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, [navigate, location]);

  useEffect(() => {
    if (
      currentPage === "consultants" &&
      !consultants.length &&
      !consultantsLoading
    ) {
      fetchConsultants();
    }
  }, [currentPage, consultants.length, consultantsLoading]);

  // Fetch holidays when the selected month changes
  useEffect(() => {
    if (consultantCraVisible && selectedMonth) {
      fetchHolidays(selectedMonth);
    }
  }, [selectedMonth, consultantCraVisible]);

  // Effect to reprocess the data when holiday visibility is toggled
  useEffect(() => {
    if (craData && craData.days) {
      const holidays =
        selectedCountry === "FR" ? frenchHolidays : moroccanHolidays;
      updateCraDataWithHolidays(holidays);
    }
  }, [selectedCountry, showHolidays]);

  const handleLogout = () => {
    Modal.confirm({
      title: "Confirmation",
      content: "Êtes-vous sûr de vouloir vous déconnecter ?",
      okText: "Oui",
      cancelText: "Non",
      onOk: () => {
        // Clear all authentication and role-specific data
        localStorage.removeItem("unifiedToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("esnId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userType");
        localStorage.removeItem("consultantProjects");
        localStorage.removeItem("projectsData");

        message.success("Déconnexion réussie");
        navigate("/unified-login");
      },
    });
  };

  const fetchConsultants = async () => {
    setConsultantsLoading(true);
    setConsultantsError(null);
    try {
      const token = localStorage.getItem("unifiedToken");
      const commercialId = localStorage.getItem("userId");

      const response = await fetch(
        `${Endpoint()}/api/consultants-by-commercial/?commercial_id=${commercialId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des consultants");
      }

      const data = await response.json();
      setConsultants(data.data || []);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      setConsultantsError(error.message);
      message.error("Impossible de charger la liste des consultants");
    } finally {
      setConsultantsLoading(false);
    }
  };

  // Replace the existing fetchConsultantCra function with this updated version
  const fetchConsultantCra = async (consultant, period = selectedMonth) => {
    setCraLoading(true);
    setSelectedConsultant(consultant);
    setConsultantCraVisible(true);

    try {
      const token = localStorage.getItem("unifiedToken");
      const formattedPeriod = period.format("MM_YYYY");

      // Fetch contract statuses
      await fetchContractStatuses(consultant.ID_collab, period);

      // Fetch CRA data
      const craResponse = await axios.get(`${Endpoint()}/api/cra-by-period/`, {
        params: {
          consultant_id: consultant.ID_collab,
          period: formattedPeriod,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch projects for this consultant
      const projectsResponse = await axios.get(
        `${Endpoint()}/api/projects-by-consultant-period/`,
        {
          params: {
            consultant_id: consultant.ID_collab,
            period: formattedPeriod,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (projectsResponse.data?.status) {
        const projectsData = projectsResponse.data.data || [];
        setProjects(projectsData);

        // Create lookup maps
        const projectsMap = {};
        const clientsMap = {};

        projectsData.forEach((project) => {
          projectsMap[project.ID_BDC] = project;
          if (project.client_info) {
            clientsMap[project.client_info.ID_client] = project.client_info;
          }
        });

        setProjectsById(projectsMap);
        setClientsById(clientsMap);
      }

      if (craResponse.data?.status) {
        processCraData(craResponse.data.data || [], period);
      } else {
        processCraData([], period);
      }
    } catch (error) {
      console.error("Error fetching consultant CRA:", error);
      message.error("Impossible de charger le CRA du consultant");
      processCraData([], period);
    } finally {
      setCraLoading(false);
    }
  };

  // Add these functions after the openValidationModal function
  const openSubmissionModalForContracts = (contractIds) => {
    if (!craData || !craData.clientWork) {
      message.info("Aucune donnée CRA disponible");
      return;
    }

    // Collect all entries for the specified contracts that can be submitted
    const contractEntries = [];
    craData.clientWork.forEach((client) => {
      Object.values(client.projects).forEach((project) => {
        if (contractIds.includes(project.projectId)) {
          project.entries.forEach((entry) => {
            if (!entry.statut || entry.statut === CRA_STATUS.A_SAISIR) {
              contractEntries.push({
                ...entry,
                clientName: client.clientName,
                projectName: project.projectName,
                selected: true,
              });
            }
          });
        }
      });
    });

    if (contractEntries.length === 0) {
      message.info("Aucune entrée CRA à soumettre pour ce contrat");
      return;
    }

    setCraEntriesToSubmit(contractEntries);
    setSelectedContractId(contractIds[0]);
    setSubmissionModalVisible(true);
  };

  const submitCraForValidation = async () => {
    const selectedEntries = craEntriesToSubmit.filter(
      (entry) => entry.selected
    );

    if (selectedEntries.length === 0) {
      message.warning("Veuillez sélectionner au moins une entrée à soumettre");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("unifiedToken");
      const consultantId = selectedConsultant.ID_collab;
      const formattedPeriod = selectedMonth.format("MM_YYYY");

      // Check if CRA record exists, if not create one
      const existingCra = Object.values(contractStatuses).find(
        (status) => status.id_CRA && status.id_CRA !== null
      );

      let craId;
      if (existingCra && existingCra.id_CRA) {
        craId = existingCra.id_CRA;
      } else {
        // Create new CRA record
        const createResponse = await axios.post(
          `${Endpoint()}/api/cra_consultant/`,
          {
            consultant_id: consultantId,
            periode: formattedPeriod,
            statut: "EVP", // En Validation Prestataire
            id_bdc: selectedContractId,
            n_jour: selectedEntries.reduce(
              (sum, entry) => sum + parseFloat(entry.Durée || 0),
              0
            ),
            commentaire: "Soumis pour validation",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (createResponse.data?.status) {
          craId = createResponse.data.data.id_CRA;
        } else {
          throw new Error("Impossible de créer l'enregistrement CRA");
        }
      }

      // Update CRA status to "EVP" (En Validation Prestataire)
      const updateResponse = await axios.put(
        `${Endpoint()}/api/cra_consultant/${craId}/`,
        {
          statut: "EVP",
          n_jour: selectedEntries.reduce(
            (sum, entry) => sum + parseFloat(entry.Durée || 0),
            0
          ),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (updateResponse.data?.status) {
        message.success("CRA soumis pour validation avec succès");
        setSubmissionModalVisible(false);
        setCraEntriesToSubmit([]);
        setSelectedContractId(null);

        // Refresh data
        await fetchConsultantCra(selectedConsultant, selectedMonth);
      } else {
        throw new Error("Impossible de mettre à jour le statut du CRA");
      }
    } catch (error) {
      console.error("Error submitting CRA:", error);
      message.error("Impossible de soumettre le CRA pour validation");
    } finally {
      setSubmitting(false);
    }
  };

  // Function to fetch holidays from Nager.Date API
  const fetchHolidays = async (date) => {
    try {
      const year = date.year();

      // Fetch French holidays
      const frenchResponse = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/FR`
      );

      if (frenchResponse.ok) {
        const frenchData = await frenchResponse.json();
        setFrenchHolidays(frenchData);
      }

      // Fetch Moroccan holidays
      const moroccanResponse = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/MA`
      );

      if (moroccanResponse.ok) {
        const moroccanData = await moroccanResponse.json();
        setMoroccanHolidays(moroccanData);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  // Update CRA data with holiday information
  const updateCraDataWithHolidays = (holidays) => {
    if (!craData || !craData.days) return;

    const updatedDays = craData.days.map((day) => {
      const dayDate = selectedMonth.clone().date(day.day);
      const dateString = dayDate.format("YYYY-MM-DD");

      const holiday = holidays.find((h) => h.date === dateString);

      return {
        ...day,
        isHoliday: showHolidays ? !!holiday : false,
        holidayName: holiday ? holiday.localName || holiday.name : null,
      };
    });

    // Recalculate potential work days
    const potentialWorkDays = updatedDays.filter(
      (day) => !day.isWeekend && (!showHolidays || !day.isHoliday)
    ).length;

    setCraData({
      ...craData,
      days: updatedDays,
      potentialWorkDays: potentialWorkDays,
    });
  };
  // Toggle between French and Moroccan holidays
  const toggleCountry = () => {
    const newCountry = selectedCountry === "FR" ? "MA" : "FR";
    setSelectedCountry(newCountry);
  };

  // Function to fetch project title by ID
  const fetchProjectTitleById = async (projectId) => {
    try {
      const token = localStorage.getItem("unifiedToken");
      const response = await axios.get(`${Endpoint()}/api/project-title-by-id/`, {
        params: {
          project_id: projectId
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data?.status) {
        return response.data.data.titre;
      }
      return `Projet ${projectId}`;
    } catch (error) {
      console.error(`Error fetching project title for ID ${projectId}:`, error);
      return `Projet ${projectId}`;
    }
  };

  // Process CRA data for display
  const processCraData = (data, monthDate) => {
    const year = monthDate.year();
    const month = monthDate.month();
    const daysInMonth = monthDate.daysInMonth();

    // Initialize days array with all days of the month
    const daysData = [];
    const clientWork = {};

    // Initialize the calendar structure
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = moment({ year, month, day });
      const weekday = dayDate.format("dddd");
      const isWeekend = dayDate.day() === 0 || dayDate.day() === 6;

      // Filter entries for this specific day
      const dayEntries = data.filter((entry) => parseInt(entry.jour) === day);
      const totalDuration = dayEntries.reduce(
        (sum, entry) => sum + parseFloat(entry.Durée || 0),
        0
      );

      daysData.push({
        day,
        dayType: weekday,
        isWeekend,
        clientHours: {},
        total: totalDuration,
        isHoliday: false,
        holidayName: null,
        entries: dayEntries,
        hasEntry: dayEntries.length > 0,
        duration: totalDuration,
        assignedProjects: [],
        assignedProject: null,
        isInternal: false,
      });
    }

    // Populate with CRA data
    data.forEach((entry) => {
      const day = parseInt(entry.jour);
      if (day < 1 || day > daysInMonth) return;

      const dayIndex = day - 1;
      const dayData = daysData[dayIndex];

      // Handle client work
      if (entry.id_client && entry.id_bdc) {
        const clientId = entry.id_client;
        const projectId = entry.id_bdc;

        if (!clientWork[clientId]) {
          clientWork[clientId] = {
            clientId,
            clientName:
              clientsById[clientId]?.Nom_client || `Client ${clientId}`,
            projects: {},
            totalDays: 0,
          };
        }        if (!clientWork[clientId].projects[projectId]) {
          // Fetch project title directly from API
          fetchProjectTitleById(projectId).then(projectTitle => {
            clientWork[clientId].projects[projectId].projectName = projectTitle;
          }).catch(error => {
            console.error(`Error fetching project title for ID ${projectId}:`, error);
          });
          
          clientWork[clientId].projects[projectId] = {
            projectId,
            projectName: `Projet ${projectId}`, // Default name until API response arrives
            days: Array(daysInMonth).fill(null),
            totalDays: 0,
            entries: [],
            status: entry.statut || CRA_STATUS.A_SAISIR,
          };
        }

        clientWork[clientId].projects[projectId].days[day - 1] = parseFloat(
          entry.Durée || 0
        );
        clientWork[clientId].projects[projectId].totalDays += parseFloat(
          entry.Durée || 0
        );
        clientWork[clientId].projects[projectId].entries.push(entry);
        clientWork[clientId].totalDays += parseFloat(entry.Durée || 0);

        // Update day data
        if (!dayData.clientHours[clientId]) {
          dayData.clientHours[clientId] = {};
        }
        dayData.clientHours[clientId][projectId] = parseFloat(entry.Durée || 0);
      } else {
        // Handle absence/leave entries
        if (
          entry.type_imputation === "Congé" ||
          entry.type_imputation === "Férié" ||
          entry.type === "congé" ||
          entry.type === "férié"
        ) {
          dayData.isInternal = true;
          dayData.absenceType = entry.type_imputation || entry.type;
        }
      }
    });

    // Calculate total work days
    const totalDays = daysData.reduce((sum, day) => sum + day.total, 0);

    // Calculate potential work days (excluding weekends and holidays)
    const potentialWorkDays = daysData.filter(
      (day) => !day.isWeekend && !day.isHoliday
    ).length;

    setCraData({
      days: daysData,
      clientWork: Object.values(clientWork),
      totalDays: totalDays,
      potentialWorkDays: potentialWorkDays,
    });

    // Fetch holidays data after processing CRA data
    fetchHolidays(monthDate);
  };

  // Function to toggle collapse state of a client group
  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Function to toggle all groups at once
  const toggleAllGroups = (collapsed = false) => {
    const newCollapsedState = {};
    if (craData && craData.clientWork) {
      craData.clientWork.forEach((client) => {
        newCollapsedState[client.clientId] = collapsed;
      });
    }
    setCollapsedGroups(newCollapsedState);
  };

  // Function to count visible client groups after filtering
  const countVisibleClientGroups = () => {
    if (!craData || !craData.clientWork) return 0;

    return craData.clientWork.filter(
      (client) =>
        clientFilter === "" ||
        client.clientName.toLowerCase().includes(clientFilter.toLowerCase())
    ).length;
  };

  const validateAndSendToClient = async () => {
    if (selectedEntries.length === 0) {
      message.warning("Veuillez sélectionner au moins une entrée à valider");
      return;
    }

    setValidationLoading(true);
    try {
      const token = localStorage.getItem("unifiedToken");

      // Get the project ID from the first selected entry (assuming all entries are for the same project)
      const projectId = selectedEntries[0].id_bdc;
      const contractStatus = contractStatuses[projectId];

      if (!contractStatus || !contractStatus.id_CRA) {
        message.error("Impossible de trouver l'ID CRA pour ce contrat");
        return;
      }

      // Update only the CRA consultant status to "EVC" (En Validation Client)
      await axios.put(
        `${Endpoint()}/api/cra_consultant/${contractStatus.id_CRA}/`,
        {
          statut: "EVC", // Changed status to "En Validation Client"
          n_jour: selectedEntries.reduce(
            (sum, entry) => sum + parseFloat(entry.Durée || 0),
            0
          ),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      message.success(
        `CRA validé et envoyé au client (${selectedEntries.length} entrée(s))`
      );
      setSelectedEntries([]);
      setValidationModalVisible(false);

      // Refresh the CRA data
      await fetchConsultantCra(selectedConsultant, selectedMonth);
    } catch (error) {
      console.error("Error validating CRA:", error);
      message.error("Erreur lors de la validation du CRA");
    } finally {
      setValidationLoading(false);
    }
  };

  // Open validation modal
  const openValidationModal = () => {
    if (!craData || !craData.clientWork) {
      message.warning("Aucune donnée CRA disponible");
      return;
    }

    // Collect all entries that can be validated (status: "À saisir")
    const validatableEntries = [];
    craData.clientWork.forEach((client) => {
      Object.values(client.projects).forEach((project) => {
        project.entries.forEach((entry) => {
          if (entry.statut === CRA_STATUS.EN_ATTENTE_PRESTATAIRE) {
            validatableEntries.push({
              ...entry,
              clientName: client.clientName,
              projectName: project.projectName,
            });
          }
        });
      });
    });

    setSelectedEntries(validatableEntries);
    setValidationModalVisible(true);
  };

  const userMenu = (
    <Menu>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Déconnexion
      </Menu.Item>
    </Menu>
  );

  const notificationMenu = (
    <Menu style={{ width: 300 }}>
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
          fontWeight: "bold",
        }}
      >
        Notifications récentes
      </div>
      {notifications.length > 0 ? (
        notifications.slice(0, 3).map((notification) => (
          <Menu.Item
            key={notification.id}
            style={{
              background: notification.read ? "transparent" : "#f0f7ff",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <Badge dot={!notification.read} offset={[0, 5]}>
                <Avatar
                  size="small"
                  style={{ backgroundColor: "#1890ff", marginRight: 8 }}
                  icon={<BellOutlined />}
                />
              </Badge>
              <div>
                <div
                  style={{ fontWeight: notification.read ? "normal" : "bold" }}
                >
                  {notification.title}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {notification.message}
                </div>
                <div
                  style={{ fontSize: "11px", color: "#bbb", marginTop: "5px" }}
                >
                  {new Date(notification.date).toLocaleString()}
                </div>
              </div>
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item disabled>
          <Empty
            description="Aucune notification"
            style={{ margin: "20px 0" }}
          />
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="view-all" style={{ textAlign: "center" }}>
        <RouterLink
          to="/interface-commercial/notifications"
          onClick={() => setCurrentPage("notifications")}
        >
          Voir toutes les notifications
        </RouterLink>
      </Menu.Item>
    </Menu>
  );

  // Dashboard Content
  const renderDashboard = () => {
    return (
      <div className="dashboard-content" style={{ animation: "fadeIn 0.5s" }}>
        <Title level={4}>Tableau de bord Commercial</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Consultants"
                value={consultants.length}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Projets Actifs"
                value={42}
                prefix={<ProjectOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="CA du Mois"
                value={125000}
                suffix="€"
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Notifications"
                value={unreadCount}
                prefix={<BellOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Consultants Content with CRA button
  const renderConsultants = () => {
    const columns = [
      {
        title: "Nom",
        key: "name",
        render: (_, record) => `${record.Prenom} ${record.Nom}`,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Poste",
        dataIndex: "Poste",
        key: "poste",
      },
      {
        title: "Statistiques",
        key: "stats",
        render: (_, record) => (
          <Space direction="vertical" size="small">
            <span>
              <Badge
                status="default"
                text={`${record.statistics?.client_count || 0} Clients`}
              />
            </span>
          </Space>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size="small">
            <Button
              icon={<FileSearchOutlined />}
              size="small"
              onClick={() => fetchConsultantCra(record)}
            >
              CRA
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <div className="consultants-content" style={{ animation: "fadeIn 0.5s" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4}>Gestion des Consultants</Title>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchConsultants}
            loading={consultantsLoading}
          >
            Actualiser
          </Button>
        </div>

        <Card>
          {consultantsError && (
            <Alert
              message="Erreur"
              description={consultantsError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" type="primary" onClick={fetchConsultants}>
                  Réessayer
                </Button>
              }
            />
          )}

          <Table
            dataSource={consultants}
            columns={columns}
            rowKey="ID_collab"
            loading={consultantsLoading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: consultantsLoading ? (
                "Chargement..."
              ) : (
                <Empty
                  description="Aucun consultant trouvé"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
      </div>
    );
  };

  // Update the renderCraTable function - modify the "Pas d'activité" row section
  const renderCraTable = () => {
    if (!craData) return null;

    const { days, clientWork, totalDays, potentialWorkDays } = craData;
    const daysInMonth = days.length;

    // Create columns for the table
    const columns = [
      {
        title: "Client / Contrat",
        dataIndex: "name",
        key: "name",
        width: 200,
        fixed: "left",
        className: "sticky-columns",
        render: (text, record) => (
          <div style={{ fontWeight: record.isClient ? "bold" : "normal" }}>
            {text}
          </div>
        ),
      },
      {
        title: "Total",
        dataIndex: "total",
        key: "total",
        width: 80,
        fixed: "left",
        className: "sticky-columns",
        render: (value) => (
          <span style={{ fontWeight: "bold" }}>
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 200,
        fixed: "left",
        className: "sticky-columns",
        render: (_, record) => {
          if (record.isClient) {
            // Remove all client-level validation logic
            return null;
          }

          if (record.isProject) {
            const projectId = record.key.split("-")[1];
            const contractStatus = contractStatuses[projectId];

            // Can validate only if status is "EVP"
            const canValidate = contractStatus?.statut === "EVP";

            const hasValidatableEntries = record.entries.some(
              (entry) => entry.statut === CRA_STATUS.EN_ATTENTE_PRESTATAIRE
            );

            return (              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px',
                minWidth: '160px',
                alignItems: 'flex-start'
              }}>
                {/* Display contract status */}
                {contractStatus && (
                  <Tag
                    color={
                      contractStatus.statut === "saisi"
                        ? "blue"
                        : contractStatus.statut === "EVP"
                        ? "orange"
                        : contractStatus.statut === "EVC"
                        ? "purple"
                        : contractStatus.statut === "valide"
                        ? "green"
                        : contractStatus.statut === "annule"
                        ? "red"
                        : "default"
                    }
                    title={contractStatus.statut === "annule" && contractStatus.commentaire ? 
                      (() => {
                        try {
                          const commentObj = JSON.parse(contractStatus.commentaire);
                          
                          // Handle new format (client-focused)
                          if (commentObj.client && commentObj.motif) {
                            return `Refusé le ${commentObj.timestamp} par ${commentObj.client.name} (${commentObj.client.role})
Motif: ${commentObj.motif}
Statut précédent: ${commentObj.previousStatus}
Consultant: ${commentObj.consultant || 'N/A'}
Période: ${commentObj.periode || 'N/A'}`;
                          }
                          
                          // Handle old format (user-focused)
                          if (commentObj.user && commentObj.reason) {
                            return `Annulé le ${commentObj.timestamp} par ${commentObj.user.name} (${commentObj.user.role})
Raison: ${commentObj.reason}
Statut précédent: ${commentObj.previousStatus}`;
                          }
                          
                          // Fallback to raw comment if neither format matches
                          return contractStatus.commentaire;
                        } catch (e) {
                          return contractStatus.commentaire;
                        }
                      })() 
                      : undefined}
                    style={{ marginBottom: '4px' }}
                  >
                    {contractStatus.statut === "saisi"
                      ? "Saisi"
                      : contractStatus.statut === "EVP"
                      ? "EVP"
                      : contractStatus.statut === "EVC"
                      ? "EVC"
                      : contractStatus.statut === "valide"
                      ? "Validé"
                      : contractStatus.statut === "annule"
                      ? "Refusé"
                      : contractStatus.statut}
                  </Tag>
                )}

                {/* Action buttons container - show only when status is "EVP" */}
                {contractStatus && contractStatus.statut === "EVP" && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px',
                    flexWrap: 'wrap',
                    width: '100%'
                  }}>
                    {/* Validation button */}
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => {
                        // Find the client data for this project
                        const clientData = clientWork.find((client) =>
                          Object.values(client.projects).some(
                            (proj) =>
                              proj.projectId.toString() === projectId.toString()
                          )
                        );

                        // Get only entries for this specific project
                        const projectEntries = record.entries
                          .filter((e) => e.statut === CRA_STATUS.A_SAISIR)
                          .map((entry) => ({
                            ...entry,
                            clientName:
                              clientData?.clientName || "Client inconnu",
                            projectName: record.name,
                          }));

                        setSelectedEntries(projectEntries);
                        setValidationModalVisible(true);
                      }}
                      title="Valider et envoyer au client"
                      style={{ 
                        minWidth: '72px',
                        fontSize: '12px'
                      }}
                    >
                      Valider
                    </Button>

                    {/* Cancel button */}
                    <Button
                      size="small"
                      type="default"
                      danger
                      icon={<ArrowLeftOutlined />}
                      onClick={() => {
                        // Open the cancel modal instead of Modal.confirm
                        setSelectedCancelContract(contractStatus);
                        setCancelModalVisible(true);
                      }}
                      title="Annuler le CRA et le remettre en statut 'annule'"
                      style={{ 
                        minWidth: '72px',
                        fontSize: '12px'
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            );
          }

          return null;
        },
      },
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const dayData = days[index];
        const isWeekend = dayData.isWeekend;
        const isHoliday = dayData.isHoliday;

        return {
          title: (
            <div style={{ textAlign: "center" }}>
              <div>{day}</div>
              <div style={{ fontSize: "10px", opacity: 0.7 }}>
                {dayData.dayType.substr(0, 3)}
              </div>
            </div>
          ),
          dataIndex: `day${day}`,
          key: `day${day}`,
          width: 40,
          align: "center",
          className: isWeekend
            ? "weekend-cell"
            : isHoliday
            ? "holiday-cell"
            : "",
          render: (value, record) => {
            // Hide cells for total row
            if (record.isTotal) return "";

            if (isWeekend || isHoliday) {
              return (
                <Tooltip title={isHoliday ? dayData.holidayName : "Week-end"}>
                  <span></span>
                </Tooltip>
              );
            }

            if (value === null || value === undefined) return "";

            if (typeof value === "string") {
              // For absence types
              return <span className="absence-cell">{value}</span>;
            }

            if (typeof value === "number" && value > 0) {
              return (
                <span
                  className={`work-cell status-${record.status
                    ?.toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[àâä]/g, "a")
                    .replace(/[éèêë]/g, "e")}`}
                >
                  {value.toFixed(1)}
                </span>
              );
            }

            return "";
          },
        };
      }),
    ];

    // Prepare data for the table
    const tableData = [];

    // Add client groups and their projects
    clientWork.forEach((client) => {
      const filteredClient =
        !clientFilter ||
        client.clientName.toLowerCase().includes(clientFilter.toLowerCase());

      if (!filteredClient) return;

      // Add client header row
      tableData.push({
        key: `client-${client.clientId}`,
        name: client.clientName,
        total: client.totalDays.toFixed(1),
        isClient: true,
        ...Object.fromEntries(
          Array.from({ length: daysInMonth }, (_, i) => [`day${i + 1}`, ""])
        ),
      });

      if (!collapsedGroups[client.clientId]) {
        Object.values(client.projects).forEach((project) => {
          const projectRow = {
            key: `project-${project.projectId}`,
            name: `${project.projectName}`,
            total: project.totalDays.toFixed(1),
            isProject: true,
            canValidate: project.entries.some(
              (e) => e.statut === CRA_STATUS.EN_ATTENTE_PRESTATAIRE
            ),
            entries: project.entries,
            status: project.status,
            ...Object.fromEntries(
              project.days.map((dayValue, i) => [
                `day${i + 1}`,
                dayValue > 0 ? dayValue : null,
              ])
            ),
          };
          tableData.push(projectRow);
        });
      }
    });

    // Add total row
    const totalRow = {
      key: "total",
      name: "TOTAL",
      total: totalDays.toFixed(1),
      isTotal: true,
      ...Object.fromEntries(
        days.map((day, i) => [
          `day${i + 1}`,
          null, // Changed from: day.total > 0 ? day.total.toFixed(1) : null
        ])
      ),
    };
    tableData.push(totalRow);
    // Calculate total remaining time for "Pas d'activité" row
    const totalRemainingTime = days.reduce((total, day) => {
      // Skip weekends and holidays
      if (day.isWeekend || day.isHoliday) return total;

      // Check if the day is in the future
      const dayDate = selectedMonth.clone().date(day.day);
      const isFutureDate = dayDate.isAfter(moment(), "day");
      if (isFutureDate) return total;

      // Calculate total duration from ALL entries for this day (work + absences)
      const totalDuration =
        day.entries?.reduce(
          (sum, entry) => sum + parseFloat(entry.Durée || 0),
          0
        ) || 0;

      // Calculate remaining time for this day
      const remainingDuration = Math.max(0, 1 - totalDuration);

      return total + remainingDuration;
    }, 0);

    // Add "Pas d'activité" row - Show remaining time (rest of 1) for each day
    const absenceRow = {
      key: "absence",
      name: "Pas d'activité",
      total: totalRemainingTime.toFixed(1).replace(".", ","),
      isAbsence: true,
      ...Object.fromEntries(
        days.map((day, i) => {
          // Skip weekends and holidays
          if (day.isWeekend || day.isHoliday) return [`day${i + 1}`, ""];

          // Check if the day is in the future
          const dayDate = selectedMonth.clone().date(day.day);
          const isFutureDate = dayDate.isAfter(moment(), "day");
          if (isFutureDate) return [`day${i + 1}`, ""];

          // Calculate total duration from ALL entries for this day (work + absences)
          const totalDuration =
            day.entries?.reduce(
              (sum, entry) => sum + parseFloat(entry.Durée || 0),
              0
            ) || 0;

          // Calculate remaining duration (out of 1)
          const remainingDuration = Math.max(0, 1 - totalDuration);

          // Show the remaining duration if there's any, otherwise show 0
          return [
            `day${i + 1}`,
            remainingDuration > 0
              ? remainingDuration.toString().replace(".", ",")
              : "0",
          ];
        })
      ),
    };
    tableData.push(absenceRow);

    return (
      <div className="cra-table">
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 1500 }}
          size="small"
          bordered
          rowClassName={(record) => {
            if (record.isClient) return "client-header";
            if (record.isProject) return "project-row";
            if (record.isTotal) return "total-row";
            if (record.isAbsence) return "absence-row";
            return "";
          }}
        />
      </div>
    );
  };  // Main content based on current page
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            Chargement de votre espace commercial...
          </div>
        </div>
      );
    }

    // Lazy load the ExpenseReportsValidation component
    const ExpenseReportsValidation = lazy(() => import("../components/commercial-interface/ExpenseReportsValidation"));

    switch (currentPage) {
      case "dashboard":
        return renderDashboard();
      case "consultants":
        return renderConsultants();
      case "expense-reports":
        return (
          <Suspense fallback={
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                Chargement des notes de frais...
              </div>
            </div>
          }>
            <ExpenseReportsValidation />
          </Suspense>
        );
      default:
        return renderDashboard();
    }
  };
  // Define menu items
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Tableau de bord",
    },
    {
      key: "consultants",
      icon: <UserOutlined />,
      label: "Consultants",
    },
    {
      key: "expense-reports",
      icon: <FileTextOutlined />,
      label: "Notes de frais",
    },
  ];

  // Handle menu selection
  const handleMenuClick = (e) => {
    setCurrentPage(e.key);
    navigate(`/interface-commercial/${e.key === "dashboard" ? "" : e.key}`);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Submission Modal for Individual Contracts */}
      <Modal
        title={`Envoyer CRA pour validation - Contrat ${selectedContractId}`}
        open={submissionModalVisible}
        onOk={submitCraForValidation}
        onCancel={() => {
          setSubmissionModalVisible(false);
          setSelectedContractId(null);
          setCraEntriesToSubmit([]);
        }}
        confirmLoading={submitting}
        okText="Envoyer"
        cancelText="Annuler"
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Soumission CRA"
            description="Vous allez soumettre ce CRA au prestataire pour validation. Le statut passera à 'En attente validation prestataire'."
            type="info"
            showIcon
          />
        </div>

        {craEntriesToSubmit.length > 0 && (
          <div>
            <Title level={5}>Entrées à soumettre:</Title>
            <List
              size="small"
              dataSource={craEntriesToSubmit}
              renderItem={(entry, index) => (
                <List.Item>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Tag color="blue">{entry.clientName}</Tag>
                      <span>{entry.projectName}</span>
                      <Tag>{entry.Durée} jour(s)</Tag>
                      <span>Jour {entry.jour}</span>
                      {entry.commentaire && (
                        <Tooltip title={entry.commentaire}>
                          <CommentOutlined style={{ color: "#1890ff" }} />
                        </Tooltip>
                      )}
                    </Space>
                    <Switch
                      checked={entry.selected}
                      onChange={(checked) => {
                        const updated = [...craEntriesToSubmit];
                        updated[index].selected = checked;
                        setCraEntriesToSubmit(updated);
                      }}
                    />
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.09)",
          zIndex: 999,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
        width={250}
      >
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "0" : "0 16px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {!collapsed && (
            <Title level={4} style={{ margin: 0 }}>
              Maghreb IT Connect
            </Title>
          )}
        </div>

        <div style={{ padding: collapsed ? "16px 0" : "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "16px",
              padding: "16px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Avatar
              size={collapsed ? 40 : 64}
              icon={<UserOutlined />}
              src={null}
              style={{
                backgroundColor: "#1890ff",
                marginBottom: collapsed ? "8px" : "16px",
              }}
            />
            {!collapsed && (
              <>
                <Text
                  strong
                  style={{ textAlign: "center", marginBottom: "4px" }}
                >
                  {userData?.Nom || ""} {userData?.Prenom || ""}
                </Text>
                <Tag color="blue">{userData?.Poste || "Commercial"}</Tag>
              </>
            )}
          </div>
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />

        {!collapsed && (
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid #f0f0f0",
              position: "absolute",
              bottom: "48px",
              width: "100%",
            }}
          >
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
            >
              Déconnexion
            </Button>
          </div>
        )}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 998,
            width: "100%",
          }}
        >
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>Commercial</Breadcrumb.Item>
            <Breadcrumb.Item>
              {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
            </Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: "flex", alignItems: "center" }}>
            <Dropdown
              overlay={userMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  src={null}
                  style={{ marginRight: 8, backgroundColor: "#1890ff" }}
                />
                <span style={{ marginRight: 8 }}>
                  {userData
                    ? `${userData.Nom} ${userData.Prenom}`
                    : "Commercial"}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{ padding: "24px", background: "#f5f5f5", minHeight: 280 }}
        >
          {renderContent()}
        </Content>

        <Footer style={{ textAlign: "center", padding: "12px 50px" }}>
          Maghreb IT Connect ©{new Date().getFullYear()} - Espace Commercial
        </Footer>
      </Layout>
      {/* CRA Modal */}
      <Modal
        styles={{}}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "20px 0px",
              overflow: "hidden",
            }}
          >
            <div>
              CRA - {selectedConsultant?.Prenom} {selectedConsultant?.Nom} -{" "}
              {selectedMonth.format("MMMM YYYY")}
            </div>              <Space>
              <Button
                icon={<LeftOutlined />}
                onClick={() => {
                  const newDate = selectedMonth.clone().subtract(1, "month");
                  setSelectedMonth(newDate);
                  fetchConsultantCra(selectedConsultant, newDate);
                }}
              />
              <input
                type="month"
                value={selectedMonth.format("YYYY-MM")}
                onChange={(e) => {
                  const newDate = moment(e.target.value);
                  if (newDate.isValid()) {
                    setSelectedMonth(newDate);
                    fetchConsultantCra(selectedConsultant, newDate);
                  }
                }}
                style={{
                  padding: "4px 11px",
                  borderRadius: "2px",
                  border: "1px solid #d9d9d9",
                  lineHeight: "1.5715",
                }}
              />
              <Button
                icon={<RightOutlined />}
                onClick={() => {
                  const newDate = selectedMonth.clone().add(1, "month");
                  setSelectedMonth(newDate);
                  fetchConsultantCra(selectedConsultant, newDate);
                }}
              />
            </Space>
          </div>
        }
        open={consultantCraVisible}
        onCancel={() => {
          setConsultantCraVisible(false);
          setSelectedConsultant(null);
          setCraData(null);
        }}
        width="95%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setConsultantCraVisible(false)}>
            Fermer
          </Button>,
        ]}
      >
        {craLoading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Chargement du CRA...</div>
          </div>
        ) : (
          <div>
            {/* Controls */}
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <span>Jours fériés:</span>
                <Switch
                  checked={showHolidays}
                  onChange={setShowHolidays}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
                <Button onClick={toggleCountry} size="small">
                  {selectedCountry === "FR" ? "🇫🇷 France" : "🇲🇦 Maroc"}
                </Button>
              </Space>
            </div>

            {/* Statistics */}
            {/* <Row gutter={16} style={{ marginBottom: 16 }}>
              <div className="flex row items-center justify-between">
                <div className="flex row items-center">
                  <div className="px-3">Jours Travaillés:</div>
                  <div className="font-bold">{craData?.totalDays || 0}</div>
                </div>
                <div className="flex row items-center px-5">
                  <div>Jours Ouvrables:</div>
                  <div className="px-3 font-bold">
                    {craData?.potentialWorkDays || 0}
                  </div>
                </div>
              </div>
            </Row> */}

            {/* CRA Table */}
            {renderCraTable()}
          </div>
        )}
      </Modal>
      {/* Validation Modal */}
      <Modal
        title="Valider et Envoyer au Client"
        open={validationModalVisible}
        onOk={validateAndSendToClient}
        onCancel={() => {
          setValidationModalVisible(false);
          setSelectedEntries([]);
        }}
        confirmLoading={validationLoading}
        okText="Valider"
        cancelText="Annuler"
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Validation CRA"
            // description={`Vous allez valider ${selectedEntries.length} entrée(s) et les envoyer au client. Cette action changera le statut des entrées vers "EVC" (En Validation Client).`}
            type="info"
            showIcon
          />
        </div>

        {selectedEntries.length > 0 && (
          <div>
            <Title level={5}>Entrées à valider:</Title>
            <List
              size="small"
              dataSource={selectedEntries}
              renderItem={(entry) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{entry.clientName}</Tag>
                    <span>{entry.projectName}</span>
                    <Tag>{entry.Durée} jour(s)</Tag>
                    <span>Jour {entry.jour}</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}      </Modal>
      {/* Cancel Modal */}
      <Modal
        title="Annuler le CRA"
        open={cancelModalVisible}
        onOk={handleCancelCRA}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelComment('');
          setSelectedCancelContract(null);
        }}
        confirmLoading={cancelLoading}
        okText="Confirmer l'annulation"
        cancelText="Retour"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Annulation de CRA"
            description={`Vous allez annuler ce CRA. Le statut passera de "${selectedCancelContract?.statut || ''}" à "annule".`}
            type="warning"
            showIcon
          />
        </div>

        <Form layout="vertical">
          <Form.Item 
            label="Motif d'annulation" 
            required 
            tooltip="Cette information sera enregistrée avec l'annulation"
          >
            <Input.TextArea
              rows={4}
              placeholder="Veuillez saisir la raison de l'annulation"
              value={cancelComment}
              onChange={(e) => setCancelComment(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default InterfaceCommercial;
