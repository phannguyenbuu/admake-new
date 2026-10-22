# -*- coding: utf-8 -*-
"""Phương thức dựng sẵn cho Integer/Float/String/Symbol/nil/bool/Proc và Object."""

import math
import re

from .interp_ops import RHash, ruby_format
from .runtime import Proc, RModule, RObj, RObject, RRange, RubyError, Symbol, is_num, truthy

INCH_PER_M = 39.37007874015748


class MethodRef:
    def __init__(self, obj, name):
        self.obj = obj
        self.name = name

    def call(self, ip, args):
        return ip.call_method(self.obj, self.name, list(args), None)


def reg(table, *names):
    def deco(fn):
        for n in names:
            table[n] = fn
        return fn
    return deco


def sym_name(v):
    return v.name if isinstance(v, Symbol) else str(v)


def each_or_list(ip, seq, blk, ret):
    if blk is None:
        return list(seq)
    for v in seq:
        ip.call_proc(blk, [v])
    return ret


# ====================================================================== Numeric
NUM_M = {}


def rround(x, nd=0):
    nd = int(nd)
    if isinstance(x, int):
        if nd >= 0:
            return x
        m = 10 ** (-nd)
        return int(math.copysign(math.floor(abs(x) / m + 0.5) * m, x))
    if math.isinf(x) or math.isnan(x):
        if nd > 0:
            return x
        raise RubyError("FloatDomainError", str(x))
    m = 10.0 ** nd
    y = math.copysign(math.floor(abs(x) * m + 0.5 + 1e-9) / m, x)
    return int(y) if nd <= 0 else y


def _digits_op(fn):
    def op(ip, r, a, b):
        nd = int(a[0]) if a and is_num(a[0]) else 0
        if nd <= 0:
            if isinstance(r, float) and (math.isinf(r) or math.isnan(r)):
                raise RubyError("FloatDomainError", str(r))
            v = fn(r / 10 ** (-nd)) * 10 ** (-nd) if nd else fn(r)
            return int(v)
        if isinstance(r, int):
            return r
        m = 10.0 ** nd
        return fn(r * m) / m
    return op


