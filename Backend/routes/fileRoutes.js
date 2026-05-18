const express = require('express');
const router = express.Router();
const { createFile, getFiles, getFileById, updateFile, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createFileValidation } = require('../validations/fileValidator');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'supervisor'), createFileValidation, validateRequest, createFile)
  .get(getFiles);

router.route('/:id')
  .get(getFileById)
  .put(authorize('admin', 'supervisor', 'investigation officer'), updateFile)
  .delete(authorize('admin'), deleteFile);

module.exports = router;
