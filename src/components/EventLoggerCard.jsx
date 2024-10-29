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
  isPreFight
}) => {
  // Menu state
  const [skipMenuAnchor, setSkipMenuAnchor] = useState(null);
  const isSkipMenuOpen = Boolean(skipMenuAnchor);

// Skip options based on fight state
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

        {/* Playback Controls */}
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
            <Button
              onClick={onPlayPauseClick}
              startIcon={isPlaying ? <PauseCircleOutline /> : <PlayCircleOutline />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <IconButton onClick={onSpeedDecrease}>
              <FastRewind />
            </IconButton>
            <IconButton onClick={onSpeedIncrease}>
              <FastForward />
            </IconButton>
            <Button
              endIcon={<KeyboardArrowDown />}
              onClick={handleSkipMenuClick}
              sx={{ minWidth: '100px' }}
            >
              Skip
            </Button>
          </ButtonGroup>

          {/* Skip Menu */}
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
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
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