NUM_M["floor"] = _digits_op(math.floor)
NUM_M["ceil"] = _digits_op(math.ceil)
NUM_M["truncate"] = _digits_op(math.trunc)
NUM_M["round"] = lambda ip, r, a, b: rround(r, a[0] if a and is_num(a[0]) else 0)
NUM_M["abs"] = NUM_M["magnitude"] = lambda ip, r, a, b: abs(r)
NUM_M["to_i"] = NUM_M["to_int"] = lambda ip, r, a, b: int(r) if not (isinstance(r, float) and (math.isinf(r) or math.isnan(r))) else 0
NUM_M["to_f"] = lambda ip, r, a, b: float(r)
NUM_M["to_r"] = NUM_M["to_c"] = NUM_M["rationalize"] = lambda ip, r, a, b: float(r)
NUM_M["to_s"] = lambda ip, r, a, b: (format(r, {2: "b", 8: "o", 16: "x"}.get(int(a[0]), "d")) if a and isinstance(r, int) else ip.to_s(r))
NUM_M["inspect"] = lambda ip, r, a, b: ip.to_s(r)
NUM_M["even?"] = lambda ip, r, a, b: int(r) % 2 == 0
NUM_M["odd?"] = lambda ip, r, a, b: int(r) % 2 == 1
NUM_M["zero?"] = lambda ip, r, a, b: r == 0
NUM_M["positive?"] = lambda ip, r, a, b: r > 0
NUM_M["negative?"] = lambda ip, r, a, b: r < 0
NUM_M["nonzero?"] = lambda ip, r, a, b: None if r == 0 else r
NUM_M["integer?"] = lambda ip, r, a, b: isinstance(r, int)
NUM_M["finite?"] = lambda ip, r, a, b: not (isinstance(r, float) and (math.isinf(r) or math.isnan(r)))
NUM_M["infinite?"] = lambda ip, r, a, b: (1 if r > 0 else -1) if isinstance(r, float) and math.isinf(r) else None
NUM_M["nan?"] = lambda ip, r, a, b: isinstance(r, float) and math.isnan(r)
NUM_M["between?"] = lambda ip, r, a, b: a[0] <= r <= a[1]
NUM_M["divmod"] = lambda ip, r, a, b: [ip.num_op("/", r, a[0]) if isinstance(r, int) and isinstance(a[0], int) else math.floor(r / a[0]), ip.num_op("%", r, a[0])]
NUM_M["fdiv"] = lambda ip, r, a, b: ip.num_op("/", float(r), a[0])
NUM_M["div"] = lambda ip, r, a, b: int(math.floor(r / a[0]))
NUM_M["modulo"] = lambda ip, r, a, b: ip.num_op("%", r, a[0])
NUM_M["remainder"] = lambda ip, r, a, b: math.fmod(r, a[0]) if isinstance(r, float) or isinstance(a[0], float) else int(math.fmod(r, a[0]))
NUM_M["pow"] = lambda ip, r, a, b: pow(r, a[0], a[1]) if len(a) > 1 else ip.num_op("**", r, a[0])
NUM_M["abs2"] = lambda ip, r, a, b: r * r
NUM_M["succ"] = NUM_M["next"] = lambda ip, r, a, b: r + 1
NUM_M["pred"] = lambda ip, r, a, b: r - 1
NUM_M["chr"] = lambda ip, r, a, b: chr(int(r))
NUM_M["ord"] = lambda ip, r, a, b: r
NUM_M["hash"] = lambda ip, r, a, b: hash(r)
NUM_M["digits"] = lambda ip, r, a, b: [int(c) for c in reversed(str(abs(int(r))))]
NUM_M["gcd"] = lambda ip, r, a, b: math.gcd(int(r), int(a[0]))
NUM_M["lcm"] = lambda ip, r, a, b: abs(int(r) * int(a[0])) // math.gcd(int(r), int(a[0])) if r and a[0] else 0
NUM_M["bit_length"] = lambda ip, r, a, b: int(r).bit_length()
NUM_M["coerce"] = lambda ip, r, a, b: [float(a[0]), float(r)]
NUM_M["-@"] = lambda ip, r, a, b: -r
NUM_M["+@"] = lambda ip, r, a, b: r
NUM_M["~"] = lambda ip, r, a, b: ~int(r)
NUM_M["eql?"] = lambda ip, r, a, b: type(r) is type(a[0]) and r == a[0]
NUM_M["size"] = lambda ip, r, a, b: 8
NUM_M["degrees"] = lambda ip, r, a, b: r * math.pi / 180.0
NUM_M["radians"] = lambda ip, r, a, b: r * 180.0 / math.pi
NUM_M["sqrt"] = lambda ip, r, a, b: math.sqrt(r)
# SketchUp Length (đơn vị nội bộ: inch)
for _n, _f in {"m": INCH_PER_M, "meter": INCH_PER_M, "cm": INCH_PER_M / 100, "mm": INCH_PER_M / 1000,
               "km": INCH_PER_M * 1000, "inch": 1.0, "feet": 12.0, "yard": 36.0, "mile": 63360.0}.items():
    NUM_M[_n] = (lambda f: (lambda ip, r, a, b: r * f))(_f)
for _n, _f in {"to_m": INCH_PER_M, "to_cm": INCH_PER_M / 100, "to_mm": INCH_PER_M / 1000,
               "to_km": INCH_PER_M * 1000, "to_inch": 1.0, "to_feet": 12.0, "to_yard": 36.0}.items():
    NUM_M[_n] = (lambda f: (lambda ip, r, a, b: r / f))(_f)
NUM_M["to_l"] = lambda ip, r, a, b: float(r)


