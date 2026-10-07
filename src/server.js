const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRateLimiter = require('./middleware/rateLimiter');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ==========================================
// 1. SECURITY & CORS CONFIGURATION
// ==========================================
// Parse allowed frontend origins from FRONTEND_URL env
const allowedOrigins = config.frontendUrl
  ? config.frontendUrl.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server, Postman) where origin is undefined
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error(`CORS policy violation: Origin '${origin}' is not permitted.`);
    error.status = 403;
    return callback(error);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));

// ==========================================
// 2. PARSING & RATE LIMITING
// ==========================================
// Limit body payload size to prevent payload-based memory attacks
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// Apply IP rate limiting to protect all endpoints
app.use(apiRateLimiter);

// ==========================================
// 3. ROUTES
// ==========================================
// Mount document generation endpoints under /api
app.use('/api', apiRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Referral Document Generation Microservice',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: 'GET /api/health',
      certificate: 'POST /api/generate-certificate',
      offerLetter: 'POST /api/generate-offer-letter',
      poster: 'POST /api/generate-poster',
    },
  });
});

// ==========================================
// 4. ERROR HANDLING
// ==========================================
// Catch 404 routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ==========================================
// 5. SERVER BOOTSTRAP
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Document Generation Microservice is running!`);
    console.log(`📡 Port:               ${config.port}`);
    console.log(`🌐 Environment:        ${config.nodeEnv}`);
    console.log(`🔒 Allowed Origin:     ${config.frontendUrl}`);
    console.log(`⚡ Rate Limit:         ${config.rateLimit.max} reqs / ${config.rateLimit.windowMs / 1000}s`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Gracefully terminating server...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
