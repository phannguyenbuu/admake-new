import type { Draft, Product } from './types';
import type { AnnotatedPhoto } from './productTextAnnotations';

export type TextReplacement = { source: string; replacement: string; slot_id?: string; original_source?: string; source_edited?: boolean; color?: string };
// Kept inside sign_content so existing VPS snapshots persist every replacement.
const FORMAT = 'admake-text-replacements-v1';
export function readReplacements(content = ''): TextReplacement[] | undefined {
  try {
    const value = JSON.parse(content);
    if (value.format === FORMAT && Array.isArray(value.lines)) return value.lines.filter((line: TextReplacement) =>
      typeof line.source === 'string' && typeof line.replacement === 'string');
  } catch { /* Existing free-text quotes remain supported. */ }
}
const validColor = (color?: string): string | undefined => /^#[0-9a-f]{6}$/i.test(color || '') ? color : undefined;
export function readBackgroundColor(content = ''): string | undefined {
  try { return validColor(JSON.parse(content).background_color); } catch { return undefined; }
}
export const writeReplacements = (lines: TextReplacement[], backgroundColor?: string) => JSON.stringify({ format: FORMAT,
  ...(validColor(backgroundColor) ? { background_color: backgroundColor } : {}),
  // Geometry lives in the image library, not in the 4 KB quote brief on the VPS.
  lines: lines.filter(line => !line.slot_id || line.replacement.trim() || validColor(line.color) || line.source !== line.original_source)
    .map(({ source, replacement, slot_id, source_edited, color }) => ({ source, replacement, ...(validColor(color) ? { color } : {}), ...(slot_id ? { slot_id } : {}), ...(source_edited ? { source_edited: true } : {}) })) });

export function buildImagePrompt(product: Product, draft: Draft, lines: TextReplacement[], photo?: AnnotatedPhoto) {
  const applicable = lines.filter(line => !photo || !line.slot_id || photo.regions.some(r => r.slot_id === line.slot_id));
  const instructions = applicable.map((line, i) => {
    const regions = photo?.regions.filter(region => region.slot_id === line.slot_id) || [];
    const geometry = regions.map(region => {
      const [x,y,w,h] = region.bbox;
      return `vùng ${region.id}: bbox pixel [${x}, ${y}, ${w}, ${h}], tứ giác pixel ${JSON.stringify(region.quad)}`;
    }).join('; ');
    return `${i + 1}. Chữ gốc / vị trí: ${JSON.stringify(line.source)}${geometry ? ` (${geometry})` : ''} → ${
      line.replacement.trim() ? `thay bằng chính xác ${JSON.stringify(line.replacement.trim())}` : 'giữ nguyên nội dung gốc tại vị trí này'}${validColor(line.color) ? `; đổi màu toàn bộ chữ tại vị trí này thành ${line.color} (mã HEX sRGB), giữ kiểu chữ, chất liệu và hiệu ứng chiếu sáng` : '; giữ màu chữ gốc'}.`;
  });
  return [
    `Chỉnh sửa ảnh mẫu sản phẩm ${JSON.stringify(product.name)} đính kèm.`,
    'Giữ đúng kiểu dáng, cấu tạo, màu sắc, vật liệu, góc nhìn và bố cục của mẫu. Chỉ thay chữ và màu được chỉ định rõ bên dưới; các màu không được chỉ định phải giữ nguyên. Thay chữ tại từng vị trí được liệt kê, giữ phong cách chữ và tỷ lệ tương ứng. Không đưa chữ hướng dẫn vào hình.',
    `Kích thước: ${draft.dimensions.L * 10} × ${draft.dimensions.H * 10} × ${draft.dimensions.W * 10} mm.`,
    ...(photo ? [`ẢNH THAM CHIẾU: ${photo.width} × ${photo.height} pixel. Gốc tọa độ ở góc trên trái, x tăng sang phải, y tăng xuống dưới. Bbox có thứ tự [x, y, rộng, cao]. Chỉ sửa chữ bên trong tứ giác của vùng tương ứng; không di chuyển vị trí chữ và không in khung/tọa độ lên ảnh.`] : []),
    'NỘI DUNG THAY THẾ THEO TỪNG DÒNG:\n' + instructions.join('\n'),
    'Ô thay thế để trống có nghĩa là GIỮ NGUYÊN. Không lặp lại chữ cũ đã thay; không tự thêm nội dung. Viết đúng chính tả tiếng Việt và dấu. Chữ không nằm trong danh sách phải giữ nguyên.',
    readBackgroundColor(draft.brief?.sign_content) ? `MÀU NỀN: đổi màu nền bề mặt bảng hiệu thành ${readBackgroundColor(draft.brief?.sign_content)} (mã HEX sRGB). Giữ nguyên bối cảnh ngoài bảng, chữ và logo trừ các yêu cầu riêng ở trên, giữ chất liệu và ánh sáng.` : 'MÀU NỀN: giữ nguyên nền của ảnh mẫu.',
    `Vật liệu: ${draft.brief?.materials || product.category}.`,
    `Ghi chú thiết kế: ${draft.brief?.notes || 'Trình bày chuyên nghiệp, rõ nét, nền sạch.'}`,
    'Xuất ảnh phối cảnh màu chất lượng cao, không chèn watermark.',
  ].join('\n\n');
}
