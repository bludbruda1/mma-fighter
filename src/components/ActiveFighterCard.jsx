import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import FighterStatBar from "./FighterStatBar";
import HealthBar from "./HealthBar";

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
const ActiveFighterCard = ({ fighter, index, currentStats, health = { head: 100, body: 100, legs: 100 } }) => (
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

export default ActiveFighterCard;