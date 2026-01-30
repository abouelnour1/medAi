
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FunctionDeclaration, Type } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, Cosmetic, SerializablePart } from '../types';
import AssistantIcon from './icons/AssistantIcon';
import ClearIcon from './icons/ClearIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';
import ProductRecommendationsView from './ProductRecommendationsView';
import { runAIChat, isAIAvailable, sanitizeParts } from '../geminiService';
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
    language,
    onShowAlternatives
}) => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ blob: Blob, preview: string, mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrescriptionMode, setIsPrescriptionMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = isAIAvailable();

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches the entire SFDA-registered medicine database for prices, ingredients, and alternatives. Use this when the user asks for ANY medicine or ingredient details.',
      properties: {
        tradeName: { type: Type.STRING, description: 'Trade name of the product.' },
        scientificName: { type: Type.STRING, description: 'Active ingredient name.' },
        limitResults: { type: Type.NUMBER, description: 'Max number of items to return.' }
      },
    },
  };

  const tools: FunctionDeclaration[] = [searchDatabaseTool];

  const searchDatabase = useCallback((args: any) => {
    let results = [...allMedicines];
    if (args.tradeName) results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    if (args.scientificName) {
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().includes(args.scientificName!.toLowerCase().trim()));
    }
    if (results.length === 0) return { count: 0, status: "NOT_IN_LOCAL_DB", message: "Item not found in current directory snapshot. Suggest general clinical advice." };
    
    return {
        count: results.length,
        results: results.slice(0, args.limitResults || 15).map(r => ({
            tradeName: r['Trade Name'],
            scientificName: r['Scientific Name'],
            priceSAR: r['Public price'],
            form: r.PharmaceuticalForm,
            strength: `${r.Strength} ${r.StrengthUnit}`,
            manufacturer: r['Manufacture Name'],
            status: r['Legal Status']
        }))
    };
  }, [allMedicines]);
  
  const handleSendMessage = useCallback(async (overrideInput?: string) => {
    if (!user) return;
    const currentInput = (overrideInput ?? userInput).trim();
    if ((!currentInput && !uploadedImage) || isLoading) return;

    const userParts: SerializablePart[] = [];
    if (uploadedImage) {
        const base64Data = await blobToBase64(uploadedImage.blob);
        userParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: base64Data } });
    }
    if (currentInput) userParts.push({ text: currentInput });
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: userParts }];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);
    setIsLoading(true);
    
    let contextInfo = `[DATABASE_SNAPSHOT: ${allMedicines.length} Items Loaded]`;
    if (contextMedicine) {
        contextInfo += `\n[FOCUSED_ITEM]: ${contextMedicine['Trade Name']} (${contextMedicine['Scientific Name']}), Price: ${contextMedicine['Public price']} SAR, Status: ${contextMedicine['Legal Status']}`;
    } else {
        contextInfo += `\n[NO_FOCUSED_ITEM]: You are currently in general clinical mode. DO NOT assume the user is talking about any specific medicine unless they provide a name. Use searchDatabase if they ask for details.`;
    }

    const clinicalSystemInstruction = `
أنت "كبير الصيادلة الإكلينيكيين والمستشار الطبي" لمنصة PharmaSource KSA.
جمهورك هم "أطباء وصيادلة" محترفون في المملكة العربية السعودية.

**قواعد التواصل الـصـارمة:**
1. تواصل بلغة علمية احترافية دقيقة.
2. إذا لم يكن هناك دواء محدد في السياق ([FOCUSED_ITEM])، فأنت مساعد عام. لا تفترض دواءً معيناً أبداً.
3. إذا سأل المستخدم عن سعر أو بديل ولم يذكر اسم الدواء، اطلب منه اسم الصنف أو ابحث عنه باستخدام الأداة.
4. عندما تُسأل عن أي دواء، ابحث أولاً في قاعدة البيانات باستخدام أداة 'searchDatabase'.
5. في حال رفع صورة وصفة طبية، حللها طبياً واقترح الأدوية المناسبة من قاعدة البيانات.
${contextInfo}`;

    const prescriptionSystemInstruction = `أنت طبيب استشاري خبير. قم بتوليد كائن JSON للوصفة الطبية بين علامات ---PRESCRIPTION_START--- و ---PRESCRIPTION_END---.`;

    let systemInstruction = language === 'ar' ? clinicalSystemInstruction : `You are a Senior Clinical Pharmacist Consultant. Use medical terminology. ${contextInfo}`;
    if (isPrescriptionMode) systemInstruction = prescriptionSystemInstruction;

    try {
        const toolImplementations = { searchDatabase: searchDatabase };
        const finalResponse = await runAIChat(newHistory, systemInstruction, [{functionDeclarations: tools}], toolImplementations, 'gemini-3-flash-preview');
        const responseParts = finalResponse?.candidates?.[0]?.content?.parts;
        
        if (responseParts) {
            setChatHistory(prev => [...prev, { role: 'model', parts: sanitizeParts(responseParts) }]);
        } else {
            setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
        }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, isPrescriptionMode, language, t, searchDatabase, user, uploadedImage, contextMedicine, allMedicines]);
  
  useEffect(() => {
    if (isOpen) {
        if (initialPrompt === '##PRESCRIPTION_MODE##') {
            setIsPrescriptionMode(true);
            setChatHistory([{ role: 'model', parts: [{ text: language === 'ar' ? 'وضع الوصفات الطبية نشط. كيف يمكنني مساعدتك بروفيسور؟' : 'Rx Mode active. How can I assist you, Doctor?' }] }]);
        } else if (initialHistory && initialHistory.length > 0) {
            setIsPrescriptionMode(false);
            setChatHistory(initialHistory);
        } else {
            setIsPrescriptionMode(false);
            let welcomeMsg = language === 'ar' ? 'أهلاً بك زميلي الطبيب/الصيدلي. كيف يمكنني مساعدتك إكلينيكياً اليوم؟' : 'Welcome, Colleague. Clinical Assistant ready for consultation.';
            if (contextMedicine) {
                welcomeMsg = language === 'ar' ? `ما هي استشارتك بخصوص دواء **${contextMedicine['Trade Name']}**؟` : `Clinical query regarding **${contextMedicine['Trade Name']}**?`;
            }
            setChatHistory([{ role: 'model', parts: [{ text: welcomeMsg }] }]);
            if (initialPrompt) setTimeout(() => { handleSendMessage(initialPrompt); }, 400);
        }
        setUploadedImage(null);
    }
  }, [isOpen, initialPrompt, initialHistory, language, contextMedicine]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isLoading]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) setUploadedImage({ blob: file, preview: URL.createObjectURL(file), mimeType: file.type });
    event.target.value = '';
  };

  const handleClose = () => {
      setIsPrescriptionMode(false);
      onSaveAndClose(chatHistory);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[85vh] sm:h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative m-4" onClick={e => e.stopPropagation()}>
        
        <header className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <AssistantIcon />
            </div>
            <div>
                <h2 className="text-lg font-bold">{isPrescriptionMode ? t('prescription') : 'Clinical Assistant'}</h2>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Scientific Expert</span>
                </div>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ClearIcon/>
          </button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
          {chatHistory.map((msg, index) => {
             const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
             const isProductRecommendation = textContent?.includes('---PRODUCTS_START---');

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <AssistantIcon />
                    </div>
                  )}
                  <div className={`max-w-[90%] sm:max-w-md rounded-2xl shadow-sm flex flex-col gap-2 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none p-3' : `bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-bl-none ${isPrescription || isProductRecommendation ? 'p-0 bg-transparent shadow-none w-full' : 'p-3 border border-slate-100 dark:border-slate-800'}`}`}>
                     { isPrescription ? (
                        <PrescriptionView content={textContent!} t={t} />
                     ) : isProductRecommendation ? (
                        <ProductRecommendationsView content={textContent!} t={t} />
                     ) : msg.parts?.map((part, pIndex) => {
                        if ('text' in part && part.text) return <div key={pIndex} className="text-sm ai-response-content"><MarkdownRenderer content={part.text} /></div>;
                        if ('inlineData' in part && part.inlineData) return <img key={pIndex} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="User upload" className="max-w-xs rounded-lg shadow-md border-2 border-white" />;
                        return null;
                     })}
                  </div>
                </div>
            )
          })}
          {isLoading && (
              <div className="flex justify-start animate-fade-in">
                 <div className="bg-white dark:bg-dark-card p-3 rounded-2xl rounded-bl-none flex items-center gap-1 shadow-sm border border-slate-100">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-dark-card">
            {uploadedImage && (
                <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <img src={uploadedImage.preview} className="h-12 w-12 object-cover rounded-lg shadow-sm" />
                        <span className="text-xs font-bold text-slate-500">{t('imagePreview')}</span>
                    </div>
                    <button onClick={() => setUploadedImage(null)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full">
                        <ClearIcon/>
                    </button>
                </div>
            )}
            <form onSubmit={e => {e.preventDefault(); handleSendMessage();}} className="flex items-end gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-primary transition-colors bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <textarea 
                    value={userInput} 
                    onChange={(e) => setUserInput(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                    placeholder={aiAvailable ? (language === 'ar' ? 'استشارة طبية بخصوص أي دواء...' : 'Medical consultation or drug query...') : t('aiUnavailableShort')} 
                    className="flex-grow p-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 resize-none text-sm min-h-[48px] max-h-32" 
                    rows={1} 
                    disabled={isLoading || !aiAvailable} 
                />
                <button 
                    type="submit" 
                    disabled={isLoading || (!userInput && !uploadedImage) || !aiAvailable} 
                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default AssistantModal;
