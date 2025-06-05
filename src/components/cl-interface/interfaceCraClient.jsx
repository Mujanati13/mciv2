import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  message,
  Modal,
  Row,
  Col,
  Typography,
  Spin,
  Switch,
} from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  TableOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import moment from "moment";

const { Option } = Select;
const { Text, Title } = Typography;

// Custom Calendar Component with French localization
const CustomCalendar = ({ selectedPeriod, craWorkDays, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(moment());

  // Set moment locale to French
  useEffect(() => {
    moment.locale("fr");
    if (selectedPeriod) {
      const [month, year] = selectedPeriod.split("_");
      setCurrentDate(moment(`${year}-${month}-01`));
    }
  }, [selectedPeriod]);

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.clone().startOf("month");
    const endOfMonth = currentDate.clone().endOf("month");
    const startDate = startOfMonth.clone().startOf("week");
    const endDate = endOfMonth.clone().endOf("week");

    const days = [];
    const day = startDate.clone();

    while (day.isSameOrBefore(endDate)) {
      days.push(day.clone());
      day.add(1, "day");
    }

    return days;
  };

  const getWorkDataForDay = (day) => {
    const dayNum = day.date();
    const monthNum = day.month() + 1;
    const yearNum = day.year();

    if (selectedPeriod) {
      const [periodMonth, periodYear] = selectedPeriod.split("_");
      if (
        parseInt(periodMonth) !== monthNum ||
        parseInt(periodYear) !== yearNum
      ) {
        return [];
      }
    }

    return craWorkDays.filter((item) => {
      const itemDay = parseInt(item.jour);
      return itemDay === dayNum;
    });
  };

  const renderDay = (day) => {
    const isCurrentMonth = day.month() === currentDate.month();
    const dayData = getWorkDataForDay(day);
    const hasWork = dayData.length > 0;
    const isToday = day.isSame(moment(), "day");

    const totalHours = dayData.reduce(
      (sum, item) => sum + parseFloat(item.Durée || 0),
      0
    );

    const totalAmount = dayData.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.Durée || 0) * parseFloat(item.candidature?.tjm || 0),
      0
    );

    const hasWorkType = dayData.some(
      (item) => (item.type || "travail") === "travail"
    );

    return (
      <div
        key={day.format("YYYY-MM-DD")}
        className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${
          hasWork ? "has-work" : ""
        } ${isToday ? "today" : ""}`}
        onClick={() => onDateClick && onDateClick(day, dayData)}
        style={{
          border: "1px solid #f0f0f0",
          minHeight: "80px",
          padding: "4px",
          cursor: hasWork ? "pointer" : "default",
          backgroundColor: !isCurrentMonth
            ? "#fafafa"
            : isToday
            ? "#e6f7ff"
            : hasWork
            ? "#f6ffed"
            : "white",
          position: "relative",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (hasWork) {
            e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = "none";
        }}
      >
        {/* Day number */}
        <div
          style={{
            fontWeight: isToday ? "bold" : "normal",
            color: !isCurrentMonth ? "#ccc" : isToday ? "#1890ff" : "#333",
            marginBottom: "2px",
            fontSize: "12px",
          }}
        >
          {day.format("D")}
        </div>

        {/* Work indicator */}
        {hasWork && hasWorkType && (
          <div
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "#52c41a",
              color: "white",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "bold",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            ✓
          </div>
        )}

        {/* Work details */}
        {hasWork && (
          <div style={{ fontSize: "10px" }}>
            <div
              style={{
                background: "#1890ff",
                color: "white",
                padding: "1px 3px",
                borderRadius: "2px",
                marginBottom: "1px",
                textAlign: "center",
                fontSize: "9px",
              }}
            >
              {totalHours}j
            </div>

            {dayData.slice(0, 2).map((item, index) => (
              <div
                key={index}
                style={{
                  background: item.type === "congé" ? "#ffccc7" : "#e6f7ff",
                  padding: "1px 2px",
                  borderRadius: "2px",
                  marginBottom: "1px",
                  fontSize: "8px",
                  textAlign: "center",
                }}
              >
                {item.type === "congé" ? "Congé" : "Travail"}
              </div>
            ))}

            {dayData.length > 2 && (
              <div
                style={{
                  fontSize: "7px",
                  color: "#666",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                +{dayData.length - 2} autres
              </div>
            )}

            <div
              style={{
                background: "#f6ffed",
                color: "#52c41a",
                padding: "1px 2px",
                borderRadius: "2px",
                fontSize: "8px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {totalAmount.toFixed(0)}€
            </div>
          </div>
        )}
      </div>
    );
  };

  const days = getDaysInMonth();

  // French month names
  const getMonthYearText = () => {
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    const month = currentDate.month();
    const year = currentDate.year();

    return `${monthNames[month]} ${year}`;
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Calendar Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px",
          background: "#fafafa",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Button
          icon={<LeftOutlined />}
          onClick={() =>
            setCurrentDate(currentDate.clone().subtract(1, "month"))
          }
          size="small"
          style={{ borderRadius: "4px" }}
          title="Mois précédent"
        />
        <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
          {getMonthYearText()}
        </Title>
        <Button
          icon={<RightOutlined />}
          onClick={() => setCurrentDate(currentDate.clone().add(1, "month"))}
          size="small"
          style={{ borderRadius: "4px" }}
          title="Mois suivant"
        />
      </div>

      {/* Days of week header - French */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {[
          "Dimanche",
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
        ].map((day) => (
          <div
            key={day}
            style={{
              padding: "8px 4px",
              textAlign: "center",
              fontWeight: "bold",
              background: "#f5f5f5",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "12px",
              color: "#666",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {days.map(renderDay)}
      </div>

      {/* Legend */}
      <div
        style={{
          padding: "12px 16px",
          background: "#fafafa",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "11px",
        }}
      ></div>
    </div>
  );
};

const InterfaceCraClient = () => {
  const [form] = Form.useForm();
  const [craData, setCraData] = useState([]);
  const [filteredCraData, setFilteredCraData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [clientInfo, setClientInfo] = useState(null);
  const [consultantSearch, setConsultantSearch] = useState("");

  // CRA tracking modal states
  const [craModalVisible, setCraModalVisible] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedBdc, setSelectedBdc] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [craWorkDays, setCraWorkDays] = useState([]);
  const [craModalLoading, setCraModalLoading] = useState(false);
  const [selectedCraRecord, setSelectedCraRecord] = useState(null);

  // Validation states
  const [validationNote, setValidationNote] = useState("");
  const [validationLoading, setValidationLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  // View mode for modal (table or calendar)
  const [viewMode, setViewMode] = useState("table");
  const statusOptions = [
    { value: "EVC", color: "orange", label: "En attente validation client" },
    { value: "EVP", color: "blue", label: "En attente validation prestataire" },
    { value: "Annulé", color: "magenta", label: "Annulé" },
    { value: "saisi", color: "yellow", label: "Saisi" },
    { value: "Validé", color: "green", label: "Validé" },
  ];

  const getDisplayStatus = (status) => {
    const statusMap = {
      evc: "En attente validation client",
      evp: "En attente validation prestataire",
      annulé: "Annulé",
      annule: "Annulé",
      validé: "Validé",
      saisi: "Saisi",
    };
    return statusMap[status?.toLowerCase()] || status;
  };
  useEffect(() => {
    const currentPeriod = moment().format("MM_YYYY");
    console.log("Initial load - current period:", currentPeriod); // Debug log
    fetchCraData({ period: currentPeriod });
  }, []);

  // Filter data based on consultant search
  useEffect(() => {
    if (!consultantSearch.trim()) {
      setFilteredCraData(craData);
    } else {
      const filtered = craData.filter((item) =>
        item.consultant_name
          ?.toLowerCase()
          .includes(consultantSearch.toLowerCase())
      );
      setFilteredCraData(filtered);
    }
  }, [consultantSearch, craData]);
  const fetchCraData = async (values) => {
    const clientId = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!clientId) {
      message.error("ID client non trouvé");
      return;
    }

    setLoading(true);

    try {
      const currentPeriod = moment().format("MM_YYYY");
      const params = {
        client_id: clientId,
        period: values.period || currentPeriod,
      }; // Add status filter if provided
      if (values.status) {
        params.status = values.status;
      }

      console.log("Fetching CRA data with params:", params); // Debug log
      console.log(
        "Using endpoint:",
        `${Endponit()}/api/cra-consultants/client/`
      ); // Debug log

      const response = await axios.get(
        `${Endponit()}/api/cra-consultants/client/`,
        {
          params: params,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data?.status) {
        const rawData = response.data.data || [];
        console.log("Raw API data received:", rawData); // Debug log
        setClientInfo(response.data.client || null);
        const groupedData = groupConsultantsByBdc(rawData);
        console.log("Grouped data after processing:", groupedData); // Debug log
        setCraData(groupedData);
        setFilteredCraData(groupedData);
        setTotal(groupedData.length);

        // Show success message with count
        if (groupedData.length > 0) {
          message.success(`${groupedData.length} CRA trouvé(s)`);
        } else {
          message.info("Aucun CRA trouvé pour cette période");
        }
      } else {
        message.error(
          response.data.message || "Échec de récupération des données CRA"
        );
        setCraData([]);
        setFilteredCraData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching CRA data:", error); // Debug log
      message.error(
        `Erreur: ${error.response?.data?.message || error.message}`
      );
      setCraData([]);
      setFilteredCraData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkValidation = async (approved) => {
    setValidationLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      const token = localStorage.getItem("token");

      if (!clientId || !selectedCraRecord) {
        message.error("Information de connexion ou CRA non trouvée");
        return;
      }

      const craId = selectedCraRecord.id_CRA;

      if (!craId) {
        message.error("ID CRA non trouvé");
        console.error("CRA ID not found in:", selectedCraRecord);
        return;
      }

      const response = await axios.put(
        `${Endponit()}/api/cra_consultant/${craId}/`,
        {
          statut: approved ? "Validé" : "EVP",
          commentaire: approved
            ? `CRA validé par le client - ${formatPeriod(selectedPeriod)}`
            : validationNote ||
              `CRA refusé par le client - ${formatPeriod(selectedPeriod)}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status) {
        message.success(
          approved
            ? "CRA validé avec succès"
            : "CRA refusé et renvoyé au prestataire"
        );

        await fetchCraWorkDays(
          selectedConsultant.id,
          selectedBdc.id,
          selectedPeriod
        );
        fetchCraData({ period: selectedPeriod });
        setValidationNote("");
      } else {
        message.error("Échec de mise à jour du statut CRA");
      }
    } catch (error) {
      console.error("Erreur lors de la validation CRA:", error);
      message.error(
        "Impossible de valider le CRA: " +
          (error.response?.data?.message || error.message || "Erreur inconnue")
      );
    } finally {
      setValidationLoading(false);
    }
  };
  const groupConsultantsByBdc = (data) => {
    const groups = {};

    data.forEach((item) => {
      const key = `${item.id_consultan}_${item.id_bdc}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          id_CRA: item.id_CRA,
          id_consultan: item.id_consultan,
          id_bdc: item.id_bdc,
          id_esn: item.id_esn,
          id_client: item.id_client,
          période: item.période,
          consultant_name: item.consultant_name,
          consultant_email: item.consultant_email,
          consultant_position: item.consultant_position,
          esn_name: item.esn_name,
          esn_contact: item.esn_contact,
          project_title: item.appel_offre_titre, // Use appel_offre_titre from API
          appel_offre_description: item.appel_offre_description,
          appel_offre_profil: item.appel_offre_profil,
          appel_offre_date_debut: item.appel_offre_date_debut,
          appel_offre_jours: item.appel_offre_jours,
          n_jour: item.n_jour,
          commentaire: item.commentaire,
          statut: item.statut,
          total_days: item.n_jour || 0, // Use n_jour as total_days
          work_days: [], // Initialize empty, will be populated by detailed API call if needed
          statuses: new Set([item.statut]),
          status: item.statut,
          cra_status: item.statut,
        };
      } else {
        // If the key already exists, update the total days
        groups[key].total_days += parseInt(item.n_jour || 0);
        groups[key].statuses.add(item.statut);
      }
    });

    return Object.values(groups).map((group) => ({
      ...group,
      total_entries: 1, // Each record represents one CRA summary
    }));
  };

  const fetchCraWorkDays = async (consultantId, bdcId, period) => {
    setCraModalLoading(true);
    try {
      const clientId = localStorage.getItem("id");
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${Endponit()}/api/cra-by-client-period/`,
        {
          params: { client_id: clientId, period: period },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.status) {
        const filteredData = response.data.data.filter(
          (item) => item.id_consultan === consultantId && item.id_bdc === bdcId
        );
        setCraWorkDays(filteredData);
      } else {
        message.error("Échec de récupération des jours de travail CRA");
        setCraWorkDays([]);
      }
    } catch (error) {
      message.error(
        `Erreur lors de la récupération des jours de travail CRA: ${error.message}`
      );
      setCraWorkDays([]);
    } finally {
      setCraModalLoading(false);
    }
  };
  const handleCraClick = (record) => {
    const consultantId = record.id_consultan;
    const bdcId = record.id_bdc;
    const period = record.période;

    setSelectedCraRecord(record);

    setSelectedConsultant({
      id: consultantId,
      name: record.consultant_name,
      email: record.consultant_email, // Use consultant_email from the new API
      period: period,
    });    setSelectedBdc({
      id: bdcId,
      project: record.project_title || `BDC ${bdcId}`,
      description: record.appel_offre_description, // Use appel_offre_description from the new API
      tjm: record.tjm || record.candidature?.tjm || '0' // Store TJM for display
    });
    setSelectedPeriod(period);
    setCraModalVisible(true);
    fetchCraWorkDays(consultantId, bdcId, period);
  };
  const handleSearch = (values) => {
    fetchCraData(values);
  };
  // Handle period change with auto-refresh
  const handlePeriodChange = (event) => {
    const value = event.target.value;
    if (value) {
      const [year, month] = value.split("-");
      const periodValue = `${month}_${year}`;

      // Update form field
      form.setFieldsValue({ period: periodValue });

      // Get current form values for other fields
      const currentValues = form.getFieldsValue();

      // Automatically fetch data with new period
      fetchCraData({
        period: periodValue,
        status: currentValues.status,
      });
    }
  };

  // Handle status change with auto-refresh
  const handleStatusChange = (statusValue) => {
    // Get current form values
    const currentValues = form.getFieldsValue();

    // Automatically fetch data with new status
    fetchCraData({
      period: currentValues.period,
      status: statusValue,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setConsultantSearch("");

    const currentPeriod = moment().format("MM_YYYY");

    // Reset form fields to current month
    form.setFieldsValue({
      period: currentPeriod,
      status: null,
      consultantSearch: "",
    });

    fetchCraData({ period: currentPeriod });
  };
  const getStatusColor = (status) => {
    // First check for exact match with status options
    let statusOption = statusOptions.find((opt) => opt.value === status);

    // If no exact match, try to find by display status
    if (!statusOption) {
      const displayStatus = getDisplayStatus(status);
      statusOption = statusOptions.find((opt) => opt.label === displayStatus);
    }

    return statusOption ? statusOption.color : "default";
  };

  const formatPeriod = (period) => {
    if (!period) return "";
    const [month, year] = period.split("_");
    if (!month || !year) return period;
    return moment(`${year}-${month}-01`).format("MMMM YYYY");
  };

  const handleCalendarDateClick = (day, dayData) => {
    if (dayData.length > 0) {
      Modal.info({
        title: `Détails du ${day.format("DD/MM/YYYY")}`,
        content: (
          <div>
            {dayData.map((item, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#f5f5f5",
                  borderRadius: "6px",
                  border: "1px solid #e8e8e8",
                }}
              >
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Projet:</Text>
                    <br />
                    <Text>{item.project?.titre || `BDC ${item.id_bdc}`}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Type:</Text>
                    <br />
                    <Tag color={item.type === "congé" ? "orange" : "green"}>
                      {item.type === "congé" ? "Congé" : "Travail"}
                    </Tag>
                  </Col>
                  <Col span={8}>
                    <Text strong>Durée:</Text>
                    <br />
                    <Tag color="blue">{item.Durée}j</Tag>
                  </Col>
                  <Col span={8}>
                    <Text strong>TJM:</Text>
                    <br />
                    <Tag color="purple">{item.candidature?.tjm}€</Tag>
                  </Col>
                  <Col span={8}>
                    <Text strong>Montant:</Text>
                    <br />
                    <Tag color="orange">
                      {(
                        parseFloat(item.Durée) *
                        parseFloat(item.candidature?.tjm)
                      ).toFixed(2)}
                      €
                    </Tag>
                  </Col>
                </Row>
              </div>
            ))}
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#e6f7ff",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <Text strong>Total du jour: </Text>
              <Tag color="green">
                {dayData.reduce(
                  (sum, item) => sum + parseFloat(item.Durée || 0),
                  0
                )}
                j
              </Tag>
              <Text strong> - Montant: </Text>
              <Tag color="orange">
                {dayData
                  .reduce(
                    (sum, item) =>
                      sum +
                      parseFloat(item.Durée || 0) *
                        parseFloat(item.candidature?.tjm || 0),
                    0
                  )
                  .toFixed(2)}
                €
              </Tag>
            </div>
          </div>
        ),
        width: 700,
        okText: "Fermer",
      });
    }
  };

  const craWorkDaysColumns = [
    {
      title: "Date",
      key: "date",
      render: (record) => {
        const periode = record.période || "";
        const jour = parseInt(record.jour || "1");
        const [month, year] = periode.split("_");

        if (jour && month && year) {
          return `${jour.toString().padStart(2, "0")}/${month.padStart(
            2,
            "0"
          )}/${year}`;
        }
        return "-";
      },
      sorter: (a, b) => {
        const jourA = parseInt(a.jour || "1");
        const jourB = parseInt(b.jour || "1");
        return jourA - jourB;
      },
    },
    {
      title: "Durée (j)",
      dataIndex: "Durée",
      key: "duration",
      render: (text) => <Tag color="blue">{text || "0"}</Tag>,
      sorter: (a, b) => (parseFloat(a.Durée) || 0) - (parseFloat(b.Durée) || 0),    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text) => {
        const type = text || "travail";
        const typeColor =
          type === "travail"
            ? "green"
            : type === "congé"
            ? "orange"
            : "default";
        return (
          <Tag color={typeColor}>{type === "congé" ? "Congé" : "Travail"}</Tag>
        );
      },
    },
    {
      title: "Montant",
      key: "amount",
      render: (record) => {
        const amount =
          (parseFloat(record.Durée) || 0) *
          (parseFloat(record.candidature?.tjm) || 0);
        return <Tag color="orange">{amount.toFixed(2)}€</Tag>;
      },
    },
  ];
  const columns = [
    {
      title: "Consultants",
      key: "consultant",
      render: (record) => (
        <div>
          <div>
            <strong>{record.consultant_name}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.consultant_email}
          </div>
        </div>
      ),
      sorter: (a, b) =>
        (a.consultant_name || "").localeCompare(b.consultant_name || ""),
    },
    {
      title: "Contrat",
      key: "project",
      render: (record) => (
        <div>
          <div>
            <strong>{record.project_title}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            ESN: {record.esn_name}
          </div>
        </div>
      ),
    },
    // {
    //   title: "Périodes",
    //   dataIndex: "période",
    //   key: "période",
    //   render: (text) => formatPeriod(text),
    // },
    // {
    //   title: "Jours travaillés",
    //   key: "total_days",
    //   render: (record) => (
    //     <Tag color="blue">{record.n_jour || record.total_days} jours</Tag>
    //   ),
    //   sorter: (a, b) => (parseInt(a.n_jour) || 0) - (parseInt(b.n_jour) || 0),
    // },
    {
      title: "Statut CRA",
      dataIndex: "statut",
      key: "statut",
      render: (status) => {
        const displayStatus = getDisplayStatus(status);
        return <Tag color={getStatusColor(displayStatus)}>{displayStatus}</Tag>;
      },
      // Remove table-level filtering since we handle it via form/API
      filteredValue: null,
      filterDropdown: () => null,
      filterIcon: () => null,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          size="small"
          onClick={() => handleCraClick(record)}
        >
          CRA
        </Button>
      ),
    },
  ];

  const closeModal = () => {
    setCraModalVisible(false);
    setSelectedConsultant(null);
    setSelectedBdc(null);
    setSelectedPeriod(null);
    setCraWorkDays([]);
    setValidationNote("");
    setSelectedCraRecord(null);
    setRejectModalVisible(false);
    setViewMode("table");
  };

  const hasEvcEntries =
    selectedCraRecord &&
    (selectedCraRecord.statut === "EVC" ||
      selectedCraRecord.cra_status === "EVC" ||
      selectedCraRecord.statut === "En attente validation client");

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <Card style={{ marginBottom: "20px" }}>
        {" "}
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{
            period: moment().format("MM_YYYY"),
            status: undefined,
            consultantSearch: "",
          }}
        >
          {" "}
          <Form.Item
            label="Période"
            name="period"
            rules={[{ required: true, message: "La période est requise" }]}
            getValueFromEvent={(e) => {
              const value = e.target.value;
              if (value) {
                const [year, month] = value.split("-");
                return `${month}_${year}`;
              }
              return value;
            }}
            getValueProps={(value) => {
              if (value) {
                const [month, year] = value.split("_");
                if (month && year) {
                  return { value: `${year}-${month.padStart(2, "0")}` };
                }
              }
              return { value: moment().format("YYYY-MM") };
            }}
          >
            {" "}
            <input
              type="month"
              style={{
                width: "180px",
                height: "32px",
                padding: "4px 11px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                fontSize: "14px",
                lineHeight: "1.5715",
                outline: "none",
                transition: "all 0.2s",
                backgroundColor: "#fff",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              }}
              onChange={handlePeriodChange}
              onFocus={(e) => {
                e.target.style.borderColor = "#40a9ff";
                e.target.style.boxShadow = "0 0 0 2px rgba(24, 144, 255, 0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d9d9d9";
                e.target.style.boxShadow = "none";
              }}
            />
          </Form.Item>
          <Form.Item label="Consultant" name="consultantSearch">
            <Input
              placeholder="Rechercher un consultant..."
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              value={consultantSearch}
              onChange={(e) => setConsultantSearch(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </Form.Item>{" "}
          <Form.Item label="Statut" name="status">
            <Select
              placeholder="Sélectionner un statut"
              style={{ width: 200 }}
              allowClear
              onChange={handleStatusChange}
            >
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
              >
                Rechercher
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                Réinitialiser
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            {/* <Col>
              <Text strong>
                Total: {filteredCraData.length} combinaisons consultant-projet
                {consultantSearch && (
                  <Text style={{ marginLeft: 8, color: '#666' }}>
                    (filtré par: "{consultantSearch}")
                  </Text>
                )}
              </Text>
            </Col> */}
            <Col>
              {clientInfo && (
                <Text style={{ color: "#666" }}>Client: {clientInfo.name}</Text>
              )}
            </Col>
          </Row>
        </div>
        <Table
          columns={columns}
          dataSource={filteredCraData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} combinaisons`,
          }}
          scroll={{ x: 1600 }}
          size="middle"
        />
      </Card>

      <Modal
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}          >
            <div>
              <CalendarOutlined style={{ marginRight: 8 }} />
              {selectedConsultant && selectedBdc
                ? `Détails CRA - ${formatPeriod(selectedPeriod)}`
                : "Jours de travail CRA"}
            </div>
            <Space>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <TableOutlined
                  style={{
                    marginRight: 8,
                    color: viewMode === "table" ? "#1890ff" : "#999",
                  }}
                />
                <Switch
                  checked={viewMode === "calendar"}
                  onChange={(checked) =>
                    setViewMode(checked ? "calendar" : "table")
                  }
                  size="small"
                />
                <CalendarOutlined
                  style={{
                    marginLeft: 8,
                    color: viewMode === "calendar" ? "#1890ff" : "#999",
                  }}
                />
              </div>

              {hasEvcEntries && (
                <Space>
                  <Button
                    type="primary"
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                    icon={<CheckOutlined />}
                    size="small"
                    loading={validationLoading}
                    onClick={() => {
                      Modal.confirm({
                        title: "Validation des CRA",
                        content: (
                          <div>
                            <p>
                              Êtes-vous sûr de vouloir valider tous les CRA pour
                              cette combinaison consultant-projet ?
                            </p>
                            <p>
                              Cette action validera {craWorkDays.length}{" "}
                              entrée(s).
                            </p>
                          </div>
                        ),
                        okText: "Valider",
                        cancelText: "Annuler",
                        onOk: () => handleBulkValidation(true),
                      });
                    }}
                  >
                    Valider
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    size="small"
                    loading={validationLoading}
                    onClick={() => {
                      setValidationNote("");
                      setRejectModalVisible(true);
                    }}
                  >
                    Refuser
                  </Button>
                </Space>
              )}
            </Space>
          </div>
        }
        open={craModalVisible}
        onCancel={closeModal}
        width={viewMode === "calendar" ? 1200 : 1300}
        footer={[
          <Button key="close" onClick={closeModal}>
            Fermer
          </Button>,
        ]}
      >
        {craModalLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              Chargement des jours de travail...
            </div>
          </div>        ) : (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              {selectedBdc && (
                <Card 
                  size="small" 
                  style={{ 
                    marginBottom: 16,
                    background: "#f6ffed",
                    borderColor: "#b7eb8f"
                  }}
                >
                  <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: '12px', color: '#666' }}>Projet:</Text>
                        <br />
                        <Text strong style={{ fontSize: '14px' }}>
                          {selectedBdc.project}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: '12px', color: '#666' }}>TJM:</Text>
                        <br />
                        <Tag color="purple" style={{ fontSize: '14px' }}>
                          {craWorkDays.length > 0 ? `${craWorkDays[0].candidature?.tjm || 0}€` : '0€'}
                        </Tag>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: '12px', color: '#666' }}>Consultant:</Text>
                        <br />
                        <Text style={{ fontSize: '14px' }}>
                          {selectedConsultant?.name}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: '12px', color: '#666' }}>Période:</Text>
                        <br />
                        <Text style={{ fontSize: '14px' }}>
                          {formatPeriod(selectedPeriod)}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}
              <Card size="small">
                {/* Summary Information */}

                {/* Conditional View Based on Mode */}
                {viewMode === "table" ? (
                  <Table
                    columns={craWorkDaysColumns}
                    dataSource={craWorkDays}
                    rowKey="id_imputation"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    locale={{
                      emptyText:
                        "Aucun jour de travail trouvé pour cette combinaison consultant-projet",
                    }}
                    summary={() => {
                      const totalDays = craWorkDays.reduce(
                        (sum, item) => sum + parseFloat(item.Durée || 0),
                        0
                      );
                      const totalAmount = craWorkDays.reduce(
                        (sum, item) =>
                          sum +
                          parseFloat(item.Durée || 0) *
                            parseFloat(item.candidature?.tjm || 0),
                        0
                      );

                      return (
                        <Table.Summary.Row
                          style={{ backgroundColor: "#fafafa" }}
                        >
                          <Table.Summary.Cell index={0}>
                            <strong>Total</strong>
                          </Table.Summary.Cell>                          <Table.Summary.Cell index={1}>
                            <Tag color="green">
                              <strong>{totalDays} jours</strong>
                            </Tag>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <Tag color="orange">
                              <strong>{totalAmount.toFixed(2)}€</strong>
                            </Tag>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                ) : (
                  <CustomCalendar
                    selectedPeriod={selectedPeriod}
                    craWorkDays={craWorkDays}
                    onDateClick={handleCalendarDateClick}
                  />
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Refuser les CRA"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setValidationNote("");
        }}
        onOk={() => {
          if (!validationNote.trim()) {
            message.error("Veuillez indiquer la raison du refus");
            return;
          }
          setRejectModalVisible(false);
          handleBulkValidation(false);
        }}
        okText="Refuser"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <div>
          <p>
            Êtes-vous sûr de vouloir refuser tous les CRA pour cette combinaison
            consultant-projet ?
          </p>
          <p>Cette action refusera {craWorkDays.length} entrée(s).</p>
          <Input.TextArea
            placeholder="Veuillez indiquer la raison du refus"
            rows={4}
            value={validationNote}
            onChange={(e) => setValidationNote(e.target.value)}
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default InterfaceCraClient;
