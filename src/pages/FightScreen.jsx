// FightScreen.jsx
import React, { useState, useEffect } from "react";
import "../App.css";
import {
  Button,
  Container,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import Select from "../components/Select";
import { pickFighter, simulateAction } from "../engine/FightSim";

const FightScreen = () => {
  const [fighters, setFighters] = useState([]);
  const [selectedItem1, setSelectedItem1] = useState(null);
  const [selectedItem2, setSelectedItem2] = useState(null);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [fightEvents, setFightEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch the JSON data from the file
    fetch("/fighters.json")
      .then((response) => response.json())
      .then((jsonData) => {
        // Add wins and losses to each fighter
        const updatedFighters = jsonData.map((fighter) => ({
          ...fighter,
          wins: fighter.wins || 0,
          losses: fighter.losses || 0,
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
      const opponents = [
        {
          id: selectedItem1.personid,
          name: `${selectedItem1.firstname} ${selectedItem1.lastname}`,
          age: 30,
          strikePace: 100,
          compositeRating: {
            output: selectedItem1.compositeRating.output,
            kicking: selectedItem1.compositeRating.kicking,
            striking: selectedItem1.compositeRating.striking,
          },
          stat: {},
          skills: ["punching", "kicking"],
          health: 100,
        },
        {
          id: selectedItem2.personid,
          name: `${selectedItem2.firstname} ${selectedItem2.lastname}`,
          age: 28,
          strikePace: 1,
          compositeRating: {
            output: selectedItem2.compositeRating.output,
            kicking: selectedItem2.compositeRating.kicking,
            striking: selectedItem2.compositeRating.striking,
          },
          stat: {},
          skills: ["punching", "kicking"],
          health: 100,
        },
      ];

      let fightOver = false;
      const events = [];
      let lastActionFighter;
      while (!fightOver) {
        const selectedFighter = pickFighter(opponents, lastActionFighter);
        fightOver = simulateAction(opponents, selectedFighter, events);
        lastActionFighter = selectedFighter;
      }
      console.log(opponents); // Display the final health of both fighters

      const winner = opponents[0].health > 0 ? selectedItem1 : selectedItem2;
      const loser = winner === selectedItem1 ? selectedItem2 : selectedItem1;

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
      setFightEvents(events);
      setWinnerMessage(
        `${winner.firstname} ${winner.lastname} wins the fight!`
      );
    } else {
      setWinnerMessage("Please select both fighters to start the fight.");
    }
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
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
              Fight Screen
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="textSecondary"
              gutterBottom
            >
              Select 2 fighters to have a 1 outs and see who the victor will be.
            </Typography>
            <Grid container spacing={2} sx={{ justifyContent: "center" }}>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleFight}
                  sx={{
                    backgroundColor: "rgba(33, 33, 33, 0.9)", // Dark grey background with slight transparency
                    color: "#fff", // White text color for contrast
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)", // Slightly lighter dark grey on hover
                    },
                  }}
                >
                  Generate fight
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleDialogOpen}
                  sx={{
                    backgroundColor: "rgba(33, 33, 33, 0.9)", // Dark grey background with slight transparency
                    color: "#fff", // White text color for contrast
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)", // Slightly lighter dark grey on hover
                    },
                  }}
                >
                  View Fight Summary
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
              <Grid container spacing={3} justifyContent="space-between">
                <Grid item xs={12} md={5}>
                  <Select
                    fighters={fighters}
                    selectedItem={selectedItem1}
                    onSelectChange={handleSelectChange1}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
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
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Fight Summary</DialogTitle>
        <DialogContent>
          <List>
            {fightEvents.map((event, index) => (
              <ListItem key={index}>
                <ListItemText primary={event} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FightScreen;
