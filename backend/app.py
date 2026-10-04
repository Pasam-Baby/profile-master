import os
import json
import re
import secrets
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import smtplib

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

APPLICATION_STATUSES = ['Saved', 'Applied', 'Screening', 'Test', 'Interview', 'HR', 'Offer', 'Joined', 'Rejected']

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.path.dirname(__file__), 'career_assistant.db')
RESET_TOKEN_TTL_SECONDS = 3600


def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def email_is_valid(email):
    return bool(re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', (email or '').strip()))


def ensure_user_columns():
    conn = get_db_connection()
    columns = [row['name'] for row in conn.execute('PRAGMA table_info(users)').fetchall()]

    if 'name' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN name TEXT')
    if 'role' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN role TEXT')
    if 'experience' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN experience TEXT')
    if 'reset_token' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN reset_token TEXT')
    if 'reset_token_expires_at' not in columns:
        conn.execute('ALTER TABLE users ADD COLUMN reset_token_expires_at TEXT')

    conn.commit()
    conn.close()


def ensure_application_columns():
    conn = get_db_connection()
    columns = [row['name'] for row in conn.execute('PRAGMA table_info(applications)').fetchall()]
    additions = {
        'source': 'TEXT',
        'applied_date': 'TEXT',
        'interview_date': 'TEXT',
        'interview_stage': 'TEXT',
        'recruiter': 'TEXT',
        'resume_used': 'TEXT',
        'notes': 'TEXT',
        'follow_up_date': 'TEXT',
        'job_link': 'TEXT',
        'status_history': 'TEXT',
    }
    for name, data_type in additions.items():
        if name not in columns:
            conn.execute(f'ALTER TABLE applications ADD COLUMN {name} {data_type}')
    conn.commit()
    conn.close()


def ensure_job_columns():
    conn = get_db_connection()
    columns = [row['name'] for row in conn.execute('PRAGMA table_info(jobs)').fetchall()]
    additions = {
        'work_mode': "TEXT DEFAULT 'Remote'",
        'source': "TEXT DEFAULT 'ProfileMaster Demo'",
        'posted_date': 'TEXT',
        'responsibilities': 'TEXT',
        'preferred_skills': 'TEXT',
        'company_info': 'TEXT',
        'application_info': 'TEXT',
        'job_link': 'TEXT',
    }
    for name, data_type in additions.items():
        if name not in columns:
            conn.execute(f'ALTER TABLE jobs ADD COLUMN {name} {data_type}')
    demo_metadata = [
        (1, 'Naukri', '-1 day', 'Remote'),
        (2, 'LinkedIn', '-3 days', 'Hybrid'),
        (3, 'Indeed', '-5 days', 'On-site'),
        (4, 'Naukri', '-7 days', 'Remote'),
    ]
    for job_id, source, posted_offset, work_mode in demo_metadata:
        conn.execute('''
            UPDATE jobs
            SET source = CASE WHEN source IS NULL OR source = 'ProfileMaster Demo' THEN ? ELSE source END,
                posted_date = COALESCE(posted_date, datetime('now', ?)),
                work_mode = CASE WHEN work_mode IS NULL OR work_mode = 'Remote' THEN ? ELSE work_mode END
            WHERE id = ?
        ''', (source, posted_offset, work_mode, job_id))
    conn.commit()
    conn.close()


def ensure_resume_columns():
    conn = get_db_connection()
    columns = [row['name'] for row in conn.execute('PRAGMA table_info(resume)').fetchall()]
    additions = {
        'location': 'TEXT',
        'linkedin': 'TEXT',
        'github': 'TEXT',
        'portfolio': 'TEXT',
        'target_role': 'TEXT',
        'profile_json': 'TEXT',
    }
    for name, data_type in additions.items():
        if name not in columns:
            conn.execute(f'ALTER TABLE resume ADD COLUMN {name} {data_type}')
    conn.commit()
    conn.close()


def init_db():
    if not os.path.exists(DB_FILE):
        with app.app_context():
            conn = get_db_connection()
            with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r', encoding='utf-8') as f:
                conn.executescript(f.read())
            conn.commit()
            conn.close()
    ensure_user_columns()
    ensure_application_columns()
    ensure_job_columns()
    ensure_resume_columns()


# Authentication Decorator Equivalent Helper
def get_user_id(req):
    user_id = req.headers.get('Authorization')
    if user_id:
        try:
            return int(user_id)
        except (TypeError, ValueError):
            return None
    return None


def build_reset_url(token):
    frontend_base = os.environ.get('PROFILEMASTER_FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    return f'{frontend_base}/reset-password?token={token}'


def send_reset_email(email, reset_url):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = os.environ.get('SMTP_PORT')
    smtp_username = os.environ.get('SMTP_USERNAME')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    email_from = os.environ.get('EMAIL_FROM', 'no-reply@profilemaster.local')

    if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
        return False

    message = EmailMessage()
    message['Subject'] = 'ProfileMaster password reset'
    message['From'] = email_from
    message['To'] = email
    message.set_content(
        'Use the link below to reset your password:\n\n'
        f'{reset_url}\n\n'
        'This link expires in one hour.'
    )

    try:
        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(message)
        return True
    except Exception:
        return False


@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "ProfileMaster Backend API is running successfully!"
    })

