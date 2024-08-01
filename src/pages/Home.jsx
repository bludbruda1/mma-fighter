import React from "react";
import { Container, Typography, Grid, Button, Box } from "@mui/material";
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
    <Box
      sx={{
        position: "relative",
        backgroundImage: `url('/assets/images/background.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#ffffff",
        textAlign: "center",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      {/* Dim overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimming effect
          zIndex: 1,
        }}
      />
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
        <Typography variant="h2" gutterBottom>
          MMA Fighter
        </Typography>
        <Typography variant="h6" gutterBottom>
          Welcome to MMAFighter, a combat sport simulation game that lets you
          create your own world of fighting and provides an experience of
          running the show.
        </Typography>
        <Grid
          container
          spacing={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Grid item>
            <Button
              variant="contained"
              onClick={handleViewRoster}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                color: "#000", // Text color
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.6)", // Darker on hover
                },
              }}
            >
              View Roster
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleGetStarted}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                color: "#000", // Text color
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.6)", // Darker on hover
                },
              }}
            >
              Get Started
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
