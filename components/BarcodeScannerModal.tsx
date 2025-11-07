
import React, { useEffect, useRef, useState } from 'react';
import { TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  t: TFunction;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onBarcodeDetected, t }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: number;

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }

    if (!isOpen) {
      stopStream();
      return;
    }

    const startScan = async () => {
      setError(null);
      // @ts-ignore - BarcodeDetector might not be in the default TS window type
      if (!('BarcodeDetector' in window) || !window.BarcodeDetector) {
        setError("Barcode Detector is not supported by this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'upc_a', 'qr_code', 'code_128'] });

        intervalId = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              onBarcodeDetected(barcodes[0].rawValue);
              clearInterval(intervalId);
            }
          } catch (e) {
            console.error('Barcode detection failed:', e);
          }
        }, 300);

      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error) {
          setError(`Error accessing camera: ${err.message}`);
        } else {
          setError('Could not access the camera.');
        }
      }
    };

    startScan();

    return () => {
      clearInterval(intervalId);
      stopStream();
    };
  }, [isOpen, onBarcodeDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex flex-col items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-black rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <video ref={videoRef} className="w-full h-auto max-h-[80vh]" playsInline />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-1/2 border-4 border-dashed border-white/50 rounded-lg" />
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 transition-colors">
          <ClearIcon />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-center text-white bg-black/50 p-2 rounded">
          {error ? <p className="text-red-400 font-semibold">{error}</p> : <p>Position a barcode inside the frame</p>}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
