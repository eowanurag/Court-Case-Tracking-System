const { check } = require('express-validator');

const createFileValidation = [
  check('file_no', 'File number is required').notEmpty(),
  check('file_year', 'File year is required').notEmpty().isLength({ min: 4, max: 4 }),
  check('sector_name', 'Sector name is required').notEmpty(),
  check('io_id', 'Investigation Officer ID is required').isInt()
];

module.exports = {
  createFileValidation
};
