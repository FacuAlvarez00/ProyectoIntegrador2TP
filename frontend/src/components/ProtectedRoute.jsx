import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';

export default function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setIsValid(false);
      return;
    }

    // Validar el token con el backend
    (async () => {
      try {
        await api('/auth/me', { token });
        setIsValid(true);
      } catch (error) {
        // Token inválido, limpiar localStorage y redirigir
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    })();
  }, [token]);

  if (isValidating) {
    return <div className="card"><p>Cargando...</p></div>;
  }

  if (!isValid) {
    return <Navigate to="/login" />;
  }

  return children;
}
