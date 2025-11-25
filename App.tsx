
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, InsuranceSearchMode, Cosmetic } from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import AddDataView from './components/AddDataView';
import { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } from './data/data'; 
import { INITIAL_INSURANCE_DATA } from './data/insurance-data'; 
import { CUSTOM_INSURANCE_DATA } from './data/custom-insurance-data';
import { INITIAL_COSMETICS_DATA } from './data/cosmetics-data'; 
import MedicineDetail from './components/MedicineDetail';
import CosmeticDetail from './components/CosmeticDetail';
import { translations, TranslationKeys } from './translations';
import FloatingAssistantButton from './components/FloatingAssistantButton';
import AssistantModal from './components/AssistantModal';
import { groupPharmaceuticalForms } from './utils/formHelpers';
import AlternativesView from './components/AlternativesView';
import BottomNavBar from './components/BottomNavBar';
import DatabaseIcon from './components/icons/DatabaseIcon';
import SortControls from './components/SortControls';
import FilterButton from './components/FilterButton';
import FilterModal from './components/FilterModal';
import HistoryIcon from './components/icons/HistoryIcon';
import ChatHistoryView from './components/ChatHistoryView';
import InsuranceSearchView from './components/InsuranceSearchView';
import AddInsuranceDataView from './components/AddInsuranceDataView';
import AddCosmeticsDataView from './components/AddCosmeticsDataView';
import CosmeticsView from './components/CosmeticsView';
import PrescriptionListView from './components/PrescriptionListView';
import PrescriptionView from './components/PrescriptionView';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import { useAuth } from './components/auth/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import AdminIcon from './components/icons/AdminIcon';
import StarIcon from './components/icons/StarIcon';
import FavoritesView from './components/FavoritesView';
import { isAIAvailable } from './geminiService';
import { db, messaging, FIREBASE_DISABLED, auth } from './firebase';
import { collection, getDocs, updateDoc, doc, setDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { Part } from '@google/genai';

// Enhanced Normalization to handle Raw JSON keys properly and prevent white screens
const normalizeProduct = (product: any): Medicine => {
  // Strict safety check: if product is null, undefined, or not an object (including arrays), return a safe fallback.
  if (!product || typeof product !== 'object' || Array.isArray(product)) {
      return {
        'RegisterNumber': `invalid-${Math.random().toString(36).slice(2, 9)}`,
        'Trade Name': 'Invalid Item',
        'Scientific Name': '',
        'Product type': 'Human',
        'Public price': '0',
        'PharmaceuticalForm': '',
        'Strength': '',
        'StrengthUnit': '',
        'PackageSize': '',
        'PackageTypes': '',
        'Legal Status': '',
        'Manufacture Name': '',
        'Manufacture Country': '',
        'Storage Condition Arabic': '',
        'Storage conditions': '',
        'Main Agent': '',
        'ReferenceNumber': '',
        'Old register Number': '',
        'DrugType': '',
        'Sub-Type': '',
        'AdministrationRoute': '',
        'AtcCode1': '',
        'AtcCode2': '',
        'Size': '',
        'SizeUnit': '',
        'Product Control': '',
        'Distribute area': '',
        'shelfLife': '',
        'Marketing Company': '',
        'Marketing Country': '',
        'Secondry package  manufacture': '',
        'Secosnd Agent': '',
        'Third agent': '',
        'Description Code': '',
        'Authorization Status': '',
        'Last Update': '',
      };
  }

  let productType = product['Product type'];
  
  // Handle Supplement Raw Data Keys Logic
  if (!productType) {
    if (product.DrugType === 'Health' || product.DrugType === 'Herbal' || product.DrugTypeAR) {
      productType = 'Supplement';
    } else {
      productType = 'Human'; 
    }
  }

  // Handle Price Variations
  const price = product['Public price'] || product.Price || 'N/A';

  // Handle Name Variations (Raw JSON keys vs App keys)
  const tradeName = product['Trade Name'] || product.TradeName || 'Unknown';
  const scientificName = product['Scientific Name'] || product.ScientificName || 'Unknown';
  
  // Handle Form Variations
  const form = product.PharmaceuticalForm || product.DoesageForm || 'Unknown';
  
  // Handle Legal Status
  const legalStatus = product['Legal Status'] || product.LegalStatus || product.LegalStatusEn || 'Unknown';

  // Handle Manufacturer
  const manufacturer = product['Manufacture Name'] || product.ManufacturerNameEN || 'Unknown';
  const manufacturerCountry = product['Manufacture Country'] || product.ManufacturerCountry || 'Unknown';

  // Helper to safely stringify and trim
  const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val).trim();

  return {
    'RegisterNumber': safeStr(product.RegisterNumber || product.Id || `unknown-${Math.random().toString(36).slice(2, 9)}`),
    'Trade Name': safeStr(tradeName),
    'Scientific Name': safeStr(scientificName),
    'Product type': safeStr(productType),
    'Public price': safeStr(price),
    'PharmaceuticalForm': safeStr(form),
    'Strength': safeStr(product.Strength || ''),
    'StrengthUnit': safeStr(product.StrengthUnit || product.StrengthUnitAR || ''),
    'PackageSize': safeStr(product.PackageSize || ''),
    'PackageTypes': safeStr(product.PackageTypes || product.PackageType || ''),
    'Legal Status': safeStr(legalStatus), 
    'Manufacture Name': safeStr(manufacturer),
    'Manufacture Country': safeStr(manufacturerCountry),
    'Storage Condition Arabic': safeStr(product['Storage Condition Arabic'] || product.StorageConditions || 'Unknown'),
    'Storage conditions': safeStr(product['Storage conditions'] || product.StorageConditions || 'Unknown'),
    'Main Agent': safeStr(product['Main Agent'] || product.AgentName || product.Agent || 'Unknown'),
    'ReferenceNumber': safeStr(product.ReferenceNumber || ''),
    'Old register Number': safeStr(product['Old register Number'] || ''),
    'DrugType': safeStr(product.DrugType || ''),
    'Sub-Type': safeStr(product['Sub-Type'] || ''),
    'AdministrationRoute': safeStr(product.AdministrationRoute || product.AdministrationRouteAr || ''),
    'AtcCode1': safeStr(product.AtcCode1 || ''),
    'AtcCode2': safeStr(product.AtcCode2 || ''),
    'Size': safeStr(product.Size || ''),
    'SizeUnit': safeStr(product.SizeUnit || ''),
    'Product Control': safeStr(product['Product Control'] || product.ProductControl || ''),
    'Distribute area': safeStr(product['Distribute area'] || product.DistributionArea || ''),
    'shelfLife': safeStr(product.shelfLife || product.ShelfLife || ''),
    'Marketing Company': safeStr(product['Marketing Company'] || product.CompanyName || ''),
    'Marketing Country': safeStr(product['Marketing Country'] || product.CompanyCountryEn || ''),
    'Secondry package  manufacture': safeStr(product['Secondry package  manufacture'] || product.SecondaryPackaging || ''),
    'Secosnd Agent': safeStr(product['Secosnd Agent'] || product.AddtionalAgentName || ''),
    'Third agent': safeStr(product['Third agent'] || ''),
    'Description Code': safeStr(product['Description Code'] || ''),
    'Authorization Status': safeStr(product['Authorization Status'] || product.AuthorizationStatus || ''),
    'Last Update': safeStr(product['Last Update'] || ''),
  };
};

