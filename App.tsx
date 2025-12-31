
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Medicine, 
  TFunction, 
  Language, 
  View, 
  Tab, 
  Filters, 
  SortByOption, 
  SelectedInsuranceData, 
  InsuranceSearchMode,
  Cosmetic,
  MilkProduct,
  ChatMessage
} from './types';
import { translations } from './translations';
import Header from './components/Header';
import BottomNavBar from './components/BottomNavBar';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import MedicineDetail from './components/MedicineDetail';
import AlternativesView from './components/AlternativesView';
import FilterModal from './components/FilterModal';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyEmailView } from './components/auth/VerifyEmailView';
import { AdminDashboard } from './components/auth/AdminDashboard';
import MilkView from './components/MilkView';
import CosmeticsView from './components/CosmeticsView';
import CosmeticDetail from './components/CosmeticDetail';
import InsuranceSearchView from './components/InsuranceSearchView';
import InsuranceDetailsView from './components/InsuranceDetailsView';
import SettingsView from './components/SettingsView';
import FilterButton from './components/FilterButton';
import SortControls from './components/SortControls';
import GlobeIcon from './components/icons/GlobeIcon';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import { useAuth } from './components/auth/AuthContext';

// Data imports from initial data files
import { MEDICINE_DATA } from './data/data';
import { INITIAL_INSURANCE_DATA } from './data/insurance-data';
import { INITIAL_COSMETICS_DATA } from './data/cosmetics-data';
import { INITIAL_MILK_DATA } from './data/milk-data';
import { groupPharmaceuticalForms } from './utils/formHelpers';

/**
 * Main application component.
 * Orchestrates views, handles global state, and manages data flow.
 */
