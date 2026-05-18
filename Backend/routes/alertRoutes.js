const express = require('express');
const router = express.Router();
const { createAlert, getAlerts, getAlertById, updateAlert, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'supervisor', 'legal team', 'court tracking staff', 'pairokar'), createAlert)
  .get(getAlerts);

router.route('/:id')
  .get(getAlertById)
  .put(updateAlert) // Anyone assigned or admin can update status
  .delete(authorize('admin'), deleteAlert);

module.exports = router;
