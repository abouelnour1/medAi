
import React, { useState, useEffect } from 'react';
import { TFunction, User, Medicine, AppSettings, Cosmetic, PendingUpdate, Notification as AppNotification } from '../../types';
import { useAuth } from './AuthContext';
import ChartIcon from '../icons/ChartIcon';
import UsersIcon from '../icons/UsersIcon';
import PillBottleIcon from '../icons/PillBottleIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SearchIcon from '../icons/SearchIcon';
import TrashIcon from '../icons/TrashIcon';
import BackIcon from '../icons/BackIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import DownloadIcon from '../icons/DownloadIcon';
import BellIcon from '../icons/BellIcon';
import EditIcon from '../icons/EditIcon';
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, doc, setDoc, addDoc, deleteDoc, updateDoc, query, onSnapshot, where } from 'firebase/firestore';

type Panel = 'menu' | 'overview' | 'users' | 'add_manual' | 'approvals' | 'notifications' | 'settings' | 'export';
type ItemCategory = 'Human' | 'Supplement' | 'Cosmetic';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">{icon}</div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{title}</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const MenuCard: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; colorClass: string; badge?: number }> = ({ title, icon, onClick, colorClass, badge }) => (
    <button 
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${colorClass} h-32 w-full group`}
    >
        <div className="w-8 h-8 mb-3 opacity-90 group-hover:scale-110 transition-transform">{icon}</div>
        <span className="font-black text-[11px] uppercase tracking-tighter text-center leading-tight">{title}</span>
        {badge ? (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 animate-bounce">
                {badge}
            </span>
        ) : null}
    </button>
);

export const AdminDashboard: React.FC<{ t: TFunction, allMedicines: Medicine[], setMedicines: any }> = ({ t, allMedicines, setMedicines }) => {
  const { deleteUser, getSettings, updateSettings } = useAuth();
  
  const inputClass = "w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm dark:text-white";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest px-1";
  
  const [activePanel, setActivePanel] = useState<Panel>('menu');
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [itemCategory, setItemCategory] = useState<ItemCategory>('Human');
  const [selectedUpdate, setSelectedUpdate] = useState<PendingUpdate | null>(null);
  const [isEditingUpdate, setIsEditingUpdate] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const [userRoleChanges, setUserRoleChanges] = useState<{[key: string]: User['role']}>({});

  const [formMed, setFormMed] = useState<Partial<Medicine>>({
      RegisterNumber: '', "Trade Name": '', "Scientific Name": '', "Public price": '',
      PharmaceuticalForm: '', Strength: '', StrengthUnit: '', PackageSize: '', PackageTypes: '',
      Size: '', SizeUnit: '', "Manufacture Name": '', "Manufacture Country": '', "Main Agent": '',
      "Storage conditions": '', "Storage Condition Arabic": '', shelfLife: '', AtcCode1: '',
      "Legal Status": 'OTC', "Product Control": 'Uncontrolled'
  });

  useEffect(() => {
    if (FIREBASE_DISABLED) return;
    setPermissionError(null);

    const unsubUsers = onSnapshot(collection(db, 'users'), 
        (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User))),
        (err) => { console.error("Users Error:", err); setPermissionError("Database Permission Denied."); }
    );
    
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), 
        (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification))),
        (err) => console.error("Notifications Error:", err)
    );
    
    const q = query(collection(db, 'pending_updates'), where('status', '==', 'pending'));
    const unsubApprovals = onSnapshot(q, 
        (snap) => setPendingUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingUpdate))),
        (err) => { console.error("Pending Updates Error:", err); }
    );

    return () => { unsubUsers(); unsubNotifs(); unsubApprovals(); };
  }, []);

  const handleSaveUserRole = async (userId: string) => {
      const newRole = userRoleChanges[userId];
      if (!newRole) return;
      try {
          await updateDoc(doc(db, 'users', userId), { role: newRole });
          alert(t('saveSuccess'));
          setUserRoleChanges(prev => {
              const next = {...prev};
              delete next[userId];
              return next;
          });
      } catch (e: any) { 
          alert("Error: " + e.message); 
      }
  };

  const handleApproveUpdate = async (update: PendingUpdate, finalDataOverride?: any) => {
      if (!finalDataOverride && !window.confirm(t('confirmApprove'))) return;
      
      setIsLoading(true);
      try {
          const medicineId = update.medicineId || (update.newData as Medicine).RegisterNumber;
          const dataToMerge = finalDataOverride || update.newData;
          const finalRecord = { ...update.originalData, ...dataToMerge };

          await setDoc(doc(db, 'medicines', medicineId), finalRecord, { merge: true });
          await updateDoc(doc(db, 'pending_updates', update.id), { status: 'approved' });
          
          await addDoc(collection(db, 'notifications'), {
              title: t('requestApproved', { medicine: finalRecord['Trade Name'] || '' }),
              body: "Review completed. Your changes are live.",
              timestamp: Date.now(),
              type: 'request_result',
              targetUserId: update.submittedBy
          });

          alert(t('saveSuccess'));
          setSelectedUpdate(null);
          setIsEditingUpdate(false);
      } catch (err: any) { 
          alert("Error: " + err.message); 
      }
      finally { setIsLoading(false); }
  };

  const handleRejectUpdate = async (update: PendingUpdate) => {
      const notes = window.prompt(t('reasonForRejection'));
      if (notes === null) return;
      
      setIsLoading(true);
      try {
          await updateDoc(doc(db, 'pending_updates', update.id), { status: 'rejected', adminNotes: notes });
          
          await addDoc(collection(db, 'notifications'), {
              title: t('requestRejected', { medicine: (update.newData as any)['Trade Name'] || (update.originalData as any)['Trade Name'] || '' }),
              body: `Rejected. ${notes ? `Reason: ${notes}` : ''}`,
              timestamp: Date.now(),
              type: 'request_result',
              targetUserId: update.submittedBy
          });

          alert(t('saveSuccess'));
          setSelectedUpdate(null);
          setIsEditingUpdate(false);
      } catch (err: any) { 
          alert("Error: " + err.message); 
      }
      finally { setIsLoading(false); }
  };

  const startEditingUpdate = (update: PendingUpdate) => {
      setEditFormData({ ...update.newData });
      setIsEditingUpdate(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveAndApprove = () => {
      if (!selectedUpdate) return;
      handleApproveUpdate(selectedUpdate, editFormData);
  };

  const renderApprovals = () => {
    if (selectedUpdate) {
        const newData = isEditingUpdate ? editFormData : selectedUpdate.newData as any;
        const oldData = selectedUpdate.originalData as any;
        const changedKeys = Object.keys(selectedUpdate.newData);

        return (
            <div className="animate-fade-in space-y-6 max-w-4xl mx-auto mb-20">
                <button onClick={() => { setSelectedUpdate(null); setIsEditingUpdate(false); }} className="flex items-center gap-2 text-primary font-bold"><BackIcon /> {t('back')}</button>
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4 dark:border-slate-700">
                        <div className="text-right rtl:text-right ltr:text-left">
                            <h3 className="text-lg font-black">{isEditingUpdate ? t('editProposal') : t('comparisonTitle')}</h3>
                            <p className="text-xs text-slate-400">{t('fromCompany', { name: selectedUpdate.submittedByName })}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {!isEditingUpdate ? (
                                <>
                                    <button onClick={() => handleRejectUpdate(selectedUpdate)} disabled={isLoading} className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-xs">{t('reject')}</button>
                                    <button onClick={() => startEditingUpdate(selectedUpdate)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1"><div className="w-3 h-3"><EditIcon /></div> {t('editProposal')}</button>
                                    <button onClick={() => handleApproveUpdate(selectedUpdate)} disabled={isLoading} className="flex-1 sm:flex-none px-6 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md">{t('directApprove')}</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditingUpdate(false)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">{t('cancel')}</button>
                                    <button onClick={handleSaveAndApprove} disabled={isLoading} className="flex-1 sm:flex-none px-6 py-2 bg-secondary text-white rounded-xl font-bold text-xs shadow-md">{t('saveAndApprove')}</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {changedKeys.length === 0 ? (
                            <p className="text-center text-slate-400 py-10 font-bold">{t('noPendingApprovals')}</p>
                        ) : changedKeys.map(key => {
                            return (
                                <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                                    <div className="col-span-full text-[10px] font-black uppercase text-slate-400 tracking-widest">{key}</div>
                                    <div className="text-right rtl:text-right ltr:text-left">
                                        <p className="text-[10px] text-slate-400 mb-1">{t('currentInSystem')}</p>
                                        <p className="text-sm font-bold text-slate-500 line-through opacity-70">{oldData?.[key] || '---'}</p>
                                    </div>
                                    <div className="text-right rtl:text-right ltr:text-left">
                                        <p className="text-[10px] text-primary mb-1">{isEditingUpdate ? t('yourEdit') : t('companyProposal')}</p>
                                        {isEditingUpdate ? (
                                            <input 
                                                type="text" 
                                                name={key} 
                                                value={editFormData[key] || ''} 
                                                onChange={handleEditFormChange} 
                                                className="w-full p-2 bg-white dark:bg-slate-700 border border-primary rounded-lg text-sm font-black text-primary outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm font-black text-primary">{newData[key] || '---'}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
            <h3 className="text-lg font-black px-2">{t('pendingApprovals')}</h3>
            {pendingUpdates.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 font-bold">{t('noPendingApprovals')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {pendingUpdates.map(update => (
                        <button 
                            key={update.id}
                            onClick={() => setSelectedUpdate(update)}
                            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between transition-all hover:border-primary/50"
                        >
                            <div className="flex items-center gap-4 text-right rtl:text-right ltr:text-left">
                                <div className={`w-12 h-12 ${update.type === 'add' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} rounded-xl flex items-center justify-center font-black`}>
                                    {(update.newData as any)['Trade Name']?.[0] || (update.originalData as any)['Trade Name']?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 dark:text-white leading-tight">{(update.newData as any)['Trade Name'] || (update.originalData as any)['Trade Name']}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">{t('submittedBy', { name: update.submittedByName })}</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-300 ltr:rotate-0 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
        {permissionError && (
            <div className="bg-red-500 text-white p-3 text-xs font-bold text-center animate-pulse">
                {permissionError}
            </div>
        )}
        
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setActivePanel('menu'); setSelectedUpdate(null); setIsEditingUpdate(false); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><BackIcon /></button>
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary">{t(`${activePanel}Panel` as any)}</h2>
                </div>
            </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto no-scrollbar pb-20">
            {activePanel === 'menu' && (
                <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title={t('totalUsersCount')} value={users.length} icon={<UsersIcon />} />
                        <StatCard title={t('totalCompaniesCount')} value={users.filter(u => u.role === 'company').length} icon={<DatabaseIcon />} />
                        <StatCard title={t('totalItemsCount')} value={allMedicines.length} icon={<PillBottleIcon />} />
                        <StatCard title={t('activeNotifications')} value={notifications.length} icon={<BellIcon />} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <MenuCard title={t('overviewPanel')} icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-white dark:bg-slate-800 text-blue-600 border-blue-100" />
                        <MenuCard title={t('usersPanel')} icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-white dark:bg-slate-800 text-green-600 border-green-100" />
                        <MenuCard title={t('approvalsPanel')} icon={<BellIcon />} onClick={() => setActivePanel('approvals')} colorClass="bg-white dark:bg-slate-800 text-amber-600 border-amber-100" badge={pendingUpdates.length} />
                        <MenuCard title={t('addManualPanel')} icon={<div className="text-3xl font-black">+</div>} onClick={() => setActivePanel('add_manual')} colorClass="bg-white dark:bg-slate-800 text-purple-600 border-purple-100" />
                        <MenuCard title={t('notificationsPanel')} icon={<BellIcon />} onClick={() => setActivePanel('notifications')} colorClass="bg-white dark:bg-slate-800 text-red-600 border-red-100" />
                        <MenuCard title={t('exportPanel')} icon={<DownloadIcon />} onClick={() => setActivePanel('export')} colorClass="bg-white dark:bg-slate-800 text-teal-600 border-teal-100" />
                        <MenuCard title={t('settingsPanel')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-white dark:bg-slate-800 text-slate-600 border-slate-100" />
                    </div>
                </div>
            )}

            {activePanel === 'overview' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                            <ChartIcon />
                        </div>
                        <h3 className="text-xl font-black">{t('dbAnalysis')}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('medicines')}</p>
                                <p className="text-2xl font-black text-primary">{allMedicines.filter(m => m['Product type'] === 'Human').length}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('supplements')}</p>
                                <p className="text-2xl font-black text-accent">{allMedicines.filter(m => m['Product type'] !== 'Human').length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activePanel === 'users' && (
                <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 shadow-sm">
                        <div className="w-5 h-5 text-slate-400"><SearchIcon /></div>
                        <input type="text" placeholder={t('searchUserPlaceholder')} className="bg-transparent font-bold outline-none flex-grow" value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {users.filter(u => u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.username?.toLowerCase().includes(userSearchTerm.toLowerCase())).map(u => {
                            const currentRole = userRoleChanges[u.id] || u.role;
                            const isChanged = !!userRoleChanges[u.id];
                            
                            return (
                                <div key={u.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-black">
                                            {u.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-right rtl:text-right ltr:text-left min-w-0">
                                            <p className="font-black text-slate-800 dark:text-white truncate">{u.username}</p>
                                            <p className="text-[10px] text-slate-400 font-bold truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                            {(['admin', 'premium', 'company'] as const).map(role => (
                                                <button 
                                                    key={role} 
                                                    onClick={() => setUserRoleChanges(prev => ({...prev, [u.id]: role}))} 
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${currentRole === role ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {t(`${role}Role` as any) || role}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {isChanged && (
                                            <button onClick={() => handleSaveUserRole(u.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md">{t('save')}</button>
                                        )}
                                        
                                        <button onClick={() => deleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            
            {activePanel === 'add_manual' && (
                <div className="animate-fade-in space-y-6 max-w-4xl mx-auto mb-20">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                        <div>
                        <h3 className="text-lg font-black">{t('addNewItem')}</h3>
                        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl mt-2 border border-slate-100 dark:border-slate-700 w-fit">
                            {(['Human', 'Supplement', 'Cosmetic'] as ItemCategory[]).map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setItemCategory(cat)} 
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${itemCategory === cat ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {cat === 'Human' ? t('medicines') : cat === 'Supplement' ? t('supplements') : t('navCosmetics')}
                            </button>
                            ))}
                        </div>
                        </div>
                    </div>

                    <form onSubmit={async (e) => { e.preventDefault(); setIsLoading(true); try { await setDoc(doc(db, itemCategory === 'Cosmetic' ? 'cosmetics' : 'medicines', formMed.RegisterNumber as string), { ...formMed, "Product type": itemCategory }); alert(t('saveSuccess')); setActivePanel('menu'); } catch(e:any) { alert(e.message); } finally { setIsLoading(false); } }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-full">
                        <label className={labelClass}>{t('registrationNumber')} *</label>
                        <input name="RegisterNumber" value={formMed.RegisterNumber} onChange={e => setFormMed({...formMed, RegisterNumber: e.target.value})} className={inputClass} required />
                        </div>
                        <div className="col-span-full">
                        <label className={labelClass}>{t('tradeName')} *</label>
                        <input name="Trade Name" value={formMed["Trade Name"]} onChange={e => setFormMed({...formMed, ["Trade Name"]: e.target.value})} className={inputClass} required />
                        </div>
                        <div className="col-span-full">
                        <label className={labelClass}>{t('scientificName')}</label>
                        <input name="Scientific Name" value={formMed["Scientific Name"]} onChange={e => setFormMed({...formMed, ["Scientific Name"]: e.target.value})} className={inputClass} />
                        </div>
                        <div className="col-span-full pt-4">
                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">{isLoading ? '...' : t('save')}</button>
                        </div>
                    </form>
                    </div>
                </div>
            )}

            {activePanel === 'approvals' && renderApprovals()}
            
            {activePanel === 'notifications' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h4 className="font-black text-primary">{t('broadcastTitle')}</h4>
                        <input placeholder={t('notificationTitle')} className={inputClass} value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
                        <textarea placeholder={t('notificationBody')} className={inputClass} rows={3} value={notifBody} onChange={e => setNotifBody(e.target.value)} />
                        <button 
                            onClick={async () => {
                                if(!notifTitle || !notifBody) return;
                                await addDoc(collection(db, 'notifications'), { title: notifTitle, body: notifBody, timestamp: Date.now(), type: 'info' });
                                alert(t('saveSuccess')); setNotifTitle(''); setNotifBody('');
                            }} 
                            className="w-full py-3 bg-red-600 text-white font-black rounded-xl active:scale-95 transition-transform"
                        >
                            {t('broadcastToAll')}
                        </button>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('activeNotifsTitle')}</p>
                        {notifications.sort((a,b) => b.timestamp - a.timestamp).map(n => (
                            <div key={n.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center gap-4">
                                <div className="min-w-0 text-right rtl:text-right ltr:text-left">
                                    <p className="font-bold text-sm truncate">{n.title}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleString()}</p>
                                </div>
                                <button onClick={() => { if(window.confirm(t('confirmDeleteNotif'))) deleteDoc(doc(db, 'notifications', n.id))}} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activePanel === 'settings' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-md mx-auto border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 animate-fade-in text-right rtl:text-right ltr:text-left">
                    <h3 className="font-black text-primary uppercase">{t('appSettingsTitle')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>{t('aiLimitLabel')}</label>
                            <input type="number" className={inputClass} value={appSettings.aiRequestLimit} onChange={e => setAppSettings({...appSettings, aiRequestLimit: parseInt(e.target.value)})} />
                        </div>
                         <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-sm font-bold">{t('aiToggleLabel')}</span>
                            <input type="checkbox" checked={appSettings.isAiEnabled} onChange={e => setAppSettings({...appSettings, isAiEnabled: e.target.checked})} className="w-5 h-5 accent-primary" />
                        </div>
                        <button onClick={() => { updateSettings(appSettings); alert(t('saveSuccess')); }} className="w-full py-3 bg-primary text-white font-black rounded-xl shadow-lg">{t('save')}</button>
                    </div>
                </div>
            )}

            {activePanel === 'export' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto animate-fade-in">
                    <button onClick={() => {
                         const dataToExport = allMedicines.filter(m => m['Product type'] === 'Human');
                         if (dataToExport.length === 0) { alert("Empty"); return; }
                         const headers = Object.keys(dataToExport[0]).join(',');
                         const rows = dataToExport.map(m => Object.values(m).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                         const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
                         const url = window.URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url; a.download = `Export_Human.csv`; a.click();
                    }} className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-teal-100 text-teal-600 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95">
                        <DownloadIcon /><span className="font-black">{t('exportMedicines')}</span>
                    </button>
                    <button onClick={() => {
                         const dataToExport = allMedicines.filter(m => m['Product type'] !== 'Human');
                         if (dataToExport.length === 0) { alert("Empty"); return; }
                         const headers = Object.keys(dataToExport[0]).join(',');
                         const rows = dataToExport.map(m => Object.values(m).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                         const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
                         const url = window.URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url; a.download = `Export_Supplements.csv`; a.click();
                    }} className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-amber-100 text-amber-600 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95">
                        <DownloadIcon /><span className="font-black">{t('exportSupplements')}</span>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
