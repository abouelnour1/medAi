
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
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Part } from '@google/genai';

const normalizeProduct = (product: any): Medicine => {
  let productType = product['Product type'];
  if (!productType) {
    if (product.DrugType === 'Health' || product.DrugType === 'Herbal') {
      productType = 'Supplement';
    } else {
      productType = 'Human'; // Default to medicine if unknown
    }
  }

  const price = product['Public price'] || product.Price || 'N/A';

  return {
    'RegisterNumber': String(product.RegisterNumber || product.Id || `unknown-${Math.random()}`),
    'Trade Name': String(product['Trade Name'] || product.TradeName || 'Unknown'),
    'Scientific Name': String(product['Scientific Name'] || product.ScientificName || 'Unknown'),
    'Product type': String(productType),
    'Public price': String(price),
    'PharmaceuticalForm': String(product.PharmaceuticalForm || product.DoesageForm || 'Unknown'),
    'Strength': String(product.Strength || ''),
    'StrengthUnit': String(product.StrengthUnit || ''),
    'PackageSize': String(product.PackageSize || ''),
    'PackageTypes': String(product.PackageTypes || product.PackageType || ''),
    'Legal Status': String(product['Legal Status'] || product.LegalStatus || 'Unknown'),
    'Manufacture Name': String(product['Manufacture Name'] || product.ManufacturerNameEN || 'Unknown'),
    'Manufacture Country': String(product['Manufacture Country'] || product.ManufacturerCountry || 'Unknown'),
    'Storage Condition Arabic': String(product['Storage Condition Arabic'] || product.StorageConditions || 'Unknown'),
    'Storage conditions': String(product['Storage conditions'] || product.StorageConditions || 'Unknown'),
    'Main Agent': String(product['Main Agent'] || product.AgentName || 'Unknown'),
    'ReferenceNumber': String(product.ReferenceNumber || ''),
    'Old register Number': String(product['Old register Number'] || ''),
    'DrugType': String(product.DrugType || ''),
    'Sub-Type': String(product['Sub-Type'] || ''),
    'AdministrationRoute': String(product.AdministrationRoute || ''),
    'AtcCode1': String(product.AtcCode1 || ''),
    'AtcCode2': String(product.AtcCode2 || ''),
    'Size': String(product.Size || ''),
    'SizeUnit': String(product.SizeUnit || ''),
    'Product Control': String(product['Product Control'] || product.ProductControl || ''),
    'Distribute area': String(product['Distribute area'] || product.DistributionArea || ''),
    'shelfLife': String(product.shelfLife || product.ShelfLife || ''),
    'Marketing Company': String(product['Marketing Company'] || product.CompanyName || ''),
    'Marketing Country': String(product['Marketing Country'] || product.CompanyCountryEn || ''),
    'Secondry package  manufacture': String(product['Secondry package  manufacture'] || product.SecondaryPackaging || ''),
    'Secosnd Agent': String(product['Secosnd Agent'] || product.AddtionalAgentName || ''),
    'Third agent': String(product['Third agent'] || ''),
    'Description Code': String(product['Description Code'] || ''),
    'Authorization Status': String(product['Authorization Status'] || product.AuthorizationStatus || ''),
    'Last Update': String(product['Last Update'] || ''),
  };
};

const FAVORITES_STORAGE_KEY = 'saudi_drug_directory_favorites';

