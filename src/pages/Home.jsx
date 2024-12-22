import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircularProgress,
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Paper,
  Tooltip,
  Zoom,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { resetDB } from "../utils/indexedDB";
import { getAllFights, getAllChampionships, getAllEvents } from "../utils/indexedDB";

// Enhanced fade-in animation with staggered delays
const fadeInWithDelay = (delay) => ({
  opacity: 0,
  animation: `fadeIn 1.5s ease-out ${delay}s forwards`,
  "@keyframes fadeIn": {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' }
  },
});

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalFights: 0,
    upcomingEvents: 0,
    champions: []
  });

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [fights, championships, events] = await Promise.all([
          getAllFights(),
          getAllChampionships(),
          getAllEvents()
        ]);

        const currentDate = new Date();
        const upcoming = events.filter(event => new Date(event.date) > currentDate);
        const currentChamps = championships.filter(c => c.currentChampionId);

        setStats({
          totalFights: fights.length,
          upcomingEvents: upcoming.length,
          champions: currentChamps
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Navigation handlers
  const handleViewRoster = () => navigate("/roster");
  const handleCreateEvent = () => navigate("/createevent");
  const handleViewEvents = () => navigate("/events");
  const handleViewChampionships = () => navigate("/championships");
  
  const handleResetGame = async () => {
    setLoading(true);
    try {
      await resetDB();
      window.location.reload();
    } catch (error) {
      console.error("Error resetting game", error);
    } finally {
      setLoading(false);
    }
  };

  // Quick stats component
  const QuickStats = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h6" color="text.primary">
              Total Fights
            </Typography>
            <Typography variant="h4" color="text.primary">
              {stats.totalFights}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CalendarTodayIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h6" color="text.primary">
              Upcoming Events
            </Typography>
            <Typography variant="h4" color="text.primary">
              {stats.upcomingEvents}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <EmojiEventsIcon sx={{ fontSize: 40, color: 'gold' }} />
            <Typography variant="h6" color="text.primary">
              Active Champions
            </Typography>
            <Typography variant="h4" color="text.primary">
              {stats.champions.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box
      sx={{
        position: "relative",
        backgroundImage: `url('/assets/images/background.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed", // Parallax effect
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#ffffff",
        textAlign: "center",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      {/* Dim overlay with slightly reduced opacity */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 1,
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        {/* Logo */}
        <Box sx={{ ...fadeInWithDelay(0), marginBottom: 4 }}>
          <img
            src="/assets/images/logo.png"
            alt="Logo"
            style={{
              width: "200px",
              height: "auto",
              filter: "drop-shadow(0 0 10px rgba(0,0,0,0.5))"
            }}
          />
        </Box>

        {/* Title and Description */}
        <Typography variant="h2" gutterBottom sx={fadeInWithDelay(0.2)}>
          Planet Fighter
        </Typography>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{
            ...fadeInWithDelay(0.4),
            maxWidth: "800px",
            margin: "0 auto 40px auto"
          }}
        >
          Welcome to Planet Fight, a combat sport simulation game that lets you
          create your own world of fighting and provides an experience of
          running the show.
        </Typography>

        {/* Quick Stats Section */}
        <Box sx={fadeInWithDelay(0.6)}>
          <QuickStats />
        </Box>

        {/* Action Buttons */}
        <Grid
          container
          spacing={2}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            mb: 4
          }}
        >
          {/* Main Action Buttons */}
          <Grid item>
            <Tooltip title="View all fighters" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained"
                onClick={handleViewRoster}
                sx={{
                  ...fadeInWithDelay(0.8),
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: "#000",
                  padding: "10px 20px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                  },
                }}
                startIcon={<GroupIcon />}
              >
                View Roster
              </Button>
            </Tooltip>
          </Grid>

          <Grid item>
            <Tooltip title="Create a new event" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained"
                onClick={handleCreateEvent}
                sx={{
                  ...fadeInWithDelay(1),
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: "#000",
                  padding: "10px 20px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                  },
                }}
                startIcon={<CalendarTodayIcon />}
              >
                Create Event
              </Button>
            </Tooltip>
          </Grid>

          <Grid item>
            <Tooltip title="View all events" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained"
                onClick={handleViewEvents}
                sx={{
                  ...fadeInWithDelay(1.2),
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: "#000",
                  padding: "10px 20px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                  },
                }}
                startIcon={<SearchIcon />}
              >
                View Events
              </Button>
            </Tooltip>
          </Grid>

          <Grid item>
            <Tooltip title="View championship belts" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained"
                onClick={handleViewChampionships}
                sx={{
                  ...fadeInWithDelay(1.3),
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: "#000",
                  padding: "10px 20px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                  },
                }}
                startIcon={<LocalFireDepartmentIcon />}
              >
                View Championships
              </Button>
            </Tooltip>
          </Grid>

          {/* Reset Game Button */}
          <Grid item>
            <Tooltip title="Reset game data" arrow TransitionComponent={Zoom}>
              <Button
                variant="contained"
                onClick={handleResetGame}
                sx={{
                  ...fadeInWithDelay(1.4),
                  backgroundColor: "rgba(255, 0, 0, 0.8)",
                  color: "#fff",
                  padding: "10px 20px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 0, 0, 0.9)",
                    transform: "translateY(-2px)",
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(255, 0, 0, 0.3)",
                    color: "#fff",
                  },
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Reset Game"
                )}
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;