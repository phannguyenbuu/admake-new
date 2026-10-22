# -*- coding: utf-8 -*-
"""Phương thức dựng sẵn cho Hash và Range."""

from .builtins_core import float_steps, reg
from .interp_ops import RHash, hkey, unkey
from .runtime import RRange, RubyError, truthy

HASH_M = {}
RANGE_M = {}


def _call(ip, b, *args):
    return ip.call_proc(b, list(args))


def _pairs(r):
    return [[unkey(k), v] for k, v in list(r.items())]


def hash_get(ip, r, k):
    key = hkey(k)
    if key in r:
        return r[key]
    dp = getattr(r, "default_proc", None)
    if dp is not None:
        return ip.call_proc(dp, [r, k])
    return getattr(r, "default", None)


def _new_like(r, items=None):
    h = RHash(items or {})
    h.default = getattr(r, "default", None)
    return h


HASH_M["[]"] = lambda ip, r, a, b: hash_get(ip, r, a[0])


@reg(HASH_M, "[]=", "store")
def _hset(ip, r, a, b):
    r[hkey(a[0])] = a[1]
    return a[1]


@reg(HASH_M, "fetch")
def _fetch(ip, r, a, b):
    key = hkey(a[0])
    if key in r:
        return r[key]
    if b is not None:
        return _call(ip, b, a[0])
    if len(a) > 1:
        return a[1]
    raise RubyError("KeyError", f"key not found: {ip.inspect(a[0])}")


@reg(HASH_M, "dig")
def _dig(ip, r, a, b):
    cur = r
    for k in a:
        if cur is None:
            return None
        cur = ip.call_method(cur, "[]", [k], None)
    return cur


@reg(HASH_M, "each", "each_pair")
def _each(ip, r, a, b):
    if b is None:
        return _pairs(r)
    for p in _pairs(r):
        _call(ip, b, p)
    return r


@reg(HASH_M, "each_with_index")
def _each_wi(ip, r, a, b):
    for i, p in enumerate(_pairs(r)):
        _call(ip, b, p, i)
    return r


@reg(HASH_M, "each_with_object")
def _each_wo(ip, r, a, b):
    for p in _pairs(r):
        _call(ip, b, p, a[0])
    return a[0]


@reg(HASH_M, "each_key")
def _each_key(ip, r, a, b):
    for k in list(r.keys()):
        _call(ip, b, unkey(k))
    return r


@reg(HASH_M, "each_value")
def _each_value(ip, r, a, b):
    for v in list(r.values()):
        _call(ip, b, v)
    return r


@reg(HASH_M, "map", "collect", "flat_map")
def _map(ip, r, a, b):
    out = [_call(ip, b, p) for p in _pairs(r)]
    if ip.cur_name == "flat_map":
        flat = []
        for x in out:
            flat.extend(x if isinstance(x, list) else [x])
        return flat
    return out


@reg(HASH_M, "select", "filter", "reject")
def _select(ip, r, a, b):
    want = ip.cur_name != "reject"
    return _new_like(r, {hkey(k): v for k, v in _pairs(r) if truthy(_call(ip, b, [k, v])) == want})


@reg(HASH_M, "select!", "keep_if", "reject!", "delete_if")
def _select_b(ip, r, a, b):
    want = ip.cur_name in ("select!", "keep_if")
    for k, v in _pairs(r):
        if truthy(_call(ip, b, [k, v])) != want:
            del r[hkey(k)]
    return r


@reg(HASH_M, "find", "detect")
def _find(ip, r, a, b):
    for p in _pairs(r):
        if truthy(_call(ip, b, p)):
            return p
    return None


@reg(HASH_M, "any?", "all?", "none?", "count")
def _preds(ip, r, a, b):
    if b is None:
        return {"any?": bool(r), "all?": True, "none?": not r, "count": len(r)}[ip.cur_name]
    res = [truthy(_call(ip, b, p)) for p in _pairs(r)]
    return {"any?": any(res), "all?": all(res), "none?": not any(res), "count": sum(res)}[ip.cur_name]


