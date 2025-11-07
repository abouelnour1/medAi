import { TFunction } from '../types';

interface FormGroup {
  label: string;
  keywords: string[];
}

export const groupPharmaceuticalForms = (forms: string[], t: TFunction) => {
  const formGroups: FormGroup[] = [
    { label: t('solidDosageForms'), keywords: ['tablet', 'capsule', 'powder', 'lozenge', 'granules', 'sachet', 'f.c. tablet', 'film-coated', 'أقراص', 'كبسولات'] },
    { label: t('liquidDosageForms'), keywords: ['syrup', 'suspension', 'solution', 'emulsion', 'drops', 'oral', 'شراب', 'معلق', 'محلول', 'نقط'] },
    { label: t('parenteralDosageForms'), keywords: ['injection', 'infusion', 'vial', 'ampoule', 'pre-filled syringe', 'i-a injection', 'حقن', 'وريد'] },
    { label: t('semiSolidDosageForms'), keywords: ['cream', 'ointment', 'gel', 'paste', 'suppository', 'كريم', 'مرهم', 'جل', 'لبوس'] },
    { label: t('inhalationalDosageForms'), keywords: ['inhaler', 'spray', 'nebuliser', 'inhalation', 'nasal', 'بخاخ', 'استنشاق', 'رذاذ'] },
    { label: t('specialDosageForms'), keywords: ['patch', 'implant', 'film', 'eye', 'otic', 'ear', 'ophthalmic', 'لصقات', 'عين', 'أنف'] },
  ];
  
  const categorized: { [key: string]: Set<string> } = {};
  const uncategorized: string[] = [];
  
  forms.forEach(form => {
    const lowerForm = form.toLowerCase();
    let assigned = false;
    for (const group of formGroups) {
      if (group.keywords.some(keyword => lowerForm.includes(keyword))) {
        if (!categorized[group.label]) {
          categorized[group.label] = new Set();
        }
        categorized[group.label].add(form);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      uncategorized.push(form);
    }
  });

  const result: { label: string; options: string[] }[] = formGroups
    .filter(group => categorized[group.label])
    .map(group => ({
      label: group.label,
      options: Array.from(categorized[group.label]).sort(),
    }));

  if (uncategorized.length > 0) {
    result.push({
      label: t('otherForms'),
      options: uncategorized.sort(),
    });
  }
  
  return result;
};
