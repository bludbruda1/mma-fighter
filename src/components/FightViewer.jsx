import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Grid } from '@mui/material';
import ActiveFighterCard from './ActiveFighterCard';
import EventLoggerCard from './EventLoggerCard';
import { formatFightEvent, formatFightTime } from '../engine/fightEventFormatter';

/**
 * FightViewer Component
 * Manages and displays the progress of a fight simulation including fighter stats,
 * health, positions, and play-by-play events
 * 
 * @param {Object[]} fightEvents - Array of events from the fight simulation
 * @param {Object[]} fighters - Array of fighter data objects
 */
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

  // Fighter position state - tracks the current position of each fighter
  const [fighterPositions, setFighterPositions] = useState([
    'STANDING',
    'STANDING'
  ]);

  // Fighter statistics state
  const [currentStats, setCurrentStats] = useState({
    strikesLanded: [0, 0],
    takedownsLanded: [0, 0],
    significantStrikes: [0, 0],
    submissionAttempts: [0, 0],
  });

  // Fighter health state
  const [fighterHealth, setFighterHealth] = useState([
    { head: 100, body: 100, legs: 100 },
    { head: 100, body: 100, legs: 100 }
  ]);

  // Refs for DOM elements and intervals
  const eventDisplayRef = useRef(null);
  const playbackInterval = useRef(null);

  /**
   * Checks if an event ends the fight
   */
  const isFightEndingEvent = useCallback((event) => {
    return event?.type === 'fightEnd' || 
           (event?.method === 'Knockout' || event?.method === 'Submission');
  }, []);

  /**
   * Updates fight statistics based on event type
   */
  const updateStats = useCallback((event) => {
    if (!event || !Array.isArray(fighters)) return;

    setCurrentStats(prev => {
      const newStats = { ...prev };
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
   * Processes a single event and updates fight state accordingly
   */
  const processEvent = useCallback((event, healthState) => {
    if (!event) return healthState;

    let newHealth = JSON.parse(JSON.stringify(healthState));

    // Handle fighterState events for position updates
    if (event.type === 'fighterState') {
      setFighterPositions(prevPositions => {
        const newPositions = [...prevPositions];
        const fighterIndex = fighters.findIndex(f => 
          f && (f.personid === event.fighterId || f.id === event.fighterId)
        );
        
        if (fighterIndex !== -1 && event.position) {
          newPositions[fighterIndex] = event.position;
        }
        return newPositions;
      });
    }

    // Handle position change events
    if (event.type === 'position') {
      setFighterPositions(prevPositions => {
        const newPositions = [...prevPositions];
        const attackerIndex = fighters.findIndex(f => 
          f && (f.personid === event.attackerId || f.id === event.attackerId)
        );
        const defenderIndex = fighters.findIndex(f => 
          f && (f.personid === event.defenderId || f.id === event.defenderId)
        );
        
        if (attackerIndex !== -1) {
          newPositions[attackerIndex] = event.attackerPosition;
        }
        if (defenderIndex !== -1) {
          newPositions[defenderIndex] = event.defenderPosition;
        }
        return newPositions;
      });
    }

    // Handle clinch events
    if (event.type === 'clinch' && event.outcome === 'successful') {
      setFighterPositions(prevPositions => {
        const newPositions = [...prevPositions];
        const attackerIndex = fighters.findIndex(f => 
          f && (f.personid === event.attackerId || f.id === event.attackerId)
        );
        const defenderIndex = fighters.findIndex(f => 
          f && (f.personid === event.defenderId || f.id === event.defenderId)
        );
        
        if (attackerIndex !== -1) {
          newPositions[attackerIndex] = 'CLINCH_OFFENCE';
        }
        if (defenderIndex !== -1) {
          newPositions[defenderIndex] = 'CLINCH_DEFENCE';
        }
        return newPositions;
      });
    }

    // Handle takedown events
    if (event.type === 'takedown' && event.outcome === 'successful') {
      setFighterPositions(prevPositions => {
        const newPositions = [...prevPositions];
        const attackerIndex = fighters.findIndex(f => 
          f && (f.personid === event.attackerId || f.id === event.attackerId)
        );
        const defenderIndex = fighters.findIndex(f => 
          f && (f.personid === event.defenderId || f.id === event.defenderId)
        );
        
        if (attackerIndex !== -1) {
          newPositions[attackerIndex] = 'GROUND_FULL_GUARD_TOP';
        }
        if (defenderIndex !== -1) {
          newPositions[defenderIndex] = 'GROUND_FULL_GUARD_BOTTOM';
        }
        return newPositions;
      });
    }

    // Reset positions on round start
    if (event.type === 'roundStart') {
      setFighterPositions(['STANDING', 'STANDING']);
    }

    // Handle strike damage
    if (event?.type === 'strike' && event.outcome === 'landed' && event.damage && event.target) {
      const defenderIndex = fighters.findIndex(f => 
        f && (f.personid === event.defenderId || f.id === event.defenderId)
      );
      
      if (defenderIndex !== -1) {
        const damageAmount = Number(event.damage) || 0;
        newHealth[defenderIndex] = {
          ...newHealth[defenderIndex],
          [event.target]: Math.max(0, newHealth[defenderIndex][event.target] - damageAmount)
        };
      }
    }

    // Handle submission attempts and success
    if (event.type === 'submission' && event.stage === 'success') {
      setIsFightComplete(true);
    }

    // Update round tracking
    if (event.type === 'roundStart' && typeof event.round === 'number') {
      setCurrentRound(event.round);
      setIsPreFight(false);
    } else if (event.type === 'introduction') {
      setIsPreFight(true);
      setCurrentRound(0);
    }

    // Add event to display
    const formattedEvent = formatFightEvent(event);
    if (formattedEvent) {
      setDisplayedEvents(prev => [...prev, {
        timeStr: formatFightTime(event.round || 'introduction', event.formattedTime || '0:00'),
        action: formattedEvent,
        roundNumber: event.round || 0
      }]);
    }

    updateStats(event);
    return newHealth;
  }, [fighters, updateStats]);

  /**
   * Handles various time skip options during playback
   */
  const handleTimeSkip = useCallback((skipValue) => {
    if (!Array.isArray(fightEvents)) return;

    // Reset display state
    setIsPlaying(false);
    setDisplayedEvents([]);
    setCurrentStats({
      strikesLanded: [0, 0],
      takedownsLanded: [0, 0],
      significantStrikes: [0, 0],
      submissionAttempts: [0, 0],
    });

  const findRoundStart = (roundNumber) => {
    return fightEvents.findIndex(event => 
      event?.type === 'roundStart' && event?.round === roundNumber
    );
  };

  // Process events up to a target index
  const processEventsUpTo = (targetIndex) => {
    if (targetIndex !== -1) {
      let currentHealth = [
        { head: 100, body: 100, legs: 100 },
        { head: 100, body: 100, legs: 100 }
      ];
      
      setDisplayedEvents([]);
      setCurrentStats({
        strikesLanded: [0, 0],
        takedownsLanded: [0, 0],
        significantStrikes: [0, 0],
        submissionAttempts: [0, 0],
      });

      for (let i = 0; i <= targetIndex; i++) {
        currentHealth = processEvent(fightEvents[i], currentHealth);
      }

      setFighterHealth(currentHealth);
      setCurrentEventIndex(targetIndex + 1);
    }
  };

  const processUntilTimeOrEnd = (startIndex, targetRound, targetTime) => {
    let endIndex = startIndex;
    
    while (endIndex < fightEvents.length) {
      const event = fightEvents[endIndex];
      
      // Break if we've gone past our target round or reached our target time
      if (event.round > targetRound || 
          (event.round === targetRound && event.clock && event.clock <= targetTime)) {
        break;
      }

      // Break if we hit a fight ending event
      if (event.type === 'fightEnd' || event.method === 'Knockout' || event.method === 'Submission') {
        setIsFightComplete(true);
        break;
      }

      endIndex++;
    }

    processEventsUpTo(endIndex);
  };

  // Handle different skip options
  switch (skipValue) {
    case 'startfight': {
      const roundStartIndex = findRoundStart(1);
      if (roundStartIndex !== -1) {
        processEventsUpTo(roundStartIndex);
      }
      break;
    }

    case 'entirefight': {
      processEventsUpTo(fightEvents.length - 1);
      setIsFightComplete(true);
      break;
    }

    case '1min':
    case '2min': {
      const skipSeconds = skipValue === '1min' ? 60 : 120;
      const currentTime = currentEventIndex > 0 ? 
        fightEvents[currentEventIndex - 1]?.clock || 300 : 
        300;
      const targetTime = Math.max(0, currentTime - skipSeconds);

      if (targetTime <= 0) {
        // Process to end of current round
        processUntilTimeOrEnd(currentEventIndex, currentRound, 0);
        
        // Then process to start of next round if fight hasn't ended
        if (!isFightComplete) {
          const nextRound = currentRound + 1;
          const nextRoundStart = findRoundStart(nextRound);
          if (nextRoundStart !== -1) {
            processEventsUpTo(nextRoundStart);
          }
        }
      } else {
        processUntilTimeOrEnd(currentEventIndex, currentRound, targetTime);
      }
      break;
    }

    case 'endround': {
      processUntilTimeOrEnd(currentEventIndex, currentRound, 0);
      if (!isFightComplete) {
        const nextRound = currentRound + 1;
        const nextRoundStart = findRoundStart(nextRound);
        if (nextRoundStart !== -1) {
          processEventsUpTo(nextRoundStart);
        }
      }
      break;
    }

    default:
      break;
  }
}, [fightEvents, currentEventIndex, currentRound, processEvent, isFightComplete]);

  // Initialize total rounds
  useEffect(() => {
    if (Array.isArray(fightEvents) && fightEvents.length > 0) {
      const maxRound = fightEvents.reduce((max, event) => 
        event?.round && typeof event.round === 'number' ? Math.max(max, event.round) : max, 1);
      setTotalRounds(maxRound);
    }
  }, [fightEvents]);

  // Check for fight end
  useEffect(() => {
    if (currentEventIndex > 0 && currentEventIndex <= fightEvents.length) {
      const currentEvent = fightEvents[currentEventIndex - 1];
      if (isFightEndingEvent(currentEvent)) {
        setIsFightComplete(true);
      }
    }
  }, [currentEventIndex, fightEvents, isFightEndingEvent]);

  // Handle auto-scroll for event log
  useEffect(() => {
    if (eventDisplayRef.current) {
      const scrollHeight = eventDisplayRef.current.scrollHeight;
      eventDisplayRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [displayedEvents]);

  // Handle playback interval
  useEffect(() => {
    if (isPlaying && Array.isArray(fightEvents)) {
      playbackInterval.current = setInterval(() => {
        if (currentEventIndex < fightEvents.length) {
          const newHealth = processEvent(fightEvents[currentEventIndex], fighterHealth);
          setFighterHealth(newHealth);
          setCurrentEventIndex(prev => prev + 1);
          
          if (currentEventIndex + 1 >= fightEvents.length || 
              isFightEndingEvent(fightEvents[currentEventIndex])) {
            setIsPlaying(false);
            setIsFightComplete(true);
          }
        } else {
          setIsPlaying(false);
          setIsFightComplete(true);
        }
      }, 1000 / playbackSpeed);
    }

    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentEventIndex, fightEvents, processEvent, fighterHealth, isFightEndingEvent]);

  // Playback control handlers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSpeedDecrease = () => setPlaybackSpeed(prev => Math.max(0.5, prev - 0.5));
  const handleSpeedIncrease = () => setPlaybackSpeed(prev => Math.min(4, prev + 0.5));

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ActiveFighterCard 
            fighter={{...fighters[0], position: fighterPositions[0]}}
            index={0}
            currentStats={currentStats}
            health={fighterHealth[0]} 
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
            fighter={{...fighters[1], position: fighterPositions[1]}}
            index={1}
            currentStats={currentStats}
            health={fighterHealth[1]}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default FightViewer;