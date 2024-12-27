import React, { useState } from "react";
import { Grid, Typography, Button, Container } from "@mui/material";
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
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginTop: 2,
      }}
    >
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Set Game Date
      </Typography>

      <GameDateSetter />

      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          marginTop: 2,
        }}
      >
        <Grid item>
          <Button
            variant="contained"
            onClick={handleFetchDate}
            sx={{
              backgroundColor: "rgba(33, 33, 33, 0.9)",
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(33, 33, 33, 0.7)" },
            }}
          >
            Fetch Game Date
          </Button>
        </Grid>
      </Grid>

      {displayDate && (
        <Typography
          variant="body1"
          align="center"
          sx={{ marginTop: 2, color: "#333" }}
        >
          {displayDate}
        </Typography>
      )}
    </Container>
  );
};

export default SelectDate;
