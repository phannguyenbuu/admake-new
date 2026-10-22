# -*- coding: utf-8 -*-
"""Bộ thông dịch AST Ruby (sandbox: không I/O, giới hạn bước và thời gian)."""

import sys
import time

from .runtime import (
    BreakEx, LimitError, NextEx, Proc, RException, RModule, RObj, RObject, RRange, ReturnEx,
    RubyError, Symbol, is_num, truthy,
)
from .natives import NativeModule, build_globals
from . import interp_ops as ops


class Env:
    __slots__ = ("vars", "parent")

    def __init__(self, parent=None):
        self.vars = {}
        self.parent = parent

    def find(self, name):
        e = self
        while e is not None:
            if name in e.vars:
                return e
            e = e.parent
        return None

    def get(self, name, default=None):
        e = self.find(name)
        return e.vars[name] if e is not None else default

    def set(self, name, value):
        e = self.find(name)
        (e or self).vars[name] = value


class Frame:
    __slots__ = ("self_obj", "module", "defmod", "block", "method", "args", "sdef", "owner")

    def __init__(self, self_obj, module, defmod=None, block=None, method=None, args=None, sdef=False, owner=None):
        self.self_obj = self_obj
        self.module = module
        self.defmod = defmod if defmod is not None else module
        self.block = block
        self.method = method
        self.args = args or []
        self.sdef = sdef
        self.owner = owner


class UserMethod:
    __slots__ = ("name", "params", "body", "owner", "proc")

    def __init__(self, name, params, body, owner, proc=None):
        self.name = name
        self.params = params
        self.body = body
        self.owner = owner
        self.proc = proc  # define_method


