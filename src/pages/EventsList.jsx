import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Tooltip,
  Box,
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getAllEvents, getFightsByIds } from "../utils/indexedDB";

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Add sorting state
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc'); // Default to newest first
  const navigate = useNavigate();

  // Load events data with fights details
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await getAllEvents();
        
        // For each event, fetch its fights
        const eventsWithFights = await Promise.all(eventsData.map(async (event) => {
          const fights = await getFightsByIds(event.fights);
          return {
            ...event,
            fights,
            // Find main event (last fight in the card)
            mainEvent: fights[fights.length - 1]
          };
        }));

        setEvents(eventsWithFights);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Handle sort request
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Create sort handler
  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format main event display
  const formatMainEvent = (mainEvent) => {
    if (!mainEvent) return "No fights scheduled";

    const fighter1 = `${mainEvent.fighter1.firstname} ${mainEvent.fighter1.lastname}`;
    const fighter2 = `${mainEvent.fighter2.firstname} ${mainEvent.fighter2.lastname}`;

    if (mainEvent.result) {
      const winner = mainEvent.result.winner === 0 ? fighter1 : fighter2;
      const loser = mainEvent.result.winner === 0 ? fighter2 : fighter1;
      return `${winner} def. ${loser} by ${mainEvent.result.method}`;
    }

    return `${fighter1} vs ${fighter2}`;
  };

  // Sort function for different data types
  const sortData = (a, b) => {
    switch (orderBy) {
      case 'date':
        return (new Date(a.date) - new Date(b.date)) * (order === 'asc' ? 1 : -1);
      case 'name':
        return (a.name || '').localeCompare(b.name || '') * (order === 'asc' ? 1 : -1);
      case 'fights':
        return (a.fights.length - b.fights.length) * (order === 'asc' ? 1 : -1);
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography>Loading events...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Events
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={createSortHandler('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={createSortHandler('name')}
                >
                  Event Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'fights'}
                  direction={orderBy === 'fights' ? order : 'asc'}
                  onClick={createSortHandler('fights')}
                >
                  Fights
                </TableSortLabel>
              </TableCell>
              <TableCell>Main Event</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...events].sort(sortData).map((event) => (
              <TableRow
                key={event.id}
                hover
                onClick={() => navigate(`/event/${event.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{formatDate(event.date)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {event.mainEvent?.championship && (
                      <Tooltip title={event.mainEvent.championship.name} arrow>
                        <EmojiEventsIcon sx={{ color: 'gold' }} />
                      </Tooltip>
                    )}
                    {event.name}
                  </Box>
                </TableCell>
                <TableCell>{event.fights.length}</TableCell>
                <TableCell>{formatMainEvent(event.mainEvent)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default EventsList;