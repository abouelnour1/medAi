import React, { useState, useEffect } from 'react';
import { Language, TFunction, ChatMessage } from '../types';

interface Conversation {
  id: string;
  title: string;
  preview: string;
  date: string;
  messages: ChatMessage[];
  messageCount: number;
}

interface Props {
  language: Language;
  t: TFunction;
  onLoadConversation: (messages: ChatMessage[]) => void;
  onClose: () => void;
}

const STORAGE_KEY = 'pharma_conversations';

export function saveConversation(messages: ChatMessage[]) {
  if (!messages.length) return;
  try {
    const stored: Conversation[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // عنوان من أول رسالة من المستخدم
    const firstUser = messages.find(m => m.role === 'user');
    const title = firstUser?.parts?.[0]?.text?.slice(0, 60) || 'محادثة';
    const lastModel = [...messages].reverse().find(m => m.role === 'model');
    const preview = lastModel?.parts?.[0]?.text?.slice(0, 80) || '';
    const conv: Conversation = {
      id: Date.now().toString(),
      title,
      preview,
      date: new Date().toISOString(),
      messages,
      messageCount: messages.length,
    };
    // نحتفظ بآخر 20 محادثة
    const updated = [conv, ...stored.filter(c => c.id !== conv.id)].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { }
}

export function loadConversations(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

const ChatHistoryView: React.FC<Props> = ({ language, t, onLoadConversation, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const ar = language === 'ar';

  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    if (window.confirm(ar ? 'حذف كل المحادثات؟' : 'Delete all conversations?')) {
      localStorage.removeItem(STORAGE_KEY);
      setConversations([]);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return ar ? 'منذ أقل من ساعة' : 'Less than an hour ago';
    if (diff < 86400000) {
      const h = Math.floor(diff / 3600000);
      return ar ? `منذ ${h} ساعة` : `${h}h ago`;
    }
    const days = Math.floor(diff / 86400000);
    if (days === 1) return ar ? 'أمس' : 'Yesterday';
    if (days < 7) return ar ? `منذ ${days} أيام` : `${days}d ago`;
    return d.toLocaleDateString(ar ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-light-bg dark:bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-slate-800 flex-shrink-0"
        style={{ paddingTop: 'calc(var(--android-status, 0px) + 52px)' }}>
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl active:scale-90 transition-transform">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-grow">
          <h1 className="font-black text-slate-800 dark:text-white text-sm">
            {ar ? 'سجل المحادثات' : 'Chat History'}
          </h1>
          <p className="text-[10px] text-slate-400">{conversations.length} {ar ? 'محادثة' : 'conversations'}</p>
        </div>
        {conversations.length > 0 && (
          <button onClick={clearAll} className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
            {ar ? 'حذف الكل' : 'Clear All'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">💬</span>
            <p className="font-black text-slate-400 text-sm">{ar ? 'لا توجد محادثات محفوظة' : 'No saved conversations'}</p>
            <p className="text-[11px] text-slate-300 mt-1">{ar ? 'ابدأ محادثة جديدة مع المساعد' : 'Start a new chat with the assistant'}</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => { onLoadConversation(conv.messages); onClose(); }}
              className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100 dark:border-dark-border active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">💬</span>
                    <h3 className="text-xs font-black text-slate-800 dark:text-white truncate">{conv.title}</h3>
                  </div>
                  {conv.preview && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">{conv.preview}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-300 dark:text-slate-600">{formatDate(conv.date)}</span>
                    <span className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                      {conv.messageCount} {ar ? 'رسالة' : 'msgs'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => deleteConv(conv.id, e)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistoryView;
