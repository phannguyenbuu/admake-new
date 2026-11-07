// Content Script cho ChatGPT AI Studio & Worker Bridge v4.0
// Kết hợp: Vision & Text Query, Trích xuất Ruby SketchUp 3D, Tạo ảnh DALL-E & Sửa ảnh, Định tuyến PC (Target PC)
// Khắc phục triệt để lỗi kẹt New Chat & dính hội thoại cũ bằng cơ chế Clean Session Isolation.

console.log("[ChatGPT AI Bridge v4.0] Content Script đã nạp trên chatgpt.com!");

// --------------------------------------------------------------------------
// 0. CẤU HÌNH & TRẠNG THÁI TOÀN CỤC
// --------------------------------------------------------------------------
// Tạo tên máy mặc định dựa trên OS
function getDefaultPcName(wid) {
  const ua = navigator.userAgent || "";
  let os = "PC";
  if (/Windows/i.test(ua)) os = "WIN_PC";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "MAC";
  else if (/Linux/i.test(ua)) os = "LINUX";
  return `${os}_${wid.slice(-4).toUpperCase()}`;
}

let SERVER_URL = "http://127.0.0.1:6002";
let WORKER_ID = "worker_" + Math.random().toString(36).substring(2, 9);
let PC_NAME = getDefaultPcName(WORKER_ID); // Tên máy tính cấu hình riêng (Target PC)
let WORKER_NAME = `Máy ${PC_NAME}`;
let ACCOUNT_LABEL = "ChatGPT Plus";
let AUTO_POLL = true;
let CAPABILITY_IMAGE = true;
let CAPABILITY_VISION = true;
let CAPABILITY_RUBY = true;

let isProcessing = false;
let TAB_ID = '';
let activeAttemptId = null;
let resultAwaitingCommit = false;
let executionRunning = false;
let assignmentRevoked = false;
function assertAssignmentActive() {
  if (assignmentRevoked) throw new Error('Tác vụ đã được server thu hồi');
}
async function coordinatorMessage(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || 'Coordinator unavailable');
  return response;
}
function releaseExecutor() {
  isProcessing = false;
  resultAwaitingCommit = false;
  activeTaskId = null;
  activeAttemptId = null;
  activeRequestCode = null;
  currentTaskSnapshot = null;
  updateWidgetStatus();
}
async function registerExecutor() {
  const email = await detectChatGptAccount();
  const result = await coordinatorMessage({ action: 'REGISTER_EXECUTOR', account_email: email,
    ready: !!findChatGptEditor(), conversation_id: location.pathname.match(/\/c\/([^/]+)/)?.[1] || null });
  TAB_ID = result.tab_id;
  isProcessing = result.blocked;
  updateWidgetStatus();
}
async function executorHeartbeat() {
  try {
    if (!TAB_ID) return await registerExecutor();
    await coordinatorMessage({ action: 'EXECUTOR_STATUS', account_email: await detectChatGptAccount(),
      ready: !!findChatGptEditor(), busy: isProcessing, conversation_id: location.pathname.match(/\/c\/([^/]+)/)?.[1] || null });
    updateWidgetStatus();
  } catch (error) {
    if (error.message.includes('register')) TAB_ID = '';
  }
}
let activeTaskId = null;
let activeRequestCode = null;
let lastCompletedRequestCode = null;
const BRIDGE_TYPE = "chatgpt_unified_bridge";
const PROTOCOL_VERSION = "v4.0";
const REQUEST_PREFIX = "UB4";
let currentTaskSnapshot = null;
let DETECTED_EMAIL = null;
let lastDetectEmailTime = 0;

// Tải cấu hình từ chrome.storage.local
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get([
    "serverUrl", "workerId", "workerName", "pcName", "accountLabel",
    "autoPoll", "capImage", "capVision", "capRuby"
  ], (items) => {
    if (items.serverUrl) {
      SERVER_URL = items.serverUrl.replace(/\/+$/, "");
    } else {
      chrome.storage.local.set({ serverUrl: SERVER_URL });
    }

    if (items.workerId) {
      WORKER_ID = items.workerId;
    } else {
      chrome.storage.local.set({ workerId: WORKER_ID });
    }

    if (items.pcName) {
      PC_NAME = items.pcName.trim().toUpperCase();
    } else {
      PC_NAME = getDefaultPcName(WORKER_ID);
      chrome.storage.local.set({ pcName: PC_NAME });
    }

    if (items.workerName) {
      WORKER_NAME = items.workerName;
    } else {
      WORKER_NAME = `Máy ${PC_NAME}`;
      chrome.storage.local.set({ workerName: WORKER_NAME });
    }

    if (items.accountLabel) ACCOUNT_LABEL = items.accountLabel;
    if (typeof items.autoPoll === "boolean") AUTO_POLL = items.autoPoll;
    if (typeof items.capImage === "boolean") CAPABILITY_IMAGE = items.capImage;
    if (typeof items.capVision === "boolean") CAPABILITY_VISION = items.capVision;
    if (typeof items.capRuby === "boolean") CAPABILITY_RUBY = items.capRuby;

    console.log(`[AI Bridge v4.0] Cấu hình: Server=${SERVER_URL} | PC=${PC_NAME} | Worker=${WORKER_ID} (${WORKER_NAME}) | AutoPoll=${AUTO_POLL}`);
    updateWidgetStatus();
  });
}

// Lắng nghe cập nhật từ Popup hoặc Background
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'EXECUTE_JOB') {
      if (isProcessing || !TAB_ID) { sendResponse({ ok: false, error: 'Tab is not idle' }); return; }
      isProcessing = true;
      assignmentRevoked = false;
      sendResponse({ ok: true });
      executeTask(msg.task);
      return;
    }
    if (msg.action === 'RESULT_COMMITTED') {
      if (!activeTaskId || activeTaskId === msg.task_id) {
        resultAwaitingCommit = false;
        if (!executionRunning) releaseExecutor();
      }
      sendResponse({ ok: true });
      return;
    }
    if (msg.action === 'ASSIGNMENT_REVOKED') {
      assignmentRevoked = true;
      resultAwaitingCommit = false;
      if (!executionRunning) releaseExecutor();
      sendResponse({ ok: true });
      return;
    }
    if (msg.action === "BRIDGE_WAKEUP") {
      if (sendResponse) sendResponse({ status: "alive", isProcessing });
      return true;
    }
    if (msg.action === "UPDATE_CONFIG") {
      if (msg.serverUrl) SERVER_URL = msg.serverUrl.replace(/\/+$/, "");
      if (msg.pcName) PC_NAME = msg.pcName.trim().toUpperCase();
      if (msg.workerName) WORKER_NAME = msg.workerName;
      if (msg.accountLabel) ACCOUNT_LABEL = msg.accountLabel;
      if (typeof msg.autoPoll === "boolean") AUTO_POLL = msg.autoPoll;
      if (typeof msg.capImage === "boolean") CAPABILITY_IMAGE = msg.capImage;
      if (typeof msg.capVision === "boolean") CAPABILITY_VISION = msg.capVision;
      if (typeof msg.capRuby === "boolean") CAPABILITY_RUBY = msg.capRuby;
      updateWidgetStatus();
      if (sendResponse) sendResponse({ ok: true });
      return true;
    }
    if (msg.action === "TRIGGER_NEW_CHAT") {
      if (isProcessing) { sendResponse({ ok: false, error: 'Tab đang xử lý tác vụ' }); return; }
      ensureCleanNewChat().then((ok) => {
        if (sendResponse) sendResponse({ ok });
      }).catch(error => sendResponse({ ok: false, error: error.message }));
      return true;
    }
  });
}

// Helper fetch an toàn qua Background (Bỏ qua Mixed Content & CORS)
async function bridgeFetch(url, options = {}) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: "PROXY_FETCH", url, options }, (response) => {
        if (chrome.runtime.lastError || !response) {
          fetch(url, options)
            .then(async (r) => {
              const ct = r.headers.get("content-type") || "";
              const data = ct.includes("application/json") ? await r.json() : await r.text();
              resolve({ ok: r.ok, status: r.status, json: async () => data, text: async () => typeof data === "string" ? data : JSON.stringify(data) });
            })
            .catch((err) => {
              resolve({ ok: false, status: 0, json: async () => ({ error: err.message }), text: async () => err.message });
            });
          return;
        }
        resolve({
          ok: response.ok,
          status: response.status,
          json: async () => response.data,
          text: async () => typeof response.data === "string" ? response.data : JSON.stringify(response.data)
        });
      });
    } catch (e) {
      fetch(url, options)
        .then(async (r) => {
          const ct = r.headers.get("content-type") || "";
          const data = ct.includes("application/json") ? await r.json() : await r.text();
          resolve({ ok: r.ok, status: r.status, json: async () => data, text: async () => typeof data === "string" ? data : JSON.stringify(data) });
        })
        .catch((err) => {
          resolve({ ok: false, status: 0, json: async () => ({ error: err.message }), text: async () => err.message });
        });
    }
  });
}

