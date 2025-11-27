
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
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { MEDICINE_DATA } from '../../data/data';
import { INITIAL_INSURANCE_DATA } from '../../data/insurance-data';
import { INITIAL_COSMETICS_DATA } from '../../data/cosmetics-data';

type Panel = 'menu' | 'overview' | 'users' | 'medicines' | 'insurance' | 'cosmetics' | 'settings' | 'migration';

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
                          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rx Access</th>
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
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {user.prescriptionPrivilege ? (
                                      <span className="text-green-500 text-lg">●</span>
                                  ) : (
                                      <span className="text-slate-300 text-lg">●</span>
                                  )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end items-center gap-2">
                                      <button onClick={() => handleEditUserClick(user)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                                          <div className="h-5 w-5"><EditIcon /></div>
                                      </button>
                                      <button onClick={() => handleUserDelete(user.id)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                          <div className="h-5 w-5"><TrashIcon /></div>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderMedicines = () => (
      <div className="text-center p-8">
          <p>Medicine Management Interface is available via the main app search and edit buttons.</p>
          <p className="text-sm text-gray-500 mt-2">Use the "Search" tab in the main app, find a medicine, and use the edit icon to modify details.</p>
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
                  await uploadBatch('medicines', MEDICINE_DATA, 'RegisterNumber');
              } else if (type === 'insurance') {
                  const dataWithIds = INITIAL_INSURANCE_DATA.map(item => ({
                      ...item,
                      _id: `${item.scientificName}-${item.strength}-${item.form}`.replace(/[\/\s\.]/g, '_')
                  }));
                  await uploadBatch('insurance', dataWithIds, '_id');
              } else {
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
                <h2 className="text-xl font-bold capitalize">{activePanel}</h2>
            </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto">
            {activePanel === 'menu' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                    <MenuCard title={t('adminPanelOverview')} icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" />
                    <MenuCard title={t('userManagementTitle')} icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800" />
                    <MenuCard title={t('medicines')} icon={<PillBottleIcon />} onClick={() => setActivePanel('medicines')} colorClass="bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800" />
                    <MenuCard title={t('navInsurance')} icon={<HealthInsuranceIcon />} onClick={() => setActivePanel('insurance')} colorClass="bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800" />
                    <MenuCard title={t('navCosmetics')} icon={<CosmeticsIcon />} onClick={() => setActivePanel('cosmetics')} colorClass="bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:border-pink-800" />
                    <MenuCard title={t('appSettingsTitle')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" />
                    <MenuCard title="Migration" icon={<DatabaseIcon />} onClick={() => setActivePanel('migration')} colorClass="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800" />
                </div>
            )}

            {activePanel === 'overview' && renderOverview()}
            {activePanel === 'users' && renderUsers()}
            {activePanel === 'medicines' && renderMedicines()}
            {activePanel === 'settings' && renderSettings()}
            {activePanel === 'migration' && renderMigration()}
            {(activePanel === 'insurance' || activePanel === 'cosmetics') && (
                <div className="text-center p-8 text-gray-500">
                    Placeholder for {activePanel} management. Use standard search/edit flow.
                </div>
            )}
        </div>

        {/* Improved User Edit Modal */}
        {isEditUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsEditUserModalOpen(false)}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <h3 className="text-xl font-bold">{t('editUser')}</h3>
                        <button onClick={() => setIsEditUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><span className="text-2xl">&times;</span></button>
                    </div>
                    
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('username')}</label>
                                <div className="p-2 bg-gray-50 dark:bg-slate-900/50 rounded text-sm font-medium border border-gray-200 dark:border-slate-700">{editingUser.username}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('email')}</label>
                                <div className="p-2 bg-gray-50 dark:bg-slate-900/50 rounded text-sm overflow-hidden text-ellipsis border border-gray-200 dark:border-slate-700">{editingUser.email}</div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">Permissions</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('changeRole')}</label>
                                    <select 
                                        value={editingUser.role} 
                                        onChange={e => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'premium'})}
                                        className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    >
                                        <option value="premium">{t('premiumRole')}</option>
                                        <option value="admin">{t('adminRole')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customAiLimit')}</label>
                                    <input 
                                        type="number" 
                                        value={editingUser.customAiLimit || ''} 
                                        onChange={e => setEditingUser({...editingUser, customAiLimit: parseInt(e.target.value) || undefined})}
                                        placeholder="Default"
                                        className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <div>
                                <span className="font-bold text-blue-900 dark:text-blue-200 block text-sm">Prescription Privilege</span>
                                <span className="text-xs text-blue-700 dark:text-blue-300">Allow user to generate prescriptions</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={editingUser.prescriptionPrivilege || false} 
                                    onChange={e => setEditingUser({...editingUser, prescriptionPrivilege: e.target.checked})} 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="border-t border-red-100 dark:border-red-900/50 pt-4 mt-4">
                            <h4 className="font-bold text-red-600 text-sm mb-3 uppercase">{t('dangerZone')}</h4>
                            <button 
                                onClick={() => handleUserDelete(editingUser.id)} 
                                className="w-full px-4 py-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-800"
                            >
                                <TrashIcon /> {t('delete')}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={() => setIsEditUserModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-300 dark:bg-transparent dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300">{t('cancel')}</button>
                        <button onClick={handleSaveUser} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-bold shadow-lg shadow-primary/30">{t('save')}</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
