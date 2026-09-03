import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface DetectedBarcode { rawValue: string; }
interface BarcodeDetectorLike { detect(source: CanvasImageSource): Promise<DetectedBarcode[]>; }
interface BarcodeDetectorConstructor { new(options?: { formats?: string[] }): BarcodeDetectorLike; getSupportedFormats?(): Promise<string[]>; }

declare global {
  interface Window { BarcodeDetector?: BarcodeDetectorConstructor; }
}

export function normalizedBarcode(value: string): string | undefined {
  const code = value.replace(/\D/g, '');
  return code.length >= 8 && code.length <= 14 ? code : undefined;
}

export function cameraBarcodeSupported(target: Pick<Window, 'BarcodeDetector' | 'navigator'> = window): boolean {
  return typeof target.BarcodeDetector === 'function' && typeof target.navigator.mediaDevices?.getUserMedia === 'function';
}

interface Props { onDetected(code: string): void; onClose(): void; }

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const dialogRef = useAccessibleDialog(onClose);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState('Point the rear camera at the package barcode.');

  useEffect(() => {
    let active = true;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    const start = async () => {
      if (!cameraBarcodeSupported()) { setMessage('Camera barcode scanning is not supported in this browser. Enter the code manually.'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!active || !videoRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const Detector = window.BarcodeDetector!;
        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        timer = window.setInterval(() => {
          const video = videoRef.current;
          if (!active || !video || video.readyState < 2) return;
          void detector.detect(video).then((codes) => {
            const code = normalizedBarcode(codes[0]?.rawValue ?? '');
            if (!active || !code) return;
            active = false;
            stream?.getTracks().forEach((track) => track.stop());
            if (timer !== undefined) window.clearInterval(timer);
            onDetected(code);
          }).catch(() => undefined);
        }, 250);
      } catch {
        if (active) setMessage('Camera access was unavailable. Allow camera permission or enter the barcode manually.');
      }
    };
    void start();
    return () => { active = false; if (timer !== undefined) window.clearInterval(timer); stream?.getTracks().forEach((track) => track.stop()); };
  }, [onDetected]);

  return <div className="barcode-scanner-backdrop" onMouseDown={onClose}><section ref={dialogRef} className="barcode-scanner" role="dialog" aria-modal="true" aria-labelledby="barcode-scanner-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="section-label">PACKAGE CAMERA</span><h3 id="barcode-scanner-title">Scan barcode</h3></div><button onClick={onClose} aria-label="Close barcode scanner"><X size={18} /></button></header>
    <div className="barcode-camera"><video ref={videoRef} playsInline muted aria-label="Live rear-camera barcode view" /><span><Camera size={22} /></span></div>
    <p aria-live="polite">{message}</p>
    <button className="barcode-manual" onClick={onClose}>Enter barcode manually</button>
    <small>Video stays on this device and is not uploaded.</small>
  </section></div>;
}
