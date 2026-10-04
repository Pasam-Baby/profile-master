import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '../context/AuthContext';
import {
  ArrowRight, Award, BookOpen, BrainCircuit, BriefcaseBusiness, Check,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Code2, Eye, Filter,
  Layers3, MessageSquare, Mic2, Play, Search, Target, UsersRound, X
} from 'lucide-react';

const ROADMAP_FRESHER = ['Resume Introduction', 'Self Introduction', 'Technical Fundamentals', 'Important Technical Questions', 'Project Preparation', 'Internship Questions', 'Basic Coding / Practical', 'Technical Mock Interview', 'Project Interview', 'HR Interview', 'Full Mock Interview'];
const ROADMAP_EXPERIENCED = ['Resume Walkthrough', 'Current Role', 'Responsibilities', 'Project Deep Dive', 'Technical Fundamentals', 'Advanced Technical Questions', 'Real-World Scenarios', 'Debugging / Problem Solving', 'Role-Based Mock Interview', 'Behavioral Interview', 'HR / Final Round'];
const TOPIC_MAP = {
  html: ['HTML Basics', 'HTML5', 'Semantic HTML', 'Forms', 'Input Types', 'Tables', 'Links', 'Accessibility basics', 'SEO basics'],
  css: ['Selectors', 'Box Model', 'Display', 'Position', 'Flexbox', 'Grid', 'Responsive Design', 'Specificity', 'Media Queries'],
  javascript: ['Variables', 'Data Types', 'Functions', 'Scope', 'Arrays', 'Objects', 'map', 'filter', 'reduce', 'DOM', 'Events', 'Promises', 'async/await', 'Error handling'],
  python: ['Variables', 'Data Types', 'Lists', 'Tuples', 'Sets', 'Dictionaries', 'Functions', 'Loops', 'Comprehensions', 'Exception Handling', 'OOP Basics', 'Modules'],
  sql: ['SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'Aggregate Functions', 'JOIN', 'Subqueries', 'Primary Key', 'Foreign Key', 'Normalization basics'],
};
const ROUND_DATA = [
  ['Resume / Introduction', 'Self introduction, resume discussion and background.', 'Prepare a 60-second introduction, education and your target role.'],
  ['Technical Screening', 'Resume skills, fundamentals and important concepts.', 'Review fundamentals first, then practise explaining one project decision.'],
  ['Coding / Practical', 'Basic coding, SQL and practical tasks.', 'Talk through your approach before writing code and test edge cases.'],
  ['Project Discussion', 'Architecture, technologies, contribution and challenges.', 'Know what you built, why you chose it and what you would improve.'],
  ['Technical Interview', 'Deeper technical questions, follow-ups and scenarios.', 'Connect answers to real work, trade-offs and debugging habits.'],
  ['HR / Behavioral', 'Communication, motivation and situational questions.', 'Use Situation, Task, Action, Result without memorising a script.'],
  ['Final Discussion / Offer', 'Role, location, salary, notice period and joining.', 'Prepare thoughtful questions and clarify expectations professionally.'],
];
const HR_QUESTIONS = ['Tell me about yourself.', 'Walk me through your resume.', 'Why should we hire you?', 'Why do you want this role?', 'What are your strengths?', 'What is one weakness you are working on?', 'Explain your project.', 'Where do you see yourself in 3–5 years?', 'Do you have any questions for us?'];
const normalize = value => (value || '').trim().toLowerCase().replace(/\.js$/, '');
const pretty = value => value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const fallbackQuestion = (skill, topic, experienced) => ({
  question: experienced ? `How have you used ${topic} in a real project, and what trade-off did you make?` : `What is ${topic}, and where would you use it?`,
  answer: experienced ? `I used ${topic} as part of a practical feature, choosing it because it fit the problem and kept the solution maintainable. I would explain the context, my contribution and the result.` : `${topic} is a core ${skill} concept. I would explain the idea simply, give a small example, and connect it to a project or practical use.`,
});

export default function InterviewPrep() {
  const [resume, setResume] = useState({ skills: '', projects: '', internships: '', experience: '' });
  const [candidateType, setCandidateType] = useState(localStorage.getItem('interview_candidate_type') || 'Fresher');
  const [experienceLevel, setExperienceLevel] = useState(localStorage.getItem('interview_experience') || '1–3 Years');
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [view, setView] = useState('home');
  const [questionBank, setQuestionBank] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('All');
  const [mockMode, setMockMode] = useState(null);
  const [mockAnswer, setMockAnswer] = useState('');
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [progress, setProgress] = useState(() => JSON.parse(localStorage.getItem('interview_progress') || '{}'));
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetchWithAuth('http://localhost:5000/api/resume').then(response => response.json()).then(data => {
      setResume(data || {});
      const resumeSkills = (data?.skills || '').split(',').map(skill => skill.trim()).filter(Boolean);
      setSkills(resumeSkills);
      if (resumeSkills.length) setSelectedSkill(resumeSkills[0]);
    }).catch(() => setResume({}));
  }, []);

  useEffect(() => {
    if (!selectedSkill) return;
    const localTopics = TOPIC_MAP[normalize(selectedSkill)] || [selectedSkill, 'Fundamentals', 'Common interview questions', 'Practical usage', 'Troubleshooting'];
    setTopics(localTopics);
    setSelectedTopic(localTopics[0]);
    fetchWithAuth(`http://localhost:5000/api/interview?topic=${encodeURIComponent(selectedSkill)}`).then(response => response.json()).then(data => setQuestionBank(Array.isArray(data) && data.length ? data : [fallbackQuestion(selectedSkill, localTopics[0], candidateType === 'Experienced')])).catch(() => setQuestionBank([fallbackQuestion(selectedSkill, localTopics[0], candidateType === 'Experienced')]));
  }, [selectedSkill, candidateType]);

  const roadmap = candidateType === 'Fresher' ? ROADMAP_FRESHER : ROADMAP_EXPERIENCED;
  const currentQuestion = questionBank[questionIndex] || fallbackQuestion(selectedSkill || 'your skill', selectedTopic || 'this topic', candidateType === 'Experienced');
  const topicQuestions = useMemo(() => topics.filter(topic => topic.toLowerCase().includes(search.toLowerCase())), [topics, search]);
  const completedCount = Object.values(progress).filter(Boolean).length;
  const roadmapProgress = Math.round((completedCount / roadmap.length) * 100);
  const projectText = (resume.projects || '').split('||INTERNSHIPS||')[0].trim();
  const projectName = projectText ? projectText.split('\n')[0].slice(0, 70) : 'Your resume project';

  const chooseType = type => { setCandidateType(type); localStorage.setItem('interview_candidate_type', type); setView('home'); };
  const markComplete = key => { const next = { ...progress, [key]: !progress[key] }; setProgress(next); localStorage.setItem('interview_progress', JSON.stringify(next)); };
  const openTopic = topic => { setSelectedTopic(topic); setView('topic'); };
  const openQuestions = topic => { setSelectedTopic(topic); setQuestionIndex(0); setShowAnswer(false); setView('questions'); };
  const startMock = mode => { setMockMode(mode); setMockAnswer(''); setMockSubmitted(false); setView('mock'); };
  const nextQuestion = () => { setQuestionIndex(index => Math.min(index + 1, questionBank.length - 1)); setShowAnswer(false); };
  const answer = currentQuestion.answer || 'Build your answer with a definition, practical example, trade-off and result. Keep it natural and connect it to your own work.';

  return <div className="interview-page">
    <header className="interview-header"><div><span className="section-kicker"><Mic2 size={14} /> Interview coach</span><h1>Interview <em>Preparation</em></h1><p>Prepare smarter based on your resume, experience level and target role.</p></div><div className="interview-progress-orbit"><strong>{roadmapProgress}%</strong><span>prepared</span></div></header>

    <section className="interview-type-grid"><button className={`interview-type-card ${candidateType === 'Fresher' ? 'active' : ''}`} onClick={() => chooseType('Fresher')}><span className="interview-type-icon"><BookOpen size={22} /></span><span><strong>Fresher</strong><small>0–1 year experience</small><em>Fundamentals · projects · coding · HR</em></span><ArrowRight size={17} /></button><button className={`interview-type-card ${candidateType === 'Experienced' ? 'active' : ''}`} onClick={() => chooseType('Experienced')}><span className="interview-type-icon experienced"><BriefcaseBusiness size={22} /></span><span><strong>Experienced</strong><small>1+ years experience</small><em>Real-world scenarios · depth · behavioral</em></span><ArrowRight size={17} /></button></section>
    {candidateType === 'Experienced' && <div className="experience-switch"><span>Experience depth</span>{['1–3 Years', '3–5 Years', '5+ Years'].map(level => <button key={level} className={experienceLevel === level ? 'active' : ''} onClick={() => { setExperienceLevel(level); localStorage.setItem('interview_experience', level); }}>{level}</button>)}</div>}

    <nav className="interview-nav"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><Target size={15} /> Overview</button><button className={view === 'skill' || view === 'topic' || view === 'questions' ? 'active' : ''} onClick={() => setView('skill')}><Layers3 size={15} /> Skills & questions</button><button className={view === 'rounds' ? 'active' : ''} onClick={() => setView('rounds')}><UsersRound size={15} /> Interview rounds</button><button className={view === 'mock' ? 'active' : ''} onClick={() => startMock('Full Mock Interview')}><Mic2 size={15} /> Mock interview</button></nav>

    {view === 'home' && <HomeView skills={skills} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} roadmap={roadmap} progress={progress} markComplete={markComplete} roadmapProgress={roadmapProgress} candidateType={candidateType} projectName={projectName} startMock={startMock} setView={setView} />}
    {view === 'skill' && <SkillView skills={skills} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} topics={topicQuestions} search={search} setSearch={setSearch} openTopic={openTopic} openQuestions={openQuestions} activeLevel={activeLevel} setActiveLevel={setActiveLevel} />}
    {view === 'topic' && <TopicView skill={selectedSkill} topic={selectedTopic} experienced={candidateType === 'Experienced'} openQuestions={openQuestions} />}
    {view === 'questions' && <QuestionView skill={selectedSkill} topic={selectedTopic} question={currentQuestion} index={questionIndex} total={questionBank.length} showAnswer={showAnswer} setShowAnswer={setShowAnswer} nextQuestion={nextQuestion} previousQuestion={() => { setQuestionIndex(index => Math.max(0, index - 1)); setShowAnswer(false); }} />}
    {view === 'rounds' && <RoundsView candidateType={candidateType} startMock={startMock} />}
    {view === 'mock' && <MockView mode={mockMode} question={currentQuestion} answer={mockAnswer} setAnswer={setMockAnswer} submitted={mockSubmitted} submit={() => { setMockSubmitted(true); markComplete('mock'); }} next={() => { setMockSubmitted(false); setMockAnswer(''); nextQuestion(); }} />}
  </div>;
}

