import React, { createContext, useState } from "react";

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [eventIds, setEventIds] = useState([]);

  return (
    <EventContext.Provider value={{ eventIds, setEventIds }}>
      {children}
    </EventContext.Provider>
  );
};
