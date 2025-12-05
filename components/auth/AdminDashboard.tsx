
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TFunction, User, Medicine, AppSettings, InsuranceDrug, Cosmetic } from '../../types';
import { useAuth } from './AuthContext';
import ChartIcon from '../icons/ChartIcon';
import UsersIcon from '../icons/UsersIcon';
import PillBottleIcon from '../icons/PillBottleIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SearchIcon from '../icons/SearchIcon';
import TrashIcon from '../icons/TrashIcon';
import EditIcon from '../icons/EditIcon';
import HealthInsuranceIcon from '../icons/HealthInsuranceIcon';
import CosmeticsIcon from '../icons/CosmeticsIcon';
import BackIcon from '../icons/BackIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import DownloadIcon from '../icons/DownloadIcon';
import SearchableDropdown from '../SearchableDropdown';
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { setItem } from '../../utils/storage';

const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';
const COSMETICS_CACHE_KEY = 'saudi_drug_directory_cosmetics_cache_v3';

type Panel = 'menu' | 'overview' | 'users' | 'medicines' | 'insurance' | 'cosmetics' | 'settings' | 'migration' | 'addItem';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-4 border border-slate-200 dark:border-slate-700">
        <div className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light p-2.5 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-light-text dark:text-dark-text">{value}</p>
        </div>
    </div>
);

