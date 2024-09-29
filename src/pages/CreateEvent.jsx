import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, Container, Grid, Typography } from "@mui/material";
import Select from "../components/Select";
import {
  getAllFighters,
  addEventToDB,
  getNextEventId,
} from "../utils/indexedDB";

const CreateEvent = () => {
  const [fighters, setFighters] = useState([]);
  const [fights, setFights] = useState(
    Array(5).fill({ fighter1: null, fighter2: null })
  ); // Initialize an array of 5 fights
  const navigate = useNavigate();

  useEffect(() => {
    getAllFighters()
      .then((fetchedFighters) => {
        setFighters(fetchedFighters);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleSaveEvent = async () => {
    try {
      // Get the next event ID by incrementing the highest existing ID
      const nextEventId = await getNextEventId();
      const eventId = String(nextEventId); // Convert the nextEventId to a string

      // Structure the event data to be saved
      const eventData = {
        id: eventId, // Use the incremented ID
        fights,
        date: new Date(),
      };

      if (fights.every((fight) => fight.fighter1 && fight.fighter2)) {
        // Save the event data to IndexedDB
        await addEventToDB(eventData); // Wait for the event to be added
        await new Promise((resolve) => setTimeout(resolve, 500)); // Add delay

        console.log("Event saved successfully:", eventData); // Debugging

        // Redirect to the event's route, passing the event ID
        navigate(`/event/${eventId}`);
      } else {
        console.log("Please select fighters for all fights.");
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  // Handle fighter selection for a specific fight (fightIndex = 0 to 4)
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
                  onClick={handleSaveEvent} // Save all fights
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
