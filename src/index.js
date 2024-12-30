// index.js
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import initDB from "./utils/initDB";
import { EventProvider } from "./contexts/EventContext";
import { GameDateProvider } from "./contexts/GameDateContext";

const container = document.getElementById("root");
const root = createRoot(container);

// Initialize IndexedDB and render the application
initDB()
  .then(() => {
    root.render(
      <Router>
        <GameDateProvider>
          <EventProvider>
            <App />
          </EventProvider>
        </GameDateProvider>
      </Router>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize the database", error);
  });
