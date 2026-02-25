import React, { useState, useCallback, useRef, useEffect } from 'react';
// Local type definitions - no @google/genai import needed
type FunctionDeclaration = {
  name: string;
  description: string;
  parameters?: {
    type: string;
    description?: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
};
type Tool = { functionDeclarations: FunctionDeclaration[] };
const Type = {
  STRING: 'STRING' as const,
  NUMBER: 'NUMBER' as const,
  BOOLEAN: 'BOOLEAN' as const,
  ARRAY: 'ARRAY' as const,
  OBJECT: 'OBJECT' as const,
};
import { Medicine, TFunction, Language, ChatMessage, SerializablePart } from '../types';
import AssistantIcon from './icons/AssistantIcon';
import MarkdownRenderer from './MarkdownRenderer';
import { runAIChat, isAIAvailable, sanitizeParts } from '../geminiService';

interface InsuranceAiGuideProps {
  t: TFunction;
  language: Language;
  allMedicines: Medicine[];
}

const InsuranceAiGuide: React.FC<InsuranceAiGuideProps> = ({
  t,
  language,
  allMedicines,
}) => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiAvailable = isAIAvailable();

  useEffect(() => {
    setChatHistory([
      {
        role: 'model',
        parts: [{ text: t('insuranceViewDescription') }],
      },
    ]);
  }, [t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);


  const searchDrugDatabase = useCallback((args: {
    tradeName?: string;
    scientificName?: string;
  }) => {
    let results = [...allMedicines];
    if (args.tradeName) {
        results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    }
    if (args.scientificName) {
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().includes(args.scientificName!.toLowerCase()));
    }
    
    if (results.length === 0) {
        return { count: 0, message: 'No drugs found matching the specified criteria.' };
    }
    
    return {
        count: results.length,
        results: results.slice(0, 15).map(r => ({
            tradeName: r['Trade Name'],
            scientificName: r['Scientific Name'],
            price: r['Public price'],
            form: r.PharmaceuticalForm,
            strength: `${r.Strength} ${r.StrengthUnit}`.trim(),
            manufacturer: r['Manufacture Name'],
        }))
    };
  }, [allMedicines]);

  const searchDrugDatabaseTool: FunctionDeclaration = {
    name: 'searchDrugDatabase',
    description: 'Searches the local database for drugs available in the Saudi market by trade name or scientific name.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tradeName: { type: Type.STRING, description: 'The trade name of the drug.' },
        scientificName: { type: Type.STRING, description: 'The scientific (active ingredient) name of the drug.' }
      }
    }
  };

  const handleSendMessage = useCallback(async () => {
    const currentInput = userInput.trim();
    if (!currentInput || isLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: [{ text: currentInput }] }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    const systemInstruction = language === 'ar' ? `أنت مساعد ذكاء اصطناعي متخصص في دليل التأمين الطبي السعودي.` : `You are a specialized AI assistant acting as a Saudi Arabian Medical Insurance Guide.`;

    try {
      const toolImplementations = { searchDrugDatabase: searchDrugDatabase };
      const finalResponse = await runAIChat(
        newHistory, 
        systemInstruction, 
        [{ functionDeclarations: [searchDrugDatabaseTool] }], 
        toolImplementations,
        'gemini-3-flash-preview'
      );
      const responsePartsFromApi = finalResponse?.candidates?.[0]?.content?.parts;

      if (responsePartsFromApi && responsePartsFromApi.length > 0) {
          const sanitizedParts = sanitizeParts(responsePartsFromApi);
          setChatHistory(prev => [...prev, { role: 'model', parts: sanitizedParts }]);
      } else {
          setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: t('geminiError') }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, language, t, searchDrugDatabase, allMedicines]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage();
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm flex flex-col h-[calc(100vh-220px)]">
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {!aiAvailable && (
            <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg m-4">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{t('aiUnavailableTitle')}</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{t('aiUnavailableMessage')}</p>
            </div>
          )}
          {aiAvailable && chatHistory.map((msg, index) => {
             const textPart = msg.parts?.find(p => 'text' in p) as { text: string } | undefined;
             const textContent = textPart?.text || '';

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><AssistantIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm p-3 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none'}`}>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none ai-response-content">
                          <MarkdownRenderer content={textContent} />
                      </div>
                  </div>
                </div>
            )
          })}
          
          {isLoading && (
              <div className="flex justify-start animate-fade-in">
                 <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none flex items-center gap-1 shadow-sm">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
             <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={aiAvailable ? t('insuranceSearchPlaceholder') : t('aiUnavailableShort')}
                    className="flex-grow w-full p-2 bg-gray-100 dark:bg-slate-700 border-2 border-transparent focus:border-primary rounded-lg outline-none transition-colors resize-none"
                    rows={1}
                    disabled={isLoading || !aiAvailable}
                    aria-label={t('askGeminiPlaceholder')}
                />
                <button type="submit" disabled={isLoading || !userInput || !aiAvailable} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors">{t('ask')}</button>
            </form>
        </footer>
    </div>
  );
};

export default InsuranceAiGuide;
