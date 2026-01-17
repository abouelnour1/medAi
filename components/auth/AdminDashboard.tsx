
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TFunction, User, Medicine, AppSettings, InsuranceDrug, Cosmetic, Notification as AppNotification, PendingMedicineRequest } from '../../types';
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
import BellIcon from '../icons/BellIcon';
import SearchableDropdown from '../SearchableDropdown';
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, updateDoc, addDoc } from 'firebase/firestore';
import { setItem } from '../../utils/storage';

const MEDICINES_CACHE_KEY = 'saudi_drug_directory_medicines_cache';

type Panel = 'menu' | 'overview' | 'users' | 'medicines' | 'insurance' | 'cosmetics' | 'settings' | 'pending' | 'addItem' | 'notifications' | 'export';

const MenuCard: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; colorClass: string; badge?: number }> = ({ title, icon, onClick, colorClass, badge }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${colorClass} h-24 w-full relative`}
    >
        <div className="w-6 h-6 mb-2 opacity-80">{icon}</div>
        <span className="font-bold text-sm">{title}</span>
        {badge ? (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                {badge}
            </span>
        ) : null}
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
  const { user, updateUser, deleteUser, getSettings, updateSettings } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>('menu');
  const [users, setUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingMedicineRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PendingMedicineRequest | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());

  const fetchUsers = async () => {
      if (FIREBASE_DISABLED || user?.role !== 'admin') return;
      try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          const usersList: any[] = [];
          querySnapshot.forEach((doc) => usersList.push({ id: doc.id, ...doc.data() }));
          setUsers(usersList);
      } catch (err) {
          console.error("Admin: Error fetching users:", err);
      }
  };

  const fetchPendingRequests = async () => {
      if (FIREBASE_DISABLED || user?.role !== 'admin') return;
      try {
          const q = query(collection(db, 'pending_requests'), where('status', '==', 'pending'));
          const snapshot = await getDocs(q);
          const list: PendingMedicineRequest[] = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PendingMedicineRequest));
          setPendingRequests(list);
      } catch (err) {
          console.error("Admin: Error fetching requests:", err);
      }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
        fetchUsers();
        fetchPendingRequests();
    }
  }, [activePanel, user]);

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected', modifiedData?: Medicine) => {
      if (FIREBASE_DISABLED || user?.role !== 'admin') return;
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) return;

      const targetData = modifiedData || request.medicineData;

      try {
          if (status === 'approved') {
              // 1. Update/Add to official medicines
              await setDoc(doc(db, 'medicines', targetData.RegisterNumber), targetData, { merge: true });
              
              // 2. Update local state
              setMedicines(prev => {
                  const updated = prev.some(m => m.RegisterNumber === targetData.RegisterNumber)
                    ? prev.map(m => m.RegisterNumber === targetData.RegisterNumber ? targetData : m)
                    : [...prev, targetData];
                  setItem(MEDICINES_CACHE_KEY, updated).catch(console.error);
                  return updated;
              });

              // 3. Notify Company
              await addDoc(collection(db, 'notifications'), {
                  targetUserId: request.submittedBy,
                  title: t('notificationApprovedTitle'),
                  body: t('notificationApprovedBody', { name: targetData['Trade Name'] }),
                  timestamp: Date.now(),
                  type: 'approval'
              });
          } else {
              // Notify rejection
              await addDoc(collection(db, 'notifications'), {
                  targetUserId: request.submittedBy,
                  title: t('notificationRejectedTitle'),
                  body: t('notificationRejectedBody'),
                  timestamp: Date.now(),
                  type: 'alert'
              });
          }

          // 4. Update request status in DB
          await updateDoc(doc(db, 'pending_requests', requestId), { status: status });
          setPendingRequests(prev => prev.filter(r => r.id !== requestId));
          setSelectedRequest(null);
          setIsEditMode(false);
          alert(status === 'approved' ? t('approvalSuccess') : t('rejectionSuccess'));
      } catch (err) {
          console.error("Admin Action Error:", err);
          alert("Action failed due to missing permissions or database error.");
      }
  };

  const renderPendingPanel = () => (
      <div className="space-y-4 animate-fade-in">
          {pendingRequests.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-400 font-bold">{t('noPendingRequests')}</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map(req => (
                      <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                              <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${req.type === 'edit' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                  {req.type === 'edit' ? 'Edit Request' : 'New Medicine'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(req.timestamp).toLocaleString()}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-white mb-1">{req.medicineData['Trade Name']}</h4>
                          <p className="text-xs text-slate-500 mb-4">{t('submittedBy')}: <span className="font-bold text-primary">{req.submittedByCompany || req.submittedByEmail}</span></p>
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white transition-all rounded-lg font-bold text-xs"
                          >
                            Review Changes
                          </button>
                      </div>
                  ))}
              </div>
          )}

          {/* Review Modal */}
          {selectedRequest && (
              <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                      <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
                          <h3 className="font-black uppercase tracking-tight">{t('comparisonView')}</h3>
                          <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">✕</button>
                      </div>
                      
                      <div className="flex-grow overflow-y-auto p-4 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                  <h4 className="text-xs font-black text-slate-400 uppercase text-center">{t('currentData')}</h4>
                                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 opacity-60">
                                      {/* عرض البيانات الحالية للدواء إذا كان تعديل */}
                                      {(() => {
                                          const original = allMedicines.find(m => m.RegisterNumber === selectedRequest.medicineData.RegisterNumber);
                                          return original ? (
                                              <div className="text-xs space-y-1">
                                                  <p><b>Name:</b> {original['Trade Name']}</p>
                                                  <p><b>Price:</b> {original['Public price']}</p>
                                                  <p><b>Sci:</b> {original['Scientific Name']}</p>
                                              </div>
                                          ) : <p className="text-center italic">New Record</p>;
                                      })()}
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  <h4 className="text-xs font-black text-primary uppercase text-center">{t('proposedData')}</h4>
                                  <div className="p-4 bg-primary/5 rounded-xl border-2 border-primary/20">
                                      <div className="text-xs space-y-1">
                                          <p><b>Name:</b> {selectedRequest.medicineData['Trade Name']}</p>
                                          <p><b>Price:</b> {selectedRequest.medicineData['Public price']}</p>
                                          <p><b>Sci:</b> {selectedRequest.medicineData['Scientific Name']}</p>
                                          <p><b>Note:</b> {selectedRequest.medicineData.physicalNotes}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="p-4 border-t dark:border-slate-800 flex flex-wrap gap-2 justify-end">
                          <button onClick={() => handleRequestAction(selectedRequest.id, 'rejected')} className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl text-xs">{t('reject')}</button>
                          <button 
                            onClick={() => {
                                // Logic to open edit modal with these data then re-save
                                alert("Editing feature for pending requests is coming in next release. Proceeding to direct approve.");
                                handleRequestAction(selectedRequest.id, 'approved');
                            }} 
                            className="px-6 py-2.5 bg-blue-500 text-white font-bold rounded-xl text-xs"
                          >
                            {t('editAndApprove')}
                          </button>
                          <button onClick={() => handleRequestAction(selectedRequest.id, 'approved')} className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/30">{t('approve')}</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center gap-2 sticky top-0 z-20">
                <button onClick={() => setActivePanel('menu')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><BackIcon /></button>
                <h2 className="text-xl font-bold capitalize">{activePanel === 'pending' ? t('pendingApprovals') : activePanel}</h2>
            </div>
        )}
        <div className="flex-grow p-4 overflow-y-auto">
            {activePanel === 'menu' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                    <MenuCard title={t('pendingApprovals')} icon={<BellIcon />} onClick={() => setActivePanel('pending')} colorClass="bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800" badge={pendingRequests.length} />
                    <MenuCard title={t('adminPanelOverview')} icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" />
                    <MenuCard title={t('userManagementTitle')} icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800" />
                    <MenuCard title={t('addNewItem')} icon={<div className="text-xl font-bold">+</div>} onClick={() => setActivePanel('addItem')} colorClass="bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800" />
                    <MenuCard title={t('exportData')} icon={<DownloadIcon />} onClick={() => setActivePanel('export')} colorClass="bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800" />
                    <MenuCard title={t('appSettingsTitle')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-slate-50 text-slate-600 border-slate-200 dark:border-slate-800 dark:text-slate-300 dark:border-slate-700" />
                </div>
            )}
            {activePanel === 'pending' && renderPendingPanel()}
            {/* ... other panels logic ... */}
        </div>
    </div>
  );
};
