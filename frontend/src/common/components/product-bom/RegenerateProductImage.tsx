import { useEffect, useRef, useState } from "react";
import { Alert, Button, ColorPicker, Input, Modal, Progress, Segmented, Tooltip, message } from "antd";
import { ImagePlus } from "lucide-react";
import { genAISignboardService, GENAI_REMOTE_URL } from "../../services/genaiSignboard.service";
import type { Brief, Draft, Product } from "./types";
import { TextReplacementFields, imageTextLines } from './TextReplacementFields';
import { buildImagePrompt, readBackgroundColor, writeReplacements } from './imageTextPrompt';
import { useProductTextAnnotations, type PhotoView } from './productTextAnnotations';
import { AnnotatedProductPhoto } from './AnnotatedProductPhoto';

export function renderSignature(product: Product, draft: Draft): string {
  const text = JSON.stringify([product.id, draft.dimensions, draft.brief?.sign_content, draft.brief?.materials, draft.brief?.notes]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `${text.length}-${hash >>> 0}`;
}

export function RegenerateProductImage({ product, draft, sourceImage, onPatch, onGenerating, compact = false }: {
  product: Product; draft: Draft; sourceImage: string; onPatch: (patch: Partial<Brief>) => void; onGenerating: (active: boolean) => void; compact?: boolean;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState<{ url: string; signature: string; sign_content: string }>();
  const annotation = useProductTextAnnotations(product.id);
  const [view, setView] = useState<PhotoView>('before');
  const [showGenerated, setShowGenerated] = useState(!!draft.brief?.generated_image_url);
  const [selectedSlot, setSelectedSlot] = useState<string>();
  const fieldsRef = useRef<HTMLDivElement>(null);
  const photo = annotation?.views[view];
  const referenceImage = photo?.image || sourceImage;
  const lines = imageTextLines(product.id, draft.brief?.sign_content, annotation);
  const prompt = buildImagePrompt(product, draft, lines, photo);
  const generatedPreview = candidate?.url || draft.brief?.generated_image_url;
  const candidateCurrent = !!candidate && candidate.signature === renderSignature(product, {
    ...draft, brief: { ...draft.brief!, sign_content: writeReplacements(lines, readBackgroundColor(draft.brief?.sign_content)) },
  });

  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); }, []);
  const skip = () => {
    controller.current?.abort();
    controller.current = null;
    setGenerating(false); onGenerating(false);
    setProgress(0); setError(''); setCandidate(undefined); setEditorOpen(false);
  };
  const selectImage = () => {
    if (!candidate || generating || !candidateCurrent) return;
    onPatch({ sign_content: candidate.sign_content, generated_image_url: candidate.url, render_signature: candidate.signature });
    setCandidate(undefined); setEditorOpen(false);
  };
  const generate = async () => {
    if (controller.current || generating) return;
    if (lines.some(line => !line.source.trim() && line.replacement.trim())) {
      message.warning('Điền chữ gốc hoặc vị trí cho dòng cần thay.');
      return;
    }
    const abort = new AbortController(); controller.current = abort;
    setGenerating(true); onGenerating(true); setProgress(0); setError(""); setCandidate(undefined);
    try {
      const response = await fetch(referenceImage, { signal: abort.signal });
      if (!response.ok) throw new Error("source image");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("source image");
      if (photo) {
        const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
        const hash = Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2, '0')).join('');
        if (hash !== photo.sha256) throw new Error('Ảnh mẫu đã thay đổi, cần cập nhật lại vùng chữ');
      }
      const reference = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
      });
      if (abort.signal.aborted) return;
      const sign_content = writeReplacements(lines, readBackgroundColor(draft.brief?.sign_content));
      if (sign_content.length > 4000) throw new Error('Nội dung thay thế vượt giới hạn lưu báo giá');
      const signature = renderSignature(product, { ...draft, brief: { ...draft.brief!, sign_content } });
      const job = await genAISignboardService.editFullRenderJob({ prompt, reference_images: [reference] });
      if (abort.signal.aborted) return;
      if (!job.id) throw new Error("missing job");
      const complete = await genAISignboardService.waitForJob(job.id, status => {
        if (!abort.signal.aborted) setProgress(Math.min(99, Math.max(0, status.progress || 0)));
      }, 600000, abort.signal);
      if (abort.signal.aborted) return;
      if (!complete.result_image_url) throw new Error("missing image");
      const url = new URL(complete.result_image_url, GENAI_REMOTE_URL);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error("invalid image");
      if (!abort.signal.aborted) {
        setCandidate({ sign_content, url: url.href, signature }); setShowGenerated(true); setProgress(100);
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        console.error("[BOM] Tạo hình thất bại", e);
        setError('Chưa tạo được hình. Vui lòng kiểm tra kết nối và thử lại.');
      }
    } finally {
      if (controller.current === abort) { controller.current = null; setGenerating(false); onGenerating(false); }
    }
  };
  const launchButton = <div className={compact && draft.brief?.generated_image_url ? "absolute inset-0 flex flex-col items-center justify-center gap-2 px-2" : "flex flex-col items-center justify-center gap-2 mt-4 mb-4"}><Button type="primary" size="large" shape="round" className="!h-14 !min-w-48 !rounded-full !text-base !font-semibold" icon={<ImagePlus size={22} />} onClick={() => setEditorOpen(true)}>Thay đổi nội dung ảnh</Button><p className="!m-0 rounded-md bg-white/90 px-2 py-1 text-center text-xs font-normal leading-relaxed text-slate-500">Render mất thời gian từ 1 - 5 phút tùy tốc độ mạng, sẽ giúp bảng báo giá thuyết phục hơn</p></div>;
  return <>
    {!compact && <img src={draft.brief?.generated_image_url || sourceImage} alt={`Phối cảnh ${product.name}`} className="w-full h-72 object-contain rounded-xl bg-slate-50" />}
    {compact && draft.brief?.generated_image_url ? <div className="relative w-full h-64 rounded-xl bg-white overflow-hidden">
      <img src={draft.brief?.generated_image_url || sourceImage} alt={`Phối cảnh ${product.name}`} className="w-full h-full object-contain" />
      {launchButton}
    </div> : launchButton}
    <Modal open={editorOpen} title={<><Tooltip color="white" placement="bottomLeft"
      title={<div className="whitespace-pre-wrap max-h-80 overflow-auto text-slate-800 font-normal">{prompt}</div>}
      overlayStyle={{ maxWidth: 640 }}>
      <span tabIndex={0} className="cursor-help">Thông tin quảng cáo</span>
    </Tooltip><span> · Thay chữ và tạo ảnh</span></>} width="min(1100px, 96vw)" centered
      maskClosable={false} keyboard={!generating} closable={!generating} onCancel={skip}
      styles={{ body: { maxHeight: '75dvh', overflowY: 'auto' } }}
      footer={<div className="flex flex-wrap items-center justify-end gap-2">
        {generating && <div className="flex-1 min-w-32 mr-3 text-left"><Progress percent={Math.round(progress)} status="active" className="!m-0" /></div>}
        <Button size="large" onClick={skip}>Bỏ qua</Button>
        <Button type="primary" size="large" loading={generating} onClick={generate} icon={<ImagePlus size={20} />}>{generating ? 'Đang tạo ảnh…' : 'Gửi tạo ảnh'}</Button>
        {candidate && !generating && <Button type="primary" size="large" disabled={!candidateCurrent} onClick={selectImage}>Chọn ảnh</Button>}</div>}>
    <section className="space-y-3">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <div className="space-y-3">
        {annotation && <Segmented block disabled={generating} value={showGenerated ? 'generated' : view}
          options={[{ value: 'before', label: 'Chính diện' }, { value: 'after', label: 'Góc nghiêng' },
            ...(generatedPreview ? [{ value: 'generated', label: 'Hình mới' }] : [])]}
          onChange={value => { setShowGenerated(value === 'generated'); if (value !== 'generated') setView(value as PhotoView); }} />}
        <div className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
          {photo && !showGenerated ? <AnnotatedProductPhoto photo={photo} selectedSlot={selectedSlot}
            onSelectSlot={slot => {
              setSelectedSlot(slot);
              const field = Array.from(fieldsRef.current?.querySelectorAll<HTMLElement>('[data-text-slot]') || []).find(el => el.dataset.textSlot === slot);
              field?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              field?.querySelectorAll('textarea')[1]?.focus({ preventScroll: true });
            }} /> : <img src={showGenerated && generatedPreview || referenceImage} alt={`Phối cảnh ${product.name}`} className="w-full h-72 object-contain" />}
        </div>
        {photo && !showGenerated && <p className="!m-0 text-xs text-slate-500">{photo.regions.length} vùng chữ · bấm vào khung để thay nội dung. Khung cam: chữ cần kiểm tra lại.</p>}
      </div>
      <div ref={fieldsRef}><TextReplacementFields productId={product.id} value={draft.brief?.sign_content} disabled={generating}
        view={view} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} onChange={sign_content => onPatch({ sign_content })} />
        <div className="flex items-center gap-3 mt-4 text-sm text-slate-600">
          <span>Màu nền bảng hiệu</span>
          <ColorPicker value={readBackgroundColor(draft.brief?.sign_content) || null} allowClear showText disabled={generating}
            onChangeComplete={color => onPatch({ sign_content: writeReplacements(lines, color.cleared ? undefined : color.toHexString()) })}
            onClear={() => onPatch({ sign_content: writeReplacements(lines) })} />
          <span className="text-xs text-slate-400">Để trống để giữ nguyên</span>
        </div>
        <label className="block mt-4 text-sm text-slate-600">Ghi chú thiết kế và thi công
          <Input.TextArea className="!mt-2" disabled={generating} aria-label="Ghi chú thiết kế và thi công" value={draft.brief?.notes || ''} maxLength={4000} autoSize={{ minRows: 2, maxRows: 5 }}
            onChange={event => onPatch({ notes: event.target.value })} />
        </label>
      </div>
    </div>
    {error && <Alert type="error" message={error} />}
    {candidate && !candidateCurrent && <Alert type="warning" message="Thông tin đã thay đổi. Gửi tạo ảnh lại trước khi chọn ảnh." />}
    {!candidate && draft.brief?.generated_image_url && <>
      {draft.brief.render_signature !== renderSignature(product, draft) && <Alert type="warning" message="Thông tin đã thay đổi. Tạo hình lại để cập nhật nội dung mới." />}
    </>}
  </section></Modal></>;
}
