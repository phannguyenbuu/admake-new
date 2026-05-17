from __future__ import annotations

import argparse
import base64
import json
import os
import re
import time
import unicodedata
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from uuid import uuid4


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8787

BLOCKED_MXS_PATTERNS = (
    r"\bfileIn\b",
    r"\bshellLaunch\b",
    r"\bDOSCommand\b",
    r"\bHiddenDOSCommand\b",
    r"\bcreateOLEObject\b",
    r"\bloadMaxFile\b",
    r"\bsaveMaxFile\b",
    r"\bresetMaxFile\b",
    r"\bquitMax\b",
    r"System\.Diagnostics\.Process",
)


@dataclass
class Job:
    id: str
    prompt: str
    mxs: str
    source: str
    created_at: float = field(default_factory=time.time)
    status: str = "queued"
    result: str | None = None
    error: str | None = None


JOBS: dict[str, Job] = {}
QUEUE: list[str] = []


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", strip_accents(value).lower()).strip()


def parse_dimensions(text: str, defaults: tuple[float, float, float]) -> tuple[float, float, float]:
    clean = norm(text).replace(",", ".")
    size_match = re.search(r"(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)", clean)
    if size_match:
        return tuple(float(size_match.group(i)) for i in range(1, 4))  # type: ignore[return-value]

    length, width, height = defaults
    patterns = {
        "length": r"(?:dai|length|l)\s*[:=]?\s*(\d+(?:\.\d+)?)",
        "width": r"(?:rong|width|w)\s*[:=]?\s*(\d+(?:\.\d+)?)",
        "height": r"(?:cao|height|h)\s*[:=]?\s*(\d+(?:\.\d+)?)",
    }
    if match := re.search(patterns["length"], clean):
        length = float(match.group(1))
    if match := re.search(patterns["width"], clean):
        width = float(match.group(1))
    if match := re.search(patterns["height"], clean):
        height = float(match.group(1))
    return length, width, height


def parse_radius_height(text: str, default_radius: float = 10.0, default_height: float = 30.0) -> tuple[float, float]:
    clean = norm(text).replace(",", ".")
    radius = default_radius
    height = default_height
    nums = re.findall(r"\d+(?:\.\d+)?", clean)
    if match := re.search(r"(?:ban kinh|radius|r)\s*[:=]?\s*(\d+(?:\.\d+)?)", clean):
        radius = float(match.group(1))
    elif nums:
        radius = float(nums[0])
    if match := re.search(r"(?:cao|height|h)\s*[:=]?\s*(\d+(?:\.\d+)?)", clean):
        height = float(match.group(1))
    elif len(nums) >= 2:
        height = float(nums[1])
    return radius, height


def parse_pos(text: str) -> tuple[float, float, float]:
    clean = norm(text).replace(",", ".")
    match = re.search(r"(?:tai|pos|position|vi tri)\s*[:=]?\s*\[?\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\]?", clean)
    if not match:
        return 0.0, 0.0, 0.0
    return tuple(float(match.group(i)) for i in range(1, 4))  # type: ignore[return-value]


def fmt_num(value: float) -> str:
    return str(int(value)) if value == int(value) else f"{value:.3f}".rstrip("0").rstrip(".")


def mxs_header(title: str) -> str:
    return f'undo "{title}" on\n(\n'


def mxs_footer() -> str:
    return "    select obj\n)\n"


