import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface GeminiPromptModalProps {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
}

const GeminiPromptModal: React.FC<GeminiPromptModalProps> = ({ isOpen, prompt, onClose }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [openStatus, setOpenStatus] = useState<'idle' | 'copied' | 'opening'>('idle');

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleCopyOnly = async () => {
    await copyToClipboard();
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleCopyAndOpen = async () => {
    await copyToClipboard();
    setOpenStatus('copied');
    setTimeout(async () => {
      setOpenStatus('opening');
      // نستخدم deep link لـ Gemini app مباشرة — يفتح التطبيق مش المتصفح
      const geminiAppUrl = 'https://gemini.google.com/app';
      const geminiDeepLink = 'com.google.android.apps.bard://';
      if (Capacitor.isNativePlatform()) {
        try {
          const { AppLauncher } = await import('@capacitor/app-launcher');
          // نجرب deep link أول عشان يفتح التطبيق مباشرة
          let opened = false;
          try {
            const r = await AppLauncher.openUrl({ url: geminiDeepLink });
            opened = r.completed;
          } catch {}
          if (!opened) {
            // fallback: Browser — يفتح بـ _system عشان ميرجعش للتطبيق
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.open({ url: geminiAppUrl, presentationStyle: 'popover' });
              opened = true;
            } catch {}
          }
          if (!opened) {
            window.open(geminiAppUrl, '_system');
          }
        } catch {
          window.open(geminiAppUrl, '_system');
        }
      } else {
        window.open(geminiAppUrl, '_blank', 'noopener,noreferrer');
      }
      setTimeout(onClose, 500);
    }, 600);
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
          <button onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Prompt box */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed select-all">
            {prompt.replace(/\\n/g, '\n')}
          </p>
        </div>

        {/* Two buttons */}
        <div className="flex gap-3">
          {/* Copy only */}
          <button
            onClick={handleCopyOnly}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 border-2 ${
              copyStatus === 'copied'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {copyStatus === 'copied' ? (
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

          {/* Copy & Open */}
          <button
            onClick={handleCopyAndOpen}
            disabled={openStatus !== 'idle'}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${
              openStatus === 'copied'  ? 'bg-emerald-500 text-white shadow-emerald-500/25' :
              openStatus === 'opening' ? 'bg-indigo-500 text-white shadow-indigo-500/25' :
              'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
            }`}
          >
            {openStatus === 'idle' && (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Copy & Open
              </>
            )}
            {openStatus === 'copied' && (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            )}
            {openStatus === 'opening' && (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Opening...
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiPromptModal;
