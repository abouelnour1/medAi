import React from 'react';
import { Medicine, TFunction, Language } from '../types';
import MedicineCard from './MedicineCard';

interface AlternativesViewProps {
    sourceMedicine: Medicine;
    alternatives: { direct: Medicine[], diffStrength?: Medicine[], therapeutic: Medicine[] };
    onMedicineSelect: (medicine: Medicine) => void;
    onMedicineLongPress: (medicine: Medicine) => void;
    onFindAlternative: (medicine: Medicine) => void;
    favorites: string[];
    onToggleFavorite: (medicineId: string) => void;
    t: TFunction;
    language: Language;
}

const Section: React.FC<{
    title: string,
    subtitle?: string,
    badge?: string,
    badgeColor?: string,
    medicines: Medicine[],
    emptyMessage: string,
    onMedicineSelect: (medicine: Medicine) => void,
    onMedicineLongPress: (medicine: Medicine) => void,
    onFindAlternative: (medicine: Medicine) => void,
    favorites: string[],
    onToggleFavorite: (medicineId: string) => void,
    t: TFunction,
    language: Language
}> = ({ title, subtitle, badge, badgeColor = 'bg-primary/10 text-primary', medicines, emptyMessage, onMedicineSelect, onMedicineLongPress, onFindAlternative, t, language, favorites, onToggleFavorite }) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4 px-2">
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{title}</h2>
                {badge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {badge}
                    </span>
                )}
            </div>
            {subtitle && (
                <p className="text-xs text-light-text-secondary dark:text-dark-muted px-2 -mt-3 mb-3">{subtitle}</p>
            )}
            {medicines.length > 0 ? (
                <div className="space-y-3">
                    {medicines.map(med => (
                        <MedicineCard
                            key={med.RegisterNumber}
                            medicine={med}
                            onShortPress={() => onMedicineSelect(med)}
                            onLongPress={onMedicineLongPress}
                            onFindAlternative={onFindAlternative}
                            isFavorite={favorites.includes(med.RegisterNumber)}
                            onToggleFavorite={onToggleFavorite}
                            t={t}
                            language={language}
                            imageRight={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 px-4 bg-light-card dark:bg-dark-card rounded-xl shadow-sm" role="status">
                    <p className="text-sm text-light-text-secondary dark:text-dark-muted">{emptyMessage}</p>
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
    favorites,
    onToggleFavorite,
    t,
    language
}) => {
    const price = parseFloat(sourceMedicine['Public price']);
    const ar = language === 'ar';
    const diffStrength = alternatives.diffStrength || [];

    return (
        <div className="animate-fade-in space-y-8 px-4">
            <div>
                <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-muted px-2">{t('originalDrug')}</h3>
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-5 mt-2 border-l-4 border-primary dark:border-primary-light">
                    <div className="flex items-start justify-between gap-4">
                         <div className="flex-grow">
                            <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{sourceMedicine['Trade Name']}</h2>
                            <p className="text-sm text-light-text-secondary dark:text-dark-muted">{sourceMedicine['Scientific Name']}</p>
                            {sourceMedicine.Strength && (
                                <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {sourceMedicine.Strength} {sourceMedicine.StrengthUnit || ''}
                                </span>
                            )}
                        </div>
                        <div className="flex-shrink-0 text-accent text-xl font-bold whitespace-nowrap">
                            {isNaN(price) ? 'N/A' : `${price.toFixed(2)} ${ar ? 'ر.س' : 'SAR'}`}
                        </div>
                    </div>
                </div>
            </div>

            <Section
                title={t('directAlternatives')}
                badge={alternatives.direct.length > 0 ? String(alternatives.direct.length) : undefined}
                badgeColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                medicines={alternatives.direct}
                emptyMessage={t('noDirectAlternatives')}
                onMedicineSelect={onMedicineSelect}
                onMedicineLongPress={onMedicineLongPress}
                onFindAlternative={onFindAlternative}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                t={t}
                language={language}
            />

            {/* بدائل نفس المادة بتركيزات مختلفة */}
            {diffStrength.length > 0 && (
                <Section
                    title={ar ? 'نفس المادة — تركيز مختلف' : 'Same Ingredient — Different Strength'}
                    subtitle={ar
                        ? `نفس المادة الفعالة (${sourceMedicine['Scientific Name']}) بتركيزات مختلفة`
                        : `Same active ingredient (${sourceMedicine['Scientific Name']}) in different strengths`
                    }
                    badge={String(diffStrength.length)}
                    badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    medicines={diffStrength}
                    emptyMessage=""
                    onMedicineSelect={onMedicineSelect}
                    onMedicineLongPress={onMedicineLongPress}
                    onFindAlternative={onFindAlternative}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                    t={t}
                    language={language}
                />
            )}

            <Section
                title={t('therapeuticAlternatives')}
                badge={alternatives.therapeutic.length > 0 ? String(alternatives.therapeutic.length) : undefined}
                badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                medicines={alternatives.therapeutic}
                emptyMessage={t('noTherapeuticAlternatives')}
                onMedicineSelect={onMedicineSelect}
                onMedicineLongPress={onMedicineLongPress}
                onFindAlternative={onFindAlternative}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                t={t}
                language={language}
            />

        </div>
    );
};

export default AlternativesView;
