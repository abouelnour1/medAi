
import { TranslationKeys } from './translations';

export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'info' | 'alert' | 'update' | 'approval_request' | 'request_result';
  isRead?: boolean;
  relatedId?: string; 
  relatedMedicineId?: string; 
  targetUserId?: string; 
  targetRole?: 'admin' | 'premium' | 'company'; 
}

export interface PendingUpdate {
  id: string;
  medicineId?: string; 
  itemType: 'medicine' | 'supplement' | 'food'; 
  type: 'add' | 'edit';
  newData: Partial<Medicine>;
  originalData?: any;
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
  description?: string; 
  
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
  manufacturerNameEn?: string;
  manufacturerCountryAr?: string;
  manufacturerCountryEn?: string;
  "Active ingredient"?: string;
  "Key Ingredients"?: string;
  Highlights?: string;
  "Public price"?: string;
  imgBox?: string;
}



export type View = 'search' | 'addData' | 'details' | 'results' | 'alternatives' | 'settings' | 'chatHistory' | 'insuranceSearch' | 'addInsuranceData' | 'prescriptions' | 'insuranceDetails' | 'login' | 'register' | 'admin' | 'favorites' | 'verifyEmail' | 'aiHistory' | 'notifications' | 'imageView' | 'generalSettings' | 'orderList' | 'stockTracker';

export type TextSearchMode = 'tradeName' | 'scientificName' | 'all';

export type InsuranceSearchMode = 'scientificName' | 'tradeName' | 'indication' | 'icd10Code';

export type ProductTypeFilter = 'all' | 'medicine' | 'supplement' | 'food';

export interface Filters {
  productType: ProductTypeFilter;
  priceMin: string;
  priceMax: string;
  pharmaceuticalForm: string | string[];
  manufactureName: string[];
  marketingCompany: string[];
  mainAgent: string[];
  legalStatus: string;
}

export type Language = 'ar' | 'en';
export type TFunction = (key: TranslationKeys, replacements?: { [key: string]: string | number }) => string;

export type Tab = 'search' | 'insurance' | 'prescriptions' | 'settings';

export type SortByOption = 'relevance' | 'alphabetical' | 'scientificName' | 'priceAsc' | 'priceDesc' | 'strengthAsc' | 'strengthDesc';

export interface SerializablePart {
  text?: string;
  thought?: any;
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

export type UserSpecialty = 'Pharmacist' | 'Physician' | 'Dentist' | 'Nurse' | 'Physical Therapist' | 'Nutritionist' | 'Veterinarian' | 'Medical Student' | 'Other';
export type PhysicianSubSpecialty = 
  | 'General Practice' | 'Internal Medicine' | 'Pediatrics' | 'Surgery' | 'Obstetrics & Gynecology'
  | 'Cardiology' | 'Neurology' | 'Oncology' | 'Orthopedics' | 'Dermatology'
  | 'Psychiatry' | 'Ophthalmology' | 'ENT' | 'Urology' | 'Anesthesiology' | 'Emergency Medicine' | 'Other';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'premium' | 'company';
  specialty?: UserSpecialty;
  subSpecialty?: PhysicianSubSpecialty;
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
  isFeaturedEnabled: boolean;
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
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
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

// Stub - تم إلغاء قسم الحليب
export interface MilkProduct {
  id: string;
  brand: string;
  productName: string;
  stageType: string;
  ageRange: string;
  [key: string]: any;
}
