import { useEffect, useState } from 'react';

export type PhotoView = 'before' | 'after';
export type TextRegion = {
  id: string; slot_id: string; text: string; ocr_text: string; confidence: number | null;
  bbox: [number, number, number, number]; quad: [number, number][];
  normalized_bbox: [number, number, number, number]; normalized_quad: [number, number][];
  review: 'automatic' | 'pending' | 'verified' | 'image_reviewed';
};
export type AnnotatedPhoto = { image: string; sha256: string; width: number; height: number;
  coordinate_system: string; status: string; regions: TextRegion[] };
export type ProductTextAnnotations = { name: string; views: Record<PhotoView, AnnotatedPhoto>;
  slots: { id: string; text: string; regions: Partial<Record<PhotoView, string[]>>; legacy_slot_ids?: string[] }[] };
type Manifest = { schema_version: number; products: Record<string, ProductTextAnnotations> };
let request: Promise<Manifest> | undefined;
function loadAnnotations() {
  return request ??= fetch('/product-references/text-annotations.json', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('annotations');
    return response.json();
  }).catch(error => { request = undefined; throw error; });
}
export function useProductTextAnnotations(productId: string) {
  const [value, setValue] = useState<{ id: string; data: ProductTextAnnotations }>();
  useEffect(() => {
    let active = true;
    void loadAnnotations().then(manifest => {
      const data = manifest.products[productId];
      if (active && data) setValue({ id: productId, data });
    }).catch(() => {});
    return () => { active = false; };
  }, [productId]);
  return value?.id === productId ? value.data : undefined;
}
