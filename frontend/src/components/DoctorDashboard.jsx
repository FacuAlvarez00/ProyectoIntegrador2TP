import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalReason, setModalReason] = useState('');
    const [modalError, setModalError] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        loadAppointments();
    }, []);

    useEffect(() => {
        if (feedback || error) {
            const timer = setTimeout(() => {
                setFeedback('');
                setError('');
            }, 4000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [feedback, error]);

    async function loadAppointments() {
        setLoading(true);
        try {
            const data = await api('/appointments/doctor/my', { token });
            setAppointments(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message || 'No se pudieron cargar los turnos');
        } finally {
            setLoading(false);
        }
    }

    function openCancelModal(appointment) {
        setSelectedAppointment(appointment);
        setModalReason('');
        setModalError('');
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setSelectedAppointment(null);
        setModalReason('');
        setModalError('');
    }

    async function confirmCancel() {
        if (!modalReason || modalReason.trim().length < 5) {
            setModalError('Ingresá un motivo (mínimo 5 caracteres)');
            return;
        }
        try {
            await api(`/appointments/${selectedAppointment.id}/doctor-cancel`, {
                method: 'POST',
                token,
                body: { reason: modalReason.trim() }
            });
            setFeedback('Turno cancelado correctamente');
            closeModal();
            await loadAppointments();
        } catch (err) {
            setModalError(err.message || 'No se pudo cancelar el turno');
        }
    }

    // Parser robusto para distintos formatos que pueda devolver la API
    function parseDateValue(value) {
        if (!value) return null;
        if (value instanceof Date) return value;
        const s = String(value);

        // Si es un número (timestamp)
        if (/^\d+$/.test(s)) {
            const n = Number(s);
            return n < 1e12 ? new Date(n * 1000) : new Date(n);
        }

        // ISO completo (con T y opcional Z) -> Date lo entiende directamente
        let d = new Date(s);
        if (!isNaN(d)) return d;

        // Reemplazar espacio entre fecha y hora por 'T' (ej: "YYYY-MM-DD HH:mm:ss")
        d = new Date(s.replace(' ', 'T'));
        if (!isNaN(d)) return d;

        // Intentar parseo manual YYYY-MM-DD [HH:MM:SS]
        const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
        if (m) {
            const datePart = m[1];
            const timePart = m[2] || '00:00:00';
            d = new Date(`${datePart}T${timePart}`);
            if (!isNaN(d)) return d;
        }

        return null;
    }

    function formatDate(dateString) {
        const d = parseDateValue(dateString);
        if (!d) return 'Fecha inválida';
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <div className="doctor-dashboard">
            <header className="doctor-header">
                <div>
                    <h1>Agenda del Médico</h1>
                    <p>Revisá los turnos asignados y gestioná cancelaciones con motivo.</p>
                </div>
                <button
                    type="button"
                    className="doctor-refresh-btn"
                    onClick={loadAppointments}
                    disabled={loading}
                >
                    {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
            </header>

            {feedback && <div className="doctor-feedback success">{feedback}</div>}
            {error && <div className="doctor-feedback error">{error}</div>}

            <div className="doctor-table-card">
                <div className="doctor-table-header">
                    <h3>Turnos programados</h3>
                    <span>{appointments.length} turnos</span>
                </div>

                {loading ? (
                    <div className="doctor-loading">Cargando turnos...</div>
                ) : appointments.length === 0 ? (
                    <div className="doctor-empty">No tenés turnos asignados por el momento.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Documento</th>
                                <th>Email</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Especialidad</th>
                                <th>Estado</th>
                                <th>Motivo cancelación</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(apt => (
                                <tr key={apt.id}>
                                    <td>{apt.patient_name}</td>
                                    <td>{apt.patient_dni || '—'}</td>
                                    <td>{apt.patient_email}</td>
                                    <td>{formatDate(apt.date)}</td>
                                    <td>{apt.time}</td>
                                    <td>{apt.specialty_name}</td>
                                    <td>
                                        <span className={`doctor-status ${apt.status.toLowerCase()}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td>{apt.cancel_reason || '—'}</td>
                                    <td className="doctor-actions">
                                        {apt.status !== 'Cancelado' ? (
                                            <button
                                                type="button"
                                                className="doctor-cancel-btn"
                                                onClick={() => openCancelModal(apt)}
                                            >
                                                Cancelar
                                            </button>
                                        ) : (
                                            <small className="doctor-cancelled-by">
                                                {apt.cancel_actor === 'MEDICO' ? 'Cancelado por vos' : apt.cancel_actor === 'PACIENTE' ? 'Cancelado por paciente' : 'Cancelado'}
                                            </small>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && (
                <div className="doctor-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="doctor-modal">
                        <h3>Cancelar turno</h3>
                        <p>
                            Paciente: <strong>{selectedAppointment?.patient_name}</strong>
                        </p>
                        <p>
                            Fecha: {selectedAppointment ? formatDate(selectedAppointment.date) : ''} - {selectedAppointment?.time}
                        </p>
                        <label className="doctor-modal-label" htmlFor="cancel-reason">
                            Motivo de cancelación
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={modalReason}
                            onChange={(e) => {
                                setModalReason(e.target.value);
                                setModalError('');
                            }}
                            placeholder="Ej: la agenda del día se encuentra cerrada por emergencia"
                            rows={4}
                        />
                        {modalError && <div className="doctor-modal-error">{modalError}</div>}
                        <div className="doctor-modal-actions">
                            <button type="button" className="doctor-secondary-btn" onClick={closeModal}>
                                Volver
                            </button>
                            <button type="button" className="doctor-danger-btn" onClick={confirmCancel}>
                                Confirmar cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}