import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const SOUTH_AMERICA_COUNTRIES = [
  { name: 'Argentina',  dialCode: '+54',  maxDigits: 10, placeholder: '11 1234-5678' },
  { name: 'Bolivia',    dialCode: '+591', maxDigits: 8,  placeholder: '7123 4567' },
  { name: 'Brasil',     dialCode: '+55',  maxDigits: 11, placeholder: '11 91234-5678' },
  { name: 'Chile',      dialCode: '+56',  maxDigits: 9,  placeholder: '9 1234 5678' },
  { name: 'Colombia',   dialCode: '+57',  maxDigits: 10, placeholder: '312 123 4567' },
  { name: 'Ecuador',    dialCode: '+593', maxDigits: 9,  placeholder: '99 123 4567' },
  { name: 'Guyana',     dialCode: '+592', maxDigits: 7,  placeholder: '123 4567' },
  { name: 'Paraguay',   dialCode: '+595', maxDigits: 9,  placeholder: '981 123 456' },
  { name: 'Perú',       dialCode: '+51',  maxDigits: 9,  placeholder: '912 345 678' },
  { name: 'Surinam',    dialCode: '+597', maxDigits: 7,  placeholder: '123 4567' },
  { name: 'Uruguay',    dialCode: '+598', maxDigits: 8,  placeholder: '9123 4567' },
  { name: 'Venezuela',  dialCode: '+58',  maxDigits: 10, placeholder: '412 123 4567' },
];

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PACIENTE',
    dni: '',
    telefono: '',
    tipoDocumento: 'DNI',
    pais: 'Argentina'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selectedCountry = SOUTH_AMERICA_COUNTRIES.find(c => c.name === formData.pais) || SOUTH_AMERICA_COUNTRIES[0];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dni' && formData.tipoDocumento === 'DNI') {
      setFormData(prev => ({ ...prev, dni: value.replace(/\D/g, '').slice(0, 8) }));
      return;
    }

    if (name === 'telefono') {
      setFormData(prev => ({ ...prev, telefono: value.replace(/\D/g, '').slice(0, selectedCountry.maxDigits) }));
      return;
    }

    if (name === 'pais') {
      setFormData(prev => ({ ...prev, pais: value, telefono: '' }));
      return;
    }

    if (name === 'tipoDocumento') {
      setFormData(prev => ({ ...prev, tipoDocumento: value, dni: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const fullPhone = formData.telefono
      ? `${selectedCountry.dialCode} ${formData.telefono}`
      : undefined;

    try {
      const { user, token } = await api('/auth/register', {
        method: 'POST',
        body: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          dni: formData.dni || undefined,
          telefono: fullPhone
        }
      });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
  }

  const isDNI = formData.tipoDocumento === 'DNI';

  return (
    <div className="min-vh-100 d-flex flex-column">
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
                  <div className="input-group">
                    <select
                      className="form-select form-select-lg"
                      style={{ maxWidth: '185px' }}
                      name="pais"
                      value={formData.pais}
                      onChange={handleInputChange}
                    >
                      {SOUTH_AMERICA_COUNTRIES.map(c => (
                        <option key={c.name} value={c.name}>{c.dialCode} {c.name}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className="form-control form-control-lg"
                      placeholder={selectedCountry.placeholder}
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      maxLength={selectedCountry.maxDigits}
                      inputMode="numeric"
                    />
                  </div>
                  <small className="text-muted ms-1">
                    Característica: {selectedCountry.dialCode} — máx. {selectedCountry.maxDigits} dígitos
                  </small>
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
                      placeholder={isDNI ? 'XX.XXX.XXX' : 'Nro. documento'}
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      maxLength={isDNI ? 8 : undefined}
                      inputMode={isDNI ? 'numeric' : 'text'}
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
