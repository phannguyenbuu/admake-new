# -*- coding: utf-8 -*-
"""Điều khiển luồng, định nghĩa method/module và cơ chế gọi hàm của interpreter."""

from .interp import Env, Frame, Interpreter, UserMethod
from .interp_ops import RHash, hkey
from .natives import NativeModule
from .runtime import (
    BreakEx, NextEx, Proc, RException, RModule, RObj, RObject, RRange, ReturnEx, RubyError, Symbol, truthy,
)
from . import builtins_core as bcore
from . import kernel

PY_ERRORS = (TypeError, ValueError, ZeroDivisionError, IndexError, KeyError, AttributeError, OverflowError)


def _ev_if(self, n, env, fr):
    if truthy(self.eval(n[1], env, fr)):
        return self.eval(n[2], env, fr) if n[2] is not None else None
    return self.eval(n[3], env, fr) if n[3] is not None else None


def _ev_while(self, n, env, fr):
    first = True
    while True:
        if not (n[4] and first):
            if not truthy(self.eval(n[1], env, fr)):
                break
        first = False
        try:
            self.eval(n[2], env, fr)
        except NextEx:
            pass
        except BreakEx as e:
            return e.value
    return None


def _ev_for(self, n, env, fr):
    items = self.splat_list(self.eval(n[2], env, fr))
    names = n[1]
    for item in items:
        if len(names) == 1:
            env.set(names[0], item)
        else:
            self.destructure([("lvar", nm) for nm in names], item if isinstance(item, list) else [item], env, fr)
        try:
            self.eval(n[3], env, fr)
        except NextEx:
            pass
        except BreakEx as e:
            return e.value
    return items


def _ev_case(self, n, env, fr):
    has_subj = n[1] is not None
    subj = self.eval(n[1], env, fr) if has_subj else None
    for vals, body in n[2]:
        for vnode in vals:
            pats = self.splat_list(self.eval(vnode[1], env, fr)) if vnode[0] == "splat" else [self.eval(vnode, env, fr)]
            for pat in pats:
                if (self.case_eq(pat, subj) if has_subj else truthy(pat)):
                    return self.eval(body, env, fr)
    return self.eval(n[3], env, fr) if n[3] is not None else None


def _ev_kwbegin(self, n, env, fr):
    return self.eval(n[1], env, fr)


def _wrap_py_error(e):
    name = {ZeroDivisionError: "ZeroDivisionError", IndexError: "IndexError", KeyError: "KeyError",
            AttributeError: "NoMethodError"}.get(type(e), "TypeError")
    return RubyError(name, f"{type(e).__name__}: {e}")


def _handle_rescue(self, err, rescues, env, fr):
    for classes, var, body in rescues:
        names = []
        for c in classes:
            try:
                cv = self.eval(c, env, fr)
                names.append(getattr(cv, "name", None) or "")
            except RubyError:
                names.append("")
        if not names:
            ok = err.cls_name not in ("SystemExit",)
        else:
            ok = any(nm in ("Exception", "StandardError", err.cls_name) or
                     (nm == "RuntimeError" and err.cls_name in ("RuntimeError", "StandardError")) for nm in names)
        if ok:
            self.rescued.append(f"{err.cls_name}: {err.message}"[:300])
            if var:
                env.set(var, RException(err.cls_name, err.message))
            return self.eval(body, env, fr)
    raise err


def _ev_begin(self, n, env, fr):
    try:
        try:
            result = self.eval(n[1], env, fr)
        except RubyError as e:
            if not n[2]:
                raise
            return self.handle_rescue(e, n[2], env, fr)
        except PY_ERRORS as e:
            if not n[2]:
                raise _wrap_py_error(e)
            return self.handle_rescue(_wrap_py_error(e), n[2], env, fr)
        if n[3] is not None:
            result = self.eval(n[3], env, fr)
        return result
    finally:
        if n[4] is not None:
            self.eval(n[4], env, fr)


def _ev_block(self, n, env, fr):
    result = None
    for s in n[1]:
        result = self.eval(s, env, fr)
    return result


def _ev_def(self, n, env, fr):
    _, name, params, body, singleton = n
    m = UserMethod(name, params, body, fr.module)
    if singleton == "self" or fr.sdef:
        target = fr.self_obj if isinstance(fr.self_obj, RModule) else fr.defmod
        target.smethods[name] = m
    elif singleton:
        self.const_lookup(singleton, fr).smethods[name] = m
    else:
        target = fr.defmod if isinstance(fr.defmod, RModule) else self.main_mod
        target.methods[name] = m
    return Symbol(name)


def _resolve_container(self, path, fr):
    container = fr.module
    for nm in path[:-1]:
        container = self.const_lookup(nm, fr) if container is fr.module else self.const_in(container, nm)
    return container


