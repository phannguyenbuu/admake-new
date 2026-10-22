# -*- coding: utf-8 -*-
"""Kiểu dữ liệu runtime dùng chung cho interpreter Ruby (sandbox, không I/O)."""

OP_NAMES = {
    "+": "op_add", "-": "op_sub", "*": "op_mul", "/": "op_div", "%": "op_mod", "**": "op_pow",
    "==": "op_eq", "[]": "op_idx", "[]=": "op_idxset", "-@": "op_neg", "+@": "op_pos",
    "<=>": "op_cmp", "<": "op_lt", ">": "op_gt", "<=": "op_le", ">=": "op_ge", "<<": "op_shl",
    "===": "op_eqq", "!": "op_not",
}


def mangle(name: str) -> str:
    if name in OP_NAMES:
        return "rb_" + OP_NAMES[name]
    return "rb_" + name.replace("?", "_q").replace("!", "_b").replace("=", "_set")


class LimitError(Exception):
    """Vượt giới hạn bước/thời gian – không bị rescue trong Ruby bắt."""


class ControlFlow(Exception):
    pass


class ReturnEx(ControlFlow):
    def __init__(self, value, frame):
        self.value = value
        self.frame = frame


class NextEx(ControlFlow):
    def __init__(self, value):
        self.value = value


class BreakEx(ControlFlow):
    def __init__(self, value, tag):
        self.value = value
        self.tag = tag


class ThrowEx(ControlFlow):
    def __init__(self, tag, value):
        self.tag = tag
        self.value = value


class RubyError(Exception):
    """Ngoại lệ Ruby (StandardError và con) – có thể bị `rescue` bắt."""

    def __init__(self, cls_name="StandardError", message=""):
        super().__init__(f"{cls_name}: {message}")
        self.cls_name = cls_name
        self.message = message


class Symbol:
    __slots__ = ("name",)
    _table = {}

    def __new__(cls, name):
        s = cls._table.get(name)
        if s is None:
            s = object.__new__(cls)
            s.name = name
            cls._table[name] = s
        return s

    def __repr__(self):
        return ":" + self.name


class RObj:
    """Đối tượng có phương thức Ruby khai báo bằng tiền tố rb_ (xem mangle)."""

    rb_class_name = "Object"

    def rb_send(self, ip, name, args, blk):
        fn = getattr(self, mangle(name), None)
        if fn is None:
            return NotImplemented
        return fn(ip, args, blk)

    def responds(self, name):
        return hasattr(self, mangle(name))


class RRange:
    __slots__ = ("first", "last", "excl")

    def __init__(self, first, last, excl):
        self.first = first
        self.last = last
        self.excl = excl

    def to_list(self, limit=1_000_000):
        a, b = self.first, self.last
        if isinstance(a, int) and not isinstance(a, bool) and (isinstance(b, (int, float)) or b is None):
            if b is None:
                raise RubyError("RangeError", "cannot convert endless range to an array")
            if isinstance(b, float):
                import math
                end = math.floor(b)
                stop = end if (self.excl and b == end) else end + 1
            else:
                stop = b if self.excl else b + 1
            if stop - a > limit:
                raise LimitError("Range quá lớn")
            return list(range(a, stop))
        if isinstance(a, str) and isinstance(b, str) and len(a) == 1 and len(b) == 1:
            stop = ord(b) if self.excl else ord(b) + 1
            return [chr(c) for c in range(ord(a), stop)]
        raise RubyError("TypeError", "can't iterate range")

    def covers(self, v):
        try:
            if self.first is not None and v < self.first:
                return False
            if self.last is None:
                return True
            return v < self.last if self.excl else v <= self.last
        except TypeError:
            return False


class Proc:
    __slots__ = ("params", "body", "env", "self_obj", "is_lambda", "frame", "module", "native", "tag")

    def __init__(self, params, body, env, self_obj, frame, module, is_lambda=False, native=None):
        self.params = params
        self.body = body
        self.env = env
        self.self_obj = self_obj
        self.frame = frame
        self.module = module
        self.is_lambda = is_lambda
        self.native = native  # callable(ip, args) cho &:sym
        self.tag = object()

    def arity(self):
        if self.native:
            return -1
        return sum(1 for p in self.params if p[0] == "req")


class RModule:
    def __init__(self, name, parent=None, is_class=False, superclass=None):
        self.name = name
        self.parent = parent  # lexical
        self.is_class = is_class
        self.superclass = superclass
        self.consts = {}
        self.methods = {}  # instance methods (và module_function khi extend self)
        self.smethods = {}  # singleton methods (def self.x)
        self.ivars = {}
        self.attr_readers = set()
        self.attr_writers = set()
        self.includes = []

    def full_name(self):
        if self.parent is not None and self.parent.name not in ("Object", None):
            return f"{self.parent.full_name()}::{self.name}"
        return self.name

    def find_method(self, name):
        m = self
        while m is not None:
            if name in m.methods:
                return m.methods[name]
            for inc in m.includes:
                if name in inc.methods:
                    return inc.methods[name]
            m = m.superclass
        return None

    def find_smethod(self, name):
        m = self
        while m is not None:
            if name in m.smethods:
                return m.smethods[name]
            m = m.superclass
        return None

    def __repr__(self):
        return self.full_name()


class RObject:
    def __init__(self, cls):
        self.cls = cls
        self.ivars = {}


class RException(RObj):
    rb_class_name = "StandardError"

    def __init__(self, cls_name, message):
        self.cls_name = cls_name
        self.message = message

    def rb_message(self, ip, a, b):
        return self.message

    rb_to_s = rb_message
    rb_full_message = rb_message

    def rb_backtrace(self, ip, a, b):
        return []

    def rb_class(self, ip, a, b):
        return ip.const_lookup_global(self.cls_name) or ip.globals_mod

    def rb_inspect(self, ip, a, b):
        return f"#<{self.cls_name}: {self.message}>"


def truthy(v) -> bool:
    return v is not None and v is not False


def is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)
