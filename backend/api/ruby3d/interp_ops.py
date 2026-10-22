# -*- coding: utf-8 -*-
"""Toán tử, so sánh, chuyển chuỗi, kiểm tra kiểu cho interpreter."""

import math
import re

from .runtime import Proc, RException, RModule, RObj, RObject, RRange, RubyError, Symbol, is_num, truthy


class RHash(dict):
    """Hash Ruby: hỗ trợ default / default_proc."""

    __slots__ = ("default", "default_proc")

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.default = None
        self.default_proc = None


def hkey(v):
    if isinstance(v, list):
        return tuple(hkey(x) for x in v)
    if isinstance(v, float) and v == int(v) and not math.isinf(v):
        return v
    return v


def unkey(k):
    if isinstance(k, tuple):
        return [unkey(x) for x in k]
    return k


def fmt_float(v: float) -> str:
    if math.isnan(v):
        return "NaN"
    if math.isinf(v):
        return "Infinity" if v > 0 else "-Infinity"
    if v == int(v) and abs(v) < 1e16:
        return f"{int(v)}.0"
    r = repr(v)
    if "e" in r:
        mant, exp = r.split("e")
        if "." not in mant:
            mant += ".0"
        sign = "-" if exp.startswith("-") else "+"
        return f"{mant}e{sign}{exp.lstrip('+-').zfill(2)}"
    return r


FMT_RE = re.compile(r"%([-+ 0#]*)(\*|\d+)?(?:\.(\d+))?([a-zA-Z%])")


def ruby_format(ip, fmt, args):
    args = list(args)
    idx = [0]

    def nxt():
        if idx[0] >= len(args):
            raise RubyError("ArgumentError", "too few arguments")
        v = args[idx[0]]
        idx[0] += 1
        return v

    def repl(m):
        flags, width, prec, conv = m.group(1), m.group(2), m.group(3), m.group(4)
        if conv == "%":
            return "%"
        if width == "*":
            width = str(int(nxt()))
        spec = "%" + flags + (width or "") + (("." + prec) if prec is not None else "")
        v = nxt()
        if conv in "di":
            return (spec + "d") % int(round(float(v))) if not isinstance(v, int) else (spec + "d") % v
        if conv in "feEgG":
            return (spec + conv) % float(v)
        if conv in "xXob":
            iv = int(v)
            if conv == "b":
                s = format(iv, "b")
                return s.rjust(int(width or 0), "0" if "0" in flags else " ")
            return (spec + conv) % iv
        if conv == "s":
            return (spec + "s") % ip.to_s(v)
        if conv == "p":
            return (spec + "s") % ip.inspect(v)
        if conv == "c":
            return chr(int(v)) if is_num(v) else str(v)[:1]
        return m.group(0)

    return FMT_RE.sub(repl, fmt)


