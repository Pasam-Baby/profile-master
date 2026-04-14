import { BaseAgent } from './BaseAgent';

export class JobAgent extends BaseAgent {
  protected name = "Job Strategist";
  protected description = "Matches resumes to job descriptions and provides application strategy.";
  protected systemPrompt = `You are an expert Job Strategist. 
  You specialize in matching candidates to job descriptions.
  You provide:
  1. Match percentage.
  2. Keywords to add to the resume for this specific job.
  3. Tailored cover letter points.
  4. Interview preparation tips for this role.`;

  async matchJob(resumeText: string, jobDescription: string): Promise<any> {
    const prompt = `Resume: ${resumeText}\n\nJob Description: ${jobDescription}\n\nAssess the compatibility and provide strategic advice.`;
    return await this.processTask(prompt);
  }
}
