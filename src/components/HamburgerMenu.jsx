import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import { getGameDate } from "../utils/indexedDB";

const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const [gameDate, setGameDate] = useState("");

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  useEffect(() => {
    // Fetch the game date from IndexedDB
    const fetchGameDate = async () => {
      try {
        const date = await getGameDate();
        setGameDate(date);
      } catch (error) {
        console.error("Error fetching game date:", error);
      }
    };
    fetchGameDate();
  }, []);

  return (
    <>
      <CssBaseline />
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark background with transparency
          color: "#fff", // White text color for contrast
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <SportsMmaIcon sx={{ mr: 2 }} />
          <Link to={`/`} style={{ textDecoration: "none", color: "#fff" }}>
            <Typography variant="h6">Planet Fighter</Typography>
          </Link>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {gameDate ? formatDate(gameDate) : "Loading..."}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "rgba(0, 0, 0, 0.9)", // Dark background with transparency
            color: "#fff", // White text color for contrast
          },
        }}
      >
        <List>
          <ListItem button component={Link} to="/" onClick={handleDrawerToggle}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" sx={{ color: "#fff" }} />
          </ListItem>
          <Divider sx={{ backgroundColor: "#444" }} /> {/* Dark divider */}
          <ListItem
            button
            component={Link}
            to="/roster"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Roster" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/createevent"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <EditCalendarIcon />
            </ListItemIcon>
            <ListItemText primary="Create Event" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/events"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <EventSeatIcon />
            </ListItemIcon>
            <ListItemText primary="Events" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/calendar"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <CalendarTodayIcon />
            </ListItemIcon>
            <ListItemText primary="Calendar" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/championships"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <EmojiEventsIcon />
            </ListItemIcon>
            <ListItemText primary="Champions" sx={{ color: "#fff" }} />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