def rule_compile(prompt: str) -> tuple[str | None, str]:
    clean = norm(prompt)
    x, y, z = parse_pos(prompt)
    pos = f"[{fmt_num(x)},{fmt_num(y)},{fmt_num(z)}]"

    if any(key in clean for key in ("box", "hop", "khoi hop", "lap phuong", "hinh hop")):
        length, width, height = parse_dimensions(prompt, (20.0, 20.0, 20.0))
        mxs = (
            mxs_header("MXSAgent Create Box")
            + f"    local obj = box length:{fmt_num(length)} width:{fmt_num(width)} height:{fmt_num(height)} pos:{pos}\n"
            + '    obj.name = uniqueName "agent_box"\n'
            + mxs_footer()
        )
        return mxs, "rules"

    if any(key in clean for key in ("sphere", "cau", "hinh cau")):
        radius, _ = parse_radius_height(prompt, 10.0, 10.0)
        mxs = (
            mxs_header("MXSAgent Create Sphere")
            + f"    local obj = sphere radius:{fmt_num(radius)} segments:32 pos:{pos}\n"
            + '    obj.name = uniqueName "agent_sphere"\n'
            + mxs_footer()
        )
        return mxs, "rules"

    if any(key in clean for key in ("cylinder", "tru", "hinh tru")):
        radius, height = parse_radius_height(prompt, 10.0, 30.0)
        mxs = (
            mxs_header("MXSAgent Create Cylinder")
            + f"    local obj = cylinder radius:{fmt_num(radius)} height:{fmt_num(height)} sides:32 pos:{pos}\n"
            + '    obj.name = uniqueName "agent_cylinder"\n'
            + mxs_footer()
        )
        return mxs, "rules"

    if any(key in clean for key in ("plane", "mat phang", "san")):
        length, width, _ = parse_dimensions(prompt, (50.0, 50.0, 0.0))
        mxs = (
            mxs_header("MXSAgent Create Plane")
            + f"    local obj = plane length:{fmt_num(length)} width:{fmt_num(width)} pos:{pos}\n"
            + '    obj.name = uniqueName "agent_plane"\n'
            + mxs_footer()
        )
        return mxs, "rules"

    if "teapot" in clean or "am tra" in clean:
        radius, _ = parse_radius_height(prompt, 10.0, 10.0)
        mxs = (
            mxs_header("MXSAgent Create Teapot")
            + f"    local obj = teapot radius:{fmt_num(radius)} pos:{pos}\n"
            + '    obj.name = uniqueName "agent_teapot"\n'
            + mxs_footer()
        )
        return mxs, "rules"

    return None, "none"


def compact_system_prompt() -> str:
    return (
        "You compile Vietnamese/English natural language into short safe Autodesk 3ds Max MaxScript. "
        "Return JSON only: {\"mxs\":\"...\",\"notes\":[\"...\"],\"risk\":\"low|medium|high\"}. "
        "Use valid MaxScript named args with colon, e.g. box length:20 width:10 height:5 pos:[0,0,0]. "
        "Prefer primitive geometry and simple transforms. No file/network/shell commands. Keep script concise."
    )


def call_llm(prompt: str) -> tuple[str | None, str]:
    api_key = os.getenv("MXS_AGENT_API_KEY") or os.getenv("OPENAI_API_KEY")
    model = os.getenv("MXS_AGENT_MODEL")
    if not api_key or not model:
        return None, "no_llm_config"

    url = os.getenv("MXS_AGENT_CHAT_URL", "https://api.openai.com/v1/chat/completions")
    body = {
        "model": model,
        "temperature": 0,
        "max_tokens": int(os.getenv("MXS_AGENT_MAX_TOKENS", "450")),
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": compact_system_prompt()},
            {"role": "user", "content": json.dumps({"cmd": prompt}, ensure_ascii=False, separators=(",", ":"))},
        ],
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        return None, f"llm_error:{exc}"

    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    try:
        parsed = json.loads(extract_json(content))
    except json.JSONDecodeError:
        return None, "llm_non_json"
    return parsed.get("mxs"), "llm"


def extract_json(value: str) -> str:
    value = value.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?", "", value, flags=re.I).strip()
        value = re.sub(r"```$", "", value).strip()
    first = value.find("{")
    last = value.rfind("}")
    return value[first : last + 1] if first >= 0 and last >= first else value


