
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, 
  InsuranceSearchMode, Cosmetic, MilkProduct, Notification as AppNotification
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
import NotificationsView from './components/NotificationsView';

// Icons
import AdminIcon from './components/icons/AdminIcon';
import HistoryIcon from './components/icons/HistoryIcon';
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';
import TrashIcon from './components/icons/TrashIcon';

// Auth Components
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';

// Utils & Helpers
import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED, messaging, getToken, onMessage } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot, query, orderBy, arrayUnion, updateDoc } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';

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
  "Product type": String(item["Product type"] || (item.DrugType === 'Health' ? 'Supplement' : 'Human')),
  DrugType: String(item.DrugType || ''),
  "Manufacture Name": String(item["Manufacture Name"] || item.ManufacturerNameEN || ''),
  "Manufacture Country": String(item["Manufacture Country"] || item.ManufacturerCountry || ''),
  "Storage conditions": String(item["Storage conditions"] || item.StorageConditions || ''),
  "Storage Condition Arabic": String(item["Storage Condition Arabic"] || ''),
  "Main Agent": String(item["Main Agent"] || item.Agent || ''),
  imgBox: item.imgBox || item.boxImage || '',
  imgStrip: item.imgStrip || item.stripImage || '',
  imgPill: item.imgPill || item.pillImage || '',
  pillShape: item.pillShape || '',
  pillScored: item.pillScored || '',
  pillMarkings: item.pillMarkings || '',
  liquidTaste: item.liquidTaste || '',
  liquidColor: item.liquidColor || '',
  physicalNotes: item.physicalNotes || ''
});

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3';
const READ_NOTIFICATIONS_KEY = 'pharma_read_notifications';

