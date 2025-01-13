import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Collapse,
  IconButton,
  Button,
  Avatar,
  Chip,
  Grid,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { calculateAge } from '../utils/dateUtils';
import { styled } from '@mui/material/styles';

// Styled expand icon that rotates when clicked
const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

// Function to determine the fight order label
const getFightOrderLabel = (index) => {
if (index === 0 ) return "Main Event";
if (index === 1) return "Co-Main Event";
if (index === 2) return "Featured Bout";
return "Preliminary Card";
};

/**
 * CompactFightCard Component
 * Displays fight information in a condensed, expandable format
 * 
 * @param {Object} props
 * @param {Object} props.fight - Fight data
 * @param {Object} props.result - Fight result data
 * @param {boolean} props.isComplete - Whether the fight is completed
 * @param {boolean} props.isViewed - Whether the fight has been viewed
 * @param {boolean} props.isSimulated - Whether the fight has been simulated
 * @param {Function} props.onWatch - Watch fight handler
 * @param {Function} props.onSimulate - Simulate fight handler
 * @param {Function} props.onViewSummary - View summary handler
 * @param {boolean} props.fighter1IsChamp - Whether fighter 1 was champion entering the fight
 * @param {boolean} props.fighter2IsChamp - Whether fighter 2 was champion entering the fight
 * @param {number} props.fightIndex - Index of the fight in the event
 */
const CompactFightCard = ({
  fight,
  result,
  isComplete,
  isViewed,
  isSimulated,
  onWatch,
  onSimulate,
  onViewSummary,
  fighter1IsChamp,
  fighter2IsChamp,
  fightIndex,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [fighter1Age, setFighter1Age] = useState("N/A");
  const [fighter2Age, setFighter2Age] = useState("N/A");

  const fighter1Dob = fight?.fighter1?.dob || null;
  const fighter2Dob = fight?.fighter2?.dob || null;

  // useEffect to calculate ages when fighter data changes
  useEffect(() => {
    const loadAges = async () => {
      if (fighter1Dob) {
        const age1 = await calculateAge(fighter1Dob);
        setFighter1Age(age1);
      }
      if (fighter2Dob) {
        const age2 = await calculateAge(fighter2Dob);
        setFighter2Age(age2);
      }
    };

    loadAges();
  }, [fighter1Dob, fighter2Dob]);
    
  // Handler for expand/collapse
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Render corner profile section
  const renderCorner = (fighter, isChampion, isWinner, alignment = 'left', age) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      position: 'relative',
      flexDirection: alignment === 'right' ? 'row-reverse' : 'row',
      justifyContent: alignment === 'right' ? 'flex-start' : 'flex-start',
      mt: 2,
    }}>
      {/* Enhanced champion indicator styling */}
      {isChampion && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            [alignment === 'right' ? 'left' : 'right']: -12,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1,
          }}
        >
          <EmojiEventsIcon 
            sx={{ 
              color: 'gold',
              fontSize: '1.2rem',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }} 
          />
          <Typography
            variant="caption"
            sx={{
              color: 'rgb(175, 145, 0)',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Champion
          </Typography>
        </Box>
      )}
      <Avatar
        src={fighter.profile}
        alt={`${fighter.firstname} ${fighter.lastname}`}
        sx={{ 
          width: 56, 
          height: 56,
          border: isWinner ? '2px solid #4caf50' : 'none'
        }}
      />
      <Box sx={{ textAlign: alignment }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
          {fighter.firstname} {fighter.lastname}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {age} years old
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {fighter.wins}W-{fighter.losses}L
          {fighter.ranking ? ` • Rank #${fighter.ranking}` : ' • Unranked'}
        </Typography>
      </Box>
    </Box>
  );

  // Render fight status chip
  const renderStatusChip = () => {
    if (isComplete) {
      return (
        <Chip 
          label="Complete" 
          color="success" 
          variant="outlined" 
          size="small" 
        />
      );
    }
    if (isViewed) {
      return (
        <Chip 
          label="Viewed" 
          color="primary" 
          variant="outlined" 
          size="small" 
        />
      );
    }
    if (isSimulated) {
      return (
        <Chip 
          label="Simulated" 
          color="secondary" 
          variant="outlined" 
          size="small" 
        />
      );
    }
    return (
      <Chip 
        label="Upcoming" 
        color="default" 
        variant="outlined" 
        size="small" 
      />
    );
  };

  return (
    <Card 
      elevation={2}
      sx={{ 
        mb: 2,
        position: 'relative',
        '&:hover': {
          boxShadow: 4
        }
      }}
    >
      {/* Championship Banner */}
      {fight.championship && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'gold',
            color: 'black',
            padding: '4px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {fight.championship.name}
        </Box>
      )}

      <CardContent sx={{ pt: fight.championship ? 4 : 2 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Fighter 1 */}
        <Grid item xs={5}>
            {renderCorner(
            fight.fighter1,
            fighter1IsChamp,
            result?.winnerIndex === 0,
            'left',
            fighter1Age
            )}
        </Grid>

        {/* VS and Status */}
        <Grid item xs={2} sx={{ textAlign: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {getFightOrderLabel(fightIndex)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {fight.weightClass}
        </Typography>
            {renderStatusChip()}
        </Grid>

        {/* Fighter 2 */}
        <Grid item xs={5}>
            {renderCorner(
            fight.fighter2,
            fighter2IsChamp,
            result?.winnerIndex === 1,
            'right',
            fighter2Age
            )}
        </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 1,
          mt: 2 
        }}>
          <Tooltip title={isViewed ? "Already viewed" : "Watch fight"}>
            <span>
              <Button
                size="small"
                variant="contained"
                onClick={onWatch}
                disabled={isViewed || (isSimulated && !isViewed)}
                sx={{
                  backgroundColor: "rgba(33, 33, 33, 0.9)",
                  color: "#fff",
                  "&:disabled": {
                    backgroundColor: "rgba(33, 33, 33, 0.4)",
                  },
                }}
              >
                Watch
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={isComplete ? "Fight complete" : "Simulate fight"}>
            <span>
              <Button
                size="small"
                variant="contained"
                onClick={onSimulate}
                disabled={isComplete}
                sx={{
                  backgroundColor: "rgba(33, 33, 33, 0.9)",
                  color: "#fff",
                  "&:disabled": {
                    backgroundColor: "rgba(33, 33, 33, 0.4)",
                  },
                }}
              >
                Simulate
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={!result ? "No summary available" : "View fight summary"}>
            <span>
              <Button
                size="small"
                variant="contained"
                onClick={onViewSummary}
                disabled={!result}
                sx={{
                  backgroundColor: "rgba(33, 33, 33, 0.9)",
                  color: "#fff",
                  "&:disabled": {
                    backgroundColor: "rgba(33, 33, 33, 0.4)",
                  },
                }}
              >
                Summary
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Expand/Collapse Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">
                  Fighting Style: {fight.fighter1.fightingStyle}
                </Typography>
                <Typography variant="subtitle2">
                  Nationality: {fight.fighter1.nationality}
                </Typography>
                <Typography variant="subtitle2">
                  Ranking: {fight.fighter1.ranking || 'Unranked'}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">
                  Fighting Style: {fight.fighter2.fightingStyle}
                </Typography>
                <Typography variant="subtitle2">
                  Nationality: {fight.fighter2.nationality}
                </Typography>
                <Typography variant="subtitle2">
                  Ranking: {fight.fighter2.ranking || 'Unranked'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default CompactFightCard;