class Interpreter(ops.OpsMixin):
    def __init__(self, max_steps=4_000_000, max_seconds=8.0):
        self.steps = 0
        self.max_steps = max_steps
        self.deadline = time.time() + max_seconds
        self.main_mod = RModule("Object")
        self.main_obj = RObject(self.main_mod)
        self.global_consts = build_globals(self)
        self.gvars = {"$0": "script.rb", "$PROGRAM_NAME": "script.rb", "$stdout": None, "$stderr": None}
        self.log = []
        self.rescued = []
        self.top_frame = Frame(self.main_obj, self.main_mod)
        self.handlers = {k[3:]: getattr(self, k) for k in dir(self) if k.startswith("ev_")}

    # ------------------------------------------------------------------ run
    def run(self, ast):
        old = sys.getrecursionlimit()
        sys.setrecursionlimit(max(old, 6000))
        try:
            self.top_env = Env()
            return self.eval(ast, self.top_env, self.top_frame)
        except ReturnEx as r:
            return r.value
        except RecursionError:
            raise LimitError("Đệ quy quá sâu")
        finally:
            sys.setrecursionlimit(old)

    def tick(self):
        self.steps += 1
        if self.steps & 0x3FFF == 0:
            if self.steps > self.max_steps:
                raise LimitError("Vượt quá số bước thực thi cho phép")
            if time.time() > self.deadline:
                raise LimitError("Vượt quá thời gian thực thi cho phép")

    def eval(self, node, env, fr):
        self.steps += 1
        if self.steps & 0x3FFF == 0:
            self.tick_check()
        return self.handlers[node[0]](node, env, fr)

    def tick_check(self):
        if self.steps > self.max_steps:
            raise LimitError("Vượt quá số bước thực thi cho phép")
        if time.time() > self.deadline:
            raise LimitError("Vượt quá thời gian thực thi cho phép")

    def puts(self, text):
        if len(self.log) < 300:
            self.log.append(str(text)[:500])

    # ------------------------------------------------------------------ literals
    def ev_num(self, n, env, fr):
        return n[1]

    def ev_str(self, n, env, fr):
        return n[1]

    def ev_dstr(self, n, env, fr):
        out = []
        for part in n[1]:
            if isinstance(part, str):
                out.append(part)
            else:
                out.append(self.to_s(self.eval(part, env, fr)))
        return "".join(out)

    def ev_sym(self, n, env, fr):
        return Symbol(n[1])

    def ev_dsym(self, n, env, fr):
        return Symbol(self.to_s(self.eval(n[1], env, fr)))

    def ev_nil(self, n, env, fr):
        return None

    def ev_true(self, n, env, fr):
        return True

    def ev_false(self, n, env, fr):
        return False

    def ev_self(self, n, env, fr):
        return fr.self_obj

    def ev_array(self, n, env, fr):
        out = []
        for item in n[1]:
            if item[0] == "splat":
                out.extend(self.splat_list(self.eval(item[1], env, fr)))
            elif item[0] == "pair":
                out.append(ops.RHash({ops.hkey(self.eval(item[1], env, fr)): self.eval(item[2], env, fr)}))
            else:
                out.append(self.eval(item, env, fr))
        return out

    def ev_hash(self, n, env, fr):
        h = ops.RHash()
        for k, v in n[1]:
            if k[0] == "dsplat":
                h.update(self.eval(v, env, fr) or {})
            else:
                h[ops.hkey(self.eval(k, env, fr))] = self.eval(v, env, fr)
        return h

    def ev_range(self, n, env, fr):
        a = self.eval(n[1], env, fr)
        b = self.eval(n[2], env, fr) if n[2] is not None else None
        return RRange(a, b, n[3])

    # ------------------------------------------------------------------ variables
    def ev_lvar(self, n, env, fr):
        e = env.find(n[1])
        if e is not None:
            return e.vars[n[1]]
        return self.call_implicit(n[1], [], None, fr, allow_nil=True)

    def ev_var(self, n, env, fr):
        e = env.find(n[1])
        if e is not None:
            return e.vars[n[1]]
        return self.call_implicit(n[1], [], None, fr)

    def ivars_of(self, obj):
        if isinstance(obj, (RModule, RObject)):
            return obj.ivars
        d = getattr(obj, "_rb_ivars", None)
        if d is None:
            try:
                d = {}
                obj._rb_ivars = d
            except AttributeError:
                return {}
        return d

    def ev_ivar(self, n, env, fr):
        return self.ivars_of(fr.self_obj).get(n[1])

    def ev_gvar(self, n, env, fr):
        return self.gvars.get(n[1])

    def ev_const(self, n, env, fr):
        if n[1] is None:
            return self.const_lookup(n[2], fr)
        scope = self.eval(n[1], env, fr)
        return self.const_in(scope, n[2])

    def const_lookup(self, name, fr):
        m = fr.module
        while m is not None:
            if name in m.consts:
                return m.consts[name]
            sup = m.superclass
            while isinstance(sup, RModule):
                if name in sup.consts:
                    return sup.consts[name]
                sup = sup.superclass
            m = m.parent
        if name in self.main_mod.consts:
            return self.main_mod.consts[name]
        if name in self.global_consts:
            return self.global_consts[name]
        v = self._fuzzy_const(name, fr)
        if v is not None:
            return v
        raise RubyError("NameError", f"uninitialized constant {name}")

    def _fuzzy_const(self, name, fr):
        """Mã AI hay dùng hằng chưa khai báo (VD: CATWALK_WIDTH): lấy hằng số cùng hậu tố gần nhất."""
        if "_" not in name or not name.isupper():
            return None
        suffix = name.rsplit("_", 1)[1]
        group = next((g for g in _SIZE_SUFFIXES if suffix in g[0]), ((suffix,), None))
        m = fr.module
        while isinstance(m, RModule):
            cands = [(k, v) for k, v in m.consts.items() if k.rsplit("_", 1)[-1] in group[0] and is_num(v)]
            if cands:
                pref = [c for c in cands if c[0].startswith(("SIGN", "BOARD", "PANEL"))]
                k, v = (pref or cands)[0]
                self.rescued.append(f"NameError: hằng {name} chưa khai báo, tạm dùng {k} = {v}")
                m.consts[name] = v
                return v
            if m.parent is None and group[1] is not None:
                self.rescued.append(f"NameError: hằng {name} chưa khai báo, tạm dùng {group[1]}")
                m.consts[name] = group[1]
                return group[1]
            m = m.parent
        return None

    def const_lookup_global(self, name):
        return self.main_mod.consts.get(name) or self.global_consts.get(name)

    def const_in(self, scope, name):
        if isinstance(scope, (RModule, NativeModule)):
            if name in scope.consts:
                return scope.consts[name]
            if isinstance(scope, RModule):
                sup = scope.superclass
                while isinstance(sup, RModule):
                    if name in sup.consts:
                        return sup.consts[name]
                    sup = sup.superclass
        raise RubyError("NameError", f"uninitialized constant {getattr(scope, 'name', scope)}::{name}")

    # ------------------------------------------------------------------ assignment
    def assign(self, target, value, env, fr):
        k = target[0]
        if k == "lvar":
            env.set(target[1], value)
        elif k == "ivar":
            self.ivars_of(fr.self_obj)[target[1]] = value
        elif k == "gvar":
            self.gvars[target[1]] = value
        elif k == "cdecl":
            mod = self.eval(target[1], env, fr) if target[1] is not None else fr.module
            mod.consts[target[2]] = value
            if isinstance(value, RModule) and value.name is None:
                value.name = target[2]
        elif k == "index":
            recv = self.eval(target[1], env, fr)
            args, _ = self.eval_args(target[2], env, fr)
            self.call_method(recv, "[]=", args + [value], None)
        elif k == "attrasgn":
            recv = self.eval(target[1], env, fr)
            self.call_method(recv, target[2] + "=", [value], None)
        elif k == "splat":
            self.assign(target[1], value, env, fr)
        else:
            raise RubyError("SyntaxError", f"không gán được cho {k}")
        return value

    def ev_asgn(self, n, env, fr):
        return self.assign(n[1], self.eval(n[2], env, fr), env, fr)

    def ev_opasgn(self, n, env, fr):
        target, op, vnode = n[1], n[2], n[3]
        k = target[0]
        if k in ("index", "attrasgn"):
            recv = self.eval(target[1], env, fr)
            if k == "index":
                args, _ = self.eval_args(target[2], env, fr)
                cur = self.call_method(recv, "[]", args, None)
            else:
                cur = self.call_method(recv, target[2], [], None)
            new = self._opasgn_value(cur, op, vnode, env, fr)
            if new is _UNCHANGED:
                return cur
            if k == "index":
                self.call_method(recv, "[]=", args + [new], None)
            else:
                self.call_method(recv, target[2] + "=", [new], None)
            return new
        if k == "lvar":
            cur = env.get(target[1])
        elif k == "ivar":
            cur = self.ivars_of(fr.self_obj).get(target[1])
        elif k == "gvar":
            cur = self.gvars.get(target[1])
        else:
            try:
                cur = self.eval(("const", target[1], target[2]), env, fr)
            except RubyError:
                cur = None
        new = self._opasgn_value(cur, op, vnode, env, fr)
        if new is _UNCHANGED:
            return cur
        return self.assign(target, new, env, fr)

    def _opasgn_value(self, cur, op, vnode, env, fr):
        if op == "||":
            return _UNCHANGED if truthy(cur) else self.eval(vnode, env, fr)
        if op == "&&":
            return self.eval(vnode, env, fr) if truthy(cur) else _UNCHANGED
        return self.binop(op, cur, self.eval(vnode, env, fr))

    def ev_masgn(self, n, env, fr):
        targets, values = n[1], n[2]
        if len(values) == 1:
            v = self.eval(values[0], env, fr)
            items = list(v) if isinstance(v, list) else [v]
        else:
            items = self.ev_array(("array", values), env, fr)
        self.destructure(targets, items, env, fr)
        return items

    def destructure(self, targets, items, env, fr):
        splat_idx = next((i for i, t in enumerate(targets) if t[0] == "splat"), None)
        if splat_idx is None:
            for i, t in enumerate(targets):
                self.assign(t, items[i] if i < len(items) else None, env, fr)
            return
        after = len(targets) - splat_idx - 1
        for i in range(splat_idx):
            self.assign(targets[i], items[i] if i < len(items) else None, env, fr)
        mid_end = max(splat_idx, len(items) - after)
        self.assign(targets[splat_idx], items[splat_idx:mid_end], env, fr)
        for j in range(after):
            idx = mid_end + j
            self.assign(targets[splat_idx + 1 + j], items[idx] if idx < len(items) else None, env, fr)

    # ------------------------------------------------------------------ logic
    def ev_and(self, n, env, fr):
        a = self.eval(n[1], env, fr)
        return self.eval(n[2], env, fr) if truthy(a) else a

    def ev_or(self, n, env, fr):
        a = self.eval(n[1], env, fr)
        return a if truthy(a) else self.eval(n[2], env, fr)

    def ev_not(self, n, env, fr):
        v = self.eval(n[1], env, fr)
        if isinstance(v, RObject):
            m = v.cls.find_method("!")
            if m:
                return self.invoke(m, v, [], None)
        return not truthy(v)

    def ev_op(self, n, env, fr):
        left = self.eval(n[2], env, fr)
        result = self.binop(n[1], left, self.eval(n[3], env, fr))
        # String#<< là phép sửa tại chỗ: mô phỏng bằng cách gán lại biến
        if n[1] == "<<" and isinstance(left, str) and n[2][0] in ("lvar", "var", "ivar"):
            self.assign(("ivar", n[2][1]) if n[2][0] == "ivar" else ("lvar", n[2][1]), result, env, fr)
        return result

    def ev_neg(self, n, env, fr):
        v = self.eval(n[1], env, fr)
        if is_num(v):
            return -v
        return self.call_method(v, "-@", [], None)

    def ev_defined(self, n, env, fr):
        e = n[1]
        k = e[0]
        if k in ("lvar", "var"):
            if env.find(e[1]) is not None:
                return "local-variable"
            return "method" if self.find_implicit_method(e[1], fr) is not None else None
        if k == "ivar":
            return "instance-variable" if e[1] in self.ivars_of(fr.self_obj) else None
        if k == "gvar":
            return "global-variable" if e[1] in self.gvars else None
        if k == "const":
            try:
                self.eval(e, env, fr)
                return "constant"
            except RubyError:
                return None
        if k == "call":
            return "method"
        return "expression"


_UNCHANGED = object()
_SIZE_SUFFIXES = (
    (("WIDTH", "W", "LENGTH", "LEN", "L", "SPAN"), 4.0),
    (("HEIGHT", "H"), 3.0),
    (("DEPTH", "D", "THICKNESS", "THICK", "T"), 0.2),
    (("RADIUS", "R"), 0.1),
)

from . import interp_ctrl  # noqa: E402,F401  (gắn các ev_* điều khiển luồng / call)
