// DOM contract based on the supplied Gemini prompt and generated-image markup.
globalThis.GeminiBridgeAdapter = (() => {
  const visible = el => !!el && !el.closest('[hidden], [aria-hidden="true"]') && el.getClientRects().length > 0;
  const editor = () => [...document.querySelectorAll('fieldset .ql-editor[contenteditable="true"][role="textbox"], .ql-editor[contenteditable="true"][role="textbox"]')].find(visible);
  const signedOut = () => [...document.querySelectorAll('a, button, [data-test-id="sign-in-button"]')].some(el => visible(el) && (el.matches('a[href*="accounts.google.com/ServiceLogin"], a[href*="accounts.google.com/v3/signin"], [data-test-id="sign-in-button"]') || /(^|\s)(sign in|đăng nhập)($|\s)/i.test((el.innerText || el.textContent || '').trim())));
  const responses = () => [...document.querySelectorAll('model-response')];
  function generatedImages() {
    return [...document.querySelectorAll('generated-image img.image, .generated-images img.image')]
      .filter(img => !img.closest('user-query, user-query-file-preview') && img.dataset.testId !== 'uploaded-img');
  }
  const imageSource = img => img.currentSrc || img.src || '';
  const snapshot = () => ({ responses: new Set(responses()), images: new Map(generatedImages().map(img => [img, imageSource(img)])) });
  function freshImages(before) {
    return generatedImages().filter(img => {
      const response = img.closest('model-response');
      return (!response || !before.responses.has(response)) && !before.images.has(img)
        && img.complete && img.naturalWidth >= 128 && img.naturalHeight >= 128
        && /^(blob:https:\/\/gemini\.google\.com\/|https:\/\/|data:image\/)/.test(imageSource(img));
    });
  }
  const busy = () => [...document.querySelectorAll('button[aria-label], button[data-test-id]')].some(el => visible(el)
    && /^(stop response|stop generating|dừng phản hồi|ngừng tạo|dừng tạo)/i.test(el.getAttribute('aria-label') || ''));
  const sendButton = () => [...document.querySelectorAll('button.send-button, button[data-test-id="send-button"], button[aria-label]')]
    .find(el => visible(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true'
      && (el.matches('.send-button, [data-test-id="send-button"]') || /^(send message|send prompt|gửi tin nhắn|gửi lời nhắc|gửi)$/i.test(el.getAttribute('aria-label') || '')));
  function setPrompt(text) {
    const el = editor();
    if (!el) throw new Error('Chưa thấy ô nhập Gemini. Kiểm tra đăng nhập.');
    el.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
    // execCommand triggers Quill's native editing pipeline; input event is a fallback.
    document.execCommand('insertText', false, text);
    if ((el.innerText || '').trim() !== text.trim()) {
      el.replaceChildren(...text.split('\n').map(line => { const p = document.createElement('p'); p.textContent = line; return p; }));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }));
    }
  }
  async function imageData(img) {
    const src = imageSource(img);
    try {
      // Blob URLs must be fetched inside their owning Gemini tab, not the service worker.
      const response = await fetch(src, { credentials: 'include' });
      if (!response.ok) throw new Error('Image download failed');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Invalid image response');
      return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
    } catch (error) {
      if (src.startsWith('blob:')) throw error;
      const response = await chrome.runtime.sendMessage({ action: 'FETCH_IMAGE_BASE64', url: src });
      if (!response?.ok || !response.base64) throw new Error('Không tải được ảnh kết quả Gemini.');
      return response.base64;
    }
  }
  async function fullSizeImage(img) {
    const index = generatedImages().indexOf(img);
    if (index < 0) throw new Error('Không tìm thấy ảnh kết quả mới.');
    const result = await chrome.runtime.sendMessage({ action: 'GEMINI_DOWNLOAD_FULL_SIZE', image_index: index, expected_src: imageSource(img) });
    if (!result?.ok || !result.dataUrl) throw new Error(result?.error || 'Không tải được ảnh gốc Gemini.');
    if (result.width < img.naturalWidth || result.height < img.naturalHeight) throw new Error('Ảnh tải xuống nhỏ hơn ảnh xem trước.');
    if (!globalThis.GeminiBridgeWatermark) throw new Error('Chưa nạp bộ xử lý watermark. Cần nạp lại extension.');
    const clean = await globalThis.GeminiBridgeWatermark.process(result.dataUrl);
    return { ...clean, variant: 'full_size_download', originalUrl: result.originalUrl || null };
  }
  return { visible, editor, signedOut, responses, generatedImages, imageSource, snapshot, freshImages, busy, sendButton, setPrompt, imageData, fullSizeImage };
})();
