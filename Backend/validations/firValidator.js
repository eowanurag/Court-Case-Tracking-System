const { check } = require('express-validator');

const createFirValidation = [
  check('file_id', 'Investigation File ID is required').isInt(),
  check('fir_no', 'FIR number is required').notEmpty(),
  check('fir_year', 'FIR year is required').notEmpty().isLength({ min: 4, max: 4 }),
  check('district', 'District is required').notEmpty(),
  check('police_station', 'Police station is required').notEmpty(),
  check('court_name', 'Court name is required').notEmpty()
];

module.exports = {
  createFirValidation
};
