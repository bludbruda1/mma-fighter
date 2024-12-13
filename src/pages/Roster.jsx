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
  Tooltip,
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getAllFighters, getAllChampionships } from "../utils/indexedDB";
import { formatFightingStyle, formatBirthdayWithAge } from "../utils/uiHelpers";

const Roster = () => {
  const [fighters, setFighters] = useState([]);
  const [championships, setChampionships] = useState([]);

  // Add sorting state
  const [orderBy, setOrderBy] = useState('firstname'); // Default sort by first name
  const [order, setOrder] = useState('asc'); // Default ascending order

  // Fetch all fighters and champions from indexDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedFighters, fetchedChampionships] = await Promise.all([
          getAllFighters(),
          getAllChampionships()
        ]);
        setFighters(fetchedFighters);
        setChampionships(fetchedChampionships);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Helper function to get championship info for a fighter
  const getChampionshipInfo = (fighterId) => {
    return championships.filter(c => c.currentChampionId === fighterId);
  };

  // Helper function to get age for sorting purposes
  const getAge = (dob) => {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle sort request for a column
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sorting function for different data types
  const compareValues = (a, b, property) => {
    if (property === 'isChampion') {
      const champCountA = getChampionshipInfo(a.personid).length;
      const champCountB = getChampionshipInfo(b.personid).length;
      return champCountB - champCountA; // Sort by number of championships
    }

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

    // For DOB sorting, we'll sort by actual age
    if (property === 'dob') {
      return getAge(a.dob) - getAge(b.dob);
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
        Planet Fighter Roster
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
                  active={orderBy === 'dob'}
                  direction={orderBy === 'dob' ? order : 'asc'}
                  onClick={createSortHandler('dob')}
                >
                  Date of Birth (Age)
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
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'isChampion'}
                  direction={orderBy === 'isChampion' ? order : 'asc'}
                  onClick={createSortHandler('isChampion')}
                >
                  Champion
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
                <TableCell>{formatBirthdayWithAge(fighter.dob)}</TableCell>
                <TableCell>{fighter.weightClass}</TableCell>
                <TableCell>{formatFightingStyle(fighter.fightingStyle)}</TableCell>
                <TableCell>{fighter.nationality}</TableCell>
                <TableCell>{fighter.hometown}</TableCell>
                <TableCell>
                  {fighter.wins}W-{fighter.losses}L
                </TableCell>
                <TableCell>
                  {getChampionshipInfo(fighter.personid).map((championship, index) => (
                    <Tooltip key={championship.id} title={championship.name} arrow>
                      <EmojiEventsIcon 
                        sx={{ 
                          color: 'gold',
                          marginRight: index < getChampionshipInfo(fighter.personid).length - 1 ? 1 : 0 
                        }} 
                      />
                    </Tooltip>
                  ))}
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
