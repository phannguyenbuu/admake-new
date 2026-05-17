# RTK

Use RTK whenever it is available to reduce terminal output before it enters the agent context.

Rules:
- Start each session by running `rtk --version`.
- If RTK is not installed, continue normally and state that RTK is unavailable.
- If RTK is installed, prefer `rtk`-wrapped commands for verbose shell work such as `git status`, `git diff`, `git log`, `pytest`, `npm test`, `pnpm test`, `vitest`, `cargo test`, `rg`, `grep`, `find`, `tree`, large `ls`, `docker ps`, and `kubectl get pods`.
- If full raw output is required for debugging, state why before bypassing RTK.
- After significant work, optionally run `rtk gain`.
