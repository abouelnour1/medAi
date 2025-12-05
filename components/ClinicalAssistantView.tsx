
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FunctionDeclaration, Type, Part, Tool, GenerateContentResponse } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, PrescriptionData, InsuranceDrug } from '../types';
import StethoscopeIcon from './icons/StethoscopeIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';
import { runAIChat, isAIAvailable } from '../geminiService';

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
        // Return clear instruction to fallback
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
        ? `أنت طبيب خبير ومستشار سريري عالمي، مقيم في المملكة العربية السعودية. جمهورك يتكون من متخصصي الرعاية الصحية. وظيفتك الأساسية هي تقديم توصيات سريرية وكتابة الوصفات الطبية.

**معلومات إضافية:** لديك إمكانية الوصول إلى محتويات بعض الإرشادات السريرية الهامة كجزء من تعليماتك.
<guidelines_data>
${guidelinesString}
</guidelines_data>

**قاعدة معارفك وقدراتك:**
1.  **البحث في قاعدة البيانات المحلية (\`searchDatabase\`):** استخدم هذه الأداة للتحقق من توفر الأدوية.
2.  **مهم جداً:** إذا لم تجد الدواء في قاعدة البيانات المحلية، **استخدم معرفتك الطبية العامة لملء تفاصيل الوصفة (اسم الدواء، الجرعة، إلخ)**. لا تترك الحقول فارغة بحجة عدم العثور على الدواء.

**قواعد اللغة للوصفة الطبية (صارمة):**
الحقول التالية يجب أن تكون **باللغة الإنجليزية حصراً**:
1. اسم الدواء التجاري (Trade Name).
2. الاسم العلمي (Generic Name).
3. **وصف التشخيص (Diagnosis Description)**.

**تعليمات تعبئة البيانات المفقودة (إجباري):**
إذا لم يزودك المستخدم بأي من البيانات التالية، **يجب عليك اختراعها وتأليفها ببيانات واقعية** لملء الوصفة بالكامل. لا تترك أي حقل فارغ:
1. **اسم المريض** (patientName): اسم ثلاثي عشوائي (بالعربية).
2. **الرقم الوطني** (patientId): رقم هوية عشوائي.
3. **رقم الملف** (fileNumber): رقم ملف عشوائي.
4. **التاريخ** (date - YYYY-MM-DD).
5. **اسم الطبيب** (doctorName).
6. **اسم الطبيب بالعربي** (doctorNameAr).
7. **تخصص الطبيب** (doctorSpecialty): تخصص مناسب.
8. **شركة التأمين** (insuranceCompany): شركة تأمين معروفة.
9. **التشخيص والكود** (diagnosisCode, diagnosisDescription): بالإنجليزية حصراً.
10. **اسم المستشفى** (hospitalName).

**كتابة الوصفات الطبية:**
*   عند كتابة وصفة، تأكد من أن الناتج بصيغة JSON المطلوبة بدقة كما يلي:
\`\`\`json
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
  "diagnosisDescription": "English Only",
  "drugs": [
     { "tradeName": "English Name", "genericName": "English Generic", "dosage": "...", "usageMethod": "...", "quantity": "1" }
  ]
}
\`\`\`

**اللهجة:** احترافية، قائمة على الأدلة، وموجزة.`
        : `You are a world-class expert physician based in Saudi Arabia. Your function is to provide clinical recommendations and write prescriptions.

**Additional Information:** Access to clinical guidelines provided below.
<guidelines_data>
${guidelinesString}
</guidelines_data>

**Your Knowledge Base & Capabilities:**
1.  **Local Database Search (\`searchDatabase\`):** Use this to check availability.
2.  **CRITICAL:** If you do not find the drug in the local database, **YOU MUST USE YOUR GENERAL KNOWLEDGE to fill in the prescription details (Drug Name, Dosage, etc.)**. Do not leave fields blank.

**LANGUAGE RULES (STRICT):**
The following fields MUST be in **ENGLISH ONLY**:
1. Drug Trade Name.
2. Scientific/Generic Name.
3. **Diagnosis Description**.

**MISSING DATA RULES (MANDATORY):**
If the user does not provide the following details, **YOU MUST INVENT REALISTIC RANDOM DATA** to complete the prescription. Do not leave blanks:
1. **Patient Name** (patientName).
2. **National ID** (patientId).
3. **File Number** (fileNumber).
4. **Date** (date).
5. **Doctor Name** (doctorName).
6. **Doctor Name Arabic** (doctorNameAr).
7. **Doctor Specialty** (doctorSpecialty).
8. **Insurance Company** (insuranceCompany).
9. **Diagnosis & Code** (diagnosisCode, diagnosisDescription - English).
10. **Hospital Name** (hospitalName).

**Prescription Writing:**
*   Ensure the output matches the required JSON format strictly.
*   Fill all fields with realistic data.

**Tone:** Professional, evidence-based.`;

        const tools: Tool[] = [{ functionDeclarations: [searchDatabaseTool] }];
        const toolImplementations = { searchDatabase };

        const finalResponse = await runAIChat(newHistory, systemInstruction, tools, toolImplementations, 'gemini-2.5-pro');
      
        const responsePartsFromApi = finalResponse?.candidates?.[0]?.content?.parts;

        if (responsePartsFromApi && responsePartsFromApi.length > 0) {
            // Strictly sanitize response parts
            const responseParts = responsePartsFromApi.map(p => {
                const part: Part = {};
                if (p.text) part.text = p.text;
                if (p.inlineData) {
                    part.inlineData = {
                        mimeType: p.inlineData.mimeType,
                        data: p.inlineData.data
                    };
                }
                if (p.functionCall) {
                    part.functionCall = {
                        name: p.functionCall.name,
                        args: p.functionCall.args ? JSON.parse(JSON.stringify(p.functionCall.args)) : {},
                        id: p.functionCall.id
                    };
                }
                if (p.functionResponse) {
                    part.functionResponse = {
                        name: p.functionResponse.name,
                        response: p.functionResponse.response ? JSON.parse(JSON.stringify(p.functionResponse.response)) : {},
                        id: p.functionResponse.id
                    };
                }
                return part;
            });
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
        } else {
            let errorMessage = t('geminiError');
            if (finalResponse?.promptFeedback?.blockReason) {
                errorMessage = `Request blocked: ${finalResponse.promptFeedback.blockReason}`;
            } else if (!finalResponse.text && (!finalResponse.candidates || finalResponse.candidates.length === 0)) {
                errorMessage = t('noResultsFromAI');
            }
            console.error("AI response was empty or blocked. Full response:", finalResponse);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{text: errorMessage}] }]);
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
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
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
             // Safe navigation using optional chaining
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