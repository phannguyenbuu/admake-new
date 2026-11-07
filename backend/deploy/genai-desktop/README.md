# GenAI VPS Chrome / noVNC

Host: genai.toolxprint.com (157.66.80.125). GenAI frontend source: `D:/Dropbox/_Documents/GenImgs`; tab `/desktop` embeds `/vps-console/`.

Runtime: `/opt/genai-desktop`, persistent Chrome profile `/var/lib/genai-desktop/chrome-profile` (0700), user `genai-desktop`. Extension V5 protocol (current package 5.3) uses loopback bridge `http://127.0.0.1:5000`, PC label `GENAI_VPS`. Existing bridge and external workers remain unchanged.

Services enabled at boot: `genai-desktop-desktop`, `genai-desktop-window`, `genai-desktop-browser`, `genai-desktop-websockify`, `genai-desktop-console`. Display :12, VNC loopback 5912, websocket relay loopback 6082, authenticated Flask console loopback 6083.

Console access code and signing key: `/var/lib/genai-desktop/connect.key` and `session.key`, 0600, owned by service user. Never put secrets into source, URLs, or logs. Browser cookie: Secure/HttpOnly/SameSiteStrict, 8-hour lifetime. Nginx auth_request guards static noVNC resources and websocket handshakes. Keep the worker paused until user signs in and explicitly enables it. Credentials are entered directly into remote Chrome; no credential input panel is included.

Chrome for Testing 156.0.8078.80 from official Google distribution; sandbox enabled with a scoped Ubuntu AppArmor userns allowance. Root-owned chrome_sandbox uses 4755. No remote debugging port exposed.

Deployment assets: service units, console_server.py + console.html, extension/, nginx-locations.conf, noVNC package metadata and clipboard input module. Inject `<script type="module" src="iadmake-login-input.js"></script>` into noVNC vnc.html. Console iframe URL must use `path=vps-desktop/websockify`.

Verification: build frontend, test console boundary, HTTP anonymous VNC 401; authorized static resources 200; websocket 101. Screenshot confirms remote ChatGPT login screen. Account sign-in and a live generation require the user to complete login.

Window controls: install `wmctrl` (xprop from x11-utils), authenticated POST `/vps-console/windows/maximize-all` restores/maximizes Chrome windows, `/switch` cycles Chrome windows. Commands run as desktop user on DISPLAY=:12; only fixed commands/window IDs from wmctrl are used.
