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
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { createNewGame, listGames, deleteGame, setCurrentGameDb } from '../utils/indexedDB';
import { useCurrentGame } from '../contexts/CurrentGameContext'

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
  }, []);

  useEffect(() => {
    // Reset to default database when at game selection
    setCurrentGameId(null);
    setCurrentGameDb(null);
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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Planet Fighter
      </Typography>

      <Button 
        variant="contained" 
        onClick={() => setNewGameDialogOpen(true)}
        sx={{ mb: 4 }}
      >
        Create New Game
      </Button>

      <List>
        {games.map((game) => (
          <ListItem 
            key={game.id}
            secondaryAction={
              <IconButton 
                edge="end" 
                onClick={() => {
                  setSelectedGame(game);
                  setDeleteDialogOpen(true);
                }}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={game.name}
              secondary={`Created: ${new Date(game.createdAt).toLocaleDateString()}`}
              onClick={() => handleLoadGame(game)}
              sx={{ cursor: 'pointer' }}
            />
          </ListItem>
        ))}
      </List>

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
    </Container>
  );
};

export default GameManager;