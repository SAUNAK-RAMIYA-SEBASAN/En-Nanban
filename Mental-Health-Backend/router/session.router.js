const {bookSession,getSessions,updateSessionStatus} = require('../controller/session.controller');
const express = require('express');
const { authenticateToken, isAdmin, isCounselor } = require('../middleware/auth.middleware');
const router = express.Router();

// Route to book a counseling session
router.post('/book', authenticateToken, bookSession);
router.get('/list/:roll_no', authenticateToken, getSessions);
router.get('/list', authenticateToken, isAdmin, getSessions);
router.get('/list/counselor/:counsellor_id', authenticateToken, isCounselor, getSessions);
router.put('/update', authenticateToken, isCounselor, updateSessionStatus);

module.exports = router;