class OpsMixin:
    # ------------------------------------------------------------------ binop
    def binop(self, op, a, b):
        if is_num(a) and is_num(b):
            return self.num_op(op, a, b)
        if op == "==":
            return self.rb_equal(a, b)
        if op == "===":
            return self.case_eq(a, b)
        if op == "=~":
            return None
        if isinstance(a, str):
            if op == "+":
                if not isinstance(b, str):
                    raise RubyError("TypeError", f"no implicit conversion of {self.class_name(b)} into String")
                return a + b
            if op == "*":
                return a * int(b)
            if op == "%":
                return ruby_format(self, a, b if isinstance(b, list) else [b])
            if op == "<<":
                return a + self.to_s(b)
            if isinstance(b, str):
                if op == "<":
                    return a < b
                if op == ">":
                    return a > b
                if op == "<=":
                    return a <= b
                if op == ">=":
                    return a >= b
                if op == "<=>":
                    return (a > b) - (a < b)
        if isinstance(a, list):
            if op == "+":
                return a + list(b)
            if op == "-":
                return [x for x in a if not any(self.rb_equal(x, y) for y in b)]
            if op == "*":
                return self.to_s(b).join(self.to_s(x) for x in a) if isinstance(b, str) else a * int(b)
            if op == "<<":
                a.append(b)
                return a
            if op == "&":
                return [x for i, x in enumerate(a) if any(self.rb_equal(x, y) for y in b) and x not in a[:i]]
            if op == "|":
                out = []
                for x in a + list(b):
                    if not any(self.rb_equal(x, y) for y in out):
                        out.append(x)
                return out
            if op == "<=>":
                for x, y in zip(a, b):
                    c = self.binop("<=>", x, y)
                    if c:
                        return c
                return (len(a) > len(b)) - (len(a) < len(b))
        if isinstance(a, Symbol) and isinstance(b, Symbol) and op in ("<", ">", "<=", ">=", "<=>"):
            return self.binop(op, a.name, b.name)
        return self.call_method(a, op, [b], None)

    def num_op(self, op, a, b):
        both_int = isinstance(a, int) and isinstance(b, int)
        if op == "+":
            return a + b
        if op == "-":
            return a - b
        if op == "*":
            return a * b
        if op == "/":
            if both_int:
                if b == 0:
                    raise RubyError("ZeroDivisionError", "divided by 0")
                return a // b
            if b == 0:
                if a == 0 or math.isnan(a):
                    return float("nan")
                return math.copysign(float("inf"), a) * (1 if math.copysign(1, b) > 0 else -1)
            return a / b
        if op == "%":
            if b == 0:
                if both_int:
                    raise RubyError("ZeroDivisionError", "divided by 0")
                return float("nan")
            return a % b
        if op == "**":
            if both_int and b >= 0:
                if b > 4096:
                    raise RubyError("RangeError", "số mũ quá lớn")
                return a ** b
            try:
                r = float(a) ** b
                return float("nan") if isinstance(r, complex) else r
            except (OverflowError, ZeroDivisionError):
                return float("inf")
        if op == "<":
            return a < b
        if op == ">":
            return a > b
        if op == "<=":
            return a <= b
        if op == ">=":
            return a >= b
        if op == "==":
            return a == b
        if op == "<=>":
            return (a > b) - (a < b)
        if both_int:
            if op == "&":
                return a & b
            if op == "|":
                return a | b
            if op == "^":
                return a ^ b
            if op == "<<":
                return a << b
            if op == ">>":
                return a >> b
        if op == "===":
            return a == b
        raise RubyError("NoMethodError", f"undefined method '{op}' for {self.class_name(a)}")

    # ------------------------------------------------------------------ equality / types
    def rb_equal(self, a, b):
        if a is b:
            return True
        if isinstance(a, bool) or isinstance(b, bool) or a is None or b is None:
            return False
        if is_num(a) and is_num(b):
            return a == b
        if isinstance(a, str) and isinstance(b, str):
            return a == b
        if isinstance(a, list) and isinstance(b, list):
            return len(a) == len(b) and all(self.rb_equal(x, y) for x, y in zip(a, b))
        if isinstance(a, dict) and isinstance(b, dict):
            return a.keys() == b.keys() and all(self.rb_equal(a[k], b[k]) for k in a)
        if isinstance(a, RRange) and isinstance(b, RRange):
            return a.first == b.first and a.last == b.last and a.excl == b.excl
        if isinstance(a, RObj) and a.responds("=="):
            return truthy(a.rb_send(self, "==", [b], None))
        if isinstance(a, RObject):
            m = a.cls.find_method("==")
            if m:
                return truthy(self.invoke(m, a, [b], None))
        return False

    def class_name(self, v):
        if v is None:
            return "nil"
        if isinstance(v, bool):
            return "true" if v else "false"
        if isinstance(v, int):
            return "Integer"
        if isinstance(v, float):
            return "Float"
        if isinstance(v, str):
            return "String"
        if isinstance(v, Symbol):
            return "Symbol"
        if isinstance(v, list):
            return "Array"
        if isinstance(v, dict):
            return "Hash"
        if isinstance(v, RRange):
            return "Range"
        if isinstance(v, Proc):
            return "Proc"
        if isinstance(v, RObject):
            return v.cls.full_name()
        if isinstance(v, RModule):
            return "Class" if v.is_class else "Module"
        if isinstance(v, RException):
            return v.cls_name
        if isinstance(v, RObj):
            return v.rb_class_name
        return "Object"

    def is_a(self, obj, cls):
        from .natives import NativeModule

        if isinstance(cls, RModule):
            if isinstance(obj, RObject):
                c = obj.cls
                while isinstance(c, RModule):
                    if c is cls or cls in c.includes:
                        return True
                    c = c.superclass
            return False
        if not isinstance(cls, NativeModule):
            return False
        n = cls.name
        if n in ("Object", "BasicObject", "Kernel"):
            return True
        if isinstance(obj, bool):
            return n == ("TrueClass" if obj else "FalseClass")
        checks = {
            "Integer": lambda o: isinstance(o, int), "Fixnum": lambda o: isinstance(o, int),
            "Float": lambda o: isinstance(o, float), "Numeric": is_num, "Length": is_num,
            "String": lambda o: isinstance(o, str), "Symbol": lambda o: isinstance(o, Symbol),
            "Array": lambda o: isinstance(o, list), "Hash": lambda o: isinstance(o, dict),
            "Range": lambda o: isinstance(o, RRange), "NilClass": lambda o: o is None,
            "Proc": lambda o: isinstance(o, Proc),
            "Comparable": lambda o: is_num(o) or isinstance(o, str),
            "Enumerable": lambda o: isinstance(o, (list, dict, RRange)),
        }
        if n in checks:
            return bool(checks[n](obj))
        if isinstance(obj, RException):
            return n in (obj.cls_name, "StandardError", "Exception")
        if isinstance(obj, RObj):
            anc = getattr(obj, "ancestors", None) or (obj.rb_class_name,)
            return n == obj.rb_class_name or n in anc
        return False

    def case_eq(self, pattern, v):
        from .natives import NativeModule

        if isinstance(pattern, RRange):
            return pattern.covers(v)
        if isinstance(pattern, (RModule, NativeModule)):
            return self.is_a(v, pattern)
        if isinstance(pattern, Proc):
            return truthy(self.call_proc(pattern, [v]))
        return self.rb_equal(pattern, v)

    # ------------------------------------------------------------------ strings
    def to_s(self, v):
        if v is None:
            return ""
        if isinstance(v, str):
            return v
        if isinstance(v, bool):
            return "true" if v else "false"
        if isinstance(v, int):
            return str(v)
        if isinstance(v, float):
            return fmt_float(v)
        if isinstance(v, Symbol):
            return v.name
        if isinstance(v, (list, dict)):
            return self.inspect(v)
        if isinstance(v, RRange):
            return f"{self.to_s(v.first)}{'...' if v.excl else '..'}{self.to_s(v.last)}"
        if isinstance(v, RObject):
            m = v.cls.find_method("to_s")
            if m:
                return self.to_s(self.invoke(m, v, [], None))
            return f"#<{v.cls.full_name()}>"
        if isinstance(v, RModule):
            return v.full_name()
        if isinstance(v, RObj):
            if v.responds("to_s"):
                return str(v.rb_send(self, "to_s", [], None))
            return f"#<{v.rb_class_name}>"
        name = getattr(v, "name", None)
        return str(name) if name is not None else "#<Object>"

    def inspect(self, v):
        if v is None:
            return "nil"
        if isinstance(v, str):
            return '"' + v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'
        if isinstance(v, Symbol):
            return ":" + v.name
        if isinstance(v, list):
            return "[" + ", ".join(self.inspect(x) for x in v) + "]"
        if isinstance(v, dict):
            parts = []
            for k, x in v.items():
                k = unkey(k)
                ks = f"{k.name}: " if isinstance(k, Symbol) else f"{self.inspect(k)} => "
                parts.append(ks + self.inspect(x))
            return "{" + ", ".join(parts) + "}"
        if isinstance(v, RObj) and v.responds("inspect"):
            return str(v.rb_send(self, "inspect", [], None))
        return self.to_s(v)
