import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

app.use(errorHandler);
export default app;
