import type { ReactNode } from 'react';
import { ProductComparison } from "./ProductComparison";
import type { Product } from "./types";

export function ProductSuggestions({ products, selectedId, views, imageUrl, onSelect, preview, footer }: {
  preview?: ReactNode; footer?: ReactNode;
  products: Product[]; selectedId: string; views: Record<string, { before: string; after: string }>;
  imageUrl: (product: Product) => string; onSelect: (product: Product) => void;
}) {
  const selected = products.find(p => p.id === selectedId) || products[0];
  if (!selected) return null;
  return <section className="w-full md:w-72 shrink-0" aria-label="Mẫu sản phẩm gần giống nhất">
    {preview || <div className="h-64 flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <ProductComparison key={selected.id} initialPosition={100} id={selected.id} name={selected.name} original={imageUrl(selected)} views={views[selected.id]} />
    </div>}
    <p className="text-sm font-medium text-slate-700 mt-3 mb-2">{selected.name}</p>
    <nav aria-label="Chọn mẫu gợi ý" className="flex flex-wrap justify-center gap-2">
      {products.map((p, index) => <button key={p.id} type="button" onClick={() => onSelect(p)}
        aria-label={`Mẫu ${index + 1}: ${p.name}`} aria-current={p.id === selected.id ? "page" : undefined}
        className={`h-8 min-w-8 px-2 rounded-md border cursor-pointer text-sm transition-colors ${p.id === selected.id
          ? "border-teal-600 text-teal-700 bg-teal-50 font-semibold" : "border-slate-200 bg-white text-slate-600 hover:border-teal-500"}`}>
        {index + 1}
      </button>)}
    </nav>
    {footer}
  </section>;
}
