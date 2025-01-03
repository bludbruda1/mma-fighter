import React from "react";
import { Link } from "react-router-dom";
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
  Chip,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import { formatFightingStyle } from "../utils/uiHelpers";

/* BasicSelect component that passes a fighters, selectedItem, and onSelectChange prop 
so that when we call this component we can dynamically add the info instead of the value being fixed at the component level. **/
const BasicSelect = ({
  fighters,
  selectedItem,
  onSelectChange,
  bookedFighters = new Set(),
  selectedFightersInEvent = new Set(),
  currentFightIndex,
  fightPosition,
}) => {
  return (
    <>
      <Box sx={{ minWidth: 120, m: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="simple-select-label">Fighter</InputLabel>
          <Select
            labelId="simple-select-label"
            id="simple-select"
            value={selectedItem ? selectedItem.personid : ""}
            label="Fighter"
            onChange={onSelectChange}
          >
            {fighters.map((info) => {
              // Determine if fighter is unavailable
              const isBooked = bookedFighters.has(info.personid);
              const isSelectedInOtherFight =
                selectedFightersInEvent.has(info.personid) &&
                (!selectedItem || selectedItem.personid !== info.personid);
              const isUnavailable = isBooked || isSelectedInOtherFight;

              // Enhanced MenuItem with profile picture and more fighter details
              return (
                <MenuItem
                  key={info.personid}
                  value={info.personid}
                  disabled={isUnavailable}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1, // Add padding for better spacing
                  }}
                >
                  {/* Fighter info section with profile picture */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={info.profile || info.image}
                        alt={`${info.firstname} ${info.lastname}`}
                        sx={{ width: 40, height: 40 }}
                      />
                    </ListItemAvatar>
                    <Box>
                      <Typography variant="body1">
                        {info.firstname} {info.lastname}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {info.weightClass} • {info.wins}W-{info.losses}L
                      </Typography>
                    </Box>
                  </Box>

                  {/* Status chips section */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {info.ranking && (
                      <Chip
                        label={`#${info.ranking}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {isUnavailable && (
                      <Chip
                        label={isBooked ? "Booked" : "Selected"}
                        size="small"
                        color={isBooked ? "error" : "warning"}
                      />
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {selectedItem && (
        <div className="box" key={selectedItem.personid}>
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
                image={selectedItem.image}
                alt={`${selectedItem.firstname} ${selectedItem.lastname}`}
              />
              <CardContent>
                <Typography variant="body2">
                  Name:{" "}
                  <Link
                    to={`/Dashboard/${selectedItem.personid}`}
                    style={{
                      textDecoration: "none",
                      color: "#0000EE",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                    onClick={() => {
                      window.scrollTo(0, 0);
                    }}
                  >
                    {selectedItem.firstname} {selectedItem.lastname}
                  </Link>
                </Typography>
                <Typography variant="body2">
                  Nationality: {selectedItem.nationality}
                </Typography>
                <Typography variant="body2">
                  Record: {selectedItem.wins}W-{selectedItem.losses}L
                </Typography>
                <Typography variant="body2">
                  Fighting Style:{" "}
                  {formatFightingStyle(selectedItem.fightingStyle)}
                </Typography>
                <Typography variant="body2">
                  Rank: {selectedItem.ranking ?? "Unranked"}
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
