import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import StatBar from "./StatBar";
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
        <Typography variant="subtitle2">Fight Stats:</Typography>
        <StatBar
          redValue={currentStats.strikesLanded[index]}
          blueValue={currentStats.strikesLanded[1 - index]}
          title="Strikes Landed"
        />
        <StatBar
          redValue={currentStats.significantStrikes[index]}
          blueValue={currentStats.significantStrikes[1 - index]}
          title="Significant Strikes"
        />
        <StatBar
          redValue={currentStats.takedownsLanded[index]}
          blueValue={currentStats.takedownsLanded[1 - index]}
          title="Takedowns"
        />
        <StatBar
          redValue={currentStats.submissionAttempts[index]}
          blueValue={currentStats.submissionAttempts[1 - index]}
          title="Submission Attempts"
        />
      </Box>
    </CardContent>
  </Card>
);

export default ActiveFighterCard;