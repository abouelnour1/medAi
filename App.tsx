
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, 
  InsuranceSearchMode, Cosmetic, MilkProduct, Notification as AppNotification,
  PendingMedicineRequest
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

import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';

import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED, messaging, getToken, onMessage } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot, query, orderBy, arrayUnion, updateDoc, addDoc, limit as firestoreLimit, where } from 'firebase/firestore';
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
  "Sub-Type": String(item["Sub-Type"] || ''),
  "Manufacture Name": String(item["Manufacture Name"] || item.ManufacturerNameEN || ''),
  "Manufacture Country": String(item["Manufacture Country"] || item.ManufacturerCountry || ''),
  "Storage conditions": String(item["Storage conditions"] || item.StorageConditions || ''),
  "Storage Condition Arabic": String(item["Storage Condition Arabic"] || ''),
  "Main Agent": String(item["Main Agent"] || item.Agent || ''),
  imgBox: item.imgBox || item.boxImage || '',
  imgIndex1: item.imgIndex1 || item.imgStrip || item.stripImage || '', 
  imgIndex2: item.imgIndex2 || '',
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
      if (FIREBASE_DISABLED || !user) {
          setNotifications([]);
          return;
      }

      // Filter query by user ID to comply with standard individual access security rules
      const q = query(
          collection(db, 'notifications'), 
          where('targetUserId', '==', user.id),
          orderBy('timestamp', 'desc'), 
          firestoreLimit(50)
      );

      const unsubscribe = onSnapshot(q, 
          (snapshot) => {
              const notifs: AppNotification[] = [];
              snapshot.forEach((doc) => {
                  notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
              });
              setNotifications(notifs);
          },
          (error) => {
              console.warn("Notification stream permission error:", error.message);
              // Gracefully handle permission errors without crashing
          }
      );
      return () => unsubscribe();
  }, [user]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
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
    try { return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]') as string[]; } catch { return []; }
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Conversation[]>(() => {
      try { return JSON.parse(localStorage.getItem('chat_history') || '[]') as Conversation[]; } catch { return []; }
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
      try { return JSON.parse(localStorage.getItem('saved_prescriptions') || '[]') as PrescriptionData[]; } catch { return []; }
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
                    medicinesSnapshot.forEach((doc) => { cloudMedicines.push(normalizeMedicine({ ...doc.data() })); });
                    if (cloudMedicines.length > 0) {
                        setMedicines(prev => {
                            const mergedMap = new Map(prev.map(m => [m.RegisterNumber, m]));
                            cloudMedicines.forEach(m => mergedMap.set(m.RegisterNumber, m));
                            const mergedArray = Array.from(mergedMap.values());
                            setItem(MEDICINES_CACHE_KEY, mergedArray).catch(console.error);
                            return mergedArray;
                        });
                    }
                } catch (err) { console.warn("Background fetch failed (likely permissions):", err); }
            }
        } catch (e) { console.error("Error loading data", e); setIsDataLoaded(true); }
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
      } catch (e) { console.error("Failed to save chat history", e); }
  }, [chatHistory]);

  useEffect(() => { localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotificationIds)); }, [readNotificationIds]);

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

  const handleUpdateMedicine = useCallback(async (updatedMed: Medicine) => {
      if (!user) return;

      try {
          // إذا كان المستخدم أدمن، يتم التعديل فوراً
          if (user.role === 'admin') {
              setMedicines(prev => {
                  const updated = prev.map(m => m.RegisterNumber === updatedMed.RegisterNumber ? updatedMed : m);
                  setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
                  return updated;
              });
              if (selectedMedicine?.RegisterNumber === updatedMed.RegisterNumber) setSelectedMedicine(updatedMed);
              if (!FIREBASE_DISABLED) await setDoc(doc(db, 'medicines', updatedMed.RegisterNumber), updatedMed, { merge: true });
          } 
          // إذا كان المستخدم شركة، يتم إرسال طلب اعتماد للأدمن
          else if (user.role === 'company') {
              const request: Omit<PendingMedicineRequest, 'id'> = {
                  type: 'edit',
                  medicineData: updatedMed,
                  submittedBy: user.id,
                  submittedByEmail: user.email || '',
                  submittedByCompany: user.companyName || '',
                  timestamp: Date.now(),
                  status: 'pending'
              };
              if (!FIREBASE_DISABLED) {
                  await addDoc(collection(db, 'pending_requests'), request);
                  alert(t('requestSubmitted'));
              }
          }
      } catch (err) {
          console.error("Permission or update error:", err);
          alert("Insufficient permissions or database error. Please contact administrator.");
      }
  }, [selectedMedicine, user, t]);

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

  const isSearchActive = (searchTerm.replace(/%/g, '').trim().length >= 3 || forceSearch || filters.productType !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' || filters.pharmaceuticalForm !== '' || filters.manufactureName.length > 0 || filters.legalStatus !== '');

  const filteredMedicines = useMemo(() => {
      if (!isDataLoaded) return [];
      let results = [...medicines];
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm && (searchTerm.replace(/%/g, '').trim().length >= 3 || forceSearch)) {
          const lowerTerm = trimmedTerm.toLowerCase();
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchRegex = new RegExp(lowerTerm.includes('%') ? lowerTerm.split('%').map(escapeRegExp).join('.*') : '^' + escapeRegExp(lowerTerm), 'i');
          results = results.filter(m => textSearchMode === 'tradeName' ? searchRegex.test(m['Trade Name'].toLowerCase()) : textSearchMode === 'scientificName' ? searchRegex.test(m['Scientific Name'].toLowerCase()) : searchRegex.test(m['Trade Name'].toLowerCase()) || searchRegex.test(m['Scientific Name'].toLowerCase()));
      } else if (trimmedTerm && searchTerm.replace(/%/g, '').trim().length < 3 && !forceSearch) return [];
      if (filters.productType !== 'all') results = results.filter(m => filters.productType === 'medicine' ? m['Product type'] === 'Human' : m['Product type'] === 'Supplement' || m.DrugType === 'Health');
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
  }, [medicines, searchTerm, textSearchMode, filters, sortBy, forceSearch, isDataLoaded]);

  const handleBack = useCallback(() => {
      if (view === 'imageView') setView('details');
      else if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'cosmeticDetails') setView('cosmeticsSearch');
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (['login', 'register', 'admin', 'aiHistory', 'addData', 'addInsuranceData', 'addCosmeticsData', 'verifyEmail', 'notifications'].includes(view)) setView(activeTab === 'search' ? 'search' : activeTab === 'settings' ? 'settings' : activeTab === 'insurance' ? 'insuranceSearch' : activeTab === 'cosmetics' ? 'cosmeticsSearch' : 'milkSearch');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view, activeTab]);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { alert(t('registerSuccessPending')); setView('login'); }} />;
      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} /> : null;
      if (view === 'aiHistory') return <ChatHistoryView conversations={chatHistory} onSelectConversation={(convo) => { setActiveConversationId(convo.id); setCurrentChatHistory(convo.messages); setIsAssistantOpen(true); }} onDeleteConversation={(id) => setChatHistory(prev => prev.filter(c => c.id !== id))} onClearHistory={() => setChatHistory([])} t={t} language={language} />;
      if (view === 'notifications') return <NotificationsView notifications={notifications.map(n => ({...n, isRead: readNotificationIds.includes(n.id)}))} onMarkAllRead={() => setReadNotificationIds(notifications.map(n => n.id))} onMarkAsRead={(id) => setReadNotificationIds(p => p.includes(id) ? p : [...p, id])} onDeleteNotification={async (id) => { if (!FIREBASE_DISABLED) await deleteDoc(doc(db, 'notifications', id)); }} isAdmin={user?.role === 'admin'} t={t} language={language} />;
      
      if (activeTab === 'search') {
          return (
              <>
                <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={isSearchActive} onClearSearch={() => { setSearchTerm(''); setView('search'); setForceSearch(false); }} onForceSearch={() => { if (searchTerm.trim().length > 0) setForceSearch(true); }} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                    <div className="flex gap-2 mt-2">
                        <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={(filters.productType !== 'all' ? 1 : 0) + (filters.priceMin !== '' ? 1 : 0) + (filters.priceMax !== '' ? 1 : 0) + (filters.pharmaceuticalForm !== '' ? 1 : 0) + (filters.manufactureName.length > 0 ? 1 : 0) + (filters.legalStatus !== '' ? 1 : 0)} t={t} />
                        <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                    </div>
                    <div className="mt-4">
                        {isSearchActive && <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (user) { setSelectedMedicine(m); setIsAssistantOpen(true); } else { setView('login'); } }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState={isDataLoaded ? (filteredMedicines.length > 0 ? 'loaded' : 'empty') : 'loading'} limit={resultsLimit} onLoadMore={() => setResultsLimit(prev => prev + 20)} />}
                    </div>
                </div>
                {view === 'details' && selectedMedicine && <MedicineDetail medicine={selectedMedicine} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(med) => { setEditingMedicine({...med}); setIsEditMedicineModalOpen(true); }} onOpenAssistant={() => setIsAssistantOpen(true)} onImageZoom={(url, title, isIndex) => { setZoomImageUrl(url); setZoomImageTitle(title); setIsZoomImageIndex(isIndex); setView('imageView'); }} />}
                {view === 'alternatives' && sourceMedicine && alternativesResults && <AlternativesView sourceMedicine={sourceMedicine} alternatives={alternativesResults} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={() => {}} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />}
              </>
          );
      }
      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} />;
      if (activeTab === 'cosmetics') return <CosmeticsView t={t} language={language} cosmetics={cosmetics} onSelectCosmetic={(c) => { setSelectedCosmetic(c); setView('cosmeticDetails'); }} searchTerm={cosmeticsSearchTerm} setSearchTerm={setSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} limit={cosmeticsLimit} onLoadMore={() => setResultsLimitCosm(prev => prev + 20)} />;
      if (activeTab === 'insurance') return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      if (activeTab === 'settings') return (
        <div className="space-y-4 animate-fade-in pb-10">
            <h2 className="text-xl font-bold">{t('navSettings')}</h2>
            <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">{user ? <div className="flex justify-between items-center"><div><p className="font-bold">{user.username}</p><p className="text-sm text-gray-500">{user.companyName || user.role}</p></div>{user.role === 'admin' && <button onClick={handleAdminClick} className="p-2 bg-primary/10 text-primary rounded-full"><AdminIcon /></button>}</div> : <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>}</div>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"><span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span></button></div>
        </div>
      );
      return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch' && view !== 'milkSearch'} onBack={handleBack} theme={theme} toggleTheme={toggleTheme} t={t} onLoginClick={() => { setView('login'); setActiveTab('settings'); }} onAdminClick={handleAdminClick} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.filter(n => !readNotificationIds.includes(n.id)).length} />
      <main id="main-scroll-container" className={`flex-grow mx-auto px-4 space-y-4 transition-all duration-300 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] ${view === 'admin' ? 'w-full max-w-[98%]' : 'container max-w-7xl'}`}>
          {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView(tab === 'search' ? 'search' : tab === 'insurance' ? 'insuranceSearch' : tab === 'cosmetics' ? 'cosmeticsSearch' : tab === 'milk' ? 'milkSearch' : 'settings'); }} t={t} user={user} view={view} />
      
      {view === 'imageView' && zoomImageUrl && <ImageViewer imageUrl={zoomImageUrl} title={zoomImageTitle} onBack={handleBack} t={t} isIndexImage={isZoomImageIndex} />}
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={(h) => setIsAssistantOpen(false)} contextMedicine={selectedMedicine} allMedicines={medicines} initialPrompt={assistantPrompt} t={t} language={language} />
      <EditMedicineModal isOpen={isEditMedicineModalOpen} onClose={() => setIsEditMedicineModalOpen(false)} medicine={editingMedicine} onSave={handleUpdateMedicine} t={t} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onFilterChange={(n,v) => setFilters(p => ({...p, [n]:v}))} onClearFilters={() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' })} groupedPharmaceuticalForms={groupPharmaceuticalForms([], t)} uniqueManufactureNames={[]} uniqueLegalStatuses={[]} t={t} />
      <BarcodeScannerModal isOpen={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)} onBarcodeDetected={(code) => { setSearchTerm(code); setIsBarcodeScannerOpen(false); }} t={t} />
    </div>
  );
};

export default App;
