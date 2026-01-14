const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper function to generate JWT
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
}

// Sign Up
async function register(req, res) {
    const { roll_no, name, age, gender, department, email, password, role_name } = req.body; 
    try {
        const userCheck = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const roleResult = await pool.query('SELECT role_id FROM roles WHERE name = $1', [role_name]);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const role_id = roleResult.rows[0].role_id;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO students (roll_no, name, age, gender, department, email, password, onboarding_completed, last_login, created_at, role_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW(), NOW(), $8)`,
            [roll_no, name, age, gender, department, email, hashedPassword, role_id]
        );

        res.status(201).json({ message: `${role_name} ${name} registered successfully` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function login(req, res) {
    const { email, password, role } = req.body;
    const entity = role === 'student' ? 'students' : 
                    role === 'counselor' ? 'counselors' : 
                    role === 'trained_student' ? 'trained_students' : 
                    role === 'admin' ? 'admin' : 
                    null;
    if (!entity) {
        return res.status(400).json({ message: "Invalid role" });
    }
    try {
        const userResult = await pool.query(`SELECT * FROM ${entity} WHERE email = $1`, [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = userResult.rows[0];

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = generateToken({
            //id: entity === 'students' ? user.roll_no : entity === 'counselors' ? user.counselor_id : entity === 'admin' ? user.id : user.trained_student_id,
            email: user.email,
            role_id: user.role_id
        });

        res.json({ token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}

// async function adminLogin(req, res) {
//     const { email, password } = req.body;
//     try {
//         const userResult = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
//         if (userResult.rows.length === 0) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }
//         const user = userResult.rows[0];
//          // Ensure password column exists or stored separately
//         if (!password || password !== user.password) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }
//         // Generate JWT token
//         const token = generateToken({
//             id: user.id,
//             email: user.email,
//             role_id: 4
//         });
//         res.json({ token });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }

module.exports = { register, login };
