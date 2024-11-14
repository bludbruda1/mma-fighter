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
  TableSortLabel,
  Paper,
} from "@mui/material";
import { getAllFighters } from "../utils/indexedDB";
import { formatFightingStyle } from "../utils/uiHelpers";

const Roster = () => {
  const [fighters, setFighters] = useState([]);

  // Add sorting state
  const [orderBy, setOrderBy] = useState('firstname'); // Default sort by first name
  const [order, setOrder] = useState('asc'); // Default ascending order

  useEffect(() => {
    // Fetch fighters from IndexedDB using the getAllFighters function
    getAllFighters()
      .then((fetchedFighters) => {
        setFighters(fetchedFighters);
        console.log("Fetched fighters:", fetchedFighters); // Debugging line
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

    // Handle sort request for a column
    const handleRequestSort = (property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };
  
    // Sorting function for different data types
    const compareValues = (a, b, property) => {
      // Special handling for record comparison
      if (property === 'record') {
        return (b.wins - a.wins) || (a.losses - b.losses); // Sort by wins desc, then losses asc
      }
  
      // Special handling for full name
      if (property === 'fullname') {
        const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
        const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
  
      // Handle regular string properties
      if (typeof a[property] === 'string') {
        return a[property].toLowerCase().localeCompare(b[property].toLowerCase());
      }
  
      // Handle numeric properties
      return a[property] - b[property];
    };
  
    // Sort fighters based on current sorting state
    const sortedFighters = [...fighters].sort((a, b) => {
      const comparator = compareValues(a, b, orderBy);
      return order === 'asc' ? comparator : -comparator;
    });
  
    // Helper function to create sort handler for a property
    const createSortHandler = (property) => () => {
      handleRequestSort(property);
    };

    return (
      <Container maxWidth="lg" style={{ marginTop: "50px", marginBottom: "50px" }}>
        <Typography variant="h2" align="center" gutterBottom>
          MMA Fighter Roster
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'fullname'}
                    direction={orderBy === 'fullname' ? order : 'asc'}
                    onClick={createSortHandler('fullname')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'weightClass'}
                    direction={orderBy === 'weightClass' ? order : 'asc'}
                    onClick={createSortHandler('weightClass')}
                  >
                    Weight Class
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'fightingStyle'}
                    direction={orderBy === 'fightingStyle' ? order : 'asc'}
                    onClick={createSortHandler('fightingStyle')}
                  >
                    Fighting Style
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'nationality'}
                    direction={orderBy === 'nationality' ? order : 'asc'}
                    onClick={createSortHandler('nationality')}
                  >
                    Nationality
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'hometown'}
                    direction={orderBy === 'hometown' ? order : 'asc'}
                    onClick={createSortHandler('hometown')}
                  >
                    Hometown
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'record'}
                    direction={orderBy === 'record' ? order : 'asc'}
                    onClick={createSortHandler('record')}
                  >
                    Record
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedFighters.map((fighter) => (
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
                  <TableCell>{formatFightingStyle(fighter.fightingStyle)}</TableCell>
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
