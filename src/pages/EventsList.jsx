import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
} from "@mui/material";
import { getAllEvents } from "../utils/indexedDB"; // Function to get all events

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  // Load all events from IndexedDB
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await getAllEvents();
        console.log("Fetched events:", eventsData); // Debugging
        setEvents(Array.isArray(eventsData) ? eventsData : []); // Ensure it's an array
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]); // Set to empty array in case of an error
      }
    };

    loadEvents();
  }, []);

  // Handle click to navigate to the event page
  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  return (
    <Container maxWidth="md" sx={{ marginTop: "40px" }}>
      <Paper elevation={3} sx={{ padding: "20px" }}>
        <Typography variant="h4" align="center" gutterBottom>
          Events List
        </Typography>
        {events.length === 0 ? (
          <Typography variant="body1" align="center">
            No events available.
          </Typography>
        ) : (
          <List>
            {events.map((event) => (
              <ListItem
                button
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                sx={{
                  marginBottom: "10px",
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "grey.100",
                  },
                }}
              >
                <ListItemText
                  primary={`Event ${event.id}`}
                  secondary={`Number of Fights: ${event.fights.length}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default EventsList;