@reg(HASH_M, "transform_values", "transform_values!")
def _tv(ip, r, a, b):
    out = _new_like(r, {k: _call(ip, b, v) for k, v in r.items()})
    if ip.cur_name.endswith("!"):
        r.clear()
        r.update(out)
        return r
    return out


@reg(HASH_M, "transform_keys")
def _tk(ip, r, a, b):
    return _new_like(r, {hkey(_call(ip, b, unkey(k))): v for k, v in r.items()})


@reg(HASH_M, "merge", "update", "merge!")
def _merge(ip, r, a, b):
    target = r if ip.cur_name != "merge" else _new_like(r, r)
    for o in a:
        for k, v in o.items():
            if b is not None and k in target:
                v = _call(ip, b, unkey(k), target[k], v)
            target[k] = v
    return target


@reg(HASH_M, "delete")
def _delete(ip, r, a, b):
    return r.pop(hkey(a[0]), None)


@reg(HASH_M, "sort_by", "min_by", "max_by", "sum", "inject", "reduce", "each_slice", "group_by",
     "partition", "sort", "first", "to_a", "entries", "zip", "uniq", "filter_map", "sum", "each_cons", "take",
     "drop", "find_all", "tally", "minmax_by")
def _via_array(ip, r, a, b):
    from .builtins_coll import ARR_M
    name = {"find_all": "select"}.get(ip.cur_name, ip.cur_name)
    return ARR_M[name](ip, _pairs(r), a, b)


@reg(HASH_M, "to_h")
def _to_h(ip, r, a, b):
    if b is None:
        return r
    out = RHash()
    for p in _pairs(r):
        k, v = _call(ip, b, p)
        out[hkey(k)] = v
    return out


@reg(HASH_M, "default=")
def _set_default(ip, r, a, b):
    r.default = a[0]
    return a[0]


@reg(HASH_M, "key")
def _key(ip, r, a, b):
    for k, v in r.items():
        if ip.rb_equal(v, a[0]):
            return unkey(k)
    return None


HASH_M.update({
    "keys": lambda ip, r, a, b: [unkey(k) for k in r.keys()],
    "values": lambda ip, r, a, b: list(r.values()),
    "values_at": lambda ip, r, a, b: [hash_get(ip, r, k) for k in a],
    "fetch_values": lambda ip, r, a, b: [r[hkey(k)] for k in a],
    "key?": lambda ip, r, a, b: hkey(a[0]) in r, "has_key?": lambda ip, r, a, b: hkey(a[0]) in r,
    "include?": lambda ip, r, a, b: hkey(a[0]) in r, "member?": lambda ip, r, a, b: hkey(a[0]) in r,
    "value?": lambda ip, r, a, b: any(ip.rb_equal(v, a[0]) for v in r.values()),
    "has_value?": lambda ip, r, a, b: any(ip.rb_equal(v, a[0]) for v in r.values()),
    "length": lambda ip, r, a, b: len(r), "size": lambda ip, r, a, b: len(r),
    "empty?": lambda ip, r, a, b: not r, "clear": lambda ip, r, a, b: (r.clear(), r)[1],
    "invert": lambda ip, r, a, b: RHash({hkey(v): unkey(k) for k, v in r.items()}),
    "slice": lambda ip, r, a, b: RHash({hkey(k): r[hkey(k)] for k in a if hkey(k) in r}),
    "except": lambda ip, r, a, b: RHash({k: v for k, v in r.items() if k not in {hkey(x) for x in a}}),
    "compact": lambda ip, r, a, b: RHash({k: v for k, v in r.items() if v is not None}),
    "default": lambda ip, r, a, b: getattr(r, "default", None),
    "dup": lambda ip, r, a, b: _new_like(r, r), "clone": lambda ip, r, a, b: _new_like(r, r),
    "max_by": _via_array, "min_by": _via_array,
})


