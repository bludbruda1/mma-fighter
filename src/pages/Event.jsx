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
              {/* <Paper elevation={3}>
                <Card>
                  <CardMedia
                    component="img"
                    sx={{
                      height: 280,
                      width: "100%",
                      objectFit: "contain",
                      bgcolor: "grey.200",
                    }}
                    image={fighter1.image || "defaultImage.jpg"} // Use a default image if none is provided
                    alt={`${fighter1.firstname} ${fighter1.lastname}`}
                  />
                  <CardContent>
                    <Typography variant="body2">
                      Name: {fighter1.firstname} {fighter1.lastname}
                    </Typography>
                    <Typography variant="body2">
                      Nationality: {fighter1.nationality}
                    </Typography>
                    <Typography variant="body2">
                      Record: {fighter1.wins}W-{fighter1.losses}L
                    </Typography>
                    <Typography variant="body2">
                      Fighting Style:{" "}
                      {formatFightingStyle(fighter1.fightingStyle)}
                    </Typography>
                  </CardContent>
                </Card>
              </Paper> */}
            </Grid>
            {/* Fighter 2 Card */}
            {/* <Grid item xs={12} md={5}>
              <Paper elevation={3}>
                <Card>
                  <CardMedia
                    component="img"
                    sx={{
                      height: 280,
                      width: "100%",
                      objectFit: "contain",
                      bgcolor: "grey.200",
                    }}
                    image={fighter2.image || "defaultImage.jpg"} // Use a default image if none is provided
                    alt={`${fighter2.firstname} ${fighter2.lastname}`}
                  />
                  <CardContent>
                    <Typography variant="body2">
                      Name: {fighter2.firstname} {fighter2.lastname}
                    </Typography>
                    <Typography variant="body2">
                      Nationality: {fighter2.nationality}
                    </Typography>
                    <Typography variant="body2">
                      Record: {fighter2.wins}W-{fighter2.losses}L
                    </Typography>
                    <Typography variant="body2">
                      Fighting Style:{" "}
                      {formatFightingStyle(fighter2.fightingStyle)}
                    </Typography>
                  </CardContent>
                </Card>
              </Paper>
            </Grid> */}
          </Grid>
        );
      })}
    </Container>
  );
};

export default Event;
