const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');
const { errorResponse } = require('../utils/response');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Not authorized to access this route. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const [user] = await db.select({
      id: users.id,
      uuid: users.uuid,
      name: users.name,
      email: users.email,
      role: users.role,
      sector: users.sector,
      is_active: users.is_active
    }).from(users).where(eq(users.id, decoded.id));
    
    if (!user) {
      return errorResponse(res, 401, 'The user belonging to this token no longer exists.');
    }
    
    if (!user.is_active) {
       return errorResponse(res, 401, 'User account is deactivated.');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    return errorResponse(res, 401, 'Not authorized to access this route. Invalid token.');
  }
};

module.exports = { protect };
