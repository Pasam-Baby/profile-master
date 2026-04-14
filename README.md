# Profile Master - Smart Career Assistant 🚀

Profile Master is a full-stack, AI-powered career assistant designed to help users optimize resumes, track job applications, and plan their career roadmaps.

## ✨ Features

- **Dashboard**: Professional overview with real-time statistics and AI-driven recommendations.
- **Resume Analyzer**: Upload a PDF to get an ATS score, skill analysis, and optimization tips.
- **Job Tracker**: Manage your job applications with a cloud-synced tracker.
- **Career Roadmap**: Generate personalized multi-phase learning paths for your target roles.
- **AI Assistant**: 24/7 career coaching and resume writing support.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Premium Glassmorphism Design)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Agent-based architecture using OpenAI API

## 🚀 Setup Instructions

1. **Clone the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file (see `.env.example`) and add your:
   - Firebase Credentials
   - OpenAI/OpenRouter API Key
4. **Run Development Server**:
   ```bash
   npm run dev
   ```
5. **Build for Production**:
   ```bash
   npm run build
   ```

## 🏗️ Architecture

The project follows a **Clean Agent Architecture**:
- `src/agents`: Contains specialized AI agents for different tasks.
- `src/services`: Core service layer for AI and external integrations.
- `src/context`: Global state management for Auth and UI feedback (Toasts).
- `src/pages`: Feature-specific views with premium aesthetics.

---

Built with ❤️ by Profile Master Team
