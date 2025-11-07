import React from 'react';
import { PrescriptionData, TFunction } from '../types';
import ReceiptIcon from './icons/ReceiptIcon';

interface PrescriptionListViewProps {
  prescriptions: PrescriptionData[];
  onSelectPrescription: (prescription: PrescriptionData) => void;
  t: TFunction;
}

const PrescriptionListView: React.FC<PrescriptionListViewProps> = ({ prescriptions, onSelectPrescription, t }) => {
  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-dark-text-secondary p-8">
        <div className="w-16 h-16"><ReceiptIcon /></div>
        <h2 className="text-2xl font-bold mt-4">{t('noPrescriptions')}</h2>
        <p className="mt-1">{t('noPrescriptionsSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in space-y-4">
       <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{t('prescriptionsListTitle')}</h2>
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {prescriptions.map(p => (
            <li key={p.id}>
              <button
                onClick={() => onSelectPrescription(p)}
                className="w-full text-left p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex-grow">
                  <p className="font-semibold text-light-text dark:text-dark-text truncate">{t('patientName')}: {p.patientName}</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('date')}: {p.date}</p>
                </div>
                <div className="text-sm font-medium text-primary dark:text-blue-400">
                  {t('viewPrescription')}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PrescriptionListView;
