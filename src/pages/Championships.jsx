// src/pages/Championships.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import {
  addChampionship,
  getAllChampionships,
  updateChampionship,
  deleteChampionship,
  getAllFighters,
  getNextChampionshipId
} from '../utils/indexedDB';

const Championships = () => {
  const [championships, setChampionships] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newChampionship, setNewChampionship] = useState({
    name: '',
    weightClass: '',
    currentChampionId: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);

  const weightClasses = [
    'Flyweight',
    'Bantamweight',
    'Featherweight',
    'Lightweight',
    'Welterweight',
    'Middleweight',
    'Light Heavyweight',
    'Heavyweight',
  ];

  // Load championships and fighters on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedChampionships, fetchedFighters] = await Promise.all([
          getAllChampionships(),
          getAllFighters()
        ]);
        setChampionships(fetchedChampionships);
        setFighters(fetchedFighters);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateChampionship = async () => {
    try {
      const nextId = await getNextChampionshipId();
      const championship = {
        id: nextId,
        ...newChampionship,
        createdAt: new Date().toISOString(),
      };

      await addChampionship(championship);
      setChampionships(prev => [...prev, championship]);
      setOpenDialog(false);
      setNewChampionship({
        name: '',
        weightClass: '',
        currentChampionId: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating championship:', error);
    }
  };

  const getChampion = (championId) => {
    return fighters.find(f => f.personid === parseInt(championId)) || null;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading champions...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Typography variant="h4" component="h1">
          Champions
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpenDialog(true)}
          sx={{
            backgroundColor: "rgba(33, 33, 33, 0.9)",
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(33, 33, 33, 0.7)",
            },
          }}
        >
          Create Championship
        </Button>
      </Box>

      <Grid container spacing={3}>
        {championships.map((championship) => {
          const champion = getChampion(championship.currentChampionId);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={championship.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  {/* Champion Profile Picture */}
                  {champion && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={champion.profile}
                      alt={`${champion.firstname} ${champion.lastname}`}
                      sx={{ 
                        objectFit: "contain",
                        mb: 2
                      }}
                    />
                  )}
                  <Typography variant="h6" gutterBottom>
                    {championship.name}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {championship.weightClass}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Champion:{' '}
                    {champion ? (
                      <Link
                        to={`/dashboard/${champion.personid}`}
                        style={{
                          textDecoration: 'none',
                          color: '#1976d2',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {`${champion.firstname} ${champion.lastname}`}
                      </Link>
                    ) : (
                      'Vacant'
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {championship.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Championship Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Championship</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Championship Name"
              value={newChampionship.name}
              onChange={(e) => setNewChampionship(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Weight Class</InputLabel>
              <Select
                value={newChampionship.weightClass}
                label="Weight Class"
                onChange={(e) => setNewChampionship(prev => ({ ...prev, weightClass: e.target.value }))}
              >
                {weightClasses.map((weightClass) => (
                  <MenuItem key={weightClass} value={weightClass}>
                    {weightClass}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Current Champion</InputLabel>
              <Select
                value={newChampionship.currentChampionId}
                label="Current Champion"
                onChange={(e) => setNewChampionship(prev => ({ ...prev, currentChampionId: e.target.value }))}
              >
                <MenuItem value="">Vacant</MenuItem>
                {fighters
                  .filter(fighter => fighter.weightClass === newChampionship.weightClass)
                  .map((fighter) => (
                    <MenuItem key={fighter.personid} value={fighter.personid}>
                      {fighter.firstname} {fighter.lastname}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newChampionship.description}
              onChange={(e) => setNewChampionship(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateChampionship}
            variant="contained"
            sx={{
              backgroundColor: "rgba(33, 33, 33, 0.9)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "rgba(33, 33, 33, 0.7)",
              },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Championships;