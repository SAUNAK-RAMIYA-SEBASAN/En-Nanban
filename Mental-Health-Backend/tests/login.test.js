const request = require('supertest');
const app = require('../app');
const pool = require('../db') 

describe('Login API', () => {
    it('should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: '230701120@rajalakshmi.edu.in', password: 'Jaga@2006', role: 'student' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ username: '230701120@rajalakshmi.edu.in', password: 'jaga@2006' });
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });
    it('should fail login with missing credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'testuser' });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Invalid role');
    });
});

// afterAll(() => {
//     // Close any database connections or cleanup tasks if necessary // Assuming you have a method to close the DB connection
//     app.close();
// });