import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Table,
  TableContainer,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import { getAllFighters } from "../utils/indexedDB";

const Dashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fighter, setFighter] = useState(null);
  const [error, setError] = useState(null);
  const [allFighterIds, setAllFighterIds] = useState([]);

  // Effect to fetch all fighter IDs when the component mounts
  useEffect(() => {
    const fetchAllFighterIds = async () => {
      try {
        const fighters = await getAllFighters();
        // Extract and sort fighter IDs
        const ids = fighters.map(f => f.personid).sort((a, b) => a - b);
        setAllFighterIds(ids);
      } catch (error) {
        console.error("Error fetching all fighter IDs:", error);
      }
    };

    fetchAllFighterIds();
  }, []);

  // Effect to fetch the current fighter's data when the ID changes
  useEffect(() => {
    const fetchFighterData = async () => {
      try {
        const fighters = await getAllFighters();
        const selectedFighter = fighters.find(f => f.personid === parseInt(id));
        if (selectedFighter) {
          setFighter(selectedFighter);
        } else {
          setError("Fighter not found");
        }
      } catch (error) {
        setError("Error fetching fighter: " + error.message);
      }
    };

    fetchFighterData();
  }, [id]);

  // Function to navigate to the next or previous fighter
  const navigateToFighter = (direction) => {
    const currentIndex = allFighterIds.indexOf(parseInt(id));
    let newIndex;
    if (direction === 'next') {
      // If at the end, loop back to the start
      newIndex = currentIndex + 1 >= allFighterIds.length ? 0 : currentIndex + 1;
    } else {
      // If at the start, loop to the end
      newIndex = currentIndex - 1 < 0 ? allFighterIds.length - 1 : currentIndex - 1;
    }
    navigate(`/dashboard/${allFighterIds[newIndex]}`);
  };

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

  // Helper function to render rating bars
  const renderRatingBar = (rating) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" value={rating} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${rating}`}</Typography>
      </Box>
    </Box>
  );

  // Helper function to format attribute names
  const formatAttributeName = (attr) => {
    return attr.split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button onClick={() => navigateToFighter('previous')} variant="contained">Previous</Button>
        <Typography variant="h3" align="center">
          {`${fighter.firstname} ${fighter.lastname}`}
        </Typography>
        <Button onClick={() => navigateToFighter('next')} variant="contained">Next</Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Fighter's basic information and image */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardMedia
              component="img"
              sx={{ 
                height: 300, // Reduced height
                objectFit: "contain", // Changed to "contain" to fit the whole image
                bgcolor: 'grey.200' // Added a background color to make the image more visible if it doesn't fill the space
              }}
              image={fighter.image}
              alt={`${fighter.firstname} ${fighter.lastname}`}
            />
            <CardContent>
              <Typography variant="h5" gutterBottom>Basic Information</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Nationality:</Typography>
                <Typography variant="body1">{fighter.nationality}</Typography> {/* Changed from Chip to Typography */}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Hometown:</Typography>
                <Typography variant="body1">{fighter.hometown}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Record:</Typography>
                <Typography variant="body1" fontWeight="bold">{fighter.wins}W-{fighter.losses}L</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Weight Class:</Typography>
                <Chip label={fighter.weightClass} color="secondary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Fighting Style:</Typography>
                <Chip label={fighter.fightingStyle.replace(/_/g, ' ')} color="primary" />
              </Box>
            </CardContent>
          </Card>

          {/* Recent Fights section */}
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>Recent Fights</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Opponent</TableCell>
                      <TableCell>Result</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fighter.recentFights && fighter.recentFights.length > 0 ? (
                      fighter.recentFights.map((fight, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Link
                              to={`/Dashboard/${fight.opponentId}`}
                              style={{ textDecoration: "none", color: "#1976d2" }}
                            >
                              {fight.opponent}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={fight.result} 
                              color={fight.result.toLowerCase().includes('win') ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No recent fights available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Fighter's ratings and tendencies */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>Fighter Ratings</Typography>
              <Grid container spacing={2}>
                {[
                  "output", "strength", "speed", "cardio", "toughness", "striking",
                  "punchPower", "kicking", "kickPower", "strikingDefence", "kickDefence",
                  "takedownOffence", "takedownDefence", "clinchOffence", "clinchDefence",
                  "clinchControl", "groundOffence", "groundDefence", "groundControl",
                  "submissionOffence", "submissionDefence", "getUpAbility", "fightIQ"
                ].map((attr) => (
                  <Grid item xs={12} sm={6} key={attr}>
                    <Typography variant="body2">{formatAttributeName(attr)}</Typography>
                    {renderRatingBar(fighter.Rating[attr])}
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>Fighting Style</Typography>
              {Object.entries(fighter.Tendency).map(([position, tendencies]) => (
                <Box key={position} sx={{ mb: 2 }}>
                  <Typography variant="h6">{formatAttributeName(position)}</Typography>
                  <Grid container spacing={1}>
                    {Object.entries(tendencies).map(([action, value]) => (
                      <Grid item xs={6} sm={4} key={action}>
                        <Typography variant="body2">{formatAttributeName(action)}</Typography>
                        {renderRatingBar(value)}
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;