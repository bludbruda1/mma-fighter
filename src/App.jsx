import React from "react";
import "./App.css";
import {
  AppBar,
  Card,
  CardContent,
  CardMedia,
  Container,
  CssBaseline,
  Grid,
  Paper,
  Table,
  Toolbar,
  Typography,
} from "@mui/material";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import connor from "./images/connormc.png";
import dustin from "./images/dustinpo.png";

const App = () => {
  return (
    <>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <SportsMmaIcon />
          <Typography variant="h6">MMA Fighter</Typography>
        </Toolbar>
      </AppBar>
      <main>
        <div>
          <Container maxWidth="md" style={{ marginTop: "100px" }}>
            <Typography
              variant="h2"
              align="center"
              color="textPrimary"
              gutterBottom
            >
              MMA Fighter
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="textSecondary"
              gutterBottom
            >
              Welcome to MMAFighter, a combat sport simulation game that lets
              you create your own world of fighting and provides an experience
              of running the show.
            </Typography>
            <div>
              <Grid
                container
                rowSpacing={1}
                columnSpacing={55}
                justify="center"
                gutterTop
              >
                <Grid item>
                  <Paper elevation={3}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="280"
                        image={connor}
                        alt="fighter 1"
                      />
                      <CardContent>
                        <Typography variant="body2">
                          Name: Connor McGregor
                        </Typography>
                        <Typography variant="body2">Record: 1-0-0</Typography>
                      </CardContent>
                    </Card>
                  </Paper>
                </Grid>
                <Grid item>
                  <Paper elevation={3}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="280"
                        image={dustin}
                        alt="fighter 2"
                      />
                      <CardContent>
                        <Typography variant="body2">
                          Name: Dustin Poirier
                        </Typography>
                        <Typography variant="body2">Record: 1-0-0</Typography>
                      </CardContent>
                    </Card>
                  </Paper>
                </Grid>
              </Grid>
            </div>
          </Container>
        </div>
      </main>
    </>
  );
};

export default App;
