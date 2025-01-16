import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import Select from "../components/Select";
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

const CreateEvent = () => {
  const { setEventIds } = useContext(EventContext);
  const navigate = useNavigate();
  const routerLocation = useLocation(); 

  // Core state management
  const [gameDate, setGameDate] = useState(null);
  const [fighters, setFighters] = useState([]);
  const [numFights, setNumFights] = useState(1);
  const [fights, setFights] = useState(
    Array(1).fill({ fighter1: null, fighter2: null })
  );
  const [eventName, setEventName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [cardAssignments, setCardAssignments] = useState(
    Array(1).fill('mainCard')  // Default all fights to main card
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

  // Load initial data: fighters, championships, and check bookings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch fighters, fights, and championships data
        const [fetchedFighters, allFights, fetchedChampionships, currentGameDate] =
          await Promise.all([
            getAllFighters(),
            getAllFights(),
            getAllChampionships(),
            getGameDate(),
          ]);

        // Set the game date
        setGameDate(new Date(currentGameDate));

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

    loadData();
  }, []);

  // Helper function to determine if a fighter can be selected
  const isFighterAvailable = (fighterId, fightIndex, fighterPosition) => {
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
        const nextFightId = await getNextFightId();
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

        await addFightToDB(fightData);
        fightIds.push(nextFightId);
      }

      // Group fights by card
      const groupedFights = {
        mainCard: fightIds.filter((_, index) => cardAssignments[index] === 'mainCard'),
        prelims: fightIds.filter((_, index) => cardAssignments[index] === 'prelims'),
        earlyPrelims: fightIds.filter((_, index) => cardAssignments[index] === 'earlyPrelims')
      };

      // Create event with new fight structure
      const nextEventId = await getNextEventId();
      const eventData = {
        id: nextEventId,
        name: eventName,
        date: selectedDate,
        region: region,
        location: eventLocation,
        venue: venue,
        fights: groupedFights
      };

      await addEventToDB(eventData);
      console.log("Event saved successfully:", eventData);
      setEventIds(prevEventIds => [...prevEventIds, eventData.id]);
      navigate(`/event/${eventData.id}`);
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
          <Typography variant="h5" sx={styles.sectionTitle}>
            Fight Card Setup
          </Typography>
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Number of Fights</InputLabel>
            <MuiSelect
              value={numFights}
              label="Number of Fights"
              onChange={(e) => setNumFights(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <MenuItem key={num} value={num}>{num} Fight{num > 1 ? 's' : ''}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>

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
                  mt: index === 0 ? 4 : 2
                }}
              >
                {/* Fight Position Badge */}
                {index === 0 && (
                  <Box sx={styles.mainEventBadge}>
                    Main Event
                  </Box>
                )}
                
                {/* Fight Card Content */}
                <CardContent>
                  {/* Card Assignment */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
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

                  {/* Fighter Selection Grid */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      {selectionErrors[`${index}-fighter1`] && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {selectionErrors[`${index}-fighter1`]}
                        </Alert>
                      )}
                      <Select
                        fighters={fighters}
                        selectedItem={fight.fighter1}
                        onSelectChange={(event) => handleSelectChange(index, "fighter1", event)}
                        bookedFighters={bookedFighters}
                        selectedFightersInEvent={new Set(
                          fights
                            .filter((_, fightIndex) => fightIndex !== index)
                            .flatMap((f) => [f.fighter1?.personid, f.fighter2?.personid])
                            .filter(Boolean)
                        )}
                        currentFightIndex={index}
                        fightPosition="fighter1"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {selectionErrors[`${index}-fighter2`] && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {selectionErrors[`${index}-fighter2`]}
                        </Alert>
                      )}
                      <Select
                        fighters={fighters}
                        selectedItem={fight.fighter2}
                        onSelectChange={(event) => handleSelectChange(index, "fighter2", event)}
                        bookedFighters={bookedFighters}
                        selectedFightersInEvent={new Set(
                          fights
                            .filter((_, fightIndex) => fightIndex !== index)
                            .flatMap((f) => [f.fighter1?.personid, f.fighter2?.personid])
                            .filter(Boolean)
                        )}
                        currentFightIndex={index}
                        fightPosition="fighter2"
                      />
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
      </Container>
    </Box>
  );
};

export default CreateEvent;