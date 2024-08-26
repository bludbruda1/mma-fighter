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
import { getAllFighters, updateFighter } from "../utils/indexedDB";

const FightScreen = () => {
  // stores the state of the fighters from fighters.json in an array ready for consumption
  const [fighters, setFighters] = useState([]);

  // Handles the state for both selects on this page as seprate fighters for e.g. fighterA and fighterB
  const [selectedItem1, setSelectedItem1] = useState(null);
  const [selectedItem2, setSelectedItem2] = useState(null);

  // stores the state of the winning message and how the fighter won e.g. FighterA wins by Knockout!
  const [winnerMessage, setWinnerMessage] = useState("");

  // handles the state for the fight events that occur during a fight e.g punch, kick etc.
  const [fightEvents, setFightEvents] = useState([]);

  // handles the state of the View Fight Summary modal to tell us whether it is open or not
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch the JSON data from the file
    getAllFighters()
      .then((fetchedFighters) => {
        setFighters(fetchedFighters);
        console.log("Fetched fighters:", fetchedFighters); // Debugging line
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Grabs the fighter info for the fighter that has been selected for the first select component
  const handleSelectChange1 = (event) => {
    const selectedId = Number(event.target.value);
    const selected = fighters.find((x) => x.personid === selectedId);
    setSelectedItem1(selected);
  };

  // Grabs the fighter info for the fighter that has been selected for the second select component
  const handleSelectChange2 = (event) => {
    const selectedId = Number(event.target.value);
    const selected = fighters.find((x) => x.personid === selectedId);
    setSelectedItem2(selected);
  };

  // Fight logic stored here
  const handleFight = () => {
    // When both fighters have been selected and the generate fight button is clicked
    if (selectedItem1 && selectedItem2) {
      // Function to validate and format fighter data
      const validateFighter = (fighter) => {
        return {
          id: fighter.personid,
          name: `${fighter.firstname} ${fighter.lastname}`,
          health: {
            head: Number(fighter.maxHealth) || 1000,
            body: Number(fighter.maxHealth) || 1000,
            legs: Number(fighter.maxHealth) || 1000,
          },
          maxHealth: {
            head: Number(fighter.maxHealth) || 1000,
            body: Number(fighter.maxHealth) || 1000,
            legs: Number(fighter.maxHealth) || 1000,
          },
          stamina: Number(fighter.stamina) || 1000,
          isStanding: true,
          isGroundOffense: false,
          isGroundDefense: false,
          roundsWon: 0,
          Rating: {
            output: Number(fighter.Rating.output) || 0,
            kicking: Number(fighter.Rating.kicking) || 0,
            striking: Number(fighter.Rating.striking) || 0,
            legKickDefence: Number(fighter.Rating.legKickDefence) || 0,
            kickDefence: Number(fighter.Rating.kickDefence) || 0,
            strikingDefence: Number(fighter.Rating.strikingDefence) || 0,
            takedownOffence: Number(fighter.Rating.takedownOffence) || 0,
            takedownDefence: Number(fighter.Rating.takedownDefence) || 0,
            submissionOffense: Number(fighter.Rating.submissionOffense) || 0,
            submissionDefense: Number(fighter.Rating.submissionDefense) || 0,
            groundOffence: Number(fighter.Rating.groundOffence) || 0,
            groundDefence: Number(fighter.Rating.groundDefence) || 0,
            getUpAbility: Number(fighter.Rating.getUpAbility) || 0,
          },
          stats: {}, // Initialize empty stats object, will be filled by simulateFight if needed
          Tendency: fighter.Tendency || {
            standingTendency: {
              punchTendency: 25,
              kickTendency: 25,
              legKickTendency: 25,
              takedownTendency: 25,
            },
            groundOffenseTendency: {
              punchTendency: 50,
              submissionTendency: 25,
              getUpTendency: 25,
            },
            groundDefenseTendency: {
              punchTendency: 25,
              submissionTendency: 25,
              getUpTendency: 50,
            },
          },
        };
      };

      // Validate and store both fighters' info and stats in an array ready for use when simulating the fight
      const opponents = [
        validateFighter(selectedItem1),
        validateFighter(selectedItem2),
      ];

      // Debugging log
      console.log("Fighters set for the fight:", opponents);

      // Clear previous fight events
      setFightEvents([]);

      // These variables are for logging each fight event
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

      // Simulate the fight
      const result = simulateFight(opponents);

      if (result) {
        // Store the winner and loser of the fight
        const winnerFighter = opponents[result.winner];
        const loserFighter = opponents[result.winner === 0 ? 1 : 0];

        // Update the record of the fighters after the fight
        const updatedFighters = fighters.map((fighter) => {
          if (fighter.personid === winnerFighter.id) {
            return {
              ...fighter,
              wins: (fighter.wins || 0) + 1,
              recentFights: [
                {
                  opponent: loserFighter.name, // Update here
                  result: `Win by ${result.method}`,
                },
                ...(fighter.recentFights || []).slice(0, 4),
              ],
            };
          } else if (fighter.personid === loserFighter.id) {
            return {
              ...fighter,
              losses: (fighter.losses || 0) + 1,
              recentFights: [
                {
                  opponent: winnerFighter.name, // Update here
                  result: `Loss by ${result.method}`,
                },
                ...(fighter.recentFights || []).slice(0, 4),
              ],
            };
          } else {
            return fighter;
          }
        });

        // Set the updated fighters, and display the winning message
        Promise.all(updatedFighters.map(updateFighter))
          .then(() => {
            setFighters(updatedFighters);
            setFightEvents(fightEvents);
            setWinnerMessage(
              `${result.winnerName} defeats ${result.loserName} by ${result.method} in round ${result.roundEnded}!`
            );
          })
          .catch((error) => console.error("Error updating fighters:", error));
      } else {
        setWinnerMessage("Error: Invalid fight result.");
      }
    }
  };

  // Logic for the View Fight Summary button open state
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
