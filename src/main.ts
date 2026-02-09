import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const CHECKROOM_LIGATURE = 'checkroom';
const CHECKROOM_CODEPOINT = '\ue15d';
const FAVICON_ICON_SIZE = 48;

function extractGradientStops(gradientValue: string): [string, string] {
  const matches = gradientValue.match(/#(?:[\da-fA-F]{3,8})|rgba?\([^)]+\)|hsla?\([^)]+\)/g);
  if (matches && matches.length >= 2) {
    return [matches[0], matches[1]];
  }

  const rootStyles = getComputedStyle(document.documentElement);
  const start = rootStyles.getPropertyValue('--dw-primary').trim() || '#8C7B70';
  const end = rootStyles.getPropertyValue('--dw-primary-light').trim() || '#9E8F85';
  return [start, end];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBrandFavicon(iconText: string): string | null {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const bodyStyles = getComputedStyle(document.body);
  const gradientValue = bodyStyles.getPropertyValue('--dw-gradient-primary').trim();
  const [startColor, endColor] = extractGradientStops(gradientValue);

  const gradient = ctx.createLinearGradient(6, 6, 58, 58);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);

  drawRoundedRect(ctx, 4, 4, 56, 56, 16);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${FAVICON_ICON_SIZE}px "Material Icons"`;
  ctx.fillText(iconText, size / 2, size / 2 + 1);

  return canvas.toDataURL('image/png');
}

function setFavicon(href: string): void {
  // Some browsers keep first discovered favicon aggressively. Replace icon links to force refresh.
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"]').forEach(link => {
    link.parentNode?.removeChild(link);
  });

  const cacheBustedHref = `${href}#${Date.now()}`;

  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/png';
  icon.href = cacheBustedHref;
  document.head.appendChild(icon);

  const shortcut = document.createElement('link');
  shortcut.rel = 'shortcut icon';
  shortcut.type = 'image/png';
  shortcut.href = cacheBustedHref;
  document.head.appendChild(shortcut);
}

function applyHeaderMatchedFavicon(): void {
  const render = (useCodepoint = false) => {
    const text = useCodepoint ? CHECKROOM_CODEPOINT : CHECKROOM_LIGATURE;
    const dataUrl = drawBrandFavicon(text);
    if (dataUrl) {
      setFavicon(dataUrl);
    }
  };

  // Initial render to avoid empty icon during startup.
  render();

  if ('fonts' in document) {
    document.fonts
      .load(`${FAVICON_ICON_SIZE}px "Material Icons"`)
      .then(() => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 64;
        const testCtx = testCanvas.getContext('2d');
        if (!testCtx) {
          render();
          return;
        }
        testCtx.font = `${FAVICON_ICON_SIZE}px "Material Icons"`;
        const ligatureWidth = testCtx.measureText(CHECKROOM_LIGATURE).width;
        render(ligatureWidth > 62);
      })
      .catch(() => {
        render(true);
      });
  }

  const observer = new MutationObserver(() => render());
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
}

applyHeaderMatchedFavicon();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
