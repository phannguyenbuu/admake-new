import { compressImage } from "./compressImage";

function isImageFile(file: File): boolean {
  if (file.type) return file.type.startsWith("image/");
  // fallback cho trường hợp type rỗng
  return /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i.test(file.name);
}
// đây là helper để nén ảnh trước khi gửi
export async function prepareImageForUpload(
  file: File,
  opts: {
    maxMB?: number;
    compressor?: (f: File) => Promise<File>;
  } = {}
): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  const maxMB = opts.maxMB ?? 5;
  const compressor = opts.compressor ?? compressImage;

  // 1) Chỉ chấp nhận ảnh
  if (!isImageFile(file)) {
    return { ok: false, error: "Vui lòng chọn file ảnh!" };
  }

  // 2) Nếu đã <= maxMB thì gửi luôn
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB <= maxMB) {
    return { ok: true, file };
  }

  // 3) Nén rồi kiểm tra lại
  try {
    const compressed = await compressor(file);
    const compressedMB = compressed.size / (1024 * 1024);

    if (compressedMB <= maxMB) {
      return { ok: true, file: compressed };
    } else {
      return { ok: false, error: `Ảnh phải nhỏ hơn ${maxMB}MB!` };
    }
  } catch {
    return { ok: false, error: "Nén ảnh thất bại, vui lòng thử ảnh khác!" };
  }
}
