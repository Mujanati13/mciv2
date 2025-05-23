// This is a script to fix the syntax errors in MonthlyActivityReport.jsx
// Create a properly formatted renderCellContent function

// Function to render cell content based on type
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
  // For "Pas d'activité" row - Show remaining time (out of 1) for each specific day    
  if (client === null) {
    // Check if the day is in the future
    const dayDate = moment(
      new Date(selectedMonth.year(), selectedMonth.month(), day.day)
    );
    const isFutureDate = dayDate.isAfter(currentDate, "day");

    // If it's a future date, show nothing
    if (isFutureDate) return "";
    
    // Check if this day has absence entries and calculate their total duration
    const absenceEntries = day.entries?.filter(entry => 
      entry.type_imputation === "Congé" || 
      entry.type_imputation === "Maladie" || 
      entry.type_imputation === "Absence" ||
      entry.type === "congé" ||
      entry.type === "maladie" ||
      entry.type === "absence"
    ) || [];
    
    // If there are absence entries, show the total duration and type
    if (absenceEntries.length > 0) {
      const absenceDuration = absenceEntries.reduce(
        (sum, entry) => sum + parseFloat(entry.Durée || 0), 
        0
      );
      
      // Get a simplified type indicator with counts for multiple entries of the same type
      let countByType = { 'C': 0, 'A': 0, 'M': 0, 'F': 0, 'X': 0 };
      
      // Count each type of absence
      absenceEntries.forEach(entry => {
        const type = entry.type_imputation || entry.type || "";
        
        if (type.toLowerCase().includes("congé")) countByType['C']++;
        else if (type.toLowerCase().includes("absence")) countByType['A']++;
        else if (type.toLowerCase().includes("maladie")) countByType['M']++;
        else if (type.toLowerCase().includes("férié")) countByType['F']++;
        else countByType['X']++;
      });
      
      // Create the type indicator string with counts if more than one of any type
      const typeIndicator = Object.entries(countByType)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => count > 1 ? `${type}${count}` : type)
        .join("");
      
      return `${absenceDuration.toString().replace(".", ",")} (${typeIndicator})`;
    }
    
    // Otherwise, calculate remaining duration as before
    const totalDuration = day.entries?.reduce(
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

// Function to create column renderers correctly
const columnRenderer = (day) => (text, record) => {
  // For client group header rows, show empty cells
  if (record.type === "client_group_header") {
    return "";
  }

  const content =
    record.type === "client"
      ? renderCellContent(day, record.client)
      : record.type === "noactivity"
      ? renderCellContent(day, null)
      : "";
  
  // Add tooltip for holiday days to show the holiday name
  return day.isHoliday && day.holidayName ? (
    <Tooltip title={day.holidayName}>{content}</Tooltip>
  ) : record.type === "noactivity" && !day.isWeekend && content ? (
    <div className={
      // Check if this is an absence entry (now showing the duration instead of ✓)
      day.entries?.some(entry => 
        entry.type_imputation === "Congé" || 
        entry.type_imputation === "Maladie" || 
        entry.type_imputation === "Absence" ||
        entry.type === "congé" ||
        entry.type === "maladie" ||
        entry.type === "absence"
      ) ? 
      "absence-check-cell" : // Special class for days with absences
      parseFloat(content) > 0 ? 
      "available-cell" : 
      "no-remaining-cell"
    } style={{ padding: "8px" }}>
      {content}
    </div>
  ) : (
    content
  );
};

// Function to create columns correctly
const createColumns = () => {
  if (!craData) return [];

  // Get French weekday letters
  const getWeekdayLetter = (date) => {
    const weekdays = ["D", "L", "M", "M", "J", "V", "S"];
    return weekdays[date.day()];
  };

  const columns = [
    {
      title: "Client",
      dataIndex: "sem",
      key: "sem",
      width: 150,
      fixed: "left",
      render: (text, record) => {
        // Column rendering logic
      },
    },
    // Other columns
  ];

  // Add day columns correctly
  craData.days.forEach((day) => {
    const date = moment(
      new Date(selectedMonth.year(), selectedMonth.month(), day.day)
    );

    // Check if the day is in the future
    const isFutureDate = date.isAfter(currentDate, "day");
    
    columns.push({
      title: (
        <div>
          <div>{day.day}</div>
          <div>{getWeekdayLetter(date)}</div>
        </div>
      ),
      dataIndex: `day_${day.day}`,
      key: `day_${day.day}`,
      align: "center",
      width: 40,
      render: (text, record) => {
        // For client group header rows, show empty cells
        if (record.type === "client_group_header") {
          return "";
        }

        const content =
          record.type === "client"
            ? renderCellContent(day, record.client)
            : record.type === "noactivity"
            ? renderCellContent(day, null)
            : "";
        
        // Add tooltip for holiday days to show the holiday name
        return day.isHoliday && day.holidayName ? (
          <Tooltip title={day.holidayName}>{content}</Tooltip>
        ) : record.type === "noactivity" && !day.isWeekend && content ? (
          <div className={
            // Check if this is an absence entry (now showing the duration instead of ✓)
            day.entries?.some(entry => 
              entry.type_imputation === "Congé" || 
              entry.type_imputation === "Maladie" || 
              entry.type_imputation === "Absence" ||
              entry.type === "congé" ||
              entry.type === "maladie" ||
              entry.type === "absence"
            ) ? 
            "absence-check-cell" : // Special class for days with absences
            parseFloat(content) > 0 ? 
            "available-cell" : 
            "no-remaining-cell"
          } style={{ padding: "8px" }}>
            {content}
          </div>
        ) : (
          content
        );
      },
      className: day.isWeekend
        ? "weekend-cell"
        : day.isHoliday
        ? "holiday-cell"
        : day.entries &&
          day.entries.some(
            (entry) =>
              entry.type_imputation === "Congé" ||
              entry.type_imputation === "Maladie" ||
              entry.type_imputation === "Absence" ||
              entry.type === "congé" ||
              entry.type === "maladie" ||
              entry.type === "absence"
          )
        ? "absence-cell"
        : day.entries &&
          day.entries.some((entry) => entry.status === CRA_STATUS.A_SAISIR)
        ? "cra-status-saisir"
        : day.entries &&
          day.entries.some(
            (entry) => entry.status === CRA_STATUS.EN_ATTENTE_PRESTATAIRE
          )
        ? "cra-status-prestataire"
        : day.entries &&
          day.entries.some(
            (entry) => entry.status === CRA_STATUS.EN_ATTENTE_CLIENT
          )
        ? "cra-status-client"
        : day.entries &&
          day.entries.some((entry) => entry.status === CRA_STATUS.VALIDE)
        ? "cra-status-valide"
        : isFutureDate
        ? "future-date-cell"
        : "",
      onCell: (record) => ({
        onClick: () => {
          // Skip weekends and client group headers
          if (
            day.isWeekend ||
            record.type === "client_group_header" ||
            record.type === "section"
          )
            return;

          // Different handling based on record type
          if (record.type === "client") {
            // Cell click handling logic
          } else if (record.type === "noactivity") {
            // Cell click handling logic
          } else {
            openEditDrawer(day);
          }
        },
        style: {
          cursor: day.isWeekend ? "default" : "pointer",
          position: "relative",
          backgroundColor:
            record.type === "noactivity"
              ? "#fafafa"
              : record.type === "section" ||
                record.type === "client_group_header"
              ? "#f9f9f9"
              : "inherit",
        },
      }),
    });
  });

  return columns;
};

// Use the rowClassName function correctly
const rowClassNameFunction = (record) => {
  if (record.type === "section") return "section-row";
  if (record.type === "client_group_header") return "client-group-header-row";
  if (record.type === "noactivity") return "no-activity-row";
  if (record.key === "grand_total") return "grand-total-row";
  if (record.isFirstInGroup) return "first-in-group-row";
  return "";
};
