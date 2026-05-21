const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

const register = async (req, res, next) => {
  console.log('[LOGIC ENTRY] authController.register - Registering user:', req.body ? req.body.email : 'No body');
  try {
    const { name, email, password, role, sector, phone } = req.body;

    const userExists = await userModel.findByEmail(email);
    if (userExists) {
      console.log('[LOGIC EXIT] authController.register - User already exists:', email);
      return errorResponse(res, 400, 'User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name, email, password: hashedPassword, role, sector, phone
    });

    const token = generateToken(user.id);
    
    // Set HTTP-only, secure, sameSite: none cookie
    res.cookie('eow_token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    console.log('[LOGIC EXIT] authController.register - User registered successfully:', user.id);
    return successResponse(res, 201, 'User registered successfully', { user, token });
  } catch (err) {
    console.error('[LOGIC ERROR] authController.register failed:', err);
    next(err);
  }
};

const login = async (req, res, next) => {
  console.log('[LOGIC ENTRY] authController.login - User attempting login:', req.body ? req.body.email : 'No body');
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      console.log('[LOGIC EXIT] authController.login - Invalid credentials (user not found)');
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (!user.is_active) {
       console.log('[LOGIC EXIT] authController.login - Account deactivated');
       return errorResponse(res, 401, 'Account deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[LOGIC EXIT] authController.login - Invalid credentials (password mismatch)');
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user.id);
    
    // Set HTTP-only, secure, sameSite: none cookie
    res.cookie('eow_token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Remove password from response
    delete user.password;
    
    console.log('[LOGIC EXIT] authController.login - User logged in successfully:', user.id);
    return successResponse(res, 200, 'Logged in successfully', { user, token });
  } catch (err) {
    console.error('[LOGIC ERROR] authController.login failed:', err);
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  console.log('[LOGIC ENTRY] authController.getProfile - Fetching profile for user ID:', req.user ? req.user.id : 'No user');
  try {
    const user = await userModel.findById(req.user.id);
    console.log('[LOGIC EXIT] authController.getProfile - Profile fetched successfully');
    return successResponse(res, 200, 'Profile fetched', { user });
  } catch (err) {
    console.error('[LOGIC ERROR] authController.getProfile failed:', err);
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  console.log('[LOGIC ENTRY] authController.changePassword - Password change requested for user ID:', req.user ? req.user.id : 'No user');
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findByEmail(req.user.email);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      console.log('[LOGIC EXIT] authController.changePassword - Incorrect current password');
      return errorResponse(res, 400, 'Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.updatePassword(user.id, hashedPassword);

    console.log('[LOGIC EXIT] authController.changePassword - Password updated successfully');
    return successResponse(res, 200, 'Password updated successfully');
  } catch (err) {
    console.error('[LOGIC ERROR] authController.changePassword failed:', err);
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword
};
