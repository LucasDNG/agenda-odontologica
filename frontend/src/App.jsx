import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reservar" element={
          <ProtectedRoute role="patient"><BookingPage /></ProtectedRoute>
        } />
        <Route path="/mis-turnos" element={
          <ProtectedRoute role="patient"><MyAppointmentsPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="dentist"><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
