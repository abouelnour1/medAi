
import React, { useMemo, useState, useRef } from 'react';
import { TFunction, PrescriptionData } from '../types';

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
        const parsed = JSON.parse(jsonString);
        if (parsed.hospitalName || parsed.drugs || parsed.patientName) {
             return parsed;
        }
        return null;
    } catch (e) {
        console.error("Failed to parse prescription JSON", e);
        return null;
    }
};


const PrescriptionView: React.FC<{ content?: string; prescriptionData?: PrescriptionData; t: TFunction }> = ({ content, prescriptionData, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    const data = useMemo(() => {
        if (prescriptionData) return prescriptionData;
        if (content) {
            const parsed = parsePrescription(content);
            if (parsed) return { ...parsed, id: `p-${Date.now()}` };
        }
        return null;
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
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap');
                    body { 
                        font-family: 'Poppins', 'Cairo', sans-serif; 
                        margin: 0; 
                        padding: 0; 
                        background: #fff; 
                        color: #000;
                        -webkit-print-color-adjust: exact; 
                        height: 100vh;
                    }
                    .rx-container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 10mm;
                        height: 98vh; /* Use viewport height for flex container */
                        display: flex;
                        flex-direction: column;
                        box-sizing: border-box;
                    }
                    
                    /* Header Section */
                    .header {
                        border-bottom: 3px solid #1e293b;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        flex-shrink: 0;
                    }
                    .hospital-info h1 {
                        margin: 0;
                        font-size: 26px;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        font-weight: 800;
                    }
                    .hospital-info p {
                        margin: 4px 0 0;
                        font-size: 12px;
                        color: #64748b;
                        max-width: 350px;
                    }
                    .meta-data {
                        text-align: right;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #334155;
                    }
                    .meta-data strong { color: #000; }

                    /* Patient Grid */
                    .patient-box {
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        padding: 15px 20px;
                        margin-bottom: 25px;
                        background-color: #f8fafc;
                        display: grid;
                        grid-template-columns: 1.5fr 1fr;
                        gap: 20px;
                        flex-shrink: 0;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 8px;
                        font-size: 13px;
                        align-items: baseline;
                    }
                    .info-row:last-child { margin-bottom: 0; }
                    .info-label {
                        width: 100px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        font-size: 11px;
                        flex-shrink: 0;
                    }
                    .info-val {
                        font-weight: 600;
                        color: #0f172a;
                    }

                    /* Diagnosis */
                    .diagnosis-box {
                        margin-bottom: 25px;
                        padding: 12px;
                        background-color: #f0fdf4;
                        border: 1px dashed #16a34a;
                        border-radius: 6px;
                        font-size: 13px;
                        color: #15803d;
                        flex-shrink: 0;
                    }

                    /* Main Content (Drugs) - Takes remaining space */
                    .main-content {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }

                    /* Drug Table */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th {
                        text-align: left;
                        border-bottom: 2px solid #0f172a;
                        padding: 12px 10px;
                        font-size: 12px;
                        text-transform: uppercase;
                        color: #334155;
                        font-weight: 800;
                        background-color: #f8fafc;
                    }
                    td {
                        padding: 16px 10px; /* Increased padding */
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: top;
                    }
                    .drug-trade {
                        font-size: 16px;
                        font-weight: 800;
                        color: #0f172a;
                        display: block;
                        margin-bottom: 4px;
                    }
                    .drug-generic {
                        font-size: 12px;
                        color: #64748b;
                        font-style: italic;
                        display: block;
                        margin-bottom: 6px;
                    }
                    .drug-sig {
                        font-size: 13px;
                        font-weight: 600;
                        color: #334155;
                        background: #f1f5f9;
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 4px;
                        border: 1px solid #e2e8f0;
                    }
                    .qty-cell {
                        text-align: center;
                        font-weight: 800;
                        font-size: 15px;
                        vertical-align: middle;
                    }

                    /* Footer */
                    .footer {
                        margin-top: auto; /* Pushes footer to the bottom */
                        display: flex;
                        justify-content: space-between;
                        padding-top: 30px;
                        border-top: 2px solid #e2e8f0;
                        position: relative;
                        flex-shrink: 0;
                    }
                    .sig-block {
                        width: 30%;
                        text-align: center;
                        position: relative;
                    }
                    .sig-line {
                        border-bottom: 1px solid #000;
                        height: 50px;
                        margin-bottom: 10px;
                    }
                    .sig-label {
                        font-size: 11px;
                        text-transform: uppercase;
                        color: #94a3b8;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }
                    .doc-details {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-top: 4px;
                    }

                    /* Realistic Doctor's Stamp */
                    .stamp {
                        position: absolute;
                        top: -50px;
                        left: 50%;
                        transform: translateX(-50%) rotate(-8deg);
                        width: 110px;
                        height: 110px;
                        border: 3px double #2c5282; /* Ink Blue */
                        border-radius: 50%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        color: #2c5282;
                        opacity: 0.85; /* Slight transparency for ink effect */
                        z-index: 10;
                        background: rgba(255, 255, 255, 0.2);
                        box-shadow: 0 0 0 1px rgba(44, 82, 130, 0.3) inset; /* Inner ring hint */
                    }
                    /* Rough edge effect */
                    .stamp::after {
                        content: '';
                        position: absolute;
                        top: 2px; bottom: 2px; left: 2px; right: 2px;
                        border: 1px solid rgba(44, 82, 130, 0.4);
                        border-radius: 50%;
                        pointer-events: none;
                    }
                    
                    .stamp-inner {
                        text-align: center;
                        font-weight: bold;
                        font-size: 10px;
                        line-height: 1.3;
                    }
                    .stamp-header {
                        font-size: 9px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 2px;
                    }
                    .stamp-name {
                        font-size: 12px;
                        font-weight: 900;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                        border-bottom: 2px solid #2c5282;
                        padding: 0 4px 2px;
                        display: inline-block;
                    }
                    .stamp-lic {
                        font-size: 9px;
                        font-family: monospace;
                    }
                    .stamp-sig {
                        font-family: 'Brush Script MT', cursive;
                        font-size: 18px;
                        margin-top: 4px;
                        transform: rotate(-5deg);
                    }

                    /* Watermark */
                    .watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 100px;
                        font-weight: 900;
                        color: rgba(0,0,0,0.03);
                        z-index: -1;
                        pointer-events: none;
                        white-space: nowrap;
                    }

                    @media print {
                        @page { margin: 0; size: A4; }
                        body { margin: 0; -webkit-print-color-adjust: exact; }
                        .rx-container { height: 100vh; padding: 10mm; }
                        .footer { margin-top: auto; } /* Ensure it pushes to bottom on print */
                    }
                </style>
            </head>
            <body>
                <div class="rx-container">
                    <div class="watermark">OFFICIAL PRESCRIPTION</div>
                    
                    <div class="header">
                        <div class="hospital-info">
                            <h1>${data.hospitalName || 'Medical Center'}</h1>
                            <p>${data.hospitalAddress || 'Kingdom of Saudi Arabia'}</p>
                        </div>
                        <div class="meta-data">
                            <div>Date: <strong>${data.date}</strong></div>
                            <div>Ref: <strong>${data.fileNumber}</strong></div>
                            ${data.licenseNumber ? `<div>Lic: <strong>${data.licenseNumber}</strong></div>` : ''}
                        </div>
                    </div>

                    <div class="patient-box">
                        <div class="col">
                            <div class="info-row"><span class="info-label">Patient</span> <span class="info-val">${data.patientName || '-'}</span></div>
                            ${data.patientNameAr ? `<div class="info-row"><span class="info-label">Arabic</span> <span class="info-val" style="font-family:'Cairo'">${data.patientNameAr}</span></div>` : ''}
                            <div class="info-row"><span class="info-label">ID Number</span> <span class="info-val">${data.patientId || '-'}</span></div>
                            <div class="info-row"><span class="info-label">Age / Sex</span> <span class="info-val">${data.patientAge || '-'} / ${data.patientGender || '-'}</span></div>
                        </div>
                        <div class="col">
                            <div class="info-row"><span class="info-label">Doctor</span> <span class="info-val">${data.doctorName || '-'}</span></div>
                            <div class="info-row"><span class="info-label">Specialty</span> <span class="info-val">${data.doctorSpecialty || '-'}</span></div>
                            <div class="info-row"><span class="info-label">Insurance</span> <span class="info-val">${data.insuranceCompany || 'Cash'}</span></div>
                        </div>
                    </div>

                    ${data.diagnosisDescription ? `
                    <div class="diagnosis-box">
                        <strong>DIAGNOSIS:</strong> ${data.diagnosisCode ? `[${data.diagnosisCode}]` : ''} ${data.diagnosisDescription}
                    </div>` : ''}

                    <div class="main-content">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%">#</th>
                                    <th style="width: 80%">Medication & Instructions</th>
                                    <th style="width: 15%; text-align: center">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.drugs?.map((drug, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>
                                            <span class="drug-trade">${drug.tradeName}</span>
                                            <span class="drug-generic">${drug.genericName}</span>
                                            <div class="drug-sig">${drug.dosage} • ${drug.usageMethod}</div>
                                            ${drug.usageMethodAr ? `<div style="font-family:'Cairo'; font-size:12px; margin-top:4px; text-align:right; color:#64748b;">${drug.usageMethodAr}</div>` : ''}
                                        </td>
                                        <td class="qty-cell">${drug.quantity}</td>
                                    </tr>
                                `).join('') || ''}
                            </tbody>
                        </table>
                    </div>

                    <div class="footer">
                        <div class="sig-block">
                            <div class="sig-line"></div>
                            <span class="sig-label">Patient Signature</span>
                        </div>
                        <div class="sig-block">
                            <div class="sig-line"></div>
                            <span class="sig-label">Pharmacist</span>
                        </div>
                        <div class="sig-block">
                            <div class="stamp">
                                <div class="stamp-inner">
                                    <div class="stamp-header">SAUDI HEALTH</div>
                                    <div class="stamp-name">${data.doctorName ? data.doctorName.split(' ').slice(0, 2).join(' ') : 'DOCTOR'}</div>
                                    <div class="stamp-lic">LIC: ${Math.floor(Math.random() * 90000) + 10000}</div>
                                    <div class="stamp-sig">Signed</div>
                                    <div class="stamp-lic" style="margin-top:2px">${new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div class="sig-line"></div>
                            <span class="sig-label">Doctor's Stamp & Signature</span>
                            <div class="doc-details">${data.doctorName || ''}</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Print after slight delay to ensure rendering
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 500);
    };

    if (!data) {
        if (content && content.includes('---PRESCRIPTION_START---')) {
             return (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    Error loading prescription data.
                </div>
             );
        }
        return null;
    }
    
    // Preview Card Component
    const PrescriptionPreviewCard = () => (
        <div className="bg-white text-black p-4 w-full h-full flex flex-col border border-slate-200 rounded-sm font-sans text-xs relative overflow-hidden select-none">
             {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2 mb-2">
                <div>
                    <h1 className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-tight">{data.hospitalName}</h1>
                    <p className="text-[9px] text-gray-500">{data.hospitalAddress}</p>
                </div>
                <div className="text-[9px] text-right text-gray-500 whitespace-nowrap">
                    <p className="font-bold text-slate-700">{data.date}</p>
                    <p>Ref: {data.fileNumber}</p>
                </div>
            </div>
            
            {/* Expanded Patient Info - Structured */}
            <div className="bg-slate-50 p-2 rounded mb-3 border border-slate-100">
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                     <div className="col-span-2 flex justify-between border-b border-slate-200 pb-1 mb-1">
                        <span className="text-gray-500 font-semibold uppercase">Patient</span>
                        <span className="font-bold text-slate-900">{data.patientName}</span>
                     </div>
                     
                     <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px]">ID No</span>
                        <span className="font-medium text-slate-700">{data.patientId}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px]">Age / Sex</span>
                        <span className="font-medium text-slate-700">{data.patientAge || '--'} / {data.patientGender || '-'}</span>
                     </div>
                     
                     <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px]">File No</span>
                        <span className="font-medium text-slate-700">{data.fileNumber}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px]">Insurance</span>
                        <span className="font-medium text-slate-700">{data.insuranceCompany}</span>
                     </div>

                     <div className="col-span-2 flex justify-between border-t border-slate-200 pt-1 mt-1">
                        <span className="text-gray-500 font-semibold uppercase">Doctor</span>
                        <span className="font-bold text-slate-800">{data.doctorName}</span>
                     </div>
                 </div>
            </div>

            {/* Drugs List Preview - Fixed Layout */}
            <div className="flex-grow space-y-3 overflow-hidden relative pb-6">
                {data.drugs?.slice(0, 3).map((drug, index) => (
                    <div key={index} className="border-b border-slate-100 pb-2 last:border-0 flex flex-col gap-1">
                        {/* Line 1: Trade Name & Quantity */}
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900 truncate pr-2">{drug.tradeName}</span>
                            <span className="font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 whitespace-nowrap">Qty: {drug.quantity}</span>
                        </div>
                        
                        {/* Line 2: Generic Name */}
                        <div className="text-[10px] text-slate-500 italic truncate -mt-0.5">{drug.genericName}</div>
                        
                        {/* Line 3: Dosage & Instructions Box */}
                        <div className="text-[10px] bg-slate-50 p-1.5 rounded text-slate-700 border border-slate-200 leading-tight mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{drug.dosage}</span>
                            <span className="text-slate-300">|</span>
                            <span>{drug.usageMethod}</span>
                        </div>
                    </div>
                ))}
                
                {data.drugs && data.drugs.length > 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-3 py-1 shadow-sm rounded-full border border-slate-200">+{data.drugs.length - 3} more items</span>
                    </div>
                )}
            </div>

            {/* Realistic Stamp Preview */}
            <div className="absolute bottom-3 right-3 transform rotate-[-12deg] opacity-85 pointer-events-none z-10">
                <div className="w-20 h-20 rounded-full border-[3px] border-double border-[#2c5282] flex flex-col items-center justify-center text-[7px] text-[#2c5282] font-bold leading-tight bg-white/50 backdrop-blur-[1px] shadow-sm">
                    <div className="text-[6px] uppercase tracking-wide">SAUDI HEALTH</div>
                    <div className="border-b-2 border-[#2c5282] mb-0.5 pb-0.5 px-1 text-center max-w-[65px] truncate uppercase font-black">
                        {data.doctorName ? data.doctorName.split(' ')[0] : 'DOCTOR'}
                    </div>
                    <div>APPROVED</div>
                    <div className="font-serif italic mt-0.5 scale-90 text-[10px]">Signed</div>
                </div>
            </div>
        </div>
    );

    if (isExpanded) {
        return (
             <div className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center items-center p-4 overflow-hidden animate-fade-in" onClick={() => setIsExpanded(false)}>
                <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-lg">
                        <h3 className="font-bold text-lg text-slate-800">Prescription Preview</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                                {t('print')}
                            </button>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="p-2 hover:bg-gray-200 rounded-full text-slate-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-auto p-4 md:p-8 bg-slate-200 flex justify-center">
                        <div className="shadow-2xl w-full max-w-[210mm] bg-white min-h-[140mm] transform transition-transform">
                             <iframe ref={iframeRef} className="hidden" />
                             <div className="w-full h-full p-10 flex flex-col items-center justify-center text-center text-slate-400 space-y-4 border-2 border-dashed border-slate-300 m-4 rounded-lg bg-slate-50 relative overflow-hidden">
                                <div className="absolute top-10 right-10 transform rotate-[-15deg] opacity-20 pointer-events-none">
                                    <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center">
                                        <span className="text-xl font-black text-slate-800 uppercase">Official Copy</span>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <p className="text-lg font-semibold text-slate-600">Print Preview Ready</p>
                                    <p className="text-sm">Click the "Print" button above to generate the stamped official document.</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full group">
             {/* Hidden Iframe for Printing */}
             <iframe ref={iframeRef} className="hidden" />
             
             <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200" onClick={() => setIsExpanded(true)}>
                 <div className="h-72 w-full bg-slate-50 relative p-3 overflow-hidden">
                    <div className="w-full h-full transform scale-100 origin-top opacity-90 group-hover:opacity-100 transition-opacity">
                        <PrescriptionPreviewCard />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                        <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            {t('expandPrescription')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionView;
