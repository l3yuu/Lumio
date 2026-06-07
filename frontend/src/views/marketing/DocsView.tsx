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
          <h2 className="text-[2rem] mb-5 text-ink">Welcome to Lumio</h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            Lumio is an interactive, AI-powered study companion application designed to accelerate student test performance. By transforming static lecture materials, textbook PDFs, and syllabi outlines into interactive, concept-mapped quizzes, Lumio helps students identify and master knowledge gaps.
          </p>
          <p className="text-ink-muted leading-relaxed mb-6">
            Whether you are preparing for midterms on your own or coordinating live practice sessions with a study circle, Lumio provides the scaffolding and spaced repetition utilities you need to excel.
          </p>
          <div className="bg-card border border-line rounded-xl p-6 mt-8">
            <h4 className="font-bold mb-2 text-primary">Key Capabilities</h4>
            <ul className="list-disc pl-5 text-ink-muted flex flex-col gap-2">
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
          <h2 className="text-[2rem] mb-5 text-ink">Getting Started</h2>
          <p className="text-ink-muted leading-relaxed mb-6">
            Setting up your workspace in Lumio takes under a minute. Follow these steps to generate your first active learning module.
          </p>
          <h3 className="text-[1.35rem] mb-3 mt-6 text-ink">1. Create an Account</h3>
          <p className="text-ink-muted leading-relaxed mb-4">
            Click the <strong>Sign Up</strong> button in the navbar. Input your name, school email address, and a secure password. You'll instantly be redirected to your personal Student Dashboard.
          </p>
          <h3 className="text-[1.35rem] mb-3 mt-6 text-ink">2. Upload Your First Module</h3>
          <p className="text-ink-muted leading-relaxed mb-4">
            On the dashboard main page, click <strong>Upload Study Module</strong>. Drop a PDF textbook chapter, copy-paste lecture notes, or upload a syllabus outline.
          </p>
          <h3 className="text-[1.35rem] mb-3 mt-6 text-ink">3. Practice Your Quizzes</h3>
          <p className="text-ink-muted leading-relaxed mb-6">
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
          <h2 className="text-[2rem] mb-5 text-ink">AI Study Utilities</h2>
          <p className="text-ink-muted leading-relaxed mb-6">
            Lumio features three distinct AI modules to optimize revision cycles. Access them directly from the navbar's **Study Tools** dropdown menu.
          </p>
          
          <div className="flex flex-col gap-6 mt-6">
            <div className="p-5 border border-line rounded-lg">
              <h4 className="flex items-center gap-2 font-bold mb-2 text-ink">
                <Sparkles size={16} color="var(--primary)" /> Flashcard Generator
              </h4>
              <p className="text-ink-muted text-[0.9rem] leading-snug">
                Converts reading notes into targeted spaced repetition decks. Tracks correct answers to focus future reviews on card definitions you struggle with.
              </p>
            </div>

            <div className="p-5 border border-line rounded-lg">
              <h4 className="flex items-center gap-2 font-bold mb-2 text-ink">
                <HelpCircle size={16} color="var(--primary)" /> AI Essay Grader
              </h4>
              <p className="text-ink-muted text-[0.9rem] leading-snug">
                Paste draft essays alongside your course's grading rubrics. Our AI scores the text on structure, context, and coherence, suggesting line-by-line revisions.
              </p>
            </div>

            <div className="p-5 border border-line rounded-lg">
              <h4 className="flex items-center gap-2 font-bold mb-2 text-ink">
                <Layers size={16} color="var(--primary)" /> Document Condenser
              </h4>
              <p className="text-ink-muted text-[0.9rem] leading-snug">
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
          <h2 className="text-[2rem] mb-5 text-ink">Collaborative Study Groups</h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            Learning is more effective when done together. Study Groups let you pool revision materials and track accuracy metrics side-by-side with classmates.
          </p>
          <ul className="list-disc pl-5 text-ink-muted flex flex-col gap-3 mt-6">
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
          <h2 className="text-[2rem] mb-5 text-ink">Data Security & Privacy</h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            We implement strict safeguards to protect your personal and academic documents:
          </p>
          <ul className="list-disc pl-5 text-ink-muted flex flex-col gap-3 mt-4">
            <li>Your uploaded study outlines and PDFs are fully private to your account.</li>
            <li>Files are only shared with Study Group workspaces when you click to publish them.</li>
            <li>We do not sell or trade your study uploads to third-party datasets.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-[calc(100vh-58px)] overflow-hidden max-md:flex-col max-md:h-auto max-md:overflow-visible">
      <aside className="w-[260px] flex-shrink-0 flex flex-col gap-1.5 py-8 px-6 border-r border-line bg-app overflow-y-auto max-md:w-full max-md:h-auto max-md:border-r-0 max-md:border-b max-md:py-6 max-md:px-4 max-md:flex-row max-md:flex-wrap max-md:gap-2 max-md:overflow-x-auto">
        <h4 className="uppercase text-xs tracking-[0.12em] text-ink-muted px-3 pb-3 border-b border-line">Documentation</h4>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg text-[0.95rem] font-semibold bg-transparent border-0 text-left w-full cursor-pointer transition-all duration-150 text-ink-muted hover:text-primary hover:bg-glass ${activeSection === section.id ? 'text-primary bg-glass' : ''}`}
          >
            <span className={`flex-shrink-0 ${activeSection === section.id ? 'text-primary' : 'text-ink-muted'}`}>
              {section.icon}
            </span>
            {section.title}
          </button>
        ))}
      </aside>

      <div className="flex-1 overflow-y-auto py-10 px-12 max-w-[900px] max-md:py-8 max-md:px-4 max-md:overflow-y-visible">
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
