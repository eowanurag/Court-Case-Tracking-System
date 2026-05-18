const express = require('express');
const router = express.Router();
const { getDailyHearings, getUpcomingHearings, getPendingCompliance, getSectorSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Supervisors, Admins, and Legal Team can view reports
router.use(authorize('admin', 'supervisor', 'legal_team'));

router.get('/daily-hearings', getDailyHearings);
router.get('/upcoming-hearings', getUpcomingHearings);
router.get('/pending-compliance', getPendingCompliance);
router.get('/sector-summary', getSectorSummary);

module.exports = router;
