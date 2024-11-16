import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { getAllFighters, getAllFights } from "../utils/indexedDB";
import { formatFightingStyle, formatBirthday } from "../utils/uiHelpers";

const Dashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState(null);
  const [error, setError] = useState(null);
  const [allFighterIds, setAllFighterIds] = useState([]);
  const [fights, setFights] = useState([]);

  // Helper function to sort fights
  const sortFights = (fights) => {
    const upcoming = [];
    const completed = [];
    
    fights.forEach(fight => {
      if (!fight.result) {
        upcoming.push(fight);
      } else {
        completed.push(fight);
      }
    });

    // Sort upcoming fights by date if available
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Sort completed fights by date in descending order
    completed.sort((a, b) => new Date(b.date) - new Date(a.date));

    return [...upcoming, ...completed];
  };

  // Effect to fetch all fighter IDs when the component mounts
  useEffect(() => {
    const fetchAllFighterIds = async () => {
      try {
        const fighters = await getAllFighters();
        // Extract and sort fighter IDs
        const ids = fighters.map((f) => f.personid).sort((a, b) => a - b);
        setAllFighterIds(ids);
      } catch (error) {
        console.error("Error fetching all fighter IDs:", error);
      }
    };

    fetchAllFighterIds();
  }, []);

  // Effect to fetch fighter data and fights
  useEffect(() => {
    const fetchFighterData = async () => {
      try {
        // Get the fighter data
        const fighters = await getAllFighters();
        const selectedFighter = fighters.find(
          (f) => f.personid === parseInt(id)
        );
        
        if (selectedFighter) {
          setFighter(selectedFighter);
          
          // Get all fights
          const allFights = await getAllFights();
          
          // Filter fights to only include those with this fighter
          const fighterFights = allFights.filter(fight => 
            fight.fighter1.personid === selectedFighter.personid || 
            fight.fighter2.personid === selectedFighter.personid
          );
          
          setFights(fighterFights);
        } else {
          setError("Fighter not found");
        }
      } catch (error) {
        setError("Error fetching fighter: " + error.message);
      }
    };

    fetchFighterData();
  }, [id]);

  // Function to navigate between fighters
  const navigateToFighter = (direction) => {
    const currentIndex = allFighterIds.indexOf(parseInt(id));
    let newIndex;
    if (direction === "next") {
      newIndex = currentIndex + 1 >= allFighterIds.length ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? allFighterIds.length - 1 : currentIndex - 1;
    }
    navigate(`/dashboard/${allFighterIds[newIndex]}`);
  };

  // Helper function to determine fight result
  const getFightResult = (fight) => {
    if (!fight.result) return null;
    
    const isFighter1 = fighter.personid === fight.fighter1.personid;
    const isWinner = fight.result.winner === (isFighter1 ? 0 : 1);
    
    return {
      result: isWinner ? 'Win' : 'Loss',
      opponent: isFighter1 ? fight.fighter2 : fight.fighter1,
      method: fight.result.method,
      roundEnded: fight.result.roundEnded,
      timeEnded: fight.result.timeEnded
    };
  };

  // function to calculate the fighters age - this will eventually be needed in alot of places or to changes fighters.json
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years old`;
  };

  // Helper function to format the method
  const getMethodAbbreviation = (method) => {
    switch (method?.toLowerCase()) {
      case 'knockout': return 'KO';
      case 'technical knockout': return 'TKO';
      case 'submission': return 'SUB';
      case 'decision': return 'DEC';
      default: return method?.toUpperCase().slice(0, 3) || 'N/A';
    }
  };

  // Helper function to format time
  const formatTime = (time) => {
    return time || "0:00";
  };

  // Helper function to render rating bars
  const renderRatingBar = (rating) => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" value={rating} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {`${rating}`}
        </Typography>
      </Box>
    </Box>
  );

  // Helper function to format attribute names
  const formatAttributeName = (attr) => {
    return attr
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Fight history section render
  const renderFightHistory = () => (
    <Card elevation={3} sx={{ mt: 3, maxHeight: 400, overflow: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>Fight History</Typography>
        <List>
          {fights.length > 0 ? (
            sortFights(fights).map((fight) => {
              // Handle upcoming fights
              if (!fight.result) {
                const isFirstFighter = fighter.personid === fight.fighter1.personid;
                const opponent = isFirstFighter ? fight.fighter2 : fight.fighter1;
                
                return (
                  <ListItem key={fight.id} divider>
                    <ListItemText
                      primary={
                        opponent.personid ? (
                          <Link
                            to={`/Dashboard/${opponent.personid}`}
                            style={{
                              textDecoration: "none",
                              color: "#1976d2",
                            }}
                          >
                            {`${opponent.firstname} ${opponent.lastname}`}
                          </Link>
                        ) : (
                          <Typography component="span">
                            {`${opponent.firstname} ${opponent.lastname}`}
                          </Typography>
                        )
                      }
                      secondary={
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label="UPCOMING"
                            color="primary"
                            size="small"
                            sx={{
                              bgcolor: 'warning.main',
                              color: 'warning.contrastText',
                              fontWeight: 'bold'
                            }}
                          />
                          {fight.date && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(fight.date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              }

              // Handle completed fights
              const fightResult = getFightResult(fight);
              if (!fightResult) return null;

              return (
                <ListItem key={fight.id} divider>
                  <ListItemText
                    primary={
                      fightResult.opponent.personid ? (
                        <Link
                          to={`/Dashboard/${fightResult.opponent.personid}`}
                          style={{
                            textDecoration: "none",
                            color: "#1976d2",
                          }}
                        >
                          {`${fightResult.opponent.firstname} ${fightResult.opponent.lastname}`}
                        </Link>
                      ) : (
                        <Typography component="span">
                          {`${fightResult.opponent.firstname} ${fightResult.opponent.lastname}`}
                        </Typography>
                      )
                    }
                    secondary={
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Chip 
                          label={fightResult.result}
                          color={fightResult.result === 'Win' ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip 
                          label={getMethodAbbreviation(fightResult.method)}
                          color={fightResult.result === 'Win' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {`R${fightResult.roundEnded} ${formatTime(fightResult.timeEnded)}`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })
          ) : (
            <ListItem>
              <ListItemText primary="No fight history available." />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );

  // Error handling
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
        <Typography variant="h4" align="center" color="error">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  // Loading state
  if (!fighter) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
        <Typography variant="h4" align="center">
          Loading...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button
          onClick={() => navigateToFighter("previous")}
          variant="text"
          sx={{ color: "black" }}
        >
          <ArrowBackOutlinedIcon />
        </Button>
        <Typography variant="h3" align="center">
          {`${fighter.firstname} ${fighter.lastname}`}
        </Typography>
        <Button
          onClick={() => navigateToFighter("next")}
          variant="text"
          sx={{ color: "black" }}
        >
          <ArrowForwardOutlinedIcon />
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Fighter's basic information and image */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardMedia
              component="img"
              sx={{
                height: 300,
                objectFit: "contain",
                bgcolor: "grey.200",
              }}
              image={fighter.image}
              alt={`${fighter.firstname} ${fighter.lastname}`}
            />
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body1">Date of Birth:</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">
                        {formatBirthday(fighter.dob)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          mt: 0.5 
                        }}
                      >
                        {calculateAge(fighter.dob)}
                      </Typography>
                    </Box>
                  </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body1">Nationality:</Typography>
                <Typography variant="body1">{fighter.nationality}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body1">Hometown:</Typography>
                <Typography variant="body1">{fighter.hometown}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body1">Record:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {fighter.wins}W-{fighter.losses}L
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body1">Weight Class:</Typography>
                <Chip label={fighter.weightClass} color="secondary" />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body1">Fighting Style:</Typography>
                <Chip label={formatFightingStyle(fighter.fightingStyle)} color="primary" />
              </Box>
            </CardContent>
          </Card>

          {/* Fight History */}
          {renderFightHistory()}
        </Grid>

        {/* Fighter's ratings and tendencies */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Fighter Ratings
              </Typography>
              <Grid container spacing={2}>
                {[
                  "output",
                  "strength",
                  "speed",
                  "cardio",
                  "toughness",
                  "chin",
                  "striking",
                  "punchPower",
                  "handSpeed",
                  "punchAccuracy",
                  "kicking",
                  "kickPower",
                  "kickSpeed",
                  "kickAccuracy",
                  "strikingDefence",
                  "kickDefence",
                  "headMovement",
                  "footwork",
                  "takedownOffence",
                  "takedownDefence",
                  "clinchStriking",
                  "clinchTakedown",
                  "clinchControl",
                  "clinchDefence",
                  "groundOffence",
                  "groundDefence",
                  "groundControl",
                  "groundStriking",
                  "submissionOffence",
                  "submissionDefence",
                  "getUpAbility",
                  "composure",
                  "fightIQ"
                ].map((attr) => (
                  <Grid item xs={12} sm={6} key={attr}>
                    <Typography variant="body2">
                      {formatAttributeName(attr)}
                    </Typography>
                    {renderRatingBar(fighter.Rating[attr])}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;