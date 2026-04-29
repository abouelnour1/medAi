import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { ClinicalReference, getClinicalReference, getPregReference, PregReferenceData } from '../utils/dailyMedicines';

const R2_CLINICAL_FULL_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/clinical_reference_full.json';
const R2_RENAL_URL         = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/renal_drugs.json';
const R2_LOOKUP_URL        = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/drug_lookup.json';

// ── Caches ───────────────────────────────────────────────────────────────────
let _clinCache:   Record<string, any> | null = null;
let _renalCache:  Record<string, any> | null = null;
let _lookupCache: Record<string, { c?: string; r?: string }> | null = null;

async function getLookup() {
  if (_lookupCache) return _lookupCache;
  try { const r = await fetch(R2_LOOKUP_URL); if (r.ok) _lookupCache = await r.json(); else _lookupCache = {}; }
  catch { _lookupCache = {}; }
  return _lookupCache!;
}

async function resolveKeys(sci: string, trade: string) {
  const lk = await getLookup();
  const u = sci.toUpperCase().trim();
  const e = lk[u] || lk[u.split(/[\s,/]+/)[0]];
  return { clinKey: e?.c ?? null, renalKey: e?.r ?? null };
}

// ── Drug-name normalization ───────────────────────────────────────────────────
const SALT = /\s+(hydrochloride|hcl|sodium|potassium|sulfate|sulphate|maleate|fumarate|tartrate|acetate|phosphate|citrate|gluconate|mesylate|besylate|oxalate|bromide|chloride|nitrate|succinate|valerate|propionate|dipropionate|butyrate|furoate|monohydrate|trihydrate|anhydrous|dihydrate|monosodium|disodium)\b/gi;
const SYN: Record<string,string> = {
  hyoscine:'scopolamine', salbutamol:'albuterol', paracetamol:'acetaminophen',
  acetaminophen:'paracetamol', albuterol:'salbutamol', miconazole:'clotrimazole',
  'folic acid':'folate', 'vitamin c':'ascorbic acid',
  'amoxicillin/clavulanate':'amoxicillin-clavulanate potassium',
  'co-amoxiclav':'amoxicillin-clavulanate potassium',
};
function norm(n:string){ return n.toLowerCase().trim().replace(/-/g,'/').replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|ug|iu|%|units?|mmol)\b/gi,'').replace(SALT,'').replace(/\s+/g,' ').trim(); }
function keys(raw:string){ const n=norm(raw),fw=n.split(/[\s/,+]+/)[0],c=[n,raw.toLowerCase().trim(),fw,...n.split(/[/,+]+/).map(p=>p.trim())].filter(Boolean); if(SYN[n])c.push(SYN[n]); if(SYN[fw])c.push(SYN[fw]); return [...new Set(c)]; }
function findInMap<T>(map:Record<string,T>,...raws:string[]): T|undefined {
  const mk=Object.keys(map), nm:Record<string,string>={};
  for(const k of mk) nm[k]=norm(k);
  for(const raw of raws){ if(!raw)continue; const cs=keys(raw);
    for(const c of cs) if(map[c]) return map[c];
    for(const c of cs){ const f=mk.find(k=>nm[k]===c); if(f) return map[f]; }
    const fw=cs[cs.length-1];
    if(fw&&fw.length>=4){ const f=mk.find(k=>{ const nk=nm[k],nf=nk.split(/[\s/,+]+/)[0]; return nk.startsWith(fw)||fw.startsWith(nf); }); if(f) return map[f]; }
  }
}

async function fetchRenalData(sci:string,trade?:string) {
  if(!_renalCache){ try{ const r=await fetch(R2_RENAL_URL); if(r.ok)_renalCache=await r.json(); else _renalCache={}; }catch{_renalCache={};} }
  const {renalKey}=await resolveKeys(sci,trade??'');
  if(renalKey&&_renalCache![renalKey]) return _renalCache![renalKey];
  return findInMap(_renalCache!,sci,trade??'')??null;
}

