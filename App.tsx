
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { 
  Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, 
  InsuranceDrug, SelectedInsuranceData, InsuranceSearchMode, Notification as AppNotification
} from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import MedicineCard from './components/MedicineCard';
import IndicationSearch from './components/IndicationSearch';
import MedicineDetail from './components/MedicineDetail';
import PrescriptionView from './components/PrescriptionView';
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
import PediatricPresetBar from './components/PediatricPresetBar';
import DrugTestChecker from './components/DrugTestChecker';
import { fuzzyMatch, fuzzyScore } from './utils/fuzzySearch';
import { trackMedicineView, getTopSearched, getTotalSearches } from './utils/analytics';
import { prefetchClinicalRef } from './utils/dailyMedicines';
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
import { useSubscription } from './hooks/useSubscription';
import PlansPage from './components/PlansPage';
import AdBanner from './components/AdBanner';
import OnboardingOverlay, { shouldShowOnboarding } from './components/OnboardingOverlay';
import { getInsurancePolicies } from './utils/insuranceMatch';

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
const MAX_RECENT = 5;

const WHATSAPP_NUMBER = '966550806894'; // +966 Saudi Arabia

const App: React.FC = () => {
  const { user, logout, requestAIAccess, getSettings, isLoading: authLoading, updateUser } = useAuth();
  const appSettings = getSettings();
  const subscription = useSubscription(user);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);
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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>([]);

  // Pre-compute covered ATC codes + scientific name norms for O(1) lookup in cards
  const coveredAtcSet = useMemo(() => {
    const s = new Set<string>();
    insuranceData.forEach(p => { if (p.atcCode) s.add(p.atcCode.trim()); });
    return s;
  }, [insuranceData]);

  const coveredSciNorms = useMemo(() => {
    const s = new Set<string>();
    insuranceData.forEach(p => {
      if (!p.scientificName) return;
      const norm = p.scientificName.toLowerCase()
        .replace(/\d+\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel)\b/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/).filter(t => t.length > 1 && !['mg','ml','g','mcg','iu','kg','tab','caps','solution','suspension','oral','vial','ampoule','tablet','capsule'].includes(t))
        .join(' ').trim();
      if (norm) s.add(norm);
    });
    return s;
  }, [insuranceData]);
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
  const [showInsuranceBadge, setShowInsuranceBadge] = useState<boolean>(() => localStorage.getItem('ps_insurance_badge') === 'true');
  const [insuranceSheetMedicine, setInsuranceSheetMedicine] = useState<Medicine | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [searchTerm, setSearchTerm] = useState(() => {
    try { return sessionStorage.getItem('ps_search') || ''; } catch { return ''; }
  });
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
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
  const [previousView, setPreviousView] = useState<View>('results');
  const [previousTab, setPreviousTab] = useState<Tab>('search'); // لحفظ الـ tab عند فتح notifications
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
              setView('details');
              return;
            }
          }
          setView('notifications');
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
  const [adminResultsPage, setAdminResultsPage] = useState(1);
  const ADMIN_PAGE_SIZE = 100;

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
  const prevSheetMedicine = React.useRef<Medicine | null>(null);
  const [geminiModal, setGeminiModal] = useState<{ open: boolean; prompt: string }>({ open: false, prompt: '' });
  const [clinicalModal, setClinicalModal] = useState<{ open: boolean; medicine: any | null }>({ open: false, medicine: null });
  const [sheetSkipAnim, setSheetSkipAnim] = useState(false);
  const openSheet = (m: Medicine, skip = false) => { setSheetSkipAnim(skip); setSheetMedicine(m); };
  const [skipNextViewKey, setSkipNextViewKey] = useState(false);
  
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
  // نحفظ الـ headerHeight من اللي بعد في localStorage عشان أول render يكون صح
  const STORED_H = (() => {
    try {
      const v = parseInt(localStorage.getItem('ps_header_h') || '');
      if (v > 50 && v < 200) return v;
    } catch {}
    // Fallback: status bar (iOS ~44px, Android ~30px) + header content ~56px = conservative 120px
    return 120;
  })();
  const INITIAL_HEADER_H = STORED_H;
  const [headerHeight, setHeaderHeight] = useState(INITIAL_HEADER_H);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [searchBarTop, setSearchBarTop] = useState(INITIAL_HEADER_H);
  const [headerMeasured, setHeaderMeasured] = useState(true);

  // إصلاح SearchBar يختفي خلف الهيدر لما الكيبورد يطلع
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    let cleanupCap: (() => void) | null = null;
    (async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        const showListener = await Keyboard.addListener('keyboardWillShow', (info: any) => {
          setIsKeyboardOpen(true);
          setKeyboardHeight(info?.keyboardHeight || 0);
        });
        const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        });
        cleanupCap = () => { showListener.remove(); hideListener.remove(); };
      } catch {
        const vv = window.visualViewport;
        if (!vv) return;
        const handleResize = () => {
          const kbOpen = vv.height < window.innerHeight * 0.75;
          setIsKeyboardOpen(kbOpen);
          setKeyboardHeight(kbOpen ? Math.max(0, window.innerHeight - vv.height) : 0);
        };
        vv.addEventListener('resize', handleResize);
        vv.addEventListener('scroll', handleResize);
        cleanupCap = () => { vv.removeEventListener('resize', handleResize); vv.removeEventListener('scroll', handleResize); };
      }
    })();
    return () => cleanupCap?.();
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    let lastH = 0;
    let attempts = 0;

    const measureNow = () => {
      if (!headerRef.current) return;
      const h = Math.ceil(headerRef.current.getBoundingClientRect().height);
      if (h > 40 && Math.abs(h - lastH) >= 1) {
        lastH = h;
        setHeaderHeight(h);
        setSearchBarTop(h - 10);
        setHeaderMeasured(true);
        try { localStorage.setItem('ps_header_h', String(h)); } catch {}
      } else if (h === 0 && attempts < 10) {
        // Layout not ready yet — retry
        attempts++;
        setTimeout(measureNow, 30);
      }
    };

    // Multiple attempts to catch iOS layout completion
    requestAnimationFrame(() => {
      measureNow();
      setTimeout(measureNow, 50);
      setTimeout(measureNow, 150);
      setTimeout(measureNow, 400);
    });

    const observer = new ResizeObserver(() => {
      const vvH = window.visualViewport?.height ?? window.innerHeight;
      if (vvH < window.innerHeight * 0.75) return; // keyboard open
      measureNow();
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.getPlatform() === 'android') {
        document.documentElement.style.setProperty('--header-h', 'calc(30px + 56px)');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (headerHeight !== 120) {
      root.style.setProperty('--header-h', `${headerHeight}px`);
    }
  }, [headerHeight]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      if (sheetMedicine) {
          setSheetMedicine(null);
          return;  // فوري بدون delay
      } else if (view === 'alternatives') {
          if (previousView === 'details') {
              // جاي من صفحة التفاصيل → ارجع للتفاصيل بدون sheet
              setView('details');
              restoreScroll('details');
          } else if (previousView === 'favorites') {
              setView('favorites');
              restoreScroll('favorites');
          } else {
              // جاي من نتائج البحث → ارجع للنتائج وافتح الكارت
              setView('results');
              restoreScroll('results');
          }
      } else if (view === 'details') {
          const target = previousView === 'alternatives' ? 'alternatives' : previousView === 'search' ? 'search' : 'results';
          // لو راجع لـ alternatives نمسح الـ scroll المحفوظ عشان يبدأ من فوق
          if (target === 'alternatives') { scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView(target); } else { setView(target); restoreScroll(target); }
      } else if (view === 'insuranceDetails') {
          setView('insuranceSearch');
          restoreScroll('insuranceSearch');
      } else if (view === 'notifications') {
          const prev = previousView && previousView !== 'notifications' ? previousView : 'search';
          const tab = previousTab || 'search';
          setActiveTab(tab as Tab);
          setView(prev as View);
          restoreScroll(prev);
      } else if (['login', 'register', 'admin', 'favorites', 'indicationSearch', 'pedDoseHistory', 'recentlyViewed'].includes(view)) {
          const target = activeTab === 'search' 
              ? (searchTerm.replace(/\s/g,'').length >= 2 ? 'results' : 'search') 
              : (activeTab === 'insurance' ? 'insuranceSearch' : 'settings');
          setView(target);
          restoreScroll(target);
      } else if (view === 'results') {
          setView('search');
          setSearchTerm('');
          restoreScroll('search');
      } else if (view === 'insuranceSearch') {
          // رجوع من التأمين → البحث الرئيسي
          setActiveTab('search');
          setView('search');
          setInsuranceSearchTerm('');
          restoreScroll('search');
      } else { 
          setView('search'); 
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
        // تحميل بيانات التأمين من R2 مع cache محلي
        try {
          const INS_CACHE_KEY = 'pharma_insurance_v2';
          const INS_CACHE_TS  = 'pharma_insurance_ts';
          const INS_TTL       = 24 * 60 * 60 * 1000; // 24 ساعة
          const cacheAge      = Date.now() - parseInt(localStorage.getItem(INS_CACHE_TS) || '0');

          // حاول تحمل من الـ cache الأول
          const { getItem: getIDB, setItem: setIDB } = await import('./utils/storage');
          const cachedIns = await getIDB<any[]>(INS_CACHE_KEY);
          if (cachedIns && cachedIns.length > 0) {
            setInsuranceData(cachedIns as any);
          }

          // لو الـ cache منتهي أو مفيش — جيب من R2
          if (!cachedIns || cacheAge > INS_TTL) {
            const res  = await fetch('https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/chi_insurance.json');
            if (res.ok) {
              const fresh = await res.json();
              setInsuranceData(fresh);
              await setIDB(INS_CACHE_KEY, fresh);
              localStorage.setItem(INS_CACHE_TS, String(Date.now()));
            }
          }
        } catch {
          // fallback للداتا القديمة لو فيه مشكلة
          try {
            const { INITIAL_INSURANCE_DATA } = await import('./data/insurance-data');
            setInsuranceData(INITIAL_INSURANCE_DATA as any);
          } catch {}
        }
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
        prefetchClinicalRef(); // pre-load clinical reference in background
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

  const { finalFilteredMedicines, searchContextMedicines, searchTextResults, indicationGroups } = useSearch(
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
    setAdminResultsPage(1); // reset pagination on new search
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

  // حفظ scroll position لما ImageViewer يفتح وإرجاعه لما يقفل
  const savedScrollBeforeImage = React.useRef<number>(0);
  React.useEffect(() => {
    if (activeImageViewer) {
      savedScrollBeforeImage.current = scrollContainerRef.current?.scrollTop ?? 0;
    } else if (view === 'alternatives' && savedScrollBeforeImage.current > 0) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedScrollBeforeImage.current;
        }
      });
    }
  }, [activeImageViewer]);

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
    setView('search');
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
          if (tab === 'search') { setView('search'); scrollPositions.current.delete('search'); }
          if (tab === 'insurance') { setView('insuranceSearch'); scrollPositions.current.delete('insuranceSearch'); }
          if (tab === 'settings') { setView('settings'); scrollPositions.current.delete('settings'); }
          logTabSwitch(tab);
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
            setView('details');
          }
        }}
      />;
      if (view === 'favorites') return <FavoritesView favoriteIds={favorites} allMedicines={medicines} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={(m) => { setPreviousView('favorites'); setSelectedMedicine(m); setActiveTab('search'); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView('alternatives'); }} toggleFavorite={toggleFavorite} t={t} language={language} />;
      if (view === 'indicationSearch') return <IndicationSearch indications={indications} medicines={medicines} language={language} t={t} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={(m) => { setPreviousView('indicationSearch'); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} />;

      if (view === 'pedDoseHistory') return (
        <div className="pt-2 pb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-9 h-9 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">👶</div>
            <div>
              <h2 className="text-base font-black text-slate-700 dark:text-white">{language === 'ar' ? 'الجرعات السريعة' : 'Quick Doses'}</h2>
              <p className="text-[10px] font-bold text-slate-400">{language === 'ar' ? 'الإعدادات المحفوظة — أدخل الوزن للحساب الفوري' : 'Saved presets — enter weight for instant dose'}</p>
            </div>
            <button
              onClick={() => { setPedCalcDrug(undefined); setPedCalcOpen(true); }}
              className="mr-auto flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white rounded-xl text-[11px] font-black active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              {language === 'ar' ? 'حاسبة' : 'Calc'}
            </button>
          </div>
          <PediatricPresetBar
            language={language}
            onOpenCalc={(drugName) => { setPedCalcDrug(drugName); setPedCalcOpen(true); }}
            medicines={medicines}
          />
        </div>
      );

      if (view === 'recentlyViewed') return (
        <div className="pt-2 pb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕒</span>
              <h2 className="text-base font-black text-slate-700 dark:text-white">
                {language === 'ar' ? 'آخر الأدوية المشاهدة' : 'Recently Viewed'}
              </h2>
            </div>
            {recentSearches.length > 0 && (
              <button onClick={() => { setRecentSearchIds([]); localStorage.removeItem(RECENT_SEARCHES_KEY); setView('search'); }}
                className="text-[10px] font-black text-rose-400 active:scale-95">
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </button>
            )}
          </div>
          {recentSearches.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">🕒</p>
              <p className="text-sm font-black text-slate-400">{language === 'ar' ? 'لا توجد أدوية مشاهدة بعد' : 'No recently viewed medicines'}</p>
            </div>
          ) : (
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
          )}
        </div>
      );

      if (activeTab === 'search') {
          if (view === 'details' && selectedMedicine) return <div className="anim-slide-up" style={{minHeight:'100%'}}><MedicineDetail medicine={selectedMedicine} insuranceData={insuranceData} allMedicines={medicines} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={(m)=>{setSelectedMedicine(m); setIsEditModalOpen(true); }} onOpenAssistant={undefined} onOpenInteractions={undefined} onOpenDoseCalc={() => { setPedCalcDrug(selectedMedicine?.['Scientific Name'] as string || selectedMedicine?.['Trade Name'] as string || undefined); setPedCalcOpen(true); }} onImageZoom={(imgs, idx, title, flags) => { setPreviousView(view); setActiveImageViewer({images:imgs, index:idx, title, flags}); }} onFindAlternative={(m) => { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView('alternatives'); }} onShare={handleShareMedicine} onAskGemini={handleAskGemini} onToggleCompare={toggleCompare} isInCompare={compareList.some(m => m.RegisterNumber === selectedMedicine.RegisterNumber)} onOpenClinical={() => setClinicalModal({ open: true, medicine: selectedMedicine })} onShowInsuranceSheet={(m) => setInsuranceSheetMedicine(m)} /></div>;
          if (view === 'alternatives' && selectedMedicine) return <div className="anim-fade-scale" style={{minHeight:'100%', contain: 'layout'}}><AlternativesView sourceMedicine={selectedMedicine} alternatives={alternatives} onMedicineSelect={(m) => { setSheetMedicine(m); }} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); }} onFindAlternative={(m) => { setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); requestAnimationFrame(() => requestAnimationFrame(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; })); }} onImageClick={(m) => { if (m.imgBox) { scrollPositions.current.set('alternatives', scrollContainerRef.current?.scrollTop || 0); setPreviousView('alternatives'); setActiveImageViewer({ images: [m.imgBox, m.imgIndex1, m.imgIndex2].filter(Boolean) as string[], index: 0, title: m['Trade Name'], flags: [!!m.imgBox, !!m.imgIndex1, !!m.imgIndex2] }); } }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} /></div>;
          
          return (
              <div className="pt-1">

                  {/* ── Quick Tools ── */}
                  {searchTerm.length === 0 && activeFiltersCount === 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3 px-1" style={{ color: '#8a938f' }}>
                        {language === 'ar' ? 'أدوات سريعة' : 'Quick Tools'}
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {/* Dosing */}
                        <button onClick={() => { setPedCalcDrug(undefined); setPedCalcOpen(true); }}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#eef9f6', border: '1.5px solid #cdeee7' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#006a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="4"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#006a60' }}>{language === 'ar' ? 'الجرعات' : 'Dosing'}</span>
                        </button>
                        {/* Drug Test */}
                        <button onClick={() => { setDrugTestInitial(undefined); setDrugTestOpen(true); }}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#f5f0ff', border: '1.5px solid #e0d5ff' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3h8M9 3v6l-5 7a2 2 0 001.66 3h12.68A2 2 0 0020 19l-5-7V3"/>
                            <line x1="9" y1="9" x2="15" y2="9"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#6d28d9' }}>{language === 'ar' ? 'تحليل الدواء' : 'Drug Test'}</span>
                        </button>
                        {/* By Disease */}
                        <button onClick={() => setView('indicationSearch')}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#0369a1' }}>{language === 'ar' ? 'بحث بالمرض' : 'By Disease'}</span>
                        </button>
                        {/* Favorites */}
                        <button onClick={() => setView('favorites')}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#b45309' }}>{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
                        </button>
                        {/* Orders */}
                        <button onClick={() => { refreshOrderCount(); setActiveTab('settings'); setView('orderList'); }}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#1d4ed8' }}>{language === 'ar' ? 'الطلبات' : 'Orders'}</span>
                        </button>
                        {/* Stock */}
                        <button onClick={() => { setActiveTab('settings'); setView('stockTracker'); }}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="15" rx="2"/>
                            <path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
                            <line x1="12" y1="12" x2="12" y2="17"/>
                            <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#15803d' }}>{language === 'ar' ? 'المخزون' : 'Stock'}</span>
                        </button>
                        {/* Insurance */}
                        <button onClick={() => setActiveTab('insurance')}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#fff1f2', border: '1.5px solid #fecdd3' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="M9 12l2 2 4-4"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#be123c' }}>{language === 'ar' ? 'التأمين' : 'Insurance'}</span>
                        </button>
                        {/* Prescription — admin only */}
                        {user?.role === 'admin' && (
                          <button onClick={() => { setActiveTab('settings'); setView('prescription'); }}
                            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                            style={{ background: '#eef9f6', border: '1.5px solid #cdeee7' }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#006a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10 9 9 9 8 9"/>
                            </svg>
                            <span className="text-[10px] font-black" style={{ color: '#006a60' }}>{language === 'ar' ? 'الوصفات' : 'Prescription'}</span>
                          </button>
                        )}
                        {/* Quick Doses */}
                        <button onClick={() => setView('pedDoseHistory')}
                          className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl active:scale-95 transition-all"
                          style={{ background: 'linear-gradient(135deg, #eef9f6, #cdeee7)', border: '1.5px solid #7fd4c6' }}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#006a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4"/>
                            <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
                            <line x1="12" y1="14" x2="12" y2="20"/>
                            <line x1="9" y1="17" x2="15" y2="17"/>
                          </svg>
                          <span className="text-[10px] font-black" style={{ color: '#006a60' }}>{language === 'ar' ? 'جرعات سريعة' : 'Quick Doses'}</span>
                        </button>
                      </div>
                    </div>
                  )}                  <div className="mt-2">
                      {/* Pediatric Preset Bar — بره الحاسبة في الهوم */}
                      {searchTerm.length === 0 && activeFiltersCount === 0 && (
                        <PediatricPresetBar
                          language={language}
                          onOpenCalc={(drugName) => { setPedCalcDrug(drugName); setPedCalcOpen(true); }}
                          medicines={medicines}
                        />
                      )}
                      {/* نعرض النتائج لو: في بحث أو في فلاتر نشطة */}
                      {(() => {
                        const minLen = textSearchMode === 'indication' ? 1 : 2;
                        const hasSearch = searchTerm.replace(/\s/g,"").length >= minLen;
                        const isDebouncing = searchTerm !== debouncedSearchTerm;
                        const hasResults = (hasSearch || activeFiltersCount > 0) && displayedMedicines.length > 0;
                        const noResults = (hasSearch || activeFiltersCount > 0) && !isDebouncing && displayedMedicines.length === 0;

                        // indication mode — عرض مقسم بالمادة الفعالة
                        if (hasResults && textSearchMode === 'indication' && indicationGroups.length > 0) return (
                          <div className="space-y-5">
                            {indicationGroups.map(({ sciName, medicines: groupMeds }) => (
                              <div key={sciName}>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">{sciName}</span>
                                  <span className="text-[9px] font-black bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">{groupMeds.length}</span>
                                </div>
                                <div className="space-y-2">
                                  {groupMeds.map(med => (
                                    <MedicineCard key={med.RegisterNumber} medicine={med}
                                      onShortPress={() => handleMedicineSelect(med)}
                                      onLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); else handleMedicineSelect(m); }}
                                      onFindAlternative={(m) => { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView('alternatives'); }}
                                      isFavorite={favorites.includes(med.RegisterNumber)}
                                      onToggleFavorite={toggleFavorite}
                                      t={t} language={language}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );

                        if (hasResults) {
                          const isAdmin = user?.role === 'admin';
                          const pagedMeds = isAdmin
                            ? displayedMedicines.slice(0, adminResultsPage * ADMIN_PAGE_SIZE)
                            : displayedMedicines;
                          const hasMore = isAdmin && pagedMeds.length < displayedMedicines.length;
                          return (
                            <>
                              {isAdmin && displayedMedicines.length > ADMIN_PAGE_SIZE && (
                                <p className="text-[10px] font-black text-slate-400 px-1 mb-2">
                                  {pagedMeds.length} / {displayedMedicines.length} نتيجة
                                </p>
                              )}
                              <ResultsList medicines={pagedMeds} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={(m) => { if (pharmacistMode) setQuickViewMedicine(m); else handleMedicineSelect(m); }} onFindAlternative={(m) => { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState="loaded" scrollContainerRef={scrollContainerRef} sortBy={sortBy} setSortBy={setSortBy as (v: string) => void} onImageClick={(m) => { if (m.imgBox) { if (scrollContainerRef.current) scrollPositions.current.set(view, scrollContainerRef.current.scrollTop); setPreviousView(view); setActiveImageViewer({ images: [m.imgBox, m.imgIndex1, m.imgIndex2].filter(Boolean) as string[], index: 0, title: m['Trade Name'], flags: [!!m.imgBox, !!m.imgIndex1, !!m.imgIndex2] }); } }} coveredAtcSet={showInsuranceBadge ? coveredAtcSet : undefined} coveredSciNorms={showInsuranceBadge ? coveredSciNorms : undefined} />
                              {hasMore && (
                                <button onClick={() => setAdminResultsPage(p => p + 1)}
                                  className="w-full mt-3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-sm active:scale-95 transition-all">
                                  تحميل المزيد ({displayedMedicines.length - pagedMeds.length} باقي)
                                </button>
                              )}
                            </>
                          );
                        }
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
                      {/* Recently viewed — inline chips بدل الزرار الكبير */}
                      {(searchTerm.replace(/\s/g,"").length === 0 || searchTerm !== debouncedSearchTerm) && activeFiltersCount === 0 && recentSearches.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {language === 'ar' ? 'آخر المشاهدات' : 'Recently Viewed'}
                            </span>
                            <button
                              onClick={() => setView('recentlyViewed')}
                              style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                            >
                              {language === 'ar' ? 'الكل ←' : 'See all →'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {recentSearches.slice(0, 6).map(med => (
                              <button
                                key={med.RegisterNumber}
                                onClick={() => { setSelectedMedicine(med); setView('details'); }}
                                style={{
                                  padding: '5px 12px', borderRadius: 20,
                                  background: 'var(--surface)', border: '1px solid var(--border)',
                                  fontSize: 11, fontWeight: 700, color: 'var(--text)',
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                  maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis',
                                  WebkitTapHighlightColor: 'transparent',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                }}
                              >
                                {med['Trade Name']}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
          return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={(d) => { if (scrollContainerRef.current) scrollPositions.current.set('insuranceSearch', scrollContainerRef.current.scrollTop); setSelectedInsurance(d); setView('insuranceDetails'); if (scrollContainerRef.current) setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; }, 50); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} stickyTop={0} searchBarFixedTop={'var(--header-h)' as any} />;
      }

      if (activeTab === 'settings') {
          // settings tab مش محتاج extra padding
          if (view === 'prescription') {
            if (user?.role !== 'admin') {
              return (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center text-4xl mb-4">📋</div>
                  <h2 className="text-lg font-black text-slate-700 dark:text-white mb-2">{language === 'ar' ? 'قريباً' : 'Coming Soon'}</h2>
                  <p className="text-sm font-bold text-slate-400">{language === 'ar' ? 'الوصفات الطبية ستكون متاحة قريباً' : 'Prescription feature coming soon'}</p>
                </div>
              );
            }
            return <PrescriptionView language={language} user={user} allMedicines={medicines} onBack={() => { setActiveTab('search'); setView('search'); }} />;
          }
      if (view === 'stockTracker') return <StockTracker allMedicines={medicines} t={t} language={language} onBack={() => setView('settings')} isAdmin={user?.role === 'admin'} />;
          if (view === 'orderList') return <OrderList allMedicines={medicines} t={t} language={language} onCountChange={setOrderCount} isAdmin={user?.role === 'admin'} />;
          return (
              <div className="space-y-4 anim-slide-up">
                  {/* Profile Card */}
                  {user ? (
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius: 20, padding: '20px', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 900, flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 900, color: '#fff', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{user.email}</p>
                          {(user as any).specialty && (
                            <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {(user as any).specialty}
                            </span>
                          )}
                        </div>
                        {!(user as any).specialty ? (
                          <button onClick={() => { setIsEditingSpecialty(true); setShowSpecialtyModal(true); }}
                            style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {language === 'ar' ? 'اختر تخصصك' : 'Set Specialty'}
                          </button>
                        ) : (
                          <button onClick={() => { setIsEditingSpecialty(true); setShowSpecialtyModal(true); }}
                            style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            {language === 'ar' ? 'تغيير' : 'Edit'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 20, border: '1.5px solid var(--border)' }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{language === 'ar' ? 'غير مسجل' : 'Not signed in'}</p>
                    </div>
                  )}

                  <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                      <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-subtle)', padding: '14px 16px 10px', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>{t('navSettings')}</h3>
                      <div>
                          <button onClick={() => setView('favorites')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{t('darkMode')}</span>
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                              style={{ width: 48, height: 26, background: theme === 'dark' ? 'var(--primary)' : '#c9cfcc', borderRadius: 13, position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 200ms ease' }}>
                              <div style={{ position: 'absolute', top: 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 200ms cubic-bezier(0.34,1.56,0.64,1)', left: theme === 'dark' ? 25 : 3 }} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, display: 'block' }}>{language === 'ar' ? 'بادج التأمين' : 'Insurance Badge'}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{language === 'ar' ? 'إظهار حالة التغطية في نتائج البحث' : 'Show coverage status in search results'}</span>
                            </div>
                            <button onClick={() => { const v = !showInsuranceBadge; setShowInsuranceBadge(v); localStorage.setItem('ps_insurance_badge', v ? 'true' : 'false'); }}
                              style={{ width: 48, height: 26, background: showInsuranceBadge ? 'var(--primary)' : '#c9cfcc', borderRadius: 13, position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 200ms ease', flexShrink: 0 }}>
                              <div style={{ position: 'absolute', top: 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 200ms cubic-bezier(0.34,1.56,0.64,1)', left: showInsuranceBadge ? 25 : 3 }} />
                            </button>
                          </div>
                          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
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
                          {user && <button onClick={logout} style={{ width: '100%', padding: '14px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 14, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>{t('logout')}</button>}
                      </div>
                      </div>
                  </div>

                  {/* Feedback */}
                  {user && (
                    <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(`[Easy Drug Report]\nUser: ${user.username || 'Unknown'}\nEmail: ${user.email || 'N/A'}\nSpecialty: ${(user as any).specialty || 'N/A'}\n\nDescribe the issue or medicine to add:\n`);
                          if (Capacitor.isNativePlatform()) { window.open(`https://wa.me/966550806894?text=${msg}`, '_system'); }
                          else { window.open(`https://wa.me/966550806894?text=${msg}`, '_blank', 'noopener,noreferrer'); }
                        }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <div style={{ width: 40, height: 40, background: '#25d366', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </div>
                        <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                          <span style={{ display: 'block', fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Report Error / Add Medicine</span>
                          <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Send report via WhatsApp</span>
                        </div>
                      </button>
                    </div>
                  )}
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
          ? <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />
          : <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setActiveTab('search'); setView('search'); }} />
        }
      </div>
    );
  }

  return (
    <div className="bg-slate-200 dark:bg-slate-950 min-h-full flex justify-center"><div className="bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 h-full flex flex-col overflow-hidden relative min-h-0 w-full max-w-[480px] shadow-2xl">
      {specialtyModalEl}
      {/* ── Notification Permission Prompt ── */}
      

      <Header
        ref={headerRef}
        title="Easy Drug"
        showBack={(view !== 'search') || activeTab === 'insurance'}
        onBack={handleBack}
        t={t}
        onLoginClick={() => { setPreviousView(view); setView('login'); }}
        onAdminClick={()=>setView('admin')}
        onPediatricCalcClick={() => { setPedCalcDrug(undefined); setPedCalcOpen(true); }}
        onNotificationsClick={() => { setPreviousView(view); setPreviousTab(activeTab); setView('notifications'); }}
        onSettingsClick={(target?: string) => { setActiveTab('settings'); if (target === 'stockTracker') { setView('stockTracker'); } else if (target === 'orderList') { refreshOrderCount(); setView('orderList'); } else { setView('settings'); restoreScroll('settings'); } }}
        view={view}
        unreadCount={notifications.filter(n => !n.isRead).length}
        isLoading={authLoading || (isMedicinesLoading && medicines.length === 0)}
        searchBarVisible={activeTab === 'search' && !['details', 'alternatives', 'login', 'register', 'admin', 'imageView'].includes(view)}
        style={(isKeyboardOpen && activeTab === 'search') ? { opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s ease' } as any : undefined}
      />

      {/* SearchBar -- fixed under header using CSS variable */}
      {activeTab === 'search' && !['details', 'alternatives', 'login', 'register', 'admin', 'imageView', 'notifications', 'favorites', 'settings', 'stockTracker', 'orderList', 'aiHistory', 'indicationSearch', 'pedDoseHistory', 'recentlyViewed'].includes(view) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[59] px-3 w-full max-w-[480px]"
          style={{ top: isKeyboardOpen ? 0 : `var(--header-h)` }}
        >
          <div className="bg-light-bg dark:bg-dark-bg pb-1 pt-1">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              textSearchMode={textSearchMode}
              setTextSearchMode={setTextSearchMode}
              isSearchActive={searchTerm.length > 0}
onClearSearch={handleClearSearch}
              onForceSearch={() => { setView('results'); }}
              onBarcodeScanClick={()=>{}}
              fuzzyEnabled={fuzzyEnabled}
              onToggleFuzzy={() => setFuzzyEnabled(v => !v)}
              t={t}
              activeFiltersCount={activeFiltersCount}
              onOpenFilters={() => setIsFilterModalOpen(true)}
              sortBy={sortBy}
              setSortBy={setSortBy}
              language={language}
              onInsuranceClick={() => { setActiveTab('insurance'); setView('insuranceSearch'); }}
              isSearching={false}
              recentSearches={recentSearches.slice(0, 5).map(m => ({ name: m['Trade Name'], id: m.RegisterNumber }))}
              onSelectRecent={(name) => { setSearchTerm(name); setView('results'); }}
            />
          </div>
        </div>
      )}

      <main id="main-scroll-container" ref={scrollContainerRef} onScroll={() => { const el = document.activeElement as HTMLElement; if (el?.tagName !== "INPUT" && el?.tagName !== "TEXTAREA") el?.blur?.(); }} className="flex-grow min-h-0 mx-auto px-4 overflow-y-auto w-full max-w-[480px] no-scrollbar" style={{ paddingTop: isKeyboardOpen ? 56 : (activeTab === 'search' && !['details', 'alternatives', 'login', 'register', 'admin', 'imageView', 'notifications', 'favorites', 'settings', 'stockTracker', 'orderList', 'aiHistory', 'indicationSearch', 'pedDoseHistory', 'recentlyViewed'].includes(view)) ? `calc(var(--header-h) + 56px)` : `calc(var(--header-h) + 8px)`, paddingBottom: isKeyboardOpen ? `${Math.max(keyboardHeight, 16) + 16}px` : (compareList.length > 0 && !showCompare ? 'calc(120px + env(safe-area-inset-bottom))' : 'calc(24px + env(safe-area-inset-bottom))'), transition: 'padding-bottom 0.2s ease', WebkitOverflowScrolling: "touch", overscrollBehavior: "none", touchAction: isKeyboardOpen ? 'none' : 'auto', scrollPaddingTop: `var(--header-h)` } as any} >
          <div key={skipNextViewKey ? 'stable' : view}>
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
        skipOpenAnimation={sheetSkipAnim}
        onClose={() => setSheetMedicine(null)}
      >
        {sheetMedicine && (
          <React.Suspense fallback={null}>
          <MedicineDetail
            medicine={sheetMedicine}
            insuranceData={insuranceData}
            allMedicines={undefined}
            t={t}
            language={language}
            isFavorite={favorites.includes(sheetMedicine.RegisterNumber)}
            onToggleFavorite={toggleFavorite}
            user={user}
            onEdit={(m) => { setSelectedMedicine(m); setSheetMedicine(null); setIsEditModalOpen(true); }}
            onOpenAssistant={undefined}
            onOpenInteractions={undefined}
            onOpenDoseCalc={() => { setPedCalcDrug(sheetMedicine?.['Scientific Name'] as string || sheetMedicine?.['Trade Name'] as string || undefined); setPedCalcOpen(true); }}
            onImageZoom={(imgs, idx, title, flags) => { prevSheetMedicine.current = sheetMedicine; setPreviousView(view); setActiveImageViewer({ images: imgs, index: idx, title, flags }); }}
            onFindAlternative={(m) => { setSheetMedicine(null); setPreviousView(view); setSelectedMedicine(m); scrollPositions.current.delete('alternatives'); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; setView('alternatives'); }}
            onShare={handleShareMedicine}
            onAskGemini={handleAskGemini}
            onToggleCompare={toggleCompare}
            isInCompare={compareList.some(m => m.RegisterNumber === sheetMedicine.RegisterNumber)}
            onOpenClinical={() => setClinicalModal({ open: true, medicine: sheetMedicine })}
          />
          </React.Suspense>
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
              setView('details');
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
      {activeImageViewer && (
        <div className="fixed inset-0 z-[9999]">
          <ImageViewer images={activeImageViewer.images} initialIndex={activeImageViewer.index} title={activeImageViewer.title} t={t} indexFlags={activeImageViewer.flags} onBack={() => {
            setActiveImageViewer(null);
            if (prevSheetMedicine.current) {
              setSheetSkipAnim(true);
              setSheetMedicine(prevSheetMedicine.current);
              prevSheetMedicine.current = null;
            }
            const targetView = (previousView || 'details') as View;
            // لو رجعنا لـ list view (results/search/alternatives/favorites) منع الـ remount animation
            const isListView = ['results', 'search', 'alternatives', 'favorites'].includes(targetView);
            if (isListView) {
              setSkipNextViewKey(true);
              setView(targetView);
              requestAnimationFrame(() => requestAnimationFrame(() => {
                setSkipNextViewKey(false);
                const savedPos = scrollPositions.current.get(targetView);
                if (scrollContainerRef.current && savedPos !== undefined) {
                  scrollContainerRef.current.scrollTop = savedPos;
                }
              }));
            } else {
              setSkipNextViewKey(false);
              setView(targetView);
              requestAnimationFrame(() => requestAnimationFrame(() => {
                const savedPos = scrollPositions.current.get(targetView);
                if (scrollContainerRef.current && savedPos !== undefined) {
                  scrollContainerRef.current.scrollTop = savedPos;
                }
              }));
            }
          }} />
        </div>
      )}

      {isEditModalOpen && <EditMedicineModal isOpen={isEditModalOpen} onClose={()=>{ setIsEditModalOpen(false); if(selectedMedicine) openSheet(selectedMedicine, true); }} medicine={selectedMedicine} onSave={async (m) => { await handleSaveMedicine(m); setIsEditModalOpen(false); openSheet(m, true); }} t={t} />}

      {/* Paywall Modal */}
      {showPaywall && (
        <PlansPage
          language={language}
          onClose={() => setShowPaywall(false)}
          currentPlan={subscription.plan}
          expiresAt={subscription.expiresAt}
          daysLeft={subscription.daysLeft}
          onRestore={async () => {
            // TODO: Google Play restore
          }}
          onSubscribe={async (plan) => {
            try {
              const { getFunctions, httpsCallable } = await import('firebase/functions');
              const fns = getFunctions();
              const verifyPurchase = httpsCallable(fns, 'verifyPurchase');
              const productId = plan === 'yearly' ? 'easydrug_premium_yearly' : 'easydrug_premium_monthly';
              // TODO: استبدل 'GOOGLE_PLAY_TOKEN' بالـ token الجاي من Google Play SDK
              await verifyPurchase({ purchaseToken: 'GOOGLE_PLAY_TOKEN', productId });
              await updateUser({ ...user!, role: 'premium', subscriptionPlan: plan, subscriptionStatus: 'active' });
              setShowPaywall(false);
            } catch (e) {
              console.error('Purchase error:', e);
            }
          }}
        />
      )}

      {/* Onboarding — مرة واحدة بس */}
      {showOnboarding && (
        <OnboardingOverlay
          language={language}
          onDone={() => setShowOnboarding(false)}
        />
      )}

      {/* ── Insurance Coverage Sheet — App level (above overflow containers) ── */}
      {insuranceSheetMedicine && (() => {
        const policies = getInsurancePolicies(insuranceSheetMedicine, insuranceData);
        const isCov = policies.length > 0;
        const ar = language === 'ar';
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setInsuranceSheetMedicine(null)}>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: '24px 24px 0 0', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)', animation: 'sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--ink-20)' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isCov ? 'rgba(21,128,61,0.1)' : 'rgba(190,18,60,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isCov ? '#15803d' : '#be123c'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>{isCov ? <path d="M9 12l2 2 4-4"/> : <><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></>}</svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>{ar ? 'التغطية التأمينية' : 'Insurance Coverage'}</p>
                    <p style={{ fontSize: 11, color: isCov ? '#15803d' : '#be123c', fontWeight: 700, marginTop: 2, margin: 0 }}>{isCov ? `${policies.length} ${ar ? 'نتيجة' : 'forms'}` : (ar ? 'غير مغطى' : 'Not covered')}</p>
                  </div>
                </div>
                <button onClick={() => setInsuranceSheetMedicine(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ overflowY: 'auto', padding: '10px 16px 20px', flex: 1 }} className="no-scrollbar">
                {!isCov ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(190,18,60,0.06)', borderRadius: 14, border: '1px solid rgba(190,18,60,0.15)' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#be123c', margin: 0 }}>{ar ? 'غير مدرج في قائمة NPHIES' : 'Not in the NPHIES formulary'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.15)', borderRadius: 14, padding: '10px 14px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ar ? 'المادة الفعالة' : 'Active Ingredient'}</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', direction: 'ltr', margin: 0 }}>{policies[0].scientificName}</p>
                      {policies[0].drugClass && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>{policies[0].drugClass}{policies[0].drugSubclass ? ` · ${policies[0].drugSubclass}` : ''}</p>}
                    </div>
                    {policies[0].indication && (
                      <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '10px 14px' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{ar ? 'الاستخدام' : 'Indication'}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, margin: 0 }}>{policies[0].indication}{policies[0].icd10Code && <span style={{ marginRight: 6, marginLeft: 6, fontSize: 10, fontWeight: 800, color: 'var(--text-subtle)', background: 'var(--surface)', padding: '2px 7px', borderRadius: 6, direction: 'ltr', display: 'inline-block' }}>{policies[0].icd10Code}</span>}</p>
                      </div>
                    )}
                    <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '10px 14px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{ar ? 'التركيزات' : 'Strengths'}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{Array.from(new Set(policies.map(p => `${p.strength} ${p.strengthUnit}`.trim()).filter(Boolean))).map((s, i) => <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: 'rgba(21,128,61,0.08)', padding: '3px 10px', borderRadius: 20, direction: 'ltr' }}>{s}</span>)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ad Banner — free users only */}
      <AdBanner isPremium={subscription.isPremium} />

    </div></div>
    );
  };
export default App;
