
import { MilkProduct } from '../types';

interface RawStandardMilk {
  "Brand": string;
  "Stage": string;
  "Age Range": string;
  "Key Features / Ingredients": string;
  "Key Differences": string;
}

// --- STANDARD FORMULAS (Raw Data in User Format) ---
const RAW_STANDARD_MILK: RawStandardMilk[] = [
  {
    "Brand": "Similac Gold",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "HMO (2'-FL), Lutein, Natural Vitamin E, DHA/ARA, Palm Olein Free.",
    "Key Differences": "Advanced formula focusing on immune support (HMO) and brain/eye development. Palm Olein Free for better calcium absorption."
  },
  {
    "Brand": "Similac Gold",
    "Stage": "2",
    "Age Range": "6-12 Months",
    "Key Features / Ingredients": "HMO (2'-FL), Lutein, Natural Vitamin E, DHA/ARA, Palm Olein Free.",
    "Key Differences": "Follow-on formula with higher protein/iron content than Stage 1 to meet the needs of a growing baby."
  },
  {
    "Brand": "Similac Gold",
    "Stage": "3",
    "Age Range": "1-3 Years",
    "Key Features / Ingredients": "HMO (2'-FL), Lutein, Natural Vitamin E, DHA/ARA, Palm Olein Free.",
    "Key Differences": "Growing-up milk, tailored for toddlers with increased iron, calcium, and vitamins."
  },
  {
    "Brand": "Aptamil Advance",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "Pronutra Advance, GOS/FOS (Prebiotics), DHA/ARA, Palm Olein Free.",
    "Key Differences": "Focus on gut health (GOS/FOS) and brain development. Palm Olein Free."
  },
  {
    "Brand": "Aptamil Advance",
    "Stage": "2",
    "Age Range": "6-12 Months",
    "Key Features / Ingredients": "Pronutra Advance, GOS/FOS (Prebiotics), DHA/ARA, Palm Olein Free.",
    "Key Differences": "Follow-on formula, designed to complement a weaning diet."
  },
  {
    "Brand": "Aptamil Advance",
    "Stage": "3",
    "Age Range": "1-3 Years",
    "Key Features / Ingredients": "Pronutra Advance, GOS/FOS (Prebiotics), DHA/ARA, Palm Olein Free.",
    "Key Differences": "Junior milk, supports bone growth with Calcium and Vitamin D."
  },
  {
    "Brand": "NAN Optipro",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "OPTIPRO (Optimized Protein), 2'-FL HMO, Bifidus BL (Probiotic), DHA/ARA.",
    "Key Differences": "Unique protein blend (OPTIPRO) and inclusion of Probiotic (Bifidus BL) for immune and digestive health. Contains Palm Olein."
  },
  {
    "Brand": "NAN Optipro",
    "Stage": "2",
    "Age Range": "6-12 Months",
    "Key Features / Ingredients": "OPTIPRO, 2'-FL HMO, Bifidus BL, DHA/ARA.",
    "Key Differences": "Follow-on formula, higher protein and iron levels."
  },
  {
    "Brand": "NAN Optipro",
    "Stage": "3",
    "Age Range": "1-3 Years",
    "Key Features / Ingredients": "OPTIPRO, 2'-FL HMO, Bifidus BL, DHA/ARA.",
    "Key Differences": "Growing-up milk, tailored for toddlers."
  },
  {
    "Brand": "S-26 Gold",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "Biofactors System, Sn-2 Palmitate, DHA/ARA, FOS (Prebiotic).",
    "Key Differences": "Focus on comprehensive growth and development with Sn-2 Palmitate for fat absorption."
  },
  {
    "Brand": "S-26 Gold",
    "Stage": "2",
    "Age Range": "6-12 Months",
    "Key Features / Ingredients": "Biofactors System, Sn-2 Palmitate, DHA/ARA, FOS.",
    "Key Differences": "Follow-on formula, supports increased energy needs."
  },
  {
    "Brand": "S-26 Gold",
    "Stage": "3",
    "Age Range": "1-3 Years",
    "Key Features / Ingredients": "Biofactors System, Sn-2 Palmitate, DHA/ARA, FOS.",
    "Key Differences": "Growing-up milk."
  },
  {
    "Brand": "Hero Baby",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "DHA/ARA, Nucleotides, GOS (Prebiotic).",
    "Key Differences": "Formula designed to be closer to breast milk composition."
  },
  {
    "Brand": "Bebelac",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "Nutri 7in1 (Ca, Fe, Omega 3, Prebiotics, Vit C&D, Zn), DHA/ARA.",
    "Key Differences": "Basic, well-fortified formula."
  },
  {
    "Brand": "Biomil Plus",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "Prebiotics (90% GOS & 10% FOS), Omega 3, Iron, Vitamin D.",
    "Key Differences": "Focus on gut health and reducing constipation."
  },
  {
    "Brand": "Blemil Plus",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "High α-lactalbumin, LC-PUFA's, Lutein.",
    "Key Differences": "High-quality protein fraction for easier digestion and brain/eye support."
  },
  {
    "Brand": "Primalac Premium",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "Prebiotics, DHA, ARA.",
    "Key Differences": "Balanced, widely available formula."
  },
  {
    "Brand": "Nuralac (Almarai)",
    "Stage": "1",
    "Age Range": "0-6 Months",
    "Key Features / Ingredients": "Cow's milk-based, fortified with Vitamins and Minerals.",
    "Key Differences": "Locally produced, widely available standard formula."
  }
];

