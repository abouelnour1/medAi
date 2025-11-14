

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FunctionDeclaration, Type, Part, Tool } from '@google/genai';
import { Medicine, TFunction, Language, ChatMessage, Recommendation, ProductSuggestion } from '../types';
import { TranslationKeys } from '../translations';
import AssistantIcon from './icons/AssistantIcon';
import ClearIcon from './icons/ClearIcon';
import MarkdownRenderer from './MarkdownRenderer';
import PrescriptionView from './PrescriptionView';
import { runAIChat, isAIAvailable } from '../geminiService';
import RecommendationCard from './RecommendationCard';

interface AssistantModalProps {
  isOpen: boolean;
  onSaveAndClose: (history: ChatMessage[]) => void;
  contextMedicine: Medicine | null;
  allMedicines: Medicine[];
  favoriteMedicines: Medicine[];
  initialPrompt: string;
  initialHistory?: ChatMessage[];
  t: TFunction;
  language: Language;
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

const parseRecommendations = (text: string): { recommendations: Recommendation[], remainingText: string } => {
  const recommendations: Recommendation[] = [];
  const recommendationRegex = /<recommendation>([\s\S]*?)<\/recommendation>/g;
  
  const extractField = (content: string, field: string): string => {
    const regex = new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  let remainingText = text.replace(recommendationRegex, (match, recommendationContent) => {
    const productsRegex = /<products>([\s\S]*?)<\/products>/g;
    const productsContentMatch = recommendationContent.match(productsRegex);
    const products: ProductSuggestion[] = [];

    if (productsContentMatch) {
      const productsContent = productsContentMatch[0];
      const productRegex = /<product>([\s\S]*?)<\/product>/g;
      productsContent.replace(productRegex, (productMatch, productContent) => {
        products.push({
          name: extractField(productContent, 'name'),
          concentration: extractField(productContent, 'concentration'),
          price: extractField(productContent, 'price'),
          selling_point: extractField(productContent, 'selling_point'),
        });
        return ''; // remove from string
      });
    }

    recommendations.push({
      category: extractField(recommendationContent, 'category'),
      rationale: extractField(recommendationContent, 'rationale'),
      products: products,
    });

    return ''; // Remove the parsed recommendation from the text
  }).trim();

  return { recommendations, remainingText };
};


const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onSaveAndClose, contextMedicine, allMedicines, favoriteMedicines, initialPrompt, initialHistory, t, language }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ blob: Blob, preview: string, mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrescriptionMode, setIsPrescriptionMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiAvailable = isAIAvailable();

  // This ref will hold the latest version of the handleSendMessage function.
  // It's used to break the dependency cycle in the initialization useEffect.
  const handleSendMessageRef = useRef<((overrideInput?: string) => Promise<void>) | null>(null);

