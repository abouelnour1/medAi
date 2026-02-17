
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

const setupNativeListeners = (onBack: () => void) => {
    import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
            onBack();
        });
    }).catch(() => {});
};

const normalizeMedicine = (item: any): Medicine => {
  const findValue = (obj: any, keys: string[]) => {
      for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
              const val = String(obj[key]).trim();
              if (['na', 'n/a', 'null', 'none', 'undefined'].includes(val.toLowerCase())) continue;
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
  
  let regNum = findValue(item, ["RegisterNumber", "Id", "id"]);
  if (!regNum || regNum === '0' || regNum.trim() === '') {
      regNum = `temp-${tradeName}-${scientificName}-${strength}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
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

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [view, setView] = useState<View>('search');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'));
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') === 'ar' ? 'ar' : 'en'));
  const [searchTerm, setSearchTerm] = useState('');
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [filters, setFilters] = useState<Filters>({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => { try { const s = localStorage.getItem(FAVORITES_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeImageViewer, setActiveImageViewer] = useState<{ images: string[], index: number, title: string, flags: boolean[] } | null>(null);

  // States for Insurance Tab
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  const [selectedInsurance, setSelectedInsurance] = useState<SelectedInsuranceData | null>(null);

  // Scroll position management
  const scrollPositions = useRef<Map<string, number>>(new Map());

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

  const t: TFunction = useCallback((key, replacements) => {
    const text = translations[language][key] || key;
    if (replacements) return Object.entries(replacements).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
    return text;
  }, [language]);

  const handleBack = useCallback(() => {
      if (view === 'imageView') setView('details');
      else if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (['login', 'register', 'admin', 'notifications', 'favorites'].includes(view)) setView(activeTab === 'search' ? 'search' : 'settings');
      else if (view === 'results' || view === 'insuranceSearch') { setView('search'); setSearchTerm(''); setInsuranceSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view, activeTab]);

  useEffect(() => { setupNativeListeners(handleBack); }, [handleBack]);

  // Save/Restore Scroll Position
  useLayoutEffect(() => {
      const container = document.getElementById('main-scroll-container');
      if (!container) return;

      const handleBeforeChange = () => {
          if (view === 'results' || view === 'search') {
              scrollPositions.current.set('search', container.scrollTop);
          }
      };

      if (view === 'results' || view === 'search') {
          const saved = scrollPositions.current.get('search');
          if (saved !== undefined) {
              container.scrollTop = saved;
          }
      } else {
          container.scrollTop = 0;
      }
      
      return handleBeforeChange;
  }, [view]);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
        try {
            const { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } = await import('./data/data');
            const { FOOD_DATA_RAW } = await import('./data/food-data');
            const hardcodedMedicines = ([...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW, ...FOOD_DATA_RAW]).map(normalizeMedicine);
            
            const medMap = new Map<string, Medicine>();
            hardcodedMedicines.forEach(m => medMap.set(m.RegisterNumber, m));

            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            setInsuranceData(INITIAL_INSURANCE_DATA as any);
            setIsDataLoaded(true);

            if (!FIREBASE_DISABLED && db) {
                onSnapshot(collection(db, 'medicines'), (snapshot) => {
                    snapshot.docs.forEach(doc => {
                        const med = normalizeMedicine(doc.data());
                        medMap.set(med.RegisterNumber, med);
                    });
                    setMedicines(Array.from(medMap.values()));
                });

                onSnapshot(collection(db, 'notifications'), (snapshot) => {
                    setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
                });
            } else {
                setMedicines(Array.from(medMap.values()));
            }
        } catch (e) { 
            console.error(e); 
            setIsDataLoaded(true); 
        }
    };
    loadData();
  }, []);

  const filteredMedicines = useMemo(() => {
    const term = searchTerm.toLowerCase().trim().replace(/\*/g, '');
    let results = medicines.filter(m => {
        if (term.length < 3) return false;
        const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        return String(m[field]).toLowerCase().includes(term);
    });

    results.sort((a, b) => {
        const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        const aVal = String(a[field]).toLowerCase();
        const bVal = String(b[field]).toLowerCase();
        const aStarts = aVal.startsWith(term);
        const bStarts = bVal.startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aVal.localeCompare(bVal);
    });
    return results;
  }, [medicines, searchTerm, textSearchMode]);

  const medicineAlternatives = useMemo(() => {
      if (!selectedMedicine) return { direct: [], therapeutic: [] };
      
      const mainSci = String(selectedMedicine['Scientific Name']).toLowerCase().trim();
      
      // 1. البدائل المطابقة (نفس المادة الفعالة)
      const direct = medicines.filter(m => 
          String(m['Scientific Name']).toLowerCase().trim() === mainSci && 
          m.RegisterNumber !== selectedMedicine.RegisterNumber
      );

      // 2. البدائل العلاجية (من بوليصة التأمين)
      // نبحث أولاً عن الدواء في التأمين لمعرفة مجموعته العلاجية
      const insuranceEntry = insuranceData.find(p => 
          p.scientificName.toLowerCase().trim() === mainSci || 
          (selectedMedicine.AtcCode1 && p.atcCode && selectedMedicine.AtcCode1.startsWith(p.atcCode))
      );

      let therapeutic: Medicine[] = [];
      if (insuranceEntry?.drugClass) {
          const sameClassSciNames = new Set(
              insuranceData
                .filter(p => p.drugClass === insuranceEntry.drugClass && p.scientificName.toLowerCase().trim() !== mainSci)
                .map(p => p.scientificName.toLowerCase().trim())
          );

          therapeutic = medicines.filter(m => 
              sameClassSciNames.has(String(m['Scientific Name']).toLowerCase().trim())
          );
      }

      return { direct, therapeutic };
  }, [selectedMedicine, medicines, insuranceData]);

  const toggleFavorite = (id: string) => {
      const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
      setFavorites(newFavs);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavs));
  };

  const deleteNotification = async (id: string) => {
      if (!db) return;
      try { await deleteDoc(doc(db, 'notifications', id)); } catch(e) { console.error(e); }
  };

  const handleTabClick = (tab: Tab) => {
      if (activeTab === tab) {
          const container = document.getElementById('main-scroll-container');
          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          setActiveTab(tab);
          if (tab === 'search') setView('search');
          if (tab === 'insurance') setView('insuranceSearch');
          if (tab === 'settings') setView('settings');
      }
  };

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => setView('search')} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} onExport={()=>{}} />;
      if (view === 'notifications') return <NotificationsView notifications={notifications} isAdmin={user?.role==='admin'} t={t} language={language} onMarkAllRead={()=>{}} onMarkAsRead={()=>{}} onDeleteNotification={deleteNotification} />;
      if (view === 'favorites') return <FavoritesView favoriteIds={favorites} allMedicines={medicines} onMedicineSelect={(m)=>{setSelectedMedicine(m); setView('details');}} onMedicineLongPress={()=>{}} onFindAlternative={()=>{}} toggleFavorite={toggleFavorite} t={t} language={language} />;
      if (view === 'imageView' && activeImageViewer) return <ImageViewer images={activeImageViewer.images} initialIndex={activeImageViewer.index} title={activeImageViewer.title} t={t} indexFlags={activeImageViewer.flags} onBack={handleBack} />;

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine} insuranceData={insuranceData} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(m)=>{setSelectedMedicine(m); setIsEditModalOpen(true);}} onOpenAssistant={() => setIsAssistantOpen(true)} onImageZoom={(imgs, idx, title, flags) => { setActiveImageViewer({images:imgs, index:idx, title, flags}); setView('imageView'); }} onFindAlternative={(m) => { setSelectedMedicine(m); setView('alternatives'); }} />;
          if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={medicineAlternatives} onMedicineSelect={(m)=>{setSelectedMedicine(m); setView('details');}} onMedicineLongPress={()=>{}} onFindAlternative={()=>{}} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          
          return (
              <div className="animate-fade-in">
                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length > 0} onClearSearch={() => { setSearchTerm(''); setView('search'); }} onForceSearch={() => { setView('results'); }} onBarcodeScanClick={()=>{}} t={t} />
                  <div className="flex gap-2 mt-2">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={0} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-6">
                      {filteredMedicines.length > 0 ? (
                        <ResultsList medicines={filteredMedicines} onMedicineSelect={(m)=>{setSelectedMedicine(m); setView('details');}} onMedicineLongPress={()=>{}} onFindAlternative={(m) => { setSelectedMedicine(m); setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState="loaded" />
                      ) : searchTerm.length >= 3 && <div className="text-center py-20 bg-white/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800"><p className="text-slate-400 font-black">{t('noResultsTitle')}</p></div>}
                  </div>
              </div>
          );
      }

      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsurance) return <InsuranceDetailsView data={selectedInsurance} t={t} />;
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(d) => { setSelectedInsurance(d); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }

      if (activeTab === 'settings') {
          return (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-black mb-6 border-b pb-4 dark:border-slate-800">{t('navSettings')}</h3>
                      <div className="space-y-4">
                          <button onClick={() => setView('favorites')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                              <span className="font-bold">{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
                              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{t('darkMode')}</span>
                              <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="w-12 h-6 bg-slate-200 dark:bg-primary rounded-full relative transition-all">
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme==='dark'?'right-1':'left-1'}`}></div>
                              </button>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{t('language')}</span>
                              <button onClick={()=>setLanguage(language==='ar'?'en':'ar')} className="px-4 py-1.5 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 font-black text-xs">{language.toUpperCase()}</button>
                          </div>
                          {user && <button onClick={logout} className="w-full mt-4 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-sm">{t('logout')}</button>}
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'insuranceSearch' && activeTab !== 'settings'} onBack={handleBack} t={t} onLoginClick={() => setView('login')} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.length} />
      <main id="main-scroll-container" className="flex-grow mx-auto px-4 overflow-y-auto pt-[calc(env(safe-area-inset-top)+100px)] pb-[calc(160px+env(safe-area-inset-bottom))] w-full max-w-5xl no-scrollbar">
          {!isDataLoaded ? <div className="h-64 flex flex-col items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div><p className="mt-4 text-xs font-black text-slate-400">تحميل البيانات...</p></div> : renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabClick} t={t} user={user} view={view} />
      <FloatingAssistantButton onClick={()=>setIsAssistantOpen(true)} onLongPress={()=>{}} t={t} language={language} />
      {isAssistantOpen && <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={()=>setIsAssistantOpen(false)} contextMedicine={selectedMedicine} allMedicines={medicines} initialPrompt="" t={t} language={language} />}
      <EditMedicineModal isOpen={isEditModalOpen} onClose={()=>setIsEditModalOpen(false)} medicine={selectedMedicine} onSave={async (m)=>{ if(db) await setDoc(doc(db, 'medicines', m.RegisterNumber), m); setSelectedMedicine(m); }} t={t} />
      <FilterModal isOpen={isFilterModalOpen} onClose={()=>setIsFilterModalOpen(false)} filters={filters} onApply={setFilters} onClearFilters={()=>setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''})} allMedicines={medicines} t={t} />
    </div>
  );
};
export default App;
