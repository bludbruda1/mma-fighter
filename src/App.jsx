// App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FightScreen from "./pages/FightScreen";
import Roster from "./pages/Roster";
import HamburgerMenu from "./components/HamburgerMenu";

const App = () => {
  return (
    <>
      <HamburgerMenu />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fight" element={<FightScreen />} />
        <Route path="/roster" element={<Roster />} />
      </Routes>
    </>
  );
};

export default App;
