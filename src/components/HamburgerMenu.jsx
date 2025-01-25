import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  Button,
  Tooltip,
  Box,
} from "@mui/material";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import HandshakeIcon from '@mui/icons-material/Handshake';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { saveGameDate, getGameDate, getAllEvents, getAllFights, updateAllFighterStatuses } from "../utils/indexedDB";

// HamburgerMenu component that handles navigation on the left side of the page.
const HamburgerMenu = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [fights, setFights] = useState([]);
  const [isAdvanceDisabled, setIsAdvanceDisabled] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleQuitGame = () => {
    navigate('/');
  };

  // Helper function to format date for comparison
  const formatDateForComparison = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  // Check if an event exists for a given date and if all its fights are complete
  const checkCurrentDateEvent = React.useCallback((date, currentEvents, currentFights) => {
    const formattedDate = formatDateForComparison(date);
    const eventOnDate = currentEvents.find(event => 
      formatDateForComparison(event.date) === formattedDate
    );
  
    if (eventOnDate) {
      // Get all fight IDs from all cards
      const allFightIds = [
        ...(eventOnDate.fights.mainCard || []),
        ...(eventOnDate.fights.prelims || []),
        ...(eventOnDate.fights.earlyPrelims || [])
      ];
  
      // Check if all fights are complete
      const eventFights = currentFights.filter(fight => allFightIds.includes(fight.id));
      const allFightsComplete = eventFights.length > 0 && 
                               eventFights.every(fight => fight.result !== null);
  
      setIsAdvanceDisabled(!allFightsComplete);
  
      return {
        hasEvent: true,
        eventId: eventOnDate.id
      };
    }
  
    setIsAdvanceDisabled(false);
    return {
      hasEvent: false,
      eventId: null
    };
  }, []);

  // Function to refresh fights
  const refreshFightsData = React.useCallback(async () => {
    try {
      const fetchedFights = await getAllFights(gameId);
      setFights(fetchedFights);
      // Recheck current date event with new fights data
      checkCurrentDateEvent(currentDate, events, fetchedFights);
    } catch (error) {
      console.error("Error refreshing fights data:", error);
    }
  }, [currentDate, events, checkCurrentDateEvent, gameId]);

  // Load initial data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load game date, events, and fights
        const [date, fetchedEvents, fetchedFights] = await Promise.all([
          getGameDate(gameId),
          getAllEvents(gameId),
          getAllFights(gameId)
        ]);
        
        setCurrentDate(new Date(date));
        setEvents(fetchedEvents);
        setFights(fetchedFights);
        
        // Check if current date has event with incomplete fights
        checkCurrentDateEvent(new Date(date), fetchedEvents, fetchedFights);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, [checkCurrentDateEvent]);

  // Need to update this function so that it is implemented in a smarter way but for now is ok
  useEffect(() => {
    let interval;
    if (isAdvanceDisabled) {
      interval = setInterval(refreshFightsData, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAdvanceDisabled, refreshFightsData]);

  // Handle advancing the date
  const handleAdvanceDate = async () => {
    try {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
  
      // Save new date
      await saveGameDate(newDate.toISOString(), gameId);
      
      // Update fighter statuses
      const updatedFighters = await updateAllFighterStatuses(gameId);
      if (updatedFighters.length > 0) {
        console.log(`Updated status for ${updatedFighters.length} fighters`);
      }
  
      // Check if there's an event on the new date
      const { hasEvent, eventId } = checkCurrentDateEvent(newDate, events, fights);
  
      if (hasEvent) {
        // Navigate to event page
        navigate(`/event/${eventId}`);
      }
  
      setCurrentDate(newDate);
  
    } catch (error) {
      console.error("Error advancing date:", error);
    }
  };

  // Get tooltip message based on current state
  const getTooltipMessage = () => {
    const formattedDate = formatDateForComparison(currentDate);
    const eventOnDate = events.find(event => 
      formatDateForComparison(event.date) === formattedDate
    );

    if (eventOnDate) {
      return "Complete all fights in the current event to advance";
    }
    return "Advance to next day";
  };

  return (
    <>
      <CssBaseline />
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "#fff",
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
          <Typography variant="body1" sx={{ mr: 2 }}>
            {currentDate.toLocaleDateString()}
          </Typography>
          <Tooltip title={getTooltipMessage()}>
            <span>
              <Button
                variant="contained"
                onClick={handleAdvanceDate}
                disabled={isAdvanceDisabled}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(128, 128, 128, 0.1)",
                    color: "rgba(255, 255, 255, 0.3)",
                  }
                }}
              >
                Advance
              </Button>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "#fff",
          },
        }}
      >
        <List>
          <ListItem button component={Link} to="" onClick={handleDrawerToggle}>
            <ListItemIcon sx={{ color: "#fff" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" sx={{ color: "#fff" }} />
          </ListItem>
          <Divider sx={{ backgroundColor: "#444" }} />
          <ListItem
            button
            component={Link}
            to="roster"
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
            to="createevent"
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
            to="fight"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon sx={{ color: "#fff" }}>
              <EventSeatIcon />
            </ListItemIcon>
            <ListItemText primary="Fight Screen" sx={{ color: "#fff" }} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="events"
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
            to="calendar"
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
            to="championships"
            onClick={handleDrawerToggle}
            >
            <ListItemIcon sx={{ color: "#fff" }}>
              <EmojiEventsIcon />
            </ListItemIcon>
            <ListItemText primary="Champions" sx={{ color: '#fff'}} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="rankings"
            onClick={handleDrawerToggle}
            >
            <ListItemIcon sx={{ color: "#fff" }}>
              <EmojiEventsIcon />
            </ListItemIcon>
            <ListItemText primary="Rankings" sx={{ color: '#fff'}} />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="contracts"
            onClick={handleDrawerToggle}
            >
            <ListItemIcon sx={{ color: "#fff" }}>
              <HandshakeIcon />
            </ListItemIcon>
            <ListItemText primary="Contracts" sx={{ color: '#fff'}} />
          </ListItem>
          <ListItem button onClick={handleQuitGame}>
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Quit Game" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;