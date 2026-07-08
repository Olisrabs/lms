import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import logger from './utils/logger';

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes          from './routes/auth.routes';
import usersRoutes         from './routes/users.routes';
import materialsRoutes     from './routes/materials.routes';
import programsRoutes      from './routes/programs.routes';
import assignmentsRoutes   from './routes/assignments.routes';
import attendanceRoutes    from './routes/attendance.routes';
import scheduleRoutes      from './routes/schedule.routes';
import testsRoutes         from './routes/tests.routes';
import gradesRoutes        from './routes/grades.routes';
import groupsRoutes        from './routes/groups.routes';
import capstonesRoutes     from './routes/capstones.routes';
import announcementsRoutes from './routes/announcements.routes';
import notificationsRoutes from './routes/notifications.routes';

// ─── Middleware imports ───────────────────────────────────────────────────────
import { errorHandler, notFound } from './middleware/validation.middleware';

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Configured separately in Nginx/CDN for flexibility
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [config.clientUrl, 'http://localhost:5173', 'http://localhost:4000'];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Compression: gzip all responses > 1KB ────────────────────────────────────
app.use(compression({ threshold: 1024 }));

// ─── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ─── Trust proxy (for IP logging behind Nginx/Render/Railway) ─────────────────
app.set('trust proxy', 1);

// ─── Global rate limiting ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                     // 20 auth attempts per window
  skipSuccessfulRequests: true,
  message: { error: 'Too many authentication attempts.' },
});

app.use(globalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authLimiter, authRoutes);
app.use('/api/v1/users',         usersRoutes);
app.use('/api/v1/materials',     materialsRoutes);
app.use('/api/v1/programs',      programsRoutes);
app.use('/api/v1/assignments',   assignmentsRoutes);
app.use('/api/v1/attendance',    attendanceRoutes);
app.use('/api/v1/schedule',      scheduleRoutes);
app.use('/api/v1/tests',         testsRoutes);
app.use('/api/v1/grades',        gradesRoutes);
app.use('/api/v1/groups',        groupsRoutes);
app.use('/api/v1/capstones',     capstonesRoutes);
app.use('/api/v1/announcements', announcementsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 EduLe API running on port ${PORT} [${config.env}]`);
});

export default app;
