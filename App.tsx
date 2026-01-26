
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, 
  InsuranceSearchMode, Cosmetic, MilkProduct, Notification as AppNotification, PendingUpdate
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
import EditMedicineModal from './components/EditMedicineModal';
import ImageViewer from './components/ImageViewer';

import AdminIcon from './components/icons/AdminIcon';
import HistoryIcon from './components/icons/HistoryIcon';
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';
import TrashIcon from './components/icons/TrashIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import PillBottleIcon from './components/icons/PillBottleIcon';
// Fix: Added missing BackIcon import
import BackIcon from './components/icons/BackIcon';

import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';

import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED, messaging, getToken, onMessage } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot, query, orderBy, arrayUnion, updateDoc, addDoc, where, limit as firestoreLimit } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';

const normalizeMedicine = (item: any): Medicine => {
  const findPrice = (obj: any) => {
      const priceKeys = ["Public price", "Price", "public price", "price", "PriceSAR", "CIFPrice"];
      for (const key of priceKeys) {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
              return String(obj[key]).replace(/[^0-9.]/g, '');
          }
      }
      return '0';
  };

  return {
    ...item,
    RegisterNumber: String(item.RegisterNumber || item.Id || Math.random()),
    "Public price": findPrice(item),
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
    imgIndex1: item.imgIndex1 || item.imgStrip || '', 
    imgIndex2: item.imgIndex2 || '',
    imgPill: item.imgPill || item.pillImage || '',
    pillShape: item.pillShape || '',
    pillScored: item.pillScored || '',
    pillMarkings: item.pillMarkings || '',
    liquidTaste: item.liquidTaste || '',
    liquidColor: item.liquidColor || '',
    physicalNotes: item.physicalNotes || ''
  };
};

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3';
const READ_NOTIFICATIONS_KEY = 'pharma_read_notifications';

