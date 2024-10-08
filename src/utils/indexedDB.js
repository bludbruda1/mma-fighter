// src/utils/indexedDB.js

// Declaring our DB and Store name
const dbName = "FightersDB";
const storeName = "fighters";

// Opening up our DB and checks to see if an upgrade is needed
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject("Error opening database");
    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "personid" });
      }
    };
  });
};

export const resetDB = async () => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);

    deleteRequest.onerror = () => reject("Error deleting database");
    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully");
      // Reinitialize the database after deletion
      openDB()
        .then((db) => {
          console.log("Database reinitialized successfully");
          resolve(db);
        })
        .catch((error) => {
          console.error("Database failed to open after reset", error);
          reject(error);
        });
    };
  });
};

// Gets all of our fighter data from the DB
export const getAllFighters = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject("Error fetching fighters");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Updates our fighter data
export const updateFighter = async (fighter) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(fighter);

    request.onerror = () => reject("Error updating fighter");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};
