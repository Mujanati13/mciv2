import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Table,
  Row,
  Col,
  DatePicker,
  Button,
  Tag,
  Spin,
  Divider,
  Checkbox,
  Space,
  Modal,
  Form,
  Select,
  message,
  Empty,
  Input,
  Drawer,
  List,
  Tooltip,
  Alert,
  Switch,
} from "antd";
import {
  CheckOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import moment from "moment";
import axios from "axios";
import { Endponit } from "../../helper/enpoint";
import { useNavigate } from "react-router-dom";
import "moment/locale/fr";
import "./MonthlyActivityReport.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { MonthPicker } = DatePicker;
const { TextArea } = Input;

const MonthlyActivityReport = () => {
  const navigate = useNavigate();

  // Current date reference - using the current date instead of hardcoding future dates
  const currentDate = moment();
  // Get saved date from localStorage or use current date
  const getSavedMonth = () => {
    try {
      const savedMonthString = localStorage.getItem("selectedMonthCRA");
      if (savedMonthString) {
        const savedDate = moment(savedMonthString);
        // Validate that the parsed date is valid
        if (savedDate.isValid()) {
          return savedDate;
        }
      }
    } catch (error) {
      console.error("Error parsing saved month:", error);
    }
    return currentDate;
  };
  // State variables
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getSavedMonth());
  const [craData, setCraData] = useState(null);
  const [consultantName, setConsultantName] = useState("");
  const [consultantProfile, setConsultantProfile] = useState(null);
  const [frenchHolidays, setFrenchHolidays] = useState([]);
  const [moroccanHolidays, setMoroccanHolidays] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("FR"); // Default to France
  const [showHolidays, setShowHolidays] = useState(true); // State to toggle holidays display
  const [craEntriesToSubmit, setCraEntriesToSubmit] = useState([]);
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  // Project-related state
  const [projects, setProjects] = useState([]);
  const [projectsById, setProjectsById] = useState({});
  const [clientsById, setClientsById] = useState({});
  const [originalImputationData, setOriginalImputationData] = useState([]);
  // CRA entry state
  const [craEntryModalVisible, setCraEntryModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [craForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [dayEntries, setDayEntries] = useState([]);
  const [selectedCraEntry, setSelectedCraEntry] = useState(null);
  const [editForm] = Form.useForm();
  const [submissionForm] = Form.useForm();
  // Add this with other state declarations at the top
  const [contractStatuses, setContractStatuses] = useState({});

  // Add this function to fetch contract statuses
  const fetchContractStatuses = async (date) => {
    try {
      const consultantId = localStorage.getItem("userId");
      if (!consultantId) return;

      const period = date.format("MM_YYYY");

      const response = await axios.get(`${Endponit()}/api/cra_consultant/`, {
        params: {
          consultant_id: consultantId,
          period: period,
        },
      });

      if (response.data?.status && response.data.data?.length > 0) {
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

  // CRA status constants and state
  const CRA_STATUS = {
    A_SAISIR: "À saisir",
    EN_ATTENTE_PRESTATAIRE: "En attente validation prestataire",
    EN_ATTENTE_CLIENT: "En attente validation client",
    VALIDE: "Validé",
  };
  const [monthlyStatus, setMonthlyStatus] = useState(CRA_STATUS.A_SAISIR);
  useEffect(() => {
    fetchConsultantInfo();
    fetchProjects();
    fetchMonthlyReport(selectedMonth);
  }, []);

  // Fetch holidays when the selected month changes
  useEffect(() => {
    fetchHolidays(selectedMonth);
    fetchMonthlyReport(selectedMonth);
    fetchContractStatuses(selectedMonth); // Add this line
  }, [selectedMonth]);

  // State to track collapsed client groups
  const [collapsedGroups, setCollapsedGroups] = useState({});
  // Function to toggle collapse state of a client group
  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Function to toggle all groups at once
  const toggleAllGroups = (collapsed = false) => {
    if (!craData) return;

    const clientGroups = {};

    if (craData.clientWork.length > 0) {
      craData.clientWork.forEach((client) => {
        const clientId = client.clientId;
        if (!clientGroups[clientId]) {
          clientGroups[clientId] = true;
        }
      });
    }

    // Set all groups to the specified collapsed state
    const newCollapsedState = {};
    Object.keys(clientGroups).forEach((key, index) => {
      newCollapsedState[index] = collapsed;
    });

    setCollapsedGroups(newCollapsedState);
  };

  // Function to count visible client groups after filtering
  const countVisibleClientGroups = () => {
    if (!clientFilter || !craData) return null;

    // Get all client groups
    const clientGroups = {};

    if (craData.clientWork.length > 0) {
      craData.clientWork.forEach((client) => {
        const clientId = client.clientId;
        if (!clientGroups[clientId]) {
          clientGroups[clientId] = { name: client.clientName };
        }
      });
    }

    // Count how many match the filter
    const matchingGroups = Object.values(clientGroups).filter((group) =>
      group.name.toLowerCase().includes(clientFilter.toLowerCase())
    ).length;

    return {
      total: Object.keys(clientGroups).length,
      matching: matchingGroups,
    };
  };

  // State for client filter
  const [clientFilter, setClientFilter] = useState("");

  // Effect to reprocess the data when holiday visibility is toggled
  useEffect(() => {
    if (craData && craData.days) {
      // Re-apply the holiday data when showHolidays changes
      if (selectedCountry === "FR") {
        const updatedDays = updateDaysWithHolidays(
          craData.days,
          frenchHolidays
        );
        updateCraDataWithHolidays(updatedDays);
      } else {
        const updatedDays = updateDaysWithHolidays(
          craData.days,
          moroccanHolidays
        );
        updateCraDataWithHolidays(updatedDays);
      }
    }
  }, [showHolidays]);
  // Function to fetch holidays from Nager.Date API
  const fetchHolidays = async (date) => {
    try {
      const year = date.year();
      const countryCodeFR = "FR"; // France
      const countryCodeMA = "MA"; // Morocco

      // Fetch French holidays
      const frenchResponse = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCodeFR}`
      );

      // Fetch Moroccan holidays
      const moroccanResponse = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCodeMA}`
      );

      // Process holidays for the selected month
      const month = date.month() + 1; // Month is 0-indexed in moment

      const filteredFrenchHolidays = frenchResponse.data
        .filter((holiday) => {
          const holidayDate = moment(holiday.date);
          return holidayDate.month() + 1 === month;
        })
        .map((holiday) => ({
          day: moment(holiday.date).date(),
          name: holiday.name,
          localName: holiday.localName,
          countryCode: holiday.countryCode,
        }));

      const filteredMoroccanHolidays = moroccanResponse.data
        .filter((holiday) => {
          const holidayDate = moment(holiday.date);
          return holidayDate.month() + 1 === month;
        })
        .map((holiday) => ({
          day: moment(holiday.date).date(),
          name: holiday.name,
          localName: holiday.localName,
          countryCode: holiday.countryCode,
        }));

      setFrenchHolidays(filteredFrenchHolidays);
      setMoroccanHolidays(filteredMoroccanHolidays);

      // If we already have CRA data, update it with the new holiday information
      if (craData && craData.days) {
        const holidays =
          selectedCountry === "FR"
            ? filteredFrenchHolidays
            : filteredMoroccanHolidays;
        const updatedDays = updateDaysWithHolidays(craData.days, holidays);

        updateCraDataWithHolidays(updatedDays);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      message.error("Impossible de charger les jours fériés");
    }
  };
  // Update days data with holiday information
  const updateDaysWithHolidays = (days, holidays) => {
    return days.map((day) => {
      // Only check for holidays if showHolidays is true
      if (showHolidays) {
        const isHoliday = holidays.some((holiday) => holiday.day === day.day);
        const holiday = holidays.find((h) => h.day === day.day);

        // Only mark as holiday if not already marked by user inputted data
        if (isHoliday && !day.isHoliday) {
          return {
            ...day,
            isHoliday: true,
            holidayName: holiday?.localName || holiday?.name,
          };
        }
      } else if (day.isHoliday && day.holidayName) {
        // Remove holiday flag if holidays are turned off
        return {
          ...day,
          isHoliday: false,
          holidayName: undefined,
        };
      }
      return day;
    });
  };
  // Function to update CRA data with the updated days after applying holiday flags
  const updateCraDataWithHolidays = (updatedDays) => {
    if (!craData) return;

    // Recalculate potential workdays excluding weekends and holidays
    const potentialWorkDays = updatedDays.filter(
      (day) => !day.isWeekend && !day.isHoliday
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

    // Update CRA data with holidays from the selected country
    if (craData && craData.days) {
      const holidays = newCountry === "FR" ? frenchHolidays : moroccanHolidays;
      const updatedDays = updateDaysWithHolidays(craData.days, holidays);

      updateCraDataWithHolidays(updatedDays);
    }
  };
  // Add new function to fetch CRA status for the period
  const fetchCraStatus = async (date) => {
    try {
      const consultantId = localStorage.getItem("userId");

      if (!consultantId) {
        console.error("Consultant ID not found");
        return;
      }

      // Format period as MM_YYYY
      const period = date.format("MM_YYYY");

      // Use the CRA consultant API to get status
      const response = await axios.get(`${Endponit()}/api/cra_consultant/`, {
        params: {
          consultant_id: consultantId,
          period: period,
        },
      });

      if (response.data?.status && response.data.data?.length > 0) {
        // Get the CRA record for this period
        const craRecord = response.data.data[0];

        // Map API status to our internal status constants
        const statusMapping = {
          saisi: CRA_STATUS.A_SAISIR,
          en_attente_prestataire: CRA_STATUS.EN_ATTENTE_PRESTATAIRE,
          en_attente_client: CRA_STATUS.EN_ATTENTE_CLIENT,
          valide: CRA_STATUS.VALIDE,
        };

        const mappedStatus =
          statusMapping[craRecord.statut] || CRA_STATUS.A_SAISIR;
        setMonthlyStatus(mappedStatus);

        console.log("CRA Status for period:", period, "is:", mappedStatus);
      } else {
        // No CRA record exists for this period, default to "À saisir"
        setMonthlyStatus(CRA_STATUS.A_SAISIR);
        console.log(
          "No CRA record found for period:",
          period,
          "defaulting to À saisir"
        );
      }
    } catch (error) {
      console.error("Error fetching CRA status:", error);
      // Default to "À saisir" if API fails
      setMonthlyStatus(CRA_STATUS.A_SAISIR);
    }
  };

  // Fetch consultant profile info using API endpoint
  const fetchConsultantInfo = async () => {
    try {
      const consultantId = localStorage.getItem("id");
      const token = localStorage.getItem("unifiedToken");

      if (!consultantId) {
        message.error("Information de connexion non trouvée");
        return;
      }

      const response = await axios.get(
        `${Endponit()}/api/consultants/${consultantId}/profile/`
        // { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status) {
        const profileData = response.data.data;
        setConsultantName(`${profileData.Nom} ${profileData.Prenom}`);
        setConsultantProfile(profileData);
      } else {
        // Fall back to regular endpoint if profile endpoint fails
        const fallbackResponse = await axios.get(
          `${Endponit()}/api/consultant/${consultantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (fallbackResponse.data?.status) {
          setConsultantName(
            `${fallbackResponse.data.data.nom} ${fallbackResponse.data.data.prenom}`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching consultant info:", error);
      try {
        const consultantId = localStorage.getItem("consultantId");
        const token = localStorage.getItem("consultantToken");

        const fallbackResponse = await axios.get(
          `${Endponit()}/api/consultant/${consultantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (fallbackResponse.data?.status) {
          setConsultantName(
            `${fallbackResponse.data.data.nom} ${fallbackResponse.data.data.prenom}`
          );
        }
      } catch (fallbackError) {
        console.error("Error with fallback consultant info:", fallbackError);
      }
    }
  };

  // Fetch projects using the specified API and organize data for easy access
  const fetchProjects = async (date) => {
    try {
      const consultantId = localStorage.getItem("userId");
      // const token = localStorage.getItem("consultantToken");

      if (!consultantId) {
        message.error("Information de connexion non trouvée");
        return;
      }
      // Change period format from YYYY-MM to MM_YYYY
      const period = selectedMonth.format("MM_YYYY");

      // Use the new projects-by-consultant-period endpoint
      const response = await axios.get(
        `${Endponit()}/api/projects-by-consultant-period/`,
        {
          // headers: { Authorization: `Bearer ${token}` },
          params: {
            consultant_id: consultantId,
            period: period,
          },
        }
      );
      if (response.data?.status) {
        const projectsData = response.data.data || [];

        setProjects(projectsData);

        // Create lookup maps for projects and clients
        const projectsMap = {};
        const clientsMap = {};

        projectsData.forEach((project) => {
          // Add project to projects map
          projectsMap[project.id] = project;

          // Add client to clients map if not already present
          if (project.client_id && !clientsMap[project.client_id]) {
            clientsMap[project.client_id] = {
              id: project.client_id,
              name: project.client_name,
              projects: [],
            };
          }

          // Add project to client's projects list
          if (project.client_id) {
            if (!clientsMap[project.client_id].projects) {
              clientsMap[project.client_id].projects = [];
            }
            clientsMap[project.client_id].projects.push(project.id);
          }
        });

        setProjectsById(projectsMap);
        setClientsById(clientsMap);
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de la récupération des projets"
        );
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error("Impossible de charger vos projets");
    }
  };
  const fetchMonthlyReport = async (date) => {
    setLoading(true);
    try {
      const consultantId = localStorage.getItem("userId");
      // const token = localStorage.getItem("consultantToken");

      if (!consultantId) {
        message.error("Information de connexion non trouvée");
        return;
      }

      // Format period as MM_YYYY instead of YYYY-MM
      const period = date.format("MM_YYYY");

      // Fetch CRA status first
      await fetchCraStatus(date);

      // Use the new cra-by-period endpoint with query parameters
      const response = await axios.get(`${Endponit()}/api/cra-by-period/`, {
        params: {
          consultant_id: consultantId,
          period: period,
        },
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status) {
        // The CRA status is now fetched separately via fetchCraStatus
        // Get all CRA entries that can be submitted (i.e., those with status "À saisir")
        const entries = response.data.data || [];
        const submittableEntries = entries
          .filter(
            (entry) => !entry.status || entry.status === CRA_STATUS.A_SAISIR
          )
          .map((entry) => ({
            ...entry,
            selected: true, // Default all entries as selected
          }));
        setCraEntriesToSubmit(submittableEntries);

        processCraData(response.data.data || [], date);
      } else {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la récupération des données CRA"
        );
      }
    } catch (error) {
      console.error("Error fetching monthly CRA report:", error);
      // message.error("Impossible de charger le rapport mensuel");

      // Initialize empty data structure when API fails
      processCraData([], date);
    } finally {
      setLoading(false);
    }
  };

  const processCraData = (data, monthDate) => {
    const year = monthDate.year();
    const month = monthDate.month();
    const daysInMonth = monthDate.daysInMonth();

    // Initialize days array with all days of the month
    const daysData = [];
    const clientWork = {};

    // Initialize the calendar structure
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(new Date(year, month, day));
      const weekday = date.format("ddd")[0].toUpperCase(); // First letter of weekday
      const isWeekend = date.day() === 0 || date.day() === 6;

      // Keep ALL entries for this day - changed from taking only first entry
      const dayEntries = data.filter((entry) => parseInt(entry.jour) === day);

      // Check if this day is a holiday in the selected country
      const countryHolidays =
        selectedCountry === "FR" ? frenchHolidays : moroccanHolidays;
      const holiday = countryHolidays.find((h) => h.day === day);
      const isNationalHoliday = Boolean(holiday);

      // Calculate total duration from all entries
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
        isHoliday: isNationalHoliday,
        holidayName: holiday?.localName || holiday?.name,
        entries: dayEntries, // Store ALL entries for the day
        hasEntry: dayEntries.length > 0,
        duration: totalDuration, // Total duration of all entries
        assignedProjects: [], // Track multiple projects per day
        assignedProject: null, // For backward compatibility
        isInternal: false,
      });
    }

    // Populate with CRA data - now processing ALL entries
    data.forEach((entry) => {
      const day = parseInt(entry.jour);
      if (day < 1 || day > daysInMonth) return;

      const dayIndex = day - 1;
      const dayData = daysData[dayIndex];

      // Handle client work
      if (entry.id_client && entry.id_bdc) {
        const clientKey = `${entry.id_client}-${entry.id_bdc}`;

        // Store which client key this day is assigned to
        if (!dayData.assignedProjects) {
          dayData.assignedProjects = [];
        }

        // Add to assignedProjects array if not already there
        if (!dayData.assignedProjects.includes(clientKey)) {
          dayData.assignedProjects.push(clientKey);
        }

        // Set primary assignedProject for backward compatibility
        if (!dayData.assignedProject) {
          dayData.assignedProject = clientKey;
        }

        dayData.isInternal = false;

        // Get project details from API data
        const project = projectsById[entry.id_bdc];

        // Initialize client work entry if it doesn't exist
        if (!clientWork[clientKey]) {
          clientWork[clientKey] = {
            id: clientKey,
            clientId: entry.id_client,
            projectId: entry.id_bdc,
            clientName: project?.client_name || entry.client_name || "Client",
            projectName: project?.titre || entry.project_name || "Projet",
            contract: project?.titre || entry.bdc_reference || "Contrat",
            tjm: project?.candidature?.tjm || "",
            status: project?.candidature?.statut || "",
            total: 0,
            days: [], // Track each day with activity
            entries: {}, // Track entries by day
          };
        }

        // Track entries by day
        if (!clientWork[clientKey].entries[day]) {
          clientWork[clientKey].entries[day] = [];
        }

        clientWork[clientKey].entries[day].push({
          id: entry.id_imputation,
          Durée: parseFloat(entry.Durée || 0),
        });

        // Add day to the days array if not already included
        if (!clientWork[clientKey].days.includes(day)) {
          clientWork[clientKey].days.push(day);
        }

        // Update total with the actual duration
        clientWork[clientKey].total += parseFloat(entry.Durée || 0);

        // Add to client hours for this day
        if (!dayData.clientHours[clientKey]) {
          dayData.clientHours[clientKey] = 0;
        }
        dayData.clientHours[clientKey] += parseFloat(entry.Durée || 0);
      } else {
        // Handle internal work (no client/project)
        dayData.isInternal = true;
      }

      // Check for holiday or other special types
      if (
        entry.type_imputation === "Congé" ||
        entry.type_imputation === "Férié" ||
        entry.type === "congé" ||
        entry.type === "férié"
      ) {
        dayData.isHoliday = true;
      }
    });    // Calculate total work days (now accounting for partial days)
    const totalDays = daysData.reduce((sum, day) => sum + day.total, 0);

    // Calculate potential work days (excluding weekends and holidays)
    const potentialWorkDays = daysData.filter(
      (day) => !day.isWeekend && !day.isHoliday
    ).length;
      // Calculate "Pas d'activité" days - count workdays with no activity or with absence/congé type
    const noActivityDays = daysData.filter(
      (day) => {
        // Check if it's not a weekend or holiday
        if (day.isWeekend || day.isHoliday) return false;
        
        // Count days with zero activity
        if (day.total === 0) return true;
        
        // Check if all entries for this day are of type "absence" or "congé"
        if (day.entries && day.entries.length > 0) {
          // Check if any entry has type "absence", "congé" or type_imputation "Absence", "Congé"
          const hasAbsenceOrCongeEntry = day.entries.some(
            entry => (
              entry.type === "absence" || 
              entry.type_imputation === "Absence" ||
              entry.type === "congé" || 
              entry.type_imputation === "Congé"
            )
          );
          
          return hasAbsenceOrCongeEntry;
        }
        
        return false;
      }
    ).length;

    setCraData({
      days: daysData,
      clientWork: Object.values(clientWork),
      totalDays: totalDays,
      potentialWorkDays: potentialWorkDays,
      noActivityDays: noActivityDays,
    });

    // Fetch holidays data after processing CRA data
    fetchHolidays(monthDate);
  };

  // Submit new CRA entry
  const submitCraEntry = async (values) => {
    setSubmitting(true);
    try {
      const consultantId = localStorage.getItem("userId");
      // const token = localStorage.getItem("consultantToken");

      if (!consultantId) {
        message.error("Information de connexion non trouvée");
        return;
      }

      // Check if the day already has an entry
      const dayData = craData.days.find((d) => d.day === selectedDay);
      // if (dayData && dayData.hasEntry) {
      //   message.error(
      //     "Il existe déjà une imputation pour ce jour. Veuillez modifier l'existante."
      //   );
      //   setSubmitting(false);
      //   return;
      // }

      // Format period as MM_YYYY (e.g., "05_2025")
      const formattedPeriod = `${selectedMonth.format(
        "MM"
      )}_${selectedMonth.format("YYYY")}`; // Prepare the data for submission in the new format
      const submitData = {
        période: formattedPeriod,
        jour: selectedDay,
        type:
          values.type_imputation === "Jour Travaillé"
            ? "travail"
            : values.type_imputation.toLowerCase(),
        id_consultan: parseInt(consultantId),
        id_esn: consultantProfile?.ID_ESN || null,
        id_client: values.id_client || null,
        id_bdc: values.id_bdc || null,
        commentaire: values.commentaire,
        Durée: values.Durée,
        statut: CRA_STATUS.A_SAISIR, // Initial status for any new entry
      };

      const response = await axios.post(
        `${Endponit()}/api/cra_imputation`,
        submitData
        // { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.status) {
        message.success("Imputation CRA ajoutée avec succès");
        setCraEntryModalVisible(false);
        craForm.resetFields(); // Refresh the monthly report and projects data to ensure all views are updated
        fetchProjects(selectedMonth);
        fetchMonthlyReport(selectedMonth);

        // Ensure the selected month is saved before refreshing
        localStorage.setItem(
          "selectedMonthCRA",
          selectedMonth.format("YYYY-MM")
        );

        // Perform a complete page refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(
          response.data?.message || "Erreur lors de l'ajout de l'imputation CRA"
        );
      }
    } catch (error) {
      console.error("Error submitting CRA entry:", error);
      message.error("Impossible d'ajouter l'imputation CRA");
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing CRA entry
  const updateCraEntry = async (values) => {
    setSubmitting(true);
    try {
      const consultantId = localStorage.getItem("userId");
      const token = localStorage.getItem("unifiedToken");

      if (!consultantId || !token || !selectedCraEntry?.id_imputation) {
        message.error("Information de connexion ou d'entrée non trouvée");
        return;
      }

      // Check if entry can be updated based on its status
      if (
        selectedCraEntry.statut &&
        selectedCraEntry.statut !== CRA_STATUS.A_SAISIR
      ) {
        message.error("Impossible de modifier une imputation déjà soumise.");
        return;
      }

      // Format period as MM_YYYY
      const formattedPeriod = `${selectedMonth.format(
        "MM"
      )}_${selectedMonth.format("YYYY")}`; // Update with new format
      const updateData = {
        période: formattedPeriod,
        jour: selectedDay,
        type:
          values.type_imputation === "Jour Travaillé"
            ? "travail"
            : values.type_imputation.toLowerCase(),
        id_consultan: parseInt(consultantId),
        id_esn: consultantProfile?.ID_ESN || null,
        id_client: values.id_client || null,
        id_bdc: values.id_bdc || null,
        commentaire: values.commentaire,
        Durée: values.Durée,
        statut: selectedCraEntry.status || CRA_STATUS.A_SAISIR, // Preserve existing status or default
      };

      const response = await axios.put(
        `${Endponit()}/api/cra_imputation/${selectedCraEntry.id_imputation}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.status) {
        message.success("Imputation CRA modifiée avec succès");
        setEditDrawerVisible(false);
        editForm.resetFields();
        setSelectedCraEntry(null);

        // Refresh the monthly report and projects data
        fetchProjects(selectedMonth);
        fetchMonthlyReport(selectedMonth);

        // Ensure the selected month is saved before refreshing
        localStorage.setItem(
          "selectedMonthCRA",
          selectedMonth.format("YYYY-MM")
        );

        // Perform a complete page refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la modification de l'imputation CRA"
        );
      }
    } catch (error) {
      console.error("Error updating CRA entry:", error);
      message.error("Impossible de modifier l'imputation CRA");
    } finally {
      setSubmitting(false);
    }
  }; // Delete CRA entry
  const deleteCraEntry = async (entryId) => {
    try {
      const token = localStorage.getItem("userId");

      if (!token || !entryId) {
        message.error("Information de connexion ou d'entrée non trouvée");
        return;
      }

      // Find entry to check status
      const entryToDelete = dayEntries.find(
        (entry) => entry.id_imputation === entryId
      );
      if (
        entryToDelete &&
        entryToDelete.statut &&
        entryToDelete.statut !== CRA_STATUS.A_SAISIR
      ) {
        message.error("Impossible de supprimer une imputation déjà soumise.");
        return;
      }

      const response = await axios.delete(
        `${Endponit()}/api/cra_imputation/${entryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data?.status) {
        message.success("Imputation CRA supprimée avec succès");
        setEditDrawerVisible(false);
        setSelectedCraEntry(null);

        // Refresh the monthly report and projects data
        fetchProjects(selectedMonth);
        fetchMonthlyReport(selectedMonth);

        // Ensure the selected month is saved before refreshing
        localStorage.setItem(
          "selectedMonthCRA",
          selectedMonth.format("YYYY-MM")
        );

        // Perform a complete page refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la suppression de l'imputation CRA"
        );
      }
    } catch (error) {
      console.error("Error deleting CRA entry:", error);
      message.error("Impossible de supprimer l'imputation CRA");
    }
  };

  const submitMonthlyReportForValidation = async (selectedEntries) => {
    setSubmitting(true);
    try {
      const consultantId = localStorage.getItem("userId");
      const token = localStorage.getItem("unifiedToken");

      if (!consultantId) {
        message.error("Information de connexion non trouvée");
        return;
      }

      const formattedPeriod = `${selectedMonth.format(
        "MM"
      )}_${selectedMonth.format("YYYY")}`;

      // Get the project ID from the selected contract (using selectedContractId)
      const projectId = selectedContractId;

      if (!projectId) {
        message.error("Aucun contrat sélectionné");
        return;
      }

      // Find the specific CRA record for this contract
      const contractStatus = contractStatuses[projectId];

      if (contractStatus && contractStatus.id_CRA) {
        try {
          const response = await axios.put(
            `${Endponit()}/api/cra_consultant/${contractStatus.id_CRA}/`,
            {
              statut: "EVP",
              commentaire: `CRA soumis pour validation - ${formattedPeriod}`,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log(
            "CRA status updated successfully for contract:",
            projectId,
            response.data
          );
          message.success("CRA soumis pour validation avec succès");
          setSubmissionModalVisible(false);
          setSelectedContractId(null); // Reset after successful submission

          // Refresh the data to show updated status
          await fetchContractStatuses(selectedMonth);
          await fetchMonthlyReport(selectedMonth);
        } catch (statusError) {
          console.error("Error updating CRA status:", statusError);
          message.error("Erreur lors de la mise à jour du statut du CRA");
        }
      } else {
        message.error(`Aucun CRA existant trouvé pour le contrat ${projectId}`);
      }
    } catch (error) {
      console.error("Error submitting CRA for validation:", error);
      message.error("Impossible de soumettre le CRA pour validation");
    } finally {
      setSubmitting(false);
    }
  };

  // Open the submission modal to choose entries
  const openSubmissionModal = () => {
    if (craEntriesToSubmit.length === 0) {
      message.info("Aucune entrée CRA à soumettre pour ce mois");
      return;
    }
    setSubmissionModalVisible(true);
  };  // Add a new function for immediate refresh without page reload
  const handleMonthChangeWithRefresh = async (date) => {
    // Save the selected date in localStorage
    localStorage.setItem("selectedMonthCRA", date.format("YYYY-MM"));
    
    // Update state
    setSelectedMonth(date);
    setLoading(true);

    try {
      // Fetch all necessary data for the new period
      await fetchContractStatuses(date);
      await fetchCraStatus(date);
      await fetchProjects(date);
      await fetchMonthlyReport(date);
      await fetchHolidays(date);
      
      // Display success message
      message.success(`Période mise à jour: ${date.format('MMMM YYYY')}`);
    } catch (error) {
      console.error("Error refreshing data:", error);
      message.error("Erreur lors du chargement des données pour cette période");
    } finally {
      setLoading(false);
    }
  };  // Use the original handleMonthChange function that reloads the page
  const handleMonthChange = (date) => {
    // Save the selected date in localStorage
    localStorage.setItem("selectedMonthCRA", date.format("YYYY-MM"));

    // Update state
    setSelectedMonth(date);

    // Fetch data for the new period
    fetchMonthlyReport(date);
    fetchProjects(date);

    // Use a timeout to ensure localStorage is updated before refreshing
    setTimeout(() => {
      // Refresh the page to ensure all components are updated
      window.location.reload();
    }, 100);
  };
  // In the openAddCraModal function, modify it like this:  // Modify the openAddCraModal function
  const openAddCraModal = (day, record = null) => {
    if (day.isWeekend) return; // Don't allow entries for weekends

    // Don't allow modifications if CRA is not in editable state
    if (monthlyStatus !== CRA_STATUS.A_SAISIR) {
      message.info("Le CRA ne peut pas être modifié dans son statut actuel.");
      return;
    }

    // Don't allow entries for future dates
    const selectDate = moment(
      new Date(selectedMonth.year(), selectedMonth.month(), day.day)
    );
    const isFutureDate = selectDate.isAfter(currentDate, "day");
    // if (isFutureDate) {
    //   message.info(
    //     "Impossible d'ajouter des imputations pour des dates futures."
    //   );
    //   return;
    // }

    // Set selected day right away
    setSelectedDay(day.day);

    // Prepare initial values first - moved up
    const initialValues = {
      jour: day.day,
      Durée: 1,
      type_imputation: "Jour Travaillé",
    };

    // Check if day already has entries and calculate total duration
    const dayData = craData.days.find((d) => d.day === day.day);

    if (dayData && dayData.hasEntry) {
      // Calculate the sum of existing durations for all entries
      const totalDuration = dayData.entries.reduce(
        (sum, entry) => sum + parseFloat(entry.Durée || 0),
        0
      );

      // If total duration is already 1 or greater, show edit drawer instead
      if (totalDuration >= 1) {
        message.info(
          "Ce jour a déjà le maximum d'imputations. Vous pouvez les modifier ou les supprimer."
        );
        openEditDrawer(dayData, record); // Pass the record to keep client/project context
        return;
      }

      // Update Durée based on remaining time
      const remainingDuration = 1 - totalDuration;
      initialValues.Durée = remainingDuration >= 0.5 ? 0.5 : remainingDuration;
    } // Add client and project to initialValues if available from record
    if (record && record.type === "client" && record.client) {
      initialValues.id_client = record.client.clientId;
      initialValues.id_bdc = record.client.projectId;

      console.log("Using client/project from record:", {
        client: record.client.clientId,
        project: record.client.projectId,
      });
    }
    // For "pas d'activité" cells, pre-select Absence or Congé type
    else if (record && record.type === "noactivity") {
      initialValues.type_imputation = "Absence"; // Default to Absence, user can change to Congé if needed
      initialValues.id_client = null;
      initialValues.id_bdc = null;
    }

    // Reset form first
    craForm.resetFields();

    // Make the modal visible
    setCraEntryModalVisible(true);

    // Use a longer timeout to ensure the form is fully rendered and ready
    setTimeout(() => {
      // Set ALL values at once including client and project
      craForm.setFieldsValue(initialValues);

      // If we have client/project, set them again after a longer delay
      if (record && record.type === "client" && record.client) {
        setTimeout(() => {
          craForm.setFieldsValue({
            id_client: record.client.clientId,
            id_bdc: record.client.projectId,
          });
        }, 300);
      }
    }, 200);
  };
  // Also update the openEditDrawer function to handle passing client/project
  const openEditDrawer = (day, record = null) => {
    if (day.isWeekend) return; // Don't show for weekends

    // Don't allow modifications if CRA is not in editable state
    if (monthlyStatus !== CRA_STATUS.A_SAISIR) {
      message.info("Le CRA ne peut pas être modifié dans son statut actuel.");
      return;
    }

    // Don't allow entries for future dates
    const selectDate = moment(
      new Date(selectedMonth.year(), selectedMonth.month(), day.day)
    );

    if (!day.entries || day.entries.length === 0) {
      // If no entries, open the add modal instead with client/project info
      openAddCraModal(day, record);
      return;
    }

    setSelectedDay(day.day);
    setDayEntries(day.entries);
    setEditDrawerVisible(true); // Save client/project info for when user clicks "Add" in the drawer
    if (record && record.type === "client") {
      // Store the clicked client/project temporarily
      sessionStorage.setItem(
        "lastClickedClient",
        JSON.stringify({
          clientId: record.client.clientId,
          projectId: record.client.projectId,
        })
      );
    } else if (record && record.type === "noactivity") {
      // Store the noactivity record type for absence entries
      sessionStorage.setItem(
        "lastClickedClient",
        JSON.stringify({
          type: "noactivity",
        })
      );
    }
  };

  // Open edit form for a specific entry
  const editCraEntry = (entry) => {
    // Check if entry can be edited based on CRA consultant status
    const contractStatus = contractStatuses[entry.id_bdc];
    if (
      contractStatus &&
      (contractStatus.statut === "EVC" || contractStatus.statut === "EVP")
    ) {
      message.error(
        "Impossible de modifier une imputation avec le statut CRA EVC ou EVP."
      );
      return;
    }

    setSelectedCraEntry(entry);

    // Convert between type and type_imputation if needed
    const typeImputation =
      entry.type_imputation ||
      (entry.type === "travail"
        ? "Jour Travaillé"
        : entry.type.charAt(0).toUpperCase() + entry.type.slice(1));

    editForm.setFieldsValue({
      id_client: entry.id_client,
      id_bdc: entry.id_bdc,
      type_imputation: typeImputation,
      Durée: entry.Durée,
      commentaire: entry.commentaire,
    });
  };

  const renderCellContent = (day, client) => {
    if (!day) return "";
    if (day.isWeekend) return null;

    // For client rows - Only show the duration in the row that matches the assigned project
    if (client && day.assignedProjects) {
      // Check if this client has entries for this day
      const clientId = client.id;

      // If this day has entries for this client
      if (day.assignedProjects.includes(clientId)) {
        // Get total duration for this client on this day
        const clientDuration = day.clientHours[clientId] || 0;
        return clientDuration > 0
          ? clientDuration.toString().replace(".", ",")
          : "0";
      }
      return "";
    } else if (client && day.assignedProject === client.id) {
      // Fallback for backward compatibility
      return day.duration !== undefined && day.duration !== null
        ? day.duration.toString().replace(".", ",")
        : "1";
    }

    // For "Pas d'activité" row - Show ONLY remaining time (rest of 1) for each specific day
    if (client === null) {
      // Check if the day is in the future
      const dayDate = moment(
        new Date(selectedMonth.year(), selectedMonth.month(), day.day)
      );
      const isFutureDate = dayDate.isAfter(currentDate, "day");

      // If it's a future date, show nothing
      if (isFutureDate) return "";

      // Calculate total duration from ALL entries for this day (work + absences)
      const totalDuration =
        day.entries?.reduce(
          (sum, entry) => sum + parseFloat(entry.Durée || 0),
          0
        ) || 0;

      // Calculate remaining duration (out of 1)
      const remainingDuration = Math.max(0, 1 - totalDuration);

      // Show the remaining duration if there's any, otherwise show 0
      return remainingDuration > 0
        ? remainingDuration.toString().replace(".", ",")
        : "0";
    }

    // Empty cell for all other cases
    return "";
  };

  const createColumns = () => {
    if (!craData) return [];

    // Get French weekday letters
    const getWeekdayLetter = (date) => {
      const weekdays = ["D", "L", "M", "M", "J", "V", "S"];
      return weekdays[date.day()];
    };

    const columns = [
           // Update the Client column render function
        {
          title: "Client",
          dataIndex: "sem",
          key: "sem",
          width: 200,
          fixed: "left",
          render: (text, record) => {
            // Add validation button for each individual contract in Client column
            if (
              record.type === "client" &&
              monthlyStatus === CRA_STATUS.A_SAISIR
            ) {
              // Check if this contract can be submitted - Updated to include "annule"
              const canSubmit =
                !record.contractStatus ||
                record.contractStatus?.statut === "saisi" ||
                record.contractStatus?.statut === "annule";

              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "4px",
                  }}
                >
                  <div style={{ flex: 1 }}>{text}</div>
                  {canSubmit && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        // Set the selected contract ID before opening modal
                        setSelectedContractId(record.contractId);
                        openSubmissionModalForContracts([record.contractId]);
                      }}
                      style={{
                        fontSize: "11px",
                        padding: "0 8px",
                        height: "24px",
                      }}
                      title={
                        record.contractStatus?.statut === "annule"
                          ? "Renvoyer le CRA annulé pour validation"
                          : "Envoyer le CRA pour validation"
                      }
                    >
                      Envoyer
                    </Button>
                  )}
                </div>
              );
            }
            return text;
          },
        },
      {
        title: "Contrat",
        dataIndex: "contrat",
        key: "contrat",
        width: 220,
        fixed: "left",
        // Remove the render function from Contrat column - just show text
      },
      {
        title: (
          <strong style={{ display: "block", textAlign: "center" }}>
            Total
          </strong>
        ),
        dataIndex: "total",
        key: "total",
        width: 70,
        align: "center",
        fixed: "left",
        render: (text) => <span style={{ fontWeight: "bold" }}>{text}</span>,
        className: "total-column",
      },
    ];

    // Add day columns in a single row instead of grouping by weeks
    craData.days.forEach((dayData) => {
      const date = moment(
        new Date(selectedMonth.year(), selectedMonth.month(), dayData.day)
      );

      // Check if the day is in the future
      const isFutureDate = date.isAfter(currentDate, "day");

      columns.push({
        title: (
          <div>
            <div>{dayData.day}</div>
            <div>{getWeekdayLetter(date)}</div>
          </div>
        ),
        dataIndex: `day_${dayData.day}`,
        key: `day_${dayData.day}`,
        align: "center",
        width: 40,
        render: (text, record) => {
          // For client group header rows, show empty cells
          if (record.type === "client_group_header") {
            return "";
          }

          const content =
            record.type === "client"
              ? renderCellContent(dayData, record.client)
              : record.type === "noactivity"
              ? renderCellContent(dayData, null)
              : "";

          // Add tooltip for holiday days to show the holiday name
          if (dayData.isHoliday && dayData.holidayName) {
            return <Tooltip title={dayData.holidayName}>{content}</Tooltip>;
          }

          // Simple rendering - just show the content
          return content;
        },
        className: dayData.isWeekend
          ? "weekend-cell"
          : dayData.isHoliday
          ? "holiday-cell"
          : dayData.entries &&
            dayData.entries.some(
              (entry) =>
                entry.type_imputation === "Congé" ||
                entry.type_imputation === "Maladie" ||
                entry.type_imputation === "Absence" ||
                entry.type === "congé" ||
                entry.type === "maladie" ||
                entry.type === "absence"
            )
          ? "absence-cell"
          : dayData.entries &&
            dayData.entries.some(
              (entry) => entry.status === CRA_STATUS.A_SAISIR
            )
          ? "cra-status-saisir"
          : dayData.entries &&
            dayData.entries.some(
              (entry) => entry.status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE
            )
          ? "cra-status-prestataire"
          : dayData.entries &&
            dayData.entries.some(
              (entry) => entry.status === CRA_STATUS.EN_ATTENTE_CLIENT
            )
          ? "cra-status-client"
          : dayData.entries &&
            dayData.entries.some((entry) => entry.status === CRA_STATUS.VALIDE)
          ? "cra-status-valide"
          : isFutureDate
          ? "future-date-cell"
          : "",
        onCell: (record) => {
          return {
            onClick: () => {
              // Skip weekends and client group headers
              if (
                dayData.isWeekend ||
                record.type === "client_group_header" ||
                record.type === "section"
              )
                return;

              // Different handling based on record type
              if (record.type === "client") {
                // For client rows, create a record with client info
                const clickedRecord = {
                  type: "client",
                  client: {
                    clientId: record.client.clientId,
                    projectId: record.client.projectId,
                    clientName: record.client.clientName,
                    projectName: record.client.projectName,
                  },
                };

                // Debug info
                console.log("Clicked on client cell:", clickedRecord);

                // First handle any existing entries
                const dayDataForClick = craData.days.find(
                  (d) => d.day === dayData.day
                );
                if (
                  dayDataForClick &&
                  dayDataForClick.hasEntry &&
                  dayDataForClick.entries.length > 0
                ) {
                  openEditDrawer(dayDataForClick, clickedRecord);
                } else {
                  // Direct call to openAddCraModal for new entries
                  openAddCraModal(dayData, clickedRecord);
                }
              } else if (record.type === "noactivity") {
                // For "pas d'activité" cells, open add modal with absence/congé type preset
                const clickedRecord = { type: "noactivity", client: null };
                openAddCraModal(dayData, clickedRecord);
              } else {
                openEditDrawer(dayData);
              }
            },
            style: {
              cursor: dayData.isWeekend ? "default" : "pointer",
              position: "relative",
              backgroundColor:
                record.type === "noactivity"
                  ? "#fafafa"
                  : record.type === "section" ||
                    record.type === "client_group_header"
                  ? "#f9f9f9"
                  : "inherit",
            },
          };
        },
      });
    });

    return columns;
  };

  const createTableData = () => {
    if (!craData) return [];

    const data = [];
    let grandTotal = 0;

    // Map to track projects already added from CRA data
    const addedProjectIds = {};

    // Group projects by client
    const clientGroups = {};

    // First, organize projects with CRA entries by client
    if (craData.clientWork.length > 0) {
      craData.clientWork.forEach((client) => {
        const projectId = client.projectId;
        const project = projectsById[projectId];
        const clientId = client.clientId;
        const clientName = project?.client_name || client.clientName;

        // Mark this project as added
        addedProjectIds[projectId] = true;

        // Initialize client group if it doesn't exist
        if (!clientGroups[clientId]) {
          clientGroups[clientId] = {
            name: clientName,
            projects: [],
            total: 0,
          };
        }

        // Get contract status from the API
        const contractStatus = contractStatuses[projectId];

        // Add project to client group
        clientGroups[clientId].projects.push({
          key: `client_${projectId}`,
          type: "client",
          client: client,
          sem: contractStatus ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>              <Tag
                color={
                  contractStatus.statut === "saisi"
                    ? "blue"
                    : contractStatus.statut === "EVP"
                    ? "orange"
                    : contractStatus.statut === "EVC"
                    ? "purple"
                    : contractStatus.statut === "annule"
                    ? "red"
                    : contractStatus.statut === "en_attente_prestataire"
                    ? "orange"
                    : contractStatus.statut === "en_attente_client"
                    ? "purple"
                    : contractStatus.statut === "valide"
                    ? "green"
                    : "default"
                }
                title={contractStatus.statut === "annule" && contractStatus.commentaire ? 
                  (() => {
                    try {
                      const commentObj = JSON.parse(contractStatus.commentaire);
                      return `Annulé le ${commentObj.timestamp} par ${commentObj.user.name} (${commentObj.user.role})
Raison: ${commentObj.reason}
Statut précédent: ${commentObj.previousStatus}`;
                    } catch (e) {
                      return contractStatus.commentaire;
                    }
                  })() 
                  : undefined}
              >
                {contractStatus.statut === "saisi"
                  ? "À saisir"
                  : contractStatus.statut === "EVP"
                  ? "En validation prestataire"
                  : contractStatus.statut === "EVC"
                  ? "En validation client"
                  : contractStatus.statut === "annule"
                  ? "Annulé"
                  : contractStatus.statut === "en_attente_prestataire"
                  ? "En attente prestataire"
                  : contractStatus.statut === "en_attente_client"
                  ? "En attente client"
                  : contractStatus.statut === "valide"
                  ? "Validé"
                  : contractStatus.statut}
              </Tag>
            </div>
          ) : (
            project?.client_name || client.clientName
          ),          contrat: project
            ? `${project.titre} ${
                project.candidature?.statut === "Sélectionnée"
                  ? `[${project.candidature.tjm}€/j]`
                  : ""
              }`
            : client.contract,
          total: (
            <span style={{ fontWeight: "bold" }}>
              {client.total.toFixed(1).replace(".", ",")}
            </span>
          ),
          projectTotal: parseFloat(client.total || 0),
          isFirstInGroup: false,
          contractId: projectId,
          contractStatus: contractStatus,
        });
        // Add to client total
        clientGroups[clientId].total += parseFloat(client.total || 0);

        // Add to grand total
        grandTotal += parseFloat(client.total || 0);
      });
    }

    // Now organize projects without CRA entries
    Object.values(projectsById).forEach((project) => {
      // Skip projects already added from CRA data
      if (addedProjectIds[project.id]) {
        return;
      }

      const clientId = project.client_id;

      // Initialize client group if it doesn't exist
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = {
          name: project.client_name,
          projects: [],
          total: 0,
        };
      }

      // Create an empty client object for projects without CRA entries
      const emptyClient = {
        id: `${project.client_id}-${project.id}`,
        clientId: project.client_id,
        projectId: project.id,
        clientName: project.client_name,
        projectName: project.titre,
        contract: project.titre,
        tjm: project.candidature?.tjm || "",
        status: project.candidature?.statut || "",
        total: 0,
        days: [],
      };

      // Get contract status for projects without CRA entries
      const contractStatus = contractStatuses[project.id];

      // Add project to client group
      clientGroups[clientId].projects.push({
        key: `empty_client_${project.id}`,
        type: "client",
        client: emptyClient,
        sem: contractStatus ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{project.client_name}</span>
            <Tag
              color={
                contractStatus.statut === "saisi"
                  ? "blue"
                  : contractStatus.statut === "en_attente_prestataire"
                  ? "orange"
                  : contractStatus.statut === "en_attente_client"
                  ? "purple"
                  : contractStatus.statut === "valide"
                  ? "green"
                  : "default"
              }
            >
              {contractStatus.statut === "saisi"
                ? "À saisir"
                : contractStatus.statut === "en_attente_prestataire"
                ? "En attente prestataire"
                : contractStatus.statut === "en_attente_client"
                ? "En attente client"
                : contractStatus.statut === "valide"
                ? "Validé"
                : contractStatus.statut}
            </Tag>
            {contractStatus.n_jour && (
              <Tag color="cyan">{contractStatus.n_jour}j</Tag>
            )}
          </div>
        ) : (
          project.client_name
        ),
        contrat: `${project.titre} ${
          project.candidature?.statut === "Sélectionnée"
            ? `[${project.candidature.tjm}€/j]`
            : ""
        }`,
        total: <span style={{ color: "#999" }}>0,0</span>,
        projectTotal: 0,
        isFirstInGroup: false,
        contractId: project.id,
        contractStatus: contractStatus,
      });
    });

    // Add client groups to data array
    Object.values(clientGroups).forEach((clientGroup, index) => {
      // Apply client filter if set
      if (
        clientFilter &&
        !clientGroup.name.toLowerCase().includes(clientFilter.toLowerCase())
      ) {
        return; // Skip this client group if it doesn't match the filter
      }

      // Only add client header if there are multiple projects
      if (clientGroup.projects.length > 1) {
        // Add client group header
        data.push({
          key: `client_group_${index}`,
          type: "client_group_header",
          groupId: index,
          isCollapsed: collapsedGroups[index] || false,
          sem: (
            <div
              onClick={() => toggleGroupCollapse(index)}
              style={{
                fontSize: "16px",
                color: "#1890ff",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ marginRight: "8px" }}>
                {/* Icon handled in render function */}
              </span>
              {clientGroup.name}
              {clientGroup.projects.length > 1 && (
                <span
                  style={{
                    marginLeft: "8px",
                    fontSize: "12px",
                    background: "#1890ff",
                    color: "white",
                    borderRadius: "10px",
                    padding: "0 6px",
                    display: "inline-block",
                  }}
                >
                  {clientGroup.projects.length}
                </span>
              )}
            </div>
          ),
          contrat: "",
          total: (
            <strong
              style={{
                display: "block",
                textAlign: "center",
                color: "#1890ff",
              }}
            >
              {clientGroup.total.toFixed(1).replace(".", ",")}
            </strong>
          ),
        });

        // Mark first project in group
        if (clientGroup.projects.length > 0) {
          clientGroup.projects[0].isFirstInGroup = true;
        }
      }

      // Add all projects in this client group if not collapsed
      if (!collapsedGroups[index]) {
        clientGroup.projects.forEach((project) => {
          data.push(project);
        });
      }
    });    // Add a total row if there are any projects
    if (data.length > 1) {
      data.push({
        key: "grand_total",
        type: "section",
        sem: <strong>Total</strong>,
        contrat: "",
        total: (
          <strong
            style={{ display: "block", textAlign: "center", color: "#1890ff" }}
          >
            {grandTotal.toFixed(1).replace(".", ",")}
          </strong>
        ),
      });
    }

    // Calculate total remaining time for "Pas d'activité" row
    const totalRemainingTime =
      craData?.days?.reduce((total, day) => {
        // Skip weekends and holidays
        if (day.isWeekend || day.isHoliday) return total;

        // Check if the day is in the future
        const dayDate = moment(
          new Date(selectedMonth.year(), selectedMonth.month(), day.day)
        );
        const isFutureDate = dayDate.isAfter(currentDate, "day");
        if (isFutureDate) return total;

        // Calculate total duration from ALL entries for this day (work + absences)
        const totalDuration =
          day.entries?.reduce(
            (sum, entry) => sum + parseFloat(entry.Durée || 0),
            0
          ) || 0;

        // Calculate remaining time for this day
        const remainingDuration = Math.max(0, 1 - totalDuration);

        return total + remainingDuration;      }, 0) || 0;    // Add "Pas d'activité" row with total remaining time and display number of days without activity
    data.push({      
      key: "no_activity",
      type: "section", // Change to section type to match the grand_total row styling
      sem: (
        <span style={{ 
          color: craData.noActivityDays > 0 ? "#ff4d4f" : "#1890ff",
          fontWeight: "bold" 
        }}>
          Pas d'activité ({craData.noActivityDays} jours)
        </span>
      ),
      contrat: "",
      total: (
        <span style={{ 
          fontWeight: "bold",
          color: craData.noActivityDays > 0 ? "#ff4d4f" : "inherit"
        }}>
          {totalRemainingTime.toFixed(1).replace(".", ",")}
        </span>
      ),
    });

    return data;
  };

  // Add new function to handle contract-specific validation
  const openSubmissionModalForContracts = (contractIds) => {
    // Filter CRA entries for the specific contracts
    const contractEntries = craEntriesToSubmit.filter(
      (entry) =>
        contractIds.includes(entry.id_bdc) &&
        (!entry.statut || entry.statut === CRA_STATUS.A_SAISIR)
    );

    if (contractEntries.length === 0) {
      message.info("Aucune entrée CRA à soumettre pour ce contrat");
      return;
    }

    // Mark all contract entries as selected
    const updatedEntries = craEntriesToSubmit.map((entry) => ({
      ...entry,
      selected:
        contractIds.includes(entry.id_bdc) &&
        (!entry.statut || entry.statut === CRA_STATUS.A_SAISIR),
    }));

    setCraEntriesToSubmit(updatedEntries);
    setSelectedContractId(contractIds[0]); // Set for modal title
    setSubmissionModalVisible(true);
  };

  // Update the renderLegend function to include all cell types with matching colors
  const renderLegend = () => (
    <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 16 }}>
      <div>
        <Tag color="#f0f0f0" style={{ marginRight: 8, color: "black" }}>
          Week-end
        </Tag>
      </div>
      <div>
        <Tag color="#fffbe6" style={{ marginRight: 8, color: "black" }}>
          Congé
        </Tag>
      </div>
      <div>
        <Tag color="#ff7875" style={{ marginRight: 8, color: "black" }}>
          Absence
        </Tag>
      </div>{" "}
      <div> </div>
      <div>
        <Tag
          color="#fff"
          style={{
            marginRight: 8,
            border: "1px dashed #d9d9d9",
            color: "black",
          }}
        >
          <PlusOutlined style={{ marginRight: 4 }} /> Ajouter une imputation
        </Tag>
      </div>
    </div>
  );

  // Add this function to filter existing data by period
  const filterDataByPeriod = (date) => {
    setLoading(true);

    try {
      // Format the selected period as YYYY-MM for comparison
      const selectedPeriod = date.format("YYYY-MM");

      // Get all data from API response
      const allImputations = originalImputationData || [];

      // Filter imputations that match the selected period
      const filteredImputations = allImputations.filter((entry) => {
        // Format entry date from day and period
        const entryMonth = moment(`${entry.période}`, "MM_YYYY").format(
          "YYYY-MM"
        );
        return entryMonth === selectedPeriod;
      });

      // Process the filtered data
      processCraData(filteredImputations, date);
    } catch (error) {
      console.error("Error filtering data by period:", error);
      processCraData([], date);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="monthly-cra-report">
      <Card loading={loading}>
        <div className="report-header">
          <div className="report-title-section">
            {/* Header info */}
            <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div className="info-block">
                  <Text strong>Consultant : </Text>
                  <Text>
                    {consultantProfile
                      ? `${consultantProfile.Nom} ${consultantProfile.Prenom}`
                      : consultantName || ""}
                  </Text>
                </div>
                {consultantProfile?.Role && (
                  <div className="info-block">
                    <Text strong>Rôle : </Text>
                    <Text>{consultantProfile.Role}</Text>
                  </div>
                )}
              </Col>              <Col span={8}>
                <div className="info-block">
                  <Text strong>Période : </Text>
                  <Text style={{ textTransform: 'capitalize' }}>{selectedMonth.format("MMMM YYYY")}</Text>
                </div>
                {consultantProfile?.Technologie && (
                  <div className="info-block">
                    <Text strong>Technologies : </Text>
                    <Text>{consultantProfile.Technologie}</Text>
                  </div>
                )}
              </Col>{" "}              <Col span={8}>
                <div className="info-block">
                  <Text strong>Jours potentiels : </Text>
                  <Text>{craData?.potentialWorkDays || 0}</Text>
                </div>

                {consultantProfile?.Taux_journalier && (
                  <div className="info-block">
                    <Text strong>TJM : </Text>
                    <Text>{consultantProfile.Taux_journalier} €</Text>
                  </div>
                )}
              </Col>
            </Row>
          </div>{" "}          <div className="report-actions" style={{ marginBottom: 16 }}>
            <Row gutter={8} justify="space-between" align="middle">
              <Col>                <div className="month-selector">
                  <Space>                    <Button
                      icon={<LeftOutlined />}
                      onClick={() => {
                        const newDate = selectedMonth.clone().subtract(1, "month");
                        handleMonthChange(newDate);
                      }}
                    />
                    <input
                      type="month"
                      value={selectedMonth.format("YYYY-MM")}
                      onChange={(e) => {
                        const newDate = moment(e.target.value);
                        if (newDate.isValid()) {
                          handleMonthChange(newDate);
                        }
                      }}
                    />
                    <Button
                      icon={<RightOutlined />}
                      onClick={() => {
                        const newDate = selectedMonth.clone().add(1, "month");
                        handleMonthChange(newDate);
                      }}
                    />
                  </Space>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: "16px",
                    }}
                  >
                    <Switch
                      // checked={showHolidays}
                      // onChange={(checked) => setShowHolidays(checked)}
                      size="small"
                      disabled={true}
                    />
                    <span style={{ marginLeft: "8px" }}>
                      Jours Fériés{" "}
                      {selectedCountry === "FR" ? "(France)" : "(Maroc)"}
                    </span>
                  </div>{" "}
                </div>
              </Col>{" "}
              {/* {monthlyStatus === CRA_STATUS.A_SAISIR && (
                <Col>
                  <Button
                    type="primary"
                    onClick={openSubmissionModal}
                    // disabled={
                    //   loading ||
                    //   selectedMonth.isAfter(moment(), "month") ||
                    //   !(
                    //     craData?.totalCRA >= craData?.potentialWorkDays &&
                    //     craData?.totalCRA < selectedMonth.daysInMonth()
                    //   )
                    // }
                    // className={
                    //   !(
                    //     craData?.totalCRA >= craData?.potentialWorkDays &&
                    //     craData?.totalCRA < selectedMonth.daysInMonth()
                    //   )
                    //     ? "disabled-submit-button"
                    //     : ""
                    // }
                  >
                    Soumettre pour validation
                  </Button>
                </Col>
              )} */}
            </Row>
          </div>{" "}
        </div>

        <div className="report-content">
          <Table
            columns={createColumns()}
            dataSource={createTableData()}
            bordered
            size="middle"
            pagination={false}
            scroll={{ x: "max-content" }}
            rowClassName={(record) => {
              if (record.type === "section") return "section-row";
              if (record.type === "client_group_header")
                return "client-group-header-row";
              if (record.type === "noactivity") return "no-activity-row";
              if (record.key === "grand_total") return "grand-total-row";
              if (record.isFirstInGroup) return "first-in-group-row";
              return "";
            }}
            className="cra-monthly-table"
          />

          {renderLegend()}
        </div>
      </Card>
      {/* CRA Entry Modal */}
      <Modal
        title={`Ajouter une imputation - ${selectedMonth.format(
          "MMMM YYYY"
        )} jour ${selectedDay}`}
        open={craEntryModalVisible}
        onCancel={() => setCraEntryModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={craForm}
          layout="vertical"
          onFinish={submitCraEntry}
          initialValues={{
            type_imputation: "Jour Travaillé",
            durée: 1,
          }}
        >
          {" "}
          <Row gutter={16}>
            <Col
              span={12}
              style={{
                display:
                  craForm.getFieldValue("type_imputation") === "Congé" ||
                  craForm.getFieldValue("type_imputation") === "Absence" ||
                  craForm.getFieldValue("type_imputation") === "Maladie" ||
                  craForm.getFieldValue("type_imputation") === "Férié"
                    ? "none"
                    : "block",
              }}
            >
              <Form.Item name="id_client" label="Client">
                <Select
                  placeholder="Sélectionner un client"
                  allowClear
                  onChange={() => {
                    // Reset project selection when client changes
                    craForm.setFieldsValue({ id_bdc: undefined });
                  }}
                >
                  {Object.values(clientsById).map((client) => (
                    <Option key={client.id} value={client.id}>
                      {client.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>{" "}
            <Col
              span={12}
              style={{
                display:
                  craForm.getFieldValue("type_imputation") === "Congé" ||
                  craForm.getFieldValue("type_imputation") === "Absence" ||
                  craForm.getFieldValue("type_imputation") === "Maladie" ||
                  craForm.getFieldValue("type_imputation") === "Férié"
                    ? "none"
                    : "block",
              }}
            >
              {" "}
              <Form.Item
                name="id_bdc"
                label="Contrat"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue("id_client") && !value) {
                        return Promise.reject(
                          new Error("Sélectionnez un contrat")
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                {" "}
                <Select
                  placeholder="Sélectionner un contrat"
                  allowClear
                  disabled={!craForm.getFieldValue("id_client")}
                >
                  {craForm.getFieldValue("id_client") &&
                    clientsById[
                      craForm.getFieldValue("id_client")
                    ]?.projects?.map((projectId) => {
                      const project = projectsById[projectId];
                      return project ? (
                        <Option key={project.id} value={project.id}>
                          {project.titre}
                        </Option>
                      ) : null;
                    })}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              {" "}
              <Form.Item
                name="type_imputation"
                label="Type d'activité"
                rules={[{ required: true, message: "Type d'activité requis" }]}
              >
                <Select
                  placeholder="Sélectionner un type"
                  onChange={(value) => {
                    // Clear client and project fields when selecting absence types
                    if (
                      value === "Congé" ||
                      value === "Absence" ||
                      value === "Maladie" ||
                      value === "Férié"
                    ) {
                      craForm.setFieldsValue({
                        id_client: undefined,
                        id_bdc: undefined,
                      });
                    }
                    // Force form re-render to update display conditions
                    craForm.setFields([{ name: "type_imputation", value }]);
                  }}
                >
                  <Option value="Jour Travaillé">Travail</Option>
                  <Option value="Congé">Congé</Option>
                  <Option value="Férié">Férié</Option>
                  <Option value="Formation">Formation</Option>
                  <Option value="Maladie">Maladie</Option>
                  <Option value="Absence">Absence</Option>
                  <Option value="Autre">Autre</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="Durée"
                label="Durée"
                rules={[{ required: true, message: "Durée requise" }]}
              >
                <Select placeholder="Sélectionner une durée">
                  <Option value={0.5}>0.5 jour</Option>
                  <Option value={1}>1 jour</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="commentaire" label="Commentaire">
            <TextArea rows={3} placeholder="Commentaires optionnels" />
          </Form.Item>
          <Form.Item>
            <Row justify="end" gutter={8}>
              <Col>
                <Button onClick={() => setCraEntryModalVisible(false)}>
                  Annuler
                </Button>
              </Col>
              <Col>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Soumettre
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
      <Drawer
        title={`Imputations du ${selectedDay} ${selectedMonth.format(
          "MMMM YYYY"
        )}`}
        placement="right"
        onClose={() => {
          setEditDrawerVisible(false);
          setSelectedCraEntry(null);
        }}
        open={editDrawerVisible}
        width={600}
        extra={
          dayEntries.length > 0 && (
            <>
              {/* Calculate total duration of existing entries */}
              {(() => {
                const totalDuration = dayEntries.reduce(
                  (sum, entry) => sum + parseFloat(entry.Durée || 0),
                  0
                );
                const remainingDuration = 1 - totalDuration;

                // Show Add button only if there's remaining time AND monthly status is A_SAISIR
                return totalDuration < 1 &&
                  monthlyStatus === CRA_STATUS.A_SAISIR ? (
                  // In the Drawer component's extra prop, modify the Button's onClick handler
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      // Close drawer and open add modal with remaining duration
                      setEditDrawerVisible(false);
                      const day = craData.days.find(
                        (d) => d.day === selectedDay
                      ); // Retrieve saved client/project info if available
                      let clickedRecord = null;
                      try {
                        const savedClientInfo =
                          sessionStorage.getItem("lastClickedClient");
                        if (savedClientInfo) {
                          // Handle both client type records and noactivity type records
                          const parsedInfo = JSON.parse(savedClientInfo);

                          if (parsedInfo.type === "noactivity") {
                            // If it was a "noactivity" cell, create appropriate record type
                            clickedRecord = {
                              type: "noactivity",
                              client: null,
                            };
                          } else {
                            // Regular client record
                            const { clientId, projectId } = parsedInfo;
                            clickedRecord = {
                              type: "client",
                              client: {
                                clientId,
                                projectId,
                              },
                            };
                          }
                          // Clear the storage after using it
                          sessionStorage.removeItem("lastClickedClient");
                        }
                      } catch (e) {
                        console.error("Error retrieving client info:", e);
                      }

                      openAddCraModal(
                        {
                          ...day,
                          remainingDuration:
                            1 -
                            dayEntries.reduce(
                              (sum, entry) =>
                                sum + parseFloat(entry.Durée || 0),
                              0
                            ),
                        },
                        clickedRecord
                      );
                    }}
                  >
                    Ajouter
                  </Button>
                ) : null;
              })()}
            </>
          )
        }
      >
        {dayEntries.length === 0 ? (
          <Empty description="Aucune imputation pour ce jour" />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>
                Durée totale:{" "}
                {dayEntries
                  .reduce((sum, entry) => sum + parseFloat(entry.Durée || 0), 0)
                  .toString()
                  .replace(".", ",")}{" "}
                jour(s)
              </Text>
            </div>
            <List
              itemLayout="horizontal"
              dataSource={dayEntries}
              renderItem={(entry) => {
                // Get client and project names if available
                const client = entry.id_client
                  ? clientsById[entry.id_client]?.name || "Client"
                  : "-";
                const project = entry.id_bdc
                  ? projectsById[entry.id_bdc]?.titre || "Projet"
                  : "-";

                // Format activity type
                const typeImputation =
                  entry.type_imputation ||
                  (entry.type === "travail"
                    ? "Jour Travaillé"
                    : entry.type?.charAt(0).toUpperCase() +
                        entry.type?.slice(1) || "");

                // Safely handle potentially null Durée values
                const dureeValue = entry.Durée != null ? entry.Durée : 0;

                return (
                  <List.Item
                    key={entry.id_imputation}
                    actions={[
                      // Check CRA consultant status instead of entry status - Updated to allow "annule"
                      (() => {
                        const contractStatus = contractStatuses[entry.id_bdc];
                        const canEdit =
                          !contractStatus ||
                          contractStatus.statut === "saisi" ||
                          contractStatus.statut === "annule" ||
                          (contractStatus.statut !== "EVC" &&
                            contractStatus.statut !== "EVP");

                        return canEdit ? (
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => editCraEntry(entry)}
                            type="link"
                          >
                            Modifier
                          </Button>
                        ) : null;
                      })(),
                      // Check CRA consultant status for delete button - Updated to allow "annule"
                      (() => {
                        const contractStatus = contractStatuses[entry.id_bdc];
                        const canDelete =
                          !contractStatus ||
                          contractStatus.statut === "saisi" ||
                          contractStatus.statut === "annule" ||
                          (contractStatus.statut !== "EVC" &&
                            contractStatus.statut !== "EVP");

                        return canDelete ? (
                          <Button
                            type="link"
                            danger
                            onClick={() => {
                              const contractStatus =
                                contractStatuses[entry.id_bdc];
                              if (
                                contractStatus &&
                                contractStatus.statut !== "saisi" &&
                                contractStatus.statut !== "annule" &&
                                (contractStatus.statut === "EVC" ||
                                  contractStatus.statut === "EVP")
                              ) {
                                message.error(
                                  "Impossible de supprimer une imputation avec le statut CRA EVC ou EVP."
                                );
                              } else {
                                Modal.confirm({
                                  title:
                                    "Êtes-vous sûr de vouloir supprimer cette imputation?",
                                  content: "Cette action est irréversible.",
                                  okText: "Supprimer",
                                  okType: "danger",
                                  cancelText: "Annuler",
                                  onOk() {
                                    deleteCraEntry(entry.id_imputation);
                                  },
                                });
                              }
                            }}
                          >
                            Supprimer
                          </Button>
                        ) : null;
                      })(),
                    ].filter(Boolean)}
                  >
                    {" "}
                    <List.Item.Meta
                      title={
                        <Row>
                          <Col span={12}>{typeImputation}</Col>
                          <Col span={6} style={{ textAlign: "right" }}>
                            <Tag color="blue">
                              {dureeValue.toString().replace(".", ",")} jour
                            </Tag>
                          </Col>
                        </Row>
                      }
                      description={
                        <>
                          {entry.id_client && entry.id_bdc ? (
                            <div>
                              <div>
                                <strong>Client:</strong> {client}
                              </div>
                              <div>
                                <strong>Projet:</strong> {project}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <strong>Type:</strong> {typeImputation}
                            </div>
                          )}
                          {entry.commentaire && (
                            <div style={{ marginTop: 8 }}>
                              <strong>Commentaire:</strong> {entry.commentaire}
                            </div>
                          )}
                        </>
                      }
                    />
                  </List.Item>
                );
              }}
            />{" "}
            {/* Display edit form when an entry is selected */}
            {selectedCraEntry && (
              <div
                style={{
                  marginTop: 24,
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: 24,
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={5}>Modifier l'imputation</Title>
                  </Col>
                  <Col>
                    {(() => {
                      const contractStatus =
                        contractStatuses[selectedCraEntry.id_bdc];
                      return (
                        contractStatus &&
                        (contractStatus.statut === "EVC" ||
                          contractStatus.statut === "EVP") && (
                          <Tag color="red">
                            Cette imputation ne peut plus être modifiée (CRA{" "}
                            {contractStatus.statut})
                          </Tag>
                        )
                      );
                    })()}
                  </Col>
                </Row>

                <Form
                  form={editForm}
                  layout="vertical"
                  onFinish={updateCraEntry}
                  initialValues={{
                    type_imputation: "Jour Travaillé",
                    Durée: 1,
                  }}
                  disabled={(() => {
                    const contractStatus =
                      contractStatuses[selectedCraEntry.id_bdc];
                    return (
                      contractStatus &&
                      (contractStatus.statut === "EVC" ||
                        contractStatus.statut === "EVP")
                    );
                  })()}
                >
                  {" "}
                  <Row gutter={16}>
                    {" "}
                    <Col
                      span={12}
                      style={{
                        display:
                          editForm.getFieldValue("type_imputation") ===
                            "Congé" ||
                          editForm.getFieldValue("type_imputation") ===
                            "Absence" ||
                          editForm.getFieldValue("type_imputation") ===
                            "Maladie" ||
                          editForm.getFieldValue("type_imputation") === "Férié"
                            ? "none"
                            : "block",
                      }}
                    >
                      <Form.Item name="id_client" label="Client">
                        <Select
                          placeholder="Sélectionner un client"
                          allowClear
                          onChange={() => {
                            editForm.setFieldsValue({ id_bdc: undefined });
                          }}
                        >
                          {Object.values(clientsById).map((client) => (
                            <Option key={client.id} value={client.id}>
                              {client.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col
                      span={12}
                      style={{
                        display:
                          editForm.getFieldValue("type_imputation") ===
                            "Congé" ||
                          editForm.getFieldValue("type_imputation") ===
                            "Absence" ||
                          editForm.getFieldValue("type_imputation") ===
                            "Maladie" ||
                          editForm.getFieldValue("type_imputation") === "Férié"
                            ? "none"
                            : "block",
                      }}
                    >
                      {" "}
                      <Form.Item name="id_bdc" label="Contrat">
                        <Select
                          placeholder="Sélectionner un contrat"
                          allowClear
                          disabled={!editForm.getFieldValue("id_client")}
                        >
                          {editForm.getFieldValue("id_client") &&
                            clientsById[
                              editForm.getFieldValue("id_client")
                            ]?.projects?.map((projectId) => {
                              const project = projectsById[projectId];
                              return project ? (
                                <Option key={project.id} value={project.id}>
                                  {project.titre}
                                </Option>
                              ) : null;
                            })}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      {" "}
                      <Form.Item
                        name="type_imputation"
                        label="Type d'activité"
                        rules={[
                          { required: true, message: "Type d'activité requis" },
                        ]}
                      >
                        <Select
                          placeholder="Sélectionner un type"
                          onChange={(value) => {
                            // Clear client and project fields when selecting absence types
                            if (
                              value === "Congé" ||
                              value === "Absence" ||
                              value === "Maladie" ||
                              value === "Férié"
                            ) {
                              editForm.setFieldsValue({
                                id_client: undefined,
                                id_bdc: undefined,
                              });
                            }
                            // Force form re-render to update display conditions
                            editForm.setFields([
                              { name: "type_imputation", value },
                            ]);
                          }}
                        >
                          <Option value="Jour Travaillé">Travail</Option>
                          <Option value="Congé">Congé</Option>
                          <Option value="Férié">Férié</Option>
                          <Option value="Formation">Formation</Option>
                          <Option value="Maladie">Maladie</Option>
                          <Option value="Absence">Absence</Option>
                          <Option value="Autre">Autre</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="Durée"
                        label="Durée"
                        rules={[{ required: true, message: "Durée requise" }]}
                      >
                        <Select placeholder="Sélectionner une durée">
                          <Option value={0.5}>0.5 jour</Option>
                          <Option value={1}>1 jour</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="commentaire" label="Commentaire">
                    <TextArea rows={3} placeholder="Commentaires optionnels" />
                  </Form.Item>
                  <Form.Item>
                    <Row justify="end" gutter={8}>
                      <Col>
                        <Button onClick={() => setSelectedCraEntry(null)}>
                          Annuler
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={submitting}
                        >
                          Mettre à jour
                        </Button>
                      </Col>
                    </Row>
                  </Form.Item>
                </Form>
              </div>
            )}
          </>
        )}
      </Drawer>{" "}
      <style jsx="true">{`
        /* Change congé cell colors to orange */
        .conge-cell {
          background-color: #fa8c16 !important; /* Bright orange */
        }

        /* Congé entries in the absence-check-cell */
        .absence-check-cell.conge {
          background-color: #fff7e6 !important; /* Light orange background */
          border: 1px solid #fa8c16 !important; /* Orange border */
          font-weight: bold;
          color: #873800; /* Dark orange/brown text */
        }

        /* Mixed cells (both congé and absence) */
        .absence-check-cell.mixed {
          background: linear-gradient(
            135deg,
            #fff7e6 50%,
            #ffe7ba 50%
          ) !important;
          border: 1px solid #fa8c16 !important; /* Changed to orange border */
          font-weight: bold;
        }

        /* For consistency, also update any other congé-related styles */
        .cra-monthly-table .ant-table-tbody > tr > td.conge-day {
          background-color: #fff7e6 !important;
          border: 1px solid #fa8c16 !important;
        }
      `}</style>
      <Modal
        title={`Soumettre des imputations CRA pour validation${
          selectedContractId ? " - Contrat spécifique" : ""
        }`}
        open={submissionModalVisible}
        onCancel={() => {
          setSubmissionModalVisible(false);
          setSelectedContractId(null); // Reset when closing
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSubmissionModalVisible(false);
              setSelectedContractId(null); // Reset when closing
            }}
          >
            Annuler
          </Button>,
          <Button
            key="selected"
            type="primary"
            onClick={() => {
              const selectedEntries = craEntriesToSubmit.filter(
                (entry) => entry.selected
              );
              if (selectedEntries.length === 0) {
                message.info("Veuillez sélectionner au moins une imputation");
                return;
              }
              submitMonthlyReportForValidation(selectedEntries);
            }}
            loading={submitting}
            disabled={!craEntriesToSubmit.some((entry) => entry.selected)}
          >
            Soumettre la sélection
          </Button>,
        ]}
      >
        {/* <Form form={submissionForm}>
          <List
            dataSource={craEntriesToSubmit.filter(
              (entry) =>
                (!entry.statut || entry.statut === CRA_STATUS.A_SAISIR) &&
                (selectedContractId
                  ? entry.id_bdc === selectedContractId
                  : true)
            )}
            renderItem={(item) => {
              // Get client and project names
              const client = item.id_client
                ? clientsById[item.id_client]?.name || "Client"
                : "-";
              const project = item.id_bdc
                ? projectsById[item.id_bdc]?.titre || "Projet"
                : "-";

              return (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <Checkbox
                      checked={item.selected}
                      onChange={(e) => {
                        const updatedEntries = [...craEntriesToSubmit];
                        const index = updatedEntries.findIndex(
                          (entry) => entry.id_imputation === item.id_imputation
                        );
                        if (index !== -1) {
                          updatedEntries[index].selected = e.target.checked;
                        }
                        setCraEntriesToSubmit(updatedEntries);
                      }}
                    >
                      <div>
                        <div>
                          <strong>Date:</strong> {item.jour}{" "}
                          {selectedMonth.format("MMMM YYYY")}
                        </div>
                        {item.id_client && item.id_bdc ? (
                          <>
                            <div>
                              <strong>Client:</strong> {client}
                            </div>
                            <div>
                              <strong>Projet:</strong> {project}
                            </div>
                          </>
                        ) : (
                          <div>
                            <strong>Type:</strong>{" "}
                            {item.type_imputation ||
                              (item.type === "travail"
                                ? "Jour Travaillé"
                                : item.type?.charAt(0).toUpperCase() +
                                    item.type?.slice(1) || "")}
                          </div>
                        )}
                        <div>
                          <strong>Durée:</strong>{" "}
                          {parseFloat(item.Durée).toString().replace(".", ",")}{" "}
                          jour
                        </div>
                      </div>
                    </Checkbox>
                  </div>
                </List.Item>
              );
            }}
            locale={{
              emptyText: (
                <Empty description="Aucune imputation à soumettre pour ce contrat" />
              ),
            }}
            style={{ maxHeight: "400px", overflowY: "auto" }}
          />

          <Divider />

          <Row justify="end">
            <Col>
              <Text>
                {
                  craEntriesToSubmit.filter(
                    (entry) =>
                      (!entry.statut || entry.statut === CRA_STATUS.A_SAISIR) &&
                      (selectedContractId
                        ? entry.id_bdc === selectedContractId
                        : true) &&
                      entry.selected
                  ).length
                }{" "}
                imputations sélectionnées
              </Text>
            </Col>
          </Row>
        </Form> */}
      </Modal>
      <style jsx="true">{`
        .weekend-cell {
          background-color: #f0f0f0 !important;
        }
        .holiday-cell {
          background-color: #fffbe6 !important;
        }
        .absence-cell {
          background-color: #ff7875 !important;
        }
        .future-date-cell {
          background-color: #f9f9f9 !important;
        }
        .section-row {
          background-color: #f9f9f9 !important;
        }
        .client-group-header-row {
          background-color: #f0f7ff !important;
          border-top: 2px solid #1890ff !important;
          font-weight: bold;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .client-group-header-row td {
          padding-top: 12px !important;
          padding-bottom: 12px !important;
        }
        .client-group-header-row:hover td {
          background-color: #dcedff !important;
          transition: background-color 0.2s;
        }
        .first-in-group-row {
          border-top: 1px solid #e8e8e8 !important;
        }
        /* Add subtle indent for projects within a client group */
        .first-in-group-row td:nth-child(2),
        .first-in-group-row
          ~ tr:not(.no-activity-row):not(.client-group-header-row):not(
            .grand-total-row
          )
          td:nth-child(2) {
          padding-left: 24px !important;
        } /* Add hover effect for rows */
        .cra-monthly-table
          .ant-table-tbody
          > tr:hover:not(.client-group-header-row):not(.grand-total-row):not(
            .section-row
          )
          > td {
          background-color: #e6f7ff !important;
          transition: background-color 0.3s;
        }        .no-activity-row {
          background-color: #fff1f0 !important;
          border-top: 2px dashed #ff4d4f !important;
          border-bottom: 2px dashed #ff4d4f !important;
        }
        .available-cell {
          background-color: #f6ffed !important;
          border: 1px solid #b7eb8f !important;
          font-weight: bold;
        }
        .no-remaining-cell {
          background-color: #fff1f0 !important;
          border: 1px solid #ffa39e !important;
        }
        .absence-check-cell {
          background-color: #ffe7ba !important;
          border: 1px solid #ffa940 !important;
          font-weight: bold;
          color: #873800;
        }
        /* Status-based coloring */
        .cra-status-saisir {
          background-color: #e6f7ff !important; /* light blue */
        }
        .cra-status-prestataire {
          background-color: #fff1b8 !important; /* light yellow */
        }
        .cra-status-client {
          background-color: #ffd6e7 !important; /* light pink */
        }
        .cra-status-valide {
          background-color: #d9f7be !important; /* light green */
        } /* Table styling */
        .cra-monthly-table .ant-table-cell {
          padding: 8px 4px;
          text-align: center;
          border: 1px solid #f0f0f0;
        }
        .cra-monthly-table .ant-table-thead > tr > th {
          text-align: center;
          background-color: #e6f7ff;
          border-bottom: 2px solid #1890ff;
          font-weight: 600;
          padding: 12px 4px;
        }
        .cra-monthly-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f5f5f5;
        }

        .cra-monthly-table .ant-table {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .grand-total-row {
          background-color: #f0f7ff !important;
          font-weight: bold;
          border-top: 2px solid #1890ff !important;
        }
        .total-column {
          border-right: 2px solid #d9d9d9 !important;
          background-color: #fafafa !important;
        }

        /* Add hover effect for total values */
        .cra-monthly-table .ant-table-tbody > tr:hover > td.total-column {
          background-color: #e6f7ff !important;
        }

        .info-block {
          margin-bottom: 8px;
        }
      `}</style>
      <style jsx="true">{`
        /* Enhanced Select Styling */
        .monthly-cra-report .ant-select {
          width: 100%;
        }

        .monthly-cra-report .ant-select-selector {
          border-radius: 4px !important;
          border-color: #d9d9d9 !important;
          transition: all 0.3s !important;
        }

        /* Style for Congé option in dropdown */
        .ant-select-item-option-content span[style*="fa8c16"] {
          font-weight: bold !important;
        }

        /* Style for selected Congé value */
        .ant-select-selection-item span[style*="fa8c16"] {
          color: #fa8c16 !important;
          font-weight: bold !important;
        }

        /* Special coloring when Congé is selected */
        .ant-form-item:has(.ant-select-selection-item span[style*="fa8c16"])
          .ant-form-item-label
          > label {
          color: #fa8c16 !important;
          font-weight: 500;
        }

        /* Make sure the Edit Form also shows the same styling */
        #editForm .ant-select-item-option-content span[style*="fa8c16"],
        #craForm .ant-select-item-option-content span[style*="fa8c16"] {
          color: #fa8c16 !important;
          font-weight: bold !important;
        }
      `}</style>
    </div>
  );
};

export default MonthlyActivityReport;
