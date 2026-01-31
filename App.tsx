
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
import EditCosmeticModal from './components/EditCosmeticModal';
import ImageViewer from './components/ImageViewer';

import AdminIcon from './components/icons/AdminIcon';
import HistoryIcon from './components/icons/HistoryIcon';
import MoonIcon from './components/MoonIcon';
import SunIcon from './components/SunIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';
import TrashIcon from './components/icons/TrashIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import PillBottleIcon from './components/icons/PillBottleIcon';
import BackIcon from './components/icons/BackIcon';

import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';

import { translations } from './translations';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';
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
    "Product type": String(item["Product type"] || (item.DrugType === 'Health' ? 'Supplement' : 'Human')),
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
    shelfLife: String(item.shelfLife || ''),
    "Storage conditions": String(item["Storage conditions"] || item.StorageConditions || ''),
    "Storage Condition Arabic": String(item["Storage Condition Arabic"] || ''),
    "Marketing Company": String(item["Marketing Company"] || ''),
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

const normalizeCosmetic = (item: any): Cosmetic => ({
  id: String(item.id || item.BrandName + '-' + Math.random()),
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
});

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3';
const READ_NOTIFICATIONS_KEY = 'pharma_read_notifications';

const App: React.FC = () => {
  const { user } = useAuth();
  const scrollPositionRef = useRef(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });
  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('language');
      return (saved === 'ar' || saved === 'en') ? saved as Language : 'en';
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
      try { 
          const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
          if (stored) {
              const parsed = JSON.parse(stored);
              return Array.isArray(parsed) ? (parsed as string[]) : [];
          }
          return [];
      } catch { return []; }
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
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [alternatives, setAlternatives] = useState<{ direct: Medicine[], therapeutic: Medicine[] }>({ direct: [], therapeutic: [] });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? (parsed as string[]) : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt] = useState('');
  const [currentChatHistory] = useState<ChatMessage[]>([]);
  
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [, setIsBarcodeScannerOpen] = useState(false);
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
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (view === 'details' || view === 'cosmeticDetails' || view === 'insuranceDetails' || view === 'alternatives') {
        scrollToTop();
    }
  }, [view, scrollToTop]);

  const filteredMedicines = useMemo(() => {
    let results = [...medicines];
    const isFilterActive = filters.productType !== 'all' || filters.priceMin || filters.priceMax || filters.pharmaceuticalForm || filters.manufactureName.length > 0 || filters.marketingCompany.length > 0 || filters.mainAgent.length > 0 || filters.legalStatus;
    
    if (!searchTerm && !isFilterActive) return [];

    if (isFilterActive) {
      results = results.filter(m => {
        if (filters.productType === 'medicine' && m['Product type'] !== 'Human') return false;
        if (filters.productType === 'supplement' && m['Product type'] === 'Human') return false;
        
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

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
      const termParts = term.split(/\s+/).filter(Boolean);

      if (termParts.length >= 2) {
          const part1 = termParts[0];
          const part2 = termParts[1];
          results = results.filter(m => {
              const val = String(m[field]).toLowerCase();
              return val.startsWith(part1) && val.includes(part2);
          });
      } else {
          results = results.filter(m => String(m[field]).toLowerCase().includes(term));
      }
    }

    results.sort((a, b) => {
        if (term) {
            const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
            const aStarts = String(a[field]).toLowerCase().startsWith(term);
            const bStarts = String(b[field]).toLowerCase().startsWith(term);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
        }

        switch (sortBy) {
            case 'priceAsc':
                return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
            case 'priceDesc':
                return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
            case 'scientificName':
                return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
            case 'alphabetical':
            default:
                return String(a['Trade Name']).localeCompare(String(b['Trade Name']));
        }
    });

    return results;
  }, [medicines, searchTerm, filters, textSearchMode, sortBy]);

  const handleBack = useCallback(() => {
      if (view === 'imageView') setView('details');
      else if (view === 'details' || view === 'alternatives') setView('results'); 
      else if (view === 'cosmeticDetails') setView('cosmeticsSearch');
      else if (view === 'insuranceDetails') setView('insuranceSearch');
      else if (['login', 'register', 'admin', 'aiHistory', 'addData', 'addInsuranceData', 'addCosmeticsData', 'verifyEmail', 'notifications'].includes(view)) setView(activeTab === 'search' ? 'search' : activeTab === 'settings' ? 'settings' : activeTab === 'insurance' ? 'insuranceSearch' : activeTab === 'cosmetics' ? 'cosmeticsSearch' : 'milkSearch');
      else if (view === 'results') { setView('search'); setSearchTerm(''); }
      else { setView('search'); setActiveTab('search'); }
  }, [view, activeTab]);

  useEffect(() => {
    let unsubMeds: (() => void) | undefined;
    let unsubCosm: (() => void) | undefined;
    let unsubNotifs: (() => void) | undefined;

    const loadData = async () => {
        try {
            let medicinesData = await getItem<Medicine[]>(MEDICINES_CACHE_KEY);
            let cosmeticsData = await getItem<Cosmetic[]>(COSMETICS_CACHE_KEY);
            if (!medicinesData) {
                const { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } = await import('./data/data');
                medicinesData = ([...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW] as any[]).map(normalizeMedicine);
                await setItem(MEDICINES_CACHE_KEY, medicinesData);
            }
            if (!cosmeticsData) {
                const { INITIAL_COSMETICS_DATA } = await import('./data/cosmetics-data');
                cosmeticsData = (INITIAL_COSMETICS_DATA as any[]).map(normalizeCosmetic);
                await setItem(COSMETICS_CACHE_KEY, cosmeticsData);
            }
            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            const { CUSTOM_INSURANCE_DATA } = await import('./data/custom-insurance-data');
            const { INITIAL_GUIDELINES_DATA } = await import('./data/guidelines-data');
            const { INITIAL_MILK_DATA } = await import('./data/milk-data');
            const { CUSTOM_MILK_DATA } = await import('./data/custom-milk-data');
            
            setMedicines((medicinesData || []) as Medicine[]);
            setCosmetics((cosmeticsData || []) as Cosmetic[]);
            setMilkProducts([...(INITIAL_MILK_DATA as any[] || []), ...(CUSTOM_MILK_DATA as any[] || [])]);
            setInsuranceData([...(INITIAL_INSURANCE_DATA as any[]), ...(CUSTOM_INSURANCE_DATA as any[])]);
            setClinicalGuidelines(INITIAL_GUIDELINES_DATA);
            setIsDataLoaded(true);

            if (!FIREBASE_DISABLED && db && db.type === 'firestore') {
                // إضافة معالج الخطأ (onSnapshot's error callback) لمنع Uncaught Errors
                unsubMeds = onSnapshot(collection(db, 'medicines'), (snapshot) => {
                    const cloudMeds = snapshot.docs.map(doc => normalizeMedicine(doc.data()));
                    if (cloudMeds.length > 0) {
                        setMedicines(prev => {
                            const mergedMap = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
                            cloudMeds.forEach(m => mergedMap.set(m.RegisterNumber, m));
                            const mergedArray = Array.from(mergedMap.values());
                            setItem(MEDICINES_CACHE_KEY, mergedArray).catch(console.error);
                            return mergedArray;
                        });
                    }
                }, (error) => {
                    console.warn("Firestore sync permission denied for medicines. Using local cache.", error);
                });

                unsubCosm = onSnapshot(collection(db, 'cosmetics'), (snapshot) => {
                    const cloudCosm = snapshot.docs.map(doc => normalizeCosmetic({ id: doc.id, ...doc.data() }));
                    if (cloudCosm.length > 0) {
                        setCosmetics(prev => {
                            const mergedMap = new Map<string, Cosmetic>(prev.map(c => [c.id, c]));
                            cloudCosm.forEach(c => mergedMap.set(c.id, c));
                            const mergedArray = Array.from(mergedMap.values());
                            setItem(COSMETICS_CACHE_KEY, mergedArray).catch(console.error);
                            return mergedArray;
                        });
                    }
                }, (error) => {
                    console.warn("Firestore sync permission denied for cosmetics. Using local cache.", error);
                });

                // الاستماع للإشعارات فقط في حال تسجيل الدخول لمنع أخطاء الصلاحيات
                if (user) {
                    unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
                        const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
                        setNotifications(allNotifs.filter(n => (!n.targetUserId || n.targetUserId === user?.id) && (!n.targetRole || n.targetRole === user?.role)));
                    }, (error) => {
                        console.warn("Firestore sync permission denied for notifications.", error);
                    });
                }
            }
        } catch (e) { console.error("Error loading data", e); setIsDataLoaded(true); }
    };
    loadData();
    return () => { unsubMeds?.(); unsubCosm?.(); unsubNotifs?.(); };
  }, [user]);

  const handleSaveCosmetic = async (updatedCosm: Cosmetic) => {
      if (!user) return;
      try {
          if (user.role === 'admin') {
              await setDoc(doc(db, 'cosmetics', updatedCosm.id), updatedCosm, { merge: true });
              alert(t('saveSuccess'));
          } else if (user.role === 'company') {
              const original = cosmetics.find(c => c.id === updatedCosm.id);
              const changes: any = {};
              Object.keys(updatedCosm).forEach(key => {
                  if ((updatedCosm as any)[key] !== (original as any)?.[key]) {
                      changes[key] = (updatedCosm as any)[key];
                  }
              });
              if (Object.keys(changes).length === 0) { alert("No changes detected."); return; }
              await addDoc(collection(db, 'pending_updates'), {
                  medicineId: updatedCosm.id,
                  itemType: 'cosmetic',
                  type: 'edit',
                  newData: changes,
                  originalData: original,
                  submittedBy: user.id,
                  submittedByName: user.username,
                  timestamp: Date.now(),
                  status: 'pending'
              });
              alert(t('requestSubmittedTitle'));
          }
      } catch (err: any) {
          alert(`Error saving: ${err.message}`);
      }
  };

  const handleMedicineSelect = useCallback((medicine: Medicine) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedMedicine(medicine); setView('details'); 
  }, []);

  const handleFindAlternative = useCallback((med: Medicine) => {
    const direct = medicines.filter(m => m['Scientific Name'] === med['Scientific Name'] && m.RegisterNumber !== med.RegisterNumber);
    const therapeutic = med.AtcCode1 ? medicines.filter(m => m.AtcCode1?.substring(0, 5) === med.AtcCode1!.substring(0, 5) && m['Scientific Name'] !== med['Scientific Name']) : [];
    setAlternatives({ direct, therapeutic });
    setSelectedMedicine(med);
    setView('alternatives');
  }, [medicines]);

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => { alert(t('registerSuccessPending')); setView('login'); }} />;
      if (view === 'admin') return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} /> : null;
      if (view === 'notifications') return <NotificationsView notifications={notifications.map(n => ({...n, isRead: readNotificationIds.includes(n.id)}))} onMarkAllRead={() => { const ids = notifications.map(n=>n.id); setReadNotificationIds(ids); localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids)); }} onMarkAsRead={(id)=>{ setReadNotificationIds(prev => { const next = [...prev, id]; localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(next)); return next; }); }} onDeleteNotification={async (id)=>{if(!FIREBASE_DISABLED) await deleteDoc(doc(db, 'notifications', id))}} isAdmin={user?.role === 'admin'} t={t} language={language} />;
      if (view === 'imageView') return <ImageViewer images={zoomImages} initialIndex={zoomImageInitialIndex} title={zoomImageTitle} onBack={handleBack} t={t} indexFlags={zoomImageIndexFlags} />;
      if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={alternatives} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { setSelectedMedicine(m); setIsAssistantOpen(true); }} onFindAlternative={handleFindAlternative} favorites={favorites} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} t={t} language={language} />;

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine!} t={t} language={language} isFavorite={favorites.includes(selectedMedicine!.RegisterNumber)} onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} user={user} onEdit={(med) => { setEditingMedicine({...med}); setIsEditMedicineModalOpen(true); }} onOpenAssistant={() => { if (user) { setSelectedMedicine(selectedMedicine); setIsAssistantOpen(true); } else { alert(t('loginRequired')); setView('login'); } }} onImageZoom={(imgs,idx,ttl,flags)=>{setZoomImages(imgs); setZoomImageInitialIndex(idx); setZoomImageTitle(ttl); setZoomImageIndexFlags(flags); setView('imageView');}} onFindAlternative={handleFindAlternative} />;
          return (
              <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length >= 3} onClearSearch={() => { setSearchTerm(''); setView('search'); }} onForceSearch={() => { scrollToTop(); }} onSearchIconClick={scrollToTop} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                  <div className="flex gap-2 mt-1">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={Object.values(filters).filter((f: any) => f && f!=='all' && f.length!==0).length} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-4">
                      {filteredMedicines.length > 0 ? (
                        <ResultsList 
                          medicines={filteredMedicines} 
                          onMedicineSelect={handleMedicineSelect} 
                          onMedicineLongPress={(m) => { setSelectedMedicine(m); setIsAssistantOpen(true); }} 
                          onFindAlternative={handleFindAlternative} 
                          favorites={favorites} 
                          onToggleFavorite={(id)=>setFavorites(prev=>prev.includes(id)?prev.filter(f=>f!==id):[...prev,id])} 
                          t={t} 
                          language={language} 
                          resultsState="loaded" 
                        />
                      ) : (
                        (searchTerm.length >= 3) && (
                          <div className="text-center py-10"><p className="text-slate-400">{t('noResultsTitle')}</p></div>
                        )
                      )}
                  </div>
              </div>
          );
      }
      
      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) {
              return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={(c) => { setEditingCosmetic({...c}); setIsEditCosmeticModalOpen(true); }} />;
          }
          return <CosmeticsView 
                    t={t} 
                    language={language} 
                    cosmetics={cosmetics} 
                    onSelectCosmetic={(c)=>{setSelectedCosmetic(c); setView('cosmeticDetails');}} 
                    searchTerm={cosmeticsSearchTerm} 
                    setSearchTerm={setCosmeticsSearchTerm} 
                    selectedBrand={selectedBrand} 
                    setSelectedBrand={setSelectedBrand} 
                    onSearchIconClick={scrollToTop} 
                    onCosmeticLongPress={(c) => { if(user?.role==='admin'||user?.role==='company'){ setEditingCosmetic({...c}); setIsEditCosmeticModalOpen(true); } }}
                />;
      }

      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} scrollToTop={scrollToTop} />;
      if (activeTab === 'insurance') return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(d)=>{setSelectedInsuranceData(d); setView('insuranceDetails');}} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} onSearchIconClick={scrollToTop} />;
      
      if (activeTab === 'settings') {
          return (
              <div className="space-y-4 animate-fade-in pb-10">
                  <h2 className="text-xl font-bold">{t('navSettings')}</h2>
                  <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                      {user ? (
                        <div className="flex justify-between items-center">
                            <div><p className="font-bold">{user.username}</p><p className="text-sm text-gray-500">{t(`${user.role}Role` as any)}</p></div>
                            {user.role === 'admin' && <button onClick={() => setView('admin')} className="p-3 bg-primary text-white rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-all"><AdminIcon /><span className="text-xs font-black uppercase tracking-widest">{t('adminDashboard')}</span></button>}
                        </div>
                      ) : <button onClick={() => setView('login')} className="w-full py-2 bg-primary text-white rounded-lg">{t('login')}</button>}
                  </div>
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm overflow-hidden"><button onClick={()=>setTheme(p=>p==='light'?'dark':'light')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"><span className="flex items-center gap-2"><div className="w-5 h-5">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}</div> {theme === 'dark' ? t('darkMode') : t('lightMode')}</span></button><button onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')} className="w-full flex items-center justify-between p-4 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"><span>{t('language')}</span><span className="font-bold">{language === 'ar' ? 'العربية' : 'English'}</span></button></div>
                  {user && <button onClick={() => useAuth().logout()} className="w-full py-4 text-red-500 font-bold bg-white dark:bg-dark-card rounded-xl shadow-sm hover:bg-red-50 transition-colors mt-4">{t('logout')}</button>}
              </div>
          );
      }
      return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header title="PharmaSource" showBack={view !== 'search' && view !== 'settings' && view !== 'insuranceSearch' && view !== 'cosmeticsSearch' && view !== 'milkSearch'} onBack={handleBack} theme={theme} toggleTheme={()=>setTheme(p=>p==='light'?'dark':'light')} t={t} onLoginClick={() => setView('login')} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.filter(n=>!readNotificationIds.includes(n.id)).length} />
      <main id="main-scroll-container" className="flex-grow mx-auto px-4 space-y-4 overflow-y-auto pt-[calc(env(safe-area-inset-top)+80px)] pb-[calc(90px+env(safe-area-inset-bottom))] w-full max-w-7xl">
          {isDataLoaded ? renderContent() : <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={(tab)=>{setActiveTab(tab); setView(tab==='search'?'search':tab==='insurance'?'insuranceSearch':tab==='cosmetics'?'cosmeticsSearch':tab==='milk'?'milkSearch':'settings');}} t={t} user={user} view={view} />
      <div className="fixed bottom-24 right-4 z-30"><FloatingAssistantButton onClick={()=>setIsAssistantOpen(true)} onLongPress={()=>{}} t={t} language={language} /></div>
      <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={()=>{setIsAssistantOpen(false)}} contextMedicine={selectedMedicine} contextCosmetic={selectedCosmetic} allMedicines={medicines} favoriteMedicines={medicines.filter(m => favorites.includes(m.RegisterNumber))} initialPrompt={assistantPrompt} initialHistory={currentChatHistory} t={t} language={language} />
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        filters={filters} 
        onApply={(newFilters) => setFilters(newFilters)} 
        onClearFilters={() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' })} 
        groupedPharmaceuticalForms={groupPharmaceuticalForms(Array.from(new Set(medicines.map(m => m.PharmaceuticalForm).filter(Boolean))), t)} 
        uniqueManufactureNames={Array.from(new Set(medicines.map(m => m["Manufacture Name"]).filter(Boolean))).sort()} 
        uniqueMarketingCompanies={Array.from(new Set(medicines.map(m => m["Marketing Company"]).filter(Boolean))).sort()} 
        uniqueMainAgents={Array.from(new Set(medicines.map(m => m["Main Agent"]).filter(Boolean))).sort()} 
        uniqueLegalStatuses={Array.from(new Set(medicines.map(m => m["Legal Status"]).filter(Boolean))).sort()} 
        t={t} 
      />
      <EditMedicineModal isOpen={isEditMedicineModalOpen} onClose={() => setIsEditMedicineModalOpen(false)} medicine={editingMedicine} onSave={async (updatedMed) => { if (user?.role === 'admin') { await setDoc(doc(db, 'medicines', updatedMed.RegisterNumber), updatedMed, { merge: true }); alert(t('saveSuccess')); } }} t={t} />
      <EditCosmeticModal isOpen={isEditCosmeticModalOpen} onClose={() => setIsEditCosmeticModalOpen(false)} cosmetic={editingCosmetic} onSave={handleSaveCosmetic} t={t} />
    </div>
  );
};

export default App;
