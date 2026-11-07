import { Button, ColorPicker, message } from 'antd';
import { BufferedTextArea } from './BufferedTextArea';
import { Plus, Trash2 } from 'lucide-react';
import { presetTextLines } from './imageTextPresets';
import { readBackgroundColor, readReplacements, writeReplacements, type TextReplacement } from './imageTextPrompt';
import { useProductTextAnnotations, type ProductTextAnnotations, type PhotoView } from './productTextAnnotations';

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
export function imageTextLines(productId: string, content = '', annotation?: ProductTextAnnotations): TextReplacement[] {
  const stored = readReplacements(content);
  if (annotation) {
    const used = new Set<number>();
    const detected = annotation.slots.map(slot => {
      const matches = (line: TextReplacement, i: number) => !used.has(i) && (line.slot_id === slot.id ||
        !!line.slot_id && !!slot.legacy_slot_ids?.includes(line.slot_id) || normalize(line.source) === normalize(slot.text));
      const changed = stored?.findIndex((line, i) => matches(line, i) && !!line.replacement.trim()) ?? -1;
      const index = changed >= 0 ? changed : stored?.findIndex(matches) ?? -1;
      if (index >= 0) used.add(index);
      const saved = stored?.[index];
      return { source: saved?.source_edited === true ? saved.source : slot.text, replacement: saved?.replacement || '',
        color: saved?.color, slot_id: slot.id, original_source: slot.text, source_edited: saved?.source_edited === true };
    });
    const presets = new Set(presetTextLines(productId));
    const manual = stored?.filter((line, i) => !used.has(i) && !line.slot_id && (line.replacement.trim() || !presets.has(line.source))) || [];
    if (!stored && content.trim()) manual.push({ source: 'Toàn bộ nội dung quảng cáo trên bảng', replacement: content });
    return [...detected, ...manual];
  }
  return stored ?? (content.trim()
    ? [{ source: 'Toàn bộ nội dung quảng cáo trên bảng', replacement: content }]
    : presetTextLines(productId).map(source => ({ source, replacement: '' })));
}

export function TextReplacementFields({ productId, value, onChange, disabled, view, selectedSlot, onSelectSlot }: {
  productId: string; value?: string; onChange: (content: string) => void; disabled?: boolean;
  view?: PhotoView; selectedSlot?: string; onSelectSlot?: (slot: string) => void;
}) {
  const annotation = useProductTextAnnotations(productId);
  const lines = imageTextLines(productId, value, annotation);
  const update = (next: TextReplacement[]) => {
    const serialized = writeReplacements(next, readBackgroundColor(value));
    if (serialized.length > 4000) { message.warning('Nội dung thay thế quá dài. Vui lòng rút gọn để lưu báo giá.'); return false; }
    onChange(serialized);
    return true;
  };
  return <div className="space-y-3" aria-label="Thay nội dung theo từng dòng">
    <div className="text-sm font-semibold text-slate-700">Thay chữ trên mẫu</div>
    <p className="!m-0 text-xs text-slate-500">Điền chữ mới vào đúng dòng. Để trống để giữ nguyên. Có thể chỉnh chữ gốc hoặc thêm dòng cần thay.</p>
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_52px_28px] gap-2 text-xs text-slate-500">
      <span>Chữ gốc / vị trí trong hình</span><span>Thay bằng</span><span>Màu chữ</span><span />
    </div>
    {lines.map((line, index) => {
      const slot = annotation?.slots.find(slot => slot.id === line.slot_id);
      if (view && slot && !slot.regions[view]?.length) return null;
      return <div key={line.slot_id || `manual-${index}`} data-text-slot={line.slot_id}
        className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_52px_28px] gap-2 items-start rounded ${selectedSlot === line.slot_id ? 'ring-2 ring-teal-400' : ''}`}>
      <BufferedTextArea label={`Chữ gốc dòng ${index + 1}`} value={line.source} disabled={disabled} maxLength={350} maxRows={3}
        onFocus={() => line.slot_id && onSelectSlot?.(line.slot_id)}
        onCommit={source => update(lines.map((l, i) => i === index ? { ...l, source, source_edited: true } : l))} />
      <BufferedTextArea label={`Thay thế dòng ${index + 1}: ${line.source}`} placeholder="Giữ nguyên" value={line.replacement}
        disabled={disabled} maxLength={500} maxRows={4}
        onFocus={() => line.slot_id && onSelectSlot?.(line.slot_id)}
        onCommit={replacement => update(lines.map((l, i) => i === index ? { ...l, replacement } : l))} />
      <ColorPicker value={line.color || null} allowClear disabled={disabled} aria-label={`Màu chữ dòng ${index + 1}`}
        onChangeComplete={color => update(lines.map((l, i) => i === index ? { ...l, color: color.cleared ? undefined : color.toHexString() } : l))}
        onClear={() => update(lines.map((l, i) => i === index ? { ...l, color: undefined } : l))} />
      <Button type="text" size="small" disabled={disabled} aria-label={`${line.slot_id ? 'Đặt lại' : 'Bỏ'} dòng ${index + 1}`} icon={<Trash2 size={14} />}
        onClick={() => update(line.slot_id ? lines.map((l,i) => i === index ? { ...l, source: l.original_source || l.source, replacement: '', color: undefined, source_edited: false } : l) : lines.filter((_, i) => i !== index))} />
    </div>})}
    <Button size="small" disabled={disabled || lines.length >= 120} icon={<Plus size={14} />}
      onClick={() => update([...lines, { source: 'Dòng chữ cần thay', replacement: '' }])}>Thêm dòng</Button>
  </div>;
}
