import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Card } from '../components/UI';
import { aiService } from '../services/ai.service';
import type { ChatMessage } from '../services/ai.service';
import { useAuth } from '../context/AuthContext';

export default function ChatAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful Career Assistant for Profile Master. You help users with resume tips, career advice, and interview prep.' },
    { role: 'assistant', content: `Hello ${user?.displayName || 'there'}! I'm your AI Career Assistant. How can I facilitate your professional evolution today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Protocol failure. AI core unreachable. Please retry transmission." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-10rem)] flex flex-col animate-in pb-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase mb-3">
            <Sparkles className="w-3 h-3" /> Real-time Neural Link
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none text-gradient">
            AI Assistant
          </h1>
          <p className="text-xl text-muted-foreground/80 mt-2 font-semibold">Recursive career coaching and strategic support.</p>
        </div>
        <div className="hidden sm:flex -space-x-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-12 h-12 rounded-2xl border-4 border-background bg-secondary flex items-center justify-center shadow-lg group hover-lift cursor-pointer hover:z-50 transition-all">
              <Sparkles className="w-6 h-6 text-primary group-hover:scale-125 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col glass-card border-0 rounded-[3rem] shadow-2xl relative">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-card/50 to-transparent pointer-events-none z-10" />
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth scroll-bar-hide"
        >
          {messages.filter(m => m.role !== 'system').map((m, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className={cn(
                "w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg animate-float",
                m.role === 'user' ? 'premium-gradient text-white rotate-3' : 'bg-secondary text-foreground -rotate-3'
              )}>
                {m.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className={cn(
                "max-w-[70%] p-6 rounded-[2rem] text-[15px] font-bold leading-relaxed shadow-sm transition-all hover:shadow-md",
                m.role === 'user' 
                  ? 'premium-gradient text-white rounded-tr-none' 
                  : 'glass-card bg-white/80 dark:bg-white/5 text-foreground rounded-tl-none border-white/40'
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-6 animate-in">
              <div className="w-12 h-12 rounded-[1.25rem] bg-secondary flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-6 h-6" />
              </div>
              <div className="glass-card bg-white/80 dark:bg-white/5 p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-8 border-t border-border/50 bg-white/30 dark:bg-black/20 backdrop-blur-xl">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full pl-8 pr-20 py-6 bg-white/50 dark:bg-white/5 border-2 border-transparent focus:border-primary/20 rounded-[2.5rem] focus:outline-none transition-all font-bold text-lg shadow-inner"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 p-4 premium-gradient text-white rounded-[1.5rem] hover:opacity-90 active:scale-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-[0.4em] font-black opacity-40">
            ProfileMaster Global Intelligence Core
          </p>
        </form>
      </Card>
    </div>
  );
}
