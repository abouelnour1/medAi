
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  InsuranceDrug, SelectedInsuranceData, InsuranceSearchMode, Notification as AppNotification
} from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import MedicineDetail from './components/MedicineDetail';
import BottomSheet from './components/BottomSheet';
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
import { useDebounce } from './hooks/useDebounce';
import { useSearch } from './hooks/useSearch';
import { useAlternatives } from './hooks/useMedicineUtils';
import DrugToolsModal from './components/DrugToolsModal';
import { fuzzyMatch, fuzzyScore } from './utils/fuzzySearch';
import { trackMedicineView, getTopSearched, getTotalSearches } from './utils/analytics';
import { SkeletonList } from './components/SkeletonCard';
import ErrorBoundary from './components/ErrorBoundary';
import PullToRefresh from './components/PullToRefresh';
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
import { syncData, listenToOverrides, saveOverride, clearDataCache, bumpDataVersion } from './utils/dataSync';
import { areSameRouteGroup } from './utils/pharmaceuticalGroups';

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
  // اسم المنتج: إنجليزي أو عربي
  const tradeName = findValue(item, ["Trade Name", "TradeName", "tradeName", "BrandNameEn", "BrandNameAr"]);
  
  // التركيبة: concentration أولاً، ثم IngredientNameEn، ثم IngredientNameAr، ثم ScientificName
  const scientificName = findValue(item, ["concentration", "IngredientNameEn", "IngredientNameAr", "Scientific Name", "ScientificName", "scientificName"]);
  const strength = findValue(item, ["Strength", "strength"]);
  
  let regNum = findValue(item, ["RegisterNumber", "Id", "id"]);
  if (!regNum || regNum === '0' || regNum.trim() === '') {
      // نعمل ID يونيك من اسم المنتج + الوكيل عشان نتجنب التكرار
      const mfr = findValue(item, ["Manufacture Name", "ManufacturerNameEn", "ManufacturerNameAr", "manufacturer", "main agent", "CompanyName", "Manufacturer"]);
      const price = findPrice(item);
      const uniqueStr = `${tradeName}-${mfr}-${price}`.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 60);
      regNum = `food-${uniqueStr}`;
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
    "Manufacture Name": findValue(item, ["Manufacture Name", "ManufacturerNameEn", "ManufacturerNameAr", "manufacturer", "manufacturerName"]),
    "Manufacture Country": findValue(item, ["Manufacture Country", "ManufacturerCountry", "manufacturerCountry", "Country"]),
    "Secondry package  manufacture": findValue(item, ["Secondry package  manufacture"]),
    "Main Agent": findValue(item, ["Main Agent", "MainAgent", "Agent", "main agent", "agent", "CompanyName"]),
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

