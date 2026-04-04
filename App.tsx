
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
import GeminiPromptModal from './components/GeminiPromptModal';
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
import { useSearch } from './hooks/useSearch';
import { useAlternatives } from './hooks/useMedicineUtils';
import DrugToolsModal from './components/DrugToolsModal';
import PediatricDoseCalculator from './components/PediatricDoseCalculator';
import DrugTestChecker from './components/DrugTestChecker';
import { fuzzyMatch, fuzzyScore } from './utils/fuzzySearch';
import { trackMedicineView, getTopSearched, getTotalSearches } from './utils/analytics';
import { SkeletonList } from './components/SkeletonCard';
import ErrorBoundary from './components/ErrorBoundary';
import PullToRefresh from './components/PullToRefresh';
import PharmacistQuickView from './components/PharmacistQuickView';
import { requestPushPermission, setupForegroundNotifications, setupCapacitorPush } from './utils/pushNotifications';
import { Capacitor } from '@capacitor/core';
import { trackAppOpen } from './utils/inAppReview';
import { logSearch, logShareMedicine, logFavoriteToggle, logTabSwitch, setUserSpecialty } from './utils/analytics';
import { syncAnalyticsToFirestore } from './utils/analyticsSync';
import CompareBar from './components/CompareBar';
import ClinicalDataPage from './components/ClinicalDataPage';
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
import OrderList from './components/OrderList';
import SpecialtyModal from './components/SpecialtyModal';
import StockTracker from './components/StockTracker';
import { UserSpecialty, PhysicianSubSpecialty } from './types';
import BottomNavBar from './components/BottomNavBar';

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

const WHATSAPP_NUMBER = '966550806894'; // +966 Saudi Arabia

