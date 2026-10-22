# -*- coding: utf-8 -*-
"""Phương thức chung của mọi Object và Hash/Array/String/Struct.new."""

from .interp_ops import RHash
from .runtime import Proc, RModule, RObj, RObject, RubyError, Symbol, truthy

OBJ_M = {}


def _reg(*names):
    def deco(fn):
        for n in names:
            OBJ_M[n] = fn
        return fn
    return deco


def _name(v):
    return v.name if isinstance(v, Symbol) else str(v)


def responds_to(ip, r, name):
    from .builtins_core import type_table
    from .natives import NativeModule

    if name in OBJ_M or name in type_table(r):
        return True
    if isinstance(r, RObject):
        if r.cls.find_method(name):
            return True
        c = r.cls
        while isinstance(c, RModule):
            if name in c.attr_readers or (name.endswith("=") and name[:-1] in c.attr_writers):
                return True
            c = c.superclass
        return False
    if isinstance(r, RModule):
        return bool(r.find_smethod(name) or (name == "new" and r.is_class))
    if isinstance(r, NativeModule):
        return name in r.smethods or (name == "new" and r.factory is not None)
    if isinstance(r, RObj):
        return r.responds(name)
    return False


@_reg("nil?")
def _nil_q(ip, r, a, b):
    return r is None


@_reg("is_a?", "kind_of?", "instance_of?")
def _is_a(ip, r, a, b):
    return ip.is_a(r, a[0])


@_reg("respond_to?")
def _respond_to(ip, r, a, b):
    return responds_to(ip, r, _name(a[0]))


@_reg("send", "public_send", "__send__")
def _send(ip, r, a, b):
    return ip.call_method(r, _name(a[0]), list(a[1:]), b)


@_reg("freeze", "itself", "dup", "clone", "taint", "untaint")
def _self(ip, r, a, b):
    if ip_name(ip) in ("dup", "clone"):
        if isinstance(r, list):
            return list(r)
        if isinstance(r, RHash):
            h = RHash(r)
            h.default, h.default_proc = r.default, r.default_proc
            return h
        if isinstance(r, dict):
            return RHash(r)
        if isinstance(r, RObject):
            o = RObject(r.cls)
            o.ivars = dict(r.ivars)
            return o
    return r


def ip_name(ip):
    return getattr(ip, "cur_name", None)


@_reg("frozen?")
def _frozen(ip, r, a, b):
    return isinstance(r, (int, float, Symbol)) or r is None or isinstance(r, bool)


@_reg("tap")
def _tap(ip, r, a, b):
    if b is not None:
        ip.call_proc(b, [r])
    return r


@_reg("then", "yield_self")
def _then(ip, r, a, b):
    return ip.call_proc(b, [r]) if b is not None else r


@_reg("to_s")
def _to_s(ip, r, a, b):
    return ip.to_s(r)


@_reg("inspect")
def _inspect(ip, r, a, b):
    return ip.inspect(r)


@_reg("class")
def _class(ip, r, a, b):
    if isinstance(r, RObject):
        return r.cls
    return ip.const_lookup_global(ip.class_name(r).split("::")[-1]) or ip.class_name(r)


@_reg("==", "equal?", "eql?")
def _eq(ip, r, a, b):
    if ip_name(ip) == "equal?":
        return r is a[0]
    return ip.rb_equal(r, a[0])


@_reg("!=")
def _neq(ip, r, a, b):
    return not truthy(ip.binop("==", r, a[0]))


@_reg("!")
def _not(ip, r, a, b):
    return not truthy(r)


@_reg("===")
def _eqq(ip, r, a, b):
    return ip.case_eq(r, a[0])


@_reg("=~")
def _match(ip, r, a, b):
    return None


@_reg("hash", "object_id", "__id__")
def _hash(ip, r, a, b):
    try:
        return hash(r)
    except TypeError:
        return id(r)


