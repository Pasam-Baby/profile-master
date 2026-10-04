CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resume (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    objective TEXT,
    education TEXT,
    skills TEXT,
    projects TEXT,
    certifications TEXT,
    location TEXT,
    linkedin TEXT,
    github TEXT,
    portfolio TEXT,
    target_role TEXT,
    profile_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    experience TEXT,
    required_skills TEXT,
    description TEXT,
    work_mode TEXT DEFAULT 'Remote',
    source TEXT DEFAULT 'ProfileMaster Demo',
    posted_date TEXT,
    responsibilities TEXT,
    preferred_skills TEXT,
    company_info TEXT,
    application_info TEXT,
    job_link TEXT
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    status TEXT,
    source TEXT DEFAULT 'ProfileMaster',
    applied_date TEXT,
    interview_date TEXT,
    interview_stage TEXT,
    recruiter TEXT,
    resume_used TEXT,
    notes TEXT,
    follow_up_date TEXT,
    job_link TEXT,
    status_history TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

-- Seed Jobs
INSERT INTO jobs (title, company, location, salary, experience, required_skills, description) VALUES
('Frontend Developer', 'TechCorp', 'Remote', '$70,000 - $90,000', '1-3 years', 'HTML, CSS, JavaScript, React JS', 'Looking for a passionate React JS developer.'),
('Fullstack Engineer', 'WebSolutions', 'New York, NY', '$90,000 - $120,000', '3-5 years', 'HTML, CSS, JavaScript, React JS, Python, SQL', 'Join our team to build scalable web apps.'),
('Backend Developer', 'DataSystems', 'San Francisco, CA', '$100,000 - $130,000', '2-5 years', 'Python, SQL', 'Strong Python skills required.'),
('React Intern', 'StartupInc', 'Remote', '$30,000', '0-1 years', 'HTML, CSS, JavaScript, React JS', 'Entry level role for motivated self-starters.');

-- Seed Roadmaps
INSERT INTO learning_roadmaps (skill, step_order, title, description) VALUES
('React JS', 1, 'React fundamentals', 'Learn JSX, rendering elements, and the virtual DOM.'),
('React JS', 2, 'Components', 'Understand functional vs class components.'),
('React JS', 3, 'Props and State', 'Learn how data flows through React applications.'),
('React JS', 4, 'Hooks', 'Master useState, useEffect, and custom hooks.'),
('React JS', 5, 'API integration', 'Learn how to fetch data from a backend.'),
('React JS', 6, 'Build a project', 'Put it all together in a comprehensive portfolio project.'),
('Python', 1, 'Syntax and Variables', 'Learn the basics of Python scripting.'),
('Python', 2, 'Data Structures', 'Master lists, dictionaries, sets, and tuples.'),
('Python', 3, 'Functions and Modules', 'Learn to write reusable code.'),
('Python', 4, 'Object Oriented Programming', 'Understand classes and inheritance.'),
('SQL', 1, 'Select Queries', 'Learn to retrieve data.'),
('SQL', 2, 'Joins', 'Learn INNER, LEFT, and RIGHT joins.'),
('SQL', 3, 'Aggregations', 'Learn GROUP BY and HAVING.');

-- Seed Interview Questions
INSERT INTO interview_questions (topic, question, answer) VALUES
('React JS', 'What is the Virtual DOM?', 'A lightweight copy of the actual DOM that React uses to optimize rendering performance.'),
('React JS', 'What are React Hooks?', 'Functions that let you use state and other React features without writing a class.'),
('JavaScript', 'What is a closure?', 'A closure is a feature where an inner function has access to the outer function variables.'),
('Python', 'What is the difference between a list and a tuple?', 'Lists are mutable (can be changed) while tuples are immutable (cannot be changed).'),
('SQL', 'What is a Primary Key?', 'A unique identifier for a row in a database table.');
