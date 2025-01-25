import React, { createContext, useContext, useState } from 'react';

export const CurrentGameContext = createContext(null);

export const CurrentGameProvider = ({ children }) => {
  const [currentGameId, setCurrentGameId] = useState(null);

  return (
    <CurrentGameContext.Provider value={{ currentGameId, setCurrentGameId }}>
      {children}
    </CurrentGameContext.Provider>
  );
};

export const useCurrentGame = () => {
  const context = useContext(CurrentGameContext);
  if (context === null) {
    throw new Error('useCurrentGame must be used within a CurrentGameProvider');
  }
  return context;
};