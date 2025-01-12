import React from "react";
import { Container, Typography, Grid, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const fadeIn = {
  animation: "fadeIn 1.5s ease-out",
  "@keyframes fadeIn": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
};

const Landing = () => {
  const navigate = useNavigate();

  const handleNewGame = () => {
    navigate("/selectdate");
  };

  const handleLoadGame = () => {
    navigate("/loadgame");
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
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1,
        }}
      />
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
        <Box sx={{ ...fadeIn, marginBottom: 4 }}>
          <img
            src="/assets/images/logo.png"
            alt="Logo"
            style={{ width: "200px", height: "auto" }}
          />
        </Box>
        <Typography variant="h2" gutterBottom sx={fadeIn}>
          Planet Fighter
        </Typography>
        <Typography variant="h6" gutterBottom sx={fadeIn}>
          Create your world of fighting and experience the thrill of running the
          show!
        </Typography>
        <Grid container spacing={2} sx={{ justifyContent: "center" }}>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleNewGame}
              sx={{
                ...fadeIn,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "#000",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.6)" },
              }}
            >
              New Game
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleLoadGame}
              sx={{
                ...fadeIn,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "#000",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.6)" },
              }}
            >
              Load Game
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Landing;
