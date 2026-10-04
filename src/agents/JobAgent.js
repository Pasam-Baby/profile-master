import { BaseAgent } from './BaseAgent';

export class JobAgent extends BaseAgent {
  constructor() {
    super();
    this.name = 'Job Strategist';
    this.description = 'Matches resumes to job descriptions and provides application strategy.';
    this.systemPrompt = `You are an expert Job Strategist.
    You specialize in matching candidates to job descriptions.
    You provide:
    1. Match percentage.
    2. Keywords to add to the resume for this specific job.
    3. Tailored cover letter points.
    4. Interview preparation tips for this role.`;
  }

  async matchJob(resumeText, jobDescription) {
    const prompt = `Resume: ${resumeText}\n\nJob Description: ${jobDescription}\n\nAssess the compatibility and provide strategic advice.`;
    return await this.processTask(prompt);
  }
}
