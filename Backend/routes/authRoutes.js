const express = require('express');
const router = express.Router();
const { register, login, getProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { registerValidation, loginValidation, passwordValidation } = require('../validations/authValidator');

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, passwordValidation, validateRequest, changePassword);

module.exports = router;
