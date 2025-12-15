
import { MilkProduct } from '../types';

// Raw data in the format requested by user
const RAW_MILK_DATA = [
    // --- NOVALAC ---
  {
      "brand": "Nan",
      "productName": "NAN Optipro 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66.2,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 7.2
      },
      "keyFeatures": "Optipro protein blend, Bifidus BL, DHA/ARA",
      "pharmacistNote": "**Standard Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 1 (0-6 months).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Optipro 1\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Optipro protein blend, Bifidus BL, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Optipro 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.6,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 7.7
      },
      "keyFeatures": "Optipro protein blend, Bifidus BL, DHA/ARA",
      "pharmacistNote": "**Standard Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 2 (6-12 months).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Optipro 2\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Optipro protein blend, Bifidus BL, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Optipro 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.7,
        "fat": 3.6,
        "carb": 7.7
      },
      "keyFeatures": "Optipro protein blend, Bifidus BL, DHA/ARA",
      "pharmacistNote": "**Growing Up Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 3 (1-3 years).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Optipro 3\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Optipro protein blend, Bifidus BL, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Optipro 4",
      "stageType": "Stage 4 (3-6 years) / Growing Up",
      "ageRange": "Stage 4 (3-6 years)",
      "nutritionalInfo": {
        "kcal": 64.1,
        "protein": 1.2,
        "fat": 3.4,
        "carb": 7.6
      },
      "keyFeatures": "Optipro protein blend, Bifidus BL, DHA/ARA",
      "pharmacistNote": "**Growing Up Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 4 (3-6 years).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Optipro 4\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Optipro protein blend, Bifidus BL, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Optipro protein blend, Bifidus BL, DHA/ARA. Designed for Stage 4 (3-6 years).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.7,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 7.5
      },
      "keyFeatures": "Starch thickened, L.reuteri",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Starch thickened, L.reuteri. Designed for All Stages.",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN AR\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Starch thickened, L.reuteri\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Starch thickened, L.reuteri. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.4,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 8
      },
      "keyFeatures": "Lactose free, Nucleotides",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free, Nucleotides. Designed for All Stages.",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN LF\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free, Nucleotides\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free, Nucleotides. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Comfort",
      "stageType": "All Stages / Comfort",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7
      },
      "keyFeatures": "Low lactose, L.reuteri, GOS/FOS",
      "pharmacistNote": "**Comfort Formula**: Low lactose, L.reuteri, GOS/FOS. Designed for All Stages.",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Comfort\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Low lactose, L.reuteri, GOS/FOS\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Low lactose, L.reuteri, GOS/FOS. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN HA 1",
      "stageType": "Stage 1 (0-6 months) / Hypoallergenic",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.2,
        "protein": 1.5,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "Partially hydrolyzed protein",
      "pharmacistNote": "**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 1 (0-6 months).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للحساسية (وقاية)",
          "description": "للأطفال الذين لديهم تاريخ عائلي من الحساسية أو للوقاية من حساسية البروتين. تحتوي على بروتين مهضوم جزئياً.",
          "when_to_use": "للوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية",
          "benefits": "تقلل خطر الحساسية بنسبة 50%",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN HA 1\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية\n\n**المميزات:**\n- تقلل خطر الحساسية بنسبة 50%\n- المكونات: Partially hydrolyzed protein\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN HA 2",
      "stageType": "Stage 2 (6-12 months) / Hypoallergenic",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.2,
        "protein": 1.7,
        "fat": 3.2,
        "carb": 7.8
      },
      "keyFeatures": "Partially hydrolyzed protein",
      "pharmacistNote": "**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 2 (6-12 months).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للحساسية (وقاية)",
          "description": "للأطفال الذين لديهم تاريخ عائلي من الحساسية أو للوقاية من حساسية البروتين. تحتوي على بروتين مهضوم جزئياً.",
          "when_to_use": "للوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية",
          "benefits": "تقلل خطر الحساسية بنسبة 50%",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN HA 2\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية\n\n**المميزات:**\n- تقلل خطر الحساسية بنسبة 50%\n- المكونات: Partially hydrolyzed protein\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Supreme Pro 1",
      "stageType": "Stage 1 (0-6 months) / Premium",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67.5,
        "protein": 1.4,
        "fat": 3.3,
        "carb": 8.1
      },
      "keyFeatures": "5 HMOs, Gentle protein",
      "pharmacistNote": "**Premium Formula**: 5 HMOs, Gentle protein. Designed for Stage 1 (0-6 months).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Supreme Pro 1\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 5 HMOs, Gentle protein\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Premium Formula**: 5 HMOs, Gentle protein. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Supreme Pro 2",
      "stageType": "Stage 2 (6-12 months) / Premium",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64.4,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "5 HMOs, Gentle protein",
      "pharmacistNote": "**Premium Formula**: 5 HMOs, Gentle protein. Designed for Stage 2 (6-12 months).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Supreme Pro 2\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 5 HMOs, Gentle protein\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Premium Formula**: 5 HMOs, Gentle protein. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "NAN Supreme Pro 3",
      "stageType": "Stage 3 (1-3 years) / Premium",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.6,
        "protein": 1.2,
        "fat": 3.5,
        "carb": 7.9
      },
      "keyFeatures": "5 HMOs, Gentle protein",
      "pharmacistNote": "**Premium Formula**: 5 HMOs, Gentle protein. Designed for Stage 3 (1-3 years).",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### NAN Supreme Pro 3\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 5 HMOs, Gentle protein\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Premium Formula**: 5 HMOs, Gentle protein. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Nan",
      "productName": "PreNAN",
      "stageType": "Pre-term / Pre-term",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 98.1,
        "protein": 2.2,
        "fat": 4.7,
        "carb": 10.4
      },
      "keyFeatures": "High energy, High protein for catch-up growth",
      "pharmacistNote": "**Pre-term Formula**: High energy, High protein for catch-up growth. Designed for Pre-term.",
      "image": "/images/nan-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للأطفال المولودين قبل الأوان",
          "description": "مصممة خصيصاً للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو. تحتوي على سعرات حرارية وبروتين أكثر.",
          "when_to_use": "للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو",
          "benefits": "تساعد على اللحاق بالنمو بسرعة",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "نان (نستله)",
          "description": "العلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.",
          "strength": "ابتكار عالي، جودة ممتازة، أنواع كثيرة جداً",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يريدون أفضل جودة"
        },
        "arabic": "\n### PreNAN\n\n**ما هو هذا المنتج؟**\nالعلامة الأولى عالمياً. تشتهر بتقنية Optipro الحصرية التي تحاكي بروتين حليب الأم.\n\n**متى تستخدمه؟**\nللأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو\n\n**المميزات:**\n- تساعد على اللحاق بالنمو بسرعة\n- المكونات: High energy, High protein for catch-up growth\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يريدون أفضل جودة\n\n**ملاحظة صيدلانية:**\n**Pre-term Formula**: High energy, High protein for catch-up growth. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Gold 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 7.2
      },
      "keyFeatures": "2'-FL HMO, DHA, Lutein, Vitamin E",
      "pharmacistNote": "**Standard Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 1 (0-6 months).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Gold 1\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 2'-FL HMO, DHA, Lutein, Vitamin E\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Gold 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64.4,
        "protein": 1.4,
        "fat": 3.6,
        "carb": 7.3
      },
      "keyFeatures": "2'-FL HMO, DHA, Lutein, Vitamin E",
      "pharmacistNote": "**Standard Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 2 (6-12 months).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Gold 2\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 2'-FL HMO, DHA, Lutein, Vitamin E\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Gold 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.9,
        "protein": 1.4,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "2'-FL HMO, DHA, Lutein, Vitamin E",
      "pharmacistNote": "**Growing Up Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 3 (1-3 years).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Gold 3\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 2'-FL HMO, DHA, Lutein, Vitamin E\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Gold 4",
      "stageType": "Stage 4 (3+ years) / Growing Up",
      "ageRange": "Stage 4 (3+ years)",
      "nutritionalInfo": {
        "kcal": 66.7,
        "protein": 1.6,
        "fat": 3.4,
        "carb": 7.4
      },
      "keyFeatures": "2'-FL HMO, DHA, Lutein, Vitamin E",
      "pharmacistNote": "**Growing Up Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 4 (3+ years).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Gold 4\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: 2'-FL HMO, DHA, Lutein, Vitamin E\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: 2'-FL HMO, DHA, Lutein, Vitamin E. Designed for Stage 4 (3+ years).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Total Comfort 1",
      "stageType": "Stage 1 (0-6 months) / Comfort",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66.7,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.1
      },
      "keyFeatures": "Partially hydrolyzed whey, Low lactose",
      "pharmacistNote": "**Comfort Formula**: Partially hydrolyzed whey, Low lactose. Designed for Stage 1 (0-6 months).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Total Comfort 1\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Partially hydrolyzed whey, Low lactose\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Partially hydrolyzed whey, Low lactose. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Total Comfort 2",
      "stageType": "Stage 2 (6-12 months) / Comfort",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.1,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.8
      },
      "keyFeatures": "Partially hydrolyzed whey, Low lactose",
      "pharmacistNote": "**Comfort Formula**: Partially hydrolyzed whey, Low lactose. Designed for Stage 2 (6-12 months).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Total Comfort 2\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Partially hydrolyzed whey, Low lactose\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Partially hydrolyzed whey, Low lactose. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Total Comfort 3",
      "stageType": "Stage 3 (1-3 years) / Comfort",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.1,
        "protein": 1.8,
        "fat": 3.5,
        "carb": 7.7
      },
      "keyFeatures": "Partially hydrolyzed whey, Low lactose",
      "pharmacistNote": "**Comfort Formula**: Partially hydrolyzed whey, Low lactose. Designed for Stage 3 (1-3 years).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Total Comfort 3\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Partially hydrolyzed whey, Low lactose\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Partially hydrolyzed whey, Low lactose. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Neosure",
      "stageType": "Pre-term / Post-discharge",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 95.8,
        "protein": 2.6,
        "fat": 5.1,
        "carb": 9.3
      },
      "keyFeatures": "Enriched calories/protein for preemies",
      "pharmacistNote": "**Post-discharge Formula**: Enriched calories/protein for preemies. Designed for Pre-term.",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Neosure\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Enriched calories/protein for preemies\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Post-discharge Formula**: Enriched calories/protein for preemies. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Alimentum",
      "stageType": "All Stages / Extensively Hydrolyzed",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.7,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 7.1
      },
      "keyFeatures": "For severe cow's milk allergy",
      "pharmacistNote": "**Extensively Hydrolyzed Formula**: For severe cow's milk allergy. Designed for All Stages.",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للحساسية الشديدة",
          "description": "للأطفال الذين يعانون من حساسية حقيقية من بروتين البقر. البروتين مهضوم بشكل كامل جداً.",
          "when_to_use": "عندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب",
          "benefits": "آمن تماماً للأطفال الذين يعانون من حساسية حقيقية",
          "side_effects": "قد يكون الطعم أقل استساغة"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Alimentum\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب\n\n**المميزات:**\n- آمن تماماً للأطفال الذين يعانون من حساسية حقيقية\n- المكونات: For severe cow's milk allergy\n\n**الملاحظات:**\n- قد يكون الطعم أقل استساغة\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Extensively Hydrolyzed Formula**: For severe cow's milk allergy. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Isomil 1",
      "stageType": "Stage 1 (0-6 months) / Soy Based",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.3,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "Soy protein isolate, Lactose free",
      "pharmacistNote": "**Soy Based Formula**: Soy protein isolate, Lactose free. Designed for Stage 1 (0-6 months).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Isomil 1\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Soy protein isolate, Lactose free\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Soy Based Formula**: Soy protein isolate, Lactose free. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Isomil 2",
      "stageType": "Stage 2 (6-12 months) / Soy Based",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.9,
        "protein": 1.3,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "Soy protein isolate, Lactose free",
      "pharmacistNote": "**Soy Based Formula**: Soy protein isolate, Lactose free. Designed for Stage 2 (6-12 months).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Isomil 2\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Soy protein isolate, Lactose free\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Soy Based Formula**: Soy protein isolate, Lactose free. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Similac",
      "productName": "Similac Isomil 3",
      "stageType": "Stage 3 (1-3 years) / Soy Based",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.2,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 8
      },
      "keyFeatures": "Soy protein isolate, Lactose free",
      "pharmacistNote": "**Soy Based Formula**: Soy protein isolate, Lactose free. Designed for Stage 3 (1-3 years).",
      "image": "/images/similac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "سيميلاك (أبوت)",
          "description": "تشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.",
          "strength": "HMO للمناعة، سعر معقول، جودة جيدة جداً",
          "price": "متوسط",
          "best_for": "الآباء والأمهات الذين يريدون توازن بين الجودة والسعر"
        },
        "arabic": "\n### Similac Isomil 3\n\n**ما هو هذا المنتج؟**\nتشتهر بـ HMO (2'-FL) - مادة موجودة في حليب الأم الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Soy protein isolate, Lactose free\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: متوسط\n- الأنسب لـ: الآباء والأمهات الذين يريدون توازن بين الجودة والسعر\n\n**ملاحظة صيدلانية:**\n**Soy Based Formula**: Soy protein isolate, Lactose free. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Advance 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.5,
        "protein": 1.6,
        "fat": 3.6,
        "carb": 7.1
      },
      "keyFeatures": "Pronutra+, GOS/FOS, LCPs",
      "pharmacistNote": "**Standard Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 1 (0-6 months).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Advance 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Pronutra+, GOS/FOS, LCPs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Advance 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.6,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 8.1
      },
      "keyFeatures": "Pronutra+, GOS/FOS, LCPs",
      "pharmacistNote": "**Standard Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 2 (6-12 months).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Advance 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Pronutra+, GOS/FOS, LCPs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Advance 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.1,
        "protein": 1.4,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "Pronutra+, GOS/FOS, LCPs",
      "pharmacistNote": "**Growing Up Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 3 (1-3 years).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Advance 3\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Pronutra+, GOS/FOS, LCPs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Advance 4",
      "stageType": "Stage 4 (3-6 years) / Growing Up",
      "ageRange": "Stage 4 (3-6 years)",
      "nutritionalInfo": {
        "kcal": 66.8,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.4
      },
      "keyFeatures": "Pronutra+, GOS/FOS, LCPs",
      "pharmacistNote": "**Growing Up Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 4 (3-6 years).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Advance 4\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Pronutra+, GOS/FOS, LCPs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Pronutra+, GOS/FOS, LCPs. Designed for Stage 4 (3-6 years).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.2,
        "protein": 1.5,
        "fat": 3.6,
        "carb": 7.5
      },
      "keyFeatures": "Carob bean gum thickener",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Carob bean gum thickener. Designed for All Stages.",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil AR\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Carob bean gum thickener\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Carob bean gum thickener. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Comfort",
      "stageType": "All Stages / Comfort",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.5,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.7
      },
      "keyFeatures": "Hydrolyzed protein, Reduced lactose, Structured lipids",
      "pharmacistNote": "**Comfort Formula**: Hydrolyzed protein, Reduced lactose, Structured lipids. Designed for All Stages.",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Comfort\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Hydrolyzed protein, Reduced lactose, Structured lipids\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Hydrolyzed protein, Reduced lactose, Structured lipids. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 8.1
      },
      "keyFeatures": "Lactose free for intolerance",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free for intolerance. Designed for All Stages.",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil LF\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free for intolerance\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free for intolerance. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Pepti 1",
      "stageType": "Stage 1 (0-6 months) / Extensively Hydrolyzed",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.3,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "For cow's milk protein allergy",
      "pharmacistNote": "**Extensively Hydrolyzed Formula**: For cow's milk protein allergy. Designed for Stage 1 (0-6 months).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للحساسية الشديدة",
          "description": "للأطفال الذين يعانون من حساسية حقيقية من بروتين البقر. البروتين مهضوم بشكل كامل جداً.",
          "when_to_use": "عندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب",
          "benefits": "آمن تماماً للأطفال الذين يعانون من حساسية حقيقية",
          "side_effects": "قد يكون الطعم أقل استساغة"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Pepti 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب\n\n**المميزات:**\n- آمن تماماً للأطفال الذين يعانون من حساسية حقيقية\n- المكونات: For cow's milk protein allergy\n\n**الملاحظات:**\n- قد يكون الطعم أقل استساغة\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Extensively Hydrolyzed Formula**: For cow's milk protein allergy. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil Pepti 2",
      "stageType": "Stage 2 (6-12 months) / Extensively Hydrolyzed",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.7,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "For cow's milk protein allergy",
      "pharmacistNote": "**Extensively Hydrolyzed Formula**: For cow's milk protein allergy. Designed for Stage 2 (6-12 months).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للحساسية الشديدة",
          "description": "للأطفال الذين يعانون من حساسية حقيقية من بروتين البقر. البروتين مهضوم بشكل كامل جداً.",
          "when_to_use": "عندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب",
          "benefits": "آمن تماماً للأطفال الذين يعانون من حساسية حقيقية",
          "side_effects": "قد يكون الطعم أقل استساغة"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil Pepti 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب\n\n**المميزات:**\n- آمن تماماً للأطفال الذين يعانون من حساسية حقيقية\n- المكونات: For cow's milk protein allergy\n\n**الملاحظات:**\n- قد يكون الطعم أقل استساغة\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Extensively Hydrolyzed Formula**: For cow's milk protein allergy. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil HA 1",
      "stageType": "Stage 1 (0-6 months) / Hypoallergenic",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67.5,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.6
      },
      "keyFeatures": "Partially hydrolyzed protein",
      "pharmacistNote": "**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 1 (0-6 months).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للحساسية (وقاية)",
          "description": "للأطفال الذين لديهم تاريخ عائلي من الحساسية أو للوقاية من حساسية البروتين. تحتوي على بروتين مهضوم جزئياً.",
          "when_to_use": "للوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية",
          "benefits": "تقلل خطر الحساسية بنسبة 50%",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil HA 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية\n\n**المميزات:**\n- تقلل خطر الحساسية بنسبة 50%\n- المكونات: Partially hydrolyzed protein\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil HA 2",
      "stageType": "Stage 2 (6-12 months) / Hypoallergenic",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.2,
        "protein": 1.2,
        "fat": 3.3,
        "carb": 7
      },
      "keyFeatures": "Partially hydrolyzed protein",
      "pharmacistNote": "**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 2 (6-12 months).",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للحساسية (وقاية)",
          "description": "للأطفال الذين لديهم تاريخ عائلي من الحساسية أو للوقاية من حساسية البروتين. تحتوي على بروتين مهضوم جزئياً.",
          "when_to_use": "للوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية",
          "benefits": "تقلل خطر الحساسية بنسبة 50%",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil HA 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللوقاية من الحساسية أو عندما يكون هناك تاريخ عائلي من الحساسية\n\n**المميزات:**\n- تقلل خطر الحساسية بنسبة 50%\n- المكونات: Partially hydrolyzed protein\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Hypoallergenic Formula**: Partially hydrolyzed protein. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Aptamil",
      "productName": "Aptamil PDF",
      "stageType": "Pre-term / Post-discharge",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 77,
        "protein": 2.9,
        "fat": 5.1,
        "carb": 10.2
      },
      "keyFeatures": "Enriched for post-discharge preemies",
      "pharmacistNote": "**Post-discharge Formula**: Enriched for post-discharge preemies. Designed for Pre-term.",
      "image": "/images/aptamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "أبتاميل (نوتريشيا)",
          "description": "متخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.",
          "strength": "أفضل للجهاز الهضمي، بريبايوتكس وبوستبايوتكس، جودة عالية",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يحتاجون دعم هضمي ومناعي"
        },
        "arabic": "\n### Aptamil PDF\n\n**ما هو هذا المنتج؟**\nمتخصصة في صحة الجهاز الهضمي والمناعة. تشتهر بنظام Pronutra+ الحصري.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Enriched for post-discharge preemies\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يحتاجون دعم هضمي ومناعي\n\n**ملاحظة صيدلانية:**\n**Post-discharge Formula**: Enriched for post-discharge preemies. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65,
        "protein": 1.3,
        "fat": 3.6,
        "carb": 7.3
      },
      "keyFeatures": "Bioactive compounds, Prebiotics",
      "pharmacistNote": "**Standard Formula**: Bioactive compounds, Prebiotics. Designed for Stage 1 (0-6 months).",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus 1\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Bioactive compounds, Prebiotics\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Bioactive compounds, Prebiotics. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.7,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 7.8
      },
      "keyFeatures": "Bioactive compounds, Prebiotics",
      "pharmacistNote": "**Standard Formula**: Bioactive compounds, Prebiotics. Designed for Stage 2 (6-12 months).",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus 2\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Bioactive compounds, Prebiotics\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Bioactive compounds, Prebiotics. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.8,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.4
      },
      "keyFeatures": "Bioactive compounds, Prebiotics",
      "pharmacistNote": "**Growing Up Formula**: Bioactive compounds, Prebiotics. Designed for Stage 3 (1-3 years).",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus 3\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Bioactive compounds, Prebiotics\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Bioactive compounds, Prebiotics. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.3,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 7.6
      },
      "keyFeatures": "Carob bean gum",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Carob bean gum. Designed for All Stages.",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus AR\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Carob bean gum\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Carob bean gum. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus Comfort",
      "stageType": "All Stages / Comfort",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65,
        "protein": 1.8,
        "fat": 3.5,
        "carb": 7.4
      },
      "keyFeatures": "Hydrolyzed protein, Low lactose",
      "pharmacistNote": "**Comfort Formula**: Hydrolyzed protein, Low lactose. Designed for All Stages.",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus Comfort\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Hydrolyzed protein, Low lactose\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Hydrolyzed protein, Low lactose. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.3,
        "protein": 1.2,
        "fat": 3.2,
        "carb": 8.1
      },
      "keyFeatures": "Maltodextrin based",
      "pharmacistNote": "**Lactose Free Formula**: Maltodextrin based. Designed for All Stages.",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus LF\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Maltodextrin based\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Maltodextrin based. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus Preterm",
      "stageType": "Pre-term / Pre-term",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 89.5,
        "protein": 2.7,
        "fat": 4.9,
        "carb": 9.1
      },
      "keyFeatures": "High calorie, High protein",
      "pharmacistNote": "**Pre-term Formula**: High calorie, High protein. Designed for Pre-term.",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للأطفال المولودين قبل الأوان",
          "description": "مصممة خصيصاً للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو. تحتوي على سعرات حرارية وبروتين أكثر.",
          "when_to_use": "للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو",
          "benefits": "تساعد على اللحاق بالنمو بسرعة",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus Preterm\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nللأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو\n\n**المميزات:**\n- تساعد على اللحاق بالنمو بسرعة\n- المكونات: High calorie, High protein\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Pre-term Formula**: High calorie, High protein. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus Rice 1",
      "stageType": "Stage 1 (0-6 months) / Rice Protein",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66.7,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 8.1
      },
      "keyFeatures": "Hydrolyzed rice protein",
      "pharmacistNote": "**Rice Protein Formula**: Hydrolyzed rice protein. Designed for Stage 1 (0-6 months).",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus Rice 1\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Hydrolyzed rice protein\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Rice Protein Formula**: Hydrolyzed rice protein. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Blemil",
      "productName": "Blemil Plus Rice 2",
      "stageType": "Stage 2 (6-12 months) / Rice Protein",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 7.2
      },
      "keyFeatures": "Hydrolyzed rice protein",
      "pharmacistNote": "**Rice Protein Formula**: Hydrolyzed rice protein. Designed for Stage 2 (6-12 months).",
      "image": "/images/blemil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بليميل (إسبانيا)",
          "description": "متوازنة جداً وآمنة للأطفال الحساسين قليلاً.",
          "strength": "توازن مثالي، سعر معقول، آمن جداً",
          "price": "معقول",
          "best_for": "الآباء والأمهات الذين يريدون جودة بسعر معقول"
        },
        "arabic": "\n### Blemil Plus Rice 2\n\n**ما هو هذا المنتج؟**\nمتوازنة جداً وآمنة للأطفال الحساسين قليلاً.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Hydrolyzed rice protein\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الآباء والأمهات الذين يريدون جودة بسعر معقول\n\n**ملاحظة صيدلانية:**\n**Rice Protein Formula**: Hydrolyzed rice protein. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66,
        "protein": 1.8,
        "fat": 3.4,
        "carb": 7.6
      },
      "keyFeatures": "Adapted protein profile",
      "pharmacistNote": "**Standard Formula**: Adapted protein profile. Designed for Stage 1 (0-6 months).",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Adapted protein profile\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Adapted protein profile. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.7,
        "protein": 1.3,
        "fat": 3.2,
        "carb": 7.7
      },
      "keyFeatures": "Adapted protein profile",
      "pharmacistNote": "**Standard Formula**: Adapted protein profile. Designed for Stage 2 (6-12 months).",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Adapted protein profile\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Adapted protein profile. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 64.5,
        "protein": 1.2,
        "fat": 3.4,
        "carb": 8
      },
      "keyFeatures": "Vanilla flavor, Enriched",
      "pharmacistNote": "**Growing Up Formula**: Vanilla flavor, Enriched. Designed for Stage 3 (1-3 years).",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac 3\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Vanilla flavor, Enriched\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Vanilla flavor, Enriched. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.8,
        "fat": 3.2,
        "carb": 7.8
      },
      "keyFeatures": "Corn starch thickener",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Corn starch thickener. Designed for All Stages.",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac AR\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Corn starch thickener\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Corn starch thickener. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac AR Digest",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 7.3
      },
      "keyFeatures": "Dual thickener (Carob + Starch), Hydrolyzed protein",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Dual thickener (Carob + Starch), Hydrolyzed protein. Designed for All Stages.",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac AR Digest\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Dual thickener (Carob + Starch), Hydrolyzed protein\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Dual thickener (Carob + Starch), Hydrolyzed protein. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac AC",
      "stageType": "All Stages / Anti-Colic",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.3,
        "protein": 1.3,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Low lactose for gas/colic",
      "pharmacistNote": "**Anti-Colic Formula**: Low lactose for gas/colic. Designed for All Stages.",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac AC\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Low lactose for gas/colic\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Anti-Colic Formula**: Low lactose for gas/colic. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac IT",
      "stageType": "All Stages / Constipation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.4,
        "protein": 1.5,
        "fat": 3.5,
        "carb": 8.1
      },
      "keyFeatures": "High lactose, Magnesium for transit",
      "pharmacistNote": "**Constipation Formula**: High lactose, Magnesium for transit. Designed for All Stages.",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac IT\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: High lactose, Magnesium for transit\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Constipation Formula**: High lactose, Magnesium for transit. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac Allernova",
      "stageType": "All Stages / Extensively Hydrolyzed",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.9,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Casein hydrolysate for CMPA",
      "pharmacistNote": "**Extensively Hydrolyzed Formula**: Casein hydrolysate for CMPA. Designed for All Stages.",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للحساسية الشديدة",
          "description": "للأطفال الذين يعانون من حساسية حقيقية من بروتين البقر. البروتين مهضوم بشكل كامل جداً.",
          "when_to_use": "عندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب",
          "benefits": "آمن تماماً للأطفال الذين يعانون من حساسية حقيقية",
          "side_effects": "قد يكون الطعم أقل استساغة"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac Allernova\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب\n\n**المميزات:**\n- آمن تماماً للأطفال الذين يعانون من حساسية حقيقية\n- المكونات: Casein hydrolysate for CMPA\n\n**الملاحظات:**\n- قد يكون الطعم أقل استساغة\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Extensively Hydrolyzed Formula**: Casein hydrolysate for CMPA. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Novalac",
      "productName": "Novalac Genio",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 64.3,
        "protein": 1.4,
        "fat": 3.2,
        "carb": 7.9
      },
      "keyFeatures": "DHA, Iron, Calcium",
      "pharmacistNote": "**Growing Up Formula**: DHA, Iron, Calcium. Designed for Stage 3 (1-3 years).",
      "image": "/images/novalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "نوفالاك",
          "description": "متخصصة في الحالات الخاصة والمعقدة.",
          "strength": "خيارات متعددة للحالات الخاصة، جودة جيدة",
          "price": "معقول",
          "best_for": "الحالات الخاصة والمعقدة"
        },
        "arabic": "\n### Novalac Genio\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات الخاصة والمعقدة.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: DHA, Iron, Calcium\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الحالات الخاصة والمعقدة\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: DHA, Iron, Calcium. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 Gold 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 7.3
      },
      "keyFeatures": "Alpha-lactalbumin, DHA/ARA",
      "pharmacistNote": "**Standard Formula**: Alpha-lactalbumin, DHA/ARA. Designed for Stage 1 (0-6 months).",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 Gold 1\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Alpha-lactalbumin, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Alpha-lactalbumin, DHA/ARA. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 Gold 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 7.1
      },
      "keyFeatures": "Alpha-lactalbumin, DHA/ARA",
      "pharmacistNote": "**Standard Formula**: Alpha-lactalbumin, DHA/ARA. Designed for Stage 2 (6-12 months).",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 Gold 2\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Alpha-lactalbumin, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Alpha-lactalbumin, DHA/ARA. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 Gold 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 64.1,
        "protein": 1.6,
        "fat": 3.4,
        "carb": 7.9
      },
      "keyFeatures": "Alpha-lactalbumin, DHA/ARA",
      "pharmacistNote": "**Growing Up Formula**: Alpha-lactalbumin, DHA/ARA. Designed for Stage 3 (1-3 years).",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 Gold 3\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Alpha-lactalbumin, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Alpha-lactalbumin, DHA/ARA. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.3,
        "fat": 3.4,
        "carb": 7.8
      },
      "keyFeatures": "Starch thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Starch thickened. Designed for All Stages.",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 AR\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Starch thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Starch thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 Comfort",
      "stageType": "All Stages / Comfort",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.8,
        "fat": 3.5,
        "carb": 7.2
      },
      "keyFeatures": "Partially hydrolyzed, Low lactose",
      "pharmacistNote": "**Comfort Formula**: Partially hydrolyzed, Low lactose. Designed for All Stages.",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 Comfort\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Partially hydrolyzed, Low lactose\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Partially hydrolyzed, Low lactose. Designed for All Stages.\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.9,
        "protein": 1.4,
        "fat": 3.3,
        "carb": 7.6
      },
      "keyFeatures": "Lactose free formula",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free formula. Designed for All Stages.",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 LF\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free formula\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free formula. Designed for All Stages.\n"
      }
    },
    {
      "brand": "S-26",
      "productName": "S-26 PDF",
      "stageType": "Pre-term / Post-discharge",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 96.1,
        "protein": 2.7,
        "fat": 5.1,
        "carb": 10.3
      },
      "keyFeatures": "Catch-up growth formula",
      "pharmacistNote": "**Post-discharge Formula**: Catch-up growth formula. Designed for Pre-term.",
      "image": "/images/s26-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "إس-26 (Wyeth)",
          "description": "تشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.",
          "strength": "سهل الهضم، يقلل الإمساك، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة أو إمساك"
        },
        "arabic": "\n### S-26 PDF\n\n**ما هو هذا المنتج؟**\nتشتهر بـ Alpha-lactalbumin الذي يسهل الهضم.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Catch-up growth formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة أو إمساك\n\n**ملاحظة صيدلانية:**\n**Post-discharge Formula**: Catch-up growth formula. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.7,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.9
      },
      "keyFeatures": "Prebiotics, Iron, Omega 3",
      "pharmacistNote": "**Standard Formula**: Prebiotics, Iron, Omega 3. Designed for Stage 1 (0-6 months).",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac 1\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Prebiotics, Iron, Omega 3\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Prebiotics, Iron, Omega 3. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 8.1
      },
      "keyFeatures": "Prebiotics, Iron, Omega 3",
      "pharmacistNote": "**Standard Formula**: Prebiotics, Iron, Omega 3. Designed for Stage 2 (6-12 months).",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac 2\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Prebiotics, Iron, Omega 3\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Prebiotics, Iron, Omega 3. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.9,
        "protein": 1.4,
        "fat": 3.6,
        "carb": 7.1
      },
      "keyFeatures": "Prebiotics, Iron, Omega 3",
      "pharmacistNote": "**Growing Up Formula**: Prebiotics, Iron, Omega 3. Designed for Stage 3 (1-3 years).",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac 3\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Prebiotics, Iron, Omega 3\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Prebiotics, Iron, Omega 3. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac EC",
      "stageType": "All Stages / Extra Care",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.1,
        "protein": 1.6,
        "fat": 3.4,
        "carb": 8.2
      },
      "keyFeatures": "For digestive discomfort",
      "pharmacistNote": "**Extra Care Formula**: For digestive discomfort. Designed for All Stages.",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac EC\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: For digestive discomfort\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Extra Care Formula**: For digestive discomfort. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.9,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 7.1
      },
      "keyFeatures": "Locust bean gum",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Locust bean gum. Designed for All Stages.",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac AR\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Locust bean gum\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Locust bean gum. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65,
        "protein": 1.5,
        "fat": 3.4,
        "carb": 7.2
      },
      "keyFeatures": "For lactose intolerance",
      "pharmacistNote": "**Lactose Free Formula**: For lactose intolerance. Designed for All Stages.",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac LF\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: For lactose intolerance\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: For lactose intolerance. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Bebelac",
      "productName": "Bebelac Premature",
      "stageType": "Pre-term / Pre-term",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 87,
        "protein": 2.9,
        "fat": 4.8,
        "carb": 10.2
      },
      "keyFeatures": "For low birth weight infants",
      "pharmacistNote": "**Pre-term Formula**: For low birth weight infants. Designed for Pre-term.",
      "image": "/images/bebelac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للأطفال المولودين قبل الأوان",
          "description": "مصممة خصيصاً للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو. تحتوي على سعرات حرارية وبروتين أكثر.",
          "when_to_use": "للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو",
          "benefits": "تساعد على اللحاق بالنمو بسرعة",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "بيبيلاك",
          "description": "متوازنة وآمنة جداً للأطفال الحساسين.",
          "strength": "آمن جداً، توازن جيد، سعر معقول",
          "price": "معقول",
          "best_for": "الأطفال الذين يحتاجون حليب آمن وموثوق"
        },
        "arabic": "\n### Bebelac Premature\n\n**ما هو هذا المنتج؟**\nمتوازنة وآمنة جداً للأطفال الحساسين.\n\n**متى تستخدمه؟**\nللأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو\n\n**المميزات:**\n- تساعد على اللحاق بالنمو بسرعة\n- المكونات: For low birth weight infants\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الأطفال الذين يحتاجون حليب آمن وموثوق\n\n**ملاحظة صيدلانية:**\n**Pre-term Formula**: For low birth weight infants. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.7,
        "fat": 3.2,
        "carb": 7.5
      },
      "keyFeatures": "Alpha-lactalbumin, DHA/ARA, Nucleotides",
      "pharmacistNote": "**Standard Formula**: Alpha-lactalbumin, DHA/ARA, Nucleotides. Designed for Stage 1 (0-6 months).",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Alpha-lactalbumin, DHA/ARA, Nucleotides\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Alpha-lactalbumin, DHA/ARA, Nucleotides. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 68,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 8.2
      },
      "keyFeatures": "Alpha-lactalbumin, DHA/ARA, Nucleotides",
      "pharmacistNote": "**Standard Formula**: Alpha-lactalbumin, DHA/ARA, Nucleotides. Designed for Stage 2 (6-12 months).",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Alpha-lactalbumin, DHA/ARA, Nucleotides\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Alpha-lactalbumin, DHA/ARA, Nucleotides. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 64.3,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "Alpha-lactalbumin, DHA/ARA, Nucleotides",
      "pharmacistNote": "**Growing Up Formula**: Alpha-lactalbumin, DHA/ARA, Nucleotides. Designed for Stage 3 (1-3 years).",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Alpha-lactalbumin, DHA/ARA, Nucleotides\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Alpha-lactalbumin, DHA/ARA, Nucleotides. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.4,
        "protein": 1.5,
        "fat": 3.4,
        "carb": 7.8
      },
      "keyFeatures": "Carob bean gum",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Carob bean gum. Designed for All Stages.",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Carob bean gum\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Carob bean gum. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk Comfort",
      "stageType": "All Stages / Comfort",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.4,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 7.1
      },
      "keyFeatures": "Reduced lactose, Probiotics",
      "pharmacistNote": "**Comfort Formula**: Reduced lactose, Probiotics. Designed for All Stages.",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk Comfort\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Reduced lactose, Probiotics\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Reduced lactose, Probiotics. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.9,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 7.8
      },
      "keyFeatures": "Maltodextrin based",
      "pharmacistNote": "**Lactose Free Formula**: Maltodextrin based. Designed for All Stages.",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Maltodextrin based\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Maltodextrin based. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Fabimilk",
      "productName": "Fabimilk Allevia",
      "stageType": "All Stages / Hydrolyzed",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.6,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 7.5
      },
      "keyFeatures": "Hydrolyzed protein for allergy prevention",
      "pharmacistNote": "**Hydrolyzed Formula**: Hydrolyzed protein for allergy prevention. Designed for All Stages.",
      "image": "/images/fabimilk-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Fabimilk",
          "description": "تركيبة من Fabimilk",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fabimilk Allevia\n\n**ما هو هذا المنتج؟**\nتركيبة من Fabimilk\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Hydrolyzed protein for allergy prevention\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Hydrolyzed Formula**: Hydrolyzed protein for allergy prevention. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67,
        "protein": 1.5,
        "fat": 3.4,
        "carb": 7.8
      },
      "keyFeatures": "Prebiotics, Nucleotides, DHA",
      "pharmacistNote": "**Standard Formula**: Prebiotics, Nucleotides, DHA. Designed for Stage 1 (0-6 months).",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Prebiotics, Nucleotides, DHA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Prebiotics, Nucleotides, DHA. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.8,
        "protein": 1.4,
        "fat": 3.6,
        "carb": 7.3
      },
      "keyFeatures": "Prebiotics, Nucleotides, DHA",
      "pharmacistNote": "**Standard Formula**: Prebiotics, Nucleotides, DHA. Designed for Stage 2 (6-12 months).",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Prebiotics, Nucleotides, DHA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Prebiotics, Nucleotides, DHA. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.3,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 8
      },
      "keyFeatures": "Prebiotics, Nucleotides, DHA",
      "pharmacistNote": "**Growing Up Formula**: Prebiotics, Nucleotides, DHA. Designed for Stage 3 (1-3 years).",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Prebiotics, Nucleotides, DHA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Prebiotics, Nucleotides, DHA. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac AR 1",
      "stageType": "Stage 1 (0-6 months) / Anti-Regurgitation",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.2,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.9
      },
      "keyFeatures": "Thickened formula",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened formula. Designed for Stage 1 (0-6 months).",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac AR 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened formula\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened formula. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac AR 2",
      "stageType": "Stage 2 (6-12 months) / Anti-Regurgitation",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.8
      },
      "keyFeatures": "Thickened formula",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened formula. Designed for Stage 2 (6-12 months).",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac AR 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened formula\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened formula. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac AC",
      "stageType": "All Stages / Anti-Colic",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.3,
        "fat": 3.2,
        "carb": 7.1
      },
      "keyFeatures": "Low lactose",
      "pharmacistNote": "**Anti-Colic Formula**: Low lactose. Designed for All Stages.",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac AC\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Low lactose\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Colic Formula**: Low lactose. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.2,
        "protein": 1.2,
        "fat": 3.6,
        "carb": 8.1
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac CMA",
      "stageType": "All Stages / Extensively Hydrolyzed",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.5,
        "protein": 1.2,
        "fat": 3.3,
        "carb": 7.2
      },
      "keyFeatures": "For cow's milk allergy",
      "pharmacistNote": "**Extensively Hydrolyzed Formula**: For cow's milk allergy. Designed for All Stages.",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للحساسية الشديدة",
          "description": "للأطفال الذين يعانون من حساسية حقيقية من بروتين البقر. البروتين مهضوم بشكل كامل جداً.",
          "when_to_use": "عندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب",
          "benefits": "آمن تماماً للأطفال الذين يعانون من حساسية حقيقية",
          "side_effects": "قد يكون الطعم أقل استساغة"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac CMA\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب\n\n**المميزات:**\n- آمن تماماً للأطفال الذين يعانون من حساسية حقيقية\n- المكونات: For cow's milk allergy\n\n**الملاحظات:**\n- قد يكون الطعم أقل استساغة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Extensively Hydrolyzed Formula**: For cow's milk allergy. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Primalac",
      "productName": "Primalac Pre",
      "stageType": "Pre-term / Pre-term",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 97.4,
        "protein": 2.6,
        "fat": 4.6,
        "carb": 8.6
      },
      "keyFeatures": "For premature infants",
      "pharmacistNote": "**Pre-term Formula**: For premature infants. Designed for Pre-term.",
      "image": "/images/primalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للأطفال المولودين قبل الأوان",
          "description": "مصممة خصيصاً للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو. تحتوي على سعرات حرارية وبروتين أكثر.",
          "when_to_use": "للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو",
          "benefits": "تساعد على اللحاق بالنمو بسرعة",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "Primalac",
          "description": "تركيبة من Primalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Primalac Pre\n\n**ما هو هذا المنتج؟**\nتركيبة من Primalac\n\n**متى تستخدمه؟**\nللأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو\n\n**المميزات:**\n- تساعد على اللحاق بالنمو بسرعة\n- المكونات: For premature infants\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Pre-term Formula**: For premature infants. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66,
        "protein": 1.4,
        "fat": 3.3,
        "carb": 7.1
      },
      "keyFeatures": "Immunobooster system",
      "pharmacistNote": "**Standard Formula**: Immunobooster system. Designed for Stage 1 (0-6 months).",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Immunobooster system\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Immunobooster system. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.1,
        "protein": 1.7,
        "fat": 3.2,
        "carb": 7.9
      },
      "keyFeatures": "Immunobooster system",
      "pharmacistNote": "**Standard Formula**: Immunobooster system. Designed for Stage 2 (6-12 months).",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Immunobooster system\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Immunobooster system. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronagrow",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 64.7,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 7.2
      },
      "keyFeatures": "Fortified with iron and vitamins",
      "pharmacistNote": "**Growing Up Formula**: Fortified with iron and vitamins. Designed for Stage 3 (1-3 years).",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronagrow\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Fortified with iron and vitamins\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Fortified with iron and vitamins. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.7,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 7.4
      },
      "keyFeatures": "Thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac AC",
      "stageType": "All Stages / Anti-Colic",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.1,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 7.4
      },
      "keyFeatures": "Low lactose",
      "pharmacistNote": "**Anti-Colic Formula**: Low lactose. Designed for All Stages.",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac AC\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Low lactose\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Colic Formula**: Low lactose. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac Gentle",
      "stageType": "All Stages / Comfort",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.8,
        "protein": 1.4,
        "fat": 3.2,
        "carb": 7.1
      },
      "keyFeatures": "Partially hydrolyzed",
      "pharmacistNote": "**Comfort Formula**: Partially hydrolyzed. Designed for All Stages.",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الراحة",
          "description": "مصممة للأطفال الذين يعانون من مغص شديد أو غازات كثيرة. تحتوي على بروتين مهضوم جزئياً ودهون مهيكلة.",
          "when_to_use": "عندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف",
          "benefits": "تقلل المغص والغازات بنسبة 60%، تحسن الهضم",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac Gentle\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من مغص شديد أو غازات أو إمساك خفيف\n\n**المميزات:**\n- تقلل المغص والغازات بنسبة 60%، تحسن الهضم\n- المكونات: Partially hydrolyzed\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Comfort Formula**: Partially hydrolyzed. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.3,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.5
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Ronalac",
      "productName": "Ronalac Premature",
      "stageType": "Pre-term / Pre-term",
      "ageRange": "Pre-term",
      "nutritionalInfo": {
        "kcal": 97.1,
        "protein": 2.7,
        "fat": 4.2,
        "carb": 9.5
      },
      "keyFeatures": "High energy",
      "pharmacistNote": "**Pre-term Formula**: High energy. Designed for Pre-term.",
      "image": "/images/ronalac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للأطفال المولودين قبل الأوان",
          "description": "مصممة خصيصاً للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو. تحتوي على سعرات حرارية وبروتين أكثر.",
          "when_to_use": "للأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو",
          "benefits": "تساعد على اللحاق بالنمو بسرعة",
          "side_effects": "قد تسبب براز أكثر ليونة"
        },
        "brand": {
          "ar_name": "Ronalac",
          "description": "تركيبة من Ronalac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ronalac Premature\n\n**ما هو هذا المنتج؟**\nتركيبة من Ronalac\n\n**متى تستخدمه؟**\nللأطفال المولودين قبل الأوان أو الذين يعانون من تأخر النمو\n\n**المميزات:**\n- تساعد على اللحاق بالنمو بسرعة\n- المكونات: High energy\n\n**الملاحظات:**\n- قد تسبب براز أكثر ليونة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Pre-term Formula**: High energy. Designed for Pre-term.\n"
      }
    },
    {
      "brand": "Babywell",
      "productName": "Babywell 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67.8,
        "protein": 1.8,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Balanced nutrition, Affordable",
      "pharmacistNote": "**Standard Formula**: Balanced nutrition, Affordable. Designed for Stage 1 (0-6 months).",
      "image": "/images/babywell-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Babywell",
          "description": "تركيبة من Babywell",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Babywell 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Babywell\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Balanced nutrition, Affordable\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Balanced nutrition, Affordable. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Babywell",
      "productName": "Babywell 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.4,
        "fat": 3.3,
        "carb": 7.8
      },
      "keyFeatures": "Balanced nutrition, Affordable",
      "pharmacistNote": "**Standard Formula**: Balanced nutrition, Affordable. Designed for Stage 2 (6-12 months).",
      "image": "/images/babywell-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Babywell",
          "description": "تركيبة من Babywell",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Babywell 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Babywell\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Balanced nutrition, Affordable\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Balanced nutrition, Affordable. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Babywell",
      "productName": "Babywell 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.6,
        "fat": 3.5,
        "carb": 7.6
      },
      "keyFeatures": "Balanced nutrition, Affordable",
      "pharmacistNote": "**Growing Up Formula**: Balanced nutrition, Affordable. Designed for Stage 3 (1-3 years).",
      "image": "/images/babywell-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Babywell",
          "description": "تركيبة من Babywell",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Babywell 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Babywell\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Balanced nutrition, Affordable\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Balanced nutrition, Affordable. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Babywell",
      "productName": "Babywell AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66,
        "protein": 1.7,
        "fat": 3.2,
        "carb": 7.9
      },
      "keyFeatures": "Thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.",
      "image": "/images/babywell-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Babywell",
          "description": "تركيبة من Babywell",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Babywell AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Babywell\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Babywell",
      "productName": "Babywell LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.9,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 7.8
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/babywell-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Babywell",
          "description": "تركيبة من Babywell",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Babywell LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Babywell\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Nuralac",
      "productName": "Nuralac 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67.9,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 7.6
      },
      "keyFeatures": "NuraComplete system",
      "pharmacistNote": "**Standard Formula**: NuraComplete system. Designed for Stage 1 (0-6 months).",
      "image": "/images/nuralac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nuralac",
          "description": "تركيبة من Nuralac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nuralac 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Nuralac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: NuraComplete system\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: NuraComplete system. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Nuralac",
      "productName": "Nuralac 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 65.4,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 8
      },
      "keyFeatures": "NuraComplete system",
      "pharmacistNote": "**Standard Formula**: NuraComplete system. Designed for Stage 2 (6-12 months).",
      "image": "/images/nuralac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nuralac",
          "description": "تركيبة من Nuralac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nuralac 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Nuralac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: NuraComplete system\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: NuraComplete system. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Nuralac",
      "productName": "Nuralac 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.8,
        "protein": 1.2,
        "fat": 3.6,
        "carb": 7.9
      },
      "keyFeatures": "NuraComplete system",
      "pharmacistNote": "**Growing Up Formula**: NuraComplete system. Designed for Stage 3 (1-3 years).",
      "image": "/images/nuralac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nuralac",
          "description": "تركيبة من Nuralac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nuralac 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Nuralac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: NuraComplete system\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: NuraComplete system. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Nuralac",
      "productName": "Nuralac AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.4,
        "protein": 1.4,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "Thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.",
      "image": "/images/nuralac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Nuralac",
          "description": "تركيبة من Nuralac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nuralac AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Nuralac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Nuralac",
      "productName": "Nuralac AC",
      "stageType": "All Stages / Anti-Colic",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.6,
        "protein": 1.8,
        "fat": 3.4,
        "carb": 7.5
      },
      "keyFeatures": "Low lactose",
      "pharmacistNote": "**Anti-Colic Formula**: Low lactose. Designed for All Stages.",
      "image": "/images/nuralac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nuralac",
          "description": "تركيبة من Nuralac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nuralac AC\n\n**ما هو هذا المنتج؟**\nتركيبة من Nuralac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Low lactose\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Colic Formula**: Low lactose. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Nuralac",
      "productName": "Nuralac LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 7.5
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/nuralac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Nuralac",
          "description": "تركيبة من Nuralac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nuralac LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Nuralac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.2,
        "protein": 1.8,
        "fat": 3.4,
        "carb": 7.4
      },
      "keyFeatures": "GMO Free, ProBalance",
      "pharmacistNote": "**Standard Formula**: GMO Free, ProBalance. Designed for Stage 1 (0-6 months).",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: GMO Free, ProBalance\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: GMO Free, ProBalance. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 65.3,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.3
      },
      "keyFeatures": "GMO Free, ProBalance",
      "pharmacistNote": "**Standard Formula**: GMO Free, ProBalance. Designed for Stage 2 (6-12 months).",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: GMO Free, ProBalance\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: GMO Free, ProBalance. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.6,
        "protein": 1.4,
        "fat": 3.4,
        "carb": 7.5
      },
      "keyFeatures": "GMO Free, ProBalance",
      "pharmacistNote": "**Growing Up Formula**: GMO Free, ProBalance. Designed for Stage 3 (1-3 years).",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: GMO Free, ProBalance\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: GMO Free, ProBalance. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.3,
        "protein": 1.4,
        "fat": 3.3,
        "carb": 8.2
      },
      "keyFeatures": "Thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana AC",
      "stageType": "All Stages / Anti-Colic",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.2,
        "protein": 1.2,
        "fat": 3.3,
        "carb": 8.1
      },
      "keyFeatures": "Special lipid blend",
      "pharmacistNote": "**Anti-Colic Formula**: Special lipid blend. Designed for All Stages.",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana AC\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Special lipid blend\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Colic Formula**: Special lipid blend. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.7,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 7.2
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Humana",
      "productName": "Humana SL",
      "stageType": "All Stages / Soy Based",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.5,
        "fat": 3.6,
        "carb": 7.7
      },
      "keyFeatures": "Soy based formula",
      "pharmacistNote": "**Soy Based Formula**: Soy based formula. Designed for All Stages.",
      "image": "/images/humana-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Humana",
          "description": "تركيبة من Humana",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Humana SL\n\n**ما هو هذا المنتج؟**\nتركيبة من Humana\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Soy based formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Soy Based Formula**: Soy based formula. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 7.3
      },
      "keyFeatures": "Whole milk fat, No palm oil",
      "pharmacistNote": "**Standard Formula**: Whole milk fat, No palm oil. Designed for Stage 1 (0-6 months).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Whole milk fat, No palm oil\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Whole milk fat, No palm oil. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 65.7,
        "protein": 1.5,
        "fat": 3.4,
        "carb": 7.7
      },
      "keyFeatures": "Whole milk fat, No palm oil",
      "pharmacistNote": "**Standard Formula**: Whole milk fat, No palm oil. Designed for Stage 2 (6-12 months).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Whole milk fat, No palm oil\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Whole milk fat, No palm oil. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.3,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 7.3
      },
      "keyFeatures": "Whole milk fat, No palm oil",
      "pharmacistNote": "**Growing Up Formula**: Whole milk fat, No palm oil. Designed for Stage 3 (1-3 years).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil 3\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Whole milk fat, No palm oil\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Whole milk fat, No palm oil. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil Organic 1",
      "stageType": "Stage 1 (0-6 months) / Organic",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.3,
        "protein": 1.6,
        "fat": 3.3,
        "carb": 7.4
      },
      "keyFeatures": "Certified organic, Whole milk",
      "pharmacistNote": "**Organic Formula**: Certified organic, Whole milk. Designed for Stage 1 (0-6 months).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة عضوية",
          "description": "مصنوعة من مكونات عضوية معتمدة بدون مبيدات حشرية أو هرمونات.",
          "when_to_use": "للآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة",
          "benefits": "الأكثر أماناً والأقل تلوثاً بالمبيدات",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil Organic 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة\n\n**المميزات:**\n- الأكثر أماناً والأقل تلوثاً بالمبيدات\n- المكونات: Certified organic, Whole milk\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Organic Formula**: Certified organic, Whole milk. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil Organic 2",
      "stageType": "Stage 2 (6-12 months) / Organic",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.6,
        "protein": 1.4,
        "fat": 3.4,
        "carb": 7.3
      },
      "keyFeatures": "Certified organic, Whole milk",
      "pharmacistNote": "**Organic Formula**: Certified organic, Whole milk. Designed for Stage 2 (6-12 months).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة عضوية",
          "description": "مصنوعة من مكونات عضوية معتمدة بدون مبيدات حشرية أو هرمونات.",
          "when_to_use": "للآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة",
          "benefits": "الأكثر أماناً والأقل تلوثاً بالمبيدات",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil Organic 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة\n\n**المميزات:**\n- الأكثر أماناً والأقل تلوثاً بالمبيدات\n- المكونات: Certified organic, Whole milk\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Organic Formula**: Certified organic, Whole milk. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil Organic 3",
      "stageType": "Stage 3 (1-3 years) / Organic",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.1,
        "protein": 1.2,
        "fat": 3.2,
        "carb": 7.3
      },
      "keyFeatures": "Certified organic, Whole milk",
      "pharmacistNote": "**Organic Formula**: Certified organic, Whole milk. Designed for Stage 3 (1-3 years).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة عضوية",
          "description": "مصنوعة من مكونات عضوية معتمدة بدون مبيدات حشرية أو هرمونات.",
          "when_to_use": "للآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة",
          "benefits": "الأكثر أماناً والأقل تلوثاً بالمبيدات",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil Organic 3\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة\n\n**المميزات:**\n- الأكثر أماناً والأقل تلوثاً بالمبيدات\n- المكونات: Certified organic, Whole milk\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Organic Formula**: Certified organic, Whole milk. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil Goat 1",
      "stageType": "Stage 1 (0-6 months) / Goat Milk",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.6,
        "protein": 1.8,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "A2 protein, Gentle digestion",
      "pharmacistNote": "**Goat Milk Formula**: A2 protein, Gentle digestion. Designed for Stage 1 (0-6 months).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil Goat 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: A2 protein, Gentle digestion\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: A2 protein, Gentle digestion. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil Goat 2",
      "stageType": "Stage 2 (6-12 months) / Goat Milk",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64.7,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.2
      },
      "keyFeatures": "A2 protein, Gentle digestion",
      "pharmacistNote": "**Goat Milk Formula**: A2 protein, Gentle digestion. Designed for Stage 2 (6-12 months).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil Goat 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: A2 protein, Gentle digestion\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: A2 protein, Gentle digestion. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Kendamil",
      "productName": "Kendamil Goat 3",
      "stageType": "Stage 3 (1-3 years) / Goat Milk",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.6,
        "protein": 1.8,
        "fat": 3.6,
        "carb": 7.4
      },
      "keyFeatures": "A2 protein, Gentle digestion",
      "pharmacistNote": "**Goat Milk Formula**: A2 protein, Gentle digestion. Designed for Stage 3 (1-3 years).",
      "image": "/images/kendamil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "كندميل",
          "description": "متخصصة في الحليب الطبيعي والعضوي.",
          "strength": "بدون زيت نخيل، عضوي، جودة عالية",
          "price": "مرتفع",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والعضوي"
        },
        "arabic": "\n### Kendamil Goat 3\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحليب الطبيعي والعضوي.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: A2 protein, Gentle digestion\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والعضوي\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: A2 protein, Gentle digestion. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Kabrita",
      "productName": "Kabrita 1",
      "stageType": "Stage 1 (0-6 months) / Goat Milk",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.8,
        "protein": 1.5,
        "fat": 3.2,
        "carb": 7.6
      },
      "keyFeatures": "Easy to digest, A2 protein",
      "pharmacistNote": "**Goat Milk Formula**: Easy to digest, A2 protein. Designed for Stage 1 (0-6 months).",
      "image": "/images/kabrita-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "كابريتا",
          "description": "متخصصة في حليب الماعز الطبيعي.",
          "strength": "حليب ماعز طبيعي، سهل الهضم، طبيعي",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة"
        },
        "arabic": "\n### Kabrita 1\n\n**ما هو هذا المنتج؟**\nمتخصصة في حليب الماعز الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Easy to digest, A2 protein\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Easy to digest, A2 protein. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Kabrita",
      "productName": "Kabrita 2",
      "stageType": "Stage 2 (6-12 months) / Goat Milk",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.2,
        "fat": 3.5,
        "carb": 7.1
      },
      "keyFeatures": "Easy to digest, A2 protein",
      "pharmacistNote": "**Goat Milk Formula**: Easy to digest, A2 protein. Designed for Stage 2 (6-12 months).",
      "image": "/images/kabrita-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "كابريتا",
          "description": "متخصصة في حليب الماعز الطبيعي.",
          "strength": "حليب ماعز طبيعي، سهل الهضم، طبيعي",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة"
        },
        "arabic": "\n### Kabrita 2\n\n**ما هو هذا المنتج؟**\nمتخصصة في حليب الماعز الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Easy to digest, A2 protein\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Easy to digest, A2 protein. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Kabrita",
      "productName": "Kabrita 3",
      "stageType": "Stage 3 (1-3 years) / Goat Milk",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.6,
        "protein": 1.8,
        "fat": 3.4,
        "carb": 7.6
      },
      "keyFeatures": "Easy to digest, A2 protein",
      "pharmacistNote": "**Goat Milk Formula**: Easy to digest, A2 protein. Designed for Stage 3 (1-3 years).",
      "image": "/images/kabrita-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "كابريتا",
          "description": "متخصصة في حليب الماعز الطبيعي.",
          "strength": "حليب ماعز طبيعي، سهل الهضم، طبيعي",
          "price": "مرتفع",
          "best_for": "الأطفال الذين يعانون من حساسية خفيفة"
        },
        "arabic": "\n### Kabrita 3\n\n**ما هو هذا المنتج؟**\nمتخصصة في حليب الماعز الطبيعي.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Easy to digest, A2 protein\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع\n- الأنسب لـ: الأطفال الذين يعانون من حساسية خفيفة\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Easy to digest, A2 protein. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Holle",
      "productName": "Holle Organic 1",
      "stageType": "Stage 1 (0-6 months) / Organic",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66,
        "protein": 1.3,
        "fat": 3.4,
        "carb": 7.4
      },
      "keyFeatures": "Demeter certified organic",
      "pharmacistNote": "**Organic Formula**: Demeter certified organic. Designed for Stage 1 (0-6 months).",
      "image": "/images/holle-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة عضوية",
          "description": "مصنوعة من مكونات عضوية معتمدة بدون مبيدات حشرية أو هرمونات.",
          "when_to_use": "للآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة",
          "benefits": "الأكثر أماناً والأقل تلوثاً بالمبيدات",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "هولي",
          "description": "الأكثر طبيعية وعضوية معتمدة Demeter.",
          "strength": "عضوي معتمد Demeter، أعلى معايير أمان، طبيعي جداً",
          "price": "مرتفع جداً",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً"
        },
        "arabic": "\n### Holle Organic 1\n\n**ما هو هذا المنتج؟**\nالأكثر طبيعية وعضوية معتمدة Demeter.\n\n**متى تستخدمه؟**\nللآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة\n\n**المميزات:**\n- الأكثر أماناً والأقل تلوثاً بالمبيدات\n- المكونات: Demeter certified organic\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع جداً\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً\n\n**ملاحظة صيدلانية:**\n**Organic Formula**: Demeter certified organic. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Holle",
      "productName": "Holle Organic 2",
      "stageType": "Stage 2 (6-12 months) / Organic",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 7.9
      },
      "keyFeatures": "Demeter certified organic",
      "pharmacistNote": "**Organic Formula**: Demeter certified organic. Designed for Stage 2 (6-12 months).",
      "image": "/images/holle-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة عضوية",
          "description": "مصنوعة من مكونات عضوية معتمدة بدون مبيدات حشرية أو هرمونات.",
          "when_to_use": "للآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة",
          "benefits": "الأكثر أماناً والأقل تلوثاً بالمبيدات",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "هولي",
          "description": "الأكثر طبيعية وعضوية معتمدة Demeter.",
          "strength": "عضوي معتمد Demeter، أعلى معايير أمان، طبيعي جداً",
          "price": "مرتفع جداً",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً"
        },
        "arabic": "\n### Holle Organic 2\n\n**ما هو هذا المنتج؟**\nالأكثر طبيعية وعضوية معتمدة Demeter.\n\n**متى تستخدمه؟**\nللآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة\n\n**المميزات:**\n- الأكثر أماناً والأقل تلوثاً بالمبيدات\n- المكونات: Demeter certified organic\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع جداً\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً\n\n**ملاحظة صيدلانية:**\n**Organic Formula**: Demeter certified organic. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Holle",
      "productName": "Holle Organic 3",
      "stageType": "Stage 3 (1-3 years) / Organic",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.6,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.9
      },
      "keyFeatures": "Demeter certified organic",
      "pharmacistNote": "**Organic Formula**: Demeter certified organic. Designed for Stage 3 (1-3 years).",
      "image": "/images/holle-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة عضوية",
          "description": "مصنوعة من مكونات عضوية معتمدة بدون مبيدات حشرية أو هرمونات.",
          "when_to_use": "للآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة",
          "benefits": "الأكثر أماناً والأقل تلوثاً بالمبيدات",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "هولي",
          "description": "الأكثر طبيعية وعضوية معتمدة Demeter.",
          "strength": "عضوي معتمد Demeter، أعلى معايير أمان، طبيعي جداً",
          "price": "مرتفع جداً",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً"
        },
        "arabic": "\n### Holle Organic 3\n\n**ما هو هذا المنتج؟**\nالأكثر طبيعية وعضوية معتمدة Demeter.\n\n**متى تستخدمه؟**\nللآباء والأمهات الذين يفضلون المنتجات الطبيعية والآمنة\n\n**المميزات:**\n- الأكثر أماناً والأقل تلوثاً بالمبيدات\n- المكونات: Demeter certified organic\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: مرتفع جداً\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً\n\n**ملاحظة صيدلانية:**\n**Organic Formula**: Demeter certified organic. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Holle",
      "productName": "Holle Goat 1",
      "stageType": "Stage 1 (0-6 months) / Goat Milk",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.6,
        "protein": 1.2,
        "fat": 3.5,
        "carb": 8
      },
      "keyFeatures": "Organic goat milk",
      "pharmacistNote": "**Goat Milk Formula**: Organic goat milk. Designed for Stage 1 (0-6 months).",
      "image": "/images/holle-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "هولي",
          "description": "الأكثر طبيعية وعضوية معتمدة Demeter.",
          "strength": "عضوي معتمد Demeter، أعلى معايير أمان، طبيعي جداً",
          "price": "مرتفع جداً",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً"
        },
        "arabic": "\n### Holle Goat 1\n\n**ما هو هذا المنتج؟**\nالأكثر طبيعية وعضوية معتمدة Demeter.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Organic goat milk\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع جداً\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Organic goat milk. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Holle",
      "productName": "Holle Goat 2",
      "stageType": "Stage 2 (6-12 months) / Goat Milk",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64.9,
        "protein": 1.8,
        "fat": 3.6,
        "carb": 7.8
      },
      "keyFeatures": "Organic goat milk",
      "pharmacistNote": "**Goat Milk Formula**: Organic goat milk. Designed for Stage 2 (6-12 months).",
      "image": "/images/holle-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "هولي",
          "description": "الأكثر طبيعية وعضوية معتمدة Demeter.",
          "strength": "عضوي معتمد Demeter، أعلى معايير أمان، طبيعي جداً",
          "price": "مرتفع جداً",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً"
        },
        "arabic": "\n### Holle Goat 2\n\n**ما هو هذا المنتج؟**\nالأكثر طبيعية وعضوية معتمدة Demeter.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Organic goat milk\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع جداً\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Organic goat milk. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Holle",
      "productName": "Holle Goat 3",
      "stageType": "Stage 3 (1-3 years) / Goat Milk",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 7.3
      },
      "keyFeatures": "Organic goat milk",
      "pharmacistNote": "**Goat Milk Formula**: Organic goat milk. Designed for Stage 3 (1-3 years).",
      "image": "/images/holle-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "هولي",
          "description": "الأكثر طبيعية وعضوية معتمدة Demeter.",
          "strength": "عضوي معتمد Demeter، أعلى معايير أمان، طبيعي جداً",
          "price": "مرتفع جداً",
          "best_for": "الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً"
        },
        "arabic": "\n### Holle Goat 3\n\n**ما هو هذا المنتج؟**\nالأكثر طبيعية وعضوية معتمدة Demeter.\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Organic goat milk\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: مرتفع جداً\n- الأنسب لـ: الآباء والأمهات الذين يفضلون الطبيعي والآمن جداً\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Organic goat milk. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Nido",
      "productName": "Nido 1+",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.1,
        "protein": 1.5,
        "fat": 3.4,
        "carb": 7.2
      },
      "keyFeatures": "Fortified milk drink",
      "pharmacistNote": "**Growing Up Formula**: Fortified milk drink. Designed for Stage 3 (1-3 years).",
      "image": "/images/nido-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nido",
          "description": "تركيبة من Nido",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nido 1+\n\n**ما هو هذا المنتج؟**\nتركيبة من Nido\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Fortified milk drink\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Fortified milk drink. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Nido",
      "productName": "Nido 3+",
      "stageType": "Stage 4 (3-5 years) / Growing Up",
      "ageRange": "Stage 4 (3-5 years)",
      "nutritionalInfo": {
        "kcal": 64.8,
        "protein": 1.7,
        "fat": 3.6,
        "carb": 7.6
      },
      "keyFeatures": "Fortified milk drink",
      "pharmacistNote": "**Growing Up Formula**: Fortified milk drink. Designed for Stage 4 (3-5 years).",
      "image": "/images/nido-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nido",
          "description": "تركيبة من Nido",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nido 3+\n\n**ما هو هذا المنتج؟**\nتركيبة من Nido\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Fortified milk drink\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Fortified milk drink. Designed for Stage 4 (3-5 years).\n"
      }
    },
    {
      "brand": "Nido",
      "productName": "Nido Fortified",
      "stageType": "Family / Powder Milk",
      "ageRange": "Family",
      "nutritionalInfo": {
        "kcal": 64.5,
        "protein": 1.4,
        "fat": 3.6,
        "carb": 7.3
      },
      "keyFeatures": "Full cream milk powder",
      "pharmacistNote": "**Powder Milk Formula**: Full cream milk powder. Designed for Family.",
      "image": "/images/nido-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Nido",
          "description": "تركيبة من Nido",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Nido Fortified\n\n**ما هو هذا المنتج؟**\nتركيبة من Nido\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Full cream milk powder\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Powder Milk Formula**: Full cream milk powder. Designed for Family.\n"
      }
    },
    {
      "brand": "PediaSure",
      "productName": "PediaSure Complete Vanilla",
      "stageType": "1-10 years / Supplement",
      "ageRange": "1-10 years",
      "nutritionalInfo": {
        "kcal": 97.4,
        "protein": 3,
        "fat": 5.3,
        "carb": 11.5
      },
      "keyFeatures": "Complete balanced nutrition",
      "pharmacistNote": "**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.",
      "image": "/images/pediasure-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "PediaSure",
          "description": "تركيبة من PediaSure",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### PediaSure Complete Vanilla\n\n**ما هو هذا المنتج؟**\nتركيبة من PediaSure\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Complete balanced nutrition\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.\n"
      }
    },
    {
      "brand": "PediaSure",
      "productName": "PediaSure Complete Chocolate",
      "stageType": "1-10 years / Supplement",
      "ageRange": "1-10 years",
      "nutritionalInfo": {
        "kcal": 99.6,
        "protein": 2.8,
        "fat": 4.1,
        "carb": 8.2
      },
      "keyFeatures": "Complete balanced nutrition",
      "pharmacistNote": "**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.",
      "image": "/images/pediasure-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "PediaSure",
          "description": "تركيبة من PediaSure",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### PediaSure Complete Chocolate\n\n**ما هو هذا المنتج؟**\nتركيبة من PediaSure\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Complete balanced nutrition\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.\n"
      }
    },
    {
      "brand": "PediaSure",
      "productName": "PediaSure Complete Strawberry",
      "stageType": "1-10 years / Supplement",
      "ageRange": "1-10 years",
      "nutritionalInfo": {
        "kcal": 87.7,
        "protein": 2.5,
        "fat": 4.1,
        "carb": 10.2
      },
      "keyFeatures": "Complete balanced nutrition",
      "pharmacistNote": "**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.",
      "image": "/images/pediasure-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "PediaSure",
          "description": "تركيبة من PediaSure",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### PediaSure Complete Strawberry\n\n**ما هو هذا المنتج؟**\nتركيبة من PediaSure\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Complete balanced nutrition\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.\n"
      }
    },
    {
      "brand": "PediaSure",
      "productName": "PediaSure Complete Honey",
      "stageType": "1-10 years / Supplement",
      "ageRange": "1-10 years",
      "nutritionalInfo": {
        "kcal": 94.8,
        "protein": 2.7,
        "fat": 5.3,
        "carb": 8.3
      },
      "keyFeatures": "Complete balanced nutrition",
      "pharmacistNote": "**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.",
      "image": "/images/pediasure-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "PediaSure",
          "description": "تركيبة من PediaSure",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### PediaSure Complete Honey\n\n**ما هو هذا المنتج؟**\nتركيبة من PediaSure\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Complete balanced nutrition\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Complete balanced nutrition. Designed for 1-10 years.\n"
      }
    },
    {
      "brand": "Neocate",
      "productName": "Neocate LCP",
      "stageType": "0-12 months / Amino Acid",
      "ageRange": "0-12 months",
      "nutritionalInfo": {
        "kcal": 67.9,
        "protein": 1.2,
        "fat": 3.5,
        "carb": 7.6
      },
      "keyFeatures": "100% amino acid based for severe allergy",
      "pharmacistNote": "**Amino Acid Formula**: 100% amino acid based for severe allergy. Designed for 0-12 months.",
      "image": "/images/neocate-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الأحماض الأمينية",
          "description": "للأطفال الذين يعانون من حساسية شديدة جداً من جميع مصادر البروتين. تحتوي على أحماض أمينية نقية.",
          "when_to_use": "للحالات المستعصية من الحساسية المتعددة",
          "benefits": "آمنة تماماً ولا تسبب أي حساسية",
          "side_effects": "قد يكون الطعم مختلفاً"
        },
        "brand": {
          "ar_name": "نيوكيت",
          "description": "متخصصة في الحالات المستعصية من الحساسية.",
          "strength": "أحماض أمينية نقية، آمن تماماً للحساسية الشديدة",
          "price": "مرتفع جداً",
          "best_for": "الحالات المستعصية من الحساسية المتعددة"
        },
        "arabic": "\n### Neocate LCP\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات المستعصية من الحساسية.\n\n**متى تستخدمه؟**\nللحالات المستعصية من الحساسية المتعددة\n\n**المميزات:**\n- آمنة تماماً ولا تسبب أي حساسية\n- المكونات: 100% amino acid based for severe allergy\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً\n- السعر: مرتفع جداً\n- الأنسب لـ: الحالات المستعصية من الحساسية المتعددة\n\n**ملاحظة صيدلانية:**\n**Amino Acid Formula**: 100% amino acid based for severe allergy. Designed for 0-12 months.\n"
      }
    },
    {
      "brand": "Neocate",
      "productName": "Neocate Junior",
      "stageType": "1+ years / Amino Acid",
      "ageRange": "1+ years",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 7.3
      },
      "keyFeatures": "Amino acid based for toddlers",
      "pharmacistNote": "**Amino Acid Formula**: Amino acid based for toddlers. Designed for 1+ years.",
      "image": "/images/neocate-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الأحماض الأمينية",
          "description": "للأطفال الذين يعانون من حساسية شديدة جداً من جميع مصادر البروتين. تحتوي على أحماض أمينية نقية.",
          "when_to_use": "للحالات المستعصية من الحساسية المتعددة",
          "benefits": "آمنة تماماً ولا تسبب أي حساسية",
          "side_effects": "قد يكون الطعم مختلفاً"
        },
        "brand": {
          "ar_name": "نيوكيت",
          "description": "متخصصة في الحالات المستعصية من الحساسية.",
          "strength": "أحماض أمينية نقية، آمن تماماً للحساسية الشديدة",
          "price": "مرتفع جداً",
          "best_for": "الحالات المستعصية من الحساسية المتعددة"
        },
        "arabic": "\n### Neocate Junior\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات المستعصية من الحساسية.\n\n**متى تستخدمه؟**\nللحالات المستعصية من الحساسية المتعددة\n\n**المميزات:**\n- آمنة تماماً ولا تسبب أي حساسية\n- المكونات: Amino acid based for toddlers\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً\n- السعر: مرتفع جداً\n- الأنسب لـ: الحالات المستعصية من الحساسية المتعددة\n\n**ملاحظة صيدلانية:**\n**Amino Acid Formula**: Amino acid based for toddlers. Designed for 1+ years.\n"
      }
    },
    {
      "brand": "Neocate",
      "productName": "Neocate Spoon",
      "stageType": "6+ months / Amino Acid",
      "ageRange": "6+ months",
      "nutritionalInfo": {
        "kcal": 67.3,
        "protein": 1.7,
        "fat": 3.5,
        "carb": 7.3
      },
      "keyFeatures": "Amino acid based weaning food",
      "pharmacistNote": "**Amino Acid Formula**: Amino acid based weaning food. Designed for 6+ months.",
      "image": "/images/neocate-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الأحماض الأمينية",
          "description": "للأطفال الذين يعانون من حساسية شديدة جداً من جميع مصادر البروتين. تحتوي على أحماض أمينية نقية.",
          "when_to_use": "للحالات المستعصية من الحساسية المتعددة",
          "benefits": "آمنة تماماً ولا تسبب أي حساسية",
          "side_effects": "قد يكون الطعم مختلفاً"
        },
        "brand": {
          "ar_name": "نيوكيت",
          "description": "متخصصة في الحالات المستعصية من الحساسية.",
          "strength": "أحماض أمينية نقية، آمن تماماً للحساسية الشديدة",
          "price": "مرتفع جداً",
          "best_for": "الحالات المستعصية من الحساسية المتعددة"
        },
        "arabic": "\n### Neocate Spoon\n\n**ما هو هذا المنتج؟**\nمتخصصة في الحالات المستعصية من الحساسية.\n\n**متى تستخدمه؟**\nللحالات المستعصية من الحساسية المتعددة\n\n**المميزات:**\n- آمنة تماماً ولا تسبب أي حساسية\n- المكونات: Amino acid based weaning food\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً\n- السعر: مرتفع جداً\n- الأنسب لـ: الحالات المستعصية من الحساسية المتعددة\n\n**ملاحظة صيدلانية:**\n**Amino Acid Formula**: Amino acid based weaning food. Designed for 6+ months.\n"
      }
    },
    {
      "brand": "Alfamino",
      "productName": "Alfamino",
      "stageType": "All Stages / Amino Acid",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.2,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.9
      },
      "keyFeatures": "Severe CMPA and multiple food allergies",
      "pharmacistNote": "**Amino Acid Formula**: Severe CMPA and multiple food allergies. Designed for All Stages.",
      "image": "/images/alfamino-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة الأحماض الأمينية",
          "description": "للأطفال الذين يعانون من حساسية شديدة جداً من جميع مصادر البروتين. تحتوي على أحماض أمينية نقية.",
          "when_to_use": "للحالات المستعصية من الحساسية المتعددة",
          "benefits": "آمنة تماماً ولا تسبب أي حساسية",
          "side_effects": "قد يكون الطعم مختلفاً"
        },
        "brand": {
          "ar_name": "Alfamino",
          "description": "تركيبة من Alfamino",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Alfamino\n\n**ما هو هذا المنتج؟**\nتركيبة من Alfamino\n\n**متى تستخدمه؟**\nللحالات المستعصية من الحساسية المتعددة\n\n**المميزات:**\n- آمنة تماماً ولا تسبب أي حساسية\n- المكونات: Severe CMPA and multiple food allergies\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Amino Acid Formula**: Severe CMPA and multiple food allergies. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Althera",
      "productName": "Althera",
      "stageType": "All Stages / Extensively Hydrolyzed",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67,
        "protein": 1.7,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "Whey based extensive hydrolysate",
      "pharmacistNote": "**Extensively Hydrolyzed Formula**: Whey based extensive hydrolysate. Designed for All Stages.",
      "image": "/images/althera-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة للحساسية الشديدة",
          "description": "للأطفال الذين يعانون من حساسية حقيقية من بروتين البقر. البروتين مهضوم بشكل كامل جداً.",
          "when_to_use": "عندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب",
          "benefits": "آمن تماماً للأطفال الذين يعانون من حساسية حقيقية",
          "side_effects": "قد يكون الطعم أقل استساغة"
        },
        "brand": {
          "ar_name": "Althera",
          "description": "تركيبة من Althera",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Althera\n\n**ما هو هذا المنتج؟**\nتركيبة من Althera\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال دموي أو قيء شديد أو طفح جلدي بعد الشرب\n\n**المميزات:**\n- آمن تماماً للأطفال الذين يعانون من حساسية حقيقية\n- المكونات: Whey based extensive hydrolysate\n\n**الملاحظات:**\n- قد يكون الطعم أقل استساغة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Extensively Hydrolyzed Formula**: Whey based extensive hydrolysate. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Infatrini",
      "productName": "Infatrini",
      "stageType": "0-18 months / High Energy",
      "ageRange": "0-18 months",
      "nutritionalInfo": {
        "kcal": 88,
        "protein": 2.5,
        "fat": 4.6,
        "carb": 8.3
      },
      "keyFeatures": "High energy for faltering growth",
      "pharmacistNote": "**High Energy Formula**: High energy for faltering growth. Designed for 0-18 months.",
      "image": "/images/infatrini-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Infatrini",
          "description": "تركيبة من Infatrini",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Infatrini\n\n**ما هو هذا المنتج؟**\nتركيبة من Infatrini\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: High energy for faltering growth\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**High Energy Formula**: High energy for faltering growth. Designed for 0-18 months.\n"
      }
    },
    {
      "brand": "Fortini",
      "productName": "Fortini",
      "stageType": "1+ years / High Energy",
      "ageRange": "1+ years",
      "nutritionalInfo": {
        "kcal": 90,
        "protein": 2.5,
        "fat": 4.6,
        "carb": 10.1
      },
      "keyFeatures": "High energy supplement",
      "pharmacistNote": "**High Energy Formula**: High energy supplement. Designed for 1+ years.",
      "image": "/images/fortini-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Fortini",
          "description": "تركيبة من Fortini",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Fortini\n\n**ما هو هذا المنتج؟**\nتركيبة من Fortini\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: High energy supplement\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**High Energy Formula**: High energy supplement. Designed for 1+ years.\n"
      }
    },
    {
      "brand": "Exceeda",
      "productName": "Exceeda",
      "stageType": "All Stages / Special",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.1
      },
      "keyFeatures": "Metabolic formula",
      "pharmacistNote": "**Special Formula**: Metabolic formula. Designed for All Stages.",
      "image": "/images/exceeda-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Exceeda",
          "description": "تركيبة من Exceeda",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Exceeda\n\n**ما هو هذا المنتج؟**\nتركيبة من Exceeda\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Metabolic formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Special Formula**: Metabolic formula. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Lactonic",
      "productName": "Lactonic 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67.8,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.5
      },
      "keyFeatures": "Gold standard formula",
      "pharmacistNote": "**Standard Formula**: Gold standard formula. Designed for Stage 1 (0-6 months).",
      "image": "/images/lactonic-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Lactonic",
          "description": "تركيبة من Lactonic",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Lactonic 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Lactonic\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Gold standard formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Gold standard formula. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Lactonic",
      "productName": "Lactonic 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.4,
        "protein": 1.7,
        "fat": 3.6,
        "carb": 7.8
      },
      "keyFeatures": "Gold standard formula",
      "pharmacistNote": "**Standard Formula**: Gold standard formula. Designed for Stage 2 (6-12 months).",
      "image": "/images/lactonic-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Lactonic",
          "description": "تركيبة من Lactonic",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Lactonic 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Lactonic\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Gold standard formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Gold standard formula. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Lactonic",
      "productName": "Lactonic 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 64.5,
        "protein": 1.8,
        "fat": 3.5,
        "carb": 8.1
      },
      "keyFeatures": "Gold standard formula",
      "pharmacistNote": "**Growing Up Formula**: Gold standard formula. Designed for Stage 3 (1-3 years).",
      "image": "/images/lactonic-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Lactonic",
          "description": "تركيبة من Lactonic",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Lactonic 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Lactonic\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Gold standard formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Gold standard formula. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Lactonic",
      "productName": "Lactonic AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 65,
        "protein": 1.7,
        "fat": 3.6,
        "carb": 7.3
      },
      "keyFeatures": "Thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.",
      "image": "/images/lactonic-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Lactonic",
          "description": "تركيبة من Lactonic",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Lactonic AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Lactonic\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Lactonic",
      "productName": "Lactonic LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.7,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.6
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/lactonic-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Lactonic",
          "description": "تركيبة من Lactonic",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Lactonic LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Lactonic\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Swisslac",
      "productName": "Swisslac 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.3,
        "fat": 3.5,
        "carb": 8
      },
      "keyFeatures": "Swiss quality, DHA/ARA",
      "pharmacistNote": "**Standard Formula**: Swiss quality, DHA/ARA. Designed for Stage 1 (0-6 months).",
      "image": "/images/swisslac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Swisslac",
          "description": "تركيبة من Swisslac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Swisslac 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Swisslac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Swiss quality, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Swiss quality, DHA/ARA. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Swisslac",
      "productName": "Swisslac 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.5,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 7.7
      },
      "keyFeatures": "Swiss quality, DHA/ARA",
      "pharmacistNote": "**Standard Formula**: Swiss quality, DHA/ARA. Designed for Stage 2 (6-12 months).",
      "image": "/images/swisslac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Swisslac",
          "description": "تركيبة من Swisslac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Swisslac 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Swisslac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Swiss quality, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Swiss quality, DHA/ARA. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Swisslac",
      "productName": "Swisslac 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.5,
        "protein": 1.3,
        "fat": 3.6,
        "carb": 8.1
      },
      "keyFeatures": "Swiss quality, DHA/ARA",
      "pharmacistNote": "**Growing Up Formula**: Swiss quality, DHA/ARA. Designed for Stage 3 (1-3 years).",
      "image": "/images/swisslac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Swisslac",
          "description": "تركيبة من Swisslac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Swisslac 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Swisslac\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Swiss quality, DHA/ARA\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Swiss quality, DHA/ARA. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Swisslac",
      "productName": "Swisslac AR",
      "stageType": "All Stages / Anti-Regurgitation",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67,
        "protein": 1.7,
        "fat": 3.2,
        "carb": 7.5
      },
      "keyFeatures": "Thickened",
      "pharmacistNote": "**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.",
      "image": "/images/swisslac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة مضادة للارتجاع",
          "description": "مصممة للأطفال الذين يعانون من ارتجاع الحليب (Reflux). تحتوي على مواد تثخين تجعل الحليب أكثر سمكاً فلا يرجع بسهولة.",
          "when_to_use": "عندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة",
          "benefits": "تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل",
          "side_effects": "قد تسبب إمساك خفيف عند بعض الأطفال"
        },
        "brand": {
          "ar_name": "Swisslac",
          "description": "تركيبة من Swisslac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Swisslac AR\n\n**ما هو هذا المنتج؟**\nتركيبة من Swisslac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من بصق الحليب المستمر وعدم الراحة\n\n**المميزات:**\n- تقلل الارتجاع بنسبة 70%، تحسن راحة الطفل\n- المكونات: Thickened\n\n**الملاحظات:**\n- قد تسبب إمساك خفيف عند بعض الأطفال\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Anti-Regurgitation Formula**: Thickened. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Swisslac",
      "productName": "Swisslac LF",
      "stageType": "All Stages / Lactose Free",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 64.2,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 8.1
      },
      "keyFeatures": "Lactose free",
      "pharmacistNote": "**Lactose Free Formula**: Lactose free. Designed for All Stages.",
      "image": "/images/swisslac-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة خالية من اللاكتوز",
          "description": "للأطفال الذين يعانون من عدم تحمل اللاكتوز. تحتوي على سكريات بديلة سهلة الهضم بدلاً من لاكتوز الحليب.",
          "when_to_use": "عندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب",
          "benefits": "تقلل الإسهال والغازات والمغص",
          "side_effects": "لا توجد مشاكل عادة"
        },
        "brand": {
          "ar_name": "Swisslac",
          "description": "تركيبة من Swisslac",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Swisslac LF\n\n**ما هو هذا المنتج؟**\nتركيبة من Swisslac\n\n**متى تستخدمه؟**\nعندما يعاني الطفل من إسهال مستمر أو غازات وانتفاخ بعد الشرب\n\n**المميزات:**\n- تقلل الإسهال والغازات والمغص\n- المكونات: Lactose free\n\n**الملاحظات:**\n- لا توجد مشاكل عادة\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Lactose Free Formula**: Lactose free. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Biomil",
      "productName": "Biomil 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.4,
        "fat": 3.6,
        "carb": 7.8
      },
      "keyFeatures": "Biological formula concept",
      "pharmacistNote": "**Standard Formula**: Biological formula concept. Designed for Stage 1 (0-6 months).",
      "image": "/images/biomil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Biomil",
          "description": "تركيبة من Biomil",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Biomil 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Biomil\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Biological formula concept\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Biological formula concept. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Biomil",
      "productName": "Biomil 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.3,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Biological formula concept",
      "pharmacistNote": "**Standard Formula**: Biological formula concept. Designed for Stage 2 (6-12 months).",
      "image": "/images/biomil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Biomil",
          "description": "تركيبة من Biomil",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Biomil 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Biomil\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Biological formula concept\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Biological formula concept. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Biomil",
      "productName": "Biomil 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 67.2,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 7.6
      },
      "keyFeatures": "Biological formula concept",
      "pharmacistNote": "**Growing Up Formula**: Biological formula concept. Designed for Stage 3 (1-3 years).",
      "image": "/images/biomil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Biomil",
          "description": "تركيبة من Biomil",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Biomil 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Biomil\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Biological formula concept\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Biological formula concept. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Biomil",
      "productName": "Biomil Plus",
      "stageType": "All Stages / Standard",
      "ageRange": "All Stages",
      "nutritionalInfo": {
        "kcal": 67.3,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Enhanced formula",
      "pharmacistNote": "**Standard Formula**: Enhanced formula. Designed for All Stages.",
      "image": "/images/biomil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Biomil",
          "description": "تركيبة من Biomil",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Biomil Plus\n\n**ما هو هذا المنتج؟**\nتركيبة من Biomil\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Enhanced formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Enhanced formula. Designed for All Stages.\n"
      }
    },
    {
      "brand": "Bibena",
      "productName": "Bibena 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66,
        "protein": 1.4,
        "fat": 3.5,
        "carb": 7
      },
      "keyFeatures": "Digestive comfort",
      "pharmacistNote": "**Standard Formula**: Digestive comfort. Designed for Stage 1 (0-6 months).",
      "image": "/images/bibena-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Bibena",
          "description": "تركيبة من Bibena",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Bibena 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Bibena\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Digestive comfort\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Digestive comfort. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Bibena",
      "productName": "Bibena 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64.1,
        "protein": 1.6,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Digestive comfort",
      "pharmacistNote": "**Standard Formula**: Digestive comfort. Designed for Stage 2 (6-12 months).",
      "image": "/images/bibena-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Bibena",
          "description": "تركيبة من Bibena",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Bibena 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Bibena\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Digestive comfort\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Digestive comfort. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Bibena",
      "productName": "Bibena 3",
      "stageType": "Stage 3 (1-3 years) / Growing Up",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.4,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "Digestive comfort",
      "pharmacistNote": "**Growing Up Formula**: Digestive comfort. Designed for Stage 3 (1-3 years).",
      "image": "/images/bibena-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Bibena",
          "description": "تركيبة من Bibena",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Bibena 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Bibena\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Digestive comfort\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Growing Up Formula**: Digestive comfort. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Illuma",
      "productName": "Illuma 1",
      "stageType": "Stage 1 (0-6 months) / Premium",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 66.8,
        "protein": 1.5,
        "fat": 3.6,
        "carb": 7.1
      },
      "keyFeatures": "sn-2 Palmitate, HMOs",
      "pharmacistNote": "**Premium Formula**: sn-2 Palmitate, HMOs. Designed for Stage 1 (0-6 months).",
      "image": "/images/illuma-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Illuma",
          "description": "تركيبة من Illuma",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Illuma 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Illuma\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: sn-2 Palmitate, HMOs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Premium Formula**: sn-2 Palmitate, HMOs. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Illuma",
      "productName": "Illuma 2",
      "stageType": "Stage 2 (6-12 months) / Premium",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 64.6,
        "protein": 1.5,
        "fat": 3.3,
        "carb": 8.1
      },
      "keyFeatures": "sn-2 Palmitate, HMOs",
      "pharmacistNote": "**Premium Formula**: sn-2 Palmitate, HMOs. Designed for Stage 2 (6-12 months).",
      "image": "/images/illuma-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Illuma",
          "description": "تركيبة من Illuma",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Illuma 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Illuma\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: sn-2 Palmitate, HMOs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Premium Formula**: sn-2 Palmitate, HMOs. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Illuma",
      "productName": "Illuma 3",
      "stageType": "Stage 3 (1-3 years) / Premium",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 65.2,
        "protein": 1.5,
        "fat": 3.5,
        "carb": 8.1
      },
      "keyFeatures": "sn-2 Palmitate, HMOs",
      "pharmacistNote": "**Premium Formula**: sn-2 Palmitate, HMOs. Designed for Stage 3 (1-3 years).",
      "image": "/images/illuma-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Illuma",
          "description": "تركيبة من Illuma",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Illuma 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Illuma\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: sn-2 Palmitate, HMOs\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Premium Formula**: sn-2 Palmitate, HMOs. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Vitafos",
      "productName": "Vitafos Junior",
      "stageType": "1-10 years / Supplement",
      "ageRange": "1-10 years",
      "nutritionalInfo": {
        "kcal": 92.7,
        "protein": 2.4,
        "fat": 5.5,
        "carb": 10.6
      },
      "keyFeatures": "High energy supplement",
      "pharmacistNote": "**Supplement Formula**: High energy supplement. Designed for 1-10 years.",
      "image": "/images/vitafos-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Vitafos",
          "description": "تركيبة من Vitafos",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Vitafos Junior\n\n**ما هو هذا المنتج؟**\nتركيبة من Vitafos\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: High energy supplement\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: High energy supplement. Designed for 1-10 years.\n"
      }
    },
    {
      "brand": "Jovy",
      "productName": "Jovy 1",
      "stageType": "Stage 1 (0-6 months) / Goat Milk",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 64.5,
        "protein": 1.8,
        "fat": 3.3,
        "carb": 8.1
      },
      "keyFeatures": "Goat milk formula",
      "pharmacistNote": "**Goat Milk Formula**: Goat milk formula. Designed for Stage 1 (0-6 months).",
      "image": "/images/jovy-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "Jovy",
          "description": "تركيبة من Jovy",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Jovy 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Jovy\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Goat milk formula\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Goat milk formula. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Jovy",
      "productName": "Jovy 2",
      "stageType": "Stage 2 (6-12 months) / Goat Milk",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.8,
        "protein": 1.3,
        "fat": 3.3,
        "carb": 8
      },
      "keyFeatures": "Goat milk formula",
      "pharmacistNote": "**Goat Milk Formula**: Goat milk formula. Designed for Stage 2 (6-12 months).",
      "image": "/images/jovy-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "Jovy",
          "description": "تركيبة من Jovy",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Jovy 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Jovy\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Goat milk formula\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Goat milk formula. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Jovy",
      "productName": "Jovy 3",
      "stageType": "Stage 3 (1-3 years) / Goat Milk",
      "ageRange": "Stage 3 (1-3 years)",
      "nutritionalInfo": {
        "kcal": 66.1,
        "protein": 1.7,
        "fat": 3.4,
        "carb": 7.5
      },
      "keyFeatures": "Goat milk formula",
      "pharmacistNote": "**Goat Milk Formula**: Goat milk formula. Designed for Stage 3 (1-3 years).",
      "image": "/images/jovy-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة حليب الماعز",
          "description": "مصنوعة من حليب الماعز الطبيعي. تحتوي على بروتين A2 الذي أسهل للهضم من A1.",
          "when_to_use": "للأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً",
          "benefits": "سهل الهضم جداً، طبيعي وقريب من حليب الأم",
          "side_effects": "قد يكون الطعم مختلفاً قليلاً"
        },
        "brand": {
          "ar_name": "Jovy",
          "description": "تركيبة من Jovy",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Jovy 3\n\n**ما هو هذا المنتج؟**\nتركيبة من Jovy\n\n**متى تستخدمه؟**\nللأطفال الذين يعانون من حساسية خفيفة أو يفضلون طعماً مختلفاً\n\n**المميزات:**\n- سهل الهضم جداً، طبيعي وقريب من حليب الأم\n- المكونات: Goat milk formula\n\n**الملاحظات:**\n- قد يكون الطعم مختلفاً قليلاً\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Goat Milk Formula**: Goat milk formula. Designed for Stage 3 (1-3 years).\n"
      }
    },
    {
      "brand": "Supermil",
      "productName": "Supermil 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 67.5,
        "protein": 1.2,
        "fat": 3.4,
        "carb": 7.1
      },
      "keyFeatures": "Essential nutrition",
      "pharmacistNote": "**Standard Formula**: Essential nutrition. Designed for Stage 1 (0-6 months).",
      "image": "/images/supermil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Supermil",
          "description": "تركيبة من Supermil",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Supermil 1\n\n**ما هو هذا المنتج؟**\nتركيبة من Supermil\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Essential nutrition\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Essential nutrition. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "Supermil",
      "productName": "Supermil 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 67.5,
        "protein": 1.6,
        "fat": 3.6,
        "carb": 8
      },
      "keyFeatures": "Essential nutrition",
      "pharmacistNote": "**Standard Formula**: Essential nutrition. Designed for Stage 2 (6-12 months).",
      "image": "/images/supermil-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Supermil",
          "description": "تركيبة من Supermil",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Supermil 2\n\n**ما هو هذا المنتج؟**\nتركيبة من Supermil\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Essential nutrition\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Essential nutrition. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "SureGrow",
      "productName": "Sure Grow",
      "stageType": "1+ years / Supplement",
      "ageRange": "1+ years",
      "nutritionalInfo": {
        "kcal": 76.8,
        "protein": 3,
        "fat": 4.7,
        "carb": 8.8
      },
      "keyFeatures": "Growth support",
      "pharmacistNote": "**Supplement Formula**: Growth support. Designed for 1+ years.",
      "image": "/images/suregrow-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "SureGrow",
          "description": "تركيبة من SureGrow",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Sure Grow\n\n**ما هو هذا المنتج؟**\nتركيبة من SureGrow\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Growth support\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Growth support. Designed for 1+ years.\n"
      }
    },
    {
      "brand": "WellPlus",
      "productName": "Well Plus 1",
      "stageType": "Stage 1 (0-6 months) / Standard",
      "ageRange": "Stage 1 (0-6 months)",
      "nutritionalInfo": {
        "kcal": 65.1,
        "protein": 1.2,
        "fat": 3.3,
        "carb": 7.1
      },
      "keyFeatures": "Balanced formula",
      "pharmacistNote": "**Standard Formula**: Balanced formula. Designed for Stage 1 (0-6 months).",
      "image": "/images/wellplus-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "WellPlus",
          "description": "تركيبة من WellPlus",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Well Plus 1\n\n**ما هو هذا المنتج؟**\nتركيبة من WellPlus\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Balanced formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Balanced formula. Designed for Stage 1 (0-6 months).\n"
      }
    },
    {
      "brand": "WellPlus",
      "productName": "Well Plus 2",
      "stageType": "Stage 2 (6-12 months) / Standard",
      "ageRange": "Stage 2 (6-12 months)",
      "nutritionalInfo": {
        "kcal": 65.9,
        "protein": 1.6,
        "fat": 3.4,
        "carb": 7.8
      },
      "keyFeatures": "Balanced formula",
      "pharmacistNote": "**Standard Formula**: Balanced formula. Designed for Stage 2 (6-12 months).",
      "image": "/images/wellplus-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "WellPlus",
          "description": "تركيبة من WellPlus",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Well Plus 2\n\n**ما هو هذا المنتج؟**\nتركيبة من WellPlus\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Balanced formula\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Standard Formula**: Balanced formula. Designed for Stage 2 (6-12 months).\n"
      }
    },
    {
      "brand": "Ascenda",
      "productName": "Ascenda",
      "stageType": "1+ years / Supplement",
      "ageRange": "1+ years",
      "nutritionalInfo": {
        "kcal": 86.6,
        "protein": 2.6,
        "fat": 4.1,
        "carb": 8.5
      },
      "keyFeatures": "Catch-up growth",
      "pharmacistNote": "**Supplement Formula**: Catch-up growth. Designed for 1+ years.",
      "image": "/images/ascenda-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "Ascenda",
          "description": "تركيبة من Ascenda",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Ascenda\n\n**ما هو هذا المنتج؟**\nتركيبة من Ascenda\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Catch-up growth\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Catch-up growth. Designed for 1+ years.\n"
      }
    },
    {
      "brand": "WellGrow",
      "productName": "Well Grow",
      "stageType": "1+ years / Supplement",
      "ageRange": "1+ years",
      "nutritionalInfo": {
        "kcal": 75.4,
        "protein": 2.1,
        "fat": 4,
        "carb": 11.8
      },
      "keyFeatures": "Growth support",
      "pharmacistNote": "**Supplement Formula**: Growth support. Designed for 1+ years.",
      "image": "/images/wellgrow-product.png",
      "explanation": {
        "type": {
          "title": "تركيبة أساسية",
          "description": "حليب موصى به للأطفال الأصحاء بدون مشاكل هضمية. يحتوي على التوازن الصحيح من البروتين والدهون والكربوهيدرات والفيتامينات.",
          "when_to_use": "للأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية",
          "benefits": "نمو طبيعي وتطور سليم",
          "side_effects": "عادة لا توجد مشاكل"
        },
        "brand": {
          "ar_name": "WellGrow",
          "description": "تركيبة من WellGrow",
          "strength": "جودة جيدة",
          "price": "معقول",
          "best_for": "الأطفال الأصحاء"
        },
        "arabic": "\n### Well Grow\n\n**ما هو هذا المنتج؟**\nتركيبة من WellGrow\n\n**متى تستخدمه؟**\nللأطفال الأصحاء الذين لا يعانون من مشاكل هضمية أو حساسية\n\n**المميزات:**\n- نمو طبيعي وتطور سليم\n- المكونات: Growth support\n\n**الملاحظات:**\n- عادة لا توجد مشاكل\n- السعر: معقول\n- الأنسب لـ: الأطفال الأصحاء\n\n**ملاحظة صيدلانية:**\n**Supplement Formula**: Growth support. Designed for 1+ years.\n"
      }
    } 
];

export const INITIAL_MILK_DATA: MilkProduct[] = RAW_MILK_DATA.map((item, index) => ({
    id: `milk-${index}-${item.productName.replace(/\s+/g, '-').toLowerCase()}`,
    ...item
}));
