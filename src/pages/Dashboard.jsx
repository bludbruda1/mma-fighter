import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
                Fighting Weight: {fighter.weightClass}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Statistics
          </Typography>
          <TableContainer component={Paper} style={{ marginBottom: "50px" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Record</TableCell>
                  <TableCell>Kicking</TableCell>
                  <TableCell>Striking</TableCell>
                  <TableCell>Leg Kick Offence</TableCell>
                  <TableCell>Kick Defence</TableCell>
                  <TableCell>Striking Defence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow key={fighter.personid}>
                  <TableCell>
                    {fighter.wins}W-{fighter.losses}L
                  </TableCell>
                  <TableCell>{fighter.Rating.kicking}</TableCell>
                  <TableCell>{fighter.Rating.striking}</TableCell>
                  <TableCell>{fighter.Rating.legKickOffence}</TableCell>
                  <TableCell>{fighter.Rating.kickDefence}</TableCell>
                  <TableCell>{fighter.Rating.strikingDefence}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h5" gutterBottom>
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
                      <TableCell>{fight.opponent}</TableCell>
                      <TableCell>{fight.result}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No recent fights available.
                    </TableCell>
                  </TableRow>
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
