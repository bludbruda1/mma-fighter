import React, { useState } from "react";
import { Grid, Typography, Paper, Button } from "@mui/material";
import GameDateSetter from "../components/GameDateSetter";
import { getGameDate } from "../utils/indexedDB";

const SelectDate = () => {
  const [displayDate, setDisplayDate] = useState(null);

  const handleFetchDate = async () => {
    try {
      const gameDate = await getGameDate(); // Fetch the game date from IndexedDB
      setDisplayDate(`The in-game date is ${gameDate.split("T")[0]}`);
    } catch (error) {
      console.error("Error fetching game date:", error);
      setDisplayDate("Error fetching in-game date.");
    }
  };

  return (
    <Grid
      container
      spacing={3}
      justifyContent="center"
      alignItems="center"
      style={{ height: "100vh", backgroundColor: "#f5f5f5" }}
    >
      <Grid item xs={12} md={6}>
        <Paper
          elevation={3}
          style={{
            padding: "20px",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            style={{ fontWeight: "bold" }}
          >
            Set Game Date
          </Typography>
          <Grid item xs={12} md={6}>
            <GameDateSetter />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              onClick={handleFetchDate}
              sx={{
                marginTop: 2,
                backgroundColor: "rgba(33, 33, 33, 0.9)",
                color: "#fff",
                "&:hover": { backgroundColor: "rgba(33, 33, 33, 0.7)" },
              }}
            >
              Fetch Game Date
            </Button>
          </Grid>
          {displayDate && (
            <Typography
              variant="body1"
              align="center"
              style={{ marginTop: "20px", color: "#333" }}
            >
              {displayDate}
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SelectDate;
