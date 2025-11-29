import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import StudentPortal from "./pages/StudentPortal";
import Landing from "./pages/Landing";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') {
        setIsLoggedIn(!!e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing dark={dark} setDark={setDark} />} />
      <Route path="/student" element={<StudentPortal dark={dark} setDark={setDark} />} />
      <Route path="/old" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/admin" replace /> : <Login dark={dark} setDark={setDark} onLoginSuccess={() => setIsLoggedIn(true)} />} />
      <Route path="/admin" element={<AdminDashboard dark={dark} setDark={setDark} onLogout={() => setIsLoggedIn(false)} />} />
    </Routes>
  );
}

export default App;