// Nhận diện tài khoản ChatGPT đăng nhập
async function detectChatGptAccount() {
  if (Date.now() - lastDetectEmailTime < 10000) return DETECTED_EMAIL;
  DETECTED_EMAIL = null;
  lastDetectEmailTime = Date.now();

  try {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      if (data?.user?.email) {
        DETECTED_EMAIL = data.user.email;
        return DETECTED_EMAIL;
      }
    }
  } catch (e) {}

  try {
    const profileBtn = document.querySelector('button[data-testid="profile-button"]')
                    || document.querySelector('[data-testid*="user-profile"]')
                    || document.querySelector('nav [aria-haspopup="menu"]');
    if (profileBtn) {
      const text = profileBtn.innerText || profileBtn.textContent || "";
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) {
        DETECTED_EMAIL = match[0];
        return DETECTED_EMAIL;
      }
    }
  } catch (e) {}

  return null;
}

function simulateClick(el) {
  if (!el) return false;
  try {
    el.scrollIntoView({ block: "center", inline: "center" });
    const opts = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.dispatchEvent(new MouseEvent("click", opts));
    return true;
  } catch (e) {
    try { el.click(); return true; } catch (err) { return false; }
  }
}

function isChatGptGenerating() {
  return Array.from(document.querySelectorAll('button[data-testid="stop-button"], button[aria-label]')).some(button =>
    isVisibleChatElement(button) && !button.disabled && (button.dataset.testid === 'stop-button' ||
      /^(stop generating|stop streaming|stop response|dừng tạo|dừng phản hồi|dừng trả lời)/i.test(button.getAttribute('aria-label') || '')));
}

function findChatGptEditor() {
  const selectors = [
    '#prompt-textarea',
    'div#prompt-textarea',
    'div[contenteditable="true"][data-placeholder]',
    'div[contenteditable="true"].ProseMirror',
    'div[contenteditable="true"]',
    'textarea[data-id="root"]',
    'textarea[tabindex="0"]',
    'form textarea',
    'div[role="textbox"]'
  ];

  for (const sel of selectors) {
    const el = Array.from(document.querySelectorAll(sel)).find(isVisibleChatElement);
    if (el) {
      if (el.closest('nav') || el.closest('[data-testid*="sidebar"]')) continue;
      return el;
    }
  }
  return null;
}

function dismissAnyPopups() {
  try {
    for (const sel of ['button[aria-label="Đóng" i]', 'button[aria-label="Close" i]', 'button[aria-label="Dismiss" i]']) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) btn.click();
    }
  } catch (e) {}
}

async function waitForEditorReady(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    dismissAnyPopups();

    if (isChatGptGenerating()) {
      await new Promise((r) => setTimeout(r, 600));
      continue;
    }

    const editor = findChatGptEditor();
    if (editor) {
      try { editor.scrollIntoView({ block: "nearest" }); } catch (e) {}
      await new Promise((r) => setTimeout(r, 200));
      return editor;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return findChatGptEditor();
}

// --------------------------------------------------------------------------
// 1. CƠ CHẾ DỌN DẸP SẠCH PROSEMIRROR & KHẮC PHỤC TRIỆT ĐỂ LỖI KẸT HỘI THOẠI
// --------------------------------------------------------------------------

// Xóa triệt để nội dung ô soạn thảo & file đính kèm
async function clearComposerThoroughly() {
  // 1. Xóa các nút attachment cũ trong form
  const composer = document.querySelector("form") || document.querySelector("#prompt-textarea")?.closest("div");
  if (composer) {
    const removeButtons = Array.from(composer.querySelectorAll(
      'button[aria-label*="xóa" i], button[aria-label*="remove" i], button[aria-label*="delete" i], button[aria-label*="bỏ" i]'
    ));
    removeButtons.forEach((btn) => { try { btn.click(); } catch (e) {} });
  }

  // 2. Gọi MAIN world để xóa sạch ProseMirror transaction
  try {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "CLEAR_PROSEMIRROR" }, () => resolve());
    });
  } catch (e) {}

  // 3. Xóa trên DOM cô lập
  const editor = document.querySelector("#prompt-textarea");
  if (editor) {
    try {
      editor.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.addRange(range);
      }
      document.execCommand("delete", false, null);
      editor.innerHTML = "<p><br></p>";
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    } catch (e) {}
  }
}

// ĐẢM BẢO MỞ PHIÊN MỚI 100% SẠCH (Clean Session Guarantee)
// Giải quyết triệt để vấn đề: "tự tạo hội thoại mới nhưng lại gắn truy vấn hội thoại cũ, khiến kẹt"
function isVisibleChatElement(element) {
  return !!element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
}

function isCleanConversationReady() {
  // A blank project/GPT composer may have a welcome article. Those are not messages.
  if (/\/c\/[^/]+/.test(location.pathname) || isChatGptGenerating()) return false;
  const editor = findChatGptEditor();
  if (!isVisibleChatElement(editor) || editor.getAttribute('aria-disabled') === 'true') return false;
  const messages = document.querySelectorAll('main [data-message-author-role], main [data-user-message-bubble="true"], main [data-testid^="conversation-turn-"], main .user-turn, main .agent-turn');
  return !Array.from(messages).some(isVisibleChatElement);
}

async function ensureCleanNewChat() {
  try { await coordinatorMessage({ action: 'FOCUS_SELF' }); } catch { /* DOM checks still guard every action. */ }
  updateWidgetText('Đang mở hội thoại mới…', '#3b82f6');
  const idleDeadline = Date.now() + 30000;
  while (isChatGptGenerating() && Date.now() < idleDeadline) {
    assertAssignmentActive();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (isChatGptGenerating()) throw new Error('ChatGPT vẫn đang trả lời; chưa mở chat mới');
  await clearComposerThoroughly();
  const selectors = [
    '[data-testid="create-new-chat-button"]', '[data-testid="navigation-new-chat-button"]', '[data-testid="new-chat-button"]',
    'button[data-testid*="new-chat"]', 'a[data-testid*="new-chat"]',
    'button[aria-label*="New chat" i]', 'a[aria-label*="New chat" i]',
    'button[aria-label*="Cuộc trò chuyện mới" i]', 'a[aria-label*="Cuộc trò chuyện mới" i]',
    'button[aria-label*="Đoạn chat mới" i]', 'a[aria-label*="Đoạn chat mới" i]',
    'button[aria-label*="Trò chuyện mới" i]', 'a[aria-label*="Trò chuyện mới" i]',
    'button[title*="New chat" i]', 'a[title*="New chat" i]'
  ];
  const deadline = Date.now() + 30000;
  const startedAt = Date.now();
  let clickedAt = 0;
  let stableSince = 0;
  while (Date.now() < deadline) {
    assertAssignmentActive();
    if (isCleanConversationReady()) {
      stableSince ||= Date.now();
      if (Date.now() - stableSince >= 750) {
        await clearComposerThoroughly();
        if (isCleanConversationReady()) {
          findChatGptEditor().focus();
          updateWidgetText('Đã mở hội thoại mới', '#10b981');
          return true;
        }
      }
    } else {
      stableSince = 0;
      if (!clickedAt || Date.now() - clickedAt > 8000) {
        let button = selectors.map(selector => Array.from(document.querySelectorAll(selector)).find(isVisibleChatElement)).find(Boolean);
        if (!button) button = Array.from(document.querySelectorAll('a, button')).find(element =>
          isVisibleChatElement(element) && !element.closest('main, #toolx-unified-bridge-widget') && /^(new chat|cuộc trò chuyện mới|đoạn chat mới|trò chuyện mới)(\s|$)/i.test((element.textContent || '').trim()));
        // Restrict home fallback to navigation; never click an arbitrary content link.
        if (!button) button = Array.from(document.querySelectorAll('nav a[href="/"], aside a[href="/"], [data-testid*="sidebar"] a[href="/"]')).find(isVisibleChatElement);
        if (button) { button.click(); clickedAt = Date.now(); }
      }
      // A collapsed/changed sidebar must not strand a job. The coordinator owns
      // one pre-submit navigation and resumes the same lease in the new document.
      if (activeTaskId && !currentTaskSnapshot?._clean_navigation_attempted && Date.now() - startedAt >= 8000) {
        await coordinatorMessage({ action: 'NAVIGATE_CLEAN_CHAT', task_id: activeTaskId, attempt_id: activeAttemptId });
        const navigation = new Error('Đang chuyển sang hội thoại mới trước khi gửi prompt');
        navigation.code = 'CLEAN_CHAT_NAVIGATION';
        throw navigation;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Không mở được hội thoại mới: hãy bấm New chat trong tab ChatGPT rồi thử lại. Prompt chưa được gửi.');
}

// --------------------------------------------------------------------------
// 2. CHÈN TEXT & ĐÍNH KÈM HÌNH ẢNH AN TOÀN
// --------------------------------------------------------------------------

function getTaskReferenceImages(task) {
  const raw = task.reference_images || task.images || (task.image_url ? [task.image_url] : []);
  if (!Array.isArray(raw)) throw new Error('Danh sách ảnh nguồn không hợp lệ');
  const images = raw.map((item, index) => {
    const value = typeof item === 'string' ? item : item && typeof item === 'object' ? (item.data || item.dataUrl || item.url || item.src) : null;
    if (typeof value !== 'string' || !/^(data:image\/|https?:\/\/)/i.test(value.trim())) {
      throw new Error(`Ảnh nguồn ${index + 1} không hợp lệ; không gửi prompt thiếu ảnh`);
    }
    return typeof item === 'string' ? value.trim() : { ...item, data: value.trim() };
  });
  if (['edit_full', 'edit_inpaint'].includes(task.type) && !images.length) {
    throw new Error('Tác vụ sửa ảnh thiếu ảnh nguồn; đã chặn gửi prompt');
  }
  return images;
}

function countComposerAttachments() {
  const composer = document.querySelector("form") || document.querySelector("#prompt-textarea")?.closest("form") || document.querySelector("#prompt-textarea")?.closest("div");
  if (!composer) return 0;
  const imgs = Array.from(composer.querySelectorAll("img")).filter((img) => {
    const src = img.src || "";
    if (src.includes("avatar") || src.startsWith("data:image/svg")) return false;
    if (img.naturalWidth > 0 && img.naturalWidth <= 40) return false;
    return !img.closest("#prompt-textarea");
  });
  if (imgs.length > 0) return imgs.length;

  const removeButtons = Array.from(composer.querySelectorAll('button[aria-label*="xóa" i], button[aria-label*="remove" i], button[aria-label*="delete" i], button[aria-label*="bỏ" i]'));
  if (removeButtons.length > 0) return removeButtons.length;

  const testIds = composer.querySelectorAll('[data-testid*="attachment"], [data-testid*="file-item"]');
  return testIds.length;
}

async function itemToFile(item, defaultBaseName = "ref_image") {
  let dataUrl = "";
  if (typeof item === "string") {
    dataUrl = item.trim();
  } else if (item && typeof item === "object") {
    dataUrl = item.data || item.dataUrl || item.url || item.src || "";
  }
  if (!dataUrl) return null;

  if (dataUrl.startsWith("http")) {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "PROXY_FETCH_BLOB", url: dataUrl }, (r) => resolve(r));
    });
    if (res && res.ok && res.dataUrl) {
      dataUrl = res.dataUrl;
    }
  }

  if (dataUrl.startsWith("data:")) {
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
    const b64Data = dataUrl.split(",")[1];
    const byteChars = atob(b64Data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], `${defaultBaseName}_${Date.now()}.${ext}`, { type: mimeType });
  }

  return null;
}

