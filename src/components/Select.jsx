import React, { useState, useEffect } from "react";
import JsonData from "../fighters.json";

import {
  Box,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";

export default function BasicSelect() {
  const [fighter, setFighter] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Fetch the JSON data from the file
    fetch("/fighters.json")
      .then((response) => response.json())
      .then((jsonData) => setFighter(jsonData))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleChange = (event) => {
    const selectedId = Number(event.target.value);
    const selected = fighter?.find((x) => x.personid === selectedId);
    setSelectedItem(selected);
    console.log(selected);
  };

  return (
    <>
      <Box sx={{ minWidth: 120, m: 2 }} gutterBottom>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Fighter</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={fighter}
            label="Fighter"
            onChange={handleChange}
          >
            {JsonData
              ? JsonData.map((info) => (
                  <MenuItem key={info.personid} value={info.personid}>
                    {info.firstname} {info.lastname}
                  </MenuItem>
                ))
              : null}
          </Select>
        </FormControl>
      </Box>
      {selectedItem && (
        <div className="box" key={selectedItem.personid}>
          <Paper elevation={3}>
            <Card>
              <CardMedia
                component="img"
                height="280"
                image={selectedItem.image}
                alt="fighter 1"
              />
              <CardContent>
                <Typography variant="body2">
                  ID: {selectedItem.personid}
                </Typography>
                <Typography variant="body2">
                  Name: {selectedItem.firstname} {selectedItem.lastname}
                </Typography>
                <Typography variant="body2">
                  Nationality: {selectedItem.nationality}
                </Typography>
                <Typography variant="body2">
                  Record: {selectedItem.wins}W-{selectedItem.losses}L
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </div>
      )}
    </>
  );
}
