/**
 * Featured Medicine Schedule
 * الأدمن يجدول أدوية اليوم يدوياً، لو مفيش يختار عشوائي
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

export interface ScheduledDay {
  date: string;           // YYYY-MM-DD
  medicines: string[];    // RegisterNumbers (3 بالظبط)
  note?: string;          // ملاحظة الأدمن
  createdBy?: string;
  createdAt: string;
}

// جيب جدول الأسبوع القادم (7 أيام)
export async function getSchedule(fromDate?: string): Promise<Record<string, ScheduledDay>> {
  try {
    const ref = collection(db, 'featuredSchedule');
    const snap = await getDocs(ref);
    const result: Record<string, ScheduledDay> = {};
    snap.forEach(d => { result[d.id] = d.data() as ScheduledDay; });
    return result;
  } catch { return {}; }
}

// احفظ يوم في الجدول
export async function saveScheduleDay(day: ScheduledDay): Promise<boolean> {
  try {
    const ref = doc(db, 'featuredSchedule', day.date);
    await setDoc(ref, day);
    return true;
  } catch { return false; }
}

// احذف يوم من الجدول
export async function deleteScheduleDay(date: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'featuredSchedule', date));
    return true;
  } catch { return false; }
}

// جيب أدوية يوم معين (أو null لو مش مجدول)
export async function getScheduledMedicines(date: string): Promise<string[] | null> {
  try {
    const ref = doc(db, 'featuredSchedule', date);
    const snap = await getDoc(ref);
    if (snap.exists()) return (snap.data() as ScheduledDay).medicines;
    return null;
  } catch { return null; }
}

// جيب أيام الأسبوع القادم
export function getWeekDays(startOffset = -1): string[] {
  const days: string[] = [];
  for (let i = startOffset; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// تنسيق التاريخ للعرض
export function formatDateAr(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
