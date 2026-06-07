import React from 'react';
import { motion } from 'framer-motion';

export const TermsView: React.FC = () => {
  return (
    <motion.div 
      className="sub-page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}
    >
      <header className="sub-page-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="sub-page-title" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Terms of Service</h1>
        <p className="sub-page-intro" style={{ color: 'var(--text-secondary)' }}>Last Updated: June 7, 2026</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>1. Agreement to Terms</h2>
          <p>
            By accessing or using Lumio, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using the platform.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>2. User Account Registration</h2>
          <p>
            To utilize certain aspects of our service (such as Study Groups, essay grading, or saving syllabus outlines), you must register for an account. You agree to provide accurate registration information and protect your password security. You are responsible for all activities occurring under your account.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>3. Acceptable Use Policy</h2>
          <p>You agree not to use Lumio to:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
            <li>Upload materials that violate copyrights or intellectual property rights of academic publishers or educators.</li>
            <li>Use the platform for any academic dishonesty, plagiarism, or cheating that violates your educational institution's code of conduct.</li>
            <li>Attempt to bypass API boundaries, text extraction caps, or subscription tier limits.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>4. Subscriptions and Payments</h2>
          <p>
            Pro Student subscriptions cost $8/mo. You authorize recurring billing and agree to pay all charges incurred. Subscriptions can be canceled at any time from the dashboard settings tab, with cancellation taking effect at the end of the current billing cycle.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>5. Limitation of Liability</h2>
          <p>
            Lumio provides AI study tools "as is." We do not guarantee the absolute accuracy of generated quizzes, grades, or textbook summaries. We are not responsible for any academic grading outcomes or failures resulting from the use of our application.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account access at our sole discretion, without notice or liability, for breach of these Terms of Service.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
