import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Card, Button } from '../components/UI';
import { orchestrator } from '../agents/AgentOrchestrator';
import { cn } from '../lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      text += `${strings.join(' ')}\n`;
    }
    return text;
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const analyzeResume = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const text = await extractTextFromPDF(file);
      const result = await orchestrator.runResumeAnalysis(text);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase">
          <FileText className="w-3 h-3" /> Resume Intelligence
        </div>
        <h1 className="text-6xl font-black tracking-tighter leading-none">
          Analyze <span className="text-gradient">Optimization</span>
        </h1>
        <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto">
          Upload your resume and let our AI agents audit your profile against industry standards and identify strategic skill gaps.
        </p>
      </div>

      <Card className="p-16 glass-card border-0 relative overflow-hidden group hover-lift transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col items-center justify-center space-y-8 relative z-10">
          <div className="w-24 h-24 premium-gradient rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/20 animate-float">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-black tracking-tight">
              {file ? file.name : 'Drop your resume here'}
            </p>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              PDF Format · MAX 5MB
            </p>
          </div>
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf"
            onChange={handleFileUpload}
          />
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="px-8 py-6 rounded-2xl text-md font-bold border-2 hover:bg-secondary transition-all"
              onClick={() => document.getElementById('resume-upload')?.click()}
            >
              {file ? 'Change Asset' : 'Select PDF'}
            </Button>
            {file && !loading && (
              <Button
                onClick={analyzeResume}
                className="px-8 py-6 rounded-2xl text-md font-bold premium-gradient text-white border-0 hover-lift shadow-xl shadow-primary/20"
              >
                Start Analysis
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 space-y-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-xl font-black text-muted-foreground animate-pulse tracking-tight">Deploying AI Agents...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-6 rounded-3xl flex items-center gap-4 text-destructive animate-in">
          <div className="p-3 bg-destructive/20 rounded-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="font-bold text-lg">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-10 col-span-2 glass-card border-0 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
            <div className="space-y-2 relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Profile Integrity Score</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-8xl font-black tracking-tighter text-gradient">{analysis.score || 'N/A'}</p>
                <span className="text-2xl font-black text-muted-foreground/40">/100</span>
              </div>
            </div>
            <div className={cn(
              'p-8 rounded-[3rem] relative z-10 shadow-2xl transition-all duration-500 group-hover:rotate-12',
              analysis.score >= 80 ? 'bg-green-500/10 text-green-500 shadow-green-500/10' : 'bg-yellow-500/10 text-yellow-500 shadow-yellow-500/10'
            )}>
              <CheckCircle className="w-20 h-20" />
            </div>
          </Card>

          <Card className="p-8 glass-card border-0 space-y-6 hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary rounded-2xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Identified Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {analysis.skills?.map((skill, idx) => (
                <span key={idx} className="px-4 py-2 bg-white/50 dark:bg-white/5 text-foreground rounded-xl text-sm font-bold border border-white group-hover:border-primary/30 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-8 glass-card border-0 space-y-6 hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary rounded-2xl">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Strategic Gaps</h3>
            </div>
            <ul className="space-y-4">
              {analysis.gaps?.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2.5 group-hover/item:scale-150 transition-transform" />
                  <p className="text-muted-foreground font-semibold leading-relaxed">{gap}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-10 col-span-2 glass-card border-0 space-y-8 hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">AI Optimization Strategy</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {analysis.suggestions?.map((suggestion, idx) => (
                <div key={idx} className="p-6 glass-card bg-white/50 dark:bg-white/5 rounded-3xl text-sm font-bold leading-relaxed border-white/40 group-hover:border-primary/20 transition-all hover:bg-white/80 dark:hover:bg-white/10">
                  {suggestion}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
