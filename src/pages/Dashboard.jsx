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
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
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
      <Container maxWidth="lg" style={{ marginTop: "50px", marginBottom: "50px" }}>
        <Typography variant="h4" align="center" color="error">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  // Loading state
  if (!fighter) {
    return (
      <Container maxWidth="lg" style={{ marginTop: "50px", marginBottom: "50px" }}>
        <Typography variant="h4" align="center">
          Loading...
        </Typography>
      </Container>
    );
  }

  // Helper function to render rating bars
  const renderRatingBar = (rating) => {
    const percentage = (rating / 100) * 100;
    return (
      <div style={{
        width: "100%",
        backgroundColor: "#e0e0e0",
        height: "10px",
        borderRadius: "5px",
      }}>
        <div style={{
          width: `${percentage}%`,
          backgroundColor: "#4caf50",
          height: "100%",
          borderRadius: "5px",
        }}></div>
      </div>
    );
  };

  // Helper function to format attribute names
  const formatAttributeName = (attr) => {
    return attr.split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: "50px", marginBottom: "50px" }}>
      {/* Navigation buttons and fighter name */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '10px',             // Added for spacing
        borderRadius: '5px'          // Added for style
      }}>
        <Button 
          onClick={() => navigateToFighter('previous')} 
          variant="contained"
          style={{ minWidth: '100px' }}  // Ensure button has minimum width
        >
          Back
        </Button>
        <Typography variant="h2" align="center">
          {fighter ? `${fighter.firstname} ${fighter.lastname}` : 'Loading...'}
        </Typography>
        <Button 
          onClick={() => navigateToFighter('next')} 
          variant="contained"
          style={{ minWidth: '100px' }}  // Ensure button has minimum width
        >
          Next
        </Button>
      </div>
      
      <Grid container spacing={3}>
        {/* Fighter's basic information and image */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              style={{ objectFit: "contain" }}
              height="280"
              image={fighter.image}
              alt={`${fighter.firstname} ${fighter.lastname}`}
            />
            <CardContent>
              <Typography variant="body1">Nationality: {fighter.nationality}</Typography>
              <Typography variant="body1">Hometown: {fighter.hometown}</Typography>
              <Typography variant="body1">Record: {fighter.wins}W-{fighter.losses}L</Typography>
              <Typography variant="body1">Weight Class: {fighter.weightClass}</Typography>
            </CardContent>
          </Card>

          {/* Recent Fights section */}
          <Typography variant="h5" gutterBottom style={{ marginTop: "20px" }}>
            Recent Fights
          </Typography>
          <TableContainer component={Paper}>
            <Table>
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
                          style={{ textDecoration: "none", color: "#0000EE" }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                          onClick={() => { window.scrollTo(0, 0); }}
                        >
                          {fight.opponent}
                        </Link>
                      </TableCell>
                      <TableCell>{fight.result}</TableCell>
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
        </Grid>

        {/* Fighter's ratings and tendencies */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Fighter Ratings
          </Typography>
          <TableContainer component={Paper} style={{ marginBottom: "20px" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Attribute</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Visual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  "output", "strength", "speed", "cardio", "toughness", "striking",
                  "punchPower", "kicking", "kickPower", "strikingDefence", "kickDefence",
                  "takedownOffence", "takedownDefence", "clinchOffence", "clinchDefence",
                  "clinchControl", "groundOffence", "groundDefence", "groundControl",
                  "submissionOffence", "submissionDefence", "getUpAbility", "fightIQ"
                ].map((attr) => (
                  <TableRow key={attr}>
                    <TableCell>{formatAttributeName(attr)}</TableCell>
                    <TableCell>{fighter.Rating[attr]}</TableCell>
                    <TableCell>{renderRatingBar(fighter.Rating[attr])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h5" gutterBottom>
            Fighting Style
          </Typography>
          <TableContainer component={Paper} style={{ marginBottom: "20px" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Tendency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(fighter.Tendency).map(([position, tendencies]) => (
                  <TableRow key={position}>
                    <TableCell>{formatAttributeName(position)}</TableCell>
                    <TableCell>
                      {Object.entries(tendencies).map(([action, value]) => (
                        <div key={action}>{`${formatAttributeName(action)}: ${value}%`}</div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;