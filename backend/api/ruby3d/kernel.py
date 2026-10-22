# -*- coding: utf-8 -*-
"""Các hàm Kernel / Module gọi không có receiver (puts, raise, attr_accessor, loop...)."""

import random

from .interp_ops import RHash, ruby_format
from .runtime import (
    BreakEx, Proc, RException, RModule, RObject, RRange, RubyError, Symbol, ThrowEx, is_num, truthy,
)

K = {}


def _reg(*names):
    def deco(fn):
        for n in names:
            K[n] = fn
        return fn
    return deco


def _name(v):
    return v.name if isinstance(v, Symbol) else str(v)


def _target_mod(ip, fr):
    s = fr.self_obj
    if isinstance(s, RModule):
        return s
    return fr.defmod if isinstance(fr.defmod, RModule) else ip.main_mod


# ---------------------------------------------------------------- output / load
@_reg("puts")
def _puts(ip, a, b, fr):
    if not a:
        ip.puts("")
    for v in a:
        for line in (ip.splat_list(v) if isinstance(v, list) else [v]):
            ip.puts(ip.to_s(line))
    return None


@_reg("print", "warn", "display")
def _print(ip, a, b, fr):
    ip.puts("".join(ip.to_s(v) for v in a))
    return None


@_reg("p", "pp")
def _p(ip, a, b, fr):
    for v in a:
        ip.puts(ip.inspect(v))
    return a[0] if len(a) == 1 else (a or None)


@_reg("printf")
def _printf(ip, a, b, fr):
    ip.puts(ruby_format(ip, a[0], a[1:]))
    return None


@_reg("format", "sprintf")
def _format(ip, a, b, fr):
    return ruby_format(ip, a[0], a[1:])


@_reg("require", "require_relative", "load", "file_loaded", "srand", "sleep", "at_exit", "using",
      "set_trace_func", "trap", "autoload")
def _true(ip, a, b, fr):
    return True


@_reg("file_loaded?", "gets", "binding", "caller_locations", "__dir__")
def _nil(ip, a, b, fr):
    return None


K["caller"] = lambda ip, a, b, fr: []
K["__FILE__"] = lambda ip, a, b, fr: "script.rb"
K["__method__"] = lambda ip, a, b, fr: Symbol(fr.method) if fr.method else None


# ---------------------------------------------------------------- exceptions / control
def make_error(ip, a):
    if not a:
        return RubyError("RuntimeError", "unhandled exception")
    e = a[0]
    msg = ip.to_s(a[1]) if len(a) > 1 else None
    if isinstance(e, str):
        return RubyError("RuntimeError", e)
    if isinstance(e, RException):
        return RubyError(e.cls_name, msg or e.message)
    if isinstance(e, RObject):
        return RubyError(e.cls.name or "StandardError", msg or ip.to_s(e.ivars.get("@message", e.cls.name)))
    name = getattr(e, "name", None) or "RuntimeError"
    return RubyError(str(name).split("::")[-1], msg or str(name))


@_reg("raise", "fail")
def _raise(ip, a, b, fr):
    raise make_error(ip, a)


@_reg("loop")
def _loop(ip, a, b, fr):
    if b is None:
        return []
    try:
        while True:
            ip.call_proc(b, [])
    except RubyError as e:
        if e.cls_name == "StopIteration":
            return None
        raise


@_reg("catch")
def _catch(ip, a, b, fr):
    tag = a[0] if a else object()
    try:
        return ip.call_proc(b, [tag])
    except ThrowEx as t:
        if t.tag is tag or ip.rb_equal(t.tag, tag):
            return t.value
        raise


@_reg("throw")
def _throw(ip, a, b, fr):
    raise ThrowEx(a[0], a[1] if len(a) > 1 else None)


@_reg("exit", "exit!", "abort")
def _exit(ip, a, b, fr):
    raise RubyError("SystemExit", "exit")


# ---------------------------------------------------------------- conversions / random
def _rng(ip):
    r = getattr(ip, "_rng", None)
    if r is None:
        r = ip._rng = random.Random(12345)
    return r


@_reg("rand")
def _rand(ip, a, b, fr):
    rng = _rng(ip)
    if not a or a[0] in (None, 0):
        return rng.random()
    v = a[0]
    if isinstance(v, RRange):
        if isinstance(v.first, int) and isinstance(v.last, int):
            return rng.randint(v.first, v.last - (1 if v.excl else 0))
        return rng.uniform(float(v.first), float(v.last))
    if isinstance(v, float):
        return rng.random() * v
    return rng.randrange(int(v))


