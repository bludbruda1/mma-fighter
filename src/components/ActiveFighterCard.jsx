import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import FighterStatBar from "./FighterStatBar";
import HealthBar from "./HealthBar";


/**
 * Format a fighter's position into a human-readable string and determine appropriate display color
 * @param {string} position - Raw position string from FIGHTER_POSITIONS enum
 * @returns {Object} Object containing formatted text and chip color
 */
const formatPosition = (position) => {
  if (!position) return { text: 'Standing', color: 'success' };
  
  // Define position formatting rules
  const formatRules = {
    // Standing position
    'standing': { text: 'Standing', color: 'success' },
    
    // Clinch positions
    'clinchOffence': { text: 'Clinch Control', color: 'warning' },
    'clinchDefence': { text: 'In Clinch', color: 'warning' },
    
    // Ground positions - Full Guard
    'groundFullGuardTop': { text: 'Full Guard (Top)', color: 'error' },
    'groundFullGuardPostureUp': { text: 'Full Guard (Postured)', color: 'error' },
    'groundFullGuardBottom': { text: 'Full Guard (Bottom)', color: 'error' },
    
    // Ground positions - Half Guard
    'groundHalfGuardTop': { text: 'Half Guard (Top)', color: 'error' },
    'groundHalfGuardBottom': { text: 'Half Guard (Bottom)', color: 'error' },
    
    // Ground positions - Side Control
    'groundSideControlTop': { text: 'Side Control (Top)', color: 'error' },
    'groundSideControlBottom': { text: 'Side Control (Bottom)', color: 'error' },
    
    // Ground positions - Mount
    'groundMountTop': { text: 'Mount (Top)', color: 'error' },
    'groundMountPostureUp': { text: 'Mount (Postured)', color: 'error' },
    'groundMountBottom': { text: 'Mounted', color: 'error' },
    
    // Ground positions - Back Control
    'groundBackControlOffence': { text: 'Back Control', color: 'error' },
    'groundBackControlDefence': { text: 'Back Taken', color: 'error' }
  };

  // Return formatting for known position or default for unknown
  return formatRules[position] || { 
    text: position.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '), 
    color: 'default' 
  };
};

/**
 * ActiveFighterCard Component
 * Displays a fighter's information, health status, and fight statistics
 * 
 * @param {Object} props
 * @param {Object} props.fighter - Fighter data
 * @param {number} props.index - Fighter index (0 or 1)
 * @param {Object} props.currentStats - Current fight statistics
 * @param {Object} props.health - Current health values for head, body, and legs
 */
const ActiveFighterCard = ({ fighter, index, currentStats, health }) => {
  // Get formatted position and color
  const { text: positionText, color: positionColor } = formatPosition(fighter.position);
  
  return (
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

        {/* Position Display */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Chip
            label={positionText}
            color={positionColor}
            variant="outlined"
            sx={{
              fontWeight: 'medium',
              fontSize: '0.875rem',
              minWidth: '120px',
              '& .MuiChip-label': {
                px: 2
              }
            }}
          />
        </Box>
              
        {/* Fighter Health Section */}
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Fighter Health:</Typography>
          <HealthBar label="Head" value={health.head} maxValue={100} />
          <HealthBar label="Body" value={health.body} maxValue={100} />
          <HealthBar label="Legs" value={health.legs} maxValue={100} />
        </Box>

        {/* Fight Stats Section */}
          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2 
              }}
            >
              Fight Stats:
            </Typography>
            <FighterStatBar
              label="Strikes Landed"
              value={currentStats?.strikesLanded?.[index] || 0}
            />
            <FighterStatBar
              label="Significant Strikes"
              value={currentStats?.significantStrikes?.[index] || 0}
            />
            <FighterStatBar
              label="Takedowns"
              value={currentStats?.takedownsLanded?.[index] || 0}
            />
            <FighterStatBar
              label="Submission Attempts"
              value={currentStats?.submissionAttempts?.[index] || 0}
            />
          </Box>
        </CardContent>
    </Card>
  );
};

export default ActiveFighterCard;