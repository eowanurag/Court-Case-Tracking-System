const hearingModel = require('../models/hearingModel');
const firModel = require('../models/firModel');
const alertModel = require('../models/alertModel');
const fileModel = require('../models/fileModel');
const { successResponse, errorResponse } = require('../utils/response');

const createHearing = async (req, res, next) => {
  try {
    const { fir_id, hearing_date, next_hearing_date, court_status, remarks, generate_alert } = req.body;
    
    const fir = await firModel.findById(fir_id);
    if (!fir) {
      return errorResponse(res, 404, 'FIR not found');
    }

    const hearingData = {
      fir_id,
      hearing_date,
      next_hearing_date: next_hearing_date || null,
      court_status,
      remarks,
      updated_by: req.user.id
    };

    const newHearing = await hearingModel.create(hearingData);

    // Auto-generate Alert if requested or if status implies it
    const alertStatuses = ['Affidavit Required', 'Evidence Required', 'Compliance Pending'];
    
    if (generate_alert || alertStatuses.includes(court_status)) {
      // Find IO associated with the file
      const file = await fileModel.findById(fir.file_id);
      
      await alertModel.create({
        fir_id,
        alert_type: court_status,
        message: remarks,
        assigned_to: file ? file.io_id : null,
        priority: 'High',
        deadline: next_hearing_date || null
      });
    }

    // Update FIR status
    await firModel.update(fir_id, {
      ...fir,
      current_status: court_status,
      remarks: `Hearing updated: ${remarks}`
    });

    return successResponse(res, 201, 'Hearing recorded successfully', { hearing: newHearing });
  } catch (err) {
    next(err);
  }
};

const getHearings = async (req, res, next) => {
  try {
    const { fir_id, court_status, hearing_date, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;

    const filters = {
      fir_id,
      court_status,
      hearing_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const hearings = await hearingModel.findAll(filters);
    return successResponse(res, 200, 'Hearings fetched successfully', { hearings });
  } catch (err) {
    next(err);
  }
};

const getHearingById = async (req, res, next) => {
  try {
    const hearing = await hearingModel.findById(req.params.id);
    if (!hearing) {
      return errorResponse(res, 404, 'Hearing not found');
    }
    return successResponse(res, 200, 'Hearing fetched successfully', { hearing });
  } catch (err) {
    next(err);
  }
};

const updateHearing = async (req, res, next) => {
  try {
    const hearing = await hearingModel.findById(req.params.id);
    if (!hearing) {
      return errorResponse(res, 404, 'Hearing not found');
    }

    const updatedData = { ...req.body, updated_by: req.user.id };
    const updatedHearing = await hearingModel.update(req.params.id, updatedData);
    return successResponse(res, 200, 'Hearing updated successfully', { hearing: updatedHearing });
  } catch (err) {
    next(err);
  }
};

const deleteHearing = async (req, res, next) => {
  try {
    const hearing = await hearingModel.findById(req.params.id);
    if (!hearing) {
      return errorResponse(res, 404, 'Hearing not found');
    }

    await hearingModel.delete(req.params.id);
    return successResponse(res, 200, 'Hearing deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createHearing,
  getHearings,
  getHearingById,
  updateHearing,
  deleteHearing
};
