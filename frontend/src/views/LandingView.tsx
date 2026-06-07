import React, { useState } from 'react';
import { Sparkles, HelpCircle, Layers, Users, Trophy, Clock } from 'lucide-react';
import { MockQuizWidget } from '../components/MockQuizWidget';
import { motion } from 'framer-motion';

interface LandingViewProps {
  user: { name: string; email: string } | null;
  setView: (view: 'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing') => void;
  setAuthTab: (tab: 'login' | 'signup') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ user, setView, setAuthTab }) => {
  const [landingFaqOpen, setLandingFaqOpen] = useState<number | null>(null);

  const studyTools = [
    { title: 'Flashcard Generator', desc: 'Auto-generate revision cards from notes.', icon: <Sparkles size={20} /> },
    { title: 'AI Essay Grader', desc: 'Get grading reviews on your practice essays.', icon: <HelpCircle size={20} /> },
    { title: 'Document Condenser', desc: 'Condense large textbooks in seconds.', icon: <Layers size={20} /> }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <>
      {/* Hero Section */}
      <header className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="hero-subtitle">Interactive Study Companion</div>
          <h1 className="hero-title">
            Turn lecture notes into <span className="highlight">practice quizzes</span>
          </h1>
          <p className="hero-desc">
            Upload your syllabus outlines, textbook chapters, or lecture PDFs. Lumio instantly compiles concept-mapped practice exams and scorecards for you and your study groups.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (user) {
                  setView('dashboard');
                } else {
                  setAuthTab('signup');
                  setView('auth');
                }
              }} 
              className="btn btn-primary"
            >
              Get Started Free
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('how-it-works')} 
              className="btn btn-outline"
            >
              How it Works
            </motion.button>
          </div>
        </motion.div>
        
        {/* Mockup Quiz Simulator Interface */}
        <motion.div 
          className="hero-mockup-wrapper"
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="browser-mockup">
            <div className="browser-header">
              <div className="browser-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="browser-address">lumio.study/simulator/cell-bio-101</div>
            </div>
            <div className="browser-body">
              <MockQuizWidget />
            </div>
          </div>
        </motion.div>
      </header>

      {/* Supported Formats Row */}
      <motion.div 
        className="formats-row"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="formats-label">Integrates & Works With Your Outlines</span>
        <div className="formats-list">
          {[
            { label: 'PDF Documents', path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13 x2=8 M16 17 x2=8 M10 9" },
            { label: 'Microsoft Word', path: "" },
            { label: 'Google Docs', path: "" },
            { label: 'Notion Outlines', path: "" },
            { label: 'Canvas & Blackboard LMS', path: "" }
          ].map((item, index) => (
            <motion.div 
              key={index}
              className="format-item"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {index === 0 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
              {index === 1 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="12" y1="9" x2="8" y2="9"/></svg>}
              {index === 2 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              {index === 3 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>}
              {index === 4 && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
              {item.label}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Study Metrics Banner */}
      <motion.section 
        className="stats-banner" 
        id="home"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div className="stat-item" variants={itemVariants}>
          <div className="stat-num">1.5M+</div>
          <div className="stat-label">Quizzes Generated</div>
        </motion.div>
        <motion.div className="stat-item highlighted" variants={itemVariants}>
          <div className="stat-num">320K+</div>
          <div className="stat-label">Modules Uploaded</div>
        </motion.div>
        <motion.div className="stat-item" variants={itemVariants}>
          <div className="stat-num">98.4%</div>
          <div className="stat-label">Score Improvement</div>
        </motion.div>
        <motion.div className="stat-item highlighted" variants={itemVariants}>
          <div className="stat-num">24M+</div>
          <div className="stat-label">Flashcards Solved</div>
        </motion.div>
        <motion.div className="stat-item" variants={itemVariants}>
          <div className="stat-num">500K+</div>
          <div className="stat-label">Active Students</div>
        </motion.div>
      </motion.section>

      {/* How it Works Section */}
      <section id="how-it-works" style={{ marginBottom: '6rem' }}>
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">How Lumio Works</h2>
          <p className="section-subtitle">Generate custom practice quizzes in three simple steps</p>
        </motion.div>
        
        <motion.div 
          className="how-it-works-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="step-card" variants={itemVariants} whileHover={{ y: -5, borderColor: 'var(--primary)' }}>
            <span className="step-num">01</span>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Upload Outlines</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Drag and drop syllabus outline PDFs, textbook content briefs, or class notes templates.</p>
          </motion.div>
          <motion.div className="step-card" variants={itemVariants} whileHover={{ y: -5, borderColor: 'var(--primary)' }}>
            <span className="step-num">02</span>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Concept Mapping</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Our AI parses and outlines core terms, formulas, and concepts maps for your course.</p>
          </motion.div>
          <motion.div className="step-card" variants={itemVariants} whileHover={{ y: -5, borderColor: 'var(--primary)' }}>
            <span className="step-num">03</span>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Practice & Grade</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Run mock exams, synchronize scorecards with classmates, and track accuracies over time.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Study Groups Features Showcase Section */}
      <section id="group-study-showcase" style={{ marginBottom: '6rem' }}>
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Collaborative Study Groups</h2>
          <p className="section-subtitle">Create study groups, take live quizzes together, and track team progress on interactive scorecards.</p>
        </motion.div>

        <div className="group-showcase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginTop: '3rem' }}>
          <motion.div 
            className="showcase-content"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div className="tool-icon" style={{ flexShrink: 0, background: 'rgba(62, 207, 142, 0.1)', color: 'var(--primary)' }}><Users size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Create Private Study Groups</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Invite classmates and study partners to join your group using email. Centralize study resources and lecture modules in one secure workspace.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div className="tool-icon" style={{ flexShrink: 0, background: 'rgba(62, 207, 142, 0.1)', color: 'var(--primary)' }}><Trophy size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Synchronized Live Group Quizzes</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Conduct practice quiz sessions as a team. Select modules, take quizzes concurrently, and compare answers instantly to learn together.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div className="tool-icon" style={{ flexShrink: 0, background: 'rgba(62, 207, 142, 0.1)', color: 'var(--primary)' }}><Clock size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Interactive Group Scorecards</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Review full group scorecard records. Spot subject weaknesses instantly and track historical accuracy performance.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="group-showcase-visual"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="browser-mockup" style={{ minHeight: '320px' }}>
              <div className="browser-header">
                <div className="browser-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="browser-address">lumio.study/dashboard/study-group-lobby</div>
              </div>
              <div className="browser-body" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Anatomy Study Group</h3>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                      Active Session Sync
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Module: Lecture 4</span>
                </div>

                <div className="group-members-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="member-avatar online" style={{ background: '#10b981', color: '#121212', width: '24px', height: '24px', fontSize: '0.75rem' }}>S</div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Sarah Miller</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>Accuracy: 92%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="member-avatar online" style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', fontSize: '0.75rem' }}>A</div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Alex Chen</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>Accuracy: 88%</span>
                  </div>
                </div>

                {/* Active session trigger mockup */}
                <div style={{ border: '1px dashed var(--primary)', borderRadius: '6px', padding: '0.75rem', textAlign: 'center', background: 'rgba(62, 207, 142, 0.02)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Live Practice Session: Cellular Division</div>
                  <button className="btn btn-primary" onClick={() => { if(user) { setView('dashboard'); } else { setAuthTab('signup'); setView('auth'); } }} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Join Practice Group
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Study Tools Grid Section */}
      <section id="tools" style={{ paddingBottom: '6rem' }}>
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">AI Study Utilities</h2>
          <p className="section-subtitle">Everything you need to prepare for your next midterms or quizzes</p>
        </motion.div>
        
        <motion.div 
          className="tools-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {studyTools.map((t, idx) => (
            <motion.div 
              className="tool-card" 
              key={idx} 
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02, borderColor: 'var(--primary)', boxShadow: '0 8px 30px rgba(62, 207, 142, 0.08)' }}
              onClick={() => { if(user) { setView('dashboard'); } else { setAuthTab('signup'); setView('auth'); } }}
            >
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-title">{t.title}</div>
              <div className="tool-desc">{t.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Social Proof / Testimonials Section */}
      <section style={{ marginBottom: '6rem' }}>
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Loved by Over 10,000+ Students</h2>
          <p className="section-subtitle">See how students around the world are elevating their study routines with Lumio</p>
        </motion.div>
        
        <motion.div 
          className="testimonials-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="testimonial-card" variants={itemVariants} whileHover={{ y: -5 }}>
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              "As a third-year medical student, the volume of cellular and anatomy slides is overwhelming. Lumio converts my textbook chapters into customizable MCQs in seconds. It has cut my study review hours in half."
            </p>
            <div className="testimonial-user">
              <div className="member-avatar" style={{ background: '#10b981', color: '#121212', width: '32px', height: '32px', fontSize: '0.8rem' }}>M</div>
              <div className="testimonial-user-info">
                <h5>Maria Santos</h5>
                <span>Medical Student, Stanford</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="testimonial-card" variants={itemVariants} whileHover={{ y: -5 }}>
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              "Our study group has synchronized test scores weekly now. We upload law outlines, host a live group lobby, and track who's getting ahead. Spaced repetition features are exceptionally high fidelity."
            </p>
            <div className="testimonial-user">
              <div className="member-avatar" style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', fontSize: '0.8rem' }}>K</div>
              <div className="testimonial-user-info">
                <h5>Kofi Anan</h5>
                <span>Law Candidate, NYU</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="testimonial-card" variants={itemVariants} whileHover={{ y: -5 }}>
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">
              "I was skeptical about AI essay grading, but the critique parameters on Lumio matched my professor's rubric exactly. The condensed textbooks summary feature keeps me from getting bogged down in fluff."
            </p>
            <div className="testimonial-user">
              <div className="member-avatar" style={{ background: 'var(--primary)', color: '#121212', width: '32px', height: '32px', fontSize: '0.8rem' }}>L</div>
              <div className="testimonial-user-info">
                <h5>Lina Henderson</h5>
                <span>Computer Science, MIT</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive FAQ Accordion Section */}
      <section style={{ marginBottom: '6rem' }}>
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know about the Lumio companion app</p>
        </motion.div>
        
        <div className="landing-faq-container">
          {[
            {
              q: "What file formats does Lumio support?",
              a: "Lumio supports PDF textbooks, Word document outlines, lecture notes (.txt, .docx), and copy-pasted syllabi outlines up to 10MB."
            },
            {
              q: "How does the synchronized group quiz work?",
              a: "Create a study group, generate a quiz module, and invite friends. When you start a synchronized lobby session, everyone answers questions together and scorecards sync in real time."
            },
            {
              q: "Is there a limit on how many flashcards I can generate?",
              a: "Free plans support up to 5 module generations. Upgrading to the Pro Student plan ($8/mo) removes all limits, allowing infinite concept extractions and card sets."
            },
            {
              q: "Can I cancel my Pro subscription at any time?",
              a: "Yes, you can upgrade, downgrade, or cancel your Pro Student subscription instantly through your dashboard account settings with no hidden fees."
            }
          ].map((faq, index) => (
            <motion.div 
              key={index}
              className="faq-item" 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}
            >
              <button
                onClick={() => setLandingFaqOpen(landingFaqOpen === index ? null : index)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                <span>{faq.q}</span>
                <span style={{ 
                  transform: landingFaqOpen === index ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                  fontSize: '0.8rem',
                  color: 'var(--primary)'
                }}>
                  ▼
                </span>
              </button>
              {landingFaqOpen === index && (
                <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: '1rem 0 0 0' }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Call-to-Action Card */}
      <section style={{ paddingBottom: '4rem' }}>
        <motion.div 
          className="cta-banner"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="cta-title">Ready to Ace Your Next Exam?</h2>
          <p className="cta-desc">Join thousands of students who are generating quiz modules, practicing flashcards, and tracking team achievements daily on Lumio.</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary" 
              onClick={() => { setAuthTab('signup'); setView('auth'); }} 
              style={{ padding: '0.85rem 1.75rem', fontWeight: 'bold' }}
            >
              Get Started for Free
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('how-it-works')} 
              className="btn btn-outline" 
              style={{ padding: '0.85rem 1.75rem' }}
            >
              Learn How It Works
            </motion.button>
          </div>
        </motion.div>
      </section>
    </>
  );
};
