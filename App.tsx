
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, 
  InsuranceSearchMode, Cosmetic, MilkProduct
} from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import MedicineDetail from './components/MedicineDetail';
import BottomNavBar from './components/BottomNavBar';
import FilterModal from './components/FilterModal';
import SortControls from './components/SortControls';
import FilterButton from './components/FilterButton';
import AlternativesView from './components/AlternativesView';
import FloatingAssistantButton from './components/FloatingAssistantButton';
import AssistantModal from './components/AssistantModal';
import AddDataView from './components/AddDataView';
import ChatHistoryView from './components/ChatHistoryView';
import InsuranceSearchView from './components/InsuranceSearchView';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import AddInsuranceDataView from './components/AddInsuranceDataView';
import CosmeticsView from './components/CosmeticsView';
import CosmeticDetail from './components/CosmeticDetail';
import AddCosmeticsDataView from './components/AddCosmeticsDataView';
import FavoritesView from './components/FavoritesView';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import MilkView from './components/MilkView';

// Auth Components
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';

// Icons
// Added missing icon imports for Admin, Moon, and Sun
import AdminIcon from './components/icons/AdminIcon';
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';

// Utils & Helpers
import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';
import { GoogleGenAI } from "@google/genai";
import { isAIAvailable } from './geminiService';

// Normalization functions
const normalizeMedicine = (item: any): Medicine => ({
  ...item,
  RegisterNumber: String(item.RegisterNumber || item.Id || Math.random()),
  "Public price": String(item["Public price"] || item.Price || '0'),
  "Trade Name": String(item["Trade Name"] || item.TradeName || ''),
  "Scientific Name": String(item["Scientific Name"] || item.ScientificName || ''),
  PharmaceuticalForm: String(item.PharmaceuticalForm || item.DoesageForm || ''),
  Strength: String(item.Strength || ''),
  StrengthUnit: String(item.StrengthUnit || ''),
  "Legal Status": String(item["Legal Status"] || item.LegalStatus || ''),
  "Product type": String(item["Product type"] || item.DrugType === 'Health' ? 'Supplement' : 'Human'),
  DrugType: String(item.DrugType || ''),
  "Manufacture Name": String(item["Manufacture Name"] || item.ManufacturerNameEN || ''),
  "Manufacture Country": String(item["Manufacture Country"] || item.ManufacturerCountry || ''),
  "Storage conditions": String(item["Storage conditions"] || item.StorageConditions || ''),
  "Storage Condition Arabic": String(item["Storage Condition Arabic"] || ''),
  "Main Agent": String(item["Main Agent"] || item.Agent || ''),
});

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3';

