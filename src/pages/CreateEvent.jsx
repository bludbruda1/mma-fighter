import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import Select from "../components/Select";
import {
  getAllFighters,
  addEventToDB,
  getNextEventId,
  getNextFightId,
  addFightToDB,
  getAllEvents,
  getAllFights
} from "../utils/indexedDB";
import { EventContext } from "../contexts/EventContext";

const CreateEvent = () => {
  const { setEventIds } = useContext(EventContext);
  const [fighters, setFighters] = useState([]);
  const [numFights, setNumFights] = useState(1);
  const [fights, setFights] = useState(
    Array(1).fill({ fighter1: null, fighter2: null })
  );
  const [eventName, setEventName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Track booked fighters across events and within current event
  const [bookedFighters, setBookedFighters] = useState(new Set());
  const [selectedFightersInEvent, setSelectedFightersInEvent] = useState(new Set());
  
  // Track error messages for fighter selection
  const [selectionErrors, setSelectionErrors] = useState({});
    
  const navigate = useNavigate();

  // Load fighters and check existing bookings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch fighters, events, and fights
        const [fetchedFighters, allEvents, allFights] = await Promise.all([
          getAllFighters(),
          getAllEvents(),
          getAllFights()
        ]);

        // Create set of booked fighter IDs from existing events
        const bookedFighterIds = new Set();
        allFights.forEach(fight => {
          if (!fight.result) { // Only consider unfinished fights
            if (fight.fighter1?.personid) bookedFighterIds.add(fight.fighter1.personid);
            if (fight.fighter2?.personid) bookedFighterIds.add(fight.fighter2.personid);
          }
        });

        setFighters(fetchedFighters);
        setBookedFighters(bookedFighterIds);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setFights(Array(numFights).fill(null).map(() => ({ 
      fighter1: null, 
      fighter2: null 
    })));
  }, [numFights]);

  // Check if a fighter is available for selection
  const isFighterAvailable = (fighterId, fightIndex, fighterPosition) => {
    // Check if fighter is already booked in another event
    if (bookedFighters.has(fighterId)) {
      return {
        available: false,
        error: "Fighter is already booked in another event"
      };
    }

    // Check if fighter is already selected in current event
    if (selectedFightersInEvent.has(fighterId)) {
      return {
        available: false,
        error: "Fighter is already scheduled in this event"
      };
    }

    return { available: true };
  };

  const handleSelectChange = (fightIndex, fighterKey, event) => {
    const selectedId = Number(event.target.value);
    const selectedFighter = fighters.find((f) => f.personid === selectedId);
    
    if (!selectedFighter) {
      console.error('Fighter not found:', selectedId);
      return;
    }

    // Check fighter availability
    const { available, error } = isFighterAvailable(selectedId, fightIndex, fighterKey);
    
    if (!available) {
      // Update error state
      setSelectionErrors({
        ...selectionErrors,
        [`${fightIndex}-${fighterKey}`]: error
      });
      return;
    }

    // Clear any existing error for this selection
    const newErrors = { ...selectionErrors };
    delete newErrors[`${fightIndex}-${fighterKey}`];
    setSelectionErrors(newErrors);

    // Update fights state
    setFights(prevFights => {
      const newFights = [...prevFights];
      
      // Remove previous fighter from selectedFightersInEvent if exists
      if (newFights[fightIndex]?.[fighterKey]?.personid) {
        const newSelected = new Set(selectedFightersInEvent);
        newSelected.delete(newFights[fightIndex][fighterKey].personid);
        setSelectedFightersInEvent(newSelected);
      }

      // Add new fighter
      newFights[fightIndex] = {
        ...newFights[fightIndex],
        [fighterKey]: selectedFighter
      };

      // Add new fighter to selectedFightersInEvent
      setSelectedFightersInEvent(prev => new Set([...prev, selectedId]));
      
      return newFights;
    });
  };

const handleSaveEvent = async () => {
  try {
    if (!eventName.trim()) {
      console.log("Please enter an event name.");
      return;
    }

    setIsSaving(true);

    // Validate that all fights have both fighters selected
    const invalidFights = fights.some(
      fight => !fight.fighter1 || !fight.fighter2
    );

    if (invalidFights) {
      console.log("Please select fighters for all fights");
      setIsSaving(false);
      return;
    }

    // Create all fights sequentially and collect their IDs
    const fightIds = [];
    for (const fight of fights) {
      const nextFightId = await getNextFightId();
      const fightData = {
        id: nextFightId,
        fighter1: {
          personid: fight.fighter1.personid,
          firstname: fight.fighter1.firstname,
          lastname: fight.fighter1.lastname
        },
        fighter2: {
          personid: fight.fighter2.personid,
          firstname: fight.fighter2.firstname,
          lastname: fight.fighter2.lastname
        },
        result: null,
        stats: null
      };

      // Store each fight individually
      await addFightToDB(fightData);
      fightIds.push(nextFightId);
    }

    // Create the event only after all fights are successfully stored
    const nextEventId = await getNextEventId();
    const eventData = {
      id: nextEventId,
      name: eventName,
      date: new Date().toISOString().split('T')[0],
      fights: fightIds
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

  return (
    <main>
      <Container maxWidth="md" style={{ marginTop: "50px", marginBottom: "20px" }}>
        <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
          Create Event
        </Typography>

        <FormControl fullWidth sx={{ marginBottom: "20px" }}>
          <TextField
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            placeholder="e.g., UFC 285"
          />
        </FormControl>

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

        {fights.map((fight, index) => (
          <div key={index} style={{ marginBottom: "30px" }}>
            <Typography variant="h5" align="center" gutterBottom>
              Fight {index + 1}
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
                  selectedFightersInEvent={new Set(
                    // Create set of fighter IDs selected in other fights
                    fights
                      .filter((_, fightIndex) => fightIndex !== index) // Exclude current fight
                      .flatMap(f => [
                        f.fighter1?.personid,
                        f.fighter2?.personid
                      ])
                      .filter(Boolean) // Remove nulls/undefined
                  )}
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
                  selectedFightersInEvent={new Set(
                    fights
                      .filter((_, fightIndex) => fightIndex !== index)
                      .flatMap(f => [
                        f.fighter1?.personid,
                        f.fighter2?.personid
                      ])
                      .filter(Boolean)
                  )}
                  currentFightIndex={index}
                  fightPosition="fighter2"
                />
              </Grid>
            </Grid>
          </div>
        ))}

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