import { useState, useEffect, useMemo } from 'react';
import { fetchWithAuth } from '../context/AuthContext';
import {
  Activity, ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Check,
  ChevronDown, CircleDollarSign, Clock3, ExternalLink, FilePenLine, Filter,
  MapPin, MoreHorizontal, Search, Trash2, X
} from 'lucide-react';

const STATUSES = ['Saved', 'Applied', 'Screening', 'Test', 'Interview', 'HR', 'Offer', 'Joined', 'Rejected'];
const STATUS_COLORS = {
  Saved: 'saved', Applied: 'applied', Screening: 'screening', Test: 'test',
  Interview: 'interview', HR: 'hr', Offer: 'offer', Joined: 'joined', Rejected: 'rejected'
};

const emptyEdit = { status: 'Applied', source: '', applied_date: '', interview_date: '', interview_stage: '', recruiter: '', resume_used: '', notes: '', follow_up_date: '', job_link: '' };

const formatDate = (value) => value ? new Date(value.includes('T') ? value : `${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';
const isFollowUpDue = (app) => app.follow_up_date && new Date(`${app.follow_up_date}T23:59:59`) <= new Date();
const daysSince = (value) => value ? Math.floor((Date.now() - new Date(`${value}T00:00:00`).getTime()) / 86400000) : 0;
const needsAttention = (app) => isFollowUpDue(app) || (app.status === 'Applied' && daysSince(app.applied_date) >= 7);

function StatusBadge({ status }) {
  return <span className={`application-status ${STATUS_COLORS[status] || 'applied'}`}><span />{status || 'Applied'}</span>;
}

function MetricCard({ label, value, icon: Icon, tone }) {
  return <div className="application-metric-card"><div className={`application-metric-icon ${tone}`}><Icon size={18} /></div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState({ by_status: {}, by_source: {}, by_month: {}, interview_conversion: 0 });
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', location: '', source: '', date: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetchWithAuth('http://localhost:5000/api/applications').then(res => res.json()),
      fetchWithAuth('http://localhost:5000/api/applications/analytics').then(res => res.json())
    ]).then(([data, stats]) => {
      setApplications(Array.isArray(data) ? data : []);
      setAnalytics(stats || { by_status: {}, by_source: {}, by_month: {}, interview_conversion: 0 });
    }).catch(err => console.error(err)).finally(() => setLoading(false));
  };

  const updateApplication = (appId, payload) => {
    fetchWithAuth(`http://localhost:5000/api/applications/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => refresh())
      .catch(err => console.error(err));
  };

  const updateStatus = (appId, status) => updateApplication(appId, { status });
  const deleteApplication = (appId) => {
    if (!window.confirm('Delete this application?')) return;
    fetchWithAuth(`http://localhost:5000/api/applications/${appId}`, { method: 'DELETE' })
      .then(() => { setSelected(null); refresh(); });
  };

  const filteredApplications = useMemo(() => applications.filter((app) => {
    const haystack = `${app.company} ${app.title} ${app.location} ${app.source}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (!filters.status || app.status === filters.status) &&
      (!filters.location || app.location === filters.location) &&
      (!filters.source || (app.source || 'ProfileMaster') === filters.source) &&
      (!filters.date || (app.applied_date || '').startsWith(filters.date));
  }), [applications, query, filters]);

  const locations = [...new Set(applications.map(app => app.location).filter(Boolean))];
  const sources = [...new Set(applications.map(app => app.source || 'ProfileMaster'))];
  const total = applications.length;
  const active = applications.filter(app => !['Joined', 'Rejected'].includes(app.status)).length;
  const interviews = applications.filter(app => ['Interview', 'HR'].includes(app.status)).length;
  const offers = applications.filter(app => ['Offer', 'Joined'].includes(app.status)).length;
  const rejected = applications.filter(app => app.status === 'Rejected').length;

  return (
    <div className="applications-page">
      <header className="applications-header"><div><span className="section-kicker"><Activity size={14} /> Career operations</span><h1>Applications <em>command center.</em></h1><p>Keep every opportunity moving, from first application to the offer stage.</p></div><div className="applications-header-mark"><BriefcaseBusiness size={25} /></div></header>

      <section className="application-metrics">
        <MetricCard label="Total applications" value={total} icon={BriefcaseBusiness} tone="coral" />
        <MetricCard label="Active applications" value={active} icon={Activity} tone="mint" />
        <MetricCard label="Interviews" value={interviews} icon={CalendarDays} tone="sun" />
        <MetricCard label="Offers" value={offers} icon={Check} tone="green" />
        <MetricCard label="Rejected" value={rejected} icon={X} tone="red" />
      </section>

      <section className="application-pipeline"><div className="application-section-heading"><div><span className="section-kicker">Pipeline</span><h2>Move the work forward</h2></div><span className="application-section-note">Select a stage to update an application</span></div><div className="pipeline-track">{STATUSES.map((status, index) => <div className={`pipeline-stage ${applications.some(app => app.status === status) ? 'has-items' : ''}`} key={status}><span className="pipeline-dot">{index + 1}</span><strong>{status}</strong><small>{applications.filter(app => app.status === status).length}</small>{index < STATUSES.length - 1 && <ArrowRight size={13} />}</div>)}</div></section>

      <section className="application-toolbar"><div className="application-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search company, role or source" /></div><button className={`application-filter-button ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}><Filter size={16} /> Filters <ChevronDown size={14} /></button></section>
      {showFilters && <section className="application-filters"><label>Status<select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label><label>Location<select value={filters.location} onChange={event => setFilters({ ...filters, location: event.target.value })}><option value="">All locations</option>{locations.map(location => <option key={location}>{location}</option>)}</select></label><label>Job source<select value={filters.source} onChange={event => setFilters({ ...filters, source: event.target.value })}><option value="">All sources</option>{sources.map(source => <option key={source}>{source}</option>)}</select></label><label>Date<input type="month" value={filters.date} onChange={event => setFilters({ ...filters, date: event.target.value })} /></label></section>}

      <div className="applications-content"><section className="application-list-panel"><div className="application-section-heading"><div><span className="section-kicker">Application list</span><h2>{filteredApplications.length} opportunities</h2></div><span className="application-section-note">{loading ? 'Loading...' : 'Click a row for details'}</span></div>{filteredApplications.length === 0 ? <div className="applications-empty"><BriefcaseBusiness size={28} /><h3>Your pipeline is ready</h3><p>Apply to a role from Jobs and it will appear here with match insights and follow-up tracking.</p></div> : <div className="application-table-wrap"><table className="application-table"><thead><tr><th>Company / role</th><th>Location & salary</th><th>Applied</th><th>Status</th><th>Match</th><th /></tr></thead><tbody>{filteredApplications.map(app => <tr key={app.app_id} onClick={() => setSelected(app)}><td><strong>{app.company}</strong><span>{app.title}</span></td><td><span><MapPin size={13} />{app.location || 'Remote'}</span><span><CircleDollarSign size={13} />{app.salary || 'Salary not listed'}</span></td><td><strong>{formatDate(app.applied_date)}</strong><span>{app.source || 'ProfileMaster'}</span></td><td><StatusBadge status={app.status} />{needsAttention(app) && <small className="follow-up-alert"><Clock3 size={12} /> {isFollowUpDue(app) ? 'Follow-up due' : 'No response'}</small>}</td><td><b className={`match-score ${app.match_percentage >= 70 ? 'good' : ''}`}>{app.match_percentage || 0}%</b></td><td><button className="table-more" onClick={event => { event.stopPropagation(); setEditing(app); }} aria-label="Edit application"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>}</section>

        <section className="application-insights"><div className="application-section-heading"><div><span className="section-kicker"><BarChart3 size={14} /> Analytics</span><h2>Signal check</h2></div></div><div className="conversion-card"><span>Interview conversion</span><strong>{analytics.interview_conversion || 0}%</strong><div className="analytics-bar"><i style={{ width: `${analytics.interview_conversion || 0}%` }} /></div></div><div className="analytics-block"><div className="analytics-block-title"><strong>By status</strong><span>Count</span></div>{STATUSES.slice(0, 6).map(status => <div className="analytics-row" key={status}><span><i className={`status-key ${STATUS_COLORS[status]}`} />{status}</span><b>{analytics.by_status?.[status] || 0}</b></div>)}</div><div className="analytics-block"><div className="analytics-block-title"><strong>Monthly activity</strong><span>Last 6 months</span></div>{Object.entries(analytics.by_month || {}).map(([month, count]) => <div className="month-row" key={month}><span>{new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span><div><i style={{ width: `${Math.min(100, count * 18)}%` }} /></div><b>{count}</b></div>)}</div></section></div>

      {selected && <ApplicationDetails app={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} onDelete={() => deleteApplication(selected.app_id)} onStatus={status => { updateStatus(selected.app_id, status); setSelected({ ...selected, status }); }} />}
      {editing && <ApplicationEditor app={editing} onClose={() => setEditing(null)} onSave={payload => { updateApplication(editing.app_id, payload); setEditing(null); }} />}
    </div>
  );
}

function ApplicationDetails({ app, onClose, onEdit, onDelete, onStatus }) {
  return <div className="application-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><aside className="application-details"><div className="application-modal-top"><div><span className="section-kicker">Application record</span><h2>{app.title}</h2><p><BriefcaseBusiness size={14} /> {app.company}</p></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="detail-actions"><StatusBadge status={app.status} /><select value={app.status} onChange={event => onStatus(event.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select><button className="btn btn-ink" onClick={onEdit}><FilePenLine size={15} /> Edit</button><button className="icon-danger" onClick={onDelete} aria-label="Delete application"><Trash2 size={16} /></button></div><div className="detail-facts"><span><MapPin size={15} />{app.location || 'Remote'}</span><span><CircleDollarSign size={15} />{app.salary || 'Not listed'}</span><span><CalendarDays size={15} />Applied {formatDate(app.applied_date)}</span><span><ExternalLink size={15} />{app.source || 'ProfileMaster'}</span></div><div className="detail-description"><h3>Job description</h3><p>{app.description || 'No job description was provided for this role.'}</p></div><div className="detail-skill-list"><h3>Required skills</h3><div>{(app.required_skills || '').split(',').filter(Boolean).map(skill => <span key={skill}>{skill.trim()}</span>)}</div></div><div className="detail-grid"><div><label>Interview</label><strong>{app.interview_date ? `${formatDate(app.interview_date)}${app.interview_stage ? ` · ${app.interview_stage}` : ''}` : 'Not scheduled'}</strong></div><div><label>Recruiter / contact</label><strong>{app.recruiter || 'Not added'}</strong></div><div><label>Resume used</label><strong>{app.resume_used || 'Not added'}</strong></div><div><label>Follow-up</label><strong className={isFollowUpDue(app) ? 'due-text' : ''}>{app.follow_up_date ? formatDate(app.follow_up_date) : 'Not scheduled'}</strong></div></div><div className="detail-notes"><h3>Notes</h3><p>{app.notes || 'No notes yet. Add interview context, questions, or next steps.'}</p></div><div className="status-history"><h3>Status history</h3>{(app.status_history || []).slice().reverse().map((item, index) => <div key={`${item.date}-${index}`}><span className={`history-dot ${STATUS_COLORS[item.status]}`} /><strong>{item.status}</strong><small>{formatDate(item.date)}</small></div>)}</div></aside></div>;
}

function ApplicationEditor({ app, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyEdit, ...app, source: app.source || 'ProfileMaster' });
  const set = (key, value) => setForm({ ...form, [key]: value });
  return <div className="application-modal-backdrop"><div className="application-editor"><div className="application-modal-top"><div><span className="section-kicker">Edit application</span><h2>{app.company}</h2><p>{app.title}</p></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><form onSubmit={event => { event.preventDefault(); onSave(form); }}><div className="editor-grid"><label>Status<select value={form.status} onChange={event => set('status', event.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label><label>Job source<input value={form.source} onChange={event => set('source', event.target.value)} placeholder="LinkedIn, referral..." /></label><label>Applied date<input type="date" value={form.applied_date || ''} onChange={event => set('applied_date', event.target.value)} /></label><label>Interview date/time<input type="datetime-local" value={form.interview_date || ''} onChange={event => set('interview_date', event.target.value)} /></label><label>Interview stage<input value={form.interview_stage || ''} onChange={event => set('interview_stage', event.target.value)} placeholder="Technical, HR..." /></label><label>Recruiter / contact<input value={form.recruiter || ''} onChange={event => set('recruiter', event.target.value)} /></label><label>Resume used<input value={form.resume_used || ''} onChange={event => set('resume_used', event.target.value)} placeholder="Frontend resume v2" /></label><label>Follow-up date<input type="date" value={form.follow_up_date || ''} onChange={event => set('follow_up_date', event.target.value)} /></label><label className="editor-wide">Job source link<input type="url" value={form.job_link || ''} onChange={event => set('job_link', event.target.value)} placeholder="https://..." /></label><label className="editor-wide">Notes<textarea rows="4" value={form.notes || ''} onChange={event => set('notes', event.target.value)} placeholder="Add context, interview questions, or next steps" /></label></div><div className="editor-actions"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-sun"><Check size={15} /> Save changes</button></div></form></div></div>;
}
