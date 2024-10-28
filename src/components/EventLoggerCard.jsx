import React from 'react';
import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';
import { PlayCircleOutline, PauseCircleOutline, FastForward, FastRewind } from '@mui/icons-material';

const EventLoggerCard = ({ 
  isPlaying,
  playbackSpeed,
  displayedEvents,
  eventDisplayRef,
  onPlayPauseClick,
  onSpeedDecrease,
  onSpeedIncrease 
}) => (
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
          onClick={onSpeedDecrease}
        />
        <Button
          onClick={onPlayPauseClick}
          startIcon={isPlaying ? <PauseCircleOutline /> : <PlayCircleOutline />}
          variant="contained"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <FastForward 
          sx={{ cursor: 'pointer' }}
          onClick={onSpeedIncrease}
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

export default EventLoggerCard;