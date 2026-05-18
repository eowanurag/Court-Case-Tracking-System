const { errorResponse } = require('../utils/response');

// Pass an array of allowed roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Not authenticated');
    }
    
    if (!roles.some(r => r.toLowerCase() === req.user.role.toLowerCase())) {
      return errorResponse(res, 403, `User role '${req.user.role}' is not authorized to access this route`);
    }
    
    next();
  };
};

module.exports = { authorize };
