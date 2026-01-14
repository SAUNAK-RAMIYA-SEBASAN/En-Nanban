const express = require('express');
const {
    getQuestions,
    addQuestion,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    submitAnswer
} = require('../controller/onboarding.controller');

const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin routes
router.post('/add/', authenticateToken, isAdmin, addQuestion);
router.post('/add/bulk', authenticateToken, isAdmin, addQuestions);
router.put('/update/:question_id', authenticateToken, isAdmin, updateQuestion);
router.delete('/remove/:question_id', authenticateToken, isAdmin, deleteQuestion);
router.get('/list', authenticateToken, getQuestions);
// Student route
router.post('/answer', authenticateToken, submitAnswer);

module.exports = router;
