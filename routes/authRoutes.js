const express = require('express'); 
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user
    const user = new User({ name, email, password });
    await user.save();
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      message: 'User created successfully', 
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login with password authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;