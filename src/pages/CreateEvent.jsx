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
  Box,
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
} from "../utils/indexedDB";
import { EventContext } from "../contexts/EventContext";

const CreateEvent = () => {
  const { setEventIds } = useContext(EventContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Core state management
  const [fighters, setFighters] = useState([]);
  const [numFights, setNumFights] = useState(1);
  const [fights, setFights] = useState(
    Array(1).fill({ fighter1: null, fighter2: null })
  );
  const [eventName, setEventName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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
  }, [numFights]);

  // Load initial data: fighters, championships, and check bookings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch fighters, fights, and championships data
        const [fetchedFighters, allFights, fetchedChampionships] =
          await Promise.all([
            getAllFighters(),
            getAllFights(),
            getAllChampionships(),
          ]);

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
    const params = new URLSearchParams(location.search);
    const dateFromQuery = params.get("date");
    if (dateFromQuery) {
      setSelectedDate(dateFromQuery); // Set the selected date if available
    }
  }, [location.search]);

  // Helper function for date changes
  const handleDateChange = (e) => {
    const dateString = e.target.value;
    setSelectedDate(dateString);
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

    // Check if both fighters are in the correct weight class
    return (
      fight.fighter1.weightClass === championship.weightClass &&
      fight.fighter2.weightClass === championship.weightClass
    );
  };

  // Save the entire event including all fights
  const handleSaveEvent = async () => {
    try {
      // Validate event name
      if (!eventName.trim()) {
        console.log("Please enter an event name.");
        return;
      }

      setIsSaving(true);

      // Validate all fights have both fighters selected
      const invalidFights = fights.some(
        (fight) => !fight.fighter1 || !fight.fighter2
      );

      if (invalidFights) {
        console.log("Please select fighters for all fights");
        setIsSaving(false);
        return;
      }

      // Create all fights sequentially and collect their IDs
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
          result: null,
          stats: null,
          // Include championship information (either active or vacant)
          championship: fightsWithChampionship[index] ? {
            id: fightsWithChampionship[index].id,
            name: fightsWithChampionship[index].name,
            currentChampionId: fightsWithChampionship[index].currentChampionId
          } : fightsWithVacantTitle[index] ? {
            id: fightsWithVacantTitle[index].id,
            name: fightsWithVacantTitle[index].name,
            currentChampionId: null // Explicitly null for vacant titles
          } : null
        };

        await addFightToDB(fightData);
        fightIds.push(nextFightId);
      }

      // Create the event with all fight IDs
      const nextEventId = await getNextEventId();
      const eventData = {
        id: nextEventId,
        name: eventName,
        date: selectedDate,
        fights: fightIds,
      };

      if (fightIds.length > 0) {
        await addEventToDB(eventData);
        console.log("Event saved successfully:", eventData);
        setEventIds(prevEventIds => [...prevEventIds, eventData.id]);
        navigate(`/event/${eventData.id}`);
      } else {
        console.log("No valid fights to save");
      }
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Render a single fight card
  const renderFightCard = (fight, index) => {
    // Check if either fighter is a champion
    const fighter1IsChampion =
      fight.fighter1 && getChampionship(fight.fighter1.personid);
    const fighter2IsChampion =
      fight.fighter2 && getChampionship(fight.fighter2.personid);
    const championship = fighter1IsChampion || fighter2IsChampion;

    // Get eligible vacant titles for this fight
    const eligibleVacantTitles = vacantChampionships.filter((c) =>
      canCompeteForVacantTitle(fight, c)
    );

    return (
      <div key={index} style={{ marginBottom: "30px" }}>
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{
            fontWeight: index === 0 ? "bold" : "normal",
            mb: 3,
          }}
        >
          {index === 0
            ? "Main Event"
            : index === 1 && fights.length > 2
            ? "Co-Main Event"
            : index === fights.length - 1
            ? "Opening Fight"
            : `Fight ${fights.length - index}`}
        </Typography>
        <Grid container spacing={3} justifyContent="space-between">
          {/* Fighter 1 Selection */}
          <Grid item xs={12} md={5}>
            {selectionErrors[`${index}-fighter1`] && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {selectionErrors[`${index}-fighter1`]}
              </Alert>
            )}
            <Select
              fighters={fighters}
              selectedItem={fight.fighter1}
              onSelectChange={(event) =>
                handleSelectChange(index, "fighter1", event)
              }
              bookedFighters={bookedFighters}
              selectedFightersInEvent={
                new Set(
                  fights
                    .filter((_, fightIndex) => fightIndex !== index)
                    .flatMap((f) => [
                      f.fighter1?.personid,
                      f.fighter2?.personid,
                    ])
                    .filter(Boolean)
                )
              }
              currentFightIndex={index}
              fightPosition="fighter1"
            />
          </Grid>

          {/* Fighter 2 Selection */}
          <Grid item xs={12} md={5}>
            {selectionErrors[`${index}-fighter2`] && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {selectionErrors[`${index}-fighter2`]}
              </Alert>
            )}
            <Select
              fighters={fighters}
              selectedItem={fight.fighter2}
              onSelectChange={(event) =>
                handleSelectChange(index, "fighter2", event)
              }
              bookedFighters={bookedFighters}
              selectedFightersInEvent={
                new Set(
                  fights
                    .filter((_, fightIndex) => fightIndex !== index)
                    .flatMap((f) => [
                      f.fighter1?.personid,
                      f.fighter2?.personid,
                    ])
                    .filter(Boolean)
                )
              }
              currentFightIndex={index}
              fightPosition="fighter2"
            />
          </Grid>

          {/* Championship options */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
                mt: 2,
              }}
            >
              {/* Active champion's title option */}
              {championship && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!fightsWithChampionship[index]}
                      onChange={(e) =>
                        handleChampionshipToggle(index, e.target.checked)
                      }
                    />
                  }
                  label={`Make this a ${championship.name} title fight`}
                />
              )}

              {/* Vacant title options */}
              {eligibleVacantTitles.length > 0 &&
                eligibleVacantTitles.map((vacantTitle) => (
                  <FormControlLabel
                    key={vacantTitle.id}
                    control={
                      <Checkbox
                        checked={
                          fightsWithVacantTitle[index]?.id === vacantTitle.id
                        }
                        onChange={(e) =>
                          handleChampionshipToggle(
                            index,
                            e.target.checked,
                            vacantTitle.id
                          )
                        }
                        disabled={!!fightsWithChampionship[index]}
                      />
                    }
                    label={`Make this fight for the vacant ${vacantTitle.name}`}
                  />
                ))}
            </Box>
          </Grid>
        </Grid>
      </div>
    );
  };

  // Main component render
  return (
    <main>
      <Container
        maxWidth="md"
        style={{ marginTop: "50px", marginBottom: "20px" }}
      >
        <Typography
          variant="h2"
          align="center"
          color="textPrimary"
          gutterBottom
        >
          Create Event
        </Typography>

        {/* Event Name Input */}
        <FormControl fullWidth sx={{ marginBottom: "20px" }}>
          <TextField
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            placeholder="e.g., UFC 285"
          />
        </FormControl>

        {/* Event Date Input */}
        <FormControl fullWidth sx={{ marginBottom: "20px" }}>
          <TextField
            label="Event Date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
        </FormControl>

        {/* Number of Fights Selector */}
        <FormControl fullWidth sx={{ marginBottom: "20px" }}>
          <InputLabel id="num-fights-label">Number of Fights</InputLabel>
          <MuiSelect
            labelId="num-fights-label"
            value={numFights}
            label="Number of Fights"
            onChange={(e) => setNumFights(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>

        {/* Render Fight Cards */}
        {fights.map((fight, index) => renderFightCard(fight, index))}

        {/* Save Button */}
        <Grid container spacing={2} sx={{ justifyContent: "center" }}>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleSaveEvent}
              disabled={isSaving}
              sx={{
                backgroundColor: "rgba(33, 33, 33, 0.9)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(33, 33, 33, 0.7)",
                },
                minWidth: 100,
              }}
            >
              {isSaving ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save Event"
              )}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
};

export default CreateEvent;
