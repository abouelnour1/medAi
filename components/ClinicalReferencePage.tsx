import React, { useEffect, useState, useCallback } from 'react';
import { Language } from '../types';
import { ClinicalReference, getClinicalReference, getPregReference, PregReferenceData } from '../utils/dailyMedicines';

const R2_CLINICAL_FULL_URL = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/clinical_reference_full.json';
const R2_RENAL_URL         = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/renal_drugs.json';
const R2_LOOKUP_URL        = 'https://pub-7c54b481a078437e9de193eb2048a2c1.r2.dev/drug_lookup.json';

let _clinCache:   Record<string,any>|null = null;
let _renalCache:  Record<string,any>|null = null;
let _lookupCache: Record<string,{c?:string;r?:string}>|null = null;

async function getLookup(){ if(_lookupCache)return _lookupCache; try{const r=await fetch(R2_LOOKUP_URL);if(r.ok)_lookupCache=await r.json();else _lookupCache={};}catch{_lookupCache={};} return _lookupCache!; }
async function resolveKeys(sci:string,trade:string){const lk=await getLookup();const u=sci.toUpperCase().trim();const e=lk[u]||lk[u.split(/[\s,/]+/)[0]];return{clinKey:e?.c??null,renalKey:e?.r??null};}

const SALT=/\s+(hydrochloride|hcl|sodium|potassium|sulfate|sulphate|maleate|fumarate|tartrate|acetate|phosphate|citrate|gluconate|mesylate|besylate|oxalate|bromide|chloride|nitrate|succinate|valerate|monohydrate|trihydrate|anhydrous|dihydrate)\b/gi;
const SYN:Record<string,string>={hyoscine:'scopolamine',salbutamol:'albuterol',paracetamol:'acetaminophen',acetaminophen:'paracetamol',albuterol:'salbutamol',miconazole:'clotrimazole','folic acid':'folate','vitamin c':'ascorbic acid','co-amoxiclav':'amoxicillin-clavulanate potassium','amoxicillin/clavulanate':'amoxicillin-clavulanate potassium'};
function norm(n:string){return n.toLowerCase().trim().replace(/-/g,'/').replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|ug|iu|%|units?|mmol)\b/gi,'').replace(SALT,'').replace(/\s+/g,' ').trim();}
function keys(raw:string){const n=norm(raw),fw=n.split(/[\s/,+]+/)[0],c=[n,raw.toLowerCase().trim(),fw,...n.split(/[/,+]+/).map(p=>p.trim())].filter(Boolean);if(SYN[n])c.push(SYN[n]);if(SYN[fw])c.push(SYN[fw]);return[...new Set(c)];}
function findInMap<T>(map:Record<string,T>,...raws:string[]):T|undefined{const mk=Object.keys(map),nm:Record<string,string>={};for(const k of mk)nm[k]=norm(k);for(const raw of raws){if(!raw)continue;const cs=keys(raw);for(const c of cs)if(map[c])return map[c];for(const c of cs){const f=mk.find(k=>nm[k]===c);if(f)return map[f];}const fw=cs[cs.length-1];if(fw&&fw.length>=4){const f=mk.find(k=>{const nk=nm[k],nf=nk.split(/[\s/,+]+/)[0];return nk.startsWith(fw)||fw.startsWith(nf);});if(f)return map[f];}}return undefined;}

async function fetchRenalData(sci:string,trade?:string){if(!_renalCache){try{const r=await fetch(R2_RENAL_URL);if(r.ok)_renalCache=await r.json();else _renalCache={};}catch{_renalCache={};}}const{renalKey}=await resolveKeys(sci,trade??'');if(renalKey&&_renalCache![renalKey])return _renalCache![renalKey];return findInMap(_renalCache!,sci,trade??'')??null;}
async function fetchFullClinical(sci:string,trade?:string){if(!_clinCache){try{const r=await fetch(R2_CLINICAL_FULL_URL);if(r.ok)_clinCache=await r.json();else _clinCache={};}catch{_clinCache={};}}const{clinKey}=await resolveKeys(sci,trade??'');if(clinKey&&_clinCache![clinKey])return _clinCache![clinKey];return findInMap(_clinCache!,sci,trade??'')??null;}