@reg(NUM_M, "clamp")
def _clamp(ip, r, a, b):
    lo, hi = (a[0].first, a[0].last) if isinstance(a[0], RRange) else (a[0], a[1])
    if lo is not None and r < lo:
        return lo
    if hi is not None and r > hi:
        return hi
    return r


@reg(NUM_M, "times")
def _times(ip, r, a, b):
    return each_or_list(ip, range(int(r)), b, r)


@reg(NUM_M, "upto")
def _upto(ip, r, a, b):
    return each_or_list(ip, range(int(r), int(math.floor(a[0])) + 1), b, r)


@reg(NUM_M, "downto")
def _downto(ip, r, a, b):
    return each_or_list(ip, range(int(r), int(math.ceil(a[0])) - 1, -1), b, r)


def float_steps(start, limit, step):
    if step == 0:
        raise RubyError("ArgumentError", "step can't be 0")
    if all(isinstance(v, int) for v in (start, limit, step)):
        return list(range(start, limit + (1 if step > 0 else -1), step))
    n = int(math.floor((limit - start) / step + 1e-9))
    if n > 1_000_000:
        raise RubyError("RangeError", "step quá nhiều")
    return [start + i * step for i in range(max(-1, n) + 1)]


@reg(NUM_M, "step")
def _step(ip, r, a, b):
    limit, step = None, 1
    pos = [x for x in a if not isinstance(x, dict)]
    kw = next((x for x in a if isinstance(x, dict)), {})
    if pos:
        limit = pos[0]
        if len(pos) > 1:
            step = pos[1]
    limit = kw.get(Symbol("to"), limit)
    step = kw.get(Symbol("by"), step)
    if limit is None:
        raise RubyError("ArgumentError", "step không có giới hạn")
    return each_or_list(ip, float_steps(r, limit, step), b, r)


def _num_binop(op):
    def fn(ip, r, a, b):
        o = a[0]
        if is_num(o):
            return ip.num_op(op, r, o)
        if op == "*" and isinstance(o, RObj) and o.responds("*"):
            return o.rb_send(ip, "*", [r], None)
        if op == "==":
            return False
        raise RubyError("TypeError", f"{ip.class_name(o)} can't be coerced into {ip.class_name(r)}")
    return fn


for _op in ("+", "-", "*", "/", "%", "**", "<", ">", "<=", ">=", "==", "<=>", "&", "|", "^", "<<", ">>"):
    NUM_M[_op] = _num_binop(_op)


# ====================================================================== String
STR_M = {}


def _str_idx(ip, s, a):
    k = a[0]
    if isinstance(k, RRange):
        lo = k.first or 0
        hi = len(s) - 1 if k.last is None else k.last
        lo = lo + len(s) if lo < 0 else lo
        hi = hi + len(s) if hi < 0 else hi
        if k.excl and k.last is not None:
            hi -= 1
        return s[lo:hi + 1] if lo <= len(s) else None
    if isinstance(k, str):
        return k if k in s else None
    i = int(k)
    if len(a) > 1:
        i = i + len(s) if i < 0 else i
        return s[i:i + int(a[1])] if 0 <= i <= len(s) else None
    if -len(s) <= i < len(s):
        return s[i]
    return None


def _leading_num(s, pattern, conv, default):
    m = re.match(pattern, s.strip().replace("_", ""))
    return conv(m.group(0)) if m and m.group(0) not in ("", "+", "-") else default


def _tr_expand(spec):
    out = []
    i = 0
    while i < len(spec):
        if i + 2 < len(spec) and spec[i + 1] == "-":
            out.extend(chr(c) for c in range(ord(spec[i]), ord(spec[i + 2]) + 1))
            i += 3
        else:
            out.append(spec[i])
            i += 1
    return out


@reg(STR_M, "tr")
def _tr(ip, s, a, b):
    src, dst = _tr_expand(a[0]), _tr_expand(a[1])
    if not dst:
        return "".join(c for c in s if c not in src)
    table = {c: dst[min(i, len(dst) - 1)] for i, c in enumerate(src)}
    return "".join(table.get(c, c) for c in s)


