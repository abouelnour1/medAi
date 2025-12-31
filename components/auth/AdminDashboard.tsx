
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [addItemType, setAddItemType] = useState<'medicine' | 'supplement' | 'cosmetic'>('medicine');
  const [newItemData, setNewItemData] = useState<any>({});
  
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigrationLocked, setIsMigrationLocked] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [migrationLogs]);

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      setMigrationLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

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
          alert(`${addItemType} added!`);
          setNewItemData({});
      } else if (addItemType === 'cosmetic' && setCosmetics) {
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
          setCosmetics(prev => {
              const updated = [...prev, newCosmetic];
              setItem(COSMETICS_CACHE_KEY, updated).catch(console.error);
              return updated;
          });
          alert("Cosmetic added!");
          setNewItemData({});
      }
  };

  const SmartSelect = ({ label, value, onChange, options }: { label: string, value: string, onChange: (val: string) => void, options: string[] }) => {
      const [isManual, setIsManual] = useState(false);
      const inputRef = useRef<HTMLInputElement>(null);
      useEffect(() => { if (isManual && inputRef.current) inputRef.current.focus(); }, [isManual]);

      return (
          <div className="w-full">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    {isManual ? (
                        <div className="relative">
                            <input ref={inputRef} type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-2 border-2 border-primary/50 rounded-xl dark:bg-slate-700" placeholder={`Type new...`}/>
                            <button onClick={() => setIsManual(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">✕</button>
                        </div>
                    ) : (
                        <SearchableDropdown ariaLabel={label} options={options} value={value} onChange={(val) => onChange(Array.isArray(val) ? val[0] : val)} placeholder={t('pleaseSelectOrAdd')} t={t}/>
                    )}
                  </div>
                  {!isManual && <button type="button" onClick={() => { setIsManual(true); onChange(''); }} className="p-2.5 bg-primary/10 text-primary rounded-xl">+</button>}
              </div>
          </div>
      );
  };

  const SectionTitle = ({ title }: { title: string }) => (
      <h4 className="text-sm font-bold text-primary dark:text-primary-light uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 mt-6">{title}</h4>
  );

  const uploadBatch = async (collectionName: string, data: any[], idField?: string) => {
      const CHUNK_SIZE = 450;
      let processed = 0;
      addLog(`Preparing to upload ${data.length} items to '${collectionName}'...`);
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((item) => {
              const docRef = idField && item[idField] ? doc(db, collectionName, String(item[idField])) : doc(collection(db, collectionName));
              batch.set(docRef, item);
          });
          try {
              await batch.commit();
              processed += chunk.length;
              addLog(`✓ Sync success: ${processed} / ${data.length}`);
          } catch (e: any) { addLog(`❌ Error: ${e.message}`); }
      }
      addLog(`🎉 Migration completed.`);
  };

  const handleMigration = async (type: 'medicines' | 'insurance' | 'cosmetics') => {
      if (!isMigrating && window.confirm(`Start uploading ${type} to Cloud?`)) {
          setIsMigrating(true);
          try {
              // تم التغيير لاستخدام البيانات من الـ props بدلاً من الاستيراد الديناميكي
              if (type === 'medicines') {
                  await uploadBatch('medicines', allMedicines, 'RegisterNumber');
              } else if (type === 'insurance') {
                  const dataWithIds = insuranceData.map(item => ({
                      ...item,
                      _id: `${item.scientificName}-${item.strength}-${item.form}`.replace(/[\/\s\.]/g, '_')
                  }));
                  await uploadBatch('insurance', dataWithIds, '_id');
              } else {
                  await uploadBatch('cosmetics', cosmetics, 'id');
              }
          } catch (e: any) { addLog(`CRITICAL ERROR: ${e.message}`); } finally { setIsMigrating(false); }
      }
  };

  const handleExport = (type: 'medicines' | 'insurance' | 'cosmetics') => {
      let data = type === 'medicines' ? allMedicines : type === 'insurance' ? insuranceData : cosmetics;
      if (data.length === 0) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${type}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center gap-2 sticky top-0 z-20">
                <button onClick={() => setActivePanel('menu')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><BackIcon /></button>
                <h2 className="text-xl font-bold capitalize">{activePanel === 'addItem' ? t('addNewItem') : activePanel}</h2>
            </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto">
            {activePanel === 'menu' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                    <MenuCard title={t('adminPanelOverview')} icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" />
                    <MenuCard title={t('userManagementTitle')} icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800" />
                    <MenuCard title={t('addNewItem')} icon={<div className="text-xl font-bold">+</div>} onClick={() => setActivePanel('addItem')} colorClass="bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800" />
                    <MenuCard title={t('appSettingsTitle')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800" />
                    <MenuCard title="Migration" icon={<DatabaseIcon />} onClick={() => setActivePanel('migration')} colorClass="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20" />
                </div>
            )}

            {activePanel === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                    <StatCard title={t('totalUsers')} value={users.length} icon={<UsersIcon />} />
                    <StatCard title={t('medicines')} value={allMedicines.length} icon={<PillBottleIcon />} />
                    <StatCard title={t('aiRequestsToday')} value={users.reduce((acc, u) => acc + (u.aiRequestCount || 0), 0)} icon={<ChartIcon />} />
                </div>
            )}

            {activePanel === 'users' && (
                <div className="space-y-4 animate-fade-in">
                    <input type="text" placeholder={t('searchUserPlaceholder')} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800" value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)}/>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 text-sm">{user.username}<span className="block text-xs text-slate-400">{user.email}</span></td>
                                        <td className="px-6 py-4 text-right"><button onClick={() => handleEditUserClick(user)} className="text-primary font-bold">{t('manageUser')}</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activePanel === 'addItem' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-6">
                    <div className="flex gap-2">
                        {['medicine', 'supplement', 'cosmetic'].map(type => (
                            <button key={type} onClick={() => setAddItemType(type as any)} className={`px-4 py-2 rounded-lg font-bold ${addItemType === type ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{type}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(addItemType === 'medicine' || addItemType === 'supplement') ? (
                            <>
                                <div className="col-span-2"><label className="block text-xs font-bold mb-1">{t('tradeName')} *</label>
                                <input type="text" className="w-full p-2 border rounded dark:bg-slate-700" value={newItemData['Trade Name'] || ''} onChange={e => setNewItemData({...newItemData, 'Trade Name': e.target.value})}/></div>
                                <div className="col-span-2"><SmartSelect label={t('scientificName')} value={newItemData['Scientific Name'] || ''} onChange={val => setNewItemData({...newItemData, 'Scientific Name': val})} options={uniqueScientificNames}/></div>
                                <div><label className="block text-xs font-bold mb-1">{t('price')} *</label><input type="number" className="w-full p-2 border rounded dark:bg-slate-700" value={newItemData['Public price'] || ''} onChange={e => setNewItemData({...newItemData, 'Public price': e.target.value})}/></div>
                            </>
                        ) : (
                            <div className="col-span-2"><label className="block text-xs font-bold mb-1">{t('productName')} *</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-700" value={newItemData['SpecificName'] || ''} onChange={e => setNewItemData({...newItemData, 'SpecificName': e.target.value})}/></div>
                        )}
                    </div>
                    <button onClick={handleAddItem} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg">{t('save')}</button>
                </div>
            )}

            {activePanel === 'settings' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                    <label className="block text-sm font-medium mb-2">{t('aiRequestLimit')}</label>
                    <input type="number" value={appSettings.aiRequestLimit} onChange={e => setAppSettings({...appSettings, aiRequestLimit: parseInt(e.target.value)})} className="w-full p-2 border rounded mb-4 dark:bg-slate-700"/>
                    <button onClick={() => { updateSettings(appSettings); alert('Saved'); }} className="w-full py-2 bg-primary text-white rounded">{t('save')}</button>
                </div>
            )}

            {activePanel === 'migration' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-4">
                    <label className="flex items-center text-red-600 font-bold"><input type="checkbox" checked={!isMigrationLocked} onChange={e => setIsMigrationLocked(!e.target.checked)} className="mr-2"/> Unlock Actions</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['medicines', 'insurance', 'cosmetics'].map(type => (
                            <button key={type} onClick={() => handleMigration(type as any)} disabled={isMigrationLocked || isMigrating} className="p-2 bg-primary text-white text-xs rounded disabled:opacity-50">Upload {type}</button>
                        ))}
                    </div>
                    <div className="bg-black text-green-400 p-4 rounded h-48 overflow-y-auto font-mono text-xs" ref={logContainerRef}>
                        {migrationLogs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                </div>
            )}
        </div>

        {isEditUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">{editingUser.username}</h3>
                    <div className="space-y-4">
                        <button onClick={() => setEditingUser({...editingUser, role: editingUser.role === 'admin' ? 'premium' : 'admin'})} className="w-full p-2 border rounded">Change Role: {editingUser.role}</button>
                        <input type="number" value={editingUser.customAiLimit || ''} onChange={e => setEditingUser({...editingUser, customAiLimit: parseInt(e.target.value)})} className="w-full p-2 border rounded dark:bg-slate-700" placeholder="Custom AI Limit"/>
                        <button onClick={handleSaveUser} className="w-full py-2 bg-primary text-white rounded">{t('save')}</button>
                        <button onClick={() => handleUserDelete(editingUser.id)} className="w-full py-2 bg-red-100 text-red-600 rounded">Delete User</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
