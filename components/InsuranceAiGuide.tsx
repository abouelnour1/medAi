import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FunctionDeclaration, Type, Part } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage } from '../types';
import SearchIcon from './icons/SearchIcon';
import AssistantIcon from './icons/AssistantIcon';
import MarkdownRenderer from './MarkdownRenderer';
import { runAIChat, isAIAvailable } from '../geminiService';

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
    // Set initial welcome message
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
    // Add other potential filter fields here if needed in the future
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
        results: results.slice(0, 15).map(r => ({ // return top 15 results
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
        scientificName: { type: Type.STRING, description: 'The scientific (active ingredient) name of the drug.' },
      },
    },
  };

  const handleSendMessage = useCallback(async () => {
    const currentInput = userInput.trim();
    if (!currentInput || isLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: [{ text: currentInput }] }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    const systemInstruction = language === 'ar' ? 
`أنت مساعد ذكاء اصطناعي متخصص في دليل التأمين الطبي السعودي. دورك هو مساعدة المتخصصين في الرعاية الصحية على فهم تغطية الأدوية بناءً على الحالات الطبية وأكواد ICD-10.
لديك مصدران للمعلومات:
1.  مجموعة من قواعد التغطية المعروفة (أمثلة أدناه).
2.  أداة اسمها \`searchDrugDatabase\` للبحث عن معلومات الأدوية المتوفرة في السوق السعودي (مثل الأسماء التجارية، الأسماء العلمية، الأسعار، إلخ).

**مهمتك:**
أجب على سؤال المستخدم بوضوح وشمولية. قد يسأل المستخدم عن:
- حالة طبية (مثل "ارتفاع ضغط الدم"، "السكري")
- كود ICD-10 (مثل "I10")
- المادة الفعالة لدواء (مثل "أملوديبين")
- الاسم التجاري لدواء (مثل "كونكور")

**مثال على قواعد التغطية:**
- **الحالة:** ارتفاع ضغط الدم (HYPERTENSION)
- **أكواد ICD-10:** I10, I11, I12, I13, I15
- **الفئة الدوائية المغطاة:** حاصرات مستقبلات الأنجيوتنسين II مع حاصرات قنوات الكالسيوم
- **المواد الفعالة المغطاة:**
    - كانديسارتان سيليكسيتيل + أملوديبين بيسيلات (تركيزات: 8/2.5مجم، 8/5مجم)
- **الفئة الدوائية المغطاة:** حاصرات بيتا مع حاصرات قنوات الكالسيوم
- **المواد الفعالة المغطاة:**
    - بيسوبرولول فومارات + أملوديبين بيسيلات (تركيزات: 5/5مجم، 5/10مجم)
- **ملاحظة:** العلاجات المركبة كهذه تُستخدم عادة للمرحلتين الثانية والثالثة من ارتفاع ضغط الدم، وليست كخط أول للمرحلة الأولى.

**كيفية الإجابة:**
1.  حلل استعلام المستخدم لفهم القصد منه.
2.  استخدم الأمثلة ومعرفتك العامة للعثور على المعلومات ذات الصلة (مثل أكواد ICD المرتبطة، والفئات الدوائية).
3.  **الأهم**، إذا كان استعلام المستخدم يتضمن أدوية، استخدم أداة \`searchDrugDatabase\` للعثور على منتجات محددة متوفرة في السوق السعودي تطابق المواد الفعالة المغطاة. هذا يجعل إجابتك عملية.
4.  قدم المعلومات بتنسيق markdown واضح ومنظم. **اجعل التشخيص (Indication) ورمز ICD-10 بالخط العريض** لتسهيل القراءة. استخدم العناوين والقوائم والنص العريض.
5.  إذا وجدت أدوية ذات صلة باستخدام الأداة، اذكر أسماءها التجارية، وأسماءها العلمية، وأسعارها.
6.  إذا لم يتم العثور على دواء معين في قواعد التغطية، يجب أن تذكر أنه غير مغطى. **لا تقترح أدوية بديلة.** إذا لم تتمكن من العثور على معلومات حول حالة ما، وضح ذلك بصراحة.
7.  أجب دائمًا بلغة استعلام المستخدم (العربية/الإنجليزية).`
:
`You are a specialized AI assistant acting as a Saudi Arabian Medical Insurance Guide. Your role is to help healthcare professionals understand drug coverage based on medical indications and ICD-10 codes.
You have two sources of information:
1.  A set of known coverage rules (examples provided below).
2.  A tool called \`searchDrugDatabase\` to look up information on drugs available in the Saudi market (like trade names, scientific names, prices, etc.).

**Your Task:**
Answer the user's question clearly and comprehensively. The user might ask about:
- A medical condition (e.g., "Hypertension", "السكري")
- An ICD-10 code (e.g., "I10")
- A drug's active ingredient (e.g., "Amlodipine")
- A drug's trade name (e.g., "Concor")

**Example Coverage Rules:**
- **Indication:** HYPERTENSION
- **ICD-10 Codes:** I10, I11, I12, I13, I15
- **Covered Drug Class:** ANGIOTENSIN II ANTAGONISTS AND CALCIUM CHANNEL BLOCKERS
- **Covered Active Ingredients:**
    - Candesartan Cilexetil + Amlodipine Besilate (Strengths: 8/2.5mg, 8/5mg)
- **Covered Drug Class:** BETA BLOCKING AGENTS AND CALCIUM CHANNEL BLOCKERS
- **Covered Active Ingredients:**
    - Bisoprolol Fumarate + Amlodipine Besilate (Strengths: 5/5mg, 5/10mg)
- **Note:** Combination therapies like these are typically used for Stage 2 and Stage 3 hypertension, not as a first-line for Stage 1.

**How to answer:**
1.  Analyze the user's query to understand their intent.
2.  Use the example rules and your general knowledge to find relevant information (like associated ICD codes, drug classes, etc.).
3.  **Crucially**, if the user's query involves drugs, use the \`searchDrugDatabase\` tool to find specific products available in the Saudi market that match the covered active ingredients. This makes your answer practical.
4.  Present the information in a clear, structured markdown format. **Bold the Indication/Diagnosis and the ICD-10 Code** for readability. Use headings, lists, and bold text.
5.  If you find relevant drugs using the tool, list their trade names, scientific names, and prices.
6.  If a specific drug is not found in the coverage rules, you should state that it is not covered. **Do not suggest alternative medications.** If you can't find information about a condition, state that clearly.
7.  Always respond in the language of the user's query (Arabic/English).`;

    try {
      const toolImplementations = { searchDrugDatabase: searchDrugDatabase };
      const finalResponse = await runAIChat(
        newHistory, 
        systemInstruction, 
        [{ functionDeclarations: [searchDrugDatabaseTool] }], 
        toolImplementations,
        'gemini-2.5-flash'
      );
      const responseParts = finalResponse?.candidates?.[0]?.content?.parts;
      if (responseParts && responseParts.length > 0) {
          setChatHistory(prev => [...prev, { role: 'model', parts: responseParts }]);
      } else {
          console.error("AI response is missing parts:", finalResponse);
          const errorMsg = { role: 'model', parts: [{ text: t('geminiError') }] } as ChatMessage;
          setChatHistory(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error("AI service error:", err);
      let errorMessage = t('geminiError'); // Default generic error
      if (err instanceof Error) {
        if (err.message.includes('API_KEY is missing')) {
          errorMessage = t('aiUnavailableMessage');
        } else {
          // Provide more specific feedback from the API error
          errorMessage = `${t('geminiError')} \n\n**Details:** ${err.message}`;
        }
      }
      const errorMsg = { role: 'model', parts: [{ text: errorMessage }] } as ChatMessage;
      setChatHistory(prev => [...prev, errorMsg]);
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
        {/* Chat Body */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {!aiAvailable && (
            <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg m-4">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{t('aiUnavailableTitle')}</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{t('aiUnavailableMessage')}</p>
            </div>
          )}
          {aiAvailable && chatHistory.map((msg, index) => {
             const textPart = msg.parts.find(p => 'text' in p) as { text: string } | undefined;
             const textContent = textPart?.text || '';

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><AssistantIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm p-3 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none'}`}>
                      <div 
                          className="text-sm prose prose-sm dark:prose-invert max-w-none ai-response-content"
                          style={{
                              '--tw-prose-body': 'inherit',
                              '--tw-prose-headings': 'inherit',
                              '--tw-prose-bold': 'inherit',
                              '--tw-prose-bullets': 'inherit',
                              '--tw-prose-counters': 'inherit',
                          } as React.CSSProperties}
                      >
                          <MarkdownRenderer content={textContent} />
                      </div>
                  </div>
                </div>
            )
          })}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><AssistantIcon /></div>
               <div className="max-w-md rounded-2xl p-3 shadow-sm bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                </div>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Footer / Input */}
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