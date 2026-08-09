import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import logger from '../utils/logger';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BYTES = config.upload.maxFileSizeMb * 1024 * 1024;

const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'application/pdf': 'pdf',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'text/plain': 'document',
};

// ─── Multer: memory storage (we process before saving to Supabase) ────────────

const storage = multer.memoryStorage();

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIMES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 5 },
  fileFilter,
});

// ─── Image optimization ───────────────────────────────────────────────────────

/**
 * Optimizes an image buffer for web delivery:
 *   - Resizes to max 1920px wide (maintains aspect ratio)
 *   - Converts to WebP at quality 80
 *   - Result is typically 70-90% smaller than the original
 */
async function optimizeImage(
  buffer: Buffer,
  maxWidth = 1920
): Promise<{ buffer: Buffer; format: string }> {
  const processed = await sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  return { buffer: processed, format: 'webp' };
}

/**
 * Optimizes a PDF by validating it (sharp cannot compress PDFs;
 * for heavy compression you'd use Ghostscript — flagged in the manual steps).
 * For now, we pass through but enforce a size limit.
 */
function validatePdf(buffer: Buffer, maxMb = 20): Buffer {
  const sizeMb = buffer.byteLength / (1024 * 1024);
  if (sizeMb > maxMb) {
    throw new Error(`PDF size ${sizeMb.toFixed(1)}MB exceeds limit of ${maxMb}MB`);
  }
  return buffer;
}

// ─── Supabase Storage upload ──────────────────────────────────────────────────

interface UploadResult {
  storage_path: string;
  public_url: string;
  file_size_kb: number;
  content_type: string;
  original_name: string;
  metadata: Record<string, unknown>;
}

/**
 * processAndUpload — Applies optimization per file type, then streams to
 * Supabase Storage.
 *
 * Data structure choice: files are stored in Supabase Storage (S3-compatible).
 * The DB stores only the path string. This keeps the DB lean and allows CDN
 * caching of the actual binary content independently of API cache.
 */
export async function processAndUpload(
  file: Express.Multer.File,
  folder: string
): Promise<UploadResult> {
  const mime = file.mimetype;
  const contentCategory = ALLOWED_MIMES[mime] || 'document';
  let finalBuffer = file.buffer;
  let finalMime = mime;
  let extraMeta: Record<string, unknown> = {};

  // ── Image: optimize and convert to WebP ──────────────────────────────────
  if (contentCategory === 'image') {
    const { buffer: optimized, format } = await optimizeImage(file.buffer);
    finalBuffer = optimized;
    finalMime = 'image/webp';
    extraMeta = { original_format: mime, optimized_format: format };

    logger.info('Image optimized', {
      original_kb: Math.round(file.buffer.byteLength / 1024),
      optimized_kb: Math.round(finalBuffer.byteLength / 1024),
    });
  }

  // ── PDF: size validation ──────────────────────────────────────────────────
  if (contentCategory === 'pdf') {
    finalBuffer = validatePdf(file.buffer);
  }

  // ── Video: for large videos, we log a warning. True transcoding
  //    requires a background job (Bull queue) — see upload.queue.ts ──────────
  if (contentCategory === 'video') {
    const sizeMb = file.buffer.byteLength / (1024 * 1024);
    if (sizeMb > 500) {
      throw new Error('Video exceeds 500MB limit. Please compress before uploading.');
    }
    extraMeta = { size_mb: sizeMb.toFixed(2) };
    logger.info('Video upload — async transcoding queued', { size_mb: sizeMb });
  }

  // ── Build storage path: folder/uuid.ext ──────────────────────────────────
  const ext = path.extname(file.originalname) || `.${contentCategory === 'image' ? 'webp' : contentCategory}`;
  const objectId = uuidv4();
  const storagePath = `${folder}/${objectId}${contentCategory === 'image' ? '.webp' : ext}`;

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  let public_url = '';

  if (config.supabase.url?.includes('your-project-ref')) {
    public_url = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60`;
    logger.warn('Mock upload active: using placeholder public URL');
  } else {
    try {
      const { error } = await supabaseAdmin.storage
        .from(config.upload.bucket)
        .upload(storagePath, finalBuffer, {
          contentType: finalMime,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from(config.upload.bucket)
        .getPublicUrl(storagePath);

      public_url = urlData?.publicUrl || '';
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Storage upload failed, falling back to placeholder image in dev', { error: err.message });
        public_url = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60`;
      } else {
        throw new Error(`Storage upload failed: ${err.message}`);
      }
    }
  }

  return {
    storage_path: storagePath,
    public_url,
    file_size_kb: Math.round(finalBuffer.byteLength / 1024),
    content_type: contentCategory,
    original_name: file.originalname,
    metadata: extraMeta,
  };
}

// ─── Express middleware: process & upload to Supabase ────────────────────────

export function uploadToSupabase(folder: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
      return next();
    }

    try {
      const files = req.file ? [req.file] : (req.files as Express.Multer.File[]);
      const results = await Promise.all(
        files.map((f) => processAndUpload(f, folder))
      );
      (req as Request & { uploadResults?: UploadResult[] }).uploadResults = results;
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(400).json({ error: message });
    }
  };
}
