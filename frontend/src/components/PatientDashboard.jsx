import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Estado para nuevo turno
  const [newAppointment, setNewAppointment] = useState({
    doctor: '',
    specialty: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar turnos del paciente
      const appointmentsData = await api('/appointments/my', { 
        token: localStorage.getItem('token') 
      });
      setAppointments(appointmentsData || []);

      // Cargar doctores y especialidades
      const [doctorsData, specialtiesData] = await Promise.all([
        api('/doctors', { token: localStorage.getItem('token') }),
        api('/specialties', { token: localStorage.getItem('token') })
      ]);
      setDoctors(doctorsData || []);
      setSpecialties(specialtiesData || []);
    } catch (err) {
      console.log('Error cargando datos:', err.message);
      // Si no existen los endpoints, usar datos mock
      setAppointments([]);
      setDoctors([
        { id: 1, name: 'Dr. García', specialty: 'Clínica Médica' },
        { id: 2, name: 'Dra. López', specialty: 'Cardiología' },
        { id: 3, name: 'Dr. Martínez', specialty: 'Pediatría' }
      ]);
      setSpecialties([
        { id: 1, name: 'Clínica Médica' },
        { id: 2, name: 'Cardiología' },
        { id: 3, name: 'Pediatría' },
        { id: 4, name: 'Dermatología' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newAppointment.doctor || !newAppointment.date || !newAppointment.time) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      await api('/appointments', {
        method: 'POST',
        body: {
          doctor_id: newAppointment.doctor,
          specialty_id: newAppointment.specialty,
          date: newAppointment.date,
          time: newAppointment.time
        },
        token: localStorage.getItem('token')
      });
      
      setNewAppointment({ doctor: '', specialty: '', date: '', time: '' });
      setActiveTab('appointments');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este turno?')) return;
    
    try {
      await api(`/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        token: localStorage.getItem('token')
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <h1>Panel del Paciente</h1>
        <div className="user-info">
          <span className="welcome">Hola, {user.name}</span>
          <span className="role-badge">PACIENTE</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Resumen
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''}
          onClick={() => setActiveTab('appointments')}
        >
          Mis Turnos
        </button>
        <button 
          className={activeTab === 'book' ? 'active' : ''}
          onClick={() => setActiveTab('book')}
        >
          Reservar Turno
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Turnos Activos</h3>
                <div className="stat-number">
                  {appointments.filter(apt => apt.status !== 'Cancelado').length}
                </div>
              </div>
              <div className="stat-card">
                <h3>Próximo Turno</h3>
                <div className="stat-text">
                  {appointments.length > 0 
                    ? formatDate(appointments[0].date) 
                    : 'Sin turnos programados'
                  }
                </div>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>Acciones Rápidas</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('book')}
                >
                  📅 Reservar Turno
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('appointments')}
                >
                  📋 Ver Mis Turnos
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="appointments-tab">
            <h3 className="section-title">Mis Turnos</h3>
            {loading ? (
              <div className="loading">Cargando turnos...</div>
            ) : appointments.length === 0 ? (
              <div className="empty-state">
                <p>No tienes turnos programados</p>
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('book')}
                >
                  Reservar mi primer turno
                </button>
              </div>
            ) : (
              <div className="appointments-list">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-info">
                      <h4>{appointment.doctor_name || 'Dr. García'}</h4>
                      <p className="specialty">{appointment.specialty_name || 'Clínica Médica'}</p>
                      <p className="date">{formatDate(appointment.date)}</p>
                      <p className="time">{formatTime(appointment.time)}</p>
                      <span className={`status ${appointment.status?.toLowerCase() || 'pendiente'}`}>
                        {appointment.status || 'Pendiente'}
                      </span>
                      {appointment.status === 'Cancelado' && appointment.cancel_reason && (
                        <p className="cancel-reason">Motivo: {appointment.cancel_reason}</p>
                      )}
                    </div>
                    <div className="appointment-actions">
                      {appointment.status !== 'Cancelado' && (
                        <button 
                          className="cancel-btn"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'book' && (
          <div className="book-tab">
            <h3>Reservar Nuevo Turno</h3>
            <form onSubmit={handleBookAppointment} className="booking-form">
              <div className="form-group">
                <label>Especialidad</label>
                <select 
                  value={newAppointment.specialty}
                  onChange={(e) => setNewAppointment({
                    ...newAppointment,
                    specialty: e.target.value,
                    doctor: '' // Reset doctor when specialty changes
                  })}
                  required
                >
                  <option value="">Selecciona una especialidad</option>
                  {specialties.map(specialty => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Médico</label>
                <select 
                  value={newAppointment.doctor}
                  onChange={(e) => setNewAppointment({
                    ...newAppointment,
                    doctor: e.target.value
                  })}
                  required
                >
                  <option value="">Selecciona un médico</option>
                  {doctors
                    .filter(doctor => !newAppointment.specialty || 
                      doctor.specialty === specialties.find(s => s.id == newAppointment.specialty)?.name)
                    .map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({
                      ...newAppointment,
                      date: e.target.value
                    })}
                    min="2025-10-01"
                    onKeyDown={(e) => {
                      // Permitir solo teclas de navegación y el calendario
                      if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => e.preventDefault()}
                    onInput={(e) => {
                      // Validar que la fecha sea válida y esté en el rango permitido
                      const selectedDate = new Date(e.target.value);
                      const minDate = new Date('2025-10-01');
                      if (selectedDate < minDate) {
                        e.target.value = '';
                        setNewAppointment({
                          ...newAppointment,
                          date: ''
                        });
                      }
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <select 
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({
                      ...newAppointment,
                      time: e.target.value
                    })}
                    required
                  >
                    <option value="">Selecciona hora</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                    <option value="10:00">10:00</option>
                    <option value="10:30">10:30</option>
                    <option value="11:00">11:00</option>
                    <option value="11:30">11:30</option>
                    <option value="14:00">14:00</option>
                    <option value="14:30">14:30</option>
                    <option value="15:00">15:00</option>
                    <option value="15:30">15:30</option>
                    <option value="16:00">16:00</option>
                    <option value="16:30">16:30</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                Reservar Turno
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
