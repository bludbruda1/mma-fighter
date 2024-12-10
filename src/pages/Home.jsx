import React, { useState } from "react";
import {
  CircularProgress,
  Container,
  Typography,
  Grid,
  Button,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { resetDB } from "../utils/indexedDB"; // Import the resetDB function

// Define the fade-in animation used upon page load for the home page
const fadeIn = {
  animation: "fadeIn 1.5s ease-out", // Duration and easing for the fade-in effect
  "@keyframes fadeIn": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
};

const Home = () => {
  // Define the useNavigate method for routing
  const navigate = useNavigate();

  const handleViewRoster = () => {
    navigate("/roster");
  };

  const handleCreateEvent = () => {
    navigate("/createevent");
  };

  const handleViewEvents = () => {
    navigate("/events");
  };

  const [loading, setLoading] = useState(false);

  const handleResetGame = async () => {
    setLoading(true);
    try {
      await resetDB();
      console.log("Game reset successfully");
      window.location.reload(); // Hard refresh the page
    } catch (error) {
      console.error("Error resetting game", error);
    } finally {
      setLoading(false);
    }
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
        {/* Centered logo below the title */}
        <Box sx={{ ...fadeIn, marginBottom: 4 }}>
          <img
            src="/assets/images/logo.png"
            alt="Logo"
            style={{
              width: "200px", // Adjust the size as needed
              height: "auto",
            }}
          />
        </Box>
        <Typography variant="h2" gutterBottom sx={fadeIn}>
          Planet Fighter
        </Typography>
        <Typography variant="h6" gutterBottom sx={fadeIn}>
          Welcome to Planet Fight, a combat sport simulation game that lets you
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
                ...fadeIn,
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
              onClick={handleCreateEvent}
              sx={{
                ...fadeIn,
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                color: "#000", // Text color
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.6)", // Darker on hover
                },
              }}
            >
              Create Event
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleViewEvents}
              sx={{
                ...fadeIn,
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                color: "#000", // Text color
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.6)", // Darker on hover
                },
              }}
            >
              View Events
            </Button>
          </Grid>
          {/* Reset Game Button */}
          <Grid item>
            <Button
              variant="contained"
              onClick={handleResetGame}
              sx={{
                backgroundColor: "rgba(255, 0, 0, 0.8)", // Semi-transparent red background
                color: "#fff", // White text color
                "&:hover": {
                  backgroundColor: "rgba(255, 0, 0, 0.6)", // Darker on hover
                },
                "&:disabled": {
                  backgroundColor: "rgba(255, 0, 0, 0.3)", // Lighter red when disabled
                  color: "#fff", // Keep text color white
                },
              }}
              disabled={loading} // Disable button during loading state
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Reset Game"
              )}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
