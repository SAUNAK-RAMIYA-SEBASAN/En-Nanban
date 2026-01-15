const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./router/auth.router');
const studentRoutes = require('./router/student.router');
const onboardingRoutes = require('./router/onboarding.router');
const questionnaireRoutes = require('./router/questionnaire.router');
const counsellorRoutes = require('./router/counsellor.router');
const sessionRoutes = require('./router/session.router');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.use(cors({
    origin: [
        'http://localhost:5173',  // Vite default
        'http://localhost:8080'   // optional
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/questionnaire', questionnaireRoutes);
app.use('/counsellor', counsellorRoutes);
app.use('/session', sessionRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});


module.exports = app; // Export app for testing