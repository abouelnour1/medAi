import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, 
  InsuranceSearchMode, Cosmetic
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

// Auth Components
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';

// Data & Utils
import { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } from './data/data';
import { INITIAL_INSURANCE_DATA } from './data/insurance-data';
import { CUSTOM_INSURANCE_DATA } from './data/custom-insurance-data';
import { INITIAL_COSMETICS_DATA } from './data/cosmetics-data';
import { INITIAL_GUIDELINES_DATA } from './data/guidelines-data';
import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Icons
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';
import AdminIcon from './components/icons/AdminIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';

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
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache';

const App: React.FC = () => {
  const { user } = useAuth();

  // --- State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('language');
      return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [view, setView] = useState<View>('search');
  
  // Data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([...INITIAL_INSURANCE_DATA, ...CUSTOM_INSURANCE_DATA]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [clinicalGuidelines, setClinicalGuidelines] = useState<any>(INITIAL_GUIDELINES_DATA);

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

  // Selections
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const [sourceMedicine, setSourceMedicine] = useState<Medicine | null>(null);
  const [alternativesResults, setAlternativesResults] = useState<{ direct: Medicine[], therapeutic: Medicine[] } | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  // Assistant
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Conversation[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('chat_history') || '[]');
      } catch { return []; }
  });
  const [currentChatHistory, setCurrentChatHistory] = useState<ChatMessage[]>([]);

  // Insurance Search
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');

  // Cosmetics Search
  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // Barcode
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  // Edit Cosmetic (Admin)
  const [isEditCosmeticModalOpen, setIsEditCosmeticModalOpen] = useState(false);
  const [editingCosmetic, setEditingCosmetic] = useState<Cosmetic | null>(null);

  // Prescriptions (saved in clinical assistant)
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('saved_prescriptions') || '[]');
      } catch { return []; }
  });

  // Clinical Assistant Chat
  const [clinicalChatHistory, setClinicalChatHistory] = useState<ChatMessage[]>([]);

  const scrollPositionRef = useRef(0);

  // --- Effects ---

  // Load Data
  useEffect(() => {
    const loadData = () => {
        try {
            const cachedMedicines = localStorage.getItem(MEDICINES_CACHE_KEY);
            if (cachedMedicines) {
                setMedicines(JSON.parse(cachedMedicines));
            } else {
                const combinedData = [...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW].map(normalizeMedicine);
                setMedicines(combinedData);
            }

            const cachedCosmetics = localStorage.getItem(COSMETICS_CACHE_KEY);
            if (cachedCosmetics) {
                setCosmetics(JSON.parse(cachedCosmetics));
            } else {
                setCosmetics(INITIAL_COSMETICS_DATA);
            }
        } catch (e) {
            console.error("Error loading data", e);
            const combinedData = [...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW].map(normalizeMedicine);
            setMedicines(combinedData);
            setCosmetics(INITIAL_COSMETICS_DATA);
        }
    };
    loadData();
  }, []);

  // Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Language
  useEffect(() => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('language', language);
  }, [language]);

  // Save Favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Save Prescriptions
  useEffect(() => {
      localStorage.setItem('saved_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  // Save Chat History (Conversations)
  useEffect(() => {
      localStorage.setItem('chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Scroll Restore
  useLayoutEffect(() => {
    if (view === 'results' || view === 'cosmeticsSearch') {
      const container = document.getElementById('main-scroll-container');
      if (container && scrollPositionRef.current > 0) {
        container.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
      }
    } else if (view === 'search' || view === 'settings' || view === 'insuranceSearch') {
        const container = document.getElementById('main-scroll-container');
        if (container) container.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [view]);

  // --- Helpers ---

  const t: TFunction = useCallback((key, replacements) => {
    const text = translations[language][key] || key;
    if (replacements) {
        return Object.entries(replacements).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
    }
    return text;
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleAdminClick = () => {
      if (user?.role === 'admin') {
          setView('admin');
          setActiveTab('settings');
      }
  };

  const handleMedicineSelect = (medicine: Medicine) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedMedicine(medicine); 
      setView('details'); 
  };
  
  const handleCosmeticSelect = (cosmetic: Cosmetic) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedCosmetic(cosmetic); 
      setView('cosmeticDetails'); 
  };

  const handleFindAlternative = useCallback((medicine: Medicine) => {
    const cleanSciName = medicine['Scientific Name'].toLowerCase().trim();
    const sourceStrength = parseFloat(medicine.Strength) || 0;
    const sourceForm = medicine.PharmaceuticalForm.toLowerCase();

    // 1. Direct Alternatives (Same Scientific Name, Different Register Number)
    const direct = medicines.filter(m => 
        m.RegisterNumber !== medicine.RegisterNumber &&
        m['Scientific Name'].toLowerCase().trim() === cleanSciName
    );

    // Sorting Logic: Strength -> Form -> Alphabetical
    direct.sort((a, b) => {
        const strengthA = parseFloat(a.Strength) || 0;
        const strengthB = parseFloat(b.Strength) || 0;

        // 1. Strength (Concentration) Priority
        if (strengthA !== strengthB) {
            // Put exact matching strength first
            if (strengthA === sourceStrength && strengthB !== sourceStrength) return -1;
            if (strengthB === sourceStrength && strengthA !== sourceStrength) return 1;
            // Then sort by strength value
            return strengthA - strengthB;
        }

        // 2. Pharmaceutical Form (Type) Priority
        const formA = a.PharmaceuticalForm.toLowerCase();
        const formB = b.PharmaceuticalForm.toLowerCase();
        
        // Check for partial matches (e.g., "Tablet" matches "Film-coated tablet")
        const matchA = formA.includes(sourceForm) || sourceForm.includes(formA);
        const matchB = formB.includes(sourceForm) || sourceForm.includes(formB);

        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;

        // 3. Alphabetical Priority
        return a['Trade Name'].localeCompare(b['Trade Name']);
    });

    // 2. Therapeutic Alternatives (Same ATC Code)
    let therapeutic: Medicine[] = [];
    if (medicine.AtcCode1) {
        therapeutic = medicines.filter(m => 
            m.AtcCode1 === medicine.AtcCode1 && 
            m['Scientific Name'].toLowerCase().trim() !== cleanSciName
        );
        // Sort therapeutic mainly by price or alphabetical
        therapeutic.sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));
    }

    setSourceMedicine(medicine);
    setAlternativesResults({ direct, therapeutic });
    setView('alternatives');
    
    // Scroll to top
    const container = document.getElementById('main-scroll-container');
    if (container) container.scrollTop = 0;
  }, [medicines]);

  const handleSaveEditedCosmetic = async (syncToCloud: boolean) => {
      if (!editingCosmetic) return;
      const updatedCosmetics = cosmetics.map(c => c.id === editingCosmetic.id ? editingCosmetic : c);
      setCosmetics(updatedCosmetics);
      localStorage.setItem(COSMETICS_CACHE_KEY, JSON.stringify(updatedCosmetics));
      
      if (syncToCloud && !FIREBASE_DISABLED) {
          try {
              await setDoc(doc(db, 'cosmetics', editingCosmetic.id), editingCosmetic);
              alert("Saved and synced to cloud!");
          } catch (e) {
              alert("Error syncing to cloud: " + e);
          }
      } else {
          alert("Saved locally.");
      }
      setIsEditCosmeticModalOpen(false);
      setEditingCosmetic(null);
  };

  // --- LOGIC UPDATE: Calculate effective length to control UI visibility ---
  const effectiveSearchLength = searchTerm.replace(/%/g, '').trim().length;
  const isSearchActive = (effectiveSearchLength >= 3 || filters.productType !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' || filters.pharmaceuticalForm !== '' || filters.manufactureName.length > 0 || filters.legalStatus !== '');

  const filteredMedicines = useMemo(() => {
      let results = medicines;
      const trimmedTerm = searchTerm.trim();

      // Only perform text filtering if there are at least 3 valid characters (excluding %)
      if (trimmedTerm && effectiveSearchLength >= 3) {
          const lowerTerm = trimmedTerm.toLowerCase();
          const isWildcardSearch = lowerTerm.includes('%');
          let searchRegex: RegExp;

          // Helper to escape special regex chars to prevent crashes
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          if (isWildcardSearch) {
              // Wildcard logic: Split by %, escape parts, join with .*
              const parts = lowerTerm.split('%').map(escapeRegExp);
              let pattern = parts.join('.*');
              
              // CRITICAL: If it doesn't start with %, anchor to the beginning (Starts With logic)
              // User logic: "If I type o%ta, it means Starts with O... then ta"
              if (!lowerTerm.startsWith('%')) {
                  pattern = '^' + pattern;
              }
              // Note: We do NOT anchor the end ($) unless the user put a % at the start but not end? 
              // Usually wildcards imply partial matching unless anchored. 
              // The requirement is "Matches letters written at the beginning only... unless %".
              // So `o%ta` -> `^o.*ta`.
              
              try {
                searchRegex = new RegExp(pattern, 'i');
              } catch (e) {
                // Fallback safe regex
                searchRegex = new RegExp(escapeRegExp(lowerTerm.replace(/%/g, '')), 'i'); 
              }
          } else {
              // NO Wildcard: STRICT "Starts With" logic
              // Matches ONLY if the field starts with the term
              searchRegex = new RegExp('^' + escapeRegExp(lowerTerm), 'i');
          }

          results = results.filter(m => 
              (textSearchMode === 'all' || textSearchMode === 'tradeName') && searchRegex.test(m['Trade Name'].toLowerCase()) ||
              (textSearchMode === 'all' || textSearchMode === 'scientificName') && searchRegex.test(m['Scientific Name'].toLowerCase())
          );
      } else if (trimmedTerm && effectiveSearchLength < 3) {
          // If term exists but < 3 chars, return empty list (don't show anything yet)
          // This prevents "Results appearing without reason" or unrelated results
          return [];
      }

      if (filters.productType !== 'all') {
          results = results.filter(m => {
              if (filters.productType === 'medicine') return m['Product type'] === 'Human';
              if (filters.productType === 'supplement') return m['Product type'] === 'Supplement' || m.DrugType === 'Health';
              return true;
          });
      }
      if (filters.priceMin !== '') {
          results = results.filter(m => parseFloat(m['Public price']) >= parseFloat(filters.priceMin));
      }
      if (filters.priceMax !== '') {
          results = results.filter(m => parseFloat(m['Public price']) <= parseFloat(filters.priceMax));
      }
      if (filters.legalStatus !== '') {
          results = results.filter(m => m['Legal Status'] === filters.legalStatus);
      }
      if (filters.manufactureName.length > 0) {
          results = results.filter(m => filters.manufactureName.includes(m['Manufacture Name']));
      }

      results.sort((a, b) => {
          if (sortBy === 'priceAsc') return parseFloat(a['Public price']) - parseFloat(b['Public price']);
          if (sortBy === 'priceDesc') return parseFloat(b['Public price']) - parseFloat(a['Public price']);
          if (sortBy === 'scientificName') return a['Scientific Name'].localeCompare(b['Scientific Name']);
          // Default Alphabetical
          return a['Trade Name'].localeCompare(b['Trade Name']);
      });
      return results;
  }, [medicines, searchTerm, textSearchMode, filters, sortBy, effectiveSearchLength]);

  const uniqueManufactureNames = useMemo(() => Array.from(new Set(medicines.map(m => m['Manufacture Name']))).sort(), [medicines]);
  const uniqueLegalStatuses = useMemo(() => Array.from(new Set(medicines.map(m => m['Legal Status']).filter(Boolean))).sort(), [medicines]);
  const groupedPharmaceuticalForms = useMemo(() => groupPharmaceuticalForms(Array.from(new Set(medicines.map(m => m.PharmaceuticalForm))), t), [medicines, t]);

  const handleBack = useCallback(() => {
    if (view === 'login' || view === 'register') { setView('settings'); return; }
    if (view === 'admin') { setView('settings'); return; }
    if (view === 'verifyEmail') { return; }
    if (activeTab === 'prescriptions' && selectedPrescription) { setSelectedPrescription(null); return; }
    
    const targetView = (isSearchActive && activeTab === 'search') ? 'results' : 'search';

    if (['details', 'alternatives', 'chatHistory', 'insuranceDetails', 'favorites', 'cosmeticDetails'].includes(view)) {
       if (activeTab === 'insurance') {
           setView('insuranceSearch');
       } else if (activeTab === 'cosmetics') {
           setView('cosmeticsSearch');
       } else if (activeTab === 'settings') {
           setView('settings');
       } else {
           setView(targetView);
       }
    } else if (['addData', 'addInsuranceData', 'addCosmeticsData'].includes(view)) {
        setView('settings');
    } else {
        setView(targetView);
    }
    setSourceMedicine(null); setAlternativesResults(null); setSelectedMedicine(null); setSelectedInsuranceData(null); setSelectedCosmetic(null);
  }, [view, isSearchActive, activeTab, selectedPrescription]);

  // --- Render ---

  const renderContent = () => {
      if (view === 'login') return <LoginView onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setView('settings'); setActiveTab('settings'); }} t={t} />;
      if (view === 'register') return <RegisterView onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('verifyEmail')} t={t} />;
      if (view === 'verifyEmail' && user) return <VerifyEmailView user={user} t={t} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} />;

      // Tabs Logic
      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) {
              return <MedicineDetail medicine={selectedMedicine} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} />;
          }
          if (view === 'alternatives' && sourceMedicine && alternativesResults) {
              return <AlternativesView sourceMedicine={sourceMedicine} alternatives={alternativesResults} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setAssistantPrompt(`Tell me about ${m['Trade Name']}`); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          }
          if (view === 'chatHistory') {
              return <ChatHistoryView conversations={chatHistory} onSelectConversation={(c) => { setCurrentChatHistory(c.messages); setAssistantPrompt(''); setIsAssistantOpen(true); }} onDeleteConversation={(id) => setChatHistory(prev => prev.filter(c => c.id !== id))} onClearHistory={() => setChatHistory([])} t={t} language={language} />;
          }
          if (view === 'favorites') {
              return <FavoritesView favoriteIds={favorites} allMedicines={medicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setAssistantPrompt(''); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternative} toggleFavorite={toggleFavorite} t={t} language={language} />;
          }
          // Default Search View
          return (
              <>
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={!!searchTerm} onClearSearch={() => setSearchTerm('')} onForceSearch={() => {}} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                <div className="flex gap-2 mt-2">
                    <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={0} t={t} />
                    <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                </div>
                <div className="mt-4">
                    {/* Only show results if search is active (3+ chars or filters) */}
                    {isSearchActive ? (
                        <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setAssistantPrompt(''); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState={filteredMedicines.length > 0 ? 'loaded' : 'empty'} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{t('welcomeSubtitle')}</p>
                        </div>
                    )}
                </div>
              </>
          );
      }

      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) {
              return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          }
          // Simplified Insurance View: Just Search
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }

      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) {
              return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={(c) => { setEditingCosmetic(c); setIsEditCosmeticModalOpen(true); }} />;
          }
          return <CosmeticsView cosmetics={cosmetics} t={t} language={language} onSelectCosmetic={handleCosmeticSelect} searchTerm={cosmeticsSearchTerm} setSearchTerm={setCosmeticsSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />;
      }

      if (activeTab === 'settings') {
          if (view === 'addData') return <AddDataView onImport={(data) => { setMedicines(prev => [...data.map(normalizeMedicine), ...prev]); setView('settings'); }} t={t} />;
          if (view === 'addInsuranceData') return <AddInsuranceDataView onImport={(data) => { setInsuranceData(prev => [...data, ...prev]); setView('settings'); }} t={t} />;
          if (view === 'addCosmeticsData') return <AddCosmeticsDataView onImport={(data) => { setCosmetics(prev => [...data, ...prev]); setView('settings'); }} t={t} />;
          
          return (
              <div className="space-y-4 animate-fade-in">
                  <h2 className="text-xl font-bold">{t('navSettings')}</h2>
                  
                  {/* Auth Section */}
                  <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                      {user ? (
                          <div className="flex justify-between items-center">
                              <div>
                                  <p className="font-bold">{user.username}</p>
                                  <p className="text-sm text-gray-500">{user.role}</p>
                              </div>
                              {user.role === 'admin' && (
                                  <button onClick={handleAdminClick} className="p-2 bg-primary/10 text-primary rounded-full"><AdminIcon /></button>
                              )}
                          </div>
                      ) : (
                          <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>
                      )}
                  </div>

                  {/* General Settings */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                      <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
                      </button>
                      <button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <span>{t('language')}</span>
                          <span className="font-bold">{language === 'ar' ? 'العربية' : 'English'}</span>
                      </button>
                  </div>

                  {/* Data Management */}
                  {user?.role === 'admin' && (
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                        <h3 className="p-4 text-sm font-bold text-gray-500 uppercase">{t('dataManagement')}</h3>
                        <button onClick={() => setView('addData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700">
                            <div className="w-5 h-5"><DatabaseIcon /></div> {t('addData')}
                        </button>
                        <button onClick={() => setView('addInsuranceData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700">
                            <div className="w-5 h-5"><DatabaseIcon /></div> {t('addInsuranceData')}
                        </button>
                        <button onClick={() => setView('addCosmeticsData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700">
                            <div className="w-5 h-5"><DatabaseIcon /></div> {t('addCosmeticsData')}
                        </button>
                    </div>
                  )}
              </div>
          );
      }

      return null;
  };

  const headerTitle = useMemo(() => {
      if (view === 'details') return selectedMedicine?.['Trade Name'] || 'Details';
      if (view === 'cosmeticDetails') return selectedCosmetic?.SpecificName || 'Details';
      if (activeTab === 'insurance') return t('insuranceSearchTitle');
      if (activeTab === 'cosmetics') return t('cosmeticsSearchTitle');
      if (activeTab === 'settings') return t('navSettings');
      return t('appTitle');
  }, [view, activeTab, selectedMedicine, selectedCosmetic, t]);

  const showBackButton = view !== 'search' && view !== 'settings' && !(activeTab === 'insurance' && view === 'insuranceSearch') && !(activeTab === 'cosmetics' && view === 'cosmeticsSearch');

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header
        title={headerTitle}
        showBack={showBackButton}
        onBack={handleBack}
        theme={theme}
        toggleTheme={toggleTheme}
        t={t}
        onLoginClick={() => { setView('login'); setActiveTab('settings'); }}
        onAdminClick={handleAdminClick}
        view={view}
      />

      <main 
        id="main-scroll-container" 
        className="flex-grow container mx-auto px-4 space-y-4 transition-all duration-300 max-w-7xl overflow-y-auto pt-[90px] pb-[90px]"
      >
        {renderContent()}
      </main>

      <BottomNavBar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView(tab === 'search' ? 'search' : tab === 'insurance' ? 'insuranceSearch' : tab === 'cosmetics' ? 'cosmeticsSearch' : 'settings'); }} t={t} user={user} view={view} />

      <div className="fixed bottom-24 right-4 z-30">
          <FloatingAssistantButton 
            onClick={() => { setAssistantPrompt(''); setIsAssistantOpen(true); }} 
            onLongPress={() => { 
                if (user?.role === 'admin' || user?.prescriptionPrivilege) {
                    setAssistantPrompt('##PRESCRIPTION_MODE##');
                    setIsAssistantOpen(true);
                } else {
                    alert(t('accessDeniedPrescription'));
                }
            }} 
            t={t} 
            language={language} 
          />
      </div>

      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={(hist) => { setChatHistory(prev => [...prev, { id: Date.now().toString(), title: hist[0]?.parts[0]?.text?.slice(0, 30) || 'Chat', messages: hist, timestamp: Date.now() }]); setIsAssistantOpen(false); setCurrentChatHistory([]); }} contextMedicine={selectedMedicine} allMedicines={medicines} favoriteMedicines={medicines.filter(m => favorites.includes(m.RegisterNumber))} initialPrompt={assistantPrompt} initialHistory={currentChatHistory} t={t} language={language} />

      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={(k, v) => setFilters(prev => ({...prev, [k]: v}))} onClearFilters={() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' })} groupedPharmaceuticalForms={groupedPharmaceuticalForms} uniqueManufactureNames={uniqueManufactureNames} uniqueLegalStatuses={uniqueLegalStatuses} t={t} />

      <BarcodeScannerModal isOpen={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)} onBarcodeDetected={(code) => { setSearchTerm(code); setIsBarcodeScannerOpen(false); }} t={t} />

      {/* Edit Modal for Admin (Cosmetic) */}
      {isEditCosmeticModalOpen && editingCosmetic && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditCosmeticModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">Edit Cosmetic</h3>
                    <form onSubmit={(e) => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-3 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2"><label className="text-sm font-medium">{t('brandName')}</label><input type="text" value={editingCosmetic.BrandName} onChange={e => setEditingCosmetic({...editingCosmetic, BrandName: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required /></div>
                                
                                <div><label className="text-sm font-medium">Product Name (En)</label><input type="text" value={editingCosmetic.SpecificName} onChange={e => setEditingCosmetic({...editingCosmetic, SpecificName: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required/></div>
                                <div><label className="text-sm font-medium">Product Name (Ar)</label><input type="text" dir="rtl" value={editingCosmetic.SpecificNameAr} onChange={e => setEditingCosmetic({...editingCosmetic, SpecificNameAr: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                
                                <div><label className="text-sm font-medium">Category (En)</label><input type="text" value={editingCosmetic.FirstSubCategoryEn} onChange={e => setEditingCosmetic({...editingCosmetic, FirstSubCategoryEn: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">Category (Ar)</label><input type="text" dir="rtl" value={editingCosmetic.FirstSubCategoryAr} onChange={e => setEditingCosmetic({...editingCosmetic, FirstSubCategoryAr: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                
                                <div><label className="text-sm font-medium">Sub-Category (En)</label><input type="text" value={editingCosmetic.SecondSubCategoryEn} onChange={e => setEditingCosmetic({...editingCosmetic, SecondSubCategoryEn: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">Sub-Category (Ar)</label><input type="text" dir="rtl" value={editingCosmetic.SecondSubCategoryAr} onChange={e => setEditingCosmetic({...editingCosmetic, SecondSubCategoryAr: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>

                                <div className="sm:col-span-2"><label className="text-sm font-medium">Active Ingredient</label><input type="text" value={editingCosmetic["Active ingredient"]} onChange={e => setEditingCosmetic({...editingCosmetic, "Active ingredient": e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div className="sm:col-span-2"><label className="text-sm font-medium">Key Ingredients</label><textarea value={editingCosmetic["Key Ingredients"] || ''} onChange={e => setEditingCosmetic({...editingCosmetic, "Key Ingredients": e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" rows={2} /></div>
                                <div className="sm:col-span-2"><label className="text-sm font-medium">Highlights</label><textarea value={editingCosmetic.Highlights || ''} onChange={e => setEditingCosmetic({...editingCosmetic, Highlights: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" rows={2} /></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 mt-2">
                            <button type="button" onClick={() => setIsEditCosmeticModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium">{t('cancel')}</button>
                            <button type="button" onClick={() => handleSaveEditedCosmetic(false)} className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-medium">Save Locally Only</button>
                            <button type="button" onClick={() => handleSaveEditedCosmetic(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2" disabled={FIREBASE_DISABLED}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                Save & Sync to Cloud
                            </button>
                        </div>
                    </form>
                </div>
            </div>
      )}
    </div>
  );
};

export default App;