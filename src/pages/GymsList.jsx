import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";
import { getAllGyms } from "../utils/indexedDB";

const GymList = () => {
  const { gameId } = useParams();
  const [gyms, setGyms] = useState([]);

  // Effect to fetch gym IDs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const gymsData = await getAllGyms(gameId);
        setGyms(gymsData);
      } catch (error) {
        console.error("Error fetching the gym:", error);
      }
    };
    fetchData();
  }, [gameId]);

  return (
    <Container
      maxWidth="lg"
      style={{ marginTop: "50px", marginBottom: "50px" }}
    >
      <Typography variant="h2" align="center" gutterBottom>
        Planet Fighter Gyms
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Specialty</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gyms.map((gym) => (
              <TableRow key={gym.id}>
                <TableCell>
                  <Link to={`/game/${gameId}/gym/${gym.id}`}>{gym.name}</Link>
                </TableCell>
                <TableCell>{gym.specialty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default GymList;
