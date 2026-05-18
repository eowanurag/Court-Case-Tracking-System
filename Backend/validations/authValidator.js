const { check } = require('express-validator');

const registerValidation = [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role is required').notEmpty().isIn(['admin', 'supervisor', 'legal_team', 'court_staff', 'investigation_officer'])
];

const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

const passwordValidation = [
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
];

module.exports = {
  registerValidation,
  loginValidation,
  passwordValidation
};
