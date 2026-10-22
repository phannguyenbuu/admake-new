// Popup Script cho ChatGPT AI Studio & Worker Bridge v4.0

document.addEventListener("DOMContentLoaded", () => {
  const pcNameInput = document.getElementById("pc-name");
  const workerNameInput = document.getElementById("worker-name");
  const serverUrlInput = document.getElementById("server-url");
  const accountLabelInput = document.getElementById("account-label");
  const autoPollToggle = document.getElementById("auto-poll");
  const capImageCheck = document.getElementById("cap-image");
  const capVisionCheck = document.getElementById("cap-vision");
  const capRubyCheck = document.getElementById("cap-ruby");

  const btnSave = document.getElementById("btn-save");
  const btnCleanNewChat = document.getElementById("btn-clean-newchat");
  const btnTestPing = document.getElementById("btn-test-ping");
  const toastMsg = document.getElementById("toast-msg");
  const footerWid = document.getElementById("footer-wid");
  const statusText = document.getElementById("status-text");
  const statusDot = document.getElementById("status-dot");

  let currentWorkerId = "";

  function showToast(msg, type = "success") {
    toastMsg.textContent = msg;
    toastMsg.className = `toast ${type}`;
    setTimeout(() => {
      toastMsg.className = "toast";
    }, 3500);
  }

  // Nạp cấu hình từ chrome.storage.local
  chrome.storage.local.get([
    "serverUrl", "workerId", "workerName", "pcName", "accountLabel",
    "autoPoll", "capImage", "capVision", "capRuby"
  ], (items) => {
    currentWorkerId = items.workerId || "worker_" + Math.random().toString(36).substring(2, 9);
    footerWid.textContent = `ID: ${currentWorkerId}`;

    if (items.pcName) {
      pcNameInput.value = items.pcName;
    } else {
      const ua = navigator.userAgent || "";
      let os = "PC";
      if (/Windows/i.test(ua)) os = "WIN_PC";
      else if (/Macintosh/i.test(ua)) os = "MAC";
      pcNameInput.value = `${os}_${currentWorkerId.slice(-4).toUpperCase()}`;
    }

    workerNameInput.value = items.workerName || `Máy ${pcNameInput.value}`;
    serverUrlInput.value = items.serverUrl || "https://genai.toolxprint.com";
    accountLabelInput.value = items.accountLabel || "ChatGPT Plus";

    autoPollToggle.checked = typeof items.autoPoll === "boolean" ? items.autoPoll : true;
    capImageCheck.checked = typeof items.capImage === "boolean" ? items.capImage : true;
    capVisionCheck.checked = typeof items.capVision === "boolean" ? items.capVision : true;
    capRubyCheck.checked = typeof items.capRuby === "boolean" ? items.capRuby : true;
  });

  // Kiểm tra trạng thái tab ChatGPT
  chrome.tabs.query({ url: "https://chatgpt.com/*" }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      statusText.textContent = "Chưa mở chatgpt.com";
      statusDot.style.background = "#f59e0b";
    } else {
      statusText.textContent = "Sẵn sàng";
      statusDot.style.background = "#10b981";
    }
  });

  // Lưu cấu hình
  btnSave.addEventListener("click", () => {
    const rawPc = pcNameInput.value.trim().toUpperCase() || "PC_MAIN";
    const rawWorkerName = workerNameInput.value.trim() || `Máy ${rawPc}`;
    const rawServerUrl = serverUrlInput.value.trim().replace(/\/+$/, "") || "https://genai.toolxprint.com";
    const rawAccountLabel = accountLabelInput.value.trim() || "ChatGPT Plus";
    const autoPoll = autoPollToggle.checked;
    const capImage = capImageCheck.checked;
    const capVision = capVisionCheck.checked;
    const capRuby = capRubyCheck.checked;

    const payload = {
      pcName: rawPc,
      workerName: rawWorkerName,
      serverUrl: rawServerUrl,
      accountLabel: rawAccountLabel,
      autoPoll,
      capImage,
      capVision,
      capRuby
    };

    chrome.storage.local.set(payload, () => {
      // Đồng bộ tới tất cả tab ChatGPT đang mở
      chrome.tabs.query({ url: "https://chatgpt.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: "UPDATE_CONFIG",
            ...payload
          }, () => {
            if (chrome.runtime.lastError) {}
          });
        });
      });

      showToast("✅ Đã lưu cấu hình và đồng bộ Target PC thành công!");
    });
  });

  // Mở Chat mới sạch (Reset Session Test)
  btnCleanNewChat.addEventListener("click", () => {
    btnCleanNewChat.disabled = true;
    btnCleanNewChat.textContent = "⏳ Đang dọn dẹp & mở chat mới...";

    chrome.tabs.query({ url: "https://chatgpt.com/*" }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        showToast("⚠️ Vui lòng mở trang https://chatgpt.com/ trước.", "error");
        btnCleanNewChat.disabled = false;
        btnCleanNewChat.textContent = "🧹 Mở Chat Mới Sạch (Reset Session)";
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: "TRIGGER_NEW_CHAT" }, (res) => {
        btnCleanNewChat.disabled = false;
        btnCleanNewChat.textContent = "🧹 Mở Chat Mới Sạch (Reset Session)";
        if (chrome.runtime.lastError) {
          showToast("⚠️ Không thể gửi tín hiệu tới tab ChatGPT. Vui lòng F5 tab đó.", "error");
        } else {
          showToast("🎉 Đã thực hiện reset phiên hội thoại mới sạch 100%!");
        }
      });
    });
  });

  // Kiểm tra kết nối tới Server
  btnTestPing.addEventListener("click", async () => {
    btnTestPing.disabled = true;
    btnTestPing.textContent = "⏳ Đang kiểm tra...";

    const sUrl = serverUrlInput.value.trim().replace(/\/+$/, "") || "https://genai.toolxprint.com";
    const pcName = pcNameInput.value.trim().toUpperCase() || "PC_MAIN";

    try {
      const startTime = Date.now();
      chrome.runtime.sendMessage({
        action: "PROXY_FETCH",
        url: `${sUrl}/api/worker/heartbeat`,
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worker_id: currentWorkerId,
            name: workerNameInput.value.trim() || `Máy ${pcName}`,
            pc_name: pcName,
            account_label: accountLabelInput.value.trim() || "Test Ping",
            status: "idle"
          })
        }
      }, (res) => {
        btnTestPing.disabled = false;
        btnTestPing.textContent = "⚡ Kiểm Tra Kết Nối Server";

        if (res && res.ok) {
          const latency = Date.now() - startTime;
          showToast(`⚡ Kết nối Server thành công (${latency}ms)! PC: ${pcName}`);
        } else {
          showToast(`❌ Kết nối thất bại: ${res?.error || res?.statusText || "HTTP Error"}`, "error");
        }
      });
    } catch (e) {
      btnTestPing.disabled = false;
      btnTestPing.textContent = "⚡ Kiểm Tra Kết Nối Server";
      showToast(`❌ Lỗi mạng: ${e.message}`, "error");
    }
  });

  // Xử lý nút chọn nhanh Server URL (Presets)
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      if (url) {
        serverUrlInput.value = url;
        showToast(`⚡ Đã chuyển sang Server: ${url}`);
      }
    });
  });
});


