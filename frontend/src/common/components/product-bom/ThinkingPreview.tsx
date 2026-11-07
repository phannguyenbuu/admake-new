import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Product } from "./types";

export function ThinkingPreview({ products, imageUrl }: { products: Product[]; imageUrl: (product: Product) => string }) {
  const [index, setIndex] = useState(0);
  const [localPhotos, setLocalPhotos] = useState<{ id: string; src: string }[]>([]);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (products.length) return;
    const controller = new AbortController();
    fetch("/product-references/catalog.json", { signal: controller.signal })
      .then(response => response.ok ? response.json() : [])
      .then((rows: Product[]) => setLocalPhotos(rows.slice(0, 6).map(row => ({ id: row.id, src: row.image_url }))))
      .catch(() => {});
    return () => controller.abort();
  }, [products.length]);
  const candidates = products.length ? products.slice(0, 6).map(product => ({ id: product.id, src: imageUrl(product) })) : localPhotos;
  useEffect(() => {
    if (reducedMotion || candidates.length < 2) return;
    const timer = window.setInterval(() => setIndex(value => (value + 1) % candidates.length), 1800);
    return () => window.clearInterval(timer);
  }, [candidates.length, reducedMotion]);
  const candidate = candidates[index % Math.max(1, candidates.length)];
  return <section aria-busy="true" aria-label="Đang tìm mẫu phù hợp" className="mb-5 rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/60 p-5 text-center">
    <div className="relative mx-auto w-72 h-72 max-w-full">
      <div className="absolute inset-9 rounded-full border border-dashed border-teal-200" />
      <motion.div className="absolute inset-0" animate={{ rotate: reducedMotion ? 0 : 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => {
          const item = candidates[i % Math.max(1, candidates.length)];
          const angle = i * Math.PI / 3 - Math.PI / 2;
          return <div key={i} className="absolute w-14 h-14" style={{ left: `calc(50% + ${104 * Math.cos(angle)}px - 28px)`, top: `calc(50% + ${104 * Math.sin(angle)}px - 28px)` }}>
            <motion.div className="w-full h-full rounded-xl border border-white bg-white shadow-md overflow-hidden p-1" animate={{ rotate: reducedMotion ? 0 : -360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
              {item ? <img src={item.src} alt="" decoding="async" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-lg bg-teal-50 motion-safe:animate-pulse" />}
            </motion.div>
          </div>;
        })}
      </motion.div>
      <div className="absolute inset-20 flex flex-col items-center justify-center rounded-full bg-white/90 shadow-[0_0_35px_rgba(20,184,166,0.08)] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={candidate?.id || 'loading'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.4 }} className="w-20 h-16">
            {candidate && <img src={candidate.src} alt="" className="w-full h-full object-contain" />}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-center gap-1.5 mt-2" aria-hidden="true">
          {[0, 1, 2].map(dot => <motion.span key={dot} className="w-2 h-2 bg-teal-500 rounded-full" animate={reducedMotion ? {} : { y: [0, -5, 0], opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.1, delay: dot * 0.18, repeat: Infinity, ease: "easeInOut" }} />)}
        </div>
      </div>
    </div>
    <div role="status" className="text-sm font-medium text-teal-700">Đang tìm mẫu phù hợp với yêu cầu của bạn…</div>
    <p className="text-xs text-slate-400 mt-2 mb-0">Đang đối chiếu mẫu và vật liệu trong thư viện</p>
  </section>;
}
