# -*- coding: utf-8 -*-
"""Chạy mã Ruby SketchUp trong sandbox và xuất model3d (prism/text) cho Three.js."""

import re
import time

from .geom import Transformation
from .runtime import LimitError, RubyError
from . import sketchup as su

IN2M = 1 / 39.37007874015748
MAX_ELEMENTS = 4000
MAX_LINES = 2500
DEFAULT_COLOR = "#b0b8c0"
GROUND_RE = re.compile(
    r"ground|terrain|mat[ _]?dat|mặt đất|grass|lawn|asphalt|road|sidewalk|pavement|via[ _]?he|vỉa hè|nen[ _]?dat|nền đất",
    re.IGNORECASE)


def _to3(p):
    """SketchUp (inch, Z-up) -> Three.js (m, Y-up)."""
    return [round(p[0] * IN2M, 4), round(p[2] * IN2M, 4), round(-p[1] * IN2M, 4)]


def _mat_info(m):
    if isinstance(m, su.Material):
        c, alpha, name = m.color, m.alpha, m.name
        if c.a < 255:
            alpha = min(alpha, c.a / 255.0)
        return c.hex(), alpha, name
    if isinstance(m, su.Color):
        return m.hex(), m.a / 255.0, ""
    return DEFAULT_COLOR, 1.0, ""


class _Collector:
    def __init__(self):
        self.out = []
        self.truncated = False
        self.lines = 0

    def add(self, el):
        if len(self.out) >= MAX_ELEMENTS:
            self.truncated = True
            return
        self.out.append(el)

    def walk(self, ents, tr, inherited, gname, depth=0):
        if depth > 40:
            return
        for e in list(ents.items):
            if getattr(e, "erased", False) or getattr(e, "hidden", False):
                continue
            if isinstance(e, (su.Group, su.ComponentInstance)):
                name = e.name or (e.defn.name if isinstance(e, su.ComponentInstance) else "") or gname
                cnt = e.content()
                if cnt is not None:
                    self.walk(cnt, tr.compose(e.tr), e.material or inherited, name, depth + 1)
            elif isinstance(e, su.TextBlock):
                self.prism(e.base, e.vec, e.material or inherited, gname, tr, text=e.text)
            elif isinstance(e, su.Solid):
                self.prism(e.base, e.vec, e.get_material() or inherited, gname, tr)
            elif isinstance(e, su.Face) and not e.pushed and len(e.pts) >= 3:
                thick = 0.08  # ~2 mm
                vec = tuple(c * thick for c in e.normal)
                self.prism(e.pts, vec, e.material or e.back_material or inherited, gname, tr, flat=True)
            elif isinstance(e, su.Edge) and not (e.curve is not None and getattr(e.curve, "face_made", False)):
                self.line(e, inherited, gname, tr)

    def line(self, e, mat, gname, tr):
        if self.lines >= MAX_LINES:
            return
        self.lines += 1
        color, _, _ = _mat_info(mat)
        self.add({"name": gname or "Thanh", "type": "line", "base": [_to3(tr.apply_point(e.p1)), _to3(tr.apply_point(e.p2))],
                  "extrude": [0, 0, 0], "color": color if mat is not None else "#475569", "_mat": ""})

    def prism(self, base, vec, mat, gname, tr, text=None, flat=False):
        pts = [tr.apply_point(p) for p in base]
        v = tr.apply_vec(vec)
        color, alpha, mname = _mat_info(mat)
        el = {
            "name": gname or mname or ("Chữ 3D" if text else "Khối"),
            "type": "text" if text else "prism",
            "base": [_to3(p) for p in pts],
            "extrude": _to3(v),
            "color": color,
        }
        if text:
            el["text"] = text
        if alpha < 0.999:
            el["opacity"] = round(max(0.05, alpha), 3)
        if flat:
            el["flat"] = True
        el["_mat"] = mname
        self.add(el)


def _bbox(el):
    pts = el["base"] + [[p[i] + el["extrude"][i] for i in range(3)] for p in el["base"]]
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    return lo, hi


