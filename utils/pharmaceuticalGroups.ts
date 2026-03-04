/**
 * تصنيف أشكال الدواء في مجموعات منطقية
 * للاستخدام في: الفلاتر + البدائل
 */

export type PharmGroup =
  | 'solid'      // حبوب وكبسولات
  | 'liquid'     // سوائل وشراب
  | 'injection'  // حقن
  | 'topical'    // موضعي
  | 'inhaled'    // استنشاق
  | 'rectal'     // تحاميل وحقن شرجية
  | 'eye_ear'    // قطرات عيون وأذن
  | 'nasal'      // أنف
  | 'vaginal'    // مهبلي
  | 'other';     // أخرى

export const PHARM_GROUP_LABELS: Record<PharmGroup, { ar: string; en: string; icon: string }> = {
  solid:     { ar: 'أقراص وكبسولات', en: 'Tablets & Capsules',    icon: '💊' },
  liquid:    { ar: 'سوائل وشراب',    en: 'Liquids & Syrups',      icon: '🧪' },
  injection: { ar: 'حقن',            en: 'Injections',             icon: '💉' },
  topical:   { ar: 'موضعي',          en: 'Topical',                icon: '🧴' },
  inhaled:   { ar: 'استنشاق',        en: 'Inhalation',             icon: '🫁' },
  rectal:    { ar: 'تحاميل',         en: 'Rectal',                 icon: '🔵' },
  eye_ear:   { ar: 'قطرات عيون/أذن', en: 'Eye & Ear Drops',       icon: '👁️' },
  nasal:     { ar: 'أنف',            en: 'Nasal',                  icon: '👃' },
  vaginal:   { ar: 'مهبلي',          en: 'Vaginal',                icon: '🔴' },
  other:     { ar: 'أخرى',           en: 'Other',                  icon: '📦' },
};

