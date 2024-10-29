import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Grid } from '@mui/material';
import ActiveFighterCard from './ActiveFighterCard';
import EventLoggerCard from './EventLoggerCard';
import { formatFightEvent, formatFightTime } from '../engine/fightEventFormatter';

/**
 * FightViewer Component
 * Provides an interactive viewer for simulated MMA fights with playback controls
 * 
 * @param {Object[]} fightEvents - Array of fight events to display
 * @param {Object[]} fighters - Array of fighter objects (typically 2 fighters)
 */
const FightViewer = ({ fightEvents = [], fighters = [] }) => {
  // Core playback state
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [displayedEvents, setDisplayedEvents] = useState([]);

  // Fight progress state
  const [currentRound, setCurrentRound] = useState(0); // 0 represents pre-fight
  const [isPreFight, setIsPreFight] = useState(true);
  const [totalRounds, setTotalRounds] = useState(1);

  // Fighter statistics state
  const [currentStats, setCurrentStats] = useState({
    strikesLanded: [0, 0],
    takedownsLanded: [0, 0],
    significantStrikes: [0, 0],
    submissionAttempts: [0, 0],
  });

  // Refs for DOM elements and intervals
  const eventDisplayRef = useRef(null);
  const playbackInterval = useRef(null);

  /**
   * Initialize fight data and determine total rounds
   */
  useEffect(() => {
    if (Array.isArray(fightEvents) && fightEvents.length > 0) {
      const maxRound = fightEvents.reduce((max, event) => 
        event?.round && typeof event.round === 'number' ? Math.max(max, event.round) : max, 1);
      setTotalRounds(maxRound);
    }
  }, [fightEvents]);

  /**
   * Update fight statistics based on event type
   */
  const updateStats = useCallback((event) => {
    if (!event || !Array.isArray(fighters)) return;

    setCurrentStats(prev => {
      const newStats = { ...prev };

      // Helper function to find fighter index
      const getAttackerIndex = (attackerId) => {
        return fighters.findIndex(f => 
          f && (f.personid === attackerId || f.id === attackerId)
        );
      };

      switch (event.type) {
        case 'strike':
          if (event.outcome === 'landed' && event.attackerId !== undefined) {
            const attackerIndex = getAttackerIndex(event.attackerId);
            if (attackerIndex !== -1) {
              newStats.strikesLanded[attackerIndex] = (newStats.strikesLanded[attackerIndex] || 0) + 1;
              if (event.damage > 5) {
                newStats.significantStrikes[attackerIndex] = (newStats.significantStrikes[attackerIndex] || 0) + 1;
              }
            }
          }
          break;

        case 'takedown':
          if (event.outcome === 'successful' && event.attackerId !== undefined) {
            const attackerIndex = getAttackerIndex(event.attackerId);
            if (attackerIndex !== -1) {
              newStats.takedownsLanded[attackerIndex] = (newStats.takedownsLanded[attackerIndex] || 0) + 1;
            }
          }
          break;

        case 'submission':
          if (event.stage === 'attempt' && event.attackerId !== undefined) {
            const attackerIndex = getAttackerIndex(event.attackerId);
            if (attackerIndex !== -1) {
              newStats.submissionAttempts[attackerIndex] = (newStats.submissionAttempts[attackerIndex] || 0) + 1;
            }
          }
          break;

        default:
          break;
      }

      return newStats;
    });
  }, [fighters]);

  /**
   * Process a single fight event and update the display
   */
  const processEvent = useCallback((event) => {
    if (!event) return;

    // Update round tracking
    if (event.type === 'roundStart' && typeof event.round === 'number') {
      setCurrentRound(event.round);
      setIsPreFight(false);
    } else if (event.type === 'introduction') {
      setIsPreFight(true);
      setCurrentRound(0);
    }

    // Format and add event to display
    const formattedEvent = formatFightEvent(event);
    if (formattedEvent) {
      setDisplayedEvents(prev => [...prev, {
        timeStr: formatFightTime(event.round || 'introduction', event.formattedTime || '0:00'),
        action: formattedEvent,
        roundNumber: event.round || 0
      }]);
    }
    updateStats(event);
  }, [updateStats]);

  /**
   * Handle time-based skipping through the fight
   */
  const handleTimeSkip = useCallback((skipValue) => {
    if (!Array.isArray(fightEvents)) return;
    
    setIsPlaying(false);
    setDisplayedEvents([]);
    setCurrentStats({
      strikesLanded: [0, 0],
      takedownsLanded: [0, 0],
      significantStrikes: [0, 0],
      submissionAttempts: [0, 0],
    });

    // Helper function to find the first event of a specific round
    const findRoundStart = (roundNumber) => {
      return fightEvents.findIndex(event =>
        event?.type === 'roundStart' && event?.round === roundNumber
      );
    };

    // Helper function to process events up to an index
    const processEventsUpTo = (targetIndex) => {
      if (targetIndex !== -1) {
        for (let i = 0; i <= targetIndex; i++) {
          processEvent(fightEvents[i]);
        }
        setCurrentEventIndex(targetIndex + 1);
      }
    };

    // Find current time in the round (when in fight)
    const getCurrentTime = () => {
      if (!isPreFight && currentEventIndex > 0) {
        const currentEvent = fightEvents[currentEventIndex - 1];
        return currentEvent?.clock || 300; // Default to start of round
      }
      return 300; // Default to start of round
    };

    if (skipValue === 'startfight') {
      // Skip to first action of round 1
      const roundStartIndex = findRoundStart(1);
      if (roundStartIndex !== -1) {
        processEventsUpTo(roundStartIndex);
      }
      return;
    }

    if (skipValue === 'entirefight') {
      // Process all events
      processEventsUpTo(fightEvents.length - 1);
      return;
    }

    if (!isPreFight) {
      switch (skipValue) {
        case '1min':
        case '2min': {
          const skipSeconds = skipValue === '1min' ? 60 : 120;
          const currentTime = getCurrentTime();
          const targetTime = currentTime - skipSeconds;
  
          if (targetTime <= 0) {
            // Need to go to next round
            const nextRound = currentRound + 1;
            const nextRoundStart = findRoundStart(nextRound);
            if (nextRoundStart !== -1) {
              processEventsUpTo(nextRoundStart);
            }
          } else {
            // Find event closest to target time in current round
            const targetIndex = fightEvents.findIndex(event => 
              event?.round === currentRound && 
              event?.clock && 
              event.clock <= targetTime
            );
            if (targetIndex !== -1) {
              processEventsUpTo(targetIndex);
            }
          }
          break;
        }
  
        case 'endround': {
          // Skip to the first action of next round
          const nextRound = currentRound + 1;
          const nextRoundStart = findRoundStart(nextRound);
          if (nextRoundStart !== -1) {
            processEventsUpTo(nextRoundStart);
          }
          break;
        }
  
        default:
          return;
      }
    }
  }, [fightEvents, currentRound, currentEventIndex, isPreFight, processEvent]);

  /**
   * Playback control handlers
   */
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSpeedDecrease = () => setPlaybackSpeed(prev => Math.max(0.5, prev - 0.5));
  const handleSpeedIncrease = () => setPlaybackSpeed(prev => Math.min(4, prev + 0.5));

  /**
   * Auto-scroll effect for event log
   */
  useEffect(() => {
    if (eventDisplayRef.current) {
      const scrollHeight = eventDisplayRef.current.scrollHeight;
      eventDisplayRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [displayedEvents]);

  /**
   * Playback interval effect
   */
  useEffect(() => {
    if (isPlaying && Array.isArray(fightEvents)) {
      playbackInterval.current = setInterval(() => {
        if (currentEventIndex < fightEvents.length) {
          processEvent(fightEvents[currentEventIndex]);
          setCurrentEventIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1000 / playbackSpeed);
    }

    // Cleanup interval on unmount or when playback stops
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentEventIndex, fightEvents, processEvent]);

  // Early return if required data is missing
  if (!Array.isArray(fighters) || fighters.length < 2) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ActiveFighterCard 
            fighter={fighters[0] || {}}
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
            currentRound={currentRound}
            totalRounds={totalRounds}
            onPlayPauseClick={handlePlayPause}
            onSpeedDecrease={handleSpeedDecrease}
            onSpeedIncrease={handleSpeedIncrease}
            onSkipTime={handleTimeSkip}
            isPreFight={isPreFight}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <ActiveFighterCard 
            fighter={fighters[1] || {}}
            index={1}
            currentStats={currentStats}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default FightViewer;