const documentModel = require('../models/documentModel');
const firModel = require('../models/firModel');
const { successResponse, errorResponse } = require('../utils/response');
const fs = require('fs');
const path = require('path');

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Please upload a file');
    }

    const { fir_id, document_type, title } = req.body;
    
    // Validate FIR exists
    const fir = await firModel.findById(fir_id);
    if (!fir) {
      // Remove uploaded file if FIR invalid
      fs.unlinkSync(req.file.path);
      return errorResponse(res, 404, 'FIR not found');
    }

    const file_url = `/uploads/${req.file.filename}`;
    const file_name = title || req.file.originalname;

    const docData = {
      fir_id,
      document_type,
      file_name,
      file_url,
      uploaded_by: req.user.id
    };

    const newDoc = await documentModel.create(docData);
    
    // Add audit log or update FIR remarks if necessary
    
    return successResponse(res, 201, 'Document uploaded successfully', { document: newDoc });
  } catch (err) {
    next(err);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { fir_id, document_type } = req.query;
    
    const filters = { fir_id, document_type };

    const documents = await documentModel.findAll(filters);
    return successResponse(res, 200, 'Documents fetched successfully', { documents });
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const document = await documentModel.findById(req.params.id);
    if (!document) {
      return errorResponse(res, 404, 'Document not found');
    }
    return successResponse(res, 200, 'Document fetched successfully', { document });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const document = await documentModel.findById(req.params.id);
    if (!document) {
      return errorResponse(res, 404, 'Document not found');
    }

    // Role check - Only admin or the person who uploaded it
    if (req.user.role !== 'admin' && document.uploaded_by !== req.user.id) {
       return errorResponse(res, 403, 'Not authorized to delete this document');
    }

    // Delete from DB
    await documentModel.delete(req.params.id);

    // Remove file from filesystem
    const filePath = path.join(__dirname, '../', document.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return successResponse(res, 200, 'Document deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument
};
