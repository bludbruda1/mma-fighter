import React from "react";
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

const BasicSelect = ({ fighters, selectedItem, onSelectChange }) => {
  return (
    <>
      <Box sx={{ minWidth: 120, m: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Fighter</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={selectedItem ? selectedItem.personid : ""}
            label="Fighter"
            onChange={onSelectChange}
          >
            {fighters.map((info) => (
              <MenuItem key={info.personid} value={info.personid}>
                {info.firstname} {info.lastname}
              </MenuItem>
            ))}
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
                alt="fighter"
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
};

export default BasicSelect;
