const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireVerified = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({ error: 'Account verification required' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireVerified
};




















