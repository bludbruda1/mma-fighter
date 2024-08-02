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
import { simulateFight } from "../engine/FightSim";

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
        setFighters(jsonData);
        console.log("Fetched fighters:", jsonData); // Debugging line
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
      const validateFighter = (fighter) => {
        console.log("Validating fighter:", fighter); // Debugging line
        return {
          ...fighter,
          Rating: {
            output: Number(fighter.Rating.output) || 0,
            kicking: Number(fighter.Rating.kicking) || 0,
            striking: Number(fighter.Rating.striking) || 0,
            legKickOffence: Number(fighter.Rating.legKickOffence) || 0,
            kickDefence: Number(fighter.Rating.kickDefence) || 0,
            strikingDefence: Number(fighter.Rating.strikingDefence) || 0,
          },
          stats: {
            punchesLanded: Number(fighter.stats.punchesLanded) || 0,
            kicksLanded: Number(fighter.stats.kicksLanded) || 0,
            punchesBlocked: Number(fighter.stats.punchesBlocked) || 0,
            kicksBlocked: Number(fighter.stats.kicksBlocked) || 0,
            significantPunchesLanded:
              Number(fighter.stats.significantPunchesLanded) || 0,
            significantKicksLanded:
              Number(fighter.stats.significantKicksLanded) || 0,
            legKicksLanded: Number(fighter.stats.legKicksLanded) || 0,
            legKicksChecked: Number(fighter.stats.legKicksChecked) || 0,
          },
          currentHealth: Number(fighter.currentHealth) || 100,
          maxHealth: Number(fighter.maxHealth) || 100,
        };
      };

      const opponents = [
        validateFighter({
          id: selectedItem1.personid,
          name: `${selectedItem1.firstname} ${selectedItem1.lastname}`,
          maxHealth: selectedItem1.maxHealth,
          currentHealth: selectedItem1.currentHealth,
          Rating: selectedItem1.Rating,
          stats: selectedItem1.stats,
          roundsWon: selectedItem1.roundsWon,
          Tendency: selectedItem1.Tendency,
        }),
        validateFighter({
          id: selectedItem2.personid,
          name: `${selectedItem2.firstname} ${selectedItem2.lastname}`,
          maxHealth: selectedItem2.maxHealth,
          currentHealth: selectedItem2.currentHealth,
          Rating: selectedItem2.Rating,
          stats: selectedItem2.stats,
          roundsWon: selectedItem2.roundsWon,
          Tendency: selectedItem2.Tendency,
        }),
      ];

      // Debugging log
      console.log("Fighters set for the fight:", opponents);

      const fightEvents = [];
      const logEvent = (event) => {
        fightEvents.push(event);
      };

      console.log = (function (oldLog) {
        return function (message) {
          oldLog.apply(console, arguments);
          logEvent(message);
        };
      })(console.log);

      const result = simulateFight(opponents);

      if (result !== null) {
        const winnerFighter = opponents[result];
        const loserFighter = opponents[result === 0 ? 1 : 0];

        if (winnerFighter && loserFighter) {
          const updatedFighters = fighters.map((fighter) => {
            if (fighter.personid === winnerFighter.id) {
              return { ...fighter, wins: (fighter.wins || 0) + 1 };
            } else if (fighter.personid === loserFighter.id) {
              return { ...fighter, losses: (fighter.losses || 0) + 1 };
            } else {
              return fighter;
            }
          });

          setFighters(updatedFighters);
          setFightEvents(fightEvents);
          setWinnerMessage(`${winnerFighter.name} wins the fight!`);
        } else {
          setWinnerMessage("Error: Unable to determine winner or loser.");
        }
      } else {
        setWinnerMessage("Error: Invalid fight result.");
      }
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
              Select 2 fighters to have a 1 out and see who the victor will be.
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
