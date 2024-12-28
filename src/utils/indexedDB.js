// Declaring our DB and store names
const dbName = "FightersDB";
const fighterStoreName = "fighters";
const eventStoreName = "events";
const fightsStoreName = "fights";
const championshipStoreName = "championships";
const settingsStoreName = "settings";

// Opening up our DB and checking if an upgrade is needed
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 3); // Increment version to trigger upgrade if needed

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

      // Create the "fights" store if it doesn't exist
      if (!db.objectStoreNames.contains(fightsStoreName)) {
        console.log(`Creating object store: ${fightsStoreName}`);
        db.createObjectStore(fightsStoreName, { keyPath: "id" });
      }

      // Create the "championships" store if it doesn't exist
      if (!db.objectStoreNames.contains(championshipStoreName)) {
        console.log(`Creating object store: ${championshipStoreName}`);
        db.createObjectStore(championshipStoreName, { keyPath: "id" });
      }

      // Create the "settings" store if it doesn't exist
      if (!db.objectStoreNames.contains(settingsStoreName)) {
        console.log(`Creating object store: ${settingsStoreName}`);
        db.createObjectStore(settingsStoreName, { keyPath: "key" });
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

    // Validate that ID is numeric
    if (!Number.isInteger(event.id)) {
      reject(new Error("Event ID must be an integer"));
      return;
    }

    // Validate that fight IDs are numeric
    if (!event.fights.every((id) => Number.isInteger(id))) {
      reject(new Error("All fight IDs must be integers"));
      return;
    }

    const addRequest = store.add(event);

    addRequest.onsuccess = () => {
      console.log("Event added successfully:", event);
      resolve(true);
    };
    addRequest.onerror = (error) => {
      console.error("Error adding event:", error);
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
  const numericId = Number(eventId);
  if (!Number.isInteger(numericId)) {
    return Promise.reject("Event ID must be an integer");
  }

  try {
    const db = await openDB();
    const transaction = db.transaction(eventStoreName, "readonly");
    const store = transaction.objectStore(eventStoreName);
    const request = store.get(numericId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          console.log("Event found:", request.result);
          resolve(request.result);
        } else {
          console.log(`Event with ID ${numericId} not found.`);
          resolve(null);
        }
      };
      request.onerror = (error) => {
        console.error("Error fetching event:", error);
        reject(error);
      };
    });
  } catch (error) {
    console.error("Failed to open database:", error);
    return Promise.reject(error);
  }
};

// Function to get the next event ID
export const getNextEventId = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(eventStoreName, "readonly");
    const store = transaction.objectStore(eventStoreName);
    const getRequest = store.getAll();

    getRequest.onsuccess = (event) => {
      const events = event.target.result;
      // Find highest numeric ID
      const maxId = events.reduce(
        (max, current) => Math.max(max, current.id),
        0
      );
      resolve(maxId + 1);
    };

    getRequest.onerror = () => reject("Error fetching events");
  });
};

// Function to add a fight to IndexedDB
export const addFightToDB = async (fight) => {
  if (!fight || !fight.fighter1 || !fight.fighter2) {
    console.error("Invalid fight data:", fight);
    return Promise.reject("Invalid fight structure");
  }

  // Validate that ID is numeric
  if (!Number.isInteger(fight.id)) {
    return Promise.reject("Fight ID must be an integer");
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(fightsStoreName, "readwrite");
      const store = transaction.objectStore(fightsStoreName);

      // Normalize fighter data
      const normalizedFight = {
        ...fight,
        fighter1: {
          personid: fight.fighter1.personid || null,
          firstname: fight.fighter1.firstname,
          lastname: fight.fighter1.lastname,
        },
        fighter2: {
          personid: fight.fighter2.personid || null,
          firstname: fight.fighter2.firstname,
          lastname: fight.fighter2.lastname,
        },
      };

      store.put(normalizedFight);

      transaction.oncomplete = () => {
        console.log("Fight successfully added to database:", normalizedFight);
        resolve(fight);
      };

      transaction.onerror = (error) => {
        console.error("Transaction error while adding fight:", error);
        reject(error);
      };
    });
  } catch (error) {
    console.error("Database error while adding fight:", error);
    return Promise.reject(error);
  }
};

// Function to get all fights from IndexedDB
export const getAllFights = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("fights", "readonly");
    const store = transaction.objectStore("fights");
    const request = store.getAll();

    request.onsuccess = (event) => {
      const fights = event.target.result || [];
      console.log(`Retrieved ${fights.length} fights from database`);
      resolve(fights);
    };

    request.onerror = (error) => {
      console.error("Error fetching fights:", error);
      reject("Error fetching fights");
    };
  });
};

