/**
 * Client-Side Image Compressor & WebP Converter
 * Zero Cloud Cost - 100% Client-Side Canvas Processing
 * Reduces 10MB-20MB photos down to ~100-200KB WebP instantly.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Compresses an image File from local PC and returns a lightweight Base64 Data URL
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<{ dataUrl: string; originalSize: number; compressedSize: number; dimensions: { width: number; height: number } }> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw and compress
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Check webp support fallback
        let targetFormat = format;
        let dataUrl = canvas.toDataURL(targetFormat, quality);
        if (!dataUrl.startsWith('data:image/webp') && format === 'image/webp') {
          targetFormat = 'image/jpeg';
          dataUrl = canvas.toDataURL(targetFormat, quality);
        }

        // Approximate compressed byte size
        const head = dataUrl.indexOf(',');
        const compressedSize = Math.round((dataUrl.length - (head + 1)) * 0.75);

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize,
          dimensions: { width, height }
        });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g. 15.2 MB -> 142 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
