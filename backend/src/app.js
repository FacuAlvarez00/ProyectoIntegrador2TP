import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import especialidadesRoutes from './routes/especialidades.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import specialtiesRoutes from './routes/specialties.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);

app.use(errorHandler);
export default app;
