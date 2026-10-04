import { ResumeAgent } from './ResumeAgent';
import { JobAgent } from './JobAgent';
import { CareerAgent } from './CareerAgent';

export class AgentOrchestrator {
  constructor() {
    this.resumeAgent = new ResumeAgent();
    this.jobAgent = new JobAgent();
    this.careerAgent = new CareerAgent();
  }

  async runResumeAnalysis(text) {
    return await this.resumeAgent.analyzeResume(text);
  }

  async runJobMatch(resumeText, jobDesc) {
    return await this.jobAgent.matchJob(resumeText, jobDesc);
  }

  async runRoadmapGeneration(skills, role) {
    return await this.careerAgent.generateRoadmap(skills, role);
  }
}

export const orchestrator = new AgentOrchestrator();
