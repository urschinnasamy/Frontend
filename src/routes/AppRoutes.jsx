import { Routes, Route, useLocation } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import AdminDashboard from "../pages/AdminDashboard";

import Tournaments from "../pages/Tournament";
import TournamentCreate from "../pages/TournamentCreate";
import TournamentDetails from "../pages/TournamentDetails";

import Auction from "../pages/Auction"; 
import Navbar from "../components/Navbar";

const AppRoutes = () => {
  const location = useLocation();

  // HIDE NAVBAR
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* MAIN */}
        <Route path="/" element={<Home />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        {/* TOURNAMENTS */}
        <Route
          path="/tournaments"
          element={<Tournaments />}
        />

        <Route
          path="/tournament/create"
          element={<TournamentCreate />}
        />

        <Route
          path="/tournaments/:id"
          element={<TournamentDetails />}
        /> 
        {/* AUCTION */}
        <Route path="/auction/:id" element={<Auction />} />
        
      </Routes>
    </>
  );
};

export default AppRoutes;