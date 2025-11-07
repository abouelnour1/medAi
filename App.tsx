

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Medicine, View, Filters, TextSearchMode, Language, TFunction, Tab, SortByOption, Conversation, ChatMessage, InsuranceDrug, PrescriptionData, SelectedInsuranceData, InsuranceSearchMode } from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import AddDataView from './components/AddDataView';
import { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } from './data/data';
import { INITIAL_INSURANCE_DATA } from './data/insurance-data';
import { CUSTOM_INSURANCE_DATA } from './data/custom-insurance-data';
import { INITIAL_GUIDELINES_DATA } from './data/guidelines-data';
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
import AddGuidelinesDataView from './components/AddGuidelinesDataView';
import ClinicalAssistantView from './components/ClinicalAssistantView';
import PrescriptionListView from './components/PrescriptionListView';
import PrescriptionView from './components/PrescriptionView';
import ClearIcon from './components/icons/ClearIcon';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import SunIcon from './components/SunIcon';
import MoonIcon from './components/MoonIcon';

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

  // FIX: Explicitly cast all properties to `String` to ensure type safety.
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
    
    // Fill in the rest of the Medicine interface with defaults
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


const App: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const initialSupplements = SUPPLEMENT_DATA_RAW.map(normalizeProduct);
    return [...MEDICINE_DATA, ...initialSupplements];
  });
  const [insuranceData, setInsuranceData] = useState<InsuranceDrug[]>(() => {
    return [...INITIAL_INSURANCE_DATA, ...CUSTOM_INSURANCE_DATA];
  });
  const [clinicalGuidelines, setClinicalGuidelines] = useState<any>(INITIAL_GUIDELINES_DATA);
  
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
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [assistantContextMedicine, setAssistantContextMedicine] = useState<Medicine | null>(null);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState('');

  const [sourceMedicine, setSourceMedicine] = useState<Medicine | null>(null);
  const [alternativesResults, setAlternativesResults] = useState<{ direct: Medicine[], therapeutic: Medicine[] } | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);

  const [clinicalAssistantChatHistory, setClinicalAssistantChatHistory] = useState<ChatMessage[]>([]);
  
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Priority 1: User's saved preference
    if (localStorage.getItem('theme') === 'dark') {
        return 'dark';
    }
    // Priority 2: Default to 'light'
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

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
    document.body.classList.remove('lang-ar', 'lang-en');
    document.body.classList.add(`lang-${language}`);
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
    return Object.values(filters).some(val => Array.isArray(val) ? val.length > 0 : !!val && val !== 'all') || searchTerm.trim().length >= 3 || forceSearch;
  }, [searchTerm, filters, forceSearch]);

  useEffect(() => {
    if (!isSearchActive) {
      if (view === 'results') {
          setView('search');
      }
      setSearchResults([]);
      return;
    }

    const searchTermIsLongEnough = searchTerm.trim().length >= 3 || (forceSearch && searchTerm.trim().length > 0);
    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    const filtered = medicines.filter(med => {
      // Product Type Filter
      if (filters.productType === 'medicine' && med['Product type'] !== 'Human') return false;
      if (filters.productType === 'supplement' && med['Product type'] !== 'Supplement') return false;

      // Price Filter
      const price = parseFloat(med['Public price']);
      const minPrice = parseFloat(filters.priceMin);
      const maxPrice = parseFloat(filters.priceMax);
      if (!isNaN(minPrice) && (isNaN(price) || price < minPrice)) return false;
      if (!isNaN(maxPrice) && (isNaN(price) || price > maxPrice)) return false;
      
      // Dropdown Filters
      if (filters.pharmaceuticalForm && med.PharmaceuticalForm !== filters.pharmaceuticalForm) return false;
      if (filters.manufactureName.length > 0 && !filters.manufactureName.includes(med['Manufacture Name'])) return false;
      if (filters.legalStatus && med['Legal Status'] !== filters.legalStatus) return false;

      if (searchTermIsLongEnough) {
        const tradeName = String(med['Trade Name']).toLowerCase();
        const scientificName = String(med['Scientific Name']).toLowerCase();

        const tradeNameMatch = tradeName.includes(lowerSearchTerm);
        const scientificNameMatch = scientificName.includes(lowerSearchTerm);
        
        if (textSearchMode === 'tradeName' && !tradeNameMatch) return false;
        if (textSearchMode === 'scientificName' && !scientificNameMatch) return false;
        if (textSearchMode === 'all' && !tradeNameMatch && !scientificNameMatch) return false;
      }

      return true;
    });

    const sorted = filtered.sort((a, b) => {
        switch (sortBy) {
            case 'scientificName':
                return a['Scientific Name'].localeCompare(b['Scientific Name']);
            case 'priceAsc': {
                const priceA = parseFloat(a['Public price']);
                const priceB = parseFloat(b['Public price']);
                if (isNaN(priceA) && !isNaN(priceB)) return 1;
                if (!isNaN(priceA) && isNaN(priceB)) return -1;
                return priceA - priceB;
            }
            case 'priceDesc': {
                const priceA = parseFloat(a['Public price']);
                const priceB = parseFloat(b['Public price']);
                 if (isNaN(priceA) && !isNaN(priceB)) return 1;
                 if (!isNaN(priceA) && isNaN(priceB)) return -1;
                // FIX: Corrected a typo where the object `a` was being subtracted instead of the parsed price `priceA`.
                return priceB - priceA;
            }
            case 'alphabetical':
            default: {
                if (!lowerSearchTerm) {
                    return a['Trade Name'].localeCompare(b['Trade Name']);
                }
                const aTradeName = String(a['Trade Name']).toLowerCase();
                const bTradeName = String(b['Trade Name']).toLowerCase();
                const aSciName = String(a['Scientific Name']).toLowerCase();
                const bSciName = String(b['Scientific Name']).toLowerCase();
                
                let scoreA = 0;
                let scoreB = 0;

                const targetFieldA = textSearchMode === 'scientificName' ? aSciName : aTradeName;
                const targetFieldB = textSearchMode === 'scientificName' ? bSciName : bTradeName;

                if (targetFieldA.startsWith(lowerSearchTerm)) scoreA = 2;
                else if (targetFieldA.includes(lowerSearchTerm)) scoreA = 1;

                if (targetFieldB.startsWith(lowerSearchTerm)) scoreB = 2;
                else if (targetFieldB.includes(lowerSearchTerm)) scoreB = 1;

                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }

                return a['Trade Name'].localeCompare(b['Trade Name']);
            }
        }
    });

    setSearchResults(sorted);
    if (view === 'search' || view === 'results') {
        setView(isSearchActive ? 'results' : 'search');
    }
  }, [isSearchActive, searchTerm, filters, textSearchMode, medicines, view, sortBy, forceSearch]);


  const handleImportData = (data: any[]): void => {
    const normalizedData = data.map(normalizeProduct);
    const existingIds = new Set(medicines.map(m => m.RegisterNumber));
    const newData = normalizedData.filter(m => m.RegisterNumber && !existingIds.has(m.RegisterNumber));
    setMedicines(prevMeds => [...prevMeds, ...newData]);
    setView('settings');
  };

  const handleImportInsuranceData = (data: any[]): void => {
    const normalizeInsuranceDrug = (item: any): InsuranceDrug => ({
        indication: item.INDICATION || '',
        icd10Code: item['ICD 10 CODE'] || '',
        drugClass: (item['DRUG PHARMACOLOGICAL CLASS '] || '').trim(),
        drugSubclass: item['DRUG PHARMACOLOGICAL SUBCLASS'] || '',
        scientificName: (item['SCIENTIFIC NAME '] || '').trim(),
        atcCode: (item['ATC CODE'] || '').trim(),
        form: (item['PHARMACEUTICAL FORM '] || '').trim(),
        strength: String(item['STRENGTH '] || '').trim(),
        strengthUnit: (item['STRENGTH UNIT '] || '').trim(),
        notes: item.NOTES || '',
        administrationRoute: item['ADMINISTRATION ROUTE'] || '',
        substitutable: item['SUBSTITUTABLE'] || '',
        prescribingEdits: item['PRESCRIBING EDITS'] || '',
        mddAdults: item['MDD ADULTS'] || '',
        mddPediatrics: item['MDD PEDIATRICS'] || '',
        appendix: item['APPENDIX'] || '',
        patientType: item['PATIENT TYPE'] || '',
        sfdaRegistrationStatus: item['SFDA REGISTRATION STATUS'] || '',
    });

    try {
        const normalizedData = data.map(normalizeInsuranceDrug);
        const existingKeys = new Set(insuranceData.map(d => `${d.scientificName}-${d.strength}-${d.form}-${d.indication}`));
        const newData = normalizedData.filter(d => {
            const key = `${d.scientificName}-${d.strength}-${d.form}-${d.indication}`;
            if (!d.scientificName || existingKeys.has(key)) return false;
            existingKeys.add(key);
            return true;
        });
        if (newData.length > 0) setInsuranceData(prevData => [...prevData, ...newData]);
        setView('settings');
    } catch (e) {
        console.error("Error normalizing insurance data", e);
    }
  };
  
  const handleImportGuidelinesData = (data: object): void => {
    setClinicalGuidelines((prev: object) => ({ ...prev, ...data }));
    setView('settings');
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setView('details');
  };
  
  const handleFilterChange = <K extends keyof Filters>(filterName: K, value: Filters[K]) => {
    setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
  };
  
  const handleClearFilters = useCallback(() => {
    setFilters({ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setTextSearchMode('tradeName');
    handleClearFilters();
    setSortBy('alphabetical');
    setSearchResults([]);
    setView('search');
    setForceSearch(false);
  }, [handleClearFilters]);
  
  const handleForceSearch = useCallback(() => {
    if (searchTerm.trim().length > 0) setForceSearch(true);
  }, [searchTerm]);

  const handleBack = useCallback(() => {
    if (activeTab === 'prescriptions' && selectedPrescription) {
        setSelectedPrescription(null);
        return;
    }
    
    const targetView = (isSearchActive && activeTab === 'search') ? 'results' : 'search';
    if (['details', 'alternatives', 'chatHistory', 'insuranceDetails'].includes(view)) {
       if (activeTab === 'insurance') {
           setView('insuranceSearch');
       } else if (activeTab === 'settings') {
           setView('settings');
       }
       else {
           setView(targetView);
       }
    } else if (['addData', 'addInsuranceData', 'addGuidelinesData'].includes(view)) {
      setView('settings');
    } else {
        setView(targetView);
    }
    setSourceMedicine(null);
    setAlternativesResults(null);
    setSelectedMedicine(null);
    setSelectedInsuranceData(null);
  }, [view, isSearchActive, activeTab, selectedPrescription]);
  
  const handleOpenContextualAssistant = (medicine: Medicine) => {
    setAssistantContextMedicine(medicine);
    setAssistantInitialPrompt('');
    setIsAssistantModalOpen(true);
  };

  const handleOpenGeneralAssistant = () => {
    setAssistantContextMedicine(null);
    setAssistantInitialPrompt('');
    setSelectedConversation(null);
    setIsAssistantModalOpen(true);
  };
  
  const handleOpenPrescriptionAssistant = useCallback(() => {
    setAssistantContextMedicine(null);
    setAssistantInitialPrompt('##PRESCRIPTION_MODE##'); 
    setSelectedConversation(null);
    setIsAssistantModalOpen(true);
  }, []);

  const handleFindAlternative = (medicine: Medicine) => {
    const priceSorter = (a: Medicine, b: Medicine) => parseFloat(a['Public price']) - parseFloat(b['Public price']);
    const direct = medicines.filter(m => m['Scientific Name'] === medicine['Scientific Name'] && m.RegisterNumber !== medicine.RegisterNumber).sort(priceSorter);
    const therapeutic = medicines.filter(m => m.AtcCode1 && medicine.AtcCode1 && m.AtcCode1 === medicine.AtcCode1 && m['Scientific Name'] !== medicine['Scientific Name']).sort(priceSorter);
    setSourceMedicine(medicine);
    setAlternativesResults({ direct, therapeutic });
    setView('alternatives');
  };

  const handleCloseAssistant = (historyToSave: ChatMessage[]) => {
    if (historyToSave.length <= 1) {
        setIsAssistantModalOpen(false);
        setSelectedConversation(null);
        setAssistantContextMedicine(null);
        return;
    }

    let newConversations: Conversation[];
    if (selectedConversation) {
        const updatedConversation = { ...selectedConversation, messages: historyToSave, timestamp: Date.now() };
        newConversations = conversations.map(c => c.id === selectedConversation.id ? updatedConversation : c);
    } else {
        const userMessage = historyToSave.find(m => m.role === 'user');
        const title = userMessage?.parts.find(p => 'text' in p && p.text)?.text?.substring(0, 40) || t('newConversation');
        const newConversation: Conversation = { id: Date.now().toString(), title, messages: historyToSave, timestamp: Date.now() };
        newConversations = [newConversation, ...conversations];
    }
    
    newConversations.sort((a, b) => b.timestamp - a.timestamp);
    setConversations(newConversations);
    localStorage.setItem('chatHistory', JSON.stringify(newConversations));
    setIsAssistantModalOpen(false);
    setSelectedConversation(null);
    setAssistantContextMedicine(null);
  };
  
  const handleSavePrescription = useCallback((prescription: PrescriptionData) => {
      setPrescriptions(prev => [prescription, ...prev]);
  }, []);

  const handleSelectPrescription = useCallback((p: PrescriptionData) => {
    setSelectedPrescription(p);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setAssistantContextMedicine(null);
    setAssistantInitialPrompt('');
    setSelectedConversation(conversation);
    setIsAssistantModalOpen(true);
  };

  const handleDeleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
  };
  
  const handleClearHistory = () => {
    setConversations([]);
    localStorage.removeItem('chatHistory');
  };

  const handleBarcodeDetected = useCallback((barcode: string) => {
    setIsBarcodeScannerOpen(false);
    setAssistantContextMedicine(null);
    const prompt = language === 'ar'
        ? `تم مسح باركود: ${barcode}`
        : `Scanned barcode: ${barcode}`;
    setAssistantInitialPrompt(prompt);
    setSelectedConversation(null);
    setIsAssistantModalOpen(true);
  }, [language]);

  const uniqueManufactureNames = useMemo(() => {
    const names = new Set<string>(medicines.map(m => m['Manufacture Name']));
    return Array.from(names).filter(Boolean).sort();
  }, [medicines]);

  const uniqueLegalStatuses = useMemo(() => {
    const statuses = new Set<string>(medicines.map(m => m['Legal Status']));
    return Array.from(statuses).filter(Boolean).sort();
  }, [medicines]);

  const groupedPharmaceuticalForms = useMemo(() => {
    // FIX: Explicitly specify the generic type for `new Set` to ensure correct type inference.
    const forms = Array.from(new Set<string>(medicines.map(m => m.PharmaceuticalForm)));
    return groupPharmaceuticalForms(forms, t);
  }, [medicines, t]);

  const headerRef = useRef<HTMLElement>(null);

  const getHeaderTitle = () => {
    if (activeTab === 'search') {
      if (view === 'details' && selectedMedicine) return selectedMedicine['Trade Name'];
      if (view === 'alternatives' && sourceMedicine) return t('alternativesFor', { name: sourceMedicine['Trade Name'] });
      return t('appTitle');
    }
    if (activeTab === 'insurance') {
      if (view === 'insuranceDetails' && selectedInsuranceData) return selectedInsuranceData.scientificGroup.scientificName;
      return t('insuranceSearchTitle');
    }
    if (activeTab === 'prescriptions') {
      return selectedPrescription ? t('viewPrescription') : t('navPrescriptions');
    }
    if (activeTab === 'assistant') {
      return t('navAssistant');
    }
    if (activeTab === 'settings') {
      if (view === 'addData') return t('addDataTitle');
      if (view === 'addInsuranceData') return t('addInsuranceDataTitle');
      if (view === 'addGuidelinesData') return t('addGuidelinesDataTitle');
      if (view === 'chatHistory') return t('chatHistoryTitle');
      return t('navSettings');
    }
    return t('appTitle');
  };

  const showBackButton = useMemo(() => {
    if (activeTab === 'prescriptions' && selectedPrescription) return true;
    return ['details', 'alternatives', 'addData', 'addInsuranceData', 'addGuidelinesData', 'chatHistory', 'insuranceDetails'].includes(view);
  }, [view, activeTab, selectedPrescription]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'search') {
        setView(isSearchActive ? 'results' : 'search');
    } else if (tab === 'insurance') {
        setView('insuranceSearch');
    } else if (tab === 'prescriptions') {
        setSelectedPrescription(null);
        setView('prescriptions');
    } else if (tab === 'assistant') {
        setView('clinicalAssistant');
    } else if (tab === 'settings') {
        setView('settings');
    }
  };

  const renderContent = () => {
    if (activeTab === 'search') {
      switch (view) {
        case 'search':
          return (
            <div className="flex flex-col justify-center items-center h-full text-center p-4">
              <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t('welcomeTitle')}</h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">{t('welcomeSubtitle')}</p>
            </div>
          );
        case 'results':
          return <ResultsList medicines={searchResults} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleOpenContextualAssistant} onFindAlternative={handleFindAlternative} t={t} language={language} resultsState={searchResults.length > 0 ? 'loaded' : 'empty'} />;
        case 'details':
          return selectedMedicine ? <MedicineDetail medicine={selectedMedicine} t={t} language={language} /> : null;
        case 'alternatives':
          return sourceMedicine && alternativesResults ? <AlternativesView sourceMedicine={sourceMedicine} alternatives={alternativesResults} onMedicineSelect={handleMedicineSelect} onMedicineLongPress={handleOpenContextualAssistant} onFindAlternative={handleFindAlternative} t={t} language={language} /> : null;
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
                    onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }}
                    insuranceSearchTerm={insuranceSearchTerm}
                    setInsuranceSearchTerm={setInsuranceSearchTerm}
                    insuranceSearchMode={insuranceSearchMode}
                    setInsuranceSearchMode={setInsuranceSearchMode}
                />;
            case 'insuranceDetails':
                return selectedInsuranceData ? <InsuranceDetailsView data={selectedInsuranceData} t={t} /> : null;
            default:
                return <InsuranceSearchView 
                    t={t} 
                    language={language} 
                    allMedicines={medicines} 
                    insuranceData={insuranceData} 
                    onSelectInsuranceData={(data) => { setSelectedInsuranceData(data); setView('insuranceDetails'); }} 
                    insuranceSearchTerm={insuranceSearchTerm}
                    setInsuranceSearchTerm={setInsuranceSearchTerm}
                    insuranceSearchMode={insuranceSearchMode}
                    setInsuranceSearchMode={setInsuranceSearchMode}
                />;
        }
    }

    if (activeTab === 'prescriptions') {
        return selectedPrescription ? (
             <PrescriptionView prescriptionData={selectedPrescription} t={t} />
        ) : (
             <PrescriptionListView prescriptions={prescriptions} onSelectPrescription={handleSelectPrescription} t={t} />
        );
    }
    
    if (activeTab === 'assistant') {
        return <ClinicalAssistantView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} clinicalGuidelines={clinicalGuidelines} onSavePrescription={handleSavePrescription} chatHistory={clinicalAssistantChatHistory} setChatHistory={setClinicalAssistantChatHistory} />;
    }

    if (activeTab === 'settings') {
        switch (view) {
            case 'addData':
                return <AddDataView onImport={handleImportData} t={t} />;
            case 'addInsuranceData':
                return <AddInsuranceDataView onImport={handleImportInsuranceData} t={t} />;
            case 'addGuidelinesData':
                return <AddGuidelinesDataView onImport={handleImportGuidelinesData} t={t} />;
            case 'chatHistory':
                return <ChatHistoryView conversations={conversations} onSelectConversation={handleSelectConversation} onDeleteConversation={handleDeleteConversation} onClearHistory={handleClearHistory} t={t} language={language} />;
            default:
                return (
                    <div className="space-y-4">
                        <div className="bg-light-card dark:bg-dark-card rounded-xl p-2 shadow-sm">
                            <h3 className="font-bold text-lg mb-1 px-2">{t('generalSettings')}</h3>
                            <div className='divide-y divide-gray-100 dark:divide-slate-800'>
                                <button onClick={() => setLanguage(lang => lang === 'ar' ? 'en' : 'ar')} className="w-full text-left p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 flex justify-between items-center transition-colors">
                                    <span>{t('languageSwitcher')}</span>
                                    <span className="font-semibold text-primary">{t('langShortOpposite')}</span>
                                </button>
                                <button onClick={toggleTheme} className="w-full text-left p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 flex justify-between items-center transition-colors">
                                    <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>
                                    <span className="text-primary">{theme === 'light' ? <MoonIcon /> : <SunIcon />}</span>
                                </button>
                            </div>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card rounded-xl p-2 shadow-sm">
                             <h3 className="font-bold text-lg mb-1 px-2">{t('dataManagement')}</h3>
                             <div className='divide-y divide-gray-100 dark:divide-slate-800'>
                                <button onClick={() => setView('addData')} className="w-full text-left p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 transition-colors">
                                    <DatabaseIcon /><span>{t('addData')}</span>
                                </button>
                                <button onClick={() => setView('addInsuranceData')} className="w-full text-left p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 transition-colors">
                                    <DatabaseIcon /><span>{t('addInsuranceData')}</span>
                                </button>
                                <button onClick={() => setView('addGuidelinesData')} className="w-full text-left p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 transition-colors">
                                    <DatabaseIcon /><span>{t('addGuidelinesData')}</span>
                                </button>
                                <button onClick={() => setView('chatHistory')} className="w-full text-left p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-3 transition-colors">
                                    <HistoryIcon /><span>{t('chatHistoryTitle')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    }

    return null;
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-light-bg dark:bg-dark-bg">
      <Header ref={headerRef} title={getHeaderTitle()} showBack={showBackButton} onBack={handleBack} />
      
      <main className="flex-grow overflow-y-auto no-scrollbar pb-20">
        {activeTab === 'search' && (
            <div className="p-4 pt-3 space-y-3 sticky top-0 bg-light-bg dark:bg-dark-bg z-10">
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
                {isSearchActive && (
                    <div className="flex justify-between items-center pt-1">
                        <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={activeFilterCount} t={t} />
                        <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                    </div>
                )}
            </div>
        )}
        <div className={activeTab !== 'search' && activeTab !== 'assistant' ? 'p-4' : activeTab === 'search' ? 'px-4' : ''}>
            {renderContent()}
        </div>
      </main>

      {view !== 'details' && view !== 'alternatives' && <div className="fixed bottom-20 right-4 z-20"><FloatingAssistantButton onClick={handleOpenGeneralAssistant} onLongPress={() => {}} t={t} language={language} /></div>}

      <BottomNavBar activeTab={activeTab} setActiveTab={handleTabChange} t={t} onPrescriptionLongPress={handleOpenPrescriptionAssistant} />

      {isAssistantModalOpen && (
        <AssistantModal
          isOpen={isAssistantModalOpen}
          onSaveAndClose={handleCloseAssistant}
          contextMedicine={assistantContextMedicine}
          allMedicines={medicines}
          initialPrompt={assistantInitialPrompt}
          initialHistory={selectedConversation?.messages}
          t={t}
          language={language}
        />
      )}
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
        onBarcodeDetected={handleBarcodeDetected}
        t={t}
      />
    </div>
  );
};

export default App;