import React from 'react';
import { motion } from 'framer-motion';

export const PrivacyView: React.FC = () => {
  return (
    <motion.div 
      className="max-w-[800px] mx-auto py-8 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="text-center mb-12">
        <h1 className="text-[2.5rem] mb-3 tracking-[-0.02em] font-bold">Privacy Policy</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Last Updated: June 7, 2026</p>
      </header>

      <div className="flex flex-col gap-8 leading-relaxed text-ink-muted">
        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">1. Introduction</h2>
          <p>
            Welcome to Lumio ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our interactive study companion application.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when registering, such as:</p>
          <ul className="pl-6 mt-2 list-disc">
            <li><strong>Account Data:</strong> Name, email address, password hash.</li>
            <li><strong>Study Content:</strong> Document outlines, lecture note transcripts, textbooks, and practice questions.</li>
            <li><strong>Performance Metrics:</strong> Quiz answers, scorecards, flashcard accuracy records, and team leaderboard achievements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">3. How We Use Your Information</h2>
          <p>We use the information we collect for biological logic processing and dashboard functionality, including:</p>
          <ul className="pl-6 mt-2 list-disc">
            <li>To operate and maintain your student account dashboard.</li>
            <li>To analyze and parse lecture materials to construct concept maps and quizzes.</li>
            <li>To facilitate live, synchronized Study Group practices and scoreboard leaderboards.</li>
            <li>To monitor usage statistics and improve AI generation accuracy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">4. Data Sharing & Privacy Controls</h2>
          <p>
            Your uploaded study modules are encrypted and kept private to your account. We do not sell or trade your study data. Study documents and modules are only shared with Study Groups if you explicitly choose to publish them to a group workspace.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">5. Security of Your Data</h2>
          <p>
            We implement industry-standard physical, technical, and organizational security measures to prevent unauthorized access, loss, or alteration of your personal data. However, please remember that no transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">6. Contact Us</h2>
          <p>
            If you have questions or concerns regarding this Privacy Policy, please reach out to us at <strong><a href="mailto:support.lumio@gmail.com" className="text-primary no-underline">support.lumio@gmail.com</a></strong>.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
