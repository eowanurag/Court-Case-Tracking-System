const express = require('express');
const router = express.Router();
const { createFir, getFirs, getFirById, updateFir, deleteFir } = require('../controllers/firController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createFirValidation } = require('../validations/firValidator');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'supervisor', 'legal team'), createFirValidation, validateRequest, createFir)
  .get(getFirs);

router.route('/:id')
  .get(getFirById)
  .put(authorize('admin', 'supervisor', 'legal team', 'investigation officer', 'pairokar'), updateFir)
  .delete(authorize('admin'), deleteFir);

module.exports = router;