def _is_ground(el, lo, hi):
    if GROUND_RE.search(el.get("name", "")) or GROUND_RE.search(el.get("_mat", "")):
        return True
    sx, sy, sz = hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]
    return sx > 25 and sz > 25 and sy < 0.6


def _dimensions(code, boxes):
    dims = {}
    for key, pats in (("width", r"(?:BOARD|SIGN|PANEL|BANNER|FACE)_?(?:W|WIDTH)"),
                      ("height", r"(?:BOARD|SIGN|PANEL|BANNER|FACE)_?(?:H|HEIGHT)"),
                      ("depth", r"(?:BOARD|SIGN|PANEL|BANNER|FACE)_?(?:D|DEPTH|THICK|THICKNESS)")):
        m = re.search(pats + r"\s*=\s*([\d.]+)\s*\.?\s*(m|cm|mm)?\b", code)
        if m:
            v = float(m.group(1))
            unit = m.group(2) or ("mm" if v > 200 else "m")
            dims[key] = v / {"m": 1, "cm": 100, "mm": 1000}[unit]
    best = None
    for lo, hi in boxes:
        sx, sy, sz = hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]
        area = max(sx, sz) * sy
        if min(sx, sz) < 0.8 * max(sx, sz) and (best is None or area > best[0]):
            best = (area, max(sx, sz), sy, min(sx, sz))
    if best is None and boxes:
        lo = [min(b[0][i] for b in boxes) for i in range(3)]
        hi = [max(b[1][i] for b in boxes) for i in range(3)]
        best = (0, max(hi[0] - lo[0], hi[2] - lo[2]), hi[1] - lo[1], min(hi[0] - lo[0], hi[2] - lo[2]))
    if best:
        dims.setdefault("width", best[1])
        dims.setdefault("height", best[2])
        if best[3] > 0.02:
            dims.setdefault("depth", best[3])
    return {k: round(dims.get(k, d), 2) for k, d in (("width", 6.0), ("height", 2.5), ("depth", 0.25))}


def _category(w, h, code):
    low = code.lower()
    if w <= 1.5 and h <= 1.2:
        return "mini", "Biển Vẫy / Hộp Đèn Gắn Tường"
    if w >= 10.0 or (w >= 6.0 and ("billboard" in low or "pano" in low)):
        return "billboard", "Pano Tấm Lớn / Billboard"
    return "storefront", "Bảng Hiệu Mặt Tiền"


