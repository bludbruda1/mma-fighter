import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventFromDB, updateFighter, getAllFighters, getFightsByIds } from "../utils/indexedDB";
import {
  Container,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Box,
  Card,
  CardMedia,
  Chip,
} from "@mui/material";
import FightCard from "../components/FightCard";
import StatBar from "../components/StatBar";
import Tab from "../components/Tab";
import ResultCard from "../components/ResultCard";
import { simulateFight } from "../engine/FightSim";
import {
  calculateFightStats,
} from "../engine/FightStatistics";

const Event = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [fightResults, setFightResults] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentFightIndex, setCurrentFightIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch event data
        const event = await getEventFromDB(String(eventId));

        // Fetch fights data
        const fights = await getFightsByIds(event.fights);
        
        // Fetch all fighters
        const allFighters = await getAllFighters();
        
        // Create a map of fighter data by personid
        const fighterMap = allFighters.reduce((map, fighter) => {
          map[fighter.personid] = fighter;
          return map;
        }, {});
        
        // Combine fight data with fighter data
        const completeFights = fights.map(fight => ({
          ...fight,
          fighter1: fighterMap[fight.fighter1Id],
          fighter2: fighterMap[fight.fighter2Id]
        }));

        setEventData({
          ...event,
          fights: completeFights
        });
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [eventId]);

  const handleGenerateFight = async (index, fighter1, fighter2) => {
    const validateFighter = (fighter) => ({
      id: fighter?.personid ?? "unknown",
      name: `${fighter?.firstname ?? "Unknown"} ${fighter?.lastname ?? ""}`,
      fightingStyle: fighter?.fightingStyle ?? "Unspecified",
      health: {
        head: fighter?.maxHealth?.head || 100,
        body: fighter?.maxHealth?.body || 100,
        legs: fighter?.maxHealth?.legs || 100,
      },
      maxHealth: {
        head: fighter?.maxHealth?.head || 100,
        body: fighter?.maxHealth?.body || 100,
        legs: fighter?.maxHealth?.legs || 100,
      },
      stamina: fighter?.stamina || 100,
      ...fighter,
    });

    const opponents = [validateFighter(fighter1), validateFighter(fighter2)];
    const result = simulateFight(opponents);

    if (!result || typeof result.winner === "undefined") {
      console.error("simulateFight did not return a valid winner:", result);
      return;
    }

    const winnerIndex = result.winner;
    console.log("Winner Index:", winnerIndex);

    const fightStats = calculateFightStats(
      {
        stats: result.fighterStats?.[0] || {},
        health: result.fighterHealth?.[0] || {},
        maxHealth: result.fighterMaxHealth?.[0] || {},
      },
      {
        stats: result.fighterStats?.[1] || {},
        health: result.fighterHealth?.[1] || {},
        maxHealth: result.fighterMaxHealth?.[1] || {},
      }
    );

    setFightResults((prevResults) => ({
      ...prevResults,
      [index]: {
        winnerIndex,
        fightResult: result,
        fightStats,
        formattedEndTime: formatEndTime(result.endTime),
        roundStats: result.roundStats || [],
        fightEvents: result.fightEvents || [],
        fighters: opponents,
      },
    }));

    await updateFighterRecords(opponents, winnerIndex, result);
  };

  const formatEndTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const updateFighterRecords = async (fighters, result) => {
    const winnerIndex = result.winner;

    // Validate winnerIndex
    if (typeof winnerIndex !== "number" || winnerIndex < 0 || winnerIndex > 1) {
      console.error("Invalid winnerIndex:", winnerIndex);
      return;
    }

    // Assign winner and loser fighters
    const winnerFighter = fighters[winnerIndex];
    const loserFighter = fighters[1 - winnerIndex];

    // Ensure winner and loser are properly assigned
    if (!winnerFighter || !loserFighter) {
      console.error("Error: Unable to determine winner or loser.");
      console.log("Fighters Array:", fighters);
      console.log("Winner Fighter:", winnerFighter);
      console.log("Loser Fighter:", loserFighter);
      return;
    }

    // Construct opponent names
    const winnerOpponentName = `${loserFighter.firstname || "Unknown"} ${
      loserFighter.lastname || ""
    }`.trim();
    const loserOpponentName = `${winnerFighter.firstname || "Unknown"} ${
      winnerFighter.lastname || ""
    }`.trim();

    console.log(
      "Winner Fighter:",
      winnerFighter.firstname,
      winnerFighter.lastname
    );
    console.log(
      "Loser Fighter:",
      loserFighter.firstname,
      loserFighter.lastname
    );
    console.log("Winner's Opponent Name:", winnerOpponentName);
    console.log("Loser's Opponent Name:", loserOpponentName);

    // Define fight result entries
    const fightResultForWinner = {
      opponentId: loserFighter.id,
      opponentName: winnerOpponentName,
      result: "Win",
      method: result.method,
      roundEnded: result.roundEnded,
      timeEnded: formatEndTime(result.endTime),
    };

    const fightResultForLoser = {
      opponentId: winnerFighter.id,
      opponentName: loserOpponentName,
      result: "Loss",
      method: result.method,
      roundEnded: result.roundEnded,
      timeEnded: formatEndTime(result.endTime),
    };

    // Update records for each fighter
    const updatedFighters = fighters.map((fighter) => {
      if (fighter.id === winnerFighter.id) {
        return {
          ...fighter,
          wins: (fighter.wins || 0) + 1,
          fightHistory: [fightResultForWinner, ...(fighter.fightHistory || [])],
        };
      } else if (fighter.id === loserFighter.id) {
        return {
          ...fighter,
          losses: (fighter.losses || 0) + 1,
          fightHistory: [fightResultForLoser, ...(fighter.fightHistory || [])],
        };
      } else {
        return fighter;
      }
    });

    // Update fighters in the database
    await Promise.all(updatedFighters.map(updateFighter));
  };

  const handleViewSummary = (index) => {
    setCurrentFightIndex(index);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentFightIndex(null);
  };

  const prepareTabs = (fightData) => [
    { label: "Total Stats", content: renderTotalStats(fightData.fightStats) },
    {
      label: "Fight Events",
      content: renderFightEvents(fightData.fightEvents || []),
    },
    ...fightData.roundStats.map((_, idx) => ({
      label: `Round ${idx + 1}`,
      content: renderRoundStats(fightData.roundStats[idx]),
    })),
  ];

  // Function to render fight events
  const renderFightEvents = (events) => (
    <List>
      {events.map((event, i) => (
        <ListItem key={i}>
          <ListItemText primary={event} />
        </ListItem>
      ))}
    </List>
  );

  const renderTotalStats = (stats) => (
    <>
      <StatBar
        redValue={stats?.totalStrikes?.red || 0}
        blueValue={stats?.totalStrikes?.blue || 0}
        title="Total Strikes"
      />
      <StatBar
        redValue={stats?.takedownsAttempted?.red || 0}
        blueValue={stats?.takedownsAttempted?.blue || 0}
        title="Takedowns Attempted"
      />
      <StatBar
        redValue={stats?.submissionAttempts?.red || 0}
        blueValue={stats?.submissionAttempts?.blue || 0}
        title="Submission Attempts"
      />
    </>
  );

  const renderRoundStats = (roundStats) => (
    <>
      <StatBar
        redValue={roundStats?.punchsThrown?.red || 0}
        blueValue={roundStats?.punchsThrown?.blue || 0}
        title="Punches Thrown"
      />
      <StatBar
        redValue={roundStats?.takedowns?.red || 0}
        blueValue={roundStats?.takedowns?.blue || 0}
        title="Successful Takedowns"
      />
      <StatBar
        redValue={roundStats?.submissionAttempts?.red || 0}
        blueValue={roundStats?.submissionAttempts?.blue || 0}
        title="Submissions Attempted"
      />
    </>
  );

  if (!eventData || !eventData.fights)
    return <Typography>No event data available.</Typography>;

  return (
    <Container
      maxWidth="md"
      style={{ marginTop: "50px", marginBottom: "20px" }}
    >
      <Typography variant="h4" align="center" gutterBottom>
      {eventData?.name || 'Main Card'} {/* Show event name if available */}
      </Typography>
      {eventData.fights.map((fight, index) => {
        const fightResult = fightResults[index];
        const winnerIndex = fightResult?.winnerIndex;

        return (
          <Grid
            container
            spacing={3}
            key={index}
            style={{ marginBottom: "40px" }}
          >
            <Grid item xs={12}>
              <FightCard
                selectedItem1={fight.fighter1}
                selectedItem2={fight.fighter2}
                winnerIndex={winnerIndex}
              />
              <Grid
                container
                spacing={2}
                justifyContent="center"
                style={{ marginTop: "10px" }}
              >
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={() =>
                      handleGenerateFight(index, fight.fighter1, fight.fighter2)
                    }
                    sx={{
                      backgroundColor: "rgba(33, 33, 33, 0.9)",
                      color: "#fff",
                    }}
                  >
                    Generate Fight
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={() => handleViewSummary(index)}
                    sx={{
                      backgroundColor: "rgba(33, 33, 33, 0.9)",
                      color: "#fff",
                    }}
                    disabled={!fightResult}
                  >
                    View Fight Summary
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
      })}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Fight Summary</DialogTitle>
        <DialogContent>
          {currentFightIndex !== null && fightResults[currentFightIndex] && (
            <>
              <Grid
                container
                spacing={4}
                justifyContent="center"
                style={{ marginTop: "20px" }}
              >
                {/* Left: Fighter 1 Details */}
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
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    {fightResults[currentFightIndex].fighters[0].name}
                    {fightResults[currentFightIndex].winnerIndex === 0 && (
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
                      image={fightResults[currentFightIndex].fighters[0].image}
                    />
                  </Card>
                </Grid>

                {/* Center: Result Card and Stats */}
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
                  <ResultCard
                    round={
                      fightResults[currentFightIndex].fightResult.roundEnded
                    }
                    time={fightResults[currentFightIndex].formattedEndTime}
                    method={fightResults[currentFightIndex].fightResult.method}
                  />
                  <Grid
                    container
                    spacing={2}
                    sx={{ maxWidth: "600px", margin: "0 auto" }}
                  >
                    <Grid
                      item
                      xs={12}
                      style={{
                        justifyContent: "center",
                        marginTop: "20px",
                      }}
                    >
                      <Tab
                        tabs={prepareTabs(fightResults[currentFightIndex])}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Right: Fighter 2 Details */}
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
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    {fightResults[currentFightIndex].fighters[1].name}
                    {fightResults[currentFightIndex].winnerIndex === 1 && (
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
                      image={fightResults[currentFightIndex].fighters[1].image}
                    />
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Event;