// --- SPECIAL FORMULAS (Typed) ---
const SPECIAL_MILK_DATA: MilkProduct[] = [
  {
    id: 'similac-total-comfort',
    name: "Similac Total Comfort",
    type: 'Special',
    specialType: "Comfort",
    indication: "Digestive discomfort, gas, fussiness.",
    features: "Partially hydrolyzed whey protein, reduced lactose, Palm Olein Free, HMO.",
    differences: "Easier to digest due to broken-down protein and low lactose. Good for mild digestive issues."
  },
  {
    id: 'aptamil-comfort',
    name: "Aptamil Comfort",
    type: 'Special',
    specialType: "Comfort",
    indication: "Colic, constipation, digestive discomfort.",
    features: "Partially hydrolyzed whey protein, GOS/FOS, reduced lactose, thicker consistency.",
    differences: "Thicker consistency and GOS/FOS blend to manage discomfort and stool consistency."
  },
  {
    id: 'nan-comfort',
    name: "NAN Comfort",
    type: 'Special',
    specialType: "Comfort",
    indication: "Colic, constipation, digestive discomfort.",
    features: "Partially hydrolyzed whey protein (OPTIPRO HA), L. reuteri (Probiotic).",
    differences: "Contains a specific probiotic (L. reuteri) known to help with colic."
  },
  {
    id: 'similac-ar',
    name: "Similac AR",
    type: 'Special',
    specialType: "Anti-Reflux (AR)",
    indication: "Frequent spitting up/regurgitation.",
    features: "Rice starch-thickened, Palm Olein Free, HMO.",
    differences: "Thickens in the stomach to reduce reflux. Contains HMO."
  },
  {
    id: 'aptamil-ar',
    name: "Aptamil AR",
    type: 'Special',
    specialType: "Anti-Reflux (AR)",
    indication: "Frequent spitting up/regurgitation.",
    features: "Locust Bean Gum (Carob flour) thickener, GOS/FOS.",
    differences: "Thickens formula to reduce regurgitation. Contains GOS/FOS prebiotics."
  },
  {
    id: 'ronalac-ar',
    name: "Ronalac AR",
    type: 'Special',
    specialType: "Anti-Reflux (AR)",
    indication: "Frequent spitting up/regurgitation.",
    features: "Pre-thickened formula.",
    differences: "Basic, pre-thickened formula to manage GER."
  },
  {
    id: 'similac-isomil',
    name: "Similac Isomil",
    type: 'Special',
    specialType: "Soy-Based",
    indication: "Lactose intolerance, galactosemia, mild cow's milk allergy.",
    features: "Soy protein isolate, Lactose-Free, Palm Olein Free.",
    differences: "Alternative to cow's milk, suitable for lactose intolerance."
  },
  {
    id: 'nan-al-110',
    name: "NAN AL 110",
    type: 'Special',
    specialType: "Lactose-Free (LF)",
    indication: "Lactose intolerance, acute diarrhea.",
    features: "Lactose-Free, Probiotic (L. reuteri).",
    differences: "Used for temporary or permanent lactose intolerance, often recommended after diarrhea."
  },
  {
    id: 'aptamil-lf',
    name: "Aptamil Lactose Free",
    type: 'Special',
    specialType: "Lactose-Free (LF)",
    indication: "Lactose intolerance.",
    features: "Lactose-Free, GOS/FOS.",
    differences: "Lactose-free option with added prebiotics."
  },
  {
    id: 'similac-alimentum',
    name: "Similac Alimentum",
    type: 'Special',
    specialType: "Hypoallergenic (HA)",
    indication: "Severe cow's milk protein allergy (CMPA), malabsorption.",
    features: "Extensively hydrolyzed casein protein, MCT oil.",
    differences: "Proteins are broken down into small peptides, making it suitable for severe allergies."
  },
  {
    id: 'aptamil-pepti',
    name: "Aptamil Pepti",
    type: 'Special',
    specialType: "Hypoallergenic (HA)",
    indication: "Cow's milk protein allergy (CMPA).",
    features: "Extensively hydrolyzed whey protein, GOS/FOS.",
    differences: "Extensively hydrolyzed protein for allergy management. Contains GOS/FOS."
  },
  {
    id: 'nan-ha',
    name: "NAN HA",
    type: 'Special',
    specialType: "Hypoallergenic (HA)",
    indication: "High risk of allergy (preventative).",
    features: "Partially hydrolyzed whey protein (OPTIPRO HA).",
    differences: "Preventative formula for infants with a family history of allergies. Not for confirmed allergy."
  },
  {
    id: 'neocate-lcp',
    name: "Neocate LCP",
    type: 'Special',
    specialType: "Amino Acid",
    indication: "Severe CMPA, multiple food protein allergies, malabsorption.",
    features: "100% free amino acids, hypoallergenic.",
    differences: "Elemental formula for the most severe allergies and complex malabsorption issues."
  }
];

// Convert RAW user format to App Internal Format
const normalizedStandardMilk: MilkProduct[] = RAW_STANDARD_MILK.map((item) => ({
    id: `std-${item.Brand.replace(/\s+/g, '-').toLowerCase()}-${item.Stage}`,
    name: item.Brand,
    type: 'Standard',
    stage: item.Stage,
    ageRange: item["Age Range"],
    features: item["Key Features / Ingredients"],
    differences: item["Key Differences"]
}));

export const INITIAL_MILK_DATA: MilkProduct[] = [
    ...normalizedStandardMilk,
    ...SPECIAL_MILK_DATA
];
