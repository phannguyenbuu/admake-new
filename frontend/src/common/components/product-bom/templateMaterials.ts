import type { Product, Item } from "./types";

export const templateMaterials = (p: Product, items: Item[] = []) => {
  if (typeof p.definition.materials_text === 'string') return p.definition.materials_text;
  const catalog = new Map(items.map(item => [item.code, item.name]));
  return [...new Set(p.definition.lines.flatMap(value => {
    const line = value as { kind?: string; selected?: boolean; code?: string; name?: string };
    if (line.kind !== 'material' || line.selected === false) return [];
    const name = (line.name || catalog.get(line.code || '') || '').trim();
    return name ? [name] : [];
  }))].join(', ');
};
