import React, { useState } from 'react';
import { Sparkles, HelpCircle, Layers, Users, Trophy, Clock } from 'lucide-react';
import { MockQuizWidget } from '../../components/marketing/MockQuizWidget';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, View, AuthTab } from '../../types';

interface LandingViewProps {
  user: User | null;
  setView: (view: View) => void;
  setAuthTab: (tab: AuthTab) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ user, setView, setAuthTab }) => {
  const [landingFaqOpen, setLandingFaqOpen] = useState<number | null>(null);

  const studyTools = [
    { title: 'Flashcard Generator', desc: 'Auto-generate revision cards from notes.', icon: <Sparkles size={20} /> },
    { title: 'AI Essay Grader', desc: 'Get grading reviews on your practice essays.', icon: <HelpCircle size={20} /> },
    { title: 'Document Condenser', desc: 'Condense large textbooks in seconds.', icon: <Layers size={20} /> }
  ];

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
      <header className="grid grid-cols-[1.1fr_0.9fr] items-center gap-16 py-20 max-md:grid-cols-1 max-md:text-center max-md:py-12">
        <motion.div
          className="max-w-[580px] max-md:max-w-full max-md:mx-auto"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="text-primary text-[0.85rem] font-bold uppercase tracking-[0.12em] mb-5">Interactive Study Companion</div>
          <h1 className="text-[3.5rem] leading-[1.15] mb-6 tracking-[-0.03em] font-bold">
            Turn lecture notes into <span className="text-primary bg-gradient-to-r from-primary-tint-2 to-primary-soft px-1 rounded">practice quizzes</span>
          </h1>
          <p className="text-[1.15rem] text-ink-muted leading-relaxed mb-10">
            Upload your syllabus outlines, textbook chapters, or lecture PDFs. Lumio instantly compiles concept-mapped practice exams and scorecards for you and your study groups.
          </p>

          <div className="flex gap-4">
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
              className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md px-4 py-2 hover:bg-primary-hover hover:border-primary-hover"
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('how-it-works')}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-transparent text-ink border border-line rounded-md px-4 py-2 hover:bg-input hover:border-line-strong"
            >
              How it Works
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="bg-card border border-line rounded-xl shadow-lg overflow-hidden flex flex-col w-full">
            <div className="h-10 bg-app border-b border-line flex items-center px-4 gap-2">
              <div className="flex gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
              </div>
              <div className="flex-1 max-w-[320px] h-6 bg-card border border-line rounded mx-auto text-xs text-ink-muted flex items-center justify-center tracking-wide">lumio.study/simulator/cell-bio-101</div>
            </div>
            <div className="flex-1 p-6 bg-app flex flex-col gap-5 overflow-hidden text-sm">
              <MockQuizWidget />
            </div>
          </div>
        </motion.div>
      </header>

      <motion.div
        className="flex flex-col items-center gap-4 py-12 border-b border-line mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">Integrates & Works With Your Outlines</span>
        <div className="flex flex-wrap justify-center items-center gap-10">
          {[
            { label: 'PDF Documents', path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13 x2=8 M16 17 x2=8 M10 9" },
            { label: 'Microsoft Word', path: "" },
            { label: 'Google Docs', path: "" },
            { label: 'Notion Outlines', path: "" },
            { label: 'Canvas & Blackboard LMS', path: "" }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 text-[0.95rem] font-medium text-ink-muted opacity-70 transition-all duration-300 hover:opacity-100 hover:text-ink hover:-translate-y-px"
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

      <motion.section
        className="grid grid-cols-5 bg-card border border-line rounded-xl overflow-hidden my-12 mb-24 max-md:grid-cols-1"
        id="home"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div className="flex flex-col justify-center items-center py-8 px-4 text-center border-r border-line max-md:border-r-0 max-md:border-b max-md:last:border-b-0" variants={itemVariants}>
          <div className="text-[2rem] font-extrabold text-ink mb-1">1.5M+</div>
          <div className="text-sm text-ink-muted font-medium">Quizzes Generated</div>
        </motion.div>
        <motion.div className="flex flex-col justify-center items-center py-8 px-4 text-center border-r border-line max-md:border-r-0 max-md:border-b max-md:last:border-b-0 bg-glass" variants={itemVariants}>
          <div className="text-[2rem] font-extrabold text-ink mb-1">320K+</div>
          <div className="text-sm text-ink-muted font-medium">Modules Uploaded</div>
        </motion.div>
        <motion.div className="flex flex-col justify-center items-center py-8 px-4 text-center border-r border-line max-md:border-r-0 max-md:border-b max-md:last:border-b-0" variants={itemVariants}>
          <div className="text-[2rem] font-extrabold text-ink mb-1">98.4%</div>
          <div className="text-sm text-ink-muted font-medium">Score Improvement</div>
        </motion.div>
        <motion.div className="flex flex-col justify-center items-center py-8 px-4 text-center border-r border-line max-md:border-r-0 max-md:border-b max-md:last:border-b-0 bg-glass" variants={itemVariants}>
          <div className="text-[2rem] font-extrabold text-ink mb-1">24M+</div>
          <div className="text-sm text-ink-muted font-medium">Flashcards Solved</div>
        </motion.div>
        <motion.div className="flex flex-col justify-center items-center py-8 px-4 text-center border-r border-line max-md:border-r-0 max-md:border-b max-md:last:border-b-0" variants={itemVariants}>
          <div className="text-[2rem] font-extrabold text-ink mb-1">500K+</div>
          <div className="text-sm text-ink-muted font-medium">Active Students</div>
        </motion.div>
      </motion.section>

      <section id="how-it-works" className="mb-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[2.25rem] mb-2 tracking-[-0.02em] font-bold">How Lumio Works</h2>
          <p className="text-ink-muted text-base">Generate custom practice quizzes in three simple steps</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-3 gap-8 mb-24 max-md:grid-cols-1"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="bg-card border border-line rounded-xl p-8 relative overflow-hidden transition-colors duration-150 hover:border-primary hover:-translate-y-1" variants={itemVariants}>
            <span className="text-[1.5rem] font-extrabold text-primary bg-primary-soft w-11 h-11 rounded-lg flex items-center justify-center mb-6">01</span>
            <h3 className="mb-3 text-xl">Upload Outlines</h3>
            <p className="text-ink-muted text-[0.95rem] leading-normal">Drag and drop syllabus outline PDFs, textbook content briefs, or class notes templates.</p>
          </motion.div>
          <motion.div className="bg-card border border-line rounded-xl p-8 relative overflow-hidden transition-colors duration-150 hover:border-primary hover:-translate-y-1" variants={itemVariants}>
            <span className="text-[1.5rem] font-extrabold text-primary bg-primary-soft w-11 h-11 rounded-lg flex items-center justify-center mb-6">02</span>
            <h3 className="mb-3 text-xl">Concept Mapping</h3>
            <p className="text-ink-muted text-[0.95rem] leading-normal">Our AI parses and outlines core terms, formulas, and concepts maps for your course.</p>
          </motion.div>
          <motion.div className="bg-card border border-line rounded-xl p-8 relative overflow-hidden transition-colors duration-150 hover:border-primary hover:-translate-y-1" variants={itemVariants}>
            <span className="text-[1.5rem] font-extrabold text-primary bg-primary-soft w-11 h-11 rounded-lg flex items-center justify-center mb-6">03</span>
            <h3 className="mb-3 text-xl">Practice & Grade</h3>
            <p className="text-ink-muted text-[0.95rem] leading-normal">Run mock exams, synchronize scorecards with classmates, and track accuracies over time.</p>
          </motion.div>
        </motion.div>
      </section>

      <section id="group-study-showcase" className="mb-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[2.25rem] mb-2 tracking-[-0.02em] font-bold">Collaborative Study Groups</h2>
          <p className="text-ink-muted text-base">Create study groups, take live quizzes together, and track team progress on interactive scorecards.</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-16 items-center mt-12 max-md:grid-cols-1 max-md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-soft text-primary"><Users size={20} /></div>
                <div>
                  <h3 className="text-[1.15rem] mb-2 text-ink">Create Private Study Groups</h3>
                  <p className="text-ink-muted text-[0.95rem] leading-normal">
                    Invite classmates and study partners to join your group using email. Centralize study resources and lecture modules in one secure workspace.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-soft text-primary"><Trophy size={20} /></div>
                <div>
                  <h3 className="text-[1.15rem] mb-2 text-ink">Synchronized Live Group Quizzes</h3>
                  <p className="text-ink-muted text-[0.95rem] leading-normal">
                    Conduct practice quiz sessions as a team. Select modules, take quizzes concurrently, and compare answers instantly to learn together.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-soft text-primary"><Clock size={20} /></div>
                <div>
                  <h3 className="text-[1.15rem] mb-2 text-ink">Interactive Group Scorecards</h3>
                  <p className="text-ink-muted text-[0.95rem] leading-normal">
                    Review full group scorecard records. Spot subject weaknesses instantly and track historical accuracy performance.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-card border border-line rounded-xl shadow-lg overflow-hidden flex flex-col w-full min-h-[320px]">
              <div className="h-10 bg-app border-b border-line flex items-center px-4 gap-2">
              <div className="flex gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
              </div>
                <div className="flex-1 max-w-[320px] h-6 bg-card border border-line rounded mx-auto text-xs text-ink-muted flex items-center justify-center tracking-wide">lumio.study/dashboard/study-group-lobby</div>
              </div>
              <div className="flex-1 p-5 bg-app flex flex-col gap-5 overflow-hidden text-sm">
                <div className="flex justify-between items-center mb-6 border-b border-line pb-3">
                  <div>
                    <h3 className="text-[1.05rem] m-0">Anatomy Study Group</h3>
                    <span className="text-xs text-success flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                      Active Session Sync
                    </span>
                  </div>
                  <span className="text-[0.8rem] text-ink-muted">Module: Lecture 4</span>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-[1.5px] border-line font-bold text-xs flex items-center justify-center relative flex-shrink-0 bg-success text-ink-on-primary after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-primary after:rounded-full after:border-[1.5px] after:border-card">S</div>
                      <span className="text-[0.8rem] text-ink">Sarah Miller</span>
                    </div>
                    <span className="text-xs text-primary font-bold">Accuracy: 92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-[1.5px] border-line font-bold text-xs flex items-center justify-center relative flex-shrink-0 bg-blue text-ink-inverse after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-primary after:rounded-full after:border-[1.5px] after:border-card">A</div>
                      <span className="text-[0.8rem] text-ink">Alex Chen</span>
                    </div>
                    <span className="text-xs text-primary font-bold">Accuracy: 88%</span>
                  </div>
                </div>

                <div className="border border-dashed border-primary rounded-md p-3 text-center bg-primary-tint-1">
                  <div className="text-xs text-ink-muted mb-2">Active Live Practice Session: Cellular Division</div>
                  <button onClick={() => { if(user) { setView('dashboard'); } else { setAuthTab('signup'); setView('auth'); } }} className="inline-flex items-center justify-center gap-2 text-xs font-medium transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded px-3 py-1 hover:bg-primary-hover hover:border-primary-hover">
                    Join Practice Group
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="tools" className="pb-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[2.25rem] mb-2 tracking-[-0.02em] font-bold">AI Study Utilities</h2>
          <p className="text-ink-muted text-base">Everything you need to prepare for your next midterms or quizzes</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 mb-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {studyTools.map((t, idx) => (
            <motion.div
              className="bg-card border border-line rounded-xl p-8 cursor-pointer transition-all duration-200 group hover:-translate-y-2 hover:scale-[1.02] hover:border-primary hover:shadow-[0_8px_30px_rgba(62,207,142,0.08)]"
              key={idx}
              variants={itemVariants}
              onClick={() => { if(user) { setView('dashboard'); } else { setAuthTab('signup'); setView('auth'); } }}
            >
              <div className="w-11 h-11 rounded-lg bg-cyan-soft text-accent-cyan flex items-center justify-center mb-5 group-hover:bg-accent-cyan group-hover:text-ink-on-primary">{t.icon}</div>
              <div className="text-[1.15rem] font-bold mb-2">{t.title}</div>
              <div className="text-[0.9rem] text-ink-muted leading-relaxed">{t.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="mb-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[2.25rem] mb-2 tracking-[-0.02em] font-bold">Loved by Over 10,000+ Students</h2>
          <p className="text-ink-muted text-base">See how students around the world are elevating their study routines with Lumio</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 mt-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="bg-card border border-line rounded-xl p-8 transition-all duration-300 flex flex-col justify-between gap-6 hover:border-primary hover:-translate-y-0.5 hover:shadow-md" variants={itemVariants}>
            <div className="text-star flex gap-1 text-[1.1rem]">★★★★★</div>
            <p className="text-[0.95rem] leading-relaxed text-ink italic m-0">
              "As a third-year medical student, the volume of cellular and anatomy slides is overwhelming. Lumio converts my textbook chapters into customizable MCQs in seconds. It has cut my study review hours in half."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-[1.5px] border-line font-bold text-[0.8rem] flex items-center justify-center relative flex-shrink-0 bg-success text-ink-on-primary">M</div>
              <div>
                <h5 className="m-0 mb-0.5 text-[0.9rem] font-semibold text-ink">Maria Santos</h5>
                <span className="text-xs text-ink-muted">Medical Student, Stanford</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-card border border-line rounded-xl p-8 transition-all duration-300 flex flex-col justify-between gap-6 hover:border-primary hover:-translate-y-0.5 hover:shadow-md" variants={itemVariants}>
            <div className="text-star flex gap-1 text-[1.1rem]">★★★★★</div>
            <p className="text-[0.95rem] leading-relaxed text-ink italic m-0">
              "Our study group has synchronized test scores weekly now. We upload law outlines, host a live group lobby, and track who's getting ahead. Spaced repetition features are exceptionally high fidelity."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-[1.5px] border-line font-bold text-[0.8rem] flex items-center justify-center relative flex-shrink-0 bg-blue text-ink-inverse">K</div>
              <div>
                <h5 className="m-0 mb-0.5 text-[0.9rem] font-semibold text-ink">Kofi Anan</h5>
                <span className="text-xs text-ink-muted">Law Candidate, NYU</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-card border border-line rounded-xl p-8 transition-all duration-300 flex flex-col justify-between gap-6 hover:border-primary hover:-translate-y-0.5 hover:shadow-md" variants={itemVariants}>
            <div className="text-star flex gap-1 text-[1.1rem]">★★★★★</div>
            <p className="text-[0.95rem] leading-relaxed text-ink italic m-0">
              "I was skeptical about AI essay grading, but the critique parameters on Lumio matched my professor's rubric exactly. The condensed textbooks summary feature keeps me from getting bogged down in fluff."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-[1.5px] border-line font-bold text-[0.8rem] flex items-center justify-center relative flex-shrink-0 bg-primary text-ink-on-primary">L</div>
              <div>
                <h5 className="m-0 mb-0.5 text-[0.9rem] font-semibold text-ink">Lina Henderson</h5>
                <span className="text-xs text-ink-muted">Computer Science, MIT</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="mb-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[2.25rem] mb-2 tracking-[-0.02em] font-bold">Frequently Asked Questions</h2>
          <p className="text-ink-muted text-base">Everything you need to know about the Lumio companion app</p>
        </motion.div>

        <div className="max-w-[800px] mx-auto mt-12 flex flex-col gap-4">
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
              className="bg-card border border-line rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <button
                onClick={() => setLandingFaqOpen(landingFaqOpen === index ? null : index)}
                className="w-full bg-transparent border-0 px-6 py-5 flex justify-between items-center cursor-pointer text-left text-ink font-semibold text-base"
              >
                <span>{faq.q}</span>
                <span className={`inline-block ${landingFaqOpen === index ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 ease-in-out text-[0.8rem] text-primary`}>
                  ▼
                </span>
              </button>
              <AnimatePresence initial={false}>
                {landingFaqOpen === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0 border-t border-line">
                      <p className="text-ink-muted text-[0.9rem] leading-normal mt-4">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <motion.div
          className="relative bg-gradient-to-br from-success/10 to-transparent bg-card border border-line rounded-2xl p-16 px-12 text-center my-24 flex flex-col items-center gap-6 overflow-hidden"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[2.25rem] m-0 tracking-[-0.03em] font-bold">Ready to Ace Your Next Exam?</h2>
          <p className="text-[1.1rem] text-ink-muted max-w-[580px] mb-2">Join thousands of students who are generating quiz modules, practicing flashcards, and tracking team achievements daily on Lumio.</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold transition-all duration-150 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary rounded-md px-7 py-3.5 hover:bg-primary-hover hover:border-primary-hover"
              onClick={() => { setAuthTab('signup'); setView('auth'); }}
            >
              Get Started for Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('how-it-works')}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 no-underline cursor-pointer bg-transparent text-ink border border-line rounded-md px-7 py-3.5 hover:bg-input hover:border-line-strong"
            >
              Learn How It Works
            </motion.button>
          </div>
        </motion.div>
      </section>
    </>
  );
};
