const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, getDocumentById, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', upload.single('documentFile'), uploadDocument);

router.route('/')
  .get(getDocuments);

router.route('/:id')
  .get(getDocumentById)
  .delete(deleteDocument);

module.exports = router;