  const searchDatabaseTool: FunctionDeclaration = {
    name: 'searchDatabase',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches the database for both medicines and supplements matching various criteria like name, manufacturer, price, product type, etc. Can filter results based on multiple conditions.',
      properties: {
        tradeName: { type: Type.STRING, description: 'The trade name of the drug or supplement.' },
        scientificName: { type: Type.STRING, description: 'The scientific (active ingredient) name of the drug or supplement.' },
        pharmaceuticalForm: { type: Type.STRING, description: 'The pharmaceutical form (e.g., Tablet, Capsule, Syrup).' },
        manufacturer: { type: Type.STRING, description: 'The name of the manufacturing company.' },
        marketingCompany: { type: Type.STRING, description: 'The name of the marketing company or main agent.' },
        minPrice: { type: Type.NUMBER, description: 'The minimum public price.' },
        maxPrice: { type: Type.NUMBER, description: 'The maximum public price.' },
        legalStatus: { type: Type.STRING, description: "The legal status, either 'OTC' or 'Prescription'." },
        productType: { type: Type.STRING, description: "The type of product, either 'medicine' (for 'Human' type) or 'supplement'." },
      },
    },
  };

  const searchDatabase = useCallback((args: {
    tradeName?: string;
    scientificName?: string;
    pharmaceuticalForm?: string;
    manufacturer?: string;
    marketingCompany?: string;
    minPrice?: number;
    maxPrice?: number;
    legalStatus?: string;
    productType?: string;
  }) => {
    let results = [...allMedicines];

    if (args.productType) {
        const typeToFilter = args.productType.toLowerCase();
        if (typeToFilter === 'medicine') {
            results = results.filter(med => String(med['Product type']).toLowerCase() === 'human');
        } else if (typeToFilter === 'supplement') {
            results = results.filter(med => String(med['Product type']).toLowerCase() === 'supplement');
        }
    }

    if (args.tradeName) {
        results = results.filter(med => String(med['Trade Name']).toLowerCase().includes(args.tradeName!.toLowerCase()));
    }
    if (args.scientificName) {
        results = results.filter(med => String(med['Scientific Name']).toLowerCase().includes(args.scientificName!.toLowerCase()));
    }
    if (args.pharmaceuticalForm) {
        results = results.filter(med => String(med.PharmaceuticalForm).toLowerCase().includes(args.pharmaceuticalForm!.toLowerCase()));
    }
    if (args.manufacturer) {
        results = results.filter(med => String(med['Manufacture Name']).toLowerCase().includes(args.manufacturer!.toLowerCase()));
    }
    if (args.marketingCompany) {
        results = results.filter(med => 
            String(med['Marketing Company']).toLowerCase().includes(args.marketingCompany!.toLowerCase()) ||
            String(med['Main Agent']).toLowerCase().includes(args.marketingCompany!.toLowerCase())
        );
    }
    if (typeof args.minPrice === 'number') {
        results = results.filter(med => {
            const price = parseFloat(med['Public price']);
            return !isNaN(price) && price >= args.minPrice!;
        });
    }
    if (typeof args.maxPrice === 'number') {
        results = results.filter(med => {
            const price = parseFloat(med['Public price']);
            return !isNaN(price) && price <= args.maxPrice!;
        });
    }
    if (args.legalStatus) {
        results = results.filter(med => String(med['Legal Status']).toLowerCase() === args.legalStatus!.toLowerCase());
    }

    if (results.length === 0) {
        return { count: 0, message: 'No drugs found matching the specified criteria.' };
    }
    
    return {
        count: results.length,
        results: results.slice(0, 10).map(r => ({ // return top 10 results
            tradeName: r['Trade Name'],
            scientificName: r['Scientific Name'],
            price: r['Public price'],
            form: r.PharmaceuticalForm,
            strength: `${r.Strength} ${r.StrengthUnit}`.trim(),
            manufacturer: r['Manufacture Name'],
        }))
    };
  }, [allMedicines]);
  
  const findMedicinesByName = useCallback((name: string): Medicine[] => {
    if (!name || name.trim().length < 3) return [];
    const searchWords = name.toLowerCase().split(/\s+/).filter(Boolean);
    const searchTerm = searchWords.join(' ');
    
    const results = allMedicines.filter(m => {
        const tradeNameLower = m['Trade Name'].toLowerCase();
        const scientificNameLower = m['Scientific Name'].toLowerCase();

        // Check if all search words are present in either field
        const tradeNameMatch = searchWords.every(word => tradeNameLower.includes(word));
        const scientificNameMatch = searchWords.every(word => scientificNameLower.includes(word));
        return tradeNameMatch || scientificNameMatch;
    });

    results.sort((a, b) => {
        const aTradeName = a['Trade Name'].toLowerCase();
        const bTradeName = b['Trade Name'].toLowerCase();
        const aScientificName = a['Scientific Name'].toLowerCase();
        const bScientificName = b['Scientific Name'].toLowerCase();

        const aTradeStarts = aTradeName.startsWith(searchTerm);
        const bTradeStarts = bTradeName.startsWith(searchTerm);
        if (aTradeStarts && !bTradeStarts) return -1;
        if (!aTradeStarts && bTradeStarts) return 1;

        const aScientificStarts = aScientificName.startsWith(searchTerm);
        const bScientificStarts = bScientificName.startsWith(searchTerm);
        if (aScientificStarts && !bScientificStarts) return -1;
        if (!aScientificStarts && bScientificStarts) return 1;

        // If both or neither start with term, fallback to alphabetical on trade name
        return aTradeName.localeCompare(bTradeName);
    });
    return results;
  }, [allMedicines]);

  const findMedicinesSmarter = useCallback((name: string): { meds: Medicine[], matchedName: string } => {
    if (!name || name.trim().length < 2) return { meds: [], matchedName: '' };
    
    let meds = findMedicinesByName(name);
    let matchedName = name;
    
    // If no direct match, try removing words from the end
    if (meds.length === 0 && name.includes(' ')) {
        const words = name.split(/\s+/);
        for (let i = words.length - 1; i >= 1; i--) {
            const shorterName = words.slice(0, i).join(' ');
            if (shorterName.length < 2) continue;
            const currentMeds = findMedicinesByName(shorterName);
            if (currentMeds.length > 0) {
                meds = currentMeds;
                matchedName = shorterName;
                break;
            }
        }
    }
    
    return { meds, matchedName };
  }, [findMedicinesByName]);


  const tryLocalAnswer = useCallback((query: string, contextMed: Medicine | null): string | null => {
    const lowerQuery = query.toLowerCase().trim();

    if (contextMed) {
        const priceKeywords = [t('quickActionPrice').toLowerCase(), 'price', 'سعر', 'كم سعره', 'سعره'];
        const ingredientKeywords = [t('quickActionIngredient').toLowerCase(), 'ingredient', 'active ingredient', 'المادة الفعالة', 'مكونات'];

        if (priceKeywords.some(kw => lowerQuery.includes(kw))) {
            const price = parseFloat(contextMed['Public price']);
            return isNaN(price)
                ? t('localAnswerPriceNotFound', { name: contextMed['Trade Name'] })
                : t('localAnswerPrice', { name: contextMed['Trade Name'], price: price.toFixed(2) });
        }
        if (ingredientKeywords.some(kw => lowerQuery.includes(kw))) {
            return t('localAnswerScientificName', { name: contextMed['Trade Name'], ingredient: contextMed['Scientific Name'] });
        }

        const alternativesKeywords = [t('quickActionAlternatives').toLowerCase(), 'alternatives', 'بدائل'];
        if (alternativesKeywords.some(kw => lowerQuery.includes(kw))) {
            const priceSorter = (a: Medicine, b: Medicine) => parseFloat(a['Public price']) - parseFloat(b['Public price']);

            const direct = allMedicines
                .filter(m => m['Scientific Name'] === contextMed['Scientific Name'] && m.RegisterNumber !== contextMed.RegisterNumber)
                .sort(priceSorter);

            const therapeutic = allMedicines
                .filter(m => m.AtcCode1 && contextMed.AtcCode1 && m.AtcCode1 === contextMed.AtcCode1 && m['Scientific Name'] !== contextMed['Scientific Name'])
                .sort(priceSorter);

            let response = `**${t('alternativesFor', { name: contextMed['Trade Name'] })}**\n\n`;
            
            response += `### ${t('directAlternatives')}\n`;
            response += direct.length > 0
                ? direct.map(d => `* **${d['Trade Name']}**: ${d['Public price']} ${t('sar')}`).join('\n')
                : `_${t('noDirectAlternatives')}_`;

            response += `\n\n### ${t('therapeuticAlternatives')}\n`;
            response += therapeutic.length > 0
                ? therapeutic.map(d => `* **${d['Trade Name']}**: ${d['Public price']} ${t('sar')}`).join('\n')
                : `_${t('noTherapeuticAlternatives')}_`;

            return response;
        }
    }

    const findDrugName = (patterns: RegExp[]): string | null => {
        for (const pattern of patterns) {
            const match = lowerQuery.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return null;
    };
    
    let drugName: string | null;

    const pricePatterns = [/(?:price of|how much is|سعر|بكم)\s+(.*)/i, /(.*)\s+(?:price|السعر)\??$/i];
    drugName = findDrugName(pricePatterns);
    if (drugName) {
        drugName = drugName.replace(/\?$/, '').trim();
        const { meds, matchedName } = findMedicinesSmarter(drugName);
        if (meds.length > 0) {
            if (meds.length === 1) {
                const med = meds[0];
                const price = parseFloat(med['Public price']);
                return isNaN(price) ? t('localAnswerPriceNotFound', { name: med['Trade Name'] }) : t('localAnswerPrice', { name: med['Trade Name'], price: price.toFixed(2) });
            } else {
                 const uniqueMeds = Array.from(new Map(meds.map(m => [m['Trade Name'], m])).values());
                 const priceList = uniqueMeds.map(med => {
                        const price = parseFloat(med['Public price']);
                        const priceString = isNaN(price) ? 'N/A' : `${price.toFixed(2)} ${t('sar')}`;
                        return `• ${med['Trade Name']}: ${priceString}`;
                    }).join('\n');
                const queryDrugName = matchedName.charAt(0).toUpperCase() + matchedName.slice(1);
                return t('localAnswerMultiplePrices', { name: queryDrugName, prices: priceList });
            }
        }
    }
    
    const ingredientPatterns = [/(?:active ingredient of|scientific name of|المادة الفعالة لـ|مكونات)\s+(.*)/i, /(.*)\s+(?:active ingredient|scientific name|المادة الفعالة)\??$/i];
    drugName = findDrugName(ingredientPatterns);
    if (drugName) {
        drugName = drugName.replace(/\?$/, '').trim();
        const { meds } = findMedicinesSmarter(drugName);
        if (meds.length > 0) {
            const bestMatch = meds.find(m => m['Trade Name'].toLowerCase().includes(drugName!.toLowerCase())) || meds[0];
            return t('localAnswerScientificName', { name: bestMatch['Trade Name'], ingredient: bestMatch['Scientific Name'] });
        }
    }

    const manufacturerPatterns = [/(?:who makes|manufacturer of|من يصنع|الشركة المصنعة لـ)\s+(.*)/i, /(.*)\s+(?:manufacturer|الشركة المصنعة)\??$/i];
    drugName = findDrugName(manufacturerPatterns);
    if (drugName) {
        drugName = drugName.replace(/\?$/, '').trim();
        const { meds } = findMedicinesSmarter(drugName);
        if (meds.length > 0) {
            const bestMatch = meds.find(m => m['Trade Name'].toLowerCase().includes(drugName!.toLowerCase())) || meds[0];
            return t('localAnswerManufacturer', { name: bestMatch['Trade Name'], manufacturer: bestMatch['Manufacture Name'] });
        }
    }

    return null;
  }, [t, findMedicinesSmarter, allMedicines]);

  const handleSendMessage = useCallback(async (overrideInput?: string) => {
    const currentInput = (overrideInput ?? userInput).trim();
    if ((!currentInput && !uploadedImage) || isLoading) return;

    const userParts: Part[] = [];
    if (uploadedImage) {
        const base64Data = await blobToBase64(uploadedImage.blob);
        userParts.push({ inlineData: { mimeType: uploadedImage.mimeType, data: base64Data } });
    }
    if (currentInput) {
        userParts.push({ text: currentInput });
    } else if (uploadedImage) {
        userParts.push({ text: t('analyzingImage') });
    }
    
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', parts: userParts }];
    setChatHistory(newHistory);
    setUserInput('');
    setUploadedImage(null);

    const localAnswer = tryLocalAnswer(currentInput, contextMedicine);
    if (localAnswer && !isPrescriptionMode) {
      setTimeout(() => {
          setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: localAnswer }] }]);
      }, 300);
      return;
    }
    
    setIsLoading(true);
    
    const favoriteMedicinesListAr = favoriteMedicines.length > 0
        ? favoriteMedicines.map(med => `- ${med['Trade Name']} (${med['Scientific Name']})`).join('\n')
        : 'لا توجد أدوية في المفضلة حالياً.';
        
    const favoriteMedicinesListEn = favoriteMedicines.length > 0
        ? favoriteMedicines.map(med => `- ${med['Trade Name']} (${med['Scientific Name']})`).join('\n')
        : 'No favorite medicines currently.';

    let systemInstructionAr = `أنت صيدلي سريري وخبير معلومات طبية على أعلى مستوى. جمهورك حصرياً من متخصصي الرعاية الصحية (أطباء وصيادلة) في المملكة العربية السعودية. يجب أن تكون إجاباتك دائمًا قائمة على الأدلة، احترافية، مفصلة، وموضوعية.

**التوجيهات الأساسية:**
1.  **الأدلة أولاً:** لأي معلومة سريرية، توصيات، آليات عمل، أو نصيحة علاجية، **يجب** عليك البحث والاستشهاد بمراجع طبية عالية الجودة ومعترف بها دوليًا.
2.  **المصادر المعتمدة:** أعطِ الأولوية للمعلومات من: UpToDate, Dynamedex, PubMed, NIH, NICE guidelines, وأدلة الممارسة السريرية الرئيسية (مثل من AHA, ADA, ESC). استخدم أداة \`googleSearch\` للعثور على هذه المعلومات.
3.  **الاستشهاد الإلزامي:** بعد كل إجابة تحتوي على معلومات سريرية، **يجب** عليك تضمين قسم "المراجع" في النهاية، يسرد عناوين URL للمصادر التي استخدمتها. يتم تزويدك بعناوين URL هذه في بيانات \`groundingChunks\` الوصفية من استدعاءات أداة \`googleSearch\`.

**منطق التفاعل والأدوات:**
-   **\`googleSearch\`:** استخدمها كأداتك الأساسية للبحث في الأسئلة السريرية والعثور على أدلة من المصادر المعتمدة.
-   **\`searchDatabase\`:** استخدم هذه الأداة خصيصًا عندما تحتاج إلى معلومات حول الأدوية المتوفرة في السوق السعودي (مثل الأسماء التجارية والأسعار) أو لتأكيد التفاصيل لوصفة طبية.
-   **قائمة المفضلة:** قدم المستخدم قائمة بأدويته المفضلة. عند تقديم توصيات لمنتجات معينة، أعطِ الأولوية لهذه القائمة إذا كانت مناسبة سريريًا، ولكن واجبك الأساسي هو تقديم أفضل توصية قائمة على الأدلة، بغض النظر عن هذه القائمة.
    - **قائمة الأدوية المفضلة للمستخدم:**
      ${favoriteMedicinesListAr}

**البيع المتقاطع والبيع الأعلى (يتطلب مبررًا سريريًا احترافيًا):**
-   عندما يُطلب منك البيع المتقاطع أو الأعلى، قدم مبررًا سريريًا عميقًا لكل اقتراح.
-   **اشرح الآلية:** فصل آلية العمل الدوائية أو الفسيولوجية للتوصية.
-   **قدم الأدلة:** لخص الأدلة السريرية التي تدعم استخدامه في السياق المحدد.
-   **مثال:** لمريض يتناول ستاتين، لا تقل فقط "اقترح CoQ10". اشرح: "تثبط الستاتينات إنزيم HMG-CoA reductase، والذي يمكن أن يقلل أيضًا من التخليق الداخلي لـ Coenzyme Q10. تشير بعض الدراسات القائمة على الملاحظة والتجارب الصغيرة إلى أن مكملات CoQ10 قد تساعد في تخفيف أعراض العضلات المرتبطة بالستاتين (SAMS)، على الرغم من أن بيانات التجارب العشوائية الكبيرة مختلطة. الجرعة المعتادة هي 100-200 مجم يوميًا. [اذكر المصادر]".
-   **قاعدة:** إذا كان المنتج الأساسي دواءً، فيجب أن تكون جميع الاقتراحات من المكملات الغذائية/الأعشاب.

**تنسيق الإجابة:**
-   استخدم لغة واضحة واحترافية.
-   نظم إجاباتك باستخدام عناوين markdown (مثل \`### آلية العمل\`، \`### الأدلة السريرية\`، \`### الجرعات\`).
-   لا تستخدم الرموز التعبيرية أو نبرة محادثة بشكل مفرط.
-   **دائمًا** اختتم بقسم "المراجع" إذا استخدمت \`googleSearch\`.`;

    let systemInstructionEn = `You are an expert-level clinical pharmacist and medical information specialist. Your audience is exclusively healthcare professionals (physicians, pharmacists) in Saudi Arabia. Your responses must always be evidence-based, professional, detailed, and objective.

**Core Directives:**
1.  **Evidence is Paramount:** For any clinical information, recommendations, mechanisms of action, or therapeutic advice, you **must** find and cite high-quality, internationally recognized medical references.
2.  **Approved Sources:** Prioritize information from: UpToDate, Dynamedex, PubMed, NIH, NICE guidelines, and major clinical practice guidelines (e.g., from AHA, ADA, ESC). Use the \`googleSearch\` tool to find this information.
3.  **Mandatory Citation:** After every response containing clinical information, you **must** include a "References" section at the end, listing the URLs of the sources you used. These URLs are provided to you in the \`groundingChunks\` metadata from your \`googleSearch\` tool calls.

**Interaction Logic & Tools:**
-   **\`googleSearch\`:** Use this as your primary tool to research clinical questions and find evidence from the approved sources.
-   **\`searchDatabase\`:** Use this tool specifically when you need information about drugs available in the Saudi market (e.g., trade names, prices) or to confirm details for a prescription.
-   **Favorites List:** The user has provided a list of their favorite medicines. When making recommendations for specific products, prioritize these if clinically appropriate, but your primary duty is to provide the best evidence-based recommendation, regardless of this list.
    - **User's Favorite Medicines:**
      ${favoriteMedicinesListEn}

**Cross-Selling & Upselling (Professional Rationale Required):**
-   When asked for cross-selling or upselling, provide a deep clinical rationale for each suggestion.
-   **Explain the Mechanism:** Detail the pharmacological or physiological reason for the recommendation.
-   **Provide the Evidence:** Summarize the clinical evidence supporting its use in the given context.
-   **Example:** For a patient on a statin, don't just say "suggest CoQ10". Explain: "Statins inhibit HMG-CoA reductase, which can also reduce the endogenous synthesis of Coenzyme Q10. Some observational studies and small trials suggest that CoQ10 supplementation may help mitigate statin-associated muscle symptoms (SAMS), although large RCT data is mixed. A typical dose is 100-200mg daily. [Cite sources]".
-   **Rule:** If the primary product is a medicine, all suggestions must be supplements/herbals.

**Response Format:**
-   Use clear, professional language.
-   Structure your answers with markdown headings (e.g., \`### Mechanism of Action\`, \`### Clinical Evidence\`, \`### Dosing\`).
-   Do not use emojis or an overly conversational tone.
-   **Always** end with the "References" section if you used \`googleSearch\`.`;


    const prescriptionSystemInstructionAr = `أنت مساعد ذكاء اصطناعي تقوم بدور طبيب في المملكة العربية السعودية، ومهمتك هي إنشاء وصفة طبية رسمية بتنسيق JSON.
- عند طلب المستخدم لوصفة، قم **فوراً** بإنشاء كائن JSON للوصفة، بدون أي خطوات تأكيد مسبقة.
- ابتكر بيانات واقعية لجميع الحقول المطلوبة (اسم مستشفى أو مجمع طبي مختلف في كل مرة، عنوان، أرقام تسجيل، بيانات طبيب ومريض، تشخيص). **مهم: استخدم تاريخ اليوم دائمًا للوصفة ما لم يحدد المستخدم تاريخًا آخر بشكل صريح.** يجب أن يكون التشخيص دائمًا باللغة الإنجليزية، وتعليمات الدواء تبدأ بالإنجليزية.
- استخدم أداة \`searchDatabase\` للعثور على تفاصيل الدواء المطلوب.
- يجب أن يحتوي جزء واحد من ردك على كائن JSON **فقط**، محاطاً بالعلامات ---PRESCRIPTION_START--- و ---PRESCRIPTION_END---.
- **بعد** كتلة الـ JSON، وفي جزء نصي منفصل، أضف رسالة بسيطة تطلب من المستخدم مراجعة الوصفة، مثل: "تفضل، هذه هي الوصفة الطبية. هل كل شيء صحيح، أم تود إجراء أي تعديل؟"
- إذا طلب المستخدم تعديلاً (مثلاً: "غير اسم المريض إلى ...")، قم بإعادة إنشاء كائن الـ JSON بالكامل مع التعديل المطلوب، ثم اسأله مجدداً للتأكيد.

---PRESCRIPTION_START---
\`\`\`json
{
  "hospitalName": "[اسم مستشفى مبتكر]",
  "hospitalAddress": "الرياض-النسيم-شارع الحسن بن ثابت",
  "crNumber": "141011212600",
  "taxNumber": "300044284600003",
  "licenseNumber": "4210",
  "patientName": "[اسم المريض]",
  "patientNameAr": "[اسم المريض بالعربية]",
  "patientId": "[رقم هوية مبتكر من 10 أرقام]",
  "patientAge": "[عمر مبتكر]",
  "patientGender": "[الجنس]",
  "fileNumber": "[رقم ملف مبتكر]",
  "date": "[التاريخ الحالي]",
  "doctorName": "[اسم طبيب مبتكر]",
  "doctorSpecialty": "[تخصص مناسب]",
  "policy": "Cash Customer",
  "insuranceCompany": "Cash Customer",
  "diagnosisCode": "[كود تشخيص مناسب]",
  "diagnosisDescription": "[وصف التشخيص باللغة الإنجليزية فقط]",
  "drugs": [
    {
      "code": "[كود مبتكر للدواء]",
      "genericName": "[الاسم العلمي للدواء/المادة الفعالة]",
      "tradeName": "[الاسم التجاري للدواء والتركيز]",
      "dosage": "[تعليمات الجرعة بالإنجليزية]",
      "usageMethod": "[تعليمات الاستخدام بالإنجليزية]",
      "usageMethodAr": "[تعليمات الاستخدام بالعربية]",
      "quantity": "[الكمية كرقم]"
    }
  ]
}
\`\`\`
---PRESCRIPTION_END---`;

    const prescriptionSystemInstructionEn = `You are an AI assistant acting as a medical doctor in Saudi Arabia, tasked with generating a formal medical prescription in JSON format.
- When a user requests a prescription, **immediately** generate the prescription JSON object, with no prior confirmation steps.
- Invent realistic data for all required fields (invent a different hospital/clinic name each time, address, registration numbers, doctor and patient details, diagnosis). **Important: Always use today's date for the prescription unless the user explicitly specifies a different date.** The diagnosis description must ALWAYS be in English, and dosage instructions should start in English.
- Use the \`searchDatabase\` tool to find details for the requested drug.
- One part of your response must contain **ONLY** the JSON object, wrapped with the markers ---PRESCRIPTION_START--- and ---PRESCRIPTION_END---.
- **After** the JSON block, in a separate text part, add a simple message asking the user to review it, for example: "Here is the prescription. Does everything look correct, or would you like any changes?"
- If the user requests a change (e.g., "Change the patient's name to..."), you must regenerate the entire JSON object with the requested change and ask for confirmation again.

---PRESCRIPTION_START---
\`\`\`json
{
  "hospitalName": "[Invented Hospital Name]",
  "hospitalAddress": "Riyadh-Naseem-Hassan Bin Thabet",
  "crNumber": "141011212600",
  "taxNumber": "300044284600003",
  "licenseNumber": "4210",
  "patientName": "[Patient Name]",
  "patientNameAr": "[Patient Name in Arabic]",
  "patientId": "[Invented 10-digit ID]",
  "patientAge": "[Invented Age]",
  "patientGender": "[Gender]",
  "fileNumber": "[Invented File Number]",
  "date": "[Current Date]",
  "doctorName": "[Invented Doctor Name]",
  "doctorSpecialty": "[Appropriate Specialty]",
  "policy": "Cash Customer",
  "insuranceCompany": "Cash Customer",
  "diagnosisCode": "[Appropriate Diagnosis Code]",
  "diagnosisDescription": "[Diagnosis description in ENGLISH ONLY]",
  "drugs": [
    {
      "code": "[Invented drug code]",
      "genericName": "[Generic/Active Ingredient drug name]",
      "tradeName": "[Trade drug name and strength]",
      "dosage": "[Dosage instructions in English]",
      "usageMethod": "[Usage instructions in English]",
      "usageMethodAr": "[Usage instructions in Arabic]",
      "quantity": "[Quantity as a number]"
    }
  ]
}
\`\`\`
---PRESCRIPTION_END---`;

    let systemInstruction;
    if (isPrescriptionMode) {
        systemInstruction = language === 'ar' ? prescriptionSystemInstructionAr : prescriptionSystemInstructionEn;
    } else {
        systemInstruction = language === 'ar' ? systemInstructionAr : systemInstructionEn;
    }

    try {
        const toolImplementations = { searchDatabase: searchDatabase };
        const tools: Tool[] = [{ functionDeclarations: [searchDatabaseTool] }, { googleSearch: {} }];
        const finalResponse = await runAIChat(newHistory, systemInstruction, tools, toolImplementations);
        const responsePartsFromApi = finalResponse?.candidates?.[0]?.content?.parts;

        if (responsePartsFromApi && responsePartsFromApi.length > 0) {
            const responseParts = [...responsePartsFromApi];
            const groundingChunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

            if (groundingChunks && groundingChunks.length > 0) {
                const sources = groundingChunks
                    .map((chunk: any) => chunk.web?.uri)
                    .filter(Boolean);

                if (sources.length > 0) {
                    const sourcesTitle = language === 'ar' ? 'المراجع' : 'References';
                    const sourcesText = `\n\n---\n**${sourcesTitle}:**\n` + sources.map((url: string) => `- ${url}`).join('\n');
                    
                    const textPart = responseParts.find(p => 'text' in p);

                    if (textPart && 'text' in textPart) {
                        // Append to existing text part
                        textPart.text = (textPart.text || '') + sourcesText;
                    } else {
                        // Or create a new part if none exists
                        responseParts.push({ text: sourcesText });
                    }
                }
            }
            setChatHistory(prev => [...prev, { role: 'model', parts: responseParts }]);
        } else {
            console.error("AI response is missing parts:", finalResponse);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
        }
    } catch (err) {
      console.error("AI service error:", err);
      if (err instanceof Error && err.message.includes('API_KEY is missing')) {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('aiUnavailableMessage')}] }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{text: t('geminiError')}] }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, chatHistory, contextMedicine, isPrescriptionMode, language, t, searchDatabase, tryLocalAnswer, allMedicines, uploadedImage, favoriteMedicines]);
  
  // This effect keeps the ref pointing to the latest version of the function.
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // This effect runs only when the modal is opened or the initial context changes.
  // It no longer depends on handleSendMessage, breaking the cycle.
  useEffect(() => {
    if (isOpen) {
        if (initialPrompt === '##PRESCRIPTION_MODE##') {
            setIsPrescriptionMode(true);
            setChatHistory([{ role: 'model', parts: [{ text: t('prescriptionAssistantWelcome') }] }]);
            setUserInput('');
        } else if (initialHistory && initialHistory.length > 0) {
            setIsPrescriptionMode(false);
            setChatHistory(initialHistory);
            setUserInput('');
        } else {
            setIsPrescriptionMode(false);
            const initialParts: Part[] = [];
            if (contextMedicine) {
                const ingredients = contextMedicine['Scientific Name'].split(',').map(s => s.trim());
                const strengths = String(contextMedicine.Strength).split(',').map(s => s.trim());
                const units = String(contextMedicine.StrengthUnit).split(',').map(s => s.trim());

                let formattedIngredients = ingredients.map((ing, index) => {
                    const s = strengths[index] || strengths[0] || '';
                    const u = units[index] || units[0] || '';
                    return `- ${ing}: ${s} ${u}`.trim();
                }).join('\n');
                
                const contextText = language === 'ar' ? 
                  `السياق: استعلام المستخدم بخصوص الدواء التالي:\n**${contextMedicine['Trade Name']}**\n**المواد الفعالة:**\n${formattedIngredients}\n\nابدأ المحادثة بسؤال كيف يمكنك المساعدة بخصوص هذا الدواء المحدد.` :
                  `Context: The user is querying about the following drug:\n**${contextMedicine['Trade Name']}**\n**Active Ingredients:**\n${formattedIngredients}\n\nStart the conversation by asking how you can help with this specific medicine.`;

                initialParts.push({ text: contextText });
            } else {
                initialParts.push({ text: t('assistantWelcomeMessage')});
            }
            setChatHistory([{ role: 'model', parts: initialParts }]);
            
            const isBarcodeScan = initialPrompt.includes('barcode') && initialPrompt.includes(language === 'ar' ? 'مسح' : 'scanned');
            if (isBarcodeScan) {
                // We call the function through the ref, which always has the latest version.
                setTimeout(() => {
                    if (handleSendMessageRef.current) {
                        handleSendMessageRef.current(initialPrompt);
                    }
                }, 100);
                setUserInput('');
            } else {
                setUserInput(initialPrompt || '');
            }
        }
      setUploadedImage(null);
    }
  }, [isOpen, contextMedicine, t, initialPrompt, initialHistory, language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);
  
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setUploadedImage({
            blob: file,
            preview: URL.createObjectURL(file),
            mimeType: file.type,
        });
    }
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleClose = () => {
    onSaveAndClose(chatHistory);
  };
  
  const handleQuickActionClick = (action: 'price' | 'ingredient' | 'alternatives' | 'usage' | 'sellingPoint' | 'howToSell' | 'upselling' | 'crossSelling') => {
    if (!contextMedicine) return;

    let promptText = '';
    switch (action) {
        case 'price':
            promptText = t('quickActionPrice');
            break;
        case 'ingredient':
            promptText = t('quickActionIngredient');
            break;
        case 'alternatives':
            promptText = t('quickActionAlternatives');
            break;
        case 'usage':
            promptText = t('promptUsage');
            break;
        case 'sellingPoint':
            promptText = t('quickActionSellingPoint');
            break;
        case 'howToSell':
            promptText = t('quickActionHowToSell');
            break;
        case 'upselling':
            promptText = t('quickActionUpselling');
            break;
        case 'crossSelling':
            promptText = t('quickActionCrossSelling');
            break;
    }
    setUserInput(promptText); // Visually update the input
    if (handleSendMessageRef.current) {
      handleSendMessageRef.current(promptText); // Immediately send the message
    }
  };

  const QuickActionButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-light-text dark:text-dark-text transition-colors"
    >
        {children}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-primary"><AssistantIcon /></span>
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{t('assistantModalTitle')}</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full text-light-text-secondary hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><ClearIcon/></button>
        </header>

        {/* Chat Body */}
        <div className="flex-grow p-3 space-y-3 overflow-y-auto">
          {!aiAvailable && (
            <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{t('aiUnavailableTitle')}</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{t('aiUnavailableMessage')}</p>
            </div>
          )}
          {aiAvailable && chatHistory.map((msg, index) => {
             const textContent = msg.parts.find(p => 'text' in p && p.text)?.text || '';
             const isPrescription = textContent?.includes('---PRESCRIPTION_START---');
             const { recommendations, remainingText } = isPrescription ? { recommendations: [], remainingText: '' } : parseRecommendations(textContent);

            return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary"><AssistantIcon /></div>}
                  <div className={`max-w-md rounded-2xl shadow-sm flex flex-col gap-2 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none p-3 w-fit' : `bg-gray-100 dark:bg-slate-700 text-light-text dark:text-dark-text rounded-bl-none ${isPrescription || recommendations.length > 0 ? 'p-0' : 'p-3'}`}`}>
                     { isPrescription ? (
                        <PrescriptionView content={textContent} t={t} />
                     ) : (
                        <>
                          {remainingText && (
                             <div 
                                className="text-sm prose prose-sm dark:prose-invert max-w-none p-3 ai-response-content"
                                style={{
                                    '--tw-prose-body': 'inherit',
                                    '--tw-prose-headings': 'inherit',
                                    '--tw-prose-bold': 'inherit',
                                    '--tw-prose-bullets': 'inherit',
                                    '--tw-prose-counters': 'inherit',
                                } as React.CSSProperties}
                            >
                                <MarkdownRenderer content={remainingText} />
                            </div>
                          )}
                          {recommendations.map((rec, recIndex) => (
                              <RecommendationCard key={recIndex} recommendation={rec} t={t} />
                          ))}
                         {msg.parts.filter(p => 'inlineData' in p).map((part, pIndex) => {
                            if ('inlineData' in part && part.inlineData) {
                                const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                                return <img key={pIndex} src={src} alt="User upload" className="max-w-xs rounded-lg" />
                            }
                            return null;
                         })}
                        </>
                     )}
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
        <footer className="p-3 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
            {contextMedicine && !isPrescriptionMode && aiAvailable && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('quickActions')}:</span>
                <QuickActionButton onClick={() => handleQuickActionClick('price')}>{t('quickActionPrice')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('ingredient')}>{t('quickActionIngredient')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('alternatives')}>{t('quickActionAlternatives')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('usage')}>{t('promptUsage')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('sellingPoint')}>{t('quickActionSellingPoint')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('howToSell')}>{t('quickActionHowToSell')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('upselling')}>{t('quickActionUpselling')}</QuickActionButton>
                <QuickActionButton onClick={() => handleQuickActionClick('crossSelling')}>{t('quickActionCrossSelling')}</QuickActionButton>
              </div>
            )}
            {uploadedImage && (
                 <div className="mb-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold mb-1">{t('imagePreview')}</p>
                        <img src={uploadedImage.preview} alt="upload preview" className="h-16 w-16 object-cover rounded"/>
                    </div>
                    <button onClick={() => setUploadedImage(null)} className="p-1 text-light-text-secondary hover:text-red-500 rounded-full"><ClearIcon/></button>
                 </div>
            )}
            <form onSubmit={e => {e.preventDefault(); handleSendMessage();}} className="flex items-center gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-light-text-secondary hover:text-primary dark:text-dark-text-secondary dark:hover:text-primary rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('uploadPrescription')} disabled={!aiAvailable}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={aiAvailable ? t('askGeminiPlaceholder') : t('aiUnavailableShort')}
                    className="flex-grow w-full p-2 bg-gray-100 dark:bg-slate-700 border-2 border-transparent focus:border-primary rounded-lg outline-none transition-colors resize-none"
                    rows={1}
                    disabled={isLoading || !aiAvailable}
                    aria-label={t('askGeminiPlaceholder')}
                />
                <button type="submit" disabled={isLoading || (!userInput && !uploadedImage) || !aiAvailable} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors">{t('ask')}</button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default AssistantModal;