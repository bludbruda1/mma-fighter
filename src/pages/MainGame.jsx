import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Container, Button } from "@mui/material";

const MainGame = () => {
  const location = useLocation();
  const { game } = location.state || {};
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/Calendar");
  };

  if (!game) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          No game data found.
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" align="center" sx={{ mt: 4 }}>
        Welcome Back, {game.managerName}
      </Typography>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Current Game Date: {game.gameDate}
      </Typography>
      <Button variant="outlined" sx={{ mt: 4 }} onClick={handleContinue}>
        Continue Game
      </Button>
    </Container>
  );
};

export default MainGame;
