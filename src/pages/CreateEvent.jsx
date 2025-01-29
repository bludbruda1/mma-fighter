import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../App.css";
import {
  Button,
  Container,
  Grid,
  Typography,
  MenuItem,
  Select as MuiSelect,
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Box,
  Paper,
  Divider,
  CardContent,
} from "@mui/material";
import {
  getAllFighters,
  addEventToDB,
  getNextEventId,
  getNextFightId,
  addFightToDB,
  getAllFights,
  getAllChampionships,
  getGameDate,
} from "../utils/indexedDB";
import { getRegions, getLocationsByRegion, getVenuesByLocation } from '../data/locations';
import { EventContext } from "../contexts/EventContext";
import FighterSelectionModal from '../components/FighterSelectionModal';
import { formatFightingStyle } from "../utils/uiHelpers";
import { checkFighterAvailability } from "../utils/fighterUtils"

// Styles object for consistent theming
const styles = {
  container: {
    py: 6,
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(240,240,240,0.6) 0%, rgba(255,255,255,0.6) 100%)',
  },
  headerCard: {
    mb: 4,
    p: 3,
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  sectionTitle: {
    color: 'text.primary',
    fontWeight: 'bold',
    mb: 3,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: 0,
      width: 60,
      height: 3,
      backgroundColor: 'primary.main',
      borderRadius: 1,
    }
  },
  formSection: {
    mb: 4,
    p: 3,
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  fightCard: {
    mb: 4,
    p: 3,
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  mainEventBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'primary.main',
    color: 'white',
    px: 2,
    py: 0.5,
    borderRadius: 1,
    fontSize: '0.875rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  saveButton: {
    backgroundColor: "rgba(33, 33, 33, 0.9)",
    color: "#fff",
    py: 1.5,
    px: 4,
    fontSize: '1.1rem',
    transition: 'all 0.2s ease-in-out',
    "&:hover": {
      backgroundColor: "rgba(33, 33, 33, 0.7)",
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
};

// Weight class options (including Open Weight)
const WEIGHT_CLASS_OPTIONS = [
  'Open Weight',
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Heavyweight'
];

const CreateEvent = () => {
  const { gameId } = useParams();
  const { setEventIds } = useContext(EventContext);
  const navigate = useNavigate();
  const routerLocation = useLocation(); 

  // Core state management
  const [gameDate, setGameDate] = useState(null);
  const [fighters, setFighters] = useState([]);
  const [numFights, setNumFights] = useState(1);
  const [cardCounts, setCardCounts] = useState({
    mainCard: 1,
    prelims: 0,
    earlyPrelims: 0
  });
  const [fights, setFights] = useState(
    Array(1).fill({ fighter1: null, fighter2: null })
  );
  const [eventName, setEventName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [cardAssignments, setCardAssignments] = useState(
    Array(1).fill('mainCard')  // Default all fights to main card
  );
  const [fightWeightClasses, setFightWeightClasses] = useState(
    Array(1).fill('Open Weight')  // Default all fights to Open Weight
  );

  const [region, setRegion] = useState('');
  const [eventLocation, setEventLocation] = useState('');  
  const [venue, setVenue] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fighter availability tracking
  const [bookedFighters, setBookedFighters] = useState(new Set());
  const [selectedFightersInEvent, setSelectedFightersInEvent] = useState(
    new Set()
  );
  const [fighterSelectModalOpen, setFighterSelectModalOpen] = useState(false);
  const [currentSelectionContext, setCurrentSelectionContext] = useState(null);
  const [filters, setFilters] = useState({
    weightClass: 'all',
    fightingStyle: 'all',
    nationality: 'all',
    championStatus: 'all',
    rankingStatus: 'all',
    gender: 'all',
  });
  const [filterOptions, setFilterOptions] = useState({
    weightClasses: [],
    fightingStyles: [],
    nationalities: [],
  });
  const [filteredFighters, setFilteredFighters] = useState(fighters);

  // Error tracking
  const [selectionErrors, setSelectionErrors] = useState({});

  // Championship tracking
  const [championships, setChampionships] = useState([]);
  const [vacantChampionships, setVacantChampionships] = useState([]);
  const [fightsWithChampionship, setFightsWithChampionship] = useState({});
  const [fightsWithVacantTitle, setFightsWithVacantTitle] = useState({});

  // Initialize number of fights when it changes
  useEffect(() => {
  setFights(
    Array(numFights)
      .fill(null)
      .map(() => ({
        fighter1: null,
        fighter2: null,
      }))
  );

  // Update card assignments to match new number of fights
  setCardAssignments(prev => {
    const newAssignments = [...prev];
    while (newAssignments.length < numFights) {
      newAssignments.push('mainCard');
    }
    return newAssignments.slice(0, numFights);
  });

  // Add weight class assignments for new fights
  setFightWeightClasses(prev => {
    const newWeightClasses = [...prev];
    while (newWeightClasses.length < numFights) {
      newWeightClasses.push('Open Weight');
    }
    return newWeightClasses.slice(0, numFights);
  });
}, [numFights]);

  // Handler for card assignment changes
  const handleCardAssignmentChange = (index, card) => {
    setCardAssignments(prev => {
      const newAssignments = [...prev];
      newAssignments[index] = card;
      return newAssignments;
    });
  };

  // Function to handle location changes
  const handleLocationChange = (newLocation) => {
    setEventLocation(newLocation);
    setVenue(''); // Reset venue when location changes
    
    // Clear venue error if location is selected
    if (newLocation) {
      setValidationErrors(prev => ({
        ...prev,
        location: undefined
      }));
    }
  };

  // Handler for weight class changes
  const handleWeightClassChange = (index, weightClass) => {
    setFightWeightClasses(prev => {
      const newWeightClasses = [...prev];
      newWeightClasses[index] = weightClass;
      // Reset fighter selections if weight class changes
      if (fights[index].fighter1 || fights[index].fighter2) {
        setFights(prev => {
          const newFights = [...prev];
          newFights[index] = { fighter1: null, fighter2: null };
          return newFights;
        });
        // Remove fighters from selected tracking
        if (fights[index].fighter1?.personid) {
          setSelectedFightersInEvent(prev => {
            const newSet = new Set(prev);
            newSet.delete(fights[index].fighter1.personid);
            return newSet;
          });
        }
        if (fights[index].fighter2?.personid) {
          setSelectedFightersInEvent(prev => {
            const newSet = new Set(prev);
            newSet.delete(fights[index].fighter2.personid);
            return newSet;
          });
        }
      }
      return newWeightClasses;
    });
  };
  

  // Function to create filter options 
  const initializeFilterOptions = (fighters) => {
    setFilterOptions({
      weightClasses: [...new Set(fighters.map(f => f.weightClass))].filter(Boolean).sort(),
      fightingStyles: [...new Set(fighters.map(f => formatFightingStyle(f.fightingStyle)))].filter(Boolean).sort(),
      nationalities: [...new Set(fighters.map(f => f.nationality))].filter(Boolean).sort(),
    });
    setFilteredFighters(fighters);
  };

  // Helper function to get total number of fights
  const getTotalFights = () => {
    return cardCounts.mainCard + cardCounts.prelims + cardCounts.earlyPrelims;
  };

  // Helper function to get fight position label
  const getFightPositionLabel = (index, cardCounts) => {
    if (index === 0) return "Main Event";
    if (index === 1) return "Co-Main Event";
    
    // Determine which card the fight is on based on index
    if (index < cardCounts.mainCard) {
      return `Main Card Fight ${cardCounts.mainCard - index}`;
    } else if (index < cardCounts.mainCard + cardCounts.prelims) {
      return `Prelim Fight ${cardCounts.mainCard + cardCounts.prelims - index}`;
    } else {
      return `Early Prelim Fight ${getTotalFights() - index}`;
    }
  };

  // Function to handle filtering of fighters
  const handleFilterFighters = useCallback((newFilters) => {
    let filtered = [...fighters];
  
    // If weight class is locked to a specific class (not 'Open Weight' or 'all'), 
    // filter by that weight class regardless of other filters
    if (currentSelectionContext && fightWeightClasses[currentSelectionContext.fightIndex] !== 'Open Weight') {
      filtered = filtered.filter(fighter => 
        fighter.weightClass === fightWeightClasses[currentSelectionContext.fightIndex]
      );
    }
    // Otherwise, apply normal weight class filter
    else if (newFilters.weightClass !== 'all') {
      filtered = filtered.filter(fighter => fighter.weightClass === newFilters.weightClass);
    }
  
    // Filter by fighting style
    if (newFilters.fightingStyle !== 'all') {
      filtered = filtered.filter(fighter => 
        formatFightingStyle(fighter.fightingStyle) === newFilters.fightingStyle
      );
    }
  
    // Filter by nationality
    if (newFilters.nationality !== 'all') {
      filtered = filtered.filter(fighter => fighter.nationality === newFilters.nationality);
    }
  
    // Filter by champion status
    if (newFilters.championStatus !== 'all') {
      filtered = filtered.filter(fighter => {
        const isChampion = championships.some(c => c.currentChampionId === fighter.personid);
        return newFilters.championStatus === 'champion' ? isChampion : !isChampion;
      });
    }
  
    // Filter by ranking status
    if (newFilters.rankingStatus !== 'all') {
      filtered = filtered.filter(fighter => {
        const isRanked = fighter.ranking !== null && fighter.ranking !== undefined;
        return newFilters.rankingStatus === 'ranked' ? isRanked : !isRanked;
      });
    }
  
    // Filter by gender
    if (newFilters.gender !== 'all') {
      filtered = filtered.filter(fighter => fighter.gender === newFilters.gender);
    }
  
    setFilteredFighters(filtered);
  }, [fighters, currentSelectionContext, fightWeightClasses, championships]); 

  // Efect to trigger filtering
  useEffect(() => {
    handleFilterFighters(filters);
  }, [filters, handleFilterFighters]);

  // Load initial data: fighters, championships, and check bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedFighters, allFights, fetchedChampionships, currentGameDate] = await Promise.all([
          getAllFighters(gameId),
          getAllFights(gameId),
          getAllChampionships(gameId),
          getGameDate(gameId)
        ]);

        // Set the game date
        setGameDate(new Date(currentGameDate));
        setFighters(fetchedFighters);
        setFilteredFighters(fetchedFighters);
        setChampionships(fetchedChampionships);

        // Initialize filter options with fetched fighters
        initializeFilterOptions(fetchedFighters);

        // Create set of fighter IDs that are already booked in other events
        const bookedFighterIds = new Set();
        allFights.forEach((fight) => {
          if (!fight.result) {
            // Only consider unfinished fights
            if (fight.fighter1?.personid)
              bookedFighterIds.add(fight.fighter1.personid);
            if (fight.fighter2?.personid)
              bookedFighterIds.add(fight.fighter2.personid);
          }
        });

        // Identify vacant championships
        const vacant = fetchedChampionships.filter((c) => !c.currentChampionId);
        setVacantChampionships(vacant);

        setFighters(fetchedFighters);
        setBookedFighters(bookedFighterIds);
        setChampionships(fetchedChampionships);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [gameId]);

  // Helper function to determine if a fighter can be selected
  const isFighterAvailable = (fighterId, fightIndex, fighterPosition) => {
    const fighter = fighters.find(f => f.personid === fighterId);
    const selectedWeightClass = fightWeightClasses[fightIndex];
    const otherFighter = fighterPosition === 'fighter1' ? 
      fights[fightIndex]?.fighter2 : 
      fights[fightIndex]?.fighter1;
  
    // Check if fighter is already booked in another event
    if (bookedFighters.has(fighterId)) {
      return {
        available: false,
        error: "Fighter is already booked in another event",
      };
    }
  
    // Check if fighter is already selected in current event
    if (selectedFightersInEvent.has(fighterId)) {
      return {
        available: false,
        error: "Fighter is already scheduled in this event",
      };
    }


    // Check fighter availability (injuries and training camp)
    const availability = checkFighterAvailability(fighter, selectedDate);
    if (!availability.isAvailable) {
      return {
        available: false,
        error: availability.reason,
      };
    }
    
    // Check weight class match if not Open Weight
    if (selectedWeightClass !== 'Open Weight' && fighter.weightClass !== selectedWeightClass) {
      return {
        available: false,
        error: `Fighter must be in ${selectedWeightClass} weight class`,
      };
    }
  
    // Check gender match if other fighter is selected
    if (otherFighter && fighter.gender !== otherFighter.gender) {
      return {
        available: false,
        error: "Fighters must be of the same gender",
      };
    }
  
    return { available: true };
  };

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const dateFromQuery = params.get("date");
    if (dateFromQuery) {
      setSelectedDate(dateFromQuery); // Set the selected date if available
    }
  }, [routerLocation.search]);

  // Helper function for date changes
  const handleDateChange = (e) => {
    const selectedDateStr = e.target.value;
    const selectedDateObj = new Date(selectedDateStr);
    const gameDateObj = new Date(gameDate);
  
    // Reset time components for accurate date comparison
    selectedDateObj.setHours(0, 0, 0, 0);
    gameDateObj.setHours(0, 0, 0, 0);
  
    if (selectedDateObj < gameDateObj) {
      setValidationErrors(prev => ({
        ...prev,
        date: "Event date cannot be earlier than the current game date"
      }));
    } else {
      // Clear the date error if valid
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.date;
        return updated;
      });
    }
    
    setSelectedDate(selectedDateStr);
  };

  // Helper function to check if a fighter is a champion
  const getChampionship = (fighterId) => {
    // Convert fighterId to string for safety if needed
    const fighterIdStr = String(fighterId);
    const fighterIdNum = Number(fighterId);

    const championship = championships.find((c) => {
      return (
        c.currentChampionId === fighterIdNum ||
        c.currentChampionId === fighterIdStr
      );
    });

    return championship;
  };

  // Handle fighter selection for a fight
  const handleSelectChange = (fightIndex, fighterKey, event) => {
    const selectedId = Number(event.target.value);
    const selectedFighter = fighters.find((f) => f.personid === selectedId);

    if (!selectedFighter) {
      console.error("Fighter not found:", selectedId);
      return;
    }

    // Validate fighter availability
    const { available, error } = isFighterAvailable(
      selectedId,
      fightIndex,
      fighterKey
    );

    if (!available) {
      setSelectionErrors({
        ...selectionErrors,
        [`${fightIndex}-${fighterKey}`]: error,
      });
      return;
    }

    // Clear any existing error for this selection
    const newErrors = { ...selectionErrors };
    delete newErrors[`${fightIndex}-${fighterKey}`];
    setSelectionErrors(newErrors);

    // Update fights state and selected fighters tracking
    setFights((prevFights) => {
      const newFights = [...prevFights];

      // Remove previous fighter from tracking if exists
      if (newFights[fightIndex]?.[fighterKey]?.personid) {
        const newSelected = new Set(selectedFightersInEvent);
        newSelected.delete(newFights[fightIndex][fighterKey].personid);
        setSelectedFightersInEvent(newSelected);
      }

      // Add new fighter
      newFights[fightIndex] = {
        ...newFights[fightIndex],
        [fighterKey]: selectedFighter,
      };

      // Add new fighter to tracking
      setSelectedFightersInEvent((prev) => new Set([...prev, selectedId]));

      return newFights;
    });
  };

  // Handle championship toggle for a fight
  const handleChampionshipToggle = (
    fightIndex,
    checked,
    championshipId = null
  ) => {
    const fight = fights[fightIndex];

    // Handle active champion's title
    const championTitle =
      getChampionship(fight.fighter1?.personid) ||
      getChampionship(fight.fighter2?.personid);

    if (championTitle) {
      setFightsWithChampionship((prev) => ({
        ...prev,
        [fightIndex]: checked ? championTitle : null,
      }));
      // Clear any vacant title selection if champion's title is selected
      if (checked) {
        setFightsWithVacantTitle((prev) => {
          const updated = { ...prev };
          delete updated[fightIndex];
          return updated;
        });
      }
    } else if (championshipId) {
      // Handle vacant title selection
      const vacantTitle = vacantChampionships.find(
        (c) => c.id === championshipId
      );
      if (vacantTitle) {
        setFightsWithVacantTitle((prev) => ({
          ...prev,
          [fightIndex]: checked ? vacantTitle : null,
        }));
        // Clear any champion's title if vacant title is selected
        setFightsWithChampionship((prev) => {
          const updated = { ...prev };
          delete updated[fightIndex];
          return updated;
        });
      }
    }
  };

  // Helper function to check if fighters are eligible for a vacant title
  const canCompeteForVacantTitle = (fight, championship) => {
    if (!fight.fighter1 || !fight.fighter2) return false;

    // Check if both fighters are in the correct weight class and gender
    return (
      fight.fighter1.weightClass === championship.weightClass &&
      fight.fighter2.weightClass === championship.weightClass &&
      fight.fighter1.gender === championship.gender &&
      fight.fighter2.gender === championship.gender
    );
  };

  // Save the entire event including all fights
  const handleSaveEvent = async () => {
    try {
      // Reset validation errors
      const errors = {};

      // Add date validation
      if (!selectedDate) {
        errors.date = "Please select an event date";
      } else {
        const selectedDateObj = new Date(selectedDate);
        const gameDateObj = new Date(gameDate);
        
        // Reset time components for accurate date comparison
        selectedDateObj.setHours(0, 0, 0, 0);
        gameDateObj.setHours(0, 0, 0, 0);

        if (selectedDateObj < gameDateObj) {
          errors.date = "Event date cannot be earlier than the current date";
        }
      }
  
      if (!eventName.trim()) {
        errors.eventName = "Please enter an event name";
      }
  
      if (!selectedDate) {
        errors.date = "Please select an event date";
      }

      if (!region) {
        errors.region = "Please select a region";
      }
  
      if (!eventLocation) {
        errors.location = "Please select a location";
      }
  
      if (!venue) {
        errors.venue = "Please select a venue";
      }
  
      // Check for fighter selection errors
      fights.forEach((fight, index) => {
        if (!fight.fighter1 || !fight.fighter2) {
          if (!fight.fighter1) {
            errors[`fighter1-${index}`] = "Please select Fighter 1";
          }
          if (!fight.fighter2) {
            errors[`fighter2-${index}`] = "Please select Fighter 2";
          }
        }
      });
  
      // If there are any errors, display them and stop
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
  
      setIsSaving(true);

      // Create fights with proper structure
      const fightIds = [];
      for (const [index, fight] of fights.entries()) {
        const nextFightId = await getNextFightId(gameId);
        const fightData = {
          id: nextFightId,
          fighter1: {
            personid: fight.fighter1.personid,
            firstname: fight.fighter1.firstname,
            lastname: fight.fighter1.lastname,
          },
          fighter2: {
            personid: fight.fighter2.personid,
            firstname: fight.fighter2.firstname,
            lastname: fight.fighter2.lastname,
          },
          weightClass: fight.fighter1.weightClass,
          date: selectedDate,
          result: null,
          stats: null,
          championship: fightsWithChampionship[index] ? {
            id: fightsWithChampionship[index].id,
            name: fightsWithChampionship[index].name,
            currentChampionId: fightsWithChampionship[index].currentChampionId
          } : fightsWithVacantTitle[index] ? {
            id: fightsWithVacantTitle[index].id,
            name: fightsWithVacantTitle[index].name,
            currentChampionId: null
          } : null
        };

        await addFightToDB(fightData, gameId);
        fightIds.push(nextFightId);
      }

      // Group fights by card
      const groupedFights = {
        mainCard: fightIds.filter((_, index) => cardAssignments[index] === 'mainCard'),
        prelims: fightIds.filter((_, index) => cardAssignments[index] === 'prelims'),
        earlyPrelims: fightIds.filter((_, index) => cardAssignments[index] === 'earlyPrelims')
      };

      // Create event with new fight structure
      const nextEventId = await getNextEventId(gameId);
      const eventData = {
        id: nextEventId,
        name: eventName,
        date: selectedDate,
        region: region,
        location: eventLocation,
        venue: venue,
        fights: groupedFights
      };

      await addEventToDB(eventData, gameId);
      console.log("Event saved successfully:", eventData);
      setEventIds(prevEventIds => [...prevEventIds, eventData.id]);
      navigate(`/game/${gameId}/event/${eventData.id}`);
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Main component render
  return (
    <Box sx={styles.container}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Paper sx={styles.headerCard}>
          <Typography 
            variant="h3" 
            align="center" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Create Event
          </Typography>
          <Typography 
            variant="subtitle1" 
            align="center" 
            color="text.secondary"
            sx={{ fontSize: '1.1rem' }}
          >
            Set up your next big fight night
          </Typography>
        </Paper>

        {/* Event Details Section */}
        <Paper sx={styles.formSection}>
          <Typography variant="h5" sx={styles.sectionTitle}>
            Event Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  label="Event Name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  placeholder="e.g., UFC 285"
                  error={!!validationErrors.eventName}
                  helperText={validationErrors.eventName}
                  sx={{ mb: 2 }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <TextField
                  label="Event Date"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: gameDate ? gameDate.toISOString().split('T')[0] : undefined,
                  }}
                  error={!!validationErrors.date}
                  helperText={validationErrors.date}
                  sx={{ mb: 2 }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!validationErrors.region}>
                <InputLabel>Region</InputLabel>
                <MuiSelect
                  value={region}
                  label="Region"
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setEventLocation('');
                    setVenue('');
                    setValidationErrors(prev => ({...prev, region: undefined}));
                  }}
                >
                  {Object.keys(getRegions()).map((reg) => (
                    <MenuItem key={reg} value={reg}>{reg}</MenuItem>
                  ))}
                </MuiSelect>
                {validationErrors.region && (
                  <FormHelperText>{validationErrors.region}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              {region && (
                <FormControl fullWidth error={!!validationErrors.location}>
                  <InputLabel>Location</InputLabel>
                  <MuiSelect
                    value={eventLocation}
                    label="Location"
                    onChange={(e) => handleLocationChange(e.target.value)}
                  >
                    {getLocationsByRegion(region).map((loc) => (
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    ))}
                  </MuiSelect>
                  {validationErrors.location && (
                    <FormHelperText>{validationErrors.location}</FormHelperText>
                  )}
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {eventLocation && (
                <FormControl fullWidth error={!!validationErrors.venue}>
                  <InputLabel>Venue</InputLabel>
                  <MuiSelect
                    value={venue}
                    label="Venue"
                    onChange={(e) => {
                      setVenue(e.target.value);
                      setValidationErrors(prev => ({...prev, venue: undefined}));
                    }}
                  >
                    {getVenuesByLocation(eventLocation).map((ven) => (
                      <MenuItem key={ven} value={ven}>{ven}</MenuItem>
                    ))}
                  </MuiSelect>
                  {validationErrors.venue && (
                    <FormHelperText>{validationErrors.venue}</FormHelperText>
                  )}
                </FormControl>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Fight Card Section */}
        <Paper sx={styles.formSection}>
          <Paper sx={styles.formSection}>
            <Typography variant="h5" sx={styles.sectionTitle}>
              Fight Card Setup
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Main Card Fights</InputLabel>
                  <MuiSelect
                    value={cardCounts.mainCard}
                    label="Main Card Fights"
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= 6) { // Enforce main card limit
                        setCardCounts(prev => ({
                          ...prev,
                          mainCard: value
                        }));
                        setNumFights(value + cardCounts.prelims + cardCounts.earlyPrelims);
                      }
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <MenuItem key={num} value={num}>{num} Fight{num > 1 ? 's' : ''}</MenuItem>
                    ))}
                  </MuiSelect>
                  <FormHelperText>Maximum 6 fights on main card</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Prelim Fights</InputLabel>
                  <MuiSelect
                    value={cardCounts.prelims}
                    label="Prelim Fights"
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      const total = value + cardCounts.mainCard + cardCounts.earlyPrelims;
                      if (total <= 15) { // Enforce total fight limit
                        setCardCounts(prev => ({
                          ...prev,
                          prelims: value
                        }));
                        setNumFights(total);
                      }
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <MenuItem key={num} value={num}>{num} Fight{num > 1 ? 's' : ''}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Early Prelim Fights</InputLabel>
                  <MuiSelect
                    value={cardCounts.earlyPrelims}
                    label="Early Prelim Fights"
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      const total = value + cardCounts.mainCard + cardCounts.prelims;
                      if (total <= 15) { // Enforce total fight limit
                        setCardCounts(prev => ({
                          ...prev,
                          earlyPrelims: value
                        }));
                        setNumFights(total);
                      }
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <MenuItem key={num} value={num}>{num} Fight{num > 1 ? 's' : ''}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Individual Fight Cards */}
          {fights.map((fight, index) => {
            // Check if either fighter is a champion
            const fighter1IsChampion = fight.fighter1 && getChampionship(fight.fighter1.personid);
            const fighter2IsChampion = fight.fighter2 && getChampionship(fight.fighter2.personid);
            const championship = fighter1IsChampion || fighter2IsChampion;

            // Get eligible vacant titles for this fight
            const eligibleVacantTitles = fight.fighter1 && fight.fighter2 
              ? vacantChampionships.filter(c => canCompeteForVacantTitle(fight, c))
              : [];

            return (
              <Paper 
                key={index} 
                sx={{
                  ...styles.fightCard,
                  position: 'relative',
                  mt: index === 0 ? 4 : 2,
                  // Add different background tints for each card section
                  backgroundColor: index < cardCounts.mainCard ? 
                    'rgba(255, 255, 255, 0.95)' : 
                    index < cardCounts.mainCard + cardCounts.prelims ?
                    'rgba(245, 245, 245, 0.95)' :
                    'rgba(235, 235, 235, 0.95)'
                }}
              >
                {/* Position Badge */}
                <Box sx={{
                  ...styles.mainEventBadge,
                  backgroundColor: index < cardCounts.mainCard ? 
                    'primary.main' : 
                    index < cardCounts.mainCard + cardCounts.prelims ?
                    'secondary.main' :
                    'text.secondary'
                }}>
                  {getFightPositionLabel(index, cardCounts)}
                </Box>
                
                {/* Fight Card Content */}
                <CardContent>
                  {/* Card Assignment and Weight Class Row */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Card Assignment */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Card Assignment</InputLabel>
                      <MuiSelect
                        value={cardAssignments[index]}
                        label="Card Assignment"
                        onChange={(e) => handleCardAssignmentChange(index, e.target.value)}
                      >
                        <MenuItem value="mainCard">Main Card</MenuItem>
                        <MenuItem value="prelims">Prelims</MenuItem>
                        <MenuItem value="earlyPrelims">Early Prelims</MenuItem>
                      </MuiSelect>
                    </FormControl>
                    </Grid>

                  {/* Weight Class option */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Weight Class</InputLabel>
                      <MuiSelect
                        value={fightWeightClasses[index]}
                        label="Weight Class"
                        onChange={(e) => handleWeightClassChange(index, e.target.value)}
                      >
                        {WEIGHT_CLASS_OPTIONS.map((weightClass) => (
                          <MenuItem key={weightClass} value={weightClass}>
                            {weightClass}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                    </Grid>
                  </Grid>

                  {/* Fighter Selection Grid */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      {selectionErrors[`${index}-fighter1`] && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {selectionErrors[`${index}-fighter1`]}
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => {
                          setCurrentSelectionContext({ fightIndex: index, fighterKey: "fighter1" });
                          setFighterSelectModalOpen(true);
                        }}
                        fullWidth
                        sx={{
                          backgroundColor: 'red',
                          '&:hover': {
                            backgroundColor: 'darkred',
                          },
                        }}
                      >
                        {fight.fighter1 ? 
                          `${fight.fighter1.firstname} ${fight.fighter1.lastname}` : 
                          "Select Red Corner"}
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {selectionErrors[`${index}-fighter2`] && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {selectionErrors[`${index}-fighter2`]}
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => {
                          setCurrentSelectionContext({ fightIndex: index, fighterKey: "fighter2" });
                          setFighterSelectModalOpen(true);
                        }}
                        fullWidth
                        sx={{
                          backgroundColor: 'blue',
                          '&:hover': {
                            backgroundColor: 'darkblue',
                          },
                        }}
                      >
                        {fight.fighter2 ? 
                          `${fight.fighter2.firstname} ${fight.fighter2.lastname}` : 
                          "Select Blue Corner"}
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Championship Options */}
                  {(championship || eligibleVacantTitles.length > 0) && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Championship Options
                      </Typography>
                      {championship && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!fightsWithChampionship[index]}
                              onChange={(e) => handleChampionshipToggle(index, e.target.checked)}
                            />
                          }
                          label={`Make this a ${championship.name} title fight`}
                        />
                      )}
                      {eligibleVacantTitles.map((vacantTitle) => (
                        <FormControlLabel
                          key={vacantTitle.id}
                          control={
                            <Checkbox
                              checked={fightsWithVacantTitle[index]?.id === vacantTitle.id}
                              onChange={(e) => handleChampionshipToggle(index, e.target.checked, vacantTitle.id)}
                              disabled={!!fightsWithChampionship[index]}
                            />
                          }
                          label={`Make this fight for the vacant ${vacantTitle.name}`}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Paper>
            );
          })}
        </Paper>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleSaveEvent}
            disabled={isSaving}
            sx={styles.saveButton}
          >
            {isSaving ? <CircularProgress size={24} color="inherit" /> : "Save Event"}
          </Button>
        </Box>
        {/* Fighter Selection Modal */}
        {fighterSelectModalOpen && currentSelectionContext && (
                <FighterSelectionModal
                open={fighterSelectModalOpen}
                onClose={() => setFighterSelectModalOpen(false)}
                fighters={filteredFighters}
                filterOptions={filterOptions}
                filters={{
                  ...filters,
                // Lock the weight class filter to the selected fight's weight class
                weightClass: fightWeightClasses[currentSelectionContext.fightIndex] === 'Open Weight'
                ? 'all' 
                : fightWeightClasses[currentSelectionContext.fightIndex]
                }}
                setFilters={setFilters}
                onFighterSelect={(fighter) => {
                  const event = { target: { value: fighter.personid } };
                  handleSelectChange(
                    currentSelectionContext.fightIndex,
                    currentSelectionContext.fighterKey,
                    event
                  );
                  setFighterSelectModalOpen(false);
                }}
                bookedFighters={bookedFighters}
                selectedFightersInEvent={selectedFightersInEvent}
                championships={championships}
                weightClassLocked={fightWeightClasses[currentSelectionContext.fightIndex] !== 'Open Weight'}
                gameDate={gameDate}
              />              
              )}
            </Container>
          </Box>
        );
};

export default CreateEvent;