// map كل form لـ group بتاعها
const FORM_TO_GROUP: Record<string, PharmGroup> = {
  // ── Solid ──────────────────────────────────────────────────────
  'tablet': 'solid',
  'capsule': 'solid',
  'capsule, soft': 'solid',
  'capsule, hard': 'solid',
  'film-coated tablet': 'solid',
  'coated tablet': 'solid',
  'gastro-resistant tablet': 'solid',
  'gastro-resistant coated tablet': 'solid',
  'gastro-resistant capsule': 'solid',
  'gastro-resistant capsule, hard': 'solid',
  'enteric-coated tablet': 'solid',
  'prolonged-release tablet': 'solid',
  'prolonged-release film-coated tablet': 'solid',
  'prolonged-release capsule': 'solid',
  'prolonged-release capsule, hard': 'solid',
  'modified-release capsule': 'solid',
  'modified-release capsule, hard': 'solid',
  'modified-release capsule, soft': 'solid',
  'modified-release film-coated tablet': 'solid',
  'extended-release tablet': 'solid',
  'extended-release capsule': 'solid',
  'sustained-release tablet': 'solid',
  'delayed-release tablet': 'solid',
  'delayed-release capsule': 'solid',
  'chewable tablet': 'solid',
  'chewable/dispersible tablet': 'solid',
  'dispersible tablet': 'solid',
  'effervescent tablet': 'solid',
  'orodispersible tablet': 'solid',
  'tablet, orally disintegrating': 'solid',
  'soluble tablet': 'solid',
  'scored tablet': 'solid',
  'sublingual tablet': 'solid',
  'caplet': 'solid',
  'lozenge': 'solid',
  'modified-release tablet': 'solid',
  'oral lyophilisate': 'solid',
  'orodispersible film': 'solid',
  'medicated chewing-gum': 'solid',
  'pessary': 'solid',
  'implant': 'solid',
  'implant in pre-filled syringe': 'solid',

  // ── Liquid ─────────────────────────────────────────────────────
  'syrup': 'liquid',
  'solution': 'liquid',
  'oral solution': 'liquid',
  'oral suspension': 'liquid',
  'oral drops': 'liquid',
  'oral drops, solution': 'liquid',
  'oral liquid': 'liquid',
  'oral gel': 'liquid',
  'oral emulsion': 'liquid',
  'oral powder': 'liquid',
  'powder for oral solution': 'liquid',
  'powder for oral suspension': 'liquid',
  'powder for oral/rectal suspension': 'liquid',
  'granules for oral solution': 'liquid',
  'granules for oral suspension': 'liquid',
  'granules for suspension': 'liquid',
  'granules': 'liquid',
  'granules in sachet': 'liquid',
  'effervescent granules': 'liquid',
  'effervescent powder': 'liquid',
  'powder': 'liquid',
  'powder for suspension': 'liquid',
  'prolonged-release granules': 'liquid',
  'gastroenteral solution': 'liquid',
  'mouthwash': 'liquid',
  'drops concentrate for solution for injection': 'liquid',

  // ── Injection ──────────────────────────────────────────────────
  'solution for injection': 'injection',
  'injection': 'injection',
  'powder for injection': 'injection',
  'powder for solution for injection': 'injection',
  'powder for solution for infusion': 'injection',
  'powder for infusion': 'injection',
  'solution for infusion': 'injection',
  'solution for injection/infusion': 'injection',
  'concentrate for solution for infusion': 'injection',
  'solution for injection in pre-filled syringe': 'injection',
  'solution for injection in cartridge': 'injection',
  'solution for injection in pre-filled pen': 'injection',
  'suspension for injection': 'injection',
  'suspension for injection in pre-filled syringe': 'injection',
  'suspension for injection in pre-filled pen': 'injection',
  'emulsion for injection': 'injection',
  'emulsion for injection/infusion': 'injection',
  'emulsion for infusion': 'injection',
  'powder and solvent for solution for injection': 'injection',
  'powder and solvent for suspension for injection': 'injection',
  'powder and solvent for solution for infusion': 'injection',
  'powder and solvent for solution for injection/infusion': 'injection',
  'powder and solution for solution for injection': 'injection',
  'powder and solvent for prolonged-release suspension for injection': 'injection',
  'powder and solvent for suspension for injection in pre-filled syringe': 'injection',
  'powder and suspension for suspension for injection': 'injection',
  'concentrate and diluent for solution for infusion': 'injection',
  'concentrate and solvent for solution for infusion': 'injection',
  'concentrate and solvent for solution for injection': 'injection',
  'powder for concentrate for solution for infusion': 'injection',
  'powder for concentrate for dispersion for infusion': 'injection',
  'powder for solution for injection/infusion': 'injection',
  'solution for injection/concentrate for solution for infusion': 'injection',
  'solution for injection/infusion in pre-filled syringe': 'injection',
  'prolonged-release suspension for injection': 'injection',
  'dispersion for infusion': 'injection',
  'suspension for infusion': 'injection',
  'gel for injection': 'injection',
  'lyophilisate for solution for injection': 'injection',
  'lyophilisate for solution for infusion': 'injection',
  'intravenous infusion': 'injection',
  'infusion': 'injection',
  'concentrate for dispersion for injection': 'injection',
  'solution for infusion in cartridge': 'injection',
  'cell suspension for infusion': 'injection',
  'sterile, lyophilized, white powder': 'injection',
  'solution for infusion and oral solution': 'injection',
  'inhalation solution': 'injection',
  'powder for nebuliser solution/solution for injection/infusion': 'injection',
  'solvent for parenteral use': 'injection',
  'solution for haemodialysis': 'injection',
  'solution for haemodialysis/haemofiltration': 'injection',
  'solution for peritoneal dialysis': 'injection',
  'concentrate for solution for haemodialysis': 'injection',
  'powder for concentrate for solution for haemodialysis': 'injection',
  'powder for concentrate for dispersion for injection': 'injection',
  'concentrate for peritoneal dialysis solution': 'injection',
  'intravitreal implant in applicator': 'injection',
  'endotracheopulmonary instillation, suspension': 'injection',
  'powder for bladder irrigation': 'injection',
  'irrigation solution': 'injection',
  'powder and solvent for sealant': 'injection',
  'sealant matrix': 'injection',

  // ── Topical ────────────────────────────────────────────────────
  'cream': 'topical',
  'ointment': 'topical',
  'gel': 'topical',
  'lotion': 'topical',
  'emulsion': 'topical',
  'cutaneous solution': 'topical',
  'cutaneous liquid': 'topical',
  'cutaneous powder': 'topical',
  'cutaneous suspension': 'topical',
  'cutaneous spray, solution': 'topical',
  'cutaneous foam': 'topical',
  'cutaneous patch': 'topical',
  'transdermal patch': 'topical',
  'medicated plaster': 'topical',
  'shampoo': 'topical',
  'scalp solution': 'topical',
  'topical': 'topical',

  // ── Inhaled ────────────────────────────────────────────────────
  'inhalation powder': 'inhaled',
  'inhalation powder, hard capsule': 'inhaled',
  'inhalation powder, pre-dispensed': 'inhaled',
  'pressurised inhalation, solution': 'inhaled',
  'pressurised inhalation, suspension': 'inhaled',
  'pressurised inhalation': 'inhaled',
  'nebuliser solution': 'inhaled',
  'nebuliser suspension': 'inhaled',
  'inhalation vapour, liquid': 'inhaled',
  'inhalation solution': 'inhaled',

  // ── Rectal ─────────────────────────────────────────────────────
  'suppository': 'rectal',
  'suppositories': 'rectal',
  'rectal suspension': 'rectal',
  'rectal ointment': 'rectal',
  'enema': 'rectal',

  // ── Eye & Ear ──────────────────────────────────────────────────
  'eye drops': 'eye_ear',
  'eye drops, solution': 'eye_ear',
  'eye drops, suspension': 'eye_ear',
  'eye drops, emulsion': 'eye_ear',
  'eye drops, solution in single-dose container': 'eye_ear',
  'eye ointment': 'eye_ear',
  'eye gel': 'eye_ear',
  'ophthalmic solution': 'eye_ear',
  'ear drops': 'eye_ear',
  'ear drops, solution': 'eye_ear',
  'ear/eye drops, solution': 'eye_ear',
  'ear/eye/nose drops, solution': 'eye_ear',
  'eye/nose drops': 'eye_ear',

  // ── Nasal ──────────────────────────────────────────────────────
  'nasal drops': 'nasal',
  'nasal drops, solution': 'nasal',
  'nasal drops, suspension': 'nasal',
  'nasal spray': 'nasal',
  'nasal spray, solution': 'nasal',
  'nasal spray, suspension': 'nasal',
  'nasal ointment': 'nasal',
  'spray': 'nasal',
  'solution for spray': 'nasal',

  // ── Vaginal ────────────────────────────────────────────────────
  'vaginal tablet': 'vaginal',
  'vaginal gel': 'vaginal',
  'vaginal cream': 'vaginal',
  'vaginal capsule': 'vaginal',
  'vaginal capsule, soft': 'vaginal',
  'vaginal delivery system': 'vaginal',
  'intrauterine delivery system': 'vaginal',
};

// الـ function الرئيسية
export function getPharmGroup(form: string | undefined): PharmGroup {
  if (!form) return 'other';
  return FORM_TO_GROUP[form.toLowerCase().trim()] ?? 'other';
}

// هل الدوائين ممكن يكونوا بدائل لبعض (نفس الـ group)
export function areSameRouteGroup(form1: string | undefined, form2: string | undefined): boolean {
  const g1 = getPharmGroup(form1);
  const g2 = getPharmGroup(form2);
  if (g1 === 'other' || g2 === 'other') return true; // مش نعاقبهم
  return g1 === g2;
}
