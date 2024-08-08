import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    fetch("/fighters.json")
      .then((response) => response.json())
      .then((jsonData) => {
        setFighters(jsonData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <Container
      maxWidth="lg"
      style={{ marginTop: "50px", marginBottom: "50px" }}
    >
      <Typography variant="h2" align="center" gutterBottom>
        MMA Fighter Roster
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Nationality</TableCell>
              <TableCell>Hometown</TableCell>
              <TableCell>Record</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fighters.map((fighter) => (
              <TableRow
                key={fighter.personid}
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <TableCell>{fighter.personid}</TableCell>
                <TableCell>
                  <Link
                    to={`/dashboard/${fighter.personid}`}
                    style={{ textDecoration: "underline" }}
                  >
                    {`${fighter.firstname} ${fighter.lastname}`}
                  </Link>
                </TableCell>
                <TableCell>{fighter.nationality}</TableCell>
                <TableCell>{fighter.hometown}</TableCell>
                <TableCell>
                  {fighter.wins}W-{fighter.losses}L
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Roster;
