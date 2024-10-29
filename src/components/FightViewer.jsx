import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Grid } from '@mui/material';
import ActiveFighterCard from './ActiveFighterCard';
import EventLoggerCard from './EventLoggerCard';
import { formatFightEvent, formatFightTime } from '../engine/fightEventFormatter';

const FightViewer = ({ fightEvents = [], fighters = [] }) => {
  // Core playback state
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [isFightComplete, setIsFightComplete] = useState(false);

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

  // Helper to check if an event is a fight ending event
  const isFightEndingEvent = useCallback((event) => {
    return event?.type === 'fightEnd' || 
           (event?.method === 'Knockout' || event?.method === 'Submission');
  }, []);

  // Initialize fight data and determine total rounds
  useEffect(() => {
    if (Array.isArray(fightEvents) && fightEvents.length > 0) {
      const maxRound = fightEvents.reduce((max, event) => 
        event?.round && typeof event.round === 'number' ? Math.max(max, event.round) : max, 1);
      setTotalRounds(maxRound);
    }
  }, [fightEvents]);

  // Update fight statistics based on event type
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

  // Process and display event
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

    // Helper function to find fight ending event within a specific range
    const findFightEnd = (startIndex, endIndex) => {
      for (let i = startIndex; i <= endIndex && i < fightEvents.length; i++) {
        if (isFightEndingEvent(fightEvents[i])) {
          return i + 1 < fightEvents.length ? i + 1 : i;
        }
      }
      return -1;
    };

    // Helper function to process events up to an index
    const processEventsUpTo = (targetIndex) => {
      if (targetIndex !== -1) {
        for (let i = 0; i <= targetIndex; i++) {
          processEvent(fightEvents[i]);
        }
        setCurrentEventIndex(targetIndex + 1);
        
        // Check if this was the end of the fight
        if (isFightEndingEvent(fightEvents[targetIndex])) {
          setIsFightComplete(true);
        }
      }
    };

    // Helper function to find target index for time skip
    const findTimeSkipTarget = (currentRoundNum, currentTime, skipSeconds) => {
      const targetTime = currentTime - skipSeconds;
      
      // If target time would go into next round
      if (targetTime <= 0) {
        const nextRound = currentRoundNum + 1;
        return findRoundStart(nextRound);
      }

      // Find event closest to target time in current round
      return fightEvents.findIndex(event => 
        event?.round === currentRoundNum && 
        event?.clock && 
        event.clock <= targetTime
      );
    };

    // Find current time in the round (if in a round)
    const getCurrentTime = () => {
      if (!isPreFight && currentEventIndex > 0) {
        const currentEvent = fightEvents[currentEventIndex - 1];
        return currentEvent?.clock || 300;
      }
      return 300;
    };

    if (skipValue === 'startfight') {
      const roundStartIndex = findRoundStart(1);
      if (roundStartIndex !== -1) {
        processEventsUpTo(roundStartIndex);
      }
      return;
    }

    if (skipValue === 'entirefight') {
      processEventsUpTo(fightEvents.length - 1);
      return;
    }

    if (!isPreFight) {
      switch (skipValue) {
        case '1min':
        case '2min': {
          const skipSeconds = skipValue === '1min' ? 60 : 120;
          const currentTime = getCurrentTime();
          
          // Find where we would skip to based on time
          const targetIndex = findTimeSkipTarget(currentRound, currentTime, skipSeconds);
          
          if (targetIndex !== -1) {
            // Look for fight end only between current position and target
            const fightEndIndex = findFightEnd(currentEventIndex, targetIndex);
            
            if (fightEndIndex !== -1) {
              // Fight ends within our skip period
              processEventsUpTo(fightEndIndex);
            } else {
              // No fight end, process to target
              processEventsUpTo(targetIndex);
            }
          }
          break;
        }

        case 'endround': {
          // Find start of next round
          const nextRound = currentRound + 1;
          const nextRoundStart = findRoundStart(nextRound);
          
          if (nextRoundStart !== -1) {
            // Look for fight end only between current position and next round
            const fightEndIndex = findFightEnd(currentEventIndex, nextRoundStart);
            
            if (fightEndIndex !== -1) {
              // Fight ends before next round
              processEventsUpTo(fightEndIndex);
            } else {
              // No fight end, go to next round
              processEventsUpTo(nextRoundStart);
            }
          }
          break;
        }

        default:
          return;
      }
    }
  }, [fightEvents, currentRound, currentEventIndex, isPreFight, processEvent, isFightEndingEvent]);

  // Effect to check if we've reached the end of the fight
  useEffect(() => {
    if (currentEventIndex > 0 && currentEventIndex <= fightEvents.length) {
      const currentEvent = fightEvents[currentEventIndex - 1];
      if (isFightEndingEvent(currentEvent)) {
        setIsFightComplete(true);
      }
    }
  }, [currentEventIndex, fightEvents, isFightEndingEvent]);

  // Auto-scroll effect for event log
  useEffect(() => {
    if (eventDisplayRef.current) {
      const scrollHeight = eventDisplayRef.current.scrollHeight;
      eventDisplayRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [displayedEvents]);

  // Playback interval effect
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

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSpeedDecrease = () => setPlaybackSpeed(prev => Math.max(0.5, prev - 0.5));
  const handleSpeedIncrease = () => setPlaybackSpeed(prev => Math.min(4, prev + 0.5));

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
            isFightComplete={isFightComplete}
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