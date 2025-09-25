import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    setError('');
    try{
      const { user, token } = await api('/auth/login', { method:'POST', body:{ email, password } });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    }catch(err){ setError(err.message); }
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center p-3">
        <Link to="/" className="d-flex align-items-center text-decoration-none">
          <div className="back-icon me-2"></div>
          <span className="text-warning fw-semibold">Volver</span>
        </Link>
        <div className="d-flex align-items-center">
          <div className="logo-icon me-2"></div>
          <span className="fw-bold">logo</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="text-center mb-4">
                <h1 className="h2 fw-bold">Inicia sesión</h1>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={submit}>
                <div className="mb-3">
                  <input 
                    type="email" 
                    className="form-control form-control-lg" 
                    placeholder="Correo electrónico"
                    value={email} 
                    onChange={e=>setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <input 
                    type="password" 
                    className="form-control form-control-lg" 
                    placeholder="Contraseña"
                    value={password} 
                    onChange={e=>setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4 text-end">
                  <Link to="/forgot" className="text-primary text-decoration-none">
                    ¿Olvidaste la contraseña?
                  </Link>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg py-3 fw-semibold">
                    Continuar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}