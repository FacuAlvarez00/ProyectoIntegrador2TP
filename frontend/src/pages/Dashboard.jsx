import React from 'react';
import PatientDashboard from '../components/PatientDashboard.jsx';
import AdminDashboard from '../components/AdminDashboard.jsx';
import DoctorDashboard from '../components/DoctorDashboard.jsx';

export default function Dashboard(){
  // El usuario ya está validado por ProtectedRoute
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Renderizar dashboard específico según el rol
  if (user.role === 'PACIENTE') {
    return <PatientDashboard />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  if (user.role === 'MEDICO') {
    return <DoctorDashboard />;
  }

  // Dashboard básico para otros roles (por ahora)
  return (
    <div className="card">
      <h2>Bienvenido, {user.name}</h2>
      <p>Rol: <strong>{user.role}</strong></p>
      <p>Este dashboard es el punto de partida para:</p>
      <ul>
        <li>Paciente: reservar/ver/cancelar turnos.</li>
        <li>Médico: ver agenda diaria, marcar atendidos.</li>
        <li>Admin: gestionar médicos, especialidades y agenda global.</li>
      </ul>
    </div>
  );
}