@_reg("instance_variable_get")
def _ivget(ip, r, a, b):
    return ip.ivars_of(r).get(_name(a[0]))


@_reg("instance_variable_set")
def _ivset(ip, r, a, b):
    ip.ivars_of(r)[_name(a[0])] = a[1]
    return a[1]


@_reg("instance_variable_defined?")
def _ivdef(ip, r, a, b):
    return _name(a[0]) in ip.ivars_of(r)


@_reg("instance_variables")
def _ivars(ip, r, a, b):
    return [Symbol(k) for k in ip.ivars_of(r)]


@_reg("method")
def _method(ip, r, a, b):
    from .builtins_core import MethodRef
    return MethodRef(r, _name(a[0]))


@_reg("extend")
def _extend(ip, r, a, b):
    for m in a:
        if isinstance(m, RModule) and isinstance(r, RModule) and m is not r:
            for k, v in m.methods.items():
                r.smethods.setdefault(k, v)
        elif isinstance(m, RModule) and isinstance(r, RObject):
            r.cls.includes.append(m)
    return r


@_reg("display")
def _display(ip, r, a, b):
    ip.puts(ip.to_s(r))
    return None


@_reg("methods", "public_methods", "singleton_methods")
def _methods(ip, r, a, b):
    if isinstance(r, RObject):
        return [Symbol(k) for k in r.cls.methods]
    if isinstance(r, RModule):
        return [Symbol(k) for k in r.smethods]
    return []


@_reg("to_enum", "each_entry", "lazy", "enum_for")
def _to_enum(ip, r, a, b):
    return ip.splat_list(r)


@_reg("instance_eval", "instance_exec")
def _instance_eval(ip, r, a, b):
    if b is None:
        return None
    return ip.call_proc(b, a or [r], None, self_override=r)


@_reg("define_singleton_method")
def _def_singleton(ip, r, a, b):
    from .interp import UserMethod
    if isinstance(r, RModule) and b is not None:
        r.smethods[_name(a[0])] = UserMethod(_name(a[0]), None, None, r, proc=b)
    return Symbol(_name(a[0]))


@_reg("<=>")
def _cmp(ip, r, a, b):
    return 0 if ip.rb_equal(r, a[0]) else None


# ---------------------------------------------------------------- Klass.new
def _struct_new(ip, args, blk):
    from .interp import Env, Frame

    kw = args[-1] if args and isinstance(args[-1], dict) else None
    fields = [_name(x) for x in args if isinstance(x, (Symbol, str))]
    if fields and isinstance(args[0], str) and args[0][:1].isupper():
        fields = fields[1:]
    cls = RModule(None, is_class=True)
    cls.struct_fields = fields
    cls.keyword_init = bool(kw and truthy(kw.get(Symbol("keyword_init"))))
    cls.attr_readers.update(fields)
    cls.attr_writers.update(fields)
    if blk is not None and blk.body is not None:
        ip.eval(blk.body, Env(blk.env), Frame(cls, cls, cls))
    return cls


def core_new(ip, name, args, blk):
    if name == "Hash":
        h = RHash()
        if args:
            h.default = args[0]
        if blk is not None:
            h.default_proc = blk
        return h
    if name == "Array":
        if not args:
            return []
        if isinstance(args[0], list):
            return list(args[0])
        n = int(args[0])
        if n > 1_000_000:
            raise RubyError("ArgumentError", "array size too big")
        if blk is not None:
            return [ip.call_proc(blk, [i]) for i in range(n)]
        return [args[1] if len(args) > 1 else None for _ in range(n)]
    if name == "String":
        return ip.to_s(args[0]) if args else ""
    if name == "Struct":
        return _struct_new(ip, args, blk)
    return RObject(ip.main_mod if not isinstance(ip.const_lookup_global("Object"), RModule)
                   else ip.const_lookup_global("Object"))


__all__ = ["OBJ_M", "core_new", "responds_to", "Proc"]