const App: React.FC = () => {
  const { user } = useAuth();
  const scrollPositionRef = useRef(0);

  const scrollToTop = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // --- Edge Swipe Back Logic with Visuals ---
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    let touchStartX = 0;
    const EDGE_THRESHOLD = 40; 
    const SWIPE_MIN_DISTANCE = 100;

    const handleTouchStart = (e: TouchEvent) => {
        const x = e.touches[0].clientX;
        const screenWidth = window.innerWidth;
        const isRTL = document.documentElement.dir === 'rtl';

        if ((!isRTL && x < EDGE_THRESHOLD) || (isRTL && x > screenWidth - EDGE_THRESHOLD)) {
            touchStartX = x;
            setIsSwiping(true);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diff = Math.abs(currentX - touchStartX);
        const progress = Math.min(diff / SWIPE_MIN_DISTANCE, 1.2);
        setSwipeProgress(progress);
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (!isSwiping) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = Math.abs(touchEndX - touchStartX);

        if (diffX > SWIPE_MIN_DISTANCE) {
            handleBack();
        }
        
        setIsSwiping(false);
        setSwipeProgress(0);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSwiping, handleBack]);

  useEffect(() => {
    if (!messaging || !user || FIREBASE_DISABLED) return;

    const setupPushNotifications = async () => {
        try {
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: 'BNn53g7KGps9GuqXfKBgYyP3UmfSzed1F5OrEet036YyxA1QYGOg5hnqhgmGCqy98hgekzwWZAWHCIOk3x8bDgM' 
                });
                if (token) {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, {
                        fcmTokens: arrayUnion(token)
                    });
                }
            }
        } catch (err) {
            console.error("FCM Registration Error:", err);
        }
  };
    setupPushNotifications();

    const unsubscribe = onMessage(messaging, (payload) => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked'));
        if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'PharmaSource', {
                body: payload.notification?.body,
                icon: '/logo.png'
            });
        }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
      if (FIREBASE_DISABLED) return;
      const q = user ? query(
          collection(db, 'notifications'), 
          orderBy('timestamp', 'desc'),
          firestoreLimit(50)
      ) : null;

      if (!q) return;

      const unsubscribe = onSnapshot(q, (snapshot) => {
          const notifs: AppNotification[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data() as any;
              const isForMe = !data.targetUserId && !data.targetRole;
              const isDirectlyForMe = data.targetUserId === user?.id;
              const isForAdminRole = data.targetRole === 'admin' && user?.role === 'admin';

              if (isForMe || isDirectlyForMe || isForAdminRole) {
                  notifs.push({ id: doc.id, ...data } as AppNotification);
              }
          });
          setNotifications(notifs);
      }, (error) => {
          console.error("Firestore Snapshot Error (Notifications):", error);
      });

      return () => unsubscribe();
  }, [user]);

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
      try { return JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]') as string[]; } catch { return []; }
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
    marketingCompany: [],
    mainAgent: [],
    legalStatus: '',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [forceSearch, setForceSearch] = useState(false);
  const [resultsLimit, setResultsLimit] = useState(20);
  const [cosmeticsLimit, setResultsLimitCosm] = useState(20);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [sourceMedicine, setSourceMedicine] = useState<Medicine | null>(null);
  const [alternativesResults, setAlternativesResults] = useState<{ direct: Medicine[], therapeutic: Medicine[] } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Conversation[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('chat_history') || '[]') as Conversation[];
      } catch { return []; }
  });
  const [currentChatHistory, setCurrentChatHistory] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isEditMedicineModalOpen, setIsEditMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomImageTitle, setZoomImageTitle] = useState('');
  const [isZoomImageIndex, setIsZoomImageIndex] = useState(false);
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>(() => {
      try {
          return JSON.parse(localStorage.getItem('saved_prescriptions') || '[]') as PrescriptionData[];
      } catch { return []; }
  });

  function handleBack() {
      if (view === 'imageView') setView('details');
      else if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'cosmeticDetails') setView('cosmeticsSearch');
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (['login', 'register', 'admin', 'aiHistory', 'addData', 'addInsuranceData', 'addCosmeticsData', 'verifyEmail', 'notifications'].includes(view)) setView(activeTab === 'search' ? 'search' : activeTab === 'settings' ? 'settings' : activeTab === 'insurance' ? 'insuranceSearch' : activeTab === 'cosmetics' ? 'cosmeticsSearch' : 'milkSearch');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }

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
                } catch (err: any) {
                    console.warn("Background fetch failed (likely permissions):", err.message);
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
  
  useEffect(() => { 
      try {
          const safeHistory = JSON.stringify(chatHistory);
          localStorage.setItem('chat_history', safeHistory); 
      } catch (e) {
          console.error("Failed to save chat history due to circular data:", e);
      }
  }, [chatHistory]);

  useEffect(() => { localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotificationIds)); }, [readNotificationIds]);

  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    if (view === 'results' || view === 'cosmeticsSearch' || view === 'milkSearch') {
      if (scrollPositionRef.current > 0) { setTimeout(() => { if(container) container.scrollTop = scrollPositionRef.current; }, 0); }
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

  const handleUpdateMedicine = useCallback(async (updatedMed: Medicine) => {
      if (!user) return;
      if (user.role === 'admin') {
          setMedicines(prev => {
              const updated = prev.map(m => m.RegisterNumber === updatedMed.RegisterNumber ? updatedMed : m);
              setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
              return updated;
          });
          if (selectedMedicine?.RegisterNumber === updatedMed.RegisterNumber) {
              setSelectedMedicine(updatedMed);
          }
          if (!FIREBASE_DISABLED) {
              await setDoc(doc(db, 'medicines', updatedMed.RegisterNumber), updatedMed, { merge: true });
          }
      } else if (user.role === 'company') {
          if (!FIREBASE_DISABLED) {
              const original = medicines.find(m => m.RegisterNumber === updatedMed.RegisterNumber);
              const changedData: any = {};
              if (original) {
                  Object.keys(updatedMed).forEach(key => {
                      const k = key as keyof Medicine;
                      if (String(updatedMed[k]) !== String((original as any)[k])) {
                          changedData[k] = updatedMed[k];
                      }
                  });
              } else {
                  Object.assign(changedData, updatedMed);
              }
              if (Object.keys(changedData).length === 0) {
                  alert("لم يتم تغيير أي بيانات.");
                  return;
              }
              const pendingUpdate: Omit<PendingUpdate, 'id'> = {
                  medicineId: updatedMed.RegisterNumber,
                  type: original ? 'edit' : 'add',
                  newData: changedData,
                  originalData: original || {},
                  submittedBy: user.id,
                  submittedByName: user.username,
                  timestamp: Date.now(),
                  status: 'pending'
              };
              await addDoc(collection(db, 'pending_updates'), pendingUpdate);
              await addDoc(collection(db, 'notifications'), {
                  title: 'طلب تعديل جديد من شركة',
                  body: `قامت شركة ${user.username} بطلب تعديل على دواء ${updatedMed['Trade Name']}. يرجى المراجعة من لوحة التحكم.`,
                  timestamp: Date.now(),
                  type: 'approval_request',
                  targetRole: 'admin'
              });
              alert(t('requestSubmittedBody'));
          }
      }
  }, [selectedMedicine, user, medicines, t]);

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
  
  const isAnyFilterActive = useMemo(() => {
    return filters.productType !== 'all' || 
           filters.priceMin !== '' || 
           filters.priceMax !== '' || 
           filters.pharmaceuticalForm !== '' || 
           filters.manufactureName.length > 0 || 
           filters.marketingCompany.length > 0 || 
           filters.mainAgent.length > 0 || 
           filters.legalStatus !== '';
  }, [filters]);

  const isSearchActive = (searchTerm.replace(/%/g, '').trim().length >= 3 || forceSearch || isAnyFilterActive);

  useEffect(() => { setResultsLimit(20); }, [searchTerm, filters, sortBy, textSearchMode, forceSearch]);
  useEffect(() => { setResultsLimitCosm(20); }, [cosmeticsSearchTerm, selectedBrand]);

  const filteredMedicines = useMemo(() => {
      if (!isDataLoaded) return [];
      let results = [...medicines];
      const trimmedTerm = searchTerm.trim();
      const lowerTerm = trimmedTerm.toLowerCase();
      const effectiveLength = searchTerm.replace(/%/g, '').trim().length;

      if (trimmedTerm && (effectiveLength >= 3 || forceSearch || isAnyFilterActive)) {
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchRegex = new RegExp(lowerTerm.includes('%') ? lowerTerm.split('%').map(escapeRegExp).join('.*') : '^' + escapeRegExp(lowerTerm), 'i');
          results = results.filter(m => textSearchMode === 'tradeName' ? searchRegex.test(m['Trade Name'].toLowerCase()) : textSearchMode === 'scientificName' ? searchRegex.test(m['Scientific Name'].toLowerCase()) : searchRegex.test(m['Trade Name'].toLowerCase()) || searchRegex.test(m['Scientific Name'].toLowerCase()));
      } else if (trimmedTerm && effectiveLength < 3 && !forceSearch && !isAnyFilterActive) {
          return [];
      }
      
      if (filters.productType !== 'all') {
          results = results.filter(m => filters.productType === 'medicine' ? m['Product type'] === 'Human' : m['Product type'] === 'Supplement' || m.DrugType === 'Health');
      }
      if (filters.priceMin !== '') results = results.filter(m => parseFloat(m['Public price']) >= parseFloat(filters.priceMin));
      if (filters.priceMax !== '') results = results.filter(m => parseFloat(m['Public price']) <= parseFloat(filters.priceMax));
      if (filters.legalStatus !== '') results = results.filter(m => m['Legal Status'] === filters.legalStatus);
      if (filters.manufactureName.length > 0) results = results.filter(m => filters.manufactureName.includes(m['Manufacture Name']));
      if (filters.marketingCompany.length > 0) results = results.filter(m => filters.marketingCompany.includes(m['Marketing Company']));
      if (filters.mainAgent.length > 0) results = results.filter(m => filters.mainAgent.includes(m['Main Agent']));
      
      results.sort((a, b) => {
          if (sortBy === 'priceAsc') return parseFloat(a['Public price']) - parseFloat(b['Public price']);
          if (sortBy === 'priceDesc') return parseFloat(b['Public price']) - parseFloat(a['Public price']);
          if (sortBy === 'scientificName') return a['Scientific Name'].localeCompare(b['Scientific Name']);
          return a['Trade Name'].localeCompare(b['Trade Name']);
      });
      
      return results;
  }, [medicines, searchTerm, textSearchMode, filters, sortBy, forceSearch, isDataLoaded, isAnyFilterActive]);

  // --- Dynamic Filters Logic (Filter on Filter) ---
  const dynamicFilterSource = useMemo(() => {
      if (!isDataLoaded) return [];
      if (!isAnyFilterActive && !searchTerm) return medicines;
      
      // We want to return medicines filtered by everything EXCEPT the current specific filter category
      // but for simplicity and better UX, we'll use the already filtered results
      return filteredMedicines;
  }, [medicines, filteredMedicines, isAnyFilterActive, searchTerm, isDataLoaded]);

  const uniqueManufactureNames = useMemo(() => {
    const source = (filters.manufactureName.length > 0) ? medicines : dynamicFilterSource;
    const names = new Set(source.map(m => m['Manufacture Name']).filter(Boolean));
    return Array.from(names).sort();
  }, [dynamicFilterSource, medicines, filters.manufactureName]);

  const uniqueMarketingCompanies = useMemo(() => {
    const source = (filters.marketingCompany.length > 0) ? medicines : dynamicFilterSource;
    const names = new Set(source.map(m => m['Marketing Company']).filter(Boolean));
    return Array.from(names).sort();
  }, [dynamicFilterSource, medicines, filters.marketingCompany]);

  const uniqueMainAgents = useMemo(() => {
    const source = (filters.mainAgent.length > 0) ? medicines : dynamicFilterSource;
    const names = new Set(source.map(m => m['Main Agent']).filter(Boolean));
    return Array.from(names).sort();
  }, [dynamicFilterSource, medicines, filters.mainAgent]);

  const uniqueLegalStatuses = useMemo(() => {
    const statuses = new Set(dynamicFilterSource.map(m => m['Legal Status']).filter(Boolean));
    return Array.from(statuses).sort();
  }, [dynamicFilterSource]);

  const groupedPharmaceuticalForms = useMemo(() => {
    const forms = Array.from(new Set(dynamicFilterSource.map(m => m.PharmaceuticalForm).filter(Boolean)));
    return groupPharmaceuticalForms(forms, t);
  }, [dynamicFilterSource, t]);

  const handleDeleteNotification = useCallback(async (id: string) => {
      if (!window.confirm(t('confirmDeleteNotification'))) return;
      if (!FIREBASE_DISABLED) {
          try { await deleteDoc(doc(db, 'notifications', id)); }
          catch (e) { console.error("Failed to delete notification", e); }
      }
  }, [t]);

  const notificationsWithReadStatus = useMemo(() => {
      return notifications.map(n => ({ ...n, isRead: readNotificationIds.includes(n.id) }));
  }, [notifications, readNotificationIds]);

  const unreadCount = useMemo(() => {
      return notifications.filter(n => !readNotificationIds.includes(n.id)).length;
  }, [notifications, readNotificationIds]);

  const handleMarkAsRead = useCallback((id: string) => {
      setReadNotificationIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    // Fix: cast to string[] to resolve type inference issue and satisfy string[] parameter requirement for setReadNotificationIds
    const allIds = notifications.map(n => String(n.id)) as string[];
    setReadNotificationIds(allIds);
  }, [notifications]);

  const handleExportByTypeFromSettings = useCallback((type: 'Human' | 'Supplement') => {
      const dataToExport = medicines.filter(m => {
          if (type === 'Human') return m['Product type'] === 'Human';
          return m['Product type'] === 'Supplement' || m.DrugType === 'Health' || m.DrugType === 'Herbal';
      });

      if (dataToExport.length === 0) {
        alert("No data available to export in this category.");
        return;
      }

      const headers = [
          "RegisterNumber", "Trade Name", "Scientific Name", "Public price", 
          "PharmaceuticalForm", "Strength", "StrengthUnit", "PackageSize", 
          "PackageTypes", "Manufacture Name", "Manufacture Country", 
          "Main Agent", "Legal Status", "Product Control", "AtcCode1", 
          "AtcCode2", "shelfLife", "Storage conditions", "Storage Condition Arabic", 
          "Marketing Company", "Marketing Country", "AdministrationRoute",
          "Product type", "DrugType", "Sub-Type", "Description Code",
          "imgBox", "imgIndex1", "imgIndex2", "imgPill", 
          "pillShape", "pillScored", "pillMarkings", 
          "liquidTaste", "liquidColor", "physicalNotes"
      ];
      const rows = dataToExport.map(m => {
          return headers.map(header => {
              let cell = (m as any)[header] || '';
              cell = String(cell).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
              return `"${cell}"`;
          }).join(',');
      });
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `PharmaSource_${type}_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(t('exportSuccess'));
  }, [medicines, t]);

  const handleExportByType = useCallback((type: 'Human' | 'Supplement') => {
      handleExportByTypeFromSettings(type);
  }, [handleExportByTypeFromSettings]);

  const handleSaveAssistantHistory = useCallback((history: ChatMessage[]) => {
      if (!user || history.length <= 1) { 
          setIsAssistantOpen(false);
          return;
      }
      const convoId = activeConversationId || `convo-${Date.now()}`;
      const firstUserMsg = history.find(m => m.role === 'user');
      const textPart = firstUserMsg?.parts.find(p => 'text' in p) as { text: string } | undefined;
      const title = textPart?.text.substring(0, 35) || t('aiActivityLog');
      const newConvo: Conversation = { id: convoId, title: title, messages: history, timestamp: Date.now() };
      setChatHistory(prev => {
          const filtered = prev.filter(c => c.id !== convoId);
          return [newConvo, ...filtered];
      });
      setIsAssistantOpen(false);
      setActiveConversationId(null);
      setCurrentChatHistory([]);
  }, [user, activeConversationId, t]);

  const handleImageZoom = useCallback((url: string, title: string, isIndex: boolean = false) => {
    setZoomImageUrl(url);
    setZoomImageTitle(title);
    setIsZoomImageIndex(isIndex);
    setView('imageView');
  }, []);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { alert(t('registerSuccessPending')); setView('login'); }} />;
      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} /> : null;
      if (view === 'aiHistory') return <ChatHistoryView conversations={chatHistory} onSelectConversation={(convo) => { setActiveConversationId(convo.id); setCurrentChatHistory(convo.messages); setIsAssistantOpen(true); }} onDeleteConversation={(id) => setChatHistory(prev => prev.filter(c => c.id !== id))} onClearHistory={() => setChatHistory([])} t={t} language={language} />;
      if (view === 'notifications') return <NotificationsView notifications={notificationsWithReadStatus} onMarkAllRead={handleMarkAllRead} onMarkAsRead={handleMarkAsRead} onDeleteNotification={handleDeleteNotification} isAdmin={user?.role === 'admin'} t={t} language={language} />;
      if (activeTab === 'search') {
          return (
              <>
                <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={isSearchActive} onClearSearch={() => { setSearchTerm(''); setView('search'); setForceSearch(false); }} onForceSearch={() => { if (searchTerm.trim().length > 0) { setForceSearch(true); scrollToTop(); } }} onSearchIconClick={scrollToTop} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                    {!isDataLoaded && <div className="w-full h-1 bg-gray-100 overflow-hidden mt-1 rounded-full"><div className="h-full bg-primary/50 animate-progress origin-left w-full"></div></div>}
                    
                    {/* Results Count Header */}
                    {isSearchActive && (
                        <div className="flex items-center justify-between px-1 py-1 animate-fade-in">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {filteredMedicines.length} {language === 'ar' ? 'نتيجة' : 'results'}
                            </span>
                        </div>
                    )}

                    <div className="flex gap-2 mt-1">
                        <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={(filters.productType !== 'all' ? 1 : 0) + (filters.priceMin !== '' ? 1 : 0) + (filters.priceMax !== '' ? 1 : 0) + (filters.pharmaceuticalForm !== '' ? 1 : 0) + (filters.manufactureName.length > 0 ? 1 : 0) + (filters.marketingCompany.length > 0 ? 1 : 0) + (filters.mainAgent.length > 0 ? 1 : 0) + (filters.legalStatus !== '' ? 1 : 0)} t={t} />
                        <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                    </div>
                    <div className="mt-4">
                        {isSearchActive && <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (user) { setSelectedMedicine(m); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); } else { alert(t('loginRequired')); setView('login'); } }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState={isDataLoaded ? (filteredMedicines.length > 0 ? 'loaded' : 'empty') : 'loading'} limit={resultsLimit} onLoadMore={() => setResultsLimit(prev => prev + 20)} />}
                        {!isSearchActive && !searchTerm && <div className="flex flex-col items-center justify-center py-20 opacity-80 pointer-events-none select-none"><h2 className="text-xl font-bold text-gray-400 dark:text-slate-600 font-poppins tracking-wide">PharmaSource</h2><div className="h-1 w-12 bg-primary/30 rounded-full mt-2"></div></div>}
                    </div>
                </div>
                {view === 'details' && selectedMedicine && <MedicineDetail medicine={selectedMedicine!} t={t} language={language} isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(med) => { setEditingMedicine({...med}); setIsEditMedicineModalOpen(true); }} onOpenAssistant={() => { if (user) { setSelectedMedicine(selectedMedicine); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); } else { alert(t('loginRequired')); setView('login'); } }} onImageZoom={handleImageZoom} />}
                {view === 'alternatives' && sourceMedicine && alternativesResults && <AlternativesView sourceMedicine={sourceMedicine!} alternatives={alternativesResults!} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={() => {}} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />}
              </>
          );
      }
      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} scrollToTop={scrollToTop} />;
      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={(c) => { alert("Cosmetic editing not yet implemented in detail view."); }} />;
          return <CosmeticsView t={t} language={language} cosmetics={cosmetics} onSelectCosmetic={handleCosmeticSelect} searchTerm={cosmeticsSearchTerm} setSearchTerm={setSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} limit={cosmeticsLimit} onLoadMore={() => setResultsLimitCosm(prev => prev + 20)} onCosmeticLongPress={(c) => { if (user) { setSelectedCosmetic(c); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true); } else { alert(t('loginRequired')); setView('login'); } }} onSearchIconClick={scrollToTop} />;
      }
      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} onSearchIconClick={scrollToTop} />;
      }
      if (activeTab === 'settings') {
          return (
              <div className="space-y-4 animate-fade-in pb-10">
                  <h2 className="text-xl font-bold">{t('navSettings')}</h2>
                  <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">{user ? <div className="flex justify-between items-center"><div><p className="font-bold">{user.username}</p><p className="text-sm text-gray-500">{user.role === 'admin' ? t('adminRole') : user.role === 'company' ? t('companyRole') : t('premiumRole')}</p></div>{user.role === 'admin' && <button onClick={handleAdminClick} className="p-2 bg-primary/10 text-primary rounded-full"><AdminIcon /></button>}</div> : <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>}</div>
                  
                  {user?.role === 'admin' && (
                      <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl shadow-sm border border-teal-100 dark:border-teal-800 animate-fade-in space-y-4">
                          <p className="font-bold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-widest">{t('exportData')}</p>
                          <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => handleExportByType('Human')}
                                className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm active:scale-95 flex flex-col items-center gap-1"
                              >
                                  <div className="w-5 h-5"><PillBottleIcon /></div>
                                  <span className="text-[10px] font-bold">الأدوية (CSV)</span>
                              </button>
                              <button 
                                onClick={() => handleExportByType('Supplement')}
                                className="p-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-sm active:scale-95 flex flex-col items-center gap-1"
                              >
                                  <div className="w-5 h-5"><DatabaseIcon /></div>
                                  <span className="text-[10px] font-bold">المكملات (CSV)</span>
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><button onClick={() => { if(user) setView('aiHistory'); else { alert(t('loginRequired')); setView('login'); } }} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"><span className="flex items-center gap-3"><div className="w-5 h-5 text-primary"><HistoryIcon /></div> {t('aiActivityLog')}</span></button></div>
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"><span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span></button><button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"><span>{t('language')}</span><span className="font-bold">{language === 'ar' ? 'العربية' : 'English'}</span></button></div>
              </div>
          );
      }
      return null;
  };

  const handleAssistantLaunch = useCallback(() => {
      if (!user) { alert(t('loginRequired')); setView('login'); return; }
      setSelectedMedicine(null); setSelectedCosmetic(null); setAssistantPrompt(''); setActiveConversationId(null); setIsAssistantOpen(true);
  }, [user, t]);

  const handlePrescriptionLaunch = useCallback(() => {
      if (!user) { alert(t('loginRequired')); setView('login'); return; }
      if (user.role !== 'admin' && !user.prescriptionPrivilege) { alert(t('accessDeniedPrescription')); return; }
      setSelectedMedicine(null); setSelectedCosmetic(null); setActiveConversationId(null); setAssistantPrompt('##PRESCRIPTION_MODE##'); setIsAssistantOpen(true);
  }, [user, t]);

  const handleTabChange = useCallback((tab: Tab) => {
    if (tab === activeTab) {
        scrollToTop();
    } else {
        setActiveTab(tab); 
        setView(tab === 'search' ? 'search' : tab === 'insurance' ? 'insuranceSearch' : tab === 'cosmetics' ? 'cosmeticsSearch' : tab === 'milk' ? 'milkSearch' : 'settings');
    }
  }, [activeTab, scrollToTop]);

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch' && view !== 'milkSearch'} onBack={handleBack} theme={theme} toggleTheme={toggleTheme} t={t} onLoginClick={() => { setView('login'); setActiveTab('settings'); }} onAdminClick={handleAdminClick} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={unreadCount} />
      
      {/* Visual Swipe Back Indicator */}
      {isSwiping && (
          <div 
            className="fixed inset-y-0 z-[100] pointer-events-none flex items-center justify-center transition-opacity"
            style={{ 
                left: document.documentElement.dir === 'rtl' ? 'auto' : 0, 
                right: document.documentElement.dir === 'rtl' ? 0 : 'auto',
                width: '60px',
                opacity: swipeProgress,
                background: `linear-gradient(${document.documentElement.dir === 'rtl' ? 'to left' : 'to right'}, rgba(45, 212, 191, 0.2), transparent)`
            }}
          >
              <div 
                className="bg-primary/80 text-white p-2 rounded-full shadow-lg transform transition-transform"
                style={{ transform: `scale(${Math.min(0.5 + swipeProgress, 1)})` }}
              >
                  {/* Fix: BackIcon was previously not imported in this file */}
                  <div className={`w-6 h-6 transform ${document.documentElement.dir === 'rtl' ? '' : 'rotate-180'}`}><BackIcon /></div>
              </div>
          </div>
      )}

      <main id="main-scroll-container" className={`flex-grow mx-auto px-4 space-y-4 transition-all duration-300 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] ${view === 'admin' ? 'w-full max-w-[98%]' : 'container max-w-7xl'}`}>
          {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} t={t} user={user} view={view} />
      <div className="fixed bottom-24 right-4 z-30"><FloatingAssistantButton onClick={handleAssistantLaunch} onLongPress={handlePrescriptionLaunch} t={t} language={language} /></div>
      {view === 'imageView' && zoomImageUrl && <ImageViewer imageUrl={zoomImageUrl} title={zoomImageTitle} onBack={handleBack} t={t} isIndexImage={isZoomImageIndex} />}
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={handleSaveAssistantHistory} contextMedicine={selectedMedicine} contextCosmetic={selectedCosmetic} allMedicines={medicines} favoriteMedicines={medicines.filter(m => favorites.includes(m.RegisterNumber))} initialPrompt={assistantPrompt} initialHistory={currentChatHistory} t={t} language={language} onShowAlternatives={handleShowAlternativesFromAssistant} />
      <EditMedicineModal isOpen={isEditMedicineModalOpen} onClose={() => setIsEditMedicineModalOpen(false)} medicine={editingMedicine} onSave={handleUpdateMedicine} t={t} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={(n,v) => setFilters(p => ({...p, [n]:v}))} onClearFilters={() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' })} groupedPharmaceuticalForms={groupedPharmaceuticalForms} uniqueManufactureNames={uniqueManufactureNames} uniqueMarketingCompanies={uniqueMarketingCompanies} uniqueMainAgents={uniqueMainAgents} uniqueLegalStatuses={uniqueLegalStatuses} t={t} />
      <BarcodeScannerModal isOpen={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)} onBarcodeDetected={(code) => { setSearchTerm(code); setIsBarcodeScannerOpen(false); }} t={t} />
    </div>
  );
};

export default App;
