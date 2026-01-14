const pool = require('../db');

async function getSessions(req, res) {
    const role_id = req.user.role_id;
    console.log(role_id);
    let id;
    switch(role_id) {
        case 1: // student
            id = req.params.roll_no; break;
        case 3: // counselor
            id = req.params.counsellor_id; break;
        default:
            id = req.params.roll_no; break;
    }
    console.log(id);
    try {
        let query = 
            `SELECT cs.session_id, cs.roll_no, cs.counsellor_id, c.name AS counsellor_name, cs.start_time, cs.end_time, cs.status, cs.created_at
             FROM counseling_sessions cs
             JOIN counselors c ON cs.counsellor_id = c.id`;
        let params = [];
        if(role_id === 1) { // student
            query += ` WHERE cs.roll_no = $1`;
            params.push(id);
        } else if(role_id === 3) { // counselor
            query += ` WHERE cs.counsellor_id = $1`;
            params.push(id);
        } else if(role_id === 4) { // admin
            // Admin can see all sessions, no filter
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
        query += ` ORDER BY cs.start_time DESC`;
        const result = await pool.query(query, params);
        if(result.rows.length === 0) {
            return res.status(404).json({ message: 'No sessions found' });
        }
        res.json({ sessions: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}

async function bookSession(req, res) {
    const roll_no = req.body.roll_no;
    const { counsellor_id, start_time, end_time } = req.body;
    try {
        // 1. Validate that start_time and end_time are provided and valid
        if (!start_time || !end_time) {
            return res.status(400).json({ message: 'Start time and end time are required' });
        }
        const start = new Date(start_time);
        const end = new Date(end_time);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        if (end <= start) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }
        if (start < now) {
            return res.status(400).json({ message: 'Start time must be in the future' });
        }

        // 2. Validate that the counselor exists
        const counselorRes = await pool.query('SELECT * FROM counselors WHERE id = $1', [counsellor_id]);
        if (counselorRes.rows.length === 0) {
            return res.status(404).json({ message: 'Counselor not found' });
        }

        // 3. Validate that the student exists
        const studentRes = await pool.query('SELECT * FROM students WHERE roll_no = $1', [roll_no]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // 4. Check if the counselor is available (no overlapping sessions)
        const overlapRes = await pool.query(
            `SELECT * FROM counseling_sessions 
             WHERE counsellor_id = $1 
             AND status IN ('pending', 'confirmed')
             AND NOT (end_time <= $2 OR start_time >= $3)`,
            [counsellor_id, start.toISOString(), end.toISOString()]
        );
        if (overlapRes.rows.length > 0) {
            return res.status(409).json({ message: 'Counselor is not available during this time' });
        }

        // 5. Insert the session record
        const insertRes = await pool.query(
            `INSERT INTO counseling_sessions (roll_no, counsellor_id, start_time, end_time)
             VALUES ($1, $2, $3, $4)
             RETURNING session_id, roll_no, counsellor_id, start_time, end_time, status, created_at`,
            [roll_no, counsellor_id, start.toISOString(), end.toISOString()]
        );
        const session = insertRes.rows[0];

        // 6. Return the newly created session
        res.status(201).json({
            message: 'Counseling session booked successfully',
            session
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}

async function updateSessionStatus(req, res) {
    const session_id = req.body.session_id;
    const status = req.body.status;
    const validStatuses = ['pending', 'confirmed', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }
    try {
        const result = await pool.query(
            `UPDATE counseling_sessions SET status = $1 WHERE session_id = $2 RETURNING *`,
            [status, session_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.json({ message: 'Session status updated', session: result.rows[0] });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}

module.exports = { bookSession, getSessions, updateSessionStatus };