async function fetchFullClinical(sci:string,trade?:string) {
  if(!_clinCache){ try{ const r=await fetch(R2_CLINICAL_FULL_URL); if(r.ok)_clinCache=await r.json(); else _clinCache={}; }catch{_clinCache={};} }
  const {clinKey}=await resolveKeys(sci,trade??'');
  if(clinKey&&_clinCache![clinKey]) return _clinCache![clinKey];
  return findInMap(_clinCache!,sci,trade??'')??null;
}

// ── Pregnancy category info ───────────────────────────────────────────────────
const PREG_INFO: Record<string,{color:string;bg:string;border:string;labelEn:string;labelAr:string;descEn:string;descAr:string}> = {
  A: { color:'text-emerald-700 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/20', border:'border-emerald-200 dark:border-emerald-700',
       labelEn:'Category A', labelAr:'الفئة A',
       descEn:'Adequate and well-controlled studies have failed to demonstrate a risk to the fetus in the first trimester.',
       descAr:'الدراسات الكافية لم تُثبت خطرًا على الجنين في الثلث الأول من الحمل.' },
  B: { color:'text-blue-700 dark:text-blue-400', bg:'bg-blue-50 dark:bg-blue-900/20', border:'border-blue-200 dark:border-blue-700',
       labelEn:'Category B', labelAr:'الفئة B',
       descEn:'Animal studies have not shown fetal risk and there are no adequate human studies, OR animal studies showed adverse effects but adequate human studies failed to show fetal risk.',
       descAr:'دراسات الحيوانات لم تُظهر خطرًا وليست هناك دراسات بشرية كافية، أو دراسات الحيوانات أظهرت آثارًا ضارة لكن الدراسات البشرية لم تُثبت خطرًا.' },
  C: { color:'text-amber-700 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-900/20', border:'border-amber-200 dark:border-amber-700',
       labelEn:'Category C', labelAr:'الفئة C',
       descEn:'Animal studies have shown adverse fetal effects and there are no adequate human studies. Use only if potential benefit justifies potential risk.',
       descAr:'دراسات الحيوانات أظهرت آثارًا ضارة على الجنين وليست هناك دراسات بشرية كافية. يُستخدم فقط إذا كانت الفائدة المحتملة تبرر المخاطرة.' },
  D: { color:'text-orange-700 dark:text-orange-400', bg:'bg-orange-50 dark:bg-orange-900/20', border:'border-orange-200 dark:border-orange-700',
       labelEn:'Category D', labelAr:'الفئة D',
       descEn:'Positive evidence of human fetal risk, but benefits may warrant use despite risks (e.g., life-threatening situations).',
       descAr:'دليل إيجابي على خطر على الجنين البشري، لكن الفوائد قد تبرر الاستخدام رغم المخاطر (مثل الحالات التي تهدد الحياة).' },
  X: { color:'text-red-700 dark:text-red-400', bg:'bg-red-50 dark:bg-red-900/20', border:'border-red-200 dark:border-red-700',
       labelEn:'Category X', labelAr:'الفئة X',
       descEn:'Studies have shown fetal abnormalities. Risks clearly outweigh potential benefits. CONTRAINDICATED in pregnancy.',
       descAr:'الدراسات أثبتت تشوهات جنينية. المخاطر تفوق بوضوح الفوائد المحتملة. مُضاد للاستخدام أثناء الحمل.' },
};

