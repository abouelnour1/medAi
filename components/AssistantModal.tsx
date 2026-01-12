
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FunctionDeclaration, Type, Part } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, Cosmetic } from '../types';
import { TranslationKeys } from '../translations';
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

  const handleSendMessageRef = useRef<((overrideInput?: string, isHidden?: boolean) => Promise<void>) | null>(null);

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches the database for medicines. Use this to find prices, alternatives, and details.',
      properties: {
        tradeName: { type: Type.STRING, description: 'The trade name.' },
        scientificName: { type: Type.STRING, description: 'The scientific name.' },
        productType: { type: Type.STRING, description: "Type: 'medicine' or 'supplement'." },
      },
    },
  };

  const tools: FunctionDeclaration[] = [searchDatabaseTool];

  const searchDatabase = useCallback((args: any) => {
    let results = [...allMedicines];
    if (args.tradeName) results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    if (args.scientificName) {
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().trim() === args.scientificName!.toLowerCase().trim());
    }
    if (results.length === 0) return { count: 0, status: "NO_MATCH_FOUND", message: "No exact match in local DB." };
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
    else if (uploadedImage) userParts.push({ text: t('analyzingImage') });
    
    const newHistoryItem: any = { role: 'user', parts: userParts };
    if (isHidden) newHistoryItem.hidden = true;

    const newHistory: ChatMessage[] = [...chatHistory, newHistoryItem];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);
    setIsLoading(true);
    
    const generalSystemInstructionAr = `أنت صيدلي إكلينيكي خبير ومساعد ذكي في PharmaSource.
    
    **شخصيتك:** متعاون جداً، ذكي، حديثك طبيعي (Conversational) ولست آلياً.
    
    **المهام الأساسية (مهم جداً الالتزام بالفرز):**

    1.  **طريقة الاستخدام (Usage & Dosage):**
        - عند السؤال عن الاستخدام، أجب بنص صيدلاني مفصل (Markdown). اشرح متى يؤخذ الدواء، الجرعة المعتادة، ومدة العلاج. **لا تستخدم صيغة JSON الخاصة بالمنتجات هنا**.

    2.  **ميزة المنتج (USP):**
        - عند السؤال عن ميزات المنتج، اشرح لماذا هذا المنتج مميز طبياً وتسويقياً بنص مفصل. **لا تستخدم صيغة JSON هنا**.

    3.  **البيع المتقاطع (Smart Cross-Selling):**
        - **فقط** عندما يطلب المستخدم "بيع متقاطع" أو "مقترحات إضافية"، اقترح 3 منتجات مكملة.
        - في هذه الحالة **فقط**، يجب عليك استخدام تنسيق JSON التالي لتعرض المنتجات بشكل جميل:
         \`\`\`json
         ---PRODUCTS_START---
         [
           {
             "tradeName": "Name",
             "scientificName": "Scientific",
             "price": "12.50", 
             "manufacturer": "Company",
             "reason": "سبب مقنع...",
             "form": "Tablet"
           }
         ]
         ---PRODUCTS_END---
         \`\`\`

    4.  **تحليل الصور والوصفات:** أنت خبير في فك رموز الخط اليدوي، ركز على التركيز (Strength) والشكل الصيدلاني.

    **سياق المنتج الحالي:**
    ${contextMedicine ? JSON.stringify(contextMedicine) : (contextCosmetic ? JSON.stringify(contextCosmetic) : 'لا يوجد منتج محدد.')}`;

    const generalSystemInstructionEn = `You are an Expert Clinical Pharmacist.
    
    **Primary Tasks:**
    1. **Usage/Dosage:** Provide detailed medical text. DO NOT use JSON here.
    2. **USP:** Provide persuasive medical text about why the product is special. DO NOT use JSON here.
    3. **Cross-Selling:** ONLY when explicitly asked for cross-selling or suggestions, provide 3 items using the following JSON format:
         \`\`\`json
         ---PRODUCTS_START---
         [ ... ]
         ---PRODUCTS_END---
         \`\`\`
    
    **Context:**
    ${contextMedicine ? JSON.stringify(contextMedicine) : (contextCosmetic ? JSON.stringify(contextCosmetic) : 'No context.')}`;

    let systemInstruction = language === 'ar' ? generalSystemInstructionAr : generalSystemInstructionEn;
    if (isPrescriptionMode) systemInstruction = language === 'ar' ? "أنت طبيب سعودي تكتب وصفات JSON..." : "You are a Saudi doctor writing JSON prescriptions...";

    try {
        const toolImplementations = { searchDatabase: searchDatabase };
        const finalResponse = await runAIChat(newHistory, systemInstruction, [{functionDeclarations: tools}], toolImplementations);
        const responseParts = finalResponse?.candidates?.[0]?.content?.parts;
        if (responseParts) setChatHistory(prev => [...prev, { role: 'model', parts: responseParts }]);
        else setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, contextMedicine, contextCosmetic, isPrescriptionMode, language, t, searchDatabase, favoriteMedicines, user]);
  
  useEffect(() => { handleSendMessageRef.current = handleSendMessage; }, [handleSendMessage]);

  useEffect(() => {
    if (isOpen) {
        if (!user) return;
        if (initialPrompt === '##PRESCRIPTION_MODE##') {
            setIsPrescriptionMode(true);
            setChatHistory([{ role: 'model', parts: [{ text: t('prescriptionAssistantWelcome') }] }]);
        } else if (initialHistory && initialHistory.length > 0) {
            setIsPrescriptionMode(false);
            setChatHistory(initialHistory);
        } else {
            setIsPrescriptionMode(false);
            setChatHistory([{ role: 'model', parts: [{ text: t('assistantWelcomeMessage') }] }]);
            if (initialPrompt) setTimeout(() => { if (handleSendMessageRef.current) handleSendMessageRef.current(initialPrompt); }, 100);
        }
        setUploadedImage(null);
    }
  }, [isOpen, user, initialPrompt, initialHistory, t]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isLoading]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) setUploadedImage({ blob: file, preview: URL.createObjectURL(file), mimeType: file.type });
    event.target.value = '';
  };

  const handleClose = () => onSaveAndClose(chatHistory);
  
  const handleQuickAction = (action: 'price' | 'ingredient' | 'alternatives' | 'cross_sell' | 'usp' | 'usage') => {
      const item = contextMedicine || contextCosmetic;
      if (!item) return;
      
      let name = '';
      if ('Trade Name' in item) name = item['Trade Name'];
      else if ('BrandName' in item) name = `${item.BrandName} ${item.SpecificName}`;

      if (action === 'price') {
          let price = 'N/A';
          if ('Public price' in item) price = item['Public price'];
          const userText = language === 'ar' ? `كم سعر ${name}؟` : `What is the price of ${name}?`;
          const modelText = language === 'ar' ? `سعر **${name}** هو: **${price} ${t('sar')}**` : `The price of **${name}** is: **${price} ${t('sar')}**`;
          setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userText }] }, { role: 'model', parts: [{ text: modelText }] }]);
          return;
      }

      if (action === 'ingredient') {
          let ing = '';
          if ('Scientific Name' in item) ing = item['Scientific Name'];
          else if ('Active ingredient' in item) ing = item['Active ingredient'];
          const userText = language === 'ar' ? `ما هي المادة الفعالة لـ ${name}؟` : `What is the active ingredient of ${name}?`;
          const modelText = language === 'ar' ? `المادة الفعالة هي: **${ing}**` : `The active ingredient is: **${ing}**`;
          setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userText }] }, { role: 'model', parts: [{ text: modelText }] }]);
          return;
      }

      if (action === 'alternatives' && contextMedicine) {
          const userText = language === 'ar' ? `ابحث عن بدائل لـ ${name}` : `Find alternatives for ${name}`;
          const cleanSciName = contextMedicine['Scientific Name'].toLowerCase().trim();
          const alts = allMedicines.filter(m => m.RegisterNumber !== contextMedicine.RegisterNumber && m['Scientific Name'].toLowerCase().trim() === cleanSciName).slice(0, 15);
          let modelText = '';
          if (alts.length > 0) {
              const productsPayload = alts.map(m => ({
                  tradeName: m['Trade Name'],
                  scientificName: m['Scientific Name'],
                  price: m['Public price'],
                  form: m['PharmaceuticalForm'],
                  manufacturer: m['Manufacture Name'],
                  reason: language === 'ar' ? 'بديل مباشر (نفس المادة الفعالة)' : 'Direct Alternative'
              }));
              modelText = `---PRODUCTS_START---${JSON.stringify(productsPayload)}---PRODUCTS_END---`;
          } else modelText = language === 'ar' ? 'عفواً، لم أجد بدائل مباشرة.' : 'No direct alternatives found.';
          setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userText }] }, { role: 'model', parts: [{ text: modelText }] }]);
          return;
      }

      let prompt = '';
      if (action === 'cross_sell') {
          prompt = language === 'ar'
            ? `بناءً على دواء ${name}، ما هي أفضل المنتجات التي يمكن بيعها معه (Cross-selling)؟ اقترح 3 أصناف واستخدم تنسيق JSON الخاص بالمنتجات.`
            : `For ${name}, suggest 3 cross-selling items using the JSON PRODUCTS format.`;
      } else if (action === 'usp') {
          prompt = language === 'ar'
            ? `ما هي ميزة البيع الفريدة (USP) لـ ${name}؟ لماذا هو مميز؟ أجب بنص طبي مفصل وليس بصيغة JSON.`
            : `What is the USP of ${name}? Answer in detailed markdown text, NOT JSON.`;
      } else if (action === 'usage') {
          prompt = language === 'ar'
            ? `اشرح طريقة استخدام ${name} بالتفصيل (جرعات، توقيت، نصائح). أجب بنص طبي مفصل وليس بصيغة JSON.`
            : `Explain the usage of ${name} in detail. Answer in detailed markdown text, NOT JSON.`;
      }
      
      if (prompt) handleSendMessage(prompt, true);
  };

  if (!isOpen) return null;
  if (!user) return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
        <div className="bg-white dark:bg-dark-card w-full max-w-md p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary"><AssistantIcon /></div>
            <h2 className="text-xl font-bold">{t('loginRequired')}</h2>
            <div className="flex gap-3 w-full"><button onClick={handleClose} className="flex-1 px-4 py-2 bg-slate-100 rounded-lg">{t('cancel')}</button><button onClick={() => { handleClose(); window.location.hash = '#settings'; }} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">{t('login')}</button></div>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-primary"><AssistantIcon /></span>
            <div><h2 className="text-lg font-bold">{t('assistantModalTitle')}</h2>{ (contextMedicine || contextCosmetic) && <p className="text-xs text-primary font-medium truncate max-w-[200px]">{contextMedicine ? contextMedicine['Trade Name'] : contextCosmetic?.SpecificName}</p>}</div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full text-light-text-secondary hover:bg-gray-200"><ClearIcon/></button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {chatHistory.map((msg, index) => {
             if ((msg as any).hidden) return null;
             const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
             const isProductRecommendation = textContent?.includes('---PRODUCTS_START---');

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><AssistantIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm flex flex-col gap-2 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none p-3' : `bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none ${isPrescription || isProductRecommendation ? 'p-0 bg-transparent shadow-none' : 'p-3'}`}`}>
                     { isPrescription ? <PrescriptionView content={textContent!} t={t} /> : isProductRecommendation ? <ProductRecommendationsView content={textContent!} t={t} /> : msg.parts?.map((part, pIndex) => {
                        if ('text' in part && part.text) return <div key={pIndex} className="text-sm ai-response-content"><MarkdownRenderer content={part.text} /></div>;
                        if ('inlineData' in part && part.inlineData) return <img key={pIndex} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="User upload" className="max-w-xs rounded-lg" />;
                        return null;
                     })}
                  </div>
                </div>
            )
          })}
          {isLoading && <div className="flex items-start gap-3"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><AssistantIcon /></div><div className="max-w-md rounded-2xl p-3 bg-gray-100 dark:bg-slate-700">Loading...</div></div>}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 space-y-3">
            {(contextMedicine || contextCosmetic) && !isPrescriptionMode && aiAvailable && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Chip label={t('quickActionPrice')} onClick={() => handleQuickAction('price')} />
                    <Chip label={t('quickActionIngredient')} onClick={() => handleQuickAction('ingredient')} />
                    {contextMedicine && <Chip label={t('quickActionAlternatives')} onClick={() => handleQuickAction('alternatives')} />}
                    <Chip label={t('quickActionCrossSelling')} onClick={() => handleQuickAction('cross_sell')} />
                    <Chip label={t('quickActionSellingPoint')} onClick={() => handleQuickAction('usp')} />
                    <Chip label={t('quickActionUsage')} onClick={() => handleQuickAction('usage')} />
                </div>
            )}
            {uploadedImage && <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-start justify-between"><div><p className="text-xs font-bold mb-1">{t('imagePreview')}</p><img src={uploadedImage.preview} className="h-16 w-16 object-cover rounded"/></div><button onClick={() => setUploadedImage(null)} className="p-1 text-light-text-secondary"><ClearIcon/></button></div>}
            <form onSubmit={e => {e.preventDefault(); handleSendMessage();}} className="flex items-center gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-light-text-secondary"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={aiAvailable ? t('askGeminiPlaceholder') : t('aiUnavailableShort')} className="flex-grow p-2 bg-gray-100 dark:bg-slate-700 rounded-lg outline-none transition-colors resize-none" rows={1} disabled={isLoading || !aiAvailable} />
                <button type="submit" disabled={isLoading || (!userInput && !uploadedImage) || !aiAvailable} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg">{t('ask')}</button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default AssistantModal;
