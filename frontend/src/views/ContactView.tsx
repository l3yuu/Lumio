import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export const ContactView: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you ${contactName}! Your message regarding "${contactSubject}" has been sent successfully.`);
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');
  };

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
    <div className="sub-page-container">
      <motion.header 
        className="sub-page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="sub-page-title">Contact Us</h1>
        <p className="sub-page-intro">Have questions or feedback? Get in touch with the Lumio support team.</p>
      </motion.header>

      <div className="contact-grid">
        {/* Contact Details */}
        <motion.div 
          className="contact-info-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="contact-info-item" variants={itemVariants} whileHover={{ x: 5 }}>
            <div className="contact-info-icon"><Mail size={18} /></div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Support Email</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>support@lumio.study</p>
            </div>
          </motion.div>

          <motion.div className="contact-info-item" variants={itemVariants} whileHover={{ x: 5 }}>
            <div className="contact-info-icon"><Phone size={18} /></div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Call Us</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>+1 (555) 492-8822</p>
            </div>
          </motion.div>

          <motion.div className="contact-info-item" variants={itemVariants} whileHover={{ x: 5 }}>
            <div className="contact-info-icon"><MapPin size={18} /></div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Main HQ</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>100 Pine Street, San Francisco, CA</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Interactive Contact Form */}
        <motion.div 
          className="dashboard-card"
          initial={{ opacity: 0, scale: 0.98, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                placeholder="Jane Doe" 
                className="form-input" 
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                placeholder="jane@example.com" 
                className="form-input" 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Subject</label>
              <input 
                type="text" 
                placeholder="Question about quiz limits" 
                className="form-input" 
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Message</label>
              <textarea 
                placeholder="Enter your message details..." 
                className="form-input" 
                style={{ padding: '0.75rem 1rem', minHeight: '120px', resize: 'vertical' }}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Send size={16} /> Send Message
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* FAQ Accordion Section */}
      <motion.div 
        className="faq-list"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h3 style={{ fontSize: '1.5rem', marginTop: '4rem', textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Frequently Asked Questions</h3>
        
        <div className="faq-item">
          <div className="faq-question">What file formats are supported for module uploads?</div>
          <div className="faq-answer">Lumio currently supports PDF, TXT, and DOCX outlines up to 10MB in size. We support text extraction, scanning concepts automatically.</div>
        </div>

        <div className="faq-item">
          <div className="faq-question">Is my uploaded study data private?</div>
          <div className="faq-answer">Yes. Your personal uploaded documents are encrypted and locked to your student account. If you choose to share modules with a Study Group, only validated members in that group can access them.</div>
        </div>

        <div className="faq-item">
          <div className="faq-question">Can I practice quiz sessions on mobile?</div>
          <div className="faq-answer">Absolutely. The landing page, uploader systems, simulator panels, and scorecards are fully responsive and optimized for mobile screens.</div>
        </div>
      </motion.div>
    </div>
  );
};
