const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const tagRoutes = require('./routes/tagRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to database
initializeDatabase();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Allow requests from your frontend domains
    const allowedOrigins = [
      'http://localhost:3000', // Local development
      'https://backend3-project.vercel.app', // Your backend domain (if serving frontend too)
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add specific headers for preflight requests
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/teams', teamRoutes);
app.use('/projects', projectRoutes);
app.use('/tags', tagRoutes);
app.use('/report', reportRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Workasana API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;