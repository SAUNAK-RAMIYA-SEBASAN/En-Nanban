const express = require('express');
const {
    addQuestionnaire,
    addQuestionnaires,
    updateQuestionnaire,
    deleteQuestionnaire,
    getAllQuestionnaires,
    answerQuestionnaire
} = require('../controller/questionnaire.controller');

const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route (any authenticated user)
router.get('/list', authenticateToken, getAllQuestionnaires);
router.post('/answer', authenticateToken, answerQuestionnaire);

// Admin routes
router.post('/add', authenticateToken, isAdmin, addQuestionnaire);
router.post('/add/bulk', authenticateToken, isAdmin, addQuestionnaires);
router.put('/update/:question_id', authenticateToken, isAdmin, updateQuestionnaire);
router.delete('/remove/:question_id', authenticateToken, isAdmin, deleteQuestionnaire);

module.exports = router;
