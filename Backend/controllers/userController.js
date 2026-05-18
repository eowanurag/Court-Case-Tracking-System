const userModel = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');
const bcrypt = require('bcrypt');

const createUser = async (req, res, next) => {
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

    return successResponse(res, 201, 'User created successfully', { user });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await userModel.findAll();
    return successResponse(res, 200, 'Users fetched successfully', { users });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User fetched successfully', { user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const updatedUser = await userModel.update(req.params.id, req.body);
    return successResponse(res, 200, 'User updated successfully', { user: updatedUser });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await userModel.delete(req.params.id);
    return successResponse(res, 200, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return errorResponse(res, 400, 'Password is required');
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userModel.update(req.params.id, { password: hashedPassword });

    return successResponse(res, 200, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetPassword
};
