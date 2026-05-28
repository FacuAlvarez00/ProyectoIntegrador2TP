import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'patients', label: 'Pacientes' },
    { id: 'specialties', label: 'Especialidades' },
    { id: 'doctors', label: 'Médicos' },
    { id: 'users', label: 'Usuarios' },
    { id: 'appointments', label: 'Turnos' },
    { id: 'reports', label: 'Productividad' }
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
    const [doctorSearch, setDoctorSearch] = useState('');
    const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('ALL');
    const [togglingPatientId, setTogglingPatientId] = useState(null);

    const [users, setUsers] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ nombre: '', apellido: '', email: '', password: '', dni: '' });
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [togglingUserId, setTogglingUserId] = useState(null);
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [editingUser, setEditingUser] = useState(null);
    const [editUserForm, setEditUserForm] = useState({ nombre: '', apellido: '', email: '', dni: '', password: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    // --- [NUEVO] ESTADOS PARA TURNOS (HU17) ---
    const [adminAppointments, setAdminAppointments] = useState([]);
    const [appointmentFilters, setAppointmentFilters] = useState({ status: '', doctor_id: '', date: '' });
    
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // --- [NUEVO] FUNCIÓN PARA CARGAR TURNOS ---
    async function loadAppointments() {
        setLoading(true);
        try {
            let url = '/appointments/all?';
            const params = new URLSearchParams();
            if (appointmentFilters.status) params.append('status', appointmentFilters.status);
            if (appointmentFilters.doctor_id) params.append('doctor_id', appointmentFilters.doctor_id);
            if (appointmentFilters.date) params.append('date', appointmentFilters.date);
            
            const data = await api(url + params.toString(), { token });
            setAdminAppointments(data || []);
        } catch (err) {
            setError('Error al cargar turnos: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    // --- [NUEVO] EFECTO PARA RECARGAR CUANDO CAMBIAN FILTROS---
    useEffect(() => {
        if (activeTab === 'appointments') {
            loadAppointments();
        }
    }, [activeTab, appointmentFilters]);

    useEffect(() => {
        loadAll();
    }, []);

    // Resetear a página 1 si el filtro cambia
    useEffect(() => {
        setCurrentPage(1);
    }, [userRoleFilter]);

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
            const [specs, docs, pats, usrs] = await Promise.all([
                api('/especialidades', { token }),
                api('/doctors', { token }),
                api('/patients', { token }),
                api('/users', { token })
            ]);
            setSpecialties(specs || []);
            setDoctors(docs || []);
            setPatients(pats || []);
            setUsers(usrs || []);
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

    const doctorSpecialtyOptions = useMemo(() => {
        const set = new Set();
        doctors.forEach(doc => {
            if (doc.specialty) set.add(doc.specialty);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [doctors]);

    function renderDoctors() {
        const normalizedSearch = doctorSearch.trim().toLowerCase();
        const filteredDoctors = doctors.filter(doc => {
            const matchesSearch = !normalizedSearch
                || doc.name.toLowerCase().includes(normalizedSearch)
                || (doc.specialty && doc.specialty.toLowerCase().includes(normalizedSearch));
            const matchesSpecialty = doctorSpecialtyFilter === 'ALL'
                || (doc.specialty && doc.specialty.toLowerCase() === doctorSpecialtyFilter.toLowerCase());
            return matchesSearch && matchesSpecialty;
        });

        return (
            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h3>Médicos registrados</h3>
                    <span>
                        {filteredDoctors.length} de {doctors.length} profesionales
                    </span>
                </div>
                <div className="admin-doctor-filters">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad"
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                    />
                    <select
                        value={doctorSpecialtyFilter}
                        onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                    >
                        <option value="ALL">Todas las especialidades</option>
                        {doctorSpecialtyOptions.map(spec => (
                            <option key={spec} value={spec}>
                                {toTitleCase(spec)}
                            </option>
                        ))}
                    </select>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Especialidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDoctors.map(doc => (
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
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map(patient => (
                            <tr key={patient.id}>
                                <td>{patient.name}</td>
                                <td>{patient.email}</td>
                                <td>{patient.dni || '—'}</td>
                                <td>{patient.creado ? new Date(patient.creado).toLocaleDateString('es-ES') : '—'}</td>
                                <td>
                                    <span className={`admin-status-badge ${patient.activo ? 'active' : 'inactive'}`}>
                                        {patient.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button
                                        type="button"
                                        className={`admin-action-btn ${patient.activo ? 'danger' : ''}`}
                                        disabled={togglingPatientId === patient.id}
                                        onClick={() => handleTogglePatientStatus(patient.id, patient.activo)}
                                    >
                                        {togglingPatientId === patient.id
                                            ? 'Actualizando...'
                                            : patient.activo ? 'Inactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    async function handleTogglePatientStatus(id, isActive) {
        const actionLabel = isActive ? 'inactivar' : 'activar';
        const confirmed = window.confirm(`¿Seguro que querés ${actionLabel} a este paciente?`);
        if (!confirmed) return;

        setTogglingPatientId(id);
        try {
            const result = await api(`/users/${id}/status`, {
                method: 'PATCH',
                token
            });
            setPatients(prev => prev.map(p => (p.id === id ? { ...p, activo: result.activo } : p)));
            setUsers(prev => prev.map(u => (u.id === id ? { ...u, activo: result.activo } : u)));
            setMessage(result.activo ? 'Paciente activado' : 'Paciente inactivado');
        } catch (err) {
            setError(err.message || 'No se pudo actualizar el estado del paciente');
        } finally {
            setTogglingPatientId(null);
        }
    }

    async function handleCreateAdmin(e) {
        e.preventDefault();
        const { nombre, apellido, email, password, dni } = newAdmin;
        if (!nombre || !email || !password) {
            setError('Completá nombre, email y contraseña');
            return;
        }
        try {
            await api('/users', {
                method: 'POST',
                token,
                body: { nombre, apellido, email, password, dni: dni || null }
            });
            setNewAdmin({ nombre: '', apellido: '', email: '', password: '', dni: '' });
            setMessage('Administrador creado exitosamente');
            await loadAll();
        } catch (err) {
            setError(err.message || 'Error al crear el administrador');
        }
    }

    async function handleToggleUserStatus(id, isActive) {
        if (id === currentUser.id) {
            setError('No podés inactivar tu propia cuenta desde aquí');
            return;
        }

        const actionLabel = isActive ? 'inactivar' : 'activar';
        const confirmed = window.confirm(`¿Seguro que querés ${actionLabel} a este usuario?`);
        if (!confirmed) return;

        setTogglingUserId(id);
        try {
            const result = await api(`/users/${id}/status`, {
                method: 'PATCH',
                token
            });
            setUsers(prev => prev.map(u => (u.id === id ? { ...u, activo: result.activo } : u)));
            setPatients(prev => prev.map(p => (p.id === id ? { ...p, activo: result.activo } : p)));
            setMessage(result.activo ? 'Usuario activado' : 'Usuario inactivado');
        } catch (err) {
            setError(err.message || 'No se pudo actualizar el estado del usuario');
        } finally {
            setTogglingUserId(null);
        }
    }

    async function handleUpdateUserRole(userId, newRole) {
        const confirmed = window.confirm(`¿Convertir este usuario a ${newRole === 'ADMIN' ? 'Administrador' : newRole === 'MEDICO' ? 'Médico' : 'Paciente'}?`);
        if (!confirmed) return;

        setUpdatingUserId(userId);
        try {
            const updatedUser = await api(`/users/${userId}/role`, {
                method: 'PATCH',
                token,
                body: { role: newRole }
            });
            setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
            setMessage(`Usuario convertido a ${newRole === 'ADMIN' ? 'Administrador' : newRole === 'MEDICO' ? 'Médico' : 'Paciente'}`);
            await loadAll(); // Recargar todo para actualizar listas de doctores/pacientes
        } catch (err) {
            setError(err.message || 'No se pudo actualizar el rol del usuario');
        } finally {
            setUpdatingUserId(null);
        }
    }

    function startEditUser(user) {
        setEditingUser(user);
        setEditUserForm({
            nombre: user.nombre || '',
            apellido: user.apellido || '',
            email: user.email || '',
            dni: user.dni || '',
            password: ''
        });
    }

    function cancelEditUser() {
        setEditingUser(null);
        setEditUserForm({ nombre: '', apellido: '', email: '', dni: '', password: '' });
    }

    async function handleUpdateUser(e) {
        e.preventDefault();
        if (!editingUser) return;

        const { nombre, apellido, email, dni, password } = editUserForm;
        if (!nombre || !email) {
            setError('Nombre y email son requeridos');
            return;
        }

        if (password && password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setUpdatingUserId(editingUser.id);
        try {
            const updatedUser = await api(`/users/${editingUser.id}`, {
                method: 'PUT',
                token,
                body: {
                    nombre,
                    apellido: apellido || '',
                    email,
                    dni: dni || null,
                    password: password || undefined
                }
            });
            setUsers(prev => prev.map(u => (u.id === editingUser.id ? updatedUser : u)));
            setMessage('Usuario actualizado exitosamente');
            cancelEditUser();
            await loadAll();
        } catch (err) {
            setError(err.message || 'No se pudo actualizar el usuario');
        } finally {
            setUpdatingUserId(null);
        }
    }

    function renderUsers() {
        const roleLabels = { ADMIN: 'Administrador', MEDICO: 'Médico', PACIENTE: 'Paciente' };

        const filteredUsers = users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter);
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        const startIndex = (currentPage - 1) * usersPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

        const goToPage = (page) => {
            if (page >= 1 && page <= totalPages) setCurrentPage(page);
        };

        return (
            <div className="admin-users">
                <div className="admin-form-card">
                    <h3>Crear nuevo administrador</h3>
                    <form onSubmit={handleCreateAdmin} className="admin-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="text" placeholder="Nombre *" value={newAdmin.nombre} onChange={(e) => setNewAdmin({ ...newAdmin, nombre: e.target.value })} required />
                            <input type="text" placeholder="Apellido" value={newAdmin.apellido} onChange={(e) => setNewAdmin({ ...newAdmin, apellido: e.target.value })} />
                        </div>
                        <input type="email" placeholder="Email *" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="password" placeholder="Contraseña * (mín. 8 caracteres)" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} required minLength={8} />
                            <input type="text" placeholder="DNI (opcional)" value={newAdmin.dni} onChange={(e) => setNewAdmin({ ...newAdmin, dni: e.target.value })} />
                        </div>
                        <div className="admin-form-actions">
                            <button type="submit" className="submit-btn">Crear administrador</button>
                        </div>
                    </form>
                </div>

                <div className="admin-table-card">
                    <div className="admin-table-header">
                        <h3>Usuarios registrados</h3>
                        <span>Mostrando {paginatedUsers.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + usersPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios</span>
                    </div>
                    <div className="admin-doctor-filters">
                        <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setCurrentPage(1); }}>
                            <option value="ALL">Todos los roles</option>
                            <option value="ADMIN">Administradores</option>
                            <option value="MEDICO">Médicos</option>
                            <option value="PACIENTE">Pacientes</option>
                        </select>
                    </div>
                    <div className="admin-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>DNI</th>
                                    <th>Rol actual</th>
                                    <th>Fecha registro</th>
                                    <th style={{ textAlign: 'right', minWidth: '300px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No hay usuarios para mostrar</td></tr>
                                ) : paginatedUsers.map(user => {
                                    const isActive = user.activo !== null && user.activo !== undefined ? user.activo : true;
                                    return (
                                        <tr key={user.id}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.dni || '—'}</td>
                                            <td>
                                                <span className={`admin-status-badge ${user.role === 'ADMIN' ? 'active' : user.role === 'MEDICO' ? '' : 'inactive'}`}>
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td>{user.creado ? new Date(user.creado).toLocaleDateString('es-ES') : '—'}</td>
                                            <td className="actions">
                                                <div className="admin-actions-group">
                                                    <button type="button" className="admin-action-btn primary" disabled={updatingUserId === user.id || editingUser?.id === user.id} onClick={() => startEditUser(user)}>
                                                        Modificar
                                                    </button>
                                                    <div className="admin-role-buttons">
                                                        {user.role !== 'ADMIN' && (
                                                            <button type="button" className="admin-action-btn small" disabled={updatingUserId === user.id} onClick={() => handleUpdateUserRole(user.id, 'ADMIN')} title="Convertir a Administrador">
                                                                {updatingUserId === user.id ? '...' : 'Admin'}
                                                            </button>
                                                        )}
                                                        {user.role !== 'MEDICO' && (
                                                            <button type="button" className="admin-action-btn small" disabled={updatingUserId === user.id} onClick={() => handleUpdateUserRole(user.id, 'MEDICO')} title="Convertir a Médico">
                                                                {updatingUserId === user.id ? '...' : 'Médico'}
                                                            </button>
                                                        )}
                                                        {user.role !== 'PACIENTE' && (
                                                            <button type="button" className="admin-action-btn small" disabled={updatingUserId === user.id} onClick={() => handleUpdateUserRole(user.id, 'PACIENTE')} title="Convertir a Paciente">
                                                                {updatingUserId === user.id ? '...' : 'Paciente'}
                                                            </button>
                                                        )}
                                                        <button type="button" className={`admin-action-btn small ${isActive ? 'danger' : ''}`} disabled={togglingUserId === user.id || updatingUserId === user.id || user.id === currentUser.id} onClick={() => handleToggleUserStatus(user.id, isActive)} title={isActive ? 'Inactivar usuario' : 'Activar usuario'}>
                                                            {togglingUserId === user.id ? '...' : (isActive ? 'Inactivar' : 'Activar')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <button type="button" className="admin-pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Anterior</button>
                            <div className="admin-pagination-pages">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return <button key={page} type="button" className={`admin-pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>{page}</button>;
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="admin-pagination-ellipsis">...</span>;
                                    }
                                    return null;
                                })}
                            </div>
                            <button type="button" className="admin-pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente →</button>
                        </div>
                    )}
                </div>

                {editingUser && (
                    <div className="admin-modal-overlay" onClick={cancelEditUser}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h3>Modificar datos de usuario</h3>
                                <button type="button" className="admin-modal-close" onClick={cancelEditUser}>×</button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="admin-form">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input type="text" placeholder="Nombre *" value={editUserForm.nombre} onChange={(e) => setEditUserForm({ ...editUserForm, nombre: e.target.value })} required />
                                    <input type="text" placeholder="Apellido" value={editUserForm.apellido} onChange={(e) => setEditUserForm({ ...editUserForm, apellido: e.target.value })} />
                                </div>
                                <input type="email" placeholder="Email *" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input type="password" placeholder="Nueva contraseña (dejar vacío para no cambiar)" value={editUserForm.password} onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })} minLength={8} />
                                    <input type="text" placeholder="DNI" value={editUserForm.dni} onChange={(e) => setEditUserForm({ ...editUserForm, dni: e.target.value })} />
                                </div>
                                <div className="admin-form-actions">
                                    <button type="button" className="admin-secondary-btn" onClick={cancelEditUser}>Cancelar</button>
                                    <button type="submit" className="submit-btn" disabled={updatingUserId === editingUser.id}>
                                        {updatingUserId === editingUser.id ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- [NUEVO] FUNCIÓN DE RENDERIZADO DE LA TABLA DE TURNOS ---
    function renderAppointments() {
        return (
            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h3>Gestión de Turnos</h3>
                    <span>{adminAppointments.length} turnos encontrados</span>
                </div>
                
                <div className="admin-doctor-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <select 
                        value={appointmentFilters.status} 
                        onChange={(e) => setAppointmentFilters({...appointmentFilters, status: e.target.value})}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="Atendido">Atendido</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>

                    <select 
                        value={appointmentFilters.doctor_id} 
                        onChange={(e) => setAppointmentFilters({...appointmentFilters, doctor_id: e.target.value})}
                    >
                        <option value="">Todos los Médicos</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name} - {toTitleCase(doc.specialty)}</option>
                        ))}
                    </select>

                    <input 
                        type="date" 
                        value={appointmentFilters.date} 
                        onChange={(e) => setAppointmentFilters({...appointmentFilters, date: e.target.value})}
                    />
                    
                    <button 
                        type="button"
                        className="admin-secondary-btn" 
                        onClick={() => setAppointmentFilters({ status: '', doctor_id: '', date: '' })}
                    >
                        Limpiar Filtros
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Fecha y Hora</th>
                            <th>Paciente</th>
                            <th>Médico</th>
                            <th>Especialidad</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminAppointments.length > 0 ? adminAppointments.map((apt) => (
                            <tr key={apt.id}>
                                <td>{new Date(apt.date).toLocaleDateString('es-ES')} - {apt.time}</td>
                                <td>{apt.patient_name} <br/><small>{apt.patient_email}</small></td>
                                <td>{apt.doctor_name}</td>
                                <td>{apt.specialty_name}</td>
                                <td>
                                    <span className={`status ${(apt.status || 'Pendiente').toLowerCase()}`}>
                                        {apt.status || 'Pendiente'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron turnos con los filtros seleccionados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    // --- ESTADOS PARA REPORTES (HU-IN20) ---
    const [reportFilters, setReportFilters] = useState({ startDate: '', endDate: '' });
    const [reportData, setReportData] = useState([]);
    const [reportGenerated, setReportGenerated] = useState(false);

    async function generateReport() {
        if (!reportFilters.startDate || !reportFilters.endDate) {
            setError('Seleccioná un rango de fechas de Inicio y Fin.');
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('start_date', reportFilters.startDate);
            params.append('end_date', reportFilters.endDate);
            
            const data = await api(`/appointments/all?${params.toString()}`, { token });
            setReportData(data || []);
            setReportGenerated(true);
        } catch (err) {
            setError('Error al generar informe: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    function renderReports() {
        const totalTurnos = reportData.length;
        const atendidos = reportData.filter(t => t.status === 'Atendido').length;
        const cancelados = reportData.filter(t => t.status === 'Cancelado').length;
        const confirmados = reportData.filter(t => t.status === 'Confirmado').length;
        const pendientes = reportData.filter(t => t.status === 'Pendiente').length;
        
        let ausentismo = 0;
        if (totalTurnos > 0) {
            // Se calcula como todo lo cancelado/ausente.
            ausentismo = ((cancelados / totalTurnos) * 100).toFixed(1);
        }

        const metricsByDoctor = {};
        reportData.forEach(t => {
            if (!metricsByDoctor[t.doctor_name]) metricsByDoctor[t.doctor_name] = { total: 0, atendidos: 0, cancelados: 0 };
            metricsByDoctor[t.doctor_name].total += 1;
            if (t.status === 'Atendido') metricsByDoctor[t.doctor_name].atendidos += 1;
            if (t.status === 'Cancelado') metricsByDoctor[t.doctor_name].cancelados += 1;
        });

        // Configuración Gráfico de Torta por CSS sin librerias
        let conicGradient = '';
        if (totalTurnos > 0) {
            let current = 0;
            const parts = [];
            const colores = [
                { val: (atendidos / totalTurnos) * 100, color: '#4caf50' },
                { val: (cancelados / totalTurnos) * 100, color: '#f44336' },
                { val: (confirmados / totalTurnos) * 100, color: '#2196f3' },
                { val: (pendientes / totalTurnos) * 100, color: '#ff9800' }
            ];
            
            for(let c of colores) {
                if (c.val > 0) {
                    parts.push(`${c.color} ${current}% ${current + c.val}%`);
                    current += c.val;
                }
            }
            conicGradient = parts.join(', ');
        }

        return (
            <div className="admin-table-card">
                {/* Estilos para que funcione la Exportación Nativa PDF con Control-P o Botón */}
                <style>
                    {`
                    @media print {
                        body * { visibility: hidden; }
                        .print-report-area, .print-report-area * { visibility: visible; }
                        .print-report-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
                        .hide-on-print { display: none !important; }
                        .admin-dashboard, .admin-sidebar, nav, header { display: none !important; }
                    }
                    `}
                </style>
                
                <div className="admin-table-header hide-on-print">
                    <h3>Informe de Productividad (Director Médico)</h3>
                    <span>Seleccione un rango para generar KPIs</span>
                </div>
                
                <div className="admin-doctor-filters hide-on-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                       <label style={{fontSize:'12px', color:'#777'}}>Fecha Inicio</label>
                       <input type="date" value={reportFilters.startDate} onChange={e => setReportFilters({...reportFilters, startDate: e.target.value})} style={{padding: '8px'}} />
                    </div>
                    <div style={{display:'flex', flexDirection:'column'}}>
                       <label style={{fontSize:'12px', color:'#777'}}>Fecha Fin</label>
                       <input type="date" value={reportFilters.endDate} onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})} style={{padding: '8px'}} />
                    </div>
                    <button className="submit-btn" style={{alignSelf: 'flex-end', height:'35px'}} onClick={generateReport} disabled={loading}>
                        {loading ? 'Generando...' : 'Generar Informe'}
                    </button>
                    {reportGenerated && (
                        <button className="admin-secondary-btn" style={{alignSelf: 'flex-end', height:'35px'}} onClick={() => window.print()}>
                            📄 Exportar a PDF
                        </button>
                    )}
                </div>

                {reportGenerated && (
                    <div className="print-report-area" style={{ background: '#fff', borderRadius: '8px' }}>
                        <div style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                           <h2 style={{ textAlign: 'center', margin: 0 }}>Reporte de Productividad y Desempeño</h2>
                           <p style={{ textAlign: 'center', color: '#666', marginTop: '5px' }}>Período evaluado: {new Date(reportFilters.startDate + 'T00:00:00').toLocaleDateString()} al {new Date(reportFilters.endDate + 'T00:00:00').toLocaleDateString()}</p>
                           <p style={{ textAlign: 'center', color: '#aaa', fontSize: '12px' }}>Metadatos de Exportación - Generado el: {new Date().toLocaleString()}</p>
                        </div>
                        
                        <div className="admin-stats-grid" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                            <div className="admin-stat-card" style={{ flex: '1', textAlign: 'center', background: '#f8f9fa', padding: '15px' }}>
                                <span className="label" style={{display:'block'}}>Total de Turnos Procesados</span>
                                <strong style={{fontSize:'24px', color:'#333'}}>{totalTurnos}</strong>
                            </div>
                            <div className="admin-stat-card" style={{ flex: '1', textAlign: 'center', background: '#f8f9fa', padding: '15px' }}>
                                <span className="label" style={{display:'block'}}>Tasa Global de Ausentismo</span>
                                <strong style={{fontSize:'24px', color:'#f44336'}}>{ausentismo}%</strong>
                            </div>
                        </div>

                        {totalTurnos > 0 ? (
                            <>
                                <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Distribución General por Estado</h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', marginTop: '20px' }}>
                                    <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: `conic-gradient(${conicGradient})`, border: '1px solid #ccc' }}></div>
                                    <div style={{ marginLeft: '40px', fontSize: '16px' }}>
                                        <div style={{margin: '8px 0'}}><span style={{ display:'inline-block', width:'15px', height:'15px', background:'#4caf50', marginRight:'10px'}}></span> Atendidos: <strong>{atendidos}</strong></div>
                                        <div style={{margin: '8px 0'}}><span style={{ display:'inline-block', width:'15px', height:'15px', background:'#f44336', marginRight:'10px'}}></span> Cancelados: <strong>{cancelados}</strong></div>
                                        <div style={{margin: '8px 0'}}><span style={{ display:'inline-block', width:'15px', height:'15px', background:'#2196f3', marginRight:'10px'}}></span> Confirmados: <strong>{confirmados}</strong></div>
                                        <div style={{margin: '8px 0'}}><span style={{ display:'inline-block', width:'15px', height:'15px', background:'#ff9800', marginRight:'10px'}}></span> Pendientes: <strong>{pendientes}</strong></div>
                                    </div>
                                </div>
                                
                                <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Desempeño y Productividad por Profesional</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f1f1' }}>
                                            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #ccc' }}>Médico</th>
                                            <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #ccc' }}>Atendidos</th>
                                            <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #ccc' }}>Cancelados</th>
                                            <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid #ccc' }}>Total Asignados</th>
                                            <th style={{ textAlign: 'right', padding: '10px', borderBottom: '2px solid #ccc' }}>Índice Resolución</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(metricsByDoctor).map(docName => {
                                            const m = metricsByDoctor[docName];
                                            const prod = m.total > 0 ? ((m.atendidos / m.total) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={docName} >
                                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>{docName}</strong></td>
                                                    <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>{m.atendidos}</td>
                                                    <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #eee', color: m.cancelados > 0 ? '#f44336' : 'inherit' }}>{m.cancelados}</td>
                                                    <td style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>{m.total}</td>
                                                    <td style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid #eee' }}>
                                                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: prod > 70 ? '#e8f5e9' : '#ffebee', color: prod > 70 ? '#2e7d32' : '#c62828' }}>
                                                            {prod}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#fafafa' }}>No se registraron turnos en este periodo.</div>
                        )}
                    </div>
                )}
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
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'appointments' && renderAppointments()} 
                {activeTab === 'reports' && renderReports()}
            </section>
        </div>
    );
}