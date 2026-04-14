import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  Calendar,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

interface Job {
  id: string;
  company: string;
  role: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'wishlist';
  location: string;
  date: string;
  link: string;
}

const statusColors = {
  wishlist: 'bg-slate-500/10 text-slate-500',
  applied: 'bg-blue-500/10 text-blue-500',
  interviewing: 'bg-purple-500/10 text-purple-500',
  offered: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
};

export default function JobTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({ company: '', role: '', status: 'applied' as const, location: '', link: '' });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'jobs'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList: Job[] = [];
      snapshot.forEach((doc) => {
        jobList.push({ id: doc.id, ...doc.data() } as Job);
      });
      setJobs(jobList.sort((a,b) => b.id.localeCompare(a.id)));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        userId: user.uid,
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      setNewJob({ company: '', role: '', status: 'applied', location: '', link: '' });
      toast("Success! Application tracked.", "success");
    } catch (err) {
      console.error("Error adding job", err);
      toast("Analytics pipeline failed.", "error");
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', id));
      toast("Record expunged.", "info");
    } catch (err) {
      console.error("Error deleting job", err);
    }
  };

  const updateStatus = async (id: string, newStatus: Job['status']) => {
    try {
      await updateDoc(doc(db, 'jobs', id), { status: newStatus });
    } catch (err) {
      console.error("Error updating job status", err);
    }
  };

  return (
    <div className="space-y-12 animate-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest uppercase">
            <Building2 className="w-3 h-3" /> Pipeline Management
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none">
            Track <span className="text-gradient">Trajectory</span>
          </h1>
          <p className="text-xl text-muted-foreground/80 max-w-xl">
            Centralize your entire job application pipeline and manage your career moves with surgical precision.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)} 
          className="gap-3 px-8 py-6 rounded-2xl text-md font-bold premium-gradient border-0 hover-lift shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> New Application
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
          <input 
            type="text" 
            placeholder="Search applications..." 
            className="w-full pl-14 pr-6 py-5 bg-white/50 dark:bg-white/5 border-2 border-transparent focus:border-primary/20 rounded-[2rem] focus:outline-none transition-all font-bold text-lg shadow-sm"
          />
        </div>
        <Button variant="outline" className="gap-2 px-6 py-5 rounded-2xl border-2 font-black uppercase tracking-widest text-xs h-full">
          <Filter className="w-4 h-4" /> Filter Status
        </Button>
      </div>

      <div>
        {jobs.length === 0 && !loading && (
          <Card className="p-24 text-center glass-card border-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[3rem]">
            <div className="w-24 h-24 bg-secondary rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Building2 className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-2">Silent Pipeline</h3>
            <p className="text-muted-foreground max-w-xs mx-auto font-semibold">Ready to land that dream role? Start tracking your first application today.</p>
            <Button onClick={() => setShowAddModal(true)} className="mt-8 px-8 py-4 rounded-xl font-bold bg-secondary hover:bg-primary hover:text-white transition-all">
              Initiate Track
            </Button>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-8 glass-card border-0 flex flex-col space-y-6 group hover-lift transition-all duration-500 relative overflow-hidden">
              <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700", statusColors[job.status].split(' ')[0].replace('bg-', 'bg-'))} />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-2">
                  <h3 className="font-black text-2xl leading-tight tracking-tight group-hover:text-primary transition-colors">{job.role}</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">{job.company}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteJob(job.id)}
                  className="p-3 bg-white/50 dark:bg-white/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-2xl transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm font-bold text-muted-foreground relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {job.location || 'Remote'}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Deployed: {job.date}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/50 relative z-10">
                <select 
                  value={job.status}
                  onChange={(e) => updateStatus(job.id, e.target.value as Job['status'])}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-0 focus:ring-0 cursor-pointer transition-all shadow-sm",
                    statusColors[job.status]
                  )}
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
                {job.link && (
                  <a href={job.link} target="_blank" rel="noopener noreferrer" className="w-[45px] h-[45px] inline-flex items-center justify-center rounded-2xl bg-secondary border-2 border-transparent hover:border-primary/20 hover:text-primary transition-all active:scale-90">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in">
          <Card className="max-w-md w-full p-10 glass-card border-0 shadow-2xl space-y-8 rounded-[3rem]">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">Track New</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">Entry Protocol</p>
            </div>
            <form onSubmit={addJob} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60">Target Designation</label>
                <input 
                  required
                  type="text" 
                  value={newJob.role}
                  onChange={(e) => setNewJob({...newJob, role: e.target.value})}
                  className="w-full px-6 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none"
                  placeholder="Senior Frontend Lead"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60">Entity / Company</label>
                <input 
                  required
                  type="text" 
                  value={newJob.company}
                  onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                  className="w-full px-6 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none"
                  placeholder="Deepmind AI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60">Territory</label>
                  <input 
                    type="text" 
                    value={newJob.location}
                    onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                    className="w-full px-5 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none"
                    placeholder="Global"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60">Initial Status</label>
                  <select 
                    value={newJob.status}
                    onChange={(e) => setNewJob({...newJob, status: e.target.value as any})}
                    className="w-full px-5 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none cursor-pointer"
                  >
                    <option value="wishlist">Wishlist</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">In Progress</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-muted-foreground/60">Deployment Link</label>
                <input 
                  type="url" 
                  value={newJob.link}
                  onChange={(e) => setNewJob({...newJob, link: e.target.value})}
                  className="w-full px-6 py-4 bg-secondary/80 border-2 border-transparent focus:border-primary/20 rounded-2xl transition-all font-bold outline-none"
                  placeholder="https://career.entity.io/..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs border-2" onClick={() => setShowAddModal(false)}>
                  Abort
                </Button>
                <Button type="submit" className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs premium-gradient border-0 text-white shadow-lg shadow-primary/20">
                  Execute Track
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