function HomeView({ skills, selectedSkill, setSelectedSkill, roadmap, progress, markComplete, roadmapProgress, candidateType, projectName, startMock, setView }) {
  return <div className="interview-home-grid"><div className="interview-main-column"><section className="interview-panel skills-panel"><div className="panel-heading"><div><span className="section-kicker">Resume-based</span><h2>Your interview skills</h2></div><span className="panel-count">{skills.length} skills</span></div>{skills.length ? <div className="interview-skill-chips">{skills.map(skill => <button className={selectedSkill === skill ? 'active' : ''} key={skill} onClick={() => { setSelectedSkill(skill); setView('skill'); }}>{skill}</button>)}</div> : <div className="interview-empty"><CircleHelp size={20} /><span>Add skills to Resume Builder to personalize this section.</span></div>}</section><section className="interview-panel"><div className="panel-heading"><div><span className="section-kicker">Your roadmap</span><h2>{candidateType} preparation path</h2></div><span className="roadmap-score">{roadmapProgress}%</span></div><div className="roadmap-progress"><i style={{ width: `${roadmapProgress}%` }} /></div><div className="interview-roadmap">{roadmap.map((stage, index) => <button key={stage} className={progress[index] ? 'complete' : ''} onClick={() => markComplete(index)}><span>{progress[index] ? <Check size={13} /> : index + 1}</span><strong>{stage}</strong><small>{progress[index] ? 'Completed' : index === 0 ? 'Start here' : 'Practice next'}</small><ChevronRight size={15} /></button>)}</div></section></div><aside className="interview-side-column"><section className="interview-hero-card"><span className="section-kicker">Continue preparation</span><h2>{selectedSkill || 'Choose a skill'}<br /><em>{selectedSkill ? 'Topics & questions' : 'from your resume'}</em></h2><p>{selectedSkill ? 'Build a practical answer, then practise the follow-up conversation.' : 'Your technical skills will appear here once your resume is saved.'}</p><button className="btn btn-sun" disabled={!selectedSkill} onClick={() => setView('skill')}>Continue <ArrowRight size={15} /></button></section><section className="interview-panel practice-card"><div className="practice-icon"><Play size={18} /></div><div><span className="section-kicker">Today’s practice</span><h3>10 important questions</h3><p>Short, focused practice for your next conversation.</p></div><button className="btn btn-ink" onClick={() => startMock('Quick Practice')}>Start practice</button></section><section className="interview-panel project-card"><span className="section-kicker">Project preparation</span><h3>{projectName}</h3><p>Explain the problem, your contribution, decisions, challenges and what you would improve.</p><button className="text-button" onClick={() => setView('rounds')}>Practise project questions <ArrowRight size={14} /></button></section><section className="interview-panel progress-summary"><div className="panel-heading"><div><span className="section-kicker">Progress</span><h3>Practice signals</h3></div><Award size={18} /></div><div><span>Roadmap stages</span><strong>{Object.values(progress).filter(Boolean).length} / {roadmap.length}</strong></div><div><span>Weak area</span><strong>{selectedSkill || 'Choose a skill'}</strong></div><button className="text-button" onClick={() => setView('skill')}>Practice weak areas <ArrowRight size={14} /></button></section></aside></div>;
}

