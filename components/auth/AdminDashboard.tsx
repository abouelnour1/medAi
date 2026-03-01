
import React, { useState, useEffect, useMemo } from 'react';
import { TFunction, User, Medicine, AppSettings, PendingUpdate, Notification as AppNotification, Language } from '../../types';
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
import { getTopSearched, getTotalSearches, clearAnalytics } from '../../utils/analytics';
import FeaturedSchedulePanel from './FeaturedSchedulePanel';
import PillIcon from '../icons/PillIcon';
import FactoryIcon from '../icons/FactoryIcon';
import GlobeIcon from '../icons/GlobeIcon';
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, doc, setDoc, addDoc, updateDoc, query, onSnapshot, where, getDoc, deleteDoc } from 'firebase/firestore';

type Panel = 'menu' | 'overview' | 'users' | 'approvals' | 'add_manual' | 'notifications' | 'export' | 'settings' | 'featured_schedule';
type ItemCategory = 'Human' | 'Supplement' | 'Food';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-dark-card p-5 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-dark-border shadow-sm transition-all hover:shadow-md">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">{icon}</div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 dark:text-dark-muted uppercase tracking-widest truncate">{title}</p>
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

import ClinicalDataManager from '../ClinicalDataManager';

export const AdminDashboard: React.FC<{ t: TFunction, allMedicines: Medicine[], setMedicines: any, onExport: (type: 'medicine' | 'supplement' | 'food') => void, language?: Language }> = ({ t, allMedicines, onExport, language = 'ar' }) => {
  const { user, deleteUser, updateSettings, updateUser } = useAuth();
  
  const inputClass = "w-full p-3 bg-slate-50 dark:bg-dark-card border-2 border-slate-100 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-bold dark:text-white";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest px-1";
  const sectionTitle = "text-[11px] font-black text-primary uppercase tracking-widest border-b border-slate-100 dark:border-dark-border pb-2 mb-4 mt-6 flex items-center gap-2";

  const [activePanel, setActivePanel] = useState<Panel>('menu');
  const [showClinicalManager, setShowClinicalManager] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ aiRequestLimit: 5, isAiEnabled: true, isFeaturedEnabled: true });
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
      "Storage Condition Arabic": '', shelfLife: '', AtcCode1: '', imgBox: '', 
      "Marketing Company": '', "Main Agent": '', "Manufacture Country": '', "AdministrationRoute": '',
      "Description Code": '', "Authorization Status": 'Valid', description: ''
  });

  // توليد قوائم فريدة من البيانات الحالية للاقتراح التلقائي
  const dbLists = useMemo(() => {
    const getUnique = (key: keyof Medicine) => 
        Array.from(new Set(allMedicines.map(m => String(m[key] || '').trim()).filter(val => val !== '' && val.toLowerCase() !== 'n/a'))).sort();

    return {
      scientificNames: getUnique('Scientific Name'),
      manufacturers: getUnique('Manufacture Name'),
      forms: getUnique('PharmaceuticalForm'),
      units: getUnique('StrengthUnit'),
      marketingCompanies: getUnique('Marketing Company'),
      agents: getUnique('Main Agent'),
      routes: getUnique('AdministrationRoute'),
      countries: getUnique('Manufacture Country'),
      tradeNames: getUnique('Trade Name')
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
          const collectionName = 'medicines'; 
          
          await setDoc(doc(db, collectionName, itemId), dataToMerge, { merge: true });
          await updateDoc(doc(db, 'pending_updates', update.id), { status: 'approved' });
          
          const itemName = (dataToMerge as any)['Trade Name'] || 'الصنف';
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
          const itemName = (update.newData as any)['Trade Name'] || 'الصنف';
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
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto mb-20">
        <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-dark-border">
                <div>
                    <h3 className="text-lg font-black">إضافة صنف جديد يدوياً</h3>
                    <div className="flex bg-slate-100 dark:bg-dark-card p-1 rounded-xl mt-2 border border-slate-200 dark:border-dark-border w-fit">
                        {(['Human', 'Supplement', 'Food'] as ItemCategory[]).map(cat => (
                            <button key={cat} onClick={() => setItemCategory(cat)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${itemCategory === cat ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                {cat === 'Human' ? t('medicines') : cat === 'Supplement' ? t('supplements') : t('food')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <form onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsLoading(true); 
                try {
                    const id = formMed.RegisterNumber || `manual-${Date.now()}`;
                    const finalData = { ...formMed, RegisterNumber: id, "Product type": itemCategory };
                    await setDoc(doc(db, 'medicines', id), finalData); 
                    alert(t('saveSuccess')); 
                    setActivePanel('menu'); 
                } catch(e:any) { alert(e.message); } finally { setIsLoading(false); } 
            }} className="space-y-4">
                
                {/* قسم الهوية */}
                <div>
                    <h4 className={sectionTitle}><div className="w-3.5 h-3.5"><SearchIcon /></div> الهوية والأسعار (Identity & Pricing)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1"><label className={labelClass}>{t('registrationNumber')} *</label><input value={formMed.RegisterNumber} onChange={e => setFormMed({...formMed, RegisterNumber: e.target.value})} className={inputClass} required placeholder="مثلاً: 1807..." /></div>
                        <div className="sm:col-span-2"><label className={labelClass}>{t('tradeName')} *</label><input list="all-trade-names" value={formMed["Trade Name"]} onChange={e => setFormMed({...formMed, ["Trade Name"]: e.target.value})} className={inputClass} required placeholder="اسم المنتج التجاري" /><datalist id="all-trade-names">{dbLists.tradeNames.map(s => <option key={s} value={s} />)}</datalist></div>
                        <div className="sm:col-span-3">
                            <label className={labelClass}>{t('scientificName')}</label>
                            <input list="sci-names" value={formMed["Scientific Name"]} onChange={e => setFormMed({...formMed, ["Scientific Name"]: e.target.value})} className={inputClass} placeholder="اختر من القائمة أو اكتب جديد..." />
                            <datalist id="sci-names">{dbLists.scientificNames.map(s => <option key={s} value={s} />)}</datalist>
                        </div>
                        <div><label className={labelClass}>{t('price')} (SAR)</label><input type="number" step="0.01" value={formMed["Public price"]} onChange={e => setFormMed({...formMed, ["Public price"]: e.target.value})} className={inputClass} /></div>
                        <div><label className={labelClass}>كود ATC</label><input value={formMed.AtcCode1} onChange={e => setFormMed({...formMed, AtcCode1: e.target.value})} className={inputClass} placeholder="C09CA01..." /></div>
                        <div><label className={labelClass}>الكود الوصفي</label><input value={formMed["Description Code"]} onChange={e => setFormMed({...formMed, ["Description Code"]: e.target.value})} className={inputClass} /></div>
                    </div>
                </div>

                {/* قسم الشكل الصيدلاني والتركيز */}
                <div>
                    <h4 className={sectionTitle}><div className="w-3.5 h-3.5"><PillIcon /></div> التكوين والشكل (Composition & Form)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>{t('pharmaceuticalForm')}</label>
                            <input list="form-list" value={formMed.PharmaceuticalForm} onChange={e => setFormMed({...formMed, PharmaceuticalForm: e.target.value})} className={inputClass} placeholder="أقراص، شراب، كبسولات..." />
                            <datalist id="form-list">{dbLists.forms.map(f => <option key={f} value={f} />)}</datalist>
                        </div>
                        <div>
                            <label className={labelClass}>طريقة الإعطاء (Route)</label>
                            <input list="route-list" value={formMed.AdministrationRoute} onChange={e => setFormMed({...formMed, AdministrationRoute: e.target.value})} className={inputClass} placeholder="Oral, IV, Topical..." />
                            <datalist id="route-list">{dbLists.routes.map(r => <option key={r} value={r} />)}</datalist>
                        </div>
                        <div><label className={labelClass}>{t('strength')}</label><input value={formMed.Strength} onChange={e => setFormMed({...formMed, Strength: e.target.value})} className={inputClass} placeholder="مثلاً: 500" /></div>
                        <div><label className={labelClass}>الوحدة (Unit)</label><input list="unit-list" value={formMed.StrengthUnit} onChange={e => setFormMed({...formMed, StrengthUnit: e.target.value})} className={inputClass} placeholder="mg, ml..." /><datalist id="unit-list">{dbLists.units.map(u => <option key={u} value={u} />)}</datalist></div>
                        <div><label className={labelClass}>{t('packageSize')}</label><input value={formMed.PackageSize} onChange={e => setFormMed({...formMed, PackageSize: e.target.value})} className={inputClass} /></div>
                    </div>
                </div>

                {/* قسم التصنيع والوكلاء */}
                <div>
                    <h4 className={sectionTitle}><div className="w-3.5 h-3.5"><FactoryIcon /></div> التصنيع والتسويق (Supply Chain)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>المصنع (Manufacturer)</label>
                            <input list="mfr-list" value={formMed["Manufacture Name"]} onChange={e => setFormMed({...formMed, ["Manufacture Name"]: e.target.value})} className={inputClass} placeholder="اسم الشركة المصنعة" />
                            <datalist id="mfr-list">{dbLists.manufacturers.map(m => <option key={m} value={m} />)}</datalist>
                        </div>
                        <div>
                            <label className={labelClass}>بلد التصنيع</label>
                            <input list="country-list" value={formMed["Manufacture Country"]} onChange={e => setFormMed({...formMed, ["Manufacture Country"]: e.target.value})} className={inputClass} placeholder="بلد المنشأ" />
                            <datalist id="country-list">{dbLists.countries.map(c => <option key={c} value={c} />)}</datalist>
                        </div>
                        <div>
                            <label className={labelClass}>الشركة المسوقة (Marketing)</label>
                            <input list="mark-list" value={formMed["Marketing Company"]} onChange={e => setFormMed({...formMed, ["Marketing Company"]: e.target.value})} className={inputClass} placeholder="الشركة المسوقة" />
                            <datalist id="mark-list">{dbLists.marketingCompanies.map(m => <option key={m} value={m} />)}</datalist>
                        </div>
                        <div>
                            <label className={labelClass}>الوكيل (Agent)</label>
                            <input list="agent-list" value={formMed["Main Agent"]} onChange={e => setFormMed({...formMed, ["Main Agent"]: e.target.value})} className={inputClass} placeholder="الوكيل الأساسي في السعودية" />
                            <datalist id="agent-list">{dbLists.agents.map(m => <option key={m} value={m} />)}</datalist>
                        </div>
                    </div>
                </div>

                {/* قسم التنظيم */}
                <div>
                    <h4 className={sectionTitle}><div className="w-3.5 h-3.5"><GlobeIcon /></div> التنظيم والصور (Regulatory & Assets)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className={labelClass}>{t('legalStatus')}</label><select value={formMed["Legal Status"]} onChange={e => setFormMed({...formMed, ["Legal Status"]: e.target.value})} className={inputClass}><option value="Prescription">Rx (Prescription)</option><option value="OTC">OTC</option></select></div>
                        <div><label className={labelClass}>الرقابة</label><select value={formMed["Product Control"]} onChange={e => setFormMed({...formMed, ["Product Control"]: e.target.value})} className={inputClass}><option value="Uncontrolled">Uncontrolled</option><option value="Controlled">Controlled</option><option value="Restricted">Restricted</option></select></div>
                        <div><label className={labelClass}>{t('shelfLife')} (Month)</label><input type="number" value={formMed.shelfLife} onChange={e => setFormMed({...formMed, shelfLife: e.target.value})} className={inputClass} /></div>
                        <div className="sm:col-span-3"><label className={labelClass}>{t('boxImage')} URL</label><input value={formMed.imgBox} onChange={e => setFormMed({...formMed, imgBox: e.target.value})} className={inputClass} placeholder="رابط صورة العلبة (HTTPS)" /></div>
                        <div className="sm:col-span-3"><label className={labelClass}>نبذة / وصف (Description)</label><textarea value={formMed.description} onChange={e => setFormMed({...formMed, description: e.target.value})} className={inputClass} rows={3} placeholder="اكتب تفاصيل إضافية أو ملاحظات هنا..." /></div>
                    </div>
                </div>

                <div className="pt-6"><button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 text-base">{isLoading ? 'جاري الحفظ...' : 'حفظ الصنف في قاعدة البيانات'}</button></div>
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
            if (newVal === '****************************') return false;
            return newVal !== oldVal;
        });

        return (
            <div className="animate-fade-in space-y-6 max-w-4xl mx-auto mb-20">
                <button onClick={() => { setSelectedUpdate(null); setIsEditingUpdate(false); }} className="flex items-center gap-2 text-primary font-bold"><div className="w-4 h-4"><BackIcon /></div> {t('back')}</button>
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
                                <div className={`w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black`}>M</div>
                                <div><p className="font-black text-slate-800 dark:text-white leading-tight">{(update.newData as any)['Trade Name']}</p><p className="text-[10px] text-slate-400 font-bold mt-1">{t('submittedBy', { name: update.submittedByName })}</p></div>
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

        {/* Clinical Data Manager */}
        <button
          onClick={() => setShowClinicalManager(true)}
          className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40 flex items-center gap-4 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all active:scale-[0.98] text-left shadow-sm"
        >
          <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📋</span>
          </div>
          <div className="flex-grow">
            <p className="font-black text-slate-800 dark:text-white text-sm">
              {language === 'ar' ? 'إدارة المعلومات السريرية' : 'Clinical Data Manager'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {language === 'ar' ? 'إضافة وتعديل المعلومات السريرية للأدوية' : 'Add and edit clinical data for medicines'}
            </p>
          </div>
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
        </button>

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
        <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border">
            <h3 className={sectionTitle}><div className="w-3.5 h-3.5"><BellIcon /></div> {t('broadcastTitle')}</h3>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div><label className={labelClass}>{t('notificationTitle')}</label><input value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} className={inputClass} placeholder="عنوان الإشعار..." required /></div>
                <div><label className={labelClass}>{t('notificationBody')}</label><textarea value={notifForm.body} onChange={e => setNotifForm({...notifForm, body: e.target.value})} className={inputClass} rows={3} placeholder="محتوى الإشعار..." required /></div>
                
                <div className="p-4 bg-slate-50 dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-dark-border">
                    <label className={labelClass}>ربط دواء (اختياري)</label>
                    <input list="linked-trade-names" value={notifForm.linkedMedicineTradeName} onChange={(e) => setNotifForm({...notifForm, linkedMedicineTradeName: e.target.value})} className={inputClass} placeholder="ابحث عن دواء لربطه..." />
                    <datalist id="linked-trade-names">{dbLists.tradeNames.map(s => <option key={s} value={s} />)}</datalist>
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
      {showClinicalManager && (
        <ClinicalDataManager
          allMedicines={allMedicines}
          language={language || 'ar'}
          t={t}
          onClose={() => setShowClinicalManager(false)}
        />
      )}
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3"><button onClick={() => { setActivePanel('menu'); setSelectedUpdate(null); setIsEditingUpdate(false); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><div className="w-4 h-4"><BackIcon /></div></button><h2 className="text-sm font-black uppercase tracking-widest text-primary">{t(`${activePanel}Panel` as any)}</h2></div>
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
                        <MenuCard title={t('overviewPanel')} icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-white dark:bg-dark-card text-blue-600 border-blue-100 dark:border-dark-border" />
                        <MenuCard title={t('usersPanel')} icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-white dark:bg-dark-card text-green-600 border-green-100 dark:border-dark-border" />
                        <MenuCard title={t('approvalsPanel')} icon={<BellIcon />} onClick={() => setActivePanel('approvals')} colorClass="bg-white dark:bg-dark-card text-amber-600 border-amber-100 dark:border-dark-border" badge={pendingUpdates.length} />
                        <MenuCard title={t('addManualPanel')} icon={<div className="text-3xl font-black">+</div>} onClick={() => setActivePanel('add_manual')} colorClass="bg-white dark:bg-dark-card text-purple-600 border-purple-100 dark:border-dark-border" />
                        <MenuCard title={t('notificationsPanel')} icon={<BellIcon />} onClick={() => setActivePanel('notifications')} colorClass="bg-white dark:bg-dark-card text-red-600 border-red-100 dark:border-dark-border" />
                        <MenuCard title={t('exportPanel')} icon={<DownloadIcon />} onClick={() => setActivePanel('export')} colorClass="bg-white dark:bg-dark-card text-primary border-primary/10 dark:border-dark-border" />
                        <MenuCard title={t('settingsPanel')} icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-white dark:bg-dark-card text-slate-600 border-slate-100 dark:border-dark-border" />
                        <MenuCard title="📅 أدوية اليوم" icon={<span className="text-2xl">✨</span>} onClick={() => setActivePanel('featured_schedule')} colorClass="bg-white dark:bg-dark-card text-emerald-600 border-emerald-100 dark:border-dark-border" />
                    </div>
                </div>
            )}
            {activePanel === 'add_manual' && renderAddManual()}
            {activePanel === 'featured_schedule' && (
              <FeaturedSchedulePanel
                allMedicines={allMedicines}
                t={t}
                language={language}
                userId={user?.id || ''}
              />
            )}
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
                            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <div>
                                  <p className="text-sm font-bold">✨ أدوية اليوم المميزة</p>
                                  <p className="text-[10px] text-slate-400">إظهار قسم أدوية اليوم في الصفحة الرئيسية</p>
                                </div>
                                <input type="checkbox" checked={appSettings.isFeaturedEnabled !== false} onChange={e => setAppSettings({...appSettings, isFeaturedEnabled: e.target.checked})} className="w-6 h-6 accent-primary" />
                            </div>
                            <div>
                              <label className={labelClass}>{t('aiLimitLabel')} <span className="text-[10px] text-slate-400 font-normal">(Default للمستخدمين الجدد)</span></label>
                              <input type="number" min="1" max="100" value={appSettings.aiRequestLimit} onChange={e => setAppSettings({...appSettings, aiRequestLimit: parseInt(e.target.value) || 3})} className={inputClass} />
                              <p className="text-[10px] text-slate-400 mt-1">⚠️ الأدمن دايماً غير محدود — هذا الحد للمستخدمين العاديين فقط</p>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">{isLoading ? '...' : t('save')}</button>
                        </form>

                        {/* ── إرسال إشعار بأدوية اليوم ── */}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-3">
                          <h4 className="text-sm font-black text-primary">📣 إشعار أدوية اليوم</h4>
                          <button
                            onClick={async () => {
                              try {
                                const { collection: col, getDocs: gd, addDoc, doc: d, getDoc: gdc } = await import('firebase/firestore');
                                // نجيب أدوية اليوم من Firestore
                                const today = new Date().toISOString().split('T')[0];
                                const snap = await gdc(d(db, 'dailyFeatured', today));
                                if (!snap.exists()) { alert('لا توجد أدوية اليوم بعد — ابدأ التطبيق أولاً لتوليدها'); return; }
                                const data = snap.data();
                                const names = (data.medicines || []).slice(0,3).map((m: any) => m.tradeName).join('، ');
                                await addDoc(col(db, 'notifications'), {
                                  title: '💊 أدوية اليوم المميزة',
                                  body: `أدوية اليوم: ${names}`,
                                  timestamp: Date.now(),
                                  type: 'info',
                                  isRead: false,
                                  isFeaturedDaily: true,
                                  date: today,
                                });
                                alert('✅ تم إرسال الإشعار للكل');
                              } catch(e: any) { alert('❌ ' + e.message); }
                            }}
                            className="w-full py-3 bg-primary/10 text-primary font-black text-sm rounded-2xl border border-primary/20 active:scale-95 transition-all"
                          >
                            📣 إرسال إشعار بأدوية اليوم الآن
                          </button>
                        </div>

                        {/* ── مسح البيانات ── */}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-3">
                          <h4 className="text-sm font-black text-rose-500">🗑️ مسح البيانات من Firestore</h4>
                          <p className="text-[10px] text-slate-400">تحذير: هذه العمليات لا يمكن التراجع عنها</p>

                          {/* مسح أدوية اليوم المميزة */}
                          <button
                            onClick={async () => {
                              if (!window.confirm('مسح بيانات أدوية اليوم من Firestore؟ سيتم توليدها من جديد.')) return;
                              try {
                                const { collection: col, getDocs: gd, deleteDoc: dd, doc: d } = await import('firebase/firestore');
                                const snap = await gd(col(db, 'dailyFeatured'));
                                await Promise.all(snap.docs.map(dc => dd(d(db, 'dailyFeatured', dc.id))));
                                alert('✅ تم مسح أدوية اليوم');
                              } catch(e: any) { alert('❌ ' + e.message); }
                            }}
                            className="w-full py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-black text-sm rounded-2xl border border-amber-200 dark:border-amber-700 active:scale-95 transition-all"
                          >
                            🔄 مسح أدوية اليوم (إعادة توليد)
                          </button>

                          {/* مسح المعلومات السريرية */}
                          <button
                            onClick={async () => {
                              if (!window.confirm('مسح كل المعلومات السريرية من Firestore؟')) return;
                              try {
                                const { collection: col, getDocs: gd, deleteDoc: dd, doc: d } = await import('firebase/firestore');
                                const snap = await gd(col(db, 'clinicalData'));
                                await Promise.all(snap.docs.map(dc => dd(d(db, 'clinicalData', dc.id))));
                                alert('✅ تم مسح المعلومات السريرية');
                              } catch(e: any) { alert('❌ ' + e.message); }
                            }}
                            className="w-full py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-black text-sm rounded-2xl border border-rose-200 dark:border-rose-700 active:scale-95 transition-all"
                          >
                            🗑️ مسح المعلومات السريرية
                          </button>

                          {/* مسح كل الإشعارات */}
                          <button
                            onClick={async () => {
                              if (!window.confirm('مسح كل الإشعارات؟')) return;
                              try {
                                const { collection: col, getDocs: gd, deleteDoc: dd, doc: d } = await import('firebase/firestore');
                                const snap = await gd(col(db, 'notifications'));
                                await Promise.all(snap.docs.map(dc => dd(d(db, 'notifications', dc.id))));
                                alert('✅ تم مسح الإشعارات');
                              } catch(e: any) { alert('❌ ' + e.message); }
                            }}
                            className="w-full py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black text-sm rounded-2xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                          >
                            🔕 مسح كل الإشعارات
                          </button>
                        </div>
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
                                        {/* حد الـ AI اليومي للمستخدم */}
                                        {currentRole !== 'admin' && (
                                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                            <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 whitespace-nowrap">AI/يوم</span>
                                            <input
                                              type="number"
                                              min="0"
                                              max="100"
                                              defaultValue={u.customAiLimit ?? appSettings.aiRequestLimit ?? 3}
                                              className="w-12 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg text-center text-[10px] font-black outline-none px-1 py-0.5"
                                              onBlur={async e => {
                                                const val = parseInt(e.target.value) || 3;
                                                await updateUser({ ...u, customAiLimit: val });
                                              }}
                                            />
                                          </div>
                                        )}
                                        {!!userRoleChanges[u.id] && <button onClick={() => handleSaveUserRole(u.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md">{t('save')}</button>}
                                        <button onClick={() => { if(window.confirm(t('confirmDeleteUser'))) deleteUser(u.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><TrashIcon /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {activePanel === 'overview' && (() => {
                const topSearched = getTopSearched(10);
                const totalSearches = getTotalSearches();
                const humanMeds = allMedicines.filter(m => m['Product type'] === 'Human');
                const suppMeds = allMedicines.filter(m => m['Product type'] === 'Supplement');
                const foodMeds = allMedicines.filter(m => m['Product type'] === 'Food');
                const controlled = allMedicines.filter(m => m['Product Control']?.toLowerCase() === 'controlled');
                const otcMeds = humanMeds.filter(m => m['Legal Status']?.toLowerCase() === 'otc');
                const rxMeds = humanMeds.filter(m => m['Legal Status']?.toLowerCase() === 'prescription');
                const genericMeds = humanMeds.filter(m => m.DrugType?.toLowerCase().includes('generic'));
                const brandMeds = humanMeds.filter(m => !m.DrugType?.toLowerCase().includes('generic'));
                const adminUsers = users.filter(u => u.role === 'admin');
                const companyUsers = users.filter(u => u.role === 'company');
                const premiumUsers = users.filter(u => u.role === 'premium');
                const topManufacturers = Object.entries(
                  humanMeds.reduce((acc: Record<string,number>, m) => { const n = m['Manufacture Name'] || 'Unknown'; acc[n] = (acc[n]||0)+1; return acc; }, {})
                ).sort((a,b) => (b[1] as number)-(a[1] as number)).slice(0,5) as [string, number][];

                return (
                <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
                  {/* إحصائيات سريعة */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-4 rounded-2xl text-center shadow-lg shadow-primary/20">
                      <p className="text-2xl font-black">{humanMeds.length}</p>
                      <p className="text-[9px] font-black uppercase opacity-80 mt-1">أدوية بشرية</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white p-4 rounded-2xl text-center shadow-lg shadow-amber-400/20">
                      <p className="text-2xl font-black">{suppMeds.length}</p>
                      <p className="text-[9px] font-black uppercase opacity-80 mt-1">مكملات</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white p-4 rounded-2xl text-center shadow-lg shadow-teal-400/20">
                      <p className="text-2xl font-black">{foodMeds.length}</p>
                      <p className="text-[9px] font-black uppercase opacity-80 mt-1">غذاء</p>
                    </div>
                  </div>

                  {/* تحليل الأدوية */}
                  <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">📊 تحليل قاعدة البيانات</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'وصفة طبية', value: rxMeds.length, total: humanMeds.length, color: 'bg-blue-500' },
                        { label: 'OTC بدون وصفة', value: otcMeds.length, total: humanMeds.length, color: 'bg-green-500' },
                        { label: 'جنيس Generic', value: genericMeds.length, total: humanMeds.length, color: 'bg-purple-500' },
                        { label: 'أصيل Brand', value: brandMeds.length, total: humanMeds.length, color: 'bg-rose-500' },
                        { label: 'مخدرات Controlled', value: controlled.length, total: allMedicines.length, color: 'bg-orange-500' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{item.label}</span>
                            <span className="text-[11px] font-black text-slate-400">{item.value} ({Math.round(item.value/item.total*100)}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{width: `${Math.round(item.value/item.total*100)}%`}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* المستخدمون */}
                  <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">👥 إحصائيات المستخدمين</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'الكل', value: users.length, color: 'text-slate-700' },
                        { label: 'أدمن', value: adminUsers.length, color: 'text-red-500' },
                        { label: 'شركات', value: companyUsers.length, color: 'text-blue-500' },
                        { label: 'مميز', value: premiumUsers.length, color: 'text-amber-500' },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                          <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* أكبر الشركات المصنعة */}
                  <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">🏭 أكبر 5 مصنعين</h4>
                    <div className="space-y-2">
                      {topManufacturers.map(([name, count], idx) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-slate-300 w-4">#{idx+1}</span>
                          <div className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{name}</span>
                              <span className="text-[11px] font-black text-primary ml-2">{count}</span>
                            </div>
                            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                              <div className="h-full bg-primary rounded-full" style={{width: `${Math.round(count/topManufacturers[0][1]*100)}%`}} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* الإشعارات */}
                  <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-3">🔔 الإشعارات</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{notifications.length}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">إجمالي الإشعارات</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-amber-600">{pendingUpdates.length}</p>
                        <p className="text-[9px] font-bold text-amber-500 mt-1">طلبات معلقة</p>
                      </div>
                    </div>
                  </div>
                </div>
                );
            })()}
        </div>
    </div>
  );
};


