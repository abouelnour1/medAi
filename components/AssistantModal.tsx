import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Medicine, ChatMessage, SerializablePart, TFunction, Language } from '../types';
import { runAIChat, isAIAvailable, sanitizeParts } from '../geminiService';
import ClearIcon from './icons/ClearIcon';
import CameraIcon from './icons/CameraIcon';

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// ── helpers ──────────────────────────────────────────────────────────
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// ── props ─────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onSaveAndClose: () => void;
  t: TFunction;
  language: Language;
  allMedicines: Medicine[];
  user: { id: string; role?: string; displayName?: string } | null;
  contextMedicine?: Medicine | null;
  initialHistory?: ChatMessage[];
  onOpenHistory?: () => void;
}

const AssistantModal: React.FC<Props> = ({
  isOpen, onSaveAndClose, t, language, allMedicines, user,
  contextMedicine, initialHistory, onOpenHistory
}) => {
  const ar = language === 'ar';
  const [chatHistory, setChatHistory]   = useState<ChatMessage[]>([]);
  const [userInput, setUserInput]       = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ blob: Blob; preview: string; mimeType: string } | null>(null);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = isAIAvailable();

  // restore conversation
  useEffect(() => {
    if (isOpen) {
      if (initialHistory && initialHistory.length > 0) {
        setChatHistory(initialHistory);
      } else if (chatHistory.length === 0) {
        // welcome
        const welcome = contextMedicine
          ? (ar ? `مرحباً! يمكنك سؤالي عن **${contextMedicine['Trade Name']}** أو أي دواء آخر.` : `Hello! Ask me about **${contextMedicine['Trade Name']}** or any medicine.`)
          : (ar ? 'مرحباً! أنا مساعدك الصيدلاني. اسأل عن أي دواء.' : 'Hello! I\'m your pharmacy assistant. Ask about any medicine.');
        setChatHistory([{ role: 'model', parts: [{ text: welcome }] }]);
      }
    }
  }, [isOpen, initialHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // ── searchDatabase tool ──────────────────────────────────────────
  const searchDatabase = useCallback((args: any) => {
    const q = String(args?.query || '').toLowerCase().trim();
    if (!q) return { results: [], message: 'No query provided' };
    let results = [...allMedicines];
    if (args?.legalStatus === 'OTC') results = results.filter(m => m['Legal Status'] !== 'Prescription');
    if (args?.legalStatus === 'Rx')  results = results.filter(m => m['Legal Status'] === 'Prescription');
    results = results.filter(m =>
      String(m['Trade Name'] || '').toLowerCase().includes(q) ||
      String(m['Scientific Name'] || '').toLowerCase().includes(q) ||
      String(m['Manufacture Name'] || '').toLowerCase().includes(q)
    );
    return {
      count: results.length,
      results: results.slice(0, 8).map(r => ({
        tradeName: r['Trade Name'],
        scientificName: r['Scientific Name'],
        price: r['Public price'],
        form: r.PharmaceuticalForm,
        strength: `${r.Strength} ${r.StrengthUnit}`,
        manufacturer: String(r['Manufacture Name']),
        legalStatus: r['Legal Status'],
      }))
    };
  }, [allMedicines]);

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    description: 'Finds drug information in the Saudi database. MANDATORY to use if the user mentions any medication name.',
    parameters: {
      type: 'object',
      properties: {
        query:       { type: 'string', description: 'Drug name (trade or scientific) or manufacturer' },
        legalStatus: { type: 'string', enum: ['OTC', 'Rx', 'any'], description: 'Filter by legal status' }
      },
      required: ['query']
    }
  };

  // ── send message ─────────────────────────────────────────────────
  const handleSend = useCallback(async (overrideInput?: string) => {
    if (isLoading) return;
    const currentInput = (overrideInput ?? userInput).trim();
    if (!currentInput && !uploadedImage) return;

    const userParts: SerializablePart[] = [];
    if (uploadedImage) {
      try {
        const b64 = await blobToBase64(uploadedImage.blob);
        userParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: b64 } });
      } catch {}
    }
    if (currentInput) userParts.push({ text: currentInput });

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: userParts }];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);
    setIsLoading(true);

    // context
    let ctxInfo = '';
    if (contextMedicine) {
      ctxInfo = `\n[CONTEXT: ${contextMedicine['Trade Name']} | ${contextMedicine['Scientific Name']} | ${contextMedicine['Public price']} SAR | ${contextMedicine.PharmaceuticalForm}]`;
    }

    const systemInstruction = `You are PharmaSource AI — Senior Clinical Pharmacist in Saudi Arabia.

## RULES:
1. LANGUAGE: Match the user's language exactly. Arabic → Arabic (keep medical terms in English: BID, TID, mg, etc). English → English. Never mix.
2. DATABASE: Always call searchDatabase when user mentions ANY medicine name before answering.
3. FORMAT: Use markdown. Keep responses concise and clinically useful.
4. PRICING: Always mention SAR prices from database results.
5. Never invent drug data — only use database results.
${ctxInfo}`;

    try {
      const response = await runAIChat(
        newHistory,
        systemInstruction,
        [{ functionDeclarations: [searchDatabaseTool] }],
        { searchDatabase }
      );

      const parts = response?.candidates?.[0]?.content?.parts;
      if (parts && parts.length > 0) {
        const clean = sanitizeParts(parts);
        setChatHistory(prev => [...prev, { role: 'model', parts: clean }]);
      } else {
        throw new Error('empty_response');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      let errText: string;

      if (msg.includes('API_KEY') || msg.includes('API key')) {
        errText = ar
          ? '⚠️ مفتاح الـ API غير مضبوط على Vercel. أضف VITE_API_KEY في Environment Variables.'
          : '⚠️ API key not configured on Vercel. Add VITE_API_KEY in Environment Variables.';
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
        errText = ar ? '⚠️ لا يوجد اتصال بالإنترنت.' : '⚠️ No internet connection.';
      } else if (msg.includes('empty_response')) {
        errText = ar ? '⚠️ لم يرد الذكاء الاصطناعي. حاول مرة أخرى.' : '⚠️ No response from AI. Try again.';
      } else if (msg.includes('429') || msg.includes('quota')) {
        errText = ar ? '⚠️ تم تجاوز الحد اليومي للطلبات. حاول لاحقاً.' : '⚠️ Daily quota exceeded. Try later.';
      } else {
        errText = ar
          ? `⚠️ خطأ: ${msg.slice(0, 120) || 'غير معروف'}. حاول مرة أخرى.`
          : `⚠️ Error: ${msg.slice(0, 120) || 'Unknown'}. Try again.`;
      }

      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: errText }] }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, searchDatabase, uploadedImage, contextMedicine, language, ar]);

  const handleClear = () => {
    setChatHistory([]);
    setUserInput('');
    setUploadedImage(null);
  };

  if (!isOpen) return null;

  // ── render ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-slate-900 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-sm">PharmaSource AI</h2>
            <p className="text-[9px] text-slate-400 font-medium">
              {user?.role === 'admin'
                ? (ar ? '👑 أدمن — غير محدود' : '👑 Admin — Unlimited')
                : user
                  ? (() => {
                      const today = new Date().toISOString().split('T')[0];
                      const limit = user.customAiLimit ?? 3;
                      const used = user.lastRequestDate === today ? (user.aiRequestCount || 0) : 0;
                      const remaining = Math.max(0, limit - used);
                      return ar ? `${remaining}/${limit} طلب متبقي اليوم` : `${remaining}/${limit} requests left today`;
                    })()
                  : (ar ? 'سجل دخول للاستخدام' : 'Login to use')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpenHistory && (
            <button onClick={onOpenHistory} className="p-2 text-slate-400 hover:text-primary rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
          )}
          <button onClick={handleClear} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
          <button onClick={onSaveAndClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <ClearIcon />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {chatHistory.map((msg, i) => {
          if (msg.role !== 'user' && msg.role !== 'model') return null;
          const textPart = msg.parts.find((p: any) => p.text);
          const imgPart  = msg.parts.find((p: any) => p.inlineData);
          if (!textPart && !imgPart) return null;
          const isUser = msg.role === 'user';

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700'
              }`}>
                {imgPart && (
                  <img src={`data:${imgPart.inlineData?.mimeType};base64,${imgPart.inlineData?.data}`}
                    className="max-w-full rounded-lg mb-2 max-h-48 object-contain" alt="uploaded" />
                )}
                {textPart && (
                  <div className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: String(textPart.text)
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^#{1,3}\s(.+)$/gm, '<strong class="block mb-1">$1</strong>')
                        .replace(/^[-•]\s(.+)$/gm, '• $1')
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <footer className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        {uploadedImage && (
          <div className="relative w-10 h-10 mb-2 rounded-lg overflow-hidden border border-primary shadow">
            <img src={uploadedImage.preview} className="w-full h-full object-cover" alt="" />
            <button onClick={() => setUploadedImage(null)}
              className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md">
              <ClearIcon />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input type="file" accept="image/*" ref={fileInputRef}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) setUploadedImage({ blob: f, preview: URL.createObjectURL(f), mimeType: f.type });
              e.target.value = '';
            }}
            className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-primary transition-colors flex-shrink-0">
            <div className="w-4 h-4"><CameraIcon /></div>
          </button>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={ar ? 'اسأل عن أي دواء...' : 'Ask about any medicine...'}
            disabled={!aiAvailable}
            rows={1}
            className="flex-grow p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm min-h-[40px] max-h-28 focus:border-primary transition-all resize-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!userInput.trim() && !uploadedImage) || !aiAvailable}
            className="p-2.5 bg-primary text-white rounded-xl shadow-md active:scale-95 disabled:opacity-40 transition-all flex-shrink-0">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AssistantModal;
