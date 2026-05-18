const { check } = require('express-validator');

const createHearingValidation = [
  check('fir_id', 'FIR ID is required').isInt(),
  check('hearing_date', 'Hearing date is required').isISO8601(),
  check('court_status', 'Court status is required').notEmpty()
];

module.exports = {
  createHearingValidation
};
