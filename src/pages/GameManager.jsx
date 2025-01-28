import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { createNewGame, listGames, deleteGame } from '../utils/indexedDB';
import { useCurrentGame } from '../contexts/CurrentGameContext';

const GameManager = () => {
  const { setCurrentGameId } = useCurrentGame();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [newGameDialogOpen, setNewGameDialogOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  // Load saved games on component mount
  useEffect(() => {
    loadGames();
    setCurrentGameId(null);
  }, [setCurrentGameId]);

  const loadGames = async () => {
    const savedGames = await listGames();
    setGames(savedGames);
  };

  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;

    try {
      const game = await createNewGame(newGameName);
      setGames([...games, game]);
      setNewGameDialogOpen(false);
      setNewGameName('');
      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const handleDeleteGame = async () => {
    if (!selectedGame) return;

    try {
      await deleteGame(selectedGame.id);
      setGames(games.filter(g => g.id !== selectedGame.id));
      setDeleteDialogOpen(false);
      setSelectedGame(null);
    } catch (error) {
      console.error("Error deleting game:", error);
    }
  };

  const handleLoadGame = (game) => {
    navigate(`/game/${game.id}/`);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Welcome to Planet Fighter
        </Typography>
        <Typography variant="h5" gutterBottom>
          The ultimate MMA simulation game
        </Typography>
      </Box>

      {/* Create New Game Button */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => setNewGameDialogOpen(true)}
        >
          Create New Game
        </Button>
      </Box>

      {/* Game List */}
      <Grid container spacing={3}>
        {games.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {game.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created: {new Date(game.createdAt).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => handleLoadGame(game)}
                  >
                    Load Game
                  </Button>
                  <IconButton 
                    edge="end" 
                    onClick={() => {
                      setSelectedGame(game);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* New Game Dialog */}
      <Dialog open={newGameDialogOpen} onClose={() => setNewGameDialogOpen(false)}>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Game Name"
            fullWidth
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGame}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Game?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {selectedGame?.name}? This cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGame} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          © 2025 Planet Fighter. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default GameManager;