import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { TwoPagePdfData } from '../ai-pricing/studio/overlayTypes';

/** Freeze the actual quote UI, including inherited fonts and current input values. */
function clonePage(source: HTMLElement, imageUrl: string | null): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...Array.from(source.querySelectorAll('*'))];
  const copies = [clone, ...Array.from(clone.querySelectorAll('*'))];
  const colorCache = new Map<string, string>();
  const pixel = document.createElement('canvas'); pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d', { willReadFrequently: true });
  const compatibleColors = (css: string) => css.replace(/(?:oklch|oklab|lab|lch|color)\([^)]*\)/g, color => {
    if (!context) return color;
    if (colorCache.has(color)) return colorCache.get(color)!;
    context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    const rgb = `rgba(${r}, ${g}, ${b}, ${a / 255})`; colorCache.set(color, rgb); return rgb;
  });
  originals.forEach((original, i) => {
    const copy = copies[i] as HTMLElement | SVGElement;
    const computed = getComputedStyle(original);
    copy.removeAttribute('id');
    copy.style.cssText = '';
    for (const key of Array.from(computed)) {
      if (!key.startsWith('--')) copy.style.setProperty(key, compatibleColors(computed.getPropertyValue(key)));
    }
    copy.style.animation = 'none'; copy.style.transition = 'none';
    if (original instanceof HTMLInputElement && copy instanceof HTMLInputElement) {
      copy.value = original.value; copy.setAttribute('value', original.value);
    }
    if (original instanceof HTMLTextAreaElement) copy.textContent = original.value;
    if (copy instanceof HTMLImageElement) {
      copy.loading = 'eager';
      if (copy.hasAttribute('data-bom-product-image') && imageUrl) copy.src = imageUrl;
    }
    // All rows are included, even when the quote table scrolls horizontally on screen.
    if (original instanceof HTMLElement && original.scrollWidth > original.clientWidth + 1) {
      copy.style.overflow = 'visible'; copy.style.maxWidth = 'none';
    }
  });
  clone.style.position = 'relative'; clone.style.top = 'auto'; clone.style.left = 'auto';
  clone.style.width = `${Math.max(source.getBoundingClientRect().width, source.scrollWidth)}px`;
  clone.style.height = 'auto'; clone.style.maxHeight = 'none'; clone.style.overflow = 'visible';
  clone.style.background = '#ffffff'; clone.style.paddingBottom = '8px';
  return clone;
}

export async function exportBomPages(data: TwoPagePdfData, options: { pages?: number[]; preview?: boolean; compact?: boolean }): Promise<string[]> {
  if (data.bomPages?.length !== 2 || data.bomPages.some(page => !page.isConnected)) throw new Error('Mở tab Báo giá để xuất PDF.');
  await document.fonts.ready;
  const portrait = data.orientation === 'portrait';
  const paperWidth = portrait ? 794 : 1123, paperHeight = portrait ? 1123 : 794;
  const pdfWidth = portrait ? 210 : 297, pdfHeight = portrait ? 297 : 210;
  const selected = [0, 1].filter(index => options.preview || !options.pages || options.pages.includes(index));
  if (!selected.length) throw new Error('Chưa chọn trang để in.');
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-99999px', top: '0', zIndex: '-9999', background: '#fff' });
  // Freeze both pages synchronously so subsequent edits cannot mix two revisions.
  const copies = data.bomPages.map(page => clonePage(page, data.renderImageUrl));
  host.append(...copies); document.body.append(host);
  const pdf = new jsPDF({ orientation: data.orientation || 'landscape', unit: 'mm', format: 'a4', compress: true });
  const previews: string[] = [];
  try {
    await Promise.all(Array.from(host.querySelectorAll('img')).map(async image => {
      try {
        if (!image.src.startsWith('data:') && new URL(image.src).origin !== location.origin) {
          const response = await fetch(image.src);
          if (!response.ok) throw new Error('image');
          const blob = await response.blob();
          image.src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
          });
        }
        await image.decode();
      } catch { throw new Error('Không tải được ảnh hoặc logo để xuất PDF.'); }
    }));
    for (const index of selected) {
      const content = await html2canvas(copies[index], { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false });
      const sheet = document.createElement('canvas');
      sheet.width = paperWidth * 2;
      // Messaging images use the content height instead of a full A4 sheet.
      const compactScale = Math.min(1, (sheet.width - 80) / content.width);
      sheet.height = options.compact ? Math.ceil(content.height * compactScale) + 80 : paperHeight * 2;
      const context = sheet.getContext('2d'); if (!context) throw new Error('Không dựng được trang PDF.');
      context.fillStyle = '#fff'; context.fillRect(0, 0, sheet.width, sheet.height);
      const margin = 40;
      // Do not enlarge one column's type more than the other. One CSS px maps to
      // 1/96 inch on paper; exceptionally long content is fitted without clipping.
      const scale = Math.min(1, (sheet.width - margin * 2) / content.width, (sheet.height - margin * 2) / content.height);
      const width = content.width * scale, height = content.height * scale;
      context.drawImage(content, (sheet.width - width) / 2, margin, width, height);
      const image = sheet.toDataURL('image/jpeg', 0.96);
      previews.push(image);
      if (!options.preview) {
        if (index !== selected[0]) pdf.addPage('a4', data.orientation || 'landscape');
        pdf.addImage(image, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
    }
    if (!options.preview) {
      const name = (data.model3DName || 'San_pham').replace(/[^\p{L}\p{N}]+/gu, '_');
      pdf.save(`Bao_Gia_${name}_${portrait ? 'Dung' : 'Nam'}.pdf`);
    }
    return previews;
  } finally { host.remove(); }
}


/** Stack the same two customer PDF sheets into one PNG for messaging apps. */
export async function mergeBomPagesImage(data: TwoPagePdfData): Promise<Blob> {
  const pages = await exportBomPages({ ...data, orientation: 'portrait' }, { preview: true, compact: true });
  const images = await Promise.all(pages.map(async source => {
    const image = new Image();
    image.src = source;
    await image.decode();
    return image;
  }));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...images.map(image => image.naturalWidth));
  canvas.height = images.reduce((height, image) => height + image.naturalHeight, 0);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Không dựng được ảnh báo giá.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  let top = 0;
  for (const image of images) {
    context.drawImage(image, (canvas.width - image.naturalWidth) / 2, top);
    top += image.naturalHeight;
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không tạo được ảnh báo giá.')), 'image/png');
  });
}
