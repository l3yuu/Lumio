import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export const MockQuizWidget: React.FC = () => {
  const [authMockOptionSelected, setAuthMockOptionSelected] = useState<number | null>(null);

  return (
    <div className="relative mb-4 bg-app border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-black/10">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
        </div>
        <div className="text-sm text-ink-muted font-medium">Cellular Biology 101 - Quiz</div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="px-2 py-0.5 bg-success/10 text-primary font-semibold rounded">Active Quiz</span>
          <span className="text-ink-muted">Time Left: 0:45</span>
        </div>

        <h4 className="text-base text-ink mb-3 leading-snug font-semibold">
          Which organelle converts chemical energy from food into compounds the cell can use?
        </h4>

        <div className="flex flex-col gap-2">
          {[
            { text: "Chloroplasts", id: 0 },
            { text: "Mitochondria", id: 1 },
            { text: "Lysosomes", id: 2 }
          ].map((opt) => {
            const isAnswered = authMockOptionSelected !== null;
            const isCorrectAnswer = opt.id === 1;
            const isUserSelection = authMockOptionSelected === opt.id;

            let stateClasses = '';
            if (isAnswered) {
              if (isCorrectAnswer) {
                stateClasses = 'border-success bg-success/10 text-success';
              } else if (isUserSelection) {
                stateClasses = 'border-danger bg-danger/10 text-danger';
              } else {
                stateClasses = 'opacity-50';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => authMockOptionSelected === null && setAuthMockOptionSelected(opt.id)}
                disabled={isAnswered}
                className={`flex items-center gap-3 w-full p-2 px-3 bg-card border border-line rounded-lg text-ink text-left cursor-pointer text-sm transition-all duration-200 ${stateClasses}`}
              >
                <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + opt.id)}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {authMockOptionSelected !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-app/95 backdrop-blur-md flex justify-center items-center z-[100] p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.05 }}
                className="text-center max-w-[320px] w-full bg-card border border-line rounded-2xl p-6 shadow-lg"
              >
                <div className="flex flex-col items-center gap-4">
                  {authMockOptionSelected === 1 ? (
                    <>
                      <div className="text-success flex justify-center">
                        <CheckCircle2 size={48} />
                      </div>
                      <h3 className="text-xl text-success font-bold my-1">Correct Answer!</h3>
                    </>
                  ) : (
                    <>
                      <div className="text-danger flex justify-center">
                        <XCircle size={48} />
                      </div>
                      <h3 className="text-xl text-danger font-bold my-1">Incorrect</h3>
                    </>
                  )}

                  <p className="text-ink leading-relaxed text-[0.85rem] mb-5">
                    {[
                      "Incorrect. Chloroplasts convert sunlight energy into sugars via photosynthesis, mostly found in plants.",
                      "Correct! Mitochondria acts as the cell's battery, manufacturing ATP molecules to fuel biological activities.",
                      "Incorrect. Lysosomes digest waste, cellular debris, and foreign invaders."
                    ][authMockOptionSelected]}
                  </p>

                  <button
                    onClick={() => setAuthMockOptionSelected(null)}
                    className={`inline-flex items-center gap-2 text-[0.85rem] py-2.5 px-4 rounded-md font-medium transition-all duration-150 border no-underline cursor-pointer w-full justify-center ${
                      authMockOptionSelected === 1
                        ? 'bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover'
                        : 'bg-transparent border-line text-ink hover:bg-input hover:border-line-strong'
                    }`}
                  >
                    {authMockOptionSelected === 1 ? "Awesome" : "Try Again"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
