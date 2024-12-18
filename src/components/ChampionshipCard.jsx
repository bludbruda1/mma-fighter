import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoIcon from '@mui/icons-material/Info';

/**
 * ChampionshipCard Component
 * Displays championship information including current status and reign history
 * 
 * @param {Object} props
 * @param {Object} props.championship - Championship data
 * @param {boolean} props.isCurrentChamp - Whether viewing fighter is current champion
 * @param {number} props.currentFighterId - ID of the fighter being viewed (for filtering history)
 * @param {boolean} props.showFullHistory - Whether to show history for all champions or just current fighter
 */
const ChampionshipCard = ({ 
  championship, 
  isCurrentChamp, 
  currentFighterId,
  showFullHistory = false 
}) => {
  const [showHistory, setShowHistory] = useState(false);

  // Format date to locale string
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate reign duration
  const calculateReignDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;

    let duration = [];
    if (years > 0) duration.push(`${years}y`);
    if (months > 0) duration.push(`${months}m`);
    if (days > 0) duration.push(`${days}d`);
    
    return duration.join(' ');
  };

  // Filter history based on showFullHistory flag
  const filteredHistory = showFullHistory 
    ? championship.history
    : championship.history.filter(entry => entry.championId === currentFighterId);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          backgroundColor: 'rgba(255, 215, 0, 0.08)'
        }
      }}
    >
      {/* Championship Title and Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <EmojiEventsIcon 
          sx={{ 
            color: 'gold', 
            fontSize: '2.5rem',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} 
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {championship.name}
            </Typography>
            {championship.description && (
              <Tooltip title={championship.description} arrow>
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {championship.weightClass} Division
          </Typography>
        </Box>
      </Box>

      {/* Championship Status */}
      <Box>
        <Typography variant="body2" sx={{ 
          color: isCurrentChamp ? 'success.main' : 'text.secondary',
          fontWeight: isCurrentChamp ? 'bold' : 'normal'
        }}>
          Status: {isCurrentChamp ? 'Current Champion' : 'Former Champion'}
        </Typography>
        <Button
          size="small"
          onClick={() => setShowHistory(!showHistory)}
          sx={{ mt: 1 }}
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </Button>
      </Box>

      {/* Championship History */}
      {showHistory && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            {showFullHistory ? 'Complete Title History' : 'Championship Reigns'}
          </Typography>
          <List dense>
            {filteredHistory.map((reign, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1,
                  mb: 1,
                  padding: 1.5
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {reign.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {calculateReignDuration(reign.startDate, reign.endDate)}
                  </Typography>
                </Box>
                
                <Typography variant="body2">
                  {formatDate(reign.startDate)} - {formatDate(reign.endDate)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Won from: {' '}
                  {reign.wonFromId ? (
                    <Link
                      to={`/dashboard/${reign.wonFromId}`}
                      style={{
                        textDecoration: 'none',
                        color: '#1976d2'
                      }}
                    >
                      {reign.wonFromName}
                    </Link>
                  ) : (
                    reign.wonFromName
                  )}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Method: {reign.winMethod} (R{reign.winRound} {reign.winTime})
                </Typography>

                {reign.defenses > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Successful defenses: {reign.defenses}
                  </Typography>
                )}

                {reign.eventId && (
                  <Button
                    size="small"
                    component={Link}
                    to={`/event/${reign.eventId}`}
                    sx={{ mt: 1, fontSize: '0.75rem' }}
                  >
                    View Event
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default ChampionshipCard;