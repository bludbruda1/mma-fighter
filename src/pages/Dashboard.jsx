import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "@mui/material";

const Dashboard = () => {
  const { id } = useParams();
  const [fighter, setFighter] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFighterData = () => {
      const dbName = "FightersDB";
      const storeName = "fighters";
      const dbVersion = 1;

      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = (event) => {
        setError("IndexedDB error: " + event.target.error);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], "readonly");
        const objectStore = transaction.objectStore(storeName);
        const getFighter = objectStore.get(parseInt(id));

        getFighter.onerror = (event) => {
          setError("Error fetching fighter: " + event.target.error);
        };

        getFighter.onsuccess = (event) => {
          const selectedFighter = event.target.result;
          if (selectedFighter) {
            setFighter(selectedFighter);
          } else {
            setError("Fighter not found");
          }
        };
      };
    };

    fetchFighterData();
  }, [id]);

  if (error) {
    return (
      <Container
        maxWidth="lg"
        style={{ marginTop: "50px", marginBottom: "50px" }}
      >
        <Typography variant="h4" align="center" color="error">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  if (!fighter) {
    return (
      <Container
        maxWidth="lg"
        style={{ marginTop: "50px", marginBottom: "50px" }}
      >
        <Typography variant="h4" align="center">
          Loading...
        </Typography>
      </Container>
    );
  }

  // Helper function to render rating bars - probably can be moved into utils
  const renderRatingBar = (rating) => {
    const percentage = (rating / 100) * 100;
    return (
      <div
        style={{
          width: "100%",
          backgroundColor: "#e0e0e0",
          height: "10px",
          borderRadius: "5px",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            backgroundColor: "#4caf50",
            height: "100%",
            borderRadius: "5px",
          }}
        ></div>
      </div>
    );
  };

  // Helper function to format attribute names - probably can be moved into utils
  const formatAttributeName = (attr) => {
    return attr
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Container
      maxWidth="lg"
      style={{ marginTop: "50px", marginBottom: "50px" }}
    >
      <Typography variant="h2" align="center" gutterBottom>
        {fighter.firstname} {fighter.lastname}
      </Typography>
      <Grid container spacing={3}>
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
              <Typography variant="body1">
                Nationality: {fighter.nationality}
              </Typography>
              <Typography variant="body1">
                Hometown: {fighter.hometown}
              </Typography>
              <Typography variant="body1">
                Record: {fighter.wins}W-{fighter.losses}L
              </Typography>
              <Typography variant="body1">
                Weight Class: {fighter.weightClass}
              </Typography>
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
                          style={{
                            textDecoration: "none",
                            color: "#0000EE",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = "underline";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = "none";
                          }}
                          onClick={() => {
                            window.scrollTo(0, 0); // Scrolls to the top of the page
                          }}
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
                  "output",
                  "strength",
                  "speed",
                  "cardio",
                  "toughness",
                  "striking",
                  "punchPower",
                  "kicking",
                  "kickPower",
                  "strikingDefence",
                  "kickDefence",
                  "takedownOffence",
                  "takedownDefence",
                  "clinchOffence",
                  "clinchDefence",
                  "clinchControl",
                  "groundOffence",
                  "groundDefence",
                  "groundControl",
                  "submissionOffence",
                  "submissionDefence",
                  "getUpAbility",
                  "fightIQ"
                ].map((attr) => (
                  <TableRow key={attr}>
                    <TableCell>{formatAttributeName(attr)}</TableCell>
                    <TableCell>{fighter.Rating[attr]}</TableCell>
                    <TableCell>
                      {renderRatingBar(fighter.Rating[attr])}
                    </TableCell>
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
                {Object.entries(fighter.Tendency).map(
                  ([position, tendencies]) => (
                    <TableRow key={position}>
                      <TableCell>{formatAttributeName(position)}</TableCell>
                      <TableCell>
                        {Object.entries(tendencies).map(([action, value]) => (
                          <div key={action}>{`${formatAttributeName(
                            action
                          )}: ${value}%`}</div>
                        ))}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
