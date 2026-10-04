import { useState } from 'react';
import { Map, Target, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { orchestrator } from '../agents/AgentOrchestrator';

export default function CareerRoadmap() {
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  const generateRoadmap = async () => {
    if (!targetRole) return;
    setLoading(true);
    try {
      const skillsArray = currentSkills.split(',').map((s) => s.trim()).filter((s) => s);
      const result = await orchestrator.runRoadmapGeneration(skillsArray, targetRole);
      setRoadmap(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase">
          <Map className="w-3 h-3" /> Strategic Planning
        </div>
        <h1 className="text-6xl font-black tracking-tighter leading-none">
          Career <span className="text-gradient">Roadmap</span>
        </h1>
        <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto">
          Architect your professional future. Define your target designation and deploy AI to bridge the gap.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-3 items-start">
        <Card className="p-10 glass-card border-0 space-y-8 md:col-span-1 h-fit sticky top-8 rounded-[3rem]">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Target Designation
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Senior Architect"
                className="w-full px-6 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Current Stack
              </label>
              <textarea
                value={currentSkills}
                onChange={(e) => setCurrentSkills(e.target.value)}
                placeholder="React, Node, AWS..."
                className="w-full h-40 px-6 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none resize-none"
              />
            </div>
            <Button
              className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs premium-gradient border-0 text-white shadow-xl shadow-primary/20 hover-lift active:scale-95"
              onClick={generateRoadmap}
              disabled={loading || !targetRole}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Map className="w-5 h-5 mr-2" />}
              Generate Path
            </Button>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-10">
          {!roadmap && !loading && (
            <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 glass-card border-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[3rem]">
              <div className="w-24 h-24 bg-secondary rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner animate-float">
                <Map className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-4">Awaiting Parameters</h3>
              <p className="text-muted-foreground max-w-sm mx-auto font-semibold leading-relaxed">
                Connect your current skills to your future ambitions by generating a strategic roadmap.
              </p>
            </div>
          )}

          {loading && (
            <div className="p-10 space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-8 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-4">
                    <div className="h-8 w-1/3 bg-muted rounded-xl" />
                    <div className="h-32 w-full bg-muted rounded-3xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {roadmap && (
            <div className="space-y-10 relative before:absolute before:left-[1.5rem] before:top-4 before:bottom-4 before:w-1 before:bg-gradient-to-b before:from-primary before:to-indigo-500 before:rounded-full before:opacity-20">
              {roadmap.phases?.map((phase, idx) => (
                <div key={idx} className="relative pl-16 group">
                  <div className="absolute left-0 top-0 w-12 h-12 rounded-[1.25rem] premium-gradient flex items-center justify-center text-white font-black text-lg shadow-xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all z-10">
                    {idx + 1}
                  </div>
                  <Card className="p-8 glass-card border-0 space-y-6 hover-lift transition-all duration-500 rounded-[2.5rem]">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{phase.title}</h3>
                      <span className="px-5 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                        {phase.duration}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Strategic Objectives</p>
                      <ul className="grid gap-3">
                        {phase.tasks?.map((task, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-4 group/item">
                            <div className="p-1 px-1 bg-green-500/10 rounded-lg mt-0.5">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            </div>
                            <span className="font-bold text-muted-foreground leading-relaxed group-hover/item:text-foreground transition-colors">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 border-t border-border/50 flex flex-wrap gap-2.5">
                      {phase.skills?.map((skill, sIdx) => (
                        <span key={sIdx} className="px-4 py-2 bg-white/50 dark:bg-white/5 text-foreground rounded-xl text-xs font-black border border-white group-hover:border-primary/20 transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