const LACT_INFO: Record<string,{color:string;bg:string;border:string;labelEn:string;labelAr:string;descEn:string;descAr:string}> = {
  S:   { color:'text-emerald-700 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/20', border:'border-emerald-200 dark:border-emerald-700',
         labelEn:'Safe (S)', labelAr:'آمن (S)',
         descEn:'Compatible with breastfeeding. Limited or no risk to the nursing infant.',
         descAr:'متوافق مع الرضاعة الطبيعية. خطر محدود أو معدوم على الرضيع.' },
  NSC: { color:'text-amber-700 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-900/20', border:'border-amber-200 dark:border-amber-700',
         labelEn:'Use with Caution (NSC)', labelAr:'استخدام بحذر (NSC)',
         descEn:'Use with caution. Monitor infant for adverse effects. Benefits may outweigh risks in some situations.',
         descAr:'يستخدم بحذر. مراقبة الرضيع للتأثيرات الضارة. قد تفوق الفوائد المخاطر في بعض الحالات.' },
  NS:  { color:'text-red-700 dark:text-red-400', bg:'bg-red-50 dark:bg-red-900/20', border:'border-red-200 dark:border-red-700',
         labelEn:'Not Safe (NS)', labelAr:'غير آمن (NS)',
         descEn:'Not recommended during breastfeeding. Risk to the infant outweighs the benefits.',
         descAr:'غير موصى به أثناء الرضاعة. خطر على الرضيع يفوق الفوائد.' },
};

