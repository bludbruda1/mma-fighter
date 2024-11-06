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
    'STANDING': { text: 'Standing', color: 'success' },
    
    // Clinch positions
    'CLINCH_OFFENCE': { text: 'Clinch Control', color: 'warning' },
    'CLINCH_DEFENCE': { text: 'In Clinch', color: 'warning' },
    
    // Ground positions - Full Guard
    'GROUND_FULL_GUARD_TOP': { text: 'Full Guard (Top)', color: 'error' },
    'GROUND_FULL_GUARD_POSTURE_UP': { text: 'Full Guard (Postured)', color: 'error' },
    'GROUND_FULL_GUARD_BOTTOM': { text: 'Full Guard (Bottom)', color: 'error' },
    
    // Ground positions - Half Guard
    'GROUND_HALF_GUARD_TOP': { text: 'Half Guard (Top)', color: 'error' },
    'GROUND_HALF_GUARD_BOTTOM': { text: 'Half Guard (Bottom)', color: 'error' },
    
    // Ground positions - Side Control
    'GROUND_SIDE_CONTROL_TOP': { text: 'Side Control (Top)', color: 'error' },
    'GROUND_SIDE_CONTROL_BOTTOM': { text: 'Side Control (Bottom)', color: 'error' },
    
    // Ground positions - Mount
    'GROUND_MOUNT_TOP': { text: 'Mount (Top)', color: 'error' },
    'GROUND_MOUNT_POSTURE_UP': { text: 'Mount (Postured)', color: 'error' },
    'GROUND_MOUNT_BOTTOM': { text: 'Mounted', color: 'error' },
    
    // Ground positions - Back Control
    'GROUND_BACK_CONTROL_OFFENCE': { text: 'Back Control', color: 'error' },
    'GROUND_BACK_CONTROL_DEFENCE': { text: 'Back Taken', color: 'error' }
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
const ActiveFighterCard = ({ fighter, index, currentStats, health = { head: 100, body: 100, legs: 100 } }) => {
  const positionData = formatPosition(fighter.position);
  
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
            label={positionData.text}
            color={positionData.color}
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