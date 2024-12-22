import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllEvents } from "../utils/indexedDB";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./Calendar.css";
import { TextField, FormControl, Tooltip, IconButton } from "@mui/material";
import { green } from "@mui/material/colors";
import AddCircleIcon from "@mui/icons-material/AddCircle";

const Calendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDateInputVisible, setIsDateInputVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const loadEvents = async () => {
      const eventData = await getAllEvents();
      setEvents(eventData);
    };
    loadEvents();
  }, []);

  const getEventsForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return events.filter((event) => event.date === formattedDate);
  };

  const handleEventDateClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleDateClick = (date) => {
    // Create a new Date object to ensure the date is not modified unintentionally
    const selectedDate = new Date(date);

    // Reset the time to midnight to avoid time zone offset issues
    selectedDate.setHours(0, 0, 0, 0); // Ensures it's at midnight in local time

    // Format the date to YYYY-MM-DD to avoid time zone shifts
    const formattedDate = selectedDate.toLocaleDateString("en-CA"); // "en-CA" ensures YYYY-MM-DD format

    // Navigate to the Create Event page with the selected date
    navigate(`/createevent?date=${formattedDate}`);
  };

  const handleMonthChange = (offset) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + offset,
      1
    );
    setCurrentDate(newDate);
  };

  const handleTitleClick = () => {
    setIsDateInputVisible((prev) => !prev);
  };

  const handleDateChange = (event) => {
    const selected = event.target.value;
    setSelectedDate(selected);

    const newDate = new Date(selected);
    setCurrentDate(newDate);

    setIsDateInputVisible(false); // Close dropdown after selection
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();

    const calendarDays = [];

    // Add empty days for the start of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`prev-${i}`} className="calendar-day empty" />
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      date.setHours(0, 0, 0, 0);

      const eventsForDate = getEventsForDate(date);
      calendarDays.push(
        <div key={day} className="calendar-day">
          <span>{day}</span>
          {eventsForDate.map((event) => (
            <button
              key={event.id}
              onClick={() => handleEventDateClick(event.id)}
              className="event-button"
            >
              {event.name}
            </button>
          ))}
          <div className="hover-icon-container">
            <Tooltip title="Create Event" arrow>
              <IconButton
                onClick={() => handleDateClick(date)}
                sx={{ color: green[500] }}
              >
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      );
    }
    return calendarDays;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button
          onClick={() => handleMonthChange(-1)}
          className="month-nav-button"
        >
          <ChevronLeftIcon fontSize="large" />
        </button>
        <h2 onClick={handleTitleClick} style={{ cursor: "pointer" }}>
          {currentDate.toLocaleString("default", { month: "long" })}{" "}
          {currentDate.getFullYear()}
        </h2>
        {isDateInputVisible && (
          <div style={{ marginTop: "10px" }}>
            <FormControl>
              <TextField
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </div>
        )}
        <button
          onClick={() => handleMonthChange(1)}
          className="month-nav-button"
        >
          <ChevronRightIcon fontSize="large" />
        </button>
      </div>
      <div className="calendar-grid">{generateCalendarDays()}</div>
    </div>
  );
};

export default Calendar;
