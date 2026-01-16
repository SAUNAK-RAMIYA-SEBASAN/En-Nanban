
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);


INSERT INTO roles (role_id, name) VALUES
(1, 'student'),
(2, 'trained_student'),
(3, 'counselor'),
(4, 'admin');


-- STUDENTS
CREATE TABLE students (
    roll_no VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(20),
    department VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    role_id INT NOT NULL REFERENCES roles(role_id)
);


-- TRAINED STUDENTS
CREATE TABLE trained_students (
    trained_student_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    role_id INT NOT NULL REFERENCES roles(role_id)
);


-- ADMIN
CREATE TABLE admin (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    role_id INT NOT NULL REFERENCES roles(role_id)
);


-- COUNSELORS
CREATE TABLE counselors (
    id VARCHAR(20) PRIMARY KEY,           
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id),
    created_at TIMESTAMP DEFAULT NOW()
);


-- ONBOARDING QUESTIONS
CREATE TABLE onboarding_questions (
    question_id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- ONBOARDING ANSWERS
CREATE TABLE onboarding_answers (
    answer_id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES onboarding_questions(question_id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW()
);


-- QUESTIONNAIRE QUESTIONS
CREATE TABLE questionnaire_questions (
    question_id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


-- QUESTIONNAIRE ANSWERS
CREATE TABLE questionnaire_answers (
    answer_id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES questionnaire_questions(question_id) ON DELETE CASCADE,
    submitted_answer VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW()
);


-- COUNSELING SESSIONS
CREATE TABLE counseling_sessions (
    session_id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    counsellor_id VARCHAR(20) NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
    created_at TIMESTAMP DEFAULT NOW()
);


-- INDEXES (performance-critical)
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_counselors_email ON counselors(email);
CREATE INDEX idx_sessions_student ON counseling_sessions(roll_no);
CREATE INDEX idx_sessions_counselor ON counseling_sessions(counsellor_id);
CREATE INDEX idx_questionnaire_answers_roll ON questionnaire_answers(roll_no);
CREATE INDEX idx_onboarding_answers_roll ON onboarding_answers(roll_no);