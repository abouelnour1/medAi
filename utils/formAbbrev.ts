/**
 * اختصار أشكال الدواء للعرض في الكارت
 */
const ABBREV_MAP: Record<string, string> = {
  // Tablets
  'tablet': 'Tab',
  'tablets': 'Tab',
  'film-coated tablet': 'F.C. Tab',
  'film coated tablet': 'F.C. Tab',
  'coated tablet': 'C. Tab',
  'gastro-resistant tablet': 'G.R. Tab',
  'gastro-resistant coated tablet': 'G.R. Tab',
  'enteric-coated tablet': 'E.C. Tab',
  'prolonged-release tablet': 'P.R. Tab',
  'prolonged-release film-coated tablet': 'P.R. Tab',
  'modified-release tablet': 'M.R. Tab',
  'modified-release film-coated tablet': 'M.R. Tab',
  'extended-release tablet': 'E.R. Tab',
  'sustained-release tablet': 'S.R. Tab',
  'delayed-release tablet': 'D.R. Tab',
  'chewable tablet': 'Chew. Tab',
  'chewable/dispersible tablet': 'Chew. Tab',
  'dispersible tablet': 'Disp. Tab',
  'effervescent tablet': 'Eff. Tab',
  'orodispersible tablet': 'ODT',
  'tablet, orally disintegrating': 'ODT',
  'soluble tablet': 'Sol. Tab',
  'sublingual tablet': 'S.L. Tab',
  'caplet': 'Caplet',
  'scored tablet': 'Tab',
  // Capsules
  'capsule': 'Cap',
  'capsules': 'Cap',
  'capsule, soft': 'Soft Cap',
  'capsule, hard': 'Hard Cap',
  'gastro-resistant capsule': 'G.R. Cap',
  'gastro-resistant capsule, hard': 'G.R. Cap',
  'prolonged-release capsule': 'P.R. Cap',
  'prolonged-release capsule, hard': 'P.R. Cap',
  'modified-release capsule': 'M.R. Cap',
  'modified-release capsule, hard': 'M.R. Cap',
  'modified-release capsule, soft': 'M.R. Cap',
  'extended-release capsule': 'E.R. Cap',
  'delayed-release capsule': 'D.R. Cap',
  // Liquids
  'syrup': 'Syrup',
  'solution': 'Sol',
  'oral solution': 'Oral Sol',
  'oral suspension': 'Oral Susp',
  'suspension': 'Susp',
  'drops': 'Drops',
  'oral drops': 'Oral Drops',
  'elixir': 'Elixir',
  'emulsion': 'Emulsion',
  'mixture': 'Mix',
  'linctus': 'Linctus',
  'concentrate for solution for infusion': 'Conc. Inf',
  'solution for injection': 'Inj. Sol',
  'solution for infusion': 'Inf. Sol',
  'powder for solution for injection': 'Pwd. Inj',
  'powder for oral solution': 'Pwd. Sol',
  'powder for oral suspension': 'Pwd. Susp',
  'powder for suspension': 'Pwd. Susp',
  'granules': 'Gran',
  'granules for oral suspension': 'Gran. Susp',
  'effervescent granules': 'Eff. Gran',
  // Injections
  'injection': 'Inj',
  'solution for injection/infusion': 'Inj/Inf',
  'vial': 'Vial',
  'ampoule': 'Amp',
  'prefilled syringe': 'Pre-filled Syr',
  'pre-filled syringe': 'Pre-filled Syr',
  'pen': 'Pen',
  'auto-injector': 'Auto-inj',
  // Topical
  'cream': 'Cream',
  'ointment': 'Oint',
  'gel': 'Gel',
  'lotion': 'Lotion',
  'foam': 'Foam',
  'spray': 'Spray',
  'patch': 'Patch',
  'transdermal patch': 'T.D. Patch',
  'shampoo': 'Shampoo',
  'paste': 'Paste',
  'powder': 'Pwd',
  'dusting powder': 'D. Pwd',
  // Eye/Ear
  'eye drops': 'Eye Drops',
  'eye drops, solution': 'Eye Drops',
  'eye drops, suspension': 'Eye Drops Susp',
  'eye ointment': 'Eye Oint',
  'ear drops': 'Ear Drops',
  'eye/ear drops': 'Eye/Ear Drops',
  // Inhaled
  'inhaler': 'Inh',
  'pressurised inhalation': 'pMDI',
  'inhalation powder': 'DPI',
  'dry powder inhaler': 'DPI',
  'nebuliser solution': 'Neb. Sol',
  // Rectal/Other
  'suppository': 'Supp',
  'enema': 'Enema',
  'pessary': 'Pessary',
  'lozenge': 'Loz',
  'implant': 'Implant',
  'nasal spray': 'Nasal Spray',
  'nasal drops': 'Nasal Drops',
  'vaginal tablet': 'Vag. Tab',
  'vaginal cream': 'Vag. Cream',
};

export function abbreviateForm(form: string): string {
  if (!form) return '';
  const lower = form.toLowerCase().trim();
  if (ABBREV_MAP[lower]) return ABBREV_MAP[lower];
  // لو مش موجود → حاول تقصّره لأول كلمتين
  const words = form.split(/\s+/);
  if (words.length <= 2) return form; // قصير أصلاً
  // خد أول كلمة + اختصار الباقي
  return words.slice(0, 2).join(' ');
}
