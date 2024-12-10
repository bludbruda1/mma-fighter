import React, { useState } from "react";
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
} from "@mui/material";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";

// HamburgerMenu component that handles navigation on the left side of the page.
const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

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
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Create Event" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/fight"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Fight Screen" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/events"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <PeopleIcon />
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
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Calendar" sx={{ color: "#fff" }} />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
