/** Shared brand artwork used by the app header and quote pages. */
export function AdmakeBrand() {
  return <div className="flex items-center gap-3">
    <img src="/logo.jpg" alt="Logo Admake" style={{ width: 40, height: 'auto' }} />
    <img src="/ADMAKE.svg" alt="ADMAKE" className="h-8" />
  </div>;
}
