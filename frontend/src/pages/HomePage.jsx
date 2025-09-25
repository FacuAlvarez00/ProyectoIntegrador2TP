import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center p-3">
        <div></div>
        <div className="d-flex align-items-center">
          <div className="logo-icon me-2"></div>
          <span className="fw-bold">logo</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <div className="text-center">
          <h1 className="display-4 fw-bold mb-5">Bienvenido al sistema!</h1>
          
          <div className="d-flex flex-column gap-3" style={{ maxWidth: '300px' }}>
            <Link 
              to="/login" 
              className="btn btn-primary btn-lg py-3 fw-semibold"
            >
              Ingresar
            </Link>
            <Link 
              to="/register" 
              className="btn btn-primary btn-lg py-3 fw-semibold"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

