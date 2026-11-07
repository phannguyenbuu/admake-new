// Privileged entry point for the short-lived Gemini native-download capture.
const geminiDownloadsInFlight = new Set();
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.action !== 'GEMINI_DOWNLOAD_FULL_SIZE') return;
  const tabId = sender.tab?.id;
  if (!tabId || !/^https:\/\/gemini\.google\.com\//.test(sender.tab.url || '')
      || !Number.isInteger(message.image_index) || message.image_index < 0 || message.image_index > 1000
      || typeof message.expected_src !== 'string' || geminiDownloadsInFlight.has(tabId)) {
    reply({ ok: false, error: 'Yêu cầu tải ảnh Gemini không hợp lệ hoặc đang bận.' }); return;
  }
  geminiDownloadsInFlight.add(tabId);
  (async () => {
    try {
      await chrome.scripting.executeScript({ target: { tabId, documentIds: sender.documentId ? [sender.documentId] : undefined },
        world: 'MAIN', files: ['gemini-download-main.js'] });
      const result = await chrome.scripting.executeScript({ target: { tabId, documentIds: sender.documentId ? [sender.documentId] : undefined },
        world: 'MAIN', func: (index, src) => globalThis.GeminiBridgeDownload.capture(index, src),
        args: [message.image_index, message.expected_src] });
      let captured = result?.[0]?.result;
      if (!captured?.ok && captured?.originalUrl) {
        const url = new URL(captured.originalUrl);
        if (url.protocol !== 'https:' || !url.hostname.endsWith('.googleusercontent.com') || !/^\/(gg(?:-[a-z0-9]+)*-dl|rd-[a-z0-9-]+)/i.test(url.pathname)) throw new Error('URL ảnh gốc không hợp lệ.');
        const response = await fetch(url.href, { credentials: 'include', signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error('Không tải được ảnh gốc từ URL download.');
        const blob = await response.blob();
        if (!blob.size || blob.size > 32 * 1024 * 1024) throw new Error('File ảnh gốc không hợp lệ.');
        const bitmap = await createImageBitmap(blob); const width = bitmap.width, height = bitmap.height; bitmap.close();
        const bytes = new Uint8Array(await blob.arrayBuffer()); let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        captured = { ok: true, dataUrl: `data:${blob.type.startsWith('image/') ? blob.type : 'image/png'};base64,${btoa(binary)}`, width, height, variant: 'full_size_download', originalUrl: url.href };
      }
      reply(captured || { ok: false, error: 'Không nhận được ảnh gốc Gemini.' });
    } catch (error) { reply({ ok: false, error: error.message }); }
    finally { geminiDownloadsInFlight.delete(tabId); }
  })();
  return true;
});