@reg(STR_M, "split")
def _split(ip, s, a, b):
    sep = a[0] if a else None
    limit = int(a[1]) if len(a) > 1 else 0
    if sep is None or sep == " ":
        parts = s.split(None, limit - 1) if limit > 0 else s.split()
    else:
        parts = s.split(sep, limit - 1) if limit > 0 else s.split(sep)
        if sep == "":
            parts = list(s)
        while limit == 0 and parts and parts[-1] == "":
            parts.pop()
    return parts


@reg(STR_M, "sub", "gsub", "sub!", "gsub!")
def _sub(ip, s, a, b):
    pat = a[0] if isinstance(a[0], str) else ip.to_s(a[0])
    if pat == "" or pat not in s:
        return s
    if len(a) > 1:
        r = a[1]
        rep = ip.to_s(r.get(pat)) if isinstance(r, dict) else ip.to_s(r)
    else:
        rep = ip.to_s(ip.call_proc(b, [pat])) if b else ""
    return s.replace(pat, rep, -1 if (ip.cur_name or "").startswith("gsub") else 1)


@reg(STR_M, "center", "ljust", "rjust")
def _pad(ip, s, a, b):
    w = int(a[0])
    pad = a[1] if len(a) > 1 else " "
    return {"center": s.center, "ljust": s.ljust, "rjust": s.rjust}[ip.cur_name](w, pad[:1])


STR_M.update({
    "length": lambda ip, s, a, b: len(s), "size": lambda ip, s, a, b: len(s),
    "bytesize": lambda ip, s, a, b: len(s.encode("utf-8")),
    "upcase": lambda ip, s, a, b: s.upper(), "downcase": lambda ip, s, a, b: s.lower(),
    "capitalize": lambda ip, s, a, b: s[:1].upper() + s[1:].lower(), "swapcase": lambda ip, s, a, b: s.swapcase(),
    "strip": lambda ip, s, a, b: s.strip(), "lstrip": lambda ip, s, a, b: s.lstrip(), "rstrip": lambda ip, s, a, b: s.rstrip(),
    "chomp": lambda ip, s, a, b: s[:-len(a[0])] if a and s.endswith(a[0]) else s.rstrip("\r\n") if not a else s,
    "chop": lambda ip, s, a, b: s[:-1], "chars": lambda ip, s, a, b: list(s),
    "bytes": lambda ip, s, a, b: list(s.encode("utf-8")), "lines": lambda ip, s, a, b: s.splitlines(True),
    "include?": lambda ip, s, a, b: a[0] in s,
    "start_with?": lambda ip, s, a, b: any(s.startswith(x) for x in a if isinstance(x, str)),
    "end_with?": lambda ip, s, a, b: any(s.endswith(x) for x in a if isinstance(x, str)),
    "index": lambda ip, s, a, b: (lambda i: None if i < 0 else i)(s.find(a[0], int(a[1]) if len(a) > 1 else 0)),
    "rindex": lambda ip, s, a, b: (lambda i: None if i < 0 else i)(s.rfind(a[0])),
    "to_s": lambda ip, s, a, b: s, "to_str": lambda ip, s, a, b: s,
    "to_sym": lambda ip, s, a, b: Symbol(s), "intern": lambda ip, s, a, b: Symbol(s),
    "to_i": lambda ip, s, a, b: _leading_num(s, r"[+-]?\d+", int, 0),
    "to_f": lambda ip, s, a, b: _leading_num(s, r"[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?", float, 0.0),
    "inspect": lambda ip, s, a, b: ip.inspect(s), "empty?": lambda ip, s, a, b: len(s) == 0,
    "reverse": lambda ip, s, a, b: s[::-1], "[]": lambda ip, s, a, b: _str_idx(ip, s, a),
    "slice": lambda ip, s, a, b: _str_idx(ip, s, a),
    "each_char": lambda ip, s, a, b: each_or_list(ip, list(s), b, s),
    "each_line": lambda ip, s, a, b: each_or_list(ip, s.splitlines(True), b, s),
    "count": lambda ip, s, a, b: sum(1 for c in s if c in set(_tr_expand(a[0]))),
    "delete": lambda ip, s, a, b: "".join(c for c in s if c not in set(_tr_expand(a[0]))),
    "squeeze": lambda ip, s, a, b: re.sub(r"(.)\1+", r"\1", s),
    "ord": lambda ip, s, a, b: ord(s[0]), "hex": lambda ip, s, a, b: _leading_num(s, r"[0-9a-fA-F]+", lambda t: int(t, 16), 0),
    "succ": lambda ip, s, a, b: s[:-1] + chr(ord(s[-1]) + 1) if s else "",
    "match?": lambda ip, s, a, b: isinstance(a[0], str) and a[0] in s, "match": lambda ip, s, a, b: None,
    "=~": lambda ip, s, a, b: None, "scan": lambda ip, s, a, b: [a[0]] * s.count(a[0]) if isinstance(a[0], str) and a[0] else [],
    "hash": lambda ip, s, a, b: hash(s), "eql?": lambda ip, s, a, b: isinstance(a[0], str) and s == a[0],
    "concat": lambda ip, s, a, b: s + "".join(ip.to_s(x) for x in a), "prepend": lambda ip, s, a, b: "".join(a) + s,
    "insert": lambda ip, s, a, b: s[:int(a[0])] + a[1] + s[int(a[0]):], "replace": lambda ip, s, a, b: a[0],
    "format": lambda ip, s, a, b: ruby_format(ip, s, a),
    "unpack": lambda ip, s, a, b: [], "unpack1": lambda ip, s, a, b: None,
})
for _n in ("encode", "force_encoding", "unicode_normalize", "b", "scrub", "freeze", "dup", "clone", "+@", "-@", "itself"):
    STR_M[_n] = lambda ip, s, a, b: s