// Function to get multiple fights by their IDs
export const getFightsByIds = async (fightIds) => {
  if (!Array.isArray(fightIds)) {
    return Promise.reject("fightIds must be an array of numbers");
  }

  const db = await openDB();
  return Promise.all(
    fightIds.map(
      (id) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(fightsStoreName, "readonly");
          const store = transaction.objectStore(fightsStoreName);
          const request = store.get(id);

          request.onsuccess = () => {
            resolve(request.result || null);
          };
          request.onerror = (error) => {
            console.error(`Error fetching fight ${id}:`, error);
            reject(error);
          };
        })
    )
  ).then((fights) => fights.filter((fight) => fight !== null));
};

// Function to get a single fight by ID
export const getFightFromDB = async (fightId) => {
  const numericId = Number(fightId);
  if (!Number.isInteger(numericId)) {
    return Promise.reject("Fight ID must be an integer");
  }

  try {
    const db = await openDB();
    const transaction = db.transaction(fightsStoreName, "readonly");
    const store = transaction.objectStore(fightsStoreName);
    const request = store.get(numericId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          console.log("Fight found:", request.result);
          resolve(request.result);
        } else {
          console.log(`Fight with ID ${numericId} not found.`);
          resolve(null);
        }
      };
      request.onerror = (error) => {
        console.error("Error fetching fight:", error);
        reject(error);
      };
    });
  } catch (error) {
    console.error("Failed to open database:", error);
    return Promise.reject(error);
  }
};

// Function to get the next fight ID
export const getNextFightId = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(fightsStoreName, "readonly");
    const store = transaction.objectStore(fightsStoreName);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const fights = event.target.result || [];
      // Find highest numeric ID
      const maxId = fights.reduce(
        (max, current) => Math.max(max, current.id),
        0
      );
      resolve(maxId + 1);
    };

    request.onerror = (error) => {
      console.error("Error getting next fight ID:", error);
      reject("Error fetching fights");
    };
  });
};

// Function to update fight results
export const updateFightResults = async (fightId, results) => {
  if (!Number.isInteger(fightId)) {
    return Promise.reject("Fight ID must be an integer");
  }

  try {
    const db = await openDB();
    const fight = await getFightFromDB(fightId);

    if (!fight) {
      return Promise.reject("Fight not found");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(fightsStoreName, "readwrite");
      const store = transaction.objectStore(fightsStoreName);

      const updatedFight = {
        ...fight,
        result: results.result,
        stats: results.stats,
      };

      store.put(updatedFight);

      transaction.oncomplete = () => {
        console.log("Fight results updated:", updatedFight);
        resolve(updatedFight);
      };

      transaction.onerror = (error) => {
        console.error("Error updating fight results:", error);
        reject(error);
      };
    });
  } catch (error) {
    console.error("Database error while updating fight results:", error);
    return Promise.reject(error);
  }
};

// Function to add a new championship
export const addChampionship = async (championship) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readwrite");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.add(championship);

    request.onsuccess = () => resolve(championship);
    request.onerror = () => reject(request.error);
  });
};

// Function to get all championships
export const getAllChampionships = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readonly");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Function to update a championship
export const updateChampionship = async (championship) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readwrite");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.put(championship);

    request.onsuccess = () => resolve(championship);
    request.onerror = () => reject(request.error);
  });
};

//  Function to get the next championship ID
export const getNextChampionshipId = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readonly");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.getAll();

    request.onsuccess = () => {
      const championships = request.result;
      const maxId = championships.reduce((max, current) => {
        const idNumber = parseInt(current.id, 10);
        return Math.max(max, idNumber);
      }, 0);
      resolve(maxId + 1);
    };

    request.onerror = () => reject("Error fetching championships");
  });
};

// Function to delete a championship
export const deleteChampionship = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readwrite");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Function to get a championship by ID
export const getChampionshipById = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readonly");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveGameDate = async (date) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(settingsStoreName, "readwrite");
    const store = transaction.objectStore(settingsStoreName);
    const request = store.put({ key: "gameDate", value: date }); // Save as YYYY-MM-DD

    request.onsuccess = () => {
      console.log("Game date saved successfully:", date);
      resolve();
    };

    request.onerror = (event) => {
      console.error("Error saving game date:", event.target.error);
      reject(event.target.error);
    };
  });
};

// Retrieve the game date
export const getGameDate = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(settingsStoreName, "readonly");
    const store = transaction.objectStore(settingsStoreName);
    const request = store.get("gameDate");

    request.onsuccess = () =>
      resolve(request.result?.value || new Date().toISOString());
    request.onerror = (event) => reject(event.target.error);
  });
};