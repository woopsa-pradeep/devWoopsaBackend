import * as bwipjs from 'bwip-js';
import { uploadFileToAzure } from './azureUploader';

type BarcodeType =
  | 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca'
  | 'qrcode'  | 'pdf417';

export interface GenerateBarcodeUploadOptions {
  folderName: string;          
  fileName?: string;          
  type?: BarcodeType;          
  includeText?: boolean;       
  scale?: number;              
  height?: number;             
  color?: string;             
  background?: string;        
}


export async function generateBarcodeAndUpload(
  text: string,
  opts: GenerateBarcodeUploadOptions
): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
  if (!text?.trim()) {
    return { success: false, error: 'Barcode text is required.' };
  }
  if (!opts?.folderName) {
    return { success: false, error: 'folderName is required.' };
  }

  const {
    fileName,
    folderName,
    type = 'code128',
    includeText = true,
    scale = 3,
    height = 12,
    color = '000000',
    background = 'FFFFFF',
  } = opts;

  // 1) Generate barcode PNG buffer
  const pngBuffer: Buffer = await bwipjs.toBuffer({
    bcid: type,                // barcode type
    text,                      // data to encode
    scale,                     // 1+ (larger == bigger)
    height,                    // bar height (in "modules")
    includetext: includeText,  // human-readable text
    textxalign: 'center',
    backgroundcolor: background,
    barcolor: color,
  });

  // 2) Build a filename if one not provided
  const safeBase =
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'barcode';
  const finalFileName = fileName?.endsWith('.png') ? fileName : `${fileName || safeBase}-${Date.now()}.png`;

  // 3) Reuse your uploader
  // Note: your uploader’s first param is named `Buffer` (capital B). That shadows the global type.
  // It still works, but consider renaming to `buffer` for clarity in your uploader function.
  return uploadFileToAzure(
    pngBuffer,          // image bytes
    finalFileName,      // originalFileName
    'image/png',        // mimeType
    folderName          // folderName
  );
}


let counter = 0;
const usedBarcodes = new Set();

function generateTimeBased15Digit() {
  const timestamp = Date.now().toString(); // 13 digits
  counter = (counter + 1) % 100;           // 2-digit rolling counter (00–99)

  const barcode = timestamp + counter.toString().padStart(2, "0"); // → 15 digits
  return barcode;
}

export async function generateRandomBarCode(count: number) {
  const results = [];

  while (results.length < count) {
    const code = generateTimeBased15Digit();

    if (!usedBarcodes.has(code)) {
      usedBarcodes.add(code);
      results.push(code);
    }
  }

  return results;
}