const App: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  // --- State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('language');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [view, setView] = useState<View>('search');
  
  // Data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [milkProducts, setMilkProducts] = useState<MilkProduct[]>([]);
  const [clinicalGuidelines, setClinicalGuidelines] = useState<any>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Availability Search
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [filters, setFilters] = useState<Filters>({
    productType: 'all',
    priceMin: '',
    priceMax: '',
    pharmaceuticalForm: '',
    manufactureName: [],
    legalStatus: '',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [forceSearch, setForceSearch] = useState(false);

  const [resultsLimit, setResultsLimit] = useState(20);
  const [cosmeticsLimit, setCosmeticsLimit] = useState(20);

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const [sourceMedicine, setSourceMedicine] = useState<Medicine | null>(null);
  const [alternativesResults, setAlternativesResults] = useState<{ direct: Medicine[], therapeutic: Medicine[] } | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Conversation[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('chat_history') || '[]');
      } catch { return []; }
  });
  const [currentChatHistory, setCurrentChatHistory] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');

  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const loadData = async () => {
        try {
            let medicinesData = await getItem<Medicine[]>(MEDICINES_CACHE_KEY);
            let cosmeticsData = await getItem<Cosmetic[]>(COSMETICS_CACHE_KEY);

            if (!medicinesData) {
                const { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } = await import('./data/data');
                medicinesData = [...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW].map(normalizeMedicine);
                await setItem(MEDICINES_CACHE_KEY, medicinesData);
            }
            
            if (!cosmeticsData) {
                const { INITIAL_COSMETICS_DATA } = await import('./data/cosmetics-data');
                cosmeticsData = INITIAL_COSMETICS_DATA;
                await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
            }

            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            const { CUSTOM_INSURANCE_DATA } = await import('./data/custom-insurance-data');
            const { INITIAL_GUIDELINES_DATA } = await import('./data/guidelines-data');
            const { INITIAL_MILK_DATA } = await import('./data/milk-data');
            const { CUSTOM_MILK_DATA } = await import('./data/custom-milk-data');

            setMedicines(medicinesData || []);
            setCosmetics(cosmeticsData || []);
            setMilkProducts([...(INITIAL_MILK_DATA || []), ...(CUSTOM_MILK_DATA || [])]);
            setInsuranceData([...INITIAL_INSURANCE_DATA, ...CUSTOM_INSURANCE_DATA]);
            setClinicalGuidelines(INITIAL_GUIDELINES_DATA);
            setIsDataLoaded(true);

            if (!FIREBASE_DISABLED) {
                try {
                    const cosmeticsSnapshot = await getDocs(collection(db, 'cosmetics'));
                    const cloudCosmetics: Cosmetic[] = [];
                    cosmeticsSnapshot.forEach((doc) => {
                        cloudCosmetics.push({ id: doc.id, ...doc.data() } as Cosmetic);
                    });

                    if (cloudCosmetics.length > 0) {
                        setCosmetics(prev => {
                            const mergedMap = new Map(prev.map(c => [c.id, c]));
                            cloudCosmetics.forEach(c => mergedMap.set(c.id, c));
                            const mergedArray = Array.from(mergedMap.values());
                            setItem(COSMETICS_CACHE_KEY, mergedArray).catch(console.error);
                            return mergedArray;
                        });
                    }
                } catch (err: any) {
                    console.warn("Cloud access restricted:", err.message);
                }
            }
        } catch (e) {
            console.error("Error loading data", e);
            setIsDataLoaded(true);
        }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const t: TFunction = useCallback((key, replacements) => {
    const text = translations[language][key] || key;
    if (replacements) return Object.entries(replacements).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
    return text;
  }, [language]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
  const toggleFavorite = useCallback((id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]), []);

  const handleCheckAvailability = useCallback(async (medicine: Medicine) => {
    if (!isAIAvailable()) {
        alert(t('aiUnavailableMessage'));
        return;
    }
    
    setIsCheckingAvailability(true);
    setAvailabilityResult(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Is the medication "${medicine['Trade Name']}" (Scientific: ${medicine['Scientific Name']}) available in Saudi Arabia pharmacies right now? Check Nahdi, Al-Dawaa, and other major chains. Provide availability status and price if found. Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text || '';
        const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = grounding
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));

        setAvailabilityResult({ text, sources });
    } catch (e: any) {
        console.error("Availability check error:", e);
        alert(t('geminiError'));
    } finally {
        setIsCheckingAvailability(false);
    }
  }, [t, language]);

  const handleMedicineSelect = useCallback((medicine: Medicine) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedMedicine(medicine); 
      setAvailabilityResult(null);
      setView('details'); 
  }, []);
  
  const handleCosmeticSelect = useCallback((cosmetic: Cosmetic) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedCosmetic(cosmetic); 
      setView('cosmeticDetails'); 
  }, []);

  const handleFindAlternative = useCallback((medicine: Medicine) => {
    const cleanSciName = medicine['Scientific Name'].toLowerCase().trim();
    const direct = medicines.filter(m => m.RegisterNumber !== medicine.RegisterNumber && m['Scientific Name'].toLowerCase().trim() === cleanSciName);
    setSourceMedicine(medicine);
    setAlternativesResults({ direct, therapeutic: [] });
    setView('alternatives');
  }, [medicines]);

  const effectiveSearchLength = searchTerm.replace(/%/g, '').trim().length;
  const isSearchActive = (effectiveSearchLength >= 3 || forceSearch || filters.productType !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' || filters.pharmaceuticalForm !== '' || filters.manufactureName.length > 0 || filters.legalStatus !== '');

  const filteredMedicines = useMemo(() => {
      if (!isDataLoaded) return [];
      let results = medicines;
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm && (effectiveSearchLength >= 3 || forceSearch)) {
          const lowerTerm = trimmedTerm.toLowerCase();
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchRegex = new RegExp(escapeRegExp(lowerTerm).replace(/%/g, '.*'), 'i');
          results = results.filter(m => {
              if (textSearchMode === 'tradeName') return searchRegex.test(m['Trade Name'].toLowerCase());
              if (textSearchMode === 'scientificName') return searchRegex.test(m['Scientific Name'].toLowerCase());
              return searchRegex.test(m['Trade Name'].toLowerCase()) || searchRegex.test(m['Scientific Name'].toLowerCase());
          });
      } else if (trimmedTerm && effectiveSearchLength < 3 && !forceSearch) return [];

      if (filters.productType !== 'all') {
          results = results.filter(m => filters.productType === 'medicine' ? m['Product type'] === 'Human' : (m['Product type'] === 'Supplement' || m.DrugType === 'Health'));
      }
      results.sort((a, b) => sortBy === 'priceAsc' ? parseFloat(a['Public price']) - parseFloat(b['Public price']) : (sortBy === 'priceDesc' ? parseFloat(b['Public price']) - parseFloat(a['Public price']) : (sortBy === 'scientificName' ? a['Scientific Name'].localeCompare(b['Scientific Name']) : a['Trade Name'].localeCompare(b['Trade Name']))));
      return results;
  }, [medicines, searchTerm, textSearchMode, filters, sortBy, effectiveSearchLength, forceSearch, isDataLoaded]);

  const handleBack = useCallback(() => {
      if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'cosmeticDetails') setView('cosmeticsSearch');
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (view === 'login' || view === 'register' || view === 'admin' || view === 'aiHistory' || view === 'addData' || view === 'addInsuranceData' || view === 'addCosmeticsData' || view === 'verifyEmail') setView('settings');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view]);

  const renderContent = () => {
      if (isAuthLoading) {
          return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold animate-pulse">جاري التحميل...</p>
            </div>
          );
      }

      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setView('search'); setActiveTab('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { setView('login'); }} />;
      
      // حماية إجبارية لتأكيد البريد
      if (user && !user.emailVerified) return <VerifyEmailView user={user} t={t} />;

      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} /> : null;
      if (view === 'aiHistory') return <ChatHistoryView conversations={chatHistory} onSelectConversation={(convo) => { setActiveConversationId(convo.id); setCurrentChatHistory(convo.messages); setIsAssistantOpen(true); }} onDeleteConversation={id => setChatHistory(prev => prev.filter(c => c.id !== id))} onClearHistory={() => setChatHistory([])} t={t} language={language} />;

      if (activeTab === 'search') {
          const showList = view === 'search' || view === 'results';
          const isDetails = view === 'details' && selectedMedicine;
          return (
              <>
                <div className={showList ? 'contents' : 'hidden'}>
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={isSearchActive} onClearSearch={() => {setSearchTerm(''); setView('search');}} onForceSearch={() => setForceSearch(true)} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                    <div className="flex gap-2 mt-2">
                        <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={0} t={t} />
                        <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                    </div>
                    <div className="mt-4">
                        {isSearchActive && <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleMedicineSelect} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState={isDataLoaded ? (filteredMedicines.length > 0 ? 'loaded' : 'empty') : 'loading'} limit={resultsLimit} onLoadMore={() => setResultsLimit(prev => prev + 20)} />}
                        {!isSearchActive && !searchTerm && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <h2 className="text-xl font-bold text-gray-400 font-poppins">PharmaSource KSA</h2>
                                <p className="text-sm text-gray-400 mt-2">{t('welcomeSubtitle')}</p>
                            </div>
                        )}
                    </div>
                </div>
                {isDetails && (
                    <MedicineDetail 
                        medicine={selectedMedicine!} 
                        t={t} 
                        language={language} 
                        isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} 
                        onToggleFavorite={toggleFavorite} 
                        user={user} 
                        onCheckAvailability={() => handleCheckAvailability(selectedMedicine!)}
                        isCheckingAvailability={isCheckingAvailability}
                        availabilityResult={availabilityResult}
                    />
                )}
                {view === 'alternatives' && sourceMedicine && alternativesResults && <AlternativesView sourceMedicine={sourceMedicine} alternatives={alternativesResults} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleMedicineSelect} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />}
              </>
          );
      }
      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} />;
      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} />;
          return <CosmeticsView t={t} language={language} cosmetics={cosmetics} onSelectCosmetic={handleCosmeticSelect} searchTerm={cosmeticsSearchTerm} setSearchTerm={setCosmeticsSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />;
      }
      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          /* Corrected typo: setInsuranceSearchMode={setInsuranceSearchMode} instead of setInsuranceSearchMode={setSearchMode} */
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={data => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }
      if (activeTab === 'settings') {
          return (
              <div className="space-y-4 animate-fade-in">
                  <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                      {user ? (
                          <div className="flex justify-between items-center">
                              <div className="overflow-hidden">
                                  <p className="font-bold truncate">{user.username}</p>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded capitalize">{user.role}</span>
                              </div>
                              {/* Corrected: AdminIcon is now imported correctly */}
                              {user.role === 'admin' && <button onClick={() => setView('admin')} className="p-2 bg-primary/10 text-primary rounded-full shrink-0"><AdminIcon /></button>}
                          </div>
                      ) : (
                        <div className="text-center p-4">
                            <p className="text-sm text-slate-500 mb-4">{t('loginRequired')}</p>
                            <button onClick={() => setView('login')} className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">{t('login')}</button>
                        </div>
                      )}
                  </div>
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                      <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                          {/* Corrected: MoonIcon and SunIcon are now imported correctly */}
                          <span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
                      </button>
                      <button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <span>{t('language')}</span><span className="font-bold">{language === 'ar' ? 'العربية' : 'English'}</span>
                      </button>
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch' && view !== 'milkSearch'} onBack={handleBack} theme={theme} toggleTheme={toggleTheme} t={t} onLoginClick={() => setView('login')} onAdminClick={() => setView('admin')} view={view} />
      <main id="main-scroll-container" className="flex-grow mx-auto px-4 space-y-4 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] container max-w-7xl">
        {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={tab => { setActiveTab(tab); setView('search'); }} t={t} user={user} view={view} />
      <div className="fixed bottom-24 right-4 z-30">
          <FloatingAssistantButton onClick={() => setIsAssistantOpen(true)} onLongPress={() => {}} t={t} language={language} />
      </div>
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={hist => setIsAssistantOpen(false)} contextMedicine={selectedMedicine} allMedicines={medicines} initialPrompt="" t={t} language={language} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={(k,v) => setFilters(prev => ({...prev, [k]:v}))} onClearFilters={() => setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],legalStatus:''})} groupedPharmaceuticalForms={[]} uniqueManufactureNames={[]} uniqueLegalStatuses={[]} t={t} />
      <BarcodeScannerModal isOpen={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)} onBarcodeDetected={code => { setSearchTerm(code); setIsBarcodeScannerOpen(false); }} t={t} />
    </div>
  );
};

export default App;
