import React from "react";
import { Card, CardContent, CardMedia, Paper, Typography } from "@mui/material";
import JsonData from "../fighters.json";

// FighterCard component used to display the fighter image, name, record and nationality.
export default function FighterCard() {
  return (
    // JsonData.map loops through the fighters.json file and display the fighter info on the card.
    <div>
      {JsonData &&
        JsonData.map((info) => {
          return (
            <div className="box" key={info.personid}>
              <Paper elevation={3}>
                <Card>
                  <CardMedia
                    component="img"
                    height="280"
                    image={info.image}
                    alt="fighter 1"
                  />
                  <CardContent>
                    <Typography variant="body2">ID: {info.personid}</Typography>
                    <Typography variant="body2">
                      Name: {info.firstname} {info.lastname}
                    </Typography>
                    <Typography variant="body2">
                      Nationality: {info.nationality}
                    </Typography>
                    <Typography variant="body2">
                      Record: {info.wins}W-{info.losses}L
                    </Typography>
                  </CardContent>
                </Card>
              </Paper>
            </div>
          );
        })}
    </div>
  );
}
