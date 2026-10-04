import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../context/AuthContext';
import '../resume.css';
import { AlertTriangle, Check, CheckCircle2, CircleAlert, Download, Eye, FileText, PlusCircle, Printer, Save, Trash2, WandSparkles } from 'lucide-react';
import { Modal, Button, Accordion } from 'react-bootstrap';

function LegacyResumeBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    objective: '',
    education: '',
    skills: '',
    projects: '',
    certifications: '',
    internships: '',
    achievements: '',
    languages: ''
  });
  
  const [saved, setSaved] = useState(false);
  const [template, setTemplate] = useState('modern'); // 'modern', 'minimal', 'professional'
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [optionalSections, setOptionalSections] = useState({
    internships: false,
    achievements: false,
    languages: false
  });
  
  const previewRef = useRef(null);

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resume`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          // Parse out the optional sections from the concatenated backend fields
          let parsedProjects = data.projects || '';
          let parsedInternships = '';
          if (parsedProjects.includes('||INTERNSHIPS||')) {
            const parts = parsedProjects.split('||INTERNSHIPS||');
            parsedProjects = parts[0];
            parsedInternships = parts[1] || '';
          }
          
          let parsedCertifications = data.certifications || '';
          let parsedAchievements = '';
          let parsedLanguages = '';
          
          if (parsedCertifications.includes('||ACHIEVEMENTS||')) {
            const parts = parsedCertifications.split('||ACHIEVEMENTS||');
            parsedCertifications = parts[0];
            if (parts[1].includes('||LANGUAGES||')) {
              const subParts = parts[1].split('||LANGUAGES||');
              parsedAchievements = subParts[0];
              parsedLanguages = subParts[1] || '';
            } else {
              parsedAchievements = parts[1];
            }
          } else if (parsedCertifications.includes('||LANGUAGES||')) {
             const parts = parsedCertifications.split('||LANGUAGES||');
             parsedCertifications = parts[0];
             parsedLanguages = parts[1] || '';
          }

          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            objective: data.objective || '',
            education: data.education || '',
            skills: data.skills || '',
            projects: parsedProjects,
            certifications: parsedCertifications,
            internships: parsedInternships,
            achievements: parsedAchievements,
            languages: parsedLanguages
          });
          
          setOptionalSections({
            internships: !!parsedInternships,
            achievements: !!parsedAchievements,
            languages: !!parsedLanguages
          });
        }
      })
      .catch(err => console.error("Error fetching resume:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Concatenate optional sections into existing backend schema fields
    const payload = {
      ...formData,
      projects: formData.internships ? `${formData.projects}||INTERNSHIPS||${formData.internships}` : formData.projects,
      certifications: `${formData.certifications}${formData.achievements ? `||ACHIEVEMENTS||${formData.achievements}` : ''}${formData.languages ? `||LANGUAGES||${formData.languages}` : ''}`
    };
    
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        window.dispatchEvent(new Event('resume-updated'));
        setTimeout(() => setSaved(false), 3000);
      })
      .catch(err => console.error("Error saving:", err));
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (section) => {
    setOptionalSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Template Renderers
  const renderTemplate = () => {
    const isModern = template === 'modern';
    const isProfessional = template === 'professional';
    const isMinimal = template === 'minimal';
    
    return (
      <div 
        ref={previewRef}
        className={`resume-preview-container bg-white text-dark p-4 shadow ${template}`}
        style={{ 
          minHeight: '297mm', // A4 approximate height 
          fontFamily: isMinimal ? 'sans-serif' : (isProfessional ? 'serif' : 'Inter, sans-serif')
        }}
      >
        {/* Header */}
        <div className={`mb-4 ${isModern ? 'text-center border-bottom pb-4 border-2 border-primary' : (isProfessional ? 'border-bottom border-dark pb-3' : 'text-center')}`}>
          <h1 className={`fw-bold text-uppercase ${isMinimal ? 'mb-1' : 'mb-2'} ${isModern ? 'text-primary' : ''}`} style={{ letterSpacing: isMinimal ? '2px' : 'normal' }}>
            {formData.name || 'Your Name'}
          </h1>
          <div className={`d-flex flex-wrap gap-3 ${isModern || isMinimal ? 'justify-content-center' : ''} text-muted small`}>
            <span>{formData.email || 'email@example.com'}</span>
            <span>{formData.phone || '(123) 456-7890'}</span>
          </div>
        </div>

        {/* Objective */}
        {formData.objective && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Professional Summary</h5>
            <p className="small mb-0">{formData.objective}</p>
          </div>
        )}

        {/* Skills */}
        {formData.skills && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Skills</h5>
            {isModern ? (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {formData.skills.split(',').map((skill, i) => (
                  <span key={i} className="badge bg-light text-dark border">{skill.trim()}</span>
                ))}
              </div>
            ) : (
              <p className="small mb-0 fw-semibold">{formData.skills}</p>
            )}
          </div>
        )}

        {/* Education */}
        {formData.education && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Education</h5>
            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{formData.education}</p>
          </div>
        )}

        {/* Experience/Projects */}
        {formData.projects && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Projects & Experience</h5>
            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{formData.projects}</p>
          </div>
        )}
        
        {/* Optional: Internships */}
        {optionalSections.internships && formData.internships && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Internships</h5>
            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{formData.internships}</p>
          </div>
        )}

        {/* Certifications */}
        {formData.certifications && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Certifications</h5>
            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{formData.certifications}</p>
          </div>
        )}

        {/* Optional: Achievements */}
        {optionalSections.achievements && formData.achievements && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Achievements</h5>
            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{formData.achievements}</p>
          </div>
        )}

        {/* Optional: Languages */}
        {optionalSections.languages && formData.languages && (
          <div className="mb-4">
            <h5 className={`fw-bold text-uppercase ${isModern ? 'text-primary' : ''} ${isProfessional ? 'border-bottom border-secondary pb-1' : ''}`}>Languages</h5>
            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>{formData.languages}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container-fluid pb-5">
      {/* Hero Section */}
      <div className="hero-header hero-resume">
        <div className="hero-content">
          <h1 className="fw-bold mb-2">Resume Builder</h1>
          <p className="fs-5 opacity-75 mb-0">Craft a professional resume to stand out in the crowd.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Editor */}
        <div className="col-12 col-xl-5">
          <div className="card p-4 h-100 shadow-sm d-flex flex-column">
            
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
              <h4 className="fw-bold mb-0">Editor</h4>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-info d-flex align-items-center" onClick={() => setShowTemplateModal(true)}>
                  <LayoutTemplate size={16} className="me-1" /> Template
                </button>
                <button className="btn btn-sm btn-primary d-flex align-items-center" onClick={handleSave}>
                  <Save size={16} className="me-1" /> {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex-grow-1 overflow-auto" style={{ maxHeight: '800px', paddingRight: '10px' }}>
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0" className="bg-transparent border-secondary text-light">
                  <Accordion.Header>Personal Information</Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Full Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small text-muted">Email</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-muted">Phone</label>
                        <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1" className="bg-transparent border-secondary text-light">
                  <Accordion.Header>Summary & Skills</Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Career Objective</label>
                      <textarea className="form-control" rows="3" name="objective" value={formData.objective} onChange={handleChange}></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Technical Skills (comma separated)</label>
                      <input type="text" className="form-control" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. HTML, CSS, React JS" />
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2" className="bg-transparent border-secondary text-light">
                  <Accordion.Header>Experience & Education</Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Education</label>
                      <textarea className="form-control" rows="3" name="education" value={formData.education} onChange={handleChange} placeholder="Degree, University, Year"></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Projects & Experience</label>
                      <textarea className="form-control" rows="4" name="projects" value={formData.projects} onChange={handleChange} placeholder="Describe your key projects..."></textarea>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3" className="bg-transparent border-secondary text-light">
                  <Accordion.Header>Certifications & Awards</Accordion.Header>
                  <Accordion.Body>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Certifications</label>
                      <textarea className="form-control" rows="3" name="certifications" value={formData.certifications} onChange={handleChange}></textarea>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Optional Sections rendering */}
                {optionalSections.internships && (
                  <Accordion.Item eventKey="4" className="bg-transparent border-secondary text-light">
                    <Accordion.Header>
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        Internships
                        <Trash2 size={16} className="text-danger" onClick={(e) => { e.stopPropagation(); toggleSection('internships'); }} />
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <textarea className="form-control" rows="3" name="internships" value={formData.internships} onChange={handleChange} placeholder="Internship details..."></textarea>
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                {optionalSections.achievements && (
                  <Accordion.Item eventKey="5" className="bg-transparent border-secondary text-light">
                    <Accordion.Header>
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        Achievements
                        <Trash2 size={16} className="text-danger" onClick={(e) => { e.stopPropagation(); toggleSection('achievements'); }} />
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <textarea className="form-control" rows="3" name="achievements" value={formData.achievements} onChange={handleChange} placeholder="List achievements..."></textarea>
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                {optionalSections.languages && (
                  <Accordion.Item eventKey="6" className="bg-transparent border-secondary text-light">
                    <Accordion.Header>
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        Languages
                        <Trash2 size={16} className="text-danger" onClick={(e) => { e.stopPropagation(); toggleSection('languages'); }} />
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <textarea className="form-control" rows="2" name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Spanish..."></textarea>
                    </Accordion.Body>
                  </Accordion.Item>
                )}
              </Accordion>

              {/* Add Optional Sections */}
              <div className="mt-4 pt-3 border-top border-secondary">
                <h6 className="text-muted mb-3 small">Add Optional Section</h6>
                <div className="d-flex flex-wrap gap-2">
                  {!optionalSections.internships && (
                    <button type="button" className="btn btn-sm btn-outline-light d-flex align-items-center" onClick={() => toggleSection('internships')}>
                      <PlusCircle size={14} className="me-1" /> Internships
                    </button>
                  )}
                  {!optionalSections.achievements && (
                    <button type="button" className="btn btn-sm btn-outline-light d-flex align-items-center" onClick={() => toggleSection('achievements')}>
                      <PlusCircle size={14} className="me-1" /> Achievements
                    </button>
                  )}
                  {!optionalSections.languages && (
                    <button type="button" className="btn btn-sm btn-outline-light d-flex align-items-center" onClick={() => toggleSection('languages')}>
                      <PlusCircle size={14} className="me-1" /> Languages
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="col-12 col-xl-7">
          <div className="card p-4 h-100 shadow-sm bg-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0 text-dark d-flex align-items-center">
                <Eye size={20} className="me-2 text-primary" /> Live Preview
              </h4>
              <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={handlePrint}>
                <Printer size={16} className="me-2" /> Download / Print
              </button>
            </div>
            
            {/* The actual resume preview container */}
            <div className="overflow-auto border rounded shadow-sm" style={{ maxHeight: '800px', backgroundColor: '#e2e8f0' }}>
              <div className="p-2 p-md-4">
                {renderTemplate()}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} centered data-bs-theme="dark">
        <Modal.Header closeButton className="border-secondary bg-dark text-white">
          <Modal.Title>Choose Template</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="row g-3">
            <div className="col-12">
              <div 
                className={`p-3 border rounded cursor-pointer ${template === 'modern' ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                onClick={() => setTemplate('modern')}
                style={{ cursor: 'pointer' }}
              >
                <h5 className="fw-bold text-primary mb-1">Modern</h5>
                <p className="small text-muted mb-0">Clean, crisp styling with accent colors.</p>
              </div>
            </div>
            <div className="col-12">
              <div 
                className={`p-3 border rounded cursor-pointer ${template === 'minimal' ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                onClick={() => setTemplate('minimal')}
                style={{ cursor: 'pointer' }}
              >
                <h5 className="fw-bold mb-1">Minimalist</h5>
                <p className="small text-muted mb-0">Simple, elegant sans-serif typography.</p>
              </div>
            </div>
            <div className="col-12">
              <div 
                className={`p-3 border rounded cursor-pointer ${template === 'professional' ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                onClick={() => setTemplate('professional')}
                style={{ cursor: 'pointer' }}
              >
                <h5 className="fw-bold mb-1">Professional</h5>
                <p className="small text-muted mb-0">Traditional serif typography and standard structure.</p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary bg-dark">
          <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>Close</Button>
          <Button variant="primary" onClick={() => setShowTemplateModal(false)}>Apply Template</Button>
        </Modal.Footer>
      </Modal>

      {/* Styles for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .resume-preview-container, .resume-preview-container * {
            visibility: visible;
          }
          .resume-preview-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: 100vh !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
}

const EMPTY_PROFILE = { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', target_role: '', summary: '', skills: '', education: '', projects: [], experiences: [], certifications: [], achievements: '', coursework: '', languages: '', leadership: '' };
const EMPTY_PROJECT = { name: '', technologies: '', bullets: ['', '', ''], github: '', demo: '' };
const EMPTY_EXPERIENCE = { company: '', role: '', duration: '', location: '', bullets: ['', '', ''] };
const EMPTY_CERTIFICATION = { name: '', issuer: '', date: '', link: '' };

const parseLegacyProfile = (data) => {
  let internships = '';
  let projects = data.projects || '';
  if (projects.includes('||INTERNSHIPS||')) [projects, internships] = projects.split('||INTERNSHIPS||');
  let certifications = data.certifications || '';
  let achievements = '';
  let languages = '';
  if (certifications.includes('||ACHIEVEMENTS||')) [certifications, achievements] = certifications.split('||ACHIEVEMENTS||');
  if (achievements.includes('||LANGUAGES||')) [achievements, languages] = achievements.split('||LANGUAGES||');
  else if (certifications.includes('||LANGUAGES||')) [certifications, languages] = certifications.split('||LANGUAGES||');
  return { ...EMPTY_PROFILE, name: data.name || '', email: data.email || '', phone: data.phone || '', location: data.location || '', linkedin: data.linkedin || '', github: data.github || '', portfolio: data.portfolio || '', target_role: data.target_role || '', summary: data.objective || '', skills: data.skills || '', education: data.education || '', achievements, languages, projects: projects ? [{ ...EMPTY_PROJECT, name: 'Project', bullets: projects.split('\n').filter(Boolean).slice(0, 3) }] : [], experiences: internships ? [{ ...EMPTY_EXPERIENCE, role: 'Intern', bullets: internships.split('\n').filter(Boolean).slice(0, 3) }] : [], certifications: certifications ? [{ ...EMPTY_CERTIFICATION, name: certifications }] : [] };
};

function ResumePreviewSection({ title, children }) { return <section className="resume-preview-section"><h2>{title}</h2>{children}</section>; }
function StructuredResumePreview({ profile, template }) {
  const skills = (profile.skills || '').split(',').map(skill => skill.trim()).filter(Boolean);
  return <article className={`structured-resume-preview resume-template-${template}`}>
    <header className="resume-preview-header"><h1>{profile.name || 'Your Name'}</h1><div>{[profile.location, profile.phone, profile.email].filter(Boolean).join('  |  ') || 'Add contact information'}</div><div>{[profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join('  |  ')}</div></header>
    {profile.summary && <ResumePreviewSection title="Professional Summary"><p>{profile.summary}</p></ResumePreviewSection>}
    {skills.length > 0 && <ResumePreviewSection title="Technical Skills"><p><strong>Skills:</strong> {skills.join(' · ')}</p></ResumePreviewSection>}
    {profile.projects.length > 0 && <ResumePreviewSection title="Projects">{profile.projects.map((project, index) => <div className="resume-preview-entry" key={`${project.name}-${index}`}><div><strong>{project.name || 'Project'}</strong><span>{project.technologies}</span></div><ul>{(project.bullets || []).filter(Boolean).map(bullet => <li key={bullet}>{bullet}</li>)}</ul>{[project.github, project.demo].filter(Boolean).map(link => <small key={link}>{link}</small>)}</div>)}</ResumePreviewSection>}
    {profile.experiences.length > 0 && <ResumePreviewSection title="Experience / Internships">{profile.experiences.map((experience, index) => <div className="resume-preview-entry" key={`${experience.company}-${index}`}><div><strong>{experience.role || 'Role'}{experience.company && `, ${experience.company}`}</strong><span>{[experience.duration, experience.location].filter(Boolean).join(' · ')}</span></div><ul>{(experience.bullets || []).filter(Boolean).map(bullet => <li key={bullet}>{bullet}</li>)}</ul></div>)}</ResumePreviewSection>}
    {profile.education && <ResumePreviewSection title="Education"><p>{profile.education}</p></ResumePreviewSection>}
    {profile.certifications.length > 0 && <ResumePreviewSection title="Certifications">{profile.certifications.map((certification, index) => <p key={`${certification.name}-${index}`}><strong>{certification.name}</strong>{certification.issuer && ` · ${certification.issuer}`}{certification.date && ` · ${certification.date}`}</p>)}</ResumePreviewSection>}
    {[['Achievements', profile.achievements], ['Relevant Coursework', profile.coursework], ['Languages', profile.languages], ['Leadership & Activities', profile.leadership]].map(([title, value]) => value && <ResumePreviewSection title={title} key={title}><p>{value}</p></ResumePreviewSection>)}
  </article>;
}

function ResumeSectionHeading({ title, description }) { return <div className="resume-section-heading"><h2>{title}</h2><p>{description}</p></div>; }
function TextAreaField({ label, value, onChange }) { return <label className="resume-field"><span>{label}</span><textarea rows="3" value={value} onChange={event => onChange(event.target.value)} placeholder="Add this information" /></label>; }
function BulletFields({ values, onChange }) { return <div className="resume-bullet-fields"><span>Achievement / implementation bullets</span>{values.map((value, index) => <input key={index} value={value} onChange={event => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Bullet ${index + 1}`} />)}</div>; }
function RepeatableEditor({ items, setItems, emptyItem, title, renderItem }) { return <section className="resume-editor-section"><div className="resume-editor-section-heading"><h3>{title}</h3><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setItems([...items, { ...emptyItem, bullets: emptyItem.bullets ? [...emptyItem.bullets] : undefined }])}><PlusCircle size={14} /> Add</button></div>{items.length === 0 && <p className="resume-muted">Nothing added yet. Add this section only when it is relevant.</p>}{items.map((item, index) => <div className="repeatable-item" key={index}>{renderItem(item, index, updated => setItems(items.map((current, itemIndex) => itemIndex === index ? updated : current)), () => setItems(items.filter((_, itemIndex) => itemIndex !== index)))}</div>)}</section>; }

function ResumeAnalysis({ checks, jobs, selectedJob, setSelectedJob, customize, suggestion, applySuggestion }) {
  return <div className="resume-section-content"><ResumeSectionHeading title="Resume analysis" description="Actionable checks based on the information you have actually entered." /><div className="resume-analysis-list">{checks.length ? checks.map(check => <div key={check}><CircleAlert size={16} />{check}</div>) : <div className="analysis-good"><CheckCircle2 size={16} />Your core resume information is in good shape. Review each bullet for clarity.</div>}</div><div className="job-customizer"><h3>Customize resume for a job</h3><p>Compare a saved demo job with your real skills before approving any suggested summary.</p><select value={selectedJob} onChange={event => setSelectedJob(event.target.value)}><option value="">Choose a job</option>{jobs.map(job => <option value={job.id} key={job.id}>{job.title} · {job.company}</option>)}</select><button type="button" className="btn btn-light" disabled={!selectedJob} onClick={customize}><WandSparkles size={15} /> Compare profile</button>{suggestion && <div className="job-suggestion"><strong>{suggestion.job.title} · {suggestion.job.company}</strong><span>Matched: {suggestion.matched.join(', ') || 'No exact skill matches'}</span><span>Missing: {suggestion.missing.join(', ') || 'No listed gaps'}</span><p>{suggestion.summary}</p><button type="button" className="btn btn-sun" onClick={applySuggestion}>Approve summary</button></div>}</div></div>;
}

function StructuredEditorField({ label, value, type = 'text', onChange, placeholder = '' }) { return <label className="resume-field"><span>{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>; }

export default function ResumeBuilder() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(localStorage.getItem('profile_master_resume_template') || 'classic');
  const [activeSection, setActiveSection] = useState('personal');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [jobSuggestion, setJobSuggestion] = useState(null);

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resume`).then(response => response.json()).then(data => {
      if (data.profile_json) { try { setProfile({ ...EMPTY_PROFILE, ...JSON.parse(data.profile_json) }); } catch { setProfile(parseLegacyProfile(data)); } }
      else if (data.id) setProfile(parseLegacyProfile(data));
    }).catch(error => console.error('Error fetching resume:', error)).finally(() => setLoading(false));
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs`).then(response => response.json()).then(data => setJobs(Array.isArray(data) ? data : [])).catch(() => setJobs([]));
  }, []);

  const update = (key, value) => { setProfile(current => ({ ...current, [key]: value })); setSaved(false); };
  const save = event => {
    event?.preventDefault();
    const projects = (profile.projects || []).map(project => [project.name, project.technologies, (project.bullets || []).filter(Boolean).join('\n'), project.github, project.demo].filter(Boolean).join(' | ')).join('\n\n');
    const experiences = (profile.experiences || []).map(experience => [experience.company, experience.role, experience.duration, experience.location, (experience.bullets || []).filter(Boolean).join('\n')].filter(Boolean).join(' | ')).join('\n\n');
    const certifications = (profile.certifications || []).map(certification => [certification.name, certification.issuer, certification.date, certification.link].filter(Boolean).join(' | ')).join('\n');
    const payload = { name: profile.name, email: profile.email, phone: profile.phone, objective: profile.summary, education: profile.education, skills: profile.skills, projects: `${projects}${experiences ? `||INTERNSHIPS||${experiences}` : ''}`, certifications: `${certifications}${profile.achievements ? `||ACHIEVEMENTS||${profile.achievements}` : ''}${profile.languages ? `||LANGUAGES||${profile.languages}` : ''}`, location: profile.location, linkedin: profile.linkedin, github: profile.github, portfolio: profile.portfolio, target_role: profile.target_role, profile_json: JSON.stringify(profile) };
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/resume`, { method: 'POST', body: JSON.stringify(payload) }).then(response => response.json()).then(() => { setSaved(true); window.dispatchEvent(new Event('resume-updated')); setTimeout(() => setSaved(false), 2500); }).catch(error => console.error('Error saving resume:', error));
  };
  const updateTemplate = value => { setTemplate(value); localStorage.setItem('profile_master_resume_template', value); };
  const skills = (profile.skills || '').split(',').map(skill => skill.trim()).filter(Boolean);
  const checks = [!profile.name && 'Add your full name and contact information.', !profile.email && 'Add a professional email address.', !profile.target_role && 'Add a target role so your roadmap and job matches are focused.', !skills.length && 'Add the technical skills you actually know.', !profile.summary && 'Write a concise 2–3 line professional summary.', (profile.summary || '').length > 420 && 'Shorten the summary to keep the resume recruiter-friendly.', !(profile.projects || []).length && 'Add at least one relevant project.', (profile.projects || []).some(project => (project.bullets || []).filter(Boolean).length < 2) && 'Add 2–4 concise achievement bullets to each project.'].filter(Boolean);
  const pageCount = (JSON.stringify(profile).length > 3600 || profile.projects.length > 2 || profile.experiences.length > 2) ? 2 : 1;
  const customizeForJob = () => { const job = jobs.find(item => String(item.id) === selectedJob); if (!job) return; const required = (job.required_skills || '').split(',').map(skill => skill.trim()).filter(Boolean); const matched = required.filter(skill => skills.some(current => current.toLowerCase() === skill.toLowerCase())); setJobSuggestion({ job, required, matched, missing: required.filter(skill => !matched.includes(skill)), summary: `${profile.target_role || job.title} with hands-on experience in ${matched.length ? matched.join(', ') : 'the technical skills listed in my resume'}. Built ${profile.projects.length ? profile.projects.map(project => project.name).filter(Boolean).join(' and ') : 'practical projects'}${profile.experiences.length ? ` and gained experience through ${profile.experiences.map(item => item.role).filter(Boolean).join(', ')}` : ''}.` }); };
  const printResume = () => { document.title = `${profile.name || 'Resume'} - ProfileMaster`; window.print(); };

  if (loading) return <div className="dashboard-loading">Loading your resume profile...</div>;
  return <div className="resume-builder-page"><header className="resume-builder-header"><div><span className="section-kicker"><FileText size={14} /> ProfileMaster Resume Builder</span><h1>Build a resume <em>that gets read.</em></h1><p>One professional, ATS-friendly page built from your real experience and skills.</p></div><div className="resume-header-actions"><button className="btn btn-light" type="button" onClick={printResume}><Printer size={15} /> Download / Print</button><button className="btn btn-sun" type="button" onClick={save}><Save size={15} /> {saved ? 'Saved' : 'Save resume'}</button></div></header><div className="resume-builder-layout"><main className="resume-editor-column"><div className="resume-editor-tabs">{[['personal', 'Profile'], ['summary', 'Summary'], ['skills', 'Skills'], ['projects', 'Projects'], ['experience', 'Experience'], ['education', 'Education'], ['extras', 'Extras'], ['analysis', 'Analysis']].map(([key, label]) => <button type="button" key={key} className={activeSection === key ? 'active' : ''} onClick={() => setActiveSection(key)}>{label}</button>)}</div><form className="resume-form" onSubmit={save}>
    {activeSection === 'personal' && <div className="resume-section-content"><ResumeSectionHeading title="Personal information" description="Keep the header simple and easy for applicant tracking systems to parse." /><StructuredEditorField label="Full name" value={profile.name} onChange={value => update('name', value)} placeholder="Your name" /><StructuredEditorField label="Target role" value={profile.target_role} onChange={value => update('target_role', value)} placeholder="Frontend Developer" /><StructuredEditorField label="Email" type="email" value={profile.email} onChange={value => update('email', value)} placeholder="you@example.com" /><StructuredEditorField label="Phone" value={profile.phone} onChange={value => update('phone', value)} placeholder="+1 555 000 0000" /><StructuredEditorField label="Location" value={profile.location} onChange={value => update('location', value)} placeholder="City, Country" /><StructuredEditorField label="LinkedIn URL" type="url" value={profile.linkedin} onChange={value => update('linkedin', value)} /><StructuredEditorField label="GitHub URL" type="url" value={profile.github} onChange={value => update('github', value)} /><StructuredEditorField label="Portfolio URL" type="url" value={profile.portfolio} onChange={value => update('portfolio', value)} /></div>}
    {activeSection === 'summary' && <div className="resume-section-content"><ResumeSectionHeading title="Professional summary" description="Write 2–3 concise lines about your target role, real skills, education and projects." /><label className="resume-field"><span>Summary</span><textarea rows="5" value={profile.summary} onChange={event => update('summary', event.target.value)} placeholder="Entry-level developer with hands-on experience building..." /></label><button type="button" className="btn btn-light" onClick={() => update('summary', `${profile.target_role || 'Entry-level developer'} with hands-on experience in ${skills.join(', ') || 'the skills listed on my resume'}. ${(profile.projects || []).length ? `Built ${(profile.projects || []).map(project => project.name).filter(Boolean).join(' and ')}.` : 'Add a project to make this summary more specific.'}`)}>Suggest from my profile</button></div>}
    {activeSection === 'skills' && <div className="resume-section-content"><ResumeSectionHeading title="Technical skills" description="Only skills you enter here are shared with Jobs, Roadmap and Interview Preparation." /><StructuredEditorField label="Skills, comma separated" value={profile.skills} onChange={value => update('skills', value)} placeholder="HTML, CSS, JavaScript, Python, SQL" /><div className="selected-skill-preview">{skills.map(skill => <span key={skill}>{skill}</span>)}</div></div>}
    {activeSection === 'projects' && <div className="resume-section-content"><ResumeSectionHeading title="Projects" description="Add measurable, truthful bullets. Never add a technology you did not use." /><RepeatableEditor items={profile.projects} setItems={items => update('projects', items)} emptyItem={EMPTY_PROJECT} title="Projects" renderItem={(item, index, setItem, remove) => <><div className="repeatable-heading"><strong>Project {index + 1}</strong><button type="button" onClick={remove}><Trash2 size={15} /></button></div><StructuredEditorField label="Project name" value={item.name} onChange={value => setItem({ ...item, name: value })} /><StructuredEditorField label="Technologies used" value={item.technologies} onChange={value => setItem({ ...item, technologies: value })} /><BulletFields values={item.bullets} onChange={bullets => setItem({ ...item, bullets })} /><StructuredEditorField label="GitHub link" type="url" value={item.github} onChange={value => setItem({ ...item, github: value })} /><StructuredEditorField label="Live demo link" type="url" value={item.demo} onChange={value => setItem({ ...item, demo: value })} /></>} /></div>}
    {activeSection === 'experience' && <div className="resume-section-content"><ResumeSectionHeading title="Experience and internships" description="Internships count. Add employment only when you have real experience to describe." /><RepeatableEditor items={profile.experiences} setItems={items => update('experiences', items)} emptyItem={EMPTY_EXPERIENCE} title="Experience / internships" renderItem={(item, index, setItem, remove) => <><div className="repeatable-heading"><strong>Experience {index + 1}</strong><button type="button" onClick={remove}><Trash2 size={15} /></button></div>{[['company', 'Company'], ['role', 'Role'], ['duration', 'Duration'], ['location', 'Location / Remote']].map(([key, label]) => <StructuredEditorField label={label} value={item[key]} onChange={value => setItem({ ...item, [key]: value })} key={key} />)}<BulletFields values={item.bullets} onChange={bullets => setItem({ ...item, bullets })} /></>} /></div>}
    {activeSection === 'education' && <div className="resume-section-content"><ResumeSectionHeading title="Education" description="Use one clear line for degree, branch, college, year and grade." /><label className="resume-field"><span>Education details</span><textarea rows="5" value={profile.education} onChange={event => update('education', event.target.value)} placeholder="B.Tech in Computer Science | University | 2026 | 8.4 CGPA" /></label></div>}
    {activeSection === 'extras' && <div className="resume-section-content"><ResumeSectionHeading title="Optional sections" description="Only include relevant information. Empty sections stay out of the resume." /><TextAreaField label="Achievements" value={profile.achievements} onChange={value => update('achievements', value)} /><TextAreaField label="Relevant coursework" value={profile.coursework} onChange={value => update('coursework', value)} /><TextAreaField label="Languages" value={profile.languages} onChange={value => update('languages', value)} /><TextAreaField label="Leadership / activities" value={profile.leadership} onChange={value => update('leadership', value)} /><RepeatableEditor items={profile.certifications} setItems={items => update('certifications', items)} emptyItem={EMPTY_CERTIFICATION} title="Certifications" renderItem={(item, index, setItem, remove) => <><div className="repeatable-heading"><strong>Certification {index + 1}</strong><button type="button" onClick={remove}><Trash2 size={15} /></button></div>{[['name', 'Certification name'], ['issuer', 'Issuing organization'], ['date', 'Date / year'], ['link', 'Credential link']].map(([key, label]) => <StructuredEditorField label={label} type={key === 'link' ? 'url' : 'text'} value={item[key]} onChange={value => setItem({ ...item, [key]: value })} key={key} />)}</>} /></div>}
    {activeSection === 'analysis' && <ResumeAnalysis checks={checks} jobs={jobs} selectedJob={selectedJob} setSelectedJob={setSelectedJob} customize={customizeForJob} suggestion={jobSuggestion} applySuggestion={() => { update('summary', jobSuggestion.summary); setJobSuggestion(null); setActiveSection('summary'); }} />}
    <div className="resume-form-footer"><button type="submit" className="btn btn-sun"><Save size={15} /> {saved ? 'Saved' : 'Save changes'}</button></div></form></main><aside className="resume-preview-column"><div className="resume-preview-toolbar"><div><span className="section-kicker"><Eye size={13} /> Live preview</span><strong>{pageCount} page{pageCount > 1 ? 's' : ''}</strong></div><div className="template-switcher">{[['classic', 'Classic ATS'], ['modern', 'Modern Professional'], ['minimal', 'Minimal Developer']].map(([value, label]) => <button type="button" key={value} className={template === value ? 'active' : ''} onClick={() => updateTemplate(value)}>{label}</button>)}</div></div>{pageCount > 1 && <div className="resume-length-warning">This content may exceed one page. Shorten long bullets or remove optional sections.</div>}<div className="resume-paper-wrap"><StructuredResumePreview profile={profile} template={template} /></div></aside></div></div>;
}