function SkillView({ skills, selectedSkill, setSelectedSkill, topics, search, setSearch, openTopic, openQuestions, activeLevel, setActiveLevel }) {
  const levels = ['All', 'Basics', 'Important', 'Frequently Asked', 'Scenario-based', 'Advanced'];
  return <section className="interview-workspace"><aside className="skill-sidebar"><div className="panel-heading"><h2>Skills</h2><span>{skills.length}</span></div>{skills.map(skill => <button key={skill} className={selectedSkill === skill ? 'active' : ''} onClick={() => setSelectedSkill(skill)}>{skill}<ChevronRight size={14} /></button>)}</aside><div className="skill-content"><div className="panel-heading"><div><span className="section-kicker">Skill-wise preparation</span><h2>{selectedSkill || 'Select a resume skill'}</h2></div></div><div className="level-tabs">{levels.map(level => <button key={level} className={activeLevel === level ? 'active' : ''} onClick={() => setActiveLevel(level)}>{level}</button>)}</div><div className="topic-toolbar"><div className="interview-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search topics" /></div><span><Filter size={13} /> {topics.length} topics</span></div><div className="topic-grid">{topics.map((topic, index) => <article className="topic-card" key={topic}><div className="topic-card-top"><span className={`importance-dot ${index < 2 ? 'very-important' : index < 5 ? 'important' : 'good'}`} />{index < 2 ? 'VERY IMPORTANT' : index < 5 ? 'IMPORTANT' : 'GOOD TO KNOW'}</div><h3>{topic}</h3><p>Learn the idea, speak it naturally, then connect it to practical usage.</p><div><button onClick={() => openTopic(topic)}>Learn topic <ArrowRight size={13} /></button><button onClick={() => openQuestions(topic)}>Questions</button></div></article>)}</div></div></section>;
}

