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

let SERVER_URL = "https://genai.toolxprint.com";
let WORKER_ID = "worker_" + Math.random().toString(36).substring(2, 9);
let PC_NAME = getDefaultPcName(WORKER_ID); // Tên máy tính cấu hình riêng (Target PC)
let WORKER_NAME = `Máy ${PC_NAME}`;
let ACCOUNT_LABEL = "ChatGPT Plus";
let AUTO_POLL = true;
let CAPABILITY_IMAGE = true;
let CAPABILITY_VISION = true;
let CAPABILITY_RUBY = true;

let isProcessing = false;
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
      ensureCleanNewChat().then((ok) => {
        if (sendResponse) sendResponse({ ok });
      });
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
  if (DETECTED_EMAIL) return DETECTED_EMAIL;
  if (Date.now() - lastDetectEmailTime < 10000) return null;
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
  const stopBtn = document.querySelector('button[data-testid="stop-button"]')
               || document.querySelector('button[aria-label*="Dừng" i]')
               || document.querySelector('button[aria-label*="Stop" i]')
               || document.querySelector('button[aria-label*="stop generating" i]');
  return !!stopBtn;
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
    const el = document.querySelector(sel);
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
async function ensureCleanNewChat() {
  console.log("[AI Bridge v4.0] 🧹 Bắt đầu quy trình tạo phiên hội thoại mới sạch...");
  updateWidgetText("🧹 Đang tạo cuộc trò chuyện mới sạch...", "#3b82f6");

  // 1. Chờ ChatGPT hoàn tất nếu đang trả lời dở
  let waitIdleStart = Date.now();
  while (isChatGptGenerating() && (Date.now() - waitIdleStart < 30000)) {
    updateWidgetText("⏳ Đang đợi ChatGPT hoàn tất câu trả lời trước...", "#f59e0b");
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 2. Dọn sạch composer trước khi chuyển
  await clearComposerThoroughly();

  // 3. Kiểm tra xem hiện tại có đang ở URL gốc "/" không
  const isAlreadyAtRoot = window.location.pathname === "/" || window.location.pathname === "";
  const existingTurns = document.querySelectorAll('[data-message-author-role="assistant"], .agent-turn');

  if (isAlreadyAtRoot && existingTurns.length === 0) {
    console.log("[AI Bridge v4.0] Đã ở trang chủ/phiên chat mới tinh.");
    await clearComposerThoroughly();
    await waitForEditorReady(3000);
    return true;
  }

  // 4. Tìm và bấm nút New Chat trên giao diện
  const newChatSelectors = [
    'button[data-testid="create-new-chat-button"]',
    'button[data-testid="navigation-new-chat-button"]',
    'button[data-testid*="new-chat"]',
    'a[data-testid*="new-chat"]',
    'button[aria-label*="Cuộc trò chuyện mới" i]',
    'button[aria-label*="Đoạn chat mới" i]',
    'button[aria-label*="New chat" i]',
    'a[aria-label*="New chat" i]',
    'a[href="/"]',
    'nav a[href="/"]'
  ];

  let clicked = false;
  for (const sel of newChatSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      simulateClick(el);
      try { el.click(); } catch (e) {}
      clicked = true;
      console.log(`[AI Bridge v4.0] Đã bấm nút New Chat: ${sel}`);
      break;
    }
  }

  if (!clicked) {
    try {
      document.dispatchEvent(new KeyboardEvent("keydown", {
        key: "O", code: "KeyO", ctrlKey: true, shiftKey: true, bubbles: true
      }));
    } catch (e) {}
  }

  // Chờ URL chuyển sang "/" hoặc dọn sạch DOM
  await new Promise((r) => setTimeout(r, 600));
  if (window.location.pathname !== "/" && window.location.pathname !== "") {
    const homeLink = document.querySelector('a[href="/"]');
    if (homeLink) {
      simulateClick(homeLink);
      try { homeLink.click(); } catch (e) {}
    }
  }

  // 5. Chờ ô soạn thảo sẵn sàng (tuyệt đối không dùng window.location.replace vì làm reload trang hủy tác vụ)
  const editor = await waitForEditorReady(15000);
  if (editor) {
    editor.focus();
  }
  await clearComposerThoroughly();
  await new Promise((r) => setTimeout(r, 400));

  console.log("[AI Bridge v4.0] ✅ Đã khởi tạo phiên chat mới 100% sạch.");
  updateWidgetText("✅ Đã mở cuộc trò chuyện mới sạch!", "#10b981");
  setTimeout(updateWidgetStatus, 2000);
  return true;
}

