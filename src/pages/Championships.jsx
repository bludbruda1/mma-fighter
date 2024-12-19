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
  DialogContentText,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import {
  addChampionship,
  getAllChampionships,
  updateChampionship,
  deleteChampionship,
  getAllFighters,
  getNextChampionshipId,
} from '../utils/indexedDB';

const Championships = () => {
  // State management for championships and fighters data
  const [championships, setChampionships] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for managing different dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vacateDialogOpen, setVacateDialogOpen] = useState(false);
  const [selectedChampionship, setSelectedChampionship] = useState(null);

  // State for new championship form
  const [newChampionship, setNewChampionship] = useState({
    name: '',
    weightClass: '',
    currentChampionId: '',
    description: '',
  });

  // State for fight history
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [championshipHistory, setChampionshipHistory] = useState([]);

  // Available weight classes
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

  // Load championships and fighters data
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

  // Function to get championship fight history
  const getChampionshipHistory = (championship) => {
    const history = [];
    
    // Go through each reign and create fight entries
    championship.reigns.forEach(reign => {
      // Add the title win
      history.push({
        date: reign.startDate,
        winner: {
          id: reign.championId,
          name: reign.name
        },
        loser: {
          id: reign.wonFromId,
          name: reign.wonFromName
        },
        method: reign.winMethod,
        round: reign.winRound,
        time: reign.winTime,
        eventId: reign.eventId,
        isTitleWin: true
      });
  
      // Check if defenses exist and is an array before iterating
      if (reign.defenses && Array.isArray(reign.defenses)) {
        reign.defenses.forEach(defense => {
          history.push({
            date: defense.date,
            winner: {
              id: reign.championId,
              name: reign.name
            },
            loser: {
              id: defense.opponentId,
              name: defense.opponentName
            },
            method: defense.method,
            round: defense.round,
            time: defense.time,
            eventId: defense.eventId,
            isTitleDefense: true
          });
        });
      }
    });
  
    // Sort by date in descending order
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Handle opening history dialog
  const handleViewHistory = (championship) => {
    const history = getChampionshipHistory(championship); 
    setChampionshipHistory(history);
    setSelectedChampionship(championship);
    setHistoryDialogOpen(true);
  };

  // History dialog to render function's return statement
  const renderHistoryDialog = () => {
    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return ''; 
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    return (
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedChampionship?.name} History
        </DialogTitle>
        <DialogContent>
          {championshipHistory.length > 0 ? (
            <List>
              {championshipHistory.map((fight, index) => (
                <React.Fragment key={`${fight.date}-${index}`}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" component="span">
                            {fight.winner.id ? (
                              <Link
                                to={`/dashboard/${fight.winner.id}`}
                                style={{
                                  textDecoration: "none",
                                  color: "#1976d2",
                                }}
                              >
                                {fight.winner.name}
                              </Link>
                            ) : (
                              <Typography component="span">
                                {fight.winner.name}
                              </Typography>
                            )}
                            {' def. '}
                            {fight.loser.id ? (
                              <Link
                                to={`/dashboard/${fight.loser.id}`}
                                style={{
                                  textDecoration: "none",
                                  color: "#1976d2",
                                }}
                              >
                                {fight.loser.name}
                              </Link>
                            ) : (
                              <Typography component="span">
                                {fight.loser.name}
                              </Typography>
                            )}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={fight.method}
                            color="primary"
                            variant="outlined"
                          />
                          {fight.isTitleWin && (
                            <Chip 
                              size="small" 
                              label="Won Title"
                              color="success"
                              sx={{
                                bgcolor: 'rgba(255, 215, 0, 0.1)',
                                borderColor: 'gold',
                                color: 'gold'
                              }}
                            />
                          )}
                          {fight.isTitleDefense && (
                            <Chip 
                              size="small" 
                              label="Title Defense"
                              color="info"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(fight.date)} • Round {fight.round} • {fight.time}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < championshipHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>No title fight history available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Handle creating a new championship
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
      // Reset form
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

  // Handle deleting a championship
  const handleDeleteChampionship = async () => {
    try {
      if (!selectedChampionship) return;
      
      await deleteChampionship(selectedChampionship.id);
      setChampionships(prev => prev.filter(c => c.id !== selectedChampionship.id));
      setDeleteDialogOpen(false);
      setSelectedChampionship(null);
    } catch (error) {
      console.error('Error deleting championship:', error);
    }
  };

  // Handle vacating a championship
  const handleVacateChampionship = async () => {
    try {
      if (!selectedChampionship) return;

      const updatedChampionship = {
        ...selectedChampionship,
        currentChampionId: ''
      };

      await updateChampionship(updatedChampionship);
      setChampionships(prev => prev.map(c => 
        c.id === selectedChampionship.id ? updatedChampionship : c
      ));
      setVacateDialogOpen(false);
      setSelectedChampionship(null);
    } catch (error) {
      console.error('Error vacating championship:', error);
    }
  };

  // Helper function to get champion details
  const getChampion = (championId) => {
    return fighters.find(f => f.personid === parseInt(championId)) || null;
  };

  // Render management buttons for each championship card
  const renderManagementButtons = (championship) => {
    const champion = getChampion(championship.currentChampionId);
    
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mt: 2,
        gap: 1
      }}>
        {/* History Button */}
        <Tooltip title="View Title History" arrow placement="top">
          <IconButton
            aria-label="view championship history"
            onClick={() => handleViewHistory(championship)}
            sx={{
              backgroundColor: 'info.light',
              color: 'info.contrastText',
              '&:hover': {
                backgroundColor: 'info.main',
              },
            }}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        {/* Only show vacate button if there's a champion */}
        {champion && (
        <Tooltip title="Vacate Title" arrow placement="top">
          <IconButton
            aria-label="vacate championship"
            onClick={() => {
              setSelectedChampionship(championship);
              setVacateDialogOpen(true);
            }}
            sx={{
              backgroundColor: 'warning.light',
              color: 'warning.contrastText',
              '&:hover': {
                backgroundColor: 'warning.main',
              },
            }}
          >
            <RemoveCircleOutlineIcon />
          </IconButton>
          </Tooltip>
        )} 
        <Tooltip title="Delete Championship" arrow placement="top">
        <IconButton
          aria-label="delete championship"
          onClick={() => {
            setSelectedChampionship(championship);
            setDeleteDialogOpen(true);
          }}
          sx={{
            backgroundColor: 'error.light',
            color: 'error.contrastText',
            '&:hover': {
              backgroundColor: 'error.main',
            },
          }}
        >
          <DeleteIcon />
        </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Render warning dialogs for delete and vacate actions
  const renderWarningDialogs = () => (
    <>
      {/* Delete Championship Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedChampionship(null);
        }}
      >
        <DialogTitle>Delete Championship?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the {selectedChampionship?.name}?
            This action cannot be undone. The championship and its history will be permanently removed.
            {selectedChampionship?.currentChampionId && 
              " The current champion will lose their title."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedChampionship(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteChampionship}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vacate Championship Dialog */}
      <Dialog
        open={vacateDialogOpen}
        onClose={() => {
          setVacateDialogOpen(false);
          setSelectedChampionship(null);
        }}
      >
        <DialogTitle>Vacate Championship?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to vacate the {selectedChampionship?.name}?
            {selectedChampionship && getChampion(selectedChampionship.currentChampionId) && (
              ` ${getChampion(selectedChampionship.currentChampionId).firstname} 
              ${getChampion(selectedChampionship.currentChampionId).lastname} 
              will lose their champion status.`
            )}
            This will make the championship vacant until a new champion is crowned.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setVacateDialogOpen(false);
              setSelectedChampionship(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleVacateChampionship}
            variant="contained"
            color="warning"
          >
            Vacate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading champions...</Typography>
      </Container>
    );
  }

  // Main render
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Page Header */}
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

      {/* Championships Grid */}
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
                  {/* Championship Details */}
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
                  
                  {/* Management Buttons */}
                  {renderManagementButtons(championship)}
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
                onChange={(e) => setNewChampionship(prev => ({ 
                  ...prev, 
                  currentChampionId: e.target.value 
                }))}
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
              onChange={(e) => setNewChampionship(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
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

      {/* Warning Dialogs */}
      {renderWarningDialogs()}

      {/* History Dialog */}
      {renderHistoryDialog()}
    </Container>
  );
};

export default Championships;