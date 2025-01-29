import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useMemo for performance
import { Link, useParams } from "react-router-dom";
import { Container, Typography, Tooltip, Box, Chip } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SortableTable from "../components/SortableTable";
import FilterPanel from "../components/FilterPanel";
import { getAllFighters, getAllChampionships, getGameDate, getAllFights } from "../utils/indexedDB";
import { formatFightingStyle, formatBirthday } from "../utils/uiHelpers";
import { getRankingDisplay } from "../utils/rankingsHelper";
import { calculateAge } from '../utils/dateUtils';
import { getFighterStatus, getStatusDisplay } from "../utils/fighterUtils";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CountryFlag from "../components/CountryFlag";

const Roster = () => {
  const { gameId } = useParams();
  // Core state management
  const [fighters, setFighters] = useState([]);
  const [fights, setFights] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [gameDate, setGameDate] = useState(null);

  // Sorting state management
  const [orderBy, setOrderBy] = useState("firstname"); // Default sort by first name
  const [order, setOrder] = useState("asc"); // Default ascending order

  // Add state for fighter ages
  const [fighterAges, setFighterAges] = useState({});

  // Filter state management
  const [filters, setFilters] = useState({
    weightClass: "all",
    fightingStyle: "all",
    nationality: "all",
    championStatus: "all",
    rankingStatus: "all",
    gender: "all",
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
          ages[fighter.personid] = await calculateAge(fighter.dob, gameId);
        }
      }
      setFighterAges(ages);
    };

    loadAges();
  }, [fighters, gameId]);

  // Fetch initial data and populate filter options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both fighters and championships in parallel
        const [fetchedFighters, fetchedChampionships, currentGameDate, fetchedFights] = await Promise.all([
          getAllFighters(gameId),
          getAllChampionships(gameId),
          getGameDate(gameId),
          getAllFights(gameId)
        ]);
        
        // Update main data state
        setFighters(fetchedFighters);
        setChampionships(fetchedChampionships);
        setGameDate(new Date(currentGameDate));

        setFights(fetchedFights);
  
        // Extract and set unique values for filter options
        // Using Set to ensure uniqueness and filter(Boolean) to remove any null/undefined values
        setFilterOptions({
          weightClasses: [...new Set(fetchedFighters.map((f) => f.weightClass))]
            .filter(Boolean)
            .sort(),
          fightingStyles: [
            ...new Set(
              fetchedFighters.map((f) => formatFightingStyle(f.fightingStyle))
            ),
          ]
            .filter(Boolean)
            .sort(),
          nationalities: [...new Set(fetchedFighters.map((f) => f.nationality))]
            .filter(Boolean)
            .sort(),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [gameId]);

  // Define columns configuration
  const columns = [
    { id: "ranking", label: "Ranking" },
    { id: "fullname", label: "Name" },
    { id: "status", label: "Status" },
    { id: "gender", label: "Gender" },
    { id: "dob", label: "Date of Birth (Age)" },
    { id: "weightClass", label: "Weight Class" },
    { id: "fightingStyle", label: "Fighting Style" },
    { id: "nationality", label: "Nationality" },
    { id: "hometown", label: "Hometown" },
    { id: "record", label: "Record" },
  ];

  // Helper function to get championship info for a fighter
  const getChampionshipInfo = useCallback(
    (fighterId) => {
      return championships.filter((c) => c.currentChampionId === fighterId);
    },
    [championships]
  );

  // Helper function to calculate age for sorting
  const getAge = useCallback((dob) => {
    if (!dob) return 0;

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }, []);

  // Filter application logic
  const applyFilters = useCallback(
    (fightersToFilter) => {
      return fightersToFilter.filter((fighter) => {
        // Weight Class filter
        if (
          filters.weightClass !== "all" &&
          fighter.weightClass !== filters.weightClass
        ) {
          return false;
        }

        // Fighting Style filter
        if (
          filters.fightingStyle !== "all" &&
          formatFightingStyle(fighter.fightingStyle) !== filters.fightingStyle
        ) {
          return false;
        }

        // Nationality filter
        if (
          filters.nationality !== "all" &&
          fighter.nationality !== filters.nationality
        ) {
          return false;
        }

        // Get champion status once since we use it multiple times
        const isChampion = getChampionshipInfo(fighter.personid).length > 0;

        // Champion Status filter
        if (filters.championStatus === "champion" && !isChampion) {
          return false;
        }
        if (filters.championStatus === "non-champion" && isChampion) {
          return false;
        }

        // Ranking Status filter - consider champions as ranked
        const isRanked = fighter.ranking != null || isChampion;
        if (filters.rankingStatus === "ranked" && !isRanked) {
          return false;
        }
        if (filters.rankingStatus === "unranked" && isRanked) {
          return false;
        }

        // Gender filter
        if (filters.gender !== "all" && fighter.gender !== filters.gender) {
          return false;
        }

        return true;
      });
    },
    [filters, getChampionshipInfo]
  ); // Include filters and getChampionshipInfo as dependencies

  // Sorting comparison logic
  const compareValues = useCallback((a, b, property) => {
    if (property === 'status') {
      // Get status for both fighters
      const statusA = getFighterStatus(a, gameDate, fights);
      const statusB = getFighterStatus(b, gameDate, fights);
      
      // Define status priority (lower number = higher priority)
      const statusPriority = {
        'INJURED': 3,
        'IN_CAMP': 1,
        'BOOKED': 2,
        'ACTIVE': 0,
        'UNKNOWN': 4
      };
    
      // Compare based on priority
      const priorityA = statusPriority[statusA.type];
      const priorityB = statusPriority[statusB.type];
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort alphabetically by name
      return (a.firstname + a.lastname).localeCompare(b.firstname + b.lastname);
    }
  
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
      if (property === "record") {
        return b.wins - a.wins || a.losses - b.losses;
      }

      // Special handling for full name
      if (property === "fullname") {
        const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
        const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }

      // For DOB sorting, sort by actual age
      if (property === "dob") {
        return getAge(a.dob) - getAge(b.dob);
      }

      // Handle regular string properties
      if (typeof a[property] === "string") {
        return a[property]
          .toLowerCase()
          .localeCompare(b[property].toLowerCase());
      }

    // Handle numeric properties
    return a[property] - b[property];
  }, [fights, getChampionshipInfo, getAge, gameDate]);

  // Sort request handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Memoized filtered and sorted fighters
  const filteredAndSortedFighters = useMemo(() => {
    // First sort the fighters
    const sortedFighters = [...fighters].sort((a, b) => {
      const comparator = compareValues(a, b, orderBy);
      return order === "asc" ? comparator : -comparator;
    });

    // Then apply filters
    return applyFilters(sortedFighters);
  }, [fighters, order, orderBy, compareValues, applyFilters]);

  // Custom cell renderer
  const renderCell = (fighter, columnId) => {
    switch (columnId) {
      case "ranking":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getChampionshipInfo(fighter.personid).map(
              (championship, index) => (
                <Tooltip key={championship.id} title={championship.name} arrow>
                  <EmojiEventsIcon
                    sx={{
                      color: "gold",
                      marginRight:
                        index < getChampionshipInfo(fighter.personid).length - 1
                          ? 1
                          : 0,
                    }}
                  />
                </Tooltip>
              )
            )}
            {!getChampionshipInfo(fighter.personid).length &&
              getRankingDisplay(fighter, championships)}
          </Box>
        );
      case "fullname":
        return (
          <Link
            to={`/game/${gameId}/dashboard/${fighter.personid}`}
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
        );
        case 'status':
          const status = getFighterStatus(fighter, gameDate, fights);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={
                status.type === 'INJURED' ? 
                  `${status.details.type} (${status.details.location})` :
                (status.type === 'BOOKED' || status.type === 'IN_CAMP') ?
                  `Fight: ${new Date(status.details.fightDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}` :
                  ''
              } arrow>
                <Chip 
                  label={getStatusDisplay(status)}
                  color={status.color}
                  size="small"
                  icon={status.type === 'INJURED' ? <LocalHospitalIcon /> : undefined}
                />
              </Tooltip>
            </Box>
          );

      case 'dob':
        return (
          <>
            {formatBirthday(fighter.dob)}
            <Typography variant="body2" color="text.secondary">
              {fighterAges[fighter.personid] || "N/A"} years old
            </Typography>
          </>
        );
      case "fightingStyle":
        return formatFightingStyle(fighter.fightingStyle);
      case "record":
        return `${fighter.wins}W-${fighter.losses}L`;
      case "nationality":
        return (
          <>
            <Typography variant="body2">
              {fighter.nationality}{" "}
              <CountryFlag nationality={fighter.nationality} />
            </Typography>
          </>
        );
      default:
        return fighter[columnId];
    }
  };

  return (
    <Container
      maxWidth="lg"
      style={{ marginTop: "50px", marginBottom: "50px" }}
    >
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

      <SortableTable
        columns={columns}
        data={filteredAndSortedFighters}
        orderBy={orderBy}
        order={order}
        onRequestSort={handleRequestSort}
        renderCell={renderCell}
      />
    </Container>
  );
};

export default Roster;
