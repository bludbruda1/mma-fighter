import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getEventFromDB,
  updateFighter,
  getAllFighters,
  getFightsByIds,
  updateFightResults,
  getChampionshipById,
  updateChampionship,
  getAllChampionships,
  getSettings,
} from "../utils/indexedDB";
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
import CompactFightCard from "../components/CompactFightCard"; // Add this import
import StatBar from "../components/StatBar";
import Tab from "../components/Tab";
import ResultCard from "../components/ResultCard";
import FightViewer from "../components/FightViewer";
import { formatTime } from "../engine/helper.js";
import { simulateFight } from "../engine/FightSim";
import { calculateFightStats } from "../engine/FightStatistics";
import fightPlayByPlayLogger from "../engine/fightPlayByPlayLogger";
import { updateRankingsAfterFight } from "../utils/rankingsHelper.js";

/**
 * Event Component
 * Handles displaying and managing MMA event cards, including fight simulations,
 * result viewing, and detailed fight playback functionality.
 */
const Event = () => {
  const { eventId } = useParams();

  // Core event and fight state
  const [eventData, setEventData] = useState(null);
  const [fightResults, setFightResults] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentFightIndex, setCurrentFightIndex] = useState(null);
  const [completedFights, setCompletedFights] = useState(new Set());
  const [simulatedFights, setSimulatedFights] = useState(new Set());
  const [championships, setChampionships] = useState([]);
  const [maxRankings, setMaxRankings] = useState(15); // Default to 15

  // New state for fight viewer functionality
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFightEvents, setCurrentFightEvents] = useState([]);
  const [selectedFighters, setSelectedFighters] = useState([]);
  const [viewedFights, setViewedFights] = useState(new Set());

  // Fetch initial event and fight data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch event data
        const event = await getEventFromDB(Number(eventId));

        // Fetch fights data
        const fights = await getFightsByIds(event.fights);

        // Fetch all fighters
        const allFighters = await getAllFighters();

        // Fetch all championships
        const allChampionships = await getAllChampionships();

        // Fetch saved maxRankings
        const savedMaxRankings = await getSettings("maxRankings");

        setChampionships(allChampionships);

        // Create a map of fighter data by personid
        const fighterMap = allFighters.reduce((map, fighter) => {
          map[fighter.personid] = fighter;
          return map;
        }, {});

        // Load completed fight data and their fight events
        const completedFightsIds = new Set(
          fights.filter((fight) => fight.result).map((fight) => fight.id)
        );
        setCompletedFights(completedFightsIds);

        // viewedFights starts empty and is populated only after watching
        setSimulatedFights(completedFightsIds);
        setViewedFights(new Set()); // Initially empty

        // Combine fight data with complete fighter data and championship data
        const completeFights = fights.map((fight) => {
          // If this is a championship fight, get the full championship data
          let championshipData = null;
          if (fight.championship) {
            championshipData = allChampionships.find(
              (c) => c.id === fight.championship.id
            );
          }

          return {
            ...fight,
            fighter1: fight.fighter1.personid
              ? {
                  ...fighterMap[fight.fighter1.personid],
                  ...fight.fighter1,
                }
              : fight.fighter1,
            fighter2: fight.fighter2.personid
              ? {
                  ...fighterMap[fight.fighter2.personid],
                  ...fight.fighter2,
                }
              : fight.fighter2,
            championship: championshipData, // Replace with full championship data
          };
        });

        // Set initial fight results including fight events
        const initialResults = {};
        completeFights.forEach((fight, index) => {
          if (fight.result) {
            initialResults[index] = {
              winnerIndex: fight.result.winner,
              fightResult: fight.result,
              fightStats: fight.stats,
              formattedEndTime: fight.result.timeEnded,
              roundStats: fight.roundStats || [],
              fightEvents: fight.fightEvents || [],
              fighters: [fight.fighter1, fight.fighter2],
            };
          }
        });
        setFightResults(initialResults);

        setEventData({
          ...event,
          fights: completeFights,
        });

        // Set maxRankings from saved settings or default to 15
        setMaxRankings(savedMaxRankings || 15);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [eventId]);

  /**
   * Formats the end time of a fight into MM:SS format
   * @param {number} time - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatEndTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Handles fight simulation and stores results
   * Now returns a promise to support watch-first functionality
   */
  const handleGenerateFight = async (index, fighter1, fighter2) => {
    try {
      // Set initial fight logger and run simulation
      const logger = new fightPlayByPlayLogger(true);
      const result = simulateFight([fighter1, fighter2], logger);

      if (!result || typeof result.winner === "undefined") {
        console.error("simulateFight did not return a valid winner:", result);
        return null;
      }

      // Capture fight events for playback
      const fightEvents = logger.getFightPlayByPlay();
      setCurrentFightEvents(fightEvents);

      const winnerIndex = result.winner;
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

      // Format fight result data
      const fightResult = {
        winner: winnerIndex,
        method: result.method,
        roundEnded: result.roundEnded,
        timeEnded: formatTime(result.endTime),
        submissionType: result.submissionType,
      };

      // Update fight results in database including fight events
      const fightId = eventData.fights[index].id;
      await updateFightResults(fightId, {
        result: fightResult,
        stats: fightStats,
        fightEvents: fightEvents,
      });

      //  Mark fight as completed
      setCompletedFights((prev) => new Set([...prev, fightId]));

      // Update state with fight results
      setFightResults((prevResults) => ({
        ...prevResults,
        [index]: {
          winnerIndex,
          fightResult,
          fightStats,
          formattedEndTime: formatTime(result.endTime),
          roundStats: result.roundStats || [],
          fightEvents: fightEvents,
          fighters: [fighter1, fighter2],
        },
      }));

      // Update fighter records
      await updateFighterRecords([fighter1, fighter2], result);

      // Store fighters for fight viewer
      setSelectedFighters([fighter1, fighter2]);

      return { winnerIndex, fightResult }; // Return both the winner index and fight result
    } catch (error) {
      console.error("Error simulating fight:", error);
      return null;
    }
  };

  // Function specifically for direct simulation
  const handleSimulateFight = async (index, fighter1, fighter2) => {
    const result = await handleGenerateFight(index, fighter1, fighter2);
    if (result && typeof result.winnerIndex !== "undefined") {
      const fightId = eventData.fights[index].id;
      setSimulatedFights((prev) => new Set([...prev, fightId]));

      // Handle championship changes if this was a title fight
      const fight = eventData.fights[index];
      if (fight.championship) {
        const winnerFighter = result.winnerIndex === 0 ? fighter1 : fighter2;
        const loserFighter = result.winnerIndex === 0 ? fighter2 : fighter1;

        try {
          // Get current championship data
          const championship = await getChampionshipById(fight.championship.id);

          if (championship) {
            let updatedChampionship;

            // Handle both vacant and active title scenarios
            if (!championship.currentChampionId) {
              // Vacant title scenario - winner becomes new champion
              updatedChampionship = {
                ...championship,
                currentChampionId: winnerFighter.personid,
              };
              console.log(
                `${winnerFighter.firstname} ${winnerFighter.lastname} wins the vacant ${championship.name}`
              );
            } else if (
              championship.currentChampionId === loserFighter.personid
            ) {
              // Champion lost - update to new champion
              updatedChampionship = {
                ...championship,
                currentChampionId: winnerFighter.personid,
              };
              console.log(
                `${winnerFighter.firstname} ${winnerFighter.lastname} is the new ${championship.name} champion`
              );
            } else if (
              championship.currentChampionId === winnerFighter.personid
            ) {
              // Champion retained - no update needed
              console.log(
                `${winnerFighter.firstname} ${winnerFighter.lastname} retains the ${championship.name}`
              );
              return;
            }

            // Update championship if there were changes
            if (updatedChampionship) {
              await updateChampionship(updatedChampionship);

              // Update local championships state
              setChampionships((prevChampionships) =>
                prevChampionships.map((c) =>
                  c.id === updatedChampionship.id ? updatedChampionship : c
                )
              );
            }
          }
        } catch (error) {
          console.error("Error updating championship:", error);
        }
      }
    }
  };

  /**
   * Opens the fight viewer dialog and simulates fight if not already completed
   * Can be triggered before simulation to watch fight in real-time
   * @param {number} index - Index of the fight to watch
   */
  const handleWatchFight = async (index) => {
    const fight = eventData.fights[index];

    // Prevent watching if already viewed or simulated without viewing
    if (
      viewedFights.has(fight.id) ||
      (simulatedFights.has(fight.id) && !viewedFights.has(fight.id))
    ) {
      return;
    }

    // If fight is already completed and hasn't been viewed, show it
    if (fightResults[index] && fightResults[index].fightEvents) {
      setCurrentFightEvents(fightResults[index].fightEvents);
      setSelectedFighters(fightResults[index].fighters);
      setViewerOpen(true);
      return;
    }

    // If fight needs to be simulated, do that first
    try {
      // Only remove from simulatedFights if this fight hasn't been simulated yet
      if (!completedFights.has(fight.id)) {
        setSimulatedFights((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fight.id);
          return newSet;
        });
      }

      await handleGenerateFight(index, fight.fighter1, fight.fighter2);
      // Need to wait briefly for fight events to be processed
      setTimeout(() => {
        setViewerOpen(true);
      }, 100);
    } catch (error) {
      console.error("Error preparing fight for viewing:", error);
    }
  };

  /**
   * Closes the fight viewer dialog and marks fight as viewed
   */
  const handleCloseViewer = () => {
    // If there's a fight result, find its ID and mark as viewed
    if (currentFightEvents && currentFightEvents.length > 0) {
      const fightIndex = eventData.fights.findIndex(
        (fight) =>
          fight.fighter1.personid === selectedFighters[0].personid &&
          fight.fighter2.personid === selectedFighters[1].personid
      );
      if (fightIndex !== -1) {
        const fightId = eventData.fights[fightIndex].id;
        setViewedFights((prev) => new Set([...prev, fightId]));
        setSimulatedFights((prev) => new Set([...prev, fightId]));
      }
    }
    setViewerOpen(false);
    setCurrentFightEvents([]);
  };

  /**
   * Opens the fight summary dialog
   * @param {number} index - Index of the fight to view
   */
  const handleViewSummary = (index) => {
    setCurrentFightIndex(index);
    setDialogOpen(true);
  };

  /**
   * Closes the fight summary dialog and resets related state
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentFightIndex(null);
  };

  /**
   * Updates fighter records and rankings after a fight
   * @param {Object[]} fighters - Array of fighter objects
   * @param {Object} result - Fight result object
   */
  const updateFighterRecords = async (fighters, result) => {
    try {
      // Validate result and winnerIndex
      if (
        !result ||
        typeof result.winner !== "number" ||
        result.winner < 0 ||
        result.winner > 1
      ) {
        console.error("Invalid fight result or winner index:", result);
        return;
      }

      // Assign winner and loser fighters
      const winnerIndex = result.winner;
      const winnerFighter = fighters[winnerIndex];
      const loserFighter = fighters[1 - winnerIndex];

      // Ensure both fighters exist
      if (!winnerFighter || !loserFighter) {
        console.error("Error: Unable to determine winner or loser.");
        return;
      }

      // Get all fighters for ranking updates
      const allFighters = await getAllFighters();

      // Update rankings
      const rankingUpdates = await updateRankingsAfterFight(
        winnerFighter,
        loserFighter,
        allFighters,
        championships,
        maxRankings
      );

      // Create a map of all fighters that need updates
      const fighterUpdates = new Map();

      // Add record updates for winner and loser
      fighterUpdates.set(winnerFighter.personid, {
        ...winnerFighter,
        wins: (winnerFighter.wins || 0) + 1,
        ranking:
          rankingUpdates.find((f) => f.personid === winnerFighter.personid)
            ?.ranking || winnerFighter.ranking,
        fightHistory: [
          {
            opponentId: loserFighter.personid,
            opponentName: `${loserFighter.firstname} ${loserFighter.lastname}`,
            result: "Win",
            method: result.method,
            roundEnded: result.roundEnded,
            timeEnded: formatEndTime(result.endTime),
          },
          ...(winnerFighter.fightHistory || []),
        ],
      });

      fighterUpdates.set(loserFighter.personid, {
        ...loserFighter,
        losses: (loserFighter.losses || 0) + 1,
        ranking:
          rankingUpdates.find((f) => f.personid === loserFighter.personid)
            ?.ranking || loserFighter.ranking,
        fightHistory: [
          {
            opponentId: winnerFighter.personid,
            opponentName: `${winnerFighter.firstname} ${winnerFighter.lastname}`,
            result: "Loss",
            method: result.method,
            roundEnded: result.roundEnded,
            timeEnded: formatEndTime(result.endTime),
          },
          ...(loserFighter.fightHistory || []),
        ],
      });

      // Handle additional ranking updates
      rankingUpdates.forEach((fighter) => {
        if (!fighterUpdates.has(fighter.personid)) {
          const existingFighter = allFighters.find(
            (f) => f.personid === fighter.personid
          );
          if (existingFighter) {
            fighterUpdates.set(fighter.personid, {
              ...existingFighter,
              ranking: fighter.ranking,
            });
          }
        }
      });

      // Log updates for debugging
      console.log("Fighter updates:", {
        maxRankings,
        updates: Array.from(fighterUpdates.values()).map((f) => ({
          name: `${f.firstname} ${f.lastname}`,
          oldRanking: allFighters.find((of) => of.personid === f.personid)
            ?.ranking,
          newRanking: f.ranking,
        })),
      });

      // Update all affected fighters in the database
      await Promise.all(
        Array.from(fighterUpdates.values()).map((fighter) =>
          updateFighter(fighter)
        )
      );
    } catch (error) {
      console.error("Error updating fighter records:", error);
    }
  };

  // Helper functions for displaying stats and preparing tabs
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

  // Render helper functions for stats and events
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

  // Loading state handler
  if (!eventData || !eventData.fights) {
    return <Typography>Loading event data...</Typography>;
  }

  return (
    <main>
      <Container maxWidth="lg" style={{ marginTop: "50px", marginBottom: "20px" }}>
        {/* Event Title and Date */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            {eventData?.name || "Main Card"}
          </Typography>
          {eventData?.date && (
            <Typography variant="subtitle1" align="center" color="text.secondary">
              {new Date(eventData.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          )}
        </Box>
  
        {/* Fight Cards Section */}
        <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
          {eventData.fights.map((fight, index) => {
            const isFightCompleted = completedFights.has(fight.id);
            const shouldShowWinner = viewedFights.has(fight.id) || 
              (simulatedFights.has(fight.id) && !viewerOpen);
  
            // Determine if each fighter is a champion
            const fighter1IsChamp = championships.some(
              (c) => c.currentChampionId === fight.fighter1.personid
            );
            const fighter2IsChamp = championships.some(
              (c) => c.currentChampionId === fight.fighter2.personid
            );
  
            return (
              <CompactFightCard
                key={index}
                fight={fight}
                result={shouldShowWinner ? fightResults[index] : undefined}
                isComplete={isFightCompleted}
                isViewed={viewedFights.has(fight.id)}
                isSimulated={simulatedFights.has(fight.id)}
                onWatch={() => handleWatchFight(index)}
                onSimulate={() => handleSimulateFight(index, fight.fighter1, fight.fighter2)}
                onViewSummary={() => handleViewSummary(index)}
                fighter1IsChamp={fighter1IsChamp}
                fighter2IsChamp={fighter2IsChamp}
                fightIndex={index}
              />
            );
          })}
        </Box>
  
        {/* Fight Summary Dialog */}
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

      {/* Fight Viewer Dialog */}
      <Dialog open={viewerOpen} onClose={handleCloseViewer} fullScreen>
        <Box
          sx={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Close button positioned at top right */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1200,
            }}
          >
            <Button
              variant="contained"
              onClick={handleCloseViewer}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                },
                color: "#fff",
              }}
            >
              Close
            </Button>
          </Box>

          {/* Fight Viewer Content */}
          <Box sx={{ flexGrow: 1 }}>
            <FightViewer
              fightEvents={currentFightEvents}
              fighters={selectedFighters}
            />
          </Box>
        </Box>
      </Dialog>
    </Container>
    </main>
  );
};

export default Event;
