import UI from './app/ui.js';
window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'iadmake-login-input') return;
    const {id, text} = event.data;
    let ok = false;
    try {
        if (UI.connected && UI.rfb && typeof text === 'string' && text.length > 0 && text.length <= 10000) {
            for (const char of text.replace(/\r\n/g, '\n')) {
                const cp = char.codePointAt(0);
                UI.rfb.sendKey(char === '\n' ? 0xff0d : char === '\t' ? 0xff09 : cp <= 255 ? cp : 0x01000000 + cp);
            }
            ok = true;
        }
    } catch (_) { /* Never log login values. */ }
    event.source.postMessage({type:'iadmake-login-input-result', id, ok}, event.origin);
});

// Capture before noVNC forwards Ctrl+V to the remote clipboard.
window.addEventListener('keydown', async event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== 'v') return;
    if (!UI.connected || !UI.rfb) return;
    if (event.target.closest?.('#noVNC_control_bar')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
        const text = await navigator.clipboard.readText();
        if (!text || text.length > 10000) return;
        UI.rfb.sendKey(0xffe3, 'ControlLeft', false);
        UI.rfb.sendKey(0xffe4, 'ControlRight', false);
        UI.rfb.sendKey(0xffeb, 'MetaLeft', false);
        for (const char of text.replace(/\r\n/g, '\n')) {
            const cp = char.codePointAt(0);
            UI.rfb.sendKey(char === '\n' ? 0xff0d : char === '\t' ? 0xff09 : cp <= 255 ? cp : 0x01000000 + cp);
        }
    } catch (_) {
        window.parent.postMessage({type:'iadmake-paste-error'}, location.origin);
    }
}, true);
