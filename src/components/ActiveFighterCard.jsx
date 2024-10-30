import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import StatBar from "./StatBar";
import HealthBar from "./HealthBar";

const ActiveFighterCard = ({ fighter, index, currentStats }) => (
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
            
      {/*Fighter Health Section */}
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Fighter Health:</Typography>
        <HealthBar label="Head" value={100} maxValue={100} />
        <HealthBar label="Body" value={100} maxValue={100} />
        <HealthBar label="Legs" value={100} maxValue={100} />
      </Box>

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