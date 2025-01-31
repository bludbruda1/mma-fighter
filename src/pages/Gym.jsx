import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAllFighters, getGymById } from "../utils/indexedDB";
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const Gym = () => {
  const { gameId, id } = useParams(); // Ensure both gameId and id are extracted
  const [gym, setGym] = useState(null);
  const [fighters, setFighters] = useState([]);

  useEffect(() => {
    const fetchGymAndFighters = async () => {
      if (!gameId || !id) return;

      const gymData = await getGymById(gameId, parseInt(id));
      setGym(gymData);

      const allFighters = await getAllFighters(gameId); // Ensure you pass gameId here
      const gymFighters = allFighters.filter(
        (fighter) => fighter.gymId === parseInt(id)
      );
      setFighters(gymFighters);
    };

    fetchGymAndFighters();
  }, [gameId, id]);

  if (!gym) {
    return <Typography variant="h5">Loading gym details...</Typography>;
  }

  return (
    <Container
      align="center"
      maxWidth="md"
      sx={{ position: "relative", zIndex: 2 }}
    >
      {/* Centered logo below the title */}
      <Box sx={{ marginBottom: 4 }}>
        <img
          src={gym.logo}
          alt="Logo"
          style={{
            width: "150px", // Adjust the size as needed
            height: "auto",
          }}
        />
      </Box>
      <Typography variant="h2" gutterBottom>
        {gym.name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Location: {gym.location}
      </Typography>
      <Typography align="left" variant="h5">
        Fighters:
      </Typography>
      <List>
        {fighters.map((fighter) => (
          <ListItem key={fighter.personid} divider>
            <ListItemText
              primary={`${fighter.firstname} ${fighter.lastname}`}
              secondary={`${fighter.fightingStyle} | ${fighter.wins}W - ${fighter.losses}L`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default Gym;
