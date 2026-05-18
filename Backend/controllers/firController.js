const firModel = require('../models/firModel');
const fileModel = require('../models/fileModel');
const { generateFullFirNo } = require('../utils/generateNumber');
const { successResponse, errorResponse } = require('../utils/response');

const createFir = async (req, res, next) => {
  try {
    const { 
      file_id, fir_no, fir_year, district, police_station, court_name, pairokar_id, 
      accused_names, court_case_type, case_initial_date, last_hearing_date, order_sent_date, due_date,
      current_status, remarks 
    } = req.body;
    
    // Check if file exists
    const file = await fileModel.findById(file_id);
    if (!file) {
      return errorResponse(res, 404, 'Linked Investigation File not found');
    }

    // Auto-generate full FIR number
    const full_fir_no = generateFullFirNo(fir_no, fir_year);

    const firData = {
      file_id,
      fir_no,
      fir_year,
      full_fir_no,
      district,
      police_station,
      court_name,
      pairokar_id: pairokar_id ? parseInt(pairokar_id) : null,
      accused_names,
      court_case_type,
      case_initial_date,
      last_hearing_date,
      order_sent_date,
      due_date,
      current_status: current_status || 'Investigation',
      remarks
    };

    const newFir = await firModel.create(firData);
    return successResponse(res, 201, 'FIR created successfully', { fir: newFir });
  } catch (err) {
    next(err);
  }
};

const getFirs = async (req, res, next) => {
  try {
    const { search, district, current_status, file_id, io_id, startDate, endDate, dateType, show_all, page = 1, limit = 50 } = req.query;
    
    const userRole = req.user.role.toLowerCase();
    let filterIoId = io_id;
    let filterPairokarId = null;

    if (userRole === 'investigation officer') {
      // IOs are strictly restricted to their own files
      filterIoId = req.user.id;
    } else if (userRole === 'pairokar') {
      // Pairokars see their own by default, but can see all if show_all is true
      if (show_all !== 'true') {
        filterPairokarId = req.user.id;
      }
    } else if (userRole === 'admin' || userRole === 'supervisor') {
      // Admins and Supervisors see all by default
    }

    const offset = (page - 1) * limit;

    const filters = {
      search,
      district,
      current_status,
      file_id,
      io_id: filterIoId,
      pairokar_id: filterPairokarId,
      startDate,
      endDate,
      dateType,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const firs = await firModel.findAll(filters);
    return successResponse(res, 200, 'FIRs fetched successfully', { firs });
  } catch (err) {
    next(err);
  }
};

const getFirById = async (req, res, next) => {
  try {
    const fir = await firModel.findById(req.params.id);
    if (!fir) {
      return errorResponse(res, 404, 'FIR not found');
    }

    // Role check logic can be added here if IO should only see their FIRs
    
    return successResponse(res, 200, 'FIR fetched successfully', { fir });
  } catch (err) {
    next(err);
  }
};

const updateFir = async (req, res, next) => {
  try {
    const fir = await firModel.findById(req.params.id);
    if (!fir) {
      return errorResponse(res, 404, 'FIR not found');
    }

    const updatedFir = await firModel.update(req.params.id, req.body);
    return successResponse(res, 200, 'FIR updated successfully', { fir: updatedFir });
  } catch (err) {
    next(err);
  }
};

const deleteFir = async (req, res, next) => {
  try {
    const fir = await firModel.findById(req.params.id);
    if (!fir) {
      return errorResponse(res, 404, 'FIR not found');
    }

    await firModel.delete(req.params.id);
    return successResponse(res, 200, 'FIR deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFir,
  getFirs,
  getFirById,
  updateFir,
  deleteFir
};
