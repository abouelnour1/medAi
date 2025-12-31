
import React from 'react';
import { TFunction, Language, User } from '../types';
import { useAuth } from './auth/AuthContext';
import MoonIcon from './MoonIcon';
import SunIcon from './SunIcon';
import GlobeIcon from './icons/GlobeIcon';
import ShieldIcon from './icons/ShieldIcon';
import { isAIAvailable } from '../geminiService';

interface SettingsViewProps {
  t: TFunction;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User | null;
  onLoginClick: () => void;
}

/**
 * SettingGroup handles the visual wrapping of related setting items.
 * Typed as FC to ensure proper React.Node handling of children.
 */
const SettingGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">{title}</h3>
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

/**
 * SettingItem represents a single configurable row within a group.
 */
const SettingItem: React.FC<{ icon: React.ReactNode; label: string; action: React.ReactNode; value?: string }> = ({ icon, label, action, value }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
    <div className="flex items-center gap-3">
      <div className="text-primary dark:text-primary-light w-5 h-5">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
        {value && <p className="text-[10px] text-slate-400 font-medium">{value}</p>}
      </div>
    </div>
    <div>{action}</div>
  </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ t, language, setLanguage, theme, setTheme, user, onLoginClick }) => {
  const { logout } = useAuth();
  const aiStatus = isAIAvailable();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Account Profile Section */}
      <SettingGroup title={t('generalSettings')}>
        {user ? (
          <>
            <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">{user.username}</h2>
                    <p className="text-xs text-slate-500 font-bold">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded uppercase">
                        {user.role === 'admin' ? t('adminRole') : t('premiumRole')}
                    </span>
                </div>
            </div>
            <button 
                onClick={logout}
                className="w-full p-4 text-center text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
                {t('logout')}
            </button>
          </>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShieldIcon />
            </div>
            <p className="text-sm text-slate-500 font-bold">{t('loginRequired')}</p>
            <button 
                onClick={onLoginClick}
                className="px-8 py-2.5 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
                {t('login')}
            </button>
          </div>
        )}
      </SettingGroup>

      {/* Preferences Section */}
      <SettingGroup title={t('appSettingsTitle')}>
        <SettingItem 
          icon={theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          label={t('darkMode')}
          action={
            <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
            </button>
          }
        />
        <SettingItem 
          icon={<GlobeIcon />}
          label={t('language')}
          value={language === 'ar' ? 'العربية' : 'English'}
          action={
            <button 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-black rounded-lg border border-slate-200 dark:border-slate-700"
            >
                {language === 'ar' ? 'EN' : 'AR'}
            </button>
          }
        />
      </SettingGroup>

      {/* Technical Diagnostics Section */}
      <SettingGroup title="تشخيص الذكاء الاصطناعي (AI Status)">
        <div className="p-4 space-y-4">
            <div className={`flex items-center justify-between p-3 rounded-xl border ${aiStatus ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-black ${aiStatus ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {aiStatus ? 'متصل (API Key Active)' : 'غير متصل (API Key Missing)'}
                    </span>
                </div>
            </div>
            
            <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="font-bold mb-1">💡 ملاحظة للمطور:</p>
                يتم قراءة مفتاح الـ API تلقائياً من إعدادات النظام. إذا كان مؤشر الحالة بالأحمر، تأكد من وجود <strong>API_KEY</strong> في بيئة العمل.
            </div>
        </div>
      </SettingGroup>

      <div className="text-center opacity-30 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">PharmaSource KSA v2.1.0</p>
      </div>
    </div>
  );
};

export default SettingsView;
