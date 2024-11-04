// src/components/Calendar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllEvents } from "../utils/indexedDB"; // Function to get all events from IndexedDB
import "./Calendar.css";

const Calendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Load all events from IndexedDB when the component mounts
    const loadEvents = async () => {
      const eventData = await getAllEvents();
      setEvents(eventData);
    };
    loadEvents();
  }, []);

  // Utility to get events for a specific day
  const getEventsForDate = (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === formattedDate);
  };

  // Handle click on a date with an event
  const handleDateClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  // Generate the days of the month for display
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

    // Fill in days from the previous month if the first day is not Sunday
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`prev-${i}`} className="calendar-day empty" />
      );
    }

    // Fill in days for the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const eventsForDate = getEventsForDate(date);
      calendarDays.push(
        <div key={day} className="calendar-day">
          <span>{day}</span>
          {eventsForDate.map((event) => (
            <button
              key={event.id}
              onClick={() => handleDateClick(event.id)}
              className="event-button"
            >
              Event {event.id}
            </button>
          ))}
        </div>
      );
    }
    return calendarDays;
  };

  return (
    <div className="calendar-container">
      <h2>
        {currentDate.toLocaleString("default", { month: "long" })}{" "}
        {currentDate.getFullYear()}
      </h2>
      <div className="calendar-grid">{generateCalendarDays()}</div>
    </div>
  );
};

export default Calendar;