function TopicView({ skill, topic, experienced, openQuestions }) {
  const question = fallbackQuestion(skill, topic, experienced);
  return <section className="topic-detail-layout"><article className="interview-panel topic-detail"><button className="back-link" onClick={() => openQuestions(topic)}><ChevronLeft size={15} /> Practice questions</button><span className="section-kicker">{skill} · topic guide</span><h2>{topic}</h2><div className="topic-detail-block"><h3>Simple explanation</h3><p>{topic} is a focused part of {skill}. Start with the core idea, then explain when it helps a user or a system.</p></div><div className="topic-detail-block"><h3>Why it is used</h3><p>Interviewers want to hear that you can choose the concept for a reason, not just repeat its definition.</p></div><div className="topic-example"><span>Example</span><code>{skill === 'JavaScript' ? `const result = items.filter(item => item.active);` : `// Use ${topic} in a small, focused feature`}</code></div><div className="topic-detail-block answer-block"><h3>Interview answer</h3><p>{question.answer}</p></div><div className="follow-up-chain"><h3>Follow-up question chain</h3><div><span>{topic}</span><ArrowRight size={14} /><span>How have you used it?</span><ArrowRight size={14} /><span>What trade-off did you consider?</span></div></div><div className="detail-columns"><div><h3>Practical usage</h3><p>Describe where this appeared in your own project and what changed because of it.</p></div><div><h3>Common mistakes</h3><p>Avoid vague definitions. Give one example and be honest about the depth of your experience.</p></div></div><button className="btn btn-sun" onClick={() => openQuestions(topic)}>Practise this topic <ArrowRight size={15} /></button></article></section>;
}

