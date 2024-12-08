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
} from "../utils/indexedDB";
import { EventContext } from "../contexts/EventContext";

const CreateEvent = () => {
  const { setEventIds } = useContext(EventContext);
  const navigate = useNavigate();

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

  // Load fighters and check existing bookings
  useEffect(() => {
    getAllFighters()
      .then((fetchedFighters) => setFighters(fetchedFighters))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    setFights(Array(numFights).fill({ fighter1: null, fighter2: null }));
  }, [numFights]);

  const handleSaveEvent = async () => {
    if (!eventName.trim()) {
      console.log("Please enter an event name.");
      return;
    }

    setIsSaving(true);
    try {
      const fightIds = await Promise.all(
        fights.map(async (fight) => {
          if (!fight.fighter1 || !fight.fighter2) return null;

          // Get and ensure fight ID is an integer
          let nextFightId = await getNextFightId();
          nextFightId = parseInt(nextFightId, 10); // Ensure integer format
          if (isNaN(nextFightId)) {
            console.error("Invalid fight ID:", nextFightId);
            throw new Error("Fight ID must be an integer");
          }

          const fightData = {
            id: nextFightId, // Store as integer
            fighter1: { ...fight.fighter1 },
            fighter2: { ...fight.fighter2 },
            result: null,
            stats: null,
          };

          await addFightToDB(fightData);
          return fightData.id;
        })
      );

      const validFightIds = fightIds.filter((id) => id !== null);
      if (validFightIds.length === 0) {
        console.log("Please select fighters for all fights.");
        return;
      }

      // Ensure event ID is an integer
      let nextEventId = await getNextEventId();
      nextEventId = parseInt(nextEventId, 10);
      if (isNaN(nextEventId)) {
        console.error("Invalid event ID:", nextEventId);
        throw new Error("Event ID must be an integer");
      }

      const utcDate = new Date(selectedDate);
      utcDate.setMinutes(utcDate.getMinutes() + utcDate.getTimezoneOffset());
      const formattedDate = utcDate.toISOString().split("T")[0];

      const eventData = {
        id: nextEventId, // Store as integer
        name: eventName,
        date: formattedDate,
        fights: validFightIds,
      };

      await addEventToDB(eventData);
      console.log("Event saved successfully:", eventData);
      setEventIds((prevEventIds) => [...prevEventIds, eventData.id]);
      navigate(`/event/${eventData.id}`);
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
    navigate("/calendar");
  };

  const handleSelectChange = (fightIndex, fighterKey, event) => {
    const selectedId = Number(event.target.value);
    const selectedFighter = fighters.find((x) => x.personid === selectedId);
    setFights((prevFights) => {
      const updatedFights = [...prevFights];
      updatedFights[fightIndex] = {
        ...updatedFights[fightIndex],
        [fighterKey]: selectedFighter,
      };
      return updatedFights;
    });
  };

  return (
    <main>
      <Container maxWidth="md" sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography
          variant="h2"
          align="center"
          color="textPrimary"
          gutterBottom
        >
          Create Event
        </Typography>

        {/* Event Details Section */}
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <TextField
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            placeholder="e.g., UFC 285"
          />
        </FormControl>

        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <TextField
            label="Event Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{
              shrink: true, // Keeps the label up when the date is selected
            }}
          />
        </FormControl>

        <FormControl fullWidth sx={{ marginBottom: 2 }}>
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

        {/* Fights Selection Section */}
        {fights.map((fight, index) => (
          <div key={index} style={{ marginBottom: 24 }}>
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

        {/* Save Button */}
        <Grid container spacing={2} justifyContent="center">
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
