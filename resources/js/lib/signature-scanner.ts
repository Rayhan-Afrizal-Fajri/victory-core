export type SignatureInkMode = 'black' | 'original';

export interface ScanSignatureOptions {
    /** Sensitivity offset applied on top of Otsu threshold (-50..50). */
    thresholdOffset?: number;
    /** Output ink color style. */
    inkMode?: SignatureInkMode;
    /** Padding around cropped signature in pixels. */
    padding?: number;
}

const DEFAULT_MAX_DIMENSION = 1000;

/**
 * Load an uploaded image file and downscale it proportionally so pixel
 * processing stays fast (<30ms) even for high-megapixel phone camera photos.
 */
export async function loadAndDownscaleSignatureImage(
    file: File,
    maxDimension = DEFAULT_MAX_DIMENSION,
): Promise<HTMLCanvasElement> {
    const objectUrl = URL.createObjectURL(file);

    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () =>
                reject(new Error('Gagal membaca file gambar tanda tangan.'));
            element.src = objectUrl;
        });

        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (!naturalWidth || !naturalHeight) {
            throw new Error('Dimensi gambar tidak valid.');
        }

        const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
        const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
        const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
            throw new Error('Canvas 2D tidak didukung di browser ini.');
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        return canvas;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

/**
 * Compute Otsu's optimal luminance threshold to separate paper background
 * from darker ink strokes automatically.
 */
function computeOtsuThreshold(luminances: Uint8Array, totalOpaque: number): number {
    if (totalOpaque === 0) {
        return 175;
    }

    const histogram = new Uint32Array(256);
    let sum = 0;

    for (let i = 0; i < totalOpaque; i++) {
        const lum = luminances[i];
        histogram[lum]++;
        sum += lum;
    }

    let sumB = 0;
    let weightB = 0;
    let maxVariance = -1;
    let threshold = 175;

    for (let t = 0; t < 256; t++) {
        weightB += histogram[t];

        if (weightB === 0) {
continue;
}

        const weightF = totalOpaque - weightB;

        if (weightF === 0) {
break;
}

        sumB += t * histogram[t];
        const meanB = sumB / weightB;
        const meanF = (sum - sumB) / weightF;
        const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF);

        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = t;
        }
    }

    // Clamp slightly below pure white so faint paper grain gets removed cleanly
    return Math.min(228, Math.max(70, threshold));
}

/**
 * Extract signature strokes onto a transparent, tightly-cropped PNG data URL.
 * Returns null if no visible ink pixels are detected at the current threshold.
 */
export function extractSignatureFromCanvas(
    sourceCanvas: HTMLCanvasElement,
    options: ScanSignatureOptions = {},
): string | null {
    const {
        thresholdOffset = 0,
        inkMode = 'black',
        padding = 12,
    } = options;

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });

    if (!sourceCtx || width === 0 || height === 0) {
        return null;
    }

    const srcImage = sourceCtx.getImageData(0, 0, width, height);
    const src = srcImage.data;
    const pixelCount = width * height;

    const luminances = new Uint8Array(pixelCount);
    let opaqueCount = 0;

    for (let i = 0; i < pixelCount; i++) {
        const offset = i * 4;
        const a = src[offset + 3];

        if (a < 20) {
continue;
}

        const lum = Math.round(
            0.299 * src[offset] + 0.587 * src[offset + 1] + 0.114 * src[offset + 2],
        );
        luminances[opaqueCount++] = lum;
    }

    const baseThreshold = computeOtsuThreshold(luminances, opaqueCount);
    const threshold = Math.min(245, Math.max(30, baseThreshold + thresholdOffset));
    const feather = 18;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d');

    if (!outCtx) {
return null;
}

    const outImage = outCtx.createImageData(width, height);
    const dst = outImage.data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const srcAlpha = src[idx + 3];

            if (srcAlpha < 20) {
continue;
}

            const r = src[idx];
            const g = src[idx + 1];
            const b = src[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > threshold + feather) {
                continue;
            }

            let inkStrength: number;

            if (lum <= threshold - feather) {
                inkStrength = 1;
            } else {
                inkStrength = (threshold + feather - lum) / (2 * feather);
            }

            const finalAlpha = Math.round(inkStrength * (srcAlpha / 255) * 255);

            if (finalAlpha <= 8) {
continue;
}

            if (inkMode === 'black') {
                dst[idx] = 17;
                dst[idx + 1] = 24;
                dst[idx + 2] = 39;
            } else {
                dst[idx] = r;
                dst[idx + 1] = g;
                dst[idx + 2] = b;
            }

            dst[idx + 3] = finalAlpha;

            if (x < minX) {
minX = x;
}

            if (x > maxX) {
maxX = x;
}

            if (y < minY) {
minY = y;
}

            if (y > maxY) {
maxY = y;
}
        }
    }

    if (maxX < minX || maxY < minY) {
        return null;
    }

    outCtx.putImageData(outImage, 0, 0);

    return cropCanvasRegionToPng(outCanvas, minX, minY, maxX, maxY, padding);
}

/**
 * Trim transparent margin around any HTMLCanvasElement (such as SignatureCanvas)
 * and return a PNG data URL, or null if no non-transparent pixels exist.
 */
export function trimCanvasToPng(
    canvas: HTMLCanvasElement,
    padding = 10,
): string | null {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || width === 0 || height === 0) {
return null;
}

    const { data } = ctx.getImageData(0, 0, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];

            if (alpha > 4) {
                if (x < minX) {
minX = x;
}

                if (x > maxX) {
maxX = x;
}

                if (y < minY) {
minY = y;
}

                if (y > maxY) {
maxY = y;
}
            }
        }
    }

    if (maxX < minX || maxY < minY) {
        return null;
    }

    return cropCanvasRegionToPng(canvas, minX, minY, maxX, maxY, padding);
}

/**
 * Render an image data URL centered and proportionally fitted inside a target
 * CSS-pixel rectangle so SignatureCanvas.fromDataURL never stretches it.
 */
export async function fitSignatureToBoxDataUrl(
    dataUrl: string,
    targetWidth: number,
    targetHeight: number,
    padding = 12,
): Promise<string> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.crossOrigin = 'anonymous';
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('Gagal memuat gambar tanda tangan.'));
        element.src = dataUrl;
    });

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(targetWidth * ratio));
    canvas.height = Math.max(1, Math.round(targetHeight * ratio));

    const ctx = canvas.getContext('2d');

    if (!ctx) {
return dataUrl;
}

    ctx.scale(ratio, ratio);

    const availW = Math.max(1, targetWidth - padding * 2);
    const availH = Math.max(1, targetHeight - padding * 2);
    const imgW = img.naturalWidth || img.width || availW;
    const imgH = img.naturalHeight || img.height || availH;
    const scale = Math.min(availW / imgW, availH / imgH);

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (targetWidth - drawW) / 2;
    const drawY = (targetHeight - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    return canvas.toDataURL('image/png');
}

function cropCanvasRegionToPng(
    source: HTMLCanvasElement,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    padding: number,
): string {
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropRight = Math.min(source.width - 1, maxX + padding);
    const cropBottom = Math.min(source.height - 1, maxY + padding);
    const cropW = Math.max(1, cropRight - cropX + 1);
    const cropH = Math.max(1, cropBottom - cropY + 1);

    const trimmed = document.createElement('canvas');
    trimmed.width = cropW;
    trimmed.height = cropH;

    const ctx = trimmed.getContext('2d');

    if (!ctx) {
        return source.toDataURL('image/png');
    }

    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    return trimmed.toDataURL('image/png');
}
