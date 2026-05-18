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
  try {
    const { name, email, password, role, sector, phone } = req.body;

    const userExists = await userModel.findByEmail(email);
    if (userExists) {
      return errorResponse(res, 400, 'User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name, email, password: hashedPassword, role, sector, phone
    });

    const token = generateToken(user.id);
    return successResponse(res, 201, 'User registered successfully', { user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (!user.is_active) {
       return errorResponse(res, 401, 'Account deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user.id);
    
    // Remove password from response
    delete user.password;
    
    return successResponse(res, 200, 'Logged in successfully', { user, token });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    return successResponse(res, 200, 'Profile fetched', { user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findByEmail(req.user.email);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return errorResponse(res, 400, 'Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.updatePassword(user.id, hashedPassword);

    return successResponse(res, 200, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword
};
