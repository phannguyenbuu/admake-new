import { describe, expect, it } from 'vitest';
import { templateMaterials } from './templateMaterials';
import type { Product } from './types';

const product = (text?: string) => ({ definition: { materials_text: text, lines: [
  { kind: 'material', name: 'Đế gỗ theo mẫu', selected: true },
  { kind: 'material', code: 'MICA', selected: true },
  { kind: 'labor', name: 'Thi công' }
] } } as Product);
describe('templateMaterials', () => {
  it('uses saved library text verbatim instead of old BOM names', () => {
    expect(templateMaterials(product('Đế gỗ MDF sơn màu\nChỉ viền vàng'))).toBe('Đế gỗ MDF sơn màu\nChỉ viền vàng');
  });
  it('preserves an intentionally empty saved value', () => {
    expect(templateMaterials(product(''))).toBe('');
  });
  it('falls back to selected BOM materials for legacy products', () => {
    expect(templateMaterials(product(), [{code:'MICA',name:'Mica màu 3mm'}] as any)).toBe('Đế gỗ theo mẫu, Mica màu 3mm');
  });
});