# Auth Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    role = (data.get('role') or '').strip()
    experience = (data.get('experience') or '').strip()

    if not name or not email or not password or not role or not experience:
        return jsonify({'error': 'Please complete all required fields.'}), 400
    if not email_is_valid(email):
        return jsonify({'error': 'Please enter a valid email address.'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    hashed = generate_password_hash(password)

    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO users (name, email, password_hash, role, experience) VALUES (?, ?, ?, ?, ?)',
            (name, email, hashed, role, experience),
        )
        user_id = cursor.lastrowid
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 400
    conn.close()

    return jsonify({
        'user_id': user_id,
        'email': email,
        'name': name,
        'role': role,
        'experience': experience,
        'message': 'Registered successfully!'
    })


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        return jsonify({
            'user_id': user['id'],
            'email': user['email'],
            'name': user['name'] or user['email'].split('@')[0],
            'role': user['role'],
            'experience': user['experience'],
            'message': 'Logged in successfully!'
        })

    return jsonify({'error': 'Invalid email or password'}), 401


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()

    if not email or not email_is_valid(email):
        return jsonify({'error': 'Please provide a valid registered email address.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=RESET_TOKEN_TTL_SECONDS)).isoformat()
        conn.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?',
            (token, expires_at, user['id'])
        )
        conn.commit()
        reset_url = build_reset_url(token)
        email_sent = send_reset_email(email, reset_url)
        if email_sent:
            conn.close()
            return jsonify({'message': 'A password reset link has been sent to your email.'})
        conn.close()
        return jsonify({
            'message': 'Password reset is available in development mode.',
            'reset_url': reset_url,
            'reset_token': token,
        })

    conn.close()
    return jsonify({'error': 'No account found for that email address.'}), 404


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json or {}
    token = (data.get('token') or '').strip()
    password = data.get('password')

    if not token:
        return jsonify({'error': 'Reset token is missing.'}), 400
    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE reset_token = ?', (token,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'This reset link is invalid or has already been used.'}), 400

    expires_at = user['reset_token_expires_at']
    if expires_at:
        expires_dt = datetime.fromisoformat(expires_at)
        if datetime.now(timezone.utc) > expires_dt.replace(tzinfo=timezone.utc):
            conn.execute('UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?', (user['id'],))
            conn.commit()
            conn.close()
            return jsonify({'error': 'This reset link has expired. Please request a new one.'}), 400

    conn.execute(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?',
        (generate_password_hash(password), user['id'])
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Password updated successfully.'})

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    
    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400
    if not email_is_valid(email):
        return jsonify({"error": "Invalid email format"}), 400
        
    conn = get_db_connection()
    try:
        conn.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', (name, email, user_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Email already exists"}), 400
        
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    return jsonify({
        'user_id': user['id'],
        'email': user['email'],
        'name': user['name'] or user['email'].split('@')[0],
        'role': user['role'],
        'experience': user['experience'],
        'message': 'Profile updated successfully!'
    })

@app.route('/api/user/password', methods=['PUT'])
def update_password():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    data = request.json or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"error": "Current and new password are required"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
        
    conn = get_db_connection()
    user = conn.execute('SELECT password_hash FROM users WHERE id = ?', (user_id,)).fetchone()
    
    if not user or not check_password_hash(user['password_hash'], current_password):
        conn.close()
        return jsonify({"error": "Incorrect current password"}), 400
        
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (generate_password_hash(new_password), user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Password updated successfully!"})

# Resume Endpoints
@app.route('/api/resume', methods=['GET'])
def get_resume():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    resume = conn.execute('SELECT * FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    conn.close()
    if resume:
        return jsonify(dict(resume))
    return jsonify({})

@app.route('/api/resume', methods=['POST'])
def save_resume():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    profile_json = data.get('profile_json') or ''
    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    if existing:
        conn.execute('''
            UPDATE resume 
            SET name=?, email=?, phone=?, objective=?, education=?, skills=?, projects=?, certifications=?,
                location=?, linkedin=?, github=?, portfolio=?, target_role=?, profile_json=?
            WHERE id=?
        ''', (data.get('name'), data.get('email'), data.get('phone'), data.get('objective'),
              data.get('education'), data.get('skills'), data.get('projects'), data.get('certifications'),
              data.get('location'), data.get('linkedin'), data.get('github'), data.get('portfolio'),
              data.get('target_role'), profile_json, existing['id']))
    else:
        conn.execute('''
            INSERT INTO resume (user_id, name, email, phone, objective, education, skills, projects, certifications,
                location, linkedin, github, portfolio, target_role, profile_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, data.get('name'), data.get('email'), data.get('phone'), data.get('objective'),
              data.get('education'), data.get('skills'), data.get('projects'), data.get('certifications'),
              data.get('location'), data.get('linkedin'), data.get('github'), data.get('portfolio'),
              data.get('target_role'), profile_json))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

# Jobs Endpoints
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    search = request.args.get('search', '').lower()
    location = request.args.get('location', '').lower()
    experience = request.args.get('experience', '').lower()
    work_mode = request.args.get('work_mode', '').lower()
    salary = request.args.get('salary', '').lower()
    skills = request.args.get('skills', '').lower()
    posted = request.args.get('posted', '').lower()
    conn = get_db_connection()
    clauses = []
    values = []
    if search:
        clauses.append('(LOWER(title) LIKE ? OR LOWER(company) LIKE ? OR LOWER(required_skills) LIKE ?)')
        values.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
    if location:
        clauses.append('LOWER(location) LIKE ?')
        values.append(f'%{location}%')
    if experience:
        clauses.append('LOWER(experience) LIKE ?')
        values.append(f'%{experience}%')
    if work_mode:
        clauses.append("LOWER(COALESCE(work_mode, 'Remote')) = ?")
        values.append(work_mode)
    if salary:
        clauses.append('LOWER(COALESCE(salary, \'\')) LIKE ?')
        values.append(f'%{salary}%')
    if skills:
        clauses.append('LOWER(COALESCE(required_skills, \'\')) LIKE ?')
        values.append(f'%{skills}%')
    if posted in {'today', 'last 3 days', 'last 7 days'}:
        days = {'today': '0 days', 'last 3 days': '-3 days', 'last 7 days': '-7 days'}[posted]
        clauses.append("date(COALESCE(posted_date, '1970-01-01')) >= date('now', ?)")
        values.append(days)
    query = 'SELECT * FROM jobs'
    if clauses:
        query += ' WHERE ' + ' AND '.join(clauses)
    query += " ORDER BY COALESCE(posted_date, '') DESC, id DESC"
    jobs = conn.execute(query, values).fetchall()
    conn.close()
    return jsonify([dict(job) for job in jobs])

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    conn = get_db_connection()
    job = conn.execute('SELECT * FROM jobs WHERE id = ?', (job_id,)).fetchone()
    conn.close()
    if job:
        return jsonify(dict(job))
    return jsonify({"error": "Job not found"}), 404

# Skill Matching logic
def calculate_match(user_skills_str, job_skills_str):
    if not user_skills_str or not job_skills_str:
        return {"match_percentage": 0, "matched_skills": [], "missing_skills": []}
    
    user_skills = {s.strip().lower() for s in user_skills_str.split(',')}
    job_skills = {s.strip().lower() for s in job_skills_str.split(',')}
    
    matched = list(user_skills.intersection(job_skills))
    missing = list(job_skills.difference(user_skills))
    
    if len(job_skills) == 0:
        pct = 100
    else:
        pct = int((len(matched) / len(job_skills)) * 100)
        
    return {
        "match_percentage": pct,
        "matched_skills": matched,
        "missing_skills": missing
    }


def calculate_resume_completion(resume):
    """Calculate completion from the sections maintained by Resume Builder."""
    def has_value(value):
        return bool(value and str(value).strip())

    projects = resume['projects'] or ''
    certifications = resume['certifications'] or ''
    project_parts = projects.split('||INTERNSHIPS||', 1)
    certification_parts = certifications.split('||ACHIEVEMENTS||', 1)

    project_value = project_parts[0]
    internship_value = project_parts[1] if len(project_parts) > 1 else ''
    if len(certification_parts) > 1:
        certification_value = certification_parts[0]
        achievements_and_languages = certification_parts[1]
        achievement_parts = achievements_and_languages.split('||LANGUAGES||', 1)
        achievement_value = achievement_parts[0]
        language_value = achievement_parts[1] if len(achievement_parts) > 1 else ''
    else:
        certification_and_languages = certifications.split('||LANGUAGES||', 1)
        certification_value = certification_and_languages[0]
        achievement_value = ''
        language_value = certification_and_languages[1] if len(certification_and_languages) > 1 else ''

    sections = {
        'personal': all(has_value(resume[field]) for field in ('name', 'email', 'phone')),
        'objective': has_value(resume['objective']),
        'education': has_value(resume['education']),
        'skills': has_value(resume['skills']),
        'experience': has_value(internship_value),
        'projects': has_value(project_value),
        'certifications': has_value(certification_value),
        'achievements': has_value(achievement_value),
        'languages': has_value(language_value),
    }
    completed_sections = sum(sections.values())
    completion = round((completed_sections / len(sections)) * 100)
    return completion, sections

@app.route('/api/match/<int:job_id>', methods=['GET'])
def get_job_match(job_id):
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    job = conn.execute('SELECT title, location, experience, required_skills FROM jobs WHERE id = ?', (job_id,)).fetchone()
    resume = conn.execute('SELECT skills FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    user = conn.execute('SELECT role, experience FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if not job or not resume:
        return jsonify({"match_percentage": 0, "matched_skills": [], "missing_skills": []})
        
    match_result = calculate_match(resume['skills'], job['required_skills'])
    role_text = (user['role'] if user else '') or ''
    job_title = (job['title'] if 'title' in job.keys() else '') or ''
    job_location = (job['location'] if 'location' in job.keys() else '') or ''
    job_experience = (job['experience'] if 'experience' in job.keys() else '') or ''
    role_score = 1 if role_text and any(word in job_title.lower() for word in role_text.lower().split() if len(word) > 2) else 0
    experience_score = 1 if user and user['experience'] and any(token in job_experience.lower() for token in user['experience'].lower().split() if token.isdigit()) else 0
    location_score = 1 if 'remote' in job_location.lower() else 0
    skill_score = match_result['match_percentage']
    match_result['match_percentage'] = min(100, round(skill_score * 0.7 + role_score * 15 + experience_score * 10 + location_score * 5))
    match_result['profile_strengths'] = match_result['matched_skills'][:]
    return jsonify(match_result)

# Applications Endpoints
@app.route('/api/applications', methods=['GET'])
def get_applications():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    apps = conn.execute('''
        SELECT a.id as app_id, a.status, a.source, a.applied_date, a.interview_date,
               a.interview_stage, a.recruiter, a.resume_used, a.notes, a.follow_up_date,
               a.job_link, a.status_history, j.*
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id
        WHERE a.user_id = ?
    ''', (user_id,)).fetchall()
    resume = conn.execute('SELECT skills FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    resume_skills = resume['skills'] if resume else ''
    result = []
    for app in apps:
        item = dict(app)
        item.update(calculate_match(resume_skills, item.get('required_skills') or ''))
        try:
            item['status_history'] = json.loads(item['status_history'] or '[]')
        except (TypeError, ValueError):
            item['status_history'] = []
        result.append(item)
    conn.close()
    return jsonify(result)


@app.route('/api/applications/analytics', methods=['GET'])
def get_application_analytics():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    rows = conn.execute('SELECT status, source, applied_date FROM applications WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()
    by_status = {status: 0 for status in APPLICATION_STATUSES}
    by_source = {}
    by_month = {}
    for row in rows:
        status = row['status'] or 'Applied'
        by_status[status] = by_status.get(status, 0) + 1
        source = row['source'] or 'ProfileMaster'
        by_source[source] = by_source.get(source, 0) + 1
        month = (row['applied_date'] or '')[:7]
        if month:
            by_month[month] = by_month.get(month, 0) + 1
    total = len(rows)
    interviews = sum(by_status.get(status, 0) for status in ('Interview', 'HR', 'Offer', 'Joined'))
    return jsonify({
        'by_status': by_status,
        'by_source': by_source,
        'by_month': dict(sorted(by_month.items())[-6:]),
        'interview_conversion': round((interviews / total) * 100) if total else 0,
    })

@app.route('/api/applications', methods=['POST'])
def add_application():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    job_id = data.get('job_id')
    status = data.get('status', 'Applied')
    now = datetime.now(timezone.utc).date().isoformat()
    history = json.dumps([{'status': status, 'date': now}])
    
    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM applications WHERE user_id = ? AND job_id = ?', (user_id, job_id)).fetchone()
    if not existing:
        conn.execute('''
            INSERT INTO applications
            (user_id, job_id, status, source, applied_date, status_history)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, job_id, status, data.get('source') or 'ProfileMaster',
              data.get('applied_date') or now, history))
        conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/applications/<int:app_id>', methods=['PUT'])
def update_application(app_id):
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    conn = get_db_connection()
    current = conn.execute('SELECT status, status_history FROM applications WHERE id = ? AND user_id = ?', (app_id, user_id)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Application not found'}), 404
    status = data.get('status', current['status'])
    history = json.loads(current['status_history'] or '[]')
    if status != current['status']:
        history.append({'status': status, 'date': datetime.now(timezone.utc).date().isoformat()})
    allowed = {'interview_date', 'interview_stage', 'recruiter', 'resume_used', 'notes', 'follow_up_date', 'source', 'applied_date', 'job_link'}
    updates = {key: data[key] for key in allowed if key in data}
    fields = ['status = ?', 'status_history = ?']
    values = [status, json.dumps(history)]
    for key, value in updates.items():
        fields.append(f'{key} = ?')
        values.append(value)
    values.extend([app_id, user_id])
    conn.execute(f'UPDATE applications SET {", ".join(fields)} WHERE id = ? AND user_id = ?', values)
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
def delete_application(app_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    conn = get_db_connection()
    cursor = conn.execute('DELETE FROM applications WHERE id = ? AND user_id = ?', (app_id, user_id))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Application not found'}), 404
    return jsonify({'status': 'success'})

# Saved Jobs Endpoints
@app.route('/api/saved_jobs', methods=['GET'])
def get_saved_jobs():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    saved = conn.execute('''
        SELECT s.id as saved_id, j.* 
        FROM saved_jobs s 
        JOIN jobs j ON s.job_id = j.id
        WHERE s.user_id = ?
    ''', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(s) for s in saved])

@app.route('/api/saved_jobs', methods=['POST'])
def save_job():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    job_id = data.get('job_id')
    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?', (user_id, job_id)).fetchone()
    if not existing:
        conn.execute('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', (user_id, job_id))
        conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/saved_jobs/<int:job_id>', methods=['DELETE'])
def remove_saved_job(job_id):
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    conn.execute('DELETE FROM saved_jobs WHERE job_id = ? AND user_id = ?', (job_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

# Dashboard Analytics
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    user_id = get_user_id(request)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    
    # Total jobs available
    total_jobs = conn.execute('SELECT COUNT(*) as c FROM jobs').fetchone()['c']
    
    # Saved jobs count
    saved_jobs = conn.execute('SELECT COUNT(*) as c FROM saved_jobs WHERE user_id = ?', (user_id,)).fetchone()['c']
    
    # Applications by status
    apps = conn.execute('SELECT status, COUNT(*) as c FROM applications WHERE user_id = ? GROUP BY status', (user_id,)).fetchall()
    app_stats = { 'Applied': 0, 'Interview': 0, 'Selected': 0, 'Rejected': 0, 'Total': 0 }
    for a in apps:
        app_stats[a['status']] = a['c']
        app_stats['Total'] += a['c']
        
    # Resume completion percentage
    resume = conn.execute('SELECT * FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    completion = 0
    resume_sections = {
        'personal': False,
        'objective': False,
        'education': False,
        'skills': False,
        'experience': False,
        'projects': False,
        'certifications': False,
        'achievements': False,
        'languages': False,
    }
    missing_skills_agg = {}
    
    if resume:
        completion, resume_sections = calculate_resume_completion(resume)
        
        # Calculate missing skills across all jobs
        jobs = conn.execute('SELECT required_skills FROM jobs').fetchall()
        for j in jobs:
            match_data = calculate_match(resume['skills'], j['required_skills'])
            for ms in match_data['missing_skills']:
                missing_skills_agg[ms] = missing_skills_agg.get(ms, 0) + 1
    
    conn.close()
    
    top_missing = sorted(missing_skills_agg.items(), key=lambda x: x[1], reverse=True)[:5]
    top_missing_skills = [k for k, v in top_missing]
    
    return jsonify({
        "completion_percentage": completion,
        "resume_sections": resume_sections,
        "total_jobs": total_jobs,
        "saved_jobs": saved_jobs,
        "applications": app_stats,
        "top_missing_skills": top_missing_skills
    })

# Roadmap & Interview Endpoints
SKILL_ALIASES = {
    'js': 'javascript',
    'javascript': 'javascript',
    'react': 'react js',
    'reactjs': 'react js',
    'react.js': 'react js',
    'html5': 'html',
    'css3': 'css',
    'postgresql': 'sql',
    'mysql': 'sql',
    'sql database': 'sql',
    'powerbi': 'power bi',
    'power bi': 'power bi',
    'git': 'git/github',
    'github': 'git/github',
    'git/github': 'git/github',
    'rest api': 'rest apis',
    'rest apis': 'rest apis',
    'scikit learn': 'scikit-learn',
    'sklearn': 'scikit-learn',
}

ROADMAP_RECOMMENDATIONS = {
    'data': [
        ('NumPy', 'Work efficiently with numerical data and arrays.', 'Beginner', '2-3 weeks'),
        ('Pandas', 'Clean, transform, and analyze real-world datasets.', 'Beginner', '2-4 weeks'),
        ('Matplotlib', 'Create clear charts and communicate data findings.', 'Beginner', '1-2 weeks'),
        ('Seaborn', 'Build statistically meaningful visualizations from datasets.', 'Beginner', '1-2 weeks'),
        ('Statistics', 'Strengthen the reasoning behind analysis and modeling.', 'Intermediate', '2-4 weeks'),
        ('SQL', 'Query and transform the data behind real products and reports.', 'Beginner', '2-3 weeks'),
        ('Scikit-learn', 'Build practical machine-learning models with Python.', 'Intermediate', '4-6 weeks'),
        ('Power BI', 'Turn analysis into interactive business dashboards.', 'Intermediate', '2-4 weeks'),
        ('Machine Learning', 'Move from data preparation to predictive solutions.', 'Intermediate', '6-8 weeks'),
    ],
    'machine_learning': [
        ('Deep Learning', 'Learn neural networks for complex data problems.', 'Advanced', '6-8 weeks'),
        ('TensorFlow', 'Train and deploy production-ready neural networks.', 'Advanced', '4-6 weeks'),
        ('PyTorch', 'Prototype and train flexible deep-learning models.', 'Advanced', '4-6 weeks'),
        ('NLP', 'Work with language data and text-based applications.', 'Advanced', '4-6 weeks'),
        ('Computer Vision', 'Build systems that understand images and video.', 'Advanced', '4-6 weeks'),
        ('MLOps', 'Operate, monitor, and continuously improve ML systems.', 'Advanced', '4-6 weeks'),
    ],
    'frontend': [
        ('React.js', 'Build component-based interfaces for modern web products.', 'Intermediate', '4-6 weeks'),
        ('TypeScript', 'Add reliable types and safer refactoring to JavaScript.', 'Intermediate', '2-4 weeks'),
        ('Git/GitHub', 'Collaborate confidently with version control workflows.', 'Beginner', '1-2 weeks'),
        ('REST APIs', 'Connect responsive interfaces to real backend services.', 'Intermediate', '2-3 weeks'),
        ('Responsive Design', 'Create interfaces that work across every screen size.', 'Beginner', '1-2 weeks'),
        ('Testing', 'Ship dependable interfaces with confidence.', 'Intermediate', '2-4 weeks'),
    ],
    'fullstack': [
        ('Node.js', 'Build server-side JavaScript services and tools.', 'Intermediate', '3-5 weeks'),
        ('Express.js', 'Create structured APIs and backend middleware.', 'Intermediate', '2-3 weeks'),
        ('REST APIs', 'Design reliable contracts between frontend and backend.', 'Intermediate', '2-3 weeks'),
        ('MongoDB', 'Model and query document-oriented application data.', 'Intermediate', '2-3 weeks'),
        ('Testing', 'Protect full-stack features with automated checks.', 'Intermediate', '2-4 weeks'),
    ],
}

ROADMAP_CONTENT = {
    'numpy': {
        'stage': 'Next step', 'prerequisites': ['Python'],
        'topics': ['Arrays and vectorized operations', 'Indexing and broadcasting', 'Linear algebra basics', 'Working with files'],
        'project': {'title': 'Numerical Data Explorer', 'description': 'Build a small analysis notebook that transforms and summarizes a real dataset.', 'difficulty': 'Beginner', 'duration': '1-2 weeks'},
        'resources': {'documentation': 'NumPy documentation', 'practice': 'Array manipulation exercises'}, 'next_skill': 'Pandas', 'career_paths': ['Data Analyst', 'Python Developer'],
    },
    'pandas': {
        'stage': 'Next step', 'prerequisites': ['Python', 'NumPy'],
        'topics': ['DataFrames and Series', 'Cleaning missing data', 'Grouping and aggregation', 'Merging datasets', 'Time-series basics'],
        'project': {'title': 'Dataset Cleaning Notebook', 'description': 'Clean and document a messy public dataset for analysis.', 'difficulty': 'Beginner', 'duration': '1-2 weeks'},
        'resources': {'documentation': 'Pandas documentation', 'practice': 'Data wrangling exercises'}, 'next_skill': 'Matplotlib', 'career_paths': ['Data Analyst', 'Junior Data Scientist'],
    },
    'matplotlib': {
        'stage': 'Next step', 'prerequisites': ['Python', 'Pandas'],
        'topics': ['Choosing chart types', 'Labels and annotations', 'Subplots and layouts', 'Communicating insights'],
        'project': {'title': 'Sales Data Analysis Dashboard', 'description': 'Clean sales data, visualize trends, and write three business insights.', 'difficulty': 'Beginner', 'duration': '1-2 weeks'},
        'resources': {'documentation': 'Matplotlib documentation', 'practice': 'Visualization exercises'}, 'next_skill': 'Statistics', 'career_paths': ['Data Analyst', 'Business Intelligence Analyst'],
    },
    'seaborn': {
        'stage': 'Next step', 'prerequisites': ['Python', 'Pandas', 'Statistics'],
        'topics': ['Distribution plots', 'Categorical comparisons', 'Regression plots', 'Heatmaps and correlation'],
        'project': {'title': 'Insightful Data Story', 'description': 'Present a dataset through a polished set of statistical visualizations.', 'difficulty': 'Beginner', 'duration': '1-2 weeks'},
        'resources': {'documentation': 'Seaborn documentation', 'practice': 'Visualization challenges'}, 'next_skill': 'Scikit-learn', 'career_paths': ['Data Analyst', 'Data Visualization Specialist'],
    },
    'statistics': {
        'stage': 'Intermediate', 'prerequisites': ['Python', 'NumPy', 'Pandas'],
        'topics': ['Mean, median, and mode', 'Variance and standard deviation', 'Probability basics', 'Distributions', 'Correlation', 'Hypothesis testing', 'Regression basics'],
        'project': {'title': 'Student Performance Analysis', 'description': 'Use a real dataset to test relationships and communicate evidence-based findings.', 'difficulty': 'Intermediate', 'duration': '2-4 weeks'},
        'resources': {'documentation': 'Statistics reference notes', 'practice': 'Dataset analysis exercises'}, 'next_skill': 'Scikit-learn', 'career_paths': ['Data Analyst', 'Junior Data Scientist'],
    },
    'scikit-learn': {
        'stage': 'Intermediate', 'prerequisites': ['Python', 'NumPy', 'Pandas', 'Statistics'],
        'topics': ['Train and test splits', 'Feature preparation', 'Regression', 'Classification', 'Model evaluation', 'Pipelines'],
        'project': {'title': 'Predictive Modeling Project', 'description': 'Train, evaluate, and explain a model against a practical question.', 'difficulty': 'Intermediate', 'duration': '3-5 weeks'},
        'resources': {'documentation': 'Scikit-learn documentation', 'practice': 'Modeling exercises'}, 'next_skill': 'Machine Learning', 'career_paths': ['Junior Data Scientist', 'Machine Learning Intern'],
    },
    'machine learning': {
        'stage': 'Intermediate', 'prerequisites': ['Python', 'Pandas', 'Statistics', 'Scikit-learn'],
        'topics': ['Feature engineering', 'Cross-validation', 'Model selection', 'Imbalanced data', 'Explainability', 'Deployment basics'],
        'project': {'title': 'End-to-End ML Service', 'description': 'Turn a trained model into a small documented prediction service.', 'difficulty': 'Intermediate', 'duration': '4-6 weeks'},
        'resources': {'documentation': 'Machine learning reference notes', 'practice': 'Kaggle-style exercises'}, 'next_skill': 'Deep Learning', 'career_paths': ['Data Scientist', 'Machine Learning Engineer'],
    },
    'react js': {
        'stage': 'Next step', 'prerequisites': ['JavaScript', 'HTML', 'CSS'],
        'topics': ['Components and JSX', 'Props and state', 'Hooks', 'Routing', 'API integration', 'Testing'],
        'project': {'title': 'Career Dashboard', 'description': 'Build a responsive dashboard with reusable components and API data.', 'difficulty': 'Intermediate', 'duration': '3-5 weeks'},
        'resources': {'documentation': 'React documentation', 'practice': 'Component-building exercises'}, 'next_skill': 'TypeScript', 'career_paths': ['Frontend Developer', 'React Developer'],
    },
    'typescript': {
        'stage': 'Intermediate', 'prerequisites': ['JavaScript', 'React JS'],
        'topics': ['Types and interfaces', 'Generics', 'Component props', 'API response types', 'Safe refactoring'],
        'project': {'title': 'Typed Product Interface', 'description': 'Convert a JavaScript interface to TypeScript with typed API data.', 'difficulty': 'Intermediate', 'duration': '2-4 weeks'},
        'resources': {'documentation': 'TypeScript documentation', 'practice': 'Type challenges'}, 'next_skill': 'Testing', 'career_paths': ['Frontend Developer', 'Full-stack Developer'],
    },
    'sql': {
        'stage': 'Next step', 'prerequisites': ['Python'],
        'topics': ['Select and filter data', 'Joins and relationships', 'Grouping and aggregation', 'Subqueries and CTEs', 'Window functions'],
        'project': {'title': 'Analytics SQL Report', 'description': 'Build a set of business queries and explain the decisions they support.', 'difficulty': 'Beginner', 'duration': '2-3 weeks'},
        'resources': {'documentation': 'SQL reference notes', 'practice': 'Query exercises'}, 'next_skill': 'Statistics', 'career_paths': ['Data Analyst', 'Backend Developer'],
    },
}


def get_skill_content(name, description, difficulty, duration):
    content = ROADMAP_CONTENT.get(normalize_skill_name(name), {})
    return {
        'key': normalize_skill_name(name),
        'name': name,
        'description': description,
        'difficulty': difficulty,
        'duration': duration,
        'stage': content.get('stage', 'Advanced'),
        'prerequisites': content.get('prerequisites', []),
        'topics': [{'id': f'{normalize_skill_name(name)}-{index}', 'title': topic} for index, topic in enumerate(content.get('topics', []), 1)],
        'project': content.get('project', {'title': f'{name} Practice Project', 'description': f'Build a small project that demonstrates {name}.', 'difficulty': difficulty, 'duration': duration}),
        'resources': content.get('resources', {}),
        'next_skill': content.get('next_skill', ''),
        'career_paths': content.get('career_paths', []),
    }


def normalize_skill_name(skill):
    value = re.sub(r'\s+', ' ', (skill or '').strip().lower())
    return SKILL_ALIASES.get(value, value)


def extract_resume_skills(resume):
    return [skill.strip() for skill in (resume['skills'] or '').split(',') if skill.strip()]


JOB_ROLE_PROFILES = [
    {
        'id': 'html-css-developer', 'title': 'HTML/CSS Developer', 'category': 'Development',
        'description': 'HTML and CSS are used to structure and style responsive web pages and user interfaces.',
        'required': ['HTML', 'CSS'],
        'preferred': ['Responsive Design', 'Git'],
        'what_to_build': 'Static websites, landing pages, and responsive email templates.',
        'learning_topics': ['Semantic HTML', 'CSS Flexbox/Grid', 'Responsive Design', 'Accessibility'],
        'interview_topics': ['CSS Specificity', 'Box Model', 'HTML5 Elements', 'Media Queries'],
        'next_paths': ['Web Developer', 'UI Developer'],
        'progression': ['html-css-developer']
    },
    {
        'id': 'web-developer', 'title': 'Web Developer / Frontend Developer', 'category': 'Development',
        'description': 'Build responsive and interactive web applications using core web technologies.',
        'required': ['HTML', 'CSS', 'JavaScript'],
        'preferred': ['Git', 'DOM Manipulation'],
        'what_to_build': 'Interactive websites, dynamic forms, and browser-based games.',
        'learning_topics': ['JavaScript ES6+', 'DOM Manipulation', 'Event Handling', 'Async/Await'],
        'interview_topics': ['Closures', 'Promises', 'Event Delegation', 'Hoisting'],
        'next_paths': ['React Developer', 'Fullstack Developer'],
        'progression': ['html-css-developer', 'web-developer']
    },
    {
        'id': 'react-developer', 'title': 'React Developer', 'category': 'Development',
        'description': 'Build modern, component-based user interfaces and single-page applications.',
        'required': ['HTML', 'CSS', 'JavaScript', 'React'],
        'preferred': ['Redux', 'REST APIs', 'Git'],
        'what_to_build': 'Single-page applications (SPAs), complex dashboards, and interactive UI components.',
        'learning_topics': ['React Hooks', 'State Management', 'Component Lifecycle', 'Routing'],
        'interview_topics': ['Virtual DOM', 'useEffect Hook', 'State vs Props', 'Context API'],
        'next_paths': ['Senior Frontend Developer', 'Fullstack Developer'],
        'progression': ['html-css-developer', 'web-developer', 'react-developer']
    },
    {
        'id': 'python-developer', 'title': 'Python Developer', 'category': 'Development',
        'description': 'Python Developers build applications, automation scripts, backend services and APIs using Python.',
        'required': ['Python'],
        'preferred': ['SQL', 'Git', 'REST APIs', 'OOP', 'Flask', 'Django'],
        'what_to_build': 'Automation scripts, backend services, APIs, and software tools.',
        'learning_topics': ['Python Basics', 'OOP', 'File I/O', 'Error Handling'],
        'interview_topics': ['Data Structures', 'Generators/Decorators', 'Memory Management', 'Pythonic Code'],
        'next_paths': ['Backend Developer', 'Data Analyst', 'Data Scientist'],
        'progression': ['python-developer']
    },
    {
        'id': 'backend-developer', 'title': 'Backend / Python Developer', 'category': 'Development',
        'description': 'Develop, scale and maintain server-side logic, databases and APIs.',
        'required': ['Python', 'SQL'],
        'preferred': ['REST APIs', 'Docker', 'Git', 'AWS'],
        'what_to_build': 'REST APIs, database schemas, and scalable server-side architectures.',
        'learning_topics': ['Database Design', 'RESTful APIs', 'Authentication/Authorization', 'Server Deployment'],
        'interview_topics': ['SQL Joins/Indexes', 'API Design', 'System Architecture', 'Security'],
        'next_paths': ['Senior Backend Developer', 'Cloud Engineer'],
        'progression': ['python-developer', 'backend-developer']
    },
    {
        'id': 'java-developer', 'title': 'Java Developer', 'category': 'Development',
        'description': 'Develop robust applications and software systems using Java.',
        'required': ['Java'],
        'preferred': ['OOP', 'Git'],
        'what_to_build': 'Desktop applications, Android apps, and enterprise software components.',
        'learning_topics': ['Java Syntax', 'OOP Concepts', 'Collections Framework', 'Exception Handling'],
        'interview_topics': ['Multithreading', 'JVM Architecture', 'Design Patterns', 'Garbage Collection'],
        'next_paths': ['Java Backend Developer', 'Android Developer'],
        'progression': ['java-developer']
    },
    {
        'id': 'java-backend-developer', 'title': 'Java Backend Developer', 'category': 'Development',
        'description': 'Develop backend applications and database integrations using Java.',
        'required': ['Java', 'OOP', 'SQL'],
        'preferred': ['REST APIs', 'Git'],
        'what_to_build': 'Database-driven applications, APIs, and backend services.',
        'learning_topics': ['JDBC', 'SQL Optimization', 'Servlets', 'API Design'],
        'interview_topics': ['SQL Queries', 'Concurrency', 'Transaction Management', 'Data Structures'],
        'next_paths': ['Spring Boot Backend Developer', 'Software Architect'],
        'progression': ['java-developer', 'java-backend-developer']
    },
    {
        'id': 'spring-boot-backend-developer', 'title': 'Spring Boot Backend Developer', 'category': 'Development',
        'description': 'Develop scalable backend services using Java and Spring Boot.',
        'required': ['Java', 'Spring Boot', 'SQL', 'REST APIs'],
        'preferred': ['Microservices', 'Docker', 'Git'],
        'what_to_build': 'Microservices, enterprise REST APIs, and scalable web applications.',
        'learning_topics': ['Spring Core', 'Spring MVC', 'Spring Data JPA', 'Microservices'],
        'interview_topics': ['Dependency Injection', 'Spring Boot Auto-configuration', 'JPA/Hibernate', 'Microservices Architecture'],
        'next_paths': ['Lead Developer', 'Solutions Architect'],
        'progression': ['java-developer', 'java-backend-developer', 'spring-boot-backend-developer']
    },
    {
        'id': 'data-analyst', 'title': 'Data Analyst', 'category': 'Data',
        'description': 'Analyze data and generate business insights for better decisions.',
        'required': ['Python', 'SQL', 'Pandas', 'Data Visualization'],
        'preferred': ['Excel', 'Power BI', 'Tableau', 'Statistics'],
        'what_to_build': 'Data reports, interactive dashboards, and business insights.',
        'learning_topics': ['Data Cleaning', 'Exploratory Data Analysis', 'SQL Queries', 'Data Visualization'],
        'interview_topics': ['SQL Functions', 'Pandas Operations', 'Statistical Analysis', 'Business Case Studies'],
        'next_paths': ['Data Scientist', 'Business Intelligence Analyst'],
        'progression': ['python-developer', 'data-analyst']
    },
    {
        'id': 'data-scientist', 'title': 'Data Scientist', 'category': 'Data',
        'description': 'Data Science combines mathematics, statistics, programming, data analysis and machine learning to turn raw data into useful insights and predictions.',
        'required': ['Python', 'Statistics', 'Pandas', 'NumPy', 'Machine Learning'],
        'preferred': ['Data Visualization', 'SQL', 'Jupyter'],
        'what_to_build': 'Predictive models, recommendation systems, and advanced analytics pipelines.',
        'learning_topics': ['Machine Learning Algorithms', 'Model Evaluation', 'Feature Engineering', 'Probability/Statistics'],
        'interview_topics': ['Overfitting/Underfitting', 'Algorithm Selection', 'Statistical Significance', 'Python Data Stack'],
        'next_paths': ['Machine Learning Engineer', 'AI/ML Engineer'],
        'progression': ['python-developer', 'data-analyst', 'data-scientist']
    },
    {
        'id': 'machine-learning-engineer', 'title': 'Machine Learning Engineer', 'category': 'AI/ML',
        'description': 'Develop, evaluate, and operate machine-learning systems.',
        'required': ['Python', 'Machine Learning', 'Statistics'],
        'preferred': ['Deep Learning', 'Scikit-learn', 'Pandas', 'NumPy'],
        'what_to_build': 'Production machine learning systems, automated data pipelines, and scalable models.',
        'learning_topics': ['Model Deployment', 'MLOps', 'Deep Learning Basics', 'Scalable Architecture'],
        'interview_topics': ['Model Optimization', 'System Design', 'Algorithm Complexity', 'ML Frameworks'],
        'next_paths': ['AI Engineer', 'Lead ML Engineer'],
        'progression': ['python-developer', 'data-scientist', 'machine-learning-engineer']
    },
    {
        'id': 'ai-engineer', 'title': 'AI/ML Engineer', 'category': 'AI/ML',
        'description': 'AI Engineers develop, integrate and deploy AI and machine-learning systems using programming, machine learning models, APIs and deployment technologies.',
        'required': ['Python', 'Data Structures & Algorithms', 'Machine Learning', 'Deep Learning', 'APIs', 'Model Deployment'],
        'preferred': ['TensorFlow', 'PyTorch', 'Docker'],
        'what_to_build': 'Intelligent systems, generative AI applications, and end-to-end predictive models.',
        'learning_topics': ['Neural Networks', 'NLP / Computer Vision', 'Cloud Deployment', 'Advanced Algorithms'],
        'interview_topics': ['Deep Learning Architectures', 'Optimization Techniques', 'System Scalability', 'Advanced DSA'],
        'next_paths': ['AI Architect', 'Head of AI'],
        'progression': ['python-developer', 'data-scientist', 'machine-learning-engineer', 'ai-engineer']
    }
]


def calculate_role_match(user_skills, role):
    normalized_user_skills = {normalize_skill_name(skill) for skill in user_skills}
    required = [normalize_skill_name(skill) for skill in role['required']]
    preferred = [normalize_skill_name(skill) for skill in role['preferred']]
    matched_required = [skill for skill in role['required'] if normalize_skill_name(skill) in normalized_user_skills]
    missing_required = [skill for skill in role['required'] if normalize_skill_name(skill) not in normalized_user_skills]
    matched_preferred = [skill for skill in role['preferred'] if normalize_skill_name(skill) in normalized_user_skills]
    missing_preferred = [skill for skill in role['preferred'] if normalize_skill_name(skill) not in normalized_user_skills]
    required_match = round((len(matched_required) / len(required)) * 100) if required else 0
    preferred_match = round((len(matched_preferred) / len(preferred)) * 100) if preferred else 0

    if required_match == 100:
        match_level = 'Strong Skill Match'
        guidance = 'Your skills currently match many of the core requirements for this role.'
        path_type = 'Current Match'
    elif required_match >= 50:
        match_level = 'Good Skill Match'
        guidance = 'You have a solid base for this role. Strengthen the remaining core skills to improve your coverage.'
        path_type = 'Next Path'
    elif required_match > 0 or len(matched_preferred) > 0:
        match_level = 'Partial Skill Match'
        guidance = 'You have some of the core skills required for this role. Consider developing the missing skills.'
        path_type = 'Future Path'
    else:
        match_level = 'Skills Need Development'
        guidance = 'This role is a longer-term direction based on your current resume skills.'
        path_type = 'No Match'

    return {
        **role,
        'required_match': required_match,
        'preferred_match': preferred_match,
        'match_level': match_level,
        'guidance': guidance,
        'path_type': path_type,
        'matched_required': matched_required,
        'missing_required': missing_required,
        'matched_preferred': matched_preferred,
        'missing_preferred': missing_preferred,
        'required_missing': [{'name': skill, 'priority': 'High', 'reason': f'{skill} is listed as a core requirement for {role["title"]}.'} for skill in missing_required],
        'preferred_missing': [{'name': skill, 'priority': 'Medium', 'reason': f'{skill} is a preferred skill that can strengthen your {role["title"]} profile.'} for skill in missing_preferred],
    }


def get_recommended_skills(current_skills, role=''):
    normalized = {normalize_skill_name(skill) for skill in current_skills}
    role_value = (role or '').lower()

    if {'python', 'pandas'}.issubset(normalized) or {'sql', 'pandas'}.issubset(normalized):
        catalog = ROADMAP_RECOMMENDATIONS['machine_learning'] if {'machine learning', 'scikit-learn'}.intersection(normalized) else ROADMAP_RECOMMENDATIONS['data']
    elif {'javascript', 'react js'}.issubset(normalized) or 'frontend' in role_value:
        catalog = ROADMAP_RECOMMENDATIONS['fullstack'] if 'fullstack' in role_value else ROADMAP_RECOMMENDATIONS['frontend']
    elif 'javascript' in normalized or 'html' in normalized or 'css' in normalized:
        catalog = ROADMAP_RECOMMENDATIONS['frontend']
    else:
        catalog = ROADMAP_RECOMMENDATIONS['data'] if 'data' in role_value or 'python' in normalized else ROADMAP_RECOMMENDATIONS['frontend']

    return [
        get_skill_content(name, description, difficulty, duration)
        for name, description, difficulty, duration in catalog
        if normalize_skill_name(name) not in normalized
    ]


@app.route('/api/roadmap/recommendations', methods=['GET'])
def get_roadmap_recommendations():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    resume = conn.execute('SELECT * FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    user = conn.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()

    if not resume:
        return jsonify({'has_resume': False, 'current_skills': [], 'recommended_skills': []})

    current_skills = extract_resume_skills(resume)
    return jsonify({
        'has_resume': True,
        'current_skills': current_skills,
        'target_role': (resume['target_role'] if 'target_role' in resume.keys() else '') or (user['role'] if user else ''),
        'recommended_skills': get_recommended_skills(current_skills, (resume['target_role'] if 'target_role' in resume.keys() else '') or (user['role'] if user else '')),
    })


@app.route('/api/roadmap/career-matches', methods=['GET'])
def get_career_matches():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    category = request.args.get('category', '').strip().lower()
    search = request.args.get('search', '').strip().lower()
    conn = get_db_connection()
    resume = conn.execute('SELECT * FROM resume WHERE user_id = ?', (user_id,)).fetchone()
    user = conn.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()

    current_skills = extract_resume_skills(resume) if resume else []
    resume_target = (resume['target_role'] if resume and 'target_role' in resume.keys() else '') or (user['role'] if user else '')
    if not current_skills:
        return jsonify({'has_resume': bool(resume), 'current_skills': [], 'target_role': resume_target, 'roles': [], 'summary': {'career_paths': 0, 'strongest_match': None, 'average_match': 0, 'skills_to_upgrade': 0}})

    all_roles = [calculate_role_match(current_skills, role) for role in JOB_ROLE_PROFILES]
    roles = [role for role in all_roles if role['path_type'] != 'No Match']
    target_role = (resume_target or '').strip().lower()
    if category:
        roles = [role for role in roles if role['category'].lower() == category]
    if search:
        roles = [role for role in roles if search in role['title'].lower() or search in role['category'].lower()]
    roles.sort(key=lambda role: (0 if target_role and (target_role in role['title'].lower() or role['title'].lower() in target_role) else 1, -role['required_match']))

    all_missing = []
    for role in roles:
        all_missing.extend(item['name'] for item in role['required_missing'] + role['preferred_missing'])
    strongest = roles[0] if roles else None
    average_match = round(sum(role['required_match'] for role in roles) / len(roles)) if roles else 0
    return jsonify({
        'has_resume': True,
        'current_skills': current_skills,
        'target_role': resume_target,
        'roles': roles,
        'all_roles': all_roles,
        'summary': {
            'career_paths': len(roles),
            'strongest_match': strongest['title'] if strongest else None,
            'average_match': average_match,
            'skills_to_upgrade': len({normalize_skill_name(skill) for skill in all_missing}),
        },
    })


@app.route('/api/roadmap', methods=['GET'])
def get_roadmap():
    skill = request.args.get('skill', '')
    conn = get_db_connection()
    steps = conn.execute('SELECT * FROM learning_roadmaps ORDER BY step_order').fetchall()
    conn.close()
    normalized_skill = normalize_skill_name(skill)
    return jsonify([dict(step) for step in steps if normalize_skill_name(step['skill']) == normalized_skill])

@app.route('/api/interview', methods=['GET'])
def get_interview_questions():
    topic = request.args.get('topic', '')
    conn = get_db_connection()
    if topic:
        questions = conn.execute('SELECT * FROM interview_questions WHERE LOWER(topic) = LOWER(?)', (topic,)).fetchall()
    else:
        questions = conn.execute('SELECT DISTINCT topic FROM interview_questions').fetchall()
        return jsonify([q['topic'] for q in questions])
    conn.close()
    return jsonify([dict(q) for q in questions])

if __name__ == '__main__':
    # Add a small delay for dev restart
    time.sleep(1)
    init_db()
    app.run(debug=True, port=5000)
