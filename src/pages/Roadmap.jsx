import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ChevronRight, CircleAlert, FileText, MapPin, MessageSquare, RefreshCw, Search, Sparkles, Target, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchWithAuth, useAuth } from '../context/AuthContext';
import { getCategories, getUpgradeSkills } from '../services/careerMatcher.service';
import { getLearningPath, readLearningProgress, readLearningSelection, writeLearningProgress, writeLearningSelection } from '../services/skillLearning.service';

const emptyData = { has_resume: false, current_skills: [], roles: [], summary: { career_paths: 0, strongest_match: null, average_match: 0, skills_to_upgrade: 0 } };

export default function Roadmap() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [supporting, setSupporting] = useState({ resume: null, dashboard: null, jobs: [], applications: [] });
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = (nextCategory = category, nextSearch = search) => {
    const params = new URLSearchParams();
    if (nextCategory !== 'All') params.set('category', nextCategory);
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/roadmap/career-matches${params.toString() ? `?${params}` : ''}`)
      .then((response) => response.json())
      .then((result) => {
        if (!result.error) {
          setData(result);
          const savedSelection = readLearningSelection(user?.id);
          setSelectedRole(result.roles.find((role) => role.id === savedSelection.roleId) || null);
        }
      })
      .catch(() => setData(emptyData));
  };

  const loadSupportingData = () => Promise.all([
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resume`).then((response) => response.json()),
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard`).then((response) => response.json()),
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs`).then((response) => response.json()),
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications`).then((response) => response.json()),
  ]).then(([resume, dashboard, jobs, applications]) => setSupporting({ resume, dashboard, jobs: Array.isArray(jobs) ? jobs : [], applications: Array.isArray(applications) ? applications : [] })).catch(() => setSupporting((current) => current));

  const refreshRoadmap = () => {
    setRefreshing(true);
    Promise.all([loadSupportingData(), loadMatches()]).finally(() => setRefreshing(false));
  };

  useEffect(() => {
    refreshRoadmap();
    window.addEventListener('resume-updated', refreshRoadmap);
    return () => window.removeEventListener('resume-updated', refreshRoadmap);
  }, []);

  const categories = useMemo(() => getCategories(data?.roles), [data]);
  const upgradeSkills = useMemo(() => getUpgradeSkills(data?.roles), [data]);
  const openRole = (role) => {
    setSelectedRole(role);
    writeLearningSelection(user?.id, { roleId: role.id, skillName: role.required_missing[0]?.name || role.preferred_missing[0]?.name || '' });
    setTimeout(() => {
      document.querySelector('.role-detail-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const resumeCompletion = supporting.dashboard?.completion_percentage || 0;
  const applicationStats = supporting.dashboard?.applications || {};
  const interviewCount = (applicationStats.Interview || 0) + (applicationStats.HR || 0);
  const relevantJobs = supporting.jobs.filter((job) => data?.current_skills.some((skill) => (job.required_skills || '').toLowerCase().includes(skill.toLowerCase()))).slice(0, 3);
  const topRole = data?.roles?.[0];
  const topGap = topRole?.required_missing?.[0]?.name || topRole?.preferred_missing?.[0]?.name;
  const nextAction = resumeCompletion < 100 ? { label: 'Complete your resume', detail: 'Finish the missing resume sections before building a sharper plan.', to: '/resume' } : topGap ? { label: `Improve ${topGap}`, detail: 'Close your most important role-relevant skill gap next.', to: '#roadmap-learning' } : !supporting.applications.length ? { label: 'Apply to matching jobs', detail: 'Your profile is ready for the next opportunity.', to: '/jobs' } : interviewCount ? { label: 'Prepare for your interview', detail: 'Review the role skills and practise your answers.', to: '/interview' } : { label: 'Take a mock interview', detail: 'Turn your preparation into confident practice.', to: '/interview' };
  const stageStatuses = [resumeCompletion >= 80 ? 'complete' : 'attention', data?.current_skills.length ? 'complete' : 'attention', topGap ? 'attention' : 'complete', topGap ? 'active' : 'upcoming', topGap ? 'upcoming' : 'active', supporting.resume?.projects ? 'complete' : 'attention', relevantJobs.length ? 'active' : 'upcoming', supporting.applications.length ? 'complete' : 'upcoming', interviewCount ? 'active' : 'upcoming', interviewCount && resumeCompletion >= 80 ? 'active' : 'upcoming'];

  if (!data) return <div className="dashboard-loading"><Sparkles size={18} /> Analyzing your career options...</div>;

  if (!data.current_skills.length) {
    return (
      <div className="roadmap-page">
        <header className="roadmap-header"><div><span className="section-kicker"><Target size={13} /> Your career roadmap</span><h1>Your Career <em>Roadmap</em></h1><p>Discover job roles that match your resume and identify the skills you can upgrade.</p></div><div className="roadmap-header-mark"><BriefcaseBusiness size={25} /></div></header>
        <section className="roadmap-empty card"><div className="roadmap-empty-icon"><Target size={25} /></div><h2>Complete your Resume Builder to discover career paths.</h2><p>Add your skills to your resume and we will compare them with real role requirements.</p><Link to="/resume" className="btn btn-sun">Complete Resume <ArrowRight size={17} /></Link></section>
      </div>
    );
  }

  return (
    <div className="roadmap-page">
      <header className="roadmap-header"><div><span className="section-kicker"><Target size={13} /> Your career roadmap</span><h1>Your Career <em>Roadmap</em></h1><p>Turn your resume into a clear path from skills to job opportunities.</p></div><div className="roadmap-header-actions"><button type="button" className="btn btn-light" onClick={refreshRoadmap} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing' : 'Refresh roadmap'}</button><div className="roadmap-header-mark"><BriefcaseBusiness size={25} /></div></div></header>

      <section className="roadmap-next-step"><div className="next-step-icon"><Sparkles size={20} /></div><div><span className="section-kicker">Your next step</span><h2>{nextAction.label}</h2><p>{nextAction.detail}</p></div><Link to={nextAction.to} className="btn btn-sun">Take action <ArrowRight size={15} /></Link></section>

      <section className="roadmap-overview"><RoadmapStat label="Target role" value={data.target_role || topRole?.title || 'Not set'} icon={<Target size={16} />} /><RoadmapStat label="Experience level" value={user?.experience || 'Not set'} icon={<BriefcaseBusiness size={16} />} /><RoadmapStat label="Target location" value="Not set" icon={<MapPin size={16} />} /><RoadmapStat label="Resume completion" value={`${resumeCompletion}%`} icon={<FileText size={16} />} /><RoadmapStat label="Skill readiness" value={`${topRole?.required_match || 0}%`} icon={<BarChart3 size={16} />} /><RoadmapStat label="Applications" value={applicationStats.Total || supporting.applications.length} icon={<BriefcaseBusiness size={16} />} /><RoadmapStat label="Interviews" value={interviewCount} icon={<CalendarDays size={16} />} /><RoadmapStat label="Job readiness" value={relevantJobs.length ? 'Ready' : 'Build' } icon={<CheckCircle2 size={16} />} /></section>

      <RoadmapJourney statuses={stageStatuses} />

      <section className="roadmap-snapshot"><div className="roadmap-snapshot-copy"><span className="section-kicker"><FileText size={13} /> Resume snapshot</span><h2>Career starting point</h2><p>{supporting.resume?.objective || 'Your roadmap is anchored to the skills, experience and projects in your ProfileMaster resume.'}</p><div className="snapshot-target"><strong>{data.target_role || topRole?.title || 'Target role not set'}</strong><span>{user?.experience || 'Experience level not set'}</span></div></div><div className="snapshot-facts"><SnapshotFact label="Current skills" value={data.current_skills.length ? data.current_skills.join(' · ') : 'None listed'} /><SnapshotFact label="Projects" value={supporting.resume?.projects ? 'Added to resume' : 'Not added'} /><SnapshotFact label="Experience" value={supporting.resume?.internships || user?.experience || 'Not added'} /><SnapshotFact label="Certifications" value={supporting.resume?.certifications ? 'Added to resume' : 'Not added'} /></div></section>

      <section className="career-summary">
        <div><span className="section-kicker">Based on your resume skills</span><h2>Find your next career direction.</h2><div className="career-skill-chips">{data.current_skills.map((skill) => <span key={skill}><Check size={13} /> {skill}</span>)}</div></div>
        <div className="career-summary-stats"><div><strong>{data.summary.career_paths}</strong><span>Potential career paths</span></div><div><strong>{data.summary.strongest_match || '—'}</strong><span>Strongest skill match</span></div><div><strong>{data.summary.average_match}%</strong><span>Average core coverage</span></div><div><strong>{data.summary.skills_to_upgrade}</strong><span>Skills to upgrade</span></div></div>
      </section>

      <div className="career-toolbar"><div className="career-filters">{categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => { setCategory(item); loadMatches(item, search); }}>{item}</button>)}</div><label className="career-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadMatches(category, search)} placeholder="Search career roles..." /></label></div>

      <section className="career-match-section" id="roadmap-career-matches">
        <div className="section-heading">
          <div><span className="section-kicker">Career Flowchart</span><h3>Career paths based on your current skills</h3></div>
          <span className="roadmap-muted">Built dynamically from the skills in your Resume Builder.</span>
        </div>
        {data.roles.length ? (
          <div className="flowchart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0', width: '100%' }}>
             <div className="flowchart-node origin-node" style={{ background: '#102A20', color: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', width: '100%', maxWidth: '600px', border: '2px solid #F3B72F', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
               <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#F3B72F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FileText size={18} /> Your Resume Skills</h3>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                 {data.current_skills.map(s => <span key={s} style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {s}</span>)}
               </div>
             </div>

             {data.roles.filter(r => r.path_type === 'Current Match').length > 0 && (
               <>
                 <div className="flowchart-arrow" style={{ width: '2px', height: '40px', background: '#ccc', position: 'relative' }}>
                   <div style={{ position: 'absolute', bottom: '-6px', left: '-5px', width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc' }}></div>
                 </div>
                 <div className="flowchart-level" style={{ width: '100%' }}>
                   <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#102A20', fontSize: '1.1rem', fontWeight: '600' }}>CURRENT / DIRECT PATH</h4>
                   <div className="career-role-grid">
                     {data.roles.filter(r => r.path_type === 'Current Match').map(role => <RoleCard role={role} selected={selectedRole?.id === role.id} onSelect={() => openRole(role)} data={data} onClose={() => setSelectedRole(null)} key={role.id} />)}
                   </div>
                 </div>
               </>
             )}

             {data.roles.filter(r => r.path_type === 'Next Path').length > 0 && (
               <>
                 <div className="flowchart-arrow" style={{ width: '2px', height: '40px', background: '#ccc', position: 'relative' }}>
                   <div style={{ position: 'absolute', bottom: '-6px', left: '-5px', width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc' }}></div>
                 </div>
                 <div className="flowchart-combination" style={{ background: '#f8f9fa', padding: '12px 24px', borderRadius: '30px', fontSize: '0.9rem', color: '#555', border: '1px dashed #bbb', fontWeight: '500' }}>
                    Skill Combinations & Upgrades
                 </div>
                 <div className="flowchart-arrow" style={{ width: '2px', height: '40px', background: '#ccc', position: 'relative' }}>
                   <div style={{ position: 'absolute', bottom: '-6px', left: '-5px', width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc' }}></div>
                 </div>
                 <div className="flowchart-level" style={{ width: '100%' }}>
                   <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#102A20', fontSize: '1.1rem', fontWeight: '600' }}>NEXT CAREER OPTIONS</h4>
                   <div className="career-role-grid">
                     {data.roles.filter(r => r.path_type === 'Next Path').map(role => <RoleCard role={role} selected={selectedRole?.id === role.id} onSelect={() => openRole(role)} data={data} onClose={() => setSelectedRole(null)} key={role.id} />)}
                   </div>
                 </div>
               </>
             )}

             {data.roles.filter(r => r.path_type === 'Future Path').length > 0 && (
               <>
                 <div className="flowchart-arrow" style={{ width: '2px', height: '40px', background: '#ccc', position: 'relative' }}>
                   <div style={{ position: 'absolute', bottom: '-6px', left: '-5px', width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc' }}></div>
                 </div>
                 <div className="flowchart-combination" style={{ background: '#f8f9fa', padding: '12px 24px', borderRadius: '30px', fontSize: '0.9rem', color: '#555', border: '1px dashed #bbb', fontWeight: '500' }}>
                    Advanced Skills to Learn
                 </div>
                 <div className="flowchart-arrow" style={{ width: '2px', height: '40px', background: '#ccc', position: 'relative' }}>
                   <div style={{ position: 'absolute', bottom: '-6px', left: '-5px', width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc' }}></div>
                 </div>
                 <div className="flowchart-level" style={{ width: '100%' }}>
                   <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#102A20', fontSize: '1.1rem', fontWeight: '600' }}>FUTURE PATH OPTIONS</h4>
                   <div className="career-role-grid">
                     {data.roles.filter(r => r.path_type === 'Future Path').map(role => <RoleCard role={role} selected={selectedRole?.id === role.id} onSelect={() => openRole(role)} data={data} onClose={() => setSelectedRole(null)} key={role.id} />)}
                   </div>
                 </div>
               </>
             )}
          </div>
        ) : (
          <div className="role-empty">No roles match your current resume skills. Update your Resume Builder.</div>
        )}
      </section>



      <section className="upgrade-section"><div><span className="section-kicker">Upgrade your skills</span><h2>Strengthen your next application.</h2><p>These skills are role-relevant upgrades. Add them to your resume only after you have actually learned or gained experience with them.</p></div><div className="upgrade-grid">{upgradeSkills.length ? upgradeSkills.slice(0, 8).map((skill) => <div className={`upgrade-card ${skill.priority === 'High' ? 'high' : ''}`} key={skill.name}><span>{skill.priority} priority</span><strong>{skill.name}</strong><p>{skill.reason}</p><Link to="/resume">Update resume <ChevronRight size={14} /></Link></div>) : <span className="roadmap-muted">Your current skills cover the listed role requirements.</span>}</div></section>
      <section className="roadmap-connected-grid"><section className="roadmap-connected-panel"><div className="roadmap-section-heading"><div><span className="section-kicker"><BriefcaseBusiness size={13} /> Related jobs</span><h2>Put your roadmap to work</h2></div><Link to="/jobs" className="text-button">View all jobs <ArrowRight size={14} /></Link></div>{relevantJobs.length ? <div className="roadmap-job-list">{relevantJobs.map((job) => <div className="roadmap-job-item" key={job.id}><span className="company-avatar-small">{job.company?.slice(0, 1)}</span><div><strong>{job.title}</strong><span>{job.company} · {job.location || 'Remote'}</span></div><Link to={`/job/${job.id}`} aria-label={`View ${job.title}`}><ArrowRight size={15} /></Link></div>)}</div> : <div className="roadmap-inline-empty">No matching jobs found. Try updating your role or skills in Resume Builder.</div>}</section><section className="roadmap-connected-panel"><div className="roadmap-section-heading"><div><span className="section-kicker"><MessageSquare size={13} /> Application progress</span><h2>Keep moving forward</h2></div><Link to="/applications" className="text-button">Open tracker <ArrowRight size={14} /></Link></div>{supporting.applications.length ? <div className="roadmap-job-list">{supporting.applications.slice(0, 3).map((application) => <div className="roadmap-job-item" key={application.app_id}><span className="application-status-dot" /><div><strong>{application.title}</strong><span>{application.company} · {application.status}</span></div><Link to={`/job/${application.id}`} aria-label={`View ${application.title}`}><ArrowRight size={15} /></Link></div>)}</div> : <div className="roadmap-inline-empty">You haven't applied to any jobs yet. Start with a role that matches your strongest skills.</div>}</section></section>
      <section className="roadmap-readiness"><div><span className="section-kicker"><BarChart3 size={13} /> Career readiness</span><h2>Progress with a reason</h2></div><ReadinessBar label="Resume readiness" value={resumeCompletion} reason={`${resumeCompletion}% of resume sections complete`} /><ReadinessBar label="Skill readiness" value={topRole?.required_match || 0} reason={`${topRole?.matched_required?.length || 0} of ${(topRole?.required?.length || topRole?.matched_required?.length || 0) + (topRole?.missing_required?.length || 0)} core skills covered`} /><ReadinessBar label="Project readiness" value={supporting.resume?.projects ? 100 : 0} reason={supporting.resume?.projects ? 'Project details are present in your resume' : 'Add a project to prepare for project rounds'} /><ReadinessBar label="Job readiness" value={relevantJobs.length ? Math.min(100, topRole?.required_match || 0) : 0} reason={relevantJobs.length ? `${relevantJobs.length} relevant jobs found` : 'Build a stronger role match first'} /><ReadinessBar label="Interview readiness" value={interviewCount ? 100 : 0} reason={interviewCount ? 'Interview-stage applications need preparation' : 'Practise interview questions before applying'} /></section>
    </div>
  );
}

function RoadmapStat({ label, value, icon }) {
  return <div className="roadmap-stat"><span className="roadmap-stat-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>;
}

function SnapshotFact({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function RoadmapJourney({ statuses }) {
  const stages = [
    ['Resume', FileText], ['Skill Analysis', BarChart3], ['Skill Gaps', CircleAlert], ['Learning', BookOpen], ['Practice', CheckCircle2],
    ['Projects', BriefcaseBusiness], ['Jobs', Target], ['Applications', CalendarDays], ['Interview', MessageSquare], ['Career Progress', Sparkles],
  ];
  return <section className="roadmap-journey"><div className="roadmap-section-heading"><div><span className="section-kicker">Your career path</span><h2>From profile to opportunity</h2></div><span className="roadmap-muted">Calculated from your current ProfileMaster data</span></div><div className="roadmap-stage-track">{stages.map(([label, Icon], index) => <div className={`roadmap-stage ${statuses[index]}`} key={label}><span className="roadmap-stage-node"><Icon size={15} /></span><strong>{String(index + 1).padStart(2, '0')} {label}</strong><small>{statuses[index] === 'complete' ? 'Completed' : statuses[index] === 'active' ? 'In progress' : statuses[index] === 'attention' ? 'Needs attention' : 'Upcoming'}</small>{index < stages.length - 1 && <i />}</div>)}</div></section>;
}

function ReadinessBar({ label, value, reason }) {
  return <div className="readiness-item"><div><strong>{label}</strong><span>{value}%</span></div><div className="readiness-track"><i style={{ width: `${value}%` }} /></div><small>{reason}</small></div>;
}

function RoleCard({ role, selected, onSelect, data, onClose }) {
  if (selected) {
    return (
      <article className="career-role-card selected" style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1', border: 'none', background: 'transparent', padding: '0', boxShadow: 'none' }}>
        <CareerTreeFlowchart role={role} roles={data.all_roles || data.roles} currentSkills={data.current_skills} onClose={onClose} />
      </article>
    );
  }

  return (
    <article className="career-role-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="role-card-top">
        <div>
          <span className="role-category" style={{ display: 'inline-block', marginBottom: '4px', background: 'rgba(16, 42, 32, 0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', color: '#102A20' }}>{role.path_type.toUpperCase()}</span>
          <h4>{role.title}</h4>
        </div>
        <span className={`match-badge ${role.required_match >= 60 ? 'good' : ''}`}>{role.required_match}%</span>
      </div>
      <p className="role-description">{role.description}</p>
      <div className="role-match-label"><span>Core skill match</span><strong>{role.match_level}</strong></div>
      <div className="role-progress"><span style={{ width: `${role.required_match}%` }} /></div>
      <div className="role-skill-columns" style={{ flexGrow: 1 }}>
        <SkillList title="Matched skills" skills={role.matched_required} matched />
        <SkillList title="Skills to learn" skills={role.missing_required} />
      </div>
      {role.missing_preferred.length > 0 && <div className="preferred-line" style={{ marginTop: 'auto', paddingTop: '10px' }}><span>Additional skills to learn:</span> {role.missing_preferred.slice(0, 3).join(' · ')}</div>}
      <button type="button" className="btn btn-ink role-action" onClick={onSelect} style={{ marginTop: '15px' }}>View Roadmap <ArrowRight size={16} /></button>
    </article>
  );
}

function SkillList({ title, skills, matched = false }) {
  return <div className="role-skill-list"><span>{title}</span>{skills.length ? skills.slice(0, 5).map((skill) => <div key={skill}><span className={matched ? 'skill-check matched' : 'skill-check'}>{matched ? <Check size={11} /> : <X size={11} />}</span>{skill}</div>) : <small>{matched ? 'No matched skills yet' : 'No gaps in this group'}</small>}</div>;
}

function RoleDetail({ role, onClose }) {
  const [activeTopicStr, setActiveTopicStr] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  const handleTopicClick = (topicStr) => {
    setActiveTopicStr(topicStr);
    setAnswers({});
    setQuizResult(null);
    setTimeout(() => document.querySelector('.topic-study')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const getTopicObject = (topicStr) => {
    const path = getLearningPath(topicStr);
    if (path && path.topics && path.topics.length > 0) return path.topics[0];
    return {
      id: topicStr,
      title: topicStr,
      estimatedTime: '30 mins',
      description: `Learn the fundamentals of ${topicStr} for the ${role.title} role.`,
      content: `${topicStr} is an essential skill listed for your progression. Mastering this will strengthen your profile.`,
      example: `Applying ${topicStr} in real-world scenarios.`,
      practical: `Use ${topicStr} in a project to gain hands-on experience.`,
      questions: [
        {
          prompt: `Why is ${topicStr} important for a ${role.title}?`,
          options: ['It is a core industry requirement', 'It is only for beginners', 'It is obsolete', 'It is not used'],
          correctAnswer: 0,
          explanation: `${topicStr} is highly relevant to your career path.`
        }
      ]
    };
  };

  const activeTopicObj = activeTopicStr ? getTopicObject(activeTopicStr) : null;

  const checkAnswers = () => {
    let score = 0;
    activeTopicObj.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    setQuizResult({ score, total: activeTopicObj.questions.length, passed: score === activeTopicObj.questions.length });
  };

  return (
    <section className="role-detail-panel" style={{ borderTop: '4px solid #F3B72F', marginTop: '40px' }}>
      <div className="role-detail-header">
        <div><span className="section-kicker">Target Role Path</span><h2>{role.title}</h2><p>{role.guidance}</p></div>
        <button type="button" className="icon-button" aria-label="Close role analysis" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="role-detail-score">
        <strong>{role.required_match}%</strong>
        <span>{role.match_level}<small>Your skills match {role.required_match}% of the core requirements.</small></span>
        <div className="role-progress"><span style={{ width: `${role.required_match}%` }} /></div>
      </div>
      
      <div className="role-detail-grid">
        <div><h3>Matched Skills</h3><SkillList title="" skills={role.matched_required} matched /></div>
        <div><h3>Core Skills to Learn</h3>{role.required_missing.length ? role.required_missing.map((skill) => <div className="detail-gap" key={skill.name}><strong>{skill.name}</strong><p>{skill.reason}</p></div>) : <p className="roadmap-muted">You cover all core requirements.</p>}</div>
        <div><h3>Additional Skills</h3>{role.preferred_missing.length ? role.preferred_missing.map((skill) => <div className="detail-gap preferred" key={skill.name}><strong>{skill.name}</strong><p>{skill.reason}</p></div>) : <p className="roadmap-muted">You have all preferred skills.</p>}</div>
      </div>

      <div className="role-detail-extras" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        {role.what_to_build && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}><BriefcaseBusiness size={16} style={{ display: 'inline', marginRight: '5px' }} /> What you can build</h3>
            <p className="roadmap-muted" style={{ fontSize: '0.9rem' }}>{role.what_to_build}</p>
          </div>
        )}
        {role.learning_topics && role.learning_topics.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}><BookOpen size={16} style={{ display: 'inline', marginRight: '5px' }} /> Important Topics (Click to practice)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {role.learning_topics.map(topic => (
                <button key={topic} onClick={() => handleTopicClick(topic)} style={{ background: activeTopicStr === topic ? '#102A20' : '#f5f5f5', color: activeTopicStr === topic ? 'white' : '#333', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}>
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
        {role.interview_topics && role.interview_topics.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}><MessageSquare size={16} style={{ display: 'inline', marginRight: '5px' }} /> Interview Prep</h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#555' }}>
              {role.interview_topics.map(topic => <li key={topic}>{topic}</li>)}
            </ul>
          </div>
        )}
        {role.next_paths && role.next_paths.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}><Target size={16} style={{ display: 'inline', marginRight: '5px' }} /> Next Career Paths</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {role.next_paths.map((path, idx) => (
                <span key={path} style={{ fontSize: '0.85rem', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', borderLeft: '2px solid #F3B72F' }}>
                  {idx === 0 ? role.title + ' → ' + path : path}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {activeTopicObj && (
        <div style={{ marginTop: '30px', borderTop: '2px dashed #ddd', paddingTop: '20px' }}>
          <TopicStudy topic={activeTopicObj} answers={answers} setAnswers={setAnswers} quizResult={quizResult} onCheck={checkAnswers} onComplete={() => setQuizResult(null)} completed={false} />
        </div>
      )}
    </section>
  );
}

function CareerTreeFlowchart({ role, roles, currentSkills, onClose }) {
  const [expandedRole, setExpandedRole] = useState(null);

  // Resume Skills
  const baseSkillsStr = currentSkills.length > 0 ? currentSkills.join(' + ') : 'Your Skills';

  // Branch Roles (Level 2)
  const nextRoles = (role.next_paths || []).map(path => roles.find(r => r.title === path)).filter(Boolean);

  useEffect(() => {
    document.querySelector('.career-tree-container')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="career-tree-container" style={{ background: '#fafafa', padding: '40px 20px', borderRadius: '16px', marginTop: '10px', marginBottom: '20px', border: '1px solid #eaeaea', position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>
         <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Career Match
      </button>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="section-kicker">Your Career Roadmap</span>
        <h2 style={{ fontSize: '1.8rem', color: '#102A20', margin: '10px 0' }}>Based on your resume skills</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
           {currentSkills.map(s => <span key={s} style={{ background: '#102A20', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>{s}</span>)}
        </div>
      </div>

      <div className="tree-flowchart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto', paddingBottom: '20px' }}>
        
        {/* Node 1: Base Skills */}
        <div style={{ border: '2px solid #F3B72F', padding: '12px 24px', borderRadius: '8px', background: 'white', fontWeight: '600', color: '#333', textAlign: 'center' }}>
           {baseSkillsStr}
        </div>
        <div style={{ width: '2px', height: '30px', background: '#ccc' }}></div>
        <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc', marginBottom: '4px' }}></div>

        {/* Node 2: Current Selected Role */}
        <div onClick={() => setExpandedRole(expandedRole?.id === role.id ? null : role)} style={{ border: expandedRole?.id === role.id ? '2px solid #F3B72F' : '2px solid #102A20', padding: '15px 40px', borderRadius: '8px', background: '#102A20', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', transition: '0.2s', minWidth: '200px' }}>
           {role.title}
           <div style={{ fontSize: '0.75rem', color: '#F3B72F', marginTop: '5px', fontWeight: 'normal' }}>{expandedRole?.id === role.id ? 'Close details' : 'Click for details'}</div>
        </div>

        {nextRoles.length > 0 && (
          <>
            <div style={{ width: '2px', height: '30px', background: '#ccc' }}></div>
            
            {/* Horizontal Branch Line */}
            {nextRoles.length > 1 && (
               <div style={{ display: 'flex', justifyContent: 'space-between', width: `${(nextRoles.length - 1) * 280}px`, height: '2px', background: '#ccc', position: 'relative' }}>
                  {nextRoles.map((nr, idx) => (
                    <div key={nr.id} style={{ position: 'absolute', left: `${(idx / (nextRoles.length - 1)) * 100}%`, top: '0', width: '2px', height: '30px', background: '#ccc', transform: 'translateX(-50%)' }}></div>
                  ))}
               </div>
            )}
            {nextRoles.length === 1 && <div style={{ width: '2px', height: '30px', background: '#ccc' }}></div>}
            
            {/* Level 2: Skill Combinations & Roles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '30px', flexWrap: 'nowrap' }}>
               {nextRoles.map(nr => (
                  <div key={nr.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '240px' }}>
                     {/* Skill Combo Box */}
                     <div style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', width: '100%', marginBottom: '15px', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {currentSkills[0] || 'Base'} <br/> + <br/>
                        <strong style={{ color: '#102A20' }}>{nr.missing_required.slice(0, 3).join(' + ') || 'Advanced Skills'}</strong>
                     </div>
                     
                     <div style={{ width: '2px', height: '20px', background: '#ccc' }}></div>
                     <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ccc', marginBottom: '4px' }}></div>
                     
                     {/* Next Role Box */}
                     <div onClick={() => setExpandedRole(expandedRole?.id === nr.id ? null : nr)} style={{ border: expandedRole?.id === nr.id ? '2px solid #F3B72F' : '2px solid #ccc', padding: '15px', borderRadius: '8px', background: 'white', fontWeight: '600', color: '#102A20', cursor: 'pointer', textAlign: 'center', width: '100%', transition: '0.2s', boxShadow: expandedRole?.id === nr.id ? '0 4px 12px rgba(243, 183, 47, 0.2)' : 'none' }}>
                        {nr.title}
                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px', fontWeight: 'normal' }}>{expandedRole?.id === nr.id ? 'Close details' : 'Click for details'}</div>
                     </div>
                     
                     {/* Level 3: Show an extra step if they have next_paths */}
                     {nr.next_paths && nr.next_paths.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '10px' }}>
                           <div style={{ width: '2px', height: '20px', background: '#ddd' }}></div>
                           <div style={{ width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #ddd', marginBottom: '4px' }}></div>
                           <div style={{ border: '1px dashed #bbb', padding: '8px', borderRadius: '6px', background: '#fafafa', fontSize: '0.8rem', color: '#666', textAlign: 'center', width: '100%' }}>
                              {nr.next_paths[0]}
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
          </>
        )}
      </div>

      {expandedRole && (
         <div style={{ marginTop: '20px', background: 'white', borderRadius: '12px', padding: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease-in-out' }}>
            <RoleDetail role={expandedRole} onClose={() => setExpandedRole(null)} />
         </div>
      )}
    </div>
  );
}

function TopicStudy({ topic, answers, setAnswers, quizResult, onCheck, onComplete, completed }) {
  if (!topic) return null;
  return <div className="topic-study"><div className="topic-study-heading"><div><span className="section-kicker">Selected topic · {topic.estimatedTime}</span><h4>{topic.title}</h4></div>{completed && <span className="topic-complete"><Check size={13} /> Topic completed</span>}</div><div className="topic-content"><h5>What you will learn</h5><p>{topic.description}</p><h5>Explanation</h5><p>{topic.content}</p><div className="topic-example"><strong>Example</strong><code>{topic.example}</code><small>Practical use: {topic.practical}</small></div></div><div className="quiz-block"><h5>Quick Check</h5>{topic.questions.map((question, questionIndex) => <div className="quiz-question" key={question.prompt}><strong>{questionIndex + 1}. {question.prompt}</strong><div>{question.options.map((option, optionIndex) => <button type="button" className={answers[questionIndex] === optionIndex ? 'selected' : ''} key={option} onClick={() => setAnswers({ ...answers, [questionIndex]: optionIndex })}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div>{quizResult && answers[questionIndex] !== question.correctAnswer && <small className="quiz-explanation">Correct answer: {String.fromCharCode(65 + question.correctAnswer)}. {question.explanation}</small>}</div>)}<button type="button" className="btn btn-ink quiz-check" disabled={Object.keys(answers).length !== topic.questions.length} onClick={onCheck}>Check Answers</button>{quizResult && <div className={`quiz-result ${quizResult.passed ? 'passed' : 'failed'}`}><strong>{quizResult.passed ? '✓ Topic passed' : '✗ Review the topic and try again.'}</strong><span>Score: {quizResult.score} / {quizResult.total} ({Math.round((quizResult.score / quizResult.total) * 100)}%)</span>{quizResult.passed && !completed && <button type="button" className="btn btn-sun" onClick={onComplete}>Mark Topic Complete</button>}</div>}</div></div>;
}
