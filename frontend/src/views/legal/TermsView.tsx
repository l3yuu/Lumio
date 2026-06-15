import React from 'react';
import { motion } from 'framer-motion';

export const TermsView: React.FC = () => {
  return (
    <motion.div 
      className="max-w-[800px] mx-auto py-8 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="text-center mb-12">
        <h1 className="text-[2.5rem] mb-3 tracking-[-0.02em] font-bold">Terms of Service</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Last Updated: June 7, 2026</p>
      </header>

      <div className="flex flex-col gap-8 leading-relaxed text-ink-muted">
        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing or using Lumio, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using the platform.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">2. User Account Registration</h2>
          <p>
            To utilize certain aspects of our service (such as Study Groups, essay grading, or saving syllabus outlines), you must register for an account. You agree to provide accurate registration information and protect your password security. You are responsible for all activities occurring under your account.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">3. Acceptable Use Policy</h2>
          <p>You agree not to use Lumio to:</p>
          <ul className="pl-6 mt-2 list-disc">
            <li>Upload materials that violate copyrights or intellectual property rights of academic publishers or educators.</li>
            <li>Use the platform for any academic dishonesty, plagiarism, or cheating that violates your educational institution's code of conduct.</li>
            <li>Attempt to bypass API boundaries, text extraction caps, or subscription tier limits.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">4. Subscriptions and Payments</h2>
          <p>
            Pro Student subscriptions cost ₱100/mo. You authorize recurring billing and agree to pay all charges incurred. Subscriptions can be canceled at any time from the dashboard settings tab, with cancellation taking effect at the end of the current billing cycle.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">5. Limitation of Liability</h2>
          <p>
            Lumio provides AI study tools "as is." We do not guarantee the absolute accuracy of generated quizzes, grades, or textbook summaries. We are not responsible for any academic grading outcomes or failures resulting from the use of our application.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[1.5rem] mb-3">6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account access at our sole discretion, without notice or liability, for breach of these Terms of Service.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
