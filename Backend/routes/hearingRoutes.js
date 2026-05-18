const express = require('express');
const router = express.Router();
const { createHearing, getHearings, getHearingById, updateHearing, deleteHearing } = require('../controllers/hearingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createHearingValidation } = require('../validations/hearingValidator');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'supervisor', 'legal team', 'court tracking staff', 'pairokar'), createHearingValidation, validateRequest, createHearing)
  .get(getHearings);

router.route('/:id')
  .get(getHearingById)
  .put(authorize('admin', 'supervisor', 'legal team', 'court tracking staff', 'pairokar'), updateHearing)
  .delete(authorize('admin'), deleteHearing);

module.exports = router;