// ============================================
// Push Notification Toggle - يبعت طلب للمستخدم
// ============================================
const PushNotificationToggle: React.FC<{ userId: string; language: string }> = ({ userId, language }) => {
  const ar = language === 'ar';
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'enabled' | 'denied'>(() => {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'enabled';
    if (Notification.permission === 'denied') return 'denied';
    return 'idle';
  });

  const handleToggle = async () => {
    if (status === 'enabled') return; // مفيش إلغاء تفعيل - OS بيتحكم فيه
    if (status === 'denied') {
      alert(ar
        ? '⚙️ الإشعارات محجوبة. افتح إعدادات الجهاز وفعّل الإشعارات للتطبيق يدوياً.'
        : '⚙️ Notifications are blocked. Open device settings to enable them manually.');
      return;
    }
    setStatus('loading');
    try {
      const token = await requestPushPermission(userId);
      setStatus(token ? 'enabled' : 'denied');
    } catch {
      setStatus('denied');
    }
  };

  const config = {
    idle:    { icon: '🔔', label: ar ? 'تفعيل الإشعارات' : 'Enable Notifications',  bg: 'bg-slate-50 dark:bg-slate-800/50', color: 'text-slate-700 dark:text-slate-300' },
    loading: { icon: '⏳', label: ar ? 'جاري الطلب...' : 'Requesting...',            bg: 'bg-primary/5',                     color: 'text-primary' },
    enabled: { icon: '✅', label: ar ? 'الإشعارات مفعّلة' : 'Notifications ON',      bg: 'bg-emerald-50 dark:bg-emerald-900/20', color: 'text-emerald-600' },
    denied:  { icon: '🚫', label: ar ? 'الإشعارات محجوبة' : 'Notifications Blocked', bg: 'bg-rose-50 dark:bg-rose-900/20',   color: 'text-rose-500' },
  }[status];

  return (
    <button
      onClick={handleToggle}
      disabled={status === 'loading'}
      className={`w-full flex items-center justify-between p-4 ${config.bg} rounded-2xl transition-all active:scale-[0.98]`}
    >
      <span className={`font-bold ${config.color} flex items-center gap-2`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
      {status === 'loading' && (
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
      {status === 'idle' && (
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
};

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const RECENT_SEARCHES_KEY = 'pharma_recent_searches_v2'; // v2 = IDs only
const MAX_RECENT = 8;

const App: React.FC = () => {
  const { user, logout, requestAIAccess, getSettings, isLoading: authLoading } = useAuth();
  const appSettings = getSettings();
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [view, setView] = useState<View>('search');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMedicinesLoading, setIsMedicinesLoading] = useState(true);
  const dataLoadedRef = React.useRef(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'));
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') === 'ar' ? 'ar' : 'en'));
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 100); // شبه live
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [filters, setFilters] = useState<Filters>({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [previousView, setPreviousView] = useState<View>('results'); // للرجوع الصح
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => { try { const s = localStorage.getItem(FAVORITES_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [recentSearchIds, setRecentSearchIds] = useState<string[]>(() => { try { const s = localStorage.getItem(RECENT_SEARCHES_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const recentSearches = React.useMemo(() => recentSearchIds.map(id => medicines.find(m => m.RegisterNumber === id)).filter(Boolean) as Medicine[], [recentSearchIds, medicines]);
  const [compareList, setCompareList] = useState<Medicine[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [pharmacistMode, setPharmacistMode] = useState(() => localStorage.getItem('pharmacist_mode') === 'true');
  const [quickViewMedicine, setQuickViewMedicine] = useState<Medicine | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [loadedConversation, setLoadedConversation] = useState<any[]>([]);
  const [appShareUrl, setAppShareUrl] = useState<string>(() => 
    localStorage.getItem('pharma_share_url') || ''
  );

  const [exactSearchOnly, setExactSearchOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem('pharma_exact_search');
    return saved !== null ? saved === 'true' : true; // default = true
  });

  // حفظ في localStorage لما يتغير
  useEffect(() => {
    localStorage.setItem('pharma_exact_search', String(exactSearchOnly));
  }, [exactSearchOnly]);
  // API key انتقل للـ Firebase Cloud Function - الـ proxy بيستخدم Firebase Auth
  const geminiApiKey = undefined; // مش محتاجه في الـ client بعد كده
  const [drugToolsModal, setDrugToolsModal] = useState<{ open: boolean; mode: 'interaction' | 'dose'; medicine?: Medicine | null }>({ open: false, mode: 'interaction' });
  const [activeImageViewer, setActiveImageViewer] = useState<{ images: string[], index: number, title: string, flags: boolean[] } | null>(null);
  const [sheetMedicine, setSheetMedicine] = useState<Medicine | null>(null);
  
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

  // منع الـ UI من الحركة لما تيجي إشعارات أو يتفتح الكيبورد
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let lastHeight = vv.height;
    const handleResize = () => {
      // لو الـ height اتغير بسبب كيبورد أو إشعار - نثبت الـ scrollTop
      if (Math.abs(vv.height - lastHeight) > 50) {
        lastHeight = vv.height;
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositions.current.get(view) || 0;
        }
      }
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, [view]);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setHeaderHeight(Math.ceil(entry.contentRect.height) + 20);
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
      const saved = scrollPositions.current.get(targetView) || 0;
      if (!saved) return;
      // محتاجين نستنى الـ DOM يتحدث الأول
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = saved;
              }
          });
      });
  }, []);

  const handleBack = useCallback(() => {
      // احفظ position الـ view الحالي
      if (scrollContainerRef.current) {
          scrollPositions.current.set(view, scrollContainerRef.current.scrollTop);
      }
      if (view === 'imageView') {
          // لو جيت من details نرجع لها، لو من حته تانية كمان
          const backTarget: View = (previousView === 'alternatives' ? 'details' : (previousView || 'details')) as View;
          setView(backTarget);
          restoreScroll(backTarget);
      } else if (sheetMedicine) {
          setSheetMedicine(null);
          return;
      } else if (view === 'alternatives') {
          setView('results');
          restoreScroll('results');
      } else if (view === 'details') {
          const target = previousView === 'alternatives' ? 'alternatives' : 'results';
          setView(target);
          restoreScroll(target);
      } else if (view === 'insuranceDetails') {
          setView('insuranceSearch');
          restoreScroll('insuranceSearch');
      } else if (['login', 'register', 'admin', 'notifications', 'favorites'].includes(view)) {
          const target = activeTab === 'search' 
              ? (searchTerm.replace(/\s/g,'').length >= 3 ? 'results' : 'search') 
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
    setRecentSearchIds(prev => {
        const filtered = prev.filter(id => id !== m.RegisterNumber);
        const updated = [m.RegisterNumber, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
    });
    setPreviousView(view);
    setSelectedMedicine(m);
    setSheetMedicine(m);  // افتح الـ BottomSheet
  };

  // ── Android back button + Swipe to go back ──────────────────────────────
  useEffect(() => {
    // Android back button
    const handleAndroidBack = (e: PopStateEvent) => {
      if (view !== 'search' && !(view === 'insuranceSearch' && activeTab === 'insurance') && !(activeTab === 'settings')) {
        e.preventDefault();
        handleBack();
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleAndroidBack);
    return () => window.removeEventListener('popstate', handleAndroidBack);
  }, [view, handleBack, activeTab]);

  // ── Swipe to go back (edge swipe من اليسار) ──────────────────────────────
  useEffect(() => {
    const canGoBack = view !== 'search' && view !== 'insuranceSearch';
    if (!canGoBack) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = startX < 30; // فقط من edge اليسار
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dx > 60 && dy < 80) {
        handleBack();
      }
      tracking = false;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [view, handleBack]);

  useEffect(() => {
    if (authLoading) return;
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    const loadData = async () => {
      try {
        const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
        setInsuranceData(INITIAL_INSURANCE_DATA as any);
        setIsDataLoaded(true);

        // ── خطوة 1: حمّل الداتا الكاملة من Cache أو Storage ──────
        const syncResult = await syncData();
        const baseMap = new Map<string, Medicine>();
        [...syncResult.medicines, ...syncResult.supplements, ...syncResult.food]
          .map(normalizeMedicine)
          .forEach(m => baseMap.set(m.RegisterNumber, m));

        if (baseMap.size > 0) setMedicines(Array.from(baseMap.values()));
        setIsMedicinesLoading(false);

        // ── خطوة 2: اسمع لـ overrides live (للكل — أدمن ومستخدمين) ──
        const unsubOverrides = listenToOverrides((overrides) => {
          setMedicines(prev => {
            const merged = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
            overrides.forEach((override, id) => {
              const existing = merged.get(id);
              if (existing) {
                // دواء موجود — حدّثه بالـ override
                merged.set(id, normalizeMedicine({ ...existing, ...override }));
              } else {
                // دواء جديد أضافه الأدمن
                merged.set(id, normalizeMedicine(override));
              }
            });
            return Array.from(merged.values());
          });
        });

        // ── خطوة 3: اسمع للإشعارات ────────────────────────────────
        let unsubNotifs = () => {};
        if (!FIREBASE_DISABLED && db) {
          unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
            const allNotifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
            setNotifications(allNotifs.filter(n => {
              if (!n.targetUserId && !n.targetRole) return true;
              if (n.targetUserId && user && n.targetUserId === user.id) return true;
              if (n.targetRole && user && n.targetRole === user.role) return true;
              return false;
            }));
          });
        }

        // ── خطوة 4: اسمع لتحديثات Storage في الخلفية ─────────────
        const handleStorageUpdate = (e: Event) => {
          const { medicines, supplements, food } = (e as CustomEvent).detail;
          setMedicines(prev => {
            const updatedMap = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
            [...medicines, ...supplements, ...food]
              .map(normalizeMedicine)
              .forEach(m => updatedMap.set(m.RegisterNumber, m));
            return Array.from(updatedMap.values());
          });
        };
        window.addEventListener('pharma:storage-updated', handleStorageUpdate);

        return () => {
          unsubOverrides();
          unsubNotifs();
          window.removeEventListener('pharma:storage-updated', handleStorageUpdate);
        };

      } catch (e) {
        console.error(e);
        setIsDataLoaded(true);
        setIsMedicinesLoading(false);
      }
    };
    loadData();
  }, [authLoading]);

  // مطابقة Wildcard - * تعني أي حروف في أي مكان
  const matchesWildcard = (text: string, pattern: string): boolean => {
    if (!pattern.includes('*')) return text.includes(pattern);
    const parts = pattern.split('*').map(p => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(parts.join('.*'));
    return regex.test(text);
  };

  // الترتيب: يبدأ بالكلمة (3) > يبدأ بكلمة في الجملة (2) > في المنتصف (1)
  const getMatchScore = (text: string, pattern: string): number => {
    const cleanPattern = pattern.replace(/\*/g, '').split('*')[0] || pattern;
    if (text.startsWith(cleanPattern)) return 3;
    if (text.includes(' ' + cleanPattern)) return 2;
    return 1;
  };

  const { finalFilteredMedicines, searchContextMedicines, searchTextResults } = useSearch(
    medicines, debouncedSearchTerm, textSearchMode, filters, sortBy, exactSearchOnly
  );

  const alternatives = useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };
    const sciName = String(selectedMedicine['Scientific Name']).toLowerCase();
    const strength = String(selectedMedicine.Strength).toLowerCase();
    const form = selectedMedicine.PharmaceuticalForm;
    const atc = String(selectedMedicine.AtcCode1 || '').substring(0, 4);

    // البدائل المباشرة: نفس المادة + نفس التركيز + نفس مجموعة الشكل
    const direct = medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        String(m['Scientific Name']).toLowerCase() === sciName &&
        String(m.Strength).toLowerCase() === strength &&
        areSameRouteGroup(m.PharmaceuticalForm, form)
    );

    // البدائل العلاجية: نفس الـ ATC + نفس مجموعة الشكل
    const therapeutic = (atc && atc.length >= 4) ? medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        String(m.AtcCode1 || '').startsWith(atc) &&
        areSameRouteGroup(m.PharmaceuticalForm, form) &&
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
    const ar = language === 'ar';
    const baseUrl = appShareUrl.trim();
    const deepLink = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/${medicine.RegisterNumber}`
      : null;
    const linkLine = deepLink
      ? (ar ? `\n🔗 افتح في PharmaSource: ${deepLink}` : `\n🔗 Open in PharmaSource: ${deepLink}`)
      : '';
    const text = ar
      ? `💊 *${medicine['Trade Name']}*\n🧪 ${medicine['Scientific Name']}\n💰 ${price > 0 ? price.toFixed(2) + ' ر.س' : 'غير متاح'}\n🏭 ${medicine['Manufacture Name']}\n📋 ${medicine['Legal Status']}${linkLine}`
      : `💊 *${medicine['Trade Name']}*\n🧪 ${medicine['Scientific Name']}\n💰 ${price > 0 ? price.toFixed(2) + ' SAR' : 'N/A'}\n🏭 ${medicine['Manufacture Name']}\n📋 ${medicine['Legal Status']}${linkLine}`;

    if (navigator.share) {
        navigator.share({ title: 'PharmaSource', text, ...(deepLink ? { url: deepLink } : {}) });
    } else {
        navigator.clipboard?.writeText(text).then(() => 
          alert(ar ? '✅ تم نسخ بيانات الدواء!' : '✅ Copied!')
        );
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
    // حماية: لو مفيش RegisterNumber يونيك — منع الحفظ
    if (!updatedMed.RegisterNumber?.trim()) {
      alert(language === 'ar' 
        ? '❌ هذا المنتج ليس له رقم تسجيل — لا يمكن حفظه. أضف رقم تسجيل أولاً.'
        : '❌ This product has no Register Number — cannot save. Please add one first.'
      );
      return;
    }
    if (user.role === 'admin') {
        try {
            // حفظ في medicine_overrides فقط — المستخدمين يشوفوا فوراً بـ onSnapshot
            await saveOverride(updatedMed);
            setSelectedMedicine(updatedMed);
            alert(t('saveSuccess'));
        } catch (e) { alert(language === 'ar' ? '❌ فشل الحفظ. حاول مرة أخرى.' : '❌ Save failed. Please try again.'); console.error(e); }
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
        } catch (e) { alert(language === 'ar' ? '❌ فشل إرسال الطلب. حاول مرة أخرى.' : '❌ Request failed. Please try again.'); console.error(e); }
    }
  };

  const handleTabClick = (tab: Tab) => {
      // حفظ scroll position للـ view الحالية قبل التنقل
      if (scrollContainerRef.current) {
          scrollPositions.current.set(view, scrollContainerRef.current.scrollTop);
      }
      if (activeTab === tab) {
          // لو ضغط على نفس الـ tab، يرجع للأول ويعمل scroll to top
          if (tab === 'search') { setView('search'); scrollPositions.current.delete('search'); }
          if (tab === 'insurance') { setView('insuranceSearch'); scrollPositions.current.delete('insuranceSearch'); }
          if (tab === 'settings') { setView('settings'); scrollPositions.current.delete('settings'); }
          // scroll to top دايماً لما يضغط على نفس الـ tab
          requestAnimationFrame(() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
          });
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
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { const prev = previousView || 'search'; setView(prev as View); restoreScroll(prev); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} language={language} onExport={async (type) => {
        const filtered = medicines.filter(m => 
          type === 'medicine' ? m['Product type'] === 'Human' :
          type === 'supplement' ? m['Product type'] === 'Supplement' : 
          m['Product type'] === 'Food'
        );
        // نجمع كل الـ keys من كل الـ objects عشان نمسك أي field أضافه الأدمن في Firebase
        const allKeys = new Set<string>();
        // الحقول الأساسية أول
        const baseHeaders = [
          'RegisterNumber','ReferenceNumber','Old register Number',
          'Product type','DrugType','Sub-Type',
          'Scientific Name','Trade Name',
          'Strength','StrengthUnit','PharmaceuticalForm','AdministrationRoute',
          'AtcCode1','AtcCode2',
          'Size','SizeUnit','PackageTypes','PackageSize',
          'Legal Status','Product Control','Distribute area',
          'Public price','shelfLife','Storage conditions','Storage Condition Arabic',
          'Marketing Company','Marketing Country',
          'Manufacture Name','Manufacture Country',
          'Secondry package  manufacture',
          'Main Agent','Secosnd Agent','Third agent',
          'Description Code','Authorization Status','Last Update',
          'description',
          'imgBox','imgIndex1','imgIndex2','imgPill',
          'pillShape','pillScored','pillMarkings',
          'liquidTaste','liquidColor','physicalNotes',
          // Clinical Data fields
          'clinical_indication','clinical_dosage','clinical_sideEffects',
          'clinical_pharmacistNote','clinical_mechanism','clinical_keyPoints','clinical_generatedAt'
        ];
        baseHeaders.forEach(h => allKeys.add(h));
        filtered.forEach(m => Object.keys(m).forEach(k => allKeys.add(k)));
        const headers = Array.from(allKeys);

        // نجيب clinical data لكل الأدوية
        // جيب clinical data بشكل async
        const { getClinicalData } = await import('./utils/dailyMedicines');
        const clinicalEntries = await Promise.all(
          filtered.map(async m => {
            const cd = await getClinicalData(m.RegisterNumber).catch(() => null);
            return [m.RegisterNumber, cd] as [string, any];
          })
        );
        const clinicalMap = new Map(clinicalEntries);

        const enriched = filtered.map(m => {
          const cd = clinicalMap.get(m.RegisterNumber) as any;
          return {
            ...m,
            clinical_indication: cd?.indication || '',
            clinical_dosage: cd?.dosage || '',
            clinical_sideEffects: cd?.sideEffects || '',
            clinical_pharmacistNote: cd?.pharmacistNote || '',
            clinical_mechanism: cd?.mechanism || '',
            clinical_keyPoints: cd?.keyPoints || '',
            clinical_generatedAt: cd?.generatedAt || '',
          };
        });

        const csv = [headers.join(','), ...enriched.map(m => headers.map(h => JSON.stringify(String((m as any)[h] ?? ''))).join(','))].join('\n');
        // BOM مهم عشان Excel يقرأ العربي صح
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
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
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine} insuranceData={insuranceData} allMedicines={medicines} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(m)=>{setSelectedMedicine(m); setIsEditModalOpen(true); }} onOpenAssistant={() => requestAIAccess(() => setIsAssistantOpen(true), t)} onOpenInteractions={() => requestAIAccess(() => setDrugToolsModal({ open: true, mode: 'interaction', medicine: selectedMedicine }), t)} onOpenDoseCalc={() => requestAIAccess(() => setDrugToolsModal({ open: true, mode: 'dose', medicine: selectedMedicine }), t)} onImageZoom={(imgs, idx, title, flags) => { setPreviousView(view); setActiveImageViewer({images:imgs, index:idx, title, flags}); setView('imageView'); }} onFindAlternative={(m) => { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setSelectedMedicine(m); setView('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; }} onShare={handleShareMedicine} onToggleCompare={toggleCompare} isInCompare={compareList.some(m => m.RegisterNumber === selectedMedicine.RegisterNumber)} />;
          if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={alternatives} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={()=>{}} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          
          return (
              <div className="animate-fade-in pt-2">

                  {/* ── علامة تحميل الداتا ── */}
                  {isMedicinesLoading && (
                    <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-primary/8 dark:bg-primary/15 rounded-2xl border border-primary/15">
                      <div className="ps-spinner flex-shrink-0" />
                      <div>
                        <p className="text-[11px] font-black text-primary dark:text-primary-light">
                          {language === 'ar' ? 'جاري تحميل قاعدة البيانات...' : 'Loading database...'}
                        </p>
                        <p className="text-[9px] text-primary/60 mt-0.5">
                          {language === 'ar' ? 'أول مرة قد تستغرق ثوانٍ' : 'First load may take a few seconds'}
                        </p>
                      </div>
                    </div>
                  )}

                  <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={searchTerm.length > 0} onClearSearch={() => { setSearchTerm(''); setView('search'); setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''}); }} onForceSearch={() => { setView('results'); }} onBarcodeScanClick={()=>{}} exactOnly={exactSearchOnly} onToggleExactOnly={() => setExactSearchOnly(v => !v)} t={t} />
                  <div className="flex gap-2 mt-2">
                      <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={activeFiltersCount} t={t} />
                      <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                  </div>
                  <div className="mt-6">
                      {/* نعرض النتائج لو: في بحث (3+ حروف) أو في فلاتر نشطة */}
                      {(searchTerm.replace(/\s/g,"").length >= 3 || activeFiltersCount > 0) && finalFilteredMedicines.length > 0 ? (
                        <ResultsList medicines={finalFilteredMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); else handleMedicineSelect(m); }} onFindAlternative={(m) => { setPreviousView(view); setSelectedMedicine(m); setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState="loaded" scrollContainerRef={scrollContainerRef} />
                      ) : (searchTerm.replace(/\s/g,"").length >= 3 || activeFiltersCount > 0) && finalFilteredMedicines.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                          <p className="text-slate-400 font-black">{t('noResultsTitle')}</p>
                        </div>
                      ) : recentSearches.length > 0 ? (
                        <div className="animate-fade-in">
                          <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                              {language === 'ar' ? '🕒 آخر الأدوية المشاهدة' : '🕒 Recently Viewed'}
                            </h3>
                            <button onClick={() => { setRecentSearchIds([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }}
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
                                  {parseFloat(med['Public price']) > 0 ? parseFloat(med['Public price']).toFixed(2) + (language === 'ar' ? ' ر.س' : ' SAR') : ''}
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
                          {user && <PushNotificationToggle userId={user.id} language={language} />}
                          {/* رابط الشير — للأدمن بس */}
                          {user?.role === 'admin' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">
                                  🔗 {language === 'ar' ? 'رابط مشاركة التطبيق' : 'App Share Link'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {language === 'ar' ? 'يُضاف مع كل مشاركة دواء — اتركه فارغاً لو مش مظبوط بعد' : 'Added with every medicine share — leave empty if not ready'}
                                </span>
                              </div>
                              <input
                                type="url"
                                value={appShareUrl}
                                onChange={e => {
                                  setAppShareUrl(e.target.value);
                                  localStorage.setItem('pharma_share_url', e.target.value);
                                }}
                                placeholder="https://pharmasource.app/medicine"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-colors"
                              />
                            </div>
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
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-slate-900 p-6 text-center select-none">
        <div className="w-16 h-16 mb-5 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <span className="text-3xl">📵</span>
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">OFFLINE</span>
        <h1 className="text-lg font-black text-slate-800 dark:text-white mb-1">PharmaSource KSA</h1>
        <p className="text-xs text-slate-400 mb-6">Connect to the internet and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs tracking-wide active:scale-95 transition-transform"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden relative">
      <Header ref={headerRef} title="PharmaSource" showBack={view !== 'search' && view !== 'insuranceSearch' && activeTab !== 'settings'} onBack={handleBack} t={t} onLoginClick={() => { setPreviousView(view); setView('login'); }} onAdminClick={()=>setView('admin')} onNotificationsClick={() => setView('notifications')} view={view} unreadCount={notifications.filter(n => !n.isRead).length} />

      <main id="main-scroll-container" ref={scrollContainerRef} className="flex-grow mx-auto px-4 overflow-y-auto w-full max-w-5xl no-scrollbar" style={{ paddingTop: Math.max(headerHeight + 36, 130), paddingBottom: compareList.length > 0 && !showCompare ? 'calc(280px + env(safe-area-inset-bottom))' : 'calc(120px + env(safe-area-inset-bottom))', transition: 'padding-top 0.1s ease, padding-bottom 0.4s ease', WebkitOverflowScrolling: "touch", overscrollBehavior: "none" } as any} >
          {isMedicinesLoading ? (
            <div className="flex flex-col items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
              {/* Progress Circle */}
              <div className="relative w-28 h-28 mb-6">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#progressGrad)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="263.9"
                    strokeDashoffset="66"
                    style={{
                      animation: 'spin 1.4s linear infinite',
                      transformOrigin: 'center',
                    }}
                  />
                  <defs>
                    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-primary">💊</span>
                </div>
              </div>
              <h2 className="text-[13px] font-black text-slate-700 dark:text-slate-300 mb-1">PharmaSource</h2>
              <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase animate-pulse">
                {language === 'ar' ? 'جاري تحميل قاعدة البيانات...' : 'Loading database...'}
              </p>
              <style>{`@keyframes spin { from { stroke-dashoffset: 263.9; } to { stroke-dashoffset: 0; } }`}</style>
            </div>
          ) : (
            <div
              key={view}
              style={{
                animation: 'viewSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
              }}
            >
              {renderContent()}
            </div>
          )}
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
      {/* ── Bottom Sheet للدواء ── */}
      <BottomSheet
        isOpen={!!sheetMedicine}
        onClose={() => setSheetMedicine(null)}
      >
        {sheetMedicine && (
          <MedicineDetail
            medicine={sheetMedicine}
            insuranceData={insuranceData}
            allMedicines={medicines}
            t={t}
            language={language}
            isFavorite={favorites.includes(sheetMedicine.RegisterNumber)}
            onToggleFavorite={toggleFavorite}
            user={user}
            onEdit={(m) => { setSelectedMedicine(m); setIsEditModalOpen(true); }}
            onOpenAssistant={() => requestAIAccess(() => setIsAssistantOpen(true), t)}
            onOpenInteractions={() => requestAIAccess(() => setDrugToolsModal({ open: true, mode: 'interaction', medicine: sheetMedicine }), t)}
            onOpenDoseCalc={() => requestAIAccess(() => setDrugToolsModal({ open: true, mode: 'dose', medicine: sheetMedicine }), t)}
            onImageZoom={(imgs, idx, title, flags) => { setPreviousView(view); setActiveImageViewer({ images: imgs, index: idx, title, flags }); setView('imageView'); }}
            onFindAlternative={(m) => { setSheetMedicine(null); setPreviousView(view); setSelectedMedicine(m); setView('alternatives'); }}
            onShare={handleShareMedicine}
            onToggleCompare={toggleCompare}
            isInCompare={compareList.some(m => m.RegisterNumber === sheetMedicine.RegisterNumber)}
          />
        )}
      </BottomSheet>

      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabClick} t={t} user={user} view={view} />
      {/* الزرار يظهر بس لو مسجل دخول */}
      {user && <FloatingAssistantButton onClick={() => requestAIAccess(() => setIsAssistantOpen(true), t)} onLongPress={()=>{}} t={t} language={language} />}
      {isAssistantOpen && <AssistantModal
        isOpen={isAssistantOpen}
        onSaveAndClose={() => { setIsAssistantOpen(false); setLoadedConversation([]); }}
        contextMedicine={view === 'details' ? selectedMedicine : null}
        allMedicines={medicines}
        initialHistory={loadedConversation.length ? loadedConversation : undefined}
        t={t}
        language={language}
        user={user}
        onOpenHistory={() => { setIsAssistantOpen(false); setShowChatHistory(true); }}
      />}
      {showChatHistory && (
        <ChatHistoryView
          language={language}
          t={t}
          onLoadConversation={(msgs) => { setLoadedConversation(msgs); setShowChatHistory(false); setIsAssistantOpen(true); }}
          onClose={() => setShowChatHistory(false)}
        />
      )}
      {drugToolsModal.open && (
        <DrugToolsModal
          mode={drugToolsModal.mode}
          allMedicines={medicines}
          language={language}
          t={t}
          onClose={() => setDrugToolsModal({ open: false, mode: 'interaction' })}
          geminiApiKey={geminiApiKey}
          initialMedicine={drugToolsModal.medicine}
        />
      )}
      <FilterModal isOpen={isFilterModalOpen} onClose={()=>setIsFilterModalOpen(false)} filters={filters} onApply={setFilters} onClearFilters={()=>setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''})} allMedicines={searchTextResults.length > 0 ? searchTextResults : medicines} t={t} />
      {isEditModalOpen && <EditMedicineModal isOpen={isEditModalOpen} onClose={()=>setIsEditModalOpen(false)} medicine={selectedMedicine} onSave={handleSaveMedicine} t={t} />}
    </div>
  );
};
export default App;
