

import React from 'react';
import { TFunction, Medicine } from '../types';

const NotCoveredCard: React.FC<{ medicine: Medicine, t: TFunction }> = ({ medicine, t }) => {
    const price = parseFloat(medicine['Public price']);
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg shadow-sm p-4 animate-fade-in">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="font-bold text-light-text dark:text-dark-text">{medicine['Trade Name']}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{medicine['Scientific Name']}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <div className="text-light-text dark:text-dark-text text-lg font-bold whitespace-nowrap">
                        {!isNaN(price) ? `${price.toFixed(2)} ${t('sar')}` : ''}
                    </div>
                    <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-1 rounded-full">{t('notCovered')}</span>
                </div>
            </div>
        </div>
    );
};

export default NotCoveredCard;