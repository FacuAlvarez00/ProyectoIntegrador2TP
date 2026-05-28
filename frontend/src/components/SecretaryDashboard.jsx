import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function SecretaryDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 25;

    // Filtros
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

    const token = localStorage.getItem('token');

    useEffect(() => {
        api('/doctors', { token }).then(data => setDoctors(data || [])).catch(() => {});
    }, []);

    useEffect(() => {
        loadAppointments();
        // eslint-disable-next-line
    }, [selectedDoctor, selectedDate]);

    async function loadAppointments() {
        setLoading(true);
        const t0 = performance.now();
        try {
            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (selectedDoctor) params.append('doctor_id', selectedDoctor);
            
            const data = await api(`/appointments/all?${params.toString()}`, { token });
            setAppointments(data || []);
            setPage(1); 
        } catch (err) {
            console.error('Error consultando turnos:', err);
        } finally {
            const t1 = performance.now();
            console.log(`Carga de turnos respondida en ${Math.round(t1 - t0)} ms.`); 
            setLoading(false);
        }
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
                    {isToday && " (Hoy)"}
                 </p>
               </div>
            </header>

            <section className="admin-content">
                <div className="admin-table-card">
                    
                    {/* FILTROS (Fecha y Médico) */}
                    <div className="admin-doctor-filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Fecha de Operación:</label>
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)} 
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        
                        <div style={{ flex: '1' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Filtrar por Médico:</label>
                            <select 
                                value={selectedDoctor} 
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="">Todos los médicos</option>
                                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                            </select>
                        </div>

                        <div style={{ alignSelf: 'flex-end' }}>
                            <button className="admin-secondary-btn" onClick={loadAppointments} disabled={loading} style={{ height: '37px' }}>
                                {loading ? 'Actualizando...' : 'Refrescar Información'}
                            </button>
                        </div>
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
                                            <td>{apt.patient_name} <br/><small>{apt.patient_email}</small></td>
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
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '25px', color: '#666' }}>
                                            No existen turnos agendados en la fecha {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES')} para este filtro.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Paginador (25 ítems) */}
                    {totalPages > 1 && (
                        <div className="admin-pagination" style={{ marginTop: '15px', justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                            <button className="admin-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>? Anterior</button>
                            <span className="admin-pagination-pages" style={{ margin: '0 15px' }}>Página {page} de {totalPages}</span>
                            <button className="admin-pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente ?</button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}