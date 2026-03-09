import React, { useState } from 'react';

interface GeminiPromptModalProps {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
}

const GeminiPromptModal: React.FC<GeminiPromptModalProps> = ({ isOpen, prompt, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'opening'>('idle');

  if (!isOpen) return null;

  const handleCopyAndOpen = async () => {
    // 1. Copy
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    setStatus('copied');

    // 2. Open Gemini after short delay
    setTimeout(() => {
      setStatus('opening');
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        // Intent URL يفتح Gemini app مباشرة لو موجود
        window.location.href = `intent://gemini.google.com/app#Intent;scheme=https;package=com.google.android.apps.bard;S.browser_fallback_url=https%3A%2F%2Fgemini.google.com%2Fapp;end`;
      } else {
        window.open('https://gemini.google.com/app', '_blank');
      }
      setTimeout(onClose, 800);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-black text-sm text-slate-800 dark:text-white">Ask Gemini</p>
            <p className="text-[10px] text-slate-400">Pharmacist reference prompt</p>
          </div>
        </div>

        {/* Prompt box */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed select-all">
            {prompt}
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleCopyAndOpen}
          disabled={status !== 'idle'}
          className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-lg ${
            status === 'copied'  ? 'bg-emerald-500 text-white shadow-emerald-500/25' :
            status === 'opening' ? 'bg-indigo-500 text-white shadow-indigo-500/25' :
            'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
          }`}
        >
          {status === 'idle' && (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy & Open Gemini
            </>
          )}
          {status === 'copied' && (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied! Opening...
            </>
          )}
          {status === 'opening' && (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Opening Gemini...
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GeminiPromptModal;
