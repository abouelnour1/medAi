import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FunctionDeclaration, Type, Tool } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, PrescriptionData, InsuranceDrug, SerializablePart } from '../types';
import StethoscopeIcon from './icons/StethoscopeIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';
import { runAIChat, isAIAvailable, sanitizeParts } from '../geminiService';

interface ClinicalAssistantViewProps {
  t: TFunction;
  language: Language;
  allMedicines: Medicine[];
  insuranceData: InsuranceDrug[];
  clinicalGuidelines: any;
  onSavePrescription: (prescription: PrescriptionData) => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const parsePrescriptionJson = (content: string): Omit<PrescriptionData, 'id'> | null => {
    const match = content.match(/---PRESCRIPTION_START---\s*```json\s*([\s\S]*?)\s*```\s*---PRESCRIPTION_END---/);
    if (!match || !match[1]) return null;
    try {
        return JSON.parse(match[1]);
    } catch (e) {
        console.error("Failed to parse prescription JSON from AI response", e);
        return null;
    }
};

const ClinicalAssistantView: React.FC<ClinicalAssistantViewProps> = ({
  t,
  language,
  allMedicines,
  insuranceData,
  clinicalGuidelines,
  onSavePrescription,
  chatHistory,
  setChatHistory
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiAvailable = isAIAvailable();

  useEffect(() => {
    if (chatHistory.length === 0) {
        setChatHistory([
          { role: 'model', parts: [{ text: t('clinicalAssistantWelcome') }] },
        ]);
    }
  }, [t, chatHistory, setChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches the database for medicines. Can filter by trade name, scientific name, etc.',
      properties: {
        tradeName: { type: Type.STRING, description: 'The trade name of the drug.' },
        scientificName: { type: Type.STRING, description: 'The scientific (active ingredient) name of the drug.' }
      }
    }
  };
  
  const searchDatabase = useCallback((args: {
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
        return { 
            count: 0, 
            status: "NO_MATCH",
            message: "No drugs found locally. You MUST proceed using your general medical knowledge to recommend appropriate medication and fill the prescription details. Do NOT fail."
        };
    }

    return {
        count: results.length,
        results: results.slice(0, 10).map(r => ({
            tradeName: r['Trade Name'],
            scientificName: r['Scientific Name'],
            price: r['Public price'],
            form: r.PharmaceuticalForm,
        }))
    };
  }, [allMedicines]);
  
  const handleSendMessage = useCallback(async () => {
    const currentInput = userInput.trim();
    if (!currentInput || isLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: [{ text: currentInput }] }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
        const guidelinesString = JSON.stringify(clinicalGuidelines, null, 2);
        
        const systemInstruction = language === 'ar'
        ? `أنت طبيب خبير ومستشار سريري عالمي، مقيم في المملكة العربية السعودية. جمهورك يتكون من متخصصي الرعاية الصحية. وظيفتك الأساسية هي تقديم توصيات سريرية وكتابة الوصفات الطبية.`
        : `You are a world-class expert physician based in Saudi Arabia. Your function is to provide clinical recommendations and write prescriptions.`;

        const tools: Tool[] = [{ functionDeclarations: [searchDatabaseTool] }];
        const toolImplementations = { searchDatabase };

        const finalResponse = await runAIChat(newHistory, systemInstruction, tools, toolImplementations, 'gemini-3-pro-preview');
      
        const responsePartsFromApi = finalResponse?.candidates?.[0]?.content?.parts;

        if (responsePartsFromApi && responsePartsFromApi.length > 0) {
            const sanitizedResponseParts = sanitizeParts(responsePartsFromApi);
            setChatHistory(prev => [...prev, { role: 'model', parts: sanitizedResponseParts }]);

            const prescriptionText = sanitizedResponseParts.find(p => 'text' in p && p.text?.includes('---PRESCRIPTION_START---'))?.text;
            if (prescriptionText) {
                const parsedJson = parsePrescriptionJson(prescriptionText);
                if (parsedJson) {
                    const fullPrescriptionData: PrescriptionData = { ...parsedJson, id: `p-${Date.now()}`};
                    onSavePrescription(fullPrescriptionData);
                }
            }
        } else {
            setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
        }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: t('geminiError') }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, language, t, onSavePrescription, setChatHistory, allMedicines, searchDatabase, clinicalGuidelines]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg flex flex-col h-full">
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {!aiAvailable && (
            <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{t('aiUnavailableTitle')}</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{t('aiUnavailableMessage')}</p>
            </div>
          )}
          {aiAvailable && chatHistory.map((msg, index) => {
             const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><StethoscopeIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none p-3' : `bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-bl-none ${isPrescription ? 'p-0 bg-transparent dark:bg-transparent shadow-none' : 'p-3'}`}`}>
                     { isPrescription ? (
                        <PrescriptionView content={textContent!} t={t} />
                     ) : (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none ai-response-content">
                          <MarkdownRenderer content={textContent || ''} />
                        </div>
                     )}
                  </div>
                </div>
            )
          })}
          
          {isLoading && (
              <div className="flex justify-start animate-fade-in">
                 <div className="bg-white dark:bg-dark-card p-3 rounded-2xl rounded-bl-none flex items-center gap-1 shadow-sm">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 bg-light-bg dark:bg-dark-bg">
             <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={aiAvailable ? t('clinicalAssistantWelcome') : t('aiUnavailableShort')}
                    className="flex-grow w-full p-2 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-slate-700 focus:border-primary rounded-lg outline-none transition-colors resize-none"
                    rows={2}
                    disabled={isLoading || !aiAvailable}
                    aria-label={t('clinicalAssistantWelcome')}
                />
                <button type="submit" disabled={isLoading || !userInput || !aiAvailable} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors">{t('ask')}</button>
            </form>
        </footer>
    </div>
  );
};

export default ClinicalAssistantView;
