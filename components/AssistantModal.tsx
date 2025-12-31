
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FunctionDeclaration, Type, Part } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, Cosmetic } from '../types';
import AssistantIcon from './icons/AssistantIcon';
import ClearIcon from './icons/ClearIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';
import ProductRecommendationsView from './ProductRecommendationsView';
import { runAIChat, isAIAvailable } from '../geminiService';
import { useAuth } from './auth/AuthContext';

interface AssistantModalProps {
  isOpen: boolean;
  onSaveAndClose: (history: ChatMessage[]) => void;
  contextMedicine: Medicine | null;
  contextCosmetic?: Cosmetic | null;
  allMedicines: Medicine[];
  favoriteMedicines?: Medicine[];
  initialPrompt: string;
  initialHistory?: ChatMessage[];
  t: TFunction;
  language: Language;
  onShowAlternatives?: (medicine: Medicine) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const Chip: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button
        onClick={onClick}
        className="flex-shrink-0 bg-slate-100 dark:bg-slate-700 hover:bg-primary/10 dark:hover:bg-primary/20 text-light-text dark:text-dark-text border border-slate-200 dark:border-slate-600 rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap active:scale-95"
    >
        {label}
    </button>
);

const AssistantModal: React.FC<AssistantModalProps> = ({ 
    isOpen, 
    onSaveAndClose, 
    contextMedicine, 
    contextCosmetic, 
    allMedicines, 
    favoriteMedicines, 
    initialPrompt, 
    initialHistory, 
    t, 
    language
}) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ blob: Blob, preview: string, mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrescriptionMode, setIsPrescriptionMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = isAIAvailable();

  const handleSendMessageRef = useRef<((overrideInput?: string, isHidden?: boolean) => Promise<void>) | null>(null);

  const searchDatabase = useCallback((args: any) => {
    let results = [...allMedicines];
    if (args.tradeName) results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    if (args.scientificName) {
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().trim() === args.scientificName!.toLowerCase().trim());
    }
    
    if (results.length === 0) return { count: 0, status: "NO_MATCH_FOUND" };
    
    return {
        count: results.length,
        results: results.slice(0, 20).map(r => ({
            tradeName: r['Trade Name'],
            scientificName: r['Scientific Name'],
            price: r['Public price'],
            form: r.PharmaceuticalForm,
            strength: r.Strength + ' ' + r.StrengthUnit,
            manufacturer: r['Manufacture Name'],
        }))
    };
  }, [allMedicines]);
  
  const handleSendMessage = useCallback(async (overrideInput?: string, isHidden: boolean = false) => {
    if (!user) return;
    const currentInput = (overrideInput ?? userInput).trim();
    if ((!currentInput && !uploadedImage) || isLoading) return;

    const userParts: Part[] = [];
    if (uploadedImage) {
        const base64Data = await blobToBase64(uploadedImage.blob);
        userParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: base64Data } });
    }
    if (currentInput) userParts.push({ text: currentInput });
    
    const newHistoryItem: any = { role: 'user', parts: userParts };
    if (isHidden) newHistoryItem.hidden = true;

    const newHistory: ChatMessage[] = [...chatHistory, newHistoryItem];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);
    setIsLoading(true);

    const systemInstruction = language === 'ar' 
        ? `أنت صيدلي خبير في PharmaSource. ساعد المستخدم في معلومات الأدوية والأسعار والبدائل.` 
        : `You are an expert pharmacist. Help users with drug info, prices and alternatives.`;

    try {
        const toolImplementations = { searchDatabase };
        const finalResponse = await runAIChat(newHistory, systemInstruction, [], toolImplementations);
        const responseParts = finalResponse?.candidates?.[0]?.content?.parts;
        if (responseParts) {
             setChatHistory(prev => [...prev, { role: 'model', parts: responseParts }]);
        }
    } catch (err) {
      console.error("AI service error:", err);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, language, t, searchDatabase, user]);
  
  useEffect(() => { handleSendMessageRef.current = handleSendMessage; }, [handleSendMessage]);

  useEffect(() => {
    if (isOpen && user) {
        if (initialPrompt === '##PRESCRIPTION_MODE##') {
            setIsPrescriptionMode(true);
            setChatHistory([{ role: 'model', parts: [{ text: t('prescriptionAssistantWelcome') }] }]);
        } else if (initialHistory && initialHistory.length > 0) {
            setChatHistory(initialHistory);
        } else if (!initialPrompt) {
            setChatHistory([{ role: 'model', parts: [{ text: t('assistantWelcomeMessage') }] }]);
        }
        
        if (initialPrompt && initialPrompt !== '##PRESCRIPTION_MODE##') {
             setTimeout(() => { if (handleSendMessageRef.current) handleSendMessageRef.current(initialPrompt); }, 100);
        }
    }
  }, [isOpen, user, initialPrompt, initialHistory, t]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  if (!isOpen) return null;

  // منع الفليكر (Flicker) لشاشة تسجيل الدخول أثناء تأكد Firebase من حالة المستخدم
  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  // الآن نظهر شاشة تسجيل الدخول فقط إذا انتهى التحميل ولم نجد مستخدماً
  if (!user) {
      return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fade-in" onClick={() => onSaveAndClose([])}>
            <div className="bg-white dark:bg-dark-card w-full max-w-md p-8 rounded-2xl shadow-2xl text-center space-y-6 m-4" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-2">
                    <AssistantIcon />
                </div>
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{t('loginRequired')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('loginRequiredForAI')}</p>
                <div className="flex gap-3">
                    <button onClick={() => onSaveAndClose([])} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold transition-all hover:bg-slate-200">{t('cancel')}</button>
                    <button onClick={() => { onSaveAndClose([]); window.location.hash = '#settings'; }} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">{t('login')}</button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center animate-fade-in" onClick={() => onSaveAndClose(chatHistory)}>
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden m-2" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-primary"><AssistantIcon /></span>
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{t('assistantModalTitle')}</h2>
          </div>
          <button onClick={() => onSaveAndClose(chatHistory)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><ClearIcon/></button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {!aiAvailable && <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-800 dark:text-yellow-200">{t('aiUnavailableMessage')}</div>}
          {aiAvailable && chatHistory.map((msg, index) => {
             if ((msg as any).hidden) return null;
             const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
             const isProductRecommendation = textContent?.includes('---PRODUCTS_START---');

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><AssistantIcon /></div>}
                  <div className={`max-w-md rounded-2xl p-3 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none'}`}>
                     { isPrescription ? <PrescriptionView content={textContent!} t={t} /> 
                       : isProductRecommendation ? <ProductRecommendationsView content={textContent!} t={t} /> 
                       : <div className="text-sm ai-response-content"><MarkdownRenderer content={textContent || ''} /></div> }
                  </div>
                </div>
            )
          })}
          {isLoading && <div className="text-xs text-slate-400 animate-pulse px-12">جاري التفكير...</div>}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-200 dark:border-slate-700">
            <form onSubmit={e => {e.preventDefault(); handleSendMessage();}} className="flex items-center gap-2">
                <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={t('askGeminiPlaceholder')} className="flex-grow p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 resize-none border border-slate-200 dark:border-slate-600" rows={1} disabled={isLoading || !aiAvailable} />
                <button type="submit" disabled={isLoading || !userInput || !aiAvailable} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95">{t('ask')}</button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default AssistantModal;
