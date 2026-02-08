
import React, { useState, useEffect, useMemo } from 'react';
import { TFunction, User, Medicine, AppSettings, PendingUpdate, Notification as AppNotification } from '../../types';
import { useAuth } from './AuthContext';
import ChartIcon from '../icons/ChartIcon';
import UsersIcon from '../icons/UsersIcon';
import PillBottleIcon from '../icons/PillBottleIcon';
import SettingsIcon from '../icons/SettingsIcon';
import SearchIcon from '../icons/SearchIcon';
import TrashIcon from '../icons/TrashIcon';
import BackIcon from '../icons/BackIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import BellIcon from '../icons/BellIcon';
import DownloadIcon from '../icons/DownloadIcon';
import SearchableDropdown from '../SearchableDropdown';
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, doc, setDoc, addDoc, updateDoc, query, onSnapshot, where, getDoc, deleteDoc } from 'firebase/firestore';

type Panel = 'menu' | 'overview' | 'users' | 'approvals' | 'add_manual' | 'notifications' | 'export' | 'settings';
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

export const AdminDashboard: React.FC<{ t: TFunction, allMedicines: Medicine[], setMedicines: any, onExport: (type: 'medicine' | 'supplement' | 'food') => void }> = ({ t, allMedicines, onExport }) => {
  const { user, deleteUser, updateSettings } = useAuth();
  
  const inputClass = "w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm dark:text-white";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest px-1";
  const sectionTitle = "text-xs font-black text-primary uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 mt-2";

  const [activePanel, setActivePanel] = useState<Panel>('menu');
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ aiRequestLimit: 5, isAiEnabled: true });
  const [isLoading, setIsLoading] = useState(false);
  const [itemCategory, setItemCategory] = useState<ItemCategory>('Human');
  const [selectedUpdate, setSelectedUpdate] = useState<PendingUpdate | null>(null);
  const [isEditingUpdate, setIsEditingUpdate] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  
  const [notifForm, setNotifForm] = useState({ title: '', body: '', targetRole: 'all', linkedMedicineTradeName: '' });
  const [userRoleChanges, setUserRoleChanges] = useState<{[key: string]: User['role']}>({});

  const [formMed, setFormMed] = useState<any>({
      RegisterNumber: '', "Trade Name": '', "Scientific Name": '', "Public price": '',
      PharmaceuticalForm: '', Strength: '', StrengthUnit: '', PackageSize: '', 
      "Manufacture Name": '', "Legal Status": 'Prescription', "Product Control": 'Uncontrolled',
      "Storage Condition Arabic": '', shelfLife: '', AtcCode1: '', imgBox: '', BrandName: '', SpecificName: '', manufacturerNameEn: ''
  });

  const dbLists = useMemo(() => {
    return {
      scientificNames: Array.from(new Set(allMedicines.map(m => m["Scientific Name"]).filter(Boolean))).sort(),
      manufacturers: Array.from(new Set(allMedicines.map(m => m["Manufacture Name"]).filter(Boolean))).sort(),
      forms: Array.from(new Set(allMedicines.map(m => m.PharmaceuticalForm).filter(Boolean))).sort(),
      units: Array.from(new Set(allMedicines.map(m => m.StrengthUnit).filter(Boolean))).sort(),
      tradeNames: Array.from(new Set(allMedicines.map(m => m["Trade Name"]).filter(Boolean))).sort(),
    };
  }, [allMedicines]);

  useEffect(() => {
    if (FIREBASE_DISABLED || !user || user.role !== 'admin') return;
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User))));
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification))));
    const q = query(collection(db, 'pending_updates'), where('status', '==', 'pending'));
    const unsubApprovals = onSnapshot(q, (snap) => setPendingUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingUpdate))));

    getDoc(doc(db, 'settings', 'app_settings')).then(snap => {
        if (snap.exists()) setAppSettings(snap.data() as AppSettings);
    }).catch(err => console.warn("Settings fetch failed", err));

    return () => { unsubUsers(); unsubNotifs(); unsubApprovals(); };
  }, [user]);

  const handleSaveUserRole = async (userId: string) => {
    const newRole = userRoleChanges[userId];
    if (!newRole) return;
    setIsLoading(true);
    try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
        setUserRoleChanges(prev => { const n = {...prev}; delete n[userId]; return n; });
        alert(t('saveSuccess'));
    } catch(e:any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.body) return;
    setIsLoading(true);
    try {
        let relatedMedicineId = '';
        if (notifForm.linkedMedicineTradeName) {
            const med = allMedicines.find(m => m["Trade Name"] === notifForm.linkedMedicineTradeName);
            if (med) relatedMedicineId = med.RegisterNumber;
        }

        await addDoc(collection(db, 'notifications'), {
            title: notifForm.title,
            body: notifForm.body,
            timestamp: Date.now(),
            type: 'info',
            targetRole: notifForm.targetRole === 'all' ? null : notifForm.targetRole,
            relatedMedicineId: relatedMedicineId || null
        });
        alert(t('saveSuccess'));
        setNotifForm({ title: '', body: '', targetRole: 'all', linkedMedicineTradeName: '' });
    } catch(e:any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleApproveUpdate = async (update: PendingUpdate, finalDataOverride?: any) => {
      if (!finalDataOverride && !window.confirm(t('confirmApprove'))) return;
      setIsLoading(true);
      try {
          const itemId = update.medicineId || (update.newData as any).RegisterNumber || (update.newData as any).id;
          const dataToMerge = finalDataOverride || update.newData;
          const collectionName = update.itemType === 'cosmetic' ? 'cosmetics' : 'medicines';
          
          await setDoc(doc(db, collectionName, itemId), dataToMerge, { merge: true });
          await updateDoc(doc(db, 'pending_updates', update.id), { status: 'approved' });
          
          const itemName = (dataToMerge as any)['Trade Name'] || (dataToMerge as any).SpecificName || 'الصنف';
          await addDoc(collection(db, 'notifications'), {
              title: "✅ تمت الموافقة على طلب التعديل",
              body: `أهلاً ${update.submittedByName}، لقد تمت مراجعة تعديلاتك على ${itemName} واعتمادها بنجاح.`,
              timestamp: Date.now(),
              type: 'request_result',
              targetUserId: update.submittedBy 
          });

          alert(t('saveSuccess'));
          setSelectedUpdate(null);
          setIsEditingUpdate(false);
      } catch (err: any) { alert(err.message); } finally { setIsLoading(false); }
  };

  const handleRejectUpdate = async (update: PendingUpdate) => {
      const notes = window.prompt(t('reasonForRejection'));
      if (notes === null) return;
      
      setIsLoading(true);
      try {
          await updateDoc(doc(db, 'pending_updates', update.id), { status: 'rejected', adminNotes: notes });
          const itemName = (update.newData as any)['Trade Name'] || (update.newData as any).SpecificName || 'الصنف';
          await addDoc(collection(db, 'notifications'), {
              title: "❌ تم رفض طلب التعديل",
              body: `عذراً ${update.submittedByName}، لم يتم قبول تعديلك على ${itemName}. السبب: ${notes || 'لم يتم ذكر سبب محدد.'}`,
              timestamp: Date.now(),
              type: 'request_result',
              targetUserId: update.submittedBy
          });
          setSelectedUpdate(null);
          alert(t('saveSuccess'));
      } catch (err: any) { alert(err.message); } finally { setIsLoading(false); }
  };

  const renderAddManual = () => (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto mb-20">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                <div>
                    <h3 className="text-lg font-black">{t('addNewItem')}</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mt-2 border border-slate-200 dark:border-slate-700 w-fit">
                        {(['Human', 'Supplement', 'Cosmetic'] as ItemCategory[]).map(cat => (
                            <button key={cat} onClick={() => setItemCategory(cat)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${itemCategory === cat ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                {cat === 'Human' ? t('medicines') : cat === 'Supplement' ? t('supplements') : t('navCosmetics')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <form onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsLoading(true); 
                try {
                    const collectionName = itemCategory === 'Cosmetic' ? 'cosmetics' : 'medicines';
                    const id = itemCategory === 'Cosmetic' ? `cosm-${Date.now()}` : formMed.RegisterNumber;
                    const finalData = itemCategory === 'Cosmetic' ? { id, ...formMed } : { ...formMed, "Product type": itemCategory };
                    await setDoc(doc(db, collectionName, id), finalData); 
                    alert(t('saveSuccess')); 
                    setActivePanel('menu'); 
                } catch(e:any) { alert(e.message); } finally { setIsLoading(false); } 
            }} className="space-y-8">
                {itemCategory === 'Cosmetic' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-full"><label className={labelClass}>Brand Name *</label><input value={formMed.BrandName} onChange={e => setFormMed({...formMed, BrandName: e.target.value})} className={inputClass} required /></div>
                        <div className="col-span-full"><label className={labelClass}>Product Specific Name *</label><input value={formMed.SpecificName} onChange={e => setFormMed({...formMed, SpecificName: e.target.value})} className={inputClass} required /></div>
                        <div><label className={labelClass}>{t('price')} (SAR)</label><input type="number" step="0.01" value={formMed["Public price"]} onChange={e => setFormMed({...formMed, ["Public price"]: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>Manufacturer</label><input value={formMed.manufacturerNameEn} onChange={e => setFormMed({...formMed, manufacturerNameEn: e.target.value})} className={inputClass} /></div>
                        <div className="col-span-full"><label className={labelClass}>Image URL (imgBox)</label><input value={formMed.imgBox} onChange={e => setFormMed({...formMed, imgBox: e.target.value})} className={inputClass} placeholder="https://..." /></div>
                    </div>
                ) : (
                    <>
                        <div>
                            <h4 className={sectionTitle}>1. الهوية الأساسية (Identity)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-full"><label className={labelClass}>{t('registrationNumber')} *</label><input value={formMed.RegisterNumber} onChange={e => setFormMed({...formMed, RegisterNumber: e.target.value})} className={inputClass} required /></div>
                                <div className="col-span-full"><label className={labelClass}>{t('tradeName')} *</label><input value={formMed["Trade Name"]} onChange={e => setFormMed({...formMed, ["Trade Name"]: e.target.value})} className={inputClass} required /></div>
                                <div className="col-span-full">
                                    <label className={labelClass}>{t('scientificName')}</label>
                                    <input list="sci-names" value={formMed["Scientific Name"]} onChange={e => setFormMed({...formMed, ["Scientific Name"]: e.target.value})} className={inputClass} placeholder={t('pleaseSelectOrAdd')} />
                                    <datalist id="sci-names">{dbLists.scientificNames.map(s => <option key={s} value={s} />)}</datalist>
                                </div>
                                <div><label className={labelClass}>{t('price')} (SAR)</label><input type="number" step="0.01" value={formMed["Public price"]} onChange={e => setFormMed({...formMed, ["Public price"]: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>كود ATC</label><input value={formMed.AtcCode1} onChange={e => setFormMed({...formMed, AtcCode1: e.target.value})} className={inputClass} placeholder="C09CA01..." /></div>
                            </div>
                        </div>
                        <div>
                            <h4 className={sectionTitle}>2. التكوين والصيدلة (Composition)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-full">
                                    <label className={labelClass}>{t('pharmaceuticalForm')}</label>
                                    <input list="form-list" value={formMed.PharmaceuticalForm} onChange={e => setFormMed({...formMed, PharmaceuticalForm: e.target.value})} className={inputClass} placeholder={t('pleaseSelectOrAdd')} />
                                    <datalist id="form-list">{dbLists.forms.map(f => <option key={f} value={f} />)}</datalist>
                                </div>
                                <div><label className={labelClass}>{t('strength')}</label><input value={formMed.Strength} onChange={e => setFormMed({...formMed, Strength: e.target.value})} className={inputClass} placeholder="500, 10..." /></div>
                                <div><label className={labelClass}>الوحدة (Unit)</label><input list="unit-list" value={formMed.StrengthUnit} onChange={e => setFormMed({...formMed, StrengthUnit: e.target.value})} className={inputClass} placeholder="mg, ml..." /><datalist id="unit-list">{dbLists.units.map(u => <option key={u} value={u} />)}</datalist></div>
                                <div><label className={labelClass}>{t('packageSize')}</label><input value={formMed.PackageSize} onChange={e => setFormMed({...formMed, PackageSize: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>الشركة المصنعة</label><input list="mfr-list" value={formMed["Manufacture Name"]} onChange={e => setFormMed({...formMed, ["Manufacture Name"]: e.target.value})} className={inputClass} placeholder={t('pleaseSelectOrAdd')} /><datalist id="mfr-list">{dbLists.manufacturers.map(m => <option key={m} value={m} />)}</datalist></div>
                            </div>
                        </div>
                        <div>
                            <h4 className={sectionTitle}>3. التنظيم واللوجستيك (Regulatory)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className={labelClass}>{t('legalStatus')}</label><select value={formMed["Legal Status"]} onChange={e => setFormMed({...formMed, ["Legal Status"]: e.target.value})} className={inputClass}><option value="Prescription">Rx (Prescription)</option><option value="OTC">OTC</option></select></div>
                                <div><label className={labelClass}>الرقابة</label><select value={formMed["Product Control"]} onChange={e => setFormMed({...formMed, ["Product Control"]: e.target.value})} className={inputClass}><option value="Uncontrolled">Uncontrolled</option><option value="Controlled">Controlled</option><option value="Restricted">Restricted</option></select></div>
                                <div><label className={labelClass}>{t('shelfLife')} (Month)</label><input type="number" value={formMed.shelfLife} onChange={e => setFormMed({...formMed, shelfLife: e.target.value})} className={inputClass} /></div>
                                <div className="col-span-full"><label className={labelClass}>ظروف التخزين (Ar)</label><input value={formMed["Storage Condition Arabic"]} onChange={e => setFormMed({...formMed, ["Storage Condition Arabic"]: e.target.value})} className={`${inputClass} text-right`} dir="rtl" /></div>
                            </div>
                        </div>
                    </>
                )}
                <div className="pt-4"><button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50">{isLoading ? '...' : t('save')}</button></div>
            </form>
        </div>
    </div>
  );

  const renderApprovals = () => {
    if (selectedUpdate) {
        const newData = isEditingUpdate ? editFormData : selectedUpdate.newData as any;
        const oldData = selectedUpdate.originalData as any;
        const changedKeys = Object.keys(selectedUpdate.newData).filter(key => {
            const newVal = String(selectedUpdate.newData[key as keyof typeof selectedUpdate.newData] || '').trim();
            const oldVal = String(oldData?.[key] || '').trim();
            // تجاهل روابط الصور إذا كانت لم تتغير (النجوم)
            if (newVal === '****************************') return false;
            return newVal !== oldVal;
        });

        return (
            <div className="animate-fade-in space-y-6 max-w-4xl mx-auto mb-20">
                <button onClick={() => { setSelectedUpdate(null); setIsEditingUpdate(false); }} className="flex items-center gap-2 text-primary font-bold"><BackIcon /> {t('back')}</button>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4 dark:border-slate-700">
                        <div className="text-right rtl:text-right">
                            <h3 className="text-lg font-black">{isEditingUpdate ? t('editProposal') : "مراجعة التغييرات المقترحة"}</h3>
                            <p className="text-xs text-slate-400">{t('fromCompany', { name: selectedUpdate.submittedByName })}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {!isEditingUpdate ? (
                                <>
                                    <button onClick={() => handleRejectUpdate(selectedUpdate)} disabled={isLoading} className="flex-1 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-xs">{t('reject')}</button>
                                    <button onClick={() => { setEditFormData({...selectedUpdate.newData}); setIsEditingUpdate(true); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">{t('editProposal')}</button>
                                    <button onClick={() => handleApproveUpdate(selectedUpdate)} disabled={isLoading} className="flex-1 px-6 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md">{t('directApprove')}</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditingUpdate(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">{t('cancel')}</button>
                                    <button onClick={() => handleApproveUpdate(selectedUpdate, editFormData)} disabled={isLoading} className="px-6 py-2 bg-secondary text-white rounded-xl font-bold text-xs shadow-md">{t('saveAndApprove')}</button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {changedKeys.length === 0 && <p className="text-center py-10 text-slate-400 italic">لا توجد حقول مختلفة حالياً.</p>}
                        {changedKeys.map(key => (
                            <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border-2 border-primary/10 bg-slate-50 dark:bg-slate-900/40">
                                <div className="col-span-full flex justify-between">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">{key}</span>
                                    <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black">MODIFIED</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 mb-1">{t('currentInSystem')}</p>
                                    <p className="text-sm font-bold text-red-400/70 line-through truncate">{oldData?.[key] || '(فارغ)'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-primary mb-1">{t('companyProposal')}</p>
                                    {isEditingUpdate ? (
                                        <input value={editFormData[key] || ''} onChange={e => setEditFormData({...editFormData, [key]: e.target.value})} className="w-full p-2 bg-white dark:bg-slate-700 border-2 border-primary rounded-lg text-sm font-black text-primary outline-none" />
                                    ) : (
                                        <p className="text-sm font-black text-green-600 dark:text-green-400 truncate">{newData[key] || '(مسح القيمة)'}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
            <h3 className="text-lg font-black px-2">{t('pendingApprovals')}</h3>
            {pendingUpdates.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700"><p className="text-slate-400 font-bold">{t('noPendingApprovals')}</p></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {pendingUpdates.map(update => (
                        <button key={update.id} onClick={() => setSelectedUpdate(update)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between transition-all hover:border-primary/50">
                            <div className="flex items-center gap-4 text-right">
                                <div className={`w-12 h-12 ${update.itemType === 'cosmetic' ? 'bg-pink-100 text-pink-600' : 'bg-primary/10 text-primary'} rounded-xl flex items-center justify-center font-black`}>{update.itemType === 'cosmetic' ? 'C' : 'M'}</div>
                                <div><p className="font-black text-slate-800 dark:text-white leading-tight">{(update.newData as any)['Trade Name'] || (update.newData as any).SpecificName}</p><p className="text-[10px] text-slate-400 font-bold mt-1">{t('submittedBy', { name: update.submittedByName })}</p></div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-300 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const renderExportPanel = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 p-4">
                <DownloadIcon />
            </div>
            <h3 className="text-lg font-black mb-6">{t('exportData')}</h3>
            <div className="grid grid-cols-1 gap-3">
                <button onClick={() => onExport('medicine')} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-primary/10 hover:text-primary rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-primary group-hover:scale-110 transition-transform">
                            <PillBottleIcon />
                        </div>
                        <div className="text-right rtl:text-right">
                            <p className="font-bold text-sm">{t('exportMedicines')}</p>
                        </div>
                    </div>
                    <div className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <DownloadIcon />
                    </div>
                </button>
                <button onClick={() => onExport('supplement')} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-accent/10 hover:text-accent rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-accent group-hover:scale-110 transition-transform">
                            <DatabaseIcon />
                        </div>
                        <div className="text-right rtl:text-right">
                            <p className="font-bold text-sm">{t('exportSupplements')}</p>
                        </div>
                    </div>
                    <div className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <DownloadIcon />
                    </div>
                </button>
                <button onClick={() => onExport('food')} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-teal-500/10 hover:text-teal-600 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-teal-600 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" /></svg>
                        </div>
                        <div className="text-right rtl:text-right">
                            <p className="font-bold text-sm">{t('exportFood')}</p>
                        </div>
                    </div>
                    <div className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <DownloadIcon />
                    </div>
                </button>
            </div>
        </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className={sectionTitle}>{t('broadcastTitle')}</h3>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div><label className={labelClass}>{t('notificationTitle')}</label><input value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} className={inputClass} placeholder="عنوان الإشعار..." required /></div>
                <div><label className={labelClass}>{t('notificationBody')}</label><textarea value={notifForm.body} onChange={e => setNotifForm({...notifForm, body: e.target.value})} className={inputClass} rows={3} placeholder="محتوى الإشعار..." required /></div>
                
                {/* قسم ربط الدواء الجديد */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className={labelClass}>ربط دواء (اختياري)</label>
                    <SearchableDropdown
                        ariaLabel="Linked Medicine"
                        options={dbLists.tradeNames}
                        value={notifForm.linkedMedicineTradeName}
                        onChange={(val) => setNotifForm({...notifForm, linkedMedicineTradeName: String(val)})}
                        placeholder="ابحث عن دواء لربطه..."
                        t={t}
                    />
                    <p className="text-[9px] text-slate-400 mt-2">سيظهر زر "عرض ملف الدواء" للمستخدم عند النقر على الإشعار.</p>
                </div>

                <div><label className={labelClass}>المستهدفين</label><select value={notifForm.targetRole} onChange={e => setNotifForm({...notifForm, targetRole: e.target.value})} className={inputClass}><option value="all">الجميع (All Users)</option><option value="company">الشركات فقط</option></select></div>
                <button type="submit" disabled={isLoading} className="w-full py-3 bg-red-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all">{isLoading ? '...' : t('sendBroadcast')}</button>
            </form>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3"><button onClick={() => { setActivePanel('menu'); setSelectedUpdate(null); setIsEditingUpdate(false); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><BackIcon /></button><h2 className="text-sm font-black uppercase tracking-widest text-primary">{t(`${activePanel}Panel` as any)}</h2></div>
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
                        <MenuCard title={t('exportPanel')} icon={<DownloadIcon />} onClick={() => setActivePanel('export')} colorClass="bg-white dark:bg-slate-800 text-primary border-primary/10" />
                        <MenuCard title={t('settingsPanel')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-white dark:bg-slate-800 text-slate-600 border-slate-100" />
                    </div>
                </div>
            )}
            {activePanel === 'add_manual' && renderAddManual()}
            {activePanel === 'approvals' && renderApprovals()}
            {activePanel === 'export' && renderExportPanel()}
            {activePanel === 'notifications' && renderNotifications()}
            {activePanel === 'settings' && (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className={sectionTitle}>{t('appSettingsTitle')}</h3>
                        <form onSubmit={async (e) => { e.preventDefault(); setIsLoading(true); try { await setDoc(doc(db, 'settings', 'app_settings'), appSettings); updateSettings(appSettings); alert(t('saveSuccess')); } catch(e:any) { alert(e.message); } finally { setIsLoading(false); } }} className="space-y-6">
                            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <div><p className="text-sm font-bold">{t('aiToggleLabel')}</p></div>
                                <input type="checkbox" checked={appSettings.isAiEnabled} onChange={e => setAppSettings({...appSettings, isAiEnabled: e.target.checked})} className="w-6 h-6 accent-primary" />
                            </div>
                            <div><label className={labelClass}>{t('aiLimitLabel')}</label><input type="number" value={appSettings.aiRequestLimit} onChange={e => setAppSettings({...appSettings, aiRequestLimit: parseInt(e.target.value)})} className={inputClass} /></div>
                            <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">{isLoading ? '...' : t('save')}</button>
                        </form>
                    </div>
                </div>
            )}
            {activePanel === 'users' && (
                <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 shadow-sm"><div className="w-5 h-5 text-slate-400"><SearchIcon /></div><input type="text" placeholder={t('searchUserPlaceholder')} className="bg-transparent font-bold outline-none flex-grow" value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} /></div>
                    <div className="grid grid-cols-1 gap-3">
                        {users.filter(u => u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())).map(u => {
                            const currentRole = userRoleChanges[u.id] || u.role;
                            return (
                                <div key={u.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">{u.username?.charAt(0).toUpperCase()}</div><div className="text-right rtl:text-right"><p className="font-black text-sm">{u.username}</p><p className="text-[10px] text-slate-400">{u.email}</p></div></div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100">{(['admin', 'premium', 'company'] as const).map(role => (<button key={role} onClick={() => setUserRoleChanges(prev => ({...prev, [u.id]: role}))} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${currentRole === role ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t(`${role}Role` as any)}</button>))}</div>
                                        {!!userRoleChanges[u.id] && <button onClick={() => handleSaveUserRole(u.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md">{t('save')}</button>}
                                        <button onClick={() => { if(window.confirm(t('confirmDeleteUser'))) deleteUser(u.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><TrashIcon /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {activePanel === 'overview' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary"><ChartIcon /></div>
                        <h3 className="text-xl font-black">{t('dbAnalysis')}</h3>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase">{t('medicines')}</p><p className="text-2xl font-black text-primary">{allMedicines.filter(m => m['Product type'] === 'Human').length}</p></div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase">{t('supplements')}</p><p className="text-2xl font-black text-accent">{allMedicines.filter(m => m['Product type'] === 'Supplement').length}</p></div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase">Food</p><p className="text-2xl font-black text-teal-600">{allMedicines.filter(m => m['Product type'] === 'Food').length}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
