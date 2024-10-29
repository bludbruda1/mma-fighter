import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Chip, 
  IconButton, 
  ButtonGroup,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  PlayCircleOutline, 
  PauseCircleOutline, 
  FastForward, 
  FastRewind,
  KeyboardArrowDown
} from '@mui/icons-material';

/**
 * EventLoggerCard Component
 * Displays fight events and provides playback controls for fight simulation
 * 
 * @param {Object} props
 * @param {boolean} props.isPlaying - Current playback state
 * @param {number} props.playbackSpeed - Current playback speed multiplier
 * @param {Array} props.displayedEvents - Array of events to display
 * @param {React.RefObject} props.eventDisplayRef - Ref for event display scroll container
 * @param {number} props.currentRound - Current round number (0 for pre-fight)
 * @param {number} props.totalRounds - Total number of rounds in the fight
 * @param {Function} props.onPlayPauseClick - Handler for play/pause button
 * @param {Function} props.onSpeedDecrease - Handler for decreasing playback speed
 * @param {Function} props.onSpeedIncrease - Handler for increasing playback speed
 * @param {Function} props.onSkipTime - Handler for time skip actions
 * @param {boolean} props.isPreFight - Whether currently in pre-fight state
 * @param {boolean} props.isFightComplete - Whether the fight has ended
 */
const EventLoggerCard = ({ 
  isPlaying,
  playbackSpeed,
  displayedEvents,
  eventDisplayRef,
  currentRound,
  totalRounds,
  onPlayPauseClick,
  onSpeedDecrease,
  onSpeedIncrease,
  onSkipTime,
  isPreFight,
  isFightComplete
}) => {
  // Menu state management
  const [skipMenuAnchor, setSkipMenuAnchor] = useState(null);
  const isSkipMenuOpen = Boolean(skipMenuAnchor);

  // Define skip options based on fight state
  const skipOptions = isPreFight 
    ? [
        { label: 'Skip to fight', value: 'startfight' },
        { label: 'Skip entire fight', value: 'entirefight' }
      ]
    : [
        { label: '1 minute', value: '1min' },
        { label: '2 minutes', value: '2min' },
        { label: 'End of round', value: 'endround' },
        { label: 'Skip entire fight', value: 'entirefight' }
      ];

  /**
   * Handlers for skip menu interactions
   */
  const handleSkipMenuClick = (event) => {
    setSkipMenuAnchor(event.currentTarget);
  };

  const handleSkipMenuClose = () => {
    setSkipMenuAnchor(null);
  };

  const handleSkipOptionSelect = (value) => {
    if (onSkipTime) {
      onSkipTime(value);
    }
    handleSkipMenuClose();
  };

  return (
    <Card className="h-full">
      <CardContent>
        {/* Round and Speed Indicators */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 2,
          gap: 2 
        }}>
          <Chip 
            label={isPreFight ? "Pre-Fight" : `Round ${currentRound}`}
            color="primary"
            variant="filled"
          />
          <Chip 
            label={`${playbackSpeed}x`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Playback Control Panel */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          gap: 2, 
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          mb: 2
        }}>
          <ButtonGroup variant="contained" size="small">
            {/* Play/Pause Button */}
            <Button
              onClick={onPlayPauseClick}
              startIcon={isPlaying ? <PauseCircleOutline /> : <PlayCircleOutline />}
              disabled={isFightComplete}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            {/* Speed Control Buttons */}
            <IconButton 
              onClick={onSpeedDecrease}
              disabled={isFightComplete}
            >
              <FastRewind />
            </IconButton>
            <IconButton 
              onClick={onSpeedIncrease}
              disabled={isFightComplete}
            >
              <FastForward />
            </IconButton>

            {/* Skip Menu Button */}
            <Button
              endIcon={<KeyboardArrowDown />}
              onClick={handleSkipMenuClick}
              disabled={isFightComplete && !isPreFight}
              sx={{ minWidth: '100px' }}
            >
              Skip
            </Button>
          </ButtonGroup>

          {/* Skip Options Menu */}
          <Menu
            anchorEl={skipMenuAnchor}
            open={isSkipMenuOpen}
            onClose={handleSkipMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {skipOptions.map((option) => (
              <MenuItem
                key={option.label}
                onClick={() => handleSkipOptionSelect(option.value)}
                disabled={isFightComplete && option.value !== 'entirefight'}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Event Display */}
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
                backgroundColor: event.timeStr.startsWith(isPreFight ? 'PRE' : `R${currentRound}`) 
                  ? 'action.hover' 
                  : 'transparent',
                p: 1,
                borderRadius: 1
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
};

export default EventLoggerCard;