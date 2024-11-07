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
} from "@mui/material";
import Select from "../components/Select";
import {
  getAllFighters,
  addEventToDB,
  getNextEventId,
  getNextFightId,
  addFightToDB
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
  const navigate = useNavigate();

  useEffect(() => {
    getAllFighters()
      .then((fetchedFighters) => {
        setFighters(fetchedFighters);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    // Create an array of unique fight objects
    setFights(Array(numFights).fill(null).map(() => ({ 
      fighter1: null, 
      fighter2: null 
    })));
  }, [numFights]);

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

  const handleSelectChange = (fightIndex, fighterKey, event) => {
    const selectedId = Number(event.target.value);
    const selectedFighter = fighters.find((f) => f.personid === selectedId);
    
    if (!selectedFighter) {
      console.error('Fighter not found:', selectedId);
      return;
    }
  
    setFights(prevFights => prevFights.map((fight, index) => 
      index === fightIndex 
        ? { ...fight, [fighterKey]: selectedFighter }
        : fight
    ));
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
              <Grid item xs={12} md={5}>
                <Select
                  fighters={fighters}
                  selectedItem={fight.fighter1}
                  onSelectChange={(event) =>
                    handleSelectChange(index, "fighter1", event)
                  }
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Select
                  fighters={fighters}
                  selectedItem={fight.fighter2}
                  onSelectChange={(event) =>
                    handleSelectChange(index, "fighter2", event)
                  }
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