const App: React.FC = () => {
  const { user } = useAuth();

  // --- Push Notifications Setup ---
  useEffect(() => {
    // Only attempt setup if messaging is supported and user is logged in
    if (!messaging || !user || FIREBASE_DISABLED) return;

    const setupPushNotifications = async () => {
        try {
            // 1. Check current permission status
            let permission = Notification.permission;
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            if (permission === 'granted') {
                // 2. Register Service Worker and get Token
                // Updated with the user-provided VAPID key
                const token = await getToken(messaging, {
                    vapidKey: 'BNn53g7KGps9GuqXfKBgYyP3UmfSzed1F5OrEet036YyxA1QYGOg5hnqhgmGCqy98hgekzwWZAWHCIOk3x8bDgM' 
                });
                
                if (token) {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, {
                        fcmTokens: arrayUnion(token)
                    });
                    console.log('FCM Device Token registered:', token);
                }
            }
        } catch (err) {
            console.error("FCM Registration Error:", err);
        }
    };

    setupPushNotifications();

    // 3. Foreground Message Listener (When the app is open)
    const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        
        // Play notification sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked by browser policy until user interaction'));

        // Show standard browser notification if permission allows, or a custom toast
        if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'PharmaSource', {
                body: payload.notification?.body,
                icon: '/logo.png'
            });
        }
    });

    return () => unsubscribe();
  }, [user]);

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
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [milkProducts, setMilkProducts] = useState<MilkProduct[]>([]);
  const [clinicalGuidelines, setClinicalGuidelines] = useState<any>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]'); } catch { return []; }
  });

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
  const [cosmeticsLimit, setResultsLimitCosm] = useState(20);

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

  const [isEditCosmeticModalOpen, setIsEditCosmeticModalOpen] = useState(false);
  const [editingCosmetic, setEditingCosmetic] = useState<Cosmetic | null>(null);
  const [isEditMedicineModalOpen, setIsEditMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('saved_prescriptions') || '[]');
      } catch { return []; }
  });

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
                    const medicinesSnapshot = await getDocs(collection(db, 'medicines'));
                    const cloudMedicines: Medicine[] = [];
                    medicinesSnapshot.forEach((doc) => {
                        cloudMedicines.push(normalizeMedicine({ ...doc.data() }));
                    });

                    if (cloudMedicines.length > 0) {
                        setMedicines(prev => {
                            const mergedMap = new Map(prev.map(m => [m.RegisterNumber, m]));
                            cloudMedicines.forEach(m => mergedMap.set(m.RegisterNumber, m));
                            const mergedArray = Array.from(mergedMap.values());
                            setItem(MEDICINES_CACHE_KEY, mergedArray).catch(console.error);
                            return mergedArray;
                        });
                    }

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
                } catch (err) {
                    console.warn("Background fetch failed:", err);
                }
            }
        } catch (e) {
            console.error("Error loading data", e);
            setIsDataLoaded(true);
        }
    };
    const timer = setTimeout(loadData, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
      if (FIREBASE_DISABLED) return;
      const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched: AppNotification[] = [];
          snapshot.forEach(doc => {
              fetched.push({ id: doc.id, ...doc.data() } as AppNotification);
          });
          setNotifications(fetched);
      });
      return () => unsubscribe();
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

  useEffect(() => { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('saved_prescriptions', JSON.stringify(prescriptions)); }, [prescriptions]);
  useEffect(() => { localStorage.setItem('chat_history', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotificationIds)); }, [readNotificationIds]);

  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    if (view === 'results' || view === 'cosmeticsSearch' || view === 'milkSearch') {
      if (scrollPositionRef.current > 0) {
        setTimeout(() => { if(container) container.scrollTop = scrollPositionRef.current; }, 0);
      }
    } else if (view === 'details' || view === 'cosmeticDetails' || view === 'alternatives' || view === 'insuranceDetails') {
        container.scrollTop = 0;
    }
  }, [view]);

  const t: TFunction = useCallback((key, replacements) => {
    const text = translations[language][key] || key;
    if (replacements) return Object.entries(replacements).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
    return text;
  }, [language]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
  const toggleFavorite = useCallback((id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]), []);
  const handleAdminClick = useCallback(() => { if (user?.role === 'admin') { setView('admin'); setActiveTab('settings'); } }, [user]);
  
  const handleMedicineSelect = useCallback((medicine: Medicine) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedMedicine(medicine); setView('details'); 
  }, []);
  
  const handleCosmeticSelect = useCallback((cosmetic: Cosmetic) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedCosmetic(cosmetic); setView('cosmeticDetails'); 
  }, []);

  const handleFindAlternative = useCallback((medicine: Medicine) => {
    const cleanSciName = medicine['Scientific Name'].toLowerCase().trim();
    const getStrengthNum = (str: string) => {
        const match = str.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : -1;
    };
    const sourceStrength = getStrengthNum(medicine.Strength);
    const direct = medicines.filter(m => m.RegisterNumber !== medicine.RegisterNumber && m['Scientific Name'].toLowerCase().trim() === cleanSciName);
    direct.sort((a, b) => {
        const aStrength = getStrengthNum(a.Strength);
        const bStrength = getStrengthNum(b.Strength);
        if (aStrength === sourceStrength && bStrength !== sourceStrength) return -1;
        if (aStrength !== sourceStrength && bStrength === sourceStrength) return 1;
        return a['Trade Name'].localeCompare(b['Trade Name']);
    });
    let therapeutic: Medicine[] = [];
    if (medicine.AtcCode1) {
        therapeutic = medicines.filter(m => m.AtcCode1 === medicine.AtcCode1 && m['Scientific Name'].toLowerCase().trim() !== cleanSciName);
        therapeutic.sort((a, b) => parseFloat(a['Public price']) - parseFloat(b['Public price']));
    }
    setSourceMedicine(medicine); setAlternativesResults({ direct, therapeutic });
    setView('alternatives');
  }, [medicines]);

  const handleShowAlternativesFromAssistant = useCallback((medicine: Medicine) => { setIsAssistantOpen(false); handleFindAlternative(medicine); }, [handleFindAlternative]);
  const effectiveSearchLength = searchTerm.replace(/%/g, '').trim().length;
  const isSearchActive = (effectiveSearchLength >= 3 || forceSearch || filters.productType !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' || filters.pharmaceuticalForm !== '' || filters.manufactureName.length > 0 || filters.legalStatus !== '');

  useEffect(() => { setResultsLimit(20); }, [searchTerm, filters, sortBy, textSearchMode, forceSearch]);
  useEffect(() => { setResultsLimitCosm(20); }, [cosmeticsSearchTerm, selectedBrand]);

  const filteredMedicines = useMemo(() => {
      if (!isDataLoaded) return [];
      let results = medicines;
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm && (effectiveSearchLength >= 3 || forceSearch)) {
          const lowerTerm = trimmedTerm.toLowerCase();
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchRegex = new RegExp(lowerTerm.includes('%') ? lowerTerm.split('%').map(escapeRegExp).join('.*') : '^' + escapeRegExp(lowerTerm), 'i');
          results = results.filter(m => textSearchMode === 'tradeName' ? searchRegex.test(m['Trade Name'].toLowerCase()) : textSearchMode === 'scientificName' ? searchRegex.test(m['Scientific Name'].toLowerCase()) : searchRegex.test(m['Trade Name'].toLowerCase()) || searchRegex.test(m['Scientific Name'].toLowerCase()));
      } else if (trimmedTerm && effectiveSearchLength < 3 && !forceSearch) return [];
      if (filters.productType !== 'all') results = results.filter(m => filters.productType === 'medicine' ? m['Product type'] === 'Human' : m['Product type'] === 'Supplement' || m.DrugType === 'Health');
      if (filters.priceMin !== '') results = results.filter(m => parseFloat(m['Public price']) >= parseFloat(filters.priceMin));
      if (filters.priceMax !== '') results = results.filter(m => parseFloat(m['Public price']) <= parseFloat(filters.priceMax));
      if (filters.legalStatus !== '') results = results.filter(m => m['Legal Status'] === filters.legalStatus);
      if (filters.manufactureName.length > 0) results = results.filter(m => filters.manufactureName.includes(m['Manufacture Name']));
      results.sort((a, b) => sortBy === 'priceAsc' ? parseFloat(a['Public price']) - parseFloat(b['Public price']) : sortBy === 'priceDesc' ? parseFloat(b['Public price']) - parseFloat(a['Public price']) : sortBy === 'scientificName' ? a['Scientific Name'].localeCompare(b['Scientific Name']) : a['Trade Name'].localeCompare(b['Trade Name']));
      return results;
  }, [medicines, searchTerm, textSearchMode, filters, sortBy, effectiveSearchLength, forceSearch, isDataLoaded]);

  const handleDeleteMedicine = useCallback(async (medicine: Medicine) => {
      if (!window.confirm(t('confirmDeleteMedicine'))) return;
      setMedicines(prev => {
          const updated = prev.filter(m => m.RegisterNumber !== medicine.RegisterNumber);
          setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      setIsEditMedicineModalOpen(false); setEditingMedicine(null);
      if (selectedMedicine?.RegisterNumber === medicine.RegisterNumber) { setSelectedMedicine(null); setView('results'); }
      if (!FIREBASE_DISABLED) try { await deleteDoc(doc(db, 'medicines', medicine.RegisterNumber)); } catch (e) { console.error(e); }
  }, [t, selectedMedicine]);

  const handleSaveEditedMedicine = useCallback(async (syncToCloud: boolean) => {
      if (!editingMedicine) return;
      const normalized = normalizeMedicine(editingMedicine);
      setMedicines(prev => {
          const updated = prev.map(m => m.RegisterNumber === normalized.RegisterNumber ? normalized : m);
          setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
          return updated;
      });
      if (selectedMedicine?.RegisterNumber === normalized.RegisterNumber) setSelectedMedicine(normalized);
      if (syncToCloud && !FIREBASE_DISABLED) {
          try { await setDoc(doc(db, 'medicines', normalized.RegisterNumber), normalized, { merge: true }); alert("Saved to Cloud"); }
          catch (e) { alert("Failed to sync to cloud."); }
      }
      setIsEditMedicineModalOpen(false); setEditingMedicine(null);
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
      if (selectedCosmetic?.id === editingCosmetic.id) setSelectedCosmetic(editingCosmetic);
      if (syncToCloud && !FIREBASE_DISABLED) {
          try { await setDoc(doc(db, 'cosmetics', editingCosmetic.id), editingCosmetic, { merge: true }); alert("Saved to Cloud"); }
          catch (e) { alert("Failed to sync to cloud."); }
      }
      setIsEditCosmeticModalOpen(false); setEditingCosmetic(null);
  }, [editingCosmetic, selectedCosmetic]);

  const handleClearFilters = useCallback(() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' }), []);
  const handleClearSearch = useCallback(() => { setSearchTerm(''); setTextSearchMode('tradeName'); handleClearFilters(); setSortBy('alphabetical'); setView('search'); setForceSearch(false); }, [handleClearFilters]);
  const handleClearSearchOnly = useCallback(() => { setSearchTerm(''); setView('search'); setForceSearch(false); }, []);
  const handleForceSearch = useCallback(() => { if (searchTerm.trim().length > 0) setForceSearch(true); }, [searchTerm]);
  const handleFilterChange = useCallback(<K extends keyof Filters>(filterName: K, value: Filters[K]) => setFilters(prevFilters => ({ ...prevFilters, [filterName]: value })), []);

  const uniqueManufactureNames = useMemo(() => Array.from(new Set(medicines.map(m => m['Manufacture Name']))).sort(), [medicines]);
  const uniqueLegalStatuses = useMemo(() => Array.from(new Set(medicines.map(m => m['Legal Status']).filter(Boolean))).sort(), [medicines]);
  const groupedPharmaceuticalForms = useMemo(() => groupPharmaceuticalForms(Array.from(new Set(medicines.map(m => m.PharmaceuticalForm))), t), [medicines, t]);
  const activeFilterCount = useMemo(() => (filters.productType !== 'all' ? 1 : 0) + (filters.priceMin !== '' ? 1 : 0) + (filters.priceMax !== '' ? 1 : 0) + (filters.pharmaceuticalForm !== '' ? 1 : 0) + (filters.manufactureName.length > 0 ? 1 : 0) + (filters.legalStatus !== '' ? 1 : 0), [filters]);

  const handleBack = useCallback(() => {
      if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'cosmeticDetails') setView('cosmeticsSearch');
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (['login', 'register', 'admin', 'aiHistory', 'addData', 'addInsuranceData', 'addCosmeticsData', 'verifyEmail', 'notifications'].includes(view)) setView('settings');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view]);

  const handleImportData = useCallback((data: any[]) => {
      const normalizedData = data.map(normalizeMedicine);
      setMedicines(prev => {
          const map = new Map(); prev.forEach(m => map.set(m.RegisterNumber, m)); normalizedData.forEach(m => map.set(m.RegisterNumber, m));
          const updated = Array.from(map.values()) as Medicine[]; setItem(MEDICINES_CACHE_KEY, updated); return updated;
      });
      alert(t('importSuccess', { count: data.length })); setView('settings');
  }, [t]);

  const checkAiAccess = useCallback((): boolean => {
      if (!user) { alert(t('loginRequired')); setView('login'); setActiveTab('settings'); return false; }
      return true;
  }, [user, t]);

  const handleOpenAssistant = useCallback(() => { if (!checkAiAccess()) return; setSelectedMedicine(null); setSelectedCosmetic(null); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); }, [checkAiAccess]);
  const handleOpenPrescriptionAssistant = useCallback(() => { if (!checkAiAccess()) return; if (user?.role !== 'admin' && !user?.prescriptionPrivilege) { alert(t('accessDeniedPrescription')); return; } setAssistantPrompt('##PRESCRIPTION_MODE##'); setActiveConversationId(null); setIsAssistantOpen(true); }, [user, t, checkAiAccess]);
  const handleOpenAssistantWithContext = useCallback((medicine: Medicine) => { if (!checkAiAccess()) return; setSelectedMedicine(medicine); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); }, [checkAiAccess]);
  const handleSaveAssistantHistory = useCallback((hist: ChatMessage[]) => {
      setIsAssistantOpen(false); setCurrentChatHistory([]);
      if (!hist.some(msg => msg.role === 'user')) { setActiveConversationId(null); return; }
      setChatHistory(prev => {
          if (activeConversationId) return prev.map(c => c.id === activeConversationId ? { ...c, messages: hist, timestamp: Date.now() } : c);
          const firstUserMsg = hist.find(m => m.role === 'user');
          const titleText = firstUserMsg?.parts.find(p => p.text)?.text || 'New Conversation';
          return [...prev, { id: Date.now().toString(), title: titleText.slice(0, 30) + (titleText.length > 30 ? '...' : ''), messages: hist, timestamp: Date.now() }];
      });
      setActiveConversationId(null);
  }, [activeConversationId]);

  const SectionTitleEdit = ({ title }: { title: string }) => (
      <h4 className="text-sm font-bold text-primary dark:text-primary-light uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 mt-6">{title}</h4>
  );

  const notificationsWithReadStatus = useMemo(() => {
      return notifications.map(n => ({
          ...n,
          isRead: readNotificationIds.includes(n.id)
      }));
  }, [notifications, readNotificationIds]);

  const hasNewNotifications = useMemo(() => {
      return notifications.some(n => !readNotificationIds.includes(n.id));
  }, [notifications, readNotificationIds]);

  const handleMarkAllRead = useCallback(() => {
      const allIds = notifications.map(n => n.id);
      setReadNotificationIds(allIds);
  }, [notifications]);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { alert(t('registerSuccessPending')); setView('login'); }} />;
      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} /> : null;
      if (view === 'aiHistory') return <ChatHistoryView conversations={chatHistory} onSelectConversation={(convo) => { setActiveConversationId(convo.id); setCurrentChatHistory(convo.messages); setIsAssistantOpen(true); }} onDeleteConversation={(id) => setChatHistory(prev => prev.filter(c => c.id !== id))} onClearHistory={() => setChatHistory([])} t={t} language={language} />;
      if (view === 'notifications') return <NotificationsView notifications={notificationsWithReadStatus} onMarkAllRead={handleMarkAllRead} t={t} language={language} />;
      if (activeTab === 'search') {
          return (
              <>
                <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={isSearchActive} onClearSearch={handleClearSearchOnly} onForceSearch={handleForceSearch} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                    {!isDataLoaded && <div className="w-full h-1 bg-gray-100 overflow-hidden mt-1 rounded-full"><div className="h-full bg-primary/50 animate-progress origin-left w-full"></div></div>}
                    <div className="flex gap-2 mt-2">
                        <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={activeFilterCount} t={t} />
                        <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                    </div>
                    <div className="mt-4">
                        {isSearchActive && <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (checkAiAccess()) { setSelectedMedicine(m); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); } }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState={isDataLoaded ? (filteredMedicines.length > 0 ? 'loaded' : 'empty') : 'loading'} limit={resultsLimit} onLoadMore={() => setResultsLimit(prev => prev + 20)} />}
                        {!isSearchActive && !searchTerm && <div className="flex flex-col items-center justify-center py-20 opacity-80 pointer-events-none select-none"><h2 className="text-xl font-bold text-gray-400 dark:text-slate-600 font-poppins tracking-wide">PharmaSource</h2><div className="h-1 w-12 bg-primary/30 rounded-full mt-2"></div></div>}
                    </div>
                </div>
                {view === 'details' && selectedMedicine && <MedicineDetail medicine={selectedMedicine!} t={t} language={language} isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={handleEditMedicine} onOpenAssistant={() => handleOpenAssistantWithContext(selectedMedicine!)} />}
                {view === 'alternatives' && sourceMedicine && alternativesResults && <AlternativesView sourceMedicine={sourceMedicine!} alternatives={alternativesResults!} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={() => {}} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />}
              </>
          );
      }
      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} />;
      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={handleEditCosmetic} />;
          return <CosmeticsView t={t} language={language} cosmetics={cosmetics} onSelectCosmetic={handleCosmeticSelect} searchTerm={cosmeticsSearchTerm} setSearchTerm={setCosmeticsSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} limit={cosmeticsLimit} onLoadMore={() => setResultsLimitCosm(prev => prev + 20)} onCosmeticLongPress={(c) => { if (checkAiAccess()) { setSelectedCosmetic(c); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); } }} />;
      }
      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }
      if (activeTab === 'settings') {
          if (view === 'addData') return <AddDataView onImport={handleImportData} t={t} />;
          if (view === 'addInsuranceData') return <AddInsuranceDataView onImport={(d) => { setInsuranceData(prev => [...prev, ...d]); setView('settings'); }} t={t} />;
          if (view === 'addCosmeticsData') return <AddCosmeticsDataView onImport={(d) => { setCosmetics(prev => [...prev, ...d.map((it, ix) => ({ ...it, id: it.id || `custom-${Date.now()}-${ix}` }))]); setView('settings'); }} t={t} />;
          return (
              <div className="space-y-4 animate-fade-in">
                  <h2 className="text-xl font-bold">{t('navSettings')}</h2>
                  <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">{user ? <div className="flex justify-between items-center"><div><p className="font-bold">{user.username}</p><p className="text-sm text-gray-500">{user.role}</p></div>{user.role === 'admin' && <button onClick={handleAdminClick} className="p-2 bg-primary/10 text-primary rounded-full"><AdminIcon /></button>}</div> : <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>}</div>
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><button onClick={() => { if(checkAiAccess()) setView('aiHistory'); }} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"><span className="flex items-center gap-3"><div className="w-5 h-5 text-primary"><HistoryIcon /></div> {t('aiActivityLog')}</span></button></div>
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"><span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span></button><button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"><span>{t('language')}</span><span className="font-bold">{language === 'ar' ? 'العربية' : 'English'}</span></button></div>
                  {user?.role === 'admin' && (
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><h3 className="p-4 text-sm font-bold text-gray-500 uppercase">{t('dataManagement')}</h3><button onClick={() => setView('addData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700"><div className="w-5 h-5"><DatabaseIcon /></div> {t('addData')}</button><button onClick={() => setView('addInsuranceData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700"><div className="w-5 h-5"><DatabaseIcon /></div> {t('addInsuranceData')}</button><button onClick={() => setView('addCosmeticsData')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700"><div className="w-5 h-5"><DatabaseIcon /></div> {t('addCosmeticsData')}</button></div>
                  )}
              </div>
          );
      }
      return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch' && view !== 'milkSearch'} onBack={handleBack} theme={theme} toggleTheme={toggleTheme} t={t} onLoginClick={() => { setView('login'); setActiveTab('settings'); }} onAdminClick={handleAdminClick} onNotificationsClick={() => setView('notifications')} view={view} hasNewNotifications={hasNewNotifications} />
      <main id="main-scroll-container" className={`flex-grow mx-auto px-4 space-y-4 transition-all duration-300 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] ${view === 'admin' ? 'w-full max-w-[98%]' : 'container max-w-7xl'}`}>{renderContent()}</main>
      <BottomNavBar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView(tab === 'search' ? 'search' : tab === 'insurance' ? 'insuranceSearch' : tab === 'cosmetics' ? 'cosmeticsSearch' : tab === 'milk' ? 'milkSearch' : 'settings'); }} t={t} user={user} view={view} />
      <div className="fixed bottom-24 right-4 z-30"><FloatingAssistantButton onClick={handleOpenAssistant} onLongPress={handleOpenPrescriptionAssistant} t={t} language={language} /></div>
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={handleSaveAssistantHistory} contextMedicine={selectedMedicine} contextCosmetic={selectedCosmetic} allMedicines={medicines} favoriteMedicines={medicines.filter(m => favorites.includes(m.RegisterNumber))} initialPrompt={assistantPrompt} initialHistory={currentChatHistory} t={t} language={language} onShowAlternatives={handleShowAlternativesFromAssistant} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} groupedPharmaceuticalForms={groupedPharmaceuticalForms} uniqueManufactureNames={uniqueManufactureNames} uniqueLegalStatuses={uniqueLegalStatuses} t={t} />
      <BarcodeScannerModal isOpen={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)} onBarcodeDetected={(code) => { setSearchTerm(code); setIsBarcodeScannerOpen(false); }} t={t} />
      
      {isEditMedicineModalOpen && editingMedicine && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditMedicineModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">{t('editMedicine')}</h3>
                    <form onSubmit={(e) => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-4 overflow-y-auto pr-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2"><SectionTitleEdit title="Identification" /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('tradeName')}</label><input type="text" value={editingMedicine['Trade Name']} onChange={e => setEditingMedicine({...editingMedicine, "Trade Name": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" required /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('scientificName')}</label><input type="text" value={editingMedicine['Scientific Name']} onChange={e => setEditingMedicine({...editingMedicine, "Scientific Name": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" required/></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('price')}</label><input type="number" step="0.01" value={editingMedicine['Public price']} onChange={e => setEditingMedicine({...editingMedicine, "Public price": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" required/></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('legalStatus')}</label><select value={editingMedicine['Legal Status']} onChange={e => setEditingMedicine({...editingMedicine, "Legal Status": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none"><option value="OTC">OTC</option><option value="Prescription">Prescription</option><option value="">Other</option></select></div>

                                <div className="sm:col-span-2"><SectionTitleEdit title={t('physicalDetails')} /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('boxImage')} (Firebase URL)</label><input type="text" value={editingMedicine.imgBox || ''} onChange={e => setEditingMedicine({...editingMedicine, imgBox: e.target.value})} placeholder="https://firebasestorage..." className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('stripImage')} (Firebase URL)</label><input type="text" value={editingMedicine.imgStrip || ''} onChange={e => setEditingMedicine({...editingMedicine, imgStrip: e.target.value})} placeholder="https://firebasestorage..." className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('pillImage')} (Firebase URL)</label><input type="text" value={editingMedicine.imgPill || ''} onChange={e => setEditingMedicine({...editingMedicine, imgPill: e.target.value})} placeholder="https://firebasestorage..." className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('pillShape')}</label><input type="text" value={editingMedicine.pillShape || ''} onChange={e => setEditingMedicine({...editingMedicine, pillShape: e.target.value})} placeholder="Round, Oval..." className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('scored')}</label><select value={editingMedicine.pillScored || ''} onChange={e => setEditingMedicine({...editingMedicine, pillScored: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none"><option value="">Unknown</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('markings')}</label><input type="text" value={editingMedicine.pillMarkings || ''} onChange={e => setEditingMedicine({...editingMedicine, pillMarkings: e.target.value})} placeholder="P 500, etc." className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('taste')}</label><input type="text" value={editingMedicine.liquidTaste || ''} onChange={e => setEditingMedicine({...editingMedicine, liquidTaste: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('liquidColor')}</label><input type="text" value={editingMedicine.liquidColor || ''} onChange={e => setEditingMedicine({...editingMedicine, liquidColor: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Physical Notes</label><textarea value={editingMedicine.physicalNotes || ''} onChange={e => setEditingMedicine({...editingMedicine, physicalNotes: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" rows={2} /></div>

                                <div className="sm:col-span-2"><SectionTitleEdit title="Form & Logistics" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('strength')}</label><input type="text" value={editingMedicine.Strength} onChange={e => setEditingMedicine({...editingMedicine, Strength: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">{t('strengthUnit')}</label><input type="text" value={editingMedicine.StrengthUnit} onChange={e => setEditingMedicine({...editingMedicine, StrengthUnit: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('pharmaceuticalForm')}</label><input type="text" value={editingMedicine.PharmaceuticalForm} onChange={e => setEditingMedicine({...editingMedicine, PharmaceuticalForm: e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                                <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">{t('manufacturer')}</label><input type="text" value={editingMedicine['Manufacture Name']} onChange={e => setEditingMedicine({...editingMedicine, "Manufacture Name": e.target.value})} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none" /></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-slate-700 flex-shrink-0">
                            <button onClick={() => handleDeleteMedicine(editingMedicine)} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"><TrashIcon /> {t('delete')}</button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditMedicineModalOpen(false)} className="px-5 py-2.5 bg-white border dark:bg-transparent dark:border-slate-600 rounded-lg text-sm font-bold">{t('cancel')}</button>
                                <button onClick={() => handleSaveEditedMedicine(true)} disabled={FIREBASE_DISABLED} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold">{t('saveAndSync')}</button>
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
