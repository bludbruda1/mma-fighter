// Declaring our DB and store names
const fighterStoreName = "fighters";
const eventStoreName = "events";
const fightsStoreName = "fights";
const championshipStoreName = "championships";
const settingsStoreName = "settings";

const DB_VERSION = 1;
const DB_NAME = "PlanetFighterGames";

const STORES = {
  GAMES: "games",  // Store game metadata
  GAME_DATA: "gameData"  // Store actual game data for each save
};

// Function to get the correct database name for a game
export const getGameDBName = (gameId) => {
  return gameId ? `game_${gameId}` : 'FightersDB';
};

// Structure for a new game save
const createNewGameStructure = (name, date = new Date()) => ({
  id: Date.now(), // Unique identifier
  name,
  createdAt: date,
  lastPlayed: date,
  gameDate: date,
  dbName: `game_${Date.now()}` // Unique DB name for this save
});

// Initialize the game management database
export const initGameManagementDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Error initializing game management DB");

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.GAMES)) {
        db.createObjectStore(STORES.GAMES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.GAME_DATA)) {
        db.createObjectStore(STORES.GAME_DATA, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
};

// Create a new game save
export const createNewGame = async (name) => {
  const db = await initGameManagementDB();
  const gameStructure = createNewGameStructure(name);
  
  try {
    // Create new game entry
    const transaction = db.transaction([STORES.GAMES], "readwrite");
    const store = transaction.objectStore(STORES.GAMES);
    await store.add(gameStructure);

    // Initialize game-specific database
    await initGameDB(gameStructure.dbName);

    return gameStructure;
  } catch (error) {
    console.error("Error creating new game:", error);
    throw error;
  }
};

// Load existing game
export const loadGame = async (gameId) => {
  const db = await initGameManagementDB();
  const transaction = db.transaction([STORES.GAMES], "readonly");
  const store = transaction.objectStore(STORES.GAMES);
  
  return new Promise((resolve, reject) => {
    const request = store.get(gameId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error loading game");
  });
};

// Delete game save
export const deleteGame = async (gameId) => {
  const db = await initGameManagementDB();
  const game = await loadGame(gameId);

  try {
    // Delete game entry
    const transaction = db.transaction([STORES.GAMES], "readwrite");
    const store = transaction.objectStore(STORES.GAMES);
    await store.delete(gameId);

    // Delete game-specific database
    await deleteGameDB(game.dbName);

    return true;
  } catch (error) {
    console.error("Error deleting game:", error);
    throw error;
  }
};

// List all saved games
export const listGames = async () => {
  const db = await initGameManagementDB();
  const transaction = db.transaction([STORES.GAMES], "readonly");
  const store = transaction.objectStore(STORES.GAMES);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error listing games");
  });
};

// Opening up our DB and checking if an upgrade is needed
export const openDB = (gameId) => {
  const dbName = gameId ? `game_${gameId}` : 'FightersDB';

  if (!gameId) {
    console.error("openDB called with undefined Game ID");
    console.trace("Stack trace for undefined Game ID");
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 4);

    request.onerror = () => {
      console.error(`Error opening database: ${gameId}`);
      reject("Error opening database");
    };

    request.onsuccess = (event) => {
      console.log(`Database opened successfully: ${gameId}`);
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

/**
 * Initialize a new game-specific database with all required stores
 * @param {string} dbName - Unique database name for this game save
 * @returns {Promise} Resolves when database is initialized
 */
const initGameDB = (dbName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => {
      console.error("Error opening game database:", dbName);
      reject("Error opening game database");
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create fighters store
      if (!db.objectStoreNames.contains("fighters")) {
        db.createObjectStore("fighters", { keyPath: "personid" });
      }

      // Create events store
      if (!db.objectStoreNames.contains("events")) {
        db.createObjectStore("events", { keyPath: "id" });
      }

      // Create fights store
      if (!db.objectStoreNames.contains("fights")) {
        db.createObjectStore("fights", { keyPath: "id" });
      }

      // Create championships store
      if (!db.objectStoreNames.contains("championships")) {
        db.createObjectStore("championships", { keyPath: "id" });
      }

      // Create settings store for game-specific settings like game date
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = async (event) => {
      const db = event.target.result;
      
      try {
        // Initialize the database with default data
        await initializeGameData(db);
        resolve(db);
      } catch (error) {
        reject(error);
      }
    };
  });
};

/**
 * Initialize a new game database with default data
 * @param {IDBDatabase} db - The database instance to initialize
 * @returns {Promise} Resolves when all data is initialized
 */
const initializeGameData = async (db) => {
  try {
    // Load default data from JSON files
    const [fighters, events, fights, championships] = await Promise.all([
      fetch("/fighters.json").then(response => response.json()),
      fetch("/events.json").then(response => response.json()),
      fetch("/fights.json").then(response => response.json()),
      fetch("/championships.json").then(response => response.json())
    ]);

    // Store initial game date
    const initialGameDate = new Date().toISOString();
    await storeData(db, "settings", { key: "gameDate", value: initialGameDate });

    // Store all default data
    await Promise.all([
      storeData(db, "fighters", fighters),
      storeData(db, "events", events),
      storeData(db, "fights", fights),
      storeData(db, "championships", championships)
    ]);

  } catch (error) {
    console.error("Error initializing game data:", error);
    throw error;
  }
};

/**
 * Store data in a specific object store
 * @param {IDBDatabase} db - The database instance
 * @param {string} storeName - Name of the object store
 * @param {Array|Object} data - Data to store
 * @returns {Promise} Resolves when data is stored
 */
const storeData = (db, storeName, data) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    // Handle both single objects and arrays
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
  });
};

