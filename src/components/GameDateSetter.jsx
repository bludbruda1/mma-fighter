import React, { useState } from "react";
import { FormControl, TextField, Button, Grid } from "@mui/material";
import { saveGameDate } from "../utils/indexedDB";
import { useGameDate } from "../contexts/GameDateContext";

const GameDateSetter = () => {
  const { gameDate, setGameDate } = useGameDate();
  const [selectedDate, setSelectedDate] = useState(
    gameDate.split("T")[0] // Extract YYYY-MM-DD from ISO format
  );

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value); // Update local state for the input
  };

  const handleSaveDate = async () => {
    setGameDate(selectedDate); // Update game date in context as YYYY-MM-DD
    await saveGameDate(selectedDate); // Save to IndexedDB
    console.log(`Game date saved: ${selectedDate}`); // Log saved date
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Grid item>
          <FormControl>
            <TextField
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true, // Ensure the label remains in the correct position
              }}
            />
          </FormControl>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={handleSaveDate}
            sx={{
              marginTop: 2,
              backgroundColor: "rgba(33, 33, 33, 0.9)",
              color: "#fff",
            }}
          >
            Save Date
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default GameDateSetter;
