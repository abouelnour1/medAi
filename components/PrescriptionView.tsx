
import React, { useMemo, useState, useRef } from 'react';
import { TFunction, PrescriptionData } from '../types';
import ClearIcon from './icons/ClearIcon';

const parsePrescription = (content: string): Omit<PrescriptionData, 'id'> | null => {
    const markerMatch = content.match(/---PRESCRIPTION_START---([\s\S]*?)---PRESCRIPTION_END---/);
    let potentialJson = markerMatch ? markerMatch[1] : content;
    potentialJson = potentialJson.replace(/```(?:json)?/g, '').replace(/```/g, '');
    const firstBrace = potentialJson.indexOf('{');
    const lastBrace = potentialJson.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        return null;
    }

    const jsonString = potentialJson.substring(firstBrace, lastBrace + 1);

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse prescription JSON", e);
        return null;
    }
};

const PrescriptionView: React.FC<{ content?: string; prescriptionData?: PrescriptionData; t: TFunction }> = ({ content, prescriptionData, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    const data = useMemo(() => {
        let parsedData = null;
        if (prescriptionData) parsedData = prescriptionData;
        else if (content) {
            const parsed = parsePrescription(content);
            if (parsed) parsedData = { ...parsed, id: `p-${Date.now()}` };
        }
        
        if (parsedData) {
            if (!parsedData.insuranceCompany || parsedData.insuranceCompany === '...') {
                parsedData.insuranceCompany = 'Self-Pay (Cash)';
            }
            if (!parsedData.date) {
                parsedData.date = new Date().toLocaleDateString('en-GB');
            }
            if (!parsedData.hospitalName) parsedData.hospitalName = "PHARMASOURCE MEDICAL CENTER";
            if (!parsedData.hospitalAddress) parsedData.hospitalAddress = "Riyadh, Kingdom of Saudi Arabia";
        }
        return parsedData;
    }, [content, prescriptionData]);

    const handlePrint = () => {
        if (!iframeRef.current || !data) return;
        
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (!doc) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="ltr">
            <head>
                <title>Prescription - ${data.patientName || 'Patient'}</title>
                <style>
                    /* خط محلي - fonts.css */
                    body { 
                        font-family: 'Poppins', 'Cairo', sans-serif; 
                        margin: 0; padding: 10mm; background: #fff; color: #000;
                        line-height: 1.2;
                    }
                    .rx-page {
                        width: 100%; min-height: 270mm; position: relative;
                        display: flex; flex-direction: column;
                        border: 1px solid #eee;
                        padding: 5mm;
                    }
                    .header {
                        display: flex; justify-content: space-between; align-items: center;
                        border-bottom: 2px solid #111; padding-bottom: 3mm; margin-bottom: 5mm;
                    }
                    .hospital-info h1 { margin: 0; font-size: 16pt; font-weight: 900; letter-spacing: -0.5px; color: #0f766e; }
                    .hospital-info p { margin: 1px 0; font-size: 8pt; color: #666; }
                    
                    .meta-info { text-align: right; font-size: 8pt; }
                    .meta-info b { color: #000; }

                    .patient-box {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 3mm;
                        background: #f8fafc; padding: 3mm; border-radius: 1mm;
                        border: 1px solid #e2e8f0; margin-bottom: 5mm;
                    }
                    .info-group { font-size: 9pt; }
                    .label { font-size: 7pt; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 1px; }
                    .value { font-weight: 700; color: #1e293b; }

                    .diagnosis-section { margin-bottom: 5mm; padding-left: 3mm; border-left: 3px solid #0f766e; }
                    .diagnosis-section p { margin: 0; font-size: 10pt; font-style: italic; font-weight: 600; color: #334155; }

                    .rx-container { display: flex; align-items: center; gap: 3mm; margin-bottom: 3mm; }
                    .rx-symbol { font-size: 24pt; font-weight: 900; color: #111; line-height: 1; }
                    .rx-label { font-size: 10pt; font-weight: 900; border-bottom: 2px solid #111; padding-bottom: 1px; }

                    table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; flex-grow: 1; }
                    th { text-align: left; border-bottom: 1.5px solid #111; padding: 2mm 0; font-size: 8pt; text-transform: uppercase; color: #475569; }
                    td { padding: 3mm 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                    
                    .med-name { font-size: 11pt; font-weight: 800; display: block; color: #000; }
                    .med-generic { font-size: 8pt; color: #64748b; font-style: italic; }
                    .med-instruction { font-size: 9pt; margin-top: 1mm; font-weight: 600; color: #1e293b; }
                    .med-instruction-ar { font-family: 'Cairo'; font-size: 10pt; margin-top: 1mm; text-align: right; font-weight: 700; color: #0f766e; }
                    .qty { font-size: 11pt; font-weight: 900; text-align: center; color: #111; }

                    .footer {
                        display: flex; justify-content: space-between; align-items: flex-end; padding-top: 5mm;
                        border-top: 1px solid #eee;
                    }
                    .signature-line { width: 50mm; border-top: 1px solid #000; text-align: center; font-size: 8pt; padding-top: 1mm; font-weight: bold; }
                    
                    .stamp {
                        border: 2px double #1a4a9c; color: #1a4a9c; width: 40mm; height: 22mm;
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        transform: rotate(-2deg); border-radius: 1mm; background: rgba(26, 74, 156, 0.02);
                        font-family: monospace; font-weight: bold; text-align: center;
                    }
                    .stamp-top { border-bottom: 1px solid #1a4a9c; width: 100%; font-size: 6pt; padding-bottom: 0.5mm; margin-bottom: 0.5mm; }
                    .stamp-name { font-size: 8pt; text-transform: uppercase; }
                    .stamp-date { font-size: 6pt; margin-top: 0.5mm; }

                    @media print {
                        @page { size: A4; margin: 0; }
                        body { padding: 10mm; }
                        button { display: none; }
                        .rx-page { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="rx-page">
                    <div class="header">
                        <div class="hospital-info">
                            <h1>${data.hospitalName}</h1>
                            <p>${data.hospitalAddress}</p>
                        </div>
                        <div class="meta-info">
                            <div>Date: <b>${data.date}</b></div>
                            <div>Ref: <b>${data.fileNumber || 'RX-' + Math.floor(Math.random()*90000)}</b></div>
                        </div>
                    </div>

                    <div class="patient-box">
                        <div class="info-group">
                            <span class="label">Patient Name</span>
                            <span class="value">${data.patientName || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">National ID / Medical File</span>
                            <span class="value">${data.patientId || data.fileNumber || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Insurance Provider</span>
                            <span class="value">${data.insuranceCompany}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Ordering Physician</span>
                            <span class="value">Dr. ${data.doctorName || 'Consultant'}</span>
                        </div>
                    </div>

                    <div class="diagnosis-section">
                        <span class="label">Clinical Impression</span>
                        <p>${data.diagnosisDescription || 'Routine Medical Checkup'}</p>
                    </div>

                    <div class="rx-container">
                        <div class="rx-symbol">℞</div>
                        <div class="rx-label">PRESCRIPTION</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 85%">Medication Description & Dosage Schedule</th>
                                <th style="width: 15%; text-align: center">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.drugs?.map(drug => `
                                <tr>
                                    <td>
                                        <span class="med-name">${drug.tradeName}</span>
                                        <span class="med-generic">${drug.genericName}</span>
                                        <div class="med-instruction">${drug.dosage} - ${drug.usageMethod}</div>
                                        ${drug.usageMethodAr ? `<div class="med-instruction-ar" dir="rtl">${drug.usageMethodAr}</div>` : ''}
                                    </td>
                                    <td class="qty">x${drug.quantity}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div class="signature-line">Patient Signature</div>
                        <div class="stamp">
                            <div class="stamp-top">CERTIFIED MEDICAL RECORD</div>
                            <div class="stamp-name">${data.doctorNameAr || data.doctorName || 'Verified'}</div>
                            <div class="stamp-date">${data.date}</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 500);
    };

    if (!data) return null;
    
    return (
        <div className="w-full animate-fade-in my-2">
             <iframe ref={iframeRef} className="hidden" />
             
             {/* Chat Preview Card */}
             <div 
                className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setIsExpanded(true)}
             >
                <div className="p-3 bg-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center text-primary font-bold text-sm">℞</div>
                        <span className="text-white font-black text-[10px] tracking-widest uppercase">Prescription</span>
                    </div>
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold">{data.date}</span>
                </div>
                
                <div className="p-4">
                    <div className="mb-2">
                        <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Patient Name</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{data.patientName || 'Unnamed Patient'}</p>
                    </div>
                    
                    <div className="space-y-1 border-t border-slate-50 dark:border-slate-700 pt-2">
                         {data.drugs?.slice(0, 1).map((drug, i) => (
                             <div key={i} className="flex justify-between items-center text-[10px]">
                                 <span className="font-bold text-primary truncate">{drug.tradeName}</span>
                                 <span className="text-slate-400">x{drug.quantity}</span>
                             </div>
                         ))}
                         {(data.drugs?.length || 0) > 1 && (
                             <p className="text-[9px] text-slate-400 italic">+{data.drugs!.length - 1} more items...</p>
                         )}
                    </div>

                    <div className="mt-3 flex justify-center">
                        <div className="px-4 py-1.5 bg-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md group-hover:scale-105 transition-transform">
                             فتح للطباعة
                        </div>
                    </div>
                </div>
             </div>

             {/* Full Modal Preview */}
             {isExpanded && (
                 <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-in" onClick={() => setIsExpanded(false)}>
                     <div 
                        className="bg-white dark:bg-slate-900 w-full max-w-4xl h-full max-h-[98vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                     >
                         <div className="p-3 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsExpanded(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ClearIcon /></button>
                                <h3 className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-widest">معاينة الوصفة الطبية</h3>
                            </div>
                            <button 
                                onClick={handlePrint}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                                طباعة (A4)
                            </button>
                         </div>
                         
                         <div className="flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100 dark:bg-slate-950">
                             {/* The actual A4 Paper simulation */}
                             <div className="bg-white shadow-xl p-8 sm:p-12 text-black font-sans relative flex flex-col w-full max-w-[210mm] min-h-[297mm] rounded-sm origin-top scale-[0.85] sm:scale-100">
                                 
                                 {/* Header */}
                                 <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                                     <div>
                                         <h1 className="text-xl font-black uppercase text-teal-800 tracking-tighter mb-0.5">{data.hospitalName}</h1>
                                         <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">{data.hospitalAddress}</p>
                                     </div>
                                     <div className="text-right">
                                         <div className="bg-slate-900 text-white px-2 py-0.5 text-[7pt] font-black rounded mb-1 inline-block">OFFICIAL MEDICAL DOCUMENT</div>
                                         <p className="text-[8pt] font-bold">DATE: <span className="font-medium text-slate-600">${data.date}</span></p>
                                     </div>
                                 </div>

                                 {/* Patient Info */}
                                 <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded border border-slate-100">
                                     <div className="space-y-1.5">
                                         <div>
                                             <span className="text-[7pt] font-black text-slate-400 uppercase tracking-widest block">Patient Name</span>
                                             <span className="text-xs font-bold text-slate-900">${data.patientName}</span>
                                         </div>
                                         <div>
                                             <span className="text-[7pt] font-black text-slate-400 uppercase tracking-widest block">ID Number / File</span>
                                             <span className="text-xs font-bold text-slate-700">${data.patientId || data.fileNumber || '---'}</span>
                                         </div>
                                     </div>
                                     <div className="space-y-1.5 text-right">
                                         <div>
                                             <span className="text-[7pt] font-black text-slate-400 uppercase tracking-widest block">Consultant</span>
                                             <span className="text-xs font-bold text-slate-900">Dr. ${data.doctorName}</span>
                                         </div>
                                         <div>
                                             <span className="text-[7pt] font-black text-slate-400 uppercase tracking-widest block">Insurance Plan</span>
                                             <span className="text-xs font-bold text-teal-700">${data.insuranceCompany}</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Rx Symbol & Diagnosis */}
                                 <div className="flex items-center gap-3 mb-4">
                                     <div className="text-3xl font-black leading-none">℞</div>
                                     <div className="flex-grow">
                                         <span className="text-[7pt] font-black text-slate-400 uppercase tracking-widest block">Clinical Impression</span>
                                         <p className="text-xs font-bold italic text-slate-700 border-l-2 border-teal-600 pl-2">${data.diagnosisDescription}</p>
                                     </div>
                                 </div>

                                 {/* Drugs Table */}
                                 <div className="flex-grow">
                                     <table className="w-full text-left">
                                         <thead className="border-b border-slate-900">
                                             <tr>
                                                 <th className="py-2 text-[7pt] font-black uppercase tracking-widest">Medication & Schedule</th>
                                                 <th className="py-2 text-[7pt] font-black uppercase tracking-widest text-center">Qty</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {data.drugs?.map((drug, i) => (
                                                 <tr key={i}>
                                                     <td className="py-4">
                                                         <p className="font-bold text-sm text-slate-900 mb-0.5">${drug.tradeName}</p>
                                                         <p className="text-[7pt] text-slate-400 font-bold italic mb-2">${drug.genericName}</p>
                                                         <div className="bg-slate-50 inline-block px-2 py-1 rounded font-bold text-[8pt] text-slate-700 border border-slate-100">
                                                             ${drug.dosage} — ${drug.usageMethod}
                                                         </div>
                                                         {drug.usageMethodAr && (
                                                             <p className="text-right font-bold text-teal-800 mt-2 text-[10pt]" style={{fontFamily:'Cairo'}}>
                                                                 ${drug.usageMethodAr}
                                                             </p>
                                                         )}
                                                     </td>
                                                     <td className="py-4 text-center font-black text-sm text-slate-300">x${drug.quantity}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>

                                 {/* Footer & Stamp */}
                                 <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
                                     <div className="w-48 text-center">
                                         <div className="h-10 mb-2 border-b border-slate-200"></div>
                                         <span className="text-[7pt] font-black text-slate-400 uppercase tracking-widest">Patient / Guardian Signature</span>
                                     </div>
                                     
                                     <div className="relative">
                                         <div className="border-[2px] border-double border-blue-800 text-blue-800 w-44 h-24 rotate-[-1deg] flex flex-col items-center justify-center p-2 font-mono bg-white/50 shadow-sm">
                                             <p className="text-[6pt] border-b border-blue-800 w-full text-center pb-0.5 mb-1 font-black">CERTIFIED CLINICIAN STAMP</p>
                                             <p className="text-[9pt] font-black tracking-tight">${data.doctorNameAr || data.doctorName}</p>
                                             <p className="text-[7pt] font-bold mt-0.5">S.C.H.S REG NO: ${Math.floor(Math.random()*8000)+2000}</p>
                                             <p className="text-[6pt] mt-1 font-sans opacity-60">${data.date}</p>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default PrescriptionView;
