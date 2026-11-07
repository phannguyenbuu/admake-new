import { useEffect, useRef, useState } from 'react';
import { Button, Input, Tooltip, message } from 'antd';
import { Upload, RotateCcw } from 'lucide-react';
import { AdmakeBrand } from '../AdmakeBrand';
import axiosClient from '../../services/axiosClient';
import { useApiHost } from '../../common/hooks/useApiHost';
import type { Brief } from './types';

export function CompanyBrand({ brief, showContacts = true }: { brief?: Brief; showContacts?: boolean }) {
  const host = useApiHost().replace(/\/api\/?$/, '');
  const name = brief?.company_name || 'Admake';
  const logo = brief?.company_logo_url || '/logo.jpg';
  const defaults = name.toLowerCase() === 'admake' && logo === '/logo.jpg';
  return <div className="space-y-1">
    {defaults ? <AdmakeBrand /> : <div className="flex items-center gap-3">
      <img src={logo.startsWith('/static/') ? host + logo : logo} alt={`Logo ${name}`} className="max-w-24 h-12 object-contain" />
      <span className="text-base font-semibold text-slate-800 break-words">{name}</span>
    </div>}
    {showContacts && brief?.company_address && <div className="text-xs text-slate-500 whitespace-pre-wrap">{brief.company_address}</div>}
    {showContacts && (brief?.company_phone || brief?.company_email) && <div className="text-xs text-slate-500 break-words">
      {[brief.company_phone, brief.company_email].filter(Boolean).join(' · ')}
    </div>}
  </div>;
}

export function CompanyDetails({ brief, disabled, onChange, onUploading }: {
  brief?: Brief; disabled?: boolean; onChange: (patch: Partial<Brief>) => void; onUploading: (active: boolean) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => () => { controller.current?.abort(); onUploading(false); }, [onUploading]);
  const upload = async (file?: File) => {
    if (!file || uploading || disabled) return;
    if (file.size > 5 * 1024 * 1024) { message.warning('Logo tối đa 5 MB'); return; }
    const abort = new AbortController(); controller.current = abort;
    setUploading(true); onUploading(true);
    try {
      const data = new FormData(); data.append('file', file);
      const response = await axiosClient.post('/product-bom/company-logo', data, {
        signal: abort.signal, headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!abort.signal.aborted) onChange({ company_logo_url: response.data.url });
    } catch {
      if (!abort.signal.aborted) message.error('Không tải được logo. Chọn ảnh PNG, JPG hoặc WebP và thử lại.');
    } finally {
      if (!abort.signal.aborted) { setUploading(false); onUploading(false); }
      if (fileInput.current) fileInput.current.value = '';
    }
  };
  return <section className="mb-5 space-y-3 rounded-xl bg-slate-50 p-3" aria-label="Thông tin công ty">
    <h3 className="m-0 text-sm font-semibold text-slate-700">Thông tin công ty</h3>
    <div className="flex items-center justify-between gap-2"><div className="min-w-0 flex-1"><CompanyBrand brief={brief} showContacts={false} /></div>
    <div className="flex shrink-0 gap-1">
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden
        onChange={event => void upload(event.target.files?.[0])} />
      <Tooltip title="Chọn logo từ máy"><Button size="small" aria-label="Chọn logo từ máy" disabled={disabled} loading={uploading} icon={<Upload size={14} />} onClick={() => fileInput.current?.click()} /></Tooltip>
      <Tooltip title="Khôi phục Admake"><Button size="small" aria-label="Khôi phục Admake" icon={<RotateCcw size={14} />} disabled={disabled || uploading} onClick={() => onChange({ company_name: 'Admake', company_logo_url: '/logo.jpg' })} /></Tooltip>
    </div></div>
    <label className="!flex !flex-col !items-stretch gap-1 text-xs font-normal text-slate-500">
      Tên công ty<Input aria-label="Tên công ty" disabled={disabled || uploading} maxLength={255}
        value={brief?.company_name ?? 'Admake'} onChange={event => onChange({ company_name: event.target.value })} />
    </label>
    <div className="text-xs text-slate-500">
      <div className="grid grid-cols-1 gap-2">
        {([['company_address', 'Địa chỉ'], ['company_phone', 'Điện thoại'], ['company_email', 'Email']] as const).map(([key, label]) =>
          <label key={key} className="!flex !flex-col !items-stretch gap-1 font-normal">
            {label}<Input aria-label={label} disabled={disabled || uploading} maxLength={key === 'company_address' ? 500 : 255}
              value={brief?.[key] ?? ''} onChange={event => onChange({ [key]: event.target.value })} />
          </label>)}
      </div>
    </div>
  </section>;
}
