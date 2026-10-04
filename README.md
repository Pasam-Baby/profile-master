# Profile Master - Smart Career Assistant 🚀

Profile Master is a full-stack career assistant designed to help users optimize resumes, track job applications, calculate skill gaps, and prepare for interviews using a lightweight SQL backend.

## ✨ Final Features Implemented

1. **User Authentication**: Secure token-based registration and login using `werkzeug.security` password hashing.
2. **Dashboard Analytics**: Real-time charts of profile completion, top missing skills, and application status breakdown.
3. **Resume Builder**: Fully editable form with professional real-time preview.
4. **Skill-Based Job Matching**: Python backend calculates exact percentage match between the user's saved resume and the job's `required_skills`.
5. **Skill Gap Analysis**: Visual breakdown of matched vs. missing skills for any job.
6. **Application Tracker**: Kanban/Table tracker to save jobs and update their statuses (Applied, Interview, Selected, Rejected).
7. **Learning Roadmaps**: Auto-generated step-by-step learning paths for the user's top missing skills.
8. **Interview Prep**: Flashcard-style interview questions loaded from the database based on skill topics.

## 🛠️ Technology Stack

- **Frontend**: React JS, HTML, CSS (Tailwind)
- **Backend**: Python (Flask REST API)
- **Database**: SQLite (SQL)

## 🏗️ Project Structure

```text
profile-master/
├── backend/
│   ├── app.py             # Flask application & API Endpoints
│   ├── schema.sql         # SQL Database Schema & Seed Data
│   └── career_assistant.db# SQLite Database (Auto-generated)
├── src/
│   ├── components/
│   │   └── Navigation.jsx # Sidebar routing
│   ├── context/
│   │   └── AuthContext.jsx# Handles user_id token and fetchWithAuth
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx & Register.jsx
│   │   ├── ResumeBuilder.jsx
│   │   ├── Jobs.jsx & JobDetails.jsx
│   │   ├── SkillAnalysis.jsx
│   │   ├── ApplicationTracker.jsx
│   │   ├── Roadmap.jsx
│   │   └── InterviewPrep.jsx
│   ├── App.jsx            # Main Router Setup
│   └── main.jsx           # Entry point
```

## 🔌 Important API Endpoints

- `POST /api/register` & `POST /api/login`: Authentication.
- `GET/POST /api/resume`: Fetch and update the logged-in user's resume.
- `GET /api/jobs` & `GET /api/jobs/<id>`: View available job listings.
- `GET /api/match/<job_id>`: Calculates the skill gap (Python intersection logic).
- `GET/POST/PUT /api/applications`: Manage user's application statuses.
- `GET /api/dashboard`: Aggregates stats (completion %, top missing skills).
- `GET /api/roadmap?skill=<skill>`: Fetches step-by-step learning paths.
- `GET /api/interview?topic=<topic>`: Fetches mock interview questions.

## 🚀 How to Run Locally

### 1. Start the Python Backend
Ensure you have Python installed.
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install flask flask-cors
python app.py
```
*(The backend runs on `http://localhost:5000`)*

### 2. Start the React Frontend
Open a new terminal in the root directory.
```bash
npm install
npm run dev
```
*(The frontend runs on the port specified by Vite, usually `http://localhost:5173`)*

## 💡 How it works (Interview Prep)
- **Frontend-Backend Connection**: The React frontend uses the `fetchWithAuth` wrapper to inject the `user_id` into the headers of all protected requests. The Flask backend extracts this ID to ensure data privacy.
- **SQL Database Usage**: SQLite is used relationally. The `users` table acts as the parent for `resume`, `applications`, and `saved_jobs` using Foreign Keys, ensuring user A cannot access user B's data. 
- **Matching Logic**: Done entirely in Python by comparing sets: `user_skills.intersection(job_skills)`.
