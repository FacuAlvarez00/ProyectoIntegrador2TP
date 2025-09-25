import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function submit(e){
    e.preventDefault();
    setMsg(''); 
    setError('');
    try{
      await api('/auth/forgot', { method:'POST', body:{ email } });
      setMsg('¡Te acabamos de enviar el enlace para restablecer tu contraseña!');
      setIsSubmitted(true);
    }catch(err){ setError(err.message); }
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center p-3">
        <Link to="/login" className="d-flex align-items-center text-decoration-none">
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
                <h1 className="h2 fw-bold">Recuperar contraseña</h1>
                <p className="text-muted">Recupere la contraseña para acceder al sistema</p>
              </div>

              {msg && (
                <div className="alert alert-success border-success" role="alert">
                  {msg}
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Introduce tu dirección de correo electrónico
                  </label>
                  <input 
                    type="email" 
                    className="form-control form-control-lg" 
                    placeholder="correoprueba@gmail.com"
                    value={email} 
                    onChange={e=>setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="d-grid mb-4">
                  <button type="submit" className="btn btn-primary btn-lg py-3 fw-semibold">
                    Enviar
                  </button>
                </div>
              </form>

              <div className="text-center">
                <p className="text-danger mb-1">¿No tiene acceso al email?</p>
                <p className="text-danger mb-0">
                  Por favor contactese a <strong>soporte@gmail.com</strong> o al <strong>11-XXXX-XXXX</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}