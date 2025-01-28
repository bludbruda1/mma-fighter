import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { EventProvider } from "./contexts/EventContext";
import { GameDateProvider } from "./contexts/GameDateContext";
import { CurrentGameProvider } from "./contexts/CurrentGameContext";

const container = document.getElementById("root");
const root = createRoot(container);

// Render the application
root.render(
  <Router>
    <CurrentGameProvider>
      <GameDateProvider>
        <EventProvider>
          <App />
        </EventProvider>
      </GameDateProvider>
    </CurrentGameProvider>
  </Router>
);

