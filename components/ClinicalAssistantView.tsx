import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Part } from '@google/genai';
// FIX: Imported the InsuranceDrug type to resolve the 'Cannot find name' error.
import { Medicine, TFunction, Language, ChatMessage, PrescriptionData, InsuranceDrug } from '../types';
import StethoscopeIcon from './icons/StethoscopeIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';

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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        scientificName: { type: Type.STRING, description: 'The scientific (active ingredient) name of the drug.' },
      },
    },
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
        const systemInstruction = language === 'ar'
        ? `أنت طبيب خبير ومستشار سريري عالمي، مقيم في المملكة العربية السعودية. جمهورك يتكون من متخصصي الرعاية الصحية (أطباء وصيادلة).
**قاعدة معارفك وقدراتك:**
لديك وصول إلى أداتين قويتين:
1.  **بحث Google (\`googleSearch\`):** للعثور على أحدث المعلومات الطبية، والإرشادات السريرية، والأبحاث من مصادر عالمية موثوقة (مثل UpToDate, PubMed, NICE). استخدمها للأسئلة الطبية العامة التي تتطلب معرفة واسعة ومحدثة.
2.  **قاعدة بيانات الأدوية السعودية (\`searchDatabase\`):** للاستعلام عن معلومات محددة حول الأدوية والمكملات الغذائية المتوفرة في السعودية (الأسعار، الأسماء التجارية، الشركات المصنعة، إلخ). استخدمها عند الحاجة لمعلومات محلية دقيقة أو لإنشاء وصفات طبية.

**منطق التفاعل:**
*   عندما يطرح المستخدم سؤالاً، قرر الأداة الأنسب لاستخدامها. للأسئلة العامة، استخدم \`googleSearch\`. للأسئلة المحددة عن الأدوية في السعودية، استخدم \`searchDatabase\`.
*   عندما يذكر المستخدم اسم دواء تجاري، استخدم دائمًا \`searchDatabase\` للبحث عنه وتحديد مادته الفعالة.
*   ادمج المعلومات من الأدوات مع معرفتك الطبية لتقديم إجابات شاملة.
*   **مهم:** عند استخدام بحث Google، يجب عليك دائمًا استخراج عناوين URL من \`groundingChunks\` وعرضها في نهاية إجابتك تحت عنوان "المصادر".
*   **كتابة الوصفات الطبية:** قم بإنشاء وصفات طبية مفصلة ودقيقة بصيغة JSON عند الطلب. استخدم \`searchDatabase\` لتأكيد أسماء الأدوية وتركيزاتها.

**اللهجة:** احترافية، قائمة على الأدلة، وموجزة. خاطب المستخدم كزميل في الرعاية الصحية.`
        : `You are a world-class expert physician and clinical consultant based in Saudi Arabia. Your audience consists of healthcare professionals (doctors, pharmacists).
**Your Knowledge Base & Capabilities:**
You have access to two powerful tools:
1.  **Google Search (\`googleSearch\`):** To find the most current medical information, clinical guidelines, and research from reputable, world-class sources (e.g., UpToDate, PubMed, NICE). Use this for general medical questions that require broad, up-to-date knowledge.
2.  **Saudi Drug Database (\`searchDatabase\`):** To query for specific information about medicines and supplements available in Saudi Arabia (prices, trade names, manufacturers, etc.). Use this when precise local information is needed or for generating medical prescriptions.

**Interaction Logic:**
*   When a user asks a question, decide which tool is most appropriate. For general questions, use \`googleSearch\`. For specific Saudi drug questions, use \`searchDatabase\`.
*   When a user mentions a drug's trade name, ALWAYS use \`searchDatabase\` to look it up and identify its active ingredient.
*   Combine information from the tools with your medical knowledge to provide comprehensive answers.
*   **Important:** When using Google Search, you MUST ALWAYS extract the URLs from \`groundingChunks\` and list them at the end of your response under a "Sources" heading.
*   **Prescription Writing:** Generate detailed, accurate prescriptions in JSON format when requested. Use the \`searchDatabase\` tool to confirm drug names and strengths.

**Tone:** Professional, evidence-based, and concise. Address the user as a fellow healthcare professional.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: newHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }, { functionDeclarations: [searchDatabaseTool] }],
            },
        });

        let finalResponse = response;

        // Handle function call if present
        if (response.functionCalls && response.functionCalls.length > 0) {
            const fc = response.functionCalls[0];
            if (fc.name === 'searchDatabase') {
                const functionResult = searchDatabase(fc.args as any);
                const toolResponseHistory: ChatMessage[] = [...newHistory, { role: 'model', parts: [{ functionCall: fc }] }];
                toolResponseHistory.push({ role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult } }] });
                
                finalResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
                    config: { 
                        systemInstruction
                    },
                });
            }
        }
      
        // Process response and grounding chunks
        const responseParts = [...finalResponse.candidates[0].content.parts];
        const groundingChunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (groundingChunks && groundingChunks.length > 0) {
            const sources = groundingChunks
                .map((chunk: any) => chunk.web?.uri)
                .filter(Boolean);

            if (sources.length > 0) {
                 const existingText = responseParts.find(p => 'text' in p)?.text || '';
                 if (!existingText.includes(language === 'ar' ? 'المصادر' : 'Sources')) {
                    const sourcesText = `\n\n---\n**${language === 'ar' ? 'المصادر' : 'Sources'}:**\n` + sources.map((url: string) => `- ${url}`).join('\n');
                    responseParts.push({ text: sourcesText });
                 }
            }
        }
        
        setChatHistory(prev => [...prev, { role: 'model', parts: responseParts }]);

        // Check for and save prescription
        const prescriptionText = responseParts.find(p => 'text' in p && p.text?.includes('---PRESCRIPTION_START---'))?.text;
        if (prescriptionText) {
            const parsedJson = parsePrescriptionJson(prescriptionText);
            if (parsedJson) {
                const fullPrescriptionData: PrescriptionData = { ...parsedJson, id: `p-${Date.now()}`};
                onSavePrescription(fullPrescriptionData);
            }
        }
    } catch (err) {
      console.error("Gemini API error:", err);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, language, t, searchDatabase, onSavePrescription, setChatHistory]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg flex flex-col h-full">
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {chatHistory.map((msg, index) => {
             const textContent = msg.parts.find(p => 'text' in p && p.text)?.text;
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><StethoscopeIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none p-3' : `bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-bl-none ${isPrescription ? 'p-0 bg-transparent dark:bg-transparent shadow-none' : 'p-3'}`}`}>
                     { isPrescription ? (
                        <PrescriptionView content={textContent!} t={t} />
                     ) : (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <MarkdownRenderer content={textContent || ''} />
                        </div>
                     )}
                  </div>
                </div>
            )
          })}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><StethoscopeIcon /></div>
               <div className="max-w-md rounded-2xl p-3 shadow-sm bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-bl-none">
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

        <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 bg-light-bg dark:bg-dark-bg">
             <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={t('clinicalAssistantWelcome')}
                    className="flex-grow w-full p-2 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-slate-700 focus:border-primary rounded-lg outline-none transition-colors resize-none"
                    rows={2}
                    disabled={isLoading}
                    aria-label={t('clinicalAssistantWelcome')}
                />
                <button type="submit" disabled={isLoading || !userInput} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors">{t('ask')}</button>
            </form>
        </footer>
    </div>
  );
};

export default ClinicalAssistantView;