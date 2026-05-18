const alertModel = require('../models/alertModel');
const { successResponse, errorResponse } = require('../utils/response');

const createAlert = async (req, res, next) => {
  try {
    const { fir_id, alert_type, message, assigned_to, priority, deadline } = req.body;
    
    const alertData = {
      fir_id,
      alert_type,
      message,
      assigned_to,
      priority: priority || 'Medium',
      deadline
    };

    const newAlert = await alertModel.create(alertData);
    return successResponse(res, 201, 'Alert created successfully', { alert: newAlert });
  } catch (err) {
    next(err);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const { status, priority, assigned_to } = req.query;
    
    // Restrict IO
    let filterAssignedTo = assigned_to;
    if (req.user.role.toLowerCase() === 'investigation officer') {
      filterAssignedTo = req.user.id;
    }

    const filters = {
      status,
      priority,
      assigned_to: filterAssignedTo
    };

    const alerts = await alertModel.findAll(filters);
    return successResponse(res, 200, 'Alerts fetched successfully', { alerts });
  } catch (err) {
    next(err);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await alertModel.findById(req.params.id);
    if (!alert) {
      return errorResponse(res, 404, 'Alert not found');
    }
    
    // Check IO access
    if (req.user.role.toLowerCase() === 'investigation officer' && alert.assigned_to !== req.user.id) {
       return errorResponse(res, 403, 'Not authorized to view this alert');
    }

    return successResponse(res, 200, 'Alert fetched successfully', { alert });
  } catch (err) {
    next(err);
  }
};

const updateAlert = async (req, res, next) => {
  try {
    const alert = await alertModel.findById(req.params.id);
    if (!alert) {
      return errorResponse(res, 404, 'Alert not found');
    }

    if (req.user.role.toLowerCase() === 'investigation officer' && alert.assigned_to !== req.user.id) {
       return errorResponse(res, 403, 'Not authorized to update this alert');
    }

    const updatedAlert = await alertModel.update(req.params.id, req.body);
    return successResponse(res, 200, 'Alert updated successfully', { alert: updatedAlert });
  } catch (err) {
    next(err);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const alert = await alertModel.findById(req.params.id);
    if (!alert) {
      return errorResponse(res, 404, 'Alert not found');
    }

    await alertModel.delete(req.params.id);
    return successResponse(res, 200, 'Alert deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert
};
