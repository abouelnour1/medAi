
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
      // remove the prefix "data:image/jpeg;base64,"
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper for Quick Action Chips
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
        // ... other props
        productType: { type: Type.STRING, description: "Type: 'medicine' or 'supplement'." },
      },
    },
  };

  const tools: FunctionDeclaration[] = [searchDatabaseTool];

  const searchDatabase = useCallback((args: any) => {
    let results = [...allMedicines];
    // ... filtering logic (same as before)
    if (args.tradeName) results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    
    // Explicitly handle scientific name search for alternatives
    if (args.scientificName) {
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().trim() === args.scientificName!.toLowerCase().trim());
    }
    
    if (results.length === 0) {
        // Return a clear signal that manual filling is needed
        return { 
            count: 0, 
            status: "NO_MATCH_FOUND",
            message: "No exact match in local DB."
        };
    }
    
    // Return up to 20 results for alternatives to give a good list
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
    if (!user) return; // Guard against non-logged in users
    const currentInput = (overrideInput ?? userInput).trim();
    if ((!currentInput && !uploadedImage) || isLoading) return;

    const userParts: Part[] = [];
    if (uploadedImage) {
        const base64Data = await blobToBase64(uploadedImage.blob);
        userParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: base64Data } });
    }
    if (currentInput) userParts.push({ text: currentInput });
    else if (uploadedImage) userParts.push({ text: t('analyzingImage') });
    
    // Add custom property for hidden messages
    const newHistoryItem: any = { role: 'user', parts: userParts };
    if (isHidden) {
        newHistoryItem.hidden = true;
    }

    const newHistory: ChatMessage[] = [...chatHistory, newHistoryItem];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);

    setIsLoading(true);
    
    // Inject Favorites Context
    const favoriteListString = favoriteMedicines && favoriteMedicines.length > 0 
        ? favoriteMedicines.map(m => `- ${m['Trade Name']} (${m['Scientific Name']})`).join('\n')
        : "No favorites saved.";

    // Strengthened prompt for prescription generation and Expert Mode
    const prescriptionSystemInstructionAr = `أنت طبيب ذكاء اصطناعي في المملكة العربية السعودية. مهمتك الوحيدة هي إنشاء وصفة طبية بصيغة JSON.
- عندما يطلب المستخدم وصفة، قم بإنشائها **فوراً**.
- **مهم جداً:** إذا بحثت في قاعدة البيانات ولم تجد الدواء، **يجب عليك استخدام معرفتك الطبية العامة لملء بيانات الدواء (الاسم، الجرعة، طريقة الاستخدام)**. لا تترك الحقول فارغة أبداً.

**قواعد اللغة (صارمة):**
الحقول التالية يجب أن تكون **باللغة الإنجليزية حصراً**:
1. اسم الدواء التجاري (Trade Name).
2. الاسم العلمي (Generic Name).
3. **وصف التشخيص (Diagnosis Description)**.

**تعليمات تعبئة البيانات المفقودة (إجباري):**
إذا لم يزودك المستخدم بأي من البيانات التالية، **يجب عليك اختراعها وتأليفها ببيانات واقعية** لملء الوصفة بشكل كامل. لا تترك أي حقل فارغ:
1. **اسم المريض** (patientName): اختر اسماً عربياً ثلاثياً عشوائياً إذا لم يذكر.
2. **الرقم الوطني** (patientId): رقم هوية سعودي عشوائي (مثال: 10452xxxxx).
3. **رقم الملف** (fileNumber): رقم ملف عشوائي.
4. **التاريخ** (date): استخدم تاريخ اليوم (YYYY-MM-DD).
5. **اسم الطبيب** (doctorName): اختر اسماً لطبيب (مثال: Dr. Abdullah...).
6. **اسم الطبيب بالعربي** (doctorNameAr): اختر الاسم العربي المقابل (مثال: د. عبدالله...).
7. **تخصص الطبيب** (doctorSpecialty): اختر تخصصاً يناسب الدواء الموصوف (مثال: Consultant Internal Medicine).
8. **شركة التأمين** (insuranceCompany): اجعلها دائماً "Cash" (نقدي) إلا إذا حدد المستخدم اسم شركة تأمين بشكل صريح.
9. **التشخيص والكود** (diagnosisCode, diagnosisDescription): ضع تشخيصاً طبياً دقيقاً بالإنجليزية (English ONLY) وكود ICD-10.
10. **اسم المستشفى** (hospitalName): اختر اسماً لمستشفى (مثال: مستشفى المملكة، دلة، إلخ).

لا تعتذر. لا تقل "لا أستطيع". لا تترك الحقول فارغة. فقط اكتب الوصفة JSON كاملة.

صيغة الرد المطلوبة بدقة:
---PRESCRIPTION_START---
{
  "hospitalName": "...",
  "patientName": "...",
  "patientId": "...",
  "fileNumber": "...",
  "date": "...",
  "doctorName": "...",
  "doctorNameAr": "...",
  "doctorSpecialty": "...",
  "insuranceCompany": "...",
  "diagnosisCode": "...",
  "diagnosisDescription": "Diagnosis in English ONLY",
  "drugs": [
     { "tradeName": "Drug Name (English)", "genericName": "Generic Name (English)", "dosage": "...", "usageMethod": "...", "quantity": "1" }
  ]
}
---PRESCRIPTION_END---`;

    const prescriptionSystemInstructionEn = `You are an AI doctor in Saudi Arabia. Your ONLY task is to generate a medical prescription in JSON format.
- Generate it **IMMEDIATELY**.
- **CRITICAL:** If the drug is not in the local database, **YOU MUST USE YOUR GENERAL KNOWLEDGE to fill in the drug details**. DO NOT leave fields blank.

**LANGUAGE RULES (STRICT):**
The following fields MUST be in **ENGLISH ONLY**:
1. Drug Trade Name.
2. Scientific/Generic Name.
3. **Diagnosis Description**.

**MISSING DATA RULES (MANDATORY):**
If the user does not provide the following details, **YOU MUST INVENT REALISTIC DATA** to complete the prescription. Do not leave blanks:
1. **Patient Name** (patientName): Random full name.
2. **National ID** (patientId): Random 10-digit ID.
3. **File Number** (fileNumber): Random number.
4. **Date** (date - use today's date).
5. **Doctor Name** (doctorName).
6. **Doctor Name Arabic** (doctorNameAr).
7. **Doctor Specialty** (doctorSpecialty - appropriate for the drug).
8. **Insurance Company** (insuranceCompany - default to "Cash" unless user specifies otherwise).
9. **Diagnosis & Code** (diagnosisCode, diagnosisDescription - appropriate for the drug, in English).
10. **Hospital Name** (hospitalName).

Do NOT apologize. Just write the complete JSON.

Required Response Format:
---PRESCRIPTION_START---
{
  "hospitalName": "...",
  "patientName": "...",
  "patientId": "...",
  "fileNumber": "...",
  "date": "...",
  "doctorName": "...",
  "doctorNameAr": "...",
  "doctorSpecialty": "...",
  "insuranceCompany": "...",
  "diagnosisCode": "...",
  "diagnosisDescription": "Diagnosis in English ONLY",
  "drugs": [
     { "tradeName": "Drug Name (English)", "genericName": "Generic Name (English)", "dosage": "...", "usageMethod": "...", "quantity": "1" }
  ]
}
---PRESCRIPTION_END---`;

    const generalSystemInstructionAr = `أنت خبير صيدلاني ومدير منتجات محترف متخصص في السوق الدوائي السعودي (PharmaSource Expert).
    
    **دورك الأساسي:** تقديم إجابات دقيقة، سريعة، وشاملة. هدفك هو إتمام البيع ومساعدة الصيدلي.
    
    **أوامر مباشرة وصارمة:**

    1.  **عند رفع صورة دواء (Image Analysis):**
        - مهمتك الأولى: **استخراج** اسم الدواء (Trade Name)، التركيز (Strength)، والشكل (Form) من الصورة بدقة متناهية.
        - مهمتك الثانية: استخدم *فوراً* أداة \`searchDatabase\` للبحث عن هذا الدواء.
        - مهمتك الثالثة: اعرض النتيجة كاملة. قل: "هذا الدواء هو [الاسم]، سعره [السعر] ريال، مادته الفعالة [المادة]، ويستخدم لـ [الاستخدام]."
        - **لا تقل جزء وتترك جزء:** اعرض السعر، المادة الفعالة، والبدائل المتاحة فوراً.

    2.  **السعر (Price):** استخرجه من قاعدة البيانات المحلية حصراً باستخدام الأداة.

    3.  **البيع المتقاطع (Cross-Selling) - الأهم:**
        - عندما يُطلب منك اقتراحات مرافقة أو "Cross-sell"، لا تقدم نصائح عامة.
        - **اقترح 3 منتجات محددة** يمكن صرفها فوراً مع الدواء الأساسي لزيادة الفائدة والربح.
        - نوع الاقتراحات: (1) مكمل غذائي يعوض نقص، (2) مستحضر تجميلي أو عناية، (3) جهاز طبي (مثل جهاز سكر).
        - اشرح "لماذا" بأسلوب إقناعي بسيط: "بما أن المريض يأخذ مضاد حيوي، اقترح عليه بروبيوتيك لحماية المعدة".
        - استخدم أداة البحث للعثور على أسماء تجارية حقيقية لهذه الاقتراحات وعرض أسعارها.

    **سياق المنتج الحالي:**
    ${contextMedicine ? JSON.stringify(contextMedicine) : (contextCosmetic ? JSON.stringify(contextCosmetic) : 'لا يوجد منتج محدد في السياق.')}

    **تنسيق الإجابة:**
    - عند اقتراح منتجات، استخدم دائماً تنسيق JSON التالي لضمان عرضها بشكل جميل:
         \`\`\`json
         ---PRODUCTS_START---
         [
           {
             "tradeName": "Name (English)",
             "scientificName": "Scientific Name (English)",
             "price": "12.50", 
             "manufacturer": "Manufacturer Name",
             "reason": "السبب الطبي المقنع والمختصر...",
             "form": "Form..."
           }
         ]
         ---PRODUCTS_END---
         \`\`\`
    - باقي الشرح يكون نصياً باللغة العربية، سريعاً ومباشراً.`;

    const generalSystemInstructionEn = `You are an Expert Pharmacist and Product Manager specializing in the Saudi Pharmaceutical Market (PharmaSource Expert).

    **ROLE:** Provide fast, comprehensive, and actionable answers.

    **STRICT DIRECTIVES:**

    1.  **IMAGE ANALYSIS:**
        - Extract Trade Name, Strength, and Form immediately from the image.
        - IMMEDIATELY use \`searchDatabase\` to find it.
        - Report FULL details: Price, Active Ingredient, Usage. Do not omit anything.

    2.  **CROSS-SELLING:**
        - When asked for cross-selling, suggest **3 specific items** to upsell.
        - Diversify: Supplement, Medical Device, or Complementary Care.
        - Explain WHY persuasively: "Since taking antibiotics, suggest Probiotics for gut health."
        - Search DB for real items and prices.

    **Context:**
    ${contextMedicine ? JSON.stringify(contextMedicine) : (contextCosmetic ? JSON.stringify(contextCosmetic) : 'No context.')}

    **Output Format:**
    - Return product lists in valid JSON wrapped in tags:
         \`\`\`json
         ---PRODUCTS_START---
         [
           {
             "tradeName": "Product Name (From DB)",
             "scientificName": "Active Ingredient / Type",
             "price": "12.50", 
             "manufacturer": "Manufacturer Name",
             "reason": "Persuasive reason...",
             "form": "Tablet/Device..."
           }
         ]
         ---PRODUCTS_END---
         \`\`\`
    `;

    let systemInstruction;
    if (isPrescriptionMode) {
        systemInstruction = language === 'ar' ? prescriptionSystemInstructionAr : prescriptionSystemInstructionEn;
    } else {
        systemInstruction = language === 'ar' ? generalSystemInstructionAr : generalSystemInstructionEn; 
    }

    try {
        const toolImplementations = { searchDatabase: searchDatabase };
        const finalResponse = await runAIChat(newHistory, systemInstruction, [{functionDeclarations: tools}], toolImplementations);
        const responseParts = finalResponse?.candidates?.[0]?.content?.parts;
        if (responseParts) {
             setChatHistory(prev => [...prev, { role: 'model', parts: responseParts }]);
        } else {
             setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
        }
    } catch (err) {
      console.error("AI service error:", err);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, contextMedicine, contextCosmetic, isPrescriptionMode, language, t, searchDatabase, favoriteMedicines, user]);
  
  useEffect(() => { handleSendMessageRef.current = handleSendMessage; }, [handleSendMessage]);

  useEffect(() => {
    if (isOpen) {
        if (!user) {
            // Do not send welcome message if not logged in
            return;
        }

        if (initialPrompt === '##PRESCRIPTION_MODE##') {
            setIsPrescriptionMode(true);
            setChatHistory([{ role: 'model', parts: [{ text: t('prescriptionAssistantWelcome') }] }]);
            setUserInput('');
        } else if (initialHistory && initialHistory.length >0) {
            setIsPrescriptionMode(false);
            setChatHistory(initialHistory);
            setUserInput('');
        } else {
            setIsPrescriptionMode(false);
            // If opening with a medicine context, show a personalized welcome or trigger specific prompt if instructed
            if ((contextMedicine || contextCosmetic) && !initialPrompt) {
                 setChatHistory([{ role: 'model', parts: [{ text: t('assistantWelcomeMessage') }] }]);
            } else if (!initialPrompt) {
                 setChatHistory([{ role: 'model', parts: [{ text: t('assistantWelcomeMessage') }] }]);
            }
            
            if (initialPrompt) {
                 setTimeout(() => { if (handleSendMessageRef.current) handleSendMessageRef.current(initialPrompt); }, 100);
            }
        }
      setUploadedImage(null);
    }
  }, [isOpen, contextMedicine, contextCosmetic, t, initialPrompt, initialHistory, language, user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isLoading]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setUploadedImage({ blob: file, preview: URL.createObjectURL(file), mimeType: file.type });
    }
    event.target.value = '';
  };

  const handleClose = () => { onSaveAndClose(chatHistory); };
  
  const handleQuickAction = (action: 'price' | 'ingredient' | 'alternatives' | 'cross_sell' | 'usp' | 'usage') => {
      const item = contextMedicine || contextCosmetic;
      if (!item) return;
      
      let name = '';
      if ('Trade Name' in item) name = item['Trade Name'];
      else if ('BrandName' in item) name = `${item.BrandName} ${item.SpecificName}`;

      // --- LOCAL / INSTANT ACTIONS ---
      // These actions use local data and do NOT query the AI, providing instant response.
      
      if (action === 'price') {
          let price = 'N/A';
          if ('Public price' in item) price = item['Public price'];
          
          const userText = language === 'ar' ? `كم سعر ${name}؟` : `What is the price of ${name}?`;
          const modelText = language === 'ar' 
            ? `سعر **${name}** هو: **${price} ${t('sar')}**`
            : `The price of **${name}** is: **${price} ${t('sar')}**`;

          setChatHistory(prev => [
              ...prev, 
              { role: 'user', parts: [{ text: userText }] },
              { role: 'model', parts: [{ text: modelText }] }
          ]);
          return;
      }

      if (action === 'ingredient') {
          let ing = '';
          if ('Scientific Name' in item) ing = item['Scientific Name'];
          else if ('Active ingredient' in item) ing = item['Active ingredient'];

          const userText = language === 'ar' ? `ما هي المادة الفعالة لـ ${name}؟` : `What is the active ingredient of ${name}?`;
          const modelText = language === 'ar'
            ? `المادة الفعالة هي: **${ing}**`
            : `The active ingredient is: **${ing}**`;

          setChatHistory(prev => [
              ...prev,
              { role: 'user', parts: [{ text: userText }] },
              { role: 'model', parts: [{ text: modelText }] }
          ]);
          return;
      }

      if (action === 'alternatives' && contextMedicine) {
          const userText = language === 'ar' ? `ابحث عن بدائل لـ ${name}` : `Find alternatives for ${name}`;
          
          // Local Search Logic
          const cleanSciName = contextMedicine['Scientific Name'].toLowerCase().trim();
          const alts = allMedicines.filter(m => 
              m.RegisterNumber !== contextMedicine.RegisterNumber &&
              m['Scientific Name'].toLowerCase().trim() === cleanSciName
          ).slice(0, 15); // Limit to top 15 results

          let modelText = '';
          
          if (alts.length > 0) {
              const productsPayload = alts.map(m => ({
                  tradeName: m['Trade Name'],
                  scientificName: m['Scientific Name'],
                  price: m['Public price'],
                  form: m['PharmaceuticalForm'],
                  manufacturer: m['Manufacture Name'],
                  reason: language === 'ar' ? 'بديل مباشر (نفس المادة الفعالة)' : 'Direct Alternative (Same Ingredient)'
              }));
              modelText = `---PRODUCTS_START---${JSON.stringify(productsPayload)}---PRODUCTS_END---`;
          } else {
              modelText = language === 'ar' ? 'عفواً، لم أجد بدائل مباشرة مطابقة تماماً في قاعدة البيانات.' : 'Sorry, I found no direct alternatives in the local database.';
          }

          setChatHistory(prev => [
              ...prev,
              { role: 'user', parts: [{ text: userText }] },
              { role: 'model', parts: [{ text: modelText }] }
          ]);
          return;
      }

      // --- AI GENERATIVE ACTIONS ---
      // These still require the LLM because they need creative/generative content (marketing, usage advice, etc.)
      
      let prompt = '';
      if (action === 'cross_sell') {
          prompt = language === 'ar'
            ? `بناءً على دواء ${name}، ما هي أفضل المنتجات التي يمكن بيعها معه (Cross-selling) لزيادة الفائدة للمريض؟ اقترح 3 أصناف (فيتامينات أو مستلزمات أو أجهزة) مع ذكر السبب والأسعار من قاعدة البيانات.`
            : `For ${name}, suggest 3 best cross-selling items (Vitamins, Devices, etc.) to benefit the patient. Include medical reason and prices from DB.`;
      } else if (action === 'usp') {
          prompt = language === 'ar'
            ? `ما هي ميزة البيع الفريدة (USP) لـ ${name}؟ لماذا هو مميز؟ (اكتب بالتفصيل الممل)`
            : `What is the Unique Selling Point (USP) of ${name}? Why is it special? (Detailed explanation)`;
      } else if (action === 'usage') {
          prompt = language === 'ar'
            ? `اشرح طريقة استخدام ${name} بالتفصيل الممل كخبير (جرعات، توقيت، نصائح).`
            : `Explain the usage of ${name} in great detail like an expert (dosage, timing, tips).`;
      }
      
      if (prompt) {
          handleSendMessage(prompt, true);
      }
  };

  if (!isOpen) return null;

  const displayContextName = contextMedicine ? contextMedicine['Trade Name'] : (contextCosmetic ? contextCosmetic.SpecificName : '');

  // Render Login Required Screen if no user
  if (!user) {
      return (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
            <div className="bg-white dark:bg-dark-card w-full max-w-md p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center space-y-4" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                    <AssistantIcon />
                </div>
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{t('loginRequired')}</h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {t('loginRequiredForAI')}
                </p>
                <div className="flex gap-3 w-full pt-2">
                    <button onClick={handleClose} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
                        {t('cancel')}
                    </button>
                    <button onClick={() => { handleClose(); window.location.hash = '#settings'; }} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold">
                        {t('login')}
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-primary"><AssistantIcon /></span>
            <div>
                <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{t('assistantModalTitle')}</h2>
                {displayContextName && <p className="text-xs text-primary dark:text-primary-light font-medium truncate max-w-[200px]">{displayContextName}</p>}
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full text-light-text-secondary hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><ClearIcon/></button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {!aiAvailable && <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">{t('aiUnavailableMessage')}</div>}
          {aiAvailable && chatHistory.map((msg, index) => {
             // Don't render hidden messages (internal prompts)
             if ((msg as any).hidden) return null;

             // Safe access using optional chaining
             const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
             const isProductRecommendation = textContent?.includes('---PRODUCTS_START---');

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><AssistantIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm flex flex-col gap-2 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none p-3' : `bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none ${isPrescription || isProductRecommendation ? 'p-0 bg-transparent dark:bg-transparent shadow-none' : 'p-3'}`}`}>
                     { isPrescription ? (
                        <PrescriptionView content={textContent!} t={t} />
                     ) : isProductRecommendation ? (
                        <ProductRecommendationsView content={textContent!} t={t} />
                     ) : (
                         msg.parts?.map((part, pIndex) => {
                            if ('text' in part && part.text) return <div key={pIndex} className="text-sm prose prose-sm dark:prose-invert max-w-none ai-response-content"><MarkdownRenderer content={part.text} /></div>;
                            if ('inlineData' in part && part.inlineData) {
                                const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                                return <img key={pIndex} src={src} alt="User upload" className="max-w-xs rounded-lg" />
                            }
                            return null;
                         })
                     )}
                  </div>
                </div>
            )
          })}
          {isLoading && <div className="flex items-start gap-3 justify-start"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><AssistantIcon /></div><div className="max-w-md rounded-2xl p-3 shadow-sm bg-gray-100 dark:bg-slate-700">Loading...</div></div>}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 space-y-3">
            {/* Quick Actions for Context Item (Medicine or Cosmetic) */}
            {(contextMedicine || contextCosmetic) && !isPrescriptionMode && aiAvailable && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {/* Database Driven Actions First - Quick and Native */}
                    <Chip label={t('quickActionPrice')} onClick={() => handleQuickAction('price')} />
                    <Chip label={t('quickActionIngredient')} onClick={() => handleQuickAction('ingredient')} />
                    {contextMedicine && <Chip label={t('quickActionAlternatives')} onClick={() => handleQuickAction('alternatives')} />}
                    
                    {/* Expert/Consultative Actions Second */}
                    <Chip label={t('quickActionCrossSelling')} onClick={() => handleQuickAction('cross_sell')} />
                    <Chip label={t('quickActionSellingPoint')} onClick={() => handleQuickAction('usp')} />
                    <Chip label={t('quickActionUsage')} onClick={() => handleQuickAction('usage')} />
                </div>
            )}

            {uploadedImage && <div className="mb-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-start justify-between"><div><p className="text-xs font-bold mb-1">{t('imagePreview')}</p><img src={uploadedImage.preview} alt="upload preview" className="h-16 w-16 object-cover rounded"/></div><button onClick={() => setUploadedImage(null)} className="p-1 text-light-text-secondary hover:text-red-500 rounded-full"><ClearIcon/></button></div>}
            <form onSubmit={e => {e.preventDefault(); handleSendMessage();}} className="flex items-center gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-light-text-secondary hover:text-primary rounded-full hover:bg-gray-200 transition-colors" disabled={!aiAvailable}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={aiAvailable ? t('askGeminiPlaceholder') : t('aiUnavailableShort')} className="flex-grow w-full p-2 bg-gray-100 dark:bg-slate-700 border-2 border-transparent focus:border-primary rounded-lg outline-none transition-colors resize-none" rows={1} disabled={isLoading || !aiAvailable} />
                <button type="submit" disabled={isLoading || (!userInput && !uploadedImage) || !aiAvailable} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-300 transition-colors">{t('ask')}</button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default AssistantModal;
