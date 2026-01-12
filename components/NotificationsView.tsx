
import React from 'react';
import { Notification, TFunction, Language } from '../types';
import BellIcon from './icons/BellIcon';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  t: TFunction;
  language: Language;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onMarkAllRead, t, language }) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-bold">{t('notifications')}</h2>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={onMarkAllRead}
            className="text-xs font-bold text-primary hover:underline"
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                <BellIcon />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold">{t('noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-4 rounded-xl border transition-all ${
                notification.isRead 
                  ? 'bg-white dark:bg-dark-card border-slate-100 dark:border-slate-800 opacity-80' 
                  : 'bg-primary/5 dark:bg-primary/10 border-primary/20 ring-1 ring-primary/10'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-bold text-sm ${!notification.isRead ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                {notification.body}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {formatDate(notification.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
