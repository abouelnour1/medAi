import { InsuranceDrug } from '../types';

/**
 *  أضف بيانات التأمين المخصصة الخاصة بك هنا في هذه المصفوفة
 *  Add your custom insurance data here in this array.
 *  This data will be automatically loaded and merged into the application.
 *
 *  Example object structure:
 *  {
 *    indication: "DIABETES MELLITUS TYPE 2",
 *    icd10Code: "E11",
 *    drugClass: "BIGUANIDES",
 *    drugSubclass: "", // Optional, can be an empty string
 *    scientificName: "METFORMIN",
 *    atcCode: "A10BA02",
 *    form: "Tablet", // Or "Varies" if applicable to multiple forms
 *    strength: "500", // Or "Varies"
 *    strengthUnit: "mg",
 *    notes: "First line oral hypoglycemic agent."
 *  }
 */
export const CUSTOM_INSURANCE_DATA: InsuranceDrug[] = [
  {
    indication: "CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD)",
    icd10Code: "J44",
    drugClass: "EXPECTORANTS, EXCL. COMBINATIONS WITH COUGH SUPPRESSANTS",
    drugSubclass: "MUCOLYTICS",
    scientificName: "CARBOCYSTEINE",
    atcCode: "R05CB03",
    form: "Syrup",
    strength: "500",
    strengthUnit: "mg/ml",
    notes: "PA: THEY SHOULDN’T BE ROUTINELY USED TO PREVENT EXACERBATIONS IN PEOPLE WITH STABLE COPD.\nA SPECIALIST SHOULD CONFIRM THAT THE PATIENT IS WITH CHRONIC PRODUCTIVE COUGH WITH SPUTUM AND CAN BE CONTINUED IF THERE IS SYMPTOMATIC IMPROVEMENT."
  },
  {
    indication: "CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD)",
    icd10Code: "J44",
    drugClass: "EXPECTORANTS, EXCL. COMBINATIONS WITH COUGH SUPPRESSANTS",
    drugSubclass: "MUCOLYTICS",
    scientificName: "CARBOCYSTEINE",
    atcCode: "R05CB03",
    form: "Syrup",
    strength: "20",
    strengthUnit: "mg/ml",
    notes: "PA: THEY SHOULDN’T BE ROUTINELY USED TO PREVENT EXACERBATIONS IN PEOPLE WITH STABLE COPD.\nA SPECIALIST SHOULD CONFIRM THAT THE PATIENT IS WITH CHRONIC PRODUCTIVE COUGH WITH SPUTUM AND CAN BE CONTINUED IF THERE IS SYMPTOMATIC IMPROVEMENT."
  },
  {
    indication: "CHRONIC OBSTRUCTIVE PULMONARY DISEASE (COPD)",
    icd10Code: "J44",
    drugClass: "MACROLIDES, LINCOSAMIDES AND STREPTOGRAMINS",
    drugSubclass: "MACROLIDES",
    scientificName: "ERYTHROMYCIN",
    atcCode: "J01FA01",
    form: "Capsule",
    strength: "250",
    strengthUnit: "mg",
    notes: "QL:  SHOULD BE USED FOR ONE YEAR IN PATIENTS PRONE TO EXACERBATIONS."
  }
];