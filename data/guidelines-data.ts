export const INITIAL_GUIDELINES_DATA = {
  "hypertensionGuidelines": {
    "documentTitle": "Managing Raised Blood Pressure: Clinical practice Guidelines",
    "issuingBody": "Council of Cooperative Health | Saudi Health Council (SHMS)",
    "references": [
      {
        "source": "SHMS Clinical practice Guidelines",
        "url": "https://bit.ly/SHMScpg18"
      }
    ],
    "diagnosticAlgorithm": {
      "initialVisit": {
        "description": "Dedicated clinic visit for BP ≥ 130/85 and ≤ 180/110",
        "steps": [
          "Clinical history",
          "Physical examination (including correct measurement of BP)",
          "Basic Investigations (ECG, Fasting sugar, Lipid profile, Renal Panel, eGFR, Electrolytes, TSH, Urinalysis)",
          "Assess for cardiovascular risk factors (Box 1)",
          "Out-of-office measurement - Home BP series / ABPM series requested",
          "Monitor blood pressure over 4 weeks and invite for 2nd clinic visit"
        ]
      },
      "bpCategories": [
        {
          "reading": "BP ≤ 130/85 (Non-DM) or BP ≤ 130/80 (DM pts)",
          "diagnosis": "No hypertension",
          "action": "Annual follow up"
        },
        {
          "reading": "BP ≥ 180/110",
          "subcategories": [
            {
              "type": "Symptomatic (Acute ToD)",
              "condition": "Emergency Hypertension"
            },
            {
              "type": "Asymptomatic",
              "condition": "Asymptomatic severe hypertension Grade 3 (previously known as Hypertension Urgency)",
              "action": "Commence treatment and review every 1-3 days until ≤ 160/100"
            }
          ]
        },
        {
          "reading": "BP 130-139 / 85-89 (Non-DM) or BP 130-139 / 80-89 (DM pts)",
          "condition": "High normal",
          "action": "If no RF review in 6 months"
        },
        {
          "reading": "BP 140-159 / 90-99",
          "condition": "Stage 1 hypertension",
          "action": "Check for 3 RFs or target organ Damage or Cardiovascular Disease or Diabetes. If yes, commence treatment. If no, review every 6 months."
        },
        {
          "reading": "BP ≥ 160/90",
          "condition": "Stage 2 hypertension",
          "action": "Commence treatment"
        }
      ],
      "treatment": {
        "generalAction": "Commence treatment, review monthly till target is met then 3-6 months",
        "generalTarget": "Treat all to a target of ≤ 140/90",
        "exceptions": [
          {
            "target": "≤ 130/80",
            "conditions": [
              "CKD with proteinuria",
              "Selected diabetic patients"
            ]
          },
          {
            "target": "≤ 150/90",
            "conditions": [
              "if older than 80 years old"
            ]
          }
        ]
      }
    },
    "box1_cardiovascularRiskFactors": {
      "title": "Cardiovascular Risk factors",
      "factors": [
        "Age (men >55 years; women >65 years)",
        "Smoking",
        "Obesity",
        "Dyslipidemia",
        "Diabetes",
        "Prediabetes",
        "Family history of premature CVD (men aged <55 years; women aged <65 years)"
      ],
      "targetOrganDamage": "LVH, Atherosclerosis, CKD (CKD stage 1-3, ACR 30-300mg/g)",
      "associatedClinicalConditions": "CVA, IHD, HF, (CKD4-5 or ACR > 300mg/g), PVD, Advanced hypertensive retinopathy"
    },
    "box2_officeBloodPressureAssessment": {
      "title": "Key Elements of Office Blood Pressure Assessment",
      "recommendations": [
        "Avoid caffeine, exercise, smoking at least 30 minutes before the visit",
        "Relax, feet on floor with back supported for at least five minutes",
        "Empty bladder",
        "Refrain from talking during the rest period and measurement",
        "Remove all clothing covering the area where the cuff will be placed",
        "Use the correct cuff size and Support the patient's arm (Box 3)",
        "Position the middle of the cuff at the level of the heart",
        "Repeated measurements by one to two minutes",
        "Average of at least two measurements"
      ],
      "homeMeasurementNote": "Home Blood Pressure measurement, using validated device is highly Recommended"
    },
    "box3_cuffSizes": [
      {
        "usualCuffSize": "Small adult",
        "armCircumference": "22-26 cm"
      },
      {
        "usualCuffSize": "Adult",
        "armCircumference": "27-34 cm"
      },
      {
        "usualCuffSize": "Large adult",
        "armCircumference": "35-44 cm"
      },
      {
        "usualCuffSize": "Adult thigh",
        "armCircumference": "45-52 cm"
      }
    ],
    "box4_referralToSecondaryCare": {
      "title": "When to refer to secondary care",
      "conditions": [
        "Resistant HTN",
        "Suspicion of secondary HTN",
        "Sudden onset of HTN",
        "HTN diagnosed at young age (30 years old)",
        "Worsening of HTN",
        "Malignant HTN"
      ]
    },
    "box5_pharmacologicalIntervention": [
      {
        "class": "Thiazide diuretics",
        "commonAgents": "Hydrochlorothiazide, bendroflumethiazide, chlorthalidone",
        "dose": "Hydrochlorothiazide-12.5-25mg daily, indapamide 1.5mg",
        "monitoring": "check electrolytes regularly",
        "contraindications": "Hypercalcemia, Hyponatremia, symptomatic hyperuricemia",
        "sideEffects": "Constipation, Diarrhea, Dizziness, Nausea, Postural Hypotension, electrolyte imbalance, urticarial",
        "cautions": "Hypokalemia, Elderly, Hepatic Failure",
        "hepaticImpairment": "Avoid if severe",
        "renalImpairment": "Avoid if eGFR is <30",
        "pregnancy": "Contraindicated",
        "sickDayRule": "stop if vomiting and diarrhea until no risk of dehydration"
      },
      {
        "class": "Centrally acting antihypertensive",
        "commonAgents": "clonidine, methyldopa",
        "dose": "Clonidine 50-100 Micrograms 3 times a day, increase every second or third day. Maximum dose 1.2 mg daily. Methyldopa 250mg three times a day increase to maximum of 3 g per day every 2-3 days.",
        "contraindications": "2nd or 3rd degree heart block, sick sinus syndrome",
        "cautions": "CVA, constipation, heart failure, depression, Raynaud's syndrome, PVD",
        "sideEffects": "Clonidine: depression, GI upset, dry mouth, fatigue, headache, sedation, sexual disorders, sleep disorders, postural hypotension. Methyldopa: amenorrhea, angioedema, bone marrow failure, breast enlargement, cognitive impairment, facial paralysis, hepatic disorders, lupus-like syndrome, parkinsonism, psychosis.",
        "treatmentCessation": "clonidine must be withdrawn gradually to avoid severe rebound hypertension",
        "monitoring": "Methyldopa - CBS & LFT before treatment and at intervals during first 6-12 weeks of if unexplained fever occurs",
        "renalImpairment": "can be used, start with smaller dose",
        "pregnancy": "use methyldopa"
      },
      {
        "class": "Aldosterone Antagonist",
        "commonAgents": "spironolactone",
        "dose": "25mg-100mg daily",
        "contraindications": "hyperkalemia, renal failure",
        "sideEffects": "Diarrhea, stomach cramps, Gynecomastia, headaches, rashes, irregular hair growth, impotence, low platelets, liver dysfunction",
        "hepaticImpairment": "contraindicated",
        "renalImpairment": "contraindicated",
        "pregnancy": "Contraindicated"
      },
      {
        "class": "Alpha-adrenoceptor blockers",
        "commonAgents": "doxazosin, prazosin",
        "dose": "1 mg once daily for 1 week then increase to 2 mg up to 4 mg once daily",
        "contraindications": "history of micturition syncope, postural hypotension",
        "cautions": "postural hypotension with initial dose, cataract surgery (risk of floppy iris syndrome)",
        "sideEffects": "arrhythmias, chest pain, cough, cystitis, dizziness, dyspnea, GI discomfort, headache, flu like illness, muscle complaint, palpitations, vertigo",
        "hepaticImpairment": "avoid in severe impairment",
        "renalImpairment": "can be used"
      },
      {
        "class": "Beta blockers",
        "commonAgents": "Atenolol, bisoprolol, carvedilol",
        "dose": "Bisoprolol 5-10mg daily, Atenolol 25-100mg daily",
        "contraindications": "Severe Asthma and COPD",
        "cautions": "Peripheral vascular disease",
        "sideEffects": "Diarrhea, stomach cramps, blurring of vision, headaches, insomnia, hair loss, dizziness",
        "renalImpairment": "can be used",
        "pregnancy": "Contraindicated except labetalol"
      },
      {
        "class": "Calcium channel blockers",
        "commonAgents": "Amlodipine, nifedipine, felodipine",
        "dose": "Amlodipine-5-10mg daily",
        "contraindications": "Significant Aortic Stenosis. Nifedipine avoid within one month of MI",
        "cautions": "Avoid Nifedipine in elderly and longstanding Diabetes (can cause reflex tachycardia)",
        "sideEffects": "Headache, peripheral edema, dizziness, flushing, nausea and vomiting, tachycardia, rashes, palpitations, rarely gingival hyperplasia",
        "hepaticImpairment": "start at lower dose",
        "renalImpairment": "can be used",
        "pregnancy": "Avoid in general, Nifedipine can be used",
        "breastFeeding": "Avoid. Nifedipine can be used"
      },
      {
        "class": "ACE inhibitors / ARBs",
        "commonAgents": "ACEi: Ramipril, Lisinopril, Enalapril, Perindopril. ARB: losartan, valsartan, Irbersartan, Telmisartan",
        "dose": "losartan-50-100mg daily, Enalarpil-10-20mg daily",
        "monitoring": "check electrolytes regularly",
        "contraindications": "angioedema, bilateral renal artery stenosis, allergic or adverse reaction to the drug",
        "sideEffects": "Cough, hyperkalemia, Dizziness, Nausea, Hypotension, electrolyte imbalance, urticarial rashes, rarely pancreatitis",
        "cautions": "Hyperkalemia, eGfr < 30mg/dl, symptomatic hypotension",
        "renalImpairment": "Avoid if eGFR is < 30",
        "pregnancy": "Contraindicated",
        "sickDayRule": "if risk of dehydration and AKI then stop them and restart once stable"
      }
    ],
    "box6_lifestyleModifications": [
      {
        "intervention": "Weight loss / Healthy diet, alcohol restriction",
        "effectOnBP": "1 mm Hg for every 1-kg reduction in body weight"
      },
      {
        "intervention": "Low sodium intake (< 1500 mg/d)",
        "effectOnBP": "-5/6 mm Hg"
      },
      {
        "intervention": "More potassium (3500-5000 mg/d)",
        "effectOnBP": "-4/5 mm Hg"
      },
      {
        "intervention": "Physical activity (150 min/week of moderate to high intensity)",
        "note": "Avoid if BP very High",
        "effectOnBP": "-5/8 mm Hg"
      }
    ]
  },
  "pcosGuidelines": {
    "documentTitle": "Diagnosis and management of polycystic ovary syndrome",
    "issuingBody": "PCOS UK",
    "lastUpdated": "June 2020",
    "overview": "This Guidelines summary contains recommendations for diagnosing and treating polycystic ovary syndrome (PCOS), when to refer to specialist services, and symptom-specific management of obesity, menstrual abnormalities, and fertility issues.",
    "diagnosis": {
      "definition": "PCOS is defined as occurring when two of the following are present: oligo- or anovulation, clinical and/or biochemical signs of hyperandrogenism, polycystic ovaries, with the exclusion of other aetiologies.",
      "clinicalManifestations": {
        "symptoms": [
          "menstrual disturbance (irregular menses, oligo- or amenorrhoea)",
          "anovulatory infertility",
          "hyperandrogenism (hirsutism, persistent acne, androgenetic alopecia)",
          "all symptoms are exacerbated by obesity"
        ],
        "serumEndocrinology": [
          "increase in androgens (testosterone and/or androstenedione)",
          "increase in luteinising hormone (LH), normal follicle stimulating hormone (FSH)",
          "decrease in sex hormone binding globulin (SHBG), results in elevated 'free androgen index' in overweight or obesity",
          "normal (mid-follicular range) oestradiol in anovulatory women, but low progesterone",
          "increase in fasting insulin (not routinely measured; impaired glucose tolerance [IGT] assessed by oral glucose tolerance test in obese subjects)"
        ],
        "possibleLateSequelae": [
          "diabetes mellitus",
          "dyslipidaemia",
          "hypertension",
          "cardiovascular disease",
          "endometrial carcinoma"
        ]
      },
      "glucoseTolerance": {
        "assessment": "Women who are obese, and also some slim women with PCOS, will have insulin resistance and elevated serum concentrations of insulin (usually <30 mU/L fasting).",
        "recommendations": [
          "We suggest that a 75 g oral glucose tolerance test (GTT) be performed in women with PCOS and a BMI > 30 kg/m², with an assessment of the fasting and two hour glucose concentration.",
          "It has been suggested that South Asian women should have an assessment of glucose tolerance if their BMI is greater than 25 kg/m² because of the greater risk of insulin resistance at a lower BMI than seen in the Caucasian population."
        ]
      }
    },
    "investigations_table1": [
      {
        "test": "Pelvic ultrasound",
        "details": "To assess ovarian morphology and endometrial thickness",
        "normalRange": null,
        "additionalPoints": "Transadominal scan not optional but an alternative in women who are not sexually active"
      },
      {
        "test": "Testosterone (T) / Sex hormone binding globulin (SHBG)",
        "normalRange": "T: 0.50-3.5 nmol/l, SHBG: 16-119 nmol/l",
        "additionalPoints": "It is unnecessary to measure other androgens unless total testosterone is >5 nmol/L in which case referral is indicated. The utility of routine SHBG measurements (and calculation of free androgen index) remains controversial"
      },
      {
        "test": "Free androgen index (FAI): T x 100 / SHBG",
        "normalRange": "<5",
        "additionalPoints": "Insulin supresses SHBG, resulting in a high FAI in the presence of a normal total T"
      },
      {
        "test": "Oestradiol",
        "normalRange": "Measurement is unhelpful to diagnosis except in women with amenorrhea",
        "additionalPoints": "Oestrogenisation may be confirmed by endometrial assessment"
      },
      {
        "test": "Luteinising hormone (LH) / Follicle stimulating hormone (FSH)",
        "normalRange": "LH: 2-10 IU/L, FSH: 2-8 IU/L",
        "additionalPoints": "FSH and LH best measured during days one to three of a menstrual bleed. If oligo-/amenorrhoeic then random samples are taken"
      },
      {
        "test": "Prolactin, thyroid function, thyroid-stimulating hormone",
        "normalRange": "Prolactin: <500 mU/L, TSH: 0.5-5 IU/L",
        "additionalPoints": "Measure if oligo-/amenorrhoeic"
      },
      {
        "test": "Fasting insulin (not routinely measured)",
        "normalRange": "<30 mU/L",
        "additionalPoints": null
      }
    ],
    "management": {
      "focus": "Clinical management of a woman with PCOS should be focused on her individual problems.",
      "obesity": {
        "importance": "Obesity worsens both symptomatology and the endocrine profile and so obese women (BMI > 30kg/m²) should therefore be encouraged to lose weight.",
        "benefits": "Weight loss improves the endocrine profile, the likelihood of ovulation and a healthy pregnancy.",
        "diet": "The right diet for an individual is one that is practical, sustainable and compatible with her lifestyle. It is sensible to reduce glycaemic load by lowering sugar content in favour of more complex carbohydrates and to avoid fatty foods; it is often helpful to refer to a dietitian, if available.",
        "exercise": "An increase in physical activity is very important, preferably as part of the daily routine. A minimum of 30 minutes per day of brisk exercise five times per week is encouraged to maintain health and to aid or sustain weight loss.",
        "behavioralTherapy": "Concurrent behavioural therapy improves the chances of success of any method of weight loss.",
        "pharmacological": [
          {
            "drug": "Orlistat",
            "description": "Only orlistat has been shown to be both safe and effective in PCOS (in small studies). It is a pancreatic lipase inhibitor, which prevents absorption of around 30% of dietary fat, and will help to improve insulin resistance. It is increasingly being used in primary care as an adjunct to diet and lifestyle advice and does require monitoring for efficacy and side effects. It is now available without prescription but its use is best prescribed and supervised by medical practitioners."
          },
          {
            "drug": "Metformin",
            "description": "Metformin can also improve insulin resistance and may aid some women with modest weight loss, though this has not been confirmed by randomised trials. Metformin is clearly indicated in women with PCOS who have impaired glucose tolerance (IGT) or frank diabetes."
          },
          {
            "drug": "Combination (Metformin + Orlistat)",
            "description": "The combination of metformin and an anti-obesity agent may be helpful but while metformin combined with orlistat is not contraindicated, their combination is still unproven and clinical trials to formally evaluate this approach are required."
          }
        ],
        "surgical": "Bariatric surgery is effective in reducing the symptoms and metabolic abnormalities of morbidly obese women with PCOS. It should be considered as an option particularly in those who have a BMI of greater than 40kg/m² or those with a BMI > 35kg/m² with a comorbidity such as IGT."
      },
      "menstrualIrregularity": {
        "coc": "The easiest way to control the menstrual cycle is the use of a low dose combined oral contraceptive (COC) preparation. This will result in an artificial cycle and regular shedding of the endometrium. A 'lipid friendly' COC pill should be used because women with PCOS may be at increased risk of cardiovascular disease.",
        "progestogen": "An alternative is a progestogen (such as medroxyprogesterone acetate or dydrogesterone) for 10-14 days every one to three months to induce a withdrawal bleed.",
        "metformin": "Metformin is an alternative agent, which could be tried if contraception is not required; it can regulate menses but is not as reliable as COCs or cyclical progestogens in this regard.",
        "endometrialRisk": "In women with anovulatory cycles, the action of oestradiol on the endometrium is unopposed because of the lack of cyclical progesterone secretion. This may result in episodes of irregular uterine bleeding, and in the long term, endometrial hyperplasia and even endometrial cancer. The only young women to get endometrial carcinoma (<35years)... are those with anovulation secondary to PCOS...",
        "endometrialAssessment": "An ultrasound assessment of endometrial thickness provides a bioassay for oestradiol production. If the endometrium is thicker than 15 mm, a withdrawal bleed should be induced and if the endometrium fails to shed then endometrial sampling is required to exclude endometrial hyperplasia or malignancy."
      },
      "infertility": {
        "letrozole": "Ovulation can be induced with anti-oestrogens; many centres offer letrozole as a first-line treatment for anovulatory women with PCOS. However, letrozole is an off-label treatment for this indication.",
        "clomipheneCitrate": "Clomiphene citrate (50-100mg) for days 2-6 of a natural or artificially induced bleed is successful in inducing ovulation in 75-80% of women. Clomiphene citrate should only be prescribed in a setting where ultrasound monitoring is available (and performed) in order to minimise the 10% risk of multiple pregnancy, and to ensure that ovulation is taking place. A daily dose of more than 100 mg of clomiphene rarely confers any benefit. Once an ovulatory dose has been reached, the cumulative conception rate continues to increase for up to 10-12 cycles. Clomiphene is only licensed for six months use in the UK, and so we would advise careful counselling of patients if clomiphene citrate therapy is continued beyond six months.",
        "metformin": "Metformin alone may improve the rate of ovulation, but results of a large randomised controlled trial (RCT) shows that metformin will result in a live birth rate of only 7%. In the same RCT, metformin added to clomiphene conferred no additional benefit in terms of live birth rate compared with clomiphene alone."
      },
      "hyperandrogenism": {
        "hirsutism": "Hirsutism is best managed using a combination of physical methods of hair removal (including, most effectively, electrolysis and laser treatment) with hormonal therapy. All COCs will reduce ovarian androgen secretion but the use of androgen receptor-blocking drugs will confer additional benefit.",
        "coCyprindiol": "The combination of 35 µg ethinyloestradiol with 2 mg cyproterone acetate (co-cyprindiol) has been widely and successfully used although it is primarily licensed for treatment of acne.",
        "antiandrogens": "Cyproterone acetate (CPA) and other antiandrogens such as spironolactone can be given in addition to a COC. CPA and spironolactone can also be given alone. Antiandrogens are contraindicated during pregnancy and lactation, as feminisation of the male foetus can occur. Therefore, barrier contraception should be advised in women who are sexually active. Alternative antiandrogens include flutamide and finasteride (all unlicensed) and are not routinely prescribed because of potential adverse effects. Reliable contraception is also required with these agents.",
        "eflornithine": "Eflornithine is a topical skin preparation, which reduces the rate of growth of facial hair and has proved effective both alone and in combination with laser hair removal.",
        "acne": "Acne can be treated by topical preparations and antibiotics but in resistant cases, endocrine treatment with COCs (particularly co-cyprindiol) are effective. Isotretinoin treatment can be reserved for severe persistent acne and is best supervised by an experienced dermatologist.",
        "alopecia": "Androgenetic alopecia is notoriously difficult to treat. Antiandrogens can limit progression of hair loss but only rarely restore hair growth."
      }
    },
    "indicationsForReferral": [
      "Serum testosterone > 5 nmol/L (to exclude other causes of androgen excess, e.g. tumours, late onset congenital adrenal hyperplasia, Cushing's syndrome)",
      "Infertility",
      "Rapid onset of hirsutism (to exclude androgen secreting tumours)",
      "Glucose intolerance/diabetes",
      "Amenorrhoea of more than 6 months - for pelvic ultrasound scan to exclude endometrial hyperplasia",
      "Refractory symptoms"
    ],
    "fullGuidelineReference": {
      "source": "PCOS UK. The polycystic ovary syndrome: guidance for diagnosis and management.",
      "availability": "pcos-uk.org.uk",
      "publishedDate": "June 2007"
    }
  }
};