const App: React.FC = () => {
  const { user, logout, requestAIAccess, getSettings, isLoading: authLoading, updateUser } = useAuth();
  const appSettings = getSettings();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try { return (sessionStorage.getItem('ps_tab') as Tab) || 'search'; } catch { return 'search'; }
  });
  const [view, setView] = useState<View>(() => {
    try {
      const v = sessionStorage.getItem('ps_view') as View;
      // لو كان في alternatives نرجعه لـ results
      if (v === 'alternatives') return 'results';
      return v || 'search';
    } catch { return 'search'; }
  });
  // ── Navigation Direction System ─────────────────────────────────────────
  const [navDir, setNavDir] = React.useState<'push'|'pop'|'tab'>('tab');

  const navigateTo = React.useCallback((newView: View, dir: 'push'|'pop'|'tab' = 'tab') => {
    setNavDir(dir);
    setView(newView);
  }, []);

    const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);
  const [indications, setIndications] = useState<Record<string, { icd10Code: string; drugs: { s: string; a: string }[] }>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  // نشوف IndexedDB مباشرة — لو في داتا محلية مش نعرض loading
  // نشوف IndexedDB فوراً — لو في cache مش محتاجين loading
  // لو في cache محلي → مش loading من البداية
  const [isMedicinesLoading, setIsMedicinesLoading] = useState(() => {
    try {
      // نتحقق بسرعة لو في cache في IndexedDB عن طريق localStorage flag
      return localStorage.getItem('pharma_has_cache') !== 'true';
    } catch { return true; }
  });
  const dataLoadedRef = React.useRef(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // تحميل الإشعارات - من IndexedDB أولاً (فوري) ثم Firestore (live)
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    let unsub: (() => void) | undefined;
    const cacheKey = 'notifs_cache_' + user.id;

    (async () => {
      try {
        // أولاً: اعرض الـ cache المحلي فوراً
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) setNotifications(JSON.parse(cached));
        } catch {}

        // ثانياً: اسمع لـ Firestore للتحديثات
        const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
        const q = query(
          collection(db, 'users', user.id, 'notifications'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        unsub = onSnapshot(q, (snap) => {
          const notifs: AppNotification[] = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as AppNotification));
          setNotifications(notifs);
          // احفظ في الـ cache
          try { localStorage.setItem(cacheKey, JSON.stringify(notifs)); } catch {}
        });
      } catch (e) {
        console.log('Notifications load error:', e);
      }
    })();
    return () => unsub?.();
  }, [user?.id]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'));
  const [language, setLanguage] = useState<Language>('en');
  const [searchTerm, setSearchTerm] = useState(() => {
    try { return sessionStorage.getItem('ps_search') || ''; } catch { return ''; }
  });
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [selectedIndication, setSelectedIndication] = useState<string | null>(null);
  // الـ debounce انتقل لـ SearchBar — searchTerm هنا بقى هو المؤجل مباشرة
  const debouncedSearchTerm = searchTerm;
  const [sortBy, setSortBy] = useState<SortByOption>('relevance');
  const [filters, setFilters] = useState<Filters>({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], marketingCompany: [], mainAgent: [], legalStatus: '' });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  // helper يحفظ selectedMedicine في sessionStorage
  const setSelectedMedicineWithSave = React.useCallback((m: Medicine | null) => {
    setSelectedMedicine(m);
    try {
      if (m) sessionStorage.setItem('ps_selected_reg', m.RegisterNumber);
      else sessionStorage.removeItem('ps_selected_reg');
    } catch {}
  }, []);
  const [previousView, setPreviousView] = useState<View>('results'); // للرجوع الصح
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => { try { const s = localStorage.getItem(FAVORITES_STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [recentSearchIds, setRecentSearchIds] = useState<string[]>(() => { try { const s = localStorage.getItem(RECENT_SEARCHES_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });
  const recentSearches = React.useMemo(() => recentSearchIds.map(id => medicines.find(m => m.RegisterNumber === id)).filter(Boolean) as Medicine[], [recentSearchIds, medicines]);
  const [compareList, setCompareList] = useState<Medicine[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const pharmacistMode = true; // شغال دايماً — الضغط الطويل متاح للكل
  const [orderCount, setOrderCount] = useState<number>(() => {
    try { const r = localStorage.getItem('pharma_order_list'); return r ? JSON.parse(r).length : 0; } catch { return 0; }
  });
  // refresh order count when returning to settings


  // ── Specialty Modal — يظهر مرة واحدة بعد Google login ──────────────
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [isEditingSpecialty, setIsEditingSpecialty] = useState(false);

  const [notifToast, setNotifToast] = React.useState<{title:string,body:string}|null>(null);
  const [dataReadyToast, setDataReadyToast] = React.useState(false);

  // نظهر notification prompt على الويب فقط — Android بيطلب الإذن من النظام
  // Notification permission handled by native system

  // In-App Review — بعد ٥ مرات فتح
  useEffect(() => {
    if (!user) return;
    trackAppOpen();
    // Sync analytics to Firestore مرة في اليوم
    syncAnalyticsToFirestore(user.id, (user as any).specialty);
  }, [user?.id]);

  // Crashlytics — تسجيل اليوزر عشان نعرف مين عنده crash
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
        await FirebaseCrashlytics.setUserId({ userId: user.id });
        await FirebaseCrashlytics.setCustomKey({ key: 'specialty', value: (user as any).specialty || 'unknown', type: 'string' });
      } catch {}
    })();
  }, [user?.id]);

  // setup notifications - Android native or web foreground
  useEffect(() => {
    if (!user) return;
    if (Capacitor.isNativePlatform()) {
      // Android: setup FCM native + save token
      setupCapacitorPush(
        user.id,
        (title, body, data) => {
          // toast مؤقت بس — الإشعارات بتتحمل من Firestore أوتوماتيك
          setNotifToast({ title, body });
          setTimeout(() => setNotifToast(null), 5000);
        },
        (data) => {
          // لما المستخدم يضغط على الإشعار
          const medId = data?.medicineId || data?.relatedMedicineId;
          if (medId) {
            const medicine = medicines.find(m => m.RegisterNumber === medId);
            if (medicine) {
              setSelectedMedicineWithSave(medicine);
              navigateTo('details', 'push');
              return;
            }
          }
          navigateTo('notifications', 'tab');
        }
      );
    } else {
      // Web: foreground only
      setupForegroundNotifications((title, body) => {
        setNotifToast({ title, body });
        setTimeout(() => setNotifToast(null), 5000);
      });
    }
  }, [user?.id]);

  // التخصص — يظهر مرة واحدة فقط
  useEffect(() => {
    if (!user) return;
    if (authLoading) return;
    if ((user as any).specialty) return; // موجود في Firestore → تمام
    const localSpecialty = localStorage.getItem('user_specialty_fallback_' + user.id);
    if (localSpecialty) return; // موجود في localStorage → تمام
    // نستنى شوية عشان Firestore يخلص يجيب البيانات كاملة قبل ما نطلب التخصص
    const t = setTimeout(() => {
      // نشيك تاني بعد الـ delay — لو اتحمل في النص مش هنطلبه
      if ((user as any).specialty) return;
      if (localStorage.getItem('user_specialty_fallback_' + user.id)) return;
      setShowSpecialtyModal(true);
    }, 2000);
    return () => clearTimeout(t);
  }, [user?.id, (user as any)?.specialty, authLoading]);

  const handleSpecialtyComplete = async (specialty: UserSpecialty, subSpecialty?: PhysicianSubSpecialty) => {
    setShowSpecialtyModal(false);
    if (user && updateUser) {
      // دايماً احفظ في localStorage عشان متطلبش تاني في أي متصفح
      localStorage.setItem('user_specialty_fallback_' + user.id, specialty);
      try {
        await updateUser({ ...user, specialty, subSpecialty } as any);
      } catch (e) {
        // Firestore فشل — مش مشكلة، الـ localStorage كافي
      }
    }
  };

  const refreshOrderCount = () => {
    try { const r = localStorage.getItem('pharma_order_list'); setOrderCount(r ? JSON.parse(r).length : 0); } catch {}
  };
  const [quickViewMedicine, setQuickViewMedicine] = useState<Medicine | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [loadedConversation, setLoadedConversation] = useState<any[]>([]);
  const [appShareUrl, setAppShareUrl] = useState<string>(() => 
    localStorage.getItem('pharma_share_url') || ''
  );

  const [fuzzyEnabled, setFuzzyEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pharma_fuzzy_search');
    return saved !== null ? saved === 'true' : false; // default = false = exact
  });

  useEffect(() => {
    localStorage.setItem('pharma_fuzzy_search', String(fuzzyEnabled));
  }, [fuzzyEnabled]);
  // API key انتقل للـ Firebase Cloud Function - الـ proxy بيستخدم Firebase Auth
  const geminiApiKey = undefined; // مش محتاجه في الـ client بعد كده
  const [drugToolsModal, setDrugToolsModal] = useState<{ open: boolean; mode: 'interaction' | 'dose'; medicine?: Medicine | null }>({ open: false, mode: 'interaction' });
  const [pedCalcOpen, setPedCalcOpen] = useState(false);
  const [drugTestOpen, setDrugTestOpen] = useState(false);
  const [drugTestInitial, setDrugTestInitial] = useState<string | undefined>(undefined);
  const [pedCalcDrug, setPedCalcDrug] = useState<string | undefined>(undefined);
  const [activeImageViewer, setActiveImageViewer] = useState<{ images: string[], index: number, title: string, flags: boolean[] } | null>(null);
  const [sheetMedicine, setSheetMedicine] = useState<Medicine | null>(null);
  const [geminiModal, setGeminiModal] = useState<{ open: boolean; prompt: string }>({ open: false, prompt: '' });
  const [clinicalModal, setClinicalModal] = useState<{ open: boolean; medicine: any | null }>({ open: false, medicine: null });
  const [sheetSkipAnim, setSheetSkipAnim] = useState(false);
  const openSheet = (m: Medicine, skip = false) => { setSheetSkipAnim(skip); setSheetMedicine(m); };
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(() => localStorage.getItem('app_has_loaded') === 'true');

  // حفظ navigation state في sessionStorage عشان يرجعله بعد reload
  useEffect(() => {
    try {
      sessionStorage.setItem('ps_view', view);
      sessionStorage.setItem('ps_tab', activeTab);
    } catch {}
  }, [view, activeTab]);

  // sessionStorage write — مرة كل 500ms بس مش على كل حرف
  const sessionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      try { sessionStorage.setItem('ps_search', searchTerm); } catch {}
    }, 500);
  }, [searchTerm]);

  // حفظ sheetMedicine عشان يرجعه بعد reload
  useEffect(() => {
    try {
      if (sheetMedicine) sessionStorage.setItem('ps_sheet_reg', sheetMedicine.RegisterNumber);
      else sessionStorage.removeItem('ps_sheet_reg');
    } catch {}
  }, [sheetMedicine]);

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
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [searchBarTop, setSearchBarTop] = useState(90);

  // إصلاح SearchBar يختفي خلف الهيدر لما الكيبورد يطلع
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      setViewportOffsetTop(vv.offsetTop || 0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollPositions.current.get(view) || 0;
      }
    };
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => { vv.removeEventListener('resize', handleResize); vv.removeEventListener('scroll', handleResize); };
  }, [view]);

  useEffect(() => {
    if (!headerRef.current) return;
    // نحفظ أول قيمة ونمنع تغييرها بسبب keyboard
    let lastH = 0;
    const observer = new ResizeObserver(() => {
      if (!headerRef.current) return;
      const vvHeight = window.visualViewport?.height ?? window.innerHeight;
      const isKeyboardOpen = vvHeight < window.innerHeight * 0.75;
      if (isKeyboardOpen && lastH > 0) return;
      // getBoundingClientRect يعطي الارتفاع الفعلي شامل كل الـ padding
      const rect = headerRef.current.getBoundingClientRect();
      const h = Math.ceil(rect.height);
      if (Math.abs(h - lastH) < 2 && lastH > 0) return;
      lastH = h;
      setHeaderHeight(h);
      setSearchBarTop(h - 10);
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

  // صفّر الـ scroll فوراً لما يتغير الـ view لـ alternatives أو أي view جديد
  const prevViewRef = useRef<string>('');
  useEffect(() => {
    if (prevViewRef.current !== view) {
      prevViewRef.current = view;
      if (view === 'alternatives' && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  });

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
      // لو QuickView مفتوح → اقفله الأول
      if (quickViewMedicine) { setQuickViewMedicine(null); return; }
      // احفظ position الـ view الحالي
      if (scrollContainerRef.current) {
          scrollPositions.current.set(view, scrollContainerRef.current.scrollTop);
      }
      if (view === 'imageView') {
          // لو جيت من details نرجع لها، لو من حته تانية كمان
          const backTarget: View = (previousView === 'alternatives' ? 'details' : (previousView || 'details')) as View;
          setActiveImageViewer(null);
          setView(backTarget);
          restoreScroll(backTarget);
      } else if (sheetMedicine) {
          setSheetMedicine(null);
          return;  // فوري بدون delay
      } else if (view === 'alternatives') {
          if (previousView === 'details') {
              // جاي من صفحة التفاصيل → ارجع للتفاصيل بدون sheet
              navigateTo('details', 'push');
              restoreScroll('details');
          } else if (previousView === 'favorites') {
              navigateTo('favorites', 'tab');
              restoreScroll('favorites');
          } else {
              // جاي من نتائج البحث → ارجع للنتائج وافتح الكارت
              navigateTo('results', 'pop');
              restoreScroll('results');
          }
      } else if (view === 'details') {
          const target = previousView === 'alternatives' ? 'alternatives' : 'results';
          // لو راجع لـ alternatives نمسح الـ scroll المحفوظ عشان يبدأ من فوق
          if (target === 'alternatives') { scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView(target); } else { setView(target); restoreScroll(target); }
      } else if (view === 'insuranceDetails') {
          navigateTo('insuranceSearch', 'tab');
          restoreScroll('insuranceSearch');
      } else if (['login', 'register', 'admin', 'notifications', 'favorites'].includes(view)) {
          const target = activeTab === 'search' 
              ? (searchTerm.replace(/\s/g,'').length >= 3 ? 'results' : 'search') 
              : (activeTab === 'insurance' ? 'insuranceSearch' : 'settings');
          setView(target);
          restoreScroll(target);
      } else if (view === 'results') {
          navigateTo('search', 'pop');
          setSearchTerm('');
          restoreScroll('search');
      } else if (view === 'insuranceSearch') {
          // رجوع من التأمين → البحث الرئيسي
          setActiveTab('search');
          navigateTo('search', 'pop');
          setInsuranceSearchTerm('');
          restoreScroll('search');
      } else { 
          navigateTo('search', 'pop'); 
          setActiveTab('search'); 
          restoreScroll('search');
      }
  }, [view, activeTab, searchTerm, restoreScroll, quickViewMedicine]);

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
    trackMedicineView(m['Trade Name'], m.RegisterNumber);
    setPreviousView(view);
    setSelectedMedicine(m);
    setSheetMedicine(m);  // افتح الـ BottomSheet
  };

  // ── Android back button ──────────────────────────────────────────────────
  useEffect(() => {
    const handleAndroidBack = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);

      // 0. الحاسبة مفتوحة → اقفلها أولاً
      if (drugTestOpen) { setDrugTestOpen(false); return; }
      if (pedCalcOpen) { setPedCalcOpen(false); return; }

      // 1. الفلاتر مفتوحة → اقفلها
      if (isFilterModalOpen) { setIsFilterModalOpen(false); return; }

      // 2. لو في dropdown مفتوح (SearchableDropdown) → اقفله أولاً
      if ((window as any).__pharma_dropdown_open__) {
        window.dispatchEvent(new CustomEvent('pharma:close-top-sheet'));
        return;
      }

      // 3. لو في sheet مفتوح (StockTracker edit) → اقفله
      if ((window as any).__pharma_sheet_open__) {
        window.dispatchEvent(new CustomEvent('pharma:close-top-sheet'));
        return;
      }

      // 4. الـ BottomSheet مفتوح → اقفله
      if (sheetMedicine) { setSheetMedicine(null); return; }

      // 4b. الـ QuickView مفتوح → اقفله
      if (quickViewMedicine) { setQuickViewMedicine(null); return; }

      // insuranceSearch بقي view عادي — زرار الرجوع يرجعنا للـ search
      const isHome = (view === 'search' && activeTab === 'search');
      if (isHome) {
        // خروج من البرنامج
        import('@capacitor/app').then(({ App }) => App.exitApp()).catch(() => {
          (window as any).navigator?.app?.exitApp?.();
        });
      } else {
        handleBack();
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleAndroidBack);
    return () => window.removeEventListener('popstate', handleAndroidBack);
  }, [view, handleBack, activeTab, sheetMedicine, isFilterModalOpen, quickViewMedicine, pedCalcOpen]);

  // Swipe to go back — تم إلغاؤه

  useEffect(() => {
    // ✅ الداتا المحلية تتحمل فوراً — مش محتاجين نستنى auth خالص
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    const loadData = async () => {
      try {
        const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
        setInsuranceData(INITIAL_INSURANCE_DATA as any);
        setIsDataLoaded(true);

        // تحميل الـ indications من R2 في الخلفية مع cache
        const IND_CACHE_KEY = 'pharma_indications_v1';
        try {
          const cached = localStorage.getItem(IND_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            // تأكد إن الـ structure صح
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              setIndications(parsed);
            } else {
              localStorage.removeItem(IND_CACHE_KEY);
            }
          } else {
            fetch('https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/indications.json')
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                  setIndications(data);
                  try { localStorage.setItem(IND_CACHE_KEY, JSON.stringify(data)); } catch {}
                }
              }).catch(() => {});
          }
        } catch { localStorage.removeItem('pharma_indications_v1'); }

        // ── خطوة 1: جيب من IndexedDB أولاً — فوري بدون نت ──────
        const { getItem } = await import('./utils/storage');
        const cachedMeds = await getItem<any[]>('pharma_medicines');
        if (cachedMeds && cachedMeds.length > 0) {
          // في cache → شيل اللودينج فوراً قبل أي network
          const baseMapEarly = new Map<string, Medicine>();
          cachedMeds.map(normalizeMedicine).forEach(m => baseMapEarly.set(m.RegisterNumber, m));
          setMedicines(Array.from(baseMapEarly.values()));
          setIsMedicinesLoading(false);
          try { localStorage.setItem('pharma_has_cache', 'true'); } catch {}
        }

        // ── جيب sync + overrides مع بعض ثم setMedicines مرة واحدة بس ──────
        // ده بيمنع الـ re-render المتعدد اللي بيبطّئ الفتح والقفل
        const syncResult = await syncData();
        const baseMap = new Map<string, Medicine>();
        [...syncResult.medicines, ...syncResult.supplements, ...syncResult.food]
          .map(normalizeMedicine)
          .forEach(m => baseMap.set(m.RegisterNumber, m));

        // جيب الـ overrides وادمجهم في baseMap قبل setMedicines — مرة واحدة بس
        try {
          const { getDocs, collection: col } = await import('firebase/firestore');
          const OVERRIDES_CACHE_KEY = 'pharma_overrides_cache';
          const OVERRIDES_CACHE_TS  = 'pharma_overrides_ts';
          const overridesCacheAge   = Date.now() - parseInt(localStorage.getItem(OVERRIDES_CACHE_TS) || '0');
          const OVERRIDES_TTL       = 48 * 60 * 60 * 1000;
          let overridesData: any[] = [];
          if (overridesCacheAge < OVERRIDES_TTL) {
            try { const c = localStorage.getItem(OVERRIDES_CACHE_KEY); if (c) overridesData = JSON.parse(c); } catch {}
          } else {
            const snap = await getDocs(col(db, 'medicine_overrides')).catch(() => null);
            if (snap && !snap.empty) {
              overridesData = snap.docs.map(d => ({ ...d.data(), RegisterNumber: d.id }));
              try {
                localStorage.setItem(OVERRIDES_CACHE_KEY, JSON.stringify(overridesData));
                localStorage.setItem(OVERRIDES_CACHE_TS, String(Date.now()));
              } catch {}
            }
          }
          overridesData.forEach(o => {
            const existing = baseMap.get(o.RegisterNumber);
            if (existing) baseMap.set(o.RegisterNumber, normalizeMedicine({ ...existing, ...o }));
            else baseMap.set(o.RegisterNumber, normalizeMedicine(o));
          });
        } catch {}

        // setMedicines مرة واحدة بس بعد دمج كل حاجة
        const allMeds = Array.from(baseMap.values());
        if (allMeds.length > 0) setMedicines(allMeds);
        setIsMedicinesLoading(false);
        if (syncResult.updated && allMeds.length > 0) {
          setTimeout(() => { setDataReadyToast(true); setTimeout(() => setDataReadyToast(false), 2500); }, 300);
        }

        // ── restore state بعد reload (رجوع من Gemini أو أي app تاني) ──
        try {
          const savedReg = sessionStorage.getItem('ps_selected_reg');
          const savedSheet = sessionStorage.getItem('ps_sheet_reg');
          const savedView = sessionStorage.getItem('ps_view') as View;

          if (savedReg && savedView && ['details', 'alternatives'].includes(savedView)) {
            const med = allMeds.find(m => m.RegisterNumber === savedReg);
            if (med) {
              setSelectedMedicine(med);
              setView(savedView === 'alternatives' ? 'results' : savedView);
            }
          }
          if (savedSheet) {
            const med = allMeds.find(m => m.RegisterNumber === savedSheet);
            if (med) setTimeout(() => setSheetMedicine(med), 300);
          }
        } catch {}

        // ── طلب إذن الإشعارات — إجباري أول مرة ──────────────────
        const notifAsked = localStorage.getItem('notif_permission_asked');
        if (!notifAsked && 'Notification' in window) {
          localStorage.setItem('notif_permission_asked', 'true');
          setTimeout(async () => {
            if (Notification.permission === 'default') {
              await Notification.requestPermission();
            }
          }, 3000);
        }


        // ── خطوة 3: اسمع لتحديثات Storage في الخلفية ─────────────
        // نحفظ hash من آخر داتا عشان نتحقق من تغيير حقيقي
        let lastStorageHash = '';
        const buildStorageHash = (meds: any[], sups: any[], food: any[]) =>
          `${meds.length}:${sups.length}:${food.length}:` +
          [...meds, ...sups, ...food]
            .slice(0, 20) // نأخذ أول 20 بس للسرعة
            .map(m => `${m.RegisterNumber ?? m.Id ?? ''}:${m['Last Update'] ?? m._updatedAt ?? ''}`)
            .join('|');

        const handleStorageUpdate = (e: Event) => {
          const { medicines: newMeds, supplements: newSups, food: newFood } = (e as CustomEvent).detail;
          const newHash = buildStorageHash(newMeds, newSups, newFood);

          // لو نفس الـ hash → مفيش تغيير حقيقي → تجاهل تماماً
          if (newHash === lastStorageHash) {
            console.log('[App] Storage update: no real change, skipping');
            return;
          }
          lastStorageHash = newHash;

          console.log('[App] ✅ Real data update detected, applying...');
          // رسالة تحديث بس لما في تغيير حقيقي
          setDataReadyToast(true);
          setTimeout(() => setDataReadyToast(false), 2500);
          setMedicines(prev => {
            const updatedMap = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
            [...newMeds, ...newSups, ...newFood]
              .map(normalizeMedicine)
              .forEach(m => updatedMap.set(m.RegisterNumber, m));
            return Array.from(updatedMap.values());
          });
        };
        window.addEventListener('pharma:storage-updated', handleStorageUpdate);

        // Admin فقط: real-time listener للـ overrides
        let unsubOverrides: (() => void) = () => {};
        try {
          const cachedUserStr = localStorage.getItem('medai_user_backup_v4');
          const cachedRole = cachedUserStr ? JSON.parse(cachedUserStr)?.role : null;
          if (cachedRole === 'admin') {
            unsubOverrides = listenToOverrides((overrides) => {
              const arr = Array.from(overrides.values());
              try {
                localStorage.setItem('pharma_overrides_cache', JSON.stringify(arr));
                localStorage.setItem('pharma_overrides_ts', String(Date.now()));
              } catch {}
              setMedicines(prev => {
                const merged = new Map<string, Medicine>(prev.map(m => [m.RegisterNumber, m]));
                overrides.forEach((override, id) => {
                  const existing = merged.get(id);
                  if (existing) merged.set(id, normalizeMedicine({ ...existing, ...override }));
                  else merged.set(id, normalizeMedicine(override));
                });
                return Array.from(merged.values());
              });
            });
          }
        } catch {}

        return () => {
          unsubOverrides();
          window.removeEventListener('pharma:storage-updated', handleStorageUpdate);
        };

      } catch (e) {
        console.error(e);
        setIsDataLoaded(true);
        setIsMedicinesLoading(false);
      }
    };
    loadData();
  }, []); // مش محتاجين نستنى authLoading — الداتا مستقلة

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
    medicines, debouncedSearchTerm, textSearchMode, filters, sortBy, fuzzyEnabled, user?.role === 'admin', indications
  );
  const lastResultsRef = React.useRef<typeof finalFilteredMedicines>([]);
  if (searchTerm === debouncedSearchTerm) {
    lastResultsRef.current = finalFilteredMedicines;
  }
  const displayedMedicines = searchTerm === debouncedSearchTerm ? finalFilteredMedicines : lastResultsRef.current;

  // Analytics: log search
  const prevSearchTerm = React.useRef('');
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm === prevSearchTerm.current) return;
    if (debouncedSearchTerm.length < 3) return;
    prevSearchTerm.current = debouncedSearchTerm;
    logSearch(debouncedSearchTerm, finalFilteredMedicines.length, textSearchMode);
  }, [debouncedSearchTerm, finalFilteredMedicines.length]);


  const alternatives = useMemo(() => {
    if (!selectedMedicine) return { direct: [], therapeutic: [] };

    // ── منطق خاص للـ Food ─────────────────────────────────────────────────
    if (selectedMedicine['Product type'] === 'Food') {
      // استخراج مكونات منتج غذائي من الاسم العلمي
      const extractIngredients = (sciName: string): string[] =>
        sciName
          .split(/[,،+&\/|;]+/)
          .map(s =>
            s.toLowerCase()
              .replace(/[-_]/g, ' ')
              .replace(/\d+(\.\d+)?\s*(mg|g|mcg|ug|µg|iu|ui|%|ml|international\s*unit)?/gi, '')
              .replace(/\s+/g, ' ')
              .trim()
          )
          .filter(s => s.length > 2);

      const countShared = (a: string[], b: string[]): number => {
        const setB = new Set(b);
        return a.filter(x => setB.has(x)).length;
      };

      const myIngredients = extractIngredients(String(selectedMedicine['Scientific Name'] || ''));
      if (myIngredients.length === 0) return { direct: [], therapeutic: [] };

      const candidates = medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        m['Product type'] === 'Food' &&
        String(m['Scientific Name'] || '').length > 2
      );

      const directList:      { m: Medicine; shared: number }[] = [];
      const therapeuticList: { m: Medicine; shared: number }[] = [];
      const directIds = new Set<string>();

      for (const m of candidates) {
        const theirIngredients = extractIngredients(String(m['Scientific Name'] || ''));
        if (theirIngredients.length === 0) continue;
        const shared = countShared(myIngredients, theirIngredients);
        // بديل مباشر: كل مكونات المنتج الأصغر موجودة في الأكبر
        const minCount = Math.min(myIngredients.length, theirIngredients.length);
        if (shared >= minCount && shared > 0) {
          directList.push({ m, shared });
          directIds.add(m.RegisterNumber);
        } else if (shared >= 2 && !directIds.has(m.RegisterNumber)) {
          // بديل علاجي: مكونان مشتركان على الأقل
          therapeuticList.push({ m, shared });
        }
      }

      directList.sort((a, b) => b.shared - a.shared);
      therapeuticList.sort((a, b) => b.shared - a.shared);

      return {
        direct:      directList.slice(0, 20).map(x => x.m),
        therapeutic: therapeuticList.slice(0, 20).map(x => x.m),
      };
    }

    // ── الأدوية والمكملات (المنطق الأصلي) ──────────────────────────────────
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

    // نفس المادة + تركيز مختلف + نفس مجموعة الشكل
    const diffStrength = medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        String(m['Scientific Name']).toLowerCase() === sciName &&
        String(m.Strength).toLowerCase() !== strength &&
        areSameRouteGroup(m.PharmaceuticalForm, form) &&
        !direct.some(d => d.RegisterNumber === m.RegisterNumber)
    );

    // البدائل العلاجية: نفس الـ ATC + نفس مجموعة الشكل
    const therapeutic = (atc && atc.length >= 4) ? medicines.filter(m =>
        m.RegisterNumber !== selectedMedicine.RegisterNumber &&
        String(m.AtcCode1 || '').startsWith(atc) &&
        areSameRouteGroup(m.PharmaceuticalForm, form) &&
        !direct.some(d => d.RegisterNumber === m.RegisterNumber) &&
        !diffStrength.some(d => d.RegisterNumber === m.RegisterNumber)
    ) : [];

    return { direct, diffStrength, therapeutic };
  }, [selectedMedicine, medicines]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.productType !== 'all') count++;
    if (filters.priceMin !== '') count++;
    if (filters.priceMax !== '') count++;
    if (Array.isArray(filters.pharmaceuticalForm) ? filters.pharmaceuticalForm.length > 0 : filters.pharmaceuticalForm !== '') count++;
    if (filters.legalStatus !== '') count++;
    if (filters.manufactureName.length > 0) count++;
    if (filters.marketingCompany.length > 0) count++;
    if (filters.mainAgent.length > 0) count++;
    return count;
  }, [filters]);

  // مشاركة الدواء
  const handleAskGemini = (medicine: Medicine) => {
    const name = medicine['Trade Name'] || '';
    const active = medicine['Scientific Name'] || '';
    const prompt = `${name}${active ? ` (${active})` : ''} - Pharmacist reference:\n1. Indications & therapeutic use\n2. Contraindications & drug interactions\n3. Side effects & patient counseling points\n4. Unique selling points vs alternatives`;
    setGeminiModal({ open: true, prompt });
  };

  const handleShareMedicine = (medicine: Medicine) => {
    const price = parseFloat(medicine['Public price']);
    const ar = language === 'ar';
    const baseUrl = appShareUrl.trim();
    const deepLink = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/${medicine.RegisterNumber}`
      : null;
    const linkLine = deepLink
      ? (ar ? `\n🔗 افتح في Easy Drug: ${deepLink}` : `\n🔗 Open in Easy Drug: ${deepLink}`)
      : '';
    const text = ar
      ? `💊 *${medicine['Trade Name']}*\n🧪 ${medicine['Scientific Name']}\n💰 ${price > 0 ? price.toFixed(2) + ' ر.س' : 'غير متاح'}\n🏭 ${medicine['Manufacture Name']}\n📋 ${medicine['Legal Status']}${linkLine}`
      : `💊 *${medicine['Trade Name']}*\n🧪 ${medicine['Scientific Name']}\n💰 ${price > 0 ? price.toFixed(2) + ' SAR' : 'N/A'}\n🏭 ${medicine['Manufacture Name']}\n📋 ${medicine['Legal Status']}${linkLine}`;

    logShareMedicine(medicine['Trade Name']);
    if (Capacitor.isNativePlatform()) {
      // Android: استخدم Capacitor Share
      import('@capacitor/share').then(({ Share }) => {
        Share.share({ title: 'Easy Drug', text, ...(deepLink ? { url: deepLink } : {}) }).catch(() => {
          navigator.clipboard?.writeText(text);
        });
      }).catch(() => {
        navigator.clipboard?.writeText(text);
      });
    } else if (navigator.share) {
        navigator.share({ title: 'Easy Drug', text, ...(deepLink ? { url: deepLink } : {}) });
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

  const FAVORITES_LIMIT = user?.role === 'admin' ? Infinity : 20;
  const toggleFavorite = (id: string) => {
      if (!favorites.includes(id) && favorites.length >= FAVORITES_LIMIT) {
        alert(language === 'ar' ? '⚠️ وصلت للحد الأقصى (20 دواء في المفضلة)' : '⚠️ Max 20 favorites reached');
        return;
      }
      const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
      setFavorites(newFavs);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavs));
  };

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSelectedIndication(null);
    navigateTo('search', 'pop');
    setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''});
  }, []);

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
          if (tab === 'search') { navigateTo('search', 'pop'); scrollPositions.current.delete('search'); }
          if (tab === 'insurance') { navigateTo('insuranceSearch', 'tab'); scrollPositions.current.delete('insuranceSearch'); }
          if (tab === 'settings') { navigateTo('settings', 'tab'); scrollPositions.current.delete('settings'); }
          logTabSwitch(tab);
          // scroll to top دايماً لما يضغط على نفس الـ tab
          requestAnimationFrame(() => {
              if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
          });
      } else {
          setActiveTab(tab);
          // استعادة position الـ tab الجديد لو موجود
          const targetView = tab === 'insurance' ? 'insuranceSearch' : tab === 'settings' ? 'settings' : 'search';
          if (tab === 'insurance' && !['insuranceSearch', 'insuranceDetails'].includes(view)) { navigateTo('insuranceSearch', 'tab'); restoreScroll('insuranceSearch'); }
          else if (tab === 'settings' && !['settings', 'favorites', 'notifications', 'aiHistory'].includes(view)) { navigateTo('settings', 'tab'); restoreScroll('settings'); }
          else if (tab === 'search' && !['search', 'results', 'details', 'alternatives'].includes(view)) { navigateTo('search', 'pop'); restoreScroll('search'); }
      }
  };

  const renderContent = () => {
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { const prev = previousView || 'search'; setView(prev as View); restoreScroll(prev); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => navigateTo('login', 'tab')} onRegisterSuccess={() => navigateTo('login', 'tab')} />;
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
        a.href = url; a.download = `easydrug_${type}_${new Date().toISOString().slice(0,10)}.csv`;
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
            try { await updateDoc(doc(db, 'users', user!.id, 'notifications', id), { isRead: true }); } catch(e) {}
          }
        }}
        onMarkAllRead={async () => {
          // تحديث محلي فوري
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          // تحديث Firebase لكل إشعار
          if (db) {
            const unread = notifications.filter(n => !n.isRead);
            await Promise.all(unread.map(n => 
              updateDoc(doc(db, 'users', user!.id, 'notifications', n.id), { isRead: true }).catch(()=>{})
            ));
          }
        }}
        onDeleteNotification={async (id)=>{ 
          if (!db) return; 
          setNotifications(prev => prev.filter(n => n.id !== id));
          await deleteDoc(doc(db, 'users', user!.id, 'notifications', id)); 
        }}
        onClearAll={async () => {
          setNotifications([]);
          if (db) {
            await Promise.all(notifications.map(n =>
              deleteDoc(doc(db, 'users', user!.id, 'notifications', n.id)).catch(()=>{})
            ));
          }
        }}
        onMedicineLink={(medicineId) => {
          // البحث عن الدواء وفتح صفحته
          const medicine = medicines.find(m => m.RegisterNumber === medicineId);
          if (medicine) {
            setSelectedMedicine(medicine);
            navigateTo('details', 'push');
          }
        }}
      />;
      // stock و order يشتغلوا من أي tab — لازم يكونوا قبل كل شروط activeTab
      if (view === 'stockTracker') return <StockTracker allMedicines={medicines} t={t} language={language} onBack={() => navigateTo('search', 'pop')} isAdmin={user?.role === 'admin'} />;
      if (view === 'orderList') return <OrderList allMedicines={medicines} t={t} language={language} onCountChange={setOrderCount} isAdmin={user?.role === 'admin'} />;

      if (view === 'favorites') return <FavoritesView favoriteIds={favorites} allMedicines={medicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={(m) => { setPreviousView('favorites'); setSelectedMedicine(m); setActiveTab('search'); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; navigateTo('alternatives', 'push'); }} toggleFavorite={toggleFavorite} t={t} language={language} />;
      if (view === 'imageView' && activeImageViewer) return null; // rendered as overlay

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <MedicineDetail medicine={selectedMedicine} insuranceData={insuranceData} allMedicines={medicines} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(m)=>{setSelectedMedicine(m); setIsEditModalOpen(true); }} onOpenAssistant={undefined} onOpenInteractions={undefined} onOpenDoseCalc={() => { setPedCalcDrug(selectedMedicine?.['Scientific Name'] as string || selectedMedicine?.['Trade Name'] as string || undefined); setPedCalcOpen(true); }} onImageZoom={(imgs, idx, title, flags) => { setPreviousView(view); setActiveImageViewer({images:imgs, index:idx, title, flags}); navigateTo('imageView', 'push'); }} onFindAlternative={(m) => { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; navigateTo('alternatives', 'push'); }} onShare={handleShareMedicine} onAskGemini={handleAskGemini} onToggleCompare={toggleCompare} isInCompare={compareList.some(m => m.RegisterNumber === selectedMedicine.RegisterNumber)} onOpenClinical={() => setClinicalModal({ open: true, medicine: selectedMedicine })} />;
          if (view === 'alternatives' && selectedMedicine) return <AlternativesView sourceMedicine={selectedMedicine} alternatives={alternatives} onMedicineSelect={(m) => { setSheetMedicine(m); }} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={(m) => { setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); requestAnimationFrame(() => requestAnimationFrame(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; })); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />;
          
          return (
              <div className="animate-fade-in pt-2">


                  <div className="mt-2">
                      {/* نعرض النتائج لو: في بحث أو في فلاتر نشطة */}
                      {(() => {
                        const minLen = textSearchMode === 'indication' ? 1 : 3;
                        const hasSearch = textSearchMode === 'indication'
                          ? selectedIndication !== null  // indication: بس لما يختار مرض من الـ dropdown
                          : searchTerm.replace(/\s/g,"").length >= minLen;
                        const isDebouncing = searchTerm !== debouncedSearchTerm;
                        const hasResults = (hasSearch || activeFiltersCount > 0) && displayedMedicines.length > 0;
                        const noResults = (hasSearch || activeFiltersCount > 0) && !isDebouncing && displayedMedicines.length === 0;
                        if (hasResults) return (
                          <ResultsList medicines={displayedMedicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); else handleMedicineSelect(m); }} onFindAlternative={(m) => { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; navigateTo('alternatives', 'push'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState="loaded" scrollContainerRef={scrollContainerRef} maxResults={textSearchMode === 'tradeName' || textSearchMode === 'scientificName' ? 100 : undefined} onToggleCompare={toggleCompare} compareList={compareList.map(m => m.RegisterNumber)} />
                        );
                        if (noResults) return (
                          <div className="text-center py-20 bg-white/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            {textSearchMode === 'indication' && Object.keys(indications).length === 0
                              ? <p className="text-slate-400 font-black">{language === 'ar' ? 'جاري تحميل بيانات الأمراض...' : 'Loading disease data...'}</p>
                              : <p className="text-slate-400 font-black">{t('noResultsTitle')}</p>
                            }
                          </div>
                        );
                        return null;
                      })()}
                      {/* ── Home Tools Grid — بيظهر لما مفيش بحث ── */}
                      {(searchTerm.replace(/\s/g,"").length === 0 || searchTerm !== debouncedSearchTerm) && activeFiltersCount === 0 && (() => {
                        const ar2 = language === 'ar';
                        const tools = [
                          {
                            id: 'dose',
                            icon: (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M9 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9l-7-7z"/>
                                <polyline points="14 2 14 9 21 9"/>
                                <line x1="12" y1="13" x2="12" y2="17"/>
                                <line x1="10" y1="15" x2="14" y2="15"/>
                              </svg>
                            ),
                            label: ar2 ? 'جرعات' : 'Dosing',
                            color: 'from-teal-400 to-cyan-500',
                            shadow: 'shadow-teal-200 dark:shadow-teal-900/40',
                            bg: 'bg-teal-50 dark:bg-teal-900/20',
                            text: 'text-teal-600 dark:text-teal-400',
                            onClick: () => { setPedCalcDrug(undefined); setPedCalcOpen(true); },
                          },
                          {
                            id: 'drugtest',
                            icon: (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <circle cx="10" cy="14" r="2"/>
                                <path d="M14 14h2M14 17h2"/>
                              </svg>
                            ),
                            label: ar2 ? 'تحليل مخدرات' : 'Drug Test',
                            color: 'from-violet-400 to-purple-500',
                            shadow: 'shadow-violet-200 dark:shadow-violet-900/40',
                            bg: 'bg-violet-50 dark:bg-violet-900/20',
                            text: 'text-violet-600 dark:text-violet-400',
                            onClick: () => { setDrugTestInitial(undefined); setDrugTestOpen(true); },
                          },
                          {
                            id: 'favorites',
                            icon: (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            ),
                            label: ar2 ? 'المفضلة' : 'Favorites',
                            color: 'from-amber-400 to-orange-500',
                            shadow: 'shadow-amber-200 dark:shadow-amber-900/40',
                            bg: 'bg-amber-50 dark:bg-amber-900/20',
                            text: 'text-amber-600 dark:text-amber-400',
                            onClick: () => navigateTo('favorites', 'tab'),
                          },
                          {
                            id: 'order',
                            icon: (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <path d="M16 10a4 4 0 01-8 0"/>
                              </svg>
                            ),
                            label: ar2 ? 'الطلبات' : 'Orders',
                            color: 'from-sky-400 to-blue-500',
                            shadow: 'shadow-sky-200 dark:shadow-sky-900/40',
                            bg: 'bg-sky-50 dark:bg-sky-900/20',
                            text: 'text-sky-600 dark:text-sky-400',
                            onClick: () => { refreshOrderCount(); navigateTo('orderList', 'push'); },
                          },
                          {
                            id: 'stock',
                            icon: (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                                <line x1="12" y1="12" x2="12" y2="16"/>
                                <line x1="10" y1="14" x2="14" y2="14"/>
                              </svg>
                            ),
                            label: ar2 ? 'المخزون' : 'Stock',
                            color: 'from-emerald-400 to-green-500',
                            shadow: 'shadow-emerald-200 dark:shadow-emerald-900/40',
                            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                            text: 'text-emerald-600 dark:text-emerald-400',
                            onClick: () => navigateTo('stockTracker', 'push'),
                          },
                          {
                            id: 'insurance',
                            icon: (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <polyline points="9 12 11 14 15 10"/>
                              </svg>
                            ),
                            label: ar2 ? 'التأمين' : 'Insurance',
                            color: 'from-rose-400 to-pink-500',
                            shadow: 'shadow-rose-200 dark:shadow-rose-900/40',
                            bg: 'bg-rose-50 dark:bg-rose-900/20',
                            text: 'text-rose-600 dark:text-rose-400',
                            onClick: () => { setActiveTab('insurance'); navigateTo('insuranceSearch', 'tab'); },
                          },
                        ];
                        return (
                          <div className="animate-fade-in">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mb-3">
                              {ar2 ? 'الأدوات' : 'Quick Tools'}
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              {tools.map(tool => (
                                <button
                                  key={tool.id}
                                  onClick={tool.onClick}
                                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl ${tool.bg} active:scale-95 transition-all duration-150`}
                                >
                                  <div className={tool.text}>{tool.icon}</div>
                                  <span className={`text-[11px] font-black ${tool.text}`}>{tool.label}</span>
                                </button>
                              ))}
                            </div>

                            {/* Recent searches تحت الأدوات */}
                            {recentSearches.length > 0 && (
                              <div className="mt-5">
                                <div className="flex justify-between items-center mb-3 px-1">
                                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    {ar2 ? '🕒 آخر المشاهدات' : '🕒 Recently Viewed'}
                                  </h3>
                                  <button onClick={() => { setRecentSearchIds([]); localStorage.removeItem(RECENT_SEARCHES_KEY); }}
                                    className="text-[10px] font-black text-rose-400 hover:text-rose-600">
                                    {ar2 ? 'مسح' : 'Clear'}
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
                                        {parseFloat(med['Public price']) > 0 ? parseFloat(med['Public price']).toFixed(2) + (ar2 ? ' ر.س' : ' SAR') : ''}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>

                  {/* ── علامة تحميل في آخر الكارت ── */}
                  {isMedicinesLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 mt-2 opacity-60">
                      <div className="w-3.5 h-3.5 border-2 border-teal-300 border-t-teal-500 rounded-full animate-spin flex-shrink-0" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Updating...
                      </span>
                    </div>
                  )}
              </div>
          );
      }

      if (activeTab === 'insurance') {
          if (view === 'insuranceDetails' && selectedInsurance) return <InsuranceDetailsView data={selectedInsurance} t={t} />;
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(d) => { setSelectedInsurance(d); navigateTo('insuranceDetails', 'push'); if (scrollContainerRef.current) setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; }, 50); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }

      if (activeTab === 'settings') {
          // settings tab مش محتاج extra padding
          return (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
                      <h3 className="text-lg font-black mb-6 border-b pb-4 dark:border-dark-border">{t('navSettings')}</h3>
                      <div className="space-y-4">
                          {/* Profile Card */}
                          {user && (
                            <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl border border-teal-100 dark:border-teal-800/30">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-800 dark:text-white truncate">{user.username}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                  {(user as any).specialty && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        {(user as any).specialty}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {!(user as any).specialty && (
                                  <button
                                    onClick={() => { setIsEditingSpecialty(true); setShowSpecialtyModal(true); }}
                                    className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl active:scale-95"
                                  >
                                    {language === 'ar' ? 'اختر تخصصك' : 'Set Specialty'}
                                  </button>
                                )}
                                {(user as any).specialty && (
                                  <button
                                    onClick={() => { setIsEditingSpecialty(true); setShowSpecialtyModal(true); }}
                                    className="text-[10px] font-bold text-slate-400 px-2 py-1 rounded-xl active:scale-95"
                                  >
                                    {language === 'ar' ? 'تغيير' : 'Edit'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <button onClick={() => navigateTo('favorites', 'tab')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
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

                          </div>
                          {/* إشعارات Push */}
                          {/* Notifications managed by system */}
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
                                placeholder="https://easydrug.app/medicine"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          )}
                          {user && <button onClick={logout} className="w-full py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl font-black text-sm">{t('logout')}</button>}

                          {/* ── منطقة منفصلة — Report / Add Medicine ── */}
                          {user && (
                            <div className="mt-2 pt-4 border-t-2 border-dashed border-slate-100 dark:border-slate-800">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-300 dark:text-slate-600 mb-3 text-center">Feedback & Support</p>
                              <button
                                onClick={() => {
                                  const msg = encodeURIComponent(
                                    `[Easy Drug Report]\n` +
                                    `User: ${user.username || 'Unknown'}\n` +
                                    `Email: ${user.email || 'N/A'}\n` +
                                    `Specialty: ${(user as any).specialty || 'N/A'}\n\n` +
                                    `Describe the issue or medicine to add:\n`
                                  );
                                  if (Capacitor.isNativePlatform()) {
                                    window.open(`https://wa.me/966550806894?text=${msg}`, '_system');
                                  } else {
                                    window.open(`https://wa.me/966550806894?text=${msg}`, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className="w-full flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl active:scale-95 transition-all"
                              >
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </div>
                                <div className="text-left">
                                  <span className="block font-black text-sm text-emerald-700 dark:text-emerald-400">Report Error / Add Medicine</span>
                                  <span className="block text-[10px] text-emerald-500/80 font-medium">Send report via WhatsApp</span>
                                </div>
                              </button>
                            </div>
                          )}
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  if (isDataLoaded && !isOnline && medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-slate-900 p-6 text-center select-none">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/20 flex items-center justify-center shadow-lg">
          <span className="text-4xl">📶</span>
        </div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white mb-2">Easy Drug</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Internet required for first launch</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8 max-w-xs leading-relaxed">
          Connect once to download the database. After that, the app works fully offline.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/25 active:scale-95 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ✅ Splash screen — بسيطة: logo + spinner صغير
  // Specialty modal يظهر فوق كل حاجة
  const specialtyModalEl = showSpecialtyModal
    ? <SpecialtyModal isOpen={true} onComplete={handleSpecialtyComplete} onCancel={isEditingSpecialty ? () => { setShowSpecialtyModal(false); setIsEditingSpecialty(false); } : undefined} />
    : null;

  // لو auth لسه بيتحقق بس مفيش medicine خالص نكتفي بـ spinner صغير في الـ header

  // ✅ Auth Gate — مش مسجّل → Login مباشرة بدون أي تعديل تاني في الكود
  if (!user) {
    return (
      <div className="bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
        {specialtyModalEl}
      {view === 'register'
          ? <RegisterView t={t} onSwitchToLogin={() => navigateTo('login', 'tab')} onRegisterSuccess={() => navigateTo('login', 'tab')} />
          : <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { navigateTo('search', 'pop'); }} />
        }
      </div>
    );
  }

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden relative">
      {specialtyModalEl}
      {/* ── Notification Permission Prompt ── */}
      

      <Header
        ref={headerRef}
        title="Easy Drug"
        showBack={view !== 'search' || activeTab === 'insurance'}
        onBack={handleBack}
        t={t}
        onLoginClick={() => { setPreviousView(view); navigateTo('login', 'tab'); }}
        onAdminClick={()=>navigateTo('admin', 'push')}
        onPediatricCalcClick={() => { setPedCalcDrug(undefined); setPedCalcOpen(true); }}
        onNotificationsClick={() => navigateTo('notifications', 'tab')}
        onSettingsClick={(target?: string) => { setActiveTab('settings'); if (target === 'stockTracker') { navigateTo('stockTracker', 'push'); } else if (target === 'orderList') { refreshOrderCount(); navigateTo('orderList', 'push'); } else { navigateTo('settings', 'tab'); restoreScroll('settings'); } }}
        view={view}
        unreadCount={notifications.filter(n => !n.isRead).length}
        isLoading={authLoading || (isMedicinesLoading && medicines.length === 0)}
        searchBarVisible={activeTab === 'search' && !['details', 'alternatives', 'login', 'register', 'admin', 'imageView'].includes(view)}
      />

      {/* SearchBar — ثابت تحت الهيدر مباشرة */}
      {activeTab === 'search' && !['details', 'alternatives', 'login', 'register', 'admin', 'imageView', 'notifications', 'favorites', 'settings', 'stockTracker', 'orderList', 'aiHistory'].includes(view) && (
        <div
          className="fixed left-0 right-0 z-[59] px-3"
          style={{ top: headerHeight }}
        >
          <div className="bg-light-bg dark:bg-dark-bg pb-2 pt-1" style={{boxShadow: "0 4px 12px -2px rgba(0,0,0,0.06)"}}>
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              textSearchMode={textSearchMode}
              setTextSearchMode={(mode) => {
                setTextSearchMode(mode);
                if (mode !== 'indication') setSelectedIndication(null);
                else setSelectedIndication(null); // reset on re-enter indication mode too
              }}
              isSearchActive={searchTerm.length > 0}
onClearSearch={handleClearSearch}
              onForceSearch={() => { navigateTo('results', 'pop'); }}
              onBarcodeScanClick={()=>{}}
              fuzzyEnabled={fuzzyEnabled}
              onToggleFuzzy={() => setFuzzyEnabled(v => !v)}
              t={t}
              activeFiltersCount={activeFiltersCount}
              onOpenFilters={() => setIsFilterModalOpen(true)}
              sortBy={sortBy}
              setSortBy={setSortBy}
              language={language}
              onInsuranceClick={() => { setActiveTab('insurance'); navigateTo('insuranceSearch', 'tab'); }}
              isSearching={false}
              indications={indications}
              onIndicationSelect={(ind) => {
                setSearchTerm(ind);
                setSelectedIndication(ind);
                navigateTo('results', 'pop');
              }}
            />
          </div>
        </div>
      )}

      <main id="main-scroll-container" ref={scrollContainerRef} onScroll={() => { const el = document.activeElement as HTMLElement; if (el?.tagName !== "INPUT" && el?.tagName !== "TEXTAREA") el?.blur?.(); }} className="flex-grow mx-auto px-4 overflow-y-auto w-full max-w-5xl no-scrollbar" style={{ paddingTop: (activeTab === 'search' && !['details', 'alternatives', 'login', 'register', 'admin', 'imageView', 'notifications', 'favorites', 'settings', 'stockTracker', 'orderList', 'aiHistory'].includes(view)) ? headerHeight + 104 : headerHeight + 16, paddingBottom: compareList.length > 0 && !showCompare ? 'calc(180px + env(safe-area-inset-bottom))' : 'calc(90px + env(safe-area-inset-bottom))', transition: 'padding-top 0.1s ease, padding-bottom 0.4s ease', WebkitOverflowScrolling: "touch", overscrollBehavior: "none" } as any} >
          <div
              key={view}
              style={{
                animation: navDir === 'push'
                  ? 'viewPushIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both'
                  : navDir === 'pop'
                  ? 'viewPopIn  0.3s cubic-bezier(0.22, 1, 0.36, 1) both'
                  : 'viewFadeIn 0.2s ease both',
              }}
            >
              {renderContent()}
            </div>
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
          onCompare={() => { setPedCalcOpen(false); setDrugTestOpen(false); setShowCompare(true); }}
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
        skipOpenAnimation={sheetSkipAnim}
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
            onEdit={(m) => { setSelectedMedicine(m); setSheetMedicine(null); setIsEditModalOpen(true); }}
            onOpenAssistant={undefined}
            onOpenInteractions={undefined}
            onOpenDoseCalc={() => { setPedCalcDrug(sheetMedicine?.['Scientific Name'] as string || sheetMedicine?.['Trade Name'] as string || undefined); setPedCalcOpen(true); }}
            onImageZoom={(imgs, idx, title, flags) => { setPreviousView(view); setActiveImageViewer({ images: imgs, index: idx, title, flags }); navigateTo('imageView', 'push'); }}
            onFindAlternative={(m) => { setSheetMedicine(null); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; navigateTo('alternatives', 'push'); }}
            onShare={handleShareMedicine}
            onAskGemini={handleAskGemini}
            onToggleCompare={toggleCompare}
            isInCompare={compareList.some(m => m.RegisterNumber === sheetMedicine.RegisterNumber)}
            onOpenClinical={() => setClinicalModal({ open: true, medicine: sheetMedicine })}
          />
        )}
      </BottomSheet>

      <GeminiPromptModal isOpen={geminiModal.open} prompt={geminiModal.prompt} onClose={() => setGeminiModal({ open: false, prompt: '' })} />

      {/* Clinical Page — فوق كل حاجة في App level */}
      {clinicalModal.open && clinicalModal.medicine && (
        <div className="fixed inset-0 z-[999]">
          <ClinicalDataPage
            registerNumber={clinicalModal.medicine.RegisterNumber}
            tradeName={clinicalModal.medicine['Trade Name']}
            scientificName={clinicalModal.medicine['Scientific Name']}
            language={language}
            isAdmin={user?.role === 'admin'}
            allMedicines={medicines}
            onClose={() => setClinicalModal({ open: false, medicine: null })}
          />
        </div>
      )}

      {/* الزرار يظهر بس لو مسجل دخول */}
      {/* FloatingAssistantButton disabled */}
      {false && isAssistantOpen && <AssistantModal
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
            {pedCalcOpen && (
        <PediatricDoseCalculator
          onClose={() => setPedCalcOpen(false)}
          initialDrugName={pedCalcDrug}
          language={language}
        />
      )}

      {drugTestOpen && (
        <DrugTestChecker
          onClose={() => setDrugTestOpen(false)}
          initialDrugName={drugTestInitial}
          language={language}
          allMedicines={medicines}
          onMedicineSelect={(m) => {
            setSelectedMedicine(m);
            navigateTo('details', 'push');
          }}
        />
      )}

      {false && drugToolsModal.open && (
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
      {/* ── Data Ready Toast ── */}
      {dataReadyToast && (
        <div style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, pointerEvents: 'none', animation: 'fadeInUp 0.3s ease' }}>
          <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
          <div className="flex items-center gap-2 bg-slate-800/90 dark:bg-slate-700/90 text-white px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-sm">
            <span className="text-sm">✅</span>
            <span className="text-xs font-black">{language === 'ar' ? 'تم تحميل البيانات' : 'Data loaded'}</span>
          </div>
        </div>
      )}
      <FilterModal isOpen={isFilterModalOpen} onClose={()=>setIsFilterModalOpen(false)} filters={filters} onApply={setFilters} onClearFilters={()=>setFilters({productType:'all',priceMin:'',priceMax:'',pharmaceuticalForm:'',manufactureName:[],marketingCompany:[],mainAgent:[],legalStatus:''})} allMedicines={searchTextResults.length > 0 ? searchTextResults : medicines} t={t} headerBottom={headerHeight} isAdmin={user?.role === 'admin'} />
      {/* ── Image Viewer Overlay — فوق كل حاجة ── */}
      {view === 'imageView' && activeImageViewer && (
        <div className="fixed inset-0 z-[9999]">
          <ImageViewer images={activeImageViewer.images} initialIndex={activeImageViewer.index} title={activeImageViewer.title} t={t} indexFlags={activeImageViewer.flags} onBack={handleBack} />
        </div>
      )}

      {isEditModalOpen && <EditMedicineModal isOpen={isEditModalOpen} onClose={()=>{ setIsEditModalOpen(false); if(selectedMedicine) openSheet(selectedMedicine, true); }} medicine={selectedMedicine} onSave={async (m) => { await handleSaveMedicine(m); setIsEditModalOpen(false); openSheet(m, true); }} t={t} />}

      {/* ── Bottom Nav Bar ── */}
      {!['login', 'register', 'imageView'].includes(view) && (
        <BottomNavBar
          activeTab={activeTab}
          setActiveTab={handleTabClick}
          t={t}
          user={user}
          view={view}
          onPediatricCalc={() => { setPedCalcDrug(undefined); setPedCalcOpen(true); }}
          onFavoritesClick={() => { navigateTo('favorites', 'tab'); }}
          onDrugTestCheck={() => { setDrugTestInitial(undefined); setDrugTestOpen(true); }}
        />
      )}
    </div>
  );
};
export default App;
