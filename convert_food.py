#!/usr/bin/env python3
"""
تحويل ملف الفود من CSV أو Excel لـ JSON جاهز للرفع على Firebase Storage
الاستخدام:
    python3 convert_food.py food.csv
    python3 convert_food.py food.xlsx
"""
import csv, json, sys, re, time
from pathlib import Path

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

COLUMNS = [
    "RegisterNumber","ReferenceNumber","Old register Number","Product type",
    "DrugType","Sub-Type","Scientific Name","Trade Name","Strength","StrengthUnit",
    "PharmaceuticalForm","AdministrationRoute","AtcCode1","AtcCode2","Size","SizeUnit",
    "PackageTypes","PackageSize","Legal Status","Product Control","Distribute area",
    "Public price","shelfLife","Storage conditions","Storage Condition Arabic",
    "Marketing Company","Marketing Country","Manufacture Name","Manufacture Country",
    "Secondry package  manufacture","Main Agent","Secosnd Agent","Third agent",
    "Description Code","Authorization Status","Last Update","description",
    "imgBox","imgIndex1","imgIndex2","imgPill","pillShape","pillScored","pillMarkings",
    "liquidTaste","liquidColor","physicalNotes",
    "clinical_indication","clinical_dosage","clinical_sideEffects",
    "clinical_pharmacistNote","clinical_mechanism","clinical_keyPoints","clinical_generatedAt"
]

def clean(val):
    if val is None: return ""
    v = str(val).strip()
    if v in ("nan","None","NULL","null","N/A"): return ""
    # إزالة الحروف الغريبة اللي بتكسر JSON
    v = v.replace("\x00", "").replace("\r", " ")
    v = "".join(c for c in v if ord(c) >= 32 or c == "\t")
    return v

def make_id(row):
    name  = row.get("Trade Name","").strip()
    mfr   = row.get("Manufacture Name", row.get("Marketing Company","")).strip()
    price = row.get("Public price","").strip()
    raw   = f"{name}-{mfr}-{price}".lower()
    slug  = re.sub(r'[^a-z0-9]', '-', raw)
    slug  = re.sub(r'-+', '-', slug).strip('-')[:60]
    return f"food-{slug}"

def read_csv(path):
    rows = []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k: clean(v) for k, v in row.items()})
    return rows

def read_excel(path):
    if not HAS_OPENPYXL:
        print("❌ محتاج تثبت openpyxl: pip install openpyxl")
        sys.exit(1)
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows_raw = list(ws.iter_rows(values_only=True))
    if not rows_raw:
        print("❌ الملف فارغ")
        sys.exit(1)
    headers = [clean(h) for h in rows_raw[0]]
    rows = []
    for row in rows_raw[1:]:
        d = {headers[i]: clean(row[i]) for i in range(len(headers)) if i < len(row)}
        rows.append(d)
    wb.close()
    return rows

def convert(input_path: str):
    p = Path(input_path)
    if not p.exists():
        print(f"❌ الملف مش موجود: {input_path}")
        sys.exit(1)

    ext = p.suffix.lower()
    print(f"📂 قراءة الملف: {p.name}")

    if ext in (".xlsx", ".xls", ".xlsm"):
        raw_rows = read_excel(input_path)
    elif ext == ".csv":
        raw_rows = read_csv(input_path)
    else:
        print(f"❌ نوع الملف مش مدعوم: {ext} — استخدم .csv أو .xlsx")
        sys.exit(1)

    print(f"📊 إجمالي الصفوف: {len(raw_rows)}")

    seen_ids = {}
    results  = []
    skipped  = 0
    empty    = 0

    for i, row in enumerate(raw_rows, 1):
        trade_name = row.get("Trade Name","").strip()
        if not trade_name:
            empty += 1
            continue

        # RegisterNumber
        reg = row.get("RegisterNumber","").strip()
        if not reg or reg == "0":
            reg = make_id(row)

        # منع التكرار
        if reg in seen_ids:
            print(f"  ⚠️  تكرار سطر {i}: {trade_name!r} — تم تجاهله")
            skipped += 1
            continue
        seen_ids[reg] = i

        # بناء السجل
        record = {col: row.get(col, "") for col in COLUMNS}
        record["RegisterNumber"] = reg

        # تنظيف Strength — لو فيه نص طويل يبقي مكونات = Scientific Name
        import re
        strength = record.get("Strength", "")
        if len(strength) > 30:
            # المكونات دي هي الـ Scientific Name — نضيفها دايماً
            existing_sci = record.get("Scientific Name", "").strip()
            if existing_sci and existing_sci.upper() not in ("N/A", ""):
                # لو في scientific name موجود — نضيف المكونات بعده
                record["Scientific Name"] = existing_sci + " | " + strength
            else:
                record["Scientific Name"] = strength
            # حط في Strength الرقم بس لو موجود
            nums = re.findall(r'[0-9.]+', strength)
            record["Strength"] = nums[0] if nums else ""

        # Product type
        pt = row.get("Product type","").lower()
        record["Product type"] = "Food" if "food" in pt or not pt else row.get("Product type","Food")

        results.append(record)

    out_path = p.with_suffix(".json")
    # تأكد إن الـ JSON صحيح قبل الحفظ
    json_str = json.dumps(results, ensure_ascii=False, indent=2)
    json.loads(json_str)  # validate
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(json_str)

    print(f"""
✅ تم التحويل بنجاح!
   📤 الملف الناتج : {out_path.name}
   ✔️  منتجات جاهزة: {len(results)}
   ⚠️  مكررات حُذفت: {skipped}
   ⬜ صفوف فارغة  : {empty}

📋 الخطوات التالية:
   1️⃣  ارفع {out_path.name} على Firebase Storage في المسار:
          data/food.json
   2️⃣  في Firestore افتح:  app_meta/versions
   3️⃣  حدّث قيمة food_ts بـ: {int(time.time()*1000)}
   4️⃣  التطبيق هيحمل الملف تلقائياً ✨
""")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("الاستخدام: python3 convert_food.py food.csv")
        print("           python3 convert_food.py food.xlsx")
        sys.exit(1)
    convert(sys.argv[1])
