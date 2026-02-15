
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, 
  InsuranceSearchMode, Notification as AppNotification, PendingUpdate
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
import ChatHistoryView from './components/ChatHistoryView';
import InsuranceSearchView from './components/InsuranceSearchView';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import FavoritesView from './components/FavoritesView';
import NotificationsView from './components/NotificationsView';
import EditMedicineModal from './components/EditMedicineModal';
import ImageViewer from './components/ImageViewer';
import AddDataView from './components/AddDataView';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';
import { translations } from './translations';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc, collection, onSnapshot, deleteDoc, query, orderBy, limit as firestoreLimit, addDoc, updateDoc } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';

// Capacitor Plugins for Native Experience
const setupNativeListeners = (onBack: () => void) => {
    import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
            onBack();
        });
    }).catch(() => console.log("Capacitor App plugin not available - web mode"));
};

const normalizeMedicine = (item: any): Medicine => {
  const findValue = (obj: any, keys: string[]) => {
      for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
              const val = String(obj[key]).trim();
              const lowerVal = val.toLowerCase();
              if (lowerVal === 'na' || lowerVal === 'n/a' || lowerVal === 'null' || lowerVal === 'none' || lowerVal === 'undefined') {
                  continue;
              }
              return val;
          }
      }
      return '';
  };

  const findPrice = (obj: any) => {
      const priceStr = findValue(obj, ["Public price", "Price", "public price", "price", "PriceSAR", "CIFPrice"]);
      return priceStr ? priceStr.replace(/[^0-9.]/g, '') : '0';
  };

  const tradeName = findValue(item, ["Trade Name", "TradeName", "tradeName"]);
  const scientificName = findValue(item, ["Scientific Name", "ScientificName", "scientificName"]);
  const strength = findValue(item, ["Strength", "strength"]);
  
  const cleanTrade = String(tradeName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSci = String(scientificName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanStr = String(strength).toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let regNum = findValue(item, ["RegisterNumber", "Id", "id"]);
  
  if (!regNum || regNum === '0' || regNum === '1' || regNum === '2' || regNum === '3' || regNum.trim() === '') {
      regNum = `temp-${cleanTrade}-${cleanSci}-${cleanStr}`;
  }
  
  const drugTypeRaw = String(findValue(item, ["DrugType", "drugType", "Product type", "ProductType"])).toLowerCase();
  
  return {
    RegisterNumber: regNum,
    ReferenceNumber: findValue(item, ["ReferenceNumber", "referenceNumber"]),
    "Old register Number": findValue(item, ["Old register Number", "oldRegisterNumber"]),
    "Product type": (drugTypeRaw.includes('food')) ? 'Food' : 
        (drugTypeRaw.includes('health') || drugTypeRaw.includes('herbal') || drugTypeRaw.includes('supplement') ? 'Supplement' : 'Human'),
    DrugType: findValue(item, ["DrugType", "drugType"]),
    "Sub-Type": findValue(item, ["Sub-Type", "subType"]),
    "Scientific Name": scientificName || 'N/A',
    "Trade Name": tradeName,
    Strength: strength,
    StrengthUnit: findValue(item, ["StrengthUnit", "strengthUnit"]),
    PharmaceuticalForm: findValue(item, ["PharmaceuticalForm", "DoesageForm", "pharmaceuticalForm", "Pharmaceutical Form"]),
    AdministrationRoute: findValue(item, ["AdministrationRoute", "administrationRoute"]),
    AtcCode1: findValue(item, ["AtcCode1", "atcCode1", "AtcCode"]),
    AtcCode2: findValue(item, ["AtcCode2", "atcCode2"]),
    Size: findValue(item, ["Size", "size"]),
    SizeUnit: findValue(item, ["SizeUnit", "sizeUnit"]),
    PackageTypes: findValue(item, ["PackageTypes", "PackageType", "packageType"]),
    PackageSize: findValue(item, ["PackageSize", "packageSize", "Pack Size"]),
    "Legal Status": findValue(item, ["Legal Status", "LegalStatus", "legalStatus"]) || "OTC",
    "Product Control": findValue(item, ["Product Control", "productControl"]),
    "Distribute area": findValue(item, ["Distribute area", "DistributionArea", "distributeArea"]),
    "Public price": findPrice(item),
    shelfLife: findValue(item, ["shelfLife", "ShelfLife", "Shelf Life"]),
    "Storage conditions": findValue(item, ["Storage conditions", "StorageConditions", "storageConditions"]),
    "Storage Condition Arabic": findValue(item, ["Storage Condition Arabic", "storageConditionArabic"]),
    "Marketing Company": findValue(item, ["Marketing Company", "MarketingCompany", "CompanyName", "companyName"]),
    "Marketing Country": findValue(item, ["Marketing Country", "MarketingCountry"]),
    "Manufacture Name": findValue(item, ["Manufacture Name", "ManufacturerNameEN", "manufacturer", "manufacturerName"]),
    "Manufacture Country": findValue(item, ["Manufacture Country", "ManufacturerCountry", "manufacturerCountry"]),
    "Secondry package  manufacture": findValue(item, ["Secondry package  manufacture"]),
    "Main Agent": findValue(item, ["Main Agent", "MainAgent", "Agent", "main agent", "agent"]),
    "Secosnd Agent": findValue(item, ["Secosnd Agent", "AddtionalAgentName"]),
    "Third agent": findValue(item, ["Third agent"]),
    "Description Code": findValue(item, ["Description Code", "descriptionCode"]),
    description: findValue(item, ["Description", "description", "physicalNotes"]),
    "Authorization Status": findValue(item, ["Authorization Status", "AuthorizationStatus"]),
    "Last Update": findValue(item, ["Last Update", "lastUpdate"]),
    
    imgBox: findValue(item, ["imgBox", "boxImage", "img_box", "box_image", "image", "item_image", "imageUrl", "img_url", "photo", "BoxImage", "ImageBox", "الصورة", "صورة المنتج"]),
    imgIndex1: findValue(item, ["imgIndex1", "imgStrip", "index1", "strip_image", "index_image", "indexImage1", "Index1", "الفهرس 1"]), 
    imgIndex2: findValue(item, ["imgIndex2", "index2", "index_image2", "indexImage2", "Index2", "الفهرس 2"]),
    imgPill: findValue(item, ["imgPill", "pillImage", "img_pill", "pill_image", "tablet_image", "capsule_image", "PillImage", "صورة الحبة"]),
    
    pillShape: findValue(item, ["pillShape", "pill_shape", "Shape", "شكل الحبة"]),
    pillScored: findValue(item, ["pillScored", "pill_scored", "scored", "Scored", "محزز"]),
    pillMarkings: findValue(item, ["pillMarkings", "pill_markings", "markings", "Markings", "علامات"]),
    liquidTaste: findValue(item, ["liquidTaste", "taste", "Taste", "الطعم"]),
    liquidColor: findValue(item, ["liquidColor", "color", "Color", "اللون"]),
    physicalNotes: findValue(item, ["physicalNotes", "PhysicalNotes", "notes", "Notes", "Description", "description", "ملاحظات"])
  };
};

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache_v163';
const READ_NOTIFICATIONS_KEY = 'pharma_read_notifications';
const CHAT_HISTORY_KEY = 'pharma_chat_history_v3';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scrollPositionsByView = useRef<Record<string, number>>({});

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark') ? 'dark' : 'light';
  });

  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('language');
      return (saved === 'ar' || saved === 'en') ? saved as Language : 'en';
  });

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    localStorage.setItem('language', language);
  }, [language]);

  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [view, setView] = useState<View>('search');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
      try { 
          const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
          return stored ? (JSON.parse(stored) as string[]) : [];
      } catch { return []; }
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [filters, setFilters] = useState<Filters>({
    productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '',
    manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const isFilterActive = useMemo(() => {
    return filters.productType !== 'all' || !!filters.priceMin || !!filters.priceMax || 
           !!filters.pharmaceuticalForm || filters.manufactureName.length > 0 || 
           filters.marketingCompany.length > 0 || filters.mainAgent.length > 0 || !!filters.legalStatus;
  }, [filters]);

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<SelectedInsuranceData | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');

  const t: TFunction = useCallback((key, replacements) => {
    const text = translations[language][key] || key;
    if (replacements) return Object.entries(replacements).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
    return text;
  }, [language]);

  const scrollToTop = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
      if (view === 'imageView') setView('details');
      else if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (view === 'chatHistory') setView('search');
      else if (['login', 'register', 'admin', 'aiHistory', 'addData', 'notifications', 'favorites'].includes(view)) setView(activeTab === 'search' ? 'search' : activeTab === 'settings' ? 'settings' : 'insuranceSearch');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view, activeTab]);

  useEffect(() => {
      setupNativeListeners(handleBack);
  }, [handleBack]);

  const captureScrollPosition = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) scrollPositionsByView.current[view] = container.scrollTop;
  }, [view]);

  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
        const savedPos = scrollPositionsByView.current[view] || 0;
        if (['search', 'results', 'insuranceSearch'].includes(view)) {
            container.scrollTop = savedPos;
        } else {
            container.scrollTop = 0;
        }
    }
  }, [view]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } = await import('./data/data');
            const { FOOD_DATA_RAW } = await import('./data/food-data');

            const hardcodedMedicines = ([...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW, ...FOOD_DATA_RAW] as any[]).map(normalizeMedicine);
            let cachedMedicines = await getItem<Medicine[]>(MEDICINES_CACHE_KEY) || [];
            const medMap = new Map<string, Medicine>();
            cachedMedicines.forEach(m => medMap.set(m.RegisterNumber, m));
            hardcodedMedicines.forEach(m => medMap.set(m.RegisterNumber, m)); 
            const finalMedicines = Array.from(medMap.values());
            setMedicines(finalMedicines);
            await setItem(MEDICINES_CACHE_KEY, finalMedicines);

            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            const { CUSTOM_INSURANCE_DATA } = await import('./data/custom-insurance-data');
            setInsuranceData([...(INITIAL_INSURANCE_DATA as any[]), ...(CUSTOM_INSURANCE_DATA as any[])]);

            let historyData = await getItem<Conversation[]>(CHAT_HISTORY_KEY);
            if (historyData) setAllConversations(historyData);
            
            setIsDataLoaded(true);

            if (!FIREBASE_DISABLED && db && isOnline) {
                onSnapshot(collection(db, 'medicines'), (snapshot) => {
                    setMedicines(prev => {
                        const newMedsMap = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
                        snapshot.docChanges().forEach((change) => {
                            const med = normalizeMedicine(change.doc.data());
                            if (change.type === 'added' || change.type === 'modified') {
                                newMedsMap.set(med.RegisterNumber, med);
                            } else if (change.type === 'removed') {
                                newMedsMap.delete(med.RegisterNumber);
                            }
                        });
                        const updatedArray = Array.from(newMedsMap.values());
                        setItem(MEDICINES_CACHE_KEY, updatedArray).catch(() => {});
                        return updatedArray;
                    });
                });
                onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), firestoreLimit(50)), (snapshot) => {
                    const cloudNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
                    setNotifications(cloudNotifs);
                });
            }
        } catch (e) { 
            console.error("Critical Data Load Error:", e);
            setIsDataLoaded(true); 
        }
    };
    loadData();
  }, [isOnline]);

  const filteredMedicines = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/\*/g, '');

    let results = medicines.filter(m => {
        if (cleanTerm.length < 3 && !isFilterActive) return false;
        
        if (cleanTerm.length >= 3) {
            const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
            const val = String(m[field]).toLowerCase();
            if (!val.includes(cleanTerm)) return false;
        }

        if (isFilterActive) {
            if (filters.productType === 'medicine' && m['Product type'] !== 'Human') return false;
            if (filters.productType === 'supplement' && m['Product type'] !== 'Supplement') return false;
            if (filters.productType === 'food' && m['Product type'] !== 'Food') return false;
            const price = parseFloat(m['Public price']) || 0;
            if (filters.priceMin && price < parseFloat(filters.priceMin)) return false;
            if (filters.priceMax && price > parseFloat(filters.priceMax)) return false;
            if (filters.manufactureName.length > 0 && !filters.manufactureName.includes(m['Manufacture Name'])) return false;
        }
        return true;
    });

    results.sort((a, b) => {
        // Priority 1: Price Sorting if requested
        if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
        if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);

        // Priority 2: "Starts With" match before "Contains" match
        if (cleanTerm.length >= 3) {
            const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
            const aVal = String(a[field]).toLowerCase();
            const bVal = String(b[field]).toLowerCase();
            
            const aStarts = aVal.startsWith(cleanTerm);
            const bStarts = bVal.startsWith(cleanTerm);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
        }

        // Priority 3: Alphabetical Default
        return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
    });
    return results;
  }, [medicines, searchTerm, textSearchMode, filters, isFilterActive, sortBy]);

  const handleMedicineSelect = useCallback((medicine: Medicine) => { 
      captureScrollPosition();
      setSelectedMedicine(medicine); setView('details'); 
  }, [captureScrollPosition]);

  const toggleFavorite = (id: string) => {
      setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const [activeImageViewer, setActiveImageViewer] = useState<{ images: string[], index: number, title: string, flags: boolean[] } | null>(null);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => setView('search')} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} onExport={()=>{}} />;
      if (view === 'notifications') return <NotificationsView notifications={notifications} isAdmin={user?.role==='admin'} t={t} language={language} onMarkAllRead={()=>{}} onMarkAsRead={()=>{}} onDeleteNotification={()=>{}} />;
      if (view === 'favorites') return <FavoritesView favoriteIds={favorites} allMedicines={medicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleMedicineSelect} onFindAlternative={()=>{}} toggleFavorite={toggleFavorite} t={t} language={language} />;
      if (view === 'addData') return <AddDataView t={t} onImport={()=>{}} />;
      if (view === 'imageView' && activeImageViewer) return <ImageViewer images={activeImageViewer.images} initialIndex={activeImageViewer.index} title={activeImageViewer.title} t={t} indexFlags={activeImageViewer.flags} onBack={handleBack} />;

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine!} insuranceData={insuranceData} t={t} language={language} isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onOpenAssistant={() => setIsAssistantOpen(true)} onImageZoom={(imgs, idx, title, flags) => { setActiveImageViewer({images:imgs, index:idx, title, flags}); setView('imageView'); }} onFindAlternative={() => setView('alternatives')} />;
          if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={{direct:[], therapeutic:[]}} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleMedicineSelect} onFindAlternative={()=>{}} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          
          return (
              <div className="animate-fade-in">
                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length > 0} onClearSearch={() => { setSearchTerm(''); setView('search'); }} onForceSearch={() => { setView('results'); }} onBarcodeScanClick={()=>{}} t={t} />
                  <div className="flex gap-2 mt-2">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={Object.values(filters).filter((f: any) => f && f!=='all' && f.length!==0).length} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-6">
                      {filteredMedicines.length > 0 ? (
                        <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleMedicineSelect} onFindAlternative={(m) => { setSelectedMedicine(m); setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState="loaded" />
                      ) : (searchTerm.length >= 3 || isFilterActive) && <div className="text-center py-20 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-100"><p className="text-slate-400 font-bold">{t('noResultsTitle')}</p></div>}
                  </div>
              </div>
          );
      }

      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsurance) return <InsuranceDetailsView data={selectedInsurance} t={t} />;
          return (
              <InsuranceSearchView 
                t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} 
                insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm}
                insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode}
                onSelectInsuranceData={(data) => { setSelectedInsurance(data); setView('insuranceDetails'); }} 
              />
          );
      }

      if (activeTab === 'settings') {
          return (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-black mb-6 border-b pb-4 dark:border-slate-700">{t('navSettings')}</h3>
                      <div className="space-y-4">
                          <button onClick={() => setView('favorites')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-primary/10 transition-all group">
                              <span className="font-bold">{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
                              <svg className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                              <span className="font-bold">{t('language')}</span>
                              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border">
                                  <button onClick={()=>setLanguage('ar')} className={`px-4 py-1.5 rounded-lg text-xs font-black ${language==='ar'?'bg-primary text-white':'text-slate-400'}`}>العربية</button>
                                  <button onClick={()=>setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-xs font-black ${language==='en'?'bg-primary text-white':'text-slate-400'}`}>EN</button>
                              </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                              <span className="font-bold">{t('darkMode')}</span>
                              <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="w-12 h-6 bg-slate-200 dark:bg-primary rounded-full relative transition-all">
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme==='dark'?'right-1':'left-1'}`}></div>
                              </button>
                          </div>
                          {user && (
                              <button onClick={logout} className="w-full mt-4 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-sm hover:bg-rose-100 transition-all">{t('logout')}</button>
                          )}
                      </div>
                  </div>
              </div>
          );
      }

      return <div className="text-center py-20 text-slate-400">Application Error. Please reload. (Tab: {activeTab}, View: {view})</div>;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-slate-900 h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'insuranceSearch' && view !== 'settings'} onBack={handleBack} t={t} onLoginClick={() => setView('login')} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={unreadCount} />
      
      <main id="main-scroll-container" className="flex-grow mx-auto px-4 overflow-y-auto pt-[calc(env(safe-area-inset-top)+100px)] pb-[calc(160px+env(safe-area-inset-bottom))] w-full max-w-5xl no-scrollbar">
          {!isDataLoaded ? (
              <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="mt-4 text-xs font-black text-slate-400 animate-pulse">LOADING DATA...</p>
              </div>
          ) : renderContent()}
      </main>
      
      <BottomNavBar activeTab={activeTab} setActiveTab={(tab)=>{ if (activeTab === tab) scrollToTop(); setActiveTab(tab); setView(tab==='search'?'search':tab==='insurance'?'insuranceSearch':'settings'); }} t={t} user={user} view={view} />
      
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onApply={setFilters} onClearFilters={()=>setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' })} allMedicines={medicines} t={t} />
      
      {isAssistantOpen && <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={(h)=>{setIsAssistantOpen(false);}} contextMedicine={selectedMedicine} allMedicines={medicines} initialPrompt="" t={t} language={language} />}
      
      <FloatingAssistantButton onClick={()=>setIsAssistantOpen(true)} onLongPress={()=>{}} t={t} language={language} />
    </div>
  );
};

export default App;
