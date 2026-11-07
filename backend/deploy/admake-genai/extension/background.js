importScripts('coordinator.js');
// Background Service Worker cho ChatGPT AI Studio & Worker Bridge v4.0
// Kết hợp toàn diện: Vision Text, Ruby SketchUp 3D, Tạo ảnh DALL-E & Inpainting, Định tuyến theo tên máy (Target PC)

chrome.runtime.onInstalled.addListener(async () => {
  console.log("[ChatGPT AI Bridge v4.0] Background Service Worker đã nạp thành công!");
  try {
    const tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });
    for (const tab of tabs) {
      try {
        await chrome.tabs.reload(tab.id);
        console.log(`[ChatGPT AI Bridge] Đã reload tab ChatGPT (ID: ${tab.id}) để nạp script mới.`);
      } catch (err) {}
    }
  } catch (e) {}
});

// Xử lý tin nhắn từ Content Script và Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. PROXY FETCH: Thực thi fetch trong context Extension (Bỏ qua CORS & Mixed Content)
  if (request.action === "PROXY_FETCH") {
    const { url, options } = request;
    fetch(url, options)
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        let data = null;
        try {
          if (contentType.includes("application/json")) {
            data = await res.json();
          } else {
            data = await res.text();
          }
        } catch (e) {
          data = null;
        }
        sendResponse({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          data: data
        });
      })
      .catch((err) => {
        sendResponse({
          ok: false,
          status: 0,
          error: err.message
        });
      });
    return true; // Giữ kênh async
  }

  // 2. PROXY FETCH BLOB (Chuyển thành DataURL an toàn)
  if (request.action === "PROXY_FETCH_BLOB") {
    fetch(request.url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        sendResponse({ ok: true, dataUrl: `data:${blob.type || 'image/png'};base64,${btoa(binary)}` });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }

  // 3. FETCH BINARY IMAGE BASE64 (Tải ảnh nhị phân trực tiếp, tránh Canvas Taint)
  if (request.action === "FETCH_IMAGE_BASE64") {
    fetch(request.url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.blob();
      })
      .then(async (blob) => {
        try {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
          }
          const base64 = `data:${blob.type || "image/png"};base64,${btoa(binary)}`;
          sendResponse({ ok: true, base64 });
        } catch (e) {
          sendResponse({ ok: false, error: e.message });
        }
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }

  // 4. MAIN WORLD INJECTION: Chèn text vào ProseMirror Document (Thay thế hoàn toàn, KHÔNG nối thêm)
  if (request.action === "INSERT_PROSEMIRROR_TEXT") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (!tabId) {
      sendResponse({ ok: false, error: "No sender tab" });
      return true;
    }

    chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: (promptText) => {
        try {
          const editor = document.querySelector("#prompt-textarea");
          if (!editor) return { ok: false, error: "Editor #prompt-textarea not found" };

          // Tìm ProseMirror EditorView
          let view = editor.pmViewDesc?.view;
          if (!view) {
            let cur = editor;
            while (cur && !view) {
              if (cur.pmViewDesc?.view) view = cur.pmViewDesc.view;
              cur = cur.parentElement;
            }
          }

          let textInserted = false;
          if (view && view.state && view.dispatch && view.state.schema) {
            try {
              const { state, dispatch, schema } = view;
              const pType = schema.nodes.paragraph || schema.nodes.p;
              const lines = promptText.split(/\r?\n/);
              let nodes = [];
              if (pType) {
                for (const line of lines) {
                  nodes.push(line ? pType.create(null, schema.text(line)) : pType.create());
                }
              }
              if (nodes.length > 0) {
                // XÓA SẠCH VÀ THAY THẾ TOÀN BỘ TỪ 0 ĐẾN HẾT: Tránh 100% bug nối vào prompt cũ!
                const tr = state.tr.replaceWith(0, state.doc.content.size, nodes);
                dispatch(tr);
                textInserted = true;
              }
            } catch (e) {
              console.warn("[Bridge MAIN] ProseMirror replaceWith error:", e);
            }
          }

          // Kích hoạt focus và dispatch sự kiện DOM
          editor.focus();
          editor.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertText", data: promptText }));
          editor.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

          return { ok: true, textInserted };
        } catch (err) {
          return { ok: false, error: err.message };
        }
      },
      args: [request.prompt]
    }).then((results) => {
      sendResponse({ ok: true, result: results?.[0]?.result });
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });

    return true;
  }

  // 5. MAIN WORLD: DỌN DẸP SẠCH PROSEMIRROR (Xóa triệt để mọi text & draft cũ)
  if (request.action === "CLEAR_PROSEMIRROR") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (!tabId) {
      sendResponse({ ok: false, error: "No sender tab" });
      return true;
    }

    chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        try {
          const editor = document.querySelector("#prompt-textarea");
          if (!editor) return { ok: true, cleared: false };

          let view = editor.pmViewDesc?.view;
          if (!view) {
            let cur = editor;
            while (cur && !view) {
              if (cur.pmViewDesc?.view) view = cur.pmViewDesc.view;
              cur = cur.parentElement;
            }
          }

          if (view && view.state && view.dispatch) {
            try {
              const { state, dispatch } = view;
              if (state.doc.content.size > 0) {
                const tr = state.tr.delete(0, state.doc.content.size);
                dispatch(tr);
              }
            } catch (e) {}
          }

          editor.innerHTML = "<p><br></p>";
          editor.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
          editor.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          return { ok: true, cleared: true };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      }
    }).then((results) => {
      sendResponse({ ok: true, result: results?.[0]?.result });
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });

    return true;
  }

  // 6. ÉP TAB CHUYỂN VỀ URL SẠCH https://chatgpt.com/ (Khắc phục triệt để khi SPA bị kẹt)
  if (request.action === "FORCE_NAVIGATE_ROOT") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      chrome.tabs.update(tabId, { url: "https://chatgpt.com/" }, (updatedTab) => {
        sendResponse({ ok: true, tabId: updatedTab ? updatedTab.id : null });
      });
      return true;
    }
    sendResponse({ ok: false, error: "No tab id" });
    return true;
  }

  // 7. KÍCH HOẠT TAB
  if (request.action === "ACTIVATE_TAB") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      chrome.tabs.update(tabId, { active: true }, () => sendResponse({ ok: true }));
      return true;
    }
    sendResponse({ ok: true });
    return true;
  }

  // 8. PING KEEP-ALIVE
  if (request.action === "PING") {
    sendResponse({ ok: true, time: Date.now() });
    return true;
  }
});

// Giữ các tab ChatGPT luôn hoạt động (gửi nhịp tim mỗi 2 giây)
setInterval(async () => {
  try {
    const tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "BRIDGE_WAKEUP" }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  } catch (e) {}
}, 2000);
