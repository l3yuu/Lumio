import React from 'react';
import { motion } from 'framer-motion';

export const PrivacyView: React.FC = () => {
  return (
    <motion.div 
      className="sub-page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}
    >
      <header className="sub-page-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="sub-page-title" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Privacy Policy</h1>
        <p className="sub-page-intro" style={{ color: 'var(--text-secondary)' }}>Last Updated: June 7, 2026</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>1. Introduction</h2>
          <p>
            Welcome to Lumio ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our interactive study companion application.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when registering, such as:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li><strong>Account Data:</strong> Name, email address, password hash.</li>
            <li><strong>Study Content:</strong> Document outlines, lecture note transcripts, textbooks, and practice questions.</li>
            <li><strong>Performance Metrics:</strong> Quiz answers, scorecards, flashcard accuracy records, and team leaderboard achievements.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>3. How We Use Your Information</h2>
          <p>We use the information we collect for biological logic processing and dashboard functionality, including:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li>To operate and maintain your student account dashboard.</li>
            <li>To analyze and parse lecture materials to construct concept maps and quizzes.</li>
            <li>To facilitate live, synchronized Study Group practices and scoreboard leaderboards.</li>
            <li>To monitor usage statistics and improve AI generation accuracy.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>4. Data Sharing & Privacy Controls</h2>
          <p>
            Your uploaded study modules are encrypted and kept private to your account. We do not sell or trade your study data. Study documents and modules are only shared with Study Groups if you explicitly choose to publish them to a group workspace.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>5. Security of Your Data</h2>
          <p>
            We implement industry-standard physical, technical, and organizational security measures to prevent unauthorized access, loss, or alteration of your personal data. However, please remember that no transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>6. Contact Us</h2>
          <p>
            If you have questions or concerns regarding this Privacy Policy, please reach out to us at <strong><a href="mailto:support.lumio@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>support.lumio@gmail.com</a></strong>.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
