import { FileText, Briefcase, TrendingUp, Sparkles, ArrowUpRight, Clock, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Link } from 'react-router-dom';

const stats = [
  { title: 'Resume Score', value: '85', unit: '/100', icon: FileText, trend: '+2%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { title: 'Job Matches', value: '12', unit: 'found', icon: Briefcase, trend: '+3 new', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { title: 'Skill Level', value: '72', unit: '%', icon: TrendingUp, trend: 'Expert', color: 'text-green-500', bg: 'bg-green-500/10' },
  { title: 'AI Tokens', value: '1.2k', unit: 'used', icon: Sparkles, trend: 'Free', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3" /> AI Powered Career Insights
          </div>
          <h1 className="text-6xl font-black tracking-tight leading-none">
            Welcome back, <br/>
            <span className="text-gradient">{user?.displayName?.split(' ')[0] || 'Professional'}</span>
          </h1>
          <p className="text-xl text-muted-foreground/80 flex items-center gap-2 max-w-xl">
            Track your progress, optimize your profile, and land your next big role with AI.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/resume">
            <Button className="gap-2 px-8 py-6 rounded-2xl text-lg hover-lift premium-gradient shadow-xl shadow-primary/20 transition-all border-0">
              <Sparkles className="w-5 h-5" /> Optimize Now
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-card p-8 relative overflow-hidden group hover-lift border-0">
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${stat.bg}`} />
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <span className="text-[10px] font-black bg-secondary px-3 py-1.5 rounded-full uppercase tracking-widest opacity-80 decoration-primary decoration-2">
                {stat.trend}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter">{stat.value}</span>
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{stat.unit}</span>
              </div>
              <p className="text-xs font-black text-muted-foreground mt-2 uppercase tracking-[0.2em]">{stat.title}</p>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-8 md:grid-cols-7">
        <Card className="col-span-4 p-10 glass-card bg-gradient-to-br from-primary/10 via-transparent to-transparent border-0 relative overflow-hidden group">
           <div className="relative z-10">
              <h3 className="text-3xl font-black mb-4 tracking-tight">Level up your <br/>Personal Brand</h3>
              <p className="text-muted-foreground text-lg mb-10 max-w-md leading-relaxed">
                Our AI agents analyze your current trajectory and provide actionable steps to reach the next level in your career.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="p-6 glass-card bg-white/40 dark:bg-white/5 rounded-[2.5rem] border-white/40 dark:border-white/10 hover-lift transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4 text-yellow-500">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <h4 className="font-black text-lg mb-1">ATS Proof</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">Advanced keyword mapping for top performance.</p>
                </div>
                <div className="p-6 glass-card bg-white/40 dark:bg-white/5 rounded-[2.5rem] border-white/40 dark:border-white/10 hover-lift transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-lg mb-1">Impact Factor</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">Quantify your achievements like a pro.</p>
                </div>
              </div>
           </div>
           <div className="absolute right-[-10%] bottom-[-10%] w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
        </Card>

        <Card className="col-span-3 p-10 glass-card border-0 flex flex-col">
           <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              Insights
           </h3>
           <div className="space-y-8 flex-1">
              {[
                { title: 'Skills Analysis', desc: 'Add "System Design" for 40% more matches.', icon: TrendingUp, color: 'text-blue-500' },
                { title: 'Job Alert', desc: '3 new Senior Roles matching your profile.', icon: Briefcase, color: 'text-purple-500' },
                { title: 'Review Needed', desc: 'Your Career Summary is underperforming.', icon: FileText, color: 'text-amber-500' },
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-5 group cursor-pointer">
                  <div className={cn("p-4 rounded-2xl bg-secondary/80 group-hover:scale-110 transition-all", action.color)}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-lg leading-none group-hover:text-primary transition-colors">{action.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{action.desc}</p>
                  </div>
                </div>
              ))}
           </div>
           <Button variant="outline" className="mt-10 w-full group py-6 rounded-2xl border-2 hover:bg-primary hover:text-white hover:border-primary transition-all font-bold">
             Explore All Insights <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </Button>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
