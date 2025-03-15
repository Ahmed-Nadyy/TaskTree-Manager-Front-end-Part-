import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import TaskDetails from "./components/HomeComponents/TaskDetails";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element= {<Login />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/task/:userId/:sectionId/:taskId" element={<TaskDetails />} /> {/* Dynamic Route */}
          <Route path="*" element={<div>Page Not Found</div>} /> {/* Catch-all route */}
        </Routes>
      </div>
    </Router>
  );
}
