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

export type CameraBarcodeCapability = 'ready' | 'https-required' | 'camera-unavailable';

export function cameraBarcodeCapability(target: Pick<Window, 'BarcodeDetector' | 'navigator' | 'isSecureContext'> = window): CameraBarcodeCapability {
  if (!target.isSecureContext) return 'https-required';
  if (typeof target.navigator.mediaDevices?.getUserMedia !== 'function') return 'camera-unavailable';
  return 'ready';
}

export function cameraBarcodeSupported(target: Pick<Window, 'BarcodeDetector' | 'navigator' | 'isSecureContext'> = window): boolean {
  return cameraBarcodeCapability(target) === 'ready';
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
    let fallbackControls: { stop(): void } | undefined;
    const start = async () => {
      const capability = cameraBarcodeCapability();
      if (capability === 'https-required') { setMessage('Camera access requires HTTPS. Open the deployed secure Forge site or enter the barcode manually.'); return; }
      if (capability === 'camera-unavailable') { setMessage('This browser cannot provide camera access. Enter the barcode manually.'); return; }
      try {
        const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
        if (typeof window.BarcodeDetector !== 'function') {
          setMessage('Starting the compatible barcode scanner…');
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          if (!active || !videoRef.current) return;
          const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 250 });
          fallbackControls = await reader.decodeFromConstraints(
            constraints,
            videoRef.current,
            (result, _error, controls) => {
              const code = normalizedBarcode(result?.getText() ?? '');
              if (!active || !code) return;
              active = false;
              controls.stop();
              onDetected(code);
            },
          );
          if (active) setMessage('Point the rear camera at the package barcode.');
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints);
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
    return () => { active = false; if (timer !== undefined) window.clearInterval(timer); fallbackControls?.stop(); stream?.getTracks().forEach((track) => track.stop()); };
  }, [onDetected]);

  return <div className="barcode-scanner-backdrop" onMouseDown={onClose}><section ref={dialogRef} className="barcode-scanner" role="dialog" aria-modal="true" aria-labelledby="barcode-scanner-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="section-label">PACKAGE CAMERA</span><h3 id="barcode-scanner-title">Scan barcode</h3></div><button onClick={onClose} aria-label="Close barcode scanner"><X size={18} /></button></header>
    <div className={`barcode-camera ${cameraBarcodeSupported() ? '' : 'unavailable'}`}><video ref={videoRef} playsInline muted aria-label="Live rear-camera barcode view" /><span><Camera size={22} /></span></div>
    <p aria-live="polite">{message}</p>
    <button className="barcode-manual" onClick={onClose}>Enter barcode manually</button>
    <small>Video stays on this device and is not uploaded.</small>
  </section></div>;
}
