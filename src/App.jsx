import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import FightScreen from "./pages/FightScreen";
import Roster from "./pages/Roster";
import Championships from "./pages/Championships";
import Dashboard from "./pages/Dashboard";
import HamburgerMenu from "./components/HamburgerMenu";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import EventsList from "./pages/EventsList";
import Calendar from "./components/Calendar";
import Rankings from "./pages/Rankings";
import Contracts from "./pages/Contracts";
import GameManager from "./pages/GameManager";
import { EventProvider } from "./contexts/EventContext";
import { GameProvider } from "./contexts/GameContext";

// GameLayout component to wrap game-specific routes
const GameLayout = () => {
  return (
    <>
    <EventProvider>
      <HamburgerMenu />
      <Outlet /> 
    </EventProvider>
    </>
  );
};

const App = () => {
  return (
      <GameProvider>
        <Routes>
          {/* Game Manager (Home Page) */}
          <Route path="/" element={<GameManager />} />
          
          {/* Game-specific routes */}
        <Route path="game/:gameId/*" element={<GameLayout />}>
          <Route index element={<Home />} />
          <Route path="roster" element={<Roster />} />
          <Route path="championships" element={<Championships />} />
          <Route path="createevent" element={<CreateEvent />} />
          <Route path="event/:eventId" element={<Event />} />
          <Route path="dashboard/:id" element={<Dashboard />} />
          <Route path="events" element={<EventsList />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="contracts" element={<Contracts />} />
        </Route>
      </Routes>
    </GameProvider>
  );
};

export default App;
