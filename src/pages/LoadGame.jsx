import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loadGames } from "../utils/indexedDB";

const LoadGame = () => {
  const [games, setGames] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const savedGames = await loadGames();
        console.log("Loaded games:", savedGames); // Log the structure of the returned data

        // If savedGames is an array, no need for ".games"
        const gamesArray = Array.isArray(savedGames) ? savedGames : [];

        setGames(gamesArray);
      } catch (err) {
        console.error("Error loading games:", err);
        setError("Failed to load saved games. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handleLoadGame = (game) => {
    // Set the state of the game or navigate to the game with selected save
    console.log("Loading game:", game);
    // Example: Navigate to the main game page with selected save details
    navigate("/main", { state: { game } });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (games.length === 0) {
    return (
      <Container maxWidth="sm">
        <Typography
          variant="h5"
          align="center"
          sx={{ mt: 4, color: "text.secondary" }}
        >
          No saved games found.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Load Game
      </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        Select a saved game to continue.
      </Typography>
      <List>
        {games.map((game) => (
          <ListItem
            key={game.id}
            sx={{
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              marginBottom: "8px",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.05)",
              },
            }}
            onClick={() => handleLoadGame(game)}
          >
            <ListItemText
              primary={`Manager: ${game.managerName}`}
              secondary={`Game Date: ${game.gameDate}`}
            />
          </ListItem>
        ))}
      </List>
      <Button
        variant="outlined"
        onClick={() => navigate("/")}
        sx={{ mt: 2, width: "100%" }}
      >
        Back to Main Menu
      </Button>
    </Container>
  );
};

export default LoadGame;
