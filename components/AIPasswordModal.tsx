
import React, { useState } from 'react';
import { TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';

interface AIPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: TFunction;
}

const AIPasswordModal: React.FC<AIPasswordModalProps> = ({ isOpen, onClose, onSuccess, t }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The modal will only be triggered if VITE_APP_SECRET_KEY is set,
    // so we only need to validate against that specific environment variable.
    const correctPassword = process.env.VITE_APP_SECRET_KEY;

    if (password === correctPassword) {
        setError('');
        setPassword('');
        onSuccess();
    } else {
        setError(t('incorrectPasswordError'));
    }
  };

  const handleClose = () => {
    setError('');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center animate-fade-in" onClick={handleClose}>
      <div className="bg-light-card dark:bg-dark-card w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{t('aiAccessControlTitle')}</h2>
          <button onClick={handleClose} className="p-2 rounded-full text-light-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ClearIcon />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {t('aiAccessControlMessage')}
            </p>
            <div>
                <label htmlFor="ai-password" className="sr-only">{t('secretKey')}</label>
                <input
                    id="ai-password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className={`w-full h-12 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-2 rounded-xl outline-none transition-colors ${error ? 'border-red-500' : 'border-transparent focus:border-primary'}`}
                    placeholder={t('secretKeyPlaceholder')}
                    autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
             <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
                {t('unlock')}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AIPasswordModal;