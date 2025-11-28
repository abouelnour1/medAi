
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
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';

// Icons
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';
import AdminIcon from './components/icons/AdminIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';
import HistoryIcon from './components/icons/HistoryIcon';

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
  const [forceSearch, setForceSearch] = useState(false);

  // --- PERFORMANCE: Pagination / Lazy Loading State ---
  const [resultsLimit, setResultsLimit] = useState(20);
  const [cosmeticsLimit, setCosmeticsLimit] = useState(20);

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
  // Edit Medicine (Admin)
  const [isEditMedicineModalOpen, setIsEditMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Prescriptions (saved in clinical assistant)
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('saved_prescriptions') || '[]');
      } catch { return []; }
  });

  const scrollPositionRef = useRef(0);

  // --- Effects ---

  // Load Data with IndexedDB Migration
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Try to load from IndexedDB
            let medicinesData = await getItem<Medicine[]>(MEDICINES_CACHE_KEY);
            let cosmeticsData = await getItem<Cosmetic[]>(COSMETICS_CACHE_KEY);

            // 2. Migration Check: If not in IDB, check LocalStorage (Legacy)
            if (!medicinesData) {
                const lsMedicines = localStorage.getItem(MEDICINES_CACHE_KEY);
                if (lsMedicines) {
                    try {
                        medicinesData = JSON.parse(lsMedicines);
                        // Save to IndexedDB
                        await setItem(MEDICINES_CACHE_KEY, medicinesData);
                        // Clear LocalStorage to free up space immediately
                        localStorage.removeItem(MEDICINES_CACHE_KEY); 
                    } catch (e) {
                        console.warn("Failed to parse LS medicines, fallback to static", e);
                    }
                }
            }

            if (!cosmeticsData) {
                const lsCosmetics = localStorage.getItem(COSMETICS_CACHE_KEY);
                if (lsCosmetics) {
                    try {
                        cosmeticsData = JSON.parse(lsCosmetics);
                        await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
                        localStorage.removeItem(COSMETICS_CACHE_KEY);
                    } catch (e) {
                        console.warn("Failed to parse LS cosmetics, fallback to static", e);
                    }
                }
            }

            // 3. Fallback to Static Data
            if (!medicinesData) {
                medicinesData = [...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW].map(normalizeMedicine);
                // Cache default data to IDB for subsequent loads
                await setItem(MEDICINES_CACHE_KEY, medicinesData);
            }
            
            if (!cosmeticsData) {
                cosmeticsData = INITIAL_COSMETICS_DATA;
                // Cache default data to IDB for subsequent loads
                await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
            }

            setMedicines(medicinesData || []);
            setCosmetics(cosmeticsData || []);

        } catch (e) {
            console.error("Error loading data", e);
            // Fallback completely in case of DB error
            setMedicines([...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW].map(normalizeMedicine));
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
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    if (view === 'results' || view === 'cosmeticsSearch') {
      if (scrollPositionRef.current > 0) {
        container.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
      }
    } else {
        // Force reset scroll to top when entering detail views or other pages
        container.scrollTo({ top: 0, behavior: 'auto' });
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
      if(container) {
          scrollPositionRef.current = container.scrollTop;
      }
      setSelectedMedicine(medicine); 
      setView('details'); 
  };
  
  const handleCosmeticSelect = (cosmetic: Cosmetic) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) {
          scrollPositionRef.current = container.scrollTop;
      }
      setSelectedCosmetic(cosmetic); 
      setView('cosmeticDetails'); 
  };

  // --- Strict Alternatives Sorting Logic ---
  const handleFindAlternative = useCallback((medicine: Medicine) => {
    const cleanSciName = medicine['Scientific Name'].toLowerCase().trim();
    
    // Helper to parse numbers from strength (e.g. "500 mg" -> 500)
    const getStrengthNum = (str: string) => {
        const match = str.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : -1;
    };
    
    const sourceStrength = getStrengthNum(medicine.Strength);
    const sourceForm = medicine.PharmaceuticalForm.toLowerCase();

    // 1. Direct Alternatives (Same Scientific Name)
    const direct = medicines.filter(m => 
        m.RegisterNumber !== medicine.RegisterNumber &&
        m['Scientific Name'].toLowerCase().trim() === cleanSciName
    );

    // Sorting Logic: Strength -> Form -> Alphabetical
    const sortFunction = (a: Medicine, b: Medicine) => {
        const aStrength = getStrengthNum(a.Strength);
        const bStrength = getStrengthNum(b.Strength);
        
        // 1. Strength Priority
        const aStrengthMatch = aStrength === sourceStrength;
        const bStrengthMatch = bStrength === sourceStrength;
        
        if (aStrengthMatch && !bStrengthMatch) return -1;
        if (!aStrengthMatch && bStrengthMatch) return 1;
        
        if (!aStrengthMatch && !bStrengthMatch && aStrength !== bStrength) {
             return aStrength - bStrength; 
        }

        // 2. Form Priority
        const aForm = a.PharmaceuticalForm.toLowerCase();
        const bForm = b.PharmaceuticalForm.toLowerCase();
        const aFormMatch = aForm.includes(sourceForm) || sourceForm.includes(aForm);
        const bFormMatch = bForm.includes(sourceForm) || sourceForm.includes(bForm);

        if (aFormMatch && !bFormMatch) return -1;
        if (!aFormMatch && bFormMatch) return 1;

        // 3. Alphabetical Fallback
        return a['Trade Name'].localeCompare(b['Trade Name']);
    };

    direct.sort(sortFunction);

    // 2. Therapeutic Alternatives
    let therapeutic: Medicine[] = [];
    if (medicine.AtcCode1) {
        therapeutic = medicines.filter(m => 
            m.AtcCode1 === medicine.AtcCode1 && 
            m['Scientific Name'].toLowerCase().trim() !== cleanSciName
        );
        therapeutic.sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));
    }

    setSourceMedicine(medicine);
    setAlternativesResults({ direct, therapeutic });
    
    // Save current scroll position before switching
    const container = document.getElementById('main-scroll-container');
    if (container) {
        scrollPositionRef.current = container.scrollTop;
    }
    setView('alternatives');
  }, [medicines]);

  // Handler passed to Assistant to instantly show alternatives
  const handleShowAlternativesFromAssistant = useCallback((medicine: Medicine) => {
      setIsAssistantOpen(false); // Close modal
      handleFindAlternative(medicine);
  }, [handleFindAlternative]);

  // --- Search Logic with Lazy Loading Reset ---
  const effectiveSearchLength = searchTerm.replace(/%/g, '').trim().length;
  const isSearchActive = (effectiveSearchLength >= 3 || forceSearch || filters.productType !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' || filters.pharmaceuticalForm !== '' || filters.manufactureName.length > 0 || filters.legalStatus !== '');

  // Reset pagination limit when search query changes
  useEffect(() => {
      setResultsLimit(20);
  }, [searchTerm, filters, sortBy, textSearchMode, forceSearch]);

  // Reset cosmetics pagination when search changes
  useEffect(() => {
      setCosmeticsLimit(20);
  }, [cosmeticsSearchTerm, selectedBrand]);

  const filteredMedicines = useMemo(() => {
      let results = medicines;
      const trimmedTerm = searchTerm.trim();

      if (trimmedTerm && (effectiveSearchLength >= 3 || forceSearch)) {
          const lowerTerm = trimmedTerm.toLowerCase();
          const isWildcardSearch = lowerTerm.includes('%');
          let searchRegex: RegExp;
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          if (isWildcardSearch) {
              const parts = lowerTerm.split('%').map(escapeRegExp);
              let pattern = parts.join('.*');
              if (!lowerTerm.startsWith('%')) pattern = '^' + pattern;
              try { searchRegex = new RegExp(pattern, 'i'); } 
              catch (e) { searchRegex = new RegExp(escapeRegExp(lowerTerm.replace(/%/g, '')), 'i'); }
          } else {
              searchRegex = new RegExp('^' + escapeRegExp(lowerTerm), 'i');
          }

          results = results.filter(m => {
              if (textSearchMode === 'tradeName') return searchRegex.test(m['Trade Name'].toLowerCase());
              if (textSearchMode === 'scientificName') return searchRegex.test(m['Scientific Name'].toLowerCase());
              return searchRegex.test(m['Trade Name'].toLowerCase()) || searchRegex.test(m['Scientific Name'].toLowerCase());
          });
      } else if (trimmedTerm && effectiveSearchLength < 3 && !forceSearch) {
          return [];
      }

      if (filters.productType !== 'all') {
          results = results.filter(m => {
              if (filters.productType === 'medicine') return m['Product type'] === 'Human';
              if (filters.productType === 'supplement') return m['Product type'] === 'Supplement' || m.DrugType === 'Health';
              return true;
          });
      }
      if (filters.priceMin !== '') results = results.filter(m => parseFloat(m['Public price']) >= parseFloat(filters.priceMin));
      if (filters.priceMax !== '') results = results.filter(m => parseFloat(m['Public price']) <= parseFloat(filters.priceMax));
      if (filters.legalStatus !== '') results = results.filter(m => m['Legal Status'] === filters.legalStatus);
      if (filters.manufactureName.length > 0) results = results.filter(m => filters.manufactureName.includes(m['Manufacture Name']));

      results.sort((a, b) => {
          if (sortBy === 'priceAsc') return parseFloat(a['Public price']) - parseFloat(b['Public price']);
          if (sortBy === 'priceDesc') return parseFloat(b['Public price']) - parseFloat(a['Public price']);
          if (sortBy === 'scientificName') return a['Scientific Name'].localeCompare(b['Scientific Name']);
          return a['Trade Name'].localeCompare(b['Trade Name']);
      });
      return results;
  }, [medicines, searchTerm, textSearchMode, filters, sortBy, effectiveSearchLength, forceSearch]);

  // Admin Actions
  const handleDeleteMedicine = async (medicine: Medicine) => {
      if (!window.confirm(t('confirmDeleteMedicine'))) return;
      setMedicines(prev => {
          const updated = prev.filter(m => m.RegisterNumber !== medicine.RegisterNumber);
          setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      setIsEditMedicineModalOpen(false);
      setEditingMedicine(null);
      if (selectedMedicine && selectedMedicine.RegisterNumber === medicine.RegisterNumber) {
          setSelectedMedicine(null);
          setView('results');
      }
      if (!FIREBASE_DISABLED) {
          try { await deleteDoc(doc(db, 'medicines', medicine.RegisterNumber)); } catch (e) { console.error(e); }
      }
  };

  const handleSaveEditedMedicine = async (syncToCloud: boolean) => {
      if (!editingMedicine) return;
      setMedicines(prev => {
          const updated = prev.map(m => m.RegisterNumber === editingMedicine.RegisterNumber ? editingMedicine : m);
          setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      if (selectedMedicine && selectedMedicine.RegisterNumber === editingMedicine.RegisterNumber) {
          setSelectedMedicine(editingMedicine);
      }
      if (syncToCloud && !FIREBASE_DISABLED) {
          try {
              const medDocRef = doc(db, 'medicines', editingMedicine.RegisterNumber);
              await setDoc(medDocRef, editingMedicine, { merge: true });
              alert("Medicine saved and synced to Cloud.");
          } catch (e) {
              console.error("Failed to sync edit to cloud", e);
              alert("Saved locally, but failed to sync to cloud.");
          }
      } else if (syncToCloud) {
          alert("Saved locally. Cloud sync DISABLED.");
      }
      setIsEditMedicineModalOpen(false);
      setEditingMedicine(null);
  };

  const handleEditMedicine = (med: Medicine) => { setEditingMedicine({...med}); setIsEditMedicineModalOpen(true); };
  const handleEditCosmetic = (c: Cosmetic) => { setEditingCosmetic({...c}); setIsEditCosmeticModalOpen(true); };
  
  const handleSaveEditedCosmetic = async (syncToCloud: boolean) => {
      if (!editingCosmetic) return;
      setCosmetics(prev => {
          const updated = prev.map(c => c.id === editingCosmetic.id ? editingCosmetic : c);
          setItem(COSMETICS_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      if (selectedCosmetic && selectedCosmetic.id === editingCosmetic.id) {
          setSelectedCosmetic(editingCosmetic);
      }
      if (syncToCloud && !FIREBASE_DISABLED) {
          try {
              const cosmeticDocRef = doc(db, 'cosmetics', editingCosmetic.id);
              await setDoc(cosmeticDocRef, editingCosmetic, { merge: true });
              alert("Cosmetic saved and synced to Cloud.");
          } catch (e) {
              console.error("Failed to sync edit to cloud", e);
              alert("Saved locally, but failed to sync to cloud.");
          }
      } else if (syncToCloud) {
          alert("Saved locally. Cloud sync DISABLED.");
      }
      setIsEditCosmeticModalOpen(false);
      setEditingCosmetic(null);
  };

  const handleClearFilters = useCallback(() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' }), []);
  const handleClearSearch = useCallback(() => { setSearchTerm(''); setTextSearchMode('tradeName'); handleClearFilters(); setSortBy('alphabetical'); setView('search'); setForceSearch(false); }, [handleClearFilters]);
  const handleForceSearch = useCallback(() => { if (searchTerm.trim().length > 0) setForceSearch(true); }, [searchTerm]);
  const handleFilterChange = <K extends keyof Filters>(filterName: K, value: Filters[K]) => setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));

  const uniqueManufactureNames = useMemo(() => Array.from(new Set(medicines.map(m => m['Manufacture Name']))).sort(), [medicines]);
  const uniqueLegalStatuses = useMemo(() => Array.from(new Set(medicines.map(m => m['Legal Status']).filter(Boolean))).sort(), [medicines]);
  const groupedPharmaceuticalForms = useMemo(() => groupPharmaceuticalForms(Array.from(new Set(medicines.map(m => m.PharmaceuticalForm))), t), [medicines, t]);

  const activeFilterCount = useMemo(() => {
    return (filters.productType !== 'all' ? 1 : 0) +
           (filters.priceMin !== '' ? 1 : 0) +
           (filters.priceMax !== '' ? 1 : 0) +
           (filters.pharmaceuticalForm !== '' ? 1 : 0) +
           (filters.manufactureName.length > 0 ? 1 : 0) +
           (filters.legalStatus !== '' ? 1 : 0);
  }, [filters]);

  const handleBack = useCallback(() => {
      if (view === 'details' || view === 'alternatives') {
          setView('search');
      } else if (view === 'cosmeticDetails') {
          setView('cosmeticsSearch');
      } else if (view === 'insuranceDetails') {
          setView('insuranceSearch');
      } else if (view === 'login' || view === 'register' || view === 'admin' || view === 'aiHistory') {
          setView('settings');
      } else if (view === 'addData' || view === 'addInsuranceData' || view === 'addCosmeticsData') {
          setView('settings');
      } else if (view === 'verifyEmail') {
          setView('settings');
      } else {
          setView('search');
          setActiveTab('search');
      }
  }, [view]);

  // Import Handlers
  const handleImportData = (data: any[]) => {
      const normalizedData = data.map(normalizeMedicine);
      setMedicines(prev => {
          const map = new Map();
          prev.forEach(m => map.set(m.RegisterNumber, m));
          normalizedData.forEach(m => map.set(m.RegisterNumber, m));
          const updated = Array.from(map.values()) as Medicine[];
          setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      alert(t('importSuccess', { count: data.length }));
      setView('settings');
  };

  const handleImportInsuranceData = (data: any[]) => {
      setInsuranceData(prev => [...prev, ...data]);
      alert(t('importSuccess', { count: data.length }));
      setView('settings');
  };

  const handleImportCosmeticsData = (data: any[]) => {
      const normalizedData = data.map((item, idx) => ({ ...item, id: item.id || `custom-${Date.now()}-${idx}` }));
      setCosmetics(prev => {
          const updated = [...prev, ...normalizedData];
          setItem(COSMETICS_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      alert(t('importSuccess', { count: data.length }));
      setView('settings');
  };

  // ... (Header logic)
  const headerTitle = useMemo(() => {
      if (view === 'details') return selectedMedicine?.['Trade Name'] || 'Details';
      if (view === 'cosmeticDetails') return selectedCosmetic?.SpecificName || 'Details';
      if (view === 'alternatives') return t('alternativesFor', { name: sourceMedicine ? sourceMedicine['Trade Name'] : '' });
      if (activeTab === 'insurance') return t('navInsurance');
      if (activeTab === 'cosmetics') return t('navCosmetics');
      if (activeTab === 'settings') return t('navSettings');
      if (view === 'aiHistory') return t('chatHistoryTitle');
      return t('appTitle');
  }, [view, activeTab, selectedMedicine, selectedCosmetic, sourceMedicine, t]);

  const showBackButton = useMemo(() => {
      return view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch';
  }, [view]);

  // --- Handlers for Assistant ---
  const handleCloseAssistant = (historyToSave: ChatMessage[]) => {
      setIsAssistantOpen(false);
  };
  
  const handleOpenPrescriptionAssistant = useCallback(() => {
    if (user?.role !== 'admin' && !user?.prescriptionPrivilege) { alert(t('accessDeniedPrescription')); return; }
    setAssistantPrompt('##PRESCRIPTION_MODE##'); 
    setIsAssistantOpen(true);
  }, [user, t]);

  const handleOpenAssistantWithContext = (medicine: Medicine) => {
      setSelectedMedicine(medicine);
      setAssistantPrompt('');
      setIsAssistantOpen(true);
  }

  // --- History Handlers ---
  const handleDeleteConversation = (id: string) => {
      setChatHistory(prev => prev.filter(c => c.id !== id));
  };

  const handleClearHistory = () => {
      setChatHistory([]);
  };

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { alert(t('registerSuccessPending')); setView('login'); }} />;
      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} /> : null;
      if (view === 'aiHistory') {
          return <ChatHistoryView 
              conversations={chatHistory}
              onSelectConversation={(convo) => {
                  setCurrentChatHistory(convo.messages);
                  setIsAssistantOpen(true);
              }}
              onDeleteConversation={handleDeleteConversation}
              onClearHistory={handleClearHistory}
              t={t}
              language={language}
          />
      }

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={handleEditMedicine} onOpenAssistant={() => handleOpenAssistantWithContext(selectedMedicine)} />;
          if (view === 'alternatives' && sourceMedicine && alternativesResults) return <AlternativesView sourceMedicine={sourceMedicine} alternatives={alternativesResults} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setAssistantPrompt(''); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          
          return (
              <>
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={isSearchActive} onClearSearch={handleClearSearch} onForceSearch={handleForceSearch} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                <div className="flex gap-2 mt-2">
                    <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={activeFilterCount} t={t} />
                    <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                </div>
                <div className="mt-4">
                    {isSearchActive ? (
                        <ResultsList 
                            medicines={filteredMedicines} 
                            onMedicineSelect={handleMedicineSelect} 
                            onMedicineLongPress={(m) => { setSelectedMedicine(m); setAssistantPrompt(''); setIsAssistantOpen(true); }} 
                            onFindAlternative={handleFindAlternative} 
                            favorites={favorites} 
                            onToggleFavorite={toggleFavorite} 
                            t={t} 
                            language={language} 
                            resultsState={filteredMedicines.length > 0 ? 'loaded' : 'empty'}
                            limit={resultsLimit}
                            onLoadMore={() => setResultsLimit(prev => prev + 20)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-80 pointer-events-none select-none">
                            <h2 className="text-xl font-bold text-gray-400 dark:text-slate-600 font-poppins tracking-wide">PharmaSource</h2>
                            <div className="h-1 w-12 bg-primary/30 rounded-full mt-2"></div>
                        </div>
                    )}
                </div>
              </>
          );
      }

      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) {
              return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={handleEditCosmetic} />;
          }
          return <CosmeticsView 
            t={t} 
            language={language} 
            cosmetics={cosmetics} 
            onSelectCosmetic={handleCosmeticSelect} 
            searchTerm={cosmeticsSearchTerm} 
            setSearchTerm={setCosmeticsSearchTerm} 
            selectedBrand={selectedBrand} 
            setSelectedBrand={setSelectedBrand}
            limit={cosmeticsLimit}
            onLoadMore={() => setCosmeticsLimit(prev => prev + 20)}
            onCosmeticLongPress={(c) => {
                setSelectedCosmetic(c);
                setAssistantPrompt('');
                setIsAssistantOpen(true);
            }}
          />;
      }

      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) {
              return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          }
          return <InsuranceSearchView 
            t={t} 
            language={language} 
            allMedicines={medicines} 
            insuranceData={insuranceData} 
            onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} 
            insuranceSearchTerm={insuranceSearchTerm} 
            setInsuranceSearchTerm={setInsuranceSearchTerm} 
            insuranceSearchMode={insuranceSearchMode} 
            setInsuranceSearchMode={setInsuranceSearchMode} 
          />;
      }

      if (activeTab === 'settings') {
          if (view === 'addData') return <AddDataView onImport={handleImportData} t={t} />;
          if (view === 'addInsuranceData') return <AddInsuranceDataView onImport={handleImportInsuranceData} t={t} />;
          if (view === 'addCosmeticsData') return <AddCosmeticsDataView onImport={handleImportCosmeticsData} t={t} />;
          
          return (
              <div className="space-y-4 animate-fade-in">
                  <h2 className="text-xl font-bold">{t('navSettings')}</h2>
                  <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                      {user ? (
                          <div className="flex justify-between items-center">
                              <div><p className="font-bold">{user.username}</p><p className="text-sm text-gray-500">{user.role}</p></div>
                              {user.role === 'admin' && <button onClick={handleAdminClick} className="p-2 bg-primary/10 text-primary rounded-full"><AdminIcon /></button>}
                          </div>
                      ) : (
                          <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>
                      )}
                  </div>
                  
                  {/* AI Activity Log Button */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                      <button onClick={() => setView('aiHistory')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <span className="flex items-center gap-3"><div className="w-5 h-5 text-primary"><HistoryIcon /></div> {t('aiActivityLog')}</span>
                      </button>
                  </div>

                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                      <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
                      </button>
                      <button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                          <span>{t('language')}</span><span className="font-bold">{language === 'ar' ? 'العربية' : 'English'}</span>
                      </button>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                        <h3 className="p-4 text-sm font-bold text-gray-500 uppercase">{t('dataManagement')}</h3>
                        <button onClick={() => setView('addData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700"><div className="w-5 h-5"><DatabaseIcon /></div> {t('addData')}</button>
                        <button onClick={() => setView('addInsuranceData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700"><div className="w-5 h-5"><DatabaseIcon /></div> {t('addInsuranceData')}</button>
                        <button onClick={() => setView('addCosmeticsData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700"><div className="w-5 h-5"><DatabaseIcon /></div> {t('addCosmeticsData')}</button>
                    </div>
                  )}
              </div>
          );
      }
      return null;
  };

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
      <main id="main-scroll-container" className="flex-grow container mx-auto px-4 space-y-4 transition-all duration-300 max-w-7xl overflow-y-auto pt-[90px] pb-[90px]">
        {renderContent()}
      </main>
      <BottomNavBar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { 
            setActiveTab(tab); 
            if (tab === 'search') setView('search');
            else if (tab === 'insurance') setView('insuranceSearch');
            else if (tab === 'cosmetics') setView('cosmeticsSearch');
            else if (tab === 'settings') setView('settings');
        }} 
        t={t} 
        user={user} 
        view={view} 
      />
      <div className="fixed bottom-24 right-4 z-30">
          <FloatingAssistantButton 
            onClick={() => { 
                setSelectedMedicine(null); 
                setSelectedCosmetic(null);
                setAssistantPrompt(''); 
                setIsAssistantOpen(true); 
            }} 
            onLongPress={handleOpenPrescriptionAssistant} 
            t={t} 
            language={language} 
          />
      </div>
      <AssistantModal 
        isOpen={isAssistantOpen} 
        onSaveAndClose={(hist) => { 
            // Use safe optional chaining for parts[0]
            setChatHistory(prev => [...prev, { 
                id: Date.now().toString(), 
                title: hist[0]?.parts?.[0]?.text?.slice(0, 30) || 'Chat', 
                messages: hist, 
                timestamp: Date.now() 
            }]); 
            setIsAssistantOpen(false); 
            setCurrentChatHistory([]); 
        }} 
        contextMedicine={selectedMedicine} 
        contextCosmetic={selectedCosmetic} 
        allMedicines={medicines} 
        favoriteMedicines={medicines.filter(m => favorites.includes(m.RegisterNumber))} 
        initialPrompt={assistantPrompt} 
        initialHistory={currentChatHistory} 
        t={t} 
        language={language}
        onShowAlternatives={handleShowAlternativesFromAssistant} 
      />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} groupedPharmaceuticalForms={groupedPharmaceuticalForms} uniqueManufactureNames={uniqueManufactureNames} uniqueLegalStatuses={uniqueLegalStatuses} t={t} />
      <BarcodeScannerModal isOpen={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)} onBarcodeDetected={(code) => { setSearchTerm(code); setIsBarcodeScannerOpen(false); }} t={t} />
      
      {/* Expanded Edit Medicine Modal with All Fields */}
      {isEditMedicineModalOpen && editingMedicine && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditMedicineModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">{t('editMedicine')}</h3>
                    <form onSubmit={(e) => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-4 overflow-y-auto pr-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Basic Info */}
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('tradeName')}</label>
                                    <input type="text" value={editingMedicine['Trade Name']} onChange={e => setEditingMedicine({...editingMedicine, "Trade Name": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" required />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('scientificName')}</label>
                                    <input type="text" value={editingMedicine['Scientific Name']} onChange={e => setEditingMedicine({...editingMedicine, "Scientific Name": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" required/>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('price')}</label>
                                    <input type="number" step="0.01" value={editingMedicine['Public price']} onChange={e => setEditingMedicine({...editingMedicine, "Public price": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" required/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('legalStatus')}</label>
                                    <select value={editingMedicine['Legal Status']} onChange={e => setEditingMedicine({...editingMedicine, "Legal Status": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none">
                                        <option value="OTC">OTC</option>
                                        <option value="Prescription">Prescription</option>
                                        <option value="">Other</option>
                                    </select>
                                </div>
                                
                                {/* Form & Strength */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('strength')}</label>
                                    <input type="text" value={editingMedicine.Strength} onChange={e => setEditingMedicine({...editingMedicine, Strength: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('strengthUnit')}</label>
                                    <input type="text" value={editingMedicine.StrengthUnit} onChange={e => setEditingMedicine({...editingMedicine, StrengthUnit: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('pharmaceuticalForm')}</label>
                                    <input type="text" value={editingMedicine.PharmaceuticalForm} onChange={e => setEditingMedicine({...editingMedicine, PharmaceuticalForm: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                {/* Manufacturers & Agents */}
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('manufacturer')}</label>
                                    <input type="text" value={editingMedicine['Manufacture Name']} onChange={e => setEditingMedicine({...editingMedicine, "Manufacture Name": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('countryOfManufacture')}</label>
                                    <input type="text" value={editingMedicine['Manufacture Country']} onChange={e => setEditingMedicine({...editingMedicine, "Manufacture Country": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('marketingCompany')}</label>
                                    <input type="text" value={editingMedicine['Marketing Company']} onChange={e => setEditingMedicine({...editingMedicine, "Marketing Company": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('packageSize')}</label>
                                    <input type="text" value={editingMedicine.PackageSize} onChange={e => setEditingMedicine({...editingMedicine, PackageSize: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('packageType')}</label>
                                    <input type="text" value={editingMedicine.PackageTypes} onChange={e => setEditingMedicine({...editingMedicine, PackageTypes: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('mainAgent')}</label>
                                    <input type="text" value={editingMedicine['Main Agent']} onChange={e => setEditingMedicine({...editingMedicine, "Main Agent": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                 <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('agents')}</label>
                                    <input type="text" value={editingMedicine['Secosnd Agent']} onChange={e => setEditingMedicine({...editingMedicine, "Secosnd Agent": e.target.value})} placeholder="Second Agent" className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none mb-1" />
                                    <input type="text" value={editingMedicine['Third agent']} onChange={e => setEditingMedicine({...editingMedicine, "Third agent": e.target.value})} placeholder="Third Agent" className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('storageConditions')}</label>
                                    <input type="text" value={editingMedicine['Storage conditions']} onChange={e => setEditingMedicine({...editingMedicine, "Storage conditions": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('shelfLife')}</label>
                                    <input type="text" value={editingMedicine.shelfLife} onChange={e => setEditingMedicine({...editingMedicine, shelfLife: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                {/* Additional Codes */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('registrationNumber')}</label>
                                    <input type="text" value={editingMedicine.RegisterNumber} disabled className="w-full mt-1 p-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-gray-500 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('referenceNumber')}</label>
                                    <input type="text" value={editingMedicine.ReferenceNumber} onChange={e => setEditingMedicine({...editingMedicine, ReferenceNumber: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('descriptionCode')}</label>
                                    <input type="text" value={editingMedicine['Description Code']} onChange={e => setEditingMedicine({...editingMedicine, "Description Code": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 mt-2">
                            <button type="button" onClick={() => handleDeleteMedicine(editingMedicine)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium mr-auto border border-red-100">{t('delete')}</button>
                            <button type="button" onClick={() => setIsEditMedicineModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium">{t('cancel')}</button>
                            <button type="button" onClick={() => handleSaveEditedMedicine(false)} className="px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium">{t('saveLocalOnly')}</button>
                            <button type="button" onClick={() => handleSaveEditedMedicine(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2" disabled={FIREBASE_DISABLED}>
                                {t('saveAndSync')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
      )}
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
                            <button type="button" onClick={() => handleSaveEditedCosmetic(false)} className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-medium">{t('saveLocalOnly')}</button>
                            <button type="button" onClick={() => handleSaveEditedCosmetic(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2" disabled={FIREBASE_DISABLED}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                {t('saveAndSync')}
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