// ── Renal Dosing View ─────────────────────────────────────────────────────────
function RenalDosingView({ scientificName, tradeName, language }: { scientificName:string; tradeName:string; language:Language }) {
  const ar = language === 'ar';
  const [data, setData] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchRenalData(scientificName, tradeName).then(d => { setData(d); setLoading(false); }); }, [scientificName, tradeName]);

  if (loading) return <div className="flex items-center gap-2 py-4"><div className="w-4 h-4 border-2 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"/><span className="text-[13px] text-slate-400">{ar?'جارٍ التحميل...':'Loading...'}</span></div>;
  if (!data)   return <p className="text-[13px] text-slate-400 py-3">{ar?'لا توجد بيانات جرعات الكلى':'No renal dosing data'}</p>;

  const pharmacoRows = [
    { label:'Protein Binding', labelAr:'ارتباط البروتين',   field:'proteinBinding',  unit:'%' },
    { label:'Renal Excretion', labelAr:'الإطراح الكلوي',    field:'renalExcretion',  unit:'%' },
    { label:'Half-life',       labelAr:'عمر النصف',         field:'halfLife',        unit:'' },
    { label:'Mol. Weight',     labelAr:'الوزن الجزيئي',     field:'molecularWeight', unit:' Da' },
    { label:'Vd',              labelAr:'حجم التوزيع',       field:'vd',             unit:' L/kg' },
    { label:'Metabolism',      labelAr:'الاستقلاب',         field:'metabolism',      unit:'' },
  ];
  const gfrRows = [
    { label:'Normal Dose', labelAr:'الجرعة الطبيعية', field:'normalDose', color:'text-teal-700 dark:text-teal-400', bg:'bg-teal-50 dark:bg-teal-900/20' },
    { label:'GFR > 50',    labelAr:'GFR > 50',         field:'gfr_gt50',  color:'text-emerald-700 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/20' },
    { label:'GFR 10–50',   labelAr:'GFR 10–50',        field:'gfr_10_50', color:'text-amber-700 dark:text-amber-400',   bg:'bg-amber-50 dark:bg-amber-900/20' },
    { label:'GFR < 10',    labelAr:'GFR < 10',         field:'gfr_lt10',  color:'text-orange-700 dark:text-orange-400', bg:'bg-orange-50 dark:bg-orange-900/20' },
    { label:'HD',          labelAr:'غسيل كلى (HD)',    field:'hd',        color:'text-red-700 dark:text-red-400',       bg:'bg-red-50 dark:bg-red-900/20' },
    { label:'APD/CAPD',    labelAr:'APD/CAPD',         field:'apd_capd',  color:'text-purple-700 dark:text-purple-400', bg:'bg-purple-50 dark:bg-purple-900/20' },
    { label:'HDF',         labelAr:'HDF',              field:'hdf',       color:'text-purple-700 dark:text-purple-400', bg:'bg-purple-50 dark:bg-purple-900/20' },
    { label:'CAV/VVHD',   labelAr:'CAV/VVHD',         field:'cav_vvhd',  color:'text-slate-700 dark:text-slate-400',   bg:'bg-slate-50 dark:bg-slate-800' },
  ];
  const extraRows = [
    { label:'Administration', labelAr:'طريقة الإعطاء',   field:'administration' },
    { label:'Interactions',   labelAr:'التفاعلات الدوائية', field:'drugInteractions' },
    { label:'Other Info',     labelAr:'معلومات إضافية',   field:'otherInfo' },
  ];

  return (
    <div className="space-y-4">
      {data.clinicalUse && <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed italic">{data.clinicalUse}</p>}

      {/* Pharmacokinetics grid */}
      {pharmacoRows.some(r => data[r.field]) && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ar?'الحرائك الدوائية':'Pharmacokinetics'}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {pharmacoRows.map(r => !data[r.field] ? null : (
              <div key={r.field} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                <p className="text-[9px] font-black uppercase text-slate-400">{ar?r.labelAr:r.label}</p>
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">{data[r.field]}{r.unit&&!String(data[r.field]).includes(r.unit.trim())?r.unit:''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GFR dosing table */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ar?'الجرعة حسب وظيفة الكلى':'Dose by Renal Function'}</p>
        <div className="space-y-1.5">
          {gfrRows.map(r => !data[r.field] ? null : (
            <div key={r.field} className={`rounded-xl border overflow-hidden ${r.bg} ${r.bg.includes('teal')?'border-teal-100 dark:border-teal-800':r.bg.includes('emerald')?'border-emerald-100 dark:border-emerald-800':r.bg.includes('amber')?'border-amber-100 dark:border-amber-800':r.bg.includes('orange')?'border-orange-100 dark:border-orange-800':r.bg.includes('red')?'border-red-100 dark:border-red-800':r.bg.includes('purple')?'border-purple-100 dark:border-purple-800':'border-slate-100 dark:border-slate-700'}`}>
              <div className="flex items-start gap-3 px-3 py-2.5">
                <span className={`text-[10px] font-black flex-shrink-0 w-[72px] pt-0.5 ${r.color}`}>{ar?r.labelAr:r.label}</span>
                <span className="text-[13px] text-slate-700 dark:text-slate-200 leading-snug font-medium" style={{wordBreak:'break-word'}}>{String(data[r.field])}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extra info */}
      {extraRows.some(r=>data[r.field]) && (
        <div className="space-y-2">
          {extraRows.map(r => !data[r.field] ? null : (
            <div key={r.field} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card">
              <p className="px-3 pt-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{ar?r.labelAr:r.label}</p>
              <p className="px-3 pb-2.5 pt-1 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{String(data[r.field])}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dosage View ───────────────────────────────────────────────────────────────
function DosageView({ text, language }: { text:string; language:Language }) {
  const ar = language === 'ar';
  if (!text) return null;
  const EM = /\u2014|\u2013|—|–/;
  const lines = text.split(/\n+/).filter(l=>l.trim());
  interface Entry { condition:string; dose:string; isContra:boolean; }
  const entries: Entry[] = [];
  let plain: string[] = [];
  for (const line of lines) {
    const di = line.search(EM);
    if (di > 0 && di < 80) {
      if (plain.length) { entries.push({condition:'',dose:plain.join(' '),isContra:false}); plain=[]; }
      const cond = line.slice(0,di).trim();
      entries.push({condition:cond, dose:line.slice(di+1).trim(), isContra:/contraindic|caution/i.test(cond)});
    } else { plain.push(line.trim()); }
  }
  if (plain.length) entries.push({condition:'',dose:plain.join(' '),isContra:false});
  if (entries.length===1&&!entries[0].condition) return <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{text}</p>;
  return (
    <div className="space-y-2">
      {entries.map((e,i)=>!e.condition
        ? <p key={i} className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{e.dose}</p>
        : <div key={i} className={`rounded-xl border overflow-hidden ${e.isContra?'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800':'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800'}`}>
            <div className={`px-3 py-1.5 border-b ${e.isContra?'border-red-100 dark:border-red-800':'border-violet-100 dark:border-violet-800'}`}>
              <span className={`text-[10px] font-black uppercase tracking-wide ${e.isContra?'text-red-600 dark:text-red-400':'text-violet-600 dark:text-violet-400'}`}>{e.isContra?'⛔ ':'💊 '}{e.condition}</span>
            </div>
            <p className="px-3 py-2 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{e.dose}</p>
          </div>
      )}
    </div>
  );
}

// ── Interactions ──────────────────────────────────────────────────────────────
interface StructuredInteraction { interactsWith:string; severity:string; documentation?:string; summary:string; }
const SEV_ORDER = ['Contraindicated','Major','Moderate','Minor'];
const SEV_STYLE: Record<string,{card:string;badge:string;btn:string}> = {
  Contraindicated:{card:'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',badge:'bg-red-600 text-white',btn:'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300'},
  Major:{card:'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',badge:'bg-orange-500 text-white',btn:'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300'},
  Moderate:{card:'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',badge:'bg-yellow-500 text-white',btn:'bg-yellow-100 text-yellow-700 border-yellow-300'},
  Minor:{card:'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',badge:'bg-green-500 text-white',btn:'bg-green-100 text-green-700 border-green-300'},
  Unknown:{card:'bg-slate-50 border-slate-200 dark:bg-slate-800',badge:'bg-slate-500 text-white',btn:'bg-slate-100 text-slate-600 border-slate-300'},
};
function IxCard({ix}:{ix:StructuredInteraction}){
  const [open,setOpen]=useState(false); const s=SEV_STYLE[ix.severity]||SEV_STYLE.Unknown;
  return <div className={`rounded-xl border ${s.card} overflow-hidden`}>
    <button className="w-full flex items-start gap-2 p-2.5 text-start active:opacity-70" onClick={()=>setOpen(o=>!o)}>
      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${s.badge}`}>{ix.severity}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black text-slate-800 dark:text-white leading-tight">{ix.interactsWith}</p>
        {!open&&<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ix.summary}</p>}
      </div>
      <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-1 text-slate-400 transition-transform ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
    </button>
    {open&&<div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700"><p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pt-2">{ix.summary}</p></div>}
  </div>;
}
function InteractionsView({scientificName,tradeName,fallbackText,language}:{scientificName:string;tradeName:string;fallbackText:string;language:Language}){
  const ar=language==='ar'; const [items,setItems]=useState<StructuredInteraction[]|null>(null); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState<string|null>(null);
  useEffect(()=>{ fetchFullClinical(scientificName,tradeName).then(d=>{ setItems(Array.isArray(d?.interactions)?d.interactions:[]); setLoading(false); }); },[scientificName,tradeName]);
  if(loading) return <div className="flex items-center gap-2 py-3"><div className="w-4 h-4 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin"/><span className="text-[13px] text-slate-400">{ar?'جارٍ التحميل...':'Loading...'}</span></div>;
  const sorted=[...(items||[])].sort((a,b)=>(SEV_ORDER.indexOf(a.severity)+1||99)-(SEV_ORDER.indexOf(b.severity)+1||99));
  const counts=sorted.reduce<Record<string,number>>((a,ix)=>({...a,[ix.severity]:(a[ix.severity]||0)+1}),{});
  const visible=filter?sorted.filter(ix=>ix.severity===filter):sorted;
  if(!sorted.length) return fallbackText
    ? <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{fallbackText}</p>
    : <p className="text-[13px] text-slate-400 py-2">{ar?'لا توجد تفاعلات مسجلة':'No interactions on record'}</p>;
  return <div>
    <div className="flex gap-1.5 flex-wrap mb-3">
      <button onClick={()=>setFilter(null)} className={`text-[9px] font-black px-2 py-1 rounded-full border ${!filter?'bg-slate-700 text-white border-slate-700':'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>{ar?'الكل':'All'} {sorted.length}</button>
      {SEV_ORDER.filter(s=>counts[s]).map(s=>{ const st=SEV_STYLE[s]; return <button key={s} onClick={()=>setFilter(filter===s?null:s)} className={`text-[9px] font-black px-2 py-1 rounded-full border ${filter===s?st.badge+' border-transparent':st.btn}`}>{s} {counts[s]}</button>; })}
    </div>
    <div className="space-y-2">{visible.map((ix,i)=><IxCard key={i} ix={ix}/>)}</div>
  </div>;
}

// ── Pregnancy modal ───────────────────────────────────────────────────────────
function PregModal({pregData,language,onClose}:{pregData:PregReferenceData;language:Language;onClose:()=>void}){
  const ar=language==='ar';
  const pregCat=(pregData.pregnancyCategory||'').replace(/[^A-Za-z]/g,'').toUpperCase();
  const lactCat=(pregData.lactationCategory||'').trim().toUpperCase();
  const pi=PREG_INFO[pregCat]; const li=LACT_INFO[lactCat];
  return (
    <div className="fixed inset-0 z-[600] bg-black/50 flex items-end justify-center p-0" onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-t-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="font-black text-[15px] text-slate-800 dark:text-white">{ar?'تصنيف السلامة':'Safety Classification'}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {pi && <div className={`rounded-2xl border p-4 ${pi.bg} ${pi.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-black" style={{color:'inherit'}}>{pregCat}</span>
              <div><p className={`font-black text-[14px] ${pi.color}`}>{ar?pi.labelAr:pi.labelEn}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{ar?'تصنيف الحمل':'Pregnancy Category'}</p></div>
            </div>
            <p className={`text-[13px] leading-relaxed ${pi.color}`}>{ar?pi.descAr:pi.descEn}</p>
          </div>}
          {li && <div className={`rounded-2xl border p-4 ${li.bg} ${li.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-black">{lactCat}</span>
              <div><p className={`font-black text-[14px] ${li.color}`}>{ar?li.labelAr:li.labelEn}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{ar?'تصنيف الرضاعة':'Lactation Category'}</p></div>
            </div>
            <p className={`text-[13px] leading-relaxed ${li.color}`}>{ar?li.descAr:li.descEn}</p>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── Sections config ───────────────────────────────────────────────────────────
const SECTIONS = [
  { key:'indications',            labelAr:'دواعي الاستخدام',       labelEn:'Indications',             color:'text-teal-600',   bg:'bg-teal-50 dark:bg-teal-900/25',     group:'main' },
  { key:'mechanism',              labelAr:'آلية العمل',            labelEn:'Mechanism',               color:'text-blue-600',   bg:'bg-blue-50 dark:bg-blue-900/25',     group:'main' },
  { key:'dosage',                 labelAr:'الجرعة',                labelEn:'Dosage',                  color:'text-violet-600', bg:'bg-violet-50 dark:bg-violet-900/25', group:'main' },
  { key:'interactions',           labelAr:'التفاعلات الدوائية',    labelEn:'Drug Interactions',       color:'text-amber-600',  bg:'bg-amber-50 dark:bg-amber-900/25',   group:'main' },
  { key:'renalDosing',            labelAr:'جرعات قصور الكلى',      labelEn:'Renal Dosing',            color:'text-cyan-600',   bg:'bg-cyan-50 dark:bg-cyan-900/25',     group:'main' },
  { key:'maternalConsiderations', labelAr:'اعتبارات الأم الحامل',  labelEn:'Maternal Considerations', color:'text-rose-600',   bg:'bg-rose-50 dark:bg-rose-900/25',     group:'preg' },
  { key:'fetalConsiderations',    labelAr:'اعتبارات الجنين',       labelEn:'Fetal Considerations',    color:'text-pink-600',   bg:'bg-pink-50 dark:bg-pink-900/25',     group:'preg' },
  { key:'breastfeedingSafety',    labelAr:'الرضاعة الطبيعية',      labelEn:'Breastfeeding Safety',    color:'text-orange-600', bg:'bg-orange-50 dark:bg-orange-900/25', group:'lact' },
  { key:'summaryNotes',           labelAr:'ملاحظات موجزة',         labelEn:'Summary Notes',           color:'text-slate-600',  bg:'bg-slate-50 dark:bg-slate-800/25',   group:'main' },
];

const SectionIcon: React.FC<{k:string;cls:string}> = ({k,cls}) => {
  const s={className:`w-[18px] h-[18px] ${cls}`,fill:'none',viewBox:'0 0 24 24',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
  const icons:Record<string,React.ReactNode>={
    indications:<svg {...s}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
    mechanism:<svg {...s}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
    dosage:<svg {...s}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
    interactions:<svg {...s}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
    renalDosing:<svg {...s}><ellipse cx="12" cy="12" rx="4" ry="7"/><path d="M8 12c-4 0-5 2-5 2s1 4 9 4 9-4 9-4-1-2-5-2"/></svg>,
    maternalConsiderations:<svg {...s}><path d="M12 2a5 5 0 015 5c0 5-5 13-5 13S7 12 7 7a5 5 0 015-5z"/><circle cx="12" cy="7" r="2"/></svg>,
    fetalConsiderations:<svg {...s}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    breastfeedingSafety:<svg {...s}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    summaryNotes:<svg {...s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  };
  return <>{icons[k]??icons['indications']}</>;
};

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { scientificName:string; tradeName:string; language:Language; onClose:()=>void; }

const ClinicalReferencePage: React.FC<Props> = ({ scientificName, tradeName, language, onClose }) => {
  const ar = language === 'ar';
  const [data,     setData]     = useState<ClinicalReference|null>(null);
  const [fullData, setFullData] = useState<any|null>(null);
  const [pregData, setPregData] = useState<PregReferenceData|null>(null);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<'main'|'preg'|'lact'>('main');
  const [showPregModal, setShowPregModal] = useState(false);

  useEffect(() => {
    let done=false;
    const finish=()=>{ if(!done){done=true;setLoading(false);} };
    getClinicalReference(scientificName,tradeName).then(d=>{setData(d);finish();}).catch(finish);
    fetchFullClinical(scientificName,tradeName).then(d=>{ if(d){setFullData(d);finish();}else finish(); }).catch(finish);
    getPregReference(scientificName,tradeName).then(d=>{ if(d)setPregData(d); }).catch(()=>{});
  }, [scientificName, tradeName]);

  const toggle=(key:string)=>setExpanded(p=>{ const n=new Set(p); n.has(key)?n.delete(key):n.add(key); return n; });

  const getTextByKey=(k:string):string => {
    for(const src of [fullData,pregData,data]){
      if(!src) continue;
      const v=(src as any)[k];
      if(v&&typeof v==='string'&&v.trim()) return v.trim();
      if(k==='interactions'){ const vi=(src as any).drugInteractions; if(vi&&typeof vi==='string'&&vi.trim()) return vi.trim(); }
    }
    return '';
  };

  const pregCat=(pregData?.pregnancyCategory||'').replace(/[^A-Za-z]/g,'').toUpperCase();
  const lactCat=(pregData?.lactationCategory||'').trim().toUpperCase();
  const pi=PREG_INFO[pregCat];
  const li=LACT_INFO[lactCat];

  const visibleSections = SECTIONS.filter(sec => {
    if(sec.group==='preg' && activeGroup!=='preg') return false;
    if(sec.group==='lact' && activeGroup!=='lact') return false;
    const alwaysShow = sec.key==='interactions'||sec.key==='renalDosing';
    const text=getTextByKey(sec.key);
    return alwaysShow || (text&&text!=='—'&&text.trim()!==''&&text!=='nan');
  });

  return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-dark-bg flex flex-col" data-overlay="true"
      style={{direction:ar?'rtl':'ltr'}}
      onTouchStart={e=>e.stopPropagation()}
      onTouchMove={e=>e.stopPropagation()}
      onTouchEnd={e=>e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform">
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={ar?"M9 5l7 7-7 7":"M15 19l-7-7 7-7"}/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-[14px] text-slate-800 dark:text-white truncate">{tradeName}</h1>
          <p className="text-[11px] text-slate-400">{scientificName}</p>
        </div>
        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 rounded-xl">{ar?'المرجع السريري':'Clinical Ref'}</span>
      </div>

      {/* Category badges row */}
      {pregData&&(pregCat||lactCat)&&(
        <div className="flex-shrink-0 px-4 py-2 border-b border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
          {pregCat&&pi&&(
            <button onClick={()=>setShowPregModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border active:scale-95 transition-all ${pi.bg} ${pi.border}`}>
              <span className={`text-[11px] font-black ${pi.color}`}>🤰 {ar?'حمل':'Preg'}: <span className="text-[14px]">{pregCat}</span></span>
              <svg className={`w-3 h-3 ${pi.color} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
          )}
          {lactCat&&li&&(
            <button onClick={()=>setShowPregModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border active:scale-95 transition-all ${li.bg} ${li.border}`}>
              <span className={`text-[11px] font-black ${li.color}`}>🍼 {ar?'رضاعة':'Lact'}: <span className="text-[14px]">{lactCat}</span></span>
              <svg className={`w-3 h-3 ${li.color} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-2.5 pb-0 border-b border-slate-100 dark:border-slate-800">
        {([
          {id:'main', labelEn:'Clinical', labelAr:'سريري', icon:'📋'},
          {id:'preg', labelEn:'Pregnancy', labelAr:'حمل', icon:'🤰', show:!!pregData},
          {id:'lact', labelEn:'Lactation', labelAr:'رضاعة', icon:'🍼', show:!!pregData},
        ] as const).filter(t=>t.id==='main'||t.show).map(tab=>(
          <button key={tab.id} onClick={()=>setActiveGroup(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 pb-2 pt-1 text-[11px] font-black border-b-2 transition-all ${
              activeGroup===tab.id
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-400 dark:text-slate-500'
            }`}>
            <span>{tab.icon}</span>
            <span>{ar?tab.labelAr:tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Scrollable content — NO touch blocking */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
           style={{paddingBottom:'calc(env(safe-area-inset-bottom) + 24px)'}}>

        {loading&&<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-500 rounded-full animate-spin"/></div>}

        {!loading&&!data&&!fullData&&!pregData&&(
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-black text-slate-500 text-[14px]">{ar?'لا توجد بيانات سريرية':'No clinical data available'}</p>
            <p className="text-slate-400 text-[12px] mt-1">{scientificName}</p>
          </div>
        )}

        {!loading&&(data||fullData||pregData)&&visibleSections.map(sec=>{
          const text=getTextByKey(sec.key);
          const isOpen=expanded.has(sec.key);
          return (
            <div key={sec.key} className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <button onClick={()=>toggle(sec.key)} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${sec.bg}`}>
                  <SectionIcon k={sec.key} cls={sec.color}/>
                </div>
                <span className="flex-1 font-black text-[14px] text-slate-700 dark:text-slate-200">{ar?sec.labelAr:sec.labelEn}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div style={{display:'grid',gridTemplateRows:isOpen?'1fr':'0fr',transition:'grid-template-rows 0.15s ease-out',contain:'layout'}}>
                <div style={{overflow:'hidden'}}>
                  <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800">
                    {sec.key==='interactions' ? <InteractionsView scientificName={scientificName} tradeName={tradeName} fallbackText={text} language={language}/>
                    :sec.key==='renalDosing'  ? <RenalDosingView  scientificName={scientificName} tradeName={tradeName} language={language}/>
                    :sec.key==='dosage'       ? <DosageView text={text} language={language}/>
                    :<p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium" style={{whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>{text}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading&&(data||fullData||pregData)&&(
          <p className="text-[10px] text-slate-400 text-center pt-2">{ar?'⚠️ للمرجعية السريرية فقط. راجع دائماً المصادر الرسمية.':'⚠️ For clinical reference only. Always consult official sources.'}</p>
        )}
      </div>

      {/* Pregnancy/Lactation Info Modal */}
      {showPregModal&&pregData&&<PregModal pregData={pregData} language={language} onClose={()=>setShowPregModal(false)}/>}
    </div>
  );
};

export default ClinicalReferencePage;
