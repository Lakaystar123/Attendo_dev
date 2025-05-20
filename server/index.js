const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('node:path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy setting for rate limiter
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for file uploads
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // More requests allowed for authenticated users
    if (req.user) {
      // Even more requests allowed for student attendance and timetable endpoints
      if (req.path.includes('/attendance/student') || req.path.includes('/timetable/student')) {
        return 600; // 600 requests per 15 minutes for student views
      }
      return 300; // 300 requests per 15 minutes for other authenticated users
    }
    return 100; // 100 requests per 15 minutes for unauthenticated users
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// Apply rate limiting to all routes except health check
app.use('/api/v1', limiter);

// Logging
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with improved configuration
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance-app';

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📚 Database:', mongoose.connection.name);
    console.log('🔌 Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit process on DB connection failure
  });

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📚 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from DB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⏏️ Mongoose connection closed due to app termination');
  process.exit(0);
});

// API Routes with versioning
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/timetable', require('./routes/timetable'));
app.use('/api/v1/students', require('./routes/students'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/leaves', require('./routes/leaves'));
app.use('/api/v1/teacher', require('./routes/teacher'));
app.use('/api/v1/classes', require('./routes/classes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name,
    dbHost: mongoose.connection.host
  });
});

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  // Static files middleware
  app.use(express.static(clientBuildPath, {
    maxAge: '1y', // Enable long-term caching
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // React app fallback route (for client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'), err => {
      if (err) {
        console.error('Error sending React index.html:', err);
        res.status(500).send(err);
      }
    });
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  server.close(() => process.exit(1));
});