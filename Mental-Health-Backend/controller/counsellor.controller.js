const pool = require('../db');
const bcrypt = require('bcrypt');

function generateCounselorId() {
    const prefix = 'CON@';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 7; i++) {
        randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return prefix + randomPart;
}

// Add a new counselor
async function addCounsellor(req, res) {
    const { name, phone, department, email, password, role_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = generateCounselorId();
        // Ensure the generated ID is unique
        let isUnique = false;
        while (!isUnique) {
            const existing = await pool.query('SELECT id FROM counselors WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                isUnique = true;
            } else {
                id = generateCounselorId();
            }
        }
        const result = await pool.query(
            `INSERT INTO counselors (id, name, phone, department, email, password, role_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, phone, department, email, created_at`,
            [id, name, phone, department, email, hashedPassword, role_id]
        );
        res.status(201).json({ message: 'Counselor added', counselor: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}

// Update counselor data
async function updateCounsellor(req, res) {
    const id = req.params.id;
    const { name, phone, department, email } = req.body;
    try {
        const result = await pool.query(
            `UPDATE counselors SET name = $1, phone = $2, department = $3, email = $4 WHERE id = $5 RETURNING id, name, phone, department, email, created_at`,
            [name, phone, department, email, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Counselor not found' });
        }
        res.json({ message: 'Counselor updated', counselor: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

// Delete a counselor
async function deleteCounsellor(req, res) {
    const id = req.params.id;
    try {
        const result = await pool.query(
            `DELETE FROM counselors WHERE id = $1 RETURNING id, name, phone, department, email, created_at`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Counselor not found' });
        }
        res.json({ message: 'Counselor deleted', counselor: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

// Retrieve all counselors
async function getAllCounsellors(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, name, phone, department, email FROM counselors ORDER BY created_at DESC`
        );
        res.json({ counselors: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

// Retrieve a specific counselor by ID
async function getCounsellorById(req, res) {
    const { id } = req.params.id;
    try {
        const result = await pool.query(
            `SELECT id, name, phone, department, email, created_at FROM counselors WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Counselor not found' });
        }
        res.json({ counselor: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

module.exports = {
    addCounsellor,
    updateCounsellor,
    deleteCounsellor,
    getAllCounsellors,
    getCounsellorById
};
