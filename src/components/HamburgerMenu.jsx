// HamburgerMenu.jsx
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

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <SportsMmaIcon />
          <Typography variant="h6">MMA Fighter</Typography>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={handleDrawerToggle}>
        <List>
          <ListItem button component={Link} to="/" onClick={handleDrawerToggle}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <Divider />
          <ListItem
            button
            component={Link}
            to="/roster"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Roster" />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/fight"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Fight Screen" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
