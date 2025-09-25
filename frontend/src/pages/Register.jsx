import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Register(){
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PACIENTE',
    dni: '',
    telefono: '',
    tipoDocumento: 'DNI'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function submit(e){
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try{
      const { user, token } = await api('/auth/register', { 
        method:'POST', 
        body:{ 
          nombre: formData.nombre, 
          apellido: formData.apellido, 
          email: formData.email, 
          password: formData.password, 
          role: formData.role, 
          dni: formData.dni 
        } 
      });
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
                <h1 className="h2 fw-bold">Ingresa tus datos</h1>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="needs-validation" noValidate>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control form-control-lg" 
                    placeholder="Nombre Completo"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <input 
                    type="email" 
                    className="form-control form-control-lg" 
                    placeholder="Correo electrónico"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <input 
                    type="tel" 
                    className="form-control form-control-lg" 
                    placeholder="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-4">
                    <select 
                      className="form-select form-select-lg" 
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleInputChange}
                    >
                      <option value="DNI">DNI</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="CEDULA">Cédula</option>
                    </select>
                  </div>
                  <div className="col-8">
                    <input 
                      type="text" 
                      className="form-control form-control-lg" 
                      placeholder="Nro. documento"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <input 
                    type="password" 
                    className="form-control form-control-lg" 
                    placeholder="Contraseña"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <input 
                    type="password" 
                    className="form-control form-control-lg" 
                    placeholder="Repetir contraseña"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
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