const pool = require('../db');
const { sendMail } = require('../utils/mailer');
const questionnaireAnswerPoints = {
    "Not At All": 0,
    "Several Days": 1,
    "More Than Half The Days": 2,
    "Nearly Every Day": 3
}
// --- Admin functions ---
// Add a single question
async function addQuestionnaire(req, res) {
    const { text } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO questionnaire_questions (text) VALUES ($1) RETURNING *`,
            [text]
        );
        res.status(201).json({ message: 'Question added', question: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Add multiple questions
async function addQuestionnaires(req, res) {
    const questions = req.body.questions; 
    try {
        const queryText = `INSERT INTO questionnaire_questions (text) VALUES `;
        const values = [];
        const params = [];
        questions.forEach((q, index) => {
            params.push(`($${index + 1})`);
            values.push(q.text);
        });
        const finalQuery = queryText + params.join(", ") + " RETURNING *";
        const result = await pool.query(finalQuery, values);
        res.status(201).json({ message: 'Questions added', questions: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update a question
async function updateQuestionnaire(req, res) {
    const { question_id } = req.params;
    const { text } = req.body;
    try {
        const result = await pool.query(
            `UPDATE questionnaire_questions SET text = $1 WHERE question_id = $2 RETURNING *`,
            [text, question_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question updated', question: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete a question
async function deleteQuestionnaire(req, res) {
    const { question_id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM questionnaire_questions WHERE question_id = $1 RETURNING *`,
            [question_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question deleted', question: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// --- All roles ---

// Retrieve all questions
async function getAllQuestionnaires(req, res) {
    try {
        const result = await pool.query(
            `SELECT question_id, text, created_at FROM questionnaire_questions ORDER BY created_at DESC`
        );
        res.json({ questions: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function answerQuestionnaire(req, res) {
    const roll_no = req.body.roll_no;
    const answers = req.body.answers; 
    // console.log(req.user.email);
    const questions = await pool.query('SELECT question_id, text FROM questionnaire_questions');
    const questionMap = {};
    questions.rows.forEach(q => {
        questionMap[q.question_id] = q.text;
    });
    try {
        const queryText = `INSERT INTO questionnaire_answers (roll_no, question_id, submitted_answer) VALUES `;
        const params = [];
        const values = [];

        answers.forEach((a, index) => {
            const baseIndex = index * 3;
            params.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
            values.push(roll_no, a.question_id, a.submitted_answer);
        });

        const finalQuery = queryText + params.join(", ") + " RETURNING *";
        
        const result = await pool.query(finalQuery, values);
        const score = await calculateQuestionnaireScore(answers);

        let emailHtml = `<h2>Your Questionnaire Submission</h2>`;
        emailHtml += `<ul>`;
        answers.forEach(a => {
            const questionText = questionMap[a.question_id] || 'Unknown question';
            emailHtml += `<li><strong>${questionText}</strong><br/>Answer: ${a.submitted_answer}</li>`;
        });
        emailHtml += `</ul>`;
        emailHtml += `<p><strong>Total Score:</strong> ${score}</p>`;

        // Send email
        await sendMail(req.user.email, 'Questionnaire Submission Summary', emailHtml);
        res.status(201).json({ message: 'Answers submitted, Check your mail', answers: result.rows, totalScore: score });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

async function calculateQuestionnaireScore(answers) {
    try {
        let totalScore = 0;
        answers.forEach(a => {
            const points = questionnaireAnswerPoints[a.submitted_answer] || 0;
            totalScore += points;
        });
        return totalScore;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    addQuestionnaire,
    addQuestionnaires,
    updateQuestionnaire,
    deleteQuestionnaire,
    getAllQuestionnaires,
    answerQuestionnaire
};
