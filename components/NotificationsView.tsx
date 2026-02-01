
import React, { useState } from 'react';
import { Notification, TFunction, Language } from '../types';
import BellIcon from './icons/BellIcon';
import TrashIcon from './icons/TrashIcon';
import BackIcon from './icons/BackIcon';
import PillBottleIcon from './icons/PillBottleIcon';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  isAdmin: boolean;
  t: TFunction;
  language: Language;
  onMedicineLink?: (medicineId: string) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onMarkAllRead, onMarkAsRead, onDeleteNotification, isAdmin, t, language, onMedicineLink }) => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  const handleNotificationClick = (notification: Notification) => {
      setSelectedNotification(notification);
      if (!notification.isRead) onMarkAsRead(notification.id);
  };

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  if (selectedNotification) {
      return (
          <div className="animate-fade-in space-y-6">
              <button onClick={() => setSelectedNotification(null)} className="flex items-center gap-2 text-primary font-bold text-sm">
                  <div className="w-4 h-4 transform rtl:rotate-180"><BackIcon /></div>
                  {t('backToNotifications')}
              </button>
              <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedNotification.title}</h2>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(selectedNotification.timestamp)}</p>
                  </div>
                  <div className="text-slate-700 dark:text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">{selectedNotification.body}</div>
                  
                  {selectedNotification.relatedMedicineId && (
                      <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800">
                          <button 
                            onClick={() => onMedicineLink?.(selectedNotification.relatedMedicineId!)}
                            className="w-full py-4 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all"
                          >
                              <div className="w-6 h-6"><PillBottleIcon /></div>
                              <span>{language === 'ar' ? 'عرض ملف الدواء' : 'View Medicine File'}</span>
                          </button>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-bold">{t('notifications')}</h2>
        {notifications.some(n => !n.isRead) && <button onClick={onMarkAllRead} className="text-xs font-bold text-primary hover:underline">{t('markAllRead')}</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300"><BellIcon /></div><p className="text-slate-500 font-bold">{t('noNotifications')}</p></div>
      ) : (
        <div className="space-y-3">
          {sortedNotifications.map(notification => (
            <div key={notification.id} onClick={() => handleNotificationClick(notification)} className={`p-4 rounded-xl border transition-all cursor-pointer relative ${notification.isRead ? 'bg-white dark:bg-dark-card border-slate-100 dark:border-slate-800 opacity-80' : 'bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-1 pr-8 rtl:pl-8"><h3 className={`font-bold text-sm ${!notification.isRead ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>{notification.title}</h3>{!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary animate-pulse ml-2" />}</div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{notification.body}</p>
              <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-slate-400">{formatDate(notification.timestamp)}</span>
                  {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDeleteNotification(notification.id); }} className="p-1.5 text-slate-300 hover:text-red-500"><div className="w-4 h-4"><TrashIcon /></div></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