STR_M["encoding"] = lambda ip, s, a, b: "UTF-8"
for _n in ("upcase!", "downcase!", "strip!", "chomp!", "capitalize!", "squeeze!", "reverse!", "lstrip!", "rstrip!"):
    STR_M[_n] = (lambda base: (lambda ip, s, a, b: STR_M[base](ip, s, a, b)))(_n[:-1])
for _op in ("+", "*", "%", "<", ">", "<=", ">=", "<=>", "<<"):
    STR_M[_op] = (lambda op: (lambda ip, s, a, b: ip.binop(op, s, a[0])))(_op)
STR_M["=="] = lambda ip, s, a, b: isinstance(a[0], str) and s == a[0]


# ====================================================================== Symbol / nil / bool / Proc
SYM_M = {
    "to_s": lambda ip, r, a, b: r.name, "id2name": lambda ip, r, a, b: r.name, "name": lambda ip, r, a, b: r.name,
    "to_sym": lambda ip, r, a, b: r, "length": lambda ip, r, a, b: len(r.name), "size": lambda ip, r, a, b: len(r.name),
    "upcase": lambda ip, r, a, b: Symbol(r.name.upper()), "downcase": lambda ip, r, a, b: Symbol(r.name.lower()),
    "capitalize": lambda ip, r, a, b: Symbol(r.name.capitalize()), "inspect": lambda ip, r, a, b: ":" + r.name,
    "to_proc": lambda ip, r, a, b: ip.to_proc(r), "[]": lambda ip, r, a, b: _str_idx(ip, r.name, a),
    "start_with?": lambda ip, r, a, b: any(r.name.startswith(x) for x in a),
    "end_with?": lambda ip, r, a, b: any(r.name.endswith(x) for x in a), "empty?": lambda ip, r, a, b: not r.name,
    "<=>": lambda ip, r, a, b: ip.binop("<=>", r.name, a[0].name) if isinstance(a[0], Symbol) else None,
}

