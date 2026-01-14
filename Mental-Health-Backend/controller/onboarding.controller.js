const pool = require('../db');


async function getQuestions(req, res) {
    try {
        const result = await pool.query('SELECT * FROM onboarding_questions');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

async function addQuestion(req, res) {
    const { text, option_a, option_b, option_c, option_d } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO onboarding_questions (text, option_a, option_b, option_c, option_d) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [text, option_a, option_b, option_c, option_d]
        );
        res.status(201).json({ message: 'Question added', question: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

// Add multiple questions (bulk insert)
async function addQuestions(req, res) {
    const questions = req.body.questions; // Array of questions
    try {
        const queryText = `INSERT INTO onboarding_questions (text, option_a, option_b, option_c, option_d) VALUES `;
        const values = [];
        const params = [];
        questions.forEach((q, index) => {
            const i = index * 5;
            params.push(`($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5})`);
            values.push(q.text, q.option_a || null, q.option_b || null, q.option_c || null, q.option_d || null);
        });
        const finalQuery = queryText + params.join(", ") + " RETURNING *";
        const result = await pool.query(finalQuery, values);
        res.status(201).json({ message: 'Questions added', questions: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

// Update a question
async function updateQuestion(req, res) {
    const { question_id } = req.params;
    const { text, option_a, option_b, option_c, option_d } = req.body;
    try {
        const result = await pool.query(
            `UPDATE onboarding_questions SET text = $1, option_a = $2, option_b = $3, option_c = $4, option_d = $5
             WHERE question_id = $6 RETURNING *`,
            [text, option_a || null, option_b || null, option_c || null, option_d || null, question_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question updated', question: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

// Delete a question
async function deleteQuestion(req, res) {
    const { question_id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM onboarding_questions WHERE question_id = $1 RETURNING *`,
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

// --- Student functions ---

// Answer a question
async function submitAnswer(req, res) {
    const roll_no = req.body.roll_no;
    const { question_id, submitted_answer } = req.body;

    try {
        // Optional: Check if question exists
        const question = await pool.query('SELECT * FROM onboarding_questions WHERE question_id = $1', [question_id]);
        if (question.rows.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const result = await pool.query(
            `INSERT INTO onboarding_answers (roll_no, question_id, submitted_answer) 
             VALUES ($1, $2, $3) RETURNING *`,
            [roll_no, question_id, submitted_answer]
        );

        await pool.query(
            `UPDATE students SET onboarding_completed = TRUE WHERE roll_no = $1`,
            [roll_no]
        );
        res.status(201).json({ message: 'Answer submitted', answer: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

module.exports = {
    getQuestions,
    addQuestion,
    addQuestions,
    updateQuestion,
    deleteQuestion,
    submitAnswer
};