@_reg("Integer")
def _integer(ip, a, b, fr):
    v = a[0]
    if isinstance(v, str):
        try:
            return int(v.strip().replace("_", ""), 0)
        except ValueError:
            raise RubyError("ArgumentError", f"invalid value for Integer(): {ip.inspect(v)}")
    if v is None:
        raise RubyError("TypeError", "can't convert nil into Integer")
    return int(v)


@_reg("Float")
def _float(ip, a, b, fr):
    v = a[0]
    try:
        return float(v.replace("_", "") if isinstance(v, str) else v)
    except (TypeError, ValueError):
        raise RubyError("ArgumentError", f"invalid value for Float(): {ip.inspect(v)}")


K["String"] = lambda ip, a, b, fr: ip.to_s(a[0])
K["Array"] = lambda ip, a, b, fr: list(ip.splat_list(a[0]))
K["Hash"] = lambda ip, a, b, fr: RHash(a[0] or {})
K["Rational"] = lambda ip, a, b, fr: float(a[0]) / float(a[1]) if len(a) > 1 else float(a[0])


# ---------------------------------------------------------------- Module-level helpers
def _attr(kind):
    def fn(ip, a, b, fr):
        mod = _target_mod(ip, fr)
        for x in a:
            n = _name(x)
            if kind in ("reader", "accessor"):
                mod.attr_readers.add(n)
            if kind in ("writer", "accessor"):
                mod.attr_writers.add(n)
        return [Symbol(_name(x)) for x in a]
    return fn


K["attr_accessor"] = _attr("accessor")
K["attr_reader"] = _attr("reader")
K["attr"] = _attr("reader")
K["attr_writer"] = _attr("writer")


@_reg("extend")
def _extend(ip, a, b, fr):
    s = fr.self_obj
    for m in a:
        if m is s or not isinstance(m, RModule):
            continue
        if isinstance(s, RModule):
            for k, v in m.methods.items():
                s.smethods.setdefault(k, v)
        elif isinstance(s, RObject):
            s.cls.includes.append(m)
    return s


@_reg("include", "prepend")
def _include(ip, a, b, fr):
    mod = _target_mod(ip, fr)
    for m in a:
        if isinstance(m, RModule) and m is not mod and m not in mod.includes:
            mod.includes.append(m)
    return mod


@_reg("private", "public", "protected", "module_function", "private_constant", "public_constant",
      "private_class_method", "public_class_method", "freeze", "ruby2_keywords")
def _visibility(ip, a, b, fr):
    if a:
        return a[0] if len(a) == 1 else list(a)
    return None


@_reg("define_method")
def _define_method(ip, a, b, fr):
    from .interp import UserMethod

    body = b if b is not None else (a[1] if len(a) > 1 and isinstance(a[1], Proc) else None)
    if body is None:
        raise RubyError("ArgumentError", "tried to create Proc object without a block")
    mod = _target_mod(ip, fr)
    n = _name(a[0])
    mod.methods[n] = UserMethod(n, None, None, mod, proc=body)
    return Symbol(n)


@_reg("alias_method")
def _alias_method(ip, a, b, fr):
    mod = _target_mod(ip, fr)
    m = mod.find_method(_name(a[1]))
    if m is not None:
        mod.methods[_name(a[0])] = m
    return Symbol(_name(a[0]))


@_reg("const_set")
def _const_set(ip, a, b, fr):
    _target_mod(ip, fr).consts[_name(a[0])] = a[1]
    return a[1]


@_reg("const_get")
def _const_get(ip, a, b, fr):
    return ip.const_lookup(_name(a[0]), fr)


@_reg("const_defined?")
def _const_defined(ip, a, b, fr):
    try:
        ip.const_lookup(_name(a[0]), fr)
        return True
    except RubyError:
        return False


@_reg("method_defined?", "respond_to_missing?")
def _method_defined(ip, a, b, fr):
    return _target_mod(ip, fr).find_method(_name(a[0])) is not None


@_reg("instance_variable_get")
def _ivget(ip, a, b, fr):
    return ip.ivars_of(fr.self_obj).get(_name(a[0]))


def call(ip, name, args, blk, fr):
    fn = K.get(name)
    if fn is not None:
        return fn(ip, args, blk, fr)
    from .builtins_obj import OBJ_M

    fn = OBJ_M.get(name)
    if fn is not None:
        prev = getattr(ip, "cur_name", None)
        ip.cur_name = name
        try:
            return fn(ip, fr.self_obj, args, blk)
        finally:
            ip.cur_name = prev
    return NotImplemented


__all__ = ["call", "make_error", "BreakEx", "is_num", "truthy"]
