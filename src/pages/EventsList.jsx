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
  Chip,
  Box,
  Button,
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getAllEvents, getFightsByIds, getGameDate } from "../utils/indexedDB";
import { alpha } from '@mui/material/styles';

const EventsList = () => {
  const { gameId } = useParams();
  const [events, setEvents] = useState([]);
  const [gameDate, setGameDate] = useState(null);
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

  /**
 * Determine if an event is in the past, present, or future relative to game date
 * @param {Date} eventDate - Date of the event
 * @param {Date} currentGameDate - Current game date
 * @returns {string} 'past', 'present', or 'future'
 */
const getEventTiming = (eventDate, currentGameDate) => {
  if (!eventDate || !currentGameDate) return 'future';
  
  const event = new Date(eventDate);
  const game = new Date(currentGameDate);
  
  // Reset time components for date comparison
  event.setHours(0, 0, 0, 0);
  game.setHours(0, 0, 0, 0);
  
  if (event.getTime() === game.getTime()) return 'present';
  if (event.getTime() < game.getTime()) return 'past';
  return 'future';
};

  // Load events data with fights details
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [eventsData, currentGameDate] = await Promise.all([
          getAllEvents(gameId),
          getGameDate(gameId)
        ]);
        
        // For each event, fetch its fights
        const eventsWithFights = await Promise.all(eventsData.map(async (event) => {
          const allFightIds = getAllFightsFromEvent(event);
          const fights = await getFightsByIds(allFightIds, gameId);
          const mainEvent = await getMainEvent(event, fights);
          
          return {
            ...event,
            fights,
            mainEvent
          };
        }));
  
        setEvents(eventsWithFights);
        setGameDate(new Date(currentGameDate));
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
  
    loadEvents();
  }, [gameId]);

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
          onClick={() => navigate(`/game/${gameId}/createevent`)}
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
                sx={{ 
                  cursor: 'pointer',
                  // Apply different styles based on event timing
                  ...(getEventTiming(event.date, gameDate) === 'past' && {
                    backgroundColor: alpha('#grey', 0.1),
                    '&:hover': {
                      backgroundColor: alpha('#grey', 0.2),
                    }
                  }),
                  ...(getEventTiming(event.date, gameDate) === 'present' && {
                    backgroundColor: alpha('#4CAF50', 0.1),
                    '&:hover': {
                      backgroundColor: alpha('#4CAF50', 0.2),
                    }
                  }),
                  ...(getEventTiming(event.date, gameDate) === 'future' && {
                    backgroundColor: alpha('#2196F3', 0.1),
                    '&:hover': {
                      backgroundColor: alpha('#2196F3', 0.2),
                    }
                  })
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formatDate(event.date)}
                    {getEventTiming(event.date, gameDate) === 'present' && (
                      <Chip 
                        label="TODAY" 
                        size="small" 
                        color="success"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                </TableCell>
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