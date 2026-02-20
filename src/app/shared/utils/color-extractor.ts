export interface ColorOption {
  name: string;
  hex: string;
  source: 'detected' | 'palette' | 'custom';
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface PaletteColor {
  name: string;
  hex: string;
}

const QUANTIZATION_STEP = 32;
const MIN_ALPHA = 120;
const DISTINCT_DISTANCE = 38;
const DEFAULT_COLOR_HEX = '#1A1A1A';

const COLOR_REFERENCE: PaletteColor[] = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#F5F5F5' },
  { name: 'Grey', hex: '#8E8E8E' },
  { name: 'Navy', hex: '#1E3557' },
  { name: 'Blue', hex: '#3F6EA8' },
  { name: 'Teal', hex: '#2C7A7B' },
  { name: 'Green', hex: '#4F8F67' },
  { name: 'Olive', hex: '#7C7F3E' },
  { name: 'Yellow', hex: '#D8B234' },
  { name: 'Orange', hex: '#C9822D' },
  { name: 'Brown', hex: '#8B5A3C' },
  { name: 'Beige', hex: '#D3BFA6' },
  { name: 'Pink', hex: '#D38FA3' },
  { name: 'Red', hex: '#B8514D' },
  { name: 'Purple', hex: '#7A5AA7' },
];

export const APP_COLOR_PALETTE: ColorOption[] = [
  { name: 'Black', hex: '#1A1A1A', source: 'palette' },
  { name: 'White', hex: '#F5F5F5', source: 'palette' },
  { name: 'Navy', hex: '#1E3557', source: 'palette' },
  { name: 'Grey', hex: '#8E8E8E', source: 'palette' },
  { name: 'Brown', hex: '#8B5A3C', source: 'palette' },
  { name: 'Beige', hex: '#D3BFA6', source: 'palette' },
  { name: 'Blue', hex: '#3F6EA8', source: 'palette' },
  { name: 'Green', hex: '#4F8F67', source: 'palette' },
  { name: 'Red', hex: '#B8514D', source: 'palette' },
  { name: 'Orange', hex: '#C9822D', source: 'palette' },
  { name: 'Purple', hex: '#7A5AA7', source: 'palette' },
];

export async function extractDominantColors(imageUrl: string, limit = 3): Promise<string[]> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return [];
  }

  const sampleSize = 72;
  const scale = Math.min(sampleSize / image.width, sampleSize / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const buckets = new Map<string, { count: number; rgb: RgbColor }>();

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    if (alpha < MIN_ALPHA) {
      continue;
    }

    const red = quantize(pixels[index] ?? 0);
    const green = quantize(pixels[index + 1] ?? 0);
    const blue = quantize(pixels[index + 2] ?? 0);
    const key = `${red},${green},${blue}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    buckets.set(key, { count: 1, rgb: { r: red, g: green, b: blue } });
  }

  const sorted = [...buckets.values()].sort((left, right) => right.count - left.count);
  const selected: string[] = [];

  for (const entry of sorted) {
    const candidateHex = rgbToHex(entry.rgb);
    const candidateRgb = hexToRgb(candidateHex);
    if (!candidateRgb) {
      continue;
    }

    const isDistinct = selected.every((hex) => {
      const selectedRgb = hexToRgb(hex);
      if (!selectedRgb) {
        return true;
      }
      return colorDistance(candidateRgb, selectedRgb) >= DISTINCT_DISTANCE;
    });

    if (!isDistinct) {
      continue;
    }

    selected.push(candidateHex);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

export function createColorOption(
  hex: string,
  source: ColorOption['source'],
  name?: string,
): ColorOption {
  const normalizedHex = normalizeHex(hex);
  return {
    name: name ?? resolveColorName(normalizedHex),
    hex: normalizedHex,
    source,
  };
}

export function resolveColorName(hex: string): string {
  const normalizedHex = normalizeHex(hex);
  const rgb = hexToRgb(normalizedHex);
  if (!rgb) {
    return 'Custom';
  }

  let nearest = COLOR_REFERENCE[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const color of COLOR_REFERENCE) {
    const referenceRgb = hexToRgb(color.hex);
    if (!referenceRgb) {
      continue;
    }
    const distance = colorDistance(rgb, referenceRgb);
    if (distance < nearestDistance) {
      nearest = color;
      nearestDistance = distance;
    }
  }

  return nearest.name;
}

export function uniqueColorOptions(options: ColorOption[]): ColorOption[] {
  const byHex = new Map<string, ColorOption>();
  for (const option of options) {
    const normalizedHex = normalizeHex(option.hex);
    if (!byHex.has(normalizedHex)) {
      byHex.set(normalizedHex, {
        ...option,
        hex: normalizedHex,
      });
    }
  }
  return [...byHex.values()];
}

export function normalizeHex(hex: string): string {
  const cleaned = hex.trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }

  return DEFAULT_COLOR_HEX;
}

function quantize(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value / QUANTIZATION_STEP) * QUANTIZATION_STEP));
}

function colorDistance(first: RgbColor, second: RgbColor): number {
  return Math.sqrt(
    (first.r - second.r) * (first.r - second.r) +
      (first.g - second.g) * (first.g - second.g) +
      (first.b - second.b) * (first.b - second.b),
  );
}

function rgbToHex(rgb: RgbColor): string {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

function hexToRgb(hex: string): RgbColor | null {
  const normalizedHex = normalizeHex(hex).replace('#', '');
  if (!/^[0-9A-F]{6}$/.test(normalizedHex)) {
    return null;
  }

  return {
    r: Number.parseInt(normalizedHex.slice(0, 2), 16),
    g: Number.parseInt(normalizedHex.slice(2, 4), 16),
    b: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to read image for color analysis.'));
    image.src = src;
  });
}
