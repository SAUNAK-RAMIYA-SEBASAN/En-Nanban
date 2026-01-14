const pool = require('../db');

async function getAllStudents(req, res) {
    try {
        const result = await pool.query('SELECT roll_no, name, email, age, gender, department FROM students');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

async function getProfile(req, res) {
    try {
        const roll_no = req.params.id;
        const result = await pool.query('SELECT roll_no, name, email, age, gender, department FROM students WHERE roll_no = $1', [roll_no]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

async function updateProfile(req, res) {
    const roll_no = req.params.id;
    const { name, age, gender, department } = req.body;
    try {
        const result = await pool.query(
            'UPDATE students SET name = $1, age = $2, gender = $3, department = $4 WHERE roll_no = $5 RETURNING roll_no, name, email, age, gender, department',
            [name, age, gender, department, roll_no]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Profile updated', student: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

async function deleteAccount(req, res) {
    const roll_no = req.params.id;
    try {
        await pool.query('DELETE FROM students WHERE roll_no = $1', [roll_no]);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message});
    }
}

module.exports = { getAllStudents, getProfile, updateProfile, deleteAccount };
