import React, { useState, useEffect } from "react";
import "../App.css";
import {
  Button,
  Card,
  CardMedia,
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
import StatBar from "../components/StatBar";
import Tab from "../components/Tab";
import { simulateFight, FIGHTER_POSITIONS } from "../engine/FightSim";
import { getAllFighters, updateFighter } from "../utils/indexedDB";
import {
  calculateFightStats,
  displayFightStats,
} from "../engine/FightStatistics";

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

  // handles the state of the View Fight Stats modal to tell us whether it is open or not
  const [dialogStatsOpen, setDialogStatsOpen] = useState(false);

  // New state for handling the fight statistics
  const [fightStats, setFightStats] = useState(null);

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
            head: Number(fighter.maxHealth.head) || 1000,
            body: Number(fighter.maxHealth.body) || 1000,
            legs: Number(fighter.maxHealth.legs) || 1000,
          },
          maxHealth: {
            head: Number(fighter.maxHealth.head) || 1000,
            body: Number(fighter.maxHealth.body) || 1000,
            legs: Number(fighter.maxHealth.legs) || 1000,
          },
          stamina: Number(fighter.stamina) || 1000,
          position: FIGHTER_POSITIONS.STANDING,
          roundsWon: 0,
          Rating: {
            output: Number(fighter.Rating.output) || 0,
            strength: Number(fighter.Rating.strength) || 0,
            speed: Number(fighter.Rating.speed) || 0,
            cardio: Number(fighter.Rating.cardio) || 0,
            toughness: Number(fighter.Rating.toughness) || 0,
            striking: Number(fighter.Rating.striking) || 0,
            punchPower: Number(fighter.Rating.punchPower) || 0,
            handSpeed: Number(fighter.Rating.handSpeed) || 0,
            punchAccuracy: Number(fighter.Rating.punchAccuracy) || 0,
            kicking: Number(fighter.Rating.kicking) || 0,
            kickPower: Number(fighter.Rating.kickPower) || 0,
            kickSpeed: Number(fighter.Rating.kickSpeed) || 0,
            kickAccuracy: Number(fighter.Rating.kickAccuracy) || 0,
            strikingDefence: Number(fighter.Rating.strikingDefence) || 0,
            kickDefence: Number(fighter.Rating.kickDefence) || 0,
            headMovement: Number(fighter.Rating.headMovement) || 0,
            footwork: Number(fighter.Rating.footwork) || 0,
            takedownOffence: Number(fighter.Rating.takedownOffence) || 0,
            takedownDefence: Number(fighter.Rating.takedownDefence) || 0,
            clinchOffence: Number(fighter.Rating.clinchOffence) || 0,
            clinchDefence: Number(fighter.Rating.clinchDefence) || 0,
            clinchStriking: Number(fighter.Rating.clinchStriking) || 0,
            clinchGrappling: Number(fighter.Rating.clinchGrappling) || 0,
            clinchControl: Number(fighter.Rating.clinchControl) || 0,
            groundOffence: Number(fighter.Rating.groundOffence) || 0,
            groundDefence: Number(fighter.Rating.groundDefence) || 0,
            groundControl: Number(fighter.Rating.groundControl) || 0,
            groundStriking: Number(fighter.Rating.groundStriking) || 0,
            submissionOffence: Number(fighter.Rating.submissionOffence) || 0,
            submissionDefence: Number(fighter.Rating.submissionDefence) || 0,
            getUpAbility: Number(fighter.Rating.getUpAbility) || 0,
            composure: Number(fighter.Rating.composure) || 0,
            fightIQ: Number(fighter.Rating.fightIQ) || 0,
          },
          stats: {}, // Initialize empty stats object, will be filled by simulateFight if needed
          Tendency: {
            strikingVsGrappling:
              Number(fighter.Tendency.strikingVsGrappling) || 0,
            aggressiveness: Number(fighter.Tendency.aggressiveness) || 0,
            counterVsInitiator:
              Number(fighter.Tendency.counterVsInitiator) || 0,
            standupPreference: {
              boxing: Number(fighter.Tendency.standupPreference.boxing) || 0,
              kickBoxing:
                Number(fighter.Tendency.standupPreference.kickBoxing) || 0,
              muayThai:
                Number(fighter.Tendency.standupPreference.muayThai) || 0,
              karate: Number(fighter.Tendency.standupPreference.karate) || 0,
              taekwondo:
                Number(fighter.Tendency.standupPreference.taekwondo) || 0, // Fixed typo: was 'karate'
            },
            grapplingPreference: {
              wrestling:
                Number(fighter.Tendency.grapplingPreference.wrestling) || 0,
              judo: Number(fighter.Tendency.grapplingPreference.judo) || 0,
              bjj: Number(fighter.Tendency.grapplingPreference.bjj) || 0,
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

        // Calculate fight statistics
        const stats = calculateFightStats(
          {
            stats: result.fighterStats[0],
            health: result.fighterHealth[0],
            maxHealth: result.fighterMaxHealth[0],
          },
          {
            stats: result.fighterStats[1],
            health: result.fighterHealth[1],
            maxHealth: result.fighterMaxHealth[1],
          }
        );
        setFightStats(stats);

        // Display detailed fight stats
        displayFightStats([
          {
            name: selectedItem1.firstname + " " + selectedItem1.lastname,
            stats: result.fighterStats[0],
            health: result.fighterHealth[0],
            maxHealth: result.fighterMaxHealth[0],
          },
          {
            name: selectedItem2.firstname + " " + selectedItem2.lastname,
            stats: result.fighterStats[1],
            health: result.fighterHealth[1],
            maxHealth: result.fighterMaxHealth[1],
          },
        ]);

        // Update the record of the fighters after the fight
        const updatedFighters = fighters.map((fighter) => {
          if (fighter.personid === winnerFighter.id) {
            return {
              ...fighter,
              wins: (fighter.wins || 0) + 1,
              recentFights: [
                {
                  opponentId: loserFighter.id,
                  opponent: loserFighter.name,
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
                  opponentId: winnerFighter.id,
                  opponent: winnerFighter.name,
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
              `${result.winnerName} defeats ${result.loserName} by ${
                result.method === "submission"
                  ? `${result.method} (${result.submissionType})`
                  : result.method
              } in round ${result.roundEnded}!`
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

  // Logic for the View Fight Stats button open state
  const handleStatsDialogOpen = () => {
    setDialogStatsOpen(true);
  };

  const handleStatsDialogClose = () => {
    setDialogStatsOpen(false);
  };

  // Handling the tabs in the fight stats
  const tabs = fightStats
    ? [
        {
          label: "All",
          content: (
            <>
              <StatBar
                redValue={fightStats.totalStrikes.red}
                blueValue={fightStats.totalStrikes.blue}
                title="Total Strikes"
              />
              <StatBar
                redValue={fightStats.takedowns.red}
                blueValue={fightStats.takedowns.blue}
                title="Takedowns"
              />
              <StatBar
                redValue={fightStats.submissionAttempts.red}
                blueValue={fightStats.submissionAttempts.blue}
                title="Submission Attempts"
              />
            </>
          ),
        },
        {
          label: "Total Strikes",
          content: (
            <StatBar
              redValue={fightStats.totalStrikes.red}
              blueValue={fightStats.totalStrikes.blue}
              title="Total Strikes"
            />
          ),
        },
        {
          label: "Takedowns",
          content: (
            <StatBar
              redValue={fightStats.takedowns.red}
              blueValue={fightStats.takedowns.blue}
              title="Takedowns"
            />
          ),
        },
        {
          label: "Submission Attempts",
          content: (
            <StatBar
              redValue={fightStats.submissionAttempts.red}
              blueValue={fightStats.submissionAttempts.blue}
              title="Submission Attempts"
            />
          ),
        },
      ]
    : [];

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
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleStatsDialogOpen}
                  sx={{
                    backgroundColor: "rgba(33, 33, 33, 0.9)", // Dark grey background with slight transparency
                    color: "#fff", // White text color for contrast
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)", // Slightly lighter dark grey on hover
                    },
                  }}
                >
                  View Fight Stats
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
      <Dialog
        open={dialogStatsOpen}
        onClose={handleStatsDialogClose}
        fullWidth={true}
        maxWidth="lg"
      >
        <DialogTitle>Fight Statistics</DialogTitle>
        <DialogContent>
          {fightStats && (
            <Grid
              container
              spacing={6}
              alignItems="center"
              style={{ marginTop: "20px" }}
            >
              <Grid
                item
                xs={12}
                md={3}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  sx={{ marginBottom: "20px" }} // Adjusted margin
                >
                  {selectedItem1.firstname} {selectedItem1.lastname}
                </Typography>

                <Card style={{ border: "none", boxShadow: "none" }}>
                  <CardMedia
                    component="img"
                    style={{ objectFit: "contain" }}
                    height="250"
                    image={selectedItem1.image}
                    sx={{ marginBottom: "20px" }} // Adjusted margin
                  />
                </Card>

                <Typography
                  variant="h7"
                  align="center"
                  sx={{ marginTop: "10px" }} // Adjusted margin for closer alignment to the card
                >
                  {selectedItem1.nationality}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Tab tabs={tabs} />
              </Grid>
              <Grid
                item
                xs={12}
                md={3}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  sx={{ marginBottom: "20px" }} // Adjusted margin
                >
                  {selectedItem2.firstname} {selectedItem2.lastname}
                </Typography>

                <Card style={{ border: "none", boxShadow: "none" }}>
                  <CardMedia
                    component="img"
                    style={{ objectFit: "contain" }}
                    height="250"
                    image={selectedItem2.image}
                    sx={{ marginBottom: "20px" }} // Adjusted margin
                  />
                </Card>

                <Typography
                  variant="h7"
                  align="center"
                  sx={{ marginTop: "10px" }} // Adjusted margin for closer alignment to the card
                >
                  {selectedItem2.nationality}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatsDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FightScreen;
