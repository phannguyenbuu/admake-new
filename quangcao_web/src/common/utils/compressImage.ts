// compressImage.ts
import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  const opts = {
    maxSizeMB: 0.2, // ~200KB
    maxWidthOrHeight: 1180, // downscale dài nhất 1600px
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: "image/webp", // ổn định cho backend cũ; đổi 'image/webp' nếu server hỗ trợ
  };
  const out = await imageCompression(file, opts);
  return out.size < file.size ? out : file; // nếu nén xong to hơn thì giữ file gốc
}

export const human = (b: number) => {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (b >= 1000 && i < u.length - 1) {
    b /= 1000;
    i++;
  }
  return `${b.toFixed(3)} ${u[i]}`;
};

export const getDims = (file: File) =>
  new Promise<{ w: number; h: number }>((res) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = URL.createObjectURL(file);
  });
