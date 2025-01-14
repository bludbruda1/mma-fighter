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
  Tab,
  Tabs,
  Box,
  Card,
  CardMedia,
  Chip,
} from "@mui/material";
import CompactFightCard from "../components/CompactFightCard"; // Add this import
import StatBar from "../components/StatBar";
import BasicTabs from "../components/BasicTabs.jsx";
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
  const [currentCard, setCurrentCard] = useState('mainCard');

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
    
        // Get all fight IDs across all cards
        let allFightIds;
        if (Array.isArray(event.fights)) {
          // Handle old format
          allFightIds = event.fights;
        } else {
          // Handle new format with card structure
          allFightIds = [
            ...(event.fights.mainCard || []),
            ...(event.fights.prelims || []),
            ...(event.fights.earlyPrelims || [])
          ];
        }
    
        // Fetch fights data
        const fights = await getFightsByIds(allFightIds);
    
        // Fetch all fighters and championships
        const [allFighters, allChampionships, savedMaxRankings] = await Promise.all([
          getAllFighters(),
          getAllChampionships(),
          getSettings("maxRankings")
        ]);
    
        setChampionships(allChampionships);
    
        // Create a map of fighter data by personid
        const fighterMap = allFighters.reduce((map, fighter) => {
          map[fighter.personid] = fighter;
          return map;
        }, {});
    
        // Load completed fight data
        const completedFightsIds = new Set(
          fights.filter((fight) => fight.result).map((fight) => fight.id)
        );
        setCompletedFights(completedFightsIds);
        setSimulatedFights(completedFightsIds);
        setViewedFights(new Set());
    
        // Combine fight data with complete fighter data and championship data
        const completeFights = fights.map((fight) => {
          let championshipData = null;
          if (fight.championship) {
            championshipData = allChampionships.find(
              (c) => c.id === fight.championship.id
            );
            fight.originalChampionId = fight.championship.currentChampionId;
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
            championship: championshipData,
          };
        });
    
        // Set initial fight results
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
    
        // Structure the fights based on the event format
        let structuredFights;
        if (Array.isArray(event.fights)) {
          // Old format - all fights go to main card
          structuredFights = {
            mainCard: completeFights,
            prelims: [],
            earlyPrelims: []
          };
        } else {
          // New format - organize fights by card
          structuredFights = {
            mainCard: event.fights.mainCard.map(id => completeFights.find(f => f.id === id)).filter(Boolean),
            prelims: event.fights.prelims?.map(id => completeFights.find(f => f.id === id)).filter(Boolean) || [],
            earlyPrelims: event.fights.earlyPrelims?.map(id => completeFights.find(f => f.id === id)).filter(Boolean) || []
          };
        }
    
        setEventData({
          ...event,
          fights: structuredFights,
        });
    
        setMaxRankings(savedMaxRankings || 15);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [eventId]);

  // Function to handle tab changes
  const handleCardChange = (event, newValue) => {
    setCurrentCard(newValue);
  };

  // Function to group fights by card type
  const getFightsByCard = () => {
    if (!eventData || !eventData.fights) return { mainCard: [], prelims: [], earlyPrelims: [] };

    // If fights is an array (old format), treat all as main card
    if (Array.isArray(eventData.fights)) {
      return {
        mainCard: eventData.fights,
        prelims: [],
        earlyPrelims: []
      };
    }

    // Return structured fights
    return {
      mainCard: eventData.fights.mainCard || [],
      prelims: eventData.fights.prelims || [],
      earlyPrelims: eventData.fights.earlyPrelims || []
    };
  };

  // Function to render card content
  const renderCardContent = (fights) => {
    if (!fights || fights.length === 0) {
      return (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
          No fights scheduled
        </Typography>
      );
    }

    return fights.map((fight, index) => {
      const isFightCompleted = completedFights.has(fight.id);
      const shouldShowWinner = viewedFights.has(fight.id) || 
        (simulatedFights.has(fight.id) && !viewerOpen);

      // Determine champion status
      const fighter1IsChamp = fight.originalChampionId === fight.fighter1.personid;
      const fighter2IsChamp = fight.originalChampionId === fight.fighter2.personid;

      return (
        <CompactFightCard
          key={fight.id}
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
    });
  };

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
          <Typography variant="subtitle1" align="center" gutterBottom>
            {eventData?.venue || "UFC Apex"} • {eventData?.location || "Las Vegas, Nevada"} 
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
        {/* Card Selection Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentCard} 
            onChange={handleCardChange}
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: '1rem',
                textTransform: 'none',
              }
            }}
          >
            <Tab 
              label="Main Card" 
              value="mainCard"
              sx={{
                color: 'text.primary',
                '&.Mui-selected': {
                  color: 'primary.main',
                }
              }}
            />
            {getFightsByCard().prelims.length > 0 && (
              <Tab 
                label="Prelims" 
                value="prelims"
                sx={{
                  color: 'text.primary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  }
                }}
              />
            )}
            {getFightsByCard().earlyPrelims.length > 0 && (
              <Tab 
                label="Early Prelims" 
                value="earlyPrelims"
                sx={{
                  color: 'text.primary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  }
                }}
              />
            )}
          </Tabs>
        </Box>
  
        {/* Fight Cards Section */}
        <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
          {renderCardContent(getFightsByCard()[currentCard])}
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
                      <BasicTabs
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
