import React, { useState } from 'react';

interface GeminiPromptModalProps {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
}

const GeminiPromptModal: React.FC<GeminiPromptModalProps> = ({ isOpen, prompt, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenGemini = () => {
    // حاول تفتح Gemini app أولاً، لو مش موجود يفتح المتصفح
    const appUrl = `intent://gemini.google.com/app#Intent;scheme=https;package=com.google.android.apps.bard;end`;
    const webUrl = `https://gemini.google.com/app`;
    
    // على Android نجرب الـ app intent
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = appUrl;
      // fallback للمتصفح بعد 1.5s لو الـ app مش موجود
      setTimeout(() => window.open(webUrl, '_blank'), 1500);
    } else {
      window.open(webUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <p className="font-black text-sm text-slate-800 dark:text-white">Ask Gemini</p>
            <p className="text-[10px] text-slate-400">Copy prompt then paste in Gemini</p>
          </div>
        </div>

        {/* Prompt box */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {prompt}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleOpenGemini}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Gemini
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiPromptModal;
