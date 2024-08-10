import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import initDB from "./utils/initDB";

const container = document.getElementById("root");
const root = createRoot(container);

// Wrapping our app with initDB to initilise our DB upon up start up
initDB()
  .then(() => {
    root.render(
      <Router>
        <App />
      </Router>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize the database", error);
  });
