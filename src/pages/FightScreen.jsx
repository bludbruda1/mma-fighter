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

  // New state for handling the fight statistics
  const [fightStats, setFightStats] = useState(null);

  // New state for storing round-by-round statistics
  const [roundStats, setRoundStats] = useState([]);

  // New state for storing our winner index to determine the winner of the fight for winning message logic in the fight summary
  const [winnerIndex, setWinnerIndex] = useState(null);

  const [fightResult, setFightResult] = useState(null);

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
            head: Number(fighter.maxHealth.head) || 100,
            body: Number(fighter.maxHealth.body) || 100,
            legs: Number(fighter.maxHealth.legs) || 100,
          },
          maxHealth: {
            head: Number(fighter.maxHealth.head) || 100,
            body: Number(fighter.maxHealth.body) || 100,
            legs: Number(fighter.maxHealth.legs) || 100,
          },
          stamina: Number(fighter.stamina) || 100,
          position: FIGHTER_POSITIONS.STANDING,
          roundsWon: 0,
          Rating: {
            output: Number(fighter.Rating.output) || 0,
            strength: Number(fighter.Rating.strength) || 0,
            speed: Number(fighter.Rating.speed) || 0,
            cardio: Number(fighter.Rating.cardio) || 0,
            toughness: Number(fighter.Rating.toughness) || 0,
            chin: Number(fighter.Rating.chin) || 0,
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
          stats: {
            totalStrikesThrown: Number(fighter.stats.totalStrikesThrown) || 0,
            totalStrikesLanded: Number(fighter.stats.totalStrikesLanded) || 0,
            punchsThrown: Number(fighter.stats.punchsThrown) || 0,
            punchsLanded: Number(fighter.stats.punchsLanded) || 0,
            punchsBlocked: Number(fighter.stats.punchsBlocked) || 0,
            punchsEvaded: Number(fighter.stats.punchsEvaded) || 0,
            punchsMissed: Number(fighter.stats.punchsMissed) || 0,
            jabsThrown: Number(fighter.stats.jabsThrown) || 0,
            jabsLanded: Number(fighter.stats.jabsLanded) || 0,
            jabsBlocked: Number(fighter.stats.jabsBlocked) || 0,
            jabsEvaded: Number(fighter.stats.jabsEvaded) || 0,
            jabsMissed: Number(fighter.stats.jabsMissed) || 0,
            crosssThrown: Number(fighter.stats.crosssThrown) || 0,
            crosssLanded: Number(fighter.stats.crosssLanded) || 0,
            crosssBlocked: Number(fighter.stats.crosssBlocked) || 0,
            crosssEvaded: Number(fighter.stats.crosssEvaded) || 0,
            crosssMissed: Number(fighter.stats.crosssMissed) || 0,
            hooksThrown: Number(fighter.stats.hooksThrown) || 0,
            hooksLanded: Number(fighter.stats.hooksLanded) || 0,
            hooksBlocked: Number(fighter.stats.hooksBlocked) || 0,
            hooksEvaded: Number(fighter.stats.hooksEvaded) || 0,
            hooksMissed: Number(fighter.stats.hooksMissed) || 0,
            uppercutsThrown: Number(fighter.stats.uppercutsThrown) || 0,
            uppercutsLanded: Number(fighter.stats.uppercutsLanded) || 0,
            uppercutsBlocked: Number(fighter.stats.uppercutsBlocked) || 0,
            uppercutsEvaded: Number(fighter.stats.uppercutsEvaded) || 0,
            uppercutsMissed: Number(fighter.stats.uppercutsMissed) || 0,
            spinningBackfistsThrown:
              Number(fighter.stats.spinningBackfistsThrown) || 0,
            spinningBackfistsLanded:
              Number(fighter.stats.spinningBackfistsLanded) || 0,
            spinningBackfistsBlocked:
              Number(fighter.stats.spinningBackfistsBlocked) || 0,
            spinningBackfistsEvaded:
              Number(fighter.stats.spinningBackfistsEvaded) || 0,
            spinningBackfistsMissed:
              Number(fighter.stats.spinningBackfistsMissed) || 0,
            supermanPunchsLanded:
              Number(fighter.stats.supermanPunchsLanded) || 0,
            supermanPunchsBlocked:
              Number(fighter.stats.supermanPunchsBlocked) || 0,
            supermanPunchsEvaded:
              Number(fighter.stats.supermanPunchsEvaded) || 0,
            supermanPunchsMissed:
              Number(fighter.stats.supermanPunchsMissed) || 0,
            bodyPunchsThrown: Number(fighter.stats.bodyPunchsThrown) || 0,
            bodyPunchsLanded: Number(fighter.stats.bodyPunchsLanded) || 0,
            bodyPunchsBlocked: Number(fighter.stats.bodyPunchsBlocked) || 0,
            bodyPunchsEvaded: Number(fighter.stats.bodyPunchsEvaded) || 0,
            bodyPunchsMissed: Number(fighter.stats.bodyPunchsMissed) || 0,
            kicksThrown: Number(fighter.stats.kicksThrown) || 0,
            kicksLanded: Number(fighter.stats.kicksLanded) || 0,
            kicksBlocked: Number(fighter.stats.kicksBlocked) || 0,
            kicksEvaded: Number(fighter.stats.kicksEvaded) || 0,
            kicksMissed: Number(fighter.stats.kicksMissed) || 0,
            headKicksThrown: Number(fighter.stats.headKicksThrown) || 0,
            headKicksLanded: Number(fighter.stats.headKicksLanded) || 0,
            headKicksBlocked: Number(fighter.stats.headKicksBlocked) || 0,
            headKicksEvaded: Number(fighter.stats.headKicksEvaded) || 0,
            headKicksMissed: Number(fighter.stats.headKicksMissed) || 0,
            bodyKicksThrown: Number(fighter.stats.bodyKicksThrown) || 0,
            bodyKicksLanded: Number(fighter.stats.bodyKicksLanded) || 0,
            bodyKicksBlocked: Number(fighter.stats.bodyKicksBlocked) || 0,
            bodyKicksEvaded: Number(fighter.stats.bodyKicksEvaded) || 0,
            bodyKicksMissed: Number(fighter.stats.bodyKicksMissed) || 0,
            legKicksThrown: Number(fighter.stats.legKicksThrown) || 0,
            legKicksLanded: Number(fighter.stats.legKicksLanded) || 0,
            legKicksBlocked: Number(fighter.stats.legKicksBlocked) || 0,
            legKicksEvaded: Number(fighter.stats.legKicksEvaded) || 0,
            legKicksMissed: Number(fighter.stats.legKicksMissed) || 0,
            clinchsAttempted: Number(fighter.stats.clinchsAttempted) || 0,
            clinchsSuccessful: Number(fighter.stats.clinchsSuccessful) || 0,
            clinchsDefended: Number(fighter.stats.clinchsDefended) || 0,
            tripsAttempted: Number(fighter.stats.tripsAttempted) || 0,
            tripsDefended: Number(fighter.stats.tripsDefended) || 0,
            throwsAttempted: Number(fighter.stats.throwsAttempted) || 0,
            throwsDefended: Number(fighter.stats.throwsDefended) || 0,
            clinchStrikesThrown: Number(fighter.stats.clinchStrikesThrown) || 0,
            clinchStrikesLanded: Number(fighter.stats.clinchStrikesLanded) || 0,
            clinchStrikesBlocked:
              Number(fighter.stats.clinchStrikesBlocked) || 0,
            clinchStrikesEvaded: Number(fighter.stats.clinchStrikesEvaded) || 0,
            clinchStrikesMissed: Number(fighter.stats.clinchStrikesMissed) || 0,
            takedownsAttempted: Number(fighter.stats.takedownsAttempted) || 0,
            takedownsSuccessful: Number(fighter.stats.takedownsSuccessful) || 0,
            takedownsDefended: Number(fighter.stats.takedownsDefended) || 0,
            singleLegAttempted: Number(fighter.stats.singleLegAttempted) || 0,
            singleLegSuccessful: Number(fighter.stats.singleLegSuccessful) || 0,
            singleLegDefended: Number(fighter.stats.singleLegDefended) || 0,
            groundPunchsLanded: Number(fighter.stats.groundPunchsLanded) || 0,
            groundPunchsBlocked: Number(fighter.stats.groundPunchsBlocked) || 0,
            submissionsAttempted:
              Number(fighter.stats.submissionsAttempted) || 0,
            submissionsLanded: Number(fighter.stats.submissionsLanded) || 0,
            submissionsDefended: Number(fighter.stats.submissionsDefended) || 0,
            armbarsAttempted: Number(fighter.stats.submissionsAttempted) || 0,
            armbarsSuccessful: Number(fighter.stats.submissionsLanded) || 0,
            armbarsDefended: Number(fighter.stats.submissionsDefended) || 0,
            triangleChokesAttempted:
              Number(fighter.stats.submissionsAttempted) || 0,
            triangleChokesSuccessful:
              Number(fighter.stats.submissionsLanded) || 0,
            triangleChokesDefended:
              Number(fighter.stats.submissionsDefended) || 0,
            rearNakedChokesAttempted:
              Number(fighter.stats.submissionsAttempted) || 0,
            rearNakedChokesSuccessful:
              Number(fighter.stats.submissionsLanded) || 0,
            rearNakedChokesDefended:
              Number(fighter.stats.submissionsDefended) || 0,
            legLocksAttempted: Number(fighter.stats.submissionsAttempted) || 0,
            legLocksSuccessful: Number(fighter.stats.submissionsLanded) || 0,
            legLocksDefended: Number(fighter.stats.submissionsDefended) || 0,
            guillotinesAttempted:
              Number(fighter.stats.submissionsAttempted) || 0,
            guillotinesSuccessful: Number(fighter.stats.submissionsLanded) || 0,
            guillotinesDefended: Number(fighter.stats.submissionsDefended) || 0,
          },
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
        // Store the winner's index (0 or 1) in the state
        setWinnerIndex(result.winner);

        // Store the result in state
        setFightResult(result);

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

        // Store round statistics
        setRoundStats(result.roundStats);

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
                        time="3:38"
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
