# -*- coding: utf-8 -*-
"""Cơ chế gọi hàm của interpreter: khởi tạo object, gọi method/proc và gán tham số."""

from .interp import Env, Frame, Interpreter
from .interp_ops import RHash
from .runtime import NextEx, RObject, ReturnEx, RubyError, Symbol


def _instantiate(self, cls, args, blk):
    obj = RObject(cls)
    fields = getattr(cls, "struct_fields", None)
    if fields:
        if len(args) == 1 and isinstance(args[0], dict) and getattr(cls, "keyword_init", False):
            for f in fields:
                obj.ivars["@" + f] = args[0].get(Symbol(f))
        else:
            for i, f in enumerate(fields):
                obj.ivars["@" + f] = args[i] if i < len(args) else None
    m = cls.find_method("initialize")
    if m is not None:
        self.invoke(m, obj, args, blk)
    return obj


def _invoke(self, m, self_obj, args, blk):
    if m.proc is not None:
        return self.call_proc(m.proc, args, blk, self_override=self_obj)
    fr = Frame(self_obj, m.owner, m.owner, blk, m.name, args, owner=m.owner)
    env = Env()
    self.bind_params(m.params, args, env, fr, True, blk)
    try:
        return self.eval(m.body, env, fr)
    except ReturnEx as r:
        if r.frame is fr:
            return r.value
        raise


def _call_proc(self, proc, args, blk=None, self_override=None):
    if proc.native is not None:
        return proc.native(self, list(args))
    env = Env(proc.env)
    fr = proc.frame
    if self_override is not None:
        fr = Frame(self_override, fr.module, fr.defmod, blk or fr.block, fr.method, args, owner=fr.owner)
    self.bind_params(proc.params, list(args), env, fr, proc.is_lambda, blk)
    try:
        return self.eval(proc.body, env, fr)
    except NextEx as e:
        return e.value
    except ReturnEx as r:
        if proc.is_lambda:
            return r.value
        raise


def _bind_params(self, params, args, env, fr, strict, blk, autosplat=True):
    if not params:
        return
    positional = [p for p in params if p[0] in ("req", "opt", "destr")]
    has_rest = any(p[0] == "rest" for p in params)
    if not strict and autosplat and len(args) == 1 and isinstance(args[0], list) and (
        len(positional) > 1 or (positional and has_rest)
    ):
        args = list(args[0])
    kw = None
    if any(p[0] in ("key", "keyrest") for p in params) and args and isinstance(args[-1], dict) and all(
        isinstance(k, Symbol) for k in args[-1]
    ):
        kw = dict(args[-1])
        args = args[:-1]
    n_req = sum(1 for p in params if p[0] in ("req", "destr"))
    n_opt = sum(1 for p in params if p[0] == "opt")
    if strict and (len(args) < n_req or (not has_rest and len(args) > n_req + n_opt)):
        raise RubyError("ArgumentError", f"wrong number of arguments (given {len(args)}, expected {n_req})")
    avail_opt = max(0, len(args) - n_req)
    i = 0
    for idx, (kind, name, default) in enumerate(params):
        if kind in ("req", "destr"):
            v = args[i] if i < len(args) else None
            i += 1
            if kind == "destr":
                self.bind_params(name, v if isinstance(v, list) else [v], env, fr, False, None, autosplat=False)
            else:
                env.vars[name] = v
        elif kind == "opt":
            if avail_opt > 0 and i < len(args):
                env.vars[name] = args[i]
                i += 1
                avail_opt -= 1
            else:
                env.vars[name] = self.eval(default, env, fr)
        elif kind == "rest":
            remaining = sum(1 for q in params[idx + 1:] if q[0] in ("req", "destr"))
            cnt = max(0, len(args) - i - remaining)
            env.vars[name] = list(args[i:i + cnt])
            i += cnt
        elif kind == "key":
            key = Symbol(name)
            if kw is not None and key in kw:
                env.vars[name] = kw.pop(key)
            elif default is not None:
                env.vars[name] = self.eval(default, env, fr)
            else:
                if strict:
                    raise RubyError("ArgumentError", f"missing keyword: :{name}")
                env.vars[name] = None
        elif kind == "keyrest":
            env.vars[name] = RHash(kw or {})
        elif kind == "block":
            env.vars[name] = blk


Interpreter.instantiate = _instantiate
Interpreter.invoke = _invoke
Interpreter.call_proc = _call_proc
Interpreter.bind_params = _bind_params
