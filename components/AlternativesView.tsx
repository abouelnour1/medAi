import React from 'react';
import { Medicine, TFunction, Language } from '../types';
import MedicineCard from './MedicineCard';

interface AlternativesViewProps {
    sourceMedicine: Medicine;
    alternatives: { direct: Medicine[], therapeutic: Medicine[] };
    onMedicineSelect: (medicine: Medicine) => void;
    onMedicineLongPress: (medicine: Medicine) => void;
    onFindAlternative: (medicine: Medicine) => void;
    t: TFunction;
    language: Language;
}

const Section: React.FC<{
    title: string, 
    medicines: Medicine[], 
    emptyMessage: string, 
    onMedicineSelect: (medicine: Medicine) => void, 
    onMedicineLongPress: (medicine: Medicine) => void, 
    onFindAlternative: (medicine: Medicine) => void, 
    t: TFunction, 
    language: Language 
}> = ({ title, medicines, emptyMessage, onMedicineSelect, onMedicineLongPress, onFindAlternative, t, language }) => {
    return (
        <div>
            <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-4 px-2">{title}</h2>
            {medicines.length > 0 ? (
                <div className="space-y-3">
                    {medicines.map(med => (
                        <MedicineCard
                            key={med.RegisterNumber}
                            medicine={med}
                            onShortPress={() => onMedicineSelect(med)}
                            onLongPress={onMedicineLongPress}
                            onFindAlternative={onFindAlternative}
                            t={t}
                            language={language}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 px-4 bg-light-card dark:bg-dark-card rounded-xl shadow-sm" role="status">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
};


const AlternativesView: React.FC<AlternativesViewProps> = ({
    sourceMedicine,
    alternatives,
    onMedicineSelect,
    onMedicineLongPress,
    onFindAlternative,
    t,
    language
}) => {
    const price = parseFloat(sourceMedicine['Public price']);
    return (
        <div className="animate-fade-in space-y-8 px-4">
            <div>
                <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary px-2">{t('originalDrug')}</h3>
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-5 mt-2 border-l-4 border-primary dark:border-primary-light">
                    <div className="flex items-start justify-between gap-4">
                         <div className="flex-grow">
                            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">{sourceMedicine['Trade Name']}</h2>
                            <p className="text-md text-light-text-secondary dark:text-dark-text-secondary">{sourceMedicine['Scientific Name']}</p>
                        </div>
                        <div className="flex-shrink-0 text-accent text-2xl font-bold whitespace-nowrap">
                            {isNaN(price) ? 'N/A' : price.toFixed(2)} <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('sar')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Section
                title={t('directAlternatives')}
                medicines={alternatives.direct}
                emptyMessage={t('noDirectAlternatives')}
                onMedicineSelect={onMedicineSelect}
                onMedicineLongPress={onMedicineLongPress}
                onFindAlternative={onFindAlternative}
                t={t}
                language={language}
            />

            <Section
                title={t('therapeuticAlternatives')}
                medicines={alternatives.therapeutic}
                emptyMessage={t('noTherapeuticAlternatives')}
                onMedicineSelect={onMedicineSelect}
                onMedicineLongPress={onMedicineLongPress}
                onFindAlternative={onFindAlternative}
                t={t}
                language={language}
            />

        </div>
    );
};

export default AlternativesView;