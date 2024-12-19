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
  Collapse,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

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
  const [expandedReigns, setExpandedReigns] = useState({});

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

  // Filter reigns based on showFullHistory flag
  const filteredReigns = showFullHistory 
    ? championship.reigns
    : championship.reigns.filter(reign => reign.championId === currentFighterId);

  // Toggle defense details for a specific reign
  const toggleDefenses = (reignId) => {
    setExpandedReigns(prev => ({
      ...prev,
      [reignId]: !prev[reignId]
    }));
  };

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
            {filteredReigns.map((reign, index) => (
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
                {/* Championship Win Details */}
                <Box sx={{ width: '100%' }}>
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

                  {/* Title Defenses Section */}
                  {reign.defenses?.length > 0 && (
                    <>
                      <Button
                        size="small"
                        onClick={() => toggleDefenses(index)}
                        endIcon={expandedReigns[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mt: 1, fontSize: '0.75rem' }}
                      >
                        {`${reign.defenses.length} Title Defense${reign.defenses.length > 1 ? 's' : ''}`}
                      </Button>
                      
                      <Collapse in={expandedReigns[index]}>
                        <Box sx={{ pl: 2, mt: 1, borderLeft: '2px solid rgba(255, 215, 0, 0.3)' }}>
                          {reign.defenses.map((defense, defIndex) => (
                            <Box key={defIndex} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Defense #{defIndex + 1}: vs{' '}
                                {defense.opponentId ? (
                                  <Link
                                    to={`/dashboard/${defense.opponentId}`}
                                    style={{
                                      textDecoration: 'none',
                                      color: '#1976d2'
                                    }}
                                  >
                                    {defense.opponentName}
                                  </Link>
                                ) : (
                                  defense.opponentName
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {defense.method} (R{defense.round} {defense.time})
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                {formatDate(defense.date)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </>
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
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default ChampionshipCard;