import { CustomerQuotePages } from "./CustomerQuotePages";
import { CompanyBrand, CompanyDetails } from "./CompanyDetails";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, ConfigProvider, Empty, Input, InputNumber, Modal, Select, Spin, Steps, Tooltip, message } from "antd";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import type { TwoPagePdfData } from "../ai-pricing/studio/overlayTypes";
import { PdfExportPopover, type PdfExportOptions } from "./PdfExportPopover";
import axiosClient from "../../services/axiosClient";
import { useApiHost } from "../../common/hooks/useApiHost";
import { BomTable } from "./BomTable";
import { MaterialPicker } from "./MaterialPicker";
import { parsePromptDimensions } from "./dimensions";
import { ProductSuggestions } from "./ProductSuggestions";

import { ThinkingPreview } from "./ThinkingPreview";
import type { Draft, Extra, Item, Override, Product, Quote, Result, Row } from "./types";
import { RegenerateProductImage, renderSignature } from "./RegenerateProductImage";
import { MoneyInput } from "./MoneyInput";
import { costInputValue, costInputPatch } from "./costInputs";
import { kindLabels, money } from "./types";
import { presetTextLines } from './imageTextPresets';
import { writeReplacements } from './imageTextPrompt';

import { selectedPhotoViews } from "./selectedPhotoViews";
import { templateMaterials } from "./templateMaterials";

const API = "/product-bom";
type Classification = { ten_loai_bang_hieu: string; mo_ta_loai: string; mau_admake_tuong_ung: string;
  candidate_ids?: string[]; product_id: string | null; vat_lieu_chu_dao: { code: string; ten: string }[] };
const lengthScale = (unit?: string) => unit === "m" ? 1000 : unit === "cm" ? 10 : 1;
const steps = ["Kích thước", "Vật tư", "Báo giá"];
const visibleStep = (stage: number) => stage >= 3 ? 2 : stage >= 1 ? 1 : 0;
const stepStage = [0, 1, 3];
const normalizeStage = (stage: number) => stage === 2 ? 1 : Math.min(stage, 3);
const errorText = (error: any) => error.response?.data?.error || error.response?.data?.description || error.message || "Không thực hiện được";
const fromQuote = (q: Quote): Draft => ({ product_id: q.payload.product.id, dimensions: q.payload.dimensions,
  brief: q.payload.brief, parameters: q.payload.parameters, overrides: q.payload.overrides, extras: q.payload.extras, markup: q.payload.markup, vat: q.payload.vat });
const initialDraft = (p: Product, items: Item[] = []): Draft => ({ product_id: p.id, dimensions: { ...p.definition.defaults },
  brief: { request_text: '', sign_content: writeReplacements(presetTextLines(p.id).map(source => ({ source, replacement: '' }))),
    notes: '', sign_type: p.category, materials: templateMaterials(p, items), company_name: 'Admake', company_logo_url: '/logo.jpg' },
  parameters: Object.fromEntries(p.definition.parameters.map(x => [x.key, x.default])), overrides: {}, extras: [], markup: 30, vat: 0 });

