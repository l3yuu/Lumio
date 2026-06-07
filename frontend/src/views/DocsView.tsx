import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, HelpCircle, Layers, Users, Shield, Terminal } from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    {
      id: 'intro',
      title: 'Introduction',
      icon: <BookOpen size={16} />,
      content: (
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Welcome to Lumio</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
            Lumio is an interactive, AI-powered study companion application designed to accelerate student test performance. By transforming static lecture materials, textbook PDFs, and syllabi outlines into interactive, concept-mapped quizzes, Lumio helps students identify and master knowledge gaps.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            Whether you are preparing for midterms on your own or coordinating live practice sessions with a study circle, Lumio provides the scaffolding and spaced repetition utilities you need to excel.
          </p>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>Key Capabilities</h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Instant Quiz Formulation:</strong> Drag-and-drop ingestion of outlines and slides.</li>
              <li><strong>AI Essay Evaluation:</strong> Sync essays with custom grading rubrics for instant feedback.</li>
              <li><strong>Spaced Repetition Flashcards:</strong> Automated retention deck generators.</li>
              <li><strong>Study Group lobbies:</strong> Live multiplayer testing modes with shared leaderboards.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Terminal size={16} />,
      content: (
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Getting Started</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            Setting up your workspace in Lumio takes under a minute. Follow these steps to generate your first active learning module.
          </p>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', marginTop: '1.5rem', color: 'var(--text-primary)' }}>1. Create an Account</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
            Click the <strong>Sign Up</strong> button in the navbar. Input your name, school email address, and a secure password. You'll instantly be redirected to your personal Student Dashboard.
          </p>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', marginTop: '1.5rem', color: 'var(--text-primary)' }}>2. Upload Your First Module</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
            On the dashboard main page, click <strong>Upload Study Module</strong>. Drop a PDF textbook chapter, copy-paste lecture notes, or upload a syllabus outline.
          </p>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', marginTop: '1.5rem', color: 'var(--text-primary)' }}>3. Practice Your Quizzes</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            Once processed, click on the generated module to access the practice quiz interface. Review your corrections sheet instantly upon completion to check your strengths and weaknesses.
          </p>
        </div>
      )
    },
    {
      id: 'study-tools',
      title: 'AI Study Tools',
      icon: <Sparkles size={16} />,
      content: (
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>AI Study Utilities</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            Lumio features three distinct AI modules to optimize revision cycles. Access them directly from the navbar's **Study Tools** dropdown menu.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                <Sparkles size={16} color="var(--primary)" /> Flashcard Generator
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Converts reading notes into targeted spaced repetition decks. Tracks correct answers to focus future reviews on card definitions you struggle with.
              </p>
            </div>

            <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                <HelpCircle size={16} color="var(--primary)" /> AI Essay Grader
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Paste draft essays alongside your course's grading rubrics. Our AI scores the text on structure, context, and coherence, suggesting line-by-line revisions.
              </p>
            </div>

            <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                <Layers size={16} color="var(--primary)" /> Document Condenser
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Summarizes large course textbooks and slide packages. Removes fluff while surfacing definitions, lists of formulas, and chronological timelines.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'groups',
      title: 'Study Groups',
      icon: <Users size={16} />,
      content: (
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Collaborative Study Groups</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
            Learning is more effective when done together. Study Groups let you pool revision materials and track accuracy metrics side-by-side with classmates.
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <li><strong>Lobby Session Sync:</strong> Host a live practice session where group members answer the same quiz questions simultaneously.</li>
            <li><strong>Leaderboard Scorecards:</strong> Compare score card results and track completion times.</li>
            <li><strong>Resource Pooling:</strong> Group members can share custom study notes modules instantly to the group's directory.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Data Security',
      icon: <Shield size={16} />,
      content: (
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Data Security & Privacy</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
            We implement strict safeguards to protect your personal and academic documents:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <li>Your uploaded study outlines and PDFs are fully private to your account.</li>
            <li>Files are only shared with Study Group workspaces when you click to publish them.</li>
            <li>We do not sell or trade your study uploads to third-party datasets.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="docs-page-layout">
      {/* Fixed sidebar — never moves */}
      <aside className="docs-sidebar">
        <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-secondary)', padding: '0 0.75rem 0.75rem', borderBottom: '1px solid var(--border)' }}>Documentation</h4>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`sidebar-link ${activeSection === section.id ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
          >
            <span style={{ color: activeSection === section.id ? 'var(--primary)' : 'var(--text-secondary)' }}>
              {section.icon}
            </span>
            {section.title}
          </button>
        ))}
      </aside>

      {/* Content area — offset to the right of the fixed sidebar */}
      <div className="docs-content-main">
        <motion.article 
          key={activeSection}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {sections.find((sec) => sec.id === activeSection)?.content}
        </motion.article>
      </div>
    </div>
  );
};
