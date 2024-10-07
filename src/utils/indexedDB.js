// src/utils/indexedDB.js

// Declaring our DB and store names
const dbName = "FightersDB";
const fighterStoreName = "fighters";
const eventStoreName = "events";

// Opening up our DB and checking if an upgrade is needed
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 2); // Increment version to trigger upgrade if needed

    request.onerror = () => {
      console.error("Error opening database");
      reject("Error opening database");
    };

    request.onsuccess = (event) => {
      console.log("Database opened successfully");
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      console.log("Upgrading database...");
      const db = event.target.result;

      // Create the "fighters" store if it doesn't exist
      if (!db.objectStoreNames.contains(fighterStoreName)) {
        console.log(`Creating object store: ${fighterStoreName}`);
        db.createObjectStore(fighterStoreName, { keyPath: "personid" });
      }

      // Create the "events" store if it doesn't exist
      if (!db.objectStoreNames.contains(eventStoreName)) {
        console.log(`Creating object store: ${eventStoreName}`);
        db.createObjectStore(eventStoreName, { keyPath: "id" });
      }
    };
  });
};

// Reset the database and reinitialize
export const resetDB = async () => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);

    deleteRequest.onerror = () => {
      console.error("Error deleting database");
      reject("Error deleting database");
    };

    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully");
      openDB()
        .then((db) => {
          console.log("Database reinitialized successfully");
          resolve(db);
        })
        .catch((error) => {
          console.error("Error reopening database after reset", error);
          reject(error);
        });
    };
  });
};

// Function to get all fighters from the DB
export const getAllFighters = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(fighterStoreName, "readonly");
    const store = transaction.objectStore(fighterStoreName);
    const request = store.getAll();

    request.onerror = () => reject("Error fetching fighters");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Function to update fighter data
export const updateFighter = async (fighter) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(fighterStoreName, "readwrite");
    const store = transaction.objectStore(fighterStoreName);
    const request = store.put(fighter);

    request.onerror = () => reject("Error updating fighter");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Function to add an event to IndexedDB
export const addEventToDB = async (event) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(eventStoreName, "readwrite");
    const store = transaction.objectStore(eventStoreName);
    const addRequest = store.add(event);

    addRequest.onsuccess = () => {
      console.log("Event added successfully:", event); // Debugging
      resolve(true);
    };
    addRequest.onerror = (error) => {
      console.error("Error adding event:", error); // Debugging
      reject(error);
    };
  });
};

// Function to get all events from IndexedDB
export const getAllEvents = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("events", "readonly");
    const store = transaction.objectStore("events");
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result || []); // Ensure an array is returned, even if empty
    };
    request.onerror = () => {
      reject("Error fetching events");
    };
  });
};

// Function to get event data from IndexedDB by event ID
export const getEventFromDB = async (eventId) => {
  try {
    const db = await openDB(dbName, 1);
    const transaction = db.transaction("events", "readonly");
    const store = transaction.objectStore("events");
    const request = store.get(eventId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          console.log("Event found:", request.result);
          resolve(request.result);
        } else {
          console.log(`Event with ID ${eventId} not found.`);
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error("Error fetching event:", request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Failed to open database:", error);
    return null;
  }
};

// Function to get the next event ID
export const getNextEventId = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("events", "readonly");
    const store = transaction.objectStore("events");
    const getRequest = store.getAll();

    getRequest.onsuccess = (event) => {
      const events = event.target.result;

      // Determine the highest ID from existing events
      const maxId = events.reduce((max, current) => {
        const idNumber = parseInt(current.id, 10); // Ensure to parse correctly
        return Math.max(max, idNumber);
      }, 0);

      resolve(maxId + 1); // Increment the maxId by 1 for the new event ID
    };

    getRequest.onerror = () => reject("Error fetching events");
  });
};
