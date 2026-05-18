const fileModel = require('../models/fileModel');
const { generateFullFileNo } = require('../utils/generateNumber');
const { successResponse, errorResponse } = require('../utils/response');

const createFile = async (req, res, next) => {
  try {
    const { file_no, file_year, sector_name, io_id, file_title, remarks } = req.body;
    
    // Auto-generate full file number
    const full_file_no = generateFullFileNo(file_no, file_year);

    const fileData = {
      file_no,
      file_year,
      full_file_no,
      sector_name,
      io_id: io_id ? parseInt(io_id) : null,
      file_title,
      remarks,
      created_by: req.user.id
    };

    const newFile = await fileModel.create(fileData);
    return successResponse(res, 201, 'Investigation file created successfully', { file: newFile });
  } catch (err) {
    next(err);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const { search, sector_name, investigation_status, io_id, show_all, page = 1, limit = 10 } = req.query;
    
    const userRole = req.user.role.toLowerCase();
    let filterIoId = io_id;

    if (userRole === 'investigation officer') {
      filterIoId = req.user.id;
    } else if (userRole === 'pairokar' || userRole === 'admin' || userRole === 'supervisor') {
      // These roles can see all files (Pairokar needs to see files to link FIRs)
    }

    const offset = (page - 1) * limit;

    const filters = {
      search,
      sector_name,
      investigation_status,
      io_id: filterIoId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const files = await fileModel.findAll(filters);
    return successResponse(res, 200, 'Files fetched successfully', { files });
  } catch (err) {
    next(err);
  }
};

const getFileById = async (req, res, next) => {
  try {
    const file = await fileModel.findById(req.params.id);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    // Role check for IO
    if (req.user.role.toLowerCase() === 'investigation officer' && file.io_id !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized to view this file');
    }

    return successResponse(res, 200, 'File fetched successfully', { file });
  } catch (err) {
    next(err);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const file = await fileModel.findById(req.params.id);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    if (req.user.role.toLowerCase() === 'investigation officer' && file.io_id !== req.user.id) {
        return errorResponse(res, 403, 'Not authorized to update this file');
    }

    const updatedFile = await fileModel.update(req.params.id, req.body);
    return successResponse(res, 200, 'File updated successfully', { file: updatedFile });
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await fileModel.findById(req.params.id);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    await fileModel.delete(req.params.id);
    return successResponse(res, 200, 'File deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile
};
