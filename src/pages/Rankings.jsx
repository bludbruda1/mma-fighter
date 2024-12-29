import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
  Chip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getAllFighters, getAllChampionships, updateFighter } from '../utils/indexedDB';

const Rankings = () => {
  // Core state management
  const [championships, setChampionships] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [selectedRank, setSelectedRank] = useState('');
  
  // Ranking slots state management
  const [isInitialized, setIsInitialized] = useState(false);
  const [maxRankings, setMaxRankings] = useState(15); // Keep default of 15
  const [tempMaxRankings, setTempMaxRankings] = useState(15);

  // Load initial data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedChampionships, fetchedFighters] = await Promise.all([
          getAllChampionships(),
          getAllFighters()
        ]);
        setChampionships(fetchedChampionships);
        setFighters(fetchedFighters);
        
        // Set default selected championship if available
        if (fetchedChampionships.length > 0) {
          setSelectedChampionship(fetchedChampionships[0]);
          
          // Find the highest current ranking in the data
          const highestRanking = fetchedFighters.reduce((max, fighter) => {
            return fighter.ranking ? Math.max(max, fighter.ranking) : max;
          }, 0);
  
          // Only update if we found rankings and haven't initialized yet
          if (highestRanking > 0 && !isInitialized) {
            setMaxRankings(highestRanking);
            setTempMaxRankings(highestRanking);
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [isInitialized]); // Add isInitialized to dependencies

  // Helper function to get sorted fighters for current weight class
  const getWeightClassFighters = () => {
    if (!selectedChampionship) return [];
    
    // Create array of maxRankings length filled with null
    const rankedPositions = Array(maxRankings).fill(null);
    
    // Get all fighters in weight class
    const weightClassFighters = fighters
      .filter(f => f.weightClass === selectedChampionship.weightClass)
      .sort((a, b) => {
        // Champion first
        if (selectedChampionship.currentChampionId === a.personid) return -1;
        if (selectedChampionship.currentChampionId === b.personid) return 1;
        
        // Then by ranking, preserve gaps by not defaulting to 999
        if (a.ranking === null && b.ranking === null) return 0;
        if (a.ranking === null) return 1;
        if (b.ranking === null) return -1;
        return a.ranking - b.ranking;
      });
  
    // Place fighters in their ranked positions
    weightClassFighters.forEach(fighter => {
      if (fighter.ranking && fighter.ranking <= maxRankings) {
        rankedPositions[fighter.ranking - 1] = fighter;
      }
    });
  
    // Filter out unranked fighters
    const unrankedFighters = weightClassFighters.filter(f => !f.ranking);
  
    // Combine ranked positions (including nulls for vacant spots) with unranked fighters
    return [...rankedPositions.map((fighter, index) => 
      fighter || { vacant: true, displayRank: index + 1 }
    ), ...unrankedFighters];
  };

  // Handler for ranking slots input change
  const handleRankingSlotsChange = (event) => {
    const value = parseInt(event.target.value);
    if (value >= 1 && value <= 50) { // Enforce reasonable limits
      setTempMaxRankings(value);
    }
  };

  // Handler for confirming ranking slots change
  const handleConfirmRankingSlots = async () => {
    try {
      // Update the max rankings state
      setMaxRankings(tempMaxRankings);
      
      // Get current fighters in weight class
      const weightClassFighters = fighters.filter(f => 
        f.weightClass === selectedChampionship.weightClass &&
        f.personid !== selectedChampionship.currentChampionId // Exclude current champion
      );
  
      // Map to track updates needed
      const updatedFighters = new Map();
  
      // Process each fighter
      weightClassFighters.forEach(fighter => {
        if (fighter.ranking) {
          if (fighter.ranking > tempMaxRankings) {
            // If fighter's ranking is now above the new max, remove their ranking
            updatedFighters.set(fighter.personid, {
              ...fighter,
              ranking: null
            });
          } else {
            // Keep existing ranking if within new range
            updatedFighters.set(fighter.personid, fighter);
          }
        }
      });
  
      // Convert map back to array and filter for changes
      const fightersToUpdate = Array.from(updatedFighters.values())
        .filter(updatedFighter => {
          const originalFighter = fighters.find(f => f.personid === updatedFighter.personid);
          return originalFighter.ranking !== updatedFighter.ranking;
        });
  
      // Batch update all changed fighters
      if (fightersToUpdate.length > 0) {
        await Promise.all(
          fightersToUpdate.map(fighter => updateFighter(fighter))
        );
  
        // Refresh fighters data after updates
        const refreshedFighters = await getAllFighters();
        setFighters(refreshedFighters);
      }
  
      // Keep tempMaxRankings in sync
      setTempMaxRankings(tempMaxRankings);
  
      console.log(`Successfully updated ranking slots to ${tempMaxRankings}`);
    } catch (error) {
      console.error('Error updating ranking slots:', error);
      
      // On error, reset tempMaxRankings to current maxRankings
      setTempMaxRankings(maxRankings);
    }
  };

  // Handler for opening the ranking update dialog
  const handleOpenUpdateDialog = (fighter) => {
    setSelectedFighter(fighter);
    setSelectedRank(fighter.ranking || '');
    setOpenDialog(true);
  };

  // Handler for updating a fighter's ranking
  const handleUpdateRanking = async () => {
    if (!selectedFighter || !selectedRank) return;

    try {
      const weightClassFighters = getWeightClassFighters();
      const updatedFighters = weightClassFighters.map(f => {
        if (f.personid === selectedFighter.personid) {
          return { ...f, ranking: parseInt(selectedRank) };
        }
        return f;
      });

      // Normalize and update rankings
      const normalizedFighters = normalizeRankings(updatedFighters);

      // Update changed fighters in database
      await Promise.all(
        normalizedFighters
          .filter(f => f.ranking !== (
            fighters.find(orig => orig.personid === f.personid)?.ranking
          ))
          .map(f => updateFighter(f))
      );

      // Refresh fighters data
      const refreshedFighters = await getAllFighters();
      setFighters(refreshedFighters);
      
      // Reset dialog state
      setOpenDialog(false);
      setSelectedFighter(null);
      setSelectedRank('');
    } catch (error) {
      console.error('Error updating rankings:', error);
    }
  };

  const normalizeRankings = (fightersToNormalize) => {
    // Create array of rankings
    const rankingsArray = Array(maxRankings).fill(null);
    
    // Place all current fighters in their positions
    fightersToNormalize.forEach(fighter => {
      // Skip vacant positions and ensure fighter has a personid
      if (!fighter.vacant && fighter.personid && fighter.ranking && fighter.ranking <= maxRankings) {
        rankingsArray[fighter.ranking - 1] = fighter;
      }
    });
    
    // Only handle updating selected fighter if one exists and has a new rank
    if (selectedFighter && selectedFighter.personid && selectedRank) {
      const updatedFighter = fightersToNormalize.find(f => f.personid === selectedFighter.personid);
      const newRank = parseInt(selectedRank);
      
      if (updatedFighter && newRank && newRank <= maxRankings) {
        // Remove fighter from old position if they had one
        if (updatedFighter.ranking) {
          rankingsArray[updatedFighter.ranking - 1] = null;
        }
        // Place in new position
        rankingsArray[newRank - 1] = { ...updatedFighter, ranking: newRank };
      }
    }
  
    // Convert back to fighter array, preserving nulls as vacant spots
    return rankingsArray
      .map((fighter, index) => fighter ? { ...fighter } : null)
      .filter(f => f !== null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Title and Controls Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Rankings
        </Typography>
        <Grid container spacing={2}>
          {/* Championship Selector */}
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Championship</InputLabel>
              <Select
                value={selectedChampionship?.id || ''}
                label="Championship"
                onChange={(e) => {
                  const championship = championships.find(c => c.id === e.target.value);
                  setSelectedChampionship(championship);
                }}
              >
                {championships.map((championship) => (
                  <MenuItem key={championship.id} value={championship.id}>
                    {championship.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Ranking Slots Control */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Number of Ranking Slots"
                type="number"
                value={tempMaxRankings}
                onChange={handleRankingSlotsChange}
                InputProps={{ inputProps: { min: 1, max: 50 } }}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleConfirmRankingSlots}
                disabled={tempMaxRankings === maxRankings}
                sx={{
                  backgroundColor: "rgba(33, 33, 33, 0.9)",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(33, 33, 33, 0.7)",
                  },
                }}
              >
                Confirm
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Rankings Display */}
      {selectedChampionship && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5">
                {selectedChampionship.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedChampionship.weightClass}
              </Typography>
            </Box>

            <TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Rank</TableCell>
        <TableCell>Fighter</TableCell>
        <TableCell>Record</TableCell>
        <TableCell>Action</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {/* Champion Row */}
      {getWeightClassFighters()
        .filter(f => f.personid === selectedChampionship.currentChampionId)
        .map((fighter) => (
          <TableRow 
            key={fighter.personid}
            sx={{ 
              backgroundColor: 'rgba(255, 215, 0, 0.05)',
              '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' }
            }}
          >
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: 'gold' }} />
                <Typography>Champion</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Link
                to={`/dashboard/${fighter.personid}`}
                style={{
                  textDecoration: "none",
                  color: "#1976d2",
                }}
              >
                {fighter.firstname} {fighter.lastname}
              </Link>
            </TableCell>
            <TableCell>{fighter.wins}W-{fighter.losses}L</TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        ))}

      {/* Ranked and Vacant Spots */}
      {getWeightClassFighters()
        .filter(f => f.personid !== selectedChampionship.currentChampionId)
        .map((fighter) => {
          if (fighter.vacant) {
            // Vacant spot row styling
            return (
              <TableRow 
                key={`vacant-${fighter.displayRank}`}
                sx={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderLeft: '3px solid rgba(0, 0, 0, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <TableCell>
                  <Typography color="text.secondary">
                    #{fighter.displayRank}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="text.secondary" fontStyle="italic">
                    Vacant Position
                  </Typography>
                </TableCell>
                <TableCell></TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            );
          }

          // Determine if fighter is ranked or unranked
          const isRanked = fighter.ranking && fighter.ranking <= maxRankings;

          return (
            <TableRow 
              key={fighter.personid}
              sx={{ 
                ...(isRanked ? {
                  // Ranked fighter styling
                  backgroundColor: 'white',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                } : {
                  // Unranked fighter styling
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderLeft: '3px solid rgba(0, 0, 0, 0.2)',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                })
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isRanked ? (
                    // Ranked number display
                    <Typography 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }}
                    >
                      #{fighter.ranking}
                    </Typography>
                  ) : (
                    // Unranked label
                    <Chip 
                      label="UNRANKED"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontWeight: 'medium'
                      }}
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Link
                  to={`/dashboard/${fighter.personid}`}
                  style={{
                    textDecoration: "none",
                    color: "#1976d2",
                  }}
                >
                  {fighter.firstname} {fighter.lastname}
                </Link>
              </TableCell>
              <TableCell>{fighter.wins}W-{fighter.losses}L</TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenUpdateDialog(fighter)}
                  sx={
                    isRanked ? {} : {
                      borderColor: 'rgba(0, 0, 0, 0.2)',
                      color: 'rgba(0, 0, 0, 0.6)',
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)'
                      }
                    }
                  }
                >
                  {isRanked ? 'Update Rank' : 'Assign Rank'}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
    </TableBody>
  </Table>
</TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Update Ranking Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Update Ranking for {selectedFighter?.firstname} {selectedFighter?.lastname}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Ranking</InputLabel>
            <Select
              value={selectedRank}
              label="New Ranking"
              onChange={(e) => setSelectedRank(e.target.value)}
            >
              {[...Array(maxRankings)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  #{i + 1}
                </MenuItem>
              ))}
              <MenuItem value={null}>Unranked</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateRanking} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Rankings;