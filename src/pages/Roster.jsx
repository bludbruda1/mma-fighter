import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useMemo for performance
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
  Box,
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FilterPanel from "../components/FilterPanel";
import { getAllFighters, getAllChampionships } from "../utils/indexedDB";
import { formatFightingStyle, formatBirthday } from "../utils/uiHelpers";
import { getRankingDisplay } from "../utils/rankingsHelper";
import { calculateAge } from '../utils/dateUtils';


const Roster = () => {
  // Core state management
  const [fighters, setFighters] = useState([]);
  const [championships, setChampionships] = useState([]);

  // Sorting state management
  const [orderBy, setOrderBy] = useState('firstname'); // Default sort by first name
  const [order, setOrder] = useState('asc'); // Default ascending order

  // Add state for fighter ages
  const [fighterAges, setFighterAges] = useState({});

  // Filter state management
  const [filters, setFilters] = useState({
    weightClass: 'all',
    fightingStyle: 'all',
    nationality: 'all',
    championStatus: 'all',
    rankingStatus: 'all',
    gender: 'all',
  });

  // Filter options state - populated from fighter data
  const [filterOptions, setFilterOptions] = useState({
    weightClasses: [],
    fightingStyles: [],
    nationalities: [],
  });

  // Effect to calculate ages for all fighters
  useEffect(() => {
    const loadAges = async () => {
      const ages = {};
      for (const fighter of fighters) {
        if (fighter.dob) {
          ages[fighter.personid] = await calculateAge(fighter.dob);
        }
      }
      setFighterAges(ages);
    };

    loadAges();
  }, [fighters]);

  // Fetch initial data and populate filter options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both fighters and championships in parallel
        const [fetchedFighters, fetchedChampionships] = await Promise.all([
          getAllFighters(),
          getAllChampionships()
        ]);
        
        // Update main data state
        setFighters(fetchedFighters);
        setChampionships(fetchedChampionships);
  
        // Extract and set unique values for filter options
        // Using Set to ensure uniqueness and filter(Boolean) to remove any null/undefined values
        setFilterOptions({
          weightClasses: [...new Set(fetchedFighters.map(f => f.weightClass))].filter(Boolean).sort(),
          fightingStyles: [...new Set(fetchedFighters.map(f => formatFightingStyle(f.fightingStyle)))].filter(Boolean).sort(),
          nationalities: [...new Set(fetchedFighters.map(f => f.nationality))].filter(Boolean).sort(),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Helper function to get championship info for a fighter
  const getChampionshipInfo = useCallback((fighterId) => {
    return championships.filter(c => c.currentChampionId === fighterId);
  }, [championships]);

  // Helper function to calculate age for sorting
  const getAge = useCallback((dob) => {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // Filter application logic
  const applyFilters = useCallback((fightersToFilter) => {
    return fightersToFilter.filter(fighter => {
      // Weight Class filter
      if (filters.weightClass !== 'all' && fighter.weightClass !== filters.weightClass) {
        return false;
      }

      // Fighting Style filter
      if (filters.fightingStyle !== 'all' && 
          formatFightingStyle(fighter.fightingStyle) !== filters.fightingStyle) {
        return false;
      }

      // Nationality filter
      if (filters.nationality !== 'all' && fighter.nationality !== filters.nationality) {
        return false;
      }

      // Get champion status once since we use it multiple times
      const isChampion = getChampionshipInfo(fighter.personid).length > 0;

      // Champion Status filter
      if (filters.championStatus === 'champion' && !isChampion) {
        return false;
      }
      if (filters.championStatus === 'non-champion' && isChampion) {
        return false;
      }

      // Ranking Status filter - consider champions as ranked
      const isRanked = fighter.ranking != null || isChampion;
      if (filters.rankingStatus === 'ranked' && !isRanked) {
        return false;
      }
      if (filters.rankingStatus === 'unranked' && isRanked) {
        return false;
      }

      // Gender filter
      if (filters.gender !== 'all' && fighter.gender !== filters.gender) {
        return false;
      }

      return true;
    });
  }, [filters, getChampionshipInfo]); // Include filters and getChampionshipInfo as dependencies

  // Sorting comparison logic
  const compareValues = useCallback((a, b, property) => {
    if (property === 'ranking') {
      const aIsChamp = getChampionshipInfo(a.personid).length > 0;
      const bIsChamp = getChampionshipInfo(b.personid).length > 0;
      
      // Champions always come first
      if (aIsChamp && !bIsChamp) return -1;
      if (!aIsChamp && bIsChamp) return 1;
      if (aIsChamp && bIsChamp) return 0;
      
      // Then sort by ranking
      const aRank = a.ranking || 999;
      const bRank = b.ranking || 999;
      return aRank - bRank;
    }

    // Special handling for record comparison
    if (property === 'record') {
      return (b.wins - a.wins) || (a.losses - b.losses);
    }

    // Special handling for full name
    if (property === 'fullname') {
      const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
      const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    }

    // For DOB sorting, sort by actual age
    if (property === 'dob') {
      return getAge(a.dob) - getAge(b.dob);
    }

    // Handle regular string properties
    if (typeof a[property] === 'string') {
      return a[property].toLowerCase().localeCompare(b[property].toLowerCase());
    }

    // Handle numeric properties
    return a[property] - b[property];
  }, [getChampionshipInfo, getAge]);

  // Sort request handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Create sort handler for a property
  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

  // Memoized filtered and sorted fighters
  const filteredAndSortedFighters = useMemo(() => {
    // First sort the fighters
    const sortedFighters = [...fighters].sort((a, b) => {
      const comparator = compareValues(a, b, orderBy);
      return order === 'asc' ? comparator : -comparator;
    });
    
    // Then apply filters
    return applyFilters(sortedFighters);
  }, [fighters, order, orderBy, compareValues, applyFilters]);

  return (
    <Container maxWidth="lg" style={{ marginTop: "50px", marginBottom: "50px" }}>
      <Typography variant="h2" align="center" gutterBottom>
        Planet Fighter Roster
      </Typography>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        totalFighters={fighters.length}
        filteredCount={filteredAndSortedFighters.length}
      />

      {/* Fighter Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {/* Table headers with sort labels */}
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'ranking'}
                  direction={orderBy === 'ranking' ? order : 'asc'}
                  onClick={createSortHandler('ranking')}
                >
                  Ranking
                </TableSortLabel>
              </TableCell>
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
                    active={orderBy === 'gender'}
                    direction={orderBy === 'gender' ? order : 'asc'}
                    onClick={createSortHandler('gender')}
                  >
                    Gender
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
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedFighters.map((fighter) => (
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    {!getChampionshipInfo(fighter.personid).length && getRankingDisplay(fighter, championships)}
                  </Box>
                </TableCell>
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
                <TableCell>{fighter.gender}</TableCell>
                <TableCell>
                  {formatBirthday(fighter.dob)}
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {fighterAges[fighter.personid] || "N/A"} years old
                  </Typography>
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
