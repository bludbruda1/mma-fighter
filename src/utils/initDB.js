// src/utils/initDB.js

import { openDB } from "./indexedDB";

// Initilising the DB upon site visit
function initDB() {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        console.log("Database initialized successfully");
        // Check and store both fighters and events
        Promise.all([
          checkAndStoreFighters(db),
          checkAndStoreEvents(db),
          checkAndStoreFights(db),
          checkAndStoreChampionships(db),
        ]).then(() => resolve(db));
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

// Function to check if there is already existing event data for the save game, do not overwrite it using the events.json file
function checkAndStoreEvents(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["events"], "readonly");
    const store = transaction.objectStore("events");
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        storeEventsInDB(db).then(() => resolve());
      } else {
        console.log(
          "Event data already exists in IndexedDB, skipping initialization."
        );
        resolve();
      }
    };

    countRequest.onerror = (error) => {
      console.error("Error checking events count", error);
      reject(error);
    };
  });
}

// Function to check if there is already existing gyms data for the save game, do not overwrite it using the gyms.json file
function checkAndStoreGyms(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["gyms"], "readonly");
    const store = transaction.objectStore("gyms");
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        storeEventsInDB(db).then(() => resolve());
      } else {
        console.log(
          "Gyms data already exists in IndexedDB, skipping initialization."
        );
        resolve();
      }
    };

    countRequest.onerror = (error) => {
      console.error("Error checking gyms count", error);
      reject(error);
    };
  });
}

// Function to check if there is already existing fight data for the save game, do not overwrite it using the fights.json file
function checkAndStoreFights(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["fights"], "readonly");
    const store = transaction.objectStore("fights");
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        storeFightsInDB(db).then(() => resolve());
      } else {
        console.log(
          "Fight data already exists in IndexedDB, skipping initialization."
        );
        resolve();
      }
    };

    countRequest.onerror = (error) => {
      console.error("Error checking events count", error);
      reject(error);
    };
  });
}

// Function to check if there is already existing championship data for the save game, do not overwrite it using the fights.json file
function checkAndStoreChampionships(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("championships", "readonly");
    const store = transaction.objectStore("championships");
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        storeChampionshipsInDB(db).then(() => resolve());
      } else {
        console.log(
          "Championship data already exists in IndexedDB, skipping initialization."
        );
        resolve();
      }
    };

    countRequest.onerror = (error) => {
      console.error("Error checking championships count", error);
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

// Grabs the events info from the events.json file and stores it in our DB
function storeEventsInDB(db) {
  return fetch("/events.json")
    .then((response) => response.json())
    .then((events) => {
      const transaction = db.transaction(["events"], "readwrite");
      const store = transaction.objectStore("events");

      events.forEach((event) => {
        store.put(event);
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log("All events stored in IndexedDB");
          resolve();
        };
        transaction.onerror = () => reject("Error storing events");
      });
    })
    .catch((error) => console.error("Failed to fetch events", error));
}

// Grabs the fights info from the fights.json file and stores it in our DB
function storeFightsInDB(db) {
  return fetch("/fights.json")
    .then((response) => response.json())
    .then((fights) => {
      const transaction = db.transaction(["fights"], "readwrite");
      const store = transaction.objectStore("fights");

      fights.forEach((fight) => {
        store.put(fight);
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log("All fights stored in IndexedDB");
          resolve();
        };
        transaction.onerror = () => reject("Error storing fights");
      });
    })
    .catch((error) => console.error("Failed to fetch fights", error));
}

// Grabs the champs info from the championships.json file and stores it in our DB
function storeChampionshipsInDB(db) {
  return fetch("/championships.json")
    .then((response) => response.json())
    .then((championships) => {
      const transaction = db.transaction(["championships"], "readwrite");
      const store = transaction.objectStore("championships");

      championships.forEach((championship) => {
        store.put(championship);
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log("All championships stored in IndexedDB");
          resolve();
        };
        transaction.onerror = () => reject("Error storing championships");
      });
    })
    .catch((error) => console.error("Failed to fetch championships", error));
}

export default initDB;
