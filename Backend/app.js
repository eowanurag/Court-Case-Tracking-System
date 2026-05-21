const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5500',
  'https://localhost:5500',
  'http://127.0.0.1:5500',
  'https://127.0.0.1:5500',
  'https://eowanurag.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.startsWith('https://eowanurag.github.io')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware (Morgan for API response tracking)
app.use(morgan('dev'));

// Custom Entry/Exit API Request Tracking
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`\n>>> [API ENTRY] ${req.method} ${req.originalUrl} starting at ${new Date().toISOString()}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`<<< [API EXIT] ${req.method} ${req.originalUrl} completed with Status: ${res.statusCode} inside ${duration}ms\n`);
  });
  
  next();
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/fir', require('./routes/firRoutes'));
app.use('/api/hearings', require('./routes/hearingRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Root/health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Court Case Tracking System API is running successfully!'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
