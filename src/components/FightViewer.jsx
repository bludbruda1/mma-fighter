import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
} from '@mui/material';
import { PlayCircleOutline, PauseCircleOutline, FastForward, FastRewind } from '@mui/icons-material';
import StatBar from "./StatBar";
import { formatFightEvent, formatFightTime } from '../engine/fightEventFormatter';

const FightViewer = ({ fightEvents, fighters }) => {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    strikesLanded: [0, 0],
    takedownsLanded: [0, 0],
    significantStrikes: [0, 0],
    submissionAttempts: [0, 0],
  });

  const eventDisplayRef = useRef(null);

  // Update stats based on event type
  const updateStats = useCallback((event) => {
    if (!event) return;

    setCurrentStats(prev => {
      const newStats = { ...prev };

      switch (event.type) {
        case 'strike':
          if (event.outcome === 'landed') {
            const attackerIndex = event.attackerId;
            newStats.strikesLanded[attackerIndex]++;
            if (event.damage > 5) {
              newStats.significantStrikes[attackerIndex]++;
            }
          }
          break;
        case 'takedown':
          if (event.outcome === 'successful') {
            newStats.takedownsLanded[event.attackerId]++;
          }
          break;
        case 'submission':
          if (event.stage === 'attempt') {
            newStats.submissionAttempts[event.attackerId]++;
          }
          break;
        default:
          break;
      }

      return newStats;
    });
  }, []);

  // Format and display event
  const processEvent = useCallback((event) => {
    if (!event) return;

    const formattedEvent = formatFightEvent(event);
    if (formattedEvent) {
      setDisplayedEvents(prev => [...prev, {
        timeStr: formatFightTime(event.round, event.formattedTime),
        action: formattedEvent
      }]);
    }
    updateStats(event);
  }, [updateStats]);

  // Simple auto-scroll effect that triggers when displayedEvents changes
  useEffect(() => {
    if (eventDisplayRef.current) {
      const scrollHeight = eventDisplayRef.current.scrollHeight;
      eventDisplayRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [displayedEvents]);

  // Advance to next event
  const advanceEvent = useCallback(() => {
    if (currentEventIndex < fightEvents.length) {
      const event = fightEvents[currentEventIndex];
      processEvent(event);
      setCurrentEventIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentEventIndex, fightEvents, processEvent]);

  // Handle playback
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        advanceEvent();
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, advanceEvent]);

  // Fighter card component
  const FighterCard = ({ fighter, index }) => (
    <Card className="h-full">
      <CardMedia
        component="img"
        height="200"
        image={fighter.profile}
        alt={`${fighter.firstname} ${fighter.lastname}`}
        sx={{ objectFit: "contain" }}
      />
      <CardContent>
        <Typography variant="h6" align="center">
          {fighter.firstname} {fighter.lastname}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Fight Stats:</Typography>
          <StatBar
            redValue={currentStats.strikesLanded[index]}
            blueValue={currentStats.strikesLanded[1 - index]}
            title="Strikes Landed"
          />
          <StatBar
            redValue={currentStats.significantStrikes[index]}
            blueValue={currentStats.significantStrikes[1 - index]}
            title="Significant Strikes"
          />
          <StatBar
            redValue={currentStats.takedownsLanded[index]}
            blueValue={currentStats.takedownsLanded[1 - index]}
            title="Takedowns"
          />
          <StatBar
            redValue={currentStats.submissionAttempts[index]}
            blueValue={currentStats.submissionAttempts[1 - index]}
            title="Submission Attempts"
          />
        </Box>
      </CardContent>
    </Card>
  );

  // Event display component
  const EventDisplay = () => (
    <Card className="h-full">
      <CardContent>
        {/* Playback Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          justifyContent: 'center',
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          mb: 2
        }}>
          <FastRewind 
            sx={{ cursor: 'pointer' }}
            onClick={() => setPlaybackSpeed(prev => Math.max(0.5, prev - 0.5))}
          />
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            startIcon={isPlaying ? <PauseCircleOutline /> : <PlayCircleOutline />}
            variant="contained"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <FastForward 
            sx={{ cursor: 'pointer' }}
            onClick={() => setPlaybackSpeed(prev => Math.min(4, prev + 0.5))}
          />
          <Chip 
            label={`${playbackSpeed}x`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Event Log */}
        <Box 
          ref={eventDisplayRef}
          sx={{ 
            height: '50vh', 
            overflowY: 'auto',
            backgroundColor: 'background.paper',
            p: 2,
            borderRadius: 1
          }}
        >
          {displayedEvents.map((event, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  mb: 0.5
                }}
              >
                {event.timeStr}
              </Typography>
              <Typography 
                sx={{ 
                  color: 'text.primary',
                  fontSize: '1rem',
                  mb: 1
                }}
              >
                {event.action}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <FighterCard fighter={fighters[0]} index={0} />
        </Grid>
        <Grid item xs={12} md={6}>
          <EventDisplay />
        </Grid>
        <Grid item xs={12} md={3}>
          <FighterCard fighter={fighters[1]} index={1} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default FightViewer;