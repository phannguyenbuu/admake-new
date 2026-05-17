# RTK

Use RTK whenever it is available to reduce terminal output before it enters the model context.

Rules:
- Start each Codex session with `rtk --version`.
- If RTK is not installed, continue normally and state that RTK is unavailable.
- If RTK is installed, prefer `rtk` for verbose shell operations such as `git status`, `git diff`, `git log`, `pytest`, `npm test`, `pnpm test`, `vitest`, `cargo test`, `rg`, `grep`, `find`, `tree`, large `ls`, `docker ps`, `kubectl get pods`, and similar high-volume commands.
- If full raw output is needed, say why before bypassing RTK.
- After significant work, optionally run `rtk gain`.
