const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { rateLimiter } = require('./middleware/rateLimiter');
const correlationId = require('./middleware/correlationId');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const recordRoutes = require('./routes/record.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────
// 1. Correlation ID (must be first to propagate to all logs)
app.use(correlationId);

// 2. Security headers
app.use(helmet());

// 3. CORS
app.use(cors());

// 4. Rate limiting
app.use('/api/', rateLimiter);

// 5. Request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: () => process.env.NODE_ENV === 'test',
  })
);

// 6. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Documentation ──────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Dashboard API Docs',
}));

// ─── Health Check ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/export', exportRoutes);

// Audit log routes are mounted under dashboard routes
// /api/v1/dashboard/audit-logs

// ─── 404 Handler ─────────────────────────────────────────────────────
app.use('*', (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// ─── Global Error Handler ────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
