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
  Paper,
  Divider,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getAllFighters, getAllFights, getAllChampionships, getGameDate } from "../utils/indexedDB";
import { calculateAge } from '../utils/dateUtils';
import { formatFightingStyle, formatBirthday } from "../utils/uiHelpers";

// Styles object for consistent theming
const styles = {
  container: {
    py: 6,
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(240,240,240,0.6) 0%, rgba(255,255,255,0.6) 100%)',
  },
  headerCard: {
    mb: 4,
    p: 3,
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
    position: 'relative',
  },
  navigationButton: {
    color: "text.primary",
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
  },
  sectionTitle: {
    color: 'text.primary',
    fontWeight: 'bold',
    mb: 3,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: 0,
      width: 60,
      height: 3,
      backgroundColor: 'primary.main',
      borderRadius: 1,
    }
  },
  profileCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  infoGrid: {
    '& .MuiGrid-item': {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
  },
  championshipCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    p: 2,
    borderRadius: 2,
    mb: 2,
  },
  ratingBar: {
    height: 8,
    borderRadius: 4,
  },
  ratingValue: {
    minWidth: 35,
    textAlign: 'right',
  },
  fightHistoryList: {
    maxHeight: 400,
    overflow: 'auto',
    '& .MuiListItem-root': {
      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    },
  },
};

const Dashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState(null);
  const [error, setError] = useState(null);
  const [allFighterIds, setAllFighterIds] = useState([]);
  const [fights, setFights] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [fighterAge, setFighterAge] = useState("N/A");
  const [gameDate, setGameDate] = useState(null);

  //  Helper function to sort fights
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

  // Effect for age calculation
  useEffect(() => {
    const loadAge = async () => {
      if (fighter?.dob) {
        const age = await calculateAge(fighter.dob);
        setFighterAge(age);
      }
    };

    loadAge();
  }, [fighter?.dob]);

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

  // Effect to fetch fighter, fights and championships data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the fighter data
        const [fighters, fetchedChampionships, currentGameDate] = await Promise.all([
          getAllFighters(),
          getAllChampionships(),
          getGameDate()
        ]);

        setGameDate(new Date(currentGameDate))
        
        const selectedFighter = fighters.find(
          (f) => f.personid === parseInt(id)
        );
        
        if (selectedFighter) {
          setFighter(selectedFighter);
          setChampionships(fetchedChampionships);
          
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

    fetchData();
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

  // Helper function to format fighter name with nickname
const formatFighterNameWithNickname = (fighter) => {
  if (!fighter.nickname) return `${fighter.firstname} ${fighter.lastname}`;

  switch (fighter.nicknamePlacement) {
    case 'pre':
      return `"${fighter.nickname}" ${fighter.firstname} ${fighter.lastname}`;
    case 'mid':
      return `${fighter.firstname} "${fighter.nickname}" ${fighter.lastname}`;
    case 'post':
      return `${fighter.firstname} ${fighter.lastname} "${fighter.nickname}"`;
    default:
      return `${fighter.firstname} ${fighter.lastname}`;
  }
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

  // Helper function to determine previous championships
  const getPreviousChampionships = (fights, currentChampionships) => {
    // Get set of current championship IDs for easy lookup
    const currentChampionshipIds = new Set(currentChampionships.map(c => c.id));
    
    // Track unique previous championships where the fighter was actually champion
    const previousChampionships = new Map();
    
    // Go through all completed fights in chronological order
    fights
      .filter(fight => fight.result && fight.championship)
      .sort((a, b) => {
        // Sort by date if available, otherwise by fight ID
        if (a.date && b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.id - b.id;
      })
      .forEach(fight => {
        const championship = fight.championship;
        
        // Skip if it's a current championship
        if (currentChampionshipIds.has(championship.id)) {
          return;
        }
  
        // Determine if our fighter won the title fight
        const isFighter1 = fighter.personid === fight.fighter1.personid;
        const fighterWon = fight.result.winner === (isFighter1 ? 0 : 1);
        
        // Check if the fighter was champion going into the fight or won the belt
        const wasChampionBefore = championship.currentChampionId === fighter.personid;
        
        if (fighterWon || wasChampionBefore) {
          // Only add to previous championships if they held the title at some point
          // and don't currently hold it
          previousChampionships.set(championship.id, championship);
        } else if (!fighterWon && wasChampionBefore) {
          // If they lost while being champion, that means they were a former champ
          previousChampionships.set(championship.id, championship);
        }
      });
    
    return Array.from(previousChampionships.values());
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
    <Box sx={styles.container}>
      <Container maxWidth="xl">
        {/* Header with Navigation */}
        <Paper sx={styles.headerCard}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              onClick={() => navigateToFighter("previous")}
              sx={styles.navigationButton}
            >
              <ArrowBackOutlinedIcon />
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {formatFighterNameWithNickname(fighter)}
              </Typography>
            </Box>

            <Button
              onClick={() => navigateToFighter("next")}
              sx={styles.navigationButton}
            >
              <ArrowForwardOutlinedIcon />
            </Button>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Left Column: Personal Details and Fighter Status */}
          <Grid item xs={12} md={4}>
            {/* Personal Details Card */}
            <Card sx={{ ...styles.profileCard, mb: 4 }}>
              <CardMedia
                component="img"
                sx={{
                  height: 400,
                  objectFit: "contain",
                  bgcolor: "grey.100",
                }}
                image={fighter.image}
                alt={`${fighter.firstname} ${fighter.lastname}`}
              />
              
              <CardContent>
                <Typography variant="h6" sx={styles.sectionTitle}>
                  Personal Details
                </Typography>

                <Grid container spacing={2} sx={styles.infoGrid}>
                  <Grid item xs={12}>
                    <AccessTimeIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Date of Birth:
                      </Typography>
                      <Typography>
                        {formatBirthday(fighter.dob)} ({fighterAge} years)
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <LocationOnIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Nationality:
                      </Typography>
                      <Typography>
                        {fighter.nationality}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <HomeIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Hometown:
                      </Typography>
                      <Typography>
                        {fighter.hometown}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Height:
                    </Typography>
                    <Typography>
                      {fighter.height}cm
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Reach:
                    </Typography>
                    <Typography>
                      {fighter.reach}cm
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Gender:
                    </Typography>
                    <Typography>
                      {fighter.gender}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Fighter Status Card */}
            <Card sx={{ ...styles.profileCard, mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={styles.sectionTitle}>
                  Fighter Status
                </Typography>

                <Grid container spacing={2} sx={styles.infoGrid}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Professional Record:
                    </Typography>
                    <Typography>
                      {`${fighter.wins}W-${fighter.losses}L${fighter.draws > 0 ? `-${fighter.draws}D` : ''}${fighter.ncs > 0 ? ` (${fighter.ncs} NC)` : ''}`}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Current Ranking:
                    </Typography>
                    <Typography>
                      {fighter.ranking ? `#${fighter.ranking}` : 'Unranked'} ({fighter.weightClass})
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Available Weight Classes:
                    </Typography>
                    <Typography>
                      {fighter.weightClass} {/* TODO: Add multiple weight classes when available */}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Fighting Style:
                    </Typography>
                    <Typography>
                      {formatFightingStyle(fighter.fightingStyle)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Gym Affiliation:
                    </Typography>
                    <Typography>
                      {fighter.gym || "None"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Fighting Out Of:
                    </Typography>
                    <Typography>
                      {fighter.fightsOutOf}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contract Card */}
            <Card sx={{ ...styles.profileCard, mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={styles.sectionTitle}>
                  Contract Details
                </Typography>

                <Grid container spacing={2} sx={styles.infoGrid}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Current Organisation:
                    </Typography>
                    <Typography>
                      {fighter.contract?.company || "UFC"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Contract Type:
                    </Typography>
                    <Typography>
                    {fighter.contract?.type ? 
                      fighter.contract.type.charAt(0).toUpperCase() + 
                      fighter.contract.type.slice(1) : 
                      "N/A"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Fights Remaining:
                    </Typography>
                    <Typography>
                      {fighter.contract?.fightsRem ?? "N/A"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Contract Amount:
                    </Typography>
                    <Typography>
                    {fighter.contract?.amount ? 
                      `$${fighter.contract.amount.toLocaleString()}` : 
                      "N/A"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Injuries Card */}
            {fighter.injuries && fighter.injuries.length && (
              <Card sx={{ ...styles.profileCard, mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={styles.sectionTitle}>
                    Injury History
                  </Typography>
                  <List>
                    {fighter.injuries.map((injury, index) => {
                      const injuryEnd = new Date(injury.dateIncurred);
                      injuryEnd.setDate(injuryEnd.getDate() + injury.duration);
                      const isActive = !injury.isHealed && injuryEnd > new Date();
                      const daysRemaining = isActive ? 
                        Math.ceil((injuryEnd - gameDate) / (1000 * 60 * 60 * 24)) : 0;

                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">
                                  {injury.type} ({injury.location})
                                </Typography>
                                {isActive && (
                                  <Chip 
                                    label={`${daysRemaining} days remaining`}
                                    color="error"
                                    size="small"
                                  />
                                )}
                                {injury.isHealed && (
                                  <Chip 
                                    label="Healed"
                                    color="success"
                                    size="small"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2">
                                  Severity: {injury.severity}
                                </Typography>
                                <Typography variant="body2">
                                  Date: {new Date(injury.dateIncurred).toLocaleDateString()}
                                </Typography>
                                {injury.notes && (
                                  <Typography variant="body2">
                                    Notes: {injury.notes}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            )}
      
            {/* Career Statistics Card */}
            <Card sx={{ ...styles.profileCard, mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={styles.sectionTitle}>
                  Career Statistics
                </Typography>

                <Grid container spacing={2} sx={styles.infoGrid}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Win Methods:
                    </Typography>
                    <Typography>
                      Coming Soon
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Average Fight Time:
                    </Typography>
                    <Typography>
                      Coming Soon
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Striking Accuracy:
                    </Typography>
                    <Typography>
                      Coming Soon
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Takedown Success Rate:
                    </Typography>
                    <Typography>
                      Coming Soon
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Performance Bonuses:
                    </Typography>
                    <Typography>
                      Coming Soon
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Fight History Card */}
            {renderFightHistory()}
          </Grid>

          {/* Right Column: Ratings and Championships */}
          <Grid item xs={12} md={8}>
            {/* Championships Section */}
            {(championships.filter(c => c.currentChampionId === fighter.personid).length > 0 ||
              getPreviousChampionships(fights, championships.filter(c => c.currentChampionId === fighter.personid)).length > 0) && (
              <Card sx={{ mb: 4, ...styles.profileCard }}>
                <CardContent>
                  <Typography variant="h6" sx={styles.sectionTitle}>
                    Accolades
                  </Typography>
                  
                  {/* Current Championships */}
                  {championships
                    .filter(c => c.currentChampionId === fighter.personid)
                    .map(championship => (
                      <Box key={`current-${championship.id}`} sx={styles.championshipCard}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <EmojiEventsIcon sx={{ fontSize: 40, color: 'gold' }} />
                          <Box>
                            <Typography variant="h6">{championship.name}</Typography>
                            <Chip 
                              label="Current Champion" 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(255, 215, 0, 0.2)',
                                color: 'text.primary',
                                mt: 1
                              }} 
                            />
                          </Box>
                        </Box>
                      </Box>
                    ))}

                  {/* Previous Championships */}
                  {getPreviousChampionships(fights, championships.filter(c => c.currentChampionId === fighter.personid))
                    .map(championship => (
                      <Box 
                        key={`previous-${championship.id}`} 
                        sx={{
                          ...styles.championshipCard,
                          backgroundColor: 'rgba(128, 128, 128, 0.05)',
                          border: '1px solid rgba(128, 128, 128, 0.2)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <EmojiEventsIcon sx={{ fontSize: 40, color: '#A9A9A9' }} />
                          <Box>
                            <Typography variant="h6">{championship.name}</Typography>
                            <Chip 
                              label="Former Champion" 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(128, 128, 128, 0.2)',
                                color: 'text.primary',
                                mt: 1
                              }} 
                            />
                          </Box>
                        </Box>
                      </Box>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Ratings Section */}
            <Card sx={styles.profileCard}>
              <CardContent>
                <Typography variant="h6" sx={styles.sectionTitle}>
                  Fighter Ratings
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Organise ratings into categories */}
                  {[
                    {
                      title: "Core Attributes",
                      attributes: ["output", "strength", "speed", "cardio", "toughness", "chin"]
                    },
                    {
                      title: "Striking",
                      attributes: ["striking", "punchPower", "handSpeed", "punchAccuracy", "kicking", "kickPower", "kickSpeed", "kickAccuracy"]
                    },
                    {
                      title: "Defense",
                      attributes: ["strikingDefence", "kickDefence", "headMovement", "footwork"]
                    },
                    {
                      title: "Grappling",
                      attributes: ["takedownOffence", "takedownDefence", "clinchControl", "groundControl"]
                    },
                    {
                      title: "Ground Game",
                      attributes: ["groundOffence", "groundDefence", "groundStriking", "submissionOffence", "submissionDefence", "getUpAbility"]
                    },
                    {
                      title: "Mental",
                      attributes: ["composure", "fightIQ"]
                    }
                  ].map(category => (
                    <Grid item xs={12} key={category.title}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {category.title}
                      </Typography>
                      <Grid container spacing={2}>
                        {category.attributes.map(attr => (
                          <Grid item xs={12} sm={6} key={attr}>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatAttributeName(attr)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={fighter.Rating[attr]}
                                  sx={{
                                    ...styles.ratingBar,
                                    flexGrow: 1,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: fighter.Rating[attr] >= 90 ? 'success.main' :
                                                     fighter.Rating[attr] >= 75 ? 'info.main' :
                                                     fighter.Rating[attr] >= 60 ? 'warning.main' :
                                                     'error.main'
                                    }
                                  }}
                                />
                                <Typography variant="body2" sx={styles.ratingValue}>
                                  {fighter.Rating[attr]}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Divider sx={{ my: 2 }} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;