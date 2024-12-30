import React, { createContext, useState, useContext } from "react";

const GameDateContext = createContext();

export const GameDateProvider = ({ children }) => {
  const [gameDate, setGameDate] = useState(new Date().toISOString()); // Default to current date

  return (
    <GameDateContext.Provider value={{ gameDate, setGameDate }}>
      {children}
    </GameDateContext.Provider>
  );
};

export const useGameDate = () => useContext(GameDateContext);
