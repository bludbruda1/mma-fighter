import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventFromDB } from "../utils/indexedDB"; // Import your function to get event data
import { Container, Grid, Typography } from "@mui/material";
import FightCard from "../components/FightCard";
import { formatFightingStyle } from "../utils/uiHelpers";

const Event = () => {
  const { eventId } = useParams(); // Get event ID from route params
  const [eventData, setEventData] = useState(null);

  // Fetch the event data from IndexedDB when the component loads
  useEffect(() => {
    const fetchEventData = async () => {
      console.log("Fetching event with ID:", String(eventId)); // Ensure ID is in the correct format
      const data = await getEventFromDB(String(eventId)); // Convert eventId to string if necessary
      console.log("Event data fetched:", data); // Debugging
      setEventData(data);
    };

    fetchEventData();
  }, [eventId]);

  // Check if event data or fights are available
  if (!eventData || !eventData.fights || eventData.fights.length === 0) {
    console.log("Event data is empty or fights are not available.");
    return <div>No event data available.</div>;
  }

  const { fights } = eventData;

  return (
    <Container
      maxWidth="md"
      style={{ marginTop: "50px", marginBottom: "20px" }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Main Card
      </Typography>
      {fights.map((fight, index) => {
        const { fighter1, fighter2 } = fight;
        return (
          <Grid
            container
            spacing={3}
            key={index}
            style={{ marginBottom: "40px" }}
          >
            {/* Fighter 1 Card */}
            <Grid item xs={12}>
              <FightCard
                selectedItem1={{
                  ...fighter1,
                  fightingStyle: formatFightingStyle(fighter1.fightingStyle),
                }}
                selectedItem2={{
                  ...fighter2,
                  fightingStyle: formatFightingStyle(fighter2.fightingStyle),
                }}
                winnerIndex={fight.winnerIndex} // Assuming you have a winnerIndex in fight data
              />
            </Grid>
          </Grid>
        );
      })}
    </Container>
  );
};

export default Event;
