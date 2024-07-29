import React from "react";
import "./App.css";
import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import FighterCard from "./components/FighterCard";
import Selects from "./components/Selects";
import SelectComponent from "./components/Selecting";

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
          <Container
            maxWidth="md"
            style={{ marginTop: "50px", marginBottom: "20px" }}
          >
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
            <Grid container spacing={2} sx={{ justifyContent: "center" }}>
              <Grid item>
                <Button variant="contained">Generate fight</Button>
              </Grid>
              <Grid item>
                <SelectComponent />
              </Grid>
            </Grid>
            <div>
              <Grid
                container
                rowSpacing={1}
                columnSpacing={55}
                justify="center"
              >
                <Grid item>
                  <FighterCard />
                </Grid>
                <Grid item></Grid>
              </Grid>
            </div>
          </Container>
        </div>
      </main>
    </>
  );
};

export default App;
