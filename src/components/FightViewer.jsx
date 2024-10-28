import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Grid } from '@mui/material';
import ActiveFighterCard from './ActiveFighterCard';
import EventLoggerCard from './EventLoggerCard';
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

  // Auto-scroll effect
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

  // Playback control handlers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSpeedDecrease = () => setPlaybackSpeed(prev => Math.max(0.5, prev - 0.5));
  const handleSpeedIncrease = () => setPlaybackSpeed(prev => Math.min(4, prev + 0.5));

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ActiveFighterCard 
            fighter={fighters[0]} 
            index={0} 
            currentStats={currentStats}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <EventLoggerCard
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            displayedEvents={displayedEvents}
            eventDisplayRef={eventDisplayRef}
            onPlayPauseClick={handlePlayPause}
            onSpeedDecrease={handleSpeedDecrease}
            onSpeedIncrease={handleSpeedIncrease}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <ActiveFighterCard 
            fighter={fighters[1]} 
            index={1} 
            currentStats={currentStats}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default FightViewer;