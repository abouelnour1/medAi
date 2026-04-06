
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
import { Medicine, TFunction, Language, ChatMessage, PrescriptionData, InsuranceDrug, SerializablePart } from '../types';
import StethoscopeIcon from './icons/StethoscopeIcon';
import MarkdownRenderer from './MarkdownRenderer';

// ── Inline Prescription Card (displayed inside chat) ──────────────────────────
const InlinePrescriptionCard: React.FC<{ content: string; t: TFunction }> = ({ content, t }) => {
  const match = content.match(/---PRESCRIPTION_START---\s*```json\s*([\s\S]*?)\s*```\s*---PRESCRIPTION_END---/);
  if (!match) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-3xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-dark-border text-sm leading-relaxed">
        <MarkdownRenderer content={content} />
      </div>
    );
  }
  let data: any = null;
  try { data = JSON.parse(match[1]); } catch { return null; }

  const drugs: any[] = data.drugs || [];
  const ar = (data.language || 'ar') === 'ar';

  return (
    <div className="w-full bg-white dark:bg-dark-card rounded-2xl border border-primary/20 shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-teal-600 px-4 py-3">
        <p className="text-white font-black text-sm">
          {ar ? '🩺 وصفة طبية' : '🩺 Prescription'}
        </p>
        {data.patientName && (
          <p className="text-white/80 text-xs mt-0.5">
            {ar ? 'المريض: ' : 'Patient: '}{data.patientName}
          </p>
        )}
      </div>

      {/* Drugs list */}
      <div className="divide-y divide-slate-100 dark:divide-dark-border">
        {drugs.map((drug: any, i: number) => (
          <div key={i} className="px-4 py-3">
            <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{drug.name}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {drug.dose && (
                <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  {drug.dose}
                </span>
              )}
              {drug.frequency && (
                <span className="text-[11px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full">
                  {drug.frequency}
                </span>
              )}
              {drug.duration && (
                <span className="text-[11px] bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                  {drug.duration}
                </span>
              )}
            </div>
            {drug.notes && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{drug.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      {data.notes && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800">
          <p className="text-[11px] text-amber-700 dark:text-amber-300">{data.notes}</p>
        </div>
      )}
    </div>
  );
};
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
  contextMedicine?: Medicine | null; // الدواء اللي المستخدم شايفه
}

const parsePrescriptionJson = (content: string): Omit<PrescriptionData, 'id'> | null => {
    const match = content.match(/---PRESCRIPTION_START---\s*```json\s*([\s\S]*?)\s*```\s*---PRESCRIPTION_END---/);
    if (!match || !match[1]) return null;
    try { return JSON.parse(match[1]); } 
    catch (e) { return null; }
};

// Quick suggestion chips حسب الـ context
const getQuickChips = (language: Language, medicine?: Medicine | null) => {
  const ar = language === 'ar';
  if (medicine) {
    const name = medicine['Trade Name'];
    return [
      { label: ar ? '⚠️ تعاملات دوائية' : '⚠️ Drug Interactions', prompt: ar ? `ما هي التعاملات الدوائية المهمة لـ ${name}؟` : `What are the important drug interactions of ${name}?` },
      { label: ar ? '💊 الجرعة الصحيحة' : '💊 Correct Dose', prompt: ar ? `ما هي الجرعة الصحيحة والطريقة المثلى لاستخدام ${name}؟` : `What is the correct dosage and optimal use of ${name}?` },
      { label: ar ? '🤰 حمل وإرضاع' : '🤰 Pregnancy', prompt: ar ? `هل ${name} آمن أثناء الحمل والإرضاع؟` : `Is ${name} safe during pregnancy and breastfeeding?` },
      { label: ar ? '👶 جرعة أطفال' : '👶 Pediatric Dose', prompt: ar ? `ما هي جرعة ${name} للأطفال؟` : `What is the pediatric dose of ${name}?` },
      { label: ar ? '🔄 بدائل' : '🔄 Alternatives', prompt: ar ? `ما هي أفضل البدائل لـ ${name}؟` : `What are the best alternatives to ${name}?` },
      { label: ar ? '🚫 موانع الاستخدام' : '🚫 Contraindications', prompt: ar ? `ما هي موانع استخدام ${name}؟` : `What are the contraindications of ${name}?` },
    ];
  }
  return [
    { label: ar ? '💊 وصفة طبية' : '💊 Write Prescription', prompt: ar ? 'أريد كتابة وصفة طبية' : 'I want to write a prescription' },
    { label: ar ? '⚖️ مقارنة أدوية' : '⚖️ Compare Drugs', prompt: ar ? 'قارن بين دواءين' : 'Compare two medications' },
    { label: ar ? '🔍 بروتوكول علاج' : '🔍 Treatment Protocol', prompt: ar ? 'ما هو بروتوكول علاج' : 'What is the treatment protocol for' },
    { label: ar ? '💉 جرعة الكلى' : '💉 Renal Dose', prompt: ar ? 'جرعة الدواء في قصور الكلى' : 'Drug dose in renal impairment' },
  ];
};

const ClinicalAssistantView: React.FC<ClinicalAssistantViewProps> = ({
  t, language, allMedicines, insuranceData, clinicalGuidelines,
  onSavePrescription, chatHistory, setChatHistory, contextMedicine
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiAvailable = isAIAvailable();
  const ar = language === 'ar';

  useEffect(() => {
    if (chatHistory.length === 0) {
      const welcome = contextMedicine
        ? (ar 
            ? `مرحباً! 👋 أنا **Easy Drug AI**، مساعدك السريري المتخصص.\n\nأرى أنك تتصفح **${contextMedicine['Trade Name']}** (${contextMedicine['Scientific Name']})\n\nيمكنني مساعدتك في الجرعات، التعاملات الدوائية، موانع الاستخدام، والبدائل. اختر سؤالاً سريعاً أو اكتب سؤالك:`
            : `Hello! 👋 I'm **Easy Drug AI**, your clinical specialist.\n\nI see you're viewing **${contextMedicine['Trade Name']}** (${contextMedicine['Scientific Name']})\n\nI can help with dosing, drug interactions, contraindications, and alternatives. Pick a quick question or type yours:`)
        : (ar
            ? `مرحباً! 👋 أنا **Easy Drug AI**\n\nمساعدك السريري المتخصص بأدوية المملكة العربية السعودية 🇸🇦\n\nأستطيع مساعدتك في:\n• 💊 الجرعات والتعاملات الدوائية\n• 📋 كتابة الوصفات الطبية\n• 🏥 بروتوكولات العلاج السعودية\n• ⚕️ الأدوية المغطاة بالتأمين\n\nاسألني أي سؤال سريري:`
            : `Hello! 👋 I'm **Easy Drug AI**\n\nYour clinical specialist for Saudi Arabian medications 🇸🇦\n\nI can help with:\n• 💊 Dosing & drug interactions\n• 📋 Writing prescriptions\n• 🏥 Saudi treatment protocols\n• ⚕️ Insurance-covered medications\n\nAsk me any clinical question:`);
      setChatHistory([{ role: 'model', parts: [{ text: welcome }] }]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    description: 'Search the Saudi medicine database',
    parameters: {
      type: Type.OBJECT,
      description: 'Search the Easy Drug drug database',
      properties: {
        tradeName: { type: Type.STRING, description: 'Trade name of the drug' },
        scientificName: { type: Type.STRING, description: 'Scientific/generic name' }
      }
    }
  };

  const searchDatabase = useCallback((args: { tradeName?: string; scientificName?: string }) => {
    let results = [...allMedicines];
    if (args.tradeName) results = results.filter(m => String(m['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    if (args.scientificName) results = results.filter(m => String(m['Scientific Name']).toLowerCase().includes(args.scientificName!.toLowerCase()));
    if (results.length === 0) return { count: 0, status: 'NO_MATCH', message: 'Not found locally. Use your medical knowledge.' };
    return {
      count: results.length,
      results: results.slice(0, 8).map(r => ({
        tradeName: r['Trade Name'], scientificName: r['Scientific Name'],
        price: r['Public price'], strength: `${r.Strength} ${r.StrengthUnit}`,
        form: r.PharmaceuticalForm, legal: r['Legal Status'],
        manufacturer: r['Manufacture Name']
      }))
    };
  }, [allMedicines]);

  const buildSystemPrompt = () => {
    const conditionList = Object.keys(clinicalGuidelines || {}).slice(0, 30).join(', ');
    const contextDrugInfo = contextMedicine 
      ? `\n\nCURRENT DRUG CONTEXT - User is viewing:\nTrade Name: ${contextMedicine['Trade Name']}\nScientific Name: ${contextMedicine['Scientific Name']}\nStrength: ${contextMedicine.Strength} ${contextMedicine.StrengthUnit}\nForm: ${contextMedicine.PharmaceuticalForm}\nLegal Status: ${contextMedicine['Legal Status']}\nPrice: ${contextMedicine['Public price']} SAR\nManufacturer: ${contextMedicine['Manufacture Name']}`
      : '';

    return `You are Easy Drug AI, a Senior Clinical Pharmacist & Consultant Physician with 20+ years in Saudi Arabia.

## LANGUAGE RULE (HIGHEST PRIORITY):
- Detect the language of each user message automatically
- Arabic message → respond in Arabic, but keep medical terms in English (e.g. "**Contraindicated** في الحمل", "**500mg BID**")
- English message → respond in English
- If user says "رد عربي" or "reply in English" → follow immediately and maintain it
- NEVER ignore this rule

## STRICT RULES:
- **Answer immediately** - NEVER: "بالتأكيد"، "Certainly!"، "Sure!"، "Great question!"
- **Bold** all critical information
- ⚠️ serious warnings | ✅ positive info | ❌ contraindications | 💊 dosing
- Dosing: amount + frequency + duration + renal/hepatic adjustments
- Interactions: classify (major🔴/moderate🟡/minor🟢) + mechanism + alternative
- For prescriptions: JSON between ---PRESCRIPTION_START--- and ---PRESCRIPTION_END---

## Database:
Use searchDatabase for Saudi drug availability and pricing.
${contextDrugInfo}

## Clinical Guidelines Available:
${conditionList || 'Saudi MOH standard protocols'}`;
  };

  const handleSend = useCallback(async (input?: string) => {
    const currentInput = (input || userInput).trim();
    if (!currentInput || isLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: [{ text: currentInput }] }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      const tools: Tool[] = [{ functionDeclarations: [searchDatabaseTool] }];
      const finalResponse = await runAIChat(newHistory, buildSystemPrompt(), tools, { searchDatabase }, 'gemini-3-pro-preview');
      const parts = finalResponse?.candidates?.[0]?.content?.parts;

      if (parts?.length > 0) {
        const sanitized = sanitizeParts(parts);
        setChatHistory(prev => [...prev, { role: 'model', parts: sanitized }]);
        const prescText = sanitized.find(p => 'text' in p && p.text?.includes('---PRESCRIPTION_START---'))?.text;
        if (prescText) {
          const parsed = parsePrescriptionJson(prescText);
          if (parsed) onSavePrescription({ ...parsed, id: `p-${Date.now()}` });
        }
      } else {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: t('geminiError') }] }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: t('geminiError') }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, language, contextMedicine]);

  const chips = getQuickChips(language, contextMedicine);
  const showChips = chatHistory.length <= 1 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg">

      {/* Context badge لما يكون في سياق دواء */}
      {contextMedicine && (
        <div className="mx-4 mt-2 flex items-center gap-2 bg-primary/10 dark:bg-primary/20 rounded-2xl px-3 py-2 border border-primary/20">
          <span className="text-primary text-lg">💊</span>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-primary truncate">{contextMedicine['Trade Name']}</p>
            <p className="text-[9px] text-primary/60 truncate">{contextMedicine['Scientific Name']}</p>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-grow overflow-y-auto px-4 py-3 space-y-3">
        {!aiAvailable && (
          <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <p className="text-2xl mb-2">🔑</p>
            <h3 className="font-black text-amber-800 dark:text-amber-200 mb-1">{t('aiUnavailableTitle')}</h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">{t('aiUnavailableMessage')}</p>
          </div>
        )}

        {aiAvailable && chatHistory.map((msg, index) => {
          const textContent = msg.parts?.find(p => 'text' in p && p.text)?.text;
          const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
          const isUser = msg.role === 'user';

          return (
            <div key={index} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-[11px]">AI</span>
                </div>
              )}
              <div className={`max-w-[85%] ${isUser
                ? 'bg-primary text-white rounded-3xl rounded-br-sm px-4 py-3 shadow-md shadow-primary/20'
                : isPrescription
                  ? 'w-full'
                  : 'bg-white dark:bg-dark-card rounded-3xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-dark-border'
              }`}>
                {isPrescription
                  ? <InlinePrescriptionCard content={textContent!} t={t} />
                  : <div className="text-sm leading-relaxed">
                      <MarkdownRenderer content={textContent || ''} />
                    </div>
                }
              </div>
            </div>
          );
        })}

        {/* Quick chips */}
        {showChips && aiAvailable && (
          <div className="flex flex-wrap gap-2 pt-1">
            {chips.map((chip, i) => {
              const emojiMatch = chip.label.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u);
              const emoji = emojiMatch ? emojiMatch[0].trim() : '';
              const text = emoji ? chip.label.replace(emojiMatch[0], '') : chip.label;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(chip.prompt)}
                  className="flex items-center gap-1.5 text-[11px] font-bold bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 px-3 py-2 rounded-2xl active:scale-95 transition-all hover:border-primary hover:text-primary shadow-sm"
                >
                  {emoji && (
                    <span style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif', fontSize: '14px', lineHeight: 1 }}>
                      {emoji}
                    </span>
                  )}
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        )}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px]">AI</span>
            </div>
            <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-3xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-dark-border flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex-shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={ar ? 'اسألني أي سؤال سريري...' : 'Ask any clinical question...'}
            className="flex-grow bg-transparent outline-none text-sm resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 px-2 py-1 max-h-32"
            rows={1}
            disabled={isLoading || !aiAvailable}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !userInput.trim() || !aiAvailable}
            className="flex-shrink-0 w-9 h-9 bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-700 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md shadow-primary/30 disabled:shadow-none"
          >
            <svg className="w-4 h-4 text-white rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[9px] text-slate-300 dark:text-slate-600 mt-1.5 font-medium">
          {ar ? 'Easy Drug AI · للاستخدام السريري فقط' : 'Easy Drug AI · For clinical use only'}
        </p>
      </div>
    </div>
  );
};

export default ClinicalAssistantView;
