const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header (format: Bearer <token>)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token using JWT_SECRET from config
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Ensure the decoded payload has the required fields
    if (!decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next(); // Proceed to the route handler
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};