# ---------------------------------------------------------------- Range
def _range_list(r):
    return r.to_list()


@reg(RANGE_M, "each")
def _r_each(ip, r, a, b):
    if b is None:
        return _range_list(r)
    a0, b0 = r.first, r.last
    if isinstance(a0, int) and (b0 is None or isinstance(b0, (int, float))):
        i = a0
        while b0 is None or (i < b0 if r.excl else i <= b0):
            _call(ip, b, i)
            i += 1
            if b0 is None and i - a0 > 1_000_000:
                raise RubyError("RangeError", "vòng lặp vô hạn")
        return r
    for v in _range_list(r):
        _call(ip, b, v)
    return r


@reg(RANGE_M, "step", "%")
def _r_step(ip, r, a, b):
    step = a[0]
    last = r.last
    vals = float_steps(r.first, last, step)
    if r.excl and vals and vals[-1] == last:
        vals.pop()
    if b is None:
        return vals
    for v in vals:
        _call(ip, b, v)
    return r


@reg(RANGE_M, "include?", "member?", "cover?", "===")
def _r_cover(ip, r, a, b):
    v = a[0]
    if isinstance(v, RRange):
        return r.covers(v.first) and (v.last is None and r.last is None or r.covers(v.last))
    return r.covers(v)


@reg(RANGE_M, "first", "begin", "min")
def _r_first(ip, r, a, b):
    if a and ip.cur_name == "first":
        return _range_list(RRange(r.first, r.first + int(a[0]) - 1, False)) if r.last is None else _range_list(r)[:int(a[0])]
    if ip.cur_name == "min" and (b is not None or (r.last is not None and r.last < r.first)):
        from .builtins_coll import ARR_M
        return ARR_M["min"](ip, _range_list(r), a, b)
    return r.first


@reg(RANGE_M, "last", "end", "max")
def _r_last(ip, r, a, b):
    if a and ip.cur_name == "last":
        return _range_list(r)[-int(a[0]):]
    if ip.cur_name == "max":
        lst = _range_list(r) if isinstance(r.first, int) else None
        return lst[-1] if lst else (None if lst is not None else r.last)
    if ip.cur_name == "last" and r.excl and isinstance(r.last, int):
        return r.last
    return r.last


@reg(RANGE_M, "size", "count", "length")
def _r_size(ip, r, a, b):
    if b is not None or a:
        from .builtins_coll import ARR_M
        return ARR_M["count"](ip, _range_list(r), a, b)
    if r.last is None:
        return float("inf")
    return len(_range_list(r))


RANGE_M.update({
    "exclude_end?": lambda ip, r, a, b: r.excl,
    "to_a": lambda ip, r, a, b: _range_list(r), "to_ary": lambda ip, r, a, b: _range_list(r),
    "entries": lambda ip, r, a, b: _range_list(r),
    "sum": lambda ip, r, a, b: _r_sum(ip, r, a, b),
    "to_s": lambda ip, r, a, b: ip.to_s(r), "inspect": lambda ip, r, a, b: ip.to_s(r),
    "==": lambda ip, r, a, b: ip.rb_equal(r, a[0]),
    "hash": lambda ip, r, a, b: hash((r.first, r.last, r.excl)),
})


def _r_sum(ip, r, a, b):
    from .builtins_coll import ARR_M
    if b is None and not a and isinstance(r.first, int) and isinstance(r.last, int):
        hi = r.last - (1 if r.excl else 0)
        return (r.first + hi) * (hi - r.first + 1) // 2 if hi >= r.first else 0
    return ARR_M["sum"](ip, _range_list(r), a, b)


@reg(RANGE_M, "reverse_each")
def _r_rev(ip, r, a, b):
    lst = _range_list(r)[::-1]
    if b is None:
        return lst
    for v in lst:
        _call(ip, b, v)
    return r
