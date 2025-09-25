import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/dashboard" element={
          <>
            <nav className="nav">
              <Link to="/">Inicio</Link>
              {user ? (
                <>
                  <span className="tag">{user.role}</span>
                  <button onClick={logout}>Salir</button>
                </>
              ) : (
                <>
                  <Link to="/login">Ingresar</Link>
                  <Link to="/register">Registrarse</Link>
                </>
              )}
            </nav>
            <ProtectedRoute><Dashboard/></ProtectedRoute>
          </>
        } />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/forgot" element={<ForgotPassword/>} />
        <Route path="/reset" element={<ResetPassword/>} />
      </Routes>
    </div>
  );
}
