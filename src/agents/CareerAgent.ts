import { BaseAgent } from './BaseAgent';

export class CareerAgent extends BaseAgent {
  protected name = "Career Architect";
  protected description = "Generates personalized career roadmaps and learning paths.";
  protected systemPrompt = `You are an expert Career Architect. 
  You specialize in creating step-by-step career roadmaps.
  Given a user's current skills and a target role, you provide:
  1. A multi-phase roadmap.
  2. Specific skills to learn in each phase.
  3. Recommended projects or certifications.
  4. Estimated timeline.`;

  async generateRoadmap(currentSkills: string[], targetRole: string): Promise<any> {
    const prompt = `Current Skills: ${currentSkills.join(', ')}\nTarget Role: ${targetRole}\n\nGenerate a detailed career roadmap. Provide a JSON response with 'phases' (array of {title, tasks, skills, duration}).`;
    
    const response = await this.processTask(prompt);
    try {
      const cleanJson = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return { text: response };
    }
  }
}
