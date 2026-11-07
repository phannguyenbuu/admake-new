(() => {
  const A = globalThis.GeminiBridgeAdapter;
  let tabId = '', task = null, running = false, waitingForCommit = false, revoked = false;
  let stopped = false;
  const runtimeReady = () => !chrome.runtime.getManifest || Number.parseFloat(chrome.runtime.getManifest().version) >= 5.6;
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const conversationId = () => location.pathname.match(/\/app\/([^/]+)/)?.[1] || null;
  async function coordinator(message) {
    const result = await chrome.runtime.sendMessage(message);
    if (!result?.ok) throw new Error(result?.error || 'Không kết nối được bridge.');
    return result;
  }
  function accountEmail() {
    const account = [...document.querySelectorAll('a[href*="accounts.google.com"], button[aria-label*="Account"], button[aria-label*="Tài khoản"]')]
      .map(el => [el.getAttribute('aria-label'), el.getAttribute('data-email'), el.getAttribute('title')].filter(Boolean).join(' ')).join(' ');
    return account.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || null;
  }
  function widget(message) {
    let box = document.getElementById('gemini-v5-bridge-status');
    if (!box) {
      box = document.createElement('div'); box.id = 'gemini-v5-bridge-status';
      box.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483646;background:#172033;color:#fff;padding:10px 14px;border-radius:10px;font:12px system-ui;max-width:340px;pointer-events:none';
      document.body.append(box);
    }
    box.textContent = `Gemini · ${tabId || 'Bridge V5'} · ${message}`;
  }
  async function heartbeat() {
    if (stopped) return;
    try {
      const message = { account_email: accountEmail(), conversation_id: conversationId(), ready: runtimeReady() && !!A.editor() && !A.signedOut() && !A.busy() };
      if (!tabId) {
        const result = await coordinator({ action: 'REGISTER_EXECUTOR', ...message });
        tabId = result.tab_id;
        waitingForCommit = !!result.blocked;
      } else await coordinator({ action: 'EXECUTOR_STATUS', ...message, busy: running || waitingForCommit || A.busy() });
      if (!running && !waitingForCommit) widget(!runtimeReady() ? 'Cần Reload extension để nạp bản full size' : A.editor() && !A.signedOut() ? 'Sẵn sàng nhận việc' : 'Đăng nhập để nhận việc');
    } catch (error) {
      if (error.message.includes('register')) tabId = '';
      if (/context invalidated/i.test(error.message)) stopped = true;
    }
  }
  function assertActive() { if (revoked) throw new Error('Tác vụ đã được thu hồi.'); }
  async function until(check, timeout, message) {
    const start = Date.now();
    while (Date.now() - start < timeout) { assertActive(); const value = check(); if (value) return value; await pause(400); }
    throw new Error(message);
  }
  async function progress(step, amount) {
    assertActive(); widget(step);
    await coordinator({ action: 'EXECUTOR_EVENT', task_id: task.id, attempt_id: task.attempt_id,
      kind: 'progress', payload: { step, progress: amount } });
  }
  async function attach(images) {
    const el = A.editor();
    const existing = document.querySelectorAll('fieldset [data-test-id="uploaded-img"], .input-area [data-test-id="uploaded-img"]');
    if (existing.length) throw new Error('Ô nhập đang có ảnh nháp. Xóa ảnh nháp trước khi nhận tác vụ.');
    const files = [];
    for (const [index, value] of images.entries()) {
      const src = typeof value === 'string' ? value : value?.url || value?.data;
      if (!src) throw new Error('Ảnh tham chiếu không hợp lệ.');
      let response;
      try {
        const r = await fetch(src); if (!r.ok) throw new Error('Reference download failed'); response = await r.blob();
      } catch (_) {
        const r = await chrome.runtime.sendMessage({ action: 'PROXY_FETCH_BLOB', url: src });
        if (!r?.ok) throw new Error('Không tải được ảnh tham chiếu.');
        response = await (await fetch(r.dataUrl)).blob();
      }
      if (!response.type.startsWith('image/')) throw new Error('Dữ liệu tham chiếu không phải ảnh.');
      files.push(new File([response], `reference-${index + 1}.${response.type.includes('png') ? 'png' : 'jpg'}`, { type: response.type }));
    }
    const transfer = new DataTransfer(); files.forEach(file => transfer.items.add(file));
    el.focus(); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }));
    await until(() => {
      const input = el.closest('input-area') || el.closest('fieldset') || document;
      const previews = input.querySelectorAll('[data-test-id="uploaded-img"], user-query-file-preview img, .file-preview-container img');
      const uploading = input.querySelector('[role="progressbar"], mat-progress-spinner');
      return previews.length >= files.length && !uploading;
    }, 45000, 'Gemini chưa nhận đủ ảnh tham chiếu. Prompt chưa được gửi.');
  }
  async function newChat() {
    const before = conversationId();
    const button = [...document.querySelectorAll('a[href="/app"], button[aria-label], a[aria-label], [data-test-id="new-chat-button"]')]
      .find(el => A.visible(el) && (el.matches('[data-test-id="new-chat-button"]') || /^(new chat|cuộc trò chuyện mới|đoạn chat mới)$/i.test(el.getAttribute('aria-label') || el.textContent.trim())));
    if (!button) throw new Error('Không thấy nút mở hội thoại Gemini mới.');
    button.click();
    await until(() => A.editor() && !A.busy() && !conversationId() && (!before || A.responses().length === 0), 20000, 'Hội thoại mới chưa sẵn sàng; chưa gửi prompt.');
  }
  async function execute(assignment) {
    task = assignment; running = true; revoked = false;
    try {
      if (!runtimeReady()) throw new Error('Cần Reload extension bản 5.6 trước khi nhận tác vụ full size.');
      await coordinator({ action: 'FOCUS_SELF' });
      await until(() => A.editor() && !A.signedOut() && !A.busy(), 60000, 'Gemini chưa sẵn sàng. Kiểm tra đăng nhập.');
      // Generation always reuses this conversation. Only the separate manual action can open a new one.
      const prompt = String(task.prompt || '').trim();
      if (!prompt) throw new Error('Prompt đang trống.');
      if ((A.editor().innerText || '').trim()) throw new Error('Ô nhập đang có nội dung nháp. Xóa nháp trước khi nhận tác vụ.');
      const before = A.snapshot();
      const images = task.reference_images || task.images || (task.image ? [task.image] : []);
      if (images.length) { await progress('Đang đính kèm ảnh tham chiếu…', 25); await attach(images); }
      A.setPrompt(prompt);
      const send = await until(A.sendButton, 12000, 'Không thấy nút Gửi Gemini. Prompt chưa được gửi.');
      assertActive();
      // Mark submission before clicking; never automatically submit this assignment twice.
      await progress('Đang gửi yêu cầu vào Gemini…', 50);
      send.click();
      const imageJob = task.expected_output === 'image' || ['create', 'edit_full', 'edit_inpaint', 'image_gen'].includes(task.type || task.job_type);
      const start = Date.now(); let stable = '', stableSince = 0, payload;
      while (Date.now() - start < 600000) {
        assertActive();
        const fresh = A.freshImages(before).at(-1);
        if (fresh && !A.busy()) {
          const signature = `${A.imageSource(fresh)}:${fresh.naturalWidth}:${fresh.naturalHeight}`;
          if (signature !== stable) { stable = signature; stableSince = Date.now(); }
          if (Date.now() - stableSince >= 4000) {
            await progress('Đang tải ảnh gốc và xử lý watermark…', 97);
            const full = await A.fullSizeImage(fresh);
            payload = { status: 'completed', response_type: 'image', output_type: 'image', image_base64: full.dataUrl,
              outputs: [{ type: 'image', mime_type: 'image/png', width: full.width, height: full.height, variant: full.variant, watermark: full.watermark }] };
            break;
          }
        } else if (!imageJob && !A.busy()) {
          const response = A.responses().filter(el => !before.responses.has(el)).at(-1);
          const text = response?.innerText?.trim();
          if (text && text !== stable) { stable = text; stableSince = Date.now(); }
          if (text && Date.now() - stableSince >= 4000) { payload = { status: 'completed', response_type: 'text_code', output_type: 'text', text, outputs: [{ type: 'text', text }] }; break; }
        }
        if ((Date.now() - start) % 12000 < 900) await progress('Đang chờ kết quả Gemini…', Math.min(95, 55 + Math.floor((Date.now() - start) / 8000)));
        await pause(800);
      }
      if (!payload) throw new Error('Hết thời gian chờ ảnh Gemini. Không gửi lại prompt tự động.');
      waitingForCommit = true;
      const result = await coordinator({ action: 'RESULT_READY', task_id: task.id, attempt_id: task.attempt_id,
        payload: { ...payload, request_code: task.request_code || task.id, prompt: task.prompt, usage: { total_tokens: 0, cost_usd: 0, cost_vnd: 0 } } });
      if (result.committed) waitingForCommit = false;
      widget(result.committed ? 'Đã gửi kết quả về server' : 'Đã lưu kết quả; chờ server xác nhận');
    } catch (error) {
      if (!revoked) {
        waitingForCommit = true;
        try {
          const result = await coordinator({ action: 'RESULT_READY', task_id: assignment.id, attempt_id: assignment.attempt_id,
            payload: { status: 'failed', output_type: 'error', error: error.message } });
          if (result.committed) waitingForCommit = false;
        } catch (_) { widget('Cần kiểm tra kết nối; không gửi lại prompt.'); }
      }
    } finally { running = false; if (!waitingForCommit || revoked) task = null; }
  }
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.action === 'EXECUTE_JOB') {
      if (running || waitingForCommit || !tabId) { reply({ ok: false, error: 'Tab Gemini chưa rảnh.' }); return; }
      running = true; reply({ ok: true }); void execute(message.task);
    } else if (message.action === 'RESULT_COMMITTED' && (!task || task.id === message.task_id)) {
      waitingForCommit = false; if (!running) task = null; reply({ ok: true });
    } else if (message.action === 'ASSIGNMENT_REVOKED' && (!task || task.id === message.task_id)) {
      revoked = true; waitingForCommit = false; if (!running) task = null; reply({ ok: true });
    } else if (message.action === 'TRIGGER_NEW_CHAT') {
      if (running || waitingForCommit) { reply({ ok: false, error: 'Tab Gemini đang bận.' }); return; }
      newChat().then(() => reply({ ok: true }), error => reply({ ok: false, error: error.message })); return true;
    } else if (message.action === 'BRIDGE_WAKEUP') { reply({ ok: true, isProcessing: running || waitingForCommit }); }
  });
  void heartbeat(); setInterval(heartbeat, 5000);
})();
