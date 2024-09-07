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
import { getAllFighters } from "../utils/indexedDB"; // Import the getAllFighters function

const Roster = () => {
  const [fighters, setFighters] = useState([]);

  useEffect(() => {
    // Fetch fighters from IndexedDB using the getAllFighters function
    getAllFighters()
      .then((fetchedFighters) => {
        setFighters(fetchedFighters);
        console.log("Fetched fighters:", fetchedFighters); // Debugging line
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
              <TableCell>Name</TableCell>
              <TableCell>Weight Class</TableCell>
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
                <TableCell>
                  <Link
                    to={`/dashboard/${fighter.personid}`}
                    style={{
                      textDecoration: "none",
                      color: "#0000EE",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {`${fighter.firstname} ${fighter.lastname}`}
                  </Link>
                </TableCell>
                <TableCell>{fighter.weightClass}</TableCell>
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