function QuestionView({ skill, topic, question, index, total, showAnswer, setShowAnswer, nextQuestion, previousQuestion }) {
  return <section className="interview-panel question-view"><div className="question-view-header"><div><span className="section-kicker">{skill} · {topic}</span><h2>Important questions</h2></div><span className="question-counter">Question {index + 1} of {total || 1}</span></div><div className="question-card"><span className="question-label">Interviewer</span><h3>{question.question}</h3><div className="question-focus"><span>What they are checking</span><p>Basic knowledge, practical understanding and your ability to explain a decision clearly.</p></div></div>{showAnswer ? <div className="answer-panel"><span className="question-label">Suggested answer</span><p>{question.answer}</p><div className="answer-extension"><strong>If they ask for more</strong><span>Give a small example, then mention a follow-up decision or limitation.</span></div><div className="follow-up-question"><strong>Possible follow-up</strong><span>Where have you used this in a project?</span></div></div> : <button className="btn btn-sun answer-button" onClick={() => setShowAnswer(true)}><Eye size={16} /> Show how to answer</button>}<div className="question-controls"><button className="btn btn-light" disabled={!index} onClick={previousQuestion}><ChevronLeft size={15} /> Previous</button><button className="btn btn-ink" onClick={nextQuestion}>Next question <ChevronRight size={15} /></button></div></section>;
}

function RoundsView({ candidateType, startMock }) {
  return <section className="rounds-layout"><div className="rounds-intro"><span className="section-kicker"><UsersRound size={14} /> Round-wise preparation</span><h2>Know what the conversation is testing.</h2><p>Not every company uses every round. The actual process depends on the company and role, so use this as a flexible preparation map.</p></div><div className="round-list">{ROUND_DATA.map((round, index) => <article className="round-card" key={round[0]}><span className="round-number">0{index + 1}</span><div><span className="section-kicker">Round {index + 1}</span><h3>{round[0]}</h3><p>{round[1]}</p><strong>Prepare: </strong><span>{round[2]}</span><button className="text-button" onClick={() => startMock(`${round[0]} Practice`)}>Practice this round <ArrowRight size={14} /></button></div></article>)}</div><section className="hr-practice interview-panel"><div><span className="section-kicker">Dedicated HR practice</span><h2>Sound like yourself, professionally.</h2><p>{candidateType === 'Experienced' ? 'Focus on responsibility, impact, feedback, collaboration and change.' : 'Focus on your story, projects, learning habits and motivation.'}</p></div><button className="btn btn-sun" onClick={() => startMock('HR Mock')}>Start HR practice <ArrowRight size={15} /></button></section><section className="interview-panel hr-question-bank"><div className="panel-heading"><div><span className="section-kicker">HR question bank</span><h2>Practise the questions you will hear most</h2></div><MessageSquare size={18} /></div><div className="hr-question-grid">{HR_QUESTIONS.map((question, index) => <details key={question}><summary><span>{String(index + 1).padStart(2, '0')}</span>{question}</summary><div><strong>What HR is checking</strong><p>Clear communication, motivation and a specific answer grounded in your own experience.</p><strong>How to structure it</strong><p>Answer directly, give one example, then connect it back to the role.</p><button className="text-button" onClick={() => startMock('HR Mock')}>Practise answer <ArrowRight size={14} /></button></div></details>)}</div></section></section>;
}

function MockView({ mode, question, answer, setAnswer, submitted, submit, next }) {
  return <section className="mock-layout"><div className="mock-heading"><span className="section-kicker"><Mic2 size={14} /> {mode}</span><h2>One question at a time.</h2><p>Use this as practice guidance. It does not perfectly judge interview performance.</p></div><article className="mock-card"><div className="mock-card-top"><span>Interviewer</span><span><Clock3 size={13} /> Practice question</span></div><h3>{question.question}</h3>{!submitted ? <><textarea value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Type the answer you would speak..." rows="7" /><button className="btn btn-sun" onClick={submit} disabled={!answer.trim()}>Submit answer <ArrowRight size={15} /></button></> : <div className="mock-feedback"><div><span className="question-label">Your answer</span><p>{answer}</p></div><div><span className="question-label">Expected key points</span><p>Start with the idea, give a practical example, explain your contribution and mention a result or trade-off.</p></div><div><span className="question-label">Suggested answer</span><p>{question.answer || 'A clear answer is concise, practical and connected to your experience.'}</p></div><div className="missing-points"><strong>Follow-up question</strong><span>What would you change if the requirements or scale increased?</span></div><button className="btn btn-ink" onClick={next}>Next practice question <ArrowRight size={15} /></button></div>}</article></section>;
}
