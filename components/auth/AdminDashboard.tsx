
import React, { useState, useMemo, useEffect } from 'react';
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
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, getDocs, writeBatch, doc, addDoc, setDoc } from 'firebase/firestore';
import { MEDICINE_DATA, SUPPLEMENT_DATA_RAW } from '../../data/data';
import { INITIAL_INSURANCE_DATA } from '../../data/insurance-data';
import { CUSTOM_INSURANCE_DATA } from '../../data/custom-insurance-data';
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

const MenuCard: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; colorClass: string }> = ({ title, icon, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${colorClass} h-32 w-full`}
    >
        <div className="w-10 h-10 mb-3 opacity-80">{icon}</div>
        <span className="font-bold text-lg">{title}</span>
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
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigrationLocked, setIsMigrationLocked] = useState(true); // SAFETY LOCK

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
    return users.filter(u => u.username.toLowerCase().includes(userSearchTerm.toLowerCase()));
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
        // Update local state immediately
        setUsers(prev => prev.filter(u => u.id !== userId));
        
        // If we are editing the user we just deleted, close the modal
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('email')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rx Access</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('actions')}</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredUsers.map(user => (
                          <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{user.username}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{user.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {user.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`px-2 py-1 rounded text-xs ${user.prescriptionPrivilege ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                      {user.prescriptionPrivilege ? 'Yes' : 'No'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button onClick={() => handleEditUserClick(user)} className="text-blue-600 hover:text-blue-900 mx-2 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"><div className="h-5 w-5"><EditIcon /></div></button>
                                  <button onClick={() => handleUserDelete(user.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"><TrashIcon /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  // Simplified Medicine View for Grid (Full edit logic is separate)
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

  const handleMigration = async (type: 'medicines' | 'insurance' | 'cosmetics') => {
      if (!isMigrating && window.confirm(`Warning: This will push local ${type} data to cloud. Continue?`)) {
          setIsMigrating(true);
          setMigrationStatus(`Starting migration for ${type}...`);
          try {
              let batchCount = 0;
              if (type === 'medicines') {
                  // Placeholder: Logic to loop MEDICINE_DATA and push
                  batchCount = MEDICINE_DATA.length;
              } else if (type === 'insurance') {
                  batchCount = INITIAL_INSURANCE_DATA.length;
              } else {
                  batchCount = INITIAL_COSMETICS_DATA.length;
              }
              
              // Actual migration logic would involve batched writes here
              await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network
              
              setMigrationStatus(`Successfully processed ${batchCount} ${type} records (Simulation).`);
          } catch (e) {
              setMigrationStatus("Error: " + e);
          } finally {
              setIsMigrating(false);
          }
      }
  };

  const renderMigration = () => (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-6 animate-fade-in">
          <h3 className="text-lg font-bold text-red-600">System Migration</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
              Use these tools to push local static JSON data to Firestore. This is a dangerous operation.
          </p>
          
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
              <input 
                  type="checkbox" 
                  id="unlock-migration" 
                  checked={!isMigrationLocked} 
                  onChange={e => setIsMigrationLocked(!e.target.checked)}
                  className="w-5 h-5"
              />
              <label htmlFor="unlock-migration" className="font-medium text-red-800 dark:text-red-300">Unlock Migration Tools</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                  onClick={() => handleMigration('medicines')}
                  disabled={isMigrationLocked || isMigrating || FIREBASE_DISABLED}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  <PillBottleIcon /> Migrate Medicines
              </button>
              <button
                  onClick={() => handleMigration('insurance')}
                  disabled={isMigrationLocked || isMigrating || FIREBASE_DISABLED}
                  className="py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  <HealthInsuranceIcon /> Migrate Insurance
              </button>
              <button
                  onClick={() => handleMigration('cosmetics')}
                  disabled={isMigrationLocked || isMigrating || FIREBASE_DISABLED}
                  className="py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  <CosmeticsIcon /> Migrate Cosmetics
              </button>
          </div>
          
          {migrationStatus && (
              <div className="p-4 bg-slate-100 dark:bg-slate-900 font-mono text-xs overflow-x-auto whitespace-pre-wrap rounded-lg">
                  {migrationStatus}
              </div>
          )}
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

        {/* User Edit Modal */}
        {isEditUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsEditUserModalOpen(false)}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4">{t('editUser')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('username')}</label>
                            <input type="text" value={editingUser.username} disabled className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded opacity-70 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('email')}</label>
                            <input type="text" value={editingUser.email} disabled className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded opacity-70 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('role')}</label>
                            <select 
                                value={editingUser.role} 
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'premium'})}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                            >
                                <option value="premium">Premium User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('status')}</label>
                            <select 
                                value={editingUser.status} 
                                onChange={e => setEditingUser({...editingUser, status: e.target.value as 'active' | 'pending'})}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                            >
                                <option value="active">{t('statusActive')}</option>
                                <option value="pending">{t('statusPending')}</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <span className="font-medium text-blue-900 dark:text-blue-200">Prescription Access</span>
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
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <button 
                            onClick={() => handleUserDelete(editingUser.id)} 
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 text-sm font-medium flex items-center gap-2"
                        >
                            <TrashIcon /> {t('delete')}
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 text-sm font-medium">{t('cancel')}</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm font-medium">{t('save')}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