// --------------------------------------------------------------------------
// 2. CHÈN TEXT & ĐÍNH KÈM HÌNH ẢNH AN TOÀN
// --------------------------------------------------------------------------

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

async function attachReferenceImages(imagesList) {
  if (!imagesList || imagesList.length === 0) return true;
  console.log(`[AI Bridge v4.0] Đang nạp ${imagesList.length} ảnh đính kèm...`);
  updateWidgetText(`Đang đính kèm ${imagesList.length} ảnh...`, "#3b82f6");

  const files = [];
  for (let i = 0; i < imagesList.length; i++) {
    const f = await itemToFile(imagesList[i], `ref_img_${i + 1}`);
    if (f) files.push(f);
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
  await waitForUploadToComplete(20000);
  await new Promise((r) => setTimeout(r, 1000));
  return true;
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
  // 1. Selector data-testid
  const byTestId = document.querySelector('button[data-testid="send-button"]') ||
                   document.querySelector('button[data-testid="fruitjuice-send-button"]') ||
                   document.querySelector('button[data-testid*="send"]') ||
                   document.querySelector('button[data-testid*="submit"]');
  if (byTestId) return byTestId;

  // 2. aria-label
  const allButtons = Array.from(document.querySelectorAll('button'));
  const byAria = allButtons.find((b) => {
    const label = (b.getAttribute('aria-label') || '').toLowerCase();
    return label.includes('gửi') || label.includes('send') || label === 'submit';
  });
  if (byAria) return byAria;

  // 3. Nút trong composer có icon mũi tên lên
  const composer = document.querySelector('#prompt-textarea')?.closest('form') || document.querySelector('form');
  if (composer) {
    const composerButtons = Array.from(composer.querySelectorAll('button'));
    for (let i = composerButtons.length - 1; i >= 0; i--) {
      const b = composerButtons[i];
      const label = (b.getAttribute('aria-label') || b.innerText || '').toLowerCase();
      if (label.includes('đính kèm') || label.includes('attach') || 
          label.includes('voice') || label.includes('mic') || 
          label.includes('suy luận') || label.includes('web')) {
        continue;
      }
      if (b.querySelector('svg')) return b;
    }
    if (composerButtons.length > 0) return composerButtons[composerButtons.length - 1];
  }

  return null;
}

// Chèn Prompt vào ProseMirror và bấm Gửi (Đảm bảo thay thế 100%, có cơ chế kích hoạt React state & xác nhận gửi)
async function insertPromptAndSend(promptText) {
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
  const initialUserCount = document.querySelectorAll('[data-message-author-role="user"], [data-user-message-bubble="true"], .user-turn').length;

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

  // Kích hoạt gửi đa kênh
  console.log("[AI Bridge v4.0] Bắt đầu kích hoạt gửi tin nhắn...");
  if (sendBtn) {
    try {
      sendBtn.removeAttribute("disabled");
      sendBtn.setAttribute("aria-disabled", "false");
    } catch (e) {}
    simulateClick(sendBtn);
    try { sendBtn.click(); } catch (e) {}
  }

  const composerForm = editor.closest('form');
  if (composerForm && typeof composerForm.requestSubmit === 'function') {
    try { composerForm.requestSubmit(sendBtn || undefined); } catch (e) {}
  }

  editor.focus();
  const enterOpts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true };
  editor.dispatchEvent(new KeyboardEvent("keydown", enterOpts));
  editor.dispatchEvent(new KeyboardEvent("keypress", enterOpts));
  editor.dispatchEvent(new KeyboardEvent("keyup", enterOpts));

  // Xác nhận tin nhắn đã được gửi đi (tối đa 20s)
  const confirmStart = Date.now();
  let submitted = false;
  while (Date.now() - confirmStart < 20000) {
    await new Promise((r) => setTimeout(r, 500));

    if (isChatGptGenerating()) {
      submitted = true;
      console.log("[AI Bridge v4.0] ✅ Xác nhận: AI bắt đầu sinh phản hồi!");
      break;
    }

    const curUserCount = document.querySelectorAll('[data-message-author-role="user"], [data-user-message-bubble="true"], .user-turn').length;
    if (curUserCount > initialUserCount) {
      submitted = true;
      console.log("[AI Bridge v4.0] ✅ Xác nhận: Đã xuất hiện tin nhắn người dùng mới!");
      break;
    }

    const curText = (editor.tagName === "TEXTAREA" ? editor.value : editor.innerText).trim();
    if (!curText || curText.length === 0) {
      submitted = true;
      console.log("[AI Bridge v4.0] ✅ Xác nhận: Ô nhập prompt đã trống!");
      break;
    }

    // Thử bấm lại nếu chưa gửi được
    const retryBtn = findSendButton();
    if (retryBtn) {
      try {
        retryBtn.removeAttribute("disabled");
        retryBtn.setAttribute("aria-disabled", "false");
      } catch (e) {}
      simulateClick(retryBtn);
      try { retryBtn.click(); } catch (e) {}
      if (composerForm && typeof composerForm.requestSubmit === 'function') {
        try { composerForm.requestSubmit(retryBtn); } catch (e) {}
      }
    }
    editor.focus();
    editor.dispatchEvent(new KeyboardEvent("keydown", enterOpts));
  }

  if (!submitted) {
    const curText = (editor.tagName === "TEXTAREA" ? editor.value : editor.innerText).trim();
    if (curText.length > 0 && !isChatGptGenerating()) {
      throw new Error("Không thể gửi prompt vào ChatGPT (nút Gửi bị vô hiệu hóa hoặc không phản hồi). Hãy kiểm tra tab ChatGPT!");
    }
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
        const hasMeaningfulContent = currentParsed.code_block_count > 0 || currentLength > 10 || hasImage;

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

function findNewlyGeneratedImage(preExistingImages, preExistingElements, initialTurnCount) {
  const allImages = Array.from(document.querySelectorAll('main img, article img, div[class*="agent-turn"] img'));
  for (const img of allImages) {
    if (preExistingElements.has(img)) continue;
    const src = img.currentSrc || img.src || "";
    if (!src || preExistingImages.has(src)) continue;
    if (src.includes("avatar") || src.startsWith("data:image/svg") || src.includes("auth0.com")) continue;
    if (img.naturalWidth > 0 && img.naturalWidth <= 50) continue;
    if (img.closest("form") || img.closest("#prompt-textarea")) continue;

    // Ảnh AI thường nằm trong lượt trả lời của assistant
    const turn = img.closest('[data-message-author-role="assistant"], .agent-turn');
    if (turn || img.width > 120 || img.naturalWidth > 120) {
      return { img, src };
    }
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

async function waitForImageGeneration(taskId, preExistingImages, preExistingElements, initialTurnCount, timeoutMs = 240000) {
  console.log("[AI Bridge v4.0] 🎨 Bắt đầu theo dõi quá trình tạo ảnh AI...");
  updateWidgetText("🎨 Đang chờ ChatGPT render ảnh AI...", "#f59e0b");

  const start = Date.now();
  let candidateImageFound = null;
  let previewSent = false;

  while (Date.now() - start < timeoutMs) {
    const elapsedSec = Math.floor((Date.now() - start) / 1000);
    const generating = isChatGptGenerating();

    if (elapsedSec >= 3) {
      const candidate = findNewlyGeneratedImage(preExistingImages, preExistingElements, initialTurnCount);
      if (candidate) {
        candidateImageFound = candidate;

        // Gửi preview sớm về server
        if (!previewSent) {
          previewSent = true;
          extractCandidateBase64(candidate).then((b64) => {
            const previewUrl = candidate.src.startsWith("http") ? candidate.src : null;
            sendJobPreview(taskId, previewUrl, b64);
            sendWorkerProgress(taskId, "⚡ Đã có ảnh xem trước! Đang hoàn thiện ảnh gốc...", 92);
          }).catch(() => {});
        }

        // Khi ChatGPT ngừng generating, ảnh đã render xong
        if (!generating && elapsedSec >= 5) {
          updateWidgetText("⏳ Đang trích xuất ảnh HD gốc...", "#3b82f6");
          await new Promise((r) => setTimeout(r, 1200));
          const finalBase64 = await extractCandidateBase64(candidate);
          return { img: candidate.img, src: candidate.src, base64: finalBase64 };
        }
      }
    }

    if (elapsedSec % 3 === 0) {
      const statusMsg = generating ? `ChatGPT đang vẽ ảnh AI... (${elapsedSec}s)` : `Đang xử lý tạo ảnh... (${elapsedSec}s)`;
      updateWidgetText(`⏳ ${statusMsg}`, "#f59e0b");
      sendWorkerProgress(taskId, statusMsg, Math.min(90, 40 + Math.floor(elapsedSec * 0.4)));
    }

    await new Promise((r) => setTimeout(r, 600));
  }

  throw new Error("Quá thời gian chờ (Timeout 240s) ChatGPT tạo ảnh!");
}

// --------------------------------------------------------------------------
// 5. THỰC THI TÁC VỤ HỢP NHẤT (ALL-IN-ONE TASK EXECUTOR)
// --------------------------------------------------------------------------

async function executeTask(task) {
  isProcessing = true;
  activeTaskId = task.id;
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
    const initialLastTurn = initialTurnCount > 0 ? initialTurns[initialTurnCount - 1] : null;
    const initialLastTurnText = initialLastTurn ? (parseAssistantTurn(initialLastTurn)?.text || "") : "";
    const turnContext = { initialTurnCount, initialLastTurn, initialLastTurnText };

    // 3. Đính kèm ảnh nếu có (chỉ nạp khi ảnh hợp lệ)
    const rawImages = task.reference_images || task.images || (task.image_url ? [task.image_url] : []);
    const refImages = Array.isArray(rawImages)
      ? rawImages.filter((img) => typeof img === "string" && img.trim().length > 10)
      : [];
    if (refImages.length > 0) {
      await sendWorkerProgress(task.id, `Đang đính kèm ${refImages.length} hình ảnh...`, 30);
      await attachReferenceImages(refImages);
    }

    // 4. Nhận diện loại tác vụ: Tạo ảnh (Image Gen) vs Phân tích Vision / Ruby / Chat
    let promptToSend = (task.prompt || "").trim();
    const isImageJob = task.job_type === "image_gen"
                    || task.type === "create"
                    || task.type === "edit_inpaint"
                    || task.action === "generate_image"
                    || (/^(tạo|vẽ|render|generate|draw|create)\s+.*(ảnh|bức tranh|image|picture)/i.test(promptToSend) && task.job_type !== "chat_code" && task.job_type !== "ruby_3d");

    if (isImageJob && task.style && task.style.toLowerCase() !== "none") {
      promptToSend = `Tạo ảnh phong cách ${task.style}: ${promptToSend}`;
    }

    // 5. Gửi Prompt
    await sendWorkerProgress(task.id, "Đang gửi prompt vào ChatGPT...", 50);
    await insertPromptAndSend(promptToSend);

    let resultPayload = {
      task_id: task.id,
      request_code: activeRequestCode,
      worker_id: WORKER_ID,
      pc_name: PC_NAME,
      bridge_type: BRIDGE_TYPE,
      prompt: task.prompt,
      status: "completed"
    };

    // 6. Theo dõi kết quả tương ứng
    if (isImageJob) {
      const imgRes = await waitForImageGeneration(task.id, preExistingImages, preExistingElements, initialTurnCount);
      resultPayload.image_url = (imgRes.src && imgRes.src.startsWith("http")) ? imgRes.src : null;
      resultPayload.image_base64 = imgRes.base64;
      resultPayload.response_type = "image";
    } else {
      const respData = await waitForAssistantResponse(turnContext, 240000, task.id);
      resultPayload.text = respData.text;
      resultPayload.html = respData.html;
      resultPayload.code_blocks = respData.code_blocks;
      resultPayload.ruby_code = respData.ruby_code;
      resultPayload.char_count = respData.char_count;
      resultPayload.response_type = "text_code";
    }

    // 7. Đồng bộ kết quả về Server
    updateWidgetText(`[${PC_NAME}] ⚡ <strong>${activeRequestCode}</strong> | Gửi kết quả...`, "#3b82f6");
    await bridgeFetch(`${SERVER_URL}/api/worker/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultPayload)
    });

    lastCompletedRequestCode = activeRequestCode;
    updateWidgetText(`🎉 Hoàn tất mã: <strong>${activeRequestCode}</strong>!`, "#10b981");
  } catch (error) {
    console.error("[AI Bridge v4.0] Lỗi thực thi tác vụ:", error);
    updateWidgetText(`❌ Lỗi [${activeRequestCode}]: ${error.message.slice(0, 30)}...`, "#ef4444");

    try {
      await bridgeFetch(`${SERVER_URL}/api/worker/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          request_code: activeRequestCode,
          worker_id: WORKER_ID,
          pc_name: PC_NAME,
          bridge_type: BRIDGE_TYPE,
          status: "failed",
          error: error.message
        })
      });
    } catch (e) {}
  } finally {
    await clearComposerThoroughly();
    setTimeout(() => {
      isProcessing = false;
      activeTaskId = null;
      activeRequestCode = null;
      currentTaskSnapshot = null;
      updateWidgetStatus();
    }, 2000);
  }
}

