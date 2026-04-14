# Profile Master - Smart Career Assistant

This implementation plan outlines the development of a full-stack AI-powered web application designed to help users analyze and optimize their resumes, detect skill gaps, and strategize their career paths using React, TypeScript, and Firebase.

## User Review Required

> [!IMPORTANT]
> **OpenRouter/OpenAI API Keys**: We will need an AI provider key to implement the advanced AI features (Resume Analyzer, Job Matching, Chat Assistant). Do you have an OpenAI or OpenRouter API key available to supply in the environment variables?
> **Firebase Project**: I will initialize the frontend with placeholders for Firebase config. Alternatively, I can help you set up a Firebase project and insert the real config. Which do you prefer?
> 
> Please review the architecture and testing strategies below and approve so we can begin execution!

## Architecture Overview

We will adopt a Clean Architecture pattern, using a component-based structure, Context API for state management, and a dedicated Service Layer over specialized "Agents".

- **Frontend Framework**: React 18 with Vite and TypeScript.
- **Styling**: Tailwind CSS for modern, responsive aesthetics (with smooth animations and glassmorphism hints).
- **Backend/BaaS**: Firebase (Auth, Firestore, Storage) to handle user data, resume uploads, and job application tracking.
- **Agent Orchestrator Model**: We will implement pure TypeScript logic agents (`ResumeAgent`, `JobAgent`, `CareerAgent`) orchestrated by a central `AgentOrchestrator` to interface with the AI services.

## Proposed Changes & Phased Execution

### Phase 1: Project Setup & Foundation
- Initialize a **Vite + React + TypeScript** project.
- Install and configure **Tailwind CSS**.
- Establish the folder structure (`/src/components`, `/src/services`, `/src/agents`, `/src/pages`, `/src/context`).
- Configure Firebase app initialization and Authentication contexts.

### Phase 2: Core Routing & Auth
- Build **Google Sign-In** implementation and protected routes.
- Create Navigation/Sidebar components.
- Develop the initial aesthetic User Dashboard layout with placeholder stats.

### Phase 3: Service Layer & Agent Architecture
- Implement `ai.service.ts` to connect to OpenAI/OpenRouter APIs.
- Implement specialized agents:
  - `ResumeAgent`: Handles document parsing and delegates analysis/rewriting to the AI service.
  - `JobAgent`: Manages job matching based on resume context.
  - `CareerAgent`: Generates roadmaps.
- Implement an `AgentOrchestrator` to queue, rate-limit, and delegate user tasks to these agents.
- Handle Usage limits logic (Free vs Premium tier simulated fields).

### Phase 4: Core Feature Implementation
- **Resume Analyzer & Parser**: Implement UI to drag-and-drop PDF/DOCX (using libraries like `pdfjs-dist`), and feed text to AI for a structured JSON response (Score, Skills, Formatting).
- **Job Tracker**: Create a Kanban-style drag-and-drop or table for users to track applied jobs in Firestore.
- **AI Chat Assistant**: A persistent chat component using the Context API for context-awareness.

### Phase 5: Polish & Testing
- Implement retry logic and robust error toasts.
- Setup **Vitest + React Testing Library** for unit tests.
- Setup **Cypress** for essential E2E testing of the authentication and upload flow.

## Open Questions

1. **Document Parsing**: Parsing PDFs entirely on the frontend can sometimes miss complex formatting. Do you want to use a pure frontend library (e.g., `pdfjs`) or are we open to using an API service for document extraction?
2. **Next.js vs Vite**: The plan suggests a React + Vite SPA, given Firebase is used. Next.js could be used for secure, serverless API routes to hide your AI API keys. Would you prefer Next.js instead of Vite?

## Verification Plan

### Automated Tests
- Run `npm run test` (Vitest) to check the Service Layer and Agent workflows.
- Run `npx cypress run` to verify login, routing, and upload features.

### Manual Verification
- We will verify the UI aesthetics on desktop and mobile.
- Complete a test flow: Uploading a sample resume and verifying the Agent orchestrator appropriately routes to `ResumeAgent` and updates Firebase seamlessly.
