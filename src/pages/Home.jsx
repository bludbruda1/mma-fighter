// Home.jsx
import React from "react";
import { Container, Typography, Grid, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleViewRoster = () => {
    navigate("/roster");
  };

  const handleGetStarted = () => {
    navigate("/fight");
  };

  return (
    <>
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
          MMA Fighter
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="textSecondary"
          gutterBottom
        >
          Welcome to MMAFighter, a combat sport simulation game that lets you
          create your own world of fighting and provides an experience of
          running the show.
        </Typography>
        <Grid container spacing={2} sx={{ justifyContent: "center" }}>
          <Grid item>
            <Button variant="contained" onClick={handleViewRoster}>
              View Roster
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={handleGetStarted}>
              Get Started
            </Button>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Home;
