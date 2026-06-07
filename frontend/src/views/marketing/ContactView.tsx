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
    <div className="max-w-[840px] mx-auto py-16 px-6 pb-24">
      <motion.header 
        className="text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-[2.75rem] mb-4 tracking-[-0.02em] font-bold">Contact Us</h1>
        <p className="text-[1.15rem] text-ink-muted leading-relaxed">Have questions or feedback? Get in touch with the Lumio support team.</p>
      </motion.header>

      <div className="grid grid-cols-[1fr_1.3fr] gap-16 max-md:grid-cols-1 max-md:gap-10">
        <motion.div 
          className="flex flex-col gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex items-start gap-4 bg-card border border-line rounded-xl p-6" variants={itemVariants} whileHover={{ x: 5 }}>
            <div className="bg-cyan-soft text-accent-cyan p-2.5 rounded-lg flex"><Mail size={18} /></div>
            <div>
              <h4 className="font-bold mb-1">Support Email</h4>
              <a href="mailto:support.lumio@gmail.com" className="text-primary no-underline text-[0.9rem] font-medium">
                support.lumio@gmail.com
              </a>
            </div>
          </motion.div>

          <motion.div className="flex items-start gap-4 bg-card border border-line rounded-xl p-6" variants={itemVariants} whileHover={{ x: 5 }}>
            <div className="bg-cyan-soft text-accent-cyan p-2.5 rounded-lg flex"><Phone size={18} /></div>
            <div>
              <h4 className="font-bold mb-1">Call Us</h4>
              <p className="text-ink-muted text-[0.9rem]">+63 9605215327</p>
            </div>
          </motion.div>

          <motion.div className="flex items-start gap-4 bg-card border border-line rounded-xl p-6" variants={itemVariants} whileHover={{ x: 5 }}>
            <div className="bg-cyan-soft text-accent-cyan p-2.5 rounded-lg flex"><MapPin size={18} /></div>
            <div>
              <h4 className="font-bold mb-1">Main HQ</h4>
              <p className="text-ink-muted text-[0.9rem]">Quezon City, Philippines</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-card border border-line rounded-xl p-7"
          initial={{ opacity: 0, scale: 0.98, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-ink">Full Name</label>
              <input 
                type="text" 
                placeholder="Jane Doe" 
                className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary" 
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-ink">Email Address</label>
              <input 
                type="email" 
                placeholder="jane@example.com" 
                className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary" 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-ink">Subject</label>
              <input 
                type="text" 
                placeholder="Question about quiz limits" 
                className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-ink text-sm outline-none focus:border-primary" 
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-ink">Message</label>
              <textarea 
                placeholder="Enter your message details..." 
                className="w-full bg-input border border-line rounded-lg px-4 py-3 min-h-[120px] resize-y text-ink text-sm outline-none focus:border-primary" 
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="inline-flex items-center justify-center w-full gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-150 border border-transparent no-underline cursor-pointer bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover"
            >
              <Send size={16} /> Send Message
            </motion.button>
          </form>
        </motion.div>
      </div>

      <motion.div 
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-[1.5rem] mt-16 text-center border-b border-line pb-4">Frequently Asked Questions</h3>
        
        <div className="bg-card border border-line rounded-xl p-6">
          <div className="font-bold text-[1.05rem] mb-1.5">What file formats are supported for module uploads?</div>
          <div className="text-ink-muted text-[0.92rem] leading-relaxed">Lumio currently supports PDF, TXT, and DOCX outlines up to 10MB in size. We support text extraction, scanning concepts automatically.</div>
        </div>

        <div className="bg-card border border-line rounded-xl p-6">
          <div className="font-bold text-[1.05rem] mb-1.5">Is my uploaded study data private?</div>
          <div className="text-ink-muted text-[0.92rem] leading-relaxed">Yes. Your personal uploaded documents are encrypted and locked to your student account. If you choose to share modules with a Study Group, only validated members in that group can access them.</div>
        </div>

        <div className="bg-card border border-line rounded-xl p-6">
          <div className="font-bold text-[1.05rem] mb-1.5">Can I practice quiz sessions on mobile?</div>
          <div className="text-ink-muted text-[0.92rem] leading-relaxed">Absolutely. The landing page, uploader systems, simulator panels, and scorecards are fully responsive and optimized for mobile screens.</div>
        </div>
      </motion.div>
    </div>
  );
};
