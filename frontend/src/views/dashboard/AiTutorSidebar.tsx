import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Sparkle, AlertTriangle, Plus, History, ArrowLeft, Trash2 } from 'lucide-react';
import type { ChatMessage, Module, ChatSession } from '../../types';

interface AiTutorSidebarProps {
  onClose: () => void;
  chatMessages: ChatMessage[];
  isAiLoading: boolean;
  onSendMessage: (text: string) => void;
  modules?: Module[];
  onClearChat: () => void;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllHistory: () => void;
}

const formatTutorAnswer = (text: string): string => {
  return text
    .replace(/\*\*/g, '')
    .replace(/#+\s+/g, '')
    .replace(/^\s*[-*]\s+/g, '• ')
    .replace(/\n\s*[-*]\s+/g, '\n• ');
};

type TimestampInput = Date | string | number;

export const AiTutorSidebar: React.FC<AiTutorSidebarProps> = ({
  onClose,
  chatMessages,
  isAiLoading,
  onSendMessage,
  modules = [],
  onClearChat,
  chatSessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const [isHistoryViewOpen, setIsHistoryViewOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const formatMessageTime = (timestamp: TimestampInput): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatSessionDate = (timestamp: TimestampInput): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  // Generate suggested topics based on user's modules or default fallback
  const getSuggestions = () => {
    const defaultSuggestions = [
      'What is Mitochondria?',
      'Explain supply and demand',
      'Summarize cell division',
      'How do I prep for final exams?',
    ];
    
    if (!modules || modules.length === 0) {
      return defaultSuggestions;
    }
    
    const generated: string[] = [];
    const templates = [
      (name: string) => `Explain ${name}`,
      (name: string) => `Summarize ${name}`,
      (name: string) => `Key concepts in ${name}`,
      (name: string) => `Practice questions for ${name}`
    ];
    
    modules.forEach((mod, idx) => {
      if (idx < 4) {
        const templateFn = templates[idx % templates.length];
        generated.push(templateFn(mod.name));
      }
    });
    
    let defaultIdx = 0;
    while (generated.length < 4 && defaultIdx < defaultSuggestions.length) {
      const fallback = defaultSuggestions[defaultIdx];
      if (!generated.includes(fallback)) {
        generated.push(fallback);
      }
      defaultIdx++;
    }
    
    return generated;
  };

  const suggestions = getSuggestions();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      <div 
        className="lg:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed top-14.5 right-0 bottom-0 h-[calc(100vh-58px)] w-[85vw] sm:w-90 bg-card border-l border-line z-50 flex flex-col overflow-hidden shrink-0 shadow-xl"
      >
        <AnimatePresence mode="wait">
          {isHistoryViewOpen ? (
            <motion.div
              key="history-screen"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col h-full overflow-hidden w-full"
            >
              {/* History Header */}
              <div className="p-4 border-b border-line flex items-center justify-between bg-card shrink-0 relative z-10">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setIsHistoryViewOpen(false)}
                    className="p-1.5 rounded-lg border-0 bg-transparent text-ink-muted hover:text-ink hover:bg-glass cursor-pointer transition-colors duration-150 flex items-center justify-center"
                    title="Back to chat"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="text-[0.9rem] font-bold text-ink leading-tight">Chat History</div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-lg border-0 bg-transparent text-ink-muted hover:text-ink hover:bg-glass cursor-pointer transition-colors duration-150 flex items-center justify-center"
                  title="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* History Body */}
              {chatSessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3 bg-app/40">
                  <div className="bg-glass-strong border border-line p-3.5 rounded-full text-ink-muted shrink-0">
                    <History size={22} className="text-ink-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink mb-1">No Past Chats</p>
                    <p className="text-xs text-ink-muted max-w-50 leading-relaxed mx-auto">
                      Start asking your AI tutor questions to save your sessions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-app/40 scrollbar-thin">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setIsHistoryViewOpen(false);
                      }}
                      className={`group flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                        session.id === activeSessionId
                          ? 'bg-primary/5 border-primary shadow-xs'
                          : 'bg-card border-line hover:bg-glass hover:border-primary/40 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0 pr-2 text-left">
                        <span className="text-xs font-bold text-ink truncate group-hover:text-primary transition-colors duration-150">
                          {session.title}
                        </span>
                        <span className="text-[0.62rem] text-ink-muted">
                          {formatSessionDate(session.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/10 border-0 bg-transparent rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center shrink-0"
                        title="Delete chat session"
                      >
                        <Trash2 size={13.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* History Footer */}
              {chatSessions.length > 0 && (
                <div className="p-3 border-t border-line bg-card flex shrink-0 relative z-10">
                  <button
                    onClick={onClearAllHistory}
                    className="w-full py-2.5 px-4 rounded-xl border border-line bg-transparent hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs text-ink-muted font-bold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Clear All History
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat-screen"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col h-full overflow-hidden w-full"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-line flex items-center justify-between bg-card shrink-0 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                    <Sparkles size={16} className="text-primary animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-[0.9rem] font-bold text-ink leading-tight">AI Concept Tutor</div>
                    <div className="text-[0.68rem] text-ink-muted leading-tight mt-0.5">
                      Ask anything about your study modules
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsHistoryViewOpen(true)}
                    className="p-1.5 rounded-lg border-0 bg-transparent text-ink-muted hover:text-ink hover:bg-glass cursor-pointer transition-colors duration-150 flex items-center justify-center"
                    title="Chat History"
                  >
                    <History size={16} />
                  </button>
                  {(chatMessages.length > 1 || activeSessionId !== null) && (
                    <button 
                      onClick={onClearChat}
                      className="p-1.5 rounded-lg border-0 bg-transparent text-ink-muted hover:text-ink hover:bg-glass cursor-pointer transition-colors duration-150 flex items-center justify-center"
                      title="New Chat"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="p-1.5 rounded-lg border-0 bg-transparent text-ink-muted hover:text-ink hover:bg-glass cursor-pointer transition-colors duration-150 flex items-center justify-center"
                    title="Close sidebar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Message Panel */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-app/40 scrollbar-thin">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div 
                      className={`py-2 px-3.5 rounded-2xl text-[0.82rem] leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-ink-on-primary rounded-tr-sm shadow-sm' 
                          : msg.isError 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm flex items-start gap-2 text-left'
                            : 'bg-glass-strong border border-line rounded-tl-sm text-ink text-left'
                      }`}
                    >
                      {msg.isError && <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                      <span>{msg.sender === 'user' ? msg.text : formatTutorAnswer(msg.text)}</span>
                    </div>
                    <span className="text-[0.62rem] text-ink-muted mt-1 px-1">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                ))}

                {/* Typing/Loading Indicator */}
                {isAiLoading && (
                  <div className="self-start max-w-[85%] flex flex-col items-start gap-1">
                    <div className="py-2.5 px-3.5 rounded-2xl rounded-tl-sm bg-glass-strong border border-line flex items-center gap-2 text-ink text-left text-[0.82rem] select-none">
                      <Sparkles size={14} className="text-primary shrink-0 animate-pulse" />
                      <span className="text-ink-muted mr-1">Tutor is thinking</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}

                {chatMessages.length <= 1 && !isAiLoading && (
                  <div className="mt-4 flex flex-col gap-2">
                    <span className="text-[0.7rem] text-ink-muted font-bold uppercase tracking-wider pl-1 mb-1 text-left">Suggested Topics</span>
                    <div className="flex flex-col gap-1.5">
                      {suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSendMessage(sug)}
                          className="w-full text-left py-2 px-3 rounded-lg border border-line bg-card hover:bg-glass hover:border-primary/50 text-[0.78rem] text-ink transition-all duration-150 cursor-pointer flex items-center gap-2 group"
                        >
                          <Sparkle size={10} className="text-primary shrink-0 transition-transform group-hover:rotate-45" />
                          <span className="truncate">{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Form Footer */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-line bg-card flex gap-2 shrink-0 relative z-10">
                <input
                  type="text"
                  placeholder="Ask your AI tutor a question..."
                  className="flex-1 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app py-2.5 px-3 h-9.5 m-0 text-[0.82rem] disabled:opacity-50 disabled:cursor-not-allowed"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isAiLoading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary h-9.5 w-9.5 p-0 shrink-0 flex items-center justify-center rounded-lg"
                  disabled={!inputText.trim() || isAiLoading}
                >
                  <Send size={14} className="text-ink-on-primary" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
};
