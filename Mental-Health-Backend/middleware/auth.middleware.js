const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const roleTableMap = {
    1: 'students',
    4: 'admin',
    3: 'counselors',
    2: 'trained_students'
};

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ message: 'Access token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        const { email, role_id } = user;
        if (!email || !role_id) {
            return res.status(403).json({ message: 'Invalid token payload' });
        }
        const tableName = roleTableMap[role_id];
        if (!tableName) {
            return res.status(403).json({ message: 'Invalid role' });
        }
        try {
            const query = `SELECT email FROM ${tableName} WHERE email = $1`;
            const result = await db.query(query, [email]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: `User with email id ${email} not found` });
            }

            // Additional validation
            if (tableName === 'students') {
                // const id = req.params.id;
                // if (id) {
                //     const studentCheck = await db.query('SELECT email FROM students WHERE roll_no = $1', [id]);
                //     if (studentCheck.rows.length === 0) {
                //         return res.status(404).json({ message: 'Student not found' });
                //     }
                //     if (studentCheck.rows[0].email !== email) {
                //         return res.status(403).json({ message: 'Email mismatch.' });
                //     }
                // }
                const id = req.params.roll_no || req.body.roll_no;
                if (id) {
                    const studentCheck = await db.query('SELECT email FROM students WHERE roll_no = $1', [id]);
                    if (studentCheck.rows.length === 0) {
                        return res.status(404).json({ message: 'Student not found' });
                    }
                    if (studentCheck.rows[0].email !== email) {
                        return res.status(403).json({ message: 'Email mismatch.' });
                    }
                    
                }
            }
            req.user = user;
            next();

        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
}


function isAdmin(req, res, next) {
    const { role_id } = req.user; 
    if (!role_id) {
        return res.status(403).json({ message: 'Role information missing' });
    }
    if (role_id !== 4) {
        return res.status(403).json({ message: 'Admin access only' });
    }
    next();
}

function isCounselor(req, res, next) {
    const { role_id } = req.user;
    if (!role_id) {
        return res.status(403).json({ message: 'Role information missing' });
    }
    if (role_id !== 3) {
        return res.status(403).json({ message: 'Counselor access only' });
    }
    next();
}

function isTrainedStudent(req, res, next) {
    const { role_id } = req.user;
    if (!role_id) {
        return res.status(403).json({ message: 'Role information missing' });
    }
    if (role_id !== 2) {
        return res.status(403).json({ message: 'Trained Student access only' });
    }
    next();
}

function isAdminOrCounselor(req, res, next) {
    if (req.user.role_id === 4 || req.user.role_id === 3) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied: Admins or Counselors only' });
}

module.exports = { authenticateToken, isAdmin, isCounselor, isTrainedStudent, isAdminOrCounselor };
