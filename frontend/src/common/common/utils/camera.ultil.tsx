export async function capturePhotoFile(
  fileName = "photo.jpg",
  facingMode: "user" | "environment" = "user"
): Promise<File> {
  // xin quyền camera
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false,
  });

  try {
    // tạo video/canvas tạm (không gắn vào DOM)
    const video = document.createElement("video");
    video.playsInline = true; // iOS
    video.srcObject = stream;

    // chờ video sẵn sàng
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onloadedmetadata = onLoaded;
      // phòng khi onloadedmetadata không bắn
      setTimeout(() => video.readyState >= 1 && onLoaded(), 500);
    });

    // đảm bảo có khung hình đầu tiên
    await new Promise(requestAnimationFrame);

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, width, height);

    // xuất JPEG (nhỏ hơn PNG)
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b as Blob),
        "image/jpeg",
        0.9 // chất lượng
      )
    );

    return new File([blob], fileName, { type: "image/jpeg" });
  } finally {
    // tắt camera
    stream.getTracks().forEach((t) => t.stop());
  }
}
