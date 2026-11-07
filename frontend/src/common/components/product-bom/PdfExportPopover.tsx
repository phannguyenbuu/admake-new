import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Image, Popover, Segmented, Spin } from "antd";
import { Download } from "lucide-react";
import type { PdfOrientation, TwoPagePdfData } from "../ai-pricing/studio/overlayTypes";

const PAGE_LABELS = ["Phối cảnh", "Báo giá"];
// html2canvas work is queued to avoid overlapping rasterizations during edits.
let previewQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const pending = previewQueue.then(work, work);
  previewQueue = pending.catch(() => {});
  return pending;
}

export type PdfExportOptions = { orientation: PdfOrientation; pages: number[] };

/** Nút xuất PDF; hover mở bảng chọn khổ giấy, trang cần in và xem trước từng trang. */
export function PdfExportPopover({ disabled, loading, previewKey, buildData, onExport, prepare = !disabled }: {
  disabled: boolean; loading: boolean;
  prepare?: boolean;
  /** Đổi khi nội dung báo giá đổi, để tạo lại ảnh xem trước. */
  previewKey: string;
  buildData: () => Promise<TwoPagePdfData>;
  onExport: (options: PdfExportOptions) => void;
}) {
  const [open, setOpen] = useState(false);
  const [orientation, setOrientation] = useState<PdfOrientation>("landscape");
  const [pages, setPages] = useState<number[]>([0, 1]);
  const [cache, setCache] = useState<{ key: string; images: Partial<Record<PdfOrientation, string[]>> }>({ key: '', images: {} });
  const [error, setError] = useState("");
  const buildDataRef = useRef(buildData);
  buildDataRef.current = buildData;
  const readyKey = useRef('');
  const previews = cache.key === previewKey ? cache.images[orientation] || [] : [];
  const rendering = previews.length !== PAGE_LABELS.length;

  useEffect(() => {
    if (!prepare || readyKey.current === previewKey) return;
    let cancelled = false;
    setError('');
    const timer = window.setTimeout(() => {
      void enqueue(async () => {
        if (cancelled) return;
        try {
          const { exportTwoPageStudioPdf } = await import('../ai-pricing/studio/exportTwoPagePdf');
          const data = await buildDataRef.current();
          for (const direction of ['landscape', 'portrait'] as const) {
            if (cancelled) return;
            const images = await exportTwoPageStudioPdf({ ...data, orientation: direction }, { preview: true });
            if (cancelled) return;
            setCache(previous => ({ key: previewKey, images: { ...(previous.key === previewKey ? previous.images : {}), [direction]: images } }));
          }
          readyKey.current = previewKey;
        } catch {
          if (!cancelled) setError('Không tạo được bản xem trước. Vui lòng thử lại.');
        }
      });
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [previewKey, prepare]);

  const toggle = (index: number, checked: boolean) =>
    setPages(prev => checked ? [...prev, index].sort() : prev.filter(p => p !== index));
  const exportSelected = () => { setOpen(false); onExport({ orientation, pages }); };

  const content = <div className="w-[min(420px,86vw)] space-y-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">Khổ giấy A4</span>
      <Segmented size="small" value={orientation} onChange={v => setOrientation(v as PdfOrientation)}
        options={[{ value: "landscape", label: "Ngang" }, { value: "portrait", label: "Dọc" }]} />
    </div>
    <Spin spinning={rendering} tip="Đang dựng trang…">
      <div className="grid grid-cols-2 gap-3 min-h-28">
        {PAGE_LABELS.map((label, index) => <div key={label}
          className={`rounded-lg border p-2 transition-colors ${pages.includes(index) ? "border-teal-500 bg-teal-50/40" : "border-slate-200 opacity-60"}`}>
          <Checkbox checked={pages.includes(index)} onChange={e => toggle(index, e.target.checked)} className="!text-xs">
            Trang {index + 1} · {label}
          </Checkbox>
          {/* Fixed height keeps the popover from jumping (and closing under the cursor) when orientation changes. */}
          <div className="mt-2 h-48 flex items-center justify-center bg-slate-100 rounded overflow-hidden">
            {previews[index]
              ? <Image src={previews[index]} alt={`Xem trước trang ${index + 1}`} rootClassName="h-full flex items-center justify-center"
                  className="!h-auto !w-auto !max-h-48 !max-w-full object-contain shadow-sm" preview={{ zIndex: 10400 }} />
              : !rendering && <span className="text-[11px] text-slate-400">Chưa có bản xem trước</span>}
          </div>
        </div>)}
      </div>
    </Spin>
    {error && <div className="text-xs text-red-500">{error}</div>}
    <Button type="primary" block icon={<Download size={16} />} disabled={disabled || !pages.length} loading={loading} onClick={exportSelected}>
      Tải PDF {pages.length === PAGE_LABELS.length ? "(tất cả trang)" : pages.length ? `(trang ${pages.map(p => p + 1).join(", ")})` : ""}
    </Button>
  </div>;

  return <Popover open={open && !disabled} onOpenChange={setOpen} trigger={['hover', 'click']} placement="topRight" mouseLeaveDelay={0.4}
    title="Xuất bản in" content={content} zIndex={10200}>
    <Button type="primary" loading={loading} disabled={disabled} icon={<Download size={18} />}>
      Xuất bản in (PDF)
    </Button>
  </Popover>;
}
