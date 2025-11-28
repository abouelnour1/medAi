
import React, { useMemo, useState } from 'react';
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

        // Use a standard approach that works reliably across browsers without relying on external CSS
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to print.");
            return;
        }

        // Inline CSS for guaranteed styling in the print window
        const printStyles = `
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #000; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header-info { text-align: right; font-size: 12px; }
            .title { text-align: center; text-decoration: underline; font-size: 24px; font-weight: bold; margin: 20px 0; }
            .section { margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
            .row { display: flex; gap: 5px; align-items: baseline; margin-bottom: 4px; }
            .label { font-weight: bold; width: 120px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; }
            td { border: 1px solid #000; padding: 8px; vertical-align: top; }
            .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .signature-box { border: 1px solid #000; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 5px; font-size: 12px; }
            .stamp { border: 2px solid navy; color: navy; padding: 5px; transform: rotate(-10deg); opacity: 0.7; font-weight: bold; font-family: monospace; text-align: center; }
            @page { size: A4; margin: 1cm; }
        `;

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="ltr">
            <head>
                <title>Prescription - ${data.patientName || 'Patient'}</title>
                <style>${printStyles}</style>
            </head>
            <body>
                ${printElement.innerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
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
    
    // Preview Content (Styled with Tailwind for the UI, but Structure is mirrored in print styles)
    const prescriptionContent = (
        <div id={prescriptionId} dir="ltr" className="bg-white text-black p-4 w-full h-full flex flex-col">
             {/* Header */}
            <div className="header flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                <div className="text-left">
                    <h1 className="text-xl font-bold">{data.hospitalName}</h1>
                    <p className="text-sm text-gray-600">{data.hospitalAddress}</p>
                </div>
                <div className="header-info text-right text-xs">
                    <p><strong>CR No:</strong> {data.crNumber}</p>
                    <p><strong>Tax No:</strong> {data.taxNumber}</p>
                    <p><strong>License No:</strong> {data.licenseNumber}</p>
                </div>
            </div>
            
            <h2 className="title text-center text-2xl font-bold underline mb-6">Prescription</h2>

            {/* Patient & Doctor Info */}
            <div className="section grid-2 grid grid-cols-2 gap-4 border border-gray-300 p-4 rounded mb-4 text-sm">
                 <div className="space-y-1">
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('patientName')}:</span> <span>{data.patientNameAr || data.patientName}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('natId')}:</span> <span>{data.patientId}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('age')}/{t('gender')}:</span> <span>{data.patientAge || '-'} / {data.patientGender || '-'}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('fileNo')}:</span> <span>{data.fileNumber}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('date')}:</span> <span>{data.date}</span></div>
                 </div>
                 <div className="space-y-1">
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('doctorName')}:</span> <span>{data.doctorName}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('specialty')}:</span> <span>{data.doctorSpecialty}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('policy')}:</span> <span>{data.policy || '-'}</span></div>
                    <div className="row flex gap-2"><span className="label font-bold w-28">{t('insurCompany')}:</span> <span>{data.insuranceCompany}</span></div>
                 </div>
            </div>

            <div className="section mb-4 border-b border-black pb-2 text-sm">
                <strong>Diagnosis:</strong> {data.diagnosisCode} / {data.diagnosisDescription}
            </div>
            
            {/* Drugs Table */}
            <div className="flex-grow">
                 <table className="w-full border-collapse border border-black text-sm mb-4">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 w-12 text-center font-bold">#</th>
                            <th className="border border-black p-2 w-32 text-left font-bold">CODE</th>
                            <th className="border border-black p-2 text-left font-bold">Medication</th>
                            <th className="border border-black p-2 w-20 text-center font-bold">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.drugs?.map((drug, index) => (
                            <tr key={index}>
                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                <td className="border border-black p-2">{drug.code || '-'}</td>
                                <td className="border border-black p-2">
                                    <div className="font-bold">R / {drug.genericName}</div>
                                    <div>{drug.tradeName}</div>
                                    <div className="text-xs mt-1 italic">{drug.dosage} {drug.usageMethod}</div>
                                    {drug.usageMethodAr && <div className="text-xs text-right mt-1" dir="rtl">{drug.usageMethodAr}</div>}
                                </td>
                                <td className="border border-black p-2 text-center font-bold">{drug.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>

            {/* Footer / Signature */}
            <div className="footer grid grid-cols-3 gap-4 mt-8 text-sm">
                <div className="signature-box border border-black h-24 p-2 flex flex-col justify-between items-center text-center">
                    <span className="italic">{t('patientSign')}</span>
                </div>
                <div className="signature-box border border-black h-24 p-2 flex flex-col justify-between items-center text-center">
                    <span className="italic">{t('pharmacistSign')}</span>
                </div>
                 <div className="signature-box border border-black h-24 p-2 flex flex-col justify-between items-center text-center relative">
                    <span className="italic">{t('doctorSign')}</span>
                     <div className="stamp absolute top-8 border-2 border-blue-800 text-blue-800 p-1 rounded transform -rotate-6 opacity-70">
                        <div className="text-[10px] leading-tight">DR. {data.doctorName?.toUpperCase()}</div>
                     </div>
                     <strong className="mt-auto">{data.doctorName}</strong>
                </div>
            </div>
        </div>
    );

    if (isExpanded) {
        return (
             <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4 overflow-hidden animate-fade-in" onClick={() => setIsExpanded(false)}>
                <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="font-bold text-lg">Prescription Preview</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-primary text-white font-semibold rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                                {t('print')}
                            </button>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-auto p-8 bg-gray-100 flex justify-center">
                        <div className="bg-white shadow-lg w-[21cm] min-h-[29.7cm] origin-top transform scale-75 md:scale-100 transition-transform">
                            {prescriptionContent}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full bg-white dark:bg-dark-card rounded-bl-none rounded-2xl overflow-hidden print:shadow-none print:border-none">
             <div className="p-2 bg-white dark:bg-dark-card space-y-2">
                 <div className="h-64 w-full overflow-hidden flex justify-center items-start border border-gray-300 dark:border-slate-600 rounded-md cursor-pointer relative bg-gray-50 group" onClick={() => setIsExpanded(true)}>
                    {/* Thumbnail View */}
                    <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden transform scale-[0.35] origin-top-left w-[300%] h-[300%] p-4 bg-white">
                         {prescriptionContent}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                        <div className="bg-white/90 px-3 py-1 rounded shadow text-xs font-bold text-gray-700">Click to Preview</div>
                    </div>
                </div>
                <div className="flex justify-center items-center gap-2 no-print">
                     <button
                        onClick={() => setIsExpanded(true)}
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs"
                    >
                        {t('expandPrescription')}
                    </button>
                     <button
                        onClick={handlePrint}
                        className="flex-1 px-3 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-500 transition-colors text-xs flex items-center justify-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                        {t('print')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionView;
