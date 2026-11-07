import type { AnnotatedPhoto } from './productTextAnnotations';

export function AnnotatedProductPhoto({ photo, selectedSlot, onSelectSlot }: {
  photo: AnnotatedPhoto; selectedSlot?: string; onSelectSlot: (slot: string) => void;
}) {
  return <div className="relative w-full" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
    <img src={photo.image} alt="Ảnh mẫu với vùng chữ" className="absolute inset-0 w-full h-full" />
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${photo.width} ${photo.height}`} aria-hidden="true">
      {photo.regions.map(region => <polygon key={region.id} points={region.quad.map(p => p.join(',')).join(' ')}
        fill={region.slot_id === selectedSlot ? '#14b8a633' : 'transparent'}
        stroke={region.slot_id === selectedSlot ? '#0d9488' : region.review === 'pending' ? '#d97706' : '#0284c7'}
        strokeWidth={region.slot_id === selectedSlot ? 4 : 2} vectorEffect="non-scaling-stroke" />)}
    </svg>
    {photo.regions.map((region, index) => {
      const [x,y,w,h] = region.normalized_bbox;
      return <button key={region.id} type="button" aria-label={`Chọn vùng chữ ${index + 1}: ${region.text}`}
        title={region.text} onClick={() => onSelectSlot(region.slot_id)}
        className="absolute bg-transparent border-0 cursor-pointer p-0 focus-visible:outline-2 focus-visible:outline-teal-600"
        style={{ left: `${x*100}%`, top: `${y*100}%`, width: `${w*100}%`, height: `${h*100}%` }} />;
    })}
  </div>;
}
