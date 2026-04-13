import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Importação dos módulos
import authRoutes from './modules/auth/auth.routes';
import membersRoutes from './modules/members/members.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import publicRoutes from './modules/public/public.routes';
import usersRoutes from './modules/users/users.routes';
import deaconsRoutes from './modules/deacons/deacons.routes';
import smallFamiliesRoutes from './modules/small-families/small-families.routes';
import smallFamilyReportsRoutes from './modules/small-family-reports/small-family-reports.routes';
import evangelismoRoutes from './modules/evangelismo/evangelismo.routes';
import { occurrencesRoutes } from './modules/occurrences';
import { cultReportsRoutes } from './modules/cult-reports';
import { aconselhamentosRoutes } from './modules/aconselamentos';
import { pastoralRoomRoutes } from './modules/pastoral-room';
import ministryLeadersRoutes from './modules/ministry-leaders/ministry-leaders.routes';
import cepRoutes from './routes/cep';
import bibleRoutes from './modules/bible/bible.routes';
import seedAdmin from './seed';

const app = express();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de autenticação. Aguarde e tente novamente.' },
});

// Middlewares globais
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/deacons', deaconsRoutes);
app.use('/api/small-families', smallFamiliesRoutes);
app.use('/api/small-family-reports', smallFamilyReportsRoutes);
app.use('/api/evangelismo', evangelismoRoutes);
app.use('/api/ministries', ministryLeadersRoutes);
app.use('/api/occurrences', occurrencesRoutes);
app.use('/api/cult-reports', cultReportsRoutes);
app.use('/api/aconselhamentos', aconselhamentosRoutes);
app.use('/api/pastoral-room', pastoralRoomRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/cep', cepRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);

  // Roda o seed do admin
  await seedAdmin();
});
