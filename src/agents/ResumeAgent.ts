import { BaseAgent } from './BaseAgent';

export class ResumeAgent extends BaseAgent {
  protected name = "Resume Optimizer";
  protected description = "Analyzes resumes for ATS optimization, skill gaps, and professional impact.";
  protected systemPrompt = `You are an expert Resume Optimizer and Career Counselor. 
  Your goal is to analyze provided resume text and provide:
  1. A score (0-100).
  2. Identified key skills.
  3. Identified skill gaps for the user's target roles.
  4. Specific, actionable advice for improvement.
  Return your analysis in a structured format (JSON if requested, otherwise clear markdown).`;

  async analyzeResume(resumeText: string): Promise<any> {
    const prompt = `Please analyze the following resume text. Provide a JSON response with the following keys: score (number), skills (string array), gaps (string array), suggestions (string array).
    
    Resume Text:
    ${resumeText}`;

    const response = await this.processTask(prompt);
    try {
      // Try to parse JSON if the model followed instructions
      const cleanJson = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { text: response };
    }
  }
}