const App: React.FC = () => {
  const { user, requestAIAccess, isLoading: isAuthLoading } = useAuth();

  // Initialize with static data immediately for instant load
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
     const initialSupplements = SUPPLEMENT_DATA_RAW.map(normalizeProduct);
     return [...MEDICINE_DATA, ...initialSupplements];
  });
  
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>(() => {
     return [...INITIAL_INSURANCE_DATA, ...CUSTOM_INSURANCE_DATA].map((item, index) => ({ ...item, id: `ins-item-${Date.now()}-${index}` }));
  });
  
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>(() => INITIAL_COSMETICS_DATA);
  
  useEffect(() => {
    console.log("Firebase data fetching currently disabled to save quota and improve performance.");
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
  const [language, setLanguage] = useState<Language>('ar');
  
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
  
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  
  const scrollPositionRef = useRef(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.getItem('theme') === 'dark') {
        return 'dark';
    }
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    const isModalOpen = isAssistantModalOpen || isFilterModalOpen || isBarcodeScannerOpen;
    if (isModalOpen) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }
  }, [isAssistantModalOpen, isFilterModalOpen, isBarcodeScannerOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPromptEvent(null);
    });
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
    return Object.values(filters).some(val => Array.isArray(val) ? val.length > 0 : !!val && val !== 'all') || searchTerm.trim().length >= 2 || forceSearch;
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
    
    // Advanced Search Logic: Separating numbers (strength) from text
    const searchTerms = lowerSearchTerm.split(/\s+/).filter(Boolean);
    const numberTerms = searchTerms.filter(term => /^\d+(\.\d+)?(mg|g|ml|%)?$/.test(term));
    const textTerms = searchTerms.filter(term => !/^\d+(\.\d+)?(mg|g|ml|%)?$/.test(term));
    
    // If we have text terms, combine them back for regex searching
    const textQuery = textTerms.join(' ');
    
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // Create regex for text part only if it exists
    let searchRegex: RegExp | null = null;
    if (textQuery) {
        const regexPattern = textQuery.split('%').map(escapeRegExp).join('.*');
        try {
            searchRegex = new RegExp(regexPattern, 'i');
        } catch (e) {
            searchRegex = new RegExp(escapeRegExp(textQuery), 'i');
        }
    }

    const filtered = medicines.filter(med => {
      // 1. Apply General Filters first (Fast)
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

      // 2. Advanced Search Matching
      if (searchTerms.length > 0) {
        const tradeName = String(med['Trade Name']).toLowerCase();
        const scientificName = String(med['Scientific Name']).toLowerCase();
        const strength = String(med.Strength).toLowerCase();
        
        // Check numeric terms (Concentration) - STRICT check if numbers are typed
        if (numberTerms.length > 0) {
            // Check if ALL typed numbers appear in Strength OR Trade Name
            const allNumbersMatch = numberTerms.every(num => {
                const cleanNum = num.replace(/(mg|g|ml|%)/g, ''); // Handle 500mg vs 500
                return strength.includes(cleanNum) || tradeName.includes(cleanNum);
            });
            if (!allNumbersMatch) return false;
        }

        // Check text terms
        if (searchRegex) {
            let matchFound = false;
            
            if (textSearchMode === 'scientificName') {
                // Strict Scientific Name Search
                matchFound = searchRegex.test(scientificName);
            } else if (textSearchMode === 'tradeName') {
                // Trade Name Search
                matchFound = searchRegex.test(tradeName);
            } else {
                // All Search
                matchFound = searchRegex.test(tradeName) || searchRegex.test(scientificName);
            }
            
            if (!matchFound) return false;
        }
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
        // 1. User's Explicit Sort
        if (sortBy === 'priceAsc') return parseFloat(a['Public price']) - parseFloat(b['Public price']);
        if (sortBy === 'priceDesc') return parseFloat(b['Public price']) - parseFloat(a['Public price']);
        if (sortBy === 'scientificName') return a['Scientific Name'].localeCompare(b['Scientific Name']);

        // 2. Logic for "Alphabetical" (Default)
        
        // If searching by Scientific Name, sort strictly alphabetically by Trade Name to group variants clearly
        // The user specifically requested this to avoid "Levo..." trade names appearing first when searching "Levofloxacin"
        if (textSearchMode === 'scientificName') {
             return a['Trade Name'].localeCompare(b['Trade Name']);
        }

        // If searching by Trade Name or All, prioritize matches starting with the term
        const aTradeName = String(a['Trade Name']).toLowerCase();
        const bTradeName = String(b['Trade Name']).toLowerCase();
        
        if (textQuery) {
            const prefix = textQuery;
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
    const normalizedData = data.map(normalizeProduct);
    setMedicines(prevMeds => [...prevMeds, ...normalizedData]);
    setView('settings');
  };

  const handleImportInsuranceData = (data: any[]): void => {
    setView('settings');
  };
  
  const handleImportCosmeticsData = (data: any[]): void => {
    setView('settings');
  };

  const handleMedicineSelect = (medicine: Medicine) => { scrollPositionRef.current = window.scrollY; setSelectedMedicine(medicine); setView('details'); };
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

    if (['details', 'alternatives', 'chatHistory', 'insuranceDetails', 'favorites'].includes(view)) {
       if (activeTab === 'insurance') {
           setView('insuranceSearch');
       } else if (activeTab === 'cosmetics') {
           setView('cosmeticsSearch');
       } else if (activeTab === 'settings') {
           setView('settings');
       } else {
           setView(targetView);
           if (targetView === 'results') {
                setTimeout(() => window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' }), 10);
           }
       }
    } else if (['addData', 'addInsuranceData', 'addCosmeticsData'].includes(view)) {
        setView('settings');
    } else {
        setView(targetView);
    }
    setSourceMedicine(null); setAlternativesResults(null); setSelectedMedicine(null); setSelectedInsuranceData(null);
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
    requestAIAccess(() => {
      setAssistantContextMedicine(null);
      setAssistantInitialPrompt('##PRESCRIPTION_MODE##'); 
      setSelectedConversation(null);
      setIsAssistantModalOpen(true);
    }, t);
  }, [requestAIAccess, t]);

  const handleFindAlternative = (medicine: Medicine) => {
    const priceSorter = (a: Medicine, b: Medicine) => parseFloat(a['Public price']) - parseFloat(b['Public price']);
    const direct = medicines.filter(m => m['Scientific Name'] === medicine['Scientific Name'] && m.RegisterNumber !== medicine.RegisterNumber).sort(priceSorter);
    const therapeutic = medicines.filter(m => m.AtcCode1 && medicine.AtcCode1 && m.AtcCode1 === medicine.AtcCode1 && m['Scientific Name'] !== medicine['Scientific Name']).sort(priceSorter);
    setSourceMedicine(medicine); setAlternativesResults({ direct, therapeutic }); setView('alternatives');
  };

  const handleCloseAssistant = (historyToSave: ChatMessage[]) => {
    if (historyToSave.length <= 1) { setIsAssistantModalOpen(false); setSelectedConversation(null); setAssistantContextMedicine(null); return; }
    
    // Sanitize chat history to prevent circular JSON errors
    const sanitizedHistory = historyToSave.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => {
          const newPart: Part = {};
          if (part.text) newPart.text = part.text;
          if (part.inlineData) newPart.inlineData = { mimeType: part.inlineData.mimeType, data: part.inlineData.data };
          // Simplify function calls/responses to just basic objects if needed, or strip them if causing issues
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
      case 'insuranceSearch': return t('insuranceSearchTitle');
      case 'cosmeticsSearch': return t('cosmeticsSearchTitle');
      case 'insuranceDetails': return t('insuranceCoverageDetails');
      case 'verifyEmail': return t('verifyEmailTitle');
      case 'prescriptions': return selectedPrescription ? t('patientName') + ': ' + (selectedPrescription.patientName || '') : t('prescriptionsListTitle');
      default:
        if (activeTab === 'search') return t('appTitle');
        if (activeTab === 'insurance') return t('insuranceSearchTitle');
        if (activeTab === 'prescriptions') return t('prescriptionsListTitle');
        if (activeTab === 'cosmetics') return t('cosmeticsSearchTitle');
        if (activeTab === 'settings') return t('navSettings');
        return t('appTitle');
    }
  }, [view, activeTab, selectedMedicine, sourceMedicine, t, selectedPrescription]);

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
    // REMOVED: The blocking loading state check. 
    // App now renders immediately even if auth is still initializing.
    
    if (user && !user.emailVerified && user.role !== 'admin') {
        return <VerifyEmailView user={user} t={t} />;
    }
    
    if (view === 'login') {
        return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => setView('search')} />;
    }
    if (view === 'register') {
        return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => {alert(t('registerSuccessPending')); setView('login');}}/>;
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

              {view === 'search' && !isSearchActive && (
                 <div className="text-center py-10">
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">{t('welcomeTitle')}</h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">{t('welcomeSubtitle')}</p>
                 </div>
              )}

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
          return selectedMedicine && <MedicineDetail medicine={selectedMedicine} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} />;
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

    if (activeTab === 'prescriptions') {
        if (selectedPrescription) {
            return <PrescriptionView prescriptionData={selectedPrescription} t={t} />
        }
        return <PrescriptionListView 
            prescriptions={prescriptions}
            onSelectPrescription={setSelectedPrescription}
            t={t}
        />
    }

    if (activeTab === 'cosmetics') {
      return <CosmeticsView 
        t={t} 
        language={language} 
        cosmetics={cosmetics}
      />;
    }

    if (activeTab === 'settings') {
      switch (view) {
        case 'settings':
          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-4">{t('generalSettings')}</h3>
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
            return user?.role === 'admin' ? <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} /> : null;
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
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen flex flex-col">
      <Header
        title={headerTitle}
        showBack={showBackButton}
        onBack={handleBack}
        theme={theme}
        toggleTheme={toggleTheme}
        showInstallButton={!!installPromptEvent}
        onInstallClick={handleInstallClick}
        t={t}
        onLoginClick={() => {
            setView('login');
            setActiveTab('settings');
        }}
        onAdminClick={handleAdminClick}
        view={view}
      />

      <main className="flex-grow container mx-auto p-4 space-y-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] transition-all duration-300 max-w-7xl">
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
    </div>
  );
};

export default App;
