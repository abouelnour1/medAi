
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FunctionDeclaration, Type } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, SerializablePart } from '../types';
import AssistantIcon from './icons/AssistantIcon';
import ClearIcon from './icons/ClearIcon';
import HistoryIcon from './icons/HistoryIcon';
import CameraIcon from './icons/CameraIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';
import ProductRecommendationsView from './ProductRecommendationsView';
import { runAIChat, isAIAvailable, sanitizeParts } from '../geminiService';
import { useAuth } from './auth/AuthContext';

interface AssistantModalProps {
  isOpen: boolean;
  onSaveAndClose: (history: ChatMessage[]) => void;
  contextMedicine: Medicine | null;
  allMedicines: Medicine[];
  favoriteMedicines?: Medicine[];
  initialPrompt: string;
  initialHistory?: ChatMessage[];
  t: TFunction;
  language: Language;
  onShowHistory?: () => void;
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
    allMedicines, 
    initialPrompt, 
    initialHistory, 
    t, 
    language,
    onShowHistory
}) => {
  if (!isOpen) return null;

  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ blob: Blob, preview: string, mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = isAIAvailable();

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    parameters: {
      type: Type.OBJECT,
      description: 'Finds drug information in the Saudi database. MANDATORY to use if the user mentions any medication name.',
      properties: {
        tradeName: { type: Type.STRING, description: 'Brand name to search for.' },
        scientificName: { type: Type.STRING, description: 'Active ingredient to search for.' }
      },
    },
  };

  const searchDatabase = useCallback((args: any) => {
    if (!args) return { count: 0, results: [] };
    let results = [...allMedicines];
    if (args.tradeName) {
        const term = String(args.tradeName).toLowerCase();
        results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(term));
    }
    if (args.scientificName) {
        const term = String(args.scientificName).toLowerCase().trim();
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().includes(term));
    }
    
    return {
        count: results.length,
        results: results.slice(0, 5).map(r => ({
            tradeName: String(r['Trade Name']),
            scientificName: String(r['Scientific Name']),
            price: String(r['Public price']),
            form: String(r.PharmaceuticalForm),
            strength: `${r.Strength} ${r.StrengthUnit}`,
            manufacturer: String(r['Manufacture Name'])
        }))
    };
  }, [allMedicines]);
  
  const handleSendMessage = useCallback(async (overrideInput?: string) => {
    if (!user || isLoading) return;
    const currentInput = (overrideInput ?? userInput).trim();
    if (!currentInput && !uploadedImage) return;

    const userParts: SerializablePart[] = [];
    if (uploadedImage) {
        try {
            const base64Data = await blobToBase64(uploadedImage.blob);
            userParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: base64Data } });
        } catch (e) {
            console.error("Image processing error", e);
        }
    }
    if (currentInput) userParts.push({ text: currentInput });
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: userParts }];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);
    setIsLoading(true);

    let contextInfo = "";
    if (contextMedicine) {
        contextInfo = `\n[CONTEXT_DRUG: ${contextMedicine['Trade Name']}. Active: ${contextMedicine['Scientific Name']}, Price: ${contextMedicine['Public price']} SAR, Form: ${contextMedicine.PharmaceuticalForm}.]`;
    }

    const systemInstruction = `You are PharmaSource AI, a Senior Clinical Pharmacist & Consultant Physician with 20+ years in Saudi Arabia.

## LANGUAGE RULE (HIGHEST PRIORITY):
- Detect the language of the user's message automatically
- If user writes in Arabic → respond in Arabic (use English for medical terms: BID, TID, mg, contraindicated, etc.)
- If user writes in English → respond in English
- If user explicitly requests a language ("رد عربي" / "reply in English") → follow that immediately and keep it
- NEVER mix this up. Match the user's language every single message.

## STRICT RULES:
- **Answer immediately** - NEVER start with: "بالتأكيد"، "Certainly!"، "Sure!"، "Great question!"
- **Bold** critical info always
- ⚠️ serious warnings | ✅ positive | ❌ contraindications | 💊 dosing
- Dosing: amount + frequency + duration + renal/hepatic dose adjustments
- Drug interactions: classify (major🔴/moderate🟡/minor🟢) + mechanism + alternative
- Arabic responses: write in Arabic but keep medical terms in English (e.g. "**Contraindicated** في الحمل", "جرعة **500mg BID**")
- PRESCRIPTION RULE: NEVER generate a prescription automatically. Only generate prescription JSON (between ---PRESCRIPTION_START--- and ---PRESCRIPTION_END---) when the user EXPLICITLY asks: "اعمل وصفة"، "أنشئ وصفة"، "generate prescription"، "create prescription". For all other drug questions, just provide clinical information as text.
- If unsure what the user wants → ask ONE clarifying question before answering

## Knowledge Sources:
1. searchDatabase → drug availability & pricing in Saudi Arabia
2. SFDA guidelines & Saudi MOH protocols  
3. Your clinical expertise for pharmacological data
${contextInfo}`;

    try {
        const response = await runAIChat(newHistory, systemInstruction, [{functionDeclarations: [searchDatabaseTool]}], { searchDatabase });
        const responseParts = response?.candidates?.[0]?.content?.parts;
        if (responseParts) {
            // تطهير الرد القادم من الـ SDK قبل إضافته للـ state لضمان عدم وجود مراجع دائرية
            const cleanParts = sanitizeParts(responseParts);
            setChatHistory(prev => [...prev, { role: 'model', parts: cleanParts }]);
        }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, t, searchDatabase, user, uploadedImage, contextMedicine, language]);
  
  useEffect(() => {
    if (isOpen) {
        if (initialHistory && initialHistory.length > 0) {
            // تطهير التاريخ المسترجع أيضاً كإجراء وقائي إضافي
            const cleanHistory: ChatMessage[] = initialHistory.map(m => ({
                role: m.role,
                parts: sanitizeParts(m.parts)
            }));
            setChatHistory(cleanHistory);
        } else {
            let welcome = contextMedicine ? `Clinical Context: **${contextMedicine['Trade Name']}** active.` : `PharmaSource AI expert ready.`;
            setChatHistory([{ role: 'model', parts: [{ text: welcome }] }]);
            if (initialPrompt) {
                setTimeout(() => handleSendMessage(initialPrompt), 400);
            }
        }
    }
  }, [isOpen]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isLoading]);
  
  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-2 sm:p-6" onClick={() => onSaveAndClose(chatHistory)}>
      <div className="bg-white dark:bg-dark-card w-full max-w-xl h-[80vh] rounded-[1.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/10" onClick={e => e.stopPropagation()}>
        
        <header className="flex items-center justify-between p-3 px-5 border-b border-gray-100 dark:border-dark-border bg-white/95 dark:bg-dark-card/95">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"><div className="w-4 h-4"><AssistantIcon /></div></div>
            <div>
                <h2 className="text-xs font-black text-slate-800 dark:text-white leading-tight">PharmaSource AI</h2>
                <div className="flex items-center gap-1"><span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span><span className="text-[8px] text-slate-400 dark:text-dark-muted font-bold uppercase tracking-widest">Clinical Protocol</span></div>
            </div>
          </div>
          <div className="flex items-center gap-1">
              <button onClick={() => { onSaveAndClose(chatHistory); onShowHistory?.(); }} className="p-1.5 rounded-lg text-slate-400 dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><div className="w-4 h-4"><HistoryIcon/></div></button>
              <button onClick={() => onSaveAndClose(chatHistory)} className="p-1.5 rounded-lg text-slate-400 dark:text-dark-muted hover:text-red-500 transition-colors"><div className="w-4 h-4"><ClearIcon/></div></button>
          </div>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-transparent no-scrollbar">
          {chatHistory.map((msg, index) => {
             const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
             const isProductRecommendation = textContent?.includes('---PRODUCTS_START---');
            return (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'model' && (
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-primary to-teal-600 shadow-sm flex items-center justify-center text-white text-[9px] font-black mb-1">
                      AI
                    </div>
                  )}
                  <div
                    dir="auto"
                    className={`max-w-[88%] rounded-2xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white px-4 py-2.5 font-bold text-[12px] rounded-br-sm text-right'
                        : isPrescription || isProductRecommendation
                          ? 'p-0 bg-transparent shadow-none'
                          : 'bg-white dark:bg-slate-800 px-4 py-3 text-[12px] leading-relaxed text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                    }`}
                  >
                    {isPrescription
                      ? <PrescriptionView content={textContent!} t={t} />
                      : isProductRecommendation
                        ? <ProductRecommendationsView content={textContent!} t={t} />
                        : msg.parts?.map((part, pIndex) => {
                            if ('text' in part && part.text) return (
                              <div key={pIndex} dir="auto" className="ai-response-content prose prose-slate dark:prose-invert max-w-none text-right-if-ar">
                                <MarkdownRenderer content={part.text} />
                              </div>
                            );
                            if ('inlineData' in part && part.inlineData) return (
                              <img key={pIndex} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="max-w-full rounded-lg mt-1 shadow-sm" />
                            );
                            return null;
                          })
                    }
                  </div>
                </div>
            )
          })}
          {isLoading && <div className="pl-8"><div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}
          <div ref={chatEndRef} className="h-2" />
        </div>

        <footer className="p-3 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card">
            <form onSubmit={e => {e.preventDefault(); handleSendMessage();}} className="flex items-center gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) setUploadedImage({ blob: f, preview: URL.createObjectURL(f), mimeType: f.type }); }} className="hidden" />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 dark:text-dark-muted bg-slate-50 dark:bg-slate-800 rounded-lg hover:text-primary transition-all">
                  <div className="w-4 h-4"><CameraIcon /></div>
                </button>

                <div className="flex-grow relative">
                    <textarea 
                        value={userInput} 
                        onChange={(e) => setUserInput(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                        placeholder={aiAvailable ? (language === 'ar' ? 'اسأل باختصار (Pros)...' : 'Query (Clinical)...') : t('aiUnavailableShort')} 
                        className="w-full p-2.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none text-xs min-h-[40px] max-h-24 focus:border-primary transition-all resize-none" 
                        rows={1} 
                    />
                    {uploadedImage && (
                        <div className="absolute bottom-full left-0 mb-2">
                            <div className="relative w-10 h-10 rounded-lg border border-primary overflow-hidden shadow-md">
                                <img src={uploadedImage.preview} className="w-full h-full object-cover" />
                                <button onClick={() => setUploadedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"><ClearIcon /></button>
                            </div>
                        </div>
                    )}
                </div>
                <button type="submit" disabled={isLoading || (!userInput && !uploadedImage) || !aiAvailable} className="p-2.5 bg-primary text-white rounded-lg shadow-md active:scale-95 disabled:opacity-40 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 00-1.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default AssistantModal;