// Insurance Normalization
const normalizeInsuranceDrug = (item: any): InsuranceDrug => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return {
        id: `ins-invalid-${Math.random()}`,
        indication: '', icd10Code: '', drugClass: '', drugSubclass: '', scientificName: '',
        atcCode: '', form: '', strength: '', strengthUnit: '', notes: ''
      };
  }
  const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val).trim();
  return {
    id: safeStr(item.id || `ins-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
    indication: safeStr(item.indication || item.INDICATION || ''),
    icd10Code: safeStr(item.icd10Code || item['ICD 10 CODE'] || ''),
    drugClass: safeStr(item.drugClass || item['DRUG PHARMACOLOGICAL CLASS '] || ''),
    drugSubclass: safeStr(item.drugSubclass || item['DRUG PHARMACOLOGICAL SUBCLASS'] || ''),
    scientificName: safeStr(item.scientificName || item['SCIENTIFIC NAME '] || ''),
    atcCode: safeStr(item.atcCode || item['ATC CODE'] || ''),
    form: safeStr(item.form || item['PHARMACEUTICAL FORM '] || ''),
    strength: safeStr(item.strength || item['STRENGTH '] || ''),
    strengthUnit: safeStr(item.strengthUnit || item['STRENGTH UNIT '] || ''),
    notes: safeStr(item.notes || item.NOTES || ''),
    administrationRoute: safeStr(item.administrationRoute || item['ADMINISTRATION ROUTE'] || ''),
    substitutable: safeStr(item.substitutable || item['SUBSTITUTABLE'] || ''),
    prescribingEdits: safeStr(item.prescribingEdits || item['PRESCRIBING EDITS'] || ''),
    mddAdults: safeStr(item.mddAdults || item['MDD ADULTS'] || ''),
    mddPediatrics: safeStr(item.mddPediatrics || item['MDD PEDIATRICS'] || ''),
    appendix: safeStr(item.appendix || item['APPENDIX'] || ''),
    patientType: safeStr(item.patientType || item['PATIENT TYPE'] || ''),
    descriptionCode: safeStr(item.descriptionCode || item['DESCRIPTION CODE \n(ACTIVE INGREDIENT- STRENGTH-DOSAGE FORM)'] || ''),
    sfdaRegistrationStatus: safeStr(item.sfdaRegistrationStatus || item['SFDA REGISTRATION STATUS'] || ''),
  };
};

// Cosmetics Normalization
const normalizeCosmetic = (item: any): Cosmetic => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return {
            id: `cos-invalid-${Math.random()}`,
            BrandName: '', SpecificName: '', SpecificNameAr: '', FirstSubCategoryAr: '', FirstSubCategoryEn: '', SecondSubCategoryAr: '', SecondSubCategoryEn: '', manufacturerNameEn: '', manufacturerCountryAr: '', manufacturerCountryEn: '', "Active ingredient": ''
        };
    }
    const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val).trim();
    return {
        id: safeStr(item.id || `cosmetic-${Date.now()}-${Math.random()}`),
        BrandName: safeStr(item.BrandName || ''),
        SpecificName: safeStr(item.SpecificName || ''),
        SpecificNameAr: safeStr(item.SpecificNameAr || ''),
        FirstSubCategoryAr: safeStr(item.FirstSubCategoryAr || ''),
        FirstSubCategoryEn: safeStr(item.FirstSubCategoryEn || ''),
        SecondSubCategoryAr: safeStr(item.SecondSubCategoryAr || ''),
        SecondSubCategoryEn: safeStr(item.SecondSubCategoryEn || ''),
        manufacturerNameEn: safeStr(item.manufacturerNameEn || ''),
        manufacturerCountryAr: safeStr(item.manufacturerCountryAr || ''),
        manufacturerCountryEn: safeStr(item.manufacturerCountryEn || ''),
        "Active ingredient": safeStr(item["Active ingredient"] || ''),
        "Key Ingredients": safeStr(item["Key Ingredients"] || ''),
        Highlights: safeStr(item.Highlights || ''),
    };
}

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';
const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache';

const App: React.FC = () => {
  const { user, requestAIAccess, isLoading: isAuthLoading } = useAuth();

  // Notification Setup
  useEffect(() => {
    if (!FIREBASE_DISABLED && messaging) {
      const requestNotificationPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const vapidKey = "BBMmrZJ0Gz7VzBfX9lZq5Z8zZzZzZzZzZzZzZzZzZzZzZzZzZzZ"; // Placeholder
            
            if (vapidKey.includes('ZzZz')) {
                console.warn("⚠️ WARNING: VAPID Key is a placeholder. Notifications will likely fail. Generate a new key pair in Firebase Console > Project Settings > Cloud Messaging > Web Config.");
            }

            // Get Token
            const token = await getToken(messaging!, {
              vapidKey: vapidKey
            });
            console.log('Notification Token:', token);
            
            // IMPORTANT: Save token to Firestore if user is logged in
            if (auth.currentUser && token) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(token)
                }).catch(async (e) => {
                    // If doc doesn't exist, set it
                    if (e.code === 'not-found') {
                        await setDoc(userRef, { fcmTokens: [token] }, { merge: true });
                    }
                });
            }
          }
        } catch (error) {
          console.log('Notification permission denied or error:', error);
        }
      };

      requestNotificationPermission();

      // Foreground message handler
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        if (payload.notification) {
            new Notification(payload.notification.title || 'Notification', {
                body: payload.notification.body,
                icon: '/logo.png'
            });
        }
      });

      return () => unsubscribe();
    }
  }, [user]); // Re-run when user logs in to save token

  // Initialize with Persistent Data (Cache first, then Static)
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
     let cachedMeds: Medicine[] = [];
     try {
         const cached = localStorage.getItem(MEDICINES_CACHE_KEY);
         if (cached) {
             const parsed = JSON.parse(cached);
             if (Array.isArray(parsed)) {
                 // CRITICAL: Force normalize on cached data to fix corrupted entries from previous versions
                 cachedMeds = parsed.map(normalizeProduct);
             }
         }
     } catch (e) {
         console.error("Failed to load medicines from cache", e);
     }
     
     const initialStaticMeds = [...MEDICINE_DATA, ...SUPPLEMENT_DATA_RAW.map(normalizeProduct)];
     
     if (cachedMeds.length > 0) {
         return cachedMeds; 
     }
     
     return initialStaticMeds;
  });
  
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>(() => {
     // Also normalize initial insurance data to avoid crash if static files have nulls
     return [...INITIAL_INSURANCE_DATA, ...CUSTOM_INSURANCE_DATA].map(normalizeInsuranceDrug);
  });
  
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>(() => {
      try {
          const cached = localStorage.getItem(COSMETICS_CACHE_KEY);
          if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                  // CRITICAL: Force normalize on cache load
                  return parsed.map(normalizeCosmetic);
              }
          }
      } catch (e) {
          console.error("Failed to load cosmetics from cache", e);
      }
      // Normalize initial cosmetic data
      return INITIAL_COSMETICS_DATA.map(normalizeCosmetic);
  });
  
  // Smart Merge: Fetch updates from Firebase and merge with local data
  useEffect(() => {
    if (FIREBASE_DISABLED) return;

    const syncMedicines = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'medicines'));
            if (querySnapshot.empty) return;

            const firestoreMap = new Map<string, Medicine>();
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const regNum = data.RegisterNumber || doc.id; 
                firestoreMap.set(regNum, normalizeProduct({ ...data, RegisterNumber: regNum }));
            });

            setMedicines(prevMedicines => {
                const mergedMap = new Map<string, Medicine>();
                prevMedicines.forEach(med => mergedMap.set(med.RegisterNumber, med));
                firestoreMap.forEach((med, key) => mergedMap.set(key, med));
                const mergedArray = Array.from(mergedMap.values());
                
                try {
                    localStorage.setItem(MEDICINES_CACHE_KEY, JSON.stringify(mergedArray));
                } catch (e) {
                    console.error("Failed to cache merged medicines", e);
                }
                return mergedArray;
            });
        } catch (e) {
            console.error("Failed to sync medicines from Firebase:", e);
        }
    };

    if (navigator.onLine) {
        syncMedicines();
    }
  }, []);

  // Sync Cosmetics from Firebase
  useEffect(() => {
    if (FIREBASE_DISABLED) return;

    const syncCosmetics = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'cosmetics'));
            if (querySnapshot.empty) return;

            const firestoreMap = new Map<string, Cosmetic>();
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const normalized = normalizeCosmetic({ ...data, id: data.id || doc.id });
                firestoreMap.set(normalized.id, normalized);
            });

            setCosmetics(prevCosmetics => {
                const mergedMap = new Map<string, Cosmetic>();
                prevCosmetics.forEach(c => mergedMap.set(c.id, c));
                firestoreMap.forEach((c, key) => mergedMap.set(key, c));
                const mergedArray = Array.from(mergedMap.values());
                
                try {
                    localStorage.setItem(COSMETICS_CACHE_KEY, JSON.stringify(mergedArray));
                } catch (e) {
                    console.error("Failed to cache cosmetics", e);
                }
                return mergedArray;
            });
        } catch (e) {
            console.error("Failed to sync cosmetics from Firebase:", e);
        }
    };

    if (navigator.onLine) {
        syncCosmetics();
    }
  }, []);
  
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [view, setView] = useState<View>('search');

  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [textSearchMode, setTextSearchMode] = useState<TextSearchMode>('tradeName');
  const [filters, setFilters] = useState<Filters>({
    productType: 'all',
    priceMin: '',
    priceMax: '',
    pharmaceuticalForm: '',
    manufactureName: [],
    legalStatus: '',
  });
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [forceSearch, setForceSearch] = useState(false);
  
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [language, setLanguage] = useState<Language>('ar');
  
  // Cosmetics Search State (Lifted to App to persist on back navigation)
  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  const [cosmeticsSelectedBrand, setCosmeticsSelectedBrand] = useState('');

  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [assistantContextMedicine, setAssistantContextMedicine] = useState<Medicine | null>(null);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState('');

  const [sourceMedicine, setSourceMedicine] = useState<Medicine | null>(null);
  const [alternativesResults, setAlternativesResults] = useState<{ direct: Medicine[], therapeutic: Medicine[] } | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');
  
  // Edit Modal State for Main App (Admin only)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isEditMedicineModalOpen, setIsEditMedicineModalOpen] = useState(false);

  const [editingCosmetic, setEditingCosmetic] = useState<Cosmetic | null>(null);
  const [isEditCosmeticModalOpen, setIsEditCosmeticModalOpen] = useState(false);
  
  const scrollPositionRef = useRef(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
        if (localStorage.getItem('theme') === 'dark') {
            return 'dark';
        }
    } catch (e) { /* ignore */ }
    return 'light';
  });
  
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (e) {
      console.error("Failed to load favorites from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  const toggleFavorite = (medicineId: string) => {
    setFavorites(prev => 
      prev.includes(medicineId) 
        ? prev.filter(id => id !== medicineId)
        : [...prev, medicineId]
    );
  };
  
  const favoriteMedicines = useMemo(() => 
    medicines.filter(m => favorites.includes(m.RegisterNumber)), 
  [medicines, favorites]);

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  }, [theme]);

  useEffect(() => {
    const isModalOpen = isAssistantModalOpen || isFilterModalOpen || isBarcodeScannerOpen || isEditMedicineModalOpen || isEditCosmeticModalOpen;
    if (isModalOpen) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }
  }, [isAssistantModalOpen, isFilterModalOpen, isBarcodeScannerOpen, isEditMedicineModalOpen, isEditCosmeticModalOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('chatHistory');
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load chat history from localStorage", e);
      setConversations([]);
    }
  }, []);

  const t: TFunction = useCallback((key: TranslationKeys, replacements?: { [key: string]: string | number }) => {
    let translation = translations[language][key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
      });
    }
    return translation;
  }, [language]);

  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.productType !== 'all') count++;
    if (filters.priceMin !== '' || filters.priceMax !== '') count++;
    if (filters.pharmaceuticalForm !== '') count++;
    if (filters.manufactureName.length > 0) count++;
    if (filters.legalStatus !== '') count++;
    return count;
  }, [filters]);

  const isSearchActive = useMemo(() => {
    // Logic Update: Only trigger if effective length (excluding %) is >= 3
    const effectiveSearchTerm = searchTerm.replace(/%/g, '').trim();
    return Object.values(filters).some(val => Array.isArray(val) ? val.length > 0 : !!val && val !== 'all') || effectiveSearchTerm.length >= 3 || forceSearch;
  }, [searchTerm, filters, forceSearch]);

  useEffect(() => {
    if (!isSearchActive) {
      if (view === 'results') {
          setView('search');
      }
      setSearchResults([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const searchTerms = lowerSearchTerm.split(/\s+/).filter(Boolean);
    
    const numberRegex = /^\d+(\.\d+)?(mg|g|ml|%|iu|mcg|ug)?$/i;
    const unitRegex = /^(mg|g|ml|%|iu|mcg|ug)$/i;

    const numberTerms = searchTerms.filter(term => numberRegex.test(term));
    const textTerms = searchTerms.filter(term => !numberRegex.test(term) && !unitRegex.test(term));
    
    const textQuery = textTerms.join(' ');
    
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    let searchRegex: RegExp | null = null;
    if (textQuery) {
        // Logic Update: Check for Wildcard (%)
        const hasWildcard = textQuery.includes('%');
        const regexPatternParts = textQuery.split('%').map(escapeRegExp);
        
        // If user typed %, use .* logic (wildcard). 
        // If NOT, enforce Starts With (^).
        let regexPattern = regexPatternParts.join('.*');
        
        if (!hasWildcard) {
            regexPattern = '^' + regexPattern;
        }

        try {
            searchRegex = new RegExp(regexPattern, 'i');
        } catch (e) {
            // Fallback just in case regex fails
            searchRegex = new RegExp(escapeRegExp(textQuery), 'i');
        }
    }

    const filtered = medicines.filter(med => {
      if (filters.productType === 'medicine' && med['Product type'] !== 'Human') return false;
      if (filters.productType === 'supplement' && med['Product type'] !== 'Supplement') return false;
      const price = parseFloat(med['Public price']);
      const minPrice = parseFloat(filters.priceMin);
      const maxPrice = parseFloat(filters.priceMax);
      if (!isNaN(minPrice) && (isNaN(price) || price < minPrice)) return false;
      if (!isNaN(maxPrice) && (isNaN(price) || price > maxPrice)) return false;
      if (filters.pharmaceuticalForm && med.PharmaceuticalForm !== filters.pharmaceuticalForm) return false;
      if (filters.manufactureName.length > 0 && !filters.manufactureName.includes(med['Manufacture Name'])) return false;
      if (filters.legalStatus && med['Legal Status'] !== filters.legalStatus) return false;

      if (searchTerms.length > 0) {
        const tradeName = String(med['Trade Name']).toLowerCase();
        const scientificName = String(med['Scientific Name']).toLowerCase();
        const strength = String(med.Strength).toLowerCase();
        
        if (numberTerms.length > 0) {
            const allNumbersMatch = numberTerms.every(num => {
                const cleanNum = num.replace(/(mg|g|ml|%|iu|mcg|ug)/g, ''); 
                if (textSearchMode === 'scientificName') {
                     return strength.includes(cleanNum);
                }
                return strength.includes(cleanNum) || tradeName.includes(cleanNum);
            });
            if (!allNumbersMatch) return false;
        }

        if (searchRegex) {
            let matchFound = false;
            if (textSearchMode === 'scientificName') {
                matchFound = searchRegex.test(scientificName);
            } else if (textSearchMode === 'tradeName') {
                matchFound = searchRegex.test(tradeName);
            } else {
                matchFound = searchRegex.test(tradeName) || searchRegex.test(scientificName);
            }
            if (!matchFound) return false;
        }
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
        if (sortBy === 'priceAsc') return parseFloat(a['Public price']) - parseFloat(b['Public price']);
        if (sortBy === 'priceDesc') return parseFloat(b['Public price']) - parseFloat(a['Public price']);
        if (sortBy === 'scientificName') return a['Scientific Name'].localeCompare(b['Scientific Name']);

        if (textSearchMode === 'scientificName') {
             return a['Trade Name'].localeCompare(b['Trade Name']);
        }

        const aTradeName = String(a['Trade Name']).toLowerCase();
        const bTradeName = String(b['Trade Name']).toLowerCase();
        
        if (textQuery) {
            const prefix = textQuery.replace(/%/g, '');
            const aStarts = aTradeName.startsWith(prefix);
            const bStarts = bTradeName.startsWith(prefix);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
        }

        return aTradeName.localeCompare(bTradeName);
    });

    setSearchResults(sorted);
    if (isSearchActive && view === 'search') {
      setView('results');
    } else if (!isSearchActive && view === 'results') {
      setView('search');
    }
  }, [isSearchActive, searchTerm, filters, textSearchMode, medicines, view, sortBy, forceSearch]);

  const handleImportData = (data: any[]): void => {
    try {
        const normalizedData = data.map(normalizeProduct);
        
        setMedicines(prevMeds => {
            // Deduplicate based on RegisterNumber
            const existingIds = new Set(prevMeds.map(m => m.RegisterNumber));
            const newUniqueMeds = normalizedData.filter(m => !existingIds.has(m.RegisterNumber));
            
            if (newUniqueMeds.length === 0) {
                alert("All items already exist.");
                return prevMeds;
            }

            const updated = [...prevMeds, ...newUniqueMeds];
            try {
                localStorage.setItem(MEDICINES_CACHE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error("Storage full", e);
                alert("Warning: Storage full. New items added but not saved for next session.");
            }
            return updated;
        });
        setView('settings');
        alert(t('importSuccess', { count: normalizedData.length }));
    } catch (error) {
        console.error("Import failed", error);
        alert(t('errorProcessingData'));
    }
  };

  const handleImportInsuranceData = (data: any[]): void => {
    try {
        const normalizedData = data.map(normalizeInsuranceDrug);
        setInsuranceData(prev => [...prev, ...normalizedData]);
        setView('settings');
        alert(t('importSuccess', { count: normalizedData.length }));
    } catch (error) {
        console.error("Import failed", error);
        alert(t('errorProcessingData'));
    }
  };
  
  const handleImportCosmeticsData = (data: any[]): void => {
    try {
        const normalizedData = data.map(normalizeCosmetic);
        setCosmetics(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newUniqueItems = normalizedData.filter(c => !existingIds.has(c.id));
            
            if (newUniqueItems.length === 0) return prev;

            const updated = [...prev, ...newUniqueItems];
            try {
                localStorage.setItem(COSMETICS_CACHE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error("Storage full", e);
                alert("Warning: Storage full. New items added but not saved for next session.");
            }
            return updated;
        });
        setView('settings');
        alert(t('importSuccess', { count: normalizedData.length }));
    } catch (error) {
        console.error("Import failed", error);
        alert(t('errorProcessingData'));
    }
  };

  // Update scroll tracking to use the internal container instead of window
  const handleMedicineSelect = (medicine: Medicine) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedMedicine(medicine); 
      setView('details'); 
  };
  
  const handleCosmeticSelect = (cosmetic: Cosmetic) => { 
      const container = document.getElementById('main-scroll-container');
      if(container) scrollPositionRef.current = container.scrollTop;
      setSelectedCosmetic(cosmetic); 
      setView('cosmeticDetails'); 
  };

  const handleFilterChange = <K extends keyof Filters>(filterName: K, value: Filters[K]) => setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
  const handleClearFilters = useCallback(() => setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' }), []);
  const handleClearSearch = useCallback(() => { setSearchTerm(''); setTextSearchMode('tradeName'); handleClearFilters(); setSortBy('alphabetical'); setSearchResults([]); setView('search'); setForceSearch(false); }, [handleClearFilters]);
  const handleForceSearch = useCallback(() => { if (searchTerm.trim().length > 0) setForceSearch(true); }, [searchTerm]);

  const handleBack = useCallback(() => {
    if (view === 'login' || view === 'register') { setView('settings'); return; }
    if (view === 'admin') { setView('settings'); return; }
    if (view === 'verifyEmail') { return; }
    if (activeTab === 'prescriptions' && selectedPrescription) { setSelectedPrescription(null); return; }
    
    const targetView = (isSearchActive && activeTab === 'search') ? 'results' : 'search';

    if (['details', 'alternatives', 'chatHistory', 'insuranceDetails', 'favorites', 'cosmeticDetails'].includes(view)) {
       if (activeTab === 'insurance') {
           setView('insuranceSearch');
       } else if (activeTab === 'cosmetics') {
           setView('cosmeticsSearch');
       } else if (activeTab === 'settings') {
           setView('settings');
       } else {
           setView(targetView);
           if (targetView === 'results') {
                // Restore scroll position on internal container
                setTimeout(() => document.getElementById('main-scroll-container')?.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' }), 10);
           }
       }
    } else if (['addData', 'addInsuranceData', 'addCosmeticsData'].includes(view)) {
        setView('settings');
    } else {
        setView(targetView);
    }
    setSourceMedicine(null); setAlternativesResults(null); setSelectedMedicine(null); setSelectedInsuranceData(null); setSelectedCosmetic(null);
  }, [view, isSearchActive, activeTab, selectedPrescription]);

  const handleOpenContextualAssistant = (medicine: Medicine) => {
    if (!isAIAvailable()) {
      alert(t('aiUnavailableMessage'));
      return;
    }
    requestAIAccess(() => {
      setAssistantContextMedicine(medicine);
      setAssistantInitialPrompt('');
      setIsAssistantModalOpen(true);
    }, t);
  };

  const handleOpenGeneralAssistant = () => {
    if (!isAIAvailable()) {
      alert(t('aiUnavailableMessage'));
      return;
    }
    requestAIAccess(() => {
      setAssistantContextMedicine(null);
      setAssistantInitialPrompt('');
      setSelectedConversation(null);
      setIsAssistantModalOpen(true);
    }, t);
  };
  
  const handleOpenPrescriptionAssistant = useCallback(() => {
    if (!isAIAvailable()) {
      alert(t('aiUnavailableMessage'));
      return;
    }
    
    // Only Admin or Privileged users can access prescription mode
    if (user?.role !== 'admin' && !user?.prescriptionPrivilege) {
        alert(t('aiAccessPendingError')); 
        return;
    }

    requestAIAccess(() => {
      setAssistantContextMedicine(null);
      setAssistantInitialPrompt('##PRESCRIPTION_MODE##'); 
      setSelectedConversation(null);
      setIsAssistantModalOpen(true);
    }, t);
  }, [requestAIAccess, t, user]);

  const handleFindAlternative = (medicine: Medicine) => {
    const priceSorter = (a: Medicine, b: Medicine) => parseFloat(a['Public price']) - parseFloat(b['Public price']);
    const direct = medicines.filter(m => m['Scientific Name'] === medicine['Scientific Name'] && m.RegisterNumber !== medicine.RegisterNumber).sort(priceSorter);
    const therapeutic = medicines.filter(m => m.AtcCode1 && medicine.AtcCode1 && m.AtcCode1 === medicine.AtcCode1 && m['Scientific Name'] !== medicine['Scientific Name']).sort(priceSorter);
    setSourceMedicine(medicine); setAlternativesResults({ direct, therapeutic }); setView('alternatives');
  };

  const handleCloseAssistant = (historyToSave: ChatMessage[]) => {
    if (historyToSave.length <= 1) { setIsAssistantModalOpen(false); setSelectedConversation(null); setAssistantContextMedicine(null); return; }
    
    const sanitizedHistory = historyToSave.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => {
          const newPart: Part = {};
          if (part.text) newPart.text = part.text;
          if (part.inlineData) newPart.inlineData = { mimeType: part.inlineData.mimeType, data: part.inlineData.data };
          if (part.functionCall) {
             newPart.functionCall = { 
                 name: part.functionCall.name, 
                 args: part.functionCall.args ? JSON.parse(JSON.stringify(part.functionCall.args)) : {}, 
                 id: part.functionCall.id 
             };
          }
          if (part.functionResponse) {
              newPart.functionResponse = { 
                  name: part.functionResponse.name, 
                  response: part.functionResponse.response ? JSON.parse(JSON.stringify(part.functionResponse.response)) : {}, 
                  id: part.functionResponse.id 
              };
          }
          return newPart;
      })
    }));

    let newConversations: Conversation[];
    if (selectedConversation) {
        const updatedConversation = { ...selectedConversation, messages: sanitizedHistory, timestamp: Date.now() };
        newConversations = conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c);
    } else {
        const firstUserMessage = sanitizedHistory.find(m => m.role === 'user');
        const textPart = firstUserMessage?.parts.find(p => 'text' in p);
        const titleText = textPart && 'text' in textPart ? textPart.text : '';

        const newConversation: Conversation = {
            id: `convo-${Date.now()}`,
            title: titleText.substring(0, 40) || t('newConversation'),
            messages: sanitizedHistory,
            timestamp: Date.now()
        };
        newConversations = [newConversation, ...conversations];
    }
    setConversations(newConversations);
    
    try {
      localStorage.setItem('chatHistory', JSON.stringify(newConversations));
    } catch (e) {
      console.error("Failed to save chat history to localStorage:", e);
    }

    setIsAssistantModalOpen(false);
    setSelectedConversation(null);
    setAssistantContextMedicine(null);
  };
  
  // Edit Logic for Admin (Medicines)
  const handleEditMedicine = (medicine: Medicine) => {
      setEditingMedicine({ ...medicine });
      setIsEditMedicineModalOpen(true);
  };

  const handleDeleteMedicine = async (medicine: Medicine) => {
      if (!window.confirm(t('confirmDeleteMedicine'))) return;

      // Update local state immediately for instant feedback
      setMedicines(prev => {
          const updated = prev.filter(m => m.RegisterNumber !== medicine.RegisterNumber);
          try {
              localStorage.setItem(MEDICINES_CACHE_KEY, JSON.stringify(updated));
          } catch (e) {
              console.error("Failed to update cache", e);
          }
          return updated;
      });

      // Close modal and return to search results
      setIsEditMedicineModalOpen(false);
      setEditingMedicine(null);
      if (selectedMedicine && selectedMedicine.RegisterNumber === medicine.RegisterNumber) {
          setSelectedMedicine(null);
          setView('results');
      }

      // Background cloud sync
      if (!FIREBASE_DISABLED) {
          try {
              await deleteDoc(doc(db, 'medicines', medicine.RegisterNumber));
          } catch (e) {
              console.error("Failed to delete from cloud", e);
          }
      }
  };

  const handleSaveEditedMedicine = async (syncToCloud: boolean) => {
      if (!editingMedicine) return;

      // 1. Update local state immediately
      setMedicines(prev => {
          const updated = prev.map(m => m.RegisterNumber === editingMedicine.RegisterNumber ? editingMedicine : m);
          // Update cache immediately after edit
          try {
            localStorage.setItem(MEDICINES_CACHE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to update cache", e);
          }
          return updated;
      });

      if (selectedMedicine && selectedMedicine.RegisterNumber === editingMedicine.RegisterNumber) {
          setSelectedMedicine(editingMedicine);
      }

      // 2. Attempt to update Firestore ONLY if syncToCloud is true
      if (syncToCloud && !FIREBASE_DISABLED) {
          try {
              const medDocRef = doc(db, 'medicines', editingMedicine.RegisterNumber);
              await setDoc(medDocRef, editingMedicine, { merge: true });
              alert("Medicine saved locally AND synced to Cloud Firestore.");
          } catch (e) {
              console.error("Failed to sync edit to cloud", e);
              alert("Saved locally, but failed to sync to cloud. Check internet.");
          }
      } else if (syncToCloud && FIREBASE_DISABLED) {
          alert("Saved locally. Cloud sync is DISABLED.");
      }

      setIsEditMedicineModalOpen(false);
      setEditingMedicine(null);
  };

  // Edit Logic for Admin (Cosmetics)
  const handleEditCosmetic = (cosmetic: Cosmetic) => {
      setEditingCosmetic({ ...cosmetic });
      setIsEditCosmeticModalOpen(true);
  };

  const handleSaveEditedCosmetic = async (syncToCloud: boolean) => {
      if (!editingCosmetic) return;

      setCosmetics(prev => {
          const updated = prev.map(c => c.id === editingCosmetic.id ? editingCosmetic : c);
          try {
            localStorage.setItem(COSMETICS_CACHE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to update cache", e);
          }
          return updated;
      });

      if (selectedCosmetic && selectedCosmetic.id === editingCosmetic.id) {
          setSelectedCosmetic(editingCosmetic);
      }

      if (syncToCloud && !FIREBASE_DISABLED) {
          try {
              const cosmeticDocRef = doc(db, 'cosmetics', editingCosmetic.id);
              await setDoc(cosmeticDocRef, editingCosmetic, { merge: true });
              alert("Cosmetic saved locally AND synced to Cloud Firestore.");
          } catch (e) {
              console.error("Failed to sync edit to cloud", e);
              alert("Saved locally, but failed to sync to cloud.");
          }
      } else if (syncToCloud && FIREBASE_DISABLED) {
          alert("Saved locally. Cloud sync is DISABLED.");
      }

      setIsEditCosmeticModalOpen(false);
      setEditingCosmetic(null);
  };

  
  const uniqueManufactureNames = useMemo(() => {
    const names = new Set(medicines.map(m => m['Manufacture Name']));
    return Array.from(names).sort();
  }, [medicines]);

  const uniquePharmaceuticalForms = useMemo(() => {
    const forms = new Set(medicines.map(m => m.PharmaceuticalForm));
    return Array.from(forms).sort();
  }, [medicines]);

  const groupedPharmaceuticalForms = useMemo(() => groupPharmaceuticalForms(uniquePharmaceuticalForms, t), [uniquePharmaceuticalForms, t]);

  const uniqueLegalStatuses = useMemo(() => {
    const statuses = new Set(medicines.map(m => m['Legal Status']));
    return Array.from(statuses).filter(Boolean).sort();
  }, [medicines]);

  const handleAdminClick = () => {
    setView('admin');
    setActiveTab('settings');
  };

  const headerTitle = useMemo(() => {
    switch (view) {
      case 'details': return selectedMedicine ? selectedMedicine['Trade Name'] : t('appTitle');
      case 'cosmeticDetails': return selectedCosmetic ? selectedCosmetic.BrandName : t('appTitle');
      case 'alternatives': return t('alternativesFor', { name: sourceMedicine ? sourceMedicine['Trade Name'] : '' });
      case 'settings':
      case 'addData':
      case 'addInsuranceData':
      case 'addCosmeticsData':
        return t('navSettings');
      case 'login': return t('login');
      case 'register': return t('register');
      case 'admin': return t('adminDashboard');
      case 'chatHistory': return t('chatHistoryTitle');
      case 'favorites': return t('favoriteProducts');
      
      // Force branding logo AND correct section title for main tab views
      case 'insuranceSearch': return t('navInsurance'); 
      case 'cosmeticsSearch': return t('navCosmetics');
      case 'prescriptions': return selectedPrescription ? t('patientName') + ': ' + (selectedPrescription.patientName || '') : t('navPrescriptions');
      
      case 'insuranceDetails': return t('insuranceCoverageDetails');
      case 'verifyEmail': return t('verifyEmailTitle');
      default:
        if (activeTab === 'search') return t('appTitle');
        if (activeTab === 'insurance') return t('navInsurance'); // Show specific title
        if (activeTab === 'prescriptions') return t('navPrescriptions'); // Show specific title
        if (activeTab === 'cosmetics') return t('navCosmetics'); // Show specific title
        if (activeTab === 'settings') return t('navSettings');
        return t('appTitle');
    }
  }, [view, activeTab, selectedMedicine, selectedCosmetic, sourceMedicine, t, selectedPrescription]);

  const showBackButton = useMemo(() => {
    if (activeTab === 'prescriptions' && selectedPrescription) return true;
    
    const mainTabViews: {[key in Tab]?: View[]} = {
        search: ['search', 'results'],
        insurance: ['insuranceSearch'],
        prescriptions: ['prescriptions'],
        cosmetics: ['cosmeticsSearch'],
        settings: ['settings']
    };
    const currentTabMainViews = mainTabViews[activeTab];
    if (currentTabMainViews && currentTabMainViews.includes(view)) return false;
    if (view === 'verifyEmail') return false;

    return true;
  }, [view, activeTab, selectedPrescription]);


  const renderContent = () => {
    
    if (user && !user.emailVerified && user.role !== 'admin') {
        return <VerifyEmailView user={user} t={t} />;
    }
    
    if (view === 'login') {
        return <LoginView t={t} 
            onSwitchToRegister={() => setView('register')} 
            onLoginSuccess={() => {
                setActiveTab('search');
                setView('search');
            }} 
        />;
    }
    if (view === 'register') {
        return <RegisterView t={t} 
            onSwitchToLogin={() => setView('login')} 
            onRegisterSuccess={() => {
                alert(t('registerSuccessPending')); 
                setView('login');
            }}
        />;
    }

    if (activeTab === 'search') {
      switch (view) {
        case 'search':
        case 'results':
          return (
            <>
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                textSearchMode={textSearchMode}
                setTextSearchMode={setTextSearchMode}
                isSearchActive={isSearchActive}
                onClearSearch={handleClearSearch}
                onForceSearch={handleForceSearch}
                onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)}
                t={t}
              />
              <div className="flex items-center justify-between gap-2">
                  <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={activeFilterCount} t={t} />
                  <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
              </div>

              {/* Welcome Message Removed Here */}

              {view === 'results' && (
                <ResultsList
                  medicines={searchResults}
                  onMedicineSelect={handleMedicineSelect}
                  onMedicineLongPress={handleOpenContextualAssistant}
                  onFindAlternative={handleFindAlternative}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  t={t}
                  language={language}
                  resultsState={isSearchActive ? (searchResults.length > 0 ? 'loaded' : 'empty') : 'loading'}
                />
              )}
            </>
          );
        case 'details':
          return selectedMedicine && <MedicineDetail medicine={selectedMedicine} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onEdit={handleEditMedicine} />;
        case 'alternatives':
          return sourceMedicine && alternativesResults && (
            <AlternativesView
              sourceMedicine={sourceMedicine}
              alternatives={alternativesResults}
              onMedicineSelect={handleMedicineSelect}
              onMedicineLongPress={handleOpenContextualAssistant}
              onFindAlternative={handleFindAlternative}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              t={t}
              language={language}
            />
          );
        default:
          return null;
      }
    }
    
    if (activeTab === 'insurance') {
        switch (view) {
            case 'insuranceSearch':
                return <InsuranceSearchView 
                    t={t} 
                    language={language} 
                    allMedicines={medicines}
                    insuranceData={insuranceData}
                    onSelectInsuranceData={(data) => {
                        setSelectedInsuranceData(data);
                        setView('insuranceDetails');
                    }}
                    insuranceSearchTerm={insuranceSearchTerm}
                    setInsuranceSearchTerm={setInsuranceSearchTerm}
                    insuranceSearchMode={insuranceSearchMode}
                    setInsuranceSearchMode={setInsuranceSearchMode}
                />;
            case 'insuranceDetails':
                return selectedInsuranceData && <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
            default:
                setTimeout(() => setView('insuranceSearch'), 0);
                return null;
        }
    }

    if (activeTab === 'cosmetics') {
      if (view === 'cosmeticDetails' && selectedCosmetic) {
          return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} onEdit={handleEditCosmetic} />;
      }
      return <CosmeticsView 
        t={t} 
        language={language} 
        cosmetics={cosmetics}
        onSelectCosmetic={handleCosmeticSelect}
        searchTerm={cosmeticsSearchTerm}
        setSearchTerm={setCosmeticsSearchTerm}
        selectedBrand={cosmeticsSelectedBrand}
        setSelectedBrand={setCosmeticsSelectedBrand}
      />;
    }

    if (activeTab === 'settings') {
      switch (view) {
        case 'settings':
          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('darkMode')} / {t('lightMode')}</span>
                  <button onClick={toggleTheme} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">{theme === 'light' ? t('darkMode') : t('lightMode')}</button>
                </div>
                 <div className="flex justify-between items-center mt-4">
                  <span className="font-medium">{t('languageSwitcher')}</span>
                  <button onClick={() => setLanguage(lang => lang === 'ar' ? 'en' : 'ar')} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">{t('langShortOpposite')}</button>
                </div>
              </div>
              <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-4">{t('dataManagement')}</h3>
                <div className="space-y-3">
                    {user?.role === 'admin' && (
                        <>
                            <button onClick={() => setView('addData')} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><DatabaseIcon /><span>{t('addData')}</span></button>
                            <button onClick={() => setView('addInsuranceData')} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><DatabaseIcon /><span>{t('addInsuranceData')}</span></button>
                            <button onClick={() => setView('addCosmeticsData')} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><DatabaseIcon /><span>{t('addCosmeticsData')}</span></button>
                        </>
                    )}
                    <button onClick={() => setView('chatHistory')} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><HistoryIcon /><span>{t('chatHistory')}</span></button>
                    <button onClick={() => setView('favorites')} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><div className="h-6 w-6 text-accent"><StarIcon isFilled /></div><span>{t('favorites')}</span></button>

                    {user?.role === 'admin' && (
                        <button onClick={handleAdminClick} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><AdminIcon /><span>{t('adminDashboard')}</span></button>
                    )}
                </div>
              </div>
            </div>
          );
        case 'addData':
          return <AddDataView onImport={handleImportData} t={t} />;
        case 'addInsuranceData':
          return <AddInsuranceDataView onImport={handleImportInsuranceData} t={t} />;
        case 'addCosmeticsData':
            return <AddCosmeticsDataView onImport={handleImportCosmeticsData} t={t} />;
        case 'admin':
            return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} setCosmetics={setCosmetics} /> : null;
        case 'favorites':
          return <FavoritesView
              favoriteIds={favorites}
              allMedicines={medicines}
              onMedicineSelect={handleMedicineSelect}
              onMedicineLongPress={handleOpenContextualAssistant}
              onFindAlternative={handleFindAlternative}
              toggleFavorite={toggleFavorite}
              t={t}
              language={language}
            />;
        case 'chatHistory':
          return <ChatHistoryView
            conversations={conversations}
            onSelectConversation={(convo) => {
              if (!isAIAvailable()) {
                alert(t('aiUnavailableMessage'));
                return;
              }
              requestAIAccess(() => {
                setSelectedConversation(convo);
                setAssistantContextMedicine(null);
                setAssistantInitialPrompt('');
                setIsAssistantModalOpen(true);
              }, t);
            }}
            onDeleteConversation={(id) => {
              const newConvos = conversations.filter(c => c.id !== id);
              setConversations(newConvos);
              localStorage.setItem('chatHistory', JSON.stringify(newConvos));
            }}
            onClearHistory={() => {
              setConversations([]);
              localStorage.removeItem('chatHistory');
            }}
            t={t}
            language={language}
          />;
        default: return null;
      }
    }
    return null;
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text h-full flex flex-col overflow-hidden relative">
      <Header
        title={headerTitle}
        showBack={showBackButton}
        onBack={handleBack}
        theme={theme}
        toggleTheme={toggleTheme}
        t={t}
        onLoginClick={() => {
            setView('login');
            setActiveTab('settings');
        }}
        onAdminClick={handleAdminClick}
        view={view}
      />

      <main 
        id="main-scroll-container" 
        className="flex-grow container mx-auto px-4 space-y-4 transition-all duration-300 max-w-7xl overflow-y-auto pt-[90px] pb-[90px]"
      >
        {renderContent()}
      </main>

      {user && user.emailVerified && !isAssistantModalOpen && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30">
            <FloatingAssistantButton onClick={handleOpenGeneralAssistant} onLongPress={handleOpenPrescriptionAssistant} t={t} language={language} />
        </div>
      )}

      {(!user || user.emailVerified || user.role === 'admin') && (
          <BottomNavBar 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
                setActiveTab(tab);
                const mainViews: Record<Tab, View> = {
                    search: isSearchActive ? 'results' : 'search',
                    insurance: 'insuranceSearch',
                    prescriptions: 'prescriptions',
                    cosmetics: 'cosmeticsSearch',
                    settings: 'settings',
                };
                setView(mainViews[tab]);
            }} 
            t={t}
            user={user}
            view={view}
          />
      )}
      
      <AssistantModal
        isOpen={isAssistantModalOpen}
        onSaveAndClose={handleCloseAssistant}
        contextMedicine={assistantContextMedicine}
        allMedicines={medicines}
        favoriteMedicines={favoriteMedicines}
        initialPrompt={assistantInitialPrompt}
        initialHistory={selectedConversation?.messages}
        t={t}
        language={language}
      />
      
      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        groupedPharmaceuticalForms={groupedPharmaceuticalForms}
        uniqueManufactureNames={uniqueManufactureNames}
        uniqueLegalStatuses={uniqueLegalStatuses}
        t={t}
      />
      
      <BarcodeScannerModal 
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onBarcodeDetected={(barcode) => {
            setSearchTerm(barcode);
            setIsBarcodeScannerOpen(false);
            setForceSearch(true);
            setActiveTab('search');
            setView('results');
        }}
        t={t}
      />

      {/* Edit Modal for Admin (Medicine) */}
      {isEditMedicineModalOpen && editingMedicine && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditMedicineModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">{t('editMedicine')}</h3>
                    <form onSubmit={(e) => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-3 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               <div><label className="text-sm font-medium">{t('tradeName')}</label><input type="text" value={editingMedicine['Trade Name']} onChange={e => setEditingMedicine({...editingMedicine, 'Trade Name': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required /></div>
                               <div><label className="text-sm font-medium">{t('scientificName')}</label><input type="text" value={editingMedicine['Scientific Name']} onChange={e => setEditingMedicine({...editingMedicine, 'Scientific Name': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required/></div>
                               <div><label className="text-sm font-medium">{t('price')}</label><input type="text" value={editingMedicine['Public price']} onChange={e => setEditingMedicine({...editingMedicine, 'Public price': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('pharmaceuticalForm')}</label><input type="text" value={editingMedicine.PharmaceuticalForm} onChange={e => setEditingMedicine({...editingMedicine, PharmaceuticalForm: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('strength')}</label><input type="text" value={editingMedicine.Strength} onChange={e => setEditingMedicine({...editingMedicine, Strength: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('strengthUnit')}</label><input type="text" value={editingMedicine.StrengthUnit} onChange={e => setEditingMedicine({...editingMedicine, StrengthUnit: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('packageSize')}</label><input type="text" value={editingMedicine.PackageSize} onChange={e => setEditingMedicine({...editingMedicine, PackageSize: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('packageType')}</label><input type="text" value={editingMedicine.PackageTypes} onChange={e => setEditingMedicine({...editingMedicine, PackageTypes: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('manufacturer')}</label><input type="text" value={editingMedicine['Manufacture Name']} onChange={e => setEditingMedicine({...editingMedicine, 'Manufacture Name': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div>
                                    <label className="text-sm font-medium">{t('legalStatus')}</label>
                                    <select value={editingMedicine['Legal Status']} onChange={e => setEditingMedicine({...editingMedicine, 'Legal Status': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                        <option value="Prescription">{t('prescription')}</option>
                                        <option value="OTC">{t('otc')}</option>
                                    </select>
                               </div>
                               <div>
                                    <label className="text-sm font-medium">{t('productType')}</label>
                                    <select value={editingMedicine['Product type']} onChange={e => setEditingMedicine({...editingMedicine, 'Product type': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                        <option value="Human">{t('humanProduct')}</option>
                                        <option value="Supplement">{t('supplementProduct')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-between items-center gap-2 pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 mt-2">
                            <button type="button" onClick={() => handleDeleteMedicine(editingMedicine)} className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-medium">
                                {t('delete')}
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsEditMedicineModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium">{t('cancel')}</button>
                                <button type="button" onClick={() => handleSaveEditedMedicine(false)} className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-medium">Save Locally</button>
                                <button type="button" onClick={() => handleSaveEditedMedicine(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2" disabled={FIREBASE_DISABLED}>
                                    Save & Sync
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
      )}

      {/* Edit Modal for Admin (Cosmetic) */}
      {isEditCosmeticModalOpen && editingCosmetic && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditCosmeticModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">Edit Cosmetic</h3>
                    <form onSubmit={(e) => e.preventDefault()} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-3 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2"><label className="text-sm font-medium">{t('brandName')}</label><input type="text" value={editingCosmetic.BrandName} onChange={e => setEditingCosmetic({...editingCosmetic, BrandName: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required /></div>
                                
                                <div><label className="text-sm font-medium">Product Name (En)</label><input type="text" value={editingCosmetic.SpecificName} onChange={e => setEditingCosmetic({...editingCosmetic, SpecificName: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required/></div>
                                <div><label className="text-sm font-medium">Product Name (Ar)</label><input type="text" dir="rtl" value={editingCosmetic.SpecificNameAr} onChange={e => setEditingCosmetic({...editingCosmetic, SpecificNameAr: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                
                                <div><label className="text-sm font-medium">Category (En)</label><input type="text" value={editingCosmetic.FirstSubCategoryEn} onChange={e => setEditingCosmetic({...editingCosmetic, FirstSubCategoryEn: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">Category (Ar)</label><input type="text" dir="rtl" value={editingCosmetic.FirstSubCategoryAr} onChange={e => setEditingCosmetic({...editingCosmetic, FirstSubCategoryAr: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                
                                <div><label className="text-sm font-medium">Sub-Category (En)</label><input type="text" value={editingCosmetic.SecondSubCategoryEn} onChange={e => setEditingCosmetic({...editingCosmetic, SecondSubCategoryEn: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">Sub-Category (Ar)</label><input type="text" dir="rtl" value={editingCosmetic.SecondSubCategoryAr} onChange={e => setEditingCosmetic({...editingCosmetic, SecondSubCategoryAr: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>

                                <div className="sm:col-span-2"><label className="text-sm font-medium">Active Ingredient</label><input type="text" value={editingCosmetic["Active ingredient"]} onChange={e => setEditingCosmetic({...editingCosmetic, "Active ingredient": e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div className="sm:col-span-2"><label className="text-sm font-medium">Key Ingredients</label><textarea value={editingCosmetic["Key Ingredients"] || ''} onChange={e => setEditingCosmetic({...editingCosmetic, "Key Ingredients": e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" rows={2} /></div>
                                <div className="sm:col-span-2"><label className="text-sm font-medium">Highlights</label><textarea value={editingCosmetic.Highlights || ''} onChange={e => setEditingCosmetic({...editingCosmetic, Highlights: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" rows={2} /></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 mt-2">
                            <button type="button" onClick={() => setIsEditCosmeticModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-medium">{t('cancel')}</button>
                            <button type="button" onClick={() => handleSaveEditedCosmetic(false)} className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-medium">Save Locally Only</button>
                            <button type="button" onClick={() => handleSaveEditedCosmetic(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2" disabled={FIREBASE_DISABLED}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                Save & Sync to Cloud
                            </button>
                        </div>
                    </form>
                </div>
            </div>
      )}
    </div>
  );
};

export default App;