// Delete game-specific database
const deleteGameDB = (dbName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject("Error deleting game database");
  });
};

// Function to get all fighters from the DB
export const getAllFighters = async (gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(fighterStoreName, "readonly");
    const store = transaction.objectStore(fighterStoreName);
    const request = store.getAll();

    request.onerror = () => reject("Error fetching fighters");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Function to update fighter data
export const updateFighter = async (fighter, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(fighterStoreName, "readwrite");
    const store = transaction.objectStore(fighterStoreName);
    const request = store.put(fighter);

    request.onerror = () => reject("Error updating fighter");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Function to add an event to IndexedDB
export const addEventToDB = async (event, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(eventStoreName, "readwrite");
    const store = transaction.objectStore(eventStoreName);

    // Validate that ID is numeric
    if (!Number.isInteger(event.id)) {
      reject(new Error("Event ID must be an integer"));
      return;
    }

    // Validate fight IDs structure
    const validateFightIds = (ids) => {
      if (!Array.isArray(ids)) return false;
      return ids.every(id => Number.isInteger(id));
    };

    // Validate fight structure (either array or object with card properties)
    if (Array.isArray(event.fights)) {
      // Old format validation
      if (!validateFightIds(event.fights)) {
        reject(new Error("All fight IDs must be integers"));
        return;
      }
    } else {
      // New format validation
      const mainCardValid = event.fights.mainCard && validateFightIds(event.fights.mainCard);
      const prelimsValid = !event.fights.prelims || validateFightIds(event.fights.prelims);
      const earlyPrelimsValid = !event.fights.earlyPrelims || validateFightIds(event.fights.earlyPrelims);

      if (!mainCardValid || !prelimsValid || !earlyPrelimsValid) {
        reject(new Error("Invalid fight card structure. All fight IDs must be integers."));
        return;
      }
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
export const getAllEvents = async (gameId) => {
  const db = await openDB(gameId);
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
export const getEventFromDB = async (eventId, gameId) => {
  const numericId = Number(eventId);
  if (!Number.isInteger(numericId)) {
    return Promise.reject("Event ID must be an integer");
  }

  try {
    const db = await openDB(gameId);
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
export const getNextEventId = async (gameId) => {
  const db = await openDB(gameId);
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
export const addFightToDB = async (fight, gameId) => {
  if (!fight || !fight.fighter1 || !fight.fighter2) {
    console.error("Invalid fight data:", fight);
    return Promise.reject("Invalid fight structure");
  }

  // Validate that ID is numeric
  if (!Number.isInteger(fight.id)) {
    return Promise.reject("Fight ID must be an integer");
  }

  try {
    const db = await openDB(gameId);
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
export const getAllFights = async (gameId) => {
  const db = await openDB(gameId);
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
export const getFightsByIds = async (fightIds, gameId) => {
  if (!Array.isArray(fightIds)) {
    return Promise.reject("fightIds must be an array of numbers");
  }

  if (!fightIds.every(id => Number.isInteger(Number(id)))) {
    return Promise.reject("All fight IDs must be integers");
  }

  const db = await openDB(gameId);
  return Promise.all(
    fightIds.map(
      (id) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(fightsStoreName, "readonly");
          const store = transaction.objectStore(fightsStoreName);
          const request = store.get(Number(id));

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
export const getFightFromDB = async (fightId, gameId) => {
  const numericId = Number(fightId);
  if (!Number.isInteger(numericId)) {
    return Promise.reject("Fight ID must be an integer");
  }

  try {
    const db = await openDB(gameId);
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
export const getNextFightId = async (gameId) => {
  const db = await openDB(gameId);
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
export const updateFightResults = async (fightId, results, gameId) => {
  if (!Number.isInteger(fightId)) {
    return Promise.reject("Fight ID must be an integer");
  }

  try {
    const db = await openDB(gameId);
    const fight = await getFightFromDB(fightId, gameId);

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
export const addChampionship = async (championship, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readwrite");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.add(championship);

    request.onsuccess = () => resolve(championship);
    request.onerror = () => reject(request.error);
  });
};

// Function to get all championships
export const getAllChampionships = async (gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readonly");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Function to update a championship
export const updateChampionship = async (championship, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readwrite");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.put(championship);

    request.onsuccess = () => resolve(championship);
    request.onerror = () => reject(request.error);
  });
};

//  Function to get the next championship ID
export const getNextChampionshipId = async (gameId) => {
  const db = await openDB(gameId);
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
export const deleteChampionship = async (id, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readwrite");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Function to get a championship by ID
export const getChampionshipById = async (id, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(championshipStoreName, "readonly");
    const store = transaction.objectStore(championshipStoreName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveGameDate = async (date, gameId) => {
  const db = await openDB(gameId);
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
export const getGameDate = async (gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(settingsStoreName, "readonly");
    const store = transaction.objectStore(settingsStoreName);
    const request = store.get("gameDate");

    request.onsuccess = () =>
      resolve(request.result?.value || new Date().toISOString());
    request.onerror = (event) => reject(event.target.error);
  });
};

// Functions to manage settings
export const updateSettings = async (key, value, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(settingsStoreName, "readwrite");
    const store = transaction.objectStore(settingsStoreName);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
};

export const getSettings = async (key, gameId) => {
  const db = await openDB(gameId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(settingsStoreName, "readonly");
    const store = transaction.objectStore(settingsStoreName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Updates fighter active status based on injury recovery
 * @param {Object} fighter - Fighter to check
 * @param {Date} gameDate - Current game date
 * @returns {Object|null} Updated fighter if status changed, null if no change needed
 */
export const checkAndUpdateFighterStatus = async (fighter) => {
  if (!fighter.injuries?.length) {
    // If no injuries and inactive, activate fighter
    if (!fighter.isActive) {
      const updatedFighter = { ...fighter, isActive: true };
      await updateFighter(updatedFighter);
      return updatedFighter;
    }
    return null;
  }

  const currentGameDate = await getGameDate();
  const gameDateTime = new Date(currentGameDate);
  let needsUpdate = false;
  
  // Create a copy of fighter with injuries to modify
  const updatedFighter = {
    ...fighter,
    injuries: fighter.injuries.map(injury => {
      // Skip if already healed
      if (injury.isHealed) return injury;

      // Check if injury has healed
      const injuryEnd = new Date(injury.dateIncurred);
      injuryEnd.setDate(injuryEnd.getDate() + injury.duration);
      
      if (injuryEnd <= gameDateTime && !injury.isHealed) {
        needsUpdate = true;
        return { ...injury, isHealed: true };
      }
      return injury;
    })
  };

  // Check if any injuries are still active
  const hasActiveInjury = updatedFighter.injuries.some(injury => {
    if (injury.isHealed) return false;
    const injuryEnd = new Date(injury.dateIncurred);
    injuryEnd.setDate(injuryEnd.getDate() + injury.duration);
    return injuryEnd > gameDateTime;
  });

  // Update active status if needed
  if (hasActiveInjury !== !updatedFighter.isActive) {
    updatedFighter.isActive = !hasActiveInjury;
    needsUpdate = true;
  }

  // Only update database if changes were made
  if (needsUpdate) {
    await updateFighter(updatedFighter);
    return updatedFighter;
  }

  return null;
};


// Function to check all fighters
export const updateAllFighterStatuses = async () => {
  const fighters = await getAllFighters();
  const updates = await Promise.all(
    fighters.map(fighter => checkAndUpdateFighterStatus(fighter))
  );
  
  return updates.filter(Boolean); // Return only fighters that were updated
};