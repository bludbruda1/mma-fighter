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
} from "@mui/material";
import Select from "../components/Select";
import {
  getAllFighters,
  addEventToDB,
  getNextEventId,
} from "../utils/indexedDB";
import { EventContext } from "../contexts/EventContext";

const CreateEvent = () => {
  const { setEventIds } = useContext(EventContext);
  const [fighters, setFighters] = useState([]);
  const [numFights, setNumFights] = useState(1); // Number of fights to create
  const [fights, setFights] = useState(
    Array(1).fill({ fighter1: null, fighter2: null })
  ); // Initialize with 1 fight
  const [eventName, setEventName] =useState(""); //Add the event name
  const navigate = useNavigate();

  useEffect(() => {
    getAllFighters()
      .then((fetchedFighters) => {
        setFighters(fetchedFighters);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Update fights array when the number of fights changes
  useEffect(() => {
    setFights(Array(numFights).fill({ fighter1: null, fighter2: null }));
  }, [numFights]);

  const handleSaveEvent = async () => {
    try {
      // Validate event name
      if (!eventName.trim()) {
        console.log("Please enter an event name.");
        return;
      }

      const nextEventId = await getNextEventId();
      const eventId = String(nextEventId);

      // Format fights data to match events.json structure
      const formattedFights = fights.map(fight => ({
        fighter1: fight.fighter1 ? {
          personid: fight.fighter1.personid,
          firstname: fight.fighter1.firstname,
          lastname: fight.fighter1.lastname
        } : null,
        fighter2: fight.fighter2 ? {
          personid: fight.fighter2.personid,
          firstname: fight.fighter2.firstname,
          lastname: fight.fighter2.lastname
        } : null
      }));

      const eventData = {
        id: eventId,
        name: eventName,
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        fights: formattedFights
      };
      
      // Validate that all fights have both fighters selected
      if (formattedFights.every(fight => fight.fighter1 && fight.fighter2)) {
        await addEventToDB(eventData);
        console.log("Event saved successfully:", eventData);
        
        setEventIds(prevEventIds => [...prevEventIds, eventId]);
        navigate(`/event/${eventId}`);
      } else {
        console.log("Please select fighters for all fights.");
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // Handle fighter selection for a specific fight (fightIndex = 0 to numFights - 1)
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
    <>
      <main>
        <div>
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
            <FormControl fullWidth sx={{ marginBottom: "20px"}}>
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
                  sx={{
                    backgroundColor: "rgba(33, 33, 33, 0.9)",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "rgba(33, 33, 33, 0.7)",
                    },
                  }}
                >
                  Save Event
                </Button>
              </Grid>
            </Grid>
          </Container>
        </div>
      </main>
    </>
  );
};

export default CreateEvent;
