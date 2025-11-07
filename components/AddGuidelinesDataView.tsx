import React, { useState } from 'react';
import { TFunction } from '../types';

interface AddGuidelinesDataViewProps {
  onImport: (data: object) => void;
  t: TFunction;
}

const sampleJson = `{
  "hypertensionGuidelines": {
    "documentTitle": "Managing Raised Blood Pressure...",
    "issuingBody": "Saudi Health Council (SHMS)",
    "diagnosticAlgorithm": { ... },
    "box5_pharmacologicalIntervention": [ ... ]
  },
  "pcosGuidelines": { ... }
}`;

const AddGuidelinesDataView: React.FC<AddGuidelinesDataViewProps> = ({ onImport, t }) => {
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
    try {
      const data = JSON.parse(jsonInput);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Input must be a single JSON object.');
      }

      onImport(data);
      setSuccess(t('importSuccess', { count: Object.keys(data).length }));
      setJsonInput('');
    } catch (e) {
      if (e instanceof Error) {
        setError(t('errorJsonParse', { message: e.message }));
      } else {
        setError(t('errorUnexpected'));
      }
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">{t('addGuidelinesDataTitle')}</h2>
      <p className="text-light-text-secondary dark:text-dark-text-secondary">
        {t('addGuidelinesDataDescription')}
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
          placeholder="{ ... }"
          className="w-full p-3 bg-gray-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:border-primary dark:focus:border-primary outline-none transition-colors text-left direction-ltr"
          aria-label="JSON data input"
        />
      </div>

      {error && <div className="bg-red-100 dark:bg-red-900/30 border-r-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md" role="alert">{error}</div>}
      {success && <div className="bg-green-100 dark:bg-green-900/30 border-r-4 border-green-500 text-green-700 dark:text-green-200 p-4 rounded-md" role="alert">{success}</div>}

      <button
        onClick={handleImportClick}
        className="w-full bg-primary hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
      >
        {t('importData')}
      </button>
    </div>
  );
};

export default AddGuidelinesDataView;
