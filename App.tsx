
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
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';

// Icons
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';
import AdminIcon from './components/icons/AdminIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';
import HistoryIcon from './components/icons/HistoryIcon';
import TrashIcon from './components/icons/TrashIcon';

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
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3'; // Updated Version to force refresh

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
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

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

  // Load Data with IndexedDB Migration and Cloud Sync
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Try to load from IndexedDB
            let medicinesData = await getItem<Medicine[]>(MEDICINES_CACHE_KEY);
            let cosmeticsData = await getItem<Cosmetic[]>(COSMETICS_CACHE_KEY);

            // 2. Migration Check
            if (!medicinesData) {
                const lsMedicines = localStorage.getItem(MEDICINES_CACHE_KEY);
                if (lsMedicines) {
                    try {
                        medicinesData = JSON.parse(lsMedicines);
                        await setItem(MEDICINES_CACHE_KEY, medicinesData);
                        localStorage.removeItem(MEDICINES_CACHE_KEY); 
                    } catch (e) {}
                }
            }

            if (!cosmeticsData) {
                const lsCosmetics = localStorage.getItem(COSMETICS_CACHE_KEY);
                if (lsCosmetics) {
                    try {
                        cosmeticsData = JSON.parse(lsCosmetics);
                        await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
                        localStorage.removeItem(COSMETICS_CACHE_KEY);
                    } catch (e) {}
                }
            }

            // 3. Fallback to Static
            if (!medicinesData) {
                medicinesData = [...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW].map(normalizeMedicine);
                await setItem(MEDICINES_CACHE_KEY, medicinesData);
            }
            
            if (!cosmeticsData) {
                cosmeticsData = INITIAL_COSMETICS_DATA;
                await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
            }

            setMedicines(medicinesData || []);
            setCosmetics(cosmeticsData || []);

            // 4. Background Sync with Firebase (for fresh data)
            if (!FIREBASE_DISABLED) {
                // Fetch Cosmetics
                try {
                    const cosmeticsSnapshot = await getDocs(collection(db, 'cosmetics'));
                    const cloudCosmetics: Cosmetic[] = [];
                    cosmeticsSnapshot.forEach((doc) => {
                        cloudCosmetics.push({ id: doc.id, ...doc.data() } as Cosmetic);
                    });

                    if (cloudCosmetics.length > 0) {
                        setCosmetics(prev => {
                            // Merge strategy: Create a map of existing items, update with cloud items
                            const mergedMap = new Map(prev.map(c => [c.id, c]));
                            cloudCosmetics.forEach(c => mergedMap.set(c.id, c));
                            const mergedArray = Array.from(mergedMap.values());
                            
                            // Only update if count changes or force update needed (basic check)
                            // For simplicity, we just save and set.
                            setItem(COSMETICS_CACHE_KEY, mergedArray).catch(console.error);
                            return mergedArray;
                        });
                    }
                } catch (err) {
                    console.warn("Background fetch for cosmetics failed:", err);
                }
            }

        } catch (e) {
            console.error("Error loading data", e);
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

  // Scroll Restore Logic
  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    if (view === 'results' || view === 'cosmeticsSearch') {
      if (scrollPositionRef.current > 0) {
        setTimeout(() => {
            if(container) container.scrollTop = scrollPositionRef.current;
        }, 0);
      }
    } else if (view === 'details' || view === 'cosmeticDetails' || view === 'alternatives' || view === 'insuranceDetails') {
        container.scrollTop = 0;
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

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const handleAdminClick = useCallback(() => {
      if (user?.role === 'admin') {
          setView('admin');
          setActiveTab('settings');
      }
  }, [user]);

  const handleMedicineSelect = useCallback((medicine: Medicine) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) {
          scrollPositionRef.current = container.scrollTop;
      }
      setSelectedMedicine(medicine); 
      setView('details'); 
  }, []);
  
  const handleCosmeticSelect = useCallback((cosmetic: Cosmetic) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) {
          scrollPositionRef.current = container.scrollTop;
      }
      setSelectedCosmetic(cosmetic); 
      setView('cosmeticDetails'); 
  }, []);

  const handleFindAlternative = useCallback((medicine: Medicine) => {
    const cleanSciName = medicine['Scientific Name'].toLowerCase().trim();
    
    const getStrengthNum = (str: string) => {
        const match = str.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : -1;
    };
    
    const sourceStrength = getStrengthNum(medicine.Strength);
    const sourceForm = medicine.PharmaceuticalForm.toLowerCase();

    const direct = medicines.filter(m => 
        m.RegisterNumber !== medicine.RegisterNumber &&
        m['Scientific Name'].toLowerCase().trim() === cleanSciName
    );

    const sortFunction = (a: Medicine, b: Medicine) => {
        const aStrength = getStrengthNum(a.Strength);
        const bStrength = getStrengthNum(b.Strength);
        
        const aStrengthMatch = aStrength === sourceStrength;
        const bStrengthMatch = bStrength === sourceStrength;
        
        if (aStrengthMatch && !bStrengthMatch) return -1;
        if (!aStrengthMatch && bStrengthMatch) return 1;
        
        if (!aStrengthMatch && !bStrengthMatch && aStrength !== bStrength) {
             return aStrength - bStrength; 
        }

        const aForm = a.PharmaceuticalForm.toLowerCase();
        const bForm = b.PharmaceuticalForm.toLowerCase();
        const aFormMatch = aForm.includes(sourceForm) || sourceForm.includes(aForm);
        const bFormMatch = bForm.includes(sourceForm) || sourceForm.includes(bForm);

        if (aFormMatch && !bFormMatch) return -1;
        if (!aFormMatch && bFormMatch) return 1;

        return a['Trade Name'].localeCompare(b['Trade Name']);
    };

    direct.sort(sortFunction);

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
    
    const container = document.getElementById('main-scroll-container');
    if (container) {
        scrollPositionRef.current = container.scrollTop;
    }
    setView('alternatives');
  }, [medicines]);

  const handleShowAlternativesFromAssistant = useCallback((medicine: Medicine) => {
      setIsAssistantOpen(false); 
      handleFindAlternative(medicine);
  }, [handleFindAlternative]);

  const effectiveSearchLength = searchTerm.replace(/%/g, '').trim().length;
  const isSearchActive = (effectiveSearchLength >= 3 || forceSearch || filters.productType !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' || filters.pharmaceuticalForm !== '' || filters.manufactureName.length > 0 || filters.legalStatus !== '');

  useEffect(() => {
      setResultsLimit(20);
  }, [searchTerm, filters, sortBy, textSearchMode, forceSearch]);

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

  const handleDeleteMedicine = useCallback(async (medicine: Medicine) => {
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
  }, [t, selectedMedicine]);

  const handleSaveEditedMedicine = useCallback(async (syncToCloud: boolean) => {
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
  }, [editingMedicine, selectedMedicine]);

  const handleEditMedicine = useCallback((med: Medicine) => { setEditingMedicine({...med}); setIsEditMedicineModalOpen(true); }, []);
  const handleEditCosmetic = useCallback((c: Cosmetic) => { setEditingCosmetic({...c}); setIsEditCosmeticModalOpen(true); }, []);
  
  const handleSaveEditedCosmetic = useCallback(async (syncToCloud: boolean) => {
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
  }, [editingCosmetic, selectedCosmetic]);

  const handleDeleteCosmetic = useCallback(async (cosmetic: Cosmetic) => {
      if (!window.confirm(t('confirmDeleteCosmetic'))) return;
      setCosmetics(prev => {
          const updated = prev.filter(c => c.id !== cosmetic.id);
          setItem(COSMETICS_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      setIsEditCosmeticModalOpen(false);
      setEditingCosmetic(null);
      if (selectedCosmetic && selectedCosmetic.id === cosmetic.id) {
          setSelectedCosmetic(null);
          setView('cosmeticsSearch');
      }
      if (!FIREBASE_DISABLED) {
          try { await deleteDoc(doc(db, 'cosmetics', cosmetic.id)); } catch (e) { console.error(e); }
      }
  }, [t, selectedCosmetic]);

  const handleClearFilters = useCallback(() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' }), []);
  const handleClearSearch = useCallback(() => { setSearchTerm(''); setTextSearchMode('tradeName'); handleClearFilters(); setSortBy('alphabetical'); setView('search'); setForceSearch(false); }, [handleClearFilters]);
  const handleForceSearch = useCallback(() => { if (searchTerm.trim().length > 0) setForceSearch(true); }, [searchTerm]);
  const handleFilterChange = useCallback(<K extends keyof Filters>(filterName: K, value: Filters[K]) => setFilters(prevFilters => ({ ...prevFilters, [filterName]: value })), []);

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
          setView('results'); 
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
      } else if (view === 'results') {
          setView('search');
          setSearchTerm('');
      } else {
          setView('search');
          setActiveTab('search');
      }
  }, [view]);

  const handleImportData = useCallback((data: any[]) => {
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
  }, [t]);

  const handleImportInsuranceData = useCallback((data: any[]) => {
      setInsuranceData(prev => [...prev, ...data]);
      alert(t('importSuccess', { count: data.length }));
      setView('settings');
  }, [t]);

  const handleImportCosmeticsData = useCallback((data: any[]) => {
      const normalizedData = data.map((item, idx) => ({ ...item, id: item.id || `custom-${Date.now()}-${idx}` }));
      setCosmetics(prev => {
          const updated = [...prev, ...normalizedData];
          setItem(COSMETICS_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      alert(t('importSuccess', { count: data.length }));
      setView('settings');
  }, [t]);

  // Handle Reset Cosmetics to Default (Force Reload from Code)
  const handleResetCosmeticsToDefault = useCallback(async () => {
      if(!confirm(t('confirmResetCosmetics'))) return;
      const defaultData = INITIAL_COSMETICS_DATA;
      setCosmetics(defaultData);
      await setItem(COSMETICS_CACHE_KEY, defaultData);
      alert(t('resetSuccess'));
  }, [t]);

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

  // --- Handlers for Assistant with Security Checks ---
  const checkAiAccess = useCallback((): boolean => {
      if (!user) {
          alert(t('loginRequired'));
          setView('login');
          setActiveTab('settings');
          return false;
      }
      return true;
  }, [user, t]);

  const handleOpenAssistant = useCallback(() => {
      if (!checkAiAccess()) return;
      setSelectedMedicine(null); 
      setSelectedCosmetic(null);
      setAssistantPrompt(''); 
      setActiveConversationId(null);
      setIsAssistantOpen(true); 
  }, [checkAiAccess]);

  const handleOpenPrescriptionAssistant = useCallback(() => {
    if (!checkAiAccess()) return;
    if (user?.role !== 'admin' && !user?.prescriptionPrivilege) { 
        alert(t('accessDeniedPrescription')); 
        return; 
    }
    setAssistantPrompt('##PRESCRIPTION_MODE##'); 
    setActiveConversationId(null);
    setIsAssistantOpen(true);
  }, [user, t, checkAiAccess]);

  const handleOpenAssistantWithContext = useCallback((medicine: Medicine) => {
      if (!checkAiAccess()) return;
      setSelectedMedicine(medicine);
      setAssistantPrompt('');
      setActiveConversationId(null);
      setIsAssistantOpen(true);
  }, [checkAiAccess]);
  
  const handleOpenAssistantWithCosmeticContext = useCallback((cosmetic: Cosmetic) => {
      if (!checkAiAccess()) return;
      setSelectedCosmetic(cosmetic);
      setAssistantPrompt('');
      setActiveConversationId(null);
      setIsAssistantOpen(true);
  }, [checkAiAccess]);

  // --- History Handlers ---
  const handleDeleteConversation = useCallback((id: string) => {
      setChatHistory(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
      setChatHistory([]);
  }, []);

  // --- Handle Save Assistant History ---
  const handleSaveAssistantHistory = useCallback((hist: ChatMessage[]) => {
      setIsAssistantOpen(false);
      setCurrentChatHistory([]);

      // 1. Don't save if empty or no user interaction
      const hasUserMessage = hist.some(msg => msg.role === 'user');
      if (!hasUserMessage) {
          setActiveConversationId(null);
          return;
      }

      setChatHistory(prev => {
          // 2. Update existing if active
          if (activeConversationId) {
              return prev.map(c => {
                  if (c.id === activeConversationId) {
                      return {
                          ...c,
                          messages: hist,
                          timestamp: Date.now() // Update timestamp to bump to top
                      };
                  }
                  return c;
              });
          }

          // 3. Create New
          const firstUserMsg = hist.find(m => m.role === 'user');
          const titleText = firstUserMsg?.parts.find(p => p.text)?.text || 'New Conversation';
          const newConvo: Conversation = {
              id: Date.now().toString(),
              title: titleText.slice(0, 30) + (titleText.length > 30 ? '...' : ''),
              messages: hist,
              timestamp: Date.now()
          };
          return [...prev, newConvo];
      });
      setActiveConversationId(null);
  }, [activeConversationId]);

  const handleMedicineLongPress = useCallback((m: Medicine) => {
        if (checkAiAccess()) {
            setSelectedMedicine(m); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); 
        }
  }, [checkAiAccess]);

  const handleCosmeticLongPress = useCallback((c: Cosmetic) => {
        if (checkAiAccess()) {
            setSelectedCosmetic(c);
            setAssistantPrompt('');
            setActiveConversationId(null);
            setIsAssistantOpen(true);
        }
  }, [checkAiAccess]);

  const handleLoadMoreResults = useCallback(() => setResultsLimit(prev => prev + 20), []);
  const handleLoadMoreCosmetics = useCallback(() => setCosmeticsLimit(prev => prev + 20), []);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { alert(t('registerSuccessPending')); setView('login'); }} />;
      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} /> : null;
      if (view === 'aiHistory') {
          return <ChatHistoryView 
              conversations={chatHistory}
              onSelectConversation={(convo) => {
                  setActiveConversationId(convo.id);
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
          // Optimization: Keep list mounted but hidden when on details/alternatives
          // This preserves scroll position and state, fixing lag
          const showList = view === 'search' || view === 'results';
          const isDetails = view === 'details' && selectedMedicine;
          const isAlternatives = view === 'alternatives' && sourceMedicine && alternativesResults;

          return (
              <>
                <div className={showList ? 'contents' : 'hidden'}>
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
                                onMedicineLongPress={handleMedicineLongPress} 
                                onFindAlternative={handleFindAlternative} 
                                favorites={favorites} 
                                onToggleFavorite={toggleFavorite} 
                                t={t} 
                                language={language} 
                                resultsState={filteredMedicines.length > 0 ? 'loaded' : 'empty'}
                                limit={resultsLimit}
                                onLoadMore={handleLoadMoreResults}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-80 pointer-events-none select-none">
                                <h2 className="text-xl font-bold text-gray-400 dark:text-slate-600 font-poppins tracking-wide">PharmaSource</h2>
                                <div className="h-1 w-12 bg-primary/30 rounded-full mt-2"></div>
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
                        onEdit={handleEditMedicine} 
                        onOpenAssistant={() => handleOpenAssistantWithContext(selectedMedicine!)} 
                    />
                )}

                {isAlternatives && (
                    <AlternativesView 
                        sourceMedicine={sourceMedicine!} 
                        alternatives={alternativesResults!} 
                        onMedicineSelect={handleMedicineSelect} 
                        onMedicineLongPress={handleMedicineLongPress} 
                        onFindAlternative={handleFindAlternative} 
                        favorites={favorites} 
                        onToggleFavorite={toggleFavorite} 
                        t={t} 
                        language={language} 
                    />
                )}
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
            onLoadMore={handleLoadMoreCosmetics}
            onCosmeticLongPress={handleCosmeticLongPress}
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
                      <button onClick={() => { if(checkAiAccess()) setView('aiHistory'); }} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700">
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
                        <button onClick={handleResetCosmeticsToDefault} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700 text-red-500"><div className="w-5 h-5"><TrashIcon /></div> {t('resetCosmeticsData')}</button>
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
      <main id="main-scroll-container" className={`flex-grow mx-auto px-4 space-y-4 transition-all duration-300 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] ${view === 'admin' ? 'w-full max-w-[98%]' : 'container max-w-7xl'}`}>
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
            onClick={handleOpenAssistant} 
            onLongPress={handleOpenPrescriptionAssistant} 
            t={t} 
            language={language} 
          />
      </div>
      <AssistantModal 
        isOpen={isAssistantOpen} 
        onSaveAndClose={handleSaveAssistantHistory} 
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
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('oldRegisterNumber')}</label>
                                    <input type="text" value={editingMedicine['Old register Number']} onChange={e => setEditingMedicine({...editingMedicine, "Old register Number": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('atcCode')}</label>
                                    <input type="text" value={editingMedicine.AtcCode1} onChange={e => setEditingMedicine({...editingMedicine, AtcCode1: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('referenceNumber')}</label>
                                    <input type="text" value={editingMedicine.ReferenceNumber} onChange={e => setEditingMedicine({...editingMedicine, ReferenceNumber: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <button onClick={() => handleDeleteMedicine(editingMedicine)} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"><TrashIcon /> {t('delete')}</button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditMedicineModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-300 dark:bg-transparent dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300">{t('cancel')}</button>
                                <div className="flex flex-col gap-1 sm:flex-row">
                                    <button onClick={() => handleSaveEditedMedicine(false)} className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-bold shadow-lg shadow-primary/30">{t('saveLocalOnly')}</button>
                                    <button onClick={() => handleSaveEditedMedicine(true)} disabled={FIREBASE_DISABLED} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-600/30 disabled:bg-slate-400 disabled:cursor-not-allowed">{t('saveAndSync')}</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
      )}

      {/* Edit Cosmetic Modal */}
      {isEditCosmeticModalOpen && editingCosmetic && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditCosmeticModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">Edit Cosmetic</h3>
                    <form onSubmit={(e) => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-4 overflow-y-auto pr-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('brandName')}</label>
                                    <input type="text" value={editingCosmetic.BrandName} onChange={e => setEditingCosmetic({...editingCosmetic, BrandName: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('productName')} (En)</label>
                                    <input type="text" value={editingCosmetic.SpecificName} onChange={e => setEditingCosmetic({...editingCosmetic, SpecificName: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('productName')} (Ar)</label>
                                    <input type="text" value={editingCosmetic.SpecificNameAr} onChange={e => setEditingCosmetic({...editingCosmetic, SpecificNameAr: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category (En)</label>
                                    <input type="text" value={editingCosmetic.FirstSubCategoryEn} onChange={e => setEditingCosmetic({...editingCosmetic, FirstSubCategoryEn: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category (Ar)</label>
                                    <input type="text" value={editingCosmetic.FirstSubCategoryAr} onChange={e => setEditingCosmetic({...editingCosmetic, FirstSubCategoryAr: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('quickActionIngredient')}</label>
                                    <textarea rows={2} value={editingCosmetic['Active ingredient']} onChange={e => setEditingCosmetic({...editingCosmetic, "Active ingredient": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                 <div className="sm:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Key Ingredients</label>
                                    <textarea rows={2} value={editingCosmetic['Key Ingredients']} onChange={e => setEditingCosmetic({...editingCosmetic, "Key Ingredients": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <button onClick={() => handleDeleteCosmetic(editingCosmetic)} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"><TrashIcon /> {t('delete')}</button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditCosmeticModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-300 dark:bg-transparent dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300">{t('cancel')}</button>
                                <div className="flex flex-col gap-1 sm:flex-row">
                                    <button onClick={() => handleSaveEditedCosmetic(false)} className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-bold shadow-lg shadow-primary/30">{t('saveLocalOnly')}</button>
                                    <button onClick={() => handleSaveEditedCosmetic(true)} disabled={FIREBASE_DISABLED} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-600/30 disabled:bg-slate-400 disabled:cursor-not-allowed">{t('saveAndSync')}</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
      )}
    </div>
  );
};

export default App;
