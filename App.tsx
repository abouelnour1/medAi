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
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';
import { translations } from './translations';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc, collection, onSnapshot, deleteDoc, query, orderBy, limit as firestoreLimit, addDoc } from 'firebase/firestore';
import { getItem, setItem } from './utils/storage';

const setupNativeListeners = (onBack: () => void) => {
    import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
            onBack();
        });
    }).catch(() => console.log("Capacitor App plugin not available"));
};

const normalizeMedicine = (item: any): Medicine => {
  const findValue = (obj: any, keys: string[]) => {
      for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') return String(obj[key]).trim();
      }
      return '';
  };
  const tradeName = findValue(item, ["Trade Name", "TradeName", "tradeName"]);
  const scientificName = findValue(item, ["Scientific Name", "ScientificName", "scientificName"]);
  const drugTypeRaw = String(findValue(item, ["DrugType", "drugType", "Product type", "ProductType"])).toLowerCase();
  
  return {
    RegisterNumber: findValue(item, ["RegisterNumber", "Id", "id"]) || `temp-${Date.now()}`,
    ReferenceNumber: findValue(item, ["ReferenceNumber", "referenceNumber"]),
    "Old register Number": findValue(item, ["Old register Number", "oldRegisterNumber"]),
    "Product type": (drugTypeRaw.includes('food')) ? 'Food' : (drugTypeRaw.includes('health') || drugTypeRaw.includes('herbal') || drugTypeRaw.includes('supplement') ? 'Supplement' : 'Human'),
    DrugType: findValue(item, ["DrugType", "drugType"]),
    "Sub-Type": findValue(item, ["Sub-Type", "subType"]),
    "Scientific Name": scientificName || 'N/A',
    "Trade Name": tradeName,
    Strength: findValue(item, ["Strength", "strength"]),
    StrengthUnit: findValue(item, ["StrengthUnit", "strengthUnit"]),
    PharmaceuticalForm: findValue(item, ["PharmaceuticalForm", "DoesageForm", "pharmaceuticalForm", "Pharmaceutical Form"]),
    AdministrationRoute: findValue(item, ["AdministrationRoute", "administrationRoute"]),
    AtcCode1: findValue(item, ["AtcCode1", "atcCode1"]),
    AtcCode2: findValue(item, ["AtcCode2", "atcCode2"]),
    Size: findValue(item, ["Size", "size"]),
    SizeUnit: findValue(item, ["SizeUnit", "sizeUnit"]),
    PackageTypes: findValue(item, ["PackageTypes", "PackageType"]),
    PackageSize: findValue(item, ["PackageSize", "packageSize"]),
    "Legal Status": findValue(item, ["Legal Status", "LegalStatus"]) || "OTC",
    "Product Control": findValue(item, ["Product Control", "productControl"]),
    "Distribute area": findValue(item, ["Distribute area", "DistributionArea"]),
    "Public price": findValue(item, ["Public price", "Price", "public price", "price"]).replace(/[^0-9.]/g, '') || '0',
    shelfLife: findValue(item, ["shelfLife", "ShelfLife"]),
    "Storage conditions": findValue(item, ["Storage conditions", "StorageConditions"]),
    "Storage Condition Arabic": findValue(item, ["Storage Condition Arabic", "storageConditionArabic"]),
    "Marketing Company": findValue(item, ["Marketing Company", "MarketingCompany"]),
    "Marketing Country": findValue(item, ["Marketing Country", "MarketingCountry"]),
    "Manufacture Name": findValue(item, ["Manufacture Name", "ManufacturerNameEN"]),
    "Manufacture Country": findValue(item, ["Manufacture Country", "ManufacturerCountry"]),
    "Secondry package  manufacture": findValue(item, ["Secondry package  manufacture"]),
    "Main Agent": findValue(item, ["Main Agent", "MainAgent", "Agent"]),
    "Secosnd Agent": findValue(item, ["Secosnd Agent"]),
    "Third agent": findValue(item, ["Third agent"]),
    "Description Code": findValue(item, ["Description Code", "descriptionCode"]),
    "Authorization Status": findValue(item, ["Authorization Status", "AuthorizationStatus"]),
    "Last Update": findValue(item, ["Last Update", "lastUpdate"]),
    description: findValue(item, ["Description", "description"]),
    imgBox: findValue(item, ["imgBox", "boxImage", "image"]),
    imgIndex1: findValue(item, ["imgIndex1", "Index1"]),
    imgIndex2: findValue(item, ["imgIndex2", "Index2"]),
    imgPill: findValue(item, ["imgPill", "pillImage"]),
    pillShape: findValue(item, ["pillShape", "Shape"]),
    pillScored: findValue(item, ["pillScored", "scored"]),
    pillMarkings: findValue(item, ["pillMarkings", "markings"]),
    liquidTaste: findValue(item, ["liquidTaste", "taste"]),
    liquidColor: findValue(item, ["liquidColor", "color"]),
    physicalNotes: findValue(item, ["physicalNotes", "Notes"])
  };
};

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache_v163';
const READ_NOTIFICATIONS_KEY = 'pharma_read_notifications';
const CHAT_HISTORY_KEY = 'pharma_chat_history_v3';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const scrollPositionsByView = useRef<Record<string, number>>({});

  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
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
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]'));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [filters, setFilters] = useState<Filters>({
    productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '',
    manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]'));
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomImageInitialIndex, setZoomImageInitialIndex] = useState(0);
  const [zoomImageTitle, setZoomImageTitle] = useState('');

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
      else if (['login', 'register', 'admin', 'notifications'].includes(view)) setView(activeTab === 'search' ? 'search' : activeTab === 'settings' ? 'settings' : 'insuranceSearch');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view, activeTab]);

  useEffect(() => { setupNativeListeners(handleBack); }, [handleBack]);

  const captureScrollPosition = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) scrollPositionsByView.current[view] = container.scrollTop;
  }, [view]);

  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
        container.scrollTop = (['search', 'results', 'insuranceSearch'].includes(view)) ? (scrollPositionsByView.current[view] || 0) : 0;
    }
  }, [view]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } = await import('./data/data');
            const { FOOD_DATA_RAW } = await import('./data/food-data');
            const hardcodedMedicines = ([...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW, ...FOOD_DATA_RAW] as any[]).map(normalizeMedicine);
            const cachedMedicines = await getItem<Medicine[]>(MEDICINES_CACHE_KEY) || [];
            const medMap = new Map<string, Medicine>();
            cachedMedicines.forEach(m => medMap.set(m.RegisterNumber, m));
            hardcodedMedicines.forEach(m => medMap.set(m.RegisterNumber, m)); 
            const finalMedicines = Array.from(medMap.values());
            setMedicines(finalMedicines);
            await setItem(MEDICINES_CACHE_KEY, finalMedicines);

            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            const { CUSTOM_INSURANCE_DATA } = await import('./data/custom-insurance-data');
            setInsuranceData([...(INITIAL_INSURANCE_DATA as any[]), ...(CUSTOM_INSURANCE_DATA as any[])]);
            setIsDataLoaded(true);

            if (!FIREBASE_DISABLED && db) {
                onSnapshot(collection(db, 'medicines'), (snapshot) => {
                    setMedicines(prev => {
                        const newMedsMap = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added' || change.type === 'modified') newMedsMap.set(change.doc.id, normalizeMedicine(change.doc.data()));
                            else if (change.type === 'removed') newMedsMap.delete(change.doc.id);
                        });
                        return Array.from(newMedsMap.values());
                    });
                });
                onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), firestoreLimit(50)), (snapshot) => {
                    setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
                });
            }
        } catch (e) { console.error(e); setIsDataLoaded(true); }
    };
    loadData();
  }, []);

  const filteredMedicines = useMemo(() => {
    let results = medicines.filter(m => {
        const term = searchTerm.toLowerCase().trim();
        if (term.length < 3 && !Object.values(filters).some(f => f && f !== 'all' && f.length !== 0)) return false;
        const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        return String(m[field]).toLowerCase().includes(term);
    });
    // Apply filters logic...
    return results.sort((a, b) => sortBy === 'priceAsc' ? parseFloat(a['Public price']) - parseFloat(b['Public price']) : String(a['Trade Name']).localeCompare(String(b['Trade Name'])));
  }, [medicines, searchTerm, textSearchMode, filters, sortBy]);

  const handleMedicineSelect = useCallback((medicine: Medicine) => { captureScrollPosition(); setSelectedMedicine(medicine); setView('details'); }, [captureScrollPosition]);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => setView('search')} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} onExport={()=>{}} />;
      if (view === 'notifications') return <NotificationsView notifications={notifications.map(n => ({...n, isRead: readNotificationIds.includes(n.id)}))} onMarkAllRead={() => {}} onMarkAsRead={(id)=>setReadNotificationIds(prev=>[...prev, id])} onDeleteNotification={()=>{}} isAdmin={user?.role === 'admin'} t={t} language={language} />;
      if (view === 'imageView') return <ImageViewer images={zoomImages} initialIndex={zoomImageInitialIndex} title={zoomImageTitle} onBack={handleBack} t={t} />;

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine!} insuranceData={insuranceData} t={t} language={language} isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} user={user} onImageZoom={(imgs,idx,ttl)=>{setZoomImages(imgs); setZoomImageInitialIndex(idx); setZoomImageTitle(ttl); setView('imageView');}} onFindAlternative={()=>{}} onOpenAssistant={() => setIsAssistantOpen(true)} />;
          return (
              <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                  {/* Fixed: Changed setTextMode to setTextSearchMode to resolve ReferenceError */}
                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length > 0} onClearSearch={() => { setSearchTerm(''); setView('search'); }} onForceSearch={() => { setView('results'); }} onBarcodeScanClick={()=>{}} t={t} />
                  <div className="flex gap-2 mt-2">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={0} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-6">
                      {filteredMedicines.length > 0 ? (
                        <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleMedicineSelect} onFindAlternative={()=>{}} favorites={favorites} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} t={t} language={language} resultsState="loaded" />
                      ) : searchTerm.length >= 3 && <div className="text-center py-20 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-100"><p className="text-slate-400 font-bold">{t('noResultsTitle')}</p></div>}
                  </div>
              </div>
          );
      }
      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(d)=>{setSelectedInsuranceData(d); setView('insuranceDetails');}} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }
      if (activeTab === 'settings') return (
          <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-black">{t('navSettings')}</h2>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                  {user ? <div className="flex justify-between items-center"><div><p className="font-black">{user.username}</p><p className="text-[10px] text-teal-600 uppercase font-bold">{user.role}</p></div><button onClick={logout} className="text-rose-500 font-black text-xs">{t('logout')}</button></div> : <button onClick={()=>setView('login')} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black">{t('login')}</button>}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 border border-slate-100 dark:border-slate-800">
                  <button onClick={() => setLanguage(l => l === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-5"><span className="font-bold text-sm">{t('language')}</span><span className="font-bold text-teal-600">{language === 'ar' ? 'English' : 'العربية'}</span></button>
                  <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="w-full flex items-center justify-between p-5"><span className="font-bold text-sm">{t('darkMode')}</span><span className="font-bold text-teal-600">{theme === 'dark' ? 'On' : 'Off'}</span></button>
              </div>
          </div>
      );
      return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-slate-900 h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch'} onBack={handleBack} t={t} onLoginClick={() => setView('login')} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.filter(n=>!readNotificationIds.includes(n.id)).length} />
      {/* Increased bottom padding for the main scroll container to ensure the last item is visible above the bottom navbar */}
      <main id="main-scroll-container" className="flex-grow mx-auto px-4 overflow-y-auto pt-[calc(env(safe-area-inset-top)+100px)] pb-[calc(180px+env(safe-area-inset-bottom))] w-full max-w-5xl no-scrollbar">
          {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={(tab)=>{ if (activeTab === tab) scrollToTop(); setActiveTab(tab); setView(tab==='search'?'search':tab==='insurance'?'insuranceSearch':'settings'); }} t={t} user={user} view={view} />
      <div className="fixed bottom-32 right-6 z-30"><FloatingAssistantButton onClick={()=>setIsAssistantOpen(true)} onLongPress={()=>{}} t={t} language={language} /></div>
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={()=>setIsAssistantOpen(false)} contextMedicine={view === 'details' ? selectedMedicine : null} allMedicines={medicines} initialPrompt="" t={t} language={language} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onApply={(f) => setFilters(f)} onClearFilters={() => {}} allMedicines={medicines} t={t} />
    </div>
  );
};

export default App;