// --------------------------------------------------------------------------
// 6. GIAO TIẾP VỚI SERVER: HEARTBEAT & POLLING VỚI ĐỊNH TUYẾN THEO TÊN MÁY (PC_NAME)
// --------------------------------------------------------------------------

async function sendWorkerProgress(taskId, step, progress) {
  try {
    await bridgeFetch(`${SERVER_URL}/api/worker/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worker_id: WORKER_ID,
        pc_name: PC_NAME,
        task_id: taskId,
        request_code: activeRequestCode,
        bridge_type: BRIDGE_TYPE,
        step,
        progress
      })
    });
  } catch (e) {}
}

async function sendJobPreview(taskId, previewUrl, previewBase64) {
  try {
    await bridgeFetch(`${SERVER_URL}/api/worker/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worker_id: WORKER_ID,
        pc_name: PC_NAME,
        task_id: taskId,
        request_code: activeRequestCode,
        bridge_type: BRIDGE_TYPE,
        preview_url: previewUrl,
        preview_base64: previewBase64
      })
    });
  } catch (e) {}
}

async function sendWorkerHeartbeat() {
  try {
    const accountEmail = await detectChatGptAccount();
    await bridgeFetch(`${SERVER_URL}/api/worker/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worker_id: WORKER_ID,
        name: WORKER_NAME,
        pc_name: PC_NAME,
        bridge_type: BRIDGE_TYPE,
        bridge_version: "4.0",
        protocol: "unified_v4",
        request_code_prefix: REQUEST_PREFIX,
        account_label: ACCOUNT_LABEL,
        account_email: accountEmail,
        status: isProcessing ? "busy" : "idle",
        current_job_id: activeTaskId,
        current_request_code: activeRequestCode,
        last_completed_code: lastCompletedRequestCode,
        capabilities: {
          image: CAPABILITY_IMAGE,
          vision: CAPABILITY_VISION,
          ruby: CAPABILITY_RUBY
        }
      })
    });
  } catch (e) {}
}

async function pollServerForTasks() {
  if (!AUTO_POLL || isProcessing) return;

  try {
    const accountEmail = await detectChatGptAccount();
    const params = new URLSearchParams({
      worker_id: WORKER_ID,
      name: WORKER_NAME,
      pc_name: PC_NAME,
      bridge_type: BRIDGE_TYPE,
      bridge_version: "4.0",
      protocol: "unified_v4",
      account_label: ACCOUNT_LABEL
    });
    if (accountEmail) params.append("account_email", accountEmail);

    const res = await bridgeFetch(`${SERVER_URL}/api/worker/poll?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.is_enabled === false) {
        updateWidgetText(`[${PC_NAME}] 🔴 Tạm dừng bởi Admin`, "#ef4444");
        return;
      }

      if (data && data.has_task && data.task) {
        if (data.task.action === "new_chat") {
          console.log("[AI Bridge v4.0] Nhận lệnh New Chat từ Server...");
          await ensureCleanNewChat();
          return;
        }
        await executeTask(data.task);
      } else if (!isProcessing) {
        updateWidgetStatus();
      }
    }
  } catch (e) {}
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
      <div id="aub-status" style="font-size: 12px; color: #94a3b8;">Sẵn sàng nhận tác vụ...</div>
    </div>
    <div style="display: flex; gap: 4px; margin-left: 6px;">
      <button id="aub-newchat-btn" title="Mở Chat Mới Sạch (Reset Session)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 6px; padding: 4px 7px; cursor: pointer; font-size: 11px;">🧹 Reset</button>
    </div>
  `;

  document.body.appendChild(widget);

  document.getElementById("aub-newchat-btn").onclick = async () => {
    await ensureCleanNewChat();
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
  const pcBadge = document.getElementById("aub-pc-badge");
  if (pcBadge) pcBadge.textContent = PC_NAME;
  if (isProcessing) return;
  const pollText = AUTO_POLL ? "Đang chờ tác vụ..." : "Tạm dừng Auto-Poll";
  const dotColor = AUTO_POLL ? "#10b981" : "#f59e0b";
  updateWidgetText(`<strong>${WORKER_NAME}</strong> · ${pollText}`, dotColor);
}

// Khởi chạy
createStatusWidget();
setInterval(pollServerForTasks, 1200);
setInterval(sendWorkerHeartbeat, 4000);
