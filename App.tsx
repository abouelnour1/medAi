
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  InsuranceDrug, SelectedInsuranceData, InsuranceSearchMode, Notification as AppNotification
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
import InsuranceSearchView from './components/InsuranceSearchView';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import FavoritesView from './components/FavoritesView';
import NotificationsView from './components/NotificationsView';
import { useDebounce } from './hooks/useDebounce';
import PharmacistQuickView from './components/PharmacistQuickView';
import { requestPushPermission, setupForegroundNotifications, setupCapacitorPush } from './utils/pushNotifications';
import CompareBar from './components/CompareBar';
import CompareModal from './components/CompareModal';
import EditMedicineModal from './components/EditMedicineModal';
import ImageViewer from './components/ImageViewer';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { useAuth } from './components/auth/AuthContext';
import { translations } from './translations';
import { db, FIREBASE_DISABLED } from './firebase';
import { doc, setDoc, collection, onSnapshot, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';

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
const RECENT_SEARCHES_KEY = 'pharma_recent_searches';
const MAX_RECENT = 8;

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
  const debouncedSearchTerm = useDebounce(searchTerm, 280);
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [filters, setFilters] = useState<Filters>({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => { try { const s = localStorage.getItem(FAVORITES_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [recentSearches, setRecentSearches] = useState<Medicine[]>(() => { try { const s = localStorage.getItem(RECENT_SEARCHES_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [compareList, setCompareList] = useState<Medicine[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [pharmacistMode, setPharmacistMode] = useState(() => localStorage.getItem('pharmacist_mode') === 'true');
  const [quickViewMedicine, setQuickViewMedicine] = useState<Medicine | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeImageViewer, setActiveImageViewer] = useState<{ images: string[], index: number, title: string, flags: boolean[] } | null>(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(() => localStorage.getItem('app_has_loaded') === 'true');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isDataLoaded && isOnline) {
      localStorage.setItem('app_has_loaded', 'true');
      setHasLoadedBefore(true);
    }
  }, [isDataLoaded, isOnline]);

  // حفظ scroll position لكل view على حدة
  const scrollPositions = useRef<Map<string, number>>(new Map());

  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  const [selectedInsurance, setSelectedInsurance] = useState<SelectedInsuranceData | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(90);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setHeaderHeight(entry.contentRect.height + 8);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

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

  const restoreScroll = useCallback((targetView: string) => {
      requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
              const saved = scrollPositions.current.get(targetView) || 0;
              scrollContainerRef.current.scrollTo({ top: saved, behavior: 'auto' });
          }
      });
  }, []);

  const handleBack = useCallback(() => {
      if (view === 'imageView') {
          setView('details');
          restoreScroll('details');
      } else if (view === 'details' || view === 'alternatives') {
          setView('results');
          restoreScroll('results');
      } else if (view === 'insuranceDetails') {
          setView('insuranceSearch');
          restoreScroll('insuranceSearch');
      } else if (['login', 'register', 'admin', 'notifications', 'favorites'].includes(view)) {
          const target = activeTab === 'search' 
              ? (searchTerm.length >= 3 ? 'results' : 'search') 
              : (activeTab === 'insurance' ? 'insuranceSearch' : 'settings');
          setView(target);
          restoreScroll(target);
      } else if (view === 'results' || view === 'insuranceSearch') { 
          setView('search'); 
          setSearchTerm(''); 
          setInsuranceSearchTerm(''); 
          restoreScroll('search');
      } else { 
          setView('search'); 
          setActiveTab('search'); 
          restoreScroll('search');
      }
  }, [view, activeTab, searchTerm, restoreScroll]);

  const handleMedicineSelect = (m: Medicine) => {
    if (scrollContainerRef.current) {
        scrollPositions.current.set(view, scrollContainerRef.current.scrollTop);
    }
    // حفظ في سجل البحث الأخير
    setRecentSearches(prev => {
        const filtered = prev.filter(r => r.RegisterNumber !== m.RegisterNumber);
        const updated = [m, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
    });
    setSelectedMedicine(m);
    setView('details');
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

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
                    const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
                    // فلترة الإشعارات - كل إشعار بدون targetUserId يظهر للكل
                    setNotifications(allNotifs.filter(n => {
                      if (!n.targetUserId && !n.targetRole) return true; // عام للكل
                      if (n.targetUserId && user && n.targetUserId === user.id) return true; // خاص بالمستخدم
                      if (n.targetRole && user && n.targetRole === user.role) return true; // خاص برول معين
                      return false;
                    }));
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

  const searchContextMedicines = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim().replace(/\*/g, '');
    if (term.length < 3) return medicines;
    return medicines.filter(m => {
        const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
        return String(m[field]).toLowerCase().includes(term);
    });
  }, [medicines, debouncedSearchTerm, textSearchMode]);

  const finalFilteredMedicines = useMemo(() => {
    let results = [...searchContextMedicines];
    const hasFilters = Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : (v !== 'all' && v !== ''));
    if (debouncedSearchTerm.length < 3 && !hasFilters) return [];

    if (filters.productType !== 'all') {
        const type = filters.productType === 'medicine' ? 'Human' : filters.productType === 'supplement' ? 'Supplement' : 'Food';
        results = results.filter(m => m['Product type'] === type);
    }
    if (filters.priceMin) results = results.filter(m => (parseFloat(m['Public price']) || 0) >= parseFloat(filters.priceMin));
    if (filters.priceMax) results = results.filter(m => (parseFloat(m['Public price']) || 0) <= parseFloat(filters.priceMax));
    if (filters.pharmaceuticalForm) results = results.filter(m => m.PharmaceuticalForm === filters.pharmaceuticalForm);
    if (filters.legalStatus) results = results.filter(m => m['Legal Status'] === filters.legalStatus);
    if (filters.manufactureName.length > 0) results = results.filter(m => filters.manufactureName.includes(m['Manufacture Name']));
    if (filters.marketingCompany.length > 0) results = results.filter(m => filters.marketingCompany.includes(m['Marketing Company']));
    if (filters.mainAgent.length > 0) results = results.filter(m => filters.mainAgent.includes(m['Main Agent']));

    const term = debouncedSearchTerm.toLowerCase().trim().replace(/\*/g, '');
    const field = textSearchMode === 'tradeName' ? 'Trade Name' : 'Scientific Name';

    results.sort((a, b) => {
        const aName = String(a[field]).toLowerCase();
        const bName = String(b[field]).toLowerCase();
        const aStarts = aName.startsWith(term);
        const bStarts = bName.startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        if (sortBy === 'alphabetical') return aName.localeCompare(bName);
        if (sortBy === 'scientificName') return String(a['Scientific Name']).localeCompare(String(b['Scientific Name']));
        if (sortBy === 'priceAsc') return (parseFloat(a['Public price']) || 0) - (parseFloat(b['Public price']) || 0);
        if (sortBy === 'priceDesc') return (parseFloat(b['Public price']) || 0) - (parseFloat(a['Public price']) || 0);
        if (sortBy === 'strengthAsc') return (parseFloat(a.Strength) || 0) - (parseFloat(b.Strength) || 0);
        if (sortBy === 'strengthDesc') return (parseFloat(b.Strength) || 0) - (parseFloat(a.Strength) || 0);
        return 0;
    });

    return results;
  }, [searchContextMedicines, filters, sortBy, debouncedSearchTerm, textSearchMode]);

  const alternatives = useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };
    const sciName = String(selectedMedicine['Scientific Name']).toLowerCase();
    const strength = String(selectedMedicine.Strength).toLowerCase();
    const form = String(selectedMedicine.PharmaceuticalForm).toLowerCase();
    const atc = String(selectedMedicine.AtcCode1 || '').substring(0, 4);

    const direct = medicines.filter(m => 
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        String(m['Scientific Name']).toLowerCase() === sciName &&
        String(m.Strength).toLowerCase() === strength &&
        String(m.PharmaceuticalForm).toLowerCase() === form
    );

    const therapeutic = (atc && atc.length >= 4) ? medicines.filter(m => 
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        String(m.AtcCode1 || '').startsWith(atc) &&
        !direct.some(d => d.RegisterNumber === m.RegisterNumber)
    ) : [];

    return { direct, therapeutic };
  }, [selectedMedicine, medicines]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.productType !== 'all') count++;
    if (filters.priceMin !== '') count++;
    if (filters.priceMax !== '') count++;
    if (filters.pharmaceuticalForm !== '') count++;
    if (filters.legalStatus !== '') count++;
    if (filters.manufactureName.length > 0) count++;
    if (filters.marketingCompany.length > 0) count++;
    if (filters.mainAgent.length > 0) count++;
    return count;
  }, [filters]);

  // مشاركة الدواء
  const handleShareMedicine = (medicine: Medicine) => {
    const price = parseFloat(medicine['Public price']);
    const text = `💊 *${medicine['Trade Name']}*
🧪 ${medicine['Scientific Name']}
💰 ${price > 0 ? price.toFixed(2) + ' ريال' : 'غير متاح'}
🏭 ${medicine['Manufacture Name']}
📋 ${medicine['Legal Status']}

🔗 عبر تطبيق PharmaSource KSA`;
    if (navigator.share) {
        navigator.share({ title: medicine['Trade Name'], text });
    } else {
        navigator.clipboard?.writeText(text).then(() => alert('تم نسخ بيانات الدواء!'));
    }
  };

  // مقارنة الأدوية
  const toggleCompare = (medicine: Medicine) => {
    setCompareList(prev => {
        if (prev.find(m => m.RegisterNumber === medicine.RegisterNumber)) {
            return prev.filter(m => m.RegisterNumber !== medicine.RegisterNumber);
        }
        if (prev.length >= 2) return [prev[1], medicine];
        return [...prev, medicine];
    });
  };

  const toggleFavorite = (id: string) => {
      const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
      setFavorites(newFavs);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavs));
  };

  const handleSaveMedicine = async (updatedMed: Medicine) => {
    if (!user) return;
    if (user.role === 'admin') {
        try {
            await setDoc(doc(db, 'medicines', updatedMed.RegisterNumber), updatedMed, { merge: true });
            setSelectedMedicine(updatedMed);
            alert(t('saveSuccess'));
        } catch (e) { alert("Error saving: " + e); }
    } else if (user.role === 'company') {
        try {
            await addDoc(collection(db, 'pending_updates'), {
                medicineId: updatedMed.RegisterNumber,
                submittedBy: user.id,
                submittedByName: user.username,
                timestamp: Date.now(),
                status: 'pending',
                newData: updatedMed,
                originalData: selectedMedicine,
                type: 'edit'
            });
            alert(t('requestSubmittedTitle'));
        } catch (e) { alert("Error submitting request: " + e); }
    }
  };

  const handleTabClick = (tab: Tab) => {
      // حفظ scroll position للـ view الحالية قبل التنقل
      if (scrollContainerRef.current) {
          scrollPositions.current.set(view, scrollContainerRef.current.scrollTop);
      }
      if (activeTab === tab) {
          // لو ضغط على نفس الـ tab، يرجع للأول وإيزال الـ scroll
          if (tab === 'search') { setView('search'); scrollPositions.current.delete('search'); }
          if (tab === 'insurance') { setView('insuranceSearch'); scrollPositions.current.delete('insuranceSearch'); }
          if (tab === 'settings') { setView('settings'); scrollPositions.current.delete('settings'); }
      } else {
          setActiveTab(tab);
          // استعادة position الـ tab الجديد لو موجود
          const targetView = tab === 'insurance' ? 'insuranceSearch' : tab === 'settings' ? 'settings' : 'search';
          if (tab === 'insurance' && !['insuranceSearch', 'insuranceDetails'].includes(view)) { setView('insuranceSearch'); restoreScroll('insuranceSearch'); }
          else if (tab === 'settings' && !['settings', 'favorites', 'notifications', 'aiHistory'].includes(view)) { setView('settings'); restoreScroll('settings'); }
          else if (tab === 'search' && !['search', 'results', 'details', 'alternatives'].includes(view)) { setView('search'); restoreScroll('search'); }
      }
  };

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => setView('search')} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} onExport={(type) => {
        const filtered = medicines.filter(m => 
          type === 'medicine' ? m['Product type'] === 'Human' :
          type === 'supplement' ? m['Product type'] === 'Supplement' : 
          m['Product type'] === 'Food'
        );
        const headers = ['RegisterNumber','Trade Name','Scientific Name','Strength','StrengthUnit','PharmaceuticalForm','Public price','Legal Status','Manufacture Name','Marketing Company','Main Agent','Distribute area','PackageSize','SizeUnit','AtcCode1'];
        const csv = [headers.join(','), ...filtered.map(m => headers.map(h => JSON.stringify(String((m as any)[h] || ''))).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `pharmasource_${type}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
      }} />;
      if (view === 'notifications') return <NotificationsView 
        notifications={notifications} 
        isAdmin={user?.role==='admin'} 
        t={t} 
        language={language} 
        onMarkAsRead={async (id) => {
          // تحديث محلي فوري
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
          // تحديث Firebase
          if (db) {
            try { await updateDoc(doc(db, 'notifications', id), { isRead: true }); } catch(e) {}
          }
        }}
        onMarkAllRead={async () => {
          // تحديث محلي فوري
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          // تحديث Firebase لكل إشعار
          if (db) {
            const unread = notifications.filter(n => !n.isRead);
            await Promise.all(unread.map(n => 
              updateDoc(doc(db, 'notifications', n.id), { isRead: true }).catch(()=>{})
            ));
          }
        }}
        onDeleteNotification={async (id)=>{ 
          if (!db) return; 
          await deleteDoc(doc(db, 'notifications', id)); 
        }}
        onMedicineLink={(medicineId) => {
          // البحث عن الدواء وفتح صفحته
          const medicine = medicines.find(m => m.RegisterNumber === medicineId);
          if (medicine) {
            setSelectedMedicine(medicine);
            setView('details');
          }
        }}
      />;
      if (view === 'favorites') return <FavoritesView favoriteIds={favorites} allMedicines={medicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={()=>{}} onFindAlternative={()=>{}} toggleFavorite={toggleFavorite} t={t} language={language} />;
      if (view === 'imageView' && activeImageViewer) return <ImageViewer images={activeImageViewer.images} initialIndex={activeImageViewer.index} title={activeImageViewer.title} t={t} indexFlags={activeImageViewer.flags} onBack={handleBack} />;

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine} insuranceData={insuranceData} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(m)=>{setSelectedMedicine(m); setIsEditModalOpen(true); }} onOpenAssistant={() => setIsAssistantOpen(true)} onImageZoom={(imgs, idx, title, flags) => { setActiveImageViewer({images:imgs, index:idx, title, flags}); setView('imageView'); }} onFindAlternative={(m) => { setSelectedMedicine(m); setView('alternatives'); }} onShare={handleShareMedicine} onToggleCompare={toggleCompare} isInCompare={compareList.some(m => m.RegisterNumber === selectedMedicine.RegisterNumber)} />;
          if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={alternatives} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={()=>{}} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          
          return (
              <div className="animate-fade-in pt-2">
                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length > 0} onClearSearch={() => { setSearchTerm(''); setView('search'); setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''}); }} onForceSearch={() => { setView('results'); }} onBarcodeScanClick={()=>{}} t={t} />
                  <div className="flex gap-2 mt-2">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={activeFiltersCount} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-6">
                      {finalFilteredMedicines.length > 0 ? (
                        <ResultsList medicines={finalFilteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); else handleMedicineSelect(m); }} onFindAlternative={(m) => { setSelectedMedicine(m); setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState="loaded" scrollContainerRef={scrollContainerRef} />
                      ) : searchTerm.length >= 3 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                          <p className="text-slate-400 font-black">{t('noResultsTitle')}</p>
                        </div>
                      ) : recentSearches.length > 0 ? (
                        <div className="animate-fade-in">
                          <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                              {language === 'ar' ? '🕒 آخر الأدوية المشاهدة' : '🕒 Recently Viewed'}
                            </h3>
                            <button onClick={() => { setRecentSearches([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }}
                              className="text-[10px] font-black text-rose-400 hover:text-rose-600">
                              {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {recentSearches.map(med => (
                              <button key={med.RegisterNumber} onClick={() => handleMedicineSelect(med)}
                                className="w-full flex items-center gap-3 bg-white dark:bg-dark-card p-3 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm active:scale-[0.98] transition-all text-right">
                                {med.imgBox && <img src={med.imgBox} className="w-10 h-10 object-contain rounded-xl bg-slate-50 p-1 flex-shrink-0" alt="" />}
                                <div className="flex-grow min-w-0">
                                  <p className="font-black text-sm text-slate-800 dark:text-white truncate">{med['Trade Name']}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{med['Scientific Name']}</p>
                                </div>
                                <span className="text-[11px] font-black text-primary whitespace-nowrap">
                                  {parseFloat(med['Public price']) > 0 ? parseFloat(med['Public price']).toFixed(2) + ' ر.س' : ''}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
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
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
                      <h3 className="text-lg font-black mb-6 border-b pb-4 dark:border-dark-border">{t('navSettings')}</h3>
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
                              <button onClick={()=>setLanguage(language==='ar'?'en':'ar')} className="px-4 py-1.5 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border font-black text-xs">{language.toUpperCase()}</button>
                          </div>
                          {/* وضع الصيدلاني */}
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                💊 {language === 'ar' ? 'وضع الصيدلاني' : 'Pharmacist Mode'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {language === 'ar' ? 'اضغط طويلاً على أي دواء لعرض سريع' : 'Long press any medicine for quick view'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const newVal = !pharmacistMode;
                                setPharmacistMode(newVal);
                                localStorage.setItem('pharmacist_mode', String(newVal));
                              }}
                              className={`w-12 h-6 rounded-full relative transition-all ${pharmacistMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pharmacistMode ? 'right-1' : 'left-1'}`} />
                            </button>
                          </div>
                          {/* إشعارات Push */}
                          {user && (
                            <button
                              onClick={async () => {
                                try {
                                  const token = await requestPushPermission(user.id);
                                  if (token) alert(language === 'ar' ? '✅ تم تفعيل الإشعارات!' : '✅ Notifications enabled!');
                                  else alert(language === 'ar' ? '⚠️ لم يتم الحصول على token' : '⚠️ Could not get token');
                                } catch(e: any) {
                                  alert((language === 'ar' ? '❌ ' : '❌ ') + (e?.message || 'فشل تفعيل الإشعارات'));
                                }
                              }}
                              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
                            >
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                🔔 {language === 'ar' ? 'تفعيل إشعارات Push' : 'Enable Push Notifications'}
                              </span>
                              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          {user && <button onClick={logout} className="w-full mt-4 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl font-black text-sm">{t('logout')}</button>}
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  if (!isDataLoaded && !isOnline && !hasLoadedBefore) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-light-bg dark:bg-dark-bg p-6 text-center">
        <div className="w-24 h-24 mb-8 bg-primary/10 rounded-full flex items-center justify-center animate-bounce-subtle">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L5.636 5.636m4.243 9.9l-2.829 2.829" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">PharmaSource KSA</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">
          {language === 'ar' 
            ? 'ملاحظة: لا يوجد اتصال بالإنترنت. يرجى الاتصال بالإنترنت للمرة الأولى لتحميل البيانات والواجهة.' 
            : 'Note: No internet connection. Please connect to the internet for the first time to load data and interface.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden relative">
      <Header ref={headerRef} title="PharmaSource" showBack={view !== 'search' && view !== 'insuranceSearch' && activeTab !== 'settings'} onBack={handleBack} t={t} onLoginClick={() => setView('login')} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.filter(n => !n.isRead).length} />
      <main id="main-scroll-container" ref={scrollContainerRef} className="flex-grow mx-auto px-4 overflow-y-auto pb-[calc(160px+env(safe-area-inset-bottom))] w-full max-w-5xl no-scrollbar" style={{ paddingTop: headerHeight + 24, transition: "padding-top 0.2s ease" }}>
          {!isDataLoaded ? (
            <div className="h-96 flex flex-col items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-sm font-bold text-primary animate-pulse">
                {language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
              </p>
            </div>
          ) : renderContent()}
      </main>
      {/* Pharmacist Quick View */}
      {quickViewMedicine && (
        <PharmacistQuickView
          medicine={quickViewMedicine}
          language={language}
          t={t}
          onClose={() => setQuickViewMedicine(null)}
          onOpenFull={() => { handleMedicineSelect(quickViewMedicine); setQuickViewMedicine(null); }}
          isFavorite={favorites.includes(quickViewMedicine.RegisterNumber)}
          onToggleFavorite={(id) => { toggleFavorite(id); }}
        />
      )}

      {compareList.length > 0 && !showCompare && (
        <CompareBar 
          compareList={compareList} 
          onRemove={(m) => setCompareList(prev => prev.filter(x => x.RegisterNumber !== m.RegisterNumber))}
          onCompare={() => setShowCompare(true)}
          onClose={() => setCompareList([])}
          language={language}
        />
      )}
      {showCompare && compareList.length === 2 && (
        <CompareModal medicines={compareList} onClose={() => setShowCompare(false)} language={language} />
      )}
      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabClick} t={t} user={user} view={view} />
      <FloatingAssistantButton onClick={()=>setIsAssistantOpen(true)} onLongPress={()=>{}} t={t} language={language} />
      {isAssistantOpen && <AssistantModal isOpen={isAssistantOpen} onSaveAndClose={()=>setIsAssistantOpen(false)} contextMedicine={selectedMedicine} allMedicines={medicines} initialPrompt="" t={t} language={language} />}
      <FilterModal isOpen={isFilterModalOpen} onClose={()=>setIsFilterModalOpen(false)} filters={filters} onApply={setFilters} onClearFilters={()=>setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''})} allMedicines={searchContextMedicines} t={t} />
      {isEditModalOpen && <EditMedicineModal isOpen={isEditModalOpen} onClose={()=>setIsEditModalOpen(false)} medicine={selectedMedicine} onSave={handleSaveMedicine} t={t} />}
    </div>
  );
};
export default App;
