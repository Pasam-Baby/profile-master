import { ResumeAgent } from './ResumeAgent';
import { JobAgent } from './JobAgent';
import { CareerAgent } from './CareerAgent';

export class AgentOrchestrator {
  private resumeAgent: ResumeAgent;
  private jobAgent: JobAgent;
  private careerAgent: CareerAgent;

  constructor() {
    this.resumeAgent = new ResumeAgent();
    this.jobAgent = new JobAgent();
    this.careerAgent = new CareerAgent();
  }

  async runResumeAnalysis(text: string) {
    return await this.resumeAgent.analyzeResume(text);
  }

  async runJobMatch(resumeText: string, jobDesc: string) {
    return await this.jobAgent.matchJob(resumeText, jobDesc);
  }

  async runRoadmapGeneration(skills: string[], role: string) {
    return await this.careerAgent.generateRoadmap(skills, role);
  }
}

export const orchestrator = new AgentOrchestrator();
