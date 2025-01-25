import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Button,
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getAllEvents, getFightsByIds } from "../utils/indexedDB";

const EventsList = () => {
  const { gameId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Add sorting state
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc'); // Default to newest first
  const navigate = useNavigate();

  // Function to get all fights from an event
  const getAllFightsFromEvent = (event) => {
    // Handle old format (array)
    if (Array.isArray(event.fights)) {
      return event.fights;
    }

    // Handle new format (object with card types)
    return [
      ...(event.fights.mainCard || []),
      ...(event.fights.prelims || []),
      ...(event.fights.earlyPrelims || [])
    ];
  };

  // Function to get main event from fight list
  const getMainEvent = async (event, fights) => {
    // For new format, main event is first fight of main card
    if (!Array.isArray(event.fights) && event.fights.mainCard?.length > 0) {
      return fights.find(fight => fight.id === event.fights.mainCard[0]) || null;
    }
    // For old format, main event is first fight
    return fights[0] || null;
  };

  // Load events data with fights details
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await getAllEvents(gameId);
        
        // For each event, fetch its fights
        const eventsWithFights = await Promise.all(eventsData.map(async (event) => {
          const allFightIds = getAllFightsFromEvent(event, gameId);
          const fights = await getFightsByIds(allFightIds, gameId);
          const mainEvent = await getMainEvent(event, fights, gameId);
          
          return {
            ...event,
            fights,
            mainEvent
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

  // Update the fight count calculation in the render
  const getFightCount = (event) => {
    const allFights = getAllFightsFromEvent(event);
    return allFights.length;
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
            {/* Header section with title and create button */}
            <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/game/${gameId}/createevent')}
          sx={{
            backgroundColor: "rgba(33, 33, 33, 0.9)",
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(33, 33, 33, 0.7)",
            },
          }}
        >
          Create Event
        </Button>
      </Box>

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
                  No. of Fights
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
                onClick={() => navigate(`/game/${gameId}/event/${event.id}`)}
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
                <TableCell>{getFightCount(event)}</TableCell>
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