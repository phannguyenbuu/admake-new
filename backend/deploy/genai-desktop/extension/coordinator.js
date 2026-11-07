// One coordinator per Chrome profile. Public Tab IDs are also worker routing IDs.
const TabCoordinator = (() => {
  const supportedUrls = ['https://chatgpt.com/*', 'https://gemini.google.com/*'];
  const providerOf = url => new URL(url).hostname === 'gemini.google.com' ? 'gemini' : 'chatgpt';
  const rootOf = url => providerOf(url) === 'gemini' ? 'https://gemini.google.com/app' : 'https://chatgpt.com/';
  let slots = {};
  let config = {};
  let ticking = false;
  let lastRegistrySync = 0;
  let serial = Promise.resolve();
  const ready = (async () => {
    config = await chrome.storage.local.get(null);
    if (config.serverUrl !== 'http://127.0.0.1:5000') { config.serverUrl = 'http://127.0.0.1:5000'; config.pcName = 'GENAI_VPS'; await chrome.storage.local.set({serverUrl: config.serverUrl, pcName: config.pcName}); }
    if (!config.workerId) {
      config.workerId = `agent_${crypto.randomUUID()}`;
      await chrome.storage.local.set({ workerId: config.workerId });
    }
    slots = (await chrome.storage.session.get('tabSlots')).tabSlots || {};
    // Reloading the extension clears session storage. Keep lightweight tab bindings locally.
    if (!Object.keys(slots).length && config.tabIdentityBindings) {
      const open = new Set((await chrome.tabs.query({ url: supportedUrls })).map(tab => String(tab.id)));
      for (const [id, binding] of Object.entries(config.tabIdentityBindings)) {
        if (open.has(id)) slots[id] = { ...binding, last_seen: 0, status: binding.job ? 'needs_attention' : 'idle' };
      }
    }
  })();
  const persist = async () => {
    await chrome.storage.session.set({ tabSlots: slots });
    const bindings = Object.fromEntries(Object.entries(slots).map(([id, slot]) => [id, {
      tab_id: slot.tab_id, chrome_tab_id: slot.chrome_tab_id, document_id: slot.document_id,
      account_email: slot.account_email, provider: slot.provider, url: slot.url, conversation_id: slot.conversation_id,
      job: slot.job ? { id: slot.job.id, attempt_id: slot.job.attempt_id, lease_token: slot.job.lease_token } : null
    }]));
    await chrome.storage.local.set({ tabIdentityBindings: bindings });
  };
  const send = (id, message) => chrome.tabs.sendMessage(Number(id), message);
  const base = () => (config.serverUrl || 'http://127.0.0.1:5000').replace(/\/+$/, '');
  async function api(path, body, method = 'POST') {
    const response = await fetch(base() + path, {
      method, headers: { 'Content-Type': 'application/json' },
      ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    if (data.success === false) throw new Error(data.error || 'Server rejected result');
    return data;
  }
  function metadata(slot) {
    return {
      worker_id: slot.tab_id, tab_id: slot.tab_id,
      agent_id: config.workerId, agent_name: config.workerName || config.pcName || 'Chrome Agent',
      pc_name: config.pcName || 'PC', name: slot.tab_id,
      provider: slot.provider || 'chatgpt',
      account_label: slot.provider === 'gemini' ? 'Gemini Chrome' : (config.accountLabel || 'ChatGPT'), account_email: slot.account_email || null,
      conversation_id: slot.conversation_id || null, conversation_url: slot.url,
      executor_status: slot.status, output_type: slot.output_type || null,
      bridge_type: 'chatgpt_unified_bridge', bridge_version: '5.6',
      capabilities: { image: config.capImage !== false, vision: config.capVision !== false, ruby: config.capRuby !== false }
    };
  }
  async function closeWorker(tabId) {
    await api('/api/worker/heartbeat', { worker_id: tabId, tab_id: tabId, agent_id: config.workerId,
      bridge_type: 'chatgpt_unified_bridge', bridge_version: '5.6', executor_status: 'closed', status: 'idle' });
  }
  async function reconcileOpenTabs(force = false) {
    if (!force && Date.now() - lastRegistrySync < 15000) return;
    lastRegistrySync = Date.now();
    try {
      const actual = await chrome.tabs.query({ url: supportedUrls });
      const openIds = new Set(actual.map(tab => String(tab.id)));
      let changed = false;
      for (const [id, slot] of Object.entries(slots)) {
        if (!openIds.has(id)) {
          delete slots[id]; changed = true;
          await closeWorker(slot.tab_id).catch(() => {});
        }
      }
      if (changed) await persist();
      // Wait for ALL actual tabs to register; never merge tabs merely sharing an account.
      if (actual.some(tab => !slots[String(tab.id)] || !slots[String(tab.id)].last_seen)) return;
      const current = new Set(Object.values(slots).map(slot => slot.tab_id));
      const registered = await api('/api/extension/tabs', null, 'GET');
      if (!Array.isArray(registered)) return;
      for (const worker of registered) {
        if (worker.agent_id === config.workerId && worker.tab_id && !current.has(worker.tab_id) && worker.executor_status !== 'closed') {
          await closeWorker(worker.tab_id);
        }
      }
    } catch (error) { console.warn('[Tab identity reconciliation]', error.message); }
  }
  async function register(sender, message) {
    const id = String(sender.tab.id);
    const previous = slots[id];
    let publicId = previous?.tab_id;
    while (!publicId || Object.entries(slots).some(([key, slot]) => key !== id && slot.tab_id === publicId)) {
      publicId = `TAB-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    }
    const navigation = previous?.clean_navigation;
    const resumeClean = previous?.job && navigation && navigation.expires_at > Date.now()
      && navigation.from_document_id !== sender.documentId && new URL(sender.tab.url).pathname === '/';
    if (previous?.document_id && previous.document_id !== sender.documentId && previous.job && !resumeClean) {
      // A navigation lost the executor. Never silently replay a submitted prompt.
      previous.status = 'needs_attention';
      previous.last_error = 'Tab đã tải lại trong tác vụ; cần đối soát trước khi chạy tiếp.';
    }
    const slot = slots[id] = {
      ...previous, tab_id: publicId,
      chrome_tab_id: sender.tab.id, document_id: sender.documentId,
      account_email: message.account_email || null, provider: providerOf(sender.tab.url), url: sender.tab.url,
      conversation_id: message.conversation_id || null, last_seen: Date.now(),
      status: resumeClean ? 'preparing_chat' : previous?.job ? (previous.status || 'recovering') : message.ready === false ? 'needs_attention' : 'idle',
      clean_resume_ready: !!resumeClean && message.ready !== false
    };
    await persist();
    lastRegistrySync = 0;
    return { ok: true, tab_id: slot.tab_id, agent_id: config.workerId, blocked: !!slot.job && !resumeClean, job_id: slot.job?.id || null };
  }
  async function flushResult(key) {
    const entry = (await chrome.storage.local.get(key))[key];
    if (!entry) return true;
    // Entries remain durable when the network/server is unavailable.
    if (entry.server_url !== base()) return false;
    try {
      const response = await api('/api/worker/complete', entry.payload);
      if (!response.success) throw new Error('Missing completion ACK');
      await chrome.storage.local.remove(key);
      const slot = Object.values(slots).find(s => s.tab_id === entry.payload.worker_id);
      if (slot?.job?.id === entry.payload.task_id && slot.job.attempt_id === entry.payload.attempt_id) {
        slot.job = null;
        slot.status = 'recovering';
        slot.last_error = null;
        slot.output_type = entry.payload.output_type;
        await persist();
        await send(slot.chrome_tab_id, { action: 'RESULT_COMMITTED', task_id: entry.payload.task_id }).catch(() => {});
      }
      return true;
    } catch (error) {
      const slot = Object.values(slots).find(s => s.tab_id === entry.payload.worker_id);
      if (slot) slot.last_error = error.message;
      if ([404, 409].includes(error.status)) {
        // Retain rejected data for inspection without retrying an expired lease forever.
        await chrome.storage.local.set({ [key.replace('resultOutbox:', 'rejectedResult:')]: entry });
        await chrome.storage.local.remove(key);
        if (slot && slot.job?.id === entry.payload.task_id && slot.job.attempt_id === entry.payload.attempt_id) {
          slot.job = null;
          slot.status = 'recovering';
          await persist();
          await send(slot.chrome_tab_id, { action: 'ASSIGNMENT_REVOKED', task_id: entry.payload.task_id }).catch(() => {});
        }
      }
      return false;
    }
  }
  async function tick() {
    await ready;
    if (ticking) return;
    ticking = true;
    try {
      config = await chrome.storage.local.get(null);
      await reconcileOpenTabs();
      const stored = await chrome.storage.local.get(null);
      for (const key of Object.keys(stored).filter(k => k.startsWith('resultOutbox:'))) await flushResult(key);
      for (const [id, slot] of Object.entries(slots)) {
        // A tab with a job keeps its server lease alive even while Chrome throttles its timers.
        if (Date.now() - slot.last_seen > 20000 && !slot.job) continue;
        if (slot.job && !slot.job.action && (!slot.last_reconcile || Date.now() - slot.last_reconcile > 15000)) {
          const assignment = await api(`/api/extension/assignment/${encodeURIComponent(slot.tab_id)}`, null, 'GET');
          slot.last_reconcile = Date.now();
          if (assignment.job_id !== slot.job.id || assignment.attempt_id !== slot.job.attempt_id) {
            const revokedId = slot.job.id;
            slot.job = null;
            slot.status = 'recovering';
            await persist();
            await send(id, { action: 'ASSIGNMENT_REVOKED', task_id: revokedId }).catch(() => {});
            continue;
          }
        }
        if (!slot.last_heartbeat || Date.now() - slot.last_heartbeat >= 4000) {
          await api('/api/worker/heartbeat', { ...metadata(slot),
            status: slot.job ? 'busy' : 'idle', current_job_id: slot.job?.id || null
          });
          slot.last_heartbeat = Date.now();
        }
        if (slot.job && slot.clean_navigation && slot.clean_navigation.expires_at <= Date.now()) {
          const task = slot.job;
          const key = `resultOutbox:${slot.tab_id}:${task.id}:${task.attempt_id}`;
          await chrome.storage.local.set({ [key]: { server_url: base(), payload: { ...metadata(slot),
            task_id: task.id, attempt_id: task.attempt_id, lease_token: task.lease_token,
            status: 'failed', output_type: 'error', error: 'Trang hội thoại mới chưa sẵn sàng sau 60 giây. Kiểm tra đăng nhập và tải lại tab xử lý; prompt chưa được gửi.' } } });
          slot.clean_navigation = null;
          slot.clean_resume_ready = false;
          slot.status = 'uploading';
          await persist();
          await flushResult(key);
          continue;
        }
        if (slot.job && slot.clean_resume_ready && slot.clean_navigation?.expires_at > Date.now()) {
          slot.clean_resume_ready = false;
          slot.clean_navigation = null;
          slot.status = 'reserved';
          await persist();
          const answer = await send(id, { action: 'EXECUTE_JOB', task: slot.job });
          if (!answer?.ok) { slot.status = 'needs_attention'; slot.last_error = answer?.error || 'Không tiếp tục được tác vụ sau khi mở hội thoại'; }
          await persist();
          continue;
        }
        if (config.autoPoll === false || slot.job || slot.status !== 'idle') continue;
        // Unknown accounts share the profile budget. Never infer independence from tab count.
        const account = (slot.provider || 'chatgpt') + ':' + (slot.account_email || config.workerId);
        if (Object.values(slots).some(other => other.job && ((other.provider || 'chatgpt') + ':' + (other.account_email || config.workerId)) === account)) continue;
        const query = new URLSearchParams(Object.entries(metadata(slot)).filter(([, v]) => typeof v === 'string'));
        const data = await api(`/api/worker/poll?${query}`, null, 'GET');
        if (!data.has_task || !data.task) continue;
        const task = data.task;
        slot.job = task;
        slot.clean_navigation = null;
        slot.clean_resume_ready = false;
        slot.prompt_started = false;
        slot.output_type = null;
        slot.status = 'reserved';
        await persist();
        if (task.action === 'new_chat') {
          const answer = await send(id, { action: 'TRIGGER_NEW_CHAT' });
          slot.job = null;
          slot.status = answer?.ok ? 'idle' : 'needs_attention';
        } else {
          const answer = await send(id, { action: 'EXECUTE_JOB', task });
          if (!answer?.ok) {
            slot.status = 'needs_attention';
            slot.last_error = answer?.error || 'Executor không xác nhận nhận việc';
          }
        }
        await persist();
      }
    } catch (error) {
      console.warn('[Tab coordinator]', error.message);
    } finally { ticking = false; }
  }
  async function handle(message, sender) {
    await ready;
    if (message.action === 'GET_TAB_POOL') {
      await reconcileOpenTabs(true);
      const activeTabs = await chrome.tabs.query({ url: supportedUrls });
      const activeIds = new Set(activeTabs.map(t => String(t.id)));
      return { ok: true, agent_id: config.workerId, tabs: Object.entries(slots)
        .filter(([id]) => activeIds.has(id)).map(([, s]) => ({
          tab_id: s.tab_id, chrome_tab_id: s.chrome_tab_id, account_email: s.account_email, provider: s.provider || 'chatgpt',
          status: s.status, job_id: s.job?.id || null, output_type: s.output_type,
          last_error: s.last_error, live: Date.now() - s.last_seen < 20000
        })) };
    }
    if (message.action === 'FOCUS_POOL_TAB') {
      const slot = Object.values(slots).find(s => s.tab_id === message.tab_id);
      if (!slot) return { ok: false };
      await chrome.tabs.update(slot.chrome_tab_id, { active: true });
      return { ok: true };
    }
    if (!sender.tab || !/^https:\/\/(chatgpt\.com|gemini\.google\.com)\//.test(sender.tab.url || '')) throw new Error('Invalid executor');
    if (message.action === 'FOCUS_SELF') {
      // Background tabs pause rendering, so ChatGPT never shows pasted attachments; bring the executor to the front.
      const win = await chrome.windows.get(sender.tab.windowId);
      await chrome.windows.update(win.id, win.state === 'minimized' ? { state: 'normal', focused: true } : { focused: true });
      await chrome.tabs.update(sender.tab.id, { active: true });
      return { ok: true };
    }
    if (message.action === 'REGISTER_EXECUTOR') return register(sender, message);
    const slot = slots[String(sender.tab.id)];
    if (!slot || slot.document_id !== sender.documentId) throw new Error('Executor must register');
    if (message.action === 'EXECUTOR_STATUS') {
      slot.last_seen = Date.now();
      slot.account_email = message.account_email || null;
      slot.url = sender.tab.url;
      slot.conversation_id = message.conversation_id || null;
      if (slot.status === 'preparing_chat' && slot.clean_navigation?.expires_at > Date.now()
        && slot.clean_navigation.from_document_id !== sender.documentId && new URL(sender.tab.url).pathname === '/' && message.ready && !message.busy) slot.clean_resume_ready = true;
      if (!slot.job) slot.status = message.busy ? 'recovering' : message.ready === false ? 'needs_attention' : 'idle';
      await persist();
      return { ok: true };
    }
    const task = slot.job;
    if (!task || task.id !== message.task_id || task.attempt_id !== message.attempt_id) throw new Error('Stale assignment');
    if (message.action === 'NAVIGATE_CLEAN_CHAT') {
      if (task.new_chat !== true || task._clean_navigation_attempted || slot.prompt_started) throw new Error('Không được điều hướng sau khi đã bắt đầu gửi tác vụ');
      const assignment = await api(`/api/extension/assignment/${encodeURIComponent(slot.tab_id)}`, null, 'GET');
      if (assignment.job_id !== task.id || assignment.attempt_id !== task.attempt_id) throw new Error('Tác vụ đã được server thu hồi');
      task._clean_navigation_attempted = true;
      slot.clean_navigation = { from_document_id: sender.documentId, expires_at: Date.now() + 60000 };
      slot.status = 'preparing_chat';
      await persist();
      try { await chrome.tabs.update(sender.tab.id, { url: rootOf(sender.tab.url) }); }
      catch (error) { slot.clean_navigation = null; slot.status = 'needs_attention'; await persist(); throw error; }
      return { ok: true };
    }
    if (message.action === 'EXECUTOR_EVENT') {
      const type = message.kind;
      if (!['progress', 'preview'].includes(type)) throw new Error('Invalid event');
      if (type === 'preview' || Number(message.payload?.progress) >= 35) slot.prompt_started = true;
      slot.status = 'generating';
      slot.last_seen = Date.now();
      const body = { ...message.payload, ...metadata(slot), task_id: task.id, attempt_id: task.attempt_id, lease_token: task.lease_token };
      await api(`/api/worker/${type}`, body);
      await persist();
      return { ok: true };
    }
    if (message.action === 'RESULT_READY') {
      slot.status = 'uploading';
      slot.output_type = message.payload.output_type;
      const payload = { ...message.payload, ...metadata(slot), task_id: task.id,
        attempt_id: task.attempt_id, lease_token: task.lease_token };
      const key = `resultOutbox:${slot.tab_id}:${task.id}:${task.attempt_id}`;
      await chrome.storage.local.set({ [key]: { server_url: base(), payload } });
      await persist();
      return { ok: true, committed: await flushResult(key) };
    }
    throw new Error('Unknown coordinator action');
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!['REGISTER_EXECUTOR', 'GET_TAB_POOL', 'FOCUS_POOL_TAB', 'FOCUS_SELF', 'EXECUTOR_STATUS', 'EXECUTOR_EVENT', 'RESULT_READY', 'NAVIGATE_CLEAN_CHAT'].includes(message.action)) return;
    // Registration/state events are serialized; polling has a separate single-flight guard.
    serial = serial.then(() => handle(message, sender)).then(respond, e => respond({ ok: false, error: e.message }));
    return true;
  });
  chrome.tabs.onRemoved.addListener(id => { ready.then(async () => {
    const slot = slots[String(id)];
    if (slot) {
      delete slots[String(id)];
      await persist();
      await closeWorker(slot.tab_id).catch(() => {});
    }
  }); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.keys(changes).some(k => k !== 'tabIdentityBindings' && !k.startsWith('resultOutbox:'))) ready.then(async () => { config = await chrome.storage.local.get(null); });
  });
  // Chrome tab IDs can be reused after a browser restart, unlike an extension reload.
  chrome.runtime.onStartup?.addListener(() => { ready.then(async () => { slots = {}; await persist(); lastRegistrySync = 0; }); });
  chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'tab-coordinator') tick(); });
  chrome.alarms.create('tab-coordinator', { periodInMinutes: 0.5 });
  setInterval(tick, 1500);
  ready.then(tick);
  return { tick };
})();
