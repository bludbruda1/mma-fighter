import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import FilterPanel from './FilterPanel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { formatFightingStyle } from "../utils/uiHelpers";

/**
 * FighterSelectionModal Component
 * 
 * A reusable modal component for selecting fighters with filtering capabilities
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controls modal visibility
 * @param {function} props.onClose - Handler for closing the modal
 * @param {Array} props.fighters - Array of all available fighters
 * @param {Object} props.filterOptions - Available filter options
 * @param {Object} props.filters - Current filter states
 * @param {function} props.setFilters - Handler for updating filters
 * @param {function} props.onFighterSelect - Handler for fighter selection
 * @param {Set} props.bookedFighters - Set of fighter IDs that are already booked
 * @param {Set} props.selectedFightersInEvent - Set of fighter IDs already selected in current event
 * @param {Array} props.championships - Array of championship data
 */
const FighterSelectionModal = ({
  open,
  onClose,
  fighters,
  filterOptions,
  filters,
  setFilters,
  onFighterSelect,
  bookedFighters,
  selectedFightersInEvent,
  championships,
}) => {
  // Helper function to check if a fighter is a champion
  const getChampionship = (fighterId) => {
    return championships.find(c => c.currentChampionId === fighterId);
  };

  // Helper function to check if a fighter is available
  const isFighterAvailable = (fighter) => {
    if (bookedFighters.has(fighter.personid)) {
      return {
        available: false,
        reason: "Booked in another event"
      };
    }
    if (selectedFightersInEvent.has(fighter.personid)) {
      return {
        available: false,
        reason: "Already selected in this event"
      };
    }
    return {
      available: true
    };
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Select Fighter
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Filter Panel Section */}
        <Box sx={{ mb: 3 }}>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            filterOptions={filterOptions}
            totalFighters={fighters.length}
            filteredCount={fighters.length}
          />
        </Box>

        {/* Fighters Grid Section */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container spacing={2}>
            {fighters.map((fighter) => {
              const availability = isFighterAvailable(fighter);
              const championship = getChampionship(fighter.personid);

              return (
                <Grid item xs={12} sm={6} md={4} key={fighter.personid}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: availability.available ? 'pointer' : 'not-allowed',
                      opacity: availability.available ? 1 : 0.7,
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': availability.available ? {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      } : {},
                    }}
                    onClick={() => {
                      if (availability.available) {
                        onFighterSelect(fighter);
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={fighter.image || fighter.profile}
                      alt={`${fighter.firstname} ${fighter.lastname}`}
                      sx={{ objectFit: 'contain' }}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {fighter.firstname} {fighter.lastname}
                        </Typography>
                        {championship && (
                          <Tooltip title={championship.name}>
                            <EmojiEventsIcon sx={{ color: 'gold' }} />
                          </Tooltip>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={fighter.weightClass} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={formatFightingStyle(fighter.fightingStyle)} 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`${fighter.wins}W-${fighter.losses}L`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>

                      {!availability.available && (
                        <Typography 
                          color="error" 
                          variant="body2" 
                          sx={{ mt: 1 }}
                        >
                          {availability.reason}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FighterSelectionModal;