def repair_ruby_syntax(src: str) -> str:
    """Tự động bù ngoặc bị thiếu ở cuối dòng lệnh do LLM sinh ra trước câu lệnh mới hoặc block kết thúc."""
    src = src.strip()
    # Loại bỏ các thẻ metadata hệ thống nếu bị dán nhầm vào
    src = re.sub(r'<(?:ADDITIONAL_METADATA|USER_REQUEST|CONTEXT_SUMMARY)>.*?</(?:ADDITIONAL_METADATA|USER_REQUEST|CONTEXT_SUMMARY)>', '', src, flags=re.DOTALL | re.IGNORECASE)
    src = re.sub(r'</?[a-zA-Z_]+(?:\s+[^>]*)?>', '', src)

    if src.startswith("```"):
        src = re.sub(r"^```(?:ruby|rb)?\s*", "", src)
    if "```" in src:
        src = src.split("```")[0].strip()

    # Thay the .gsub(/.../, ...) bang .tr(" ", "_") de tranh loi regex trong chuoi interpolation
    src = re.sub(r'\.gsub\s*\(\s*/[^/]+/\s*,\s*["\'][^"\']*["\']\s*\)', '.tr(" ", "_")', src)

    lines = src.splitlines()
    repaired = []
    continuation_chars = ('(', '[', '{', ',', '+', '-', '*', '/', '\\', '.')
    continuation_words = ('unless', 'if', 'while', 'until', 'rescue', 'and', 'or', 'then', 'else', 'elsif', 'do')

    for i, line in enumerate(lines):
        line = re.sub(r'^(end)\s*[-—=~>]+\s*.*$', r'\1', line)
        # Bỏ qua các thẻ xml/metadata hệ thống nếu lọt vào mã nguồn
        s_line = line.strip()
        if s_line.startswith('<') and (s_line.endswith('>') or '/' in s_line):
            continue
        clean = line.split('#')[0].rstrip()
        words = clean.split()
        if not clean or clean.endswith(continuation_chars) or (words and words[-1] in continuation_words):
            repaired.append(line)
            continue

        no_str = re.sub(r'"[^"]*"|\'[^\']*\'', '', clean)
        diff_paren = no_str.count('(') - no_str.count(')')
        diff_bracket = no_str.count('[') - no_str.count(']')

        if diff_paren > 0 or diff_bracket > 0:
            next_line = ''
            for j in range(i + 1, len(lines)):
                s = lines[j].strip()
                if s and not s.startswith('#'):
                    next_line = s
                    break
            if not next_line or not next_line.startswith(continuation_chars):
                extra = (']' * max(0, diff_bracket)) + (')' * max(0, diff_paren))
                if '#' in line:
                    code_part, comment_part = line.split('#', 1)
                    line = code_part.rstrip() + extra + ' #' + comment_part
                else:
                    line = line.rstrip() + extra
        repaired.append(line)
    res_code = '\n'.join(repaired)

    # Tự động gọi module.build / module.build_model / hàm trong menu callback nếu mã nguồn định nghĩa mà không kích hoạt ở top-level
    target_method = None
    menu_call = re.search(r'add_item\s*\([^\)]*\)\s*\{\s*([a-zA-Z0-9_:\.]+)\s*\}', res_code)
    if menu_call:
        target_method = menu_call.group(1).strip()

    mod_match = re.search(r'module\s+([A-Za-z0-9_]+)', res_code)
    mod_name = mod_match.group(1) if mod_match else None

    if not target_method:
        for m in (
            'build_model', 'create_model', 'build_signboard', 'create_signboard',
            'build_sign', 'create_sign', 'draw_model', 'make_model',
            'build', 'main', 'create', 'run', 'make', 'draw', 'generate'
        ):
            if re.search(r'def\s+(?:self\.)?' + m + r'\b', res_code):
                target_method = m
                break
        if not target_method:
            self_def = re.search(r'def\s+self\.([a-zA-Z0-9_]+)', res_code)
            if self_def:
                target_method = self_def.group(1).strip()
            else:
                first_def = re.search(r'def\s+([a-zA-Z0-9_]+)', res_code)
                if first_def:
                    target_method = first_def.group(1).strip()

    if target_method:
        if mod_name and not target_method.startswith(f"{mod_name}."):
            res_code += f"\nbegin\n  if defined?({mod_name})\n    {mod_name}.{target_method}\n  else\n    {target_method}\n  end\nrescue => _err\n  begin\n    {target_method}\n  rescue => _err2\n    nil\n  end\nend\n"
        else:
            res_code += f"\nbegin; {target_method}; rescue => _err; nil; end\n"
    return res_code


