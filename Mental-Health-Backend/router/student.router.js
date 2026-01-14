const express = require('express');
const { getAllStudents, getProfile, updateProfile, deleteAccount } = require('../controller/student.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/all', authenticateToken, isAdmin, getAllStudents);

// Routes for any authenticated user
router.get('/:id', authenticateToken, getProfile);
router.put('/update/:id', authenticateToken, updateProfile);
router.delete('/remove/:id', authenticateToken, deleteAccount);

module.exports = router;