def _ev_module(self, n, env, fr):
    _, path, sup, body = n
    is_class = n[0] == "class"
    container = self.resolve_container(path, fr)
    name = path[-1]
    mod = container.consts.get(name)
    if not isinstance(mod, RModule):
        sup_val = self.eval(sup, env, fr) if sup is not None else None
        mod = RModule(name, parent=None if container is self.main_mod else container, is_class=is_class,
                      superclass=sup_val if isinstance(sup_val, RModule) else None)
        if isinstance(sup_val, NativeModule):
            mod.native_super = sup_val.name
        container.consts[name] = mod
    self.eval(body, Env(), Frame(mod, mod, mod))
    return None


def _ev_sclass(self, n, env, fr):
    self.eval(n[1], Env(), Frame(fr.self_obj, fr.module, fr.defmod, sdef=True))
    return None


def _ev_return(self, n, env, fr):
    raise ReturnEx(self.eval(n[1], env, fr) if n[1] is not None else None, fr)


def _ev_next(self, n, env, fr):
    raise NextEx(self.eval(n[1], env, fr) if n[1] is not None else None)


def _ev_break(self, n, env, fr):
    raise BreakEx(self.eval(n[1], env, fr) if n[1] is not None else None, None)


def _ev_yield(self, n, env, fr):
    if fr.block is None:
        raise RubyError("LocalJumpError", "no block given (yield)")
    args, _ = self.eval_args(n[1], env, fr)
    return self.call_proc(fr.block, args)


def _ev_super(self, n, env, fr):
    args = self.eval_args(n[1], env, fr)[0] if n[1] is not None else list(fr.args)
    owner = fr.owner
    if isinstance(owner, RModule) and isinstance(owner.superclass, RModule):
        m = owner.superclass.find_method(fr.method)
        if m:
            return self.invoke(m, fr.self_obj, args, fr.block)
    if fr.method == "initialize" and isinstance(fr.self_obj, RObject) and args:
        fr.self_obj.ivars["@message"] = args[0]
    return None


def _ev_lambda(self, n, env, fr):
    return Proc(n[1], n[2], env, fr.self_obj, fr, fr.module, is_lambda=True)


def _ev_alias(self, n, env, fr):
    target = fr.defmod if isinstance(fr.defmod, RModule) else self.main_mod
    m = target.find_method(n[2]) or self.main_mod.methods.get(n[2])
    if m:
        target.methods[n[1]] = m
    return None


def _ev_passthrough(self, n, env, fr):
    return self.eval(n[1], env, fr)


def _ev_pair(self, n, env, fr):
    return RHash({hkey(self.eval(n[1], env, fr)): self.eval(n[2], env, fr)})


# ---------------------------------------------------------------- calls
def _eval_args(self, nodes, env, fr):
    out = []
    kw = None
    bp = None
    for a in nodes:
        k = a[0]
        if k == "splat":
            out.extend(self.splat_list(self.eval(a[1], env, fr)))
        elif k == "pair":
            if kw is None:
                kw = RHash()
            kw[hkey(self.eval(a[1], env, fr))] = self.eval(a[2], env, fr)
        elif k == "dsplat":
            if kw is None:
                kw = RHash()
            kw.update(self.eval(a[1], env, fr) or {})
        elif k == "blockpass":
            bp = self.eval(a[1], env, fr)
        else:
            out.append(self.eval(a, env, fr))
    if kw is not None:
        out.append(kw)
    return out, bp


def _splat_list(self, v):
    if isinstance(v, list):
        return v
    if v is None:
        return []
    if isinstance(v, RRange):
        return v.to_list()
    if isinstance(v, dict):
        return [[k, x] for k, x in v.items()]
    if isinstance(v, RObj) and v.responds("to_a"):
        return list(v.rb_send(self, "to_a", [], None))
    return [v]


def _to_proc(self, bp):
    if bp is None or isinstance(bp, Proc):
        return bp
    if isinstance(bp, Symbol):
        name = bp.name
        return Proc([], None, None, None, None, None, native=lambda ip, args: ip.call_method(args[0], name, list(args[1:]), None))
    if isinstance(bp, bcore.MethodRef):
        return Proc([], None, None, None, None, None, native=lambda ip, args: bp.call(ip, args))
    raise RubyError("TypeError", "wrong argument type (expected Proc)")


def _ev_call(self, n, env, fr):
    _, recv_node, name, arg_nodes, blk_node, safe = n
    recv = None
    if recv_node is not None:
        recv = self.eval(recv_node, env, fr)
        if safe and recv is None:
            return None
    args, bp = self.eval_args(arg_nodes, env, fr) if arg_nodes else ([], None)
    blk = None
    if blk_node is not None:
        blk = Proc(blk_node[1], blk_node[2], env, fr.self_obj, fr, fr.module)
    elif bp is not None:
        blk = self.to_proc(bp)
    try:
        if recv_node is None:
            if blk is not None and name in ("lambda", "proc") and not args:
                blk.is_lambda = name == "lambda"
                return blk
            if name == "block_given?":
                return fr.block is not None
            return self.call_implicit(name, args, blk, fr)
        return self.call_method(recv, name, args, blk)
    except BreakEx as e:
        if blk is not None:
            return e.value
        raise


