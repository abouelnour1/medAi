
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
import ChatHistoryView from './components/ChatHistoryView';
import InsuranceSearchView from './components/InsuranceSearchView';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import CosmeticsView from './components/CosmeticsView';
import CosmeticDetail from './components/CosmeticDetail';
import FavoritesView from './components/FavoritesView';
import MilkView from './components/MilkView';
import NotificationsView from './components/NotificationsView';
import EditMedicineModal from './components/EditMedicineModal';
import EditCosmeticModal from './components/EditCosmeticModal';
import ImageViewer from './components/ImageViewer';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';
import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc, collection, onSnapshot, deleteDoc, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
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
    RegisterNumber: String(item.RegisterNumber || item.Id || Math.random()),
    ReferenceNumber: String(item.ReferenceNumber || ''),
    "Old register Number": String(item["Old register Number"] || ''),
    "Product type": String(item["Product type"] || 
        (item.DrugType === 'food' ? 'Food' : 
        (item.DrugType === 'Health' || item.DrugType === 'Herbal' ? 'Supplement' : 'Human'))),
    DrugType: String(item.DrugType || ''),
    "Sub-Type": String(item["Sub-Type"] || ''),
    "Scientific Name": String(item["Scientific Name"] || item.ScientificName || ''),
    "Trade Name": String(item["Trade Name"] || item.TradeName || ''),
    Strength: String(item.Strength || ''),
    StrengthUnit: String(item.StrengthUnit || ''),
    PharmaceuticalForm: String(item.PharmaceuticalForm || item.DoesageForm || ''),
    AdministrationRoute: String(item.AdministrationRoute || ''),
    AtcCode1: String(item.AtcCode1 || ''),
    AtcCode2: String(item.AtcCode2 || ''),
    Size: String(item.Size || ''),
    SizeUnit: String(item.SizeUnit || ''),
    PackageTypes: String(item.PackageTypes || ''),
    PackageSize: String(item.PackageSize || ''),
    "Legal Status": String(item["Legal Status"] || item.LegalStatus || ''),
    "Product Control": String(item["Product Control"] || ''),
    "Distribute area": String(item["Distribute area"] || ''),
    "Public price": findPrice(item),
    shelfLife: String(item.shelfLife || item.ShelfLife || ''),
    "Storage conditions": String(item["Storage conditions"] || item.StorageConditions || ''),
    "Storage Condition Arabic": String(item["Storage Condition Arabic"] || ''),
    "Marketing Company": String(item["Marketing Company"] || item["Company Name"] || ''),
    "Marketing Country": String(item["Marketing Country"] || ''),
    "Manufacture Name": String(item["Manufacture Name"] || item.ManufacturerNameEN || ''),
    "Manufacture Country": String(item["Manufacture Country"] || item.ManufacturerCountry || ''),
    "Secondry package  manufacture": String(item["Secondry package  manufacture"] || ''),
    "Main Agent": String(item["Main Agent"] || item.Agent || ''),
    "Secosnd Agent": String(item["Secosnd Agent"] || ''),
    "Third agent": String(item["Third agent"] || ''),
    "Description Code": String(item["Description Code"] || ''),
    "Authorization Status": String(item["Authorization Status"] || ''),
    "Last Update": String(item["Last Update"] || ''),
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

const normalizeCosmetic = (item: any): Cosmetic => {
    const generatedId = `cosm-v1-${String(item.BrandName || 'brand').toLowerCase().replace(/\s+/g, '-')}-${String(item.SpecificName || 'name').toLowerCase().replace(/\s+/g, '-')}`;
    return {
      id: String(item.id || item.Id || generatedId),
      BrandName: String(item.BrandName || ''),
      SpecificName: String(item.SpecificName || ''),
      SpecificNameAr: String(item.SpecificNameAr || ''),
      FirstSubCategoryAr: String(item.FirstSubCategoryAr || ''),
      FirstSubCategoryEn: String(item.FirstSubCategoryEn || ''),
      SecondSubCategoryAr: String(item.SecondSubCategoryAr || ''),
      SecondSubCategoryEn: String(item.SecondSubCategoryEn || ''),
      manufacturerNameEn: String(item.manufacturerNameEn || ''),
      manufacturerCountryAr: String(item.manufacturerCountryAr || ''),
      manufacturerCountryEn: String(item.manufacturerCountryEn || ''),
      "Active ingredient": String(item["Active ingredient"] || ''),
      "Key Ingredients": String(item["Key Ingredients"] || ''),
      Highlights: String(item.Highlights || ''),
      "Public price": String(item["Public price"] || ''),
      imgBox: String(item.imgBox || '')
    };
};

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3';
const READ_NOTIFICATIONS_KEY = 'pharma_read_notifications';
const CHAT_HISTORY_KEY = 'pharma_chat_history_v2';

