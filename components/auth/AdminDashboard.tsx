
import React, { useState, useMemo, useEffect } from 'react';
import { TFunction, User, Medicine, AppSettings, InsuranceDrug } from '../../types';
import { useAuth } from './AuthContext';
import ChartIcon from '../icons/ChartIcon';
import UsersIcon from '../icons/UsersIcon';
import PillBottleIcon from '../icons/PillBottleIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SearchIcon from '../icons/SearchIcon';
import TrashIcon from '../icons/TrashIcon';
import HealthInsuranceIcon from '../icons/HealthInsuranceIcon';
import { db } from '../../firebase';
import { collection, getDocs, writeBatch, doc, addDoc, setDoc } from 'firebase/firestore';
import { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } from '../../data/data';
import { INITIAL_INSURANCE_DATA } from '../../data/insurance-data';
import { CUSTOM_INSURANCE_DATA } from '../../data/custom-insurance-data';
import { INITIAL_COSMETICS_DATA } from '../../data/cosmetics-data';

type Panel = 'overview' | 'users' | 'medicines' | 'insurance' | 'settings' | 'migration';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-4">
        <div className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light p-2.5 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-light-text dark:text-dark-text">{value}</p>
        </div>
    </div>
);

interface AdminDashboardProps {
  t: TFunction;
  allMedicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  insuranceData: InsuranceDrug[];
  setInsuranceData: React.Dispatch<React.SetStateAction<InsuranceDrug[]>>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ t, allMedicines, setMedicines, insuranceData, setInsuranceData }) => {
  const { updateUser, deleteUser, getSettings, updateSettings } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>('overview');
  
  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Medicine Management State
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);

  // Insurance Management State
  const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
  const [editingInsuranceItem, setEditingInsuranceItem] = useState<InsuranceDrug | null>(null);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);

  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  
  // Migration State
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigrationLocked, setIsMigrationLocked] = useState(true); // SAFETY LOCK

  // Fetch users from Firestore
  const fetchUsers = async () => {
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

  useEffect(() => {
    const isModalOpen = isMedicineModalOpen || isInsuranceModalOpen;
    if (isModalOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [isMedicineModalOpen, isInsuranceModalOpen]);
  
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return users;
    return users.filter(u => u.username.toLowerCase().includes(userSearchTerm.toLowerCase()));
  }, [users, userSearchTerm]);

  const filteredMedicines = useMemo(() => {
    if (!medicineSearchTerm) return allMedicines;
    const lowerTerm = medicineSearchTerm.toLowerCase();
    return allMedicines.filter(m => 
      m['Trade Name'].toLowerCase().includes(lowerTerm) ||
      m['Scientific Name'].toLowerCase().includes(lowerTerm)
    );
  }, [allMedicines, medicineSearchTerm]);

  const filteredInsuranceData = useMemo(() => {
    if (!insuranceSearchTerm) return insuranceData;
    const lowerTerm = insuranceSearchTerm.toLowerCase();
    return insuranceData.filter(i => 
        i.indication.toLowerCase().includes(lowerTerm) ||
        i.scientificName.toLowerCase().includes(lowerTerm) ||
        i.icd10Code.toLowerCase().includes(lowerTerm)
    );
  }, [insuranceData, insuranceSearchTerm]);

  const handleUserUpdate = async () => {
    if (editingUser) {
        await updateUser(editingUser);
        await fetchUsers();
        setEditingUser(null);
    }
  };
  
  const handleUserApprove = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
        await updateUser({ ...userToUpdate, status: 'active' });
        await fetchUsers(); 
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (window.confirm(t('confirmDeleteUser'))) {
        await deleteUser(userId);
        await fetchUsers();
    }
  };

  const handleMedicineFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;

    try {
        if (editingMedicine.RegisterNumber.startsWith('new-')) { // New medicine
             const { RegisterNumber, ...dataToSave } = editingMedicine;
             const docRef = await addDoc(collection(db, 'medicines'), {
                 ...dataToSave,
                 RegisterNumber: `med-${Date.now()}` 
             });
             setMedicines(prev => [...prev, { ...editingMedicine, RegisterNumber: `med-${Date.now()}` }]);
        } else {
             alert("Update functionality requires Firestore Document IDs. Use Migration tool first.");
        }
    } catch(e) {
        console.error("Error saving medicine", e);
    }
    
    setIsMedicineModalOpen(false);
    setEditingMedicine(null);
  };
  
  const handleMedicineDelete = (regNumber: string) => {
     if (window.confirm(t('confirmDeleteMedicine'))) {
       setMedicines(prev => prev.filter(m => m.RegisterNumber !== regNumber));
     }
  };

  const openMedicineModal = (medicine: Medicine | null) => {
    if (medicine) {
        setEditingMedicine(medicine);
    } else {
        setEditingMedicine({ RegisterNumber: `new-${Date.now()}`, "Trade Name": "", "Scientific Name": "", "Public price": "", PharmaceuticalForm: "", Strength: "", StrengthUnit: "", "Manufacture Name": "", "Legal Status": "Prescription", "Product type": "Human", PackageSize: "", PackageTypes: "" } as Medicine);
    }
    setIsMedicineModalOpen(true);
  };
  
  const handleInsuranceFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInsuranceItem) return;
    setIsInsuranceModalOpen(false);
    setEditingInsuranceItem(null);
  };

  const handleInsuranceDelete = (itemId: string | undefined) => {
    if (!itemId) return;
    if (window.confirm(t('confirmDeleteInsurance'))) {
        setInsuranceData(prev => prev.filter(item => item.id !== itemId));
    }
  };
  
  const openInsuranceModal = (item: InsuranceDrug | null) => {
    if (item) {
        setEditingInsuranceItem(item);
    } else {
        setEditingInsuranceItem({ indication: '', icd10Code: '', drugClass: '', drugSubclass: '', scientificName: '', atcCode: '', form: '', strength: '', strengthUnit: '', notes: '' });
    }
    setIsInsuranceModalOpen(true);
  };


  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    const newSettings = {...appSettings, [key]: value};
    setAppSettings(newSettings);
    updateSettings(newSettings);
  };

  // --- MIGRATION LOGIC ---
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const uploadCollection = async (collectionName: string, data: any[]) => {
      setIsMigrating(true);
      setMigrationStatus(`Starting upload for ${collectionName}... Total items: ${data.length}`);
      
      const batchSize = 400; 
      let count = 0;
      const total = data.length;
      
      try {
        for (let i = 0; i < total; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = data.slice(i, i + batchSize);
            
            chunk.forEach(item => {
                const docRef = doc(collection(db, collectionName));
                batch.set(docRef, item);
            });
            
            await batch.commit();
            count += chunk.length;
            setMigrationStatus(`Uploaded ${count} / ${total} items to '${collectionName}'...`);
            
            await sleep(300);
        }
        setMigrationStatus(`✅ Successfully uploaded all ${total} items to '${collectionName}'.`);
      } catch (e: any) {
        console.error(`Error uploading ${collectionName}:`, e);
        setMigrationStatus(`❌ Error uploading ${collectionName}: ${e.message}`);
        alert(`Upload failed: ${e.message}`);
      } finally {
        setIsMigrating(false);
      }
  };

  const handleMigrateMedicines = async () => {
      try {
        setMigrationStatus("Preparing Medicine & Supplement data...");
        if (!window.confirm("Start uploading Medicines & Supplements? This may take a moment.")) {
            setMigrationStatus("Migration cancelled.");
            return;
        }
        
        const normalizedSupplements = SUPPLEMENT_DATA_RAW.map(p => ({
             "RegisterNumber": String(p.Id || Math.random()),
             "Trade Name": p.TradeName,
             "Scientific Name": p.ScientificName || '',
             "Public price": p.Price || 'N/A',
             "Product type": 'Supplement',
             "PharmaceuticalForm": p.DoesageForm || '',
             "Manufacture Name": p.ManufacturerNameEN || '',
             "Legal Status": "OTC",
             "Strength": p.Strength || '',
             "StrengthUnit": p.StrengthUnit || ''
        }));
        
        const allMeds = [...MEDICINE_DATA, ...normalizedSupplements];
        await uploadCollection('medicines', allMeds);
      } catch (error: any) {
          alert("Error preparing data: " + error.message);
          setIsMigrating(false);
      }
  };

  const handleMigrateInsurance = async () => {
      try {
        setMigrationStatus("Preparing Insurance data...");
        if (!window.confirm("Start uploading Insurance Data? This file is large, please keep the window open.")) {
             setMigrationStatus("Migration cancelled.");
             return;
        }
        
        const allInsurance = [...INITIAL_INSURANCE_DATA, ...CUSTOM_INSURANCE_DATA];
        await uploadCollection('insurance', allInsurance);
      } catch (error: any) {
          alert("Error preparing data: " + error.message);
          setIsMigrating(false);
      }
  };

  const handleMigrateCosmetics = async () => {
      try {
        setMigrationStatus("Preparing Cosmetics data...");
        if (!window.confirm("Start uploading Cosmetics Data?")) {
            setMigrationStatus("Migration cancelled.");
            return;
        }
        await uploadCollection('cosmetics', INITIAL_COSMETICS_DATA);
      } catch (error: any) {
          alert("Error preparing data: " + error.message);
          setIsMigrating(false);
      }
  };


  // Memoized lists for datalist suggestions
  const uniqueManufactureNames = useMemo(() => Array.from(new Set(allMedicines.map(m => m['Manufacture Name']))).sort(), [allMedicines]);
  const uniquePharmaceuticalForms = useMemo(() => Array.from(new Set(allMedicines.map(m => m.PharmaceuticalForm))).sort(), [allMedicines]);
  const uniqueScientificNames = useMemo(() => {
    const names = new Set<string>();
    allMedicines.forEach(m => m['Scientific Name'].split(',').forEach(name => name.trim() && names.add(name.trim())));
    return Array.from(names).sort();
  }, [allMedicines]);
  const uniqueIndications = useMemo(() => Array.from(new Set(insuranceData.map(i => i.indication))).sort(), [insuranceData]);
  const uniqueInsuranceSciNames = useMemo(() => Array.from(new Set(insuranceData.map(i => i.scientificName))).sort(), [insuranceData]);
  const uniqueDrugClasses = useMemo(() => Array.from(new Set(insuranceData.map(i => i.drugClass))).sort(), [insuranceData]);


  const renderPanel = () => {
    switch (activePanel) {
      case 'overview':
        const premiumUsers = users.filter(u => u.role === 'premium').length;
        const adminUsers = users.filter(u => u.role === 'admin').length;
        const aiRequestsToday = users.reduce((acc, user) => {
            const today = new Date().toISOString().split('T')[0];
            return user.lastRequestDate === today ? acc + user.aiRequestCount : acc;
        }, 0);

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard title={t('totalUsers')} value={users.length} icon={<div className="w-5 h-5"><UsersIcon /></div>} />
                <StatCard title={t('aiRequestsToday')} value={aiRequestsToday} icon={<div className="w-5 h-5"><ChartIcon /></div>} />
                <StatCard title={t('premiumUsers')} value={premiumUsers} icon={<div className="w-5 h-5"><UsersIcon /></div>} />
                <StatCard title={t('adminUsers')} value={adminUsers} icon={<div className="w-5 h-5"><UsersIcon /></div>} />
            </div>
        );
      case 'users':
        return (
            <div>
                 <div className="relative mb-4">
                    <input type="text" placeholder={t('searchUserPlaceholder')} value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary h-5 w-5"><SearchIcon /></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-3 py-2">{t('username')}</th>
                                <th className="px-3 py-2">{t('role')}</th>
                                <th className="px-3 py-2">{t('status')}</th>
                                <th className="px-3 py-2">{t('aiRequests')}</th>
                                <th className="px-3 py-2 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b dark:border-slate-700">
                                    <td className="px-3 py-2 font-medium">{user.username}</td>
                                    <td className="px-3 py-2">
                                        {editingUser?.id === user.id ? (
                                            <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'premium'})} className="bg-slate-100 dark:bg-slate-700 rounded p-1">
                                                <option value="premium">{t('premiumRole')}</option>
                                                <option value="admin">{t('adminRole')}</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'}`}>{t(user.role === 'admin' ? 'adminRole' : 'premiumRole')}</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'}`}>
                                            {t(user.status === 'active' ? 'statusActive' : 'statusPending')}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">{user.aiRequestCount}</td>
                                    <td className="px-3 py-2 text-right">
                                        {editingUser?.id === user.id ? (
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={handleUserUpdate} className="text-green-500 font-semibold">{t('save')}</button>
                                                <button onClick={() => setEditingUser(null)} className="text-gray-500">{t('cancel')}</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 justify-end">
                                                {user.status === 'pending' ? (
                                                    <button onClick={() => handleUserApprove(user.id)} className="font-medium text-green-600 hover:underline">{t('approve')}</button>
                                                ) : (
                                                     <button onClick={() => setEditingUser({...user})} className="font-medium text-primary hover:underline">{t('editUser')}</button>
                                                )}
                                                <button onClick={() => handleUserDelete(user.id)} className="font-medium text-red-500 hover:underline"><TrashIcon/></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
      case 'medicines':
        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <input type="text" placeholder={t('search') + '...'} value={medicineSearchTerm} onChange={e => setMedicineSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary h-5 w-5"><SearchIcon /></div>
                    </div>
                    <button onClick={() => openMedicineModal(null)} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">{t('addMedicine')}</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-3 py-2">{t('tradeName')}</th>
                                <th className="px-3 py-2">{t('scientificName')}</th>
                                <th className="px-3 py-2">{t('price')}</th>
                                <th className="px-3 py-2 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedicines.map(med => (
                                <tr key={med.RegisterNumber} className="border-b dark:border-slate-700">
                                    <td className="px-3 py-2 font-medium whitespace-normal break-words max-w-[150px] sm:max-w-xs">{med['Trade Name']}</td>
                                    <td className="px-3 py-2 whitespace-normal break-words max-w-[150px] sm:max-w-xs">{med['Scientific Name']}</td>
                                    <td className="px-3 py-2">{med['Public price']}</td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => openMedicineModal(med)} className="font-medium text-primary hover:underline">{t('editMedicine')}</button>
                                            <button onClick={() => handleMedicineDelete(med.RegisterNumber)} className="font-medium text-red-500 hover:underline"><TrashIcon/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
      case 'insurance':
        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <input type="text" placeholder={t('searchInsurancePlaceholder')} value={insuranceSearchTerm} onChange={e => setInsuranceSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary h-5 w-5"><SearchIcon /></div>
                    </div>
                    <button onClick={() => openInsuranceModal(null)} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold">{t('addInsuranceItem')}</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-3 py-2">{t('indication')}</th>
                                <th className="px-3 py-2">{t('scientificName')}</th>
                                <th className="px-3 py-2">{t('icd10Code')}</th>
                                <th className="px-3 py-2 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInsuranceData.map(item => (
                                <tr key={item.id} className="border-b dark:border-slate-700">
                                    <td className="px-3 py-2 font-medium whitespace-normal break-words max-w-[150px] sm:max-w-xs">{item.indication}</td>
                                    <td className="px-3 py-2 whitespace-normal break-words max-w-[150px] sm:max-w-xs">{item.scientificName}</td>
                                    <td className="px-3 py-2">{item.icd10Code}</td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => openInsuranceModal(item)} className="font-medium text-primary hover:underline">{t('editUser')}</button>
                                            <button onClick={() => handleInsuranceDelete(item.id)} className="font-medium text-red-500 hover:underline"><TrashIcon/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
       case 'settings':
         return (
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <h3 className="font-bold text-lg">{t('aiRequestLimit')}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('aiRequestLimitDescription')}</p>
                    <input type="number" value={appSettings.aiRequestLimit} onChange={e => handleSettingsChange('aiRequestLimit', parseInt(e.target.value, 10) || 0)} className="w-full max-w-xs px-3 py-2 bg-white dark:bg-slate-700 rounded-lg" />
                </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <h3 className="font-bold text-lg">AI Services</h3>
                     <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Enable or disable all AI features</p>
                        <label htmlFor="ai-toggle" className="inline-flex relative items-center cursor-pointer">
                            <input type="checkbox" id="ai-toggle" className="sr-only peer"
                                checked={appSettings.isAiEnabled}
                                onChange={e => handleSettingsChange('isAiEnabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <h3 className="font-bold text-lg">{t('apiKey')}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('apiKeyDescription')}</p>
                    <div className="p-2 bg-white dark:bg-slate-700 rounded font-mono text-sm">
                        {process.env.API_KEY ? '****************' + String(process.env.API_KEY).slice(-4) : 'Not Set'}
                    </div>
                </div>
            </div>
        );
        case 'migration':
            const medCount = MEDICINE_DATA.length + SUPPLEMENT_DATA_RAW.length;
            const insCount = INITIAL_INSURANCE_DATA.length + CUSTOM_INSURANCE_DATA.length;
            const cosCount = INITIAL_COSMETICS_DATA.length;
            
            return (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-lg text-orange-600 mb-2">Database Migration</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            Upload local data to Firebase. <strong>Warning:</strong> This is a heavy operation.
                        </p>
                    </div>

                    {/* SAFETY LOCK SECTION */}
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-orange-700 dark:text-orange-300">⚠️ Migration Safety Lock</h4>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    {isMigrationLocked 
                                        ? "Migration features are currently LOCKED to prevent accidental data uploads." 
                                        : "Migration features are UNLOCKED. Proceed with caution."}
                                </p>
                            </div>
                            <label className="inline-flex relative items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={!isMigrationLocked}
                                    onChange={e => setIsMigrationLocked(!e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Unlock</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {/* Medicines Card */}
                         <div className={`bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-5 flex flex-col items-center text-center gap-4 shadow-sm transition-all ${isMigrationLocked ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <div className="w-6 h-6"><PillBottleIcon /></div>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-lg text-light-text dark:text-dark-text">Medicines & Supplements</h4>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{medCount} items</p>
                            </div>
                            <button
                                onClick={handleMigrateMedicines}
                                disabled={isMigrating || isMigrationLocked}
                                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
                            >
                                Start Migration
                            </button>
                        </div>

                         {/* Insurance Card */}
                         <div className={`bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-5 flex flex-col items-center text-center gap-4 shadow-sm transition-all ${isMigrationLocked ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                                <div className="w-6 h-6"><HealthInsuranceIcon /></div>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-lg text-light-text dark:text-dark-text">Insurance Data</h4>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{insCount} items</p>
                            </div>
                             <button
                                onClick={handleMigrateInsurance}
                                disabled={isMigrating || isMigrationLocked}
                                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
                            >
                                Start Migration
                            </button>
                        </div>

                         {/* Cosmetics Card */}
                         <div className={`bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-5 flex flex-col items-center text-center gap-4 shadow-sm transition-all ${isMigrationLocked ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                <div className="w-6 h-6"><ChartIcon /></div>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-lg text-light-text dark:text-dark-text">Cosmetics Data</h4>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{cosCount} items</p>
                            </div>
                             <button
                                onClick={handleMigrateCosmetics}
                                disabled={isMigrating || isMigrationLocked}
                                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
                            >
                                Start Migration
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-black text-green-400 font-mono text-xs rounded-lg h-32 overflow-y-auto shadow-inner border border-slate-800">
                        {migrationStatus || '> System ready. Select a migration task to begin.'}
                    </div>
                </div>
            )
    }
  };

  const SidebarItem: React.FC<{ panel: Panel; label: string; icon: React.ReactNode }> = ({ panel, label, icon }) => (
    <button onClick={() => setActivePanel(panel)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activePanel === panel ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
        <div className="w-4 h-4 flex-shrink-0">{icon}</div>
        <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-md space-y-4 animate-fade-in flex flex-col sm:flex-row min-h-[60vh]">
      <aside className="w-full sm:w-56 flex-shrink-0 p-2 sm:border-r border-b sm:border-b-0 dark:border-slate-700">
        <nav className="space-y-1">
          <SidebarItem panel="overview" label={t('adminPanelOverview')} icon={<ChartIcon />} />
          <SidebarItem panel="users" label={t('adminPanelUsers')} icon={<UsersIcon />} />
          <SidebarItem panel="medicines" label={t('adminPanelMedicines')} icon={<PillBottleIcon />} />
          <SidebarItem panel="insurance" label={t('adminPanelInsurance')} icon={<HealthInsuranceIcon />} />
          <SidebarItem panel="settings" label={t('adminPanelSettings')} icon={<SettingsIcon />} />
          <SidebarItem panel="migration" label="DB Migration" icon={<div className="text-orange-500"><SettingsIcon /></div>} />
        </nav>
      </aside>
      <main className="flex-grow p-3">
        <h2 className="text-2xl font-bold mb-4">
            {activePanel === 'overview' && t('adminPanelOverview')}
            {activePanel === 'users' && t('userManagementTitle')}
            {activePanel === 'medicines' && t('medicineManagementTitle')}
            {activePanel === 'insurance' && t('insuranceManagementTitle')}
            {activePanel === 'settings' && t('appSettingsTitle')}
            {activePanel === 'migration' && 'Database Migration'}
        </h2>
        {renderPanel()}
      </main>
      
      {/* Medicine Modal */}
      {isMedicineModalOpen && editingMedicine && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsMedicineModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">{editingMedicine.RegisterNumber.startsWith('new-') ? t('addMedicine') : t('editMedicine')}</h3>
                    <form onSubmit={handleMedicineFormSubmit} className="flex-grow flex flex-col overflow-hidden">
                        <div className="space-y-3 overflow-y-auto pr-2">
                            <datalist id="manufacturer-list"><>{uniqueManufactureNames.map(name => <option key={name} value={name} />)}</></datalist>
                            <datalist id="scientific-name-list"><>{uniqueScientificNames.map(name => <option key={name} value={name} />)}</></datalist>
                            <datalist id="form-list"><>{uniquePharmaceuticalForms.map(name => <option key={name} value={name} />)}</></datalist>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               <div><label className="text-sm font-medium">{t('tradeName')}</label><input type="text" value={editingMedicine['Trade Name']} onChange={e => setEditingMedicine({...editingMedicine, 'Trade Name': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required /></div>
                               <div><label className="text-sm font-medium">{t('scientificName')}</label><input list="scientific-name-list" type="text" value={editingMedicine['Scientific Name']} onChange={e => setEditingMedicine({...editingMedicine, 'Scientific Name': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required/></div>
                               <div><label className="text-sm font-medium">{t('price')}</label><input type="text" value={editingMedicine['Public price']} onChange={e => setEditingMedicine({...editingMedicine, 'Public price': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('pharmaceuticalForm')}</label><input list="form-list" type="text" value={editingMedicine.PharmaceuticalForm} onChange={e => setEditingMedicine({...editingMedicine, PharmaceuticalForm: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('strength')}</label><input type="text" value={editingMedicine.Strength} onChange={e => setEditingMedicine({...editingMedicine, Strength: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('strengthUnit')}</label><input type="text" value={editingMedicine.StrengthUnit} onChange={e => setEditingMedicine({...editingMedicine, StrengthUnit: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('packageSize')}</label><input type="text" value={editingMedicine.PackageSize} onChange={e => setEditingMedicine({...editingMedicine, PackageSize: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('packageType')}</label><input type="text" value={editingMedicine.PackageTypes} onChange={e => setEditingMedicine({...editingMedicine, PackageTypes: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                               <div><label className="text-sm font-medium">{t('manufacturer')}</label><input list="manufacturer-list" type="text" value={editingMedicine['Manufacture Name']} onChange={e => setEditingMedicine({...editingMedicine, 'Manufacture Name': e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
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
                        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
                            <button type="button" onClick={() => setIsMedicineModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">{t('save')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      {/* Insurance Modal */}
      {isInsuranceModalOpen && editingInsuranceItem && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={() => setIsInsuranceModalOpen(false)}>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mt-8 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 flex-shrink-0">{editingInsuranceItem.id ? t('editInsuranceItem') : t('addInsuranceItem')}</h3>
                    <form onSubmit={handleInsuranceFormSubmit} className="flex-grow flex flex-col overflow-hidden">
                       <div className="space-y-2 overflow-y-auto pr-2">
                            <datalist id="indication-list"><>{uniqueIndications.map(name => <option key={name} value={name} />)}</></datalist>
                            <datalist id="insurance-sci-name-list"><>{uniqueInsuranceSciNames.map(name => <option key={name} value={name} />)}</></datalist>
                            <datalist id="drug-class-list"><>{uniqueDrugClasses.map(name => <option key={name} value={name} />)}</></datalist>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                <div className="sm:col-span-2"><label className="text-sm font-medium">{t('indication')}</label><input list="indication-list" type="text" value={editingInsuranceItem.indication} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, indication: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required /></div>
                                <div><label className="text-sm font-medium">{t('scientificName')}</label><input list="insurance-sci-name-list" type="text" value={editingInsuranceItem.scientificName} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, scientificName: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" required /></div>
                                <div><label className="text-sm font-medium">{t('icd10Code')}</label><input type="text" value={editingInsuranceItem.icd10Code} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, icd10Code: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div className="sm:col-span-2"><label className="text-sm font-medium">{t('drugClass')}</label><input list="drug-class-list" type="text" value={editingInsuranceItem.drugClass} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, drugClass: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">{t('pharmaceuticalForm')}</label><input list="form-list" type="text" value={editingInsuranceItem.form} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, form: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">{t('atcCode')}</label><input type="text" value={editingInsuranceItem.atcCode} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, atcCode: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">{t('strength')}</label><input type="text" value={editingInsuranceItem.strength} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, strength: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div><label className="text-sm font-medium">{t('strengthUnit')}</label><input type="text" value={editingInsuranceItem.strengthUnit} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, strengthUnit: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" /></div>
                                <div className="sm:col-span-2"><label className="text-sm font-medium">{t('notes')}</label><textarea value={editingInsuranceItem.notes} onChange={e => setEditingInsuranceItem({...editingInsuranceItem, notes: e.target.value})} className="w-full mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded" rows={3}></textarea></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
                            <button type="button" onClick={() => setIsInsuranceModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">{t('save')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

    </div>
  );
};
