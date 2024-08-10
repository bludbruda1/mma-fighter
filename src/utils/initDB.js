// src/utils/initDB.js

import { openDB } from "./indexedDB";

// Initilising the DB upon site visit
function initDB() {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        console.log("Database initialized successfully");
        checkAndStoreFighters(db).then(() => resolve(db));
      })
      .catch((error) => {
        console.error("Database failed to open", error);
        reject(error);
      });
  });
}

// Function to check if there is already existing fighter data for the save game, do not overwrite it using the fighters.json file
function checkAndStoreFighters(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["fighters"], "readonly");
    const store = transaction.objectStore("fighters");
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        // If no data exists, store the fighters
        storeFightersInDB(db).then(() => resolve());
      } else {
        console.log(
          "Data already exists in IndexedDB, skipping initialization."
        );
        resolve();
      }
    };

    countRequest.onerror = (error) => {
      console.error("Error checking fighter count", error);
      reject(error);
    };
  });
}

// Grabs the fighter info from the fighters.json file and stores it in our DB
function storeFightersInDB(db) {
  return fetch("/fighters.json")
    .then((response) => response.json())
    .then((fighters) => {
      const transaction = db.transaction(["fighters"], "readwrite");
      const store = transaction.objectStore("fighters");

      fighters.forEach((fighter) => {
        store.put(fighter);
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log("All fighters stored in IndexedDB");
          resolve();
        };
        transaction.onerror = () => reject("Error storing fighters");
      });
    })
    .catch((error) => console.error("Failed to fetch fighters", error));
}

export default initDB;
