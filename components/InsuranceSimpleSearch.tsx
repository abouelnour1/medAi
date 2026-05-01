import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { TFunction, Language, InsuranceDrug, Medicine, SelectedInsuranceData, ScientificGroupData, InsuranceSearchMode } from '../types';
import IndicationCard, { IndicationGroup } from './IndicationCard';
import NotCoveredCard from './NotCoveredCard';
import DrugPolicyCard, { DrugGroup } from './DrugPolicyCard';

const JUNK = new Set(['mg','ml','g','mcg','iu','kg','tab','caps','solution','suspension','oral','vial','ampoule','tablet','capsule']);

function normStr(name: string): string {
  // Fast path for short strings
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|kg|tablet|capsule|cap|tab|softgel|%)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(s => s.length > 1 && !JUNK.has(s))
    .join(' ').trim();
}

type SR = IndicationGroup | DrugGroup | { type: 'not-covered'; medicine: Medicine };

interface MedsIndex { byTrade: Map<string,Medicine[]>; bySciNorm: Map<string,Medicine[]>; tradeEntries:{key:string;med:Medicine}[]; sciEntries:{key:string;med:Medicine}[]; }
function compute(term: string, mode: InsuranceSearchMode, meds: Medicine[], ins: InsuranceDrug[], idx?: MedsIndex): SR[] {
  const t = term.toLowerCase().trim();
  if (t.replace(/\*/g,'').length < 1) return [];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const results: SR[] = [];
  const MAX = 80;

  if (mode === 'tradeName' || mode === 'scientificName') {
    const field = mode === 'tradeName' ? 'Trade Name' : 'Scientific Name';
    if(t.length < 2) return [];
    // Use sorted prefix entries for fast O(log n) prefix match
    let sw: Medicine[] = [];
    if (idx) {
      const entries = mode === 'tradeName' ? idx.tradeEntries : idx.sciEntries;
      // Binary search for start of prefix range
      let lo=0, hi=entries.length-1, start=entries.length;
      while(lo<=hi){ const mid=(lo+hi)>>1; if(entries[mid].key>=t){start=mid;hi=mid-1;}else lo=mid+1; }
      const seen = new Set<string>();
      for(let i=start; i<entries.length && entries[i].key.startsWith(t); i++){
        if(!seen.has(entries[i].med.RegisterNumber)){ seen.add(entries[i].med.RegisterNumber); sw.push(entries[i].med); }
        if(sw.length>=MAX) break;
      }
    } else {
      sw = meds.filter(m => String(m[field]||'').toLowerCase().startsWith(t)).slice(0,MAX);
    }
    let matched: Medicine[] = sw;
    if (matched.length < MAX) {
      const swSet = new Set(sw.map((m:Medicine) => m.RegisterNumber));
      // For includes - still need linear scan but limit scope
      const rest = meds.filter((m:Medicine) => !swSet.has(m.RegisterNumber) && String(m[field]||'').toLowerCase().includes(t)).slice(0, MAX - matched.length);
      matched = [...matched, ...rest];
    }
    const food = matched.filter(m => String(m['Product type']||'').toLowerCase() === 'food').slice(0,20);
    const nonFood = matched.filter(m => String(m['Product type']||'').toLowerCase() !== 'food');
    const sciOrder: string[] = [];
    const sciMap = new Map<string, Medicine[]>();
    nonFood.forEach(m => {
      const sci = String(m['Scientific Name']||'');
      if (!sciMap.has(sci)) { sciMap.set(sci,[]); sciOrder.push(sci); }
      sciMap.get(sci)!.push(m);
    });
    sciOrder.forEach(sci => {
      const ms = sciMap.get(sci)!;
      const sn = normStr(sci);
      const policies = ins.filter(p => {
        const pn = normStr(p.scientificName||'');
        const pFirst = normStr((p.scientificName||'').split(/[,\/+&]/)[0]);
        const atc = (ms[0]?.AtcCode1||'').trim().toUpperCase();
        const pAtc = (p.atcCode||'').trim().toUpperCase();
        const medDesc = String((ms[0] as any)?.['Description Code']||'').trim();
        // Priority 1: exact description code
        if (medDesc && p.descriptionCode && p.descriptionCode.trim() === medDesc) return true;
        // Priority 2: exact full ATC match
        if (atc && pAtc && atc === pAtc) return true;
        // Priority 3: full normalized scientific name match only (no partial ingredient match)
        // This prevents amoxicillin from matching amoxicillin/clavulanate policies
        if (sn.length > 3 && pn === sn) return true;
        // First ingredient only if BOTH drugs are single-ingredient (no comma/slash in name)
        const medIsCombo = sci.includes(',') || sci.includes('/') || sci.includes('+');
        const insIsCombo = (p.scientificName||'').includes(',') || (p.scientificName||'').includes('/') || (p.scientificName||'').includes('+');
        if (!medIsCombo && !insIsCombo) {
          const snFirst = normStr(sn.split(/\s/)[0]);
          if (snFirst.length >= 5 && pFirst === snFirst) return true;
        }
        return false;
      });
      if (policies.length > 0) {
        results.push({ type:'drug-grouped', scientificName:sci, tradeNames:ms.map(m=>m['Trade Name']), policies, availableMedicines:ms });
      } else {
        ms.forEach(med => results.push({ type:'not-covered', medicine:med }));
      }
    });
    food.forEach(med => results.push({ type:'not-covered', medicine:med }));
  } else {
    // Use pre-built index if available
    const medsMap = idx?.bySciNorm ?? (() => {
      const m = new Map<string, Medicine[]>();
      meds.forEach(med => { const k = normStr(med['Scientific Name']||''); if (k) { if (!m.has(k)) m.set(k,[]); m.get(k)!.push(med); } });
      return m;
    })();
    const field = mode === 'indication' ? 'indication' : 'icd10Code';
    const matching = ins.filter(p => (p[field as keyof InsuranceDrug]||'').toString().toLowerCase().includes(t)).slice(0,80);
    const byInd = new Map<string, InsuranceDrug[]>();
    matching.forEach(p => {
      const k = p.indication||'General';
      if (!byInd.has(k)) byInd.set(k,[]);
      byInd.get(k)!.push(p);
    });
    byInd.forEach((policies, indication) => {
      const sm = new Map<string, ScientificGroupData>();
      policies.forEach(p => {
        if (!sm.has(p.scientificName)) sm.set(p.scientificName,{ scientificName:p.scientificName, policies:[], availableMedicines:(medsMap.get(normStr(p.scientificName))||[]).slice(0,5) });
        sm.get(p.scientificName)!.policies.push(p);
      });
      results.push({ type:'covered', indication, icd10Codes:Array.from(new Set(policies.map(p=>p.icd10Code))).filter(Boolean) as string[], scientificGroups:Array.from(sm.values()) });
    });
  }
  return results;
}

