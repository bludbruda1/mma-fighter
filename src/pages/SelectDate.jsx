import React, { useState } from "react";
import { Container, Typography, TextField, Button, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { saveGame } from "../utils/indexedDB";

const SelectDate = () => {
  const navigate = useNavigate();
  const [gameDate, setGameDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [managerName, setManagerName] = useState("");

  const handleSaveGame = async () => {
    try {
      if (!managerName.trim()) {
        alert("Please enter a manager name.");
        return;
      }

      await saveGame({ gameDate, managerName });
      alert("Game saved successfully!");
      navigate("/calendar"); // Redirect to the main game screen
    } catch (error) {
      console.error("Error saving game:", error);
      alert("Failed to save game.");
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Select Game Start Date
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Manager Name"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="Enter your name"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveGame}
            sx={{ backgroundColor: "rgba(33, 33, 33, 0.9)", color: "#fff" }}
          >
            Start Game
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SelectDate;