// Resized Menu Card (Smaller)
const MenuCard: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; colorClass: string }> = ({ title, icon, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${colorClass} h-24 w-full`}
    >
        <div className="w-6 h-6 mb-2 opacity-80">{icon}</div>
        <span className="font-bold text-sm">{title}</span>
    </button>
);

interface AdminDashboardProps {
  t: TFunction;
  allMedicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  insuranceData: InsuranceDrug[];
  setInsuranceData: React.Dispatch<React.SetStateAction<InsuranceDrug[]>>;
  cosmetics: Cosmetic[];
  setCosmetics?: React.Dispatch<React.SetStateAction<Cosmetic[]>>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ t, allMedicines, setMedicines, insuranceData, setInsuranceData, cosmetics = [], setCosmetics }) => {
  const { updateUser, deleteUser, getSettings, updateSettings } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>('menu');
  
  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Add Single Item State
  const [addItemType, setAddItemType] = useState<'medicine' | 'supplement' | 'cosmetic'>('medicine');
  const [newItemData, setNewItemData] = useState<any>({});
  
  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  
  // Migration State
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigrationLocked, setIsMigrationLocked] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
      if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [migrationLogs]);

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      setMigrationLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Fetch users from Firestore
  const fetchUsers = async () => {
      if (FIREBASE_DISABLED) return;
      try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          const usersList: User[] = [];
          querySnapshot.forEach((doc) => {
              usersList.push({ id: doc.id, ...doc.data() } as User);
          });
          setUsers(usersList);
      } catch (e) {
          console.error("Error fetching users", e);
      }
  };

  useEffect(() => {
    if (activePanel === 'users' || activePanel === 'overview') {
        fetchUsers();
    }
  }, [activePanel]);
  
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return users;
    const lowerTerm = userSearchTerm.toLowerCase();
    return users.filter(u => 
        u.username.toLowerCase().includes(lowerTerm) || 
        (u.email && u.email.toLowerCase().includes(lowerTerm))
    );
  }, [users, userSearchTerm]);

  const handleEditUserClick = (user: User) => {
      setEditingUser({ ...user });
      setIsEditUserModalOpen(true);
  };

  const handleSaveUser = async () => {
      if (!editingUser) return;
      await updateUser(editingUser);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setIsEditUserModalOpen(false);
      setEditingUser(null);
  };

  const handleUserDelete = async (userId: string) => {
    if (window.confirm(t('confirmDeleteUser'))) {
        await deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        
        if (editingUser && editingUser.id === userId) {
            setIsEditUserModalOpen(false);
            setEditingUser(null);
        }
    }
  };

  // Derived Data for Dropdowns
  const uniqueManufacturers = useMemo(() => {
      const set = new Set<string>();
      allMedicines.forEach(m => set.add(m['Manufacture Name']));
      cosmetics.forEach(c => set.add(c.manufacturerNameEn));
      return Array.from(set).filter(Boolean).sort();
  }, [allMedicines, cosmetics]);

  const uniqueScientificNames = useMemo(() => {
      const set = new Set<string>();
      allMedicines.forEach(m => set.add(m['Scientific Name']));
      return Array.from(set).filter(Boolean).sort();
  }, [allMedicines]);

  const uniqueForms = useMemo(() => {
      const set = new Set<string>();
      allMedicines.forEach(m => set.add(m.PharmaceuticalForm));
      return Array.from(set).filter(Boolean).sort();
  }, [allMedicines]);

  const uniqueBrands = useMemo(() => {
      const set = new Set<string>();
      cosmetics.forEach(c => set.add(c.BrandName));
      return Array.from(set).filter(Boolean).sort();
  }, [cosmetics]);

  // --- Add Item Handlers ---
  const handleAddItem = () => {
      if (addItemType === 'medicine' || addItemType === 'supplement') {
          if (!newItemData['Trade Name'] || !newItemData['Public price']) {
              alert("Trade Name and Price are required.");
              return;
          }
          
          const newMed: Medicine = {
              RegisterNumber: newItemData.RegisterNumber || `custom-${Date.now()}`,
              "Trade Name": newItemData['Trade Name'],
              "Scientific Name": newItemData['Scientific Name'] || '',
              "Public price": newItemData['Public price'],
              PharmaceuticalForm: newItemData['PharmaceuticalForm'] || '',
              Strength: newItemData['Strength'] || '',
              StrengthUnit: newItemData['StrengthUnit'] || '',
              "Manufacture Name": newItemData['Manufacture Name'] || '',
              "Product type": addItemType === 'medicine' ? 'Human' : 'Supplement',
              DrugType: newItemData.DrugType || (addItemType === 'medicine' ? 'Generic' : 'Health'),
              "Legal Status": newItemData['Legal Status'] || 'OTC',
              "Product Control": newItemData['Product Control'] || 'Uncontrolled',
              
              // Full field mapping
              ReferenceNumber: newItemData.ReferenceNumber || '',
              "Old register Number": newItemData['Old register Number'] || '',
              "Sub-Type": newItemData['Sub-Type'] || '',
              AdministrationRoute: newItemData.AdministrationRoute || '',
              AtcCode1: newItemData.AtcCode1 || '',
              AtcCode2: newItemData.AtcCode2 || '',
              Size: newItemData.Size || '',
              SizeUnit: newItemData.SizeUnit || '',
              PackageTypes: newItemData.PackageTypes || '',
              PackageSize: newItemData.PackageSize || '',
              "Distribute area": newItemData['Distribute area'] || '',
              shelfLife: newItemData.shelfLife || '',
              "Storage conditions": newItemData['Storage conditions'] || '',
              "Storage Condition Arabic": newItemData['Storage Condition Arabic'] || '',
              "Marketing Company": newItemData['Marketing Company'] || '',
              "Marketing Country": newItemData['Marketing Country'] || '',
              "Manufacture Country": newItemData['Manufacture Country'] || '',
              "Secondry package  manufacture": newItemData['Secondry package  manufacture'] || '',
              "Main Agent": newItemData['Main Agent'] || '',
              "Secosnd Agent": newItemData['Secosnd Agent'] || '',
              "Third agent": newItemData['Third agent'] || '',
              "Description Code": newItemData['Description Code'] || '',
              "Authorization Status": newItemData['Authorization Status'] || 'Valid',
              "Last Update": new Date().toISOString()
          };
          
          setMedicines(prev => {
              const updated = [...prev, newMed];
              setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
              return updated;
          });
          alert(`${addItemType} added successfully!`);
          setNewItemData({});
      } else {
          // Cosmetic
          if (!newItemData['SpecificName']) {
              alert("Product Name is required.");
              return;
          }
          const newCosmetic: Cosmetic = {
              id: `custom-cosmetic-${Date.now()}`,
              BrandName: newItemData['BrandName'] || 'Unknown',
              SpecificName: newItemData['SpecificName'],
              SpecificNameAr: newItemData['SpecificNameAr'] || '',
              manufacturerNameEn: newItemData['manufacturerNameEn'] || '',
              manufacturerCountryEn: newItemData['manufacturerCountryEn'] || '',
              manufacturerCountryAr: newItemData['manufacturerCountryAr'] || '',
              FirstSubCategoryEn: newItemData['FirstSubCategoryEn'] || '',
              FirstSubCategoryAr: newItemData['FirstSubCategoryAr'] || '',
              SecondSubCategoryEn: newItemData['SecondSubCategoryEn'] || '',
              SecondSubCategoryAr: newItemData['SecondSubCategoryAr'] || '',
              "Active ingredient": newItemData['Active ingredient'] || '',
              "Key Ingredients": newItemData['Key Ingredients'] || '',
              Highlights: newItemData.Highlights || ''
          };
          
          if (setCosmetics) {
              setCosmetics(prev => {
                  const updated = [...prev, newCosmetic];
                  setItem(COSMETICS_CACHE_KEY, updated).catch(console.error);
                  return updated;
              });
              alert("Cosmetic added successfully!");
              setNewItemData({});
          }
      }
  };

  const SmartSelect = ({ 
      label, 
      value, 
      onChange, 
      options 
  }: { 
      label: string, 
      value: string, 
      onChange: (val: string) => void, 
      options: string[] 
  }) => {
      // Use state to switch between dropdown and manual input
      const [isManual, setIsManual] = useState(false);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
          if (isManual && inputRef.current) {
              inputRef.current.focus();
          }
      }, [isManual]);

      return (
          <div className="w-full">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    {isManual ? (
                        <div className="relative animate-fade-in">
                            <input
                                ref={inputRef}
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full p-2 border-2 border-primary/50 rounded-xl dark:bg-slate-700 dark:border-primary/50 focus:outline-none"
                                placeholder={`Type new ${label.toLowerCase()}...`}
                            />
                            <button 
                                onClick={() => setIsManual(false)} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                title="Cancel adding new"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <SearchableDropdown
                            ariaLabel={label}
                            options={options}
                            value={value}
                            onChange={(val) => onChange(Array.isArray(val) ? val[0] : val)}
                            placeholder={t('pleaseSelectOrAdd')}
                            t={t}
                        />
                    )}
                  </div>
                  {!isManual && (
                      <button 
                        type="button"
                        onClick={() => { setIsManual(true); onChange(''); }} 
                        className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-colors flex-shrink-0 shadow-sm"
                        title={t('addNew')}
                      >
                          <div className="text-lg leading-none font-bold">+</div>
                      </button>
                  )}
              </div>
          </div>
      );
  };

  const SectionTitle = ({ title }: { title: string }) => (
      <h4 className="text-sm font-bold text-primary dark:text-primary-light uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 mt-6">{title}</h4>
  );

  // --- View Components ---

  const renderOverview = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t('totalUsers')} value={users.length} icon={<UsersIcon />} />
              <StatCard title={t('premiumUsers')} value={users.filter(u => u.role === 'premium').length} icon={<UsersIcon />} />
              <StatCard title={t('medicines')} value={allMedicines.length} icon={<PillBottleIcon />} />
              <StatCard title={t('aiRequestsToday')} value={users.reduce((acc, u) => acc + (u.aiRequestCount || 0), 0)} icon={<ChartIcon />} />
          </div>
      </div>
  );

  const renderUsers = () => (
      <div className="space-y-4 animate-fade-in">
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <SearchIcon />
              </div>
              <input 
                  type="text" 
                  placeholder={t('searchUserPlaceholder')} 
                  className="pl-10 w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
              />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('username')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('role')}</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requests</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('actions')}</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                  {user.username}
                                  <span className="block text-xs text-slate-400 font-normal">{user.email}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {user.role === 'admin' ? t('adminRole') : t('premiumRole')}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                  {user.aiRequestCount || 0} / {user.customAiLimit || appSettings.aiRequestLimit || 3}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button onClick={() => handleEditUserClick(user)} className="text-primary hover:text-primary-dark font-bold px-3 py-1 bg-primary/10 rounded-lg transition-colors">
                                      {t('manageUser')}
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderAddSingleItem = () => (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-6 animate-fade-in w-full mx-auto">
          <div className="flex-shrink-0">
            <h3 className="text-xl font-bold mb-4 border-b pb-2 dark:border-slate-700">{t('addSingleItem')}</h3>
            
            <div className="flex gap-4 mb-6">
                <button onClick={() => setAddItemType('medicine')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${addItemType === 'medicine' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{t('medicines')}</button>
                <button onClick={() => setAddItemType('supplement')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${addItemType === 'supplement' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{t('supplements')}</button>
                <button onClick={() => setAddItemType('cosmetic')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${addItemType === 'cosmetic' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{t('navCosmetics')}</button>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(addItemType === 'medicine' || addItemType === 'supplement') && (
                    <>
                        {/* 1. Identification */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Identification" /></div>
                        
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('tradeName')} *</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none" value={newItemData['Trade Name'] || ''} onChange={e => setNewItemData({...newItemData, 'Trade Name': e.target.value})} />
                        </div>
                        
                        <div className="col-span-1 sm:col-span-2">
                            <SmartSelect label={t('scientificName')} value={newItemData['Scientific Name'] || ''} onChange={val => setNewItemData({...newItemData, 'Scientific Name': val})} options={uniqueScientificNames} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('price')} *</label>
                            <input type="number" step="0.01" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none" value={newItemData['Public price'] || ''} onChange={e => setNewItemData({...newItemData, 'Public price': e.target.value})} />
                        </div>

                        {/* 2. Composition & Package */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Composition & Package" /></div>

                        <div className="col-span-1 sm:col-span-2">
                            <SmartSelect label={t('pharmaceuticalForm')} value={newItemData['PharmaceuticalForm'] || ''} onChange={val => setNewItemData({...newItemData, 'PharmaceuticalForm': val})} options={uniqueForms} />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('strength')}</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Val" className="w-2/3 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none" value={newItemData['Strength'] || ''} onChange={e => setNewItemData({...newItemData, 'Strength': e.target.value})} />
                                <input type="text" placeholder="Unit" className="w-1/3 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none" value={newItemData['StrengthUnit'] || ''} onChange={e => setNewItemData({...newItemData, 'StrengthUnit': e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('packageSize')}</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Size" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none" value={newItemData['PackageSize'] || ''} onChange={e => setNewItemData({...newItemData, 'PackageSize': e.target.value})} />
                                <input type="text" placeholder="Type" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none" value={newItemData['PackageTypes'] || ''} onChange={e => setNewItemData({...newItemData, 'PackageTypes': e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Container</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Val" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none" value={newItemData['Size'] || ''} onChange={e => setNewItemData({...newItemData, 'Size': e.target.value})} />
                                <input type="text" placeholder="Unit" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none" value={newItemData['SizeUnit'] || ''} onChange={e => setNewItemData({...newItemData, 'SizeUnit': e.target.value})} />
                            </div>
                        </div>

                        {/* 3. Regulatory */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Regulatory & Classification" /></div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('legalStatus')}</label>
                            <select className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Legal Status'] || 'OTC'} onChange={e => setNewItemData({...newItemData, 'Legal Status': e.target.value})}>
                                <option value="OTC">OTC</option>
                                <option value="Prescription">Prescription</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('productControl')}</label>
                            <select className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Product Control'] || 'Uncontrolled'} onChange={e => setNewItemData({...newItemData, 'Product Control': e.target.value})}>
                                <option value="Uncontrolled">{t('uncontrolled')}</option>
                                <option value="Controlled">{t('controlled')}</option>
                                <option value="Restricted">{t('restricted')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('registrationNumber')}</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['RegisterNumber'] || ''} onChange={e => setNewItemData({...newItemData, 'RegisterNumber': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('oldRegisterNumber')}</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Old register Number'] || ''} onChange={e => setNewItemData({...newItemData, 'Old register Number': e.target.value})} />
                        </div>

                        {/* 4. Manufacturer & Logistics */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Manufacturer & Logistics" /></div>

                        <div className="col-span-1 sm:col-span-2">
                            <SmartSelect label={t('manufacturer')} value={newItemData['Manufacture Name'] || ''} onChange={val => setNewItemData({...newItemData, 'Manufacture Name': val})} options={uniqueManufacturers} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('countryOfManufacture')}</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Manufacture Country'] || ''} onChange={e => setNewItemData({...newItemData, 'Manufacture Country': e.target.value})} />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('marketingCompany')}</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Marketing Company'] || ''} onChange={e => setNewItemData({...newItemData, 'Marketing Company': e.target.value})} />
                        </div>
                        
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('mainAgent')}</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Main Agent'] || ''} onChange={e => setNewItemData({...newItemData, 'Main Agent': e.target.value})} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('agents')} (2nd / 3rd)</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Second Agent" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Secosnd Agent'] || ''} onChange={e => setNewItemData({...newItemData, 'Secosnd Agent': e.target.value})} />
                                <input type="text" placeholder="Third Agent" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Third agent'] || ''} onChange={e => setNewItemData({...newItemData, 'Third agent': e.target.value})} />
                            </div>
                        </div>

                        {/* 5. Storage & Codes */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Storage & Codes" /></div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('storageConditions')} (En)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Storage conditions'] || ''} onChange={e => setNewItemData({...newItemData, 'Storage conditions': e.target.value})} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('storageConditions')} (Ar)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-right" dir="rtl" value={newItemData['Storage Condition Arabic'] || ''} onChange={e => setNewItemData({...newItemData, 'Storage Condition Arabic': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('shelfLife')}</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['shelfLife'] || ''} onChange={e => setNewItemData({...newItemData, 'shelfLife': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('atcCode')}</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Code 1" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['AtcCode1'] || ''} onChange={e => setNewItemData({...newItemData, 'AtcCode1': e.target.value})} />
                                <input type="text" placeholder="Code 2" className="w-1/2 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['AtcCode2'] || ''} onChange={e => setNewItemData({...newItemData, 'AtcCode2': e.target.value})} />
                            </div>
                        </div>
                    </>
                )}

                {addItemType === 'cosmetic' && (
                    <>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Product Identity" /></div>
                        
                        <div className="col-span-1 sm:col-span-2">
                            <SmartSelect label={t('brandName')} value={newItemData['BrandName'] || ''} onChange={val => setNewItemData({...newItemData, 'BrandName': val})} options={uniqueBrands} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('productName')} (En) *</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['SpecificName'] || ''} onChange={e => setNewItemData({...newItemData, 'SpecificName': e.target.value})} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('productName')} (Ar)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-right" dir="rtl" value={newItemData['SpecificNameAr'] || ''} onChange={e => setNewItemData({...newItemData, 'SpecificNameAr': e.target.value})} />
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Categorization" /></div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category (En)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['FirstSubCategoryEn'] || ''} onChange={e => setNewItemData({...newItemData, 'FirstSubCategoryEn': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category (Ar)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-right" dir="rtl" value={newItemData['FirstSubCategoryAr'] || ''} onChange={e => setNewItemData({...newItemData, 'FirstSubCategoryAr': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sub-Category (En)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['SecondSubCategoryEn'] || ''} onChange={e => setNewItemData({...newItemData, 'SecondSubCategoryEn': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sub-Category (Ar)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-right" dir="rtl" value={newItemData['SecondSubCategoryAr'] || ''} onChange={e => setNewItemData({...newItemData, 'SecondSubCategoryAr': e.target.value})} />
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Origin" /></div>

                        <div className="col-span-1 sm:col-span-2">
                            <SmartSelect label="Manufacturer Name (En)" value={newItemData['manufacturerNameEn'] || ''} onChange={val => setNewItemData({...newItemData, 'manufacturerNameEn': val})} options={uniqueManufacturers} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Country (En)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['manufacturerCountryEn'] || ''} onChange={e => setNewItemData({...newItemData, 'manufacturerCountryEn': e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Country (Ar)</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-right" dir="rtl" value={newItemData['manufacturerCountryAr'] || ''} onChange={e => setNewItemData({...newItemData, 'manufacturerCountryAr': e.target.value})} />
                        </div>

                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"><SectionTitle title="Composition" /></div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('quickActionIngredient')}</label>
                            <textarea className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" rows={2} value={newItemData['Active ingredient'] || ''} onChange={e => setNewItemData({...newItemData, 'Active ingredient': e.target.value})} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Key Ingredients</label>
                            <textarea className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" rows={2} value={newItemData['Key Ingredients'] || ''} onChange={e => setNewItemData({...newItemData, 'Key Ingredients': e.target.value})} />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Highlights</label>
                            <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={newItemData['Highlights'] || ''} onChange={e => setNewItemData({...newItemData, 'Highlights': e.target.value})} />
                        </div>
                    </>
                )}
            </div>
          </div>

          <div className="pt-4 border-t dark:border-slate-700 flex justify-end flex-shrink-0">
              <button onClick={handleAddItem} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-600/20 transition-all">
                  {t('save')}
              </button>
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm animate-fade-in">
          <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white mb-4">{t('appSettingsTitle')}</h3>
              <div className="grid grid-cols-1 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('aiRequestLimit')}</label>
                      <input
                          type="number"
                          value={appSettings.aiRequestLimit ?? 3}
                          onChange={(e) => setAppSettings({ ...appSettings, aiRequestLimit: parseInt(e.target.value) })}
                          className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-2 text-sm text-slate-500">{t('aiRequestLimitDescription')}</p>
                  </div>
                  <div className="flex items-center">
                      <input
                          id="ai-enabled"
                          type="checkbox"
                          checked={appSettings.isAiEnabled}
                          onChange={(e) => setAppSettings({ ...appSettings, isAiEnabled: e.target.checked })}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="ai-enabled" className="ml-2 block text-sm text-slate-900 dark:text-white">
                          Enable AI Features Globally
                      </label>
                  </div>
                  <button
                      onClick={() => { updateSettings(appSettings); alert(t('save')); }}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                      {t('save')}
                  </button>
              </div>
          </div>
      </div>
  );

  const uploadBatch = async (collectionName: string, data: any[], idField?: string) => {
      const CHUNK_SIZE = 450;
      let processed = 0;
      
      addLog(`Preparing to upload ${data.length} items to '${collectionName}'...`);

      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          
          chunk.forEach((item) => {
              const docRef = idField && item[idField] 
                  ? doc(db, collectionName, String(item[idField])) 
                  : doc(collection(db, collectionName));
              
              batch.set(docRef, item);
          });
          
          try {
              await batch.commit();
              processed += chunk.length;
              addLog(`✓ Batch success: ${processed} / ${data.length} items synced.`);
          } catch (e: any) {
              addLog(`❌ Error in batch ${i}: ${e.message}`);
          }
      }
      addLog(`🎉 Migration for '${collectionName}' COMPLETED.`);
  };

  const handleMigration = async (type: 'medicines' | 'insurance' | 'cosmetics') => {
      if (!isMigrating && window.confirm(`Start uploading ${type} to Cloud?`)) {
          setIsMigrating(true);
          try {
              if (type === 'medicines') {
                  // DYNAMIC IMPORT
                  const { MEDICINE_DATA } = await import('../../data/data');
                  await uploadBatch('medicines', MEDICINE_DATA, 'RegisterNumber');
              } else if (type === 'insurance') {
                  const { INITIAL_INSURANCE_DATA } = await import('../../data/insurance-data');
                  const dataWithIds = INITIAL_INSURANCE_DATA.map(item => ({
                      ...item,
                      _id: `${item.scientificName}-${item.strength}-${item.form}`.replace(/[\/\s\.]/g, '_')
                  }));
                  await uploadBatch('insurance', dataWithIds, '_id');
              } else {
                  const { INITIAL_COSMETICS_DATA } = await import('../../data/cosmetics-data');
                  await uploadBatch('cosmetics', INITIAL_COSMETICS_DATA, 'id');
              }
          } catch (e: any) {
              addLog(`CRITICAL ERROR: ${e.message}`);
          } finally {
              setIsMigrating(false);
          }
      }
  };

  const handleExport = (type: 'medicines' | 'insurance' | 'cosmetics') => {
      addLog(`Preparing to export ${type}...`);
      let dataToExport: any[] = [];
      
      if (type === 'medicines') dataToExport = allMedicines;
      else if (type === 'insurance') dataToExport = insuranceData;
      else if (type === 'cosmetics') dataToExport = cosmetics;

      if (dataToExport.length === 0) {
          addLog(`⚠️ No data found for ${type} to export.`);
          return;
      }

      try {
          const jsonString = JSON.stringify(dataToExport, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pharmasource_${type}_export_${new Date().toISOString().slice(0,10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          addLog(`✅ Exported ${dataToExport.length} items to file.`);
      } catch (e: any) {
          addLog(`❌ Export failed: ${e.message}`);
      }
  };

  const renderMigration = () => (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-600">Migration Control Panel</h3>
              <div className="flex items-center gap-2">
                  <label className="flex items-center cursor-pointer text-sm text-red-600 font-semibold">
                      <input type="checkbox" checked={!isMigrationLocked} onChange={e => setIsMigrationLocked(!e.target.checked)} className="mr-2" />
                      Unlock Dangerous Actions
                  </label>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-3 border p-4 rounded-lg border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-sm text-slate-500 uppercase">Cloud Sync (Upload)</h4>
                  <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleMigration('medicines')} disabled={isMigrationLocked || isMigrating} className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                          <div className="h-5 w-5"><PillBottleIcon /></div> Meds
                      </button>
                      <button onClick={() => handleMigration('insurance')} disabled={isMigrationLocked || isMigrating} className="p-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                          <div className="h-5 w-5"><HealthInsuranceIcon /></div> Insur
                      </button>
                      <button onClick={() => handleMigration('cosmetics')} disabled={isMigrationLocked || isMigrating} className="p-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                          <div className="h-5 w-5"><CosmeticsIcon /></div> Cosm
                      </button>
                  </div>
              </div>

              {/* Export Section */}
              <div className="space-y-3 border p-4 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                  <h4 className="font-bold text-sm text-slate-500 uppercase">Extract Data (Download JSON)</h4>
                  <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleExport('medicines')} className="p-2 bg-white dark:bg-slate-700 border hover:bg-gray-50 text-slate-700 dark:text-white text-xs font-bold rounded flex flex-col items-center justify-center gap-1">
                          <div className="h-5 w-5"><DownloadIcon /></div> Meds
                      </button>
                      <button onClick={() => handleExport('insurance')} className="p-2 bg-white dark:bg-slate-700 border hover:bg-gray-50 text-slate-700 dark:text-white text-xs font-bold rounded flex flex-col items-center justify-center gap-1">
                          <div className="h-5 w-5"><DownloadIcon /></div> Insur
                      </button>
                      <button onClick={() => handleExport('cosmetics')} className="p-2 bg-white dark:bg-slate-700 border hover:bg-gray-50 text-slate-700 dark:text-white text-xs font-bold rounded flex flex-col items-center justify-center gap-1">
                          <div className="h-5 w-5"><DownloadIcon /></div> Cosm
                      </button>
                  </div>
              </div>
          </div>
          
          {/* Terminal Log */}
          <div className="mt-4 bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-64 overflow-y-auto shadow-inner" ref={logContainerRef}>
              <div className="flex justify-between items-center border-b border-green-900/50 pb-2 mb-2 sticky top-0 bg-black">
                  <span>&gt;_ System Log</span>
                  <button onClick={() => setMigrationLogs([])} className="text-[10px] hover:text-white">CLEAR</button>
              </div>
              {migrationLogs.length === 0 && <span className="opacity-50">Ready for command...</span>}
              {migrationLogs.map((log, idx) => (
                  <div key={idx} className="mb-1 break-words">{log}</div>
              ))}
              {isMigrating && <div className="animate-pulse">_</div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center gap-2 sticky top-0 z-20">
                <button onClick={() => setActivePanel('menu')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <BackIcon />
                </button>
                <h2 className="text-xl font-bold capitalize">{activePanel === 'addItem' ? t('addNewItem') : activePanel}</h2>
            </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto">
            {activePanel === 'menu' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                    <MenuCard title={t('adminPanelOverview')} icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" />
                    <MenuCard title={t('userManagementTitle')} icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800" />
                    <MenuCard title={t('addNewItem')} icon={<div className="text-xl font-bold">+</div>} onClick={() => setActivePanel('addItem')} colorClass="bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800" />
                    <MenuCard title={t('appSettingsTitle')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" />
                    <MenuCard title="Migration" icon={<DatabaseIcon />} onClick={() => setActivePanel('migration')} colorClass="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800" />
                </div>
            )}

            {activePanel === 'overview' && renderOverview()}
            {activePanel === 'users' && renderUsers()}
            {activePanel === 'addItem' && renderAddSingleItem()}
            {activePanel === 'settings' && renderSettings()}
            {activePanel === 'migration' && renderMigration()}
            {(activePanel === 'medicines' || activePanel === 'insurance' || activePanel === 'cosmetics') && (
                <div className="text-center p-8 text-gray-500">
                    Use standard search/edit flow or Migration tool.
                </div>
            )}
        </div>

        {/* Enhanced User Management Modal */}
        {isEditUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsEditUserModalOpen(false)}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 flex-shrink-0">
                        <div>
                            <h3 className="text-xl font-bold">{t('manageUser')}</h3>
                            <p className="text-sm text-slate-500">{editingUser.email}</p>
                        </div>
                        <button onClick={() => setIsEditUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><span className="text-2xl">&times;</span></button>
                    </div>
                    
                    <div className="space-y-6 overflow-y-auto flex-grow pr-2">
                        {/* Role Control */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">{t('role')}</h4>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingUser({...editingUser, role: 'premium'})}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${editingUser.role === 'premium' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}
                                >
                                    {t('premiumRole')}
                                </button>
                                <button 
                                    onClick={() => setEditingUser({...editingUser, role: 'admin'})}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${editingUser.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}
                                >
                                    {t('adminRole')}
                                </button>
                            </div>
                        </div>

                        {/* AI Access Control */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">{t('aiUsage')}</h4>
                            
                            <div className="flex justify-between items-center mb-4 p-3 bg-white dark:bg-slate-800 rounded border dark:border-slate-700">
                                <div>
                                    <span className="text-xs text-slate-500">Current Usage</span>
                                    <p className="font-bold text-xl">{editingUser.aiRequestCount || 0} / {editingUser.customAiLimit || appSettings.aiRequestLimit || 3}</p>
                                </div>
                                <button 
                                    onClick={() => setEditingUser({...editingUser, aiRequestCount: 0})}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                                >
                                    {t('resetAiUsage')}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('customAiLimit')}</label>
                                    <input 
                                        type="number" 
                                        value={editingUser.customAiLimit || ''} 
                                        onChange={e => setEditingUser({...editingUser, customAiLimit: parseInt(e.target.value) || undefined})}
                                        placeholder="Default"
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none" 
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center cursor-pointer p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600">
                                        <input 
                                            type="checkbox" 
                                            className="mr-2"
                                            checked={editingUser.prescriptionPrivilege || false} 
                                            onChange={e => setEditingUser({...editingUser, prescriptionPrivilege: e.target.checked})} 
                                        />
                                        <span className="text-xs font-bold">{t('grantPrescriptionAccess')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                            <h4 className="font-bold text-sm text-red-700 dark:text-red-400 mb-3">{t('dangerZone')}</h4>
                            <button 
                                onClick={() => handleUserDelete(editingUser.id)}
                                className="w-full py-2 px-4 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <TrashIcon /> {t('delete')}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700 mt-2">
                        <button onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                        <button onClick={handleSaveUser} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-lg shadow-primary/30">{t('save')}</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
