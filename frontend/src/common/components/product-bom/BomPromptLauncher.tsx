import { useEffect, useRef, useState } from "react";
import { Input, Modal } from "antd";
import { ArrowUp, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProductBomQuote } from "./ProductBomQuote";
import axiosClient from "../../services/axiosClient";
import { useApiHost } from "../../common/hooks/useApiHost";
import { ProductComparison } from "./ProductComparison";
import { selectedPhotoViews } from "./selectedPhotoViews";
import type { Product } from './types';

type ReferenceProduct = { id: string; name: string; category: string; image_url: string };

export function BomPromptLauncher() {
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [references, setReferences] = useState<ReferenceProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [productDetails, setProductDetails] = useState<Product[]>([]);
  const [galleryError, setGalleryError] = useState(false);
  const [legacyPhotoViews, setPhotoViews] = useState<Record<string, { before: string; after: string }>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [autoPlay, setAutoPlay] = useState(true);
  const [galleryHovered, setGalleryHovered] = useState(false);
  const [galleryFocused, setGalleryFocused] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const apiHost = useApiHost();
  const photoViews = {...legacyPhotoViews, ...Object.fromEntries(productDetails.flatMap(p => {
    const views = selectedPhotoViews(p, path => `${apiHost.replace(/\/api\/?$/, '')}${path}`);
    return views ? [[p.id, views]] : [];
  }))};
  useEffect(() => {
    const resize = () => {
      const columns = window.innerWidth >= 1280 ? 5 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 2;
      setPageSize(columns * 2); setPage(1);
    };
    resize(); window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const refreshViews = () => fetch("/product-references/thumbnail-views.json", { signal: controller.signal, cache: "no-store" })
      .then(r => r.ok ? r.json() : {}).then(next => setPhotoViews(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)).catch(() => {});
    void refreshViews();
    const viewsTimer = window.setInterval(refreshViews, 30000);
    fetch("/product-references/catalog.json", { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error("gallery");
      return r.json();
    }).then(setReferences).catch(() => { if (!controller.signal.aborted) setGalleryError(true); }).then(async () => {
      try {
        const { data } = await axiosClient.get("/product-bom/products", { signal: controller.signal });
        if (!controller.signal.aborted && data.products?.length) {
          setProductDetails(data.products);
          setReferences(data.products.map((p: ReferenceProduct) => ({ ...p,
            image_url: `${apiHost.replace(/\/api\/?$/, "")}${p.image_url}` })));
          setGalleryError(false);
        }
      } catch { /* Bundled reference photos remain available before the VPS migration. */ }
    });
    return () => { controller.abort(); window.clearInterval(viewsTimer); };
  }, []);
  const start = (productId?: string) => { setSelectedId(productId); setSubmitted(productId ? '' : prompt.trim()); setOpen(true); };
  const visible = references;
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || open || totalPages <= 1) return;
    let lastWheel = 0;
    let lastChange = -Infinity;
    let distance = 0;
    let consumed = false;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      // The comparison slider covers the image. It must still allow wheel paging.
      if (event.target instanceof Element && event.target.closest('input:not([type="range"]), textarea, select, [contenteditable="true"], nav')) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 200) { distance = 0; consumed = false; }
      lastWheel = now;
      if (consumed || now - lastChange < 650) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientHeight : 1);
      if (Math.sign(delta) !== Math.sign(distance)) distance = 0;
      distance += delta;
      if (Math.abs(distance) < 40) return;
      consumed = true;
      lastChange = now;
      const direction = Math.sign(distance);
      setPage(value => Math.max(1, Math.min(totalPages, Math.min(value, totalPages) + direction)));
    };
    gallery.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => gallery.removeEventListener('wheel', onWheel, true);
  }, [open, totalPages]);
  useEffect(() => {
    if (!autoPlay || reducedMotion || open || galleryHovered || galleryFocused || totalPages <= 1) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") setPage(currentPage % totalPages + 1);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [autoPlay, reducedMotion, open, galleryHovered, galleryFocused, currentPage, totalPages]);
  const close = () => {
    if (dirty) Modal.confirm({ title: "Đóng báo giá chưa lưu?", okText: "Đóng", cancelText: "Tiếp tục chỉnh", zIndex: 10300,
      onOk: () => { setOpen(false); setDirty(false); } });
    else setOpen(false);
  };
  return <>
    <div className="flex flex-col items-center h-[calc(100dvh-110px)] min-h-[480px] px-3 md:px-6 pt-4 bg-white">
      <div ref={galleryRef} className="w-full max-w-6xl flex-1 min-h-0 flex flex-col"
        onMouseEnter={() => setGalleryHovered(true)} onMouseLeave={() => setGalleryHovered(false)}
        onFocusCapture={() => setGalleryFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setGalleryFocused(false); }}>
        <div className="flex justify-center items-center mb-4 overflow-x-auto">
          <h1 className="text-sm font-normal text-center text-slate-700 m-0 whitespace-nowrap shrink-0">Chọn mẫu sản phẩm để tiếp tục hoặc nhập prompt để tìm tự động mẫu ...</h1>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${currentPage}-${pageSize}`} initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.12 }}
            className="grid h-full grid-rows-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {pageProducts.map(p => <div key={p.id}
              className="group min-h-0 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-teal-500 transition-all">
              {photoViews[p.id] ? <ProductComparison id={p.id} name={p.name} original={photoViews[p.id].before} views={photoViews[p.id]} onSelect={() => start(p.id)} />
                : <button type="button" aria-label={`Chọn ảnh ${p.name}`} onClick={() => start(p.id)} className="flex-1 min-h-0 bg-slate-50 border-0 cursor-pointer" />}
              <button type="button" onClick={() => start(p.id)} aria-label={`Chọn mẫu ${p.name}`} className="text-left cursor-pointer bg-transparent border-0 p-0 shrink-0">
                <div className="px-3 py-2 text-xs md:text-sm text-slate-700 font-medium leading-snug line-clamp-2">{p.name}</div>
              </button>
            </div>)}
          </motion.div>
          </AnimatePresence>
          {galleryError && <div className="py-8 text-center text-sm text-slate-400">Không tải được ảnh sản phẩm.</div>}
          {!galleryError && !!references.length && !visible.length && <div className="py-8 text-center text-sm text-slate-400">Không có sản phẩm phù hợp.</div>}
        </div>
        {totalPages > 1 && <nav aria-label="Phân trang mẫu sản phẩm" className="flex flex-wrap items-center justify-center gap-1 py-3 shrink-0 max-h-28 overflow-y-auto">
          {!reducedMotion && <button type="button" onClick={() => setAutoPlay(value => !value)}
            aria-label={autoPlay ? "Tạm dừng tự động chuyển trang" : "Bật tự động chuyển trang"}
            title={autoPlay ? "Tạm dừng tự động chuyển trang" : "Bật tự động chuyển trang"}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:text-teal-700 cursor-pointer">
            {autoPlay ? <Pause size={14} /> : <Play size={14} />}
          </button>}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => <button
            key={pageNumber} type="button" onClick={() => setPage(pageNumber)}
            aria-label={`Trang ${pageNumber}`} aria-current={pageNumber === currentPage ? "page" : undefined}
            className={`min-w-8 h-8 px-2 rounded-md border text-sm cursor-pointer transition-colors ${pageNumber === currentPage
              ? "border-teal-600 bg-teal-50 text-teal-700 font-semibold"
              : "border-slate-200 bg-white text-slate-600 hover:border-teal-500 hover:text-teal-700"}`}
          >{pageNumber}</button>)}
        </nav>}
      </div>
      <div className="w-full max-w-2xl shrink-0 pt-4 pb-4 md:pb-5 bg-white">
        <div className="flex flex-wrap gap-2 mb-3" aria-label="Yêu cầu báo giá mẫu">
          {["Bảng alu chữ mica 4000 × 1200 mm cho tiệm vàng", "Hộp đèn mica 600 × 800 mm, 2 mặt", "Bảng hiệu alu 4x1m2, chữ nổi có đèn"].map(example =>
            <button key={example} type="button" onClick={() => setPrompt(example)}
              className="text-left rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-teal-400 hover:text-teal-700 cursor-pointer">{example}</button>)}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_4px_28px_-12px_rgba(15,23,42,0.18)] p-4 focus-within:border-slate-400 transition-colors">
          <Input.TextArea aria-label="Yêu cầu báo giá" value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Mô tả bảng hiệu, vật liệu và kích thước (mm). Ví dụ: bảng alu chữ mica 4000 × 1200 mm…" autoSize={{ minRows: 2, maxRows: 6 }}
            variant="borderless" className="!p-0 !text-base !resize-none"
            onPressEnter={e => { if (!e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); start(); } }} />
          <div className="flex items-center justify-end mt-4">
            <button type="button" aria-label="Bắt đầu báo giá" onClick={() => start()} className="w-9 h-9 rounded-full bg-slate-900 hover:bg-teal-700 text-white flex items-center justify-center cursor-pointer border-0 transition-colors"><ArrowUp size={19} /></button>
          </div>
        </div>
      </div>
    </div>
    <Modal open={open} onCancel={close} footer={null} title={null} width="min(1180px, 96vw)" centered
      destroyOnClose styles={{ body: { height: "82dvh", overflow: "hidden", paddingTop: 0, background: "#fff", isolation: "isolate" } }}>
      {open && <ProductBomQuote initialPrompt={submitted} initialProductId={selectedId}
        initialProduct={productDetails.find(p => p.id === selectedId)} onDirtyChange={setDirty} />}
    </Modal>
  </>;
}
