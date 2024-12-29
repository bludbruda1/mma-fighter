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
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getAllFighters, getAllChampionships, updateFighter } from '../utils/indexedDB';

const Rankings = () => {
  // State management
  const [championships, setChampionships] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [selectedRank, setSelectedRank] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedChampionships, fetchedFighters] = await Promise.all([
          getAllChampionships(),
          getAllFighters()
        ]);
        setChampionships(fetchedChampionships);
        setFighters(fetchedFighters);
        
        // Set default selected championship
        if (fetchedChampionships.length > 0) {
          setSelectedChampionship(fetchedChampionships[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Get fighters for current weight class
  const getWeightClassFighters = () => {
    if (!selectedChampionship) return [];
    
    return fighters
      .filter(f => f.weightClass === selectedChampionship.weightClass)
      .sort((a, b) => {
        // Champion first
        if (selectedChampionship.currentChampionId === a.personid) return -1;
        if (selectedChampionship.currentChampionId === b.personid) return 1;
        
        // Then by ranking
        const rankA = a.ranking || 999;
        const rankB = b.ranking || 999;
        return rankA - rankB;
      });
  };

  // Handle manual ranking update
  const handleOpenUpdateDialog = (fighter) => {
    setSelectedFighter(fighter);
    setSelectedRank(fighter.ranking || '');
    setOpenDialog(true);
  };

  const handleUpdateRanking = async () => {
    if (!selectedFighter || !selectedRank) return;

    try {
      // Get affected fighters (those whose ranks need to shift)
      const weightClassFighters = getWeightClassFighters();
      const updatedFighters = weightClassFighters.map(f => {
        if (f.personid === selectedFighter.personid) {
          return { ...f, ranking: parseInt(selectedRank) };
        }
        return f;
      });

      // Sort and normalize rankings
      const normalizedFighters = normalizeRankings(updatedFighters);

      // Update in database
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
      
      setOpenDialog(false);
      setSelectedFighter(null);
      setSelectedRank('');
    } catch (error) {
      console.error('Error updating rankings:', error);
    }
  };

  // Normalize rankings to ensure they're sequential and valid
  const normalizeRankings = (fightersToNormalize) => {
    // First, find the fighter being updated and their new rank
    const updatedFighter = fightersToNormalize.find(f => f.personid === selectedFighter.personid);
    const newRank = parseInt(selectedRank);

    // Filter out champion and sort remaining fighters
    const otherFighters = fightersToNormalize
      .filter(f => f.personid !== selectedChampionship?.currentChampionId)
      .filter(f => f.personid !== selectedFighter.personid)
      .sort((a, b) => (a.ranking || 999) - (b.ranking || 999));

    // Create final array with updated rankings
    const finalRankings = [];
    let currentRank = 1;

    // Add fighters before the new rank
    while (currentRank < newRank) {
      const nextFighter = otherFighters.find(f => f.ranking === currentRank);
      if (nextFighter) {
        finalRankings.push({ ...nextFighter, ranking: currentRank });
        otherFighters.splice(otherFighters.indexOf(nextFighter), 1);
      }
      currentRank++;
    }

    // Add the updated fighter at their new rank
    finalRankings.push({ ...updatedFighter, ranking: newRank });
    currentRank++;

    // Add remaining fighters
    otherFighters.forEach(fighter => {
      if (currentRank <= 10) {
        finalRankings.push({ ...fighter, ranking: currentRank });
        currentRank++;
      } else {
        finalRankings.push({ ...fighter, ranking: null });
      }
    });

    // Add the champion back to the list if they exist
    const champion = fightersToNormalize.find(f => f.personid === selectedChampionship?.currentChampionId);
    if (champion) {
      finalRankings.push(champion);
    }

    return finalRankings;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Title and Championship selector */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Rankings
        </Typography>
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

                  {/* Ranked Fighters */}
                  {getWeightClassFighters()
                    .filter(f => f.personid !== selectedChampionship.currentChampionId)
                    .map((fighter, index) => (
                      <TableRow 
                        key={fighter.personid}
                        sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                      >
                        <TableCell>
                          {fighter.ranking ? `#${fighter.ranking}` : 'NR'}
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
                          >
                            Update Rank
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
              {[...Array(10)].map((_, i) => (
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