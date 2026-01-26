
import { TranslationKeys } from './translations';

export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'info' | 'alert' | 'update' | 'approval_request' | 'request_result';
  isRead?: boolean;
  relatedId?: string; // ID of the medicine or update request
  targetUserId?: string; // If set, only this user sees it
  targetRole?: 'admin' | 'premium' | 'company'; // New: If set, only users with this role see it
}

export interface PendingUpdate {
  id: string;
  medicineId?: string; // Empty if it's a new medicine
  type: 'add' | 'edit';
  newData: Partial<Medicine>;
  originalData?: Partial<Medicine>;
  submittedBy: string;
  submittedByName: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

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
  
  imgBox?: string;
  imgIndex1?: string;
  imgIndex2?: string;
  imgPill?: string;
  pillShape?: string;
  pillScored?: string;
  pillMarkings?: string;
  liquidTaste?: string;
  liquidColor?: string;
  physicalNotes?: string;
}

export interface InsuranceDrug {
  id?: string;
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

export interface Cosmetic {
  id: string;
  BrandName: string;
  SpecificName: string;
  SpecificNameAr?: string;
  FirstSubCategoryAr?: string;
  FirstSubCategoryEn?: string;
  SecondSubCategoryAr?: string;
  SecondSubCategoryEn?: string;
  manufacturerNameEn: string;
  manufacturerCountryAr?: string;
  manufacturerCountryEn: string;
  "Active ingredient"?: string;
  "Key Ingredients"?: string;
  Highlights?: string;
}

export interface MilkProduct {
  id: string;
  brand: string;
  productName: string;
  stageType: string;
  ageRange: string;
  image?: string;
  
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  
  keyFeatures: string;
  usp: string; 
  
  explanation?: {
    type?: {
      title: string;
      description: string;
      when_to_use: string;
      benefits: string;
      side_effects: string;
    }
  };
}

export type ProductTypeFilter = 'all' | 'medicine' | 'supplement';

export type View = 'search' | 'addData' | 'details' | 'results' | 'alternatives' | 'settings' | 'chatHistory' | 'insuranceSearch' | 'addInsuranceData' | 'addCosmeticsData' | 'cosmeticsSearch' | 'cosmeticDetails' | 'prescriptions' | 'insuranceDetails' | 'login' | 'register' | 'admin' | 'favorites' | 'verifyEmail' | 'aiHistory' | 'milkSearch' | 'notifications' | 'imageView';

export type TextSearchMode = 'tradeName' | 'scientificName' | 'all';

export type InsuranceSearchMode = 'scientificName' | 'tradeName' | 'indication' | 'icd10Code';

export interface Filters {
  productType: ProductTypeFilter;
  priceMin: string;
  priceMax: string;
  pharmaceuticalForm: string;
  manufactureName: string[];
  marketingCompany: string[];
  mainAgent: string[];
  legalStatus: string;
}

export type Language = 'ar' | 'en';
export type TFunction = (key: TranslationKeys, replacements?: { [key: string]: string | number }) => string;

export type Tab = 'search' | 'insurance' | 'prescriptions' | 'cosmetics' | 'milk' | 'settings';

export type SortByOption = 'alphabetical' | 'scientificName' | 'priceAsc' | 'priceDesc';

export interface SerializablePart {
  text?: string;
  thought?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args: any;
    id?: string;
  };
  functionResponse?: {
    name: string;
    response: any;
    id?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: SerializablePart[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'premium' | 'company'; 
  aiRequestCount: number;
  customAiLimit?: number;
  lastRequestDate: string; 
  status: 'active' | 'pending';
  emailVerified: boolean; 
  email?: string;
  prescriptionPrivilege?: boolean;
}

export interface AppSettings {
  aiRequestLimit: number;
  isAiEnabled: boolean;
}

export interface DrugInPrescription {
  tradeName: string;
  genericName: string;
  dosage: string;
  usageMethod: string;
  usageMethodAr?: string;
  quantity: number;
}

export interface PrescriptionData {
  id: string;
  hospitalName?: string;
  hospitalAddress?: string;
  patientName: string;
  patientId?: string;
  fileNumber?: string;
  date: string;
  insuranceCompany: string;
  doctorName: string;
  doctorNameAr?: string;
  doctorSpecialty?: string;
  diagnosisDescription: string;
  drugs: DrugInPrescription[];
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

export interface ProductSuggestion {
  name: string;
  concentration: string;
  price?: string;
  selling_point: string;
}

export interface Recommendation {
  category: string;
  rationale: string;
  products: ProductSuggestion[];
}

export type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: 'premium' | 'company') => Promise<void>;
  logout: () => void;
  requestAIAccess: (callback: () => void, t: TFunction) => void;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
  getAllUsers: () => User[];
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  getSettings: () => AppSettings;
  updateSettings: (settings: AppSettings) => void;
};
