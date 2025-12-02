
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
                    }
                    .rx-container {
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 10mm;
                        min-height: 297mm; /* A4 height */
                        position: relative;
                        box-sizing: border-box;
                    }
                    
                    /* Header Section */
                    .header {
                        border-bottom: 3px solid #1e293b;
                        padding-bottom: 15px;
                        margin-bottom: 25px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }
                    .hospital-info h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        font-weight: 800;
                    }
                    .hospital-info p {
                        margin: 4px 0 0;
                        font-size: 11px;
                        color: #64748b;
                        max-width: 300px;
                    }
                    .meta-data {
                        text-align: right;
                        font-size: 11px;
                        line-height: 1.5;
                        color: #334155;
                    }
                    .meta-data strong { color: #000; }

                    /* Patient Grid */
                    .patient-box {
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        padding: 12px 16px;
                        margin-bottom: 25px;
                        background-color: #f8fafc;
                        display: grid;
                        grid-template-columns: 1.5fr 1fr;
                        gap: 15px;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 6px;
                        font-size: 12px;
                        align-items: baseline;
                    }
                    .info-row:last-child { margin-bottom: 0; }
                    .info-label {
                        width: 90px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        font-size: 10px;
                        flex-shrink: 0;
                    }
                    .info-val {
                        font-weight: 600;
                        color: #0f172a;
                    }

                    /* Diagnosis */
                    .diagnosis-box {
                        margin-bottom: 20px;
                        padding: 10px;
                        background-color: #f0fdf4;
                        border: 1px dashed #16a34a;
                        border-radius: 6px;
                        font-size: 12px;
                        color: #15803d;
                    }

                    /* Rx Symbol */
                    .rx-symbol {
                        font-family: serif;
                        font-size: 42px;
                        font-weight: 900;
                        font-style: italic;
                        color: #0f172a;
                        margin-bottom: 10px;
                        margin-left: 5px;
                    }

                    /* Drug Table */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 40px;
                    }
                    th {
                        text-align: left;
                        border-bottom: 2px solid #0f172a;
                        padding: 10px 8px;
                        font-size: 11px;
                        text-transform: uppercase;
                        color: #334155;
                        font-weight: 700;
                    }
                    td {
                        padding: 12px 8px;
                        border-bottom: 1px solid #e2e8f0;
                        vertical-align: top;
                    }
                    .drug-trade {
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                        display: block;
                        margin-bottom: 2px;
                    }
                    .drug-generic {
                        font-size: 11px;
                        color: #64748b;
                        font-style: italic;
                        display: block;
                        margin-bottom: 4px;
                    }
                    .drug-sig {
                        font-size: 12px;
                        font-weight: 600;
                        color: #334155;
                        background: #f1f5f9;
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 4px;
                    }
                    .qty-cell {
                        text-align: center;
                        font-weight: 800;
                        font-size: 14px;
                        vertical-align: middle;
                    }

                    /* Footer */
                    .footer {
                        position: absolute;
                        bottom: 20mm;
                        left: 10mm;
                        right: 10mm;
                        display: flex;
                        justify-content: space-between;
                        padding-top: 20px;
                        border-top: 2px solid #e2e8f0;
                    }
                    .sig-block {
                        width: 30%;
                        text-align: center;
                        position: relative;
                    }
                    .sig-line {
                        border-bottom: 1px solid #000;
                        height: 40px;
                        margin-bottom: 8px;
                    }
                    .sig-label {
                        font-size: 10px;
                        text-transform: uppercase;
                        color: #94a3b8;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }
                    .doc-details {
                        font-size: 12px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-top: 4px;
                    }

                    /* Doctor's Stamp */
                    .stamp {
                        position: absolute;
                        top: -40px;
                        left: 50%;
                        transform: translateX(-50%) rotate(-10deg);
                        width: 120px;
                        height: 120px;
                        border: 3px double #1e3a8a;
                        border-radius: 50%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        color: #1e3a8a;
                        opacity: 0.8;
                        pointer-events: none;
                        z-index: 10;
                    }
                    .stamp-inner {
                        text-align: center;
                        font-weight: bold;
                        font-size: 10px;
                        line-height: 1.2;
                    }
                    .stamp-name {
                        font-size: 12px;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                        border-bottom: 1px solid #1e3a8a;
                        padding-bottom: 2px;
                    }
                    .stamp-lic {
                        font-size: 8px;
                    }
                    .stamp-sig {
                        font-family: cursive;
                        font-size: 14px;
                        margin-top: 2px;
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
                        body { margin: 0; }
                        .rx-container { border: none; min-height: 100vh; }
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

                    <div class="rx-symbol">Rx</div>

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
                                        ${drug.usageMethodAr ? `<div style="font-family:'Cairo'; font-size:11px; margin-top:4px; text-align:right; color:#64748b;">${drug.usageMethodAr}</div>` : ''}
                                    </td>
                                    <td class="qty-cell">${drug.quantity}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>

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
                                    <div class="stamp-name">DR. ${data.doctorName?.split(' ')[1] || 'DOCTOR'}</div>
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
             {/* Simple Header */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-2">
                <div>
                    <h1 className="text-sm font-bold text-slate-900 uppercase">{data.hospitalName}</h1>
                    <p className="text-[9px] text-gray-500">{data.hospitalAddress}</p>
                </div>
                <div className="text-[9px] text-right text-gray-500">
                    <p>{data.date}</p>
                </div>
            </div>
            
            {/* Compact Patient Info */}
            <div className="bg-slate-50 p-2 rounded mb-2 border border-slate-100">
                 <div className="flex justify-between mb-1">
                    <span className="font-bold text-[10px] text-gray-600">PATIENT:</span>
                    <span className="font-bold">{data.patientName}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="font-bold text-[10px] text-gray-600">DOCTOR:</span>
                    <span className="truncate max-w-[120px]">{data.doctorName}</span>
                 </div>
            </div>

            <div className="text-xl font-serif font-bold text-slate-800 italic mb-1">Rx</div>
            
            {/* Drugs List Preview */}
            <div className="flex-grow space-y-2 overflow-hidden relative">
                {data.drugs?.slice(0, 3).map((drug, index) => (
                    <div key={index} className="border-b border-dashed border-gray-200 pb-1 last:border-0">
                        <div className="flex justify-between">
                            <span className="font-bold text-[11px] truncate">{drug.tradeName}</span>
                            <span className="font-bold text-[10px] bg-slate-100 px-1 rounded">x{drug.quantity}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 truncate">{drug.dosage}</div>
                    </div>
                ))}
                {data.drugs && data.drugs.length > 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent flex items-end justify-center">
                        <span className="text-[9px] text-gray-400">+{data.drugs.length - 3} more</span>
                    </div>
                )}
            </div>

            {/* Stamp Preview */}
            <div className="absolute bottom-2 right-2 transform rotate-[-12deg] opacity-70 pointer-events-none">
                <div className="w-16 h-16 rounded-full border-2 border-blue-900 flex flex-col items-center justify-center text-[6px] text-blue-900 font-bold leading-tight bg-white/20">
                    <div className="border-b border-blue-900 mb-0.5 pb-0.5">DR. {data.doctorName?.split(' ')[1] || 'DOC'}</div>
                    <div>APPROVED</div>
                    <div className="font-serif italic mt-0.5">Signed</div>
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
                 <div className="h-64 w-full bg-slate-50 relative p-3 overflow-hidden">
                    <div className="w-full h-full transform scale-100 origin-top opacity-90 group-hover:opacity-100 transition-opacity">
                        <PrescriptionPreviewCard />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />
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
