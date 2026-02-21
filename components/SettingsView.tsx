import React from 'react';
import { View, Language, TFunction } from '../types';

interface SettingsViewProps {
  t: TFunction;
  language: Language;
  theme: string;
  setTheme: (theme: string) => void;
  setLanguage: (lang: Language) => void;
  setView: (view: View) => void;
  user: any;
  logout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  t, language, theme, setTheme, setLanguage, setView, user, logout
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
        <h3 className="text-lg font-black mb-6 border-b pb-4 dark:border-dark-border">
          {t('navSettings')}
        </h3>
        <div className="space-y-4">

          <button
            onClick={() => setView('favorites')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            <span className="font-bold">{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={() => setView('generalSettings')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            <span className="font-bold">{language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</span>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="font-bold text-slate-700 dark:text-slate-300">{t('darkMode')}</span>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-12 h-6 bg-slate-200 dark:bg-primary rounded-full relative transition-all"
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="font-bold text-slate-700 dark:text-slate-300">{t('language')}</span>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-4 py-1.5 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border font-black text-xs"
            >
              {language.toUpperCase()}
            </button>
          </div>

          {user && (
            <button
              onClick={logout}
              className="w-full mt-4 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl font-black text-sm"
            >
              {t('logout')}
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
