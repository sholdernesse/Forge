import { describe, expect, it } from 'vitest';
import { cameraBarcodeCapability, cameraBarcodeSupported, normalizedBarcode } from './BarcodeScanner.js';

describe('barcode scanner capability', () => {
  it('normalizes supported package barcode lengths', () => {
    expect(normalizedBarcode('0 12345-67890 5')).toBe('012345678905');
    expect(normalizedBarcode('123')).toBeUndefined();
    expect(normalizedBarcode('123456789012345')).toBeUndefined();
  });

  it('requires a secure camera context and allows the compatibility decoder', () => {
    const detector = class { detect() { return Promise.resolve([]); } };
    expect(cameraBarcodeSupported({ isSecureContext: true, BarcodeDetector: detector, navigator: { mediaDevices: { getUserMedia: async () => ({}) } } as unknown as Navigator })).toBe(true);
    expect(cameraBarcodeCapability({ isSecureContext: false, BarcodeDetector: detector, navigator: { mediaDevices: { getUserMedia: async () => ({}) } } as unknown as Navigator })).toBe('https-required');
    expect(cameraBarcodeCapability({ isSecureContext: true, navigator: {} as Navigator })).toBe('camera-unavailable');
    expect(cameraBarcodeCapability({ isSecureContext: true, navigator: { mediaDevices: { getUserMedia: async () => ({}) } } as unknown as Navigator })).toBe('ready');
  });
});
