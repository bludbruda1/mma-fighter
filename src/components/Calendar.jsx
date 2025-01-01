import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllEvents,
  getGameDate,
  updateGameDate,
  updateEventStatus, // Assuming this function will be used for updating event status
} from "../utils/indexedDB";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./Calendar.css";
import {
  TextField,
  FormControl,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { green } from "@mui/material/colors";
import AddCircleIcon from "@mui/icons-material/AddCircle";

const Calendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [gameDate, setGameDate] = useState(new Date());
  const [isDateInputVisible, setIsDateInputVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventsOnGameDate, setEventsOnGameDate] = useState([]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        const fetchedGameDate = await getGameDate();
        const initialGameDate = new Date(fetchedGameDate);
        setGameDate(initialGameDate);
        setCurrentDate(initialGameDate);
        setSelectedDate(initialGameDate.toISOString().split("T")[0]);
      } catch (error) {
        console.error("Error fetching game date:", error);
      }

      try {
        const eventData = await getAllEvents();
        setEvents(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    initializeCalendar();
  }, []);

  const getEventsForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return events.filter((event) => event.date === formattedDate);
  };

  const proceedToSkipDay = async () => {
    try {
      const newGameDate = new Date(gameDate);
      newGameDate.setDate(newGameDate.getDate() + 1);
      await updateGameDate(newGameDate.toISOString());
      setGameDate(newGameDate);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error skipping day:", error);
    }
  };

  const handleSimulateEvent = async () => {
    console.log("Simulating event:", eventsOnGameDate);

    try {
      // Simulate all fights in the event
      for (const event of eventsOnGameDate) {
        // You might have a function to simulate the fight here
        // For now, we're assuming the event has a "status" field that will be updated
        await updateEventStatus(event.id, "completed");
      }

      // After simulating all fights, skip the day
      await proceedToSkipDay();
    } catch (error) {
      console.error("Error simulating event:", error);
    }
  };

  const handlePlayEvent = () => {
    navigate(`/event/${eventsOnGameDate[0]?.id}`);
  };

  const handleEventDateClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleDateClick = (date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const formattedDate = selectedDate.toLocaleDateString("en-CA");
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

    setIsDateInputVisible(false);
  };

  const handleSkipDay = () => {
    const eventsToday = getEventsForDate(gameDate);
    if (eventsToday.some((event) => event.status === "in progress")) {
      setEventsOnGameDate(
        eventsToday.filter((e) => e.status === "in progress")
      );
      setIsModalOpen(true);
    } else if (eventsToday.every((event) => event.status === "completed")) {
      proceedToSkipDay();
    } else {
      console.error("Unexpected event status");
    }
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

    const today = new Date(gameDate);
    today.setHours(0, 0, 0, 0);

    const calendarDays = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`prev-${i}`} className="calendar-day empty" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      date.setHours(0, 0, 0, 0);

      const isToday = date.getTime() === today.getTime();
      const isPast = date.getTime() < today.getTime();
      const eventsForDate = getEventsForDate(date);

      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            isPast ? "past" : ""
          }`}
        >
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
          {!isPast && (
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
          )}
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
      <Button
        variant="contained"
        color="primary"
        onClick={handleSkipDay}
        style={{ margin: "10px 0" }}
      >
        Skip Day
      </Button>
      <div className="day-names">
        {dayNames.map((day, index) => (
          <div key={index} className="day-name">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid">{generateCalendarDays()}</div>
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Event Scheduled for Today"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            There's an event scheduled for today. Do you want to simulate the
            event or view it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSimulateEvent} color="primary">
            Simulate
          </Button>
          <Button onClick={handlePlayEvent} color="secondary">
            Play
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Calendar;