const App: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Basic Navigation and Layout State
  const [view, setView] = useState<View>('search');
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Search state for Medicines
  const [searchTerm, setSearchTerm] = useState('');
  const [forceSearch, setForceSearch] = useState(false);
  const [textSearchMode, setTextSearchMode] = useState<'tradeName' | 'scientificName'>('tradeName');
  const [sortBy, setSortBy] = useState<SortByOption>('alphabetical');
  const [resultsLimit, setResultsLimit] = useState(20);
  
  // Master data state
  const [medicines, setMedicines] = useState<Medicine[]>(MEDICINE_DATA);
  const [insuranceData, setInsuranceData] = useState(INITIAL_INSURANCE_DATA);
  const [cosmetics, setCosmetics] = useState(INITIAL_COSMETICS_DATA);
  const [milkProducts] = useState(INITIAL_MILK_DATA);
  
  // Selection and context state
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [sourceMedicine, setSourceMedicine] = useState<Medicine | null>(null);
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedInsuranceData, setSelectedInsuranceData] = useState<SelectedInsuranceData | null>(null);
  
  // Favorites and Modal UI state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  
  // Online Availability (AI/Search simulation) state
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ text: string, sources: any[] } | null>(null);

  // Tab-specific search filters
  const [cosmeticsSearchTerm, setCosmeticsSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [insuranceSearchMode, setInsuranceSearchMode] = useState<InsuranceSearchMode>('tradeName');

  // Multi-language translation engine
  const t: TFunction = useCallback((key, replacements) => {
    let text = translations[language][key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(k => {
        text = text.replace(`{${k}}`, String(replacements[k]));
      });
    }
    return text;
  }, [language]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleCheckAvailability = (termOrMed: string | Medicine) => {
    setIsCheckingAvailability(true);
    // Simulate real-time online pharmacy availability check
    setTimeout(() => {
        setAvailabilityResult({ text: "Information retrieved from Nahdi and Al-Dawaa indicates current stock is available for pickup or delivery.", sources: [] });
        setIsCheckingAvailability(false);
    }, 1200);
  };

  // Medicine search filtering logic
  const filteredMedicines = useMemo(() => {
    let filtered = medicines;
    if (searchTerm) {
        const lower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(m => {
            const field = textSearchMode === 'tradeName' ? m['Trade Name'] : m['Scientific Name'];
            return field.toLowerCase().includes(lower);
        });
    }
    return filtered;
  }, [medicines, searchTerm, textSearchMode]);

  // Sync visual theme with root document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const renderContent = () => {
      // Authentication and Access Control checks
      if (isAuthLoading) return <div className="py-20 text-center">جاري التحميل...</div>;
      if (view === 'login') return <LoginView t={t} onSwitchToRegister={() => setView('register')} onLoginSuccess={() => { setView('search'); setActiveTab('search'); }} />;
      if (view === 'register') return <RegisterView t={t} onSwitchToLogin={() => setView('login')} onRegisterSuccess={() => setView('login')} />;
      if (user && !user.emailVerified) return <VerifyEmailView user={user} t={t} />;
      if (view === 'admin') return <AdminDashboard t={t} allMedicines={medicines} setMedicines={setMedicines} insuranceData={insuranceData} setInsuranceData={setInsuranceData} cosmetics={cosmetics} />;

      // Search Tab Logic
      if (activeTab === 'search') {
          const isSearchActive = searchTerm.replace(/%/g, '').trim().length >= 3 || forceSearch;
          return (
              <div className="animate-fade-in">
                <div className={view === 'search' || view === 'results' ? 'contents' : 'hidden'}>
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} textSearchMode={textSearchMode} setTextSearchMode={setTextSearchMode} isSearchActive={isSearchActive} onClearSearch={() => {setSearchTerm(''); setView('search'); setAvailabilityResult(null);}} onForceSearch={() => setForceSearch(true)} onBarcodeScanClick={() => setIsBarcodeScannerOpen(true)} t={t} />
                    <div className="flex gap-2 mt-2">
                        <FilterButton onClick={() => setIsFilterModalOpen(true)} activeCount={0} t={t} />
                        <SortControls sortBy={sortBy} setSortBy={setSortBy} t={t} />
                    </div>
                    <div className="mt-4">
                        {isSearchActive ? (
                            <>
                                <ResultsList medicines={filteredMedicines} onMedicineSelect={m => { setSelectedMedicine(m); setView('details'); }} onMedicineLongPress={m => { setSelectedMedicine(m); setView('details'); }} onFindAlternative={m => { setSourceMedicine(m); setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} resultsState={filteredMedicines.length > 0 ? 'loaded' : 'empty'} limit={resultsLimit} onLoadMore={() => setResultsLimit(prev => prev + 20)} />
                                {filteredMedicines.length === 0 && !isCheckingAvailability && (
                                    <div className="mt-6 p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 text-center">
                                        <p className="text-sm font-bold text-slate-600 mb-4">{t('noResultsSubtitle')}</p>
                                        <button onClick={() => handleCheckAvailability(searchTerm)} className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2"><GlobeIcon /> {t('searchOnlineBtn')}</button>
                                    </div>
                                )}
                                {isCheckingAvailability && <div className="mt-6 text-center animate-pulse">جاري البحث في الصيدليات...</div>}
                                {availabilityResult && view !== 'details' && (
                                    <div className="mt-6 p-6 bg-white dark:bg-dark-card rounded-2xl border border-slate-100 shadow-md">
                                        <h3 className="font-black text-primary flex items-center gap-2 mb-4"><GlobeIcon /> {t('availabilityStatus')}</h3>
                                        <div className="text-sm ai-response-content">{availabilityResult.text}</div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-20 text-center opacity-60">
                                <h2 className="text-xl font-bold text-gray-400">PharmaSource KSA</h2>
                                <p className="text-sm text-gray-400 mt-2">{t('welcomeSubtitle')}</p>
                            </div>
                        )}
                    </div>
                </div>
                {view === 'details' && selectedMedicine && <MedicineDetail medicine={selectedMedicine} t={t} language={language} isFavorite={favorites.includes(selectedMedicine.RegisterNumber)} onToggleFavorite={toggleFavorite} user={user} onCheckAvailability={() => handleCheckAvailability(selectedMedicine)} isCheckingAvailability={isCheckingAvailability} availabilityResult={availabilityResult} />}
                {view === 'alternatives' && sourceMedicine && <AlternativesView sourceMedicine={sourceMedicine} alternatives={{direct: medicines.filter(m => m['Scientific Name'] === sourceMedicine['Scientific Name'] && m.RegisterNumber !== sourceMedicine.RegisterNumber), therapeutic: []}} onMedicineSelect={m => { setSelectedMedicine(m); setView('details'); }} onMedicineLongPress={m => { setSelectedMedicine(m); setView('details'); }} onFindAlternative={m => { setSourceMedicine(m); setView('alternatives'); }} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} language={language} />}
              </>
          );
      }
      
      // Milk Formula Tab
      if (activeTab === 'milk') return <MilkView milkProducts={milkProducts} t={t} language={language} />;
      
      // Cosmetics Tab
      if (activeTab === 'cosmetics') {
          if (view === 'cosmeticDetails' && selectedCosmetic) {
              return <CosmeticDetail cosmetic={selectedCosmetic} t={t} language={language} user={user} />;
          }
          return <CosmeticsView t={t} language={language} cosmetics={cosmetics} onSelectCosmetic={c => { setSelectedCosmetic(c); setView('cosmeticDetails'); }} searchTerm={cosmeticsSearchTerm} setSearchTerm={setCosmeticsSearchTerm} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />;
      }
      
      // Insurance Coverage Tab
      if (activeTab === 'insurance') {
           if (view === 'insuranceDetails' && selectedInsuranceData) {
               return <InsuranceDetailsView data={selectedInsuranceData} t={t} />;
           }
           return <InsuranceSearchView t={t} language={language} allMedicines={medicines} insuranceData={insuranceData} onSelectInsuranceData={d => { setSelectedInsuranceData(d); setView('insuranceDetails'); }} insuranceSearchTerm={insuranceSearchTerm} setInsuranceSearchTerm={setInsuranceSearchTerm} insuranceSearchMode={insuranceSearchMode} setInsuranceSearchMode={setInsuranceSearchMode} />;
      }
      
      // Profile and Settings Tab
      if (activeTab === 'settings') return (
        <SettingsView 
            t={t} 
            language={language} 
            setLanguage={setLanguage} 
            theme={theme} 
            setTheme={setTheme} 
            user={user}
            onLoginClick={() => setView('login')}
        />
      );
      
      return null;
  };

  return (
      <div className={`min-h-screen bg-light-bg dark:bg-dark-bg font-tajawal transition-colors duration-300 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <Header 
            title="PharmaSource" 
            showBack={view !== 'search' && activeTab === 'search'} 
            onBack={() => setView('search')} 
            theme={theme} 
            toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
            t={t} 
            onLoginClick={() => setView('login')} 
            onAdminClick={() => setView('admin')} 
            view={view}
        />
        <main className="container mx-auto px-4 pt-24 pb-28 max-w-2xl min-h-screen">
            {renderContent()}
        </main>
        <BottomNavBar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setView('search'); }} t={t} user={user} view={view} />
        
        {isFilterModalOpen && (
            <FilterModal 
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)} 
                filters={{ productType: 'all', priceMin: '', priceMax: '', pharmaceuticalForm: '', manufactureName: [], legalStatus: '' }} 
                onFilterChange={() => {}} 
                onClearFilters={() => {}} 
                groupedPharmaceuticalForms={groupPharmaceuticalForms(Array.from(new Set(medicines.map(m => m.PharmaceuticalForm))), t)} 
                uniqueManufactureNames={Array.from(new Set(medicines.map(m => m['Manufacture Name'])))} 
                uniqueLegalStatuses={Array.from(new Set(medicines.map(m => m['Legal Status'])))} 
                t={t} 
            />
        )}
        
        <BarcodeScannerModal 
            isOpen={isBarcodeScannerOpen} 
            onClose={() => setIsBarcodeScannerOpen(false)} 
            onBarcodeDetected={(code) => { setSearchTerm(code); setForceSearch(true); setIsBarcodeScannerOpen(false); }} 
            t={t} 
        />
      </div>
  );
};

export default App;