interface Props {
  t: TFunction; language: Language;
  insuranceData: InsuranceDrug[]; allMedicines: Medicine[];
  onSelectInsuranceData: (data: SelectedInsuranceData) => void;
  searchTerm: string; setSearchTerm: (s: string) => void;
  searchMode: InsuranceSearchMode; setSearchMode: (m: InsuranceSearchMode) => void;
  headerHeight?: number;
  isKeyboardOpen?: boolean;
  renderPart?: 'bar' | 'results' | 'all';
}

const InsuranceSimpleSearch: React.FC<Props> = ({ t, insuranceData, allMedicines, onSelectInsuranceData, searchTerm, setSearchTerm, searchMode, setSearchMode, headerHeight = 97, isKeyboardOpen = false, renderPart = 'all' }) => {
  const deferredSearch = searchTerm; // direct - no defer overhead

  // Pre-index: sorted arrays for fast binary-search-style prefix lookup
  const medsIndex = useMemo(() => {
    const byTrade   = new Map<string, Medicine[]>();
    const bySciNorm = new Map<string, Medicine[]>();
    // Also build prefix-sorted lists for fast startsWith
    const tradeEntries: {key:string; med:Medicine}[] = [];
    const sciEntries:   {key:string; med:Medicine}[] = [];

    allMedicines.forEach(m => {
      const trade = String(m['Trade Name']   || '').toLowerCase().trim();
      const sciN  = normStr(String(m['Scientific Name'] || ''));
      if (trade) {
        if (!byTrade.has(trade)) byTrade.set(trade, []);
        byTrade.get(trade)!.push(m);
        tradeEntries.push({key: trade, med: m});
      }
      if (sciN) {
        if (!bySciNorm.has(sciN)) bySciNorm.set(sciN, []);
        bySciNorm.get(sciN)!.push(m);
        sciEntries.push({key: sciN, med: m});
      }
    });
    // Sort for prefix matching
    tradeEntries.sort((a,b) => a.key.localeCompare(b.key));
    sciEntries.sort((a,b) => a.key.localeCompare(b.key));
    return { byTrade, bySciNorm, tradeEntries, sciEntries };
  }, [allMedicines]);
  const [input, setInput] = useState(searchTerm);
  const [classFilter, setClassFilter] = useState<string>('');

  // Build unique classes from results
  // Instant synchronous results - no loading state
  const results = useMemo(() => {
    if (!deferredSearch || deferredSearch.replace(/\*/g,'').length < 1) return [];
    try { return compute(deferredSearch, searchMode, allMedicines, insuranceData, medsIndex); }
    catch { return []; }
  }, [deferredSearch, searchMode, allMedicines, insuranceData, medsIndex]);

  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    results.forEach(r => {
      if (r.type === 'drug-grouped') r.policies?.forEach(p => p.drugClass && classes.add(p.drugClass));
      if (r.type === 'covered') r.scientificGroups?.forEach(sg => sg.policies?.forEach(p => p.drugClass && classes.add(p.drugClass)));
    });
    classes.delete('');
    return Array.from(classes).sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!classFilter) return results;
    return results.filter(r => {
      if (r.type === 'drug-grouped') return r.policies?.some(p => p.drugClass === classFilter || p.drugSubclass === classFilter);
      if (r.type === 'covered') return r.scientificGroups?.some(sg => sg.policies?.some(p => p.drugClass === classFilter || p.drugSubclass === classFilter));
      if (r.type === 'not-covered') return String(r.medicine?.['Scientific Name'] || '').includes(classFilter);
      return true;
    });
  }, [results, classFilter]);

  useEffect(() => {
    const h = setTimeout(() => { if (input !== searchTerm) setSearchTerm(input); }, 30);
    return () => clearTimeout(h);
  }, [input]);


  const MODES = [
    { id:'tradeName' as const, label: t('tradeName')||'Trade Name' },
    { id:'scientificName' as const, label: t('scientificName')||'Scientific' },
    { id:'indication' as const, label: t('indication')||'Indication' },
    { id:'icd10Code' as const, label: 'ICD-10' },
  ];

  const barEl = (
      <div style={{ width:'100%', paddingBottom:8 }}>
        <div style={{ background:'var(--surface)', borderRadius:14, border:'1.5px solid var(--border)', boxShadow:'0 2px 8px rgba(0,106,96,0.07)', overflow:'hidden' }}>
          <div style={{ display:'flex', gap:6, padding:'8px 12px 0', overflowX:'auto' }} className="no-scrollbar">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setSearchMode(m.id)} style={{ padding:'4px 11px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', fontSize:11, fontWeight:700, flexShrink:0, background:searchMode===m.id?'var(--primary)':'var(--surface-2)', color:searchMode===m.id?'#fff':'var(--text-muted)' }}>{m.label}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px 10px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('insuranceSearchPlaceholder')||'Search...'} style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:15, color:'var(--text)', fontFamily:'inherit' }} autoComplete="off" autoCorrect="off" spellCheck={false} />
            {input ? <button onClick={() => { setInput(''); setSearchTerm(''); }} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--text-subtle)', display:'flex', padding:2 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button> : null}
          </div>
        </div>
      </div>
  );

  const resultsEl = (
      <div style={{ display:'flex', flexDirection:'column', gap:10, paddingBottom:80, overflow:'hidden', maxWidth:'100%' }}>
        
        {results.map((r,i) => {
          if (r.type==='covered') return <IndicationCard key={'c'+i} group={r} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
          if (r.type==='drug-grouped') return <DrugPolicyCard key={'d'+i} group={r} t={t} onSelectInsuranceData={onSelectInsuranceData} />;
          if (r.type==='not-covered') return <NotCoveredCard key={'n'+i} medicine={r.medicine} t={t} />;
          return null;
        })}
        {!searchTerm && (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-subtle)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin:'0 auto 12px', display:'block', opacity:0.4 }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <p style={{ fontSize:13, fontWeight:600 }}>{t('insuranceSearchPlaceholder')||'Search for condition, drug, or code...'}</p>
          </div>
        )}
      </div>
  );

  if (renderPart === 'bar') return <>{barEl}</>;
  if (renderPart === 'results') return <div style={{ display:'flex', flexDirection:'column', minHeight:400 }}>{resultsEl}</div>;
  return <div style={{ display:'flex', flexDirection:'column', minHeight:400 }}>{barEl}{resultsEl}</div>;
};

export default InsuranceSimpleSearch;