export function ProductBomQuote({ initialPrompt = "", initialProductId, initialProduct, onDirtyChange }: { initialPrompt?: string; initialProductId?: string; initialProduct?: Product; onDirtyChange?: (dirty: boolean) => void } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!initialProduct);
  const [classification, setClassification] = useState<Classification>();
  const [classificationError, setClassificationError] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [legacyPhotoViews, setPhotoViews] = useState<Record<string, { before: string; after: string }>>({});
  const selectedProduct = useRef(false);
  const materialsEdited = useRef(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [draft, setDraft] = useState<Draft | undefined>(() => initialProduct ? initialDraft(initialProduct) : undefined);
  const [quote, setQuote] = useState<Quote>();
  const [result, setResult] = useState<Result>();
  const [view, setView] = useState(0);
  const [invalidFrom, setInvalidFrom] = useState(initialProduct ? 0 : 4);
  const [dirty, setDirty] = useState(!!initialProduct);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [busy, setBusy] = useState(false);
  const [companyUploading, setCompanyUploading] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);
  const [picker, setPicker] = useState(false);

  const sizeTier = draft ? (draft.dimensions.L < 200 ? 'nhỏ' : draft.dimensions.L < 500 ? 'trung bình' : 'lớn') : undefined;
  const apiHost = useApiHost();
  const imageUrl = (path: string) => path ? `${apiHost.replace(/\/api\/?$/, "")}${path}` : "";
  const photoViews = {...legacyPhotoViews, ...Object.fromEntries(products.flatMap(p => {
    const views = selectedPhotoViews(p, imageUrl);
    return views ? [[p.id, views]] : [];
  }))};
  const productImage = (p: Product) => photoViews[p.id]?.before || imageUrl(p.image_url);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/product-references/photo-views.json", { signal: controller.signal })
      .then(r => r.ok ? r.json() : {}).then(setPhotoViews).catch(() => {});
    return () => controller.abort();
  }, []);
  // Advertising text does not change BOM quantities/prices. Do not send another
  // pricing request (or rasterize PDF previews) for every text edit.
  const pricingSignature = useMemo(() => JSON.stringify(draft && { ...draft, brief: undefined }), [draft]);
  const initialized = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pageOneRef = useRef<HTMLElement>(null);
  const pageTwoRef = useRef<HTMLElement>(null);
  // Each step starts at the top; otherwise the image panel stays scrolled out of view.
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [view]);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  const load = async () => {
    setLoading(!initialProduct); setLoadError("");
    setClassifying(!initialProductId && !!initialPrompt.trim());
    // Start analysis alongside the data requests, without blocking the product UI.
    const analysis = !initialProductId && initialPrompt.trim()
      ? axiosClient.post<Classification>(`${API}/classify`, { text: initialPrompt, mode: "fast" }, { timeout: 70000 })
          .then(response => ({ data: response.data, failed: false }))
          .catch(() => ({ data: undefined, failed: true }))
      : undefined;
    try {
      const [p, i] = await Promise.all([axiosClient.get(`${API}/products`), axiosClient.get(`${API}/catalog`)]);
      setProducts(p.data.products); setItems(i.data);
      if (initialProduct && !materialsEdited.current) {
        const selected = (p.data.products as Product[]).find(p => p.id === initialProduct.id) || initialProduct;
        setProduct(selected);
        setDraft(previous => previous?.product_id === initialProduct.id && previous.brief
          ? { ...previous, brief: { ...previous.brief, materials: templateMaterials(selected, i.data) } } : previous);
      }
      setLoading(false);
      if (initialProductId && !initialProduct) {
        const selected = (p.data.products as Product[]).find(product => product.id === initialProductId);
        if (selected) selectProduct(selected, undefined, i.data);
      }
      if (analysis) {
        const { data } = await analysis;
        const available = p.data.products as Product[];
        const fallbackProduct = [...available].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0];
        if (data) {
          setClassification(data); setClassificationError("");
          if (!initialProductId && !selectedProduct.current) {
            const matched = available.find(product => product.id === data.product_id) || fallbackProduct;
            if (matched) selectProduct(matched, data, i.data);
          }
        } else if (!initialProductId && !selectedProduct.current && fallbackProduct) {
          selectProduct(fallbackProduct, undefined, i.data);
          setClassificationError("");
        }
      }
    } catch (e) { setLoadError(errorText(e)); }
    finally { setLoading(false); setClassifying(false); }
  };
  // Refresh saved library text when returning from the management page, while
  // preserving material text the user has already edited in this quotation.
  useEffect(() => {
    const refresh = async () => {
      try {
        const { data } = await axiosClient.get(`${API}/products`);
        const updated = (data.products as Product[]).find(item => item.id === product?.id);
        setProducts(data.products);
        if (!updated || updated.version === product?.version) return;
        setProduct(updated);
        if (!materialsEdited.current) setDraft(previous => previous?.brief && previous.product_id === updated.id
          ? { ...previous, brief: { ...previous.brief, materials: templateMaterials(updated, items) } } : previous);
      } catch { /* Keep the current draft available if the refresh fails. */ }
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [product?.id, product?.version, items]);
  useEffect(() => { if (!initialized.current) { initialized.current = true; void load(); } }, []);
  useEffect(() => {
    if (!draft) return;
    if (quote && !dirty) { setResult(quote.payload.result); setPreviewing(false); return; }
    const controller = new AbortController();
    setPreviewing(true); setPreviewError("");
    const timer = window.setTimeout(() => {
      axiosClient.post(`${API}/preview`, draft, { signal: controller.signal }).then(r => {
        if (!controller.signal.aborted) setResult(r.data);
      }).catch(e => { if (!controller.signal.aborted) setPreviewError(errorText(e)); })
        .finally(() => { if (!controller.signal.aborted) setPreviewing(false); });
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [pricingSignature, dirty, quote?.id]);

  const edit = (patch: Partial<Draft>, reset: number) => {
    setDraft(prev => prev && ({ ...prev, ...patch })); setDirty(true);
    setInvalidFrom(prev => Math.min(prev, reset)); setView(prev => Math.min(prev, reset));
  };
  const selectProduct = (p: Product, analysis = classification, catalog = items) => {
    selectedProduct.current = true;
    const next = initialDraft(p, catalog);
    next.brief = { ...next.brief!, request_text: initialPrompt, notes: "",
      sign_type: analysis?.ten_loai_bang_hieu || p.category,
      materials: typeof p.definition.materials_text !== 'string' && analysis?.product_id === p.id ? analysis.vat_lieu_chu_dao.map(m => m.ten).join(", ") || next.brief!.materials : next.brief!.materials };
    const values = initialProductId ? undefined : parsePromptDimensions(initialPrompt);
    if (values) {
      next.dimensions.L = values[0]; next.dimensions.H = values[1];
      if (values.length === 3) { next.dimensions.W = values[1]; next.dimensions.H = values[2]; }
    }
    if (draft?.brief) next.brief = { ...draft.brief, sign_type: next.brief.sign_type, materials: next.brief.materials, sign_content: next.brief.sign_content, generated_image_url: undefined, render_signature: undefined };
    materialsEdited.current = false;
    setProduct(p); setDraft(next); setQuote(undefined); setResult(undefined);
    setView(0); setInvalidFrom(0); setDirty(true); setPreviewError("");
  };
  const save = async (): Promise<Quote> => {
    if (!draft) throw new Error("Chưa chọn sản phẩm");
    const response = quote
      ? await axiosClient.put<Quote>(`${API}/quotes/${quote.id}`, { ...draft, version: quote.version })
      : await axiosClient.post<Quote>(`${API}/quotes`, draft);
    const q = response.data;
    setQuote(q); setProduct(q.payload.product); setResult(q.payload.result); setDraft(fromQuote(q));
    setDirty(false); setInvalidFrom(4);
    return q;
  };
  const advancing = useRef(false);
  const confirm = async () => {
    if (!draft || !result || busy || companyUploading || imageGenerating || advancing.current) return;
    advancing.current = true;
    setBusy(true);
    try {
      let q = dirty || !quote ? await save() : quote;
      if (q.stage <= view) {
        if (q.stage < view) { setView(q.stage); throw new Error(`Cần kiểm tra lại ${steps[visibleStep(q.stage)].toLowerCase()}`); }
        q = (await axiosClient.post<Quote>(`${API}/quotes/${q.id}/confirm`, { version: q.version, step: q.stage })).data;
        setQuote(q);
      }
      // Preserve server confirmation records while removing the intermediate screen.
      if (view === 1 && q.stage === 2) {
        q = (await axiosClient.post<Quote>(`${API}/quotes/${q.id}/confirm`, { version: q.version, step: 2 })).data;
        setQuote(q);
      }
      setView(view === 0 ? 1 : view === 1 ? normalizeStage(q.stage) : 3);
      if (view === 3 && q.stage === 4) await downloadPdf(q);
    } catch (e) { message.error(errorText(e)); }
    finally { advancing.current = false; setBusy(false); }
  };
  const changeRow = (row: Row, patch: Override) => {
    if (!draft) return;
    if (row.formula) edit({ overrides: { ...draft.overrides, [row.id]: { ...draft.overrides[row.id], ...patch } } }, 1);
    else edit({ extras: draft.extras.map(r => r.id === row.id ? { ...r, ...patch } : r) }, 1);
  };
  type PdfSource = Pick<Quote["payload"], "product" | "dimensions" | "brief" | "markup" | "vat" | "result">;
  const pdfData = async (q: PdfSource): Promise<TwoPagePdfData> => {
    const response = await fetch(q.brief?.generated_image_url || productImage(q.product));
    if (!response.ok) throw new Error("Không tải được ảnh màu để xuất PDF");
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error("Ảnh màu không hợp lệ");
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
    });
    if (!pageOneRef.current || !pageTwoRef.current) throw new Error("Mở tab Báo giá để xuất PDF");
    return { bomPages: [pageOneRef.current, pageTwoRef.current], renderImageUrl: image, logo: null, textItems: [], model3DName: q.product.name,
      dimensions: { width: q.dimensions.L / 100, height: q.dimensions.H / 100, depth: q.dimensions.W / 100 },
      profitMargin: q.markup, bomQuote: { result: q.result, vat: q.vat } };
  };
  const downloadPdf = async (savedQuote?: Quote, options?: PdfExportOptions) => {
    const targetQuote = savedQuote || quote;
    if (!targetQuote || (!savedQuote && dirty) || exporting) return;
    const q = targetQuote.payload;
    if (q.brief?.generated_image_url && q.brief.render_signature !== renderSignature(q.product, fromQuote(targetQuote))) {
      message.warning("Thông tin đã thay đổi. Tạo hình lại ở bước Vật tư trước khi tải PDF."); return;
    }
    setExporting(true);
    try {
      const { exportTwoPageStudioPdf } = await import("../ai-pricing/studio/exportTwoPagePdf");
      await exportTwoPageStudioPdf({ ...(await pdfData(q)), orientation: options?.orientation }, { pages: options?.pages });
    } catch (error) { message.error(errorText(error)); }
    finally { setExporting(false); }
  };
  const exportPrint = async (options?: PdfExportOptions) => {
    if (!draft || !result || busy || companyUploading || exporting || imageGenerating || previewing) return;
    setBusy(true);
    try {
      const current = dirty || !quote || quote.stage < 4 ? await save() : quote;
      await downloadPdf(current, options);
    } catch (error) { message.error(errorText(error)); }
    finally { setBusy(false); }
  };
  const normalize = (s: string) => s.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const keywords = normalize(initialPrompt).split(/[^a-z0-9]+/).filter(w => w.length > 1);
  const score = (p: Product) => keywords.reduce((n, w) => n + (normalize(p.name).includes(w) ? 1 : 0), 0);
  const filtered = products.filter(p => (category === "all" || p.category === category) && normalize(`${p.name} ${p.category}`).includes(normalize(search)))
    .sort((a, b) => score(b) - score(a));
  const candidateIds = classification?.candidate_ids || [];
  const suggested = [...products].sort((a, b) => {
    const ai = candidateIds.indexOf(a.id), bi = candidateIds.indexOf(b.id);
    if (ai >= 0 || bi >= 0) return (ai >= 0 ? ai : 999) - (bi >= 0 ? bi : 999);
    return score(b) - score(a) || a.id.localeCompare(b.id);
  }).slice(0, 5);
  const suggestions = product && !suggested.some(p => p.id === product.id)
    ? [product, ...suggested].slice(0, 5) : suggested;
  const maxStep = Math.min(quote?.stage ?? 0, invalidFrom, 3);
  const imageEditor = product && draft ? <RegenerateProductImage key={product.id} compact product={product} draft={draft} sourceImage={productImage(product)} onGenerating={setImageGenerating}
          onPatch={patch => {
            setDraft(previous => previous && ({ ...previous, brief: { request_text: initialPrompt, sign_content: '', notes: '', sign_type: product.category, materials: '', ...previous.brief, ...patch } }));
            setDirty(true);
          }} /> : null;
  const unpricedRows = result?.rows.filter(row => row.selected && row.quantity > 0 && row.unit_price === 0) ?? [];
  const finalized = quote?.stage === 4 && !dirty;
  if (loading) return !initialProductId && initialPrompt.trim() ? <ThinkingPreview products={products} imageUrl={productImage} /> : <div className="p-12 text-center"><Spin /></div>;
  if (loadError) return <Alert type="error" message={loadError} action={<Button onClick={load}>Thử lại</Button>} />;
  return <ConfigProvider theme={{ token: { colorPrimary: "#00B4B6", colorInfo: "#00B4B6" } }}><div ref={rootRef} className="w-full h-full min-h-0 flex flex-col bg-white text-slate-800">
    {!!initialPrompt.trim() && <div className="mb-4 space-y-2">
      {classificationError && <Alert type="warning" message={classificationError} action={<Button onClick={load}>Thử lại</Button>} />}
    </div>}
    <div className="shrink-0 z-20 border-b border-slate-100 bg-white px-4 md:px-5 py-4">
    {product && draft && <>
      <Steps size="small" current={finalized ? 3 : visibleStep(view)} items={steps.map((title, i) => ({ title, disabled: stepStage[i] > maxStep || imageGenerating }))} onChange={i => { if (!busy && !imageGenerating) setView(stepStage[i]); }} />

    </>}
    </div>
    <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-5 py-5">
    {!product || !draft ? <>
      {initialPrompt.trim() ? classifying ? <ThinkingPreview products={filtered} imageUrl={productImage} /> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
        <div className="text-sm text-slate-600">{classifying ? "Đang tìm mẫu phù hợp với yêu cầu…" : "Chưa xác định được mẫu phù hợp. Chọn một mẫu hoặc chỉnh lại yêu cầu để thử lại."}</div>
        {!classifying && <Select showSearch optionFilterProp="label" className="w-full" placeholder="Tìm và chọn một mẫu sản phẩm"
          options={products.map(p => ({ value: p.id, label: p.name }))}
          onChange={id => { const selected = products.find(p => p.id === id); if (selected) selectProduct(selected); }} />}
      </div> : <>      <div className="flex gap-2 mb-4"><Input.Search placeholder="Tìm sản phẩm" value={search} onChange={e => setSearch(e.target.value)} allowClear /><Select className="min-w-44" value={category} onChange={setCategory} options={[{ value: "all", label: "Tất cả" }, ...Array.from(new Set(products.map(p => p.category))).map(c => ({ value: c, label: c }))]} /></div>
      {!filtered.length ? <Empty description="Chưa có sản phẩm" /> : <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">{filtered.map(p => <button key={p.id} type="button" onClick={() => selectProduct(p)} className="text-left border border-slate-200 rounded-xl overflow-hidden hover:border-teal-500 cursor-pointer bg-white"><img loading="lazy" src={productImage(p)} alt={p.name} className="w-full h-36 object-contain bg-slate-50" /><div className="p-3 text-sm font-medium">{p.name}<div className="text-xs text-slate-400 mt-1">{p.is_published ? p.category : "Chờ duyệt công thức"}</div></div></button>)}</div>}
</>}
    </> : <>
      <div className={busy ? "pointer-events-none opacity-70" : ""}>
        {view === 0 && <div className="flex flex-col md:flex-row gap-5"><div className="w-full md:w-72 shrink-0"><ProductSuggestions products={suggestions} selectedId={product.id} views={photoViews}
        imageUrl={p => imageUrl(p.image_url)} onSelect={p => {
          if (p.id === product.id) return;
          const change = () => selectProduct(p);
          if (quote) Modal.confirm({ title: "Đổi mẫu và tạo báo giá mới?", content: "Nội dung bảng quảng cáo được giữ lại. Vật tư và công thức sẽ được tính theo mẫu mới.", onOk: change });
          else change();
        }} preview={draft.brief?.generated_image_url ? imageEditor : undefined} footer={!draft.brief?.generated_image_url ? imageEditor : undefined} /></div><div className="flex-1 min-w-0 flex flex-col pb-4"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{([['L', 'Ngang (mm)'], ['H', 'Cao (mm)'], ['W', 'Rộng / sâu (mm)'], ['count', 'Số sản phẩm']] as const).map(([key, label]) => <label key={key} className="!flex !flex-col !items-stretch min-w-0 text-xs text-slate-500 whitespace-nowrap" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}><span className="flex items-center gap-2">{label}{key === 'L' && <span role="status" className="text-red-600 font-semibold">Bảng {sizeTier}</span>}</span><InputNumber className="!w-full mt-1" style={key === 'L' || key === 'H' ? { borderColor: '#ef4444', background: '#fff1f2', color: '#b91c1c' } : undefined} aria-label={label} min={key === 'count' ? 1 : (product.definition.constraints?.dimensions[key]?.min ?? .001) * 10} max={key === 'count' ? 100000 : undefined} precision={key === 'count' ? 0 : 2} value={key === 'count' ? draft.dimensions[key] : draft.dimensions[key] * 10} onChange={v => edit({ dimensions: { ...draft.dimensions, [key]: key === 'count' ? v ?? 0 : (v ?? 0) / 10 } }, 0)} />{key !== 'count' && product.definition.constraints && <span className="mt-1 text-[10px] text-slate-400">Tối thiểu {product.definition.constraints.dimensions[key].min * 10} mm</span>}</label>)}<label className="!flex !flex-col !items-stretch min-w-0 text-xs text-slate-500 whitespace-nowrap" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>Số mặt<Select className="w-full mt-1" value={draft.dimensions.F} options={[{ value: 1, label: "1 mặt" }, { value: 2, label: "2 mặt" }]} onChange={v => edit({ dimensions: { ...draft.dimensions, F: v } }, 0)} /></label>
          {!!product.definition.parameters.length && <>{product.definition.parameters.filter(p => !["trips", "labor_days"].includes(p.key)).map(p => <label key={p.key} className="!flex !flex-col !items-stretch min-w-0 text-xs text-slate-500 whitespace-nowrap" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>{p.label}{p.unit && ` (${["m", "cm", "mm"].includes(p.unit) ? "mm" : p.unit})`}<InputNumber className="!w-full mt-1" aria-label={p.label} min={(p.min ?? 0) * lengthScale(p.unit)} max={(p.max ?? 1e8) * lengthScale(p.unit)} value={(draft.parameters[p.key] ?? p.default) * lengthScale(p.unit)} onChange={v => edit({ parameters: { ...draft.parameters, [p.key]: (v ?? 0) / lengthScale(p.unit) } }, 0)} /></label>)}</>}
          <>
            {(['labor', 'transport'] as const).map(kind => <label key={kind} className="!flex !flex-col !items-stretch min-w-0 text-xs text-slate-500 whitespace-nowrap" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              {kind === 'labor' ? <Tooltip title={draft.extras.some(row => row.id === 'quote-labor-total') ? 'Chi phí nhân công nhập tay cho toàn bộ đơn hàng.' : 'Tổng khối lượng × đơn giá của các dòng Nhân công đang chọn trong tab Vật tư. Nhập số mới để thay tổng tự tính.'}><span tabIndex={0} className="w-fit cursor-help underline decoration-dotted">Nhân công (VND)</span></Tooltip> : 'Vận chuyển (VND)'}
              <MoneyInput label={kind === 'labor' ? 'Nhân công (VND)' : 'Vận chuyển (VND)'}
                value={costInputValue(draft, result, kind)} onChange={value => edit(costInputPatch(draft, product, kind, value), 0)} />
            </label>)}
          </></div>
          <p className="text-xs text-slate-400 mt-2 mb-0 whitespace-nowrap">Chi phí cho toàn bộ đơn hàng (VND)</p>
          <div className="mt-5 flex flex-1 min-h-28">          {([['materials', 'Vật liệu mong muốn']] as const).map(([key, label]) =>
            <label key={key} className="!flex !flex-col !items-stretch flex-1 min-w-0 text-sm !font-normal text-slate-600" style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              {label}<Input.TextArea className="!mt-2 !flex-1 !min-h-24 !font-normal !resize-none" style={{ fontWeight: 400 }} aria-label={label} value={draft.brief?.[key] || ''} maxLength={4000}
                onChange={e => { materialsEdited.current = true; edit({ brief: { request_text: initialPrompt, sign_content: '', notes: '', sign_type: product.category, ...draft.brief, materials: e.target.value } }, 0); }} />
            </label>)}
</div>
        </div></div>}
        {view > 0 && result && <div className={view === 3 ? "grid grid-cols-1 md:grid-cols-3 gap-5 items-start" : "grid grid-cols-1 md:grid-cols-3 gap-5 items-start min-h-[calc(82dvh-12rem)]"}>
          {view === 3 && <section className="min-w-0 md:col-span-1 md:sticky md:top-0 bg-white" aria-label="Trang 1 · Hình sản phẩm">
            <h3 className="m-0 mb-3 text-base font-semibold text-slate-700">Trang 1</h3>
            <div className="mb-4"><CompanyBrand brief={draft.brief} /></div>
            <div className="rounded-xl bg-slate-100 p-4">
          {view === 3 && <div className="grid grid-cols-2 gap-3 mb-4"><label className="!flex !flex-col !items-stretch min-w-0 gap-1 text-xs text-slate-500">Cộng trên giá vốn (%)<InputNumber aria-label="Cộng trên giá vốn" className="!w-full" min={0} max={1000} value={draft.markup} onChange={v => edit({ markup: v ?? 0 }, 3)} /></label><label className="!flex !flex-col !items-stretch min-w-0 gap-1 text-xs text-slate-500">Thuế (%)<InputNumber aria-label="Thuế" className="!w-full" min={0} max={100} value={draft.vat} onChange={v => edit({ vat: v ?? 0 }, 3)} /></label></div>}
          <div className="flex justify-end mt-3"><div className="w-full space-y-2 text-sm">{Object.entries(kindLabels).map(([key, label]) => <div className="flex justify-between text-slate-500" key={key}><span>{label}</span><span>{money(result.subtotals[key as keyof typeof kindLabels])}</span></div>)}<div className="flex justify-between font-semibold border-t pt-2"><span>Giá vốn</span><span>{money(result.cost)}</span></div>{view === 3 && <><div className="flex justify-between"><span>Cộng giá ({draft.markup}%)</span><span>{money(result.profit)}</span></div>{(result.minimum_adjustment || 0) > 0 && <div className="flex justify-between text-teal-700"><span>Điều chỉnh giá tối thiểu</span><span>+{money(result.minimum_adjustment!)}</span></div>}<div className="flex justify-between"><span>Thuế ({draft.vat}%)</span><span>{money(result.tax)}</span></div><div className="flex justify-between text-lg font-semibold text-teal-700"><span>Tổng</span><span>{money(result.total)}</span></div><div className="text-right text-xs text-slate-500">{money(result.unit_total)} / sản phẩm</div></>}</div></div>
            </div>
            <img src={draft.brief?.generated_image_url || productImage(product)} data-bom-product-image alt={`Trang 1 · ${product.name}`} className="w-full h-72 object-contain rounded-xl bg-white mt-5" />
            <p className="mt-3 text-sm text-slate-700">{product.name}</p>
          </section>}
          <section className={view === 3 ? "min-w-0 md:col-span-2 bg-white" : "min-w-0 md:col-span-2"} aria-label={view === 3 ? "Trang 2 · Báo giá" : "Vật tư"}>
          {view === 3 && <><h3 className="m-0 mb-3 text-base font-semibold text-slate-700">Trang 2</h3><div className="mb-4"><CompanyBrand brief={draft.brief} /></div></>}
          <div className="flex items-center justify-between mb-3"><span className="text-xs text-slate-500 whitespace-nowrap">{draft.dimensions.L * 10} × {draft.dimensions.H * 10} × {draft.dimensions.W * 10} mm · {draft.dimensions.F} mặt · {draft.dimensions.count} sản phẩm</span>{view === 1 && <Button size="small" icon={<Plus size={14} />} onClick={() => setPicker(true)}>Thêm thành phần</Button>}</div>
          <BomTable items={items} result={result} editable={view === 1} onChange={changeRow} onReset={id => { const next = { ...draft.overrides }; delete next[id]; edit({ overrides: next }, 1); }} onRemove={id => edit({ extras: draft.extras.filter(e => e.id !== id) }, 1)} />
          {view === 3 && <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {([['customer_name', 'Tên khách hàng'], ['customer_phone', 'Điện thoại khách'], ['customer_address', 'Địa chỉ khách']] as const).map(([key, label]) =>
                <label key={key} className="text-xs text-slate-600">{label}<Input maxLength={255} value={draft.brief?.[key] || ''}
                  onChange={event => edit({ brief: { request_text: initialPrompt, sign_content: '', notes: '', sign_type: product.category, materials: '', ...draft.brief, [key]: event.target.value } }, 3)} /></label>)}
            </div>
            <CustomerQuotePages product={product} draft={draft} result={result} image={draft.brief?.generated_image_url || productImage(product)}
              imageRef={pageOneRef} quoteRef={pageTwoRef} />
          </div>}
          </section>
          {view === 1 && <aside className="min-w-0 md:sticky md:top-4 md:col-span-1 flex flex-col md:min-h-[calc(82dvh-12rem)]" aria-label="Tổng chi phí vật tư">
          <CompanyDetails brief={draft.brief} disabled={busy || companyUploading || imageGenerating} onUploading={setCompanyUploading}
            onChange={patch => edit({ brief: { request_text: initialPrompt, sign_content: '', notes: '', sign_type: product.category, materials: '', ...draft.brief, ...patch } }, 1)} />
          <div className="flex justify-end mt-auto pt-5"><div className="w-full space-y-2 text-sm">{Object.entries(kindLabels).map(([key, label]) => <div className="flex justify-between text-slate-500" key={key}><span>{label}</span><span>{money(result.subtotals[key as keyof typeof kindLabels])}</span></div>)}<div className="flex justify-between font-semibold border-t pt-2"><span>Giá vốn</span><span>{money(result.cost)}</span></div></div></div>
          </aside>}
        </div>}
      </div>
      {previewError && <Alert className="mt-3" type="error" message={previewError} />}
      {!!result?.issues.length && <Alert className="mt-3" type="warning" message={result.issues.join(" · ")}
        description={unpricedRows.length > 0 && <div className="mt-2 space-y-2">
          <p>Nhập đơn giá hoặc bỏ dòng không tính trước khi xuất PDF.</p>
          {unpricedRows.map(row => <div key={row.id} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span>{row.name} · Đơn giá (VND/{row.unit})</span>
              <Input defaultValue="" inputMode="numeric" placeholder="Nhập giá rồi nhấn Enter"
                disabled={busy}
                onPressEnter={event => event.currentTarget.blur()}
                onBlur={event => {
                  const amount = Number(event.currentTarget.value.replace(/[.\s]/g, ""));
                  if (Number.isSafeInteger(amount) && amount > 0 && amount <= 1e12) changeRow(row, { unit_price: amount });
                  else if (event.currentTarget.value.trim()) message.warning("Nhập đơn giá nguyên dương bằng VND.");
                }} />
            </label>
            <Button disabled={busy || previewing} onClick={() => changeRow(row, { selected: false })}>Bỏ dòng</Button>
          </div>)}
        </div>} />}
      <MaterialPicker open={picker} items={items} onClose={() => setPicker(false)} onAdd={(row: Extra) => edit({ extras: [...draft.extras, row] }, 1)} />
    </>}
    </div>
    {product && draft && <>
      <div className="shrink-0 z-20 flex justify-between items-center gap-3 border-t border-slate-200 bg-white px-4 md:px-5 py-4 shadow-[0_-6px_20px_-12px_rgba(15,23,42,0.25)]"><div className="flex flex-1 min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap">      {product.definition.constraints && <div className="shrink-0 text-xs text-slate-500">
        Giá tối thiểu: <strong>{money(product.definition.constraints.minimum_unit_price)} / sản phẩm</strong>
        {product.definition.constraints.minimum_order_price > 0 && <> · Tối thiểu mỗi đơn: <strong>{money(product.definition.constraints.minimum_order_price)}</strong></>}
        <span className="ml-1">(chưa VAT, chưa vận chuyển)</span>
      </div>}
<div className="shrink-0 text-xs text-slate-400">{previewing ? "Đang tính…" : finalized ? "Đã chốt báo giá" : ""}</div></div><div className="flex gap-2 flex-wrap">
        {view > 0 && <Button disabled={busy || companyUploading || imageGenerating} aria-label="Bước trước" title="Bước trước" icon={<ArrowLeft size={18} />} onClick={() => setView(view === 3 ? 1 : 0)} />}


        {view === 3 && result && <Button loading={copyingImage} onClick={async () => {
          if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
            message.error("Trình duyệt chưa hỗ trợ sao chép ảnh. Vui lòng mở bằng Chrome qua HTTPS.");
            return;
          }
          setCopyingImage(true);
          try {
            const data = pdfData({ product, ...draft, result });
            const image = data.then(async source => {
              const { mergeBomPagesImage } = await import("./exportBomPages");
              return mergeBomPagesImage(source);
            });
            // Start the clipboard write in the click handler to preserve user activation.
            await navigator.clipboard.write([new ClipboardItem({ "image/png": image })]);
            message.success("Đã sao chép ảnh gồm 2 trang. Dán vào Zalo bằng Ctrl+V.");
          } catch (error) {
            message.error(errorText(error));
          } finally {
            setCopyingImage(false);
          }
        }} disabled={busy || exporting || companyUploading || imageGenerating || previewing || !!previewError || !!result.issues.length}>Sao chép báo giá gửi Zalo</Button>}
        <span className={view === 3 ? '' : 'hidden'}><PdfExportPopover loading={busy || exporting}
          prepare={!companyUploading && view === 3 && !!result && !previewing && !previewError && !imageGenerating}
          disabled={companyUploading || imageGenerating || previewing || !!previewError || !result || !!result.issues.length}
          previewKey={JSON.stringify([product.id, product.name, draft.dimensions, draft.markup, draft.vat,
            draft.brief?.generated_image_url, draft.brief?.company_name, draft.brief?.company_address, draft.brief?.company_phone, draft.brief?.company_email, draft.brief?.company_logo_url, draft.brief?.customer_name, draft.brief?.customer_phone, draft.brief?.customer_address, draft.brief?.materials, result, productImage(product)])}
          buildData={() => pdfData(!dirty && quote ? quote.payload : { product, ...draft, result: result! })}
          onExport={exportPrint} /></span>
          {view !== 3 && <Button type="primary" loading={busy} disabled={companyUploading || imageGenerating || previewing || !!previewError || !result || view > 0 && !!result.issues.length}
            onClick={confirm} aria-label={`Tiếp tục ${steps[visibleStep(view)].toLowerCase()}`} title="Tiếp tục" icon={<ArrowRight size={20} />} />}
      </div></div>
    </>}
  </div></ConfigProvider>;
}