// ChatGPT only renders pasted attachments while the tab is visible; hidden tabs time out at 30 s.
async function bringTabToFront() {
  if (document.visibilityState === "visible") return;
  try { await coordinatorMessage({ action: "FOCUS_SELF" }); } catch (e) { console.warn("[AI Bridge] Không đưa được tab lên trước:", e.message); }
  const deadline = Date.now() + 5000;
  while (document.visibilityState !== "visible" && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
}

async function attachReferenceImages(imagesList) {
  if (!imagesList || imagesList.length === 0) return true;
  await bringTabToFront();
  console.log(`[AI Bridge v4.0] Đang nạp ${imagesList.length} ảnh đính kèm...`);
  updateWidgetText(`Đang đính kèm ${imagesList.length} ảnh...`, "#3b82f6");

  const files = [];
  for (let i = 0; i < imagesList.length; i++) {
    const f = await itemToFile(imagesList[i], `ref_img_${i + 1}`);
    if (!f) throw new Error(`Không đọc được ảnh nguồn ${i + 1}; đã chặn gửi prompt`);
    files.push(f);
  }
  if (files.length === 0) return false;

  const editor = await waitForEditorReady(8000);
  if (!editor) throw new Error("Không tìm thấy ô soạn thảo ChatGPT (#prompt-textarea).");

  let attached = false;
  editor.focus();

  // 1. Thử ClipboardEvent paste
  try {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    const pasteEvt = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
    editor.dispatchEvent(pasteEvt);
  } catch (e) {}

  for (let w = 0; w < 20; w++) {
    await new Promise((r) => setTimeout(r, 200));
    if (countComposerAttachments() > 0) {
      attached = true;
      break;
    }
  }

  // 2. Thử Drag & Drop nếu paste chưa nhận
  if (!attached && countComposerAttachments() === 0) {
    const target = editor.closest("form") || editor;
    try {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      target.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
    } catch (e) {}

    for (let w = 0; w < 15; w++) {
      await new Promise((r) => setTimeout(r, 200));
      if (countComposerAttachments() > 0) {
        attached = true;
        break;
      }
    }
  }

  // 3. Thử qua input[type="file"]
  if (!attached && countComposerAttachments() === 0) {
    let fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) {
      const attachBtn = document.querySelector('button[data-testid*="attach"], button[aria-label*="Đính kèm" i], button[aria-label*="Attach" i]');
      if (attachBtn) {
        simulateClick(attachBtn);
        await new Promise((r) => setTimeout(r, 300));
        fileInput = document.querySelector('input[type="file"]');
      }
    }
    if (fileInput) {
      try {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        attached = true;
      } catch (e) {}
    }
    // Đóng menu đính kèm nếu vô tình bị mở ra
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
  }

  // 4. Chờ upload ảnh hoàn tất
  const uploadDeadline = Date.now() + 30000;
  while (Date.now() < uploadDeadline) {
    if (countComposerAttachments() >= files.length && await waitForUploadToComplete(2000)) return true;
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Chưa đính kèm đủ ${files.length} ảnh tham chiếu${document.visibilityState === "visible" ? "" : " (tab ChatGPT đang bị ẩn)"}`);
}

// Chờ các file đính kèm upload hoàn tất
async function waitForUploadToComplete(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const composer = document.querySelector("form") || document.querySelector("#prompt-textarea")?.closest("div");
    if (!composer) break;
    const isUploading = composer.querySelector('[class*="loading"], [class*="spinner"], [role="progressbar"], svg.animate-spin, [aria-label*="loading" i], [aria-label*="đang tải" i]');
    if (!isUploading) {
      await new Promise((r) => setTimeout(r, 500));
      return true;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

// Tìm nút gửi tin nhắn đa năng trên ChatGPT
function findSendButton() {
  const editor = findChatGptEditor();
  if (!editor) return null;
  const form = editor.closest('form');
  const scope = form || editor.closest('[data-testid*="composer"]') || editor.parentElement?.parentElement;
  if (!scope) return null;
  const visible = Array.from(scope.querySelectorAll('button')).filter(isVisibleChatElement);
  const exact = visible.find(button => ['send-button', 'fruitjuice-send-button', 'composer-submit-button'].includes(button.getAttribute('data-testid')));
  if (exact) return exact;
  const labelled = visible.find(button => /^(send(?: message| prompt)?|gửi(?: tin nhắn)?|submit)$/i.test((button.getAttribute('aria-label') || button.getAttribute('title') || '').trim()));
  if (labelled) return labelled;
  return visible.find(button => button.type === 'submit' && !/voice|stop|microphone|dừng|giọng nói/i.test(button.getAttribute('aria-label') || '')) || null;
}

function userMessageCandidates() {
  return Array.from(document.querySelectorAll('[data-message-author-role="user"], [data-conversation-role="user"], [data-user-message-bubble="true"], .user-turn, [data-testid*="user-message"]')).filter(isVisibleChatElement);
}

function submissionSnapshot() {
  return {
    turns: new Map(Array.from(document.querySelectorAll('main [data-testid^="conversation-turn-"]')).map(element => [element, (element.innerText || element.textContent || '').trim()])),
    users: new Map(userMessageCandidates().map(element => [element, (element.innerText || element.textContent || '').trim()])),
    assistants: new Map(getAssistantTurns().filter(isVisibleChatElement).map(element => [element, (element.innerText || element.textContent || '').trim()])),
    generating: isChatGptGenerating()
  };
}

function hasSubmissionEvidence(before, prompt) {
  const normalize = text => (text || '').replace(/\s+/g, ' ').trim();
  const expected = normalize(prompt);
  const matches = text => expected && normalize(text).includes(expected);
  for (const element of userMessageCandidates()) {
    const text = (element.innerText || element.textContent || '').trim();
    if ((!before.users.has(element) || before.users.get(element) !== text) && matches(text)) return true;
  }
  // Some ChatGPT layouts expose only conversation-turn wrappers.
  for (const element of document.querySelectorAll('main [data-testid^="conversation-turn-"]')) {
    if (!isVisibleChatElement(element) || element.querySelector('[data-message-author-role="assistant"], [data-conversation-role="assistant"]')) continue;
    const text = (element.innerText || element.textContent || '').trim();
    if ((!before.turns.has(element) || before.turns.get(element) !== text) && element.querySelector('button[data-testid*="edit"], button[aria-label*="Edit message" i], button[aria-label*="Chỉnh sửa" i]') && matches(text)) return true;
  }
  const editor = findChatGptEditor();
  const empty = editor && !normalize(editor.tagName === 'TEXTAREA' ? editor.value : editor.innerText);
  // Empty composer alone is insufficient; require a fresh generation/assistant too.
  if (empty && !before.generating && isChatGptGenerating()) return true;
  if (empty) {
    for (const element of getAssistantTurns().filter(isVisibleChatElement)) {
      const text = (element.innerText || element.textContent || '').trim();
      if (text && (!before.assistants.has(element) || before.assistants.get(element) !== text)) return true;
    }
  }
  return false;
}

// Chèn Prompt vào ProseMirror và bấm Gửi (Đảm bảo thay thế 100%, có cơ chế kích hoạt React state & xác nhận gửi)
async function insertPromptAndSend(promptText, expectedAttachments = 0) {
  assertAssignmentActive();
  const editor = await waitForEditorReady(15000);
  if (!editor) throw new Error("Không tìm thấy ô nhập prompt trên ChatGPT (#prompt-textarea).");

  editor.focus();
  await new Promise((r) => setTimeout(r, 150));

  // 0. Đảm bảo selection nằm trong editor
  try {
    const p = editor.querySelector('p') || editor;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      sel.addRange(range);
    }
  } catch (e) {}

  let textInserted = false;

  // 1. Chèn qua MAIN world injection (thay thế sạch doc từ 0 đến size)
  try {
    const res = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 2000);
      chrome.runtime.sendMessage({ action: "INSERT_PROSEMIRROR_TEXT", prompt: promptText }, (r) => {
        clearTimeout(timer);
        resolve(r);
      });
    });
    if (res && res.ok && res.result?.textInserted) {
      textInserted = true;
      console.log("[AI Bridge v4.0] Đã chèn prompt qua MAIN world ProseMirror!");
    }
  } catch (e) {}

  // 2. Fallback nếu MAIN world chưa thành công
  if (!textInserted) {
    try {
      editor.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.addRange(range);
      }
      document.execCommand("insertText", false, promptText);
      await new Promise((r) => setTimeout(r, 150));
      const cur = (editor.tagName === "TEXTAREA" ? editor.value : editor.innerText).trim();
      if (cur.length > 0) textInserted = true;
    } catch (e) {}
  }

  // 3. Fallback Synthetic Clipboard Paste
  if (!textInserted) {
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", promptText);
      const pasteEvt = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
      editor.dispatchEvent(pasteEvt);
      await new Promise((r) => setTimeout(r, 200));
      const cur = (editor.tagName === "TEXTAREA" ? editor.value : editor.innerText).trim();
      if (cur.length > 0) textInserted = true;
    } catch (e) {}
  }

  // Fallback gán value nếu là textarea/input
  if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
    editor.value = promptText;
  }

  editor.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  editor.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  await new Promise((r) => setTimeout(r, 300));

  // Đếm số lượng tin nhắn người dùng trước khi gửi
  const initialSubmission = submissionSnapshot();

  // Chờ nút Gửi Enabled (tối đa 25s - đề phòng ảnh đang upload)
  let sendBtn = null;
  const startWait = Date.now();
  while (Date.now() - startWait < 25000) {
    sendBtn = findSendButton();
    const isDisabled = sendBtn ? (sendBtn.disabled || sendBtn.getAttribute("aria-disabled") === "true") : true;
    if (sendBtn && !isDisabled) {
      break;
    }
    // Kích hoạt nhẹ focus và input event (tuyệt đối KHÔNG gõ delete vì làm mất text/ảnh)
    if ((Date.now() - startWait) % 1500 < 300) {
      try {
        editor.focus();
        editor.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      } catch (e) {}
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  // Đảm bảo nội dung prompt vẫn còn trong ô soạn thảo trước khi nhấn gửi
  const curEditorText = (editor.tagName === "TEXTAREA" ? editor.value : editor.innerText).trim();
  if (!curEditorText || curEditorText.length === 0) {
    try {
      editor.focus();
      document.execCommand("insertText", false, promptText);
      editor.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {}
  }

  assertAssignmentActive();
  if (!sendBtn || sendBtn.disabled || sendBtn.getAttribute('aria-disabled') === 'true') {
    throw new Error('Nút gửi chưa sẵn sàng; không gửi lại tự động để tránh trùng tác vụ');
  }
  if (expectedAttachments && (countComposerAttachments() < expectedAttachments || !await waitForUploadToComplete(5000))) {
    throw new Error(`Ảnh nguồn chưa sẵn sàng (${countComposerAttachments()}/${expectedAttachments}); đã chặn gửi prompt`);
  }
  // One submission only. A blank composer alone is not proof of acceptance.
  sendBtn.click();
  const confirmStart = Date.now();
  let submitted = false;
  while (Date.now() - confirmStart < 20000) {
    assertAssignmentActive();
    if (hasSubmissionEvidence(initialSubmission, promptText)) { submitted = true; break; }
    await new Promise(r => setTimeout(r, 300));
  }
  if (!submitted) {
    const liveEditor = findChatGptEditor();
    const remaining = liveEditor ? (liveEditor.tagName === 'TEXTAREA' ? liveEditor.value : liveEditor.innerText).trim() : '';
    throw new Error(remaining ? 'ChatGPT chưa nhận prompt: chữ vẫn nằm trong ô nhập. Kiểm tra nút gửi hoặc thông báo giới hạn trong tab.' : 'Chưa xác nhận phản hồi sau khi gửi. Kiểm tra hội thoại ChatGPT trước khi gửi lại để tránh trùng.');
  }

  console.log("[AI Bridge v4.0] ✅ Đã gửi prompt thành công vào ChatGPT.");
  await new Promise((r) => setTimeout(r, 800));
  return true;
}

// --------------------------------------------------------------------------
// 3. BÓC TÁCH NỘI DUNG VĂN BẢN, CODE & MÃ RUBY SKETCHUP 3D
// --------------------------------------------------------------------------

// Lấy danh sách tất cả các turn trả lời của Assistant (Không trùng lặp, hỗ trợ cả 2025/2026)
function getAssistantTurns() {
  // 1. Selector role assistant
  const byRole = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
  if (byRole.length > 0) return byRole;

  // 2. data-conversation-role="assistant"
  const byConvRole = Array.from(document.querySelectorAll('[data-conversation-role="assistant"]'));
  if (byConvRole.length > 0) {
    return byConvRole.map((h4) => h4.closest('.block-BQZwFn') || h4.closest('div[class*="block-"]') || h4.parentElement);
  }

  // 3. data-chatgpt-agent-turn-start
  const byAgentStart = Array.from(document.querySelectorAll('[data-chatgpt-agent-turn-start]'));
  if (byAgentStart.length > 0) {
    return byAgentStart.map((sp) => sp.closest('.block-BQZwFn') || sp.closest('div[class*="block-"]') || sp.parentElement);
  }

  // 4. class agent-turn
  const byClass = Array.from(document.querySelectorAll('.agent-turn, [data-testid*="assistant-turn"]'));
  if (byClass.length > 0) return byClass;

  // 5. Thẻ article không thuộc user
  const articles = Array.from(document.querySelectorAll('article')).filter((art) => {
    return !art.querySelector('[data-message-author-role="user"]') && 
           !art.querySelector('[data-user-message-bubble="true"]') && 
           !art.classList.contains('user-turn');
  });
  if (articles.length > 0) return articles;

  // 6. Fallback: markdown
  const markdowns = Array.from(document.querySelectorAll('.markdown, [class*="markdown"]')).filter((m) => {
    return !m.closest('[data-user-message-bubble="true"]') && !m.closest('.group\\/user-message');
  });
  if (markdowns.length > 0) return markdowns;

  return [];
}

// Trích xuất mã SketchUp Ruby chuẩn nhất từ danh sách code blocks hoặc markdown text
function getBestRubyCode(codeBlocks, fullText) {
  const candidates = [];

  if (Array.isArray(codeBlocks) && codeBlocks.length > 0) {
    codeBlocks.forEach((cb) => {
      const lang = (cb.language || "").toLowerCase();
      const code = (cb.code || "").trim();
      if (!code) return;
      if (lang === "ruby" || lang === "rb" || code.includes("Sketchup") || code.includes("entities") || code.includes("def ") || code.includes("add_group")) {
        candidates.push(code);
      }
    });
  }

  if (candidates.length === 0 && fullText) {
    const matches = Array.from(fullText.matchAll(/```(?:ruby|rb)?\s*([\s\S]*?)```/gi));
    matches.forEach((m) => {
      const code = m[1].trim();
      if (code) candidates.push(code);
    });
  }

  if (candidates.length === 0) return "";

  // Tính điểm từng ứng viên để chọn đúng script dựng hình 3D hoàn chỉnh
  const scored = candidates.map((c) => {
    let score = c.length;
    if (c.includes("entities") || c.includes("add_group") || c.includes("add_face") || c.includes("pushpull")) score += 20000;
    if (c.includes("Sketchup.active_model") || c.includes("require 'sketchup.rb'")) score += 10000;
    if (c.includes("def ") && c.includes("end")) score += 5000;
    if (c.toLowerCase().startsWith("load ") && c.length < 150) score -= 30000;
    return { code: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].code;
}

function parseAssistantTurn(turnEl) {
  if (!turnEl) return null;
  const clone = turnEl.cloneNode(true);
  clone.querySelectorAll("button, svg, [role='tooltip'], .sr-only").forEach((el) => el.remove());

  const fullText = (clone.innerText || clone.textContent || "").trim();
  const codeBlocks = [];

  turnEl.querySelectorAll("pre").forEach((pre) => {
    let lang = "";
    const codeEl = pre.querySelector("code");
    if (codeEl) {
      const cls = codeEl.className || "";
      const match = cls.match(/language-([a-zA-Z0-9_-]+)/);
      if (match) lang = match[1];
    }
    const preText = (pre.innerText || pre.textContent || "").trim();
    if (preText) {
      codeBlocks.push({ language: lang, code: preText });
    }
  });

  const rubyCode = getBestRubyCode(codeBlocks, fullText);

  return {
    text: fullText,
    html: turnEl.innerHTML,
    code_blocks: codeBlocks,
    ruby_code: rubyCode,
    code_block_count: codeBlocks.length,
    char_count: fullText.length
  };
}

// Kiểm tra xem lượt trả lời của Assistant đã hoàn tất hoàn toàn chưa
function isAssistantTurnFinished(turnEl, parsed) {
  if (!turnEl || !parsed) return false;
  if (isChatGptGenerating()) return false;

  const container = turnEl.closest('article') || 
                    turnEl.closest('[data-testid*="conversation-turn"]') || 
                    turnEl.parentElement || 
                    turnEl;

  // 1. Action bar buttons
  const actionSelectors = [
    'button[aria-label*="Copy" i]', 'button[aria-label*="Sao chép" i]', 'button[data-testid*="copy"]',
    'button[aria-label*="Good response" i]', 'button[aria-label*="Phản hồi tốt" i]', 'button[aria-label*="Thích" i]', 'button[data-testid*="thumbs-up"]',
    'button[aria-label*="Bad response" i]', 'button[aria-label*="Phản hồi không tốt" i]', 'button[aria-label*="Không thích" i]', 'button[data-testid*="thumbs-down"]',
    'button[aria-label*="Read aloud" i]', 'button[aria-label*="Đọc to" i]',
    'button[aria-label*="Share" i]', 'button[aria-label*="Chia sẻ" i]',
    'button[aria-label*="Try again" i]', 'button[aria-label*="Thử lại" i]', 'button[aria-label*="Tạo lại" i]', 'button[data-testid*="retry"]',
    'button[aria-label*="Download" i]', 'button[aria-label*="Tải xuống" i]', 'button[aria-label*="Save" i]', 'button[aria-label*="Lưu" i]', 'button[data-testid*="download"]'
  ];
  const hasActionBar = actionSelectors.some((sel) => container.querySelector(sel) !== null);

  // 1.5. Kiểm tra có hình ảnh sinh ra trong turn
  const hasImage = container.querySelector("img[src*='blob:'], img[src*='oaiusercontent.com'], [data-testid*='image'], [data-testid*='dalle']") !== null;

  const text = parsed.text || "";

  // 2. Kiểm tra đóng markdown code
  const backtickMatches = text.match(/```/g);
  if (backtickMatches && backtickMatches.length % 2 !== 0) {
    return false;
  }

  // 3. Class streaming
  if (turnEl.querySelector('.result-streaming, [data-state="streaming"]')) {
    return false;
  }

  return hasActionBar || hasImage;
}

