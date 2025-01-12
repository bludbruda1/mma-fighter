// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
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
import SelectDate from "./pages/SelectDate";
import Landing from "./pages/Landing";
import LoadGame from "./pages/LoadGame";
import MainGame from "./pages/MainGame";

const App = () => {
  return (
    <>
      <HamburgerMenu />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Landing />} />
        <Route path="/loadgame" element={<LoadGame />} />
        <Route path="/fight" element={<FightScreen />} />
        <Route path="/selectdate" element={<SelectDate />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/championships" element={<Championships />} />
        <Route path="/createevent" element={<CreateEvent />} />
        <Route path="/event/:eventId" element={<Event />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/main" element={<MainGame />} />
      </Routes>
    </>
  );
};

export default App;
