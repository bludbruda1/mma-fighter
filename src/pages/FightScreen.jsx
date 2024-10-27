import React, { useState, useEffect } from "react";
import "../App.css";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
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
import ResultCard from "../components/ResultCard";
import FightViewer from "../components/FightViewer";
import { formatTime } from "../engine/helper";
import { simulateFight } from "../engine/FightSim";
import fightPlayByPlayLogger from '../engine/fightPlayByPlayLogger';
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
  const [showFightViewer, setShowFightViewer] = useState(false);
  const [fightEvents, setFightEvents] = useState([]);

  // handles the state of the View Fight Summary modal to tell us whether it is open or not
  const [dialogOpen, setDialogOpen] = useState(false);

  // New state for handling the fight statistics
  const [fightStats, setFightStats] = useState(null);

  // New state for storing round-by-round statistics
  const [roundStats, setRoundStats] = useState([]);

  // New state for storing our winner index to determine the winner of the fight for winning message logic in the fight summary
  const [winnerIndex, setWinnerIndex] = useState(null);

  const [fightResult, setFightResult] = useState(null);

  // Create logger instance
  const playByPlayLogger = new fightPlayByPlayLogger(true);

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
      // Clear previous fight events
      setFightEvents([]);
  
      // These variables are for logging each fight event
      const fightEvents = [];
      const logEvent = (event) => {
        fightEvents.push(event);
      };
  
      // Override console.log for event logging
      console.log = (function(oldLog) {
        return function(message) {
          oldLog.apply(console, arguments);
          logEvent(message);
        };
      })(console.log);
  
      // Simulate the fight with complete fighter data
      const result = simulateFight([selectedItem1, selectedItem2], playByPlayLogger);
  
      if (result) {
        // Store the winner's index (0 or 1) in the state
        setWinnerIndex(result.winner);
        
        // Store the result in state
        setFightResult(result);
  
        // Get the events directly from the logger
        const playByPlayEvents = playByPlayLogger.getFightPlayByPlay();
        setFightEvents(playByPlayEvents);
  
        // Update winner message
        setWinnerMessage(
          `${result.winnerName} defeats ${result.loserName} by ${
            result.method === "Submission"
              ? `${result.method} (${result.submissionType})`
              : result.method
          } in round ${result.roundEnded}!`
        );
  
        // Update fighters' records and fight history
        const updatedFighters = fighters.map((fighter) => {
          if (fighter.personid === selectedItem1.personid) {
            return {
              ...fighter,
              wins: result.winner === 0 ? (fighter.wins || 0) + 1 : fighter.wins,
              losses: result.winner === 1 ? (fighter.losses || 0) + 1 : fighter.losses,
              fightHistory: [
                {
                  opponentId: selectedItem2.personid,
                  opponent: `${selectedItem2.firstname} ${selectedItem2.lastname}`,
                  result: result.winner === 0 ? 'Win' : 'Loss',
                  method: result.method,
                },
                ...(fighter.fightHistory || []),
              ],
            };
          } else if (fighter.personid === selectedItem2.personid) {
            return {
              ...fighter,
              wins: result.winner === 1 ? (fighter.wins || 0) + 1 : fighter.wins,
              losses: result.winner === 0 ? (fighter.losses || 0) + 1 : fighter.losses,
              fightHistory: [
                {
                  opponentId: selectedItem1.personid,
                  opponent: `${selectedItem1.firstname} ${selectedItem1.lastname}`,
                  result: result.winner === 1 ? 'Win' : 'Loss',
                  method: result.method,
                },
                ...(fighter.fightHistory || []),
              ],
            };
          }
          return fighter;
        });
  
        // Update the fighters in the database
        Promise.all(updatedFighters.map(updateFighter))
          .then(() => {
            setFighters(updatedFighters);
          })
          .catch((error) => console.error("Error updating fighters:", error));
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

  // Function to render total stats
  const renderTotalStats = () => (
    <>
      <StatBar
        redValue={fightStats.totalStrikes.red}
        blueValue={fightStats.totalStrikes.blue}
        title="Total Strikes"
      />
      <StatBar
        redValue={fightStats.takedownsAttempted.red}
        blueValue={fightStats.takedownsAttempted.blue}
        title="Total Attempted Takedowns"
      />
      <StatBar
        redValue={fightStats.takedownsSuccessful.red}
        blueValue={fightStats.takedownsSuccessful.blue}
        title="Total Successful Takedowns"
      />
      <StatBar
        redValue={fightStats.submissionAttempts.red}
        blueValue={fightStats.submissionAttempts.blue}
        title="Total Submission Attempts"
      />
    </>
  );

  // Function to render round stats
  const renderRoundStats = (roundIndex) => {
    if (roundStats && roundStats[roundIndex]) {
      return (
        <>
          <StatBar
            redValue={roundStats[roundIndex].punchsThrown.red}
            blueValue={roundStats[roundIndex].punchsThrown.blue}
            title="Punches Thrown"
          />
          <StatBar
            redValue={roundStats[roundIndex].takedowns.red}
            blueValue={roundStats[roundIndex].takedowns.blue}
            title="Successful Takedowns"
          />
          <StatBar
            redValue={roundStats[roundIndex].submissionAttempts.red}
            blueValue={roundStats[roundIndex].submissionAttempts.blue}
            title="Submissions Attempted"
          />
        </>
      );
    }
    return <Typography>No data available for this round.</Typography>;
  };

  // Prepare tabs data
  const prepareTabs = () => {
    const tabs = [
      { label: "Total Stats", content: renderTotalStats() },
      { label: "Round 1", content: renderRoundStats(0) },
    ];

    if (roundStats.length >= 2) {
      tabs.push({ label: "Round 2", content: renderRoundStats(1) });
    }

    if (roundStats.length >= 3) {
      tabs.push({ label: "Round 3", content: renderRoundStats(2) });
    }

    return tabs;
  };

  const fightSummaryTabs = fightEvents
    ? [
        {
          label: "Fight Statistics",
          content: (
            <>
              {fightStats && (
                <Grid
                  container
                  spacing={4}
                  alignItems="center"
                  justifyContent="center"
                  style={{ marginTop: "20px" }}
                >
                  {/* Left Fighter Details */}
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
                      sx={{ marginBottom: "20px", fontWeight: "bold" }}
                    >
                      {selectedItem1.firstname} {selectedItem1.lastname}
                      {winnerIndex === 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label="Winner"
                            size="small"
                            color="success"
                            sx={{ marginTop: "8px" }}
                          />
                        </Box>
                      )}
                    </Typography>

                    <Card style={{ border: "none", boxShadow: "none" }}>
                      <CardMedia
                        component="img"
                        style={{ objectFit: "contain" }}
                        height="250"
                        image={selectedItem1.image}
                        sx={{ marginBottom: "20px" }}
                      />
                    </Card>

                    <Typography
                      variant="h7"
                      align="center"
                      sx={{ marginTop: "10px", fontWeight: "bold" }}
                    >
                      {selectedItem1.nationality}
                    </Typography>
                  </Grid>

                  {/* ResultCard */}
                  <Grid
                    item
                    xs={12}
                    md={6}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {fightResult && (
                      <ResultCard
                        round={fightResult.roundEnded}
                        time={fightResult.formattedEndTime}
                        method={fightResult.method}
                      />
                    )}

                    {/* Tabs */}
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        maxWidth: "600px", // Increase the max-width to accommodate longer text
                        margin: "0 auto", // Center align the container
                      }}
                    >
                      <Grid
                        item
                        xs={12}
                        style={{
                          justifyContent: "center",
                          marginTop: "20px", // Space between ResultCard and Tabs
                        }}
                      >
                        <Tab tabs={prepareTabs()} />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Right Fighter Details */}
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
                      sx={{ marginBottom: "20px", fontWeight: "bold" }}
                    >
                      {selectedItem2.firstname} {selectedItem2.lastname}
                      {winnerIndex === 1 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label="Winner"
                            size="small"
                            color="success"
                            sx={{ marginTop: "8px" }}
                          />
                        </Box>
                      )}
                    </Typography>

                    <Card style={{ border: "none", boxShadow: "none" }}>
                      <CardMedia
                        component="img"
                        style={{ objectFit: "contain" }}
                        height="250"
                        image={selectedItem2.image}
                        sx={{ marginBottom: "20px" }}
                      />
                    </Card>

                    <Typography
                      variant="h7"
                      align="center"
                      sx={{ marginTop: "10px", fontWeight: "bold" }}
                    >
                      {selectedItem2.nationality}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </>
          ),
        },
        {
          label: "Fight Summary",
          content: (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <List>
                  {fightEvents.map((event, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={event} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </>
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
                    backgroundColor: "rgba(33, 33, 33, 0.9)",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)",
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
                    backgroundColor: "rgba(33, 33, 33, 0.9)",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)",
                    },
                  }}
                >
                  View Fight Summary
                </Button>
              </Grid>
              {/* Add the new Watch Fight button */}
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => setShowFightViewer(true)}
                  disabled={!selectedItem1 || !selectedItem2 || fightEvents.length === 0}
                  sx={{
                    backgroundColor: "rgba(33, 33, 33, 0.9)",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(33, 33, 33, 0.5)",
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                  }}
                >
                  Watch Fight
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
      
      <Dialog
        open={showFightViewer}
        onClose={() => setShowFightViewer(false)}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: '#f5f5f5',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Fight Viewer</Typography>
            <Button 
              onClick={() => setShowFightViewer(false)} 
              color="primary"
              variant="outlined"
            >
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <FightViewer 
            fightEvents={fightEvents} 
            fighters={[selectedItem1, selectedItem2]}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth={true}
        maxWidth="lg"
      >
        <DialogTitle>Fight Summary</DialogTitle>
        <DialogContent>
          <Tab tabs={fightSummaryTabs} />
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