def _ev_index(self, n, env, fr):
    recv = self.eval(n[1], env, fr)
    args, _ = self.eval_args(n[2], env, fr)
    return self.call_method(recv, "[]", args, None)


def _find_implicit_method(self, name, fr):
    s = fr.self_obj
    if isinstance(s, RModule):
        m = s.find_smethod(name) or s.find_method(name)
        if m:
            return m
        p = fr.module
        while isinstance(p, RModule):
            m = p.methods.get(name) or p.smethods.get(name)
            if m:
                return m
            p = p.parent
    elif isinstance(s, RObject):
        m = s.cls.find_method(name)
        if m:
            return m
        p = fr.module
        while isinstance(p, RModule):
            if not p.is_class:
                m = p.methods.get(name) or p.smethods.get(name)
                if m:
                    return m
            p = p.parent
    return self.main_mod.find_method(name)


def _call_implicit(self, name, args, blk, fr, allow_nil=False):
    m = self.find_implicit_method(name, fr)
    if m is not None:
        return self.invoke(m, fr.self_obj, args, blk)
    s = fr.self_obj
    if isinstance(s, RObject):
        r = self.object_attr(s, name, args)
        if r is not NotImplemented:
            return r
    r = kernel.call(self, name, args, blk, fr)
    if r is not NotImplemented:
        return r
    if isinstance(s, RObj):
        r = s.rb_send(self, name, args, blk)
        if r is not NotImplemented:
            return r
    if not args and hasattr(self, "top_env") and self.top_env is not None:
        v = self.top_env.get(name)
        if v is not None:
            return v
    for k, v in self.global_consts.items():
        if k.lower() == name.lower():
            return v
    if allow_nil:
        return None
    raise RubyError("NameError", f"undefined local variable or method '{name}'")


def _object_attr(self, obj, name, args):
    c = obj.cls
    while isinstance(c, RModule):
        if name in c.attr_readers and not args:
            return obj.ivars.get("@" + name)
        if name.endswith("=") and name[:-1] in c.attr_writers and args:
            obj.ivars["@" + name[:-1]] = args[0]
            return args[0]
        c = c.superclass
    return NotImplemented


def _call_method(self, recv, name, args, blk):
    if isinstance(recv, RObject):
        m = recv.cls.find_method(name)
        if m is not None:
            return self.invoke(m, recv, args, blk)
        r = self.object_attr(recv, name, args)
        if r is not NotImplemented:
            return r
        if name in ("message", "to_s") and getattr(recv.cls, "native_super", None):
            return recv.ivars.get("@message", recv.cls.name)
    elif isinstance(recv, RModule):
        if name == "new" and recv.is_class:
            return self.instantiate(recv, args, blk)
        m = recv.find_smethod(name) or recv.find_method(name)
        if m is not None:
            return self.invoke(m, recv, args, blk)
    elif isinstance(recv, NativeModule):
        if name == "new" and recv.factory is not None:
            return recv.factory(self, args, blk)
        fn = recv.smethods.get(name)
        if fn is not None:
            return fn(self, args, blk)
        if name == "new" and (recv.name.endswith("Error") or recv.name.endswith("Exception")):
            return RException(recv.name, self.to_s(args[0]) if args else recv.name)
        if name == "new" and recv.name in ("Hash", "Array", "String", "Struct", "Object"):
            return bcore.core_new(self, recv.name, args, blk)
        if name in ("name", "to_s", "inspect"):
            return recv.name
        if name == "===":
            return self.is_a(args[0], recv)
        if name == "const_get":
            return self.const_in(recv, str(getattr(args[0], "name", args[0])))
    elif isinstance(recv, RObj):
        r = recv.rb_send(self, name, args, blk)
        if r is not NotImplemented:
            return r
        if hasattr(recv, "rb_to_a") and name in bcore.ENUM_DELEGATE:
            return bcore.send_builtin(self, list(recv.rb_send(self, "to_a", [], None)), name, args, blk)
    r = bcore.send_builtin(self, recv, name, args, blk)
    if r is not NotImplemented:
        return r
    raise RubyError("NoMethodError", f"undefined method '{name}' for {self.class_name(recv)}")


for _name, _fn in list(globals().items()):
    if _name.startswith("_ev_"):
        setattr(Interpreter, "ev_" + _name[4:], _fn)

Interpreter.ev_splat = _ev_passthrough
Interpreter.ev_blockpass = _ev_passthrough
Interpreter.ev_dsplat = _ev_passthrough
Interpreter.ev_class = _ev_module
Interpreter.handle_rescue = _handle_rescue
Interpreter.resolve_container = _resolve_container
Interpreter.eval_args = _eval_args
Interpreter.splat_list = _splat_list
Interpreter.to_proc = _to_proc
Interpreter.find_implicit_method = _find_implicit_method
Interpreter.call_implicit = _call_implicit
Interpreter.object_attr = _object_attr
Interpreter.call_method = _call_method

from . import interp_call  # noqa: E402,F401
