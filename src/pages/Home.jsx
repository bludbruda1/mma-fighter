import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Chip,
} from "@mui/material";
import { getAllEvents, getGameDate } from "../utils/indexedDB";
import EventIcon from '@mui/icons-material/Event';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArticleIcon from '@mui/icons-material/Article';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';

const Home = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  // State for events and game date
  const [gameDate, setGameDate] = useState(new Date());
  const [eventsList, setEventsList] = useState([]);

  // Effect to fetch events data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [currentGameDate, events] = await Promise.all([
          getGameDate(gameId),
          getAllEvents(gameId)
        ]);
        
        const gameDateTime = new Date(currentGameDate);
        
        // Sort events by date
        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Split into past and upcoming based on game date
        const pastEvents = sortedEvents
          .filter(event => new Date(event.date) < gameDateTime)
          .slice(-2); // Get last 2 past events
          
        const upcomingEvents = sortedEvents
          .filter(event => new Date(event.date) >= gameDateTime);
        
        setGameDate(gameDateTime);
        setEventsList([...pastEvents, ...upcomingEvents]);
        
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents();
  }, [gameId]);

  // Helper function to format relative time (unchanged)
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'just now';
    }
  };

  // Mock data for dashboard components
  const mockEmails = [
    {
      id: 1,
      sender: "UFC Management",
      subject: "Main Event Update",
      preview: "Changes to the upcoming main event...",
      timestamp: new Date('2025-01-10T10:30:00'),
      unread: true,
    },
    {
      id: 2,
      sender: "Fight Commission",
      subject: "Rule Changes Notice",
      preview: "Important updates to fighting regulations...",
      timestamp: new Date('2025-01-09T15:45:00'),
      unread: false,
    },
    {
      id: 3,
      sender: "Medical Team",
      subject: "Fighter Clearances",
      preview: "Medical clearance updates for next event...",
      timestamp: new Date('2025-01-08T09:15:00'),
      unread: true,
    },
  ];

  const mockNews = [
    {
      id: 1,
      title: "New Weight Class Added",
      preview: "UFC announces new weight division...",
      timestamp: new Date('2025-01-11T14:20:00'),
    },
    {
      id: 2,
      title: "Championship Bout Announcement",
      preview: "Highly anticipated title fight set for...",
      timestamp: new Date('2025-01-10T11:00:00'),
    },
  ];

  const mockNotifications = [
    {
      id: 1,
      message: "Fighter registration deadline approaching",
      type: "warning",
      timestamp: new Date('2025-01-11T16:45:00'),
    },
    {
      id: 2,
      message: "New fight contracts ready for review",
      type: "info",
      timestamp: new Date('2025-01-11T09:30:00'),
    },
  ];

  // Custom styled components
  const DashboardCard = ({ children, ...props }) => (
    <Card
      {...props}
      sx={{
        height: '100%',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {children}
    </Card>
  );

  const ActionButton = ({ startIcon, children, ...props }) => (
    <Button
      variant="contained"
      startIcon={startIcon}
      sx={{
        backgroundColor: "rgba(33, 33, 33, 0.9)",
        color: "#fff",
        padding: '10px 20px',
        borderRadius: 2,
        textTransform: 'none',
        fontSize: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          backgroundColor: "rgba(33, 33, 33, 0.8)",
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        },
      }}
      {...props}
    >
      {children}
    </Button>
  );

    // Navigation handlers remain unchanged
    const handleViewRoster = () => navigate(`/game/${gameId}/roster`);
    const handleCreateEvent = () => navigate(`/game/${gameId}/createevent`);


    // Dashboard card render functions with enhanced styling
    const renderEmailCard = () => (
      <DashboardCard>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              <Typography variant="h6" component="span">Recent Messages</Typography>
            </Box>
          }
          action={
            <Tooltip title="More options">
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <List>
            {mockEmails.map((email) => (
              <React.Fragment key={email.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        bgcolor: email.unread ? 'primary.main' : 'grey.400',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <EmailIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="body1"
                        fontWeight={email.unread ? 'bold' : 'normal'}
                      >
                        {email.subject}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography component="span" variant="body2" color="text.primary">
                          {email.sender}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          component="span"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatRelativeTime(email.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" sx={{ my: 1 }} />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </DashboardCard>
    );

    const renderEventsCard = () => (
      <DashboardCard>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="primary" />
              <Typography variant="h6" component="span">Events</Typography>
            </Box>
          }
          action={
            <Button 
              size="small" 
              component={Link}
              to={`/game/${gameId}/events`}
              sx={{ 
                textTransform: 'none',
                fontWeight: 'medium',
              }}
            >
              View All
            </Button>
          }
        />
        <CardContent>
          <List sx={{ 
            maxHeight: 400, 
            overflow: 'auto',
            '& .MuiListItem-root': {
              borderRadius: 1,
              mb: 1,
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }
          }}>
            {eventsList.map((event) => {
              const eventDate = new Date(event.date);
              const isPastEvent = eventDate < gameDate;
              
              return (
                <ListItem 
                  key={event.id}
                  component={Link}
                  to={`/game/${gameId}/event/${event.id}`}
                  sx={{ 
                    textDecoration: 'none',
                    color: 'text.primary',
                    cursor: 'pointer',
                    bgcolor: isPastEvent ? 'action.selected' : 'transparent',
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography component="span" variant="body1">
                        {event.name}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ mt: 0.5 }}>
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary"
                          display="block"
                        >
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary"
                        >
                          {event.venue} • {event.location}
                        </Typography>
                      </Box>
                    }
                  />
                  {isPastEvent && (
                    <Chip 
                      size="small"
                      label="Completed"
                      sx={{ ml: 1 }}
                      color="default"
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </DashboardCard>
    );

    const renderNewsCard = () => (
      <DashboardCard>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArticleIcon color="primary" />
              <Typography variant="h6" component="span">Latest News</Typography>
            </Box>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <List>
            {mockNews.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Paper
                      elevation={0}
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        backgroundColor: 'primary.main',
                        color: 'white',
                      }}
                    >
                      <ArticleIcon />
                    </Paper>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography component="span" variant="body1" fontWeight="medium">
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        component="span"
                        variant="body2" 
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {formatRelativeTime(item.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" sx={{ my: 1 }} />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </DashboardCard>
    );

    const renderNotificationsCard = () => (
      <DashboardCard>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6" component="span">Notifications</Typography>
            </Box>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <List>
            {mockNotifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <Paper
                      elevation={0}
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        backgroundColor: notification.type === 'warning' ? 'warning.main' : 'info.main',
                        color: 'white',
                      }}
                    >
                      <NotificationsIcon />
                    </Paper>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography component="span" variant="body1" fontWeight="medium">
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        component="span"
                        variant="body2" 
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {formatRelativeTime(notification.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" sx={{ my: 1 }} />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </DashboardCard>
    );

    return (
      <Box 
        sx={{ 
          minHeight: "100vh",
          py: 4,
          background: 'linear-gradient(135deg, rgba(240,240,240,0.6) 0%, rgba(255,255,255,0.6) 100%)',
        }}
      >
        <Container maxWidth="xl">
          {/* Welcome Section */}
          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h3" 
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome Home
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ fontSize: '1.1rem' }}
            >
              Here's what's happening in Planet Fighter
            </Typography>
          </Box>

          {/* Quick Actions */}
          <Grid container spacing={2} sx={{ mb: 6 }}>
            <Grid item>
              <ActionButton startIcon={<AddIcon />} onClick={handleCreateEvent}>
                Create Event
              </ActionButton>
            </Grid>
            <Grid item>
              <ActionButton startIcon={<PersonIcon />} onClick={handleViewRoster}>
                View Roster
              </ActionButton>
            </Grid>
          </Grid>

          {/* Dashboard Grid */}
          <Grid 
            container 
            spacing={3} 
            sx={{ 
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(45deg, rgba(25,118,210,0.05) 0%, rgba(25,118,210,0.1) 100%)',
                borderRadius: 4,
                zIndex: -1,
              }
            }}
          >
            {/* Events Section */}
            <Grid item xs={12} md={6}>
              {renderEventsCard()}
            </Grid>

            {/* Emails Section */}
            <Grid item xs={12} md={6}>
              {renderEmailCard()}
            </Grid>

            {/* News Section */}
            <Grid item xs={12} md={6}>
              {renderNewsCard()}
            </Grid>

            {/* Notifications Section */}
            <Grid item xs={12} md={6}>
              {renderNotificationsCard()}
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  };

export default Home;