NIL_M = {
    "to_s": lambda ip, r, a, b: "", "to_a": lambda ip, r, a, b: [], "to_i": lambda ip, r, a, b: 0,
    "to_f": lambda ip, r, a, b: 0.0, "to_h": lambda ip, r, a, b: RHash(), "inspect": lambda ip, r, a, b: "nil",
    "&": lambda ip, r, a, b: False, "|": lambda ip, r, a, b: truthy(a[0]),
}

BOOL_M = {
    "to_s": lambda ip, r, a, b: "true" if r else "false", "inspect": lambda ip, r, a, b: "true" if r else "false",
    "&": lambda ip, r, a, b: r and truthy(a[0]), "|": lambda ip, r, a, b: r or truthy(a[0]),
    "^": lambda ip, r, a, b: r != truthy(a[0]),
}

PROC_M = {
    "call": lambda ip, r, a, b: ip.call_proc(r, a, b), "()": lambda ip, r, a, b: ip.call_proc(r, a, b),
    "yield": lambda ip, r, a, b: ip.call_proc(r, a, b), "[]": lambda ip, r, a, b: ip.call_proc(r, a, b),
    "===": lambda ip, r, a, b: ip.call_proc(r, a, b), "to_proc": lambda ip, r, a, b: r,
    "arity": lambda ip, r, a, b: r.arity(), "lambda?": lambda ip, r, a, b: r.is_lambda,
    "parameters": lambda ip, r, a, b: [[Symbol(p[0]), Symbol(str(p[1]))] for p in (r.params or [])],
    "curry": lambda ip, r, a, b: r,
}

METHOD_M = {
    "call": lambda ip, r, a, b: r.call(ip, a), "()": lambda ip, r, a, b: r.call(ip, a),
    "[]": lambda ip, r, a, b: r.call(ip, a), "to_proc": lambda ip, r, a, b: ip.to_proc(r),
    "arity": lambda ip, r, a, b: -1, "name": lambda ip, r, a, b: Symbol(r.name),
}

from .builtins_obj import OBJ_M, core_new  # noqa: E402,F401
from . import builtins_coll as coll  # noqa: E402

ENUM_DELEGATE = set(coll.ARR_M) - {"[]=", "<<", "push", "pop", "shift", "unshift", "x", "y", "z"}


def _lookup(r, name):
    if isinstance(r, RRange):
        fn = coll.RANGE_M.get(name)
        if fn is not None:
            return fn, r
        if name in coll.ARR_M and name not in OBJ_M:
            return coll.ARR_M[name], r.to_list()
        return OBJ_M.get(name), r
    if isinstance(r, MethodRef):
        return METHOD_M.get(name) or OBJ_M.get(name), r
    fn = type_table(r).get(name)
    return (fn or OBJ_M.get(name)), r


def send_builtin(ip, r, name, args, blk):
    fn, recv = _lookup(r, name)
    if fn is None:
        return NotImplemented
    prev = getattr(ip, "cur_name", None)
    ip.cur_name = name
    try:
        return fn(ip, recv, args, blk)
    finally:
        ip.cur_name = prev


def type_table(r):
    if r is None:
        return NIL_M
    if isinstance(r, bool):
        return BOOL_M
    if is_num(r):
        return NUM_M
    if isinstance(r, str):
        return STR_M
    if isinstance(r, Symbol):
        return SYM_M
    if isinstance(r, list):
        return coll.ARR_M
    if isinstance(r, dict):
        return coll.HASH_M
    if isinstance(r, RRange):
        return {**coll.ARR_M, **coll.RANGE_M}
    if isinstance(r, Proc):
        return PROC_M
    return {}


__all__ = ["send_builtin", "MethodRef", "ENUM_DELEGATE", "core_new", "type_table", "RModule", "RObject"]
