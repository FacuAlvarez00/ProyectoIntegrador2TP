import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const tabs = [
  { id: 'overview', label: 'Resumen' },
  { id: 'patients', label: 'Pacientes' },
  { id: 'specialties', label: 'Especialidades' },
  { id: 'doctors', label: 'Médicos' }
];

function toTitleCase(str = '') {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [specialties, setSpecialties] = useState([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (message || error) {
      const timeout = setTimeout(() => {
        setMessage('');
        setError('');
      }, 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [message, error]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [specs, docs, pats] = await Promise.all([
        api('/especialidades', { token }),
        api('/doctors', { token }),
        api('/patients', { token })
      ]);
      setSpecialties(specs || []);
      setDoctors(docs || []);
      setPatients(pats || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSpecialty(e) {
    e.preventDefault();
    const value = newSpecialty.trim();
    if (!value) return;
    try {
      await api('/especialidades', {
        method: 'POST',
        token,
        body: { nombre: value }
      });
      setNewSpecialty('');
      setMessage('Especialidad creada');
      await loadAll();
    } catch (err) {
      setError(err.message || 'Error al crear la especialidad');
    }
  }

  function startEdit(id, currentName) {
    setEditingId(id);
    setEditingValue(currentName);
  }

  async function handleUpdateSpecialty(e) {
    e.preventDefault();
    const value = editingValue.trim();
    if (!value) return;
    try {
      await api(`/especialidades/${editingId}`, {
        method: 'PUT',
        token,
        body: { nombre: value }
      });
      setMessage('Especialidad actualizada');
      setEditingId(null);
      setEditingValue('');
      await loadAll();
    } catch (err) {
      setError(err.message || 'Error al actualizar la especialidad');
    }
  }

  async function handleDeleteSpecialty(id, name) {
    if (!confirm(`¿Eliminar la especialidad "${name}"?`)) return;
    try {
      await api(`/especialidades/${id}`, {
        method: 'DELETE',
        token
      });
      setMessage('Especialidad eliminada');
      if (editingId === id) {
        setEditingId(null);
        setEditingValue('');
      }
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la especialidad');
    }
  }

  function renderOverview() {
    const totalDoctors = doctors.length;
    const totalSpecialties = specialties.length;
    const totalPatients = patients.length;
    const countsBySpecialty = specialties
      .map(spec => ({
        id: spec.id,
        name: spec.nombre || spec.name,
        doctors: doctors.filter(doc => doc.specialty_id === spec.id || doc.specialty === spec.nombre || doc.specialty === spec.name).length
      }));

    return (
      <div className="admin-overview">
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="label">Especialidades</span>
            <strong>{totalSpecialties}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="label">Médicos</span>
            <strong>{totalDoctors}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="label">Pacientes</span>
            <strong>{totalPatients}</strong>
          </div>
        </div>
        <div className="admin-table-card">
          <h3>Distribución de médicos por especialidad</h3>
          <table>
            <thead>
              <tr>
                <th>Especialidad</th>
                <th>Médicos asignados</th>
              </tr>
            </thead>
            <tbody>
              {countsBySpecialty.map(item => (
                <tr key={item.id}>
                  <td>{toTitleCase(item.name)}</td>
                  <td>{item.doctors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSpecialties() {
    return (
      <div className="admin-specialties">
        <div className="admin-form-card">
          <h3>{editingId ? 'Editar especialidad' : 'Crear nueva especialidad'}</h3>
          <form onSubmit={editingId ? handleUpdateSpecialty : handleCreateSpecialty} className="admin-form">
            <input
              type="text"
              placeholder="Nombre de la especialidad"
              value={editingId ? editingValue : newSpecialty}
              onChange={(e) => (editingId ? setEditingValue(e.target.value) : setNewSpecialty(e.target.value))}
              required
            />
            <div className="admin-form-actions">
              <button type="submit" className="submit-btn">
                {editingId ? 'Guardar cambios' : 'Agregar especialidad'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => {
                    setEditingId(null);
                    setEditingValue('');
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>Listado de especialidades</h3>
            <span>{specialties.length} en total</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {specialties.map((spec, index) => (
                <tr key={spec.id}>
                  <td>{index + 1}</td>
                  <td>{toTitleCase(spec.nombre || spec.name)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => startEdit(spec.id, spec.nombre || spec.name)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn danger"
                      onClick={() => handleDeleteSpecialty(spec.id, spec.nombre || spec.name)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderDoctors() {
    return (
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3>Médicos registrados</h3>
          <span>{doctors.length} profesionales</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Especialidad</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doc => (
              <tr key={doc.id}>
                <td>{doc.name}</td>
                <td>{doc.specialty ? toTitleCase(doc.specialty) : 'Sin asignar'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="admin-helper">
          Para agregar nuevos médicos deberás crearlos desde la base de datos o ampliar el backend con un formulario específico.
        </p>
      </div>
    );
  }

  function renderPatients() {
    return (
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3>Pacientes registrados</h3>
          <span>{patients.length} pacientes</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>DNI</th>
              <th>Fecha alta</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                <td>{patient.dni || '—'}</td>
                <td>{patient.creado ? new Date(patient.creado).toLocaleDateString('es-ES') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <h1>Panel de Administración</h1>
          <p>Gestioná especialidades, médicos y obtené métricas rápidas.</p>
        </div>
        <button className="admin-refresh-btn" type="button" onClick={loadAll} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Datos'}
        </button>
      </header>

      <nav className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={tab.id === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {message && <div className="admin-feedback success">{message}</div>}
      {error && <div className="admin-feedback error">{error}</div>}

      <section className="admin-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'patients' && renderPatients()}
        {activeTab === 'specialties' && renderSpecialties()}
        {activeTab === 'doctors' && renderDoctors()}
      </section>
    </div>
  );
}

