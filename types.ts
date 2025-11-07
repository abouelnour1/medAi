import { TranslationKeys } from './translations';
import { Part } from '@google/genai';

export interface Medicine {
  RegisterNumber: string;
  ReferenceNumber: string;
  "Old register Number": string;
  "Product type": string;
  DrugType: string;
  "Sub-Type": string;
  "Scientific Name": string;
  "Trade Name": string;
  Strength: string;
  StrengthUnit: string;
  PharmaceuticalForm: string;
  AdministrationRoute: string;
  AtcCode1: string;
  AtcCode2: string;
  Size: string;
  SizeUnit: string;
  PackageTypes: string;
  PackageSize: string;
  "Legal Status": string;
  "Product Control": string;
  "Distribute area": string;
  "Public price": string;
  shelfLife: string;
  "Storage conditions": string;
  "Storage Condition Arabic": string;
  "Marketing Company": string;
  "Marketing Country": string;
  "Manufacture Name": string;
  "Manufacture Country": string;
  "Secondry package  manufacture": string;
  "Main Agent": string;
  "Secosnd Agent": string;
  "Third agent": string;
  "Description Code": string;
  "Authorization Status": string;
  "Last Update": string;
}

export interface InsuranceDrug {
  indication: string;
  icd10Code: string;
  drugClass: string;
  drugSubclass: string;
  scientificName: string;
  atcCode: string;
  form: string;
  strength: string;
  strengthUnit: string;
  notes: string;
  administrationRoute?: string;
  substitutable?: string;
  prescribingEdits?: string;
  mddAdults?: string;
  mddPediatrics?: string;
  appendix?: string;
  patientType?: string;
  descriptionCode?: string;
  sfdaRegistrationStatus?: string;
}

export type ProductTypeFilter = 'all' | 'medicine' | 'supplement';

export type View = 'search' | 'addData' | 'details' | 'results' | 'alternatives' | 'settings' | 'chatHistory' | 'insuranceSearch' | 'addInsuranceData' | 'addGuidelinesData' | 'clinicalAssistant' | 'prescriptions' | 'insuranceDetails';

export type TextSearchMode = 'tradeName' | 'scientificName' | 'all';

export type InsuranceSearchMode = 'scientificName' | 'tradeName' | 'indication' | 'icd10Code';

export interface Filters {
  productType: ProductTypeFilter;
  priceMin: string;
  priceMax: string;
  pharmaceuticalForm: string;
  manufactureName: string[];
  legalStatus: string;
}

export type Language = 'ar' | 'en';
export type TFunction = (key: TranslationKeys, replacements?: { [key: string]: string | number }) => string;

export type Tab = 'search' | 'insurance' | 'prescriptions' | 'assistant' | 'settings';

export type SortByOption = 'alphabetical' | 'scientificName' | 'priceAsc' | 'priceDesc';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Part[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface PrescriptionData {
  id: string;
  hospitalName?: string;
  hospitalAddress?: string;
  crNumber?: string;
  taxNumber?: string;
  licenseNumber?: string;
  patientName?: string;
  patientNameAr?: string;
  patientId?: string;
  patientAge?: string;
  patientGender?: string;
  fileNumber?: string;
  date?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  policy?: string;
  insuranceCompany?: string;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  drugs?: {
      code: string;
      genericName: string;
      tradeName: string;
      dosage: string;
      usageMethod: string;
      usageMethodAr: string;
      quantity: string;
  }[];
}

export interface UnifiedSearchResult {
  scientificName: string;
  insurancePolicies: InsuranceDrug[];
  availableMedicines: Medicine[];
}

export interface ScientificGroupData {
    scientificName: string;
    policies: InsuranceDrug[];
    availableMedicines: Medicine[];
    matchingTradeNames?: string[];
}

export interface SelectedInsuranceData {
    indication: string;
    scientificGroup: ScientificGroupData;
}