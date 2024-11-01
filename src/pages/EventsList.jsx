import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Box,
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                  primary={
                    <Typography variant="h6" component="div">
                      {event.name || `Event ${event.id}`}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {event.date && formatDate(event.date)}
                      </Typography>
                      <Typography variant="body2">
                        {`${event.fights.length} Fight${event.fights.length !== 1 ? 's' : ''} Scheduled`}
                      </Typography>
                    </Box>
                  }
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