const App: React.FC = () => {
  const { user } = useAuth();
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
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [milkProducts, setMilkProducts] = useState<MilkProduct[]>([]);
  const [clinicalGuidelines, setClinicalGuidelines] = useState<any>({});
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
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [alternatives, setAlternatives] = useState<{ direct: Medicine[], therapeutic: Medicine[] }>({ direct: [], therapeutic: [] });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch { return []; }
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [currentChatHistory, setCurrentChatHistory] = useState<ChatMessage[]>([]);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isEditMedicineModalOpen, setIsEditMedicineModalOpen] = useState(false);
  const [isEditCosmeticModalOpen, setIsEditCosmeticModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [editingCosmetic, setEditingCosmetic] = useState<Cosmetic | null>(null);
  
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomImageInitialIndex, setZoomImageInitialIndex] = useState(0);
  const [zoomImageTitle, setZoomImageTitle] = useState('');
  const [zoomImageIndexFlags, setZoomImageIndexFlags] = useState<boolean[]>([]);

  const t: TFunction = useCallback((key, replacements) => {
    const text = translations[language][key] || key;
    if (replacements) return Object.entries(replacements).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
    return text;
  }, [language]);

  const scrollToTop = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const captureScrollPosition = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) scrollPositionsByView.current[view] = container.scrollTop;
  }, [view]);

  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
        const savedPos = scrollPositionsByView.current[view] || 0;
        if (['search', 'results', 'cosmeticsSearch', 'insuranceSearch', 'milkSearch'].includes(view)) {
            container.scrollTop = savedPos;
        } else {
            container.scrollTop = 0;
        }
    }
  }, [view]);

  useEffect(() => {
    const loadData = async () => {
        try {
            let medicinesData = await getItem<Medicine[]>(MEDICINES_CACHE_KEY);
            let cosmeticsData = await getItem<Cosmetic[]>(COSMETICS_CACHE_KEY);
            let historyData = await getItem<Conversation[]>(CHAT_HISTORY_KEY);
            
            if (!medicinesData) {
                const { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } = await import('./data/data');
                const { FOOD_DATA_RAW } = await import('./data/food-data');
                medicinesData = ([...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW, ...FOOD_DATA_RAW] as any[]).map(normalizeMedicine);
                await setItem(MEDICINES_CACHE_KEY, medicinesData);
            }
            if (!cosmeticsData) {
                const { INITIAL_COSMETICS_DATA } = await import('./data/cosmetics-data');
                cosmeticsData = (INITIAL_COSMETICS_DATA as any[]).map(normalizeCosmetic);
                await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
            }
            if (historyData) setAllConversations(historyData);
            
            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            const { CUSTOM_INSURANCE_DATA } = await import('./data/custom-insurance-data');
            const { INITIAL_GUIDELINES_DATA } = await import('./data/guidelines-data');
            const { INITIAL_MILK_DATA } = await import('./data/milk-data');
            const { CUSTOM_MILK_DATA } = await import('./data/custom-milk-data');
            
            setMedicines(medicinesData || []);
            setCosmetics(cosmeticsData || []);
            setMilkProducts([...(INITIAL_MILK_DATA as any[] || []), ...(CUSTOM_MILK_DATA as any[] || [])]);
            setInsuranceData([...(INITIAL_INSURANCE_DATA as any[]), ...(CUSTOM_INSURANCE_DATA as any[])]);
            setClinicalGuidelines(INITIAL_GUIDELINES_DATA);
            setIsDataLoaded(true);

            if (!FIREBASE_DISABLED && db) {
                onSnapshot(collection(db, 'medicines'), (snapshot) => {
                    if (snapshot.empty) return;
                    const cloudMeds = snapshot.docs.map(doc => normalizeMedicine(doc.data()));
                    setMedicines(prev => {
                        const mergedMap = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
                        cloudMeds.forEach(m => mergedMap.set(m.RegisterNumber, m));
                        const mergedArray = Array.from(mergedMap.values());
                        setItem(MEDICINES_CACHE_KEY, mergedArray).catch(() => {});
                        return mergedArray;
                    });
                });

                onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), firestoreLimit(20)), (snapshot) => {
                    const cloudNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
                    setNotifications(cloudNotifs);
                });
            }
        } catch (e) { 
            console.error("Data Load Error", e);
            setIsDataLoaded(true); 
        }
    };
    loadData();
  }, [user]);

  const filteredMedicines = useMemo(() => {
    if (!medicines || medicines.length === 0) return [];
    let results = [...medicines];
    const term = searchTerm.toLowerCase().trim();
    if (term.length > 0 && term.length < 3 && !isFilterActive) return [];
    if (!term && !isFilterActive) return [];

    if (isFilterActive) {
      results = results.filter(m => {
        if (!m) return false;
        if (filters.productType === 'medicine' && m['Product type'] !== 'Human') return false;
        if (filters.productType === 'supplement' && m['Product type'] !== 'Supplement') return false;
        if (filters.productType === 'food' && m['Product type'] !== 'Food') return false;
        const mPrice = parseFloat(m['Public price']) || 0;
        if (filters.priceMin && mPrice < parseFloat(filters.priceMin)) return false;
        if (filters.priceMax && mPrice > parseFloat(filters.priceMax)) return false;
        if (filters.pharmaceuticalForm && m.PharmaceuticalForm !== filters.pharmaceuticalForm) return false;
        if (filters.manufactureName.length > 0 && !filters.manufactureName.includes(m['Manufacture Name'])) return false;
        if (filters.marketingCompany.length > 0 && !filters.marketingCompany.includes(m['Marketing Company'])) return false;
        if (filters.mainAgent.length > 0 && !filters.mainAgent.includes(m['Main Agent'])) return false;
        if (filters.legalStatus && m['Legal Status'] !== filters.legalStatus) return false;
        return true;
      });
    }

    if (term && term.length >= 3) {
      const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
      if (term.includes('*')) {
          const parts = term.split('*').map(p => p.trim()).filter(Boolean);
          if (parts.length > 0) {
              const regexPattern = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
              const regex = new RegExp(regexPattern, 'i');
              results = results.filter(m => m && regex.test(String(m[field])));
          }
      } else {
          results = results.filter(m => m && String(m[field]).toLowerCase().includes(term));
      }
    }

    results.sort((a, b) => {
        if (!a || !b) return 0;
        const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        const aVal = String(a[field]).toLowerCase();
        const bVal = String(b[field]).toLowerCase();
        const cleanTerm = term.replace(/\*/g, '');
        const aStarts = aVal.startsWith(cleanTerm);
        const bStarts = bVal.startsWith(cleanTerm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        switch (sortBy) {
            case 'priceAsc': return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
            case 'priceDesc': return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
            case 'scientificName': return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
            default: return aVal.localeCompare(bVal);
        }
    });

    return results;
  }, [medicines, searchTerm, filters, isFilterActive, textSearchMode, sortBy]);

  const handleExportData = useCallback((type: 'medicine' | 'supplement') => {
      const dataToExport = medicines.filter(m => type === 'medicine' ? m['Product type'] === 'Human' : m['Product type'] !== 'Human');
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pharma_source_${type}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert(t('exportSuccess'));
  }, [medicines, t]);

  const handleFindAlternatives = useCallback((medicine: Medicine) => {
      const sciName = String(medicine['Scientific Name']).toLowerCase().trim();
      const atc = medicine.AtcCode1?.substring(0, 4);

      const direct = medicines.filter(m => 
          m.RegisterNumber !== medicine.RegisterNumber && 
          String(m['Scientific Name']).toLowerCase().trim() === sciName
      );

      const therapeutic = medicines.filter(m => 
          m.RegisterNumber !== medicine.RegisterNumber && 
          m.AtcCode1 && atc && m.AtcCode1.startsWith(atc) && 
          String(m['Scientific Name']).toLowerCase().trim() !== sciName
      );

      setAlternatives({ direct, therapeutic });
      setSelectedMedicine(medicine);
      setView('alternatives');
      scrollToTop();
  }, [medicines, scrollToTop]);

  const handleBack = useCallback(() => {
      if (view === 'imageView') setView('details');
      else if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'cosmeticDetails') setView('cosmeticsSearch');
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (view === 'chatHistory') setView('search');
      else if (['login', 'register', 'admin', 'aiHistory', 'addData', 'notifications'].includes(view)) setView(activeTab === 'search' ? 'search' : activeTab === 'settings' ? 'settings' : activeTab === 'insurance' ? 'insuranceSearch' : activeTab === 'cosmetics' ? 'cosmeticsSearch' : 'milkSearch');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view, activeTab]);

  const handleMedicineSelect = useCallback((medicine: Medicine) => { 
      captureScrollPosition();
      setSelectedMedicine(medicine); setView('details'); 
  }, [captureScrollPosition]);

  const handleInsuranceSelect = useCallback((data: SelectedInsuranceData) => {
      captureScrollPosition();
      setSelectedInsuranceData(data);
      setView('insuranceDetails');
  }, [captureScrollPosition]);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => setView('search')} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} onExport={handleExportData} />;
      if (view === 'chatHistory') return <ChatHistoryView conversations={allConversations} onSelectConversation={(c)=>{setCurrentChatHistory(c.messages); setIsAssistantOpen(true); setView('search');}} onDeleteConversation={async (id) => { const updated = allConversations.filter(c => c.id !== id); setAllConversations(updated); await setItem(CHAT_HISTORY_KEY, updated); }} onClearHistory={async () => { setAllConversations([]); await setItem(CHAT_HISTORY_KEY, []); }} t={t} language={language} />;
      if (view === 'notifications') return <NotificationsView notifications={notifications.map(n => ({...n, isRead: readNotificationIds.includes(n.id)}))} onMarkAllRead={() => { const ids = notifications.map(n=>n.id); setReadNotificationIds(ids); localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids)); }} onMarkAsRead={(id)=>{ setReadNotificationIds(prev => { const next = [...prev, id]; localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(next)); return next; }); }} onDeleteNotification={async (id)=>{if(!FIREBASE_DISABLED) await deleteDoc(doc(db, 'notifications', id))}} isAdmin={user?.role === 'admin'} t={t} language={language} onMedicineLink={(id) => { const med = medicines.find(m => m.RegisterNumber === id); if(med) { setSelectedMedicine(med); setView('details'); } }} />;
      if (view === 'imageView') return <ImageViewer images={zoomImages} initialIndex={zoomImageInitialIndex} title={zoomImageTitle} onBack={handleBack} t={t} indexFlags={zoomImageIndexFlags} />;
      if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={alternatives} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternatives} favorites={favorites} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} t={t} language={language} />;

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine!} insuranceData={insuranceData} t={t} language={language} isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} user={user} onEdit={(med) => { setEditingMedicine({...med}); setIsEditMedicineModalOpen(true); }} onOpenAssistant={() => setIsAssistantOpen(true)} onImageZoom={(imgs,idx,ttl,flags)=>{setZoomImages(imgs); setZoomImageInitialIndex(idx); setZoomImageTitle(ttl); setZoomImageIndexFlags(flags); setView('imageView');}} onFindAlternative={handleFindAlternatives} />;
          return (
              <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length > 0} onClearSearch={() => { setSearchTerm(''); setView('search'); }} onForceSearch={() => { setView('results'); }} onSearchIconClick={scrollToTop} onBarcodeScanClick={()=>{}} t={t} />
                  <div className="flex gap-2 mt-1">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={Object.values(filters).filter((f: any) => f && f!=='all' && f.length!==0).length} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-4">
                      {filteredMedicines.length > 0 ? (
                        <ResultsList medicines={filteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternatives} favorites={favorites} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} t={t} language={language} resultsState="loaded" />
                      ) : (searchTerm.length >= 3 || isFilterActive) && <div className="text-center py-10"><p className="text-slate-400">{t('noResultsTitle')}</p></div>}
                  </div>
              </div>
          );
      }
      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={(c) => { setEditingCosmetic({...c}); setIsEditCosmeticModalOpen(true); }} />;
          return <CosmeticsView t={t} language={language} cosmetics={cosmetics} onSelectCosmetic={(c)=>{ captureScrollPosition(); setSelectedCosmetic(c); setView('cosmeticDetails');}} searchTerm={cosmeticsSearchTerm} setSearchTerm={setCosmeticsSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} onSearchIconClick={scrollToTop} />;
      }
      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} scrollToTop={scrollToTop} />;
      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsuranceData) return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={handleInsuranceSelect} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} onSearchIconClick={scrollToTop} />;
      }
      if (activeTab === 'settings') return (
              <div className="space-y-4 animate-fade-in pb-10">
                  <h2 className="text-xl font-bold px-1">{t('navSettings')}</h2>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      {user ? <div className="flex justify-between items-center"><div><p className="font-bold">{user.username}</p><p className="text-sm text-gray-500">{t(`${user.role}Role` as any)}</p></div><button onClick={() => setView('chatHistory')} className="p-3 bg-slate-100 text-slate-700 rounded-xl flex items-center gap-2"><span>{t('clearHistory')}</span></button></div> : <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100 border border-slate-100">
                      <button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"><span className="flex items-center gap-3"><span className="font-medium">{t('language')}</span></span><span className="font-black text-primary">{language === 'ar' ? 'English' : 'العربية'}</span></button>
                  </div>
                  {user && <button onClick={() => useAuth().logout()} className="w-full py-4 text-red-500 font-black bg-white rounded-xl shadow-sm hover:bg-red transition-colors mt-4">{t('logout')}</button>}
              </div>
          );
      return <div className="text-center py-20 text-slate-400">Application Error. Please reload.</div>;
  };

  return (
    <div className="bg-light-bg text-slate-900 h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch' && view !== 'milkSearch'} onBack={handleBack} t={t} onLoginClick={() => setView('login')} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.filter(n=>!readNotificationIds.includes(n.id)).length} />
      <main id="main-scroll-container" className="flex-grow mx-auto px-4 space-y-4 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] w-full max-w-7xl">
          {renderContent()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={(tab)=>{ if (activeTab === tab) scrollToTop(); setActiveTab(tab); setView(tab==='search'?'search':tab==='insurance'?'insuranceSearch':tab==='cosmetics'?'cosmeticsSearch':tab==='milk'?'milkSearch':'settings'); }} t={t} user={user} view={view} />
      <div className="fixed bottom-24 right-4 z-30"><FloatingAssistantButton onClick={()=>setIsAssistantOpen(true)} onLongPress={()=>{}} t={t} language={language} /></div>
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={(hist)=>{setIsAssistantOpen(false); if(hist.length>1){const titlePart=hist.find(m=>m.role==='user')?.parts.find(p=>'text' in p)?.text||'New Chat'; const newC={id:`chat-${Date.now()}`, title:titlePart.length>30?titlePart.substring(0,30)+'...':titlePart, messages:hist, timestamp:Date.now()}; setAllConversations(prev=>[newC, ...prev]); setItem(CHAT_HISTORY_KEY, [newC, ...allConversations]);}}} contextMedicine={view === 'details' ? selectedMedicine : null} contextCosmetic={view === 'cosmeticDetails' ? selectedCosmetic : null} allMedicines={medicines} favoriteMedicines={medicines.filter(m => favorites.includes(m.RegisterNumber))} initialPrompt={assistantPrompt} initialHistory={currentChatHistory} t={t} language={language} onShowHistory={() => setView('chatHistory')} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} filters={filters} onApply={(newFilters) => setFilters(newFilters)} onClearFilters={() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' })} groupedPharmaceuticalForms={groupPharmaceuticalForms(Array.from(new Set(medicines.map(m => m.PharmaceuticalForm).filter(Boolean))), t)} uniqueManufactureNames={Array.from(new Set(medicines.map(m => m["Manufacture Name"]).filter(Boolean))).sort()} uniqueMarketingCompanies={Array.from(new Set(medicines.map(m => m["Marketing Company"]).filter(Boolean))).sort()} uniqueMainAgents={Array.from(new Set(medicines.map(m => m["Main Agent"]).filter(Boolean))).sort()} uniqueLegalStatuses={Array.from(new Set(medicines.map(m => m["Legal Status"]).filter(Boolean))).sort()} t={t} />
      <EditMedicineModal isOpen={isEditMedicineModalOpen} onClose={() => setIsEditMedicineModalOpen(false)} medicine={editingMedicine} onSave={async (updatedMed) => { if (user?.role === 'admin') { await setDoc(doc(db, 'medicines', updatedMed.RegisterNumber), updatedMed, { merge: true }); alert(t('saveSuccess')); } }} t={t} />
      <EditCosmeticModal isOpen={isEditCosmeticModalOpen} onClose={() => setIsEditCosmeticModalOpen(false)} cosmetic={editingCosmetic} onSave={async (c) => { if (user?.role === 'admin') { await setDoc(doc(db, 'cosmetics', c.id), c, { merge: true }); alert(t('saveSuccess')); } }} t={t} />
    </div>
  );
};

export default App;
