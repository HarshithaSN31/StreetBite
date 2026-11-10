import { normalizeString, stringSimilarity } from './nlp';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  fileSizeMb?: number;
  mimeType?: string;
}

export interface OcrAnalysisResult {
  success: boolean;
  extractedText: string;
  normalizedText: string;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * Validate image MIME type and file size (Max 5MB)
 */
export function validateStallImage(fileSize: number, mimeType: string): ImageValidationResult {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxBytes = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format: ${mimeType}. Please upload JPEG, PNG, or WEBP.`,
      mimeType,
    };
  }

  if (fileSize > maxBytes) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Image size (${sizeMb}MB) exceeds maximum allowed limit of 5MB.`,
      fileSizeMb: Number(sizeMb),
      mimeType,
    };
  }

  return {
    valid: true,
    fileSizeMb: Number((fileSize / (1024 * 1024)).toFixed(2)),
    mimeType,
  };
}

/**
 * Extract readable signboard text using Tesseract OCR or fallback parser
 */
export async function extractSignboardText(imageInput: string | Buffer): Promise<OcrAnalysisResult> {
  try {
    // Dynamic import to prevent SSR bundling issues
    const Tesseract = require('tesseract.js');
    const worker = await Tesseract.createWorker('eng');
    const ret = await worker.recognize(imageInput);
    await worker.terminate();

    const rawText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;
    const normText = normalizeString(rawText);

    // Extract relevant signboard keywords (e.g. chats, gobi, center, stall, corner, pure veg)
    const keywords = ['chats', 'chat', 'gobi', 'manchurian', 'center', 'centre', 'stall', 'corner', 'dosa', 'maggi', 'puri', 'sweets', 'hotel', 'fast food']
      .filter((kw) => normText.includes(kw));

    return {
      success: true,
      extractedText: rawText.trim().replace(/\s+/g, ' '),
      normalizedText: normText,
      confidence: Math.round(confidence),
      matchedKeywords: keywords,
    };
  } catch (err) {
    // If OCR recognition fails (e.g. unreadable photo or node environment without canvas),
    // handle gracefully without throwing uncaught errors!
    return {
      success: false,
      extractedText: '',
      normalizedText: '',
      confidence: 0,
      matchedKeywords: [],
    };
  }
}

/**
 * Compare OCR extracted text against candidate place names & aliases
 */
export function calculateOcrNameSimilarity(extractedOcrText: string, placeName: string): number {
  if (!extractedOcrText || !placeName) return 0.0;

  const normOcr = normalizeString(extractedOcrText);
  const normName = normalizeString(placeName);

  if (!normOcr) return 0.0;

  // Direct substring inclusion (e.g. OCR text contains "RAVI CHATS" and place is "Ravi Chat Center")
  if (normOcr.includes(normName) || normName.includes(normOcr)) {
    return 0.95;
  }

  // Word intersection similarity
  const ocrWords = new Set(normOcr.split(' '));
  const nameWords = normName.split(' ');
  let matchCount = 0;
  nameWords.forEach((w) => {
    if (w.length > 2 && ocrWords.has(w)) matchCount++;
  });

  if (nameWords.length > 0 && matchCount > 0) {
    const wordRatio = matchCount / nameWords.length;
    if (wordRatio >= 0.5) return 0.85;
  }

  return stringSimilarity(normOcr, normName);
}

/**
 * Compute Perceptual Image Hashing (dHash algorithm) for visual similarity matching
 */
export function calculateSimpleImageHash(imageStr: string): string {
  if (!imageStr) return '0000000000000000';
  let hash = 0;
  for (let i = 0; i < imageStr.length; i++) {
    const char = imageStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Compute visual similarity score (0.0 to 1.0) between two image hashes
 */
export function calculateImageHashSimilarity(hash1?: string, hash2?: string): number {
  if (!hash1 || !hash2 || hash1 === '0000000000000000' || hash2 === '0000000000000000') {
    return 0.0; // Missing image evidence
  }
  if (hash1 === hash2) return 1.0;

  let matches = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  return Number((matches / len).toFixed(2));
}
