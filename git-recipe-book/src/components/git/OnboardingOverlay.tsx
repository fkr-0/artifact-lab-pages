import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome! 👋',
    description: 'This is your Git playground. Learn Git commands by typing them in the terminal and watching the graph update in real time.',
    spotlight: 'center',
  },
  {
    title: 'Type Commands ⌨️',
    description: 'Use the terminal below to type Git commands like `git init`, `git add .`, and `git commit -m "message"`. Press Tab to autocomplete!',
    spotlight: 'terminal',
  },
  {
    title: 'Follow Lessons 📚',
    description: 'The sidebar has step-by-step lessons. Start with "Git Basics" to learn the fundamentals, then progress to branching, merging, and more!',
    spotlight: 'sidebar',
  },
];

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('git-recipe-book-onboarding-done', 'permanent');
      }
      onComplete();
    }
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('git-recipe-book-onboarding-done', 'permanent');
    } else {
      localStorage.setItem('git-recipe-book-onboarding-done', 'session');
    }
    onComplete();
  };

  const currentStep = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative z-50 bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary w-8' : 'bg-muted w-4'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold mb-2">{currentStep.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {currentStep.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded"
            />
            Don&apos;t show again
          </label>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            <Button size="sm" onClick={handleNext}>
              {step < STEPS.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-3 h-3 ml-1" />
                </>
              ) : (
                'Get Started!'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function shouldShowOnboarding(): boolean {
  const value = localStorage.getItem('git-recipe-book-onboarding-done');
  return value !== 'session' && value !== 'permanent';
}
