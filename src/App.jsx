import React, { useState, useEffect } from "react";
import "./App.css";
import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import Select from "./components/Select";

const App = () => {
  const [fighters, setFighters] = useState([]);
  const [selectedItem1, setSelectedItem1] = useState(null);
  const [selectedItem2, setSelectedItem2] = useState(null);
  const [winnerMessage, setWinnerMessage] = useState("");

  useEffect(() => {
    // Fetch the JSON data from the file
    fetch("/fighters.json")
      .then((response) => response.json())
      .then((jsonData) => {
        // Add wins and losses to each fighter
        const updatedFighters = jsonData.map((fighter) => ({
          ...fighter,
          wins: 0,
          losses: 0,
        }));
        setFighters(updatedFighters);
        console.log("Fetched fighters:", updatedFighters); // Debugging line
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleSelectChange1 = (event) => {
    const selectedId = Number(event.target.value);
    const selected = fighters.find((x) => x.personid === selectedId);
    setSelectedItem1(selected);
  };

  const handleSelectChange2 = (event) => {
    const selectedId = Number(event.target.value);
    const selected = fighters.find((x) => x.personid === selectedId);
    setSelectedItem2(selected);
  };

  const handleFight = () => {
    if (selectedItem1 && selectedItem2) {
      const winner = Math.random() < 0.5 ? selectedItem1 : selectedItem2;
      const loser = winner === selectedItem1 ? selectedItem2 : selectedItem1;

      // Update wins and losses
      const updatedFighters = fighters.map((fighter) => {
        if (fighter.personid === winner.personid) {
          return { ...fighter, wins: fighter.wins + 1 };
        } else if (fighter.personid === loser.personid) {
          return { ...fighter, losses: fighter.losses + 1 };
        } else {
          return fighter;
        }
      });

      setFighters(updatedFighters);
      setWinnerMessage(
        `${winner.firstname} ${winner.lastname} wins the fight!`
      );
      console.log(winner.firstname + winner.wins);
    } else {
      setWinnerMessage("Please select both fighters to start the fight.");
    }
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <SportsMmaIcon />
          <Typography variant="h6">MMA Fighter</Typography>
        </Toolbar>
      </AppBar>
      <main>
        <div>
          <Container
            maxWidth="md"
            style={{ marginTop: "50px", marginBottom: "20px" }}
          >
            <Typography
              variant="h2"
              align="center"
              color="textPrimary"
              gutterBottom
            >
              MMA Fighter
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="textSecondary"
              gutterBottom
            >
              Welcome to MMAFighter, a combat sport simulation game that lets
              you create your own world of fighting and provides an experience
              of running the show.
            </Typography>
            <Grid container spacing={2} sx={{ justifyContent: "center" }}>
              <Grid item>
                <Button variant="contained" onClick={handleFight}>
                  Generate fight
                </Button>
              </Grid>
            </Grid>
            {winnerMessage && (
              <Typography
                variant="h5"
                align="center"
                color="textPrimary"
                style={{ marginTop: "20px" }}
              >
                {winnerMessage}
              </Typography>
            )}
            <div>
              <Grid
                container
                rowSpacing={1}
                columnSpacing={55}
                justify="center"
              >
                <Grid item>
                  <Select
                    fighters={fighters}
                    selectedItem={selectedItem1}
                    onSelectChange={handleSelectChange1}
                  />
                </Grid>
                <Grid item>
                  <Select
                    fighters={fighters}
                    selectedItem={selectedItem2}
                    onSelectChange={handleSelectChange2}
                  />
                </Grid>
              </Grid>
            </div>
          </Container>
        </div>
      </main>
    </>
  );
};

export default App;
