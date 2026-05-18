const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUserById, updateUser, deleteUser, resetPassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Only admin can access these user management routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .post(createUser)
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/reset-password', resetPassword);

module.exports = router;
