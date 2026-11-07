import { useEffect, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

export function ProductComparison({ id, name, original, views, initialPosition = 50, onSelect }: { id: string; name: string; original: string; views?: { before: string; after: string }; initialPosition?: number; onSelect?: () => void }) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [position, setPosition] = useState(initialPosition);
  const [missing, setMissing] = useState(false);
  const [comparing, setComparing] = useState(initialPosition < 100);
  useEffect(() => setMissing(false), [views?.before, views?.after]);
  return <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-slate-50 isolate" data-product-comparison={id}
    role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Chọn ảnh ${name}` : undefined}
    onPointerDown={event => { dragged.current = false; pointerStart.current = { x: event.clientX, y: event.clientY }; }}
    onPointerMove={event => { const start = pointerStart.current; if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 6) dragged.current = true; }}
    onPointerCancel={() => { pointerStart.current = null; dragged.current = true; }}
    onPointerUp={event => {
      const start = pointerStart.current; pointerStart.current = null;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 6) dragged.current = true;
    }}
    onClick={() => { if (!dragged.current) onSelect?.(); dragged.current = false; }}
    onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect?.(); } }}>
    {!views?.before || !views?.after || missing ? <img src={original} alt={name} loading="lazy" className="absolute inset-0 w-full h-full object-contain" /> : <>
      {comparing && <img src={views.after} alt={`${name} — góc nhìn từ trên`} draggable={false} loading="lazy" onError={() => setMissing(true)} className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" />}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={views.before} alt={`${name} — sản phẩm đã khử nền`} draggable={false} loading="lazy" decoding="async" onError={() => setMissing(true)} className="w-full h-full object-contain select-none" />
      </div>
      <div className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_2px_#475569] pointer-events-none" style={{ left: `${position}%` }}>
        <div style={{ transform: `translate(${position === 100 ? '-100%' : '-50%'}, -50%)` }} className="absolute top-1/2 rounded-full w-7 h-7 bg-white shadow border border-slate-200 flex items-center justify-center text-slate-600"><ChevronsLeftRight size={15} /></div>
      </div>
      <input type="range" min={0} max={100} value={position} aria-label={`So sánh góc nhìn ${name}`} aria-valuetext={`${position}% ảnh đã khử nền`}
        onPointerDown={() => setComparing(true)} onFocus={() => setComparing(true)}
        onChange={e => { setComparing(true); setPosition(Number(e.target.value)); }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize touch-pan-y" />
    </>}
  </div>;
}
