import React, { useState, useEffect, useCallback } from 'react';
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

  // Convert event to display text with fight stats tracking
  const formatEvent = useCallback((event) => {
    const timeStr = `R${event.round} ${event.formattedTime}`;
    
    switch (event.type) {
      case 'strike':
        if (event.outcome === 'landed') {
          setCurrentStats(prev => ({
            ...prev,
            strikesLanded: [
              prev.strikesLanded[0] + (event.attackerId === 0 ? 1 : 0),
              prev.strikesLanded[1] + (event.attackerId === 1 ? 1 : 0),
            ],
            significantStrikes: [
              prev.significantStrikes[0] + (event.attackerId === 0 && event.damage > 5 ? 1 : 0),
              prev.significantStrikes[1] + (event.attackerId === 1 && event.damage > 5 ? 1 : 0),
            ],
          }));
        }
        return `[${timeStr}] ${fighters[event.attackerId].firstname} throws a ${event.strikeType} - ${event.outcome.toUpperCase()}${event.damage ? ` (${event.damage} damage)` : ''}`;
        
      case 'takedown':
        if (event.outcome === 'successful') {
          setCurrentStats(prev => ({
            ...prev,
            takedownsLanded: [
              prev.takedownsLanded[0] + (event.attackerId === 0 ? 1 : 0),
              prev.takedownsLanded[1] + (event.attackerId === 1 ? 1 : 0),
            ],
          }));
        }
        return `[${timeStr}] ${fighters[event.attackerId].firstname} attempts a ${event.takedownType} - ${event.outcome.toUpperCase()}`;
        
      case 'submission':
        if (event.stage === 'attempt') {
          setCurrentStats(prev => ({
            ...prev,
            submissionAttempts: [
              prev.submissionAttempts[0] + (event.attackerId === 0 ? 1 : 0),
              prev.submissionAttempts[1] + (event.attackerId === 1 ? 1 : 0),
            ],
          }));
        }
        return `[${timeStr}] ${fighters[event.attackerId].firstname} attempts a ${event.submissionType} - ${event.stage.toUpperCase()}`;
        
      case 'roundStart':
        return `[${timeStr}] Round ${event.round} begins!`;
        
      case 'roundEnd':
        return `[${timeStr}] End of Round ${event.round}`;
        
      case 'fightEnd':
        return `[${timeStr}] Fight Over - ${fighters[event.winnerId].firstname} wins by ${event.method}`;
        
      default:
        return `[${timeStr}] ${JSON.stringify(event)}`;
    }
  }, [fighters]);

  // Advance to next event
  const advanceEvent = useCallback(() => {
    if (currentEventIndex < fightEvents.length) {
      const event = fightEvents[currentEventIndex];
      setDisplayedEvents(prev => [...prev, formatEvent(event)]);
      setCurrentEventIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentEventIndex, fightEvents, formatEvent]);

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

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Fighter Cards */}
        <Grid item xs={12} container spacing={2} justifyContent="space-between">
          {fighters.map((fighter, index) => (
            <Grid item xs={12} md={5} key={fighter.personid}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={fighter.image}
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
            </Grid>
          ))}
        </Grid>

        {/* Playback Controls */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            justifyContent: 'center',
            p: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1,
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
        </Grid>

        {/* Event Display */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ 
                height: '40vh', 
                overflowY: 'auto',
                backgroundColor: 'background.paper',
                p: 2,
                borderRadius: 1,
              }}>
                {displayedEvents.map((event, index) => (
                  <Typography 
                    key={index} 
                    sx={{ 
                      py: 0.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {event}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FightViewer;