const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, email, profileEmoji } = req.body;

    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this username or email already exists' 
      });
    }

    // Create new user (password hashed by pre-save hook)
    const newUser = new User({
      username,
      password,
      role: role || 'student',
      email,
      profileEmoji: profileEmoji || '👤'
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      message: 'User registered successfully!',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        profileEmoji: newUser.profileEmoji
      }
    });
  } catch (err) {
    console.error('Registration error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ 
      message: 'Server error during registration',
      error: err.message,
      code: err.code
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);

    // Find user
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found, comparing password');

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Password matched, generating token');

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log('Login successful for user:', username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profileEmoji: user.profileEmoji
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error during login',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;