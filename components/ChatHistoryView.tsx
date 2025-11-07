import React from 'react';
import { Conversation, TFunction, Language } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import TrashIcon from './icons/TrashIcon';

interface ChatHistoryViewProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onClearHistory: () => void;
  t: TFunction;
  language: Language;
}

const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onClearHistory,
  t,
  language,
}) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  const handleClearClick = () => {
    if (window.confirm(t('confirmClearHistory'))) {
        onClearHistory();
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-dark-text-secondary p-8">
        <HistoryIcon />
        <h2 className="text-2xl font-bold mt-4">{t('emptyHistory')}</h2>
        <p className="mt-1">{t('emptyHistorySubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
        <div className="flex justify-end">
            <button
                onClick={handleClearClick}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
                {t('clearHistory')}
            </button>
        </div>
        
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {conversations.map(convo => (
            <li key={convo.id} className="group">
                <div 
                    onClick={() => onSelectConversation(convo)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                    <div className="flex-grow">
                        <p className="font-semibold text-light-text dark:text-dark-text truncate">{convo.title}</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{formatDate(convo.timestamp)}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(convo.id);
                        }}
                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100/50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={t('deleteConversation')}
                    >
                        <TrashIcon />
                    </button>
                </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChatHistoryView;
