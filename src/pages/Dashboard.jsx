import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Bookmark, BriefcaseBusiness, Check, ChevronRight, FileText, GraduationCap, Play, Sparkles, Target, UsersRound, Sun, Moon } from 'lucide-react';
import { fetchWithAuth, useAuth } from '../context/AuthContext';

const getGreeting = (hour) => {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('profile_master_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('profile_master_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const loadDashboard = () => {
      fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard').then((res) => res.json()).then((result) => { if (!result.error) setData(result); }).catch(console.error);
    };

    loadDashboard();
    window.addEventListener('resume-updated', loadDashboard);
    return () => window.removeEventListener('resume-updated', loadDashboard);
  }, []);

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs').then((res) => res.json()).then((jobs) => { if (Array.isArray(jobs)) setRecommendedJobs(jobs.slice(0, 3)); }).catch(console.error);
  }, []);

  if (!data) return <div className="dashboard-loading"><Sparkles size={18} /> Preparing your workspace...</div>;
  const appStats = data.applications || {};
  const totalApps = appStats.Total || 0;
  const profile = data.completion_percentage ?? 0;
  const resumeSections = data.resume_sections || {};
  const careerStorySections = ['objective', 'education', 'experience', 'projects'];
  const careerStoryProgress = Math.round(careerStorySections.filter((section) => resumeSections[section]).length / careerStorySections.length * 100);
  const progressItems = [
    { label: 'Resume sections', value: profile, tone: 'coral' },
    { label: 'Skills', value: resumeSections.skills ? 100 : 0, tone: 'gold' },
    { label: 'Career story', value: careerStoryProgress, tone: 'mint' },
  ];
  const userName = user?.name || user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting(new Date().getHours());
  const currentDateFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar"><div><span className="section-kicker">{currentDateFormatted}</span><h1>{greeting}, <em>{userName}</em></h1></div><div className="topbar-actions"><button className="icon-button" onClick={() => setDarkMode(value => !value)} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><div className="topbar-avatar">{userName[0].toUpperCase()}</div></div></header>
      <section className="dashboard-hero"><div className="dashboard-hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Your career journey starts here</div><h2>Make your next<br /><em>move count.</em></h2><p>Your profile is {profile}% complete. A stronger profile opens better conversations.</p><Link to="/resume" className="btn btn-sun">Complete profile <ArrowUpRight size={17} /></Link></div><div className="completion-orbit"><div className="orbit-ring"><strong>{profile}<small>%</small></strong><span>Profile<br />strength</span></div><div className="orbit-label"><Target size={15} /> Next best action</div><p>Complete your skills section</p></div></section>
      <section className="stats-strip"><div className="stat-intro"><span className="section-kicker">At a glance</span><strong>Your momentum</strong></div><div className="stat-item"><span className="stat-icon coral"><BriefcaseBusiness size={18} /></span><div><strong>{totalApps}</strong><span>Applications</span></div></div><div className="stat-item"><span className="stat-icon mint"><UsersRound size={18} /></span><div><strong>{appStats.Interview || 0}</strong><span>Interviews</span></div></div><div className="stat-item"><span className="stat-icon gold"><Bookmark size={18} /></span><div><strong>{data.saved_jobs || 0}</strong><span>Saved jobs</span></div></div><div className="stat-item"><span className="stat-icon ink"><Sparkles size={18} /></span><div><strong>{profile}%</strong><span>Profile strength</span></div></div></section>
      <div className="dashboard-grid"><section className="content-section progress-section"><div className="section-heading"><div><span className="section-kicker">Keep growing</span><h3>Career progress</h3></div><Link to="/resume" className="text-arrow">View profile <ArrowUpRight size={15} /></Link></div><div className="progress-list">{progressItems.map((item) => <div className="progress-row" key={item.label}><div className="progress-label"><span>{item.label}</span><strong>{item.value}%</strong></div><div className="progress-track"><span className={`progress-fill ${item.tone}`} style={{ width: `${item.value}%` }} /></div></div>)}</div><div className="progress-footer"><span><Check size={15} /> Complete your Resume Builder sections to increase progress</span><Link to="/roadmap">See roadmap <ChevronRight size={15} /></Link></div></section><section className="content-section activity-section"><div className="section-heading"><div><span className="section-kicker">Your trail</span><h3>Recent activity</h3></div><Activity size={18} /></div><div className="activity-list"><div><span className="activity-dot coral" /><p><strong>Resume updated</strong><small>Today, 9:42 AM</small></p></div><div><span className="activity-dot gold" /><p><strong>Job saved</strong><small>Yesterday, 4:18 PM</small></p></div><div><span className="activity-dot mint" /><p><strong>Application submitted</strong><small>Sep 20, 11:05 AM</small></p></div><div><span className="activity-dot ink" /><p><strong>React practice completed</strong><small>Sep 18, 3:30 PM</small></p></div></div></section></div>
      <section className="recommendations"><div className="section-heading"><div><span className="section-kicker">Curated for you</span><h3>Recommended next steps</h3></div><Link to="/jobs" className="text-arrow">Explore all <ArrowUpRight size={15} /></Link></div><div className="recommendation-grid">{recommendedJobs.length ? recommendedJobs.map((job, index) => <article className={`recommendation recommendation-${index}`} key={job.id}><div className="recommendation-top"><span className="recommendation-number">0{index + 1}</span><Bookmark size={17} /></div><h4>{job.title || 'React JS Developer'}</h4><p>{job.company || 'Career opportunity'} <span>·</span> {job.location || 'Hyderabad'}</p><div className="skill-pills">{(job.required_skills || 'React, JavaScript, HTML, CSS').split(',').slice(0, 4).map((skill) => <span key={skill}>{skill.trim()}</span>)}</div><Link to={`/job/${job.id}`} className="recommendation-link">View opportunity <ArrowUpRight size={15} /></Link></article>) : <article className="recommendation recommendation-0"><div className="recommendation-top"><span className="recommendation-number">01</span><Sparkles size={17} /></div><h4>Shape your next opportunity</h4><p>Explore roles matched to your goals</p><Link to="/jobs" className="recommendation-link">Explore jobs <ArrowUpRight size={15} /></Link></article>}</div></section>
      <section className="quick-start"><div><span className="section-kicker">Make it count</span><h3>What will you work on today?</h3></div><Link to="/resume"><FileText size={18} /><span>Build resume</span><ChevronRight size={16} /></Link><Link to="/roadmap"><GraduationCap size={18} /><span>Continue learning</span><ChevronRight size={16} /></Link><Link to="/interview"><Play size={18} /><span>Practice interview</span><ChevronRight size={16} /></Link></section>
    </div>
  );
}
