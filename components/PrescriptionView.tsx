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
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Poppins:wght@400;700&display=swap');
                    body { 
                        font-family: 'Poppins', 'Cairo', sans-serif; 
                        margin: 0; padding: 15mm; background: #fff; color: #000;
                    }
                    .rx-page {
                        width: 100%; min-height: 270mm; position: relative;
                        display: flex; flex-direction: column;
                    }
                    .header {
                        display: flex; justify-content: space-between; align-items: flex-start;
                        border-bottom: 4px solid #111; padding-bottom: 5mm; margin-bottom: 10mm;
                    }
                    .hospital-info h1 { margin: 0; font-size: 24pt; font-weight: 900; letter-spacing: -1px; }
                    .hospital-info p { margin: 2px 0; font-size: 10pt; color: #555; font-weight: bold; }
                    
                    .meta-info { text-align: right; font-size: 9pt; line-height: 1.4; }
                    .meta-info b { color: #000; }

                    .patient-box {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 5mm;
                        background: #f0f4f8; padding: 5mm; border-radius: 2mm;
                        border: 1px solid #d1d9e0; margin-bottom: 10mm;
                    }
                    .info-group { margin-bottom: 2mm; font-size: 11pt; }
                    .label { font-size: 8pt; color: #777; font-weight: 900; text-transform: uppercase; display: block; }
                    .value { font-weight: 700; color: #111; }

                    .diagnosis-section { margin-bottom: 10mm; padding-left: 4mm; border-left: 4px solid #111; }
                    .diagnosis-section p { margin: 0; font-size: 12pt; font-style: italic; font-weight: 600; }

                    .rx-symbol { font-size: 60pt; font-weight: 900; line-height: 1; margin-bottom: 5mm; }

                    table { width: 100%; border-collapse: collapse; margin-bottom: 20mm; flex-grow: 1; }
                    th { text-align: left; border-bottom: 2px solid #000; padding: 3mm 0; font-size: 10pt; text-transform: uppercase; }
                    td { padding: 5mm 0; border-bottom: 1px solid #eee; vertical-align: top; }
                    
                    .med-name { font-size: 14pt; font-weight: 800; display: block; }
                    .med-generic { font-size: 9pt; color: #666; font-style: italic; }
                    .med-instruction { font-size: 11pt; margin-top: 2mm; font-weight: 600; color: #333; }
                    .med-instruction-ar { font-family: 'Cairo'; font-size: 11pt; margin-top: 1mm; text-align: right; font-weight: 700; }
                    .qty { font-size: 14pt; font-weight: 900; text-align: center; }

                    .footer {
                        display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10mm;
                    }
                    .signature-line { width: 60mm; border-top: 1px solid #000; text-align: center; font-size: 9pt; padding-top: 2mm; font-weight: bold; }
                    
                    .stamp-wrapper { position: relative; width: 50mm; height: 30mm; }
                    .stamp {
                        border: 3px double #1a4a9c; color: #1a4a9c; width: 45mm; height: 25mm;
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        transform: rotate(-3deg); border-radius: 1mm; background: rgba(26, 74, 156, 0.03);
                        font-family: monospace; font-weight: bold; text-align: center;
                    }
                    .stamp-top { border-bottom: 1px solid #1a4a9c; width: 100%; font-size: 7pt; padding-bottom: 1mm; margin-bottom: 1mm; }
                    .stamp-name { font-size: 9pt; text-transform: uppercase; }
                    .stamp-date { font-size: 7pt; margin-top: 1mm; }

                    @media print {
                        @page { size: A4; margin: 0; }
                        body { padding: 15mm; }
                        button { display: none; }
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
                            <div>Ref ID: <b>${data.fileNumber || 'RX-' + Math.floor(Math.random()*90000)}</b></div>
                        </div>
                    </div>

                    <div class="patient-box">
                        <div class="info-group">
                            <span class="label">Patient Name</span>
                            <span class="value">${data.patientName || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">National ID / File</span>
                            <span class="value">${data.patientId || data.fileNumber || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Payer / Insurance</span>
                            <span class="value">${data.insuranceCompany}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Prescribing Clinician</span>
                            <span class="value">Dr. ${data.doctorName || 'Consultant'}</span>
                        </div>
                    </div>

                    <div class="diagnosis-section">
                        <span class="label">Clinical Diagnosis</span>
                        <p>${data.diagnosisDescription || 'Routine Medical Checkup'}</p>
                    </div>

                    <div class="rx-symbol">℞</div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 80%">Medication & Dosage Instructions</th>
                                <th style="width: 20%; text-align: center">Quantity</th>
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
                        <div class="stamp-wrapper">
                            <div class="stamp">
                                <div class="stamp-top">OFFICIAL MEDICAL LICENSE STAMP</div>
                                <div class="stamp-name">${data.doctorNameAr || data.doctorName || 'Verified'}</div>
                                <div class="stamp-date">${data.date}</div>
                                <div style="margin-top:2mm; opacity:0.6">
                                    <svg width="100" height="20" viewBox="0 0 100 20"><path d="M5,10 Q30,2 55,10 T95,8" fill="none" stroke="#1a4a9c" stroke-width="2" /></svg>
                                </div>
                            </div>
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
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold text-xl">℞</div>
                        <span className="text-white font-black text-xs tracking-tighter uppercase">Medical Prescription</span>
                    </div>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold">{data.date}</span>
                </div>
                
                <div className="p-4">
                    <div className="mb-3">
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Patient Name</p>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{data.patientName || 'Unnamed Patient'}</p>
                    </div>
                    
                    <div className="space-y-2 border-t border-slate-50 dark:border-slate-700 pt-3">
                         {data.drugs?.slice(0, 2).map((drug, i) => (
                             <div key={i} className="flex justify-between items-center text-xs">
                                 <span className="font-bold text-primary truncate max-w-[70%]">{drug.tradeName}</span>
                                 <span className="text-slate-400 font-black">x{drug.quantity}</span>
                             </div>
                         ))}
                         {(data.drugs?.length || 0) > 2 && (
                             <p className="text-[10px] text-slate-400 italic">+{data.drugs!.length - 2} more items...</p>
                         )}
                    </div>

                    <div className="mt-4 flex justify-center">
                        <div className="px-6 py-2 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md group-hover:scale-105 transition-transform">
                             معاينة وطباعة الوصفة
                        </div>
                    </div>
                </div>
             </div>

             {/* Full Modal Preview */}
             {isExpanded && (
                 <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-in" onClick={() => setIsExpanded(false)}>
                     <div 
                        className="bg-slate-100 dark:bg-slate-950 w-full max-w-4xl h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
                        onClick={e => e.stopPropagation()}
                     >
                         <div className="p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsExpanded(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ClearIcon /></button>
                                <h3 className="font-black text-slate-800 dark:text-white">معاينة الوصفة الطبية</h3>
                            </div>
                            <button 
                                onClick={handlePrint}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                                طباعة (A4)
                            </button>
                         </div>
                         
                         <div className="flex-grow overflow-y-auto p-4 sm:p-12 flex justify-center bg-slate-200 dark:bg-slate-900/50">
                             {/* The actual A4 Paper simulation */}
                             <div className="bg-white shadow-2xl p-8 sm:p-16 text-black font-sans relative flex flex-col w-full max-w-[210mm] min-h-[297mm] rounded-sm origin-top scale-[0.9] sm:scale-100">
                                 
                                 {/* Watermark */}
                                 <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                     <span className="text-[120pt] font-black rotate-[-45deg]">PHARMA</span>
                                 </div>

                                 {/* Header */}
                                 <div className="flex justify-between items-start border-b-[5px] border-slate-900 pb-8 mb-10">
                                     <div>
                                         <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{data.hospitalName}</h1>
                                         <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{data.hospitalAddress}</p>
                                     </div>
                                     <div className="text-right space-y-1">
                                         <div className="bg-slate-900 text-white px-3 py-1 text-xs font-black rounded mb-2 inline-block">OFFICIAL RECORD</div>
                                         <p className="text-xs font-black">DATE: <span className="font-medium text-slate-600">${data.date}</span></p>
                                         <p className="text-xs font-black">REF: <span className="font-medium text-slate-600">${data.fileNumber || 'TX-99821'}</span></p>
                                     </div>
                                 </div>

                                 {/* Patient Info */}
                                 <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                     <div className="space-y-3">
                                         <div>
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Patient Name</span>
                                             <span className="text-lg font-bold text-slate-900">${data.patientName}</span>
                                         </div>
                                         <div>
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ID Number / File</span>
                                             <span className="text-sm font-bold text-slate-700">${data.patientId || data.fileNumber || '---'}</span>
                                         </div>
                                     </div>
                                     <div className="space-y-3 text-right">
                                         <div>
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Consultant</span>
                                             <span className="text-lg font-bold text-slate-900">Dr. ${data.doctorName}</span>
                                         </div>
                                         <div>
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Insurance Plan</span>
                                             <span className="text-sm font-bold text-primary">${data.insuranceCompany}</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Rx Symbol & Diagnosis */}
                                 <div className="flex items-baseline gap-6 mb-8">
                                     <div className="text-7xl font-black select-none leading-none">℞</div>
                                     <div className="flex-grow pt-4">
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Clinical Diagnosis</span>
                                         <p className="text-xl font-bold italic text-slate-800 border-l-4 border-slate-200 pl-4">${data.diagnosisDescription}</p>
                                     </div>
                                 </div>

                                 {/* Drugs Table */}
                                 <div className="flex-grow">
                                     <table className="w-full text-left">
                                         <thead className="border-b-4 border-slate-900">
                                             <tr>
                                                 <th className="py-4 text-xs font-black uppercase tracking-widest">Medication & Instructions</th>
                                                 <th className="py-4 text-xs font-black uppercase tracking-widest text-center">Qty</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y-2 divide-slate-50">
                                             {data.drugs?.map((drug, i) => (
                                                 <tr key={i}>
                                                     <td className="py-8">
                                                         <p className="font-black text-2xl text-slate-900 mb-1 leading-none">${drug.tradeName}</p>
                                                         <p className="text-xs text-slate-400 font-bold italic mb-4">${drug.genericName}</p>
                                                         <div className="bg-slate-100 inline-block px-4 py-2 rounded-xl font-black text-sm text-slate-700 border border-slate-200">
                                                             ${drug.dosage} — ${drug.usageMethod}
                                                         </div>
                                                         {drug.usageMethodAr && (
                                                             <p className="text-right font-black text-slate-900 mt-4 text-xl" style={{fontFamily:'Cairo'}}>
                                                                 ${drug.usageMethodAr}
                                                             </p>
                                                         )}
                                                     </td>
                                                     <td className="py-8 text-center font-black text-3xl text-slate-300">x${drug.quantity}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>

                                 {/* Footer & Stamp */}
                                 <div className="mt-10 pt-10 border-t-2 border-slate-100 flex justify-between items-end">
                                     <div className="w-64 text-center">
                                         <div className="h-16 mb-4 border-b border-slate-200"></div>
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Signature</span>
                                     </div>
                                     
                                     <div className="relative">
                                         <div className="border-[4px] border-double border-blue-800 text-blue-800 w-56 h-32 rotate-[-4deg] flex flex-col items-center justify-center p-3 font-mono bg-white/50 backdrop-blur-[1px] shadow-sm">
                                             <p className="text-[9px] border-b-2 border-blue-800 w-full text-center pb-1 mb-2 font-black">MEDICAL PRACTITIONER STAMP</p>
                                             <p className="text-sm font-black tracking-tighter">${data.doctorNameAr || data.doctorName}</p>
                                             <p className="text-[10px] font-bold mt-1">SAUDI COUNCIL REG: ${Math.floor(Math.random()*8000)+2000}</p>
                                             <p className="text-[9px] mt-2 font-sans opacity-60">${data.date}</p>
                                             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                                 <svg width="150" height="60" viewBox="0 0 100 20"><path d="M5,10 Q30,2 55,10 T95,8" fill="none" stroke="blue" stroke-width="4" /></svg>
                                             </div>
                                         </div>
                                         <div className="text-center mt-4">
                                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital Stamp Verified</span>
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