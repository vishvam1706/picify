import sharp from 'sharp';
import { Vibrant } from 'node-vibrant/node';
import logger from './logger';

const SIZES = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600 },
  large: { width: 1200 },
};

/**
 * Compress + resize an image buffer
 * @param {Buffer} buffer - raw image buffer
 * @param {Object} opts - { width, height, quality, format }
 * @returns {Promise<Buffer>}
 */
export async function compressImage(buffer, opts = {}) {
  const { width = 1200, quality = 82, format = 'webp' } = opts;
  let pipeline = sharp(buffer).resize({ width, withoutEnlargement: true });

  if (format === 'webp') pipeline = pipeline.webp({ quality });
  else if (format === 'jpeg') pipeline = pipeline.jpeg({ quality });
  else if (format === 'png') pipeline = pipeline.png({ quality });
  else pipeline = pipeline.webp({ quality }); // default

  return pipeline.toBuffer();
}

/**
 * Get image metadata (width, height, format, size)
 */
export async function getImageMetadata(buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    size: buffer.length,
    orientation:
      meta.width === meta.height
        ? 'square'
        : meta.width > meta.height
          ? 'landscape'
          : 'portrait',
  };
}

/**
 * Apply a visual filter to an image buffer using Sharp
 * @param {Buffer} buffer
 * @param {string} filter — 'grayscale' | 'sepia' | 'vivid' | 'cool' | 'fade'
 * @returns {Promise<Buffer>}
 */
export async function applyFilter(buffer, filter) {
  let pipeline = sharp(buffer);
  switch (filter) {
    case 'grayscale':
      pipeline = pipeline.grayscale();
      break;
    case 'sepia':
      pipeline = pipeline.grayscale().tint({ r: 112, g: 66, b: 20 });
      break;
    case 'vivid':
      pipeline = pipeline.modulate({ saturation: 1.5, brightness: 1.05 });
      break;
    case 'cool':
      pipeline = pipeline.tint({ r: 100, g: 160, b: 255 });
      break;
    case 'fade':
      pipeline = pipeline.modulate({ saturation: 0.5, brightness: 1.1 });
      break;
    default:
      break;
  }
  return pipeline.webp({ quality: 85 }).toBuffer();
}

/**
 * Crop an image buffer
 * @param {Buffer} buffer
 * @param {Object} crop — { left, top, width, height }
 * @returns {Promise<Buffer>}
 */
export async function cropImage(buffer, crop) {
  return sharp(buffer).extract(crop).webp({ quality: 85 }).toBuffer();
}

/**
 * Extract dominant color palette from an image buffer
 * @param {Buffer} buffer
 * @returns {Promise<string[]>} — array of hex codes
 */
export async function extractColorPalette(buffer) {
  try {
    const palette = await Vibrant.from(buffer).getPalette();
    const colors = Object.values(palette)
      .filter(Boolean)
      .map((swatch) => swatch.hex);
    return colors;
  } catch (err) {
    logger.warn('[ImageProcessor] Color extraction failed:', err.message);
    return [];
  }
}

/**
 * Compute a perceptual hash for an image buffer (for similarity search)
 * @param {Buffer} buffer
 * @returns {Promise<string>} — hex hash
 */
export async function computeImageHash(buffer) {
  try {
    // Resize to 8x8 grayscale for simple perceptual hash
    const { data } = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    let hash = '';
    for (let i = 0; i < data.length; i++) {
      hash += data[i] >= avg ? '1' : '0';
    }
    // Convert binary string to hex
    return parseInt(hash, 2).toString(16).padStart(16, '0');
  } catch (err) {
    logger.warn('[ImageProcessor] Hash computation failed:', err.message);
    return null;
  }
}

/**
 * Hamming distance between two hex perceptual hashes
 */
export function hashDistance(hash1, hash2) {
  if (!hash1 || !hash2) return Infinity;
  const b1 = parseInt(hash1, 16).toString(2).padStart(64, '0');
  const b2 = parseInt(hash2, 16).toString(2).padStart(64, '0');
  let dist = 0;
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) dist++;
  }
  return dist;
}
