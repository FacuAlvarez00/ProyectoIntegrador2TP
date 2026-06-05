import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    const cols = [
        { key: 'time', label: 'Hora' },
        { key: 'patient_name', label: 'Paciente' },
        { key: 'patient_email', label: 'Email Paciente' },
        { key: 'doctor_name', label: 'Médico' },
        { key: 'specialty_name', label: 'Especialidad' },
        { key: 'status', label: 'Estado' },
    ];
    const header = cols.map(c => c.label).join(',');
    const rows = data.map(row =>
        cols.map(c => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function SecretaryDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 25;

    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [selectedStatus, setSelectedStatus] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        api('/doctors', { token }).then(data => setDoctors(data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        loadAppointments();
        // eslint-disable-next-line
    }, [selectedDoctor, selectedDate, selectedStatus]);

    async function loadAppointments() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (selectedDoctor) params.append('doctor_id', selectedDoctor);
            if (selectedStatus) params.append('status', selectedStatus);

            const data = await api(`/appointments/all?${params.toString()}`, { token });
            setAppointments(data || []);
            setPage(1);
        } catch (err) {
            console.error('Error consultando turnos:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleExportCSV() {
        const fecha = selectedDate || new Date().toLocaleDateString('en-CA');
        exportToCSV(appointments, `turnos_${fecha}.csv`);
    }

    const isToday = selectedDate === new Date().toLocaleDateString('en-CA');
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedAppointments = appointments.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(appointments.length / itemsPerPage);

    return (
        <div className="admin-dashboard">
            <header className="admin-dashboard-header">
               <div>
                 <h1>Gestión Operativa de Turnos</h1>
                 <p>
                    Revisando los turnos programados para el
                    <strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES')}</strong>
                    {isToday && ' (Hoy)'}
                 </p>
               </div>
            </header>

            <section className="admin-content">
                <div className="admin-table-card">

                    <div className="admin-doctor-filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#9cc1ff', marginBottom: '5px' }}>Fecha de Operación:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>

                        <div style={{ flex: '1', minWidth: '180px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#9cc1ff', marginBottom: '5px' }}>Médico:</label>
                            <select
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="">Todos los médicos</option>
                                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#9cc1ff', marginBottom: '5px' }}>Estado:</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="Atendido">Atendido</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="admin-secondary-btn" onClick={loadAppointments} disabled={loading}>
                                {loading ? 'Actualizando...' : 'Refrescar'}
                            </button>
                            <button
                                className="admin-secondary-btn"
                                onClick={handleExportCSV}
                                disabled={appointments.length === 0}
                                title="Exportar resultados actuales a CSV"
                            >
                                Exportar CSV
                            </button>
                        </div>
                    </div>

                    <div className="admin-table-header" style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#9cc1ff', fontSize: '0.9rem' }}>
                            {appointments.length} turno{appointments.length !== 1 ? 's' : ''} encontrado{appointments.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="admin-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Hora</th>
                                    <th>Paciente</th>
                                    <th>Médico</th>
                                    <th>Especialidad</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && appointments.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px' }}>Cargando información del sistema...</td></tr>
                                ) : paginatedAppointments.length > 0 ? (
                                    paginatedAppointments.map(apt => (
                                        <tr key={apt.id}>
                                            <td><strong>{apt.time}</strong></td>
                                            <td>{apt.patient_name}<br/><small>{apt.patient_email}</small></td>
                                            <td>{apt.doctor_name}</td>
                                            <td>{apt.specialty_name}</td>
                                            <td>
                                                <span className={`status ${(apt.status || 'Pendiente').toLowerCase()}`}>
                                                   {apt.status || 'Pendiente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '25px', color: '#9cc1ff' }}>
                                            No existen turnos para los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <button className="admin-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>← Anterior</button>
                            <div className="admin-pagination-pages">
                                <span style={{ color: '#cbd5f5', padding: '0 8px' }}>Página {page} de {totalPages}</span>
                            </div>
                            <button className="admin-pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente →</button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