// ── Category descriptions ─────────────────────────────────────────────────────
const PREG_INFO:Record<string,{color:string;bg:string;border:string;labelEn:string;labelAr:string;descEn:string;descAr:string}>={
  A:{color:'text-emerald-700 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-900/20',border:'border-emerald-200 dark:border-emerald-700',labelEn:'Category A — Safe',labelAr:'الفئة A — آمن',descEn:'Adequate human studies show no fetal risk in any trimester.',descAr:'دراسات بشرية كافية لم تُثبت خطرًا على الجنين في أي مرحلة.'},
  B:{color:'text-blue-700 dark:text-blue-400',bg:'bg-blue-50 dark:bg-blue-900/20',border:'border-blue-200 dark:border-blue-700',labelEn:'Category B — Likely Safe',labelAr:'الفئة B — آمن على الأرجح',descEn:'No fetal risk in animal studies; no adequate human studies, OR animal risk not confirmed in humans.',descAr:'لا خطر في دراسات الحيوانات ولا توجد دراسات بشرية كافية، أو خطر الحيوانات لم يتأكد في البشر.'},
  C:{color:'text-amber-700 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-900/20',border:'border-amber-200 dark:border-amber-700',labelEn:'Category C — Use with Caution',labelAr:'الفئة C — استخدام بحذر',descEn:'Animal studies show adverse effects; no adequate human data. Use only if benefit justifies risk.',descAr:'دراسات الحيوانات أظهرت آثارًا ضارة؛ لا توجد بيانات بشرية كافية. يُستخدم فقط إذا كانت الفائدة تبرر المخاطرة.'},
  D:{color:'text-orange-700 dark:text-orange-400',bg:'bg-orange-50 dark:bg-orange-900/20',border:'border-orange-200 dark:border-orange-700',labelEn:'Category D — Avoid if Possible',labelAr:'الفئة D — تجنب إن أمكن',descEn:'Positive evidence of human fetal risk. Benefits may warrant use in life-threatening situations.',descAr:'دليل إيجابي على خطر جنيني بشري. الفوائد قد تبرر الاستخدام في الحالات التي تهدد الحياة.'},
  X:{color:'text-red-700 dark:text-red-400',bg:'bg-red-50 dark:bg-red-900/20',border:'border-red-200 dark:border-red-700',labelEn:'Category X — Contraindicated',labelAr:'الفئة X — مضاد استخدام',descEn:'Proven fetal abnormalities. Risks clearly outweigh any benefit. CONTRAINDICATED in pregnancy.',descAr:'تشوهات جنينية مثبتة. المخاطر تفوق بوضوح أي فائدة. مُضاد للاستخدام خلال الحمل.'},
};
const LACT_INFO:Record<string,{color:string;bg:string;border:string;labelEn:string;labelAr:string;descEn:string;descAr:string}>={
  S:{color:'text-emerald-700 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-900/20',border:'border-emerald-200 dark:border-emerald-700',labelEn:'Safe (S)',labelAr:'آمن (S)',descEn:'Compatible with breastfeeding. Minimal or no risk to the nursing infant.',descAr:'متوافق مع الرضاعة. خطر ضئيل أو معدوم على الرضيع.'},
  NSC:{color:'text-amber-700 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-900/20',border:'border-amber-200 dark:border-amber-700',labelEn:'Caution (NSC)',labelAr:'بحذر (NSC)',descEn:'Use with caution. Monitor infant for adverse effects.',descAr:'يستخدم بحذر. مراقبة الرضيع للتأثيرات الضارة.'},
  NS:{color:'text-red-700 dark:text-red-400',bg:'bg-red-50 dark:bg-red-900/20',border:'border-red-200 dark:border-red-700',labelEn:'Not Safe (NS)',labelAr:'غير آمن (NS)',descEn:'Not recommended during breastfeeding. Risk to infant outweighs benefits.',descAr:'غير موصى به أثناء الرضاعة. الخطر على الرضيع يفوق الفوائد.'},
};