def convert_call_args(match: re.Match[str]) -> str:
    func = match.group(1)
    args = match.group(2)
    parts = [part.strip() for part in args.split(",") if part.strip()]
    fixed = []
    for part in parts:
        part = re.sub(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*=", r"\1:", part)
        fixed.append(part)
    return f"{func} " + " ".join(fixed)


def repair_mxs(script: str) -> str:
    script = script.strip()
    if script.startswith("```"):
        script = re.sub(r"^```(?:maxscript|mxs)?", "", script, flags=re.I).strip()
        script = re.sub(r"```$", "", script).strip()

    script = script.replace("：", ":")
    script = re.sub(r"\b(box|sphere|cylinder|plane|teapot)\s*\(([^)]*)\)", convert_call_args, script, flags=re.I)
    script = re.sub(r"\b(length|width|height|radius|segments|sides|pos)\s*=", r"\1:", script, flags=re.I)
    script = re.sub(r",\s*(?=(?:length|width|height|radius|segments|sides|pos)\s*:)", " ", script, flags=re.I)

    if not script.endswith("\n"):
        script += "\n"
    return script


def validate_mxs(script: str) -> list[str]:
    warnings: list[str] = []
    for pattern in BLOCKED_MXS_PATTERNS:
        if re.search(pattern, script, flags=re.I):
            warnings.append(f"blocked unsafe token: {pattern}")
    if len(script) > 8000:
        warnings.append("script too long")
    return warnings


def compile_prompt(prompt: str) -> tuple[str, str, list[str]]:
    mxs, source = rule_compile(prompt)
    if mxs is None:
        mxs, source = call_llm(prompt)
    if mxs is None:
        mxs = (
            '-- MXS Agent could not infer the geometry intent.\n'
            '-- Try: "ve box 20x20x10", "ve sphere radius 15", or "ve cylinder r 10 cao 50".\n'
        )
        source = "fallback_empty"

    mxs = repair_mxs(mxs)
    warnings = validate_mxs(mxs)
    if warnings:
        mxs = "-- Blocked by MXS Agent safety validator.\n-- " + "\n-- ".join(warnings) + "\n"
        source = f"{source}:blocked"
    return mxs, source, warnings


def enqueue(prompt: str) -> Job:
    mxs, source, _ = compile_prompt(prompt)
    job = Job(id=uuid4().hex[:12], prompt=prompt, mxs=mxs, source=source)
    JOBS[job.id] = job
    QUEUE.append(job.id)
    return job


def json_bytes(data: Any) -> bytes:
    return json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")


def b64(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")


def b64_decode(value: str) -> str:
    return base64.b64decode(value.encode("ascii")).decode("utf-8", errors="replace")


class AgentHandler(BaseHTTPRequestHandler):
    server_version = "MXSAgent/0.1"

    def log_message(self, fmt: str, *args: Any) -> None:
        if os.getenv("MXS_AGENT_QUIET") != "1":
            super().log_message(fmt, *args)

    def send_json(self, status: int, data: Any) -> None:
        body = json_bytes(data)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_text(self, status: int, text: str) -> None:
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length") or "0")
        return self.rfile.read(length) if length else b""

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == "/health":
            self.send_json(200, {"ok": True, "queued": len(QUEUE), "jobs": len(JOBS)})
            return

        if path == "/next.txt":
            if not QUEUE:
                self.send_response(HTTPStatus.NO_CONTENT)
                self.end_headers()
                return
            job_id = QUEUE.pop(0)
            job = JOBS[job_id]
            job.status = "sent"
            self.send_text(200, f"id:{job.id}\nsource:{job.source}\nscript64:{b64(job.mxs)}\n")
            return

        if path.startswith("/jobs/"):
            job_id = path.rsplit("/", 1)[-1]
            job = JOBS.get(job_id)
            if not job:
                self.send_json(404, {"error": "job not found"})
                return
            self.send_json(200, job.__dict__)
            return

        if path == "/jobs":
            self.send_json(200, [job.__dict__ for job in JOBS.values()])
            return

        self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        raw = self.read_body()

        if path in ("/ask", "/compile"):
            try:
                payload = json.loads(raw.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self.send_json(400, {"error": "invalid json"})
                return
            text = str(payload.get("text") or payload.get("prompt") or "").strip()
            if not text:
                self.send_json(400, {"error": "missing text"})
                return
            if path == "/compile" or payload.get("enqueue") is False:
                mxs, source, warnings = compile_prompt(text)
                self.send_json(200, {"mxs": mxs, "source": source, "warnings": warnings})
                return
            job = enqueue(text)
            self.send_json(200, {"id": job.id, "mxs": job.mxs, "source": job.source, "status": job.status})
            return

        if path == "/result.txt":
            lines = raw.decode("utf-8", errors="replace").splitlines()
            data: dict[str, str] = {}
            for line in lines:
                if ":" in line:
                    key, value = line.split(":", 1)
                    data[key.strip()] = value.strip()
            job = JOBS.get(data.get("id", ""))
            if not job:
                self.send_text(404, "missing job")
                return
            ok = data.get("ok") == "1"
            message = b64_decode(data.get("message64", "")) if data.get("message64") else ""
            job.status = "done" if ok else "error"
            job.result = message if ok else None
            job.error = None if ok else message
            self.send_text(200, "ok")
            return

        self.send_json(404, {"error": "not found"})


def main() -> None:
    parser = argparse.ArgumentParser(description="Server-side natural language to MaxScript agent.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), AgentHandler)
    print(f"MXS Agent server listening on http://{args.host}:{args.port}")
    print("POST /ask with {\"text\":\"ve box 20x20x10\"}; load 3dsmax_agent_client.ms in 3ds Max.")
    server.serve_forever()


if __name__ == "__main__":
    main()
