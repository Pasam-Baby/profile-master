import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Map, 
  MessageSquare, 
  LogOut,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Resume Analyzer', path: '/resume' },
  { icon: Briefcase, label: 'Job Tracker', path: '/jobs' },
  { icon: Map, label: 'Career Roadmap', path: '/roadmap' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/chat' },
];

export default function Navigation() {
  const { user, logout, signInWithGoogle } = useAuth();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-card border-r-0 flex flex-col z-50 rounded-none shadow-none">
      <div className="p-8">
        <h1 className="text-2xl font-black text-gradient flex items-center gap-3">
          <div className="w-10 h-10 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 animate-float">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span className="tracking-tighter">ProfileMaster</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-sm font-semibold",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-[1.02]" 
                  : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground hover:translate-x-1"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "animate-pulse" : "group-hover:text-primary transition-colors")} />
              <span>{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        {user ? (
          <div className="glass-card p-4 rounded-3xl flex flex-col gap-4 border-white/40 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-3 px-2">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">{user.displayName}</span>
                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-black opacity-60">Pro Member</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 premium-gradient text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover-lift active:scale-95"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </aside>
  );
}