// ── Dosage View ───────────────────────────────────────────────────────────────
function DosageView({text}:{text:string}){
  if(!text)return null;
  const EM=/\u2014|\u2013|—|–/;
  const lines=text.split(/\n+/).filter(l=>l.trim());
  interface Entry{condition:string;dose:string;isContra:boolean;}
  const entries:Entry[]=[]; let plain:string[]=[];
  for(const line of lines){const di=line.search(EM);if(di>0&&di<80){if(plain.length){entries.push({condition:'',dose:plain.join(' '),isContra:false});plain=[];}const cond=line.slice(0,di).trim();entries.push({condition:cond,dose:line.slice(di+1).trim(),isContra:/contraindic|caution/i.test(cond)});}else{plain.push(line.trim());}}
  if(plain.length)entries.push({condition:'',dose:plain.join(' '),isContra:false});
  if(entries.length===1&&!entries[0].condition)return<p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{text}</p>;
  return<div className="space-y-2">{entries.map((e,i)=>!e.condition?<p key={i}className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed"style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{e.dose}</p>:<div key={i}className={`rounded-xl border overflow-hidden ${e.isContra?'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800':'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800'}`}><div className={`px-3 py-1.5 border-b ${e.isContra?'border-red-100 dark:border-red-800':'border-violet-100 dark:border-violet-800'}`}><span className={`text-[10px] font-black uppercase ${e.isContra?'text-red-600 dark:text-red-400':'text-violet-600 dark:text-violet-400'}`}>{e.isContra?'⛔ ':'💊 '}{e.condition}</span></div><p className="px-3 py-2 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed"style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{e.dose}</p></div>)}</div>;
}

// ── Renal Bottom Sheet ────────────────────────────────────────────────────────
function RenalSheet({scientificName,tradeName,language,onClose}:{scientificName:string;tradeName:string;language:Language;onClose:()=>void}){
  const ar=language==='ar';
  const [data,setData]=useState<any|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetchRenalData(scientificName,tradeName).then(d=>{setData(d);setLoading(false);});},[]);

  const gfrRows=[
    {label:'Normal Dose',labelAr:'الجرعة الطبيعية',field:'normalDose',color:'text-teal-700 dark:text-teal-400',bg:'bg-teal-50 dark:bg-teal-900/20',border:'border-teal-100 dark:border-teal-800'},
    {label:'GFR > 50',   labelAr:'GFR > 50',        field:'gfr_gt50', color:'text-emerald-700 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-900/20',border:'border-emerald-100 dark:border-emerald-800'},
    {label:'GFR 10–50',  labelAr:'GFR 10–50',       field:'gfr_10_50',color:'text-amber-700 dark:text-amber-400',  bg:'bg-amber-50 dark:bg-amber-900/20',  border:'border-amber-100 dark:border-amber-800'},
    {label:'GFR < 10',   labelAr:'GFR < 10',        field:'gfr_lt10', color:'text-orange-700 dark:text-orange-400',bg:'bg-orange-50 dark:bg-orange-900/20',border:'border-orange-100 dark:border-orange-800'},
    {label:'HD',         labelAr:'غسيل كلى (HD)',   field:'hd',       color:'text-red-700 dark:text-red-400',     bg:'bg-red-50 dark:bg-red-900/20',      border:'border-red-100 dark:border-red-800'},
    {label:'APD/CAPD',   labelAr:'APD/CAPD',        field:'apd_capd', color:'text-purple-700 dark:text-purple-400',bg:'bg-purple-50 dark:bg-purple-900/20',border:'border-purple-100 dark:border-purple-800'},
    {label:'HDF',        labelAr:'HDF',             field:'hdf',      color:'text-purple-700 dark:text-purple-400',bg:'bg-purple-50 dark:bg-purple-900/20',border:'border-purple-100 dark:border-purple-800'},
    {label:'CAV/VVHD',  labelAr:'CAV/VVHD',        field:'cav_vvhd', color:'text-slate-600 dark:text-slate-400', bg:'bg-slate-50 dark:bg-slate-800',     border:'border-slate-100 dark:border-slate-700'},
  ];

  return(
    <div className="fixed inset-0 z-[700] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-t-3xl w-full max-h-[88vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div>
            <p className="font-black text-[15px] text-slate-800 dark:text-white">{ar?'جرعات قصور الكلى':'Renal Dosing'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{ar?'المصدر: Ashley Publications':'Source: Ashley Publications'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4" style={{paddingBottom:'calc(env(safe-area-inset-bottom)+20px)'}}>
          {loading&&<div className="flex items-center gap-2 py-6 justify-center"><div className="w-5 h-5 border-2 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"/><span className="text-[13px] text-slate-400">{ar?'جارٍ التحميل...':'Loading...'}</span></div>}
          {!loading&&!data&&<p className="text-[13px] text-slate-400 text-center py-6">{ar?'لا توجد بيانات لهذا الدواء':'No renal data available for this drug'}</p>}
          {!loading&&data&&<>
            {data.clinicalUse&&<p className="text-[13px] text-slate-500 italic leading-relaxed">{data.clinicalUse}</p>}
            {/* Pharmacokinetics */}
            {(data.proteinBinding||data.renalExcretion||data.halfLife||data.molecularWeight||data.vd||data.metabolism)&&(
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ar?'الحرائك الدوائية':'Pharmacokinetics'}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[{f:'proteinBinding',l:'Protein Binding',la:'ارتباط البروتين',u:'%'},{f:'renalExcretion',l:'Renal Excretion',la:'إطراح كلوي',u:'%'},{f:'halfLife',l:'Half-life',la:'عمر النصف',u:''},{f:'molecularWeight',l:'Mol. Weight',la:'الوزن الجزيئي',u:' Da'},{f:'vd',l:'Vd',la:'حجم التوزيع',u:' L/kg'},{f:'metabolism',l:'Metabolism',la:'الاستقلاب',u:''}].map(r=>!data[r.f]?null:(
                    <div key={r.f} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                      <p className="text-[9px] font-black uppercase text-slate-400">{ar?r.la:r.l}</p>
                      <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">{data[r.f]}{r.u&&!String(data[r.f]).includes(r.u.trim())?r.u:''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* GFR table */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ar?'الجرعة حسب وظيفة الكلى':'Dose by Renal Function'}</p>
              <div className="space-y-1.5">
                {gfrRows.map(r=>!data[r.field]?null:(
                  <div key={r.field} className={`rounded-xl border overflow-hidden ${r.bg} ${r.border}`}>
                    <div className="flex items-start gap-3 px-3 py-2.5">
                      <span className={`text-[10px] font-black flex-shrink-0 w-[72px] pt-0.5 ${r.color}`}>{ar?r.labelAr:r.label}</span>
                      <span className="text-[13px] text-slate-700 dark:text-slate-200 leading-snug font-medium" style={{wordBreak:'break-word'}}>{String(data[r.field])}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Extra */}
            {[{f:'administration',l:'Administration',la:'طريقة الإعطاء'},{f:'drugInteractions',l:'Interactions',la:'التفاعلات'},{f:'otherInfo',l:'Other Info',la:'معلومات إضافية'}].map(r=>!data[r.f]?null:(
              <div key={r.f} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card">
                <p className="px-3 pt-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{ar?r.la:r.l}</p>
                <p className="px-3 pb-2.5 pt-1 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{String(data[r.f])}</p>
              </div>
            ))}
          </>}
        </div>
      </div>
    </div>
  );
}


// ── Renal Content (inline accordion) ─────────────────────────────────────────
function RenalContent({scientificName,tradeName,language}:{scientificName:string;tradeName:string;language:Language}){
  const ar=language==='ar';
  const[data,setData]=useState<any|null>(null);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fetchRenalData(scientificName,tradeName).then(d=>{setData(d);setLoading(false);});},[]);
  const gfrRows=[
    {label:'Normal Dose',labelAr:'الجرعة الطبيعية',field:'normalDose',color:'text-teal-700 dark:text-teal-400',bg:'bg-teal-50 dark:bg-teal-900/20',border:'border-teal-100 dark:border-teal-800'},
    {label:'GFR > 50',labelAr:'GFR > 50',field:'gfr_gt50',color:'text-emerald-700 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-900/20',border:'border-emerald-100 dark:border-emerald-800'},
    {label:'GFR 10–50',labelAr:'GFR 10–50',field:'gfr_10_50',color:'text-amber-700 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-900/20',border:'border-amber-100 dark:border-amber-800'},
    {label:'GFR < 10',labelAr:'GFR < 10',field:'gfr_lt10',color:'text-orange-700 dark:text-orange-400',bg:'bg-orange-50 dark:bg-orange-900/20',border:'border-orange-100 dark:border-orange-800'},
    {label:'HD',labelAr:'غسيل كلى (HD)',field:'hd',color:'text-red-700 dark:text-red-400',bg:'bg-red-50 dark:bg-red-900/20',border:'border-red-100 dark:border-red-800'},
    {label:'APD/CAPD',labelAr:'APD/CAPD',field:'apd_capd',color:'text-purple-700 dark:text-purple-400',bg:'bg-purple-50 dark:bg-purple-900/20',border:'border-purple-100 dark:border-purple-800'},
    {label:'HDF',labelAr:'HDF',field:'hdf',color:'text-purple-700 dark:text-purple-400',bg:'bg-purple-50 dark:bg-purple-900/20',border:'border-purple-100 dark:border-purple-800'},
    {label:'CAV/VVHD',labelAr:'CAV/VVHD',field:'cav_vvhd',color:'text-slate-600 dark:text-slate-400',bg:'bg-slate-50 dark:bg-slate-800',border:'border-slate-100 dark:border-slate-700'},
  ];
  if(loading)return<div className="flex items-center gap-2 py-3"><div className="w-4 h-4 border-2 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"/><span className="text-[13px] text-slate-400">{ar?'جارٍ التحميل...':'Loading...'}</span></div>;
  if(!data)return<p className="text-[13px] text-slate-400 py-2">{ar?'لا توجد بيانات جرعات الكلى':'No renal dosing data'}</p>;
  return(
    <div className="space-y-3">
      <p className="text-[10px] text-slate-400">{ar?'المصدر: Ashley Publications':'Source: Ashley Publications'}</p>
      {data.clinicalUse&&<p className="text-[13px] text-slate-500 italic leading-relaxed">{data.clinicalUse}</p>}
      {(data.proteinBinding||data.renalExcretion||data.halfLife||data.molecularWeight||data.vd||data.metabolism)&&(
        <div className="grid grid-cols-2 gap-1.5">
          {[{f:'proteinBinding',l:'Protein Binding',la:'ارتباط البروتين',u:'%'},{f:'renalExcretion',l:'Renal Excretion',la:'إطراح كلوي',u:'%'},{f:'halfLife',l:'Half-life',la:'عمر النصف',u:''},{f:'molecularWeight',l:'Mol. Weight',la:'الوزن الجزيئي',u:''},{f:'vd',l:'Vd',la:'حجم التوزيع',u:''},{f:'metabolism',l:'Metabolism',la:'الاستقلاب',u:''}].map(r=>!data[r.f]?null:(
            <div key={r.f} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
              <p className="text-[9px] font-black uppercase text-slate-400">{ar?r.la:r.l}</p>
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">{data[r.f]}{r.u&&!String(data[r.f]).includes(r.u.trim())?r.u:''}</p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        {gfrRows.map(r=>!data[r.field]?null:(
          <div key={r.field} className={`rounded-xl border overflow-hidden ${r.bg} ${r.border}`}>
            <div className="flex items-start gap-3 px-3 py-2.5">
              <span className={`text-[10px] font-black flex-shrink-0 w-[72px] pt-0.5 ${r.color}`}>{ar?r.labelAr:r.label}</span>
              <span className="text-[13px] text-slate-700 dark:text-slate-200 leading-snug font-medium" style={{wordBreak:'break-word'}}>{String(data[r.field])}</span>
            </div>
          </div>
        ))}
      </div>
      {[{f:'administration',l:'Administration',la:'طريقة الإعطاء'},{f:'drugInteractions',l:'Interactions',la:'التفاعلات'},{f:'otherInfo',l:'Other Info',la:'معلومات إضافية'}].map(r=>!data[r.f]?null:(
        <div key={r.f} className="rounded-xl border border-slate-100 dark:border-slate-800">
          <p className="px-3 pt-2 text-[10px] font-black uppercase text-slate-400">{ar?r.la:r.l}</p>
          <p className="px-3 pb-2.5 pt-1 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{String(data[r.f])}</p>
        </div>
      ))}
    </div>
  );
}

// ── Preg/Lact Bottom Sheet ────────────────────────────────────────────────────
function PregLactSheet({pregData,mode,language,onClose}:{pregData:PregReferenceData;mode:'preg'|'lact';language:Language;onClose:()=>void}){
  const ar=language==='ar';
  const pregCat=(pregData.pregnancyCategory||'').replace(/[^A-Za-z]/g,'').toUpperCase();
  const lactCat=(pregData.lactationCategory||'').trim().toUpperCase();
  const pi=PREG_INFO[pregCat]; const li=LACT_INFO[lactCat];

  return(
    <div className="fixed inset-0 z-[700] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white dark:bg-dark-card rounded-t-3xl w-full max-h-[88vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <p className="font-black text-[15px] text-slate-800 dark:text-white">{mode==='preg'?(ar?'الحمل':'Pregnancy'):(ar?'الرضاعة الطبيعية':'Breastfeeding')}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4" style={{paddingBottom:'calc(env(safe-area-inset-bottom)+20px)'}}>
          {/* Category card */}
          {mode==='preg'&&pi&&(
            <div className={`rounded-2xl border p-4 ${pi.bg} ${pi.border}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-4xl font-black ${pi.color}`}>{pregCat}</span>
                <div><p className={`font-black text-[14px] ${pi.color}`}>{ar?pi.labelAr:pi.labelEn}</p></div>
              </div>
              <p className={`text-[13px] leading-relaxed ${pi.color}`}>{ar?pi.descAr:pi.descEn}</p>
            </div>
          )}
          {mode==='lact'&&li&&(
            <div className={`rounded-2xl border p-4 ${li.bg} ${li.border}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-4xl font-black ${li.color}`}>{lactCat}</span>
                <div><p className={`font-black text-[14px] ${li.color}`}>{ar?li.labelAr:li.labelEn}</p></div>
              </div>
              <p className={`text-[13px] leading-relaxed ${li.color}`}>{ar?li.descAr:li.descEn}</p>
            </div>
          )}
          {/* Content sections */}
          {mode==='preg'&&[
            {key:'maternalConsiderations',labelEn:'Maternal Considerations',labelAr:'اعتبارات الأم الحامل',color:'text-rose-600'},
            {key:'fetalConsiderations',labelEn:'Fetal Considerations',labelAr:'اعتبارات الجنين',color:'text-pink-600'},
            {key:'summaryNotes',labelEn:'Summary Notes',labelAr:'ملاحظات موجزة',color:'text-slate-600'},
          ].map(s=>{const v=(pregData as any)[s.key];if(!v||!v.trim())return null;return(
            <div key={s.key} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800"><p className={`text-[11px] font-black uppercase tracking-wide ${s.color}`}>{ar?s.labelAr:s.labelEn}</p></div>
              <p className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{v}</p>
            </div>
          );})}
          {mode==='lact'&&[
            {key:'breastfeedingSafety',labelEn:'Breastfeeding Safety',labelAr:'سلامة الرضاعة',color:'text-orange-600'},
            {key:'summaryNotes',labelEn:'Summary Notes',labelAr:'ملاحظات موجزة',color:'text-slate-600'},
          ].map(s=>{const v=(pregData as any)[s.key];if(!v||!v.trim())return null;return(
            <div key={s.key} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800"><p className={`text-[11px] font-black uppercase tracking-wide ${s.color}`}>{ar?s.labelAr:s.labelEn}</p></div>
              <p className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{v}</p>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ── Interactions ──────────────────────────────────────────────────────────────
interface StructuredInteraction{interactsWith:string;severity:string;documentation?:string;summary:string;}
const SEV_ORDER=['Contraindicated','Major','Moderate','Minor'];
const SEV_STYLE:Record<string,{card:string;badge:string;btn:string}>={Contraindicated:{card:'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',badge:'bg-red-600 text-white',btn:'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300'},Major:{card:'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',badge:'bg-orange-500 text-white',btn:'bg-orange-100 text-orange-700 border-orange-300'},Moderate:{card:'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',badge:'bg-yellow-500 text-white',btn:'bg-yellow-100 text-yellow-700 border-yellow-300'},Minor:{card:'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',badge:'bg-green-500 text-white',btn:'bg-green-100 text-green-700 border-green-300'},Unknown:{card:'bg-slate-50 border-slate-200 dark:bg-slate-800',badge:'bg-slate-500 text-white',btn:'bg-slate-100 text-slate-600 border-slate-300'}};
function IxCard({ix}:{ix:StructuredInteraction}){const[open,setOpen]=useState(false);const s=SEV_STYLE[ix.severity]||SEV_STYLE.Unknown;return<div className={`rounded-xl border ${s.card} overflow-hidden`}><button className="w-full flex items-start gap-2 p-2.5 text-start active:opacity-70" onClick={()=>setOpen(o=>!o)}><span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${s.badge}`}>{ix.severity}</span><div className="flex-1 min-w-0"><p className="text-[13px] font-black text-slate-800 dark:text-white leading-tight">{ix.interactsWith}</p>{!open&&<p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ix.summary}</p>}</div><svg className={`w-3.5 h-3.5 flex-shrink-0 mt-1 text-slate-400 transition-transform ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg></button>{open&&<div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700"><p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pt-2">{ix.summary}</p></div>}</div>;}
function InteractionsView({scientificName,tradeName,fallbackText,language}:{scientificName:string;tradeName:string;fallbackText:string;language:Language}){
  const ar=language==='ar';const[items,setItems]=useState<StructuredInteraction[]|null>(null);const[loading,setLoading]=useState(true);const[filter,setFilter]=useState<string|null>(null);
  useEffect(()=>{fetchFullClinical(scientificName,tradeName).then(d=>{setItems(Array.isArray(d?.interactions)?d.interactions:[]);setLoading(false);});},[]);
  if(loading)return<div className="flex items-center gap-2 py-3"><div className="w-4 h-4 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin"/><span className="text-[13px] text-slate-400">{ar?'جارٍ التحميل...':'Loading...'}</span></div>;
  const sorted=[...(items||[])].sort((a,b)=>(SEV_ORDER.indexOf(a.severity)+1||99)-(SEV_ORDER.indexOf(b.severity)+1||99));
  const counts=sorted.reduce<Record<string,number>>((a,ix)=>({...a,[ix.severity]:(a[ix.severity]||0)+1}),{});
  const visible=filter?sorted.filter(ix=>ix.severity===filter):sorted;
  if(!sorted.length)return fallbackText?<p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{fallbackText}</p>:<p className="text-[13px] text-slate-400 py-2">{ar?'لا توجد تفاعلات مسجلة':'No interactions on record'}</p>;
  return<div><div className="flex gap-1.5 flex-wrap mb-3"><button onClick={()=>setFilter(null)} className={`text-[9px] font-black px-2 py-1 rounded-full border ${!filter?'bg-slate-700 text-white border-slate-700':'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>{ar?'الكل':'All'} {sorted.length}</button>{SEV_ORDER.filter(s=>counts[s]).map(s=>{const st=SEV_STYLE[s];return<button key={s} onClick={()=>setFilter(filter===s?null:s)} className={`text-[9px] font-black px-2 py-1 rounded-full border ${filter===s?st.badge+' border-transparent':st.btn}`}>{s} {counts[s]}</button>;})}</div><div className="space-y-2">{visible.map((ix,i)=><IxCard key={i} ix={ix}/>)}</div></div>;
}

// ── Plain text block ──────────────────────────────────────────────────────────
function TextBlock({text}:{text:string}){return<p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium" style={{whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>{text}</p>;}

// ── Section accordion ─────────────────────────────────────────────────────────
function SectionCard({labelEn,labelAr,bg,color,iconKey,language,children}:{labelEn:string;labelAr:string;bg:string;color:string;iconKey:string;language:Language;children:React.ReactNode}){
  const ar=language==='ar';const[open,setOpen]=useState(false);
  const icons:Record<string,React.ReactNode>={
    interactions:<svg className={`w-[18px] h-[18px] ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
    regulations:<svg className={`w-[18px] h-[18px] ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return(
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>{icons[iconKey]}</div>
        <span className="flex-1 font-black text-[14px] text-slate-700 dark:text-slate-200">{ar?labelAr:labelEn}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div style={{display:'grid',gridTemplateRows:open?'1fr':'0fr',transition:'grid-template-rows 0.15s ease-out',contain:'layout'}}>
        <div style={{overflow:'hidden'}}>
          <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Ingredient clinical card (for supplements) ────────────────────────────────
function IngredientClinical({name,language}:{name:string;language:Language}){
  const ar=language==='ar';
  const[full,setFull]=useState<any|null>(null);
  const[preg,setPreg]=useState<PregReferenceData|null>(null);
  const[renal,setRenal]=useState<any|null>(null);
  const[loading,setLoading]=useState(true);
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    Promise.all([fetchFullClinical(name,''),getPregReference(name,''),fetchRenalData(name,'')]).then(([f,p,r])=>{setFull(f);setPreg(p);setRenal(r);setLoading(false);});
  },[name]);
  const indications=full?.indications||preg?.indications||'';
  const mechanism=full?.mechanism||preg?.mechanism||'';
  const dosage=full?.dosage||preg?.dosage||'';
  const pregCat=(preg?.pregnancyCategory||'').replace(/[^A-Za-z]/g,'').toUpperCase();
  const lactCat=(preg?.lactationCategory||'').trim().toUpperCase();
  const piColor=PREG_INFO[pregCat]?.color||'';
  const liColor=LACT_INFO[lactCat]?.color||'';
  const hasAny=!loading&&(indications||mechanism||dosage||pregCat||renal);
  return(
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-dark-card" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-50 transition-colors">
        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg>
        </div>
        <div className="flex-1 min-w-0 text-start">
          <p className="font-black text-[13px] text-slate-700 dark:text-slate-200 capitalize">{name}</p>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            {pregCat&&<span className={`text-[9px] font-black ${piColor}`}>🤰 {pregCat}</span>}
            {lactCat&&<span className={`text-[9px] font-black ${liColor}`}>🍼 {lactCat}</span>}
            {renal&&<span className="text-[9px] font-black text-cyan-600">🫘 Renal</span>}
            {loading&&<span className="text-[9px] text-slate-400">{ar?'جارٍ التحميل...':'Loading...'}</span>}
            {!loading&&!hasAny&&<span className="text-[9px] text-slate-400">{ar?'لا توجد بيانات':'No data'}</span>}
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open&&hasAny&&(
        <div className="border-t border-slate-50 dark:border-slate-800 px-4 pb-4 pt-3 space-y-3">
          {indications&&<div><p className="text-[10px] font-black uppercase text-teal-600 mb-1">{ar?'دواعي الاستخدام':'Indications'}</p><TextBlock text={indications}/></div>}
          {mechanism&&<div><p className="text-[10px] font-black uppercase text-blue-600 mb-1">{ar?'آلية العمل':'Mechanism'}</p><TextBlock text={mechanism}/></div>}
          {dosage&&<div><p className="text-[10px] font-black uppercase text-violet-600 mb-1">{ar?'الجرعة':'Dosage'}</p><DosageView text={dosage}/></div>}
          {(pregCat||lactCat)&&preg&&(
            <div className="flex gap-2 flex-wrap">
              {pregCat&&PREG_INFO[pregCat]&&<div className={`flex-1 rounded-xl border p-3 min-w-[120px] ${PREG_INFO[pregCat].bg} ${PREG_INFO[pregCat].border}`}><p className={`text-[10px] font-black ${PREG_INFO[pregCat].color}`}>{ar?'حمل':'Pregnancy'}</p><p className={`text-[18px] font-black ${PREG_INFO[pregCat].color}`}>{pregCat}</p><p className={`text-[11px] ${PREG_INFO[pregCat].color} opacity-80`}>{ar?PREG_INFO[pregCat].labelAr.split('—')[1]||'':PREG_INFO[pregCat].labelEn.split('—')[1]||''}</p></div>}
              {lactCat&&LACT_INFO[lactCat]&&<div className={`flex-1 rounded-xl border p-3 min-w-[120px] ${LACT_INFO[lactCat].bg} ${LACT_INFO[lactCat].border}`}><p className={`text-[10px] font-black ${LACT_INFO[lactCat].color}`}>{ar?'رضاعة':'Lactation'}</p><p className={`text-[18px] font-black ${LACT_INFO[lactCat].color}`}>{lactCat}</p><p className={`text-[11px] ${LACT_INFO[lactCat].color} opacity-80`}>{ar?LACT_INFO[lactCat].labelAr:LACT_INFO[lactCat].labelEn}</p></div>}
            </div>
          )}
          {renal&&<div><p className="text-[10px] font-black uppercase text-cyan-600 mb-1">{ar?'ملاحظة الكلى':'Renal Note'} <span className="text-[8px] text-slate-400 normal-case font-medium">Ashley Publications</span></p><p className="text-[13px] text-slate-600 dark:text-slate-300">{renal.normalDose||renal.clinicalUse||''}</p></div>}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props{scientificName:string;tradeName:string;language:Language;onClose:()=>void;medicine?:Record<string,any>;}

const ClinicalReferencePage:React.FC<Props>=({scientificName,tradeName,language,onClose,medicine})=>{
  const ar=language==='ar';
  const[data,setData]=useState<ClinicalReference|null>(null);
  const[fullData,setFullData]=useState<any|null>(null);
  const[pregData,setPregData]=useState<PregReferenceData|null>(null);
  const[loading,setLoading]=useState(true);
  const[sheet,setSheet]=useState<null|'preg'|'lact'|'renal'>(null);
  const[expanded,setExpanded]=useState<Set<string>>(new Set());

  // Multi-ingredient supplements
  const allIngredients=medicine?String(medicine['Scientific Name']||'').split(',').map(s=>s.trim()).filter(Boolean):[];
  const isMulti=allIngredients.length>1;

  useEffect(()=>{
    let done=false;const finish=()=>{if(!done){done=true;setLoading(false);}};
    getClinicalReference(scientificName,tradeName).then(d=>{setData(d);finish();}).catch(finish);
    fetchFullClinical(scientificName,tradeName).then(d=>{if(d){setFullData(d);finish();}else finish();}).catch(finish);
    getPregReference(scientificName,tradeName).then(d=>{if(d)setPregData(d);}).catch(()=>{});
  },[scientificName,tradeName]);

  const get=(k:string):string=>{for(const src of[fullData,pregData,data]){if(!src)continue;const v=(src as any)[k];if(v&&typeof v==='string'&&v.trim())return v.trim();if(k==='interactions'){const vi=(src as any).drugInteractions;if(vi&&typeof vi==='string'&&vi.trim())return vi.trim();}}return'';};

  const pregCat=(pregData?.pregnancyCategory||'').replace(/[^A-Za-z]/g,'').toUpperCase();
  const lactCat=(pregData?.lactationCategory||'').trim().toUpperCase();
  const pi=PREG_INFO[pregCat]; const li=LACT_INFO[lactCat];

  const indications=get('indications'); const mechanism=get('mechanism'); const dosage=get('dosage');
  const interactions=get('interactions');
  const maternalConsiderations=get('maternalConsiderations');
  const fetalConsiderations=get('fetalConsiderations');
  const breastfeedingSafety=get('breastfeedingSafety');
  const summaryNotes=get('summaryNotes');
  const hasMain=!loading&&(data||fullData||pregData);
  // Check if any text section has real content
  const hasAnyText = !!(indications||mechanism||dosage||maternalConsiderations||fetalConsiderations||breastfeedingSafety||summaryNotes||interactions);

  const SECTIONS_LIST=[
    {key:'indications',labelEn:'Indications',labelAr:'دواعي الاستخدام',color:'text-teal-700 dark:text-teal-400',bg:'bg-teal-50 dark:bg-teal-900/20',iconKey:'indications',text:indications},
    {key:'mechanism',labelEn:'Mechanism',labelAr:'آلية العمل',color:'text-blue-700 dark:text-blue-400',bg:'bg-blue-50 dark:bg-blue-900/20',iconKey:'mechanism',text:mechanism},
    {key:'dosage',labelEn:'Dosage',labelAr:'الجرعة',color:'text-violet-700 dark:text-violet-400',bg:'bg-violet-50 dark:bg-violet-900/20',iconKey:'dosage',text:dosage},
    {key:'maternalConsiderations',labelEn:'Maternal Considerations',labelAr:'اعتبارات الأم الحامل',color:'text-rose-700 dark:text-rose-400',bg:'bg-rose-50 dark:bg-rose-900/20',iconKey:'maternal',text:maternalConsiderations},
    {key:'fetalConsiderations',labelEn:'Fetal Considerations',labelAr:'اعتبارات الجنين',color:'text-pink-700 dark:text-pink-400',bg:'bg-pink-50 dark:bg-pink-900/20',iconKey:'fetal',text:fetalConsiderations},
    {key:'breastfeedingSafety',labelEn:'Breastfeeding Safety',labelAr:'الرضاعة الطبيعية',color:'text-orange-700 dark:text-orange-400',bg:'bg-orange-50 dark:bg-orange-900/20',iconKey:'lactation',text:breastfeedingSafety},
    {key:'summaryNotes',labelEn:'Summary Notes',labelAr:'ملاحظات موجزة',color:'text-slate-600 dark:text-slate-400',bg:'bg-slate-100 dark:bg-slate-800',iconKey:'summary',text:summaryNotes},
    {key:'interactions',labelEn:'Drug Interactions',labelAr:'التفاعلات الدوائية',color:'text-amber-700 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-900/20',iconKey:'interactions',text:interactions},
    {key:'renalDosing',labelEn:'Renal Dosing',labelAr:'جرعات قصور الكلى',color:'text-cyan-700 dark:text-cyan-400',bg:'bg-cyan-50 dark:bg-cyan-900/20',iconKey:'renal',text:''},
  ];

  const sectionIcons:Record<string,React.ReactNode>={
    indications:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
    mechanism:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg>,
    dosage:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
    maternal:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2a5 5 0 015 5c0 5-5 13-5 13S7 12 7 7a5 5 0 015-5z"/><circle cx="12" cy="7" r="2"/></svg>,
    fetal:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    lactation:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    summary:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    interactions:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
    renal:<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="12" rx="4" ry="7"/><path d="M8 12c-4 0-5 2-5 2s1 4 9 4 9-4 9-4-1-2-5-2"/></svg>,
  };

  // Swipe down to close ClinicalReferencePage
  const touchStartY = React.useRef(0);
  const handlePageTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handlePageTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) onClose(); // swipe down 80px → close
  };

  return(
    <div className="fixed inset-0 z-[500] bg-slate-50 dark:bg-dark-bg flex flex-col" data-overlay="true"
      style={{direction:ar?'rtl':'ltr'}}
      onTouchStart={handlePageTouchStart}
      onTouchEnd={handlePageTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform">
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={ar?"M9 5l7 7-7 7":"M15 19l-7-7 7-7"}/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-[14px] text-slate-800 dark:text-white truncate">{tradeName}</h1>
          <p className="text-[11px] text-slate-400 truncate">{scientificName}</p>
        </div>
        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 rounded-xl flex-shrink-0">{ar?'المرجع السريري':'Clinical Ref'}</span>
      </div>

      {/* Category badges — always show */}
      <div className="flex-shrink-0 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {pregData&&pregCat&&pi&&(
          <button onClick={()=>setSheet('preg')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border active:scale-95 transition-all ${pi.bg} ${pi.border}`}>
            <span className={`text-[12px] font-black ${pi.color}`}>{ar?'حمل':'Preg'}: <span className="text-[15px]">{pregCat}</span></span>
            <svg className={`w-3 h-3 ${pi.color} opacity-50`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
        )}
        {pregData&&lactCat&&li&&(
          <button onClick={()=>setSheet('lact')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border active:scale-95 transition-all ${li.bg} ${li.border}`}>
            <span className={`text-[12px] font-black ${li.color}`}>{ar?'رضاعة':'Lact'}: <span className="text-[15px]">{lactCat}</span></span>
            <svg className={`w-3 h-3 ${li.color} opacity-50`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
        )}
        <button onClick={()=>setSheet('renal')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 active:scale-95 transition-all">
          <svg className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><ellipse cx="12" cy="12" rx="4" ry="7"/><path d="M8 12c-4 0-5 2-5 2s1 4 9 4 9-4 9-4-1-2-5-2"/></svg>
          <span className="text-[12px] font-black text-cyan-600 dark:text-cyan-400">{ar?'الكلى':'Renal'}</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{paddingBottom:'calc(env(safe-area-inset-bottom)+24px)'}}>

        {loading&&(
          <div className="space-y-2">
            {[1,2,3,4].map(i=>(
              <div key={i} className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 h-14 animate-pulse" style={{opacity:1-i*0.15}}/>
            ))}
          </div>
        )}

        {!loading&&!data&&!fullData&&!pregData&&(
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-black text-slate-500 text-[14px]">{ar?'لا توجد بيانات سريرية':'No clinical data available'}</p>
          </div>
        )}

        {/* Multi-ingredient supplement view */}
        {!loading&&isMulti&&(
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 pb-1">{ar?'البيانات السريرية لكل مكوّن':'Clinical Data Per Ingredient'}</p>
            {allIngredients.map(ing=><IngredientClinical key={ing} name={ing} language={language}/>)}
          </div>
        )}

        {/* Single ingredient: accordion list */}
        {hasMain&&!isMulti&&!hasAnyText&&!loading&&(
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-center">
            <p className="text-[13px] text-slate-400">{ar?'لا توجد بيانات سريرية نصية — راجع بيانات الكلى أدناه':'No text clinical data — see Renal Dosing below'}</p>
          </div>
        )}
        {hasMain&&!isMulti&&SECTIONS_LIST.map(sec=>{
          const alwaysShow = !loading && sec.key==='renalDosing';
          const showInteractions = !loading && sec.key==='interactions' && (interactions||fullData);
          const hasContent=alwaysShow||showInteractions||(sec.text&&sec.text.trim()&&sec.text!=='nan'&&sec.text!=='—');
          if(!hasContent)return null;
          const isOpen=expanded.has(sec.key);
          return(
            <div key={sec.key} className="bg-white dark:bg-dark-card rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <button onClick={()=>setExpanded(p=>{const n=new Set(p);n.has(sec.key)?n.delete(sec.key):n.add(sec.key);return n;})} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${sec.bg}`}>
                  <span className={sec.color}>{sectionIcons[sec.iconKey]}</span>
                </div>
                <span className="flex-1 font-black text-[14px] text-slate-700 dark:text-slate-200">{ar?sec.labelAr:sec.labelEn}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div style={{display:'grid',gridTemplateRows:isOpen?'1fr':'0fr',transition:'grid-template-rows 0.15s ease-out',contain:'layout'}}>
                <div style={{overflow:'hidden'}}>
                  <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800">
                    {sec.key==='interactions'?<InteractionsView scientificName={scientificName} tradeName={tradeName} fallbackText={interactions} language={language}/>
                    :sec.key==='renalDosing'?<RenalContent scientificName={scientificName} tradeName={tradeName} language={language}/>
                    :sec.key==='dosage'?<DosageView text={sec.text}/>
                    :<TextBlock text={sec.text}/>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {hasMain&&!loading&&<p className="text-[10px] text-slate-400 text-center pt-1 pb-2">{ar?'⚠️ للمرجعية السريرية فقط. راجع دائماً المصادر الرسمية.':'⚠️ For clinical reference only. Always consult official sources.'}</p>}
      </div>

      {/* Bottom sheets */}
      {sheet==='preg'&&pregData&&<PregLactSheet pregData={pregData} mode="preg" language={language} onClose={()=>setSheet(null)}/>}
      {sheet==='lact'&&pregData&&<PregLactSheet pregData={pregData} mode="lact" language={language} onClose={()=>setSheet(null)}/>}
    </div>
  );
};

export default ClinicalReferencePage;
