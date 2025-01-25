import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAllEvents, getGameDate, getAllFights } from "../utils/indexedDB"; // Import getGameDate
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./Calendar.css";
import { TextField, FormControl, Tooltip, IconButton } from "@mui/material";
import { green } from "@mui/material/colors";
import AddCircleIcon from "@mui/icons-material/AddCircle";

const Calendar = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDateInputVisible, setIsDateInputVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fights, setFights] = useState([]);


  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Array of day names

  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        const gameDate = await getGameDate(gameId);
        const initialDate = new Date(gameDate);
        setCurrentDate(initialDate);
        setSelectedDate(initialDate.toISOString().split("T")[0]);
  
        // Fetch both events and fights
        const [eventData, fightData] = await Promise.all([
          getAllEvents(gameId),
          getAllFights(gameId)
        ]);
        setEvents(eventData);
        setFights(fightData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    initializeCalendar();
  }, []);

    // function to check if an event is completed
    const isEventCompleted = (event) => {
      if (!event || !event.fights) return false;
    
      // Helper function to check if all fights in a card are completed
      const areAllFightsCompleted = (fightIds) => {
        if (!Array.isArray(fightIds)) return true; // If card doesn't exist, consider it complete
        return fightIds.every(fightId => {
          const fight = fights.find(f => f.id === fightId);
          return fight && fight.result;
        });
      };
    
      // Check if event.fights is the old format (array)
      if (Array.isArray(event.fights)) {
        return event.fights.every(fightId => {
          const fight = fights.find(f => f.id === fightId);
          return fight && fight.result;
        });
      }
    
      // Check new format (object with card properties)
      return areAllFightsCompleted(event.fights.mainCard) &&
             areAllFightsCompleted(event.fights.prelims) &&
             areAllFightsCompleted(event.fights.earlyPrelims);
    };

    const formatDateForComparison = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const getEventsForDate = (date) => {
      const formattedDate = formatDateForComparison(date);
      return events.filter(event => {
        const eventDate = formatDateForComparison(new Date(event.date));
        return eventDate === formattedDate;
      }).map(event => ({
        ...event,
        isCompleted: isEventCompleted(event)
      }));
    };

  const handleEventDateClick = (eventId) => {
    navigate(`/game/${gameId}/event/${eventId}`);
  };

  const handleDateClick = (date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const formattedDate = selectedDate.toLocaleDateString("en-CA");
    navigate(`/game/${gameId}/createevent?date=${formattedDate}`);
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

      const eventsForDate = getEventsForDate(date);
      calendarDays.push(
        <div key={day} className="calendar-day">
          <span>{day}</span>
          {eventsForDate.map((event) => (
            <button
              key={event.id}
              onClick={() => handleEventDateClick(event.id)}
              className={`event-button ${event.isCompleted ? 'completed' : ''}`}
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
      <div className="day-names">
        {dayNames.map((day, index) => (
          <div key={index} className="day-name">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid">{generateCalendarDays()}</div>
    </div>
  );
};

export default Calendar;
