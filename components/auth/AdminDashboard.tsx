
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
import ClearIcon from '../icons/ClearIcon';
import { db, FIREBASE_DISABLED } from '../../firebase';
import { collection, doc, setDoc, addDoc, deleteDoc, updateDoc, query, onSnapshot, where, getDocs } from 'firebase/firestore';

type Panel = 'menu' | 'overview' | 'users' | 'add_manual' | 'approvals' | 'notifications' | 'settings' | 'export';
type ItemCategory = 'Human' | 'Supplement' | 'Cosmetic';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
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
  const sectionTitle = "text-xs font-black text-primary uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 mt-2";

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
  
  // Local state for user role changes before saving
  const [userRoleChanges, setUserRoleChanges] = useState<{[key: string]: User['role']}>({});

  // Manual Add Form State (Strictly matching Medicine Type and Edit Modal)
  const [formMed, setFormMed] = useState<Partial<Medicine>>({
      RegisterNumber: '', "Trade Name": '', "Scientific Name": '', "Public price": '',
      PharmaceuticalForm: '', Strength: '', StrengthUnit: '', PackageSize: '', PackageTypes: '',
      Size: '', SizeUnit: '', "Manufacture Name": '', "Manufacture Country": '', "Main Agent": '',
      "Storage conditions": '', "Storage Condition Arabic": '', shelfLife: '', AtcCode1: '',
      "Legal Status": 'OTC', "Product Control": 'Uncontrolled',
      imgBox: '', imgIndex1: '', imgIndex2: '', imgPill: '', pillShape: '',
      pillScored: '', pillMarkings: '', liquidTaste: '', liquidColor: '', physicalNotes: ''
  });

  useEffect(() => {
    if (FIREBASE_DISABLED) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    });
    const q = query(collection(db, 'pending_updates'), where('status', '==', 'pending'));
    const unsubApprovals = onSnapshot(q, (snap) => {
        setPendingUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingUpdate)));
    });
    return () => { unsubUsers(); unsubNotifs(); unsubApprovals(); };
  }, []);

  const handleSaveUserRole = async (userId: string) => {
      const newRole = userRoleChanges[userId];
      if (!newRole) return;
      try {
          await updateDoc(doc(db, 'users', userId), { role: newRole });
          alert("تم حفظ الصلاحيات بنجاح");
          setUserRoleChanges(prev => {
              const next = {...prev};
              delete next[userId];
              return next;
          });
      } catch (e) { alert("خطأ في الحفظ"); }
  };

  const handleDeleteNotification = async (notifId: string) => {
      if(!window.confirm("هل تريد حذف هذا الإشعار نهائياً؟")) return;
      try {
          await deleteDoc(doc(db, 'notifications', notifId));
      } catch (e) { alert("خطأ في الحذف"); }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formMed.RegisterNumber || !formMed["Trade Name"]) {
          alert("رقم التسجيل والاسم التجاري حقول مطلوبة.");
          return;
      }
      setIsLoading(true);
      try {
          const collectionName = itemCategory === 'Cosmetic' ? 'cosmetics' : 'medicines';
          const finalData = {
              ...formMed,
              "Product type": itemCategory === 'Human' ? 'Human' : itemCategory === 'Supplement' ? 'Supplement' : 'Cosmetic',
              "Authorization Status": "Valid",
              "Last Update": new Date().toISOString()
          };
          await setDoc(doc(db, collectionName, formMed.RegisterNumber as string), finalData);
          alert("تمت الإضافة بنجاح!");
          setActivePanel('menu');
      } catch (err) { alert("خطأ أثناء الحفظ"); }
      finally { setIsLoading(false); }
  };

  const handleExport = (type: 'Human' | 'Supplement') => {
      const dataToExport = allMedicines.filter(m => m['Product type'] === type);
      if (dataToExport.length === 0) { alert("لا توجد بيانات لهذه الفئة"); return; }
      const headers = Object.keys(dataToExport[0]).join(',');
      const rows = dataToExport.map(m => Object.values(m).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PharmaSource_${type}_Export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  const renderUsers = () => (
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
                            <div>
                                <p className="font-black text-slate-800 dark:text-white truncate">{u.username}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
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
                                        {role}
                                    </button>
                                ))}
                            </div>
                            
                            {isChanged && (
                                <button 
                                    onClick={() => handleSaveUserRole(u.id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-green-700 animate-pulse"
                                >
                                    حفظ
                                </button>
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
  );

  const renderAddManual = () => {
    return (
      <form onSubmit={handleAddMedicine} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl animate-fade-in max-w-4xl mx-auto mb-20">
          {/* Form Header */}
          <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700 mb-6">
              <div>
                <h3 className="text-lg font-black text-primary uppercase">{t('addNewItem')}</h3>
                <div className="flex gap-2 mt-2">
                    {(['Human', 'Supplement', 'Cosmetic'] as const).map(cat => (
                        <button key={cat} type="button" onClick={() => setItemCategory(cat)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${itemCategory === cat ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            {cat === 'Human' ? 'دواء بشري' : cat === 'Supplement' ? 'مكمل غذائي' : 'منتج تجميل'}
                        </button>
                    ))}
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {isLoading ? 'جاري الحفظ...' : t('save')}
              </button>
          </div>

          <div className="space-y-8">
              {/* Section 1: Identity */}
              <div>
                  <h4 className={sectionTitle}>البيانات الأساسية (Identity)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-full">
                          <label className={labelClass}>رقم التسجيل (Register Number) *</label>
                          <input className={inputClass} value={formMed.RegisterNumber} onChange={e => setFormMed({...formMed, RegisterNumber: e.target.value})} required />
                      </div>
                      <div className="col-span-full">
                          <label className={labelClass}>الاسم التجاري (Trade Name) *</label>
                          <input className={inputClass} value={formMed["Trade Name"]} onChange={e => setFormMed({...formMed, "Trade Name": e.target.value})} required />
                      </div>
                      <div className="col-span-full">
                          <label className={labelClass}>الاسم العلمي (Scientific Name)</label>
                          <input className={inputClass} value={formMed["Scientific Name"]} onChange={e => setFormMed({...formMed, "Scientific Name": e.target.value})} />
                      </div>
                      <div>
                          <label className={labelClass}>السعر (SAR)</label>
                          <input type="number" step="0.01" className={inputClass} value={formMed["Public price"]} onChange={e => setFormMed({...formMed, "Public price": e.target.value})} />
                      </div>
                      <div>
                          <label className={labelClass}>الشكل الصيدلاني (Form)</label>
                          <input className={inputClass} value={formMed.PharmaceuticalForm} onChange={e => setFormMed({...formMed, PharmaceuticalForm: e.target.value})} />
                      </div>
                      <div>
                          <label className={labelClass}>القوة (Strength)</label>
                          <input className={inputClass} value={formMed.Strength} onChange={e => setFormMed({...formMed, Strength: e.target.value})} />
                      </div>
                      <div>
                          <label className={labelClass}>الوحدة (Unit)</label>
                          <input className={inputClass} value={formMed.StrengthUnit} onChange={e => setFormMed({...formMed, StrengthUnit: e.target.value})} />
                      </div>
                  </div>
              </div>

              {/* Section 2: Packaging */}
              <div>
                  <h4 className={sectionTitle}>بيانات التعبئة (Packaging)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className={labelClass}>حجم العبوة (Package Size)</label><input className={inputClass} value={formMed.PackageSize} onChange={e => setFormMed({...formMed, PackageSize: e.target.value})} /></div>
                      <div><label className={labelClass}>نوع العبوة (Package Type)</label><input className={inputClass} value={formMed.PackageTypes} onChange={e => setFormMed({...formMed, PackageTypes: e.target.value})} /></div>
                      <div><label className={labelClass}>الحجم (Size)</label><input className={inputClass} value={formMed.Size} onChange={e => setFormMed({...formMed, Size: e.target.value})} /></div>
                      <div><label className={labelClass}>وحدة الحجم (Size Unit)</label><input className={inputClass} value={formMed.SizeUnit} onChange={e => setFormMed({...formMed, SizeUnit: e.target.value})} /></div>
                  </div>
              </div>

              {/* Section 3: Manufacturing */}
              <div>
                  <h4 className={sectionTitle}>التصنيع والوكلاء (Manufacturing)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-full"><label className={labelClass}>المصنع (Manufacturer)</label><input className={inputClass} value={formMed["Manufacture Name"]} onChange={e => setFormMed({...formMed, "Manufacture Name": e.target.value})} /></div>
                      <div><label className={labelClass}>بلد التصنيع</label><input className={inputClass} value={formMed["Manufacture Country"]} onChange={e => setFormMed({...formMed, "Manufacture Country": e.target.value})} /></div>
                      <div><label className={labelClass}>الوكيل الأساسي</label><input className={inputClass} value={formMed["Main Agent"]} onChange={e => setFormMed({...formMed, "Main Agent": e.target.value})} /></div>
                  </div>
              </div>

              {/* Section 4: Physical */}
              <div>
                  <h4 className={sectionTitle}>الصور والخصائص المادية (Physical)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-full"><label className={labelClass}>رابط صورة العبوة</label><input className={inputClass} value={formMed.imgBox} onChange={e => setFormMed({...formMed, imgBox: e.target.value})} placeholder="https://..." /></div>
                      <div><label className={labelClass}>رابط صورة الفهرس 1</label><input className={inputClass} value={formMed.imgIndex1} onChange={e => setFormMed({...formMed, imgIndex1: e.target.value})} /></div>
                      <div><label className={labelClass}>رابط صورة الحبة</label><input className={inputClass} value={formMed.imgPill} onChange={e => setFormMed({...formMed, imgPill: e.target.value})} /></div>
                      <div><label className={labelClass}>شكل الحبة</label><input className={inputClass} value={formMed.pillShape} onChange={e => setFormMed({...formMed, pillShape: e.target.value})} /></div>
                      <div><label className={labelClass}>العلامات (Markings)</label><input className={inputClass} value={formMed.pillMarkings} onChange={e => setFormMed({...formMed, pillMarkings: e.target.value})} /></div>
                      <div className="col-span-full"><label className={labelClass}>ملاحظات إضافية</label><textarea className={inputClass} rows={3} value={formMed.physicalNotes} onChange={e => setFormMed({...formMed, physicalNotes: e.target.value})} /></div>
                  </div>
              </div>

              {/* Section 5: Regulatory */}
              <div>
                  <h4 className={sectionTitle}>الحالة التنظيمية (Regulatory)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label className={labelClass}>الحالة القانونية</label>
                          <select className={inputClass} value={formMed["Legal Status"]} onChange={e => setFormMed({...formMed, "Legal Status": e.target.value})}>
                              <option value="OTC">OTC</option>
                              <option value="Prescription">Prescription</option>
                          </select>
                      </div>
                      <div>
                          <label className={labelClass}>الرقابة</label>
                          <select className={inputClass} value={formMed["Product Control"]} onChange={e => setFormMed({...formMed, "Product Control": e.target.value})}>
                              <option value="Uncontrolled">Uncontrolled</option>
                              <option value="Controlled">Controlled</option>
                              <option value="Restricted">Restricted</option>
                          </select>
                      </div>
                  </div>
              </div>
          </div>
      </form>
    );
  };

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
        {activePanel !== 'menu' && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActivePanel('menu')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><BackIcon /></button>
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary">{activePanel.replace('_', ' ')}</h2>
                </div>
            </div>
        )}

        <div className="flex-grow p-4 overflow-y-auto no-scrollbar pb-20">
            {activePanel === 'menu' && (
                <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
                    {/* Professional Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="المستخدمين" value={users.length} icon={<UsersIcon />} />
                        <StatCard title="الشركات" value={users.filter(u => u.role === 'company').length} icon={<DatabaseIcon />} />
                        <StatCard title="الأصناف" value={allMedicines.length} icon={<PillBottleIcon />} />
                        <StatCard title="إشعارات نشطة" value={notifications.length} icon={<BellIcon />} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <MenuCard title="نظرة عامة" icon={<ChartIcon />} onClick={() => setActivePanel('overview')} colorClass="bg-white dark:bg-slate-800 text-blue-600 border-blue-100" />
                        <MenuCard title="إدارة المستخدمين" icon={<UsersIcon />} onClick={() => setActivePanel('users')} colorClass="bg-white dark:bg-slate-800 text-green-600 border-green-100" />
                        <MenuCard title="طلبات المراجعة" icon={<BellIcon />} onClick={() => setActivePanel('approvals')} colorClass="bg-white dark:bg-slate-800 text-amber-600 border-amber-100" badge={pendingUpdates.length} />
                        <MenuCard title="إضافة صنف جديد" icon={<div className="text-3xl font-black">+</div>} onClick={() => setActivePanel('add_manual')} colorClass="bg-white dark:bg-slate-800 text-purple-600 border-purple-100" />
                        <MenuCard title="الإشعارات" icon={<BellIcon />} onClick={() => setActivePanel('notifications')} colorClass="bg-white dark:bg-slate-800 text-red-600 border-red-100" />
                        <MenuCard title="تصدير البينات" icon={<DownloadIcon />} onClick={() => setActivePanel('export')} colorClass="bg-white dark:bg-slate-800 text-teal-600 border-teal-100" />
                        <MenuCard title="الإعدادات" icon={<SettingsIcon />} onClick={() => setActivePanel('settings')} colorClass="bg-white dark:bg-slate-800 text-slate-600 border-slate-100" />
                    </div>
                </div>
            )}

            {activePanel === 'overview' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                            <ChartIcon />
                        </div>
                        <h3 className="text-xl font-black">تحليل قاعدة البيانات</h3>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">الأدوية (Human)</p>
                                <p className="text-2xl font-black text-primary">{allMedicines.filter(m => m['Product type'] === 'Human').length}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">المكملات (Health)</p>
                                <p className="text-2xl font-black text-accent">{allMedicines.filter(m => m['Product type'] !== 'Human').length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activePanel === 'users' && renderUsers()}
            {activePanel === 'add_manual' && renderAddManual()}
            
            {activePanel === 'notifications' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    {/* Send Form */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h4 className="font-black text-primary">إرسال إشعار جديد</h4>
                        <input placeholder="العنوان" className={inputClass} value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
                        <textarea placeholder="نص الرسالة" className={inputClass} rows={3} value={notifBody} onChange={e => setNotifBody(e.target.value)} />
                        <button 
                            onClick={async () => {
                                if(!notifTitle || !notifBody) return;
                                await addDoc(collection(db, 'notifications'), { title: notifTitle, body: notifBody, timestamp: Date.now(), type: 'info' });
                                alert("تم الإرسال"); setNotifTitle(''); setNotifBody('');
                            }} 
                            className="w-full py-3 bg-red-600 text-white font-black rounded-xl active:scale-95 transition-transform"
                        >
                            بث الإشعار للجميع
                        </button>
                    </div>

                    {/* Manage List */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">إدارة الإشعارات الحالية</p>
                        {notifications.sort((a,b) => b.timestamp - a.timestamp).map(n => (
                            <div key={n.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center gap-4">
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{n.title}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleString('ar-SA')}</p>
                                </div>
                                <button onClick={() => handleDeleteNotification(n.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activePanel === 'export' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto animate-fade-in">
                    <button onClick={() => handleExport('Human')} className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-teal-100 text-teal-600 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95">
                        <DownloadIcon /><span className="font-black">تصدير الأدوية (CSV)</span>
                    </button>
                    <button onClick={() => handleExport('Supplement')} className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-amber-100 text-amber-600 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95">
                        <DownloadIcon /><span className="font-black">تصدير المكملات (CSV)</span>
                    </button>
                </div>
            )}

            {activePanel === 'settings' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-md mx-auto border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 animate-fade-in">
                    <h3 className="font-black text-primary uppercase">إعدادات النظام</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>حد استخدام AI الافتراضي</label>
                            <input type="number" className={inputClass} value={appSettings.aiRequestLimit} onChange={e => setAppSettings({...appSettings, aiRequestLimit: parseInt(e.target.value)})} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-sm font-bold">تفعيل الذكاء الاصطناعي</span>
                            <input type="checkbox" checked={appSettings.isAiEnabled} onChange={e => setAppSettings({...appSettings, isAiEnabled: e.target.checked})} className="w-5 h-5 accent-primary" />
                        </div>
                        <button onClick={() => { updateSettings(appSettings); alert("تم الحفظ"); }} className="w-full py-3 bg-primary text-white font-black rounded-xl shadow-lg">حفظ الإعدادات</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