// Quét toàn trang tìm phản hồi mới nhất khi turn-based gặp sự cố DOM
function extractLatestAssistantResponse() {
  const turns = getAssistantTurns();
  if (turns.length > 0) {
    for (let i = turns.length - 1; i >= 0; i--) {
      const parsed = parseAssistantTurn(turns[i]);
      if (parsed && (parsed.text.length > 0 || parsed.code_block_count > 0)) {
        return parsed;
      }
    }
  }

  const preElements = Array.from(document.querySelectorAll('main pre, pre'));
  const codeBlocks = [];
  preElements.forEach((pre) => {
    let lang = "";
    const codeEl = pre.querySelector('code');
    if (codeEl) {
      const classes = Array.from(codeEl.classList);
      for (const cls of classes) {
        if (cls.startsWith('language-')) {
          lang = cls.replace('language-', '').trim();
          break;
        }
      }
    }
    const rawCode = (codeEl ? codeEl.innerText : pre.innerText).trim();
    if (rawCode) {
      codeBlocks.push({ language: lang || "text", code: rawCode });
    }
  });

  const markdowns = Array.from(document.querySelectorAll('main .markdown, .markdown, [class*="markdown"]')).filter((m) => {
    return !m.closest('[data-user-message-bubble="true"]') && !m.closest('.group\\/user-message');
  });

  let fullText = "";
  if (markdowns.length > 0) {
    fullText = markdowns[markdowns.length - 1].innerText.trim();
  }

  const rubyCode = getBestRubyCode(codeBlocks, fullText);

  if (fullText || codeBlocks.length > 0) {
    return {
      text: fullText,
      html: markdowns.length > 0 ? markdowns[markdowns.length - 1].innerHTML : "",
      code_blocks: codeBlocks,
      ruby_code: rubyCode,
      char_count: fullText.length,
      code_block_count: codeBlocks.length
    };
  }

  return null;
}

