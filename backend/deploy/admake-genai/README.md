# Admake-hosted GenAI bridge

Deployed 2026-11-03 to Admake VPS 103.163.219.87. GenAI Toolx service is unchanged.

## Admin

Open https://admake.vn/lead-manage/#genai or /lead-manage/genai/.
Use an active role -2 account in lead 243. The console creates a one-hour Secure/HttpOnly session using a dedicated server-only signing key. No browser/API credentials are embedded in HTML.
Click Connect, then use noVNC to sign in to the chat account manually. Select the VPS worker and enable receiving work only after login. A real generation test and production cutover remain pending that login.

## Services

- admake-genai: Python image/edit job orchestrator, loopback port 6002; source /opt/admake-genai/bridge/server.py.
- admake-genai-desktop: TigerVNC display :12, loopback port 5912.
- admake-genai-window: Openbox.
- admake-genai-browser: sandboxed Chrome for Testing with V5.3 unpacked extension. Persistent profile /var/lib/admake-genai/chrome-profile.
- admake-genai-websockify: loopback port 6082.
- noVNC at /genai/desktop/ is protected for both assets and websocket upgrade by Nginx auth_request.

The dedicated OS user is admake-genai. The browser uses the scoped AppArmor userns allowance in /etc/apparmor.d/admake-genai-chrome; no --no-sandbox flag.
Memory limits: bridge 300 MB, browser 800 MB. VPS currently has 2 GB RAM. One browser session is provisioned.

## Provider API

Base URL https://admake.vn/genai/api/; Authorization: Bearer SERVICE_KEY.
Service key is stored root-only at /etc/admake-genai-api.key; never put it in frontend bundles. Admin session signing key is /etc/admake-genai-session.key and is independent of legacy Flask secrets.

POST /jobs/create {"prompt":"..."}
POST /jobs/edit-full {"prompt":"...","reference_images":["data:image/png;base64,..."]}
GET /jobs/JOB_ID
GET /status
POST /chatgpt/new_chat {"worker_id":"TAB-..."} explicitly opens a fresh conversation. Image tasks do not implicitly request a new conversation.

Generated files: /var/lib/admake-genai/images, served as /genai/images/ with unguessable generated names. Task store follows the source bridge's in-memory behavior; do not restart during active jobs. Worker settings persist in /opt/admake-genai/bridge/data.

## Operations

systemctl status admake-genai admake-genai-desktop admake-genai-browser admake-genai-websockify
journalctl -u admake-genai -n 50
Restart browser only after checking no task is running. Session/profile is preserved; do not copy login cookies from a different computer.
Production backend bootstrap app.py registers api/genai_admin.py. Console shell: templates/genai_console.html. Navigation: templates/admin_leads.html.

Original Admake GenAI consumer URLs still point to the existing GenAI service; they were not switched before account login and a successful image test.


## Direct chat-login handoff

The console UI no longer shows the ERP administrator login form. Existing authenticated admins can still establish a session via the session API. An operator can also redeem a 10-minute single-use signed access ticket, passed in the URL fragment and POSTed once to /lead-manage/genai/access. The fragment is removed before loading the desktop. Ticket files live in /var/lib/admake-genai/operator-tickets; redemption atomically renames the SHA256-named file to .used. The operator cookie lasts 8 hours, is HttpOnly/Secure and only authorizes this console, not ERP routes. Anonymous visitors still cannot access VNC or provider APIs. Do not publish access-ticket URLs.

noVNC packaging: copy `novnc-package.json` to `/usr/share/novnc/package.json` when the distro package omits this metadata file. The UI reads it to show its version.

Image serving permissions: Nginx (`www-data`) needs traverse-only access through `/var/lib/admake-genai` to the public images alias. Apply `setfacl -m u:www-data:--x /var/lib/admake-genai` (or add only other-execute if ACL tooling is unavailable). Keep `chrome-profile` at 0700; public image files/directories need 0644/0755. Verify a generated image returns HTTP 200 from its public URL.
