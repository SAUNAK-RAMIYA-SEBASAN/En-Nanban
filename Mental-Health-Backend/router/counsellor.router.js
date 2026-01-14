const express = require('express');
const {
    addCounsellor,
    updateCounsellor,
    deleteCounsellor,
    getAllCounsellors,
    getCounsellorById
} = require('../controller/counsellor.controller');

const { authenticateToken, isAdmin, isAdminOrCounselor } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin routes
router.post('/add', authenticateToken, isAdmin, addCounsellor);
router.put('/update/:id', authenticateToken, isAdminOrCounselor, updateCounsellor);
router.delete('/remove/:id', authenticateToken, isAdmin, deleteCounsellor);

// Routes accessible by all roles
router.get('/list', authenticateToken, getAllCounsellors);
router.get('/:id', authenticateToken, getCounsellorById);

module.exports = router;
