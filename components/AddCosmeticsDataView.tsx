import React, { useState } from 'react';
import { TFunction } from '../types';

interface AddCosmeticsDataViewProps {
  onImport: (data: any[]) => void;
  t: TFunction;
}

const sampleJson = `[
  {
    "BrandName": "Avalon Pharma",
    "SpecificName": "Avalon Care Hand Cream Original",
    "SpecificNameAr": "أفالون كير كريم اليدين الأصلي",
    "FirstSubCategoryEn": "Skin care products",
    "SecondSubCategoryEn": "Hand care products"
  }
]`;

const AddCosmeticsDataView: React.FC<AddCosmeticsDataViewProps> = ({ onImport, t }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImportClick = () => {
    setError(null);
    setSuccess(null);
    if (jsonInput.trim() === '') {
      setError(t('errorInputEmpty'));
      return;
    }

    let data;
    try {
        data = JSON.parse(jsonInput);
    } catch (e) {
        let detailedError = t('errorUnexpected');
        if (e instanceof Error) {
            let specificHint = '';
            if (e.message.includes('Unexpected non-whitespace character after JSON')) {
                specificHint = t('jsonErrorHintExtraText');
            } else if (e.message.includes('Unexpected token') && (jsonInput.includes("'") || jsonInput.match(/([{,]\s*)(\w+)\s*:/))) {
                specificHint = t('jsonErrorHintQuotes');
            }
            detailedError = `${t('errorJsonParse', { message: e.message })}${specificHint ? `\n\n${specificHint}` : ''}`;
        }
        setError(detailedError);
        return;
    }
    
    try {
        if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
            data = [data];
        }

        if (!Array.isArray(data)) {
            throw new Error(t('errorInvalidJsonArray'));
        }
        if (data.some(item => typeof item !== 'object' || item === null)) {
            throw new Error(t('errorArrayObjectOnly'));
        }

        onImport(data);
        setSuccess(t('importSuccess', { count: data.length }));
        setJsonInput('');
    } catch (e) {
        console.error("Data processing error:", e);
        if (e instanceof Error) {
             setError(e.message);
        } else {
             setError(t('errorProcessingData'));
        }
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">{t('addCosmeticsDataTitle')}</h2>
      <p className="text-light-text-secondary dark:text-dark-text-secondary">
        {t('addCosmeticsDataDescription')}
      </p>
      
      <div>
        <h3 className="font-semibold mb-2 text-light-text dark:text-dark-text">{t('formatExample')}</h3>
        <pre className="bg-gray-100 dark:bg-slate-900/50 p-4 rounded-md text-sm text-left direction-ltr overflow-x-auto">
          <code>{sampleJson}</code>
        </pre>
      </div>

      <div>
        <label htmlFor="json-input" className="block font-semibold mb-2 text-light-text dark:text-dark-text">
          {t('jsonData')}
        </label>
        <textarea
          id="json-input"
          rows={10}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="[ ... ]"
          className="w-full p-3 bg-gray-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:border-primary dark:focus:border-primary outline-none transition-colors text-left direction-ltr"
          aria-label="JSON data input"
        />
      </div>

      {error && <div className="bg-red-100 dark:bg-red-900/30 border-r-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md whitespace-pre-wrap" role="alert">{error}</div>}
      {success && <div className="bg-green-100 dark:bg-green-900/30 border-r-4 border-green-500 text-green-700 dark:text-green-200 p-4 rounded-md" role="alert">{success}</div>}

      <button
        onClick={handleImportClick}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
      >
        {t('importData')}
      </button>
    </div>
  );
};

export default AddCosmeticsDataView;
