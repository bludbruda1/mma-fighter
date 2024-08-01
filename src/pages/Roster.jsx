// Roster.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const Roster = () => {
  const [fighters, setFighters] = useState([]);

  useEffect(() => {
    // Fetch the JSON data from the file
    fetch("/fighters.json")
      .then((response) => response.json())
      .then((jsonData) => {
        setFighters(jsonData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <Container maxWidth="lg" style={{ marginTop: "50px" }}>
      <Typography variant="h2" align="center" gutterBottom>
        Fighters Roster
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Nationality</TableCell>
              <TableCell>Hometown</TableCell>
              <TableCell>Record</TableCell>
              <TableCell>Output</TableCell>
              <TableCell>Kicking</TableCell>
              <TableCell>Striking</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fighters.map((fighter) => (
              <TableRow key={fighter.personid}>
                <TableCell>{fighter.personid}</TableCell>
                <TableCell>{`${fighter.firstname} ${fighter.lastname}`}</TableCell>
                <TableCell>{fighter.age}</TableCell>
                <TableCell>{fighter.nationality}</TableCell>
                <TableCell>{fighter.hometown}</TableCell>
                <TableCell>
                  {fighter.wins}W-{fighter.losses}L
                </TableCell>
                <TableCell>{fighter.compositeRating.output}</TableCell>
                <TableCell>{fighter.compositeRating.kicking}</TableCell>
                <TableCell>{fighter.compositeRating.striking}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Roster;