async function waitForAssistantResponse(turnContext = {}, timeoutMs = 240000, taskId = null) {
  console.log("[AI Bridge v4.0] ⏳ Bắt đầu theo dõi phản hồi Text & Ruby từ ChatGPT...", turnContext);
  updateWidgetText("⏳ ChatGPT đang suy nghĩ...", "#f59e0b");

  const startTime = Date.now();
  let lastTextLength = 0;
  let stableChecks = 0;
  let hasStartedStreaming = false;
  let lastProgressSent = Date.now();

  const initialCount = typeof turnContext === "object" && typeof turnContext.initialTurnCount === "number" 
    ? turnContext.initialTurnCount 
    : 0;
  const initialLastTurn = typeof turnContext === "object" ? turnContext.initialLastTurn : null;
  const initialLastText = typeof turnContext === "object" ? (turnContext.initialLastTurnText || "") : (typeof turnContext === "string" ? turnContext : "");

  while (Date.now() - startTime < timeoutMs) {
    assertAssignmentActive();
    const turns = getAssistantTurns();
    let activeTurn = null;

    if (turns.length > initialCount) {
      activeTurn = turns[turns.length - 1];
    } else if (initialCount === 0 && turns.length > 0) {
      activeTurn = turns[0];
    } else if (turns.length === initialCount && turns.length > 0) {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn !== initialLastTurn) {
        activeTurn = lastTurn;
      } else {
        const parsedOld = parseAssistantTurn(lastTurn);
        if (parsedOld && parsedOld.text && parsedOld.text !== initialLastText) {
          activeTurn = lastTurn;
        }
      }
    }

    const generating = isChatGptGenerating();
    if (generating) {
      hasStartedStreaming = true;
    }

    if (activeTurn) {
      const currentParsed = parseAssistantTurn(activeTurn);
      if (currentParsed) {
        const currentLength = currentParsed.char_count;
        const currentText = currentParsed.text;

        if (currentLength > 0 && currentText !== initialLastText) {
          hasStartedStreaming = true;
          updateWidgetText(`⚡ Đang nhận: <strong>${currentLength.toLocaleString()}</strong> ký tự (${currentParsed.code_block_count} code)...`, "#f59e0b");

          if (taskId && Date.now() - lastProgressSent > 3000) {
            lastProgressSent = Date.now();
            await sendWorkerProgress(taskId, `ChatGPT đang trả lời (${currentLength.toLocaleString()} ký tự)...`, 85);
          }
        }

        const isFinished = isAssistantTurnFinished(activeTurn, currentParsed);
        const hasImage = activeTurn.querySelector("img, [data-testid*='image'], [data-testid*='dalle']") !== null;
        const hasMeaningfulContent = currentParsed.code_block_count > 0 || currentLength > 0 || hasImage;

        // Tiêu chuẩn 1: Có Action Bar và dừng generating
        if (!generating && isFinished && hasMeaningfulContent) {
          if (currentLength === lastTextLength && (currentLength > 0 || hasImage)) {
            stableChecks++;
            if (stableChecks >= 2) {
              console.log(`[AI Bridge v4.0] 🎉 Hoàn tất Text/Ruby (Action Bar): ${currentLength} ký tự, ${currentParsed.code_block_count} khối code.`);
              updateWidgetText(`🎉 Hoàn tất: <strong>${currentLength.toLocaleString()}</strong> ký tự`, "#10b981");
              return currentParsed;
            }
          } else {
            stableChecks = 0;
            lastTextLength = currentLength;
          }
        }
        // Tiêu chuẩn 2: Không còn generating, đã streaming, độ dài ổn định 3 lần check (~2.4s) và khối code đã đóng
        else if (!generating && hasStartedStreaming && hasMeaningfulContent) {
          const text = currentParsed.text || "";
          const backtickMatches = text.match(/```/g);
          const isCodeClosed = !backtickMatches || (backtickMatches.length % 2 === 0);

          if (isCodeClosed) {
            if (currentLength === lastTextLength && currentLength > 0) {
              stableChecks++;
              if (stableChecks >= 3) {
                console.log(`[AI Bridge v4.0] 🎉 Hoàn tất Text/Ruby (Ổn định 2.4s): ${currentLength} ký tự.`);
                updateWidgetText(`🎉 Hoàn tất: <strong>${currentLength.toLocaleString()}</strong> ký tự`, "#10b981");
                return currentParsed;
              }
            } else {
              stableChecks = 0;
              lastTextLength = currentLength;
            }
          } else {
            stableChecks = 0;
          }
        } else if (generating) {
          stableChecks = 0;
        }
      }
    }

    // Safety fallback: Sau 20 giây nếu không generating mà toàn trang đã có câu trả lời mới và khối code Ruby
    if (Date.now() - startTime > 20000 && !generating) {
      const fallbackResp = extractLatestAssistantResponse();
      if (fallbackResp && (fallbackResp.ruby_code || fallbackResp.char_count > 150)) {
        if (fallbackResp.text !== initialLastText) {
          console.log("[AI Bridge v4.0] 🛡️ Thu thập thành công câu trả lời qua Fallback Scanner!");
          updateWidgetText(`🎉 Hoàn tất: <strong>${fallbackResp.char_count.toLocaleString()}</strong> ký tự`, "#10b981");
          return fallbackResp;
        }
      }
    }

    await new Promise((r) => setTimeout(r, 800));
  }

  // Cuối cùng thử quét toàn trang 1 lần trước khi throw timeout
  const finalFallback = extractLatestAssistantResponse();
  if (finalFallback && finalFallback.char_count > 50 && finalFallback.text !== initialLastText) {
    return finalFallback;
  }

  throw new Error("Quá thời gian chờ (Timeout 240s) phản hồi từ ChatGPT.");
}

// --------------------------------------------------------------------------
// 4. THEO DÕI & TRÍCH XUẤT ẢNH DALL-E / INPAINTING
// --------------------------------------------------------------------------

// Image detection ported from Bridge v3, which returns results reliably:
// whole conversation turns, generated-image selectors, DOM observer, auto-scroll and early failure.
function getSafeClassName(el) {
  if (!el) return "";
  if (typeof el.className === "string") return el.className.toLowerCase();
  if (el.className && typeof el.className.baseVal === "string") return el.className.baseVal.toLowerCase();
  const attr = el.getAttribute ? el.getAttribute("class") : null;
  return typeof attr === "string" ? attr.toLowerCase() : "";
}

function getConversationTurns() {
  const articles = Array.from(document.querySelectorAll('article'));
  if (articles.length > 0) return articles;
  const turns = Array.from(document.querySelectorAll('[data-testid*="conversation-turn"]'));
  if (turns.length > 0) return turns;
  const mainChat = document.querySelector('main div[class*="react-scroll-to-bottom"] > div > div')
                || document.querySelector('main [class*="conversation"]')
                || document.querySelector('main');
  if (mainChat) {
    const directChildren = Array.from(mainChat.children).filter(c => c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE');
    if (directChildren.length >= 2) return directChildren;
  }
  return Array.from(document.querySelectorAll('div[class*="agent-turn"], div[class*="user-turn"]'));
}

function isAvatarOrUiIcon(img) {
  if (!img) return true;
  const src = img.currentSrc || img.src || img.getAttribute("src") || img.getAttribute("srcset")?.split(' ')[0] || "";
  if (!src || src.startsWith("data:image/svg")) return true;
  if (src.includes("auth0.com") || src.includes("gravatar.com")) return true;
  // Never skip OpenAI CDN, ChatGPT blob or backend-api images unless they are tiny avatars.
  if (src.includes("oaiusercontent.com") || src.startsWith("blob:") || src.includes("oaistatic.com") || src.includes("estuary") || src.includes("/backend-api/")) {
    if (img.naturalWidth > 0 && img.naturalWidth <= 40 && img.naturalHeight > 0 && img.naturalHeight <= 40) return true;
    if (img.width > 0 && img.width <= 40 && img.height > 0 && img.height <= 40) return true;
    return false;
  }
  const alt = (img.getAttribute("alt") || "").toLowerCase();
  if (alt === "user" || alt === "profile" || alt.includes("avatar")) return true;
  const cls = getSafeClassName(img);
  if (cls.includes("avatar") || cls.includes("rounded-full")) return true;
  if (img.naturalWidth > 0 && img.naturalWidth <= 48 && img.naturalHeight > 0 && img.naturalHeight <= 48) return true;
  if (img.width > 0 && img.width <= 48 && img.height > 0 && img.height <= 48) return true;
  return false;
}

function isUserArea(el) {
  if (!el) return false;
  // Images and areas produced by the assistant are never user content.
  if (el.closest('[data-testid*="generated-image"]') || el.closest('[data-image-transparency-backdrop-scope]') ||
      el.closest('[data-conversation-role="assistant"]') || el.closest('span[data-chatgpt-agent-turn-start]') ||
      el.closest('button[aria-label*="Chỉnh sửa ảnh" i]') || el.closest('button[aria-label*="Edit" i]')) {
    return false;
  }
  if (el.closest("#chatgpt-bridge-widget")) return true;
  if (el.closest("form") || el.closest("#prompt-textarea") || el.closest('div[class*="composer"]')) return true;
  return !!(el.closest('[data-message-author-role="user"]') || el.closest('[data-user-message-bubble="true"]') ||
    el.closest('div[class*="user-message"]') || el.closest('.user-turn') || el.closest('.font-user-message'));
}

function isUserTurn(el) {
  if (!el) return false;
  if (el.getAttribute('data-conversation-role') === 'assistant' || el.querySelector('[data-conversation-role="assistant"]') ||
      el.querySelector('[data-chatgpt-agent-turn-start]') || el.querySelector('[data-testid*="generated-image"]') ||
      el.querySelector('img.image-transparency-backdrop, img[class*="image-transparency-backdrop"]') ||
      el.getAttribute('data-message-author-role') === 'assistant' || el.closest('[data-message-author-role="assistant"]') ||
      (el.classList && el.classList.contains('agent-turn')) || el.querySelector('[data-message-author-role="assistant"]') ||
      el.querySelector('button[aria-label*="Edit image" i], button[aria-label*="Chỉnh sửa ảnh" i], button[aria-label*="Sửa ảnh" i]')) {
    return false;
  }
  if (el.getAttribute('data-message-author-role') === 'user' || el.querySelector('[data-message-author-role="user"]') || el.querySelector('[data-user-message-bubble="true"]')) return true;
  const cls = getSafeClassName(el);
  if (cls.includes('user-turn') || cls.includes('font-user-message') || cls.includes('user-message')) return true;
  return !!el.querySelector('button[aria-label*="Edit message" i], button[aria-label*="Chỉnh sửa tin nhắn" i], button[aria-label*="Sửa tin nhắn" i], button[data-testid*="edit-message"]');
}

function hasRealAiImage(container) {
  if (!container) return false;
  for (const el of container.querySelectorAll('img, a[href*="oaiusercontent.com"], a[download]')) {
    if (el.tagName === 'IMG') {
      if (isAvatarOrUiIcon(el)) continue;
      const src = el.currentSrc || el.src || el.getAttribute('src') || '';
      if (src && !src.startsWith('data:image/svg')) return true;
    } else {
      const href = el.getAttribute('href') || el.href || '';
      if (href && (href.includes('oaiusercontent.com') || href.startsWith('blob:') || href.includes('estuary'))) return true;
    }
  }
  return false;
}

// Only turns created after the prompt are searched; initialTurnElements is the turn snapshot taken before sending.
function findNewlyGeneratedImage(preExistingImages, preExistingElements, initialTurnElements = new Set()) {
  const isValidCandidate = (el, src) => {
    if (!el || !src || src.startsWith('data:image/svg')) return false;
    if (preExistingElements.has(el) || preExistingImages.has(src)) return false;
    return !isUserArea(el) && !isAvatarOrUiIcon(el);
  };
  const generatedSelector = '[data-testid*="generated-image"] img, img.image-transparency-backdrop, img[class*="image-transparency-backdrop"], img[alt*="Generated" i], img[alt*="Ảnh được tạo" i]';
  const candidateTurns = getConversationTurns().filter(turn => !initialTurnElements.has(turn));
  for (let i = candidateTurns.length - 1; i >= 0; i--) {
    const turn = candidateTurns[i];
    if (isUserTurn(turn)) continue;
    for (const img of Array.from(turn.querySelectorAll(generatedSelector)).reverse()) {
      const src = img.currentSrc || img.src || img.getAttribute('src') || '';
      if (isValidCandidate(img, src)) return { img, src };
    }
    for (const img of Array.from(turn.querySelectorAll('img')).reverse()) {
      const src = img.currentSrc || img.src || img.getAttribute('src') || img.getAttribute('srcset')?.split(' ')[0] || '';
      if (isValidCandidate(img, src)) return { img, src };
    }
    for (const a of turn.querySelectorAll('a[href*="oaiusercontent.com"], a[href*="files"], a[download]')) {
      const href = a.getAttribute('href') || a.href || '';
      if (href && (href.includes('oaiusercontent.com') || href.startsWith('blob:') || href.includes('estuary')) && !preExistingImages.has(href)) {
        return { img: a.querySelector('img') || a, src: href };
      }
    }
  }
  // Fallback: generated-image markup anywhere on the page that did not exist before the prompt.
  for (const img of Array.from(document.querySelectorAll(generatedSelector)).reverse()) {
    const src = img.currentSrc || img.src || img.getAttribute('src') || '';
    if (isValidCandidate(img, src)) return { img, src };
  }
  return null;
}

async function extractCandidateBase64(candidate) {
  if (!candidate) return null;
  const { img, src } = candidate;

  // 1. Thử Canvas nếu thẻ img đã load xong
  if (img && img.tagName === "IMG" && img.complete && (img.naturalWidth > 50 || img.width > 50)) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = canvas.toDataURL("image/png");
      if (data && data.length > 500) return data;
    } catch (e) {}
  }

  // 2. Nếu là blob: URL, fetch trực tiếp
  if (src && src.startsWith("blob:")) {
    try {
      const resp = await fetch(src);
      if (resp.ok) {
        const blob = await resp.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}
  }

  // 3. Nếu là URL CDN từ xa, fetch qua Background script để tránh CORS
  if (src && src.startsWith("http")) {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "FETCH_IMAGE_BASE64", url: src }, (r) => resolve(r));
    });
    if (res && res.ok && res.base64) return res.base64;
  }

  return null;
}

// DOM changes drive the check as well as a timer, so detection keeps working when the tab's timers are throttled.
function waitForImageGeneration(taskId, preExistingImages, preExistingElements, initialTurnElements, timeoutMs = 240000) {
  console.log("[AI Bridge v4.0] 🎨 Bắt đầu theo dõi quá trình tạo ảnh AI...");
  updateWidgetText("🎨 Đang chờ ChatGPT render ảnh AI...", "#f59e0b");
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let settled = false, checking = false, previewSent = false, candidateImageFound = null, lastProgress = 0, lastScroll = 0;
    let observer = null, interval = null;
    const finish = () => { settled = true; clearInterval(interval); try { observer?.disconnect(); } catch (e) {} };
    const fail = error => { if (!settled) { finish(); reject(error); } };
    const checkLoop = async () => {
      if (settled || checking) return;
      checking = true;
      try {
        if (assignmentRevoked) return fail(new Error('Tác vụ đã được server thu hồi'));
        const elapsedSec = Math.floor((Date.now() - start) / 1000);
        const generating = isChatGptGenerating();
        if (elapsedSec >= 3) {
          const candidate = findNewlyGeneratedImage(preExistingImages, preExistingElements, initialTurnElements);
          if (candidate) {
            candidateImageFound = candidate;
            if (!previewSent) {
              previewSent = true;
              extractCandidateBase64(candidate).then((b64) => {
                sendJobPreview(taskId, candidate.src.startsWith("http") ? candidate.src : null, b64);
                sendWorkerProgress(taskId, "⚡ Đã có ảnh xem trước! Đang hoàn thiện ảnh gốc...", 92);
              }).catch(() => {});
            }
            // ChatGPT has stopped generating, so the full-resolution image is rendered.
            if (!generating && elapsedSec >= 5) {
              finish();
              updateWidgetText("⏳ Đang trích xuất ảnh HD gốc...", "#3b82f6");
              await new Promise((r) => setTimeout(r, 1200));
              const finalBase64 = await extractCandidateBase64(candidate);
              resolve({ img: candidate.img, src: candidate.src, base64: finalBase64 });
              return;
            }
          }
        }
        if (Date.now() - lastProgress >= 3000) {
          lastProgress = Date.now();
          const statusMsg = generating ? `ChatGPT đang vẽ ảnh AI... (${elapsedSec}s)` : `Đang xử lý tạo ảnh... (${elapsedSec}s)`;
          updateWidgetText(`⏳ ${statusMsg}`, "#f59e0b");
          sendWorkerProgress(taskId, statusMsg, Math.min(90, 40 + Math.floor(elapsedSec * 0.4)));
        }
        // Lazy-loaded images only get a src once scrolled into view.
        if (Date.now() - lastScroll >= 2000) {
          lastScroll = Date.now();
          try {
            const scroller = document.querySelector('main div[class*="overflow-y-auto"]') || document.querySelector('main') || document.documentElement;
            scroller.scrollTop = scroller.scrollHeight;
          } catch (e) {}
        }
        if (elapsedSec >= 4) {
          for (const errEl of document.querySelectorAll('div[class*="text-token-text-error"], [data-testid*="error"], div[class*="bg-red-"], div[class*="border-red-"], div[class*="text-red-"]')) {
            const errTxt = (errEl.innerText || errEl.textContent || "").trim();
            if (errTxt.length > 5 && /lỗi|error|went wrong|limit|giới hạn|failed|unable|không thể/i.test(errTxt)) return fail(new Error(`ChatGPT báo lỗi: "${errTxt.slice(0, 150)}"`));
          }
        }
        if (!generating && elapsedSec >= 10 && !candidateImageFound) {
          const newAssistantTurn = getConversationTurns().filter(turn => !initialTurnElements.has(turn) && !isUserTurn(turn)).pop();
          if (newAssistantTurn && !hasRealAiImage(newAssistantTurn)) {
            const txt = (newAssistantTurn.innerText || newAssistantTurn.textContent || "").trim();
            if (txt.length > 15) return fail(new Error(`ChatGPT KHÔNG TẠO ẢNH mà chỉ phản hồi văn bản: "${txt.slice(0, 150)}..."`));
          }
        }
        if (Date.now() - start > timeoutMs) fail(new Error("Quá thời gian chờ (Timeout 240s) ChatGPT tạo ảnh!"));
      } catch (error) {
        fail(error);
      } finally {
        checking = false;
      }
    };
    try {
      observer = new MutationObserver(() => { checkLoop(); });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'class', 'href'] });
    } catch (e) {}
    interval = setInterval(checkLoop, 600);
  });
}

// --------------------------------------------------------------------------
// 5. THỰC THI TÁC VỤ HỢP NHẤT (ALL-IN-ONE TASK EXECUTOR)
// --------------------------------------------------------------------------

async function executeTask(task) {
  executionRunning = true;
  isProcessing = true;
  activeTaskId = task.id;
  activeAttemptId = task.attempt_id;
  activeRequestCode = task.request_code || task.id;
  currentTaskSnapshot = { ...task };

  console.log(`[AI Bridge v4.0] [PC: ${PC_NAME}] ⚡ Nhận tác vụ độc quyền [${activeRequestCode}]:`, task);
  updateWidgetText(`[${PC_NAME}] ⚡ <strong>${activeRequestCode}</strong> | Bắt đầu...`, "#3b82f6");

  try {
    // 0. Chờ ChatGPT hoàn tất nếu đang trả lời dở
    let waitGenStart = Date.now();
    while (isChatGptGenerating() && (Date.now() - waitGenStart < 60000)) {
      updateWidgetText("⏳ Đang đợi ChatGPT trả lời xong...", "#f59e0b");
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 1. Mở cuộc trò chuyện mới sạch nếu tác vụ yêu cầu
    if (task.new_chat === true) {
      await sendWorkerProgress(task.id, 'Đang chuẩn bị hội thoại mới…', 10);
      await ensureCleanNewChat();
    } else {
      await clearComposerThoroughly();
      await new Promise((r) => setTimeout(r, 400));
    }

    // 2. Thu thập các element trước khi gửi để tránh nhận nhầm ảnh cũ
    const preExistingImages = new Set();
    const preExistingElements = new Set();
    document.querySelectorAll("img, a[href*='oaiusercontent.com']").forEach((el) => {
      preExistingElements.add(el);
      if (el.src) preExistingImages.add(el.src);
      if (el.currentSrc) preExistingImages.add(el.currentSrc);
      if (el.href) preExistingImages.add(el.href);
    });

    const initialTurns = getAssistantTurns();
    const initialTurnCount = initialTurns.length;
    // Snapshot of every conversation turn before sending, so only new turns are searched for the result image.
    const initialTurnElements = new Set(getConversationTurns());
    const initialLastTurn = initialTurnCount > 0 ? initialTurns[initialTurnCount - 1] : null;
    const initialLastTurnText = initialLastTurn ? (parseAssistantTurn(initialLastTurn)?.text || "") : "";
    const turnContext = { initialTurnCount, initialLastTurn, initialLastTurnText };

    // 3. Đính kèm ảnh nếu có (chỉ nạp khi ảnh hợp lệ)
    const refImages = getTaskReferenceImages(task);
    if (refImages.length > 0) {
      await sendWorkerProgress(task.id, `Đang đính kèm ${refImages.length} hình ảnh...`, 30);
      if (!await attachReferenceImages(refImages)) throw new Error("Không đính kèm được ảnh tham chiếu");
    }

    // 4. Nhận diện loại tác vụ: Tạo ảnh (Image Gen) vs Phân tích Vision / Ruby / Chat
    let promptToSend = (task.prompt || "").trim();
    const isImageJob = task.job_type === "image_gen"
                    || task.expected_output === "image"
                    || task.type === "edit_full"
                    || task.type === "create"
                    || task.type === "edit_inpaint"
                    || task.action === "generate_image"
                    || (/^(tạo|vẽ|render|generate|draw|create)\s+.*(ảnh|bức tranh|image|picture)/i.test(promptToSend) && task.job_type !== "chat_code" && task.job_type !== "ruby_3d");

    if (isImageJob && task.style && task.style.toLowerCase() !== "none") {
      promptToSend = `Tạo ảnh phong cách ${task.style}: ${promptToSend}`;
    }

    // 5. Gửi Prompt
    await sendWorkerProgress(task.id, "Đang gửi prompt vào ChatGPT...", 50);
    await insertPromptAndSend(promptToSend, refImages.length);

    let resultPayload = {
      task_id: task.id,
      request_code: activeRequestCode,
      worker_id: TAB_ID,
      pc_name: PC_NAME,
      bridge_type: BRIDGE_TYPE,
      prompt: task.prompt,
      status: "completed"
    };

    // 6. Theo dõi kết quả tương ứng
    if (isImageJob) {
      const imgRes = await waitForImageGeneration(task.id, preExistingImages, preExistingElements, initialTurnElements);
      resultPayload.image_url = (imgRes.src && imgRes.src.startsWith("http")) ? imgRes.src : null;
      resultPayload.image_base64 = imgRes.base64;
      if (!imgRes.base64 && !resultPayload.image_url) throw new Error('Không lấy được dữ liệu ảnh');
      resultPayload.response_type = 'image';
      resultPayload.output_type = 'image';
      resultPayload.outputs = [{ type: 'image', mime_type: 'image/png', width: imgRes.img?.naturalWidth,
        height: imgRes.img?.naturalHeight, variant: 'rendered' }];
      const imageTurn = getAssistantTurns().slice(initialTurnCount).at(-1);
      const caption = imageTurn ? parseAssistantTurn(imageTurn)?.text : '';
      if (caption) {
        resultPayload.text = caption;
        resultPayload.output_type = 'mixed';
        resultPayload.outputs.push({ type: 'text', text: caption });
      }
    } else {
      const respData = await waitForAssistantResponse(turnContext, 240000, task.id);
      resultPayload.text = respData.text;
      resultPayload.html = respData.html;
      resultPayload.code_blocks = respData.code_blocks;
      resultPayload.ruby_code = respData.ruby_code;
      resultPayload.char_count = respData.char_count;
      resultPayload.response_type = 'text_code';
      resultPayload.output_type = respData.code_blocks?.length ? 'code' : 'text';
      resultPayload.outputs = [{ type: 'text', text: respData.text },
        ...(respData.code_blocks || []).map(block => ({ type: 'code', ...block }))];
      const extraImage = findNewlyGeneratedImage(preExistingImages, preExistingElements, initialTurnElements);
      if (extraImage) {
        const binary = await extractCandidateBase64(extraImage);
        if (binary) {
          resultPayload.image_base64 = binary;
          resultPayload.response_type = 'image';
          resultPayload.output_type = respData.text ? 'mixed' : 'image';
          resultPayload.outputs.push({ type: 'image', mime_type: 'image/png', variant: 'rendered' });
        }
      }
    }

    // 7. Đồng bộ kết quả về Server
    updateWidgetText(`[${PC_NAME}] ⚡ <strong>${activeRequestCode}</strong> | Gửi kết quả...`, "#3b82f6");
    resultAwaitingCommit = true;
    const delivery = await coordinatorMessage({ action: 'RESULT_READY', task_id: task.id,
      attempt_id: task.attempt_id, payload: resultPayload });
    if (!delivery.committed) {
      updateWidgetText('Đã lưu kết quả · Đang chờ server xác nhận', '#f59e0b');
      return;
    }

    lastCompletedRequestCode = activeRequestCode;
    updateWidgetText(`🎉 Hoàn tất mã: <strong>${activeRequestCode}</strong>!`, "#10b981");
  } catch (error) {
    if (error.code === 'CLEAN_CHAT_NAVIGATION') { resultAwaitingCommit = true; return; }
    console.error("[AI Bridge v4.0] Lỗi thực thi tác vụ:", error);
    updateWidgetText(`❌ Lỗi [${activeRequestCode}]: ${error.message.slice(0, 30)}...`, "#ef4444");

    if (assignmentRevoked) { releaseExecutor(); return; }
    try {
      resultAwaitingCommit = true;
      await coordinatorMessage({ action: 'RESULT_READY', task_id: task.id, attempt_id: task.attempt_id,
        payload: { status: 'failed', error: error.message, output_type: 'error' } });
    } catch (deliveryError) {
      updateWidgetText('Cần kiểm tra kết nối: ' + deliveryError.message, '#ef4444');
    }
  } finally {
    executionRunning = false;
    if (!resultAwaitingCommit) releaseExecutor();
  }
}

// --------------------------------------------------------------------------
// 6. GIAO TIẾP VỚI SERVER: HEARTBEAT & POLLING VỚI ĐỊNH TUYẾN THEO TÊN MÁY (PC_NAME)
// --------------------------------------------------------------------------

async function sendWorkerProgress(taskId, step, progress) {
  try { await coordinatorMessage({ action: 'EXECUTOR_EVENT', kind: 'progress',
    task_id: taskId, attempt_id: activeAttemptId, payload: { step, progress } }); } catch (e) {}
}
async function sendJobPreview(taskId, previewUrl, previewBase64) {
  try { await coordinatorMessage({ action: 'EXECUTOR_EVENT', kind: 'preview',
    task_id: taskId, attempt_id: activeAttemptId,
    payload: { preview_url: previewUrl, preview_base64: previewBase64 } }); } catch (e) {}
}

// --------------------------------------------------------------------------
// 7. FLOATING STATUS WIDGET TRÊN GIAO DIỆN CHATGPT
// --------------------------------------------------------------------------

function createStatusWidget() {
  if (document.getElementById("toolx-unified-bridge-widget")) return;

  const widget = document.createElement("div");
  widget.id = "toolx-unified-bridge-widget";
  widget.style.cssText = `
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 999999;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(10px);
    color: #f8fafc;
    border: 1px solid rgba(59, 130, 246, 0.4);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    padding: 10px 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
  `;

  widget.innerHTML = `
    <span id="aub-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 8px #10b981;"></span>
    <div id="aub-content" style="display: flex; flex-direction: column; gap: 2px;">
      <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
        <span id="aub-pc-badge" style="background: rgba(59, 130, 246, 0.25); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 1px 7px; border-radius: 4px; font-size: 11px; font-family: monospace; font-weight: bold;">${PC_NAME}</span>
        <span id="aub-title">AI Studio Bridge v4.0</span>
      </div>
      <div id="aub-account" style="font-size: 11px; color: #94a3b8;"></div>
      <div id="aub-status" style="font-size: 12px; color: #94a3b8;">Sẵn sàng nhận tác vụ...</div>
    </div>
    <div style="display: flex; gap: 4px; margin-left: 6px;">
      <button id="aub-newchat-btn" title="Mở Chat Mới Sạch (Reset Session)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 6px; padding: 4px 7px; cursor: pointer; font-size: 11px;">🧹 Reset</button>
    </div>
  `;

  document.body.appendChild(widget);

  document.getElementById("aub-newchat-btn").onclick = async () => {
    if (!isProcessing) await ensureCleanNewChat();
  };
}

function updateWidgetText(html, dotColor = "#10b981") {
  const dot = document.getElementById("aub-dot");
  const status = document.getElementById("aub-status");
  const pcBadge = document.getElementById("aub-pc-badge");
  if (pcBadge) {
    pcBadge.textContent = PC_NAME;
  }
  if (dot) {
    dot.style.background = dotColor;
    dot.style.boxShadow = `0 0 8px ${dotColor}`;
  }
  if (status) {
    status.innerHTML = html;
  }
}

function updateWidgetStatus() {
  const accountBadge = document.getElementById('aub-account');
  if (accountBadge) accountBadge.textContent = DETECTED_EMAIL || 'Chưa nhận diện tài khoản';
  const pcBadge = document.getElementById("aub-pc-badge");
  if (pcBadge) pcBadge.textContent = PC_NAME;
  const tabBadge = document.getElementById('aub-title');
  if (tabBadge) { tabBadge.textContent = TAB_ID || 'Đang cấp Tab ID…'; tabBadge.title = 'Bấm để sao chép Tab ID';
    tabBadge.style.cursor = 'pointer'; tabBadge.onclick = () => navigator.clipboard.writeText(TAB_ID); }
  if (isProcessing) return;
  const pollText = AUTO_POLL ? "Đang chờ tác vụ..." : "Tạm dừng Auto-Poll";
  const dotColor = AUTO_POLL ? "#10b981" : "#f59e0b";
  updateWidgetText(`<strong>${WORKER_NAME}</strong> · ${pollText}`, dotColor);
}

// Khởi chạy
createStatusWidget();
registerExecutor().catch(console.warn);
setInterval(executorHeartbeat, 4000);