def run_ruby(code, max_seconds=8.0, max_steps=4_000_000):
    from .interp import Interpreter
    from .parser import parse

    clean_code = repair_ruby_syntax(code.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n"))
    ast = None
    parse_err = None
    for _ in range(12):
        try:
            ast = parse(clean_code)
            break
        except Exception as e:
            parse_err = e
            msg = str(e)
            if any(k in msg for k in ("cần 'end'", "gặp EOF", "cần '}'", "cần ')'", "cần ']'")):
                clean_code += "\nend"
            elif "gặp KW 'end'" in msg:
                m_line = re.search(r"Dòng\s+(\d+)", msg)
                if m_line:
                    err_line_idx = int(m_line.group(1)) - 1
                    c_lines = clean_code.splitlines()
                    if 0 <= err_line_idx < len(c_lines) and "end" in c_lines[err_line_idx]:
                        c_lines[err_line_idx] = re.sub(r'\bend\b', '# end', c_lines[err_line_idx], count=1)
                        clean_code = "\n".join(c_lines)
                        continue
                break
            else:
                break
    if ast is None:
        raise parse_err
    ip = Interpreter(max_steps=max_steps, max_seconds=max_seconds)
    stop_reason = None
    try:
        ip.run(ast)
    except RubyError as e:
        if e.cls_name != "SystemExit":
            stop_reason = f"{e.cls_name}: {e.message}"[:300]
    except LimitError as e:
        stop_reason = str(e)
    return ip, stop_reason


def ruby_to_model3d(code, default_model=None, max_seconds=8.0):
    t0 = time.time()
    ip, stop_reason = run_ruby(code, max_seconds=max_seconds)
    col = _Collector()
    col.walk(ip.model.entities, Transformation(), None, "")

    # Nếu chưa có đối tượng nhưng có menu callback được đăng ký qua UI.menu
    if len(col.out) == 0 and hasattr(ip, "menu_callbacks") and ip.menu_callbacks:
        for cb in ip.menu_callbacks:
            try:
                ip._invoke(cb, [], None)
            except Exception as e:
                ip.rescued.append(f"Lỗi callback menu: {e}")
        col = _Collector()
        col.walk(ip.model.entities, Transformation(), None, "")

    elements, boxes = [], []
    for el in col.out:
        lo, hi = _bbox(el)
        if _is_ground(el, lo, hi):
            continue
        el.pop("_mat", None)
        elements.append(el)
        boxes.append((lo, hi))
    dims = _dimensions(code, boxes)
    w, h, d = dims["width"], dims["height"], dims["depth"]
    category, category_label = _category(w, h, code)
    m_name = re.search(r"(?:Dự án|Project|Tên)\s*:\s*([^\n\r]+)", code, re.IGNORECASE)
    name = (m_name.group(1).strip() if m_name else None) or (default_model or {}).get("name") or "Mô hình 3D từ mã SketchUp"
    warnings = list(ip.rescued[:20])
    if stop_reason:
        warnings.insert(0, f"Dừng sớm: {stop_reason}")
        warnings.append(f"Cắt bớt còn {MAX_ELEMENTS} khối")
    mat_spec = {
        "iron_type": "vuong_25" if w < 10 else "vuong_30",
        "surface_type": "alu_3mm" if w < 10 else "bat_3m_uv",
        "has_led": "led" in code.lower(),
        "has_sheet_backing": True,
    }
    comps = []
    logistics = {}
    try:
        from ..ruby_components import parse_bom_from_comment, estimate_structural_components, parse_logistics_from_ruby
    except (ImportError, ValueError):
        try:
            from api.ruby_components import parse_bom_from_comment, estimate_structural_components, parse_logistics_from_ruby
        except (ImportError, ValueError):
            try:
                from ruby_components import parse_bom_from_comment, estimate_structural_components, parse_logistics_from_ruby
            except Exception:
                parse_bom_from_comment = None
                estimate_structural_components = None
                parse_logistics_from_ruby = None

    if parse_bom_from_comment:
        comps = parse_bom_from_comment(code)
    if (not comps or len(comps) < 3) and estimate_structural_components:
        comps = estimate_structural_components(w, h, d, category, code, mat_spec)

    if parse_logistics_from_ruby:
        logistics = parse_logistics_from_ruby(code, dims, comps)

    return {
        "name": name[:120],
        "category": category,
        "category_label": category_label,
        "description": f"Mô hình 3D dựng trực tiếp từ mã SketchUp Ruby ({w}m x {h}m x {d}m, {len(elements)} khối).",
        "dimensions": dims,
        "elements": elements,
        "materials_spec": mat_spec,
        "components": comps,
        "logistics": logistics,
        "render_prompt": f"Realistic architectural photograph of {name}, dimensions {w}m x {h}m, signboard structure, 4k ultra high resolution.",
        "source": "ruby_interpreter",
        "warnings": warnings,
        "stats": {"elements": len(elements), "steps": ip.steps, "ms": int((time.time() - t0) * 1000)},
        "log": ip.log[:50],
    }
