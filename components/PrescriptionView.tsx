
import React, { useMemo, useState } from 'react';
import { TFunction, PrescriptionData } from '../types';

const parsePrescription = (content: string): Omit<PrescriptionData, 'id'> | null => {
    // 1. Extract content between markers if they exist, otherwise use the whole content
    const markerMatch = content.match(/---PRESCRIPTION_START---([\s\S]*?)---PRESCRIPTION_END---/);
    let potentialJson = markerMatch ? markerMatch[1] : content;

    // 2. Clean up: Remove markdown code blocks if present (```json ... ```)
    potentialJson = potentialJson.replace(/```(?:json)?/g, '').replace(/```/g, '');

    // 3. Robust Extraction: Find the first '{' and the last '}'
    const firstBrace = potentialJson.indexOf('{');
    const lastBrace = potentialJson.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        return null;
    }

    const jsonString = potentialJson.substring(firstBrace, lastBrace + 1);

    try {
        const parsed = JSON.parse(jsonString);
        // Basic validation: Check for key fields
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
    
    const data = useMemo(() => {
        if (prescriptionData) return prescriptionData;
        if (content) {
            const parsed = parsePrescription(content);
            if (parsed) return { ...parsed, id: `p-${Date.now()}` };
        }
        return null;
    }, [content, prescriptionData]);

    const prescriptionId = useMemo(() => data?.id || `prescription-${Date.now()}`, [data]);

    const handlePrint = () => {
        const printElement = document.getElementById(prescriptionId);
        if (!printElement) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const pri = iframe.contentWindow;

        if (pri) {
            pri.document.open();
            pri.document.write('<html><head><title>Print Prescription</title>');
            
            // Inject Tailwind CSS for styling
            pri.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            
            // Add custom print styles
            pri.document.write(`
                <style>
                    @page { size: A4; margin: 0; }
                    body { 
                        margin: 0;
                        padding: 20px; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-family: 'Cairo', 'Arial', sans-serif;
                    }
                </style>
            `);

            pri.document.write('</head><body>');
            pri.document.write(printElement.innerHTML);
            pri.document.write('</body></html>');
            pri.document.close();

            // Wait for resources to load before printing
            pri.onload = function() {
                // Short delay to ensure Tailwind classes are applied
                setTimeout(() => {
                    pri.focus();
                    pri.print();
                    // Clean up after printing (optional, can be done on focus back)
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 500);
            };
        } else {
             document.body.removeChild(iframe);
        }
    };

    if (!data) {
        if (content && content.includes('---PRESCRIPTION_START---')) {
             return (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    Warning: Malformed prescription data received.
                </div>
             );
        }
        return null;
    }
    
    // Using a style tag for precise print control and font definitions within the preview
    const style = `
        .prescription-font {
            font-family: 'Cairo', 'Arial', sans-serif;
        }
    `;
    
    const prescriptionContent = (
        <div id={prescriptionId} dir="ltr" className="p-4 bg-white text-black prescription-font" style={{ width: '21cm', minHeight: '29.7cm', margin: 'auto', display: 'flex', flexDirection: 'column' }}>
             {/* Header */}
            <header className="flex justify-between items-start pb-2 border-b-[1px] border-black">
                <div className="text-left">
                    <h1 className="text-lg font-bold">{data.hospitalName}</h1>
                    <p className="text-xs">{data.hospitalAddress}</p>
                </div>
                
                <div className="text-right text-xs">
                    <p><strong>CR No:</strong> {data.crNumber}</p>
                    <p><strong>Tax No:</strong> {data.taxNumber}</p>
                    <p><strong>License No:</strong> {data.licenseNumber}</p>
                </div>
            </header>
            
            <h2 className="text-center text-xl font-bold underline my-2">Prescription</h2>

            {/* Patient & Doctor Info */}
            <section className="grid grid-cols-2 gap-4 text-sm mb-2 p-2 border border-gray-300 rounded">
                 <div className="space-y-1">
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('patientName')}:</strong> <span>{document.documentElement.lang === 'ar' ? data.patientNameAr : data.patientName}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('natId')}:</strong> <span>{data.patientId}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('age')}/{t('gender')}:</strong> <span>{data.patientAge} / {data.patientGender}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('fileNo')}:</strong> <span>{data.fileNumber}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('date')}:</strong> <span>{data.date}</span></div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('doctorName')}:</strong> <span>{data.doctorName}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('specialty')}:</strong> <span>{data.doctorSpecialty}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('policy')}:</strong> <span>{data.policy}</span></div>
                    <div className="flex items-baseline gap-2"><strong className="w-[100px] flex-shrink-0">{t('insurCompany')}:</strong> <span>{data.insuranceCompany}</span></div>
                 </div>
            </section>

            <section className="text-sm mb-2 border-b-[1px] border-black pb-1">
                <strong>Diagnosis:</strong> {data.diagnosisCode} / {data.diagnosisDescription}
            </section>
            
            {/* Drugs Table */}
            <section className="flex-grow">
                 <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr>
                            <th className="border border-black p-1.5 w-10 text-center font-bold text-black">S</th>
                            <th className="border border-black p-1.5 w-32 text-left font-bold text-black">CODE</th>
                            <th className="border border-black p-1.5 text-left font-bold text-black">Medical Drugs</th>
                            <th className="border border-black p-1.5 w-16 text-center font-bold text-black">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.drugs?.map((drug, index) => (
                            <tr key={index} className="align-top">
                                <td className="border border-black p-1.5 text-center">{index + 1}</td>
                                <td className="border border-black p-1.5">
                                    <p>{drug.code}</p>
                                </td>
                                <td className="border border-black p-1.5 text-black">
                                    <p className="font-bold">R / {drug.genericName}</p>
                                    <p>{drug.tradeName}</p>
                                    <p className="text-xs">{drug.dosage} {drug.usageMethod}</p>
                                    <p className="text-xs text-right" dir="rtl">{drug.usageMethodAr}</p>
                                </td>
                                <td className="border border-black p-1.5 text-center">{drug.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </section>

            {/* Footer / Signature */}
            <footer className="grid grid-cols-3 gap-2 pt-2 text-center text-sm mt-auto">
                <div className="border border-black p-1 h-28 flex flex-col justify-between items-center italic">
                    <p>{t('patientSign')} / توقيع المريض</p>
                </div>
                <div className="border border-black p-1 h-28 flex flex-col justify-between items-center italic">
                    <p>{t('pharmacistSign')} / توقيع الصيدلي</p>
                </div>
                 <div className="border border-black p-1 h-28 flex flex-col justify-between items-center">
                    <p className="italic">{t('doctorSign')} / توقيع الطبيب</p>
                     <div className="flex-grow flex justify-center items-center relative w-full">
                       <div className="absolute w-28 h-12 border-2 border-blue-800 bg-transparent rounded p-1 flex flex-col justify-center items-center transform -rotate-[10deg] opacity-80">
                            <div className="text-blue-700 font-mono text-xs leading-tight select-none tracking-tighter">D. {data.doctorName}</div>
                            <div className="text-blue-700 font-sans text-[9px] leading-tight select-none">{data.doctorSpecialty}</div>
                        </div>
                     </div>
                     <strong className="font-bold text-sm">{data.doctorName}</strong>
                </div>
            </footer>
        </div>
    );

    if (isExpanded) {
        return (
             <div className="fixed inset-0 z-50 bg-black/70 flex justify-center items-start p-4 overflow-auto animate-fade-in" onClick={() => setIsExpanded(false)}>
                <div className="relative bg-white my-8 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1 shadow-lg text-black hover:bg-gray-200 no-print"
                        aria-label={t('closePreview')}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {/* Render the content and a sticky print button at the bottom */}
                    <div className="max-h-[85vh] overflow-y-auto overflow-x-auto">{prescriptionContent}</div>
                    <div className="sticky bottom-0 p-2 bg-gray-100 dark:bg-slate-800 text-center no-print border-t border-gray-200 dark:border-slate-700">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors text-sm"
                        >
                            {t('print')}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full bg-white dark:bg-dark-card rounded-bl-none rounded-2xl overflow-hidden print:shadow-none print:border-none">
            <style>{style}</style>
             <div className="p-2 bg-white dark:bg-dark-card space-y-2">
                 <div className="h-80 w-full overflow-hidden flex justify-center items-start border border-gray-300 dark:border-slate-600 rounded-md cursor-pointer" onClick={() => setIsExpanded(true)}>
                    <div style={{ transform: 'scale(0.28)', transformOrigin: 'top center' }}>
                         {prescriptionContent}
                    </div>
                </div>
                <div className="flex justify-center items-center gap-4 no-print">
                     <button
                        onClick={() => setIsExpanded(true)}
                        className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors text-sm"
                    >
                        {t('expandPrescription')}
                    </button>
                     <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                        {t('print')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionView;
