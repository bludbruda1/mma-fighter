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
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const Dashboard = () => {
  const { id } = useParams();
  const [fighter, setFighter] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFighterData = async () => {
      try {
        const response = await fetch(`/fighters.json`);
        if (!response.ok) {
          throw new Error("Failed to fetch fighter data");
        }
        const data = await response.json();
        const selectedFighter = data.find(
          (fighter) => fighter.personid === parseInt(id)
        );
        if (!selectedFighter) {
          throw new Error("Fighter not found");
        }
        setFighter(selectedFighter);
      } catch (error) {
        setError(error.message);
      }
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
                  <TableCell>Output</TableCell>
                  <TableCell>Kicking</TableCell>
                  <TableCell>Striking</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow key={fighter.personid}>
                  <TableCell>
                    {fighter.wins}W-{fighter.losses}L
                  </TableCell>
                  <TableCell>{fighter.compositeRating.output}</TableCell>
                  <TableCell>{fighter.compositeRating.kicking}</TableCell>
                  <TableCell>{fighter.compositeRating.striking}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h5" gutterBottom>
            Recent Fights
          </Typography>
          <List>
            {fighter.recentFights && fighter.recentFights.length > 0 ? (
              fighter.recentFights.map((fight, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${fight.opponent} - ${fight.result}`}
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="body1">
                No recent fights available.
              </Typography>
            )}
          </List>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
