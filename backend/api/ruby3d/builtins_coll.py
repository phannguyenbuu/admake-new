# -*- coding: utf-8 -*-
"""Phương thức dựng sẵn cho Array (và Enumerable dùng chung cho Range/Hash)."""

import functools

from .builtins_core import reg, sym_name
from .runtime import RRange, RubyError, Symbol, truthy

ARR_M = {}


def _call(ip, b, *args):
    return ip.call_proc(b, list(args))


def _cmp_fn(ip, b=None):
    if b is None:
        return functools.cmp_to_key(lambda x, y: ip.binop("<=>", x, y) or 0)
    return functools.cmp_to_key(lambda x, y: ip.call_proc(b, [x, y]) or 0)


def _key_sort(ip, items, keyfn):
    keyed = [(keyfn(x), x) for x in items]
    keyed.sort(key=functools.cmp_to_key(lambda p, q: ip.binop("<=>", p[0], q[0]) or 0))
    return [x for _, x in keyed]


def norm_index(i, n):
    i = int(i)
    return i + n if i < 0 else i


def range_bounds(rg, n):
    lo = norm_index(rg.first or 0, n)
    if rg.last is None:
        hi = n
    else:
        hi = norm_index(rg.last, n) + (0 if rg.excl else 1)
    return lo, max(lo, hi)


def arr_get(r, a):
    n = len(r)
    k = a[0]
    if isinstance(k, RRange):
        lo, hi = range_bounds(k, n)
        return r[lo:hi] if 0 <= lo <= n else None
    i = norm_index(k, n)
    if len(a) > 1:
        return r[i:i + int(a[1])] if 0 <= i <= n else None
    return r[i] if 0 <= i < n else None


@reg(ARR_M, "[]", "slice")
def _idx(ip, r, a, b):
    return arr_get(r, a)


@reg(ARR_M, "[]=")
def _idxset(ip, r, a, b):
    n = len(r)
    v = a[-1]
    if len(a) == 3 or isinstance(a[0], RRange):
        if isinstance(a[0], RRange):
            lo, hi = range_bounds(a[0], n)
        else:
            lo = norm_index(a[0], n)
            hi = lo + int(a[1])
        while len(r) < lo:
            r.append(None)
        r[lo:hi] = v if isinstance(v, list) else [v]
        return v
    i = norm_index(a[0], n)
    if i < 0:
        raise RubyError("IndexError", f"index {a[0]} too small for array")
    if i > 100_000 + n:
        raise RubyError("IndexError", "index quá lớn")
    while len(r) <= i:
        r.append(None)
    r[i] = v
    return v


@reg(ARR_M, "at")
def _at(ip, r, a, b):
    return arr_get(r, [a[0]])


@reg(ARR_M, "dig")
def _dig(ip, r, a, b):
    cur = r
    for k in a:
        if cur is None:
            return None
        cur = ip.call_method(cur, "[]", [k], None)
    return cur


@reg(ARR_M, "fetch")
def _fetch(ip, r, a, b):
    i = norm_index(a[0], len(r))
    if 0 <= i < len(r):
        return r[i]
    if b is not None:
        return _call(ip, b, a[0])
    if len(a) > 1:
        return a[1]
    raise RubyError("IndexError", f"index {a[0]} outside of array bounds")


@reg(ARR_M, "first")
def _first(ip, r, a, b):
    return list(r[:int(a[0])]) if a else (r[0] if r else None)


@reg(ARR_M, "last")
def _last(ip, r, a, b):
    if a:
        k = int(a[0])
        return list(r[-k:]) if k else []
    return r[-1] if r else None


@reg(ARR_M, "each")
def _each(ip, r, a, b):
    if b is None:
        return list(r)
    for v in list(r):
        _call(ip, b, v)
    return r


@reg(ARR_M, "each_with_index", "each_entry_with_index")
def _each_wi(ip, r, a, b):
    if b is None:
        return [[v, i] for i, v in enumerate(r)]
    for i, v in enumerate(list(r)):
        _call(ip, b, v, i)
    return r


@reg(ARR_M, "each_index")
def _each_index(ip, r, a, b):
    for i in range(len(r)):
        _call(ip, b, i)
    return r


@reg(ARR_M, "reverse_each")
def _reverse_each(ip, r, a, b):
    if b is None:
        return list(reversed(r))
    for v in list(reversed(r)):
        _call(ip, b, v)
    return r


@reg(ARR_M, "each_with_object")
def _each_wo(ip, r, a, b):
    memo = a[0]
    for v in list(r):
        _call(ip, b, v, memo)
    return memo


@reg(ARR_M, "map", "collect", "map!", "collect!")
def _map(ip, r, a, b):
    if b is None:
        return list(r)
    out = [_call(ip, b, v) for v in list(r)]
    if ip.cur_name.endswith("!"):
        r[:] = out
        return r
    return out


@reg(ARR_M, "with_index", "each_with_index_map", "map_with_index")
def _with_index(ip, r, a, b):
    off = int(a[0]) if a else 0
    return [_call(ip, b, v, i + off) for i, v in enumerate(list(r))] if b else [[v, i + off] for i, v in enumerate(r)]


@reg(ARR_M, "flat_map", "collect_concat")
def _flat_map(ip, r, a, b):
    out = []
    for v in list(r):
        x = _call(ip, b, v)
        out.extend(x if isinstance(x, list) else [x])
    return out


@reg(ARR_M, "filter_map")
def _filter_map(ip, r, a, b):
    return [x for x in (_call(ip, b, v) for v in list(r)) if truthy(x)]


@reg(ARR_M, "select", "filter", "select!", "filter!", "keep_if")
def _select(ip, r, a, b):
    out = [v for v in list(r) if truthy(_call(ip, b, v))]
    if ip.cur_name.endswith("!") or ip.cur_name == "keep_if":
        r[:] = out
        return r
    return out


@reg(ARR_M, "reject", "reject!", "delete_if")
def _reject(ip, r, a, b):
    out = [v for v in list(r) if not truthy(_call(ip, b, v))]
    if ip.cur_name != "reject":
        r[:] = out
        return r
    return out


@reg(ARR_M, "partition")
def _partition(ip, r, a, b):
    yes, no = [], []
    for v in list(r):
        (yes if truthy(_call(ip, b, v)) else no).append(v)
    return [yes, no]


@reg(ARR_M, "group_by")
def _group_by(ip, r, a, b):
    from .interp_ops import RHash, hkey
    h = RHash()
    for v in list(r):
        h.setdefault(hkey(_call(ip, b, v)), []).append(v)
    return h


@reg(ARR_M, "chunk_while", "slice_when")
def _chunk_while(ip, r, a, b):
    out = []
    for v in r:
        if out and (truthy(_call(ip, b, out[-1][-1], v)) == (ip.cur_name == "chunk_while")):
            out[-1].append(v)
        else:
            out.append([v])
    return out


@reg(ARR_M, "tally")
def _tally(ip, r, a, b):
    from .interp_ops import RHash, hkey
    h = RHash()
    for v in r:
        h[hkey(v)] = h.get(hkey(v), 0) + 1
    return h


@reg(ARR_M, "grep")
def _grep(ip, r, a, b):
    pat = a[0] if a else None
    matched = [v for v in list(r) if pat is None or ip.case_eq(pat, v)]
    if b is not None:
        return [_call(ip, b, v) for v in matched]
    return matched


@reg(ARR_M, "find", "detect")
def _find(ip, r, a, b):
    for v in list(r):
        if truthy(_call(ip, b, v)):
            return v
    return None


@reg(ARR_M, "index", "find_index")
def _index(ip, r, a, b):
    for i, v in enumerate(r):
        if (truthy(_call(ip, b, v)) if b is not None and not a else ip.rb_equal(v, a[0])):
            return i
    return None


@reg(ARR_M, "rindex")
def _rindex(ip, r, a, b):
    for i in range(len(r) - 1, -1, -1):
        if (truthy(_call(ip, b, r[i])) if b is not None and not a else ip.rb_equal(r[i], a[0])):
            return i
    return None


@reg(ARR_M, "include?", "member?")
def _include(ip, r, a, b):
    return any(ip.rb_equal(v, a[0]) for v in r)


def _pred(ip, v, a, b):
    if a:
        return truthy(ip.case_eq(a[0], v))
    if b is not None:
        return truthy(_call(ip, b, v))
    return truthy(v)


ARR_M["any?"] = lambda ip, r, a, b: any(_pred(ip, v, a, b) for v in list(r))
ARR_M["all?"] = lambda ip, r, a, b: all(_pred(ip, v, a, b) for v in list(r))
ARR_M["none?"] = lambda ip, r, a, b: not any(_pred(ip, v, a, b) for v in list(r))
ARR_M["one?"] = lambda ip, r, a, b: sum(1 for v in list(r) if _pred(ip, v, a, b)) == 1


@reg(ARR_M, "count")
def _count(ip, r, a, b):
    if a:
        return sum(1 for v in r if ip.rb_equal(v, a[0]))
    if b is not None:
        return sum(1 for v in list(r) if truthy(_call(ip, b, v)))
    return len(r)


@reg(ARR_M, "sum")
def _sum(ip, r, a, b):
    acc = a[0] if a else 0
    for v in list(r):
        acc = ip.binop("+", acc, _call(ip, b, v) if b is not None else v)
    return acc


@reg(ARR_M, "inject", "reduce")
def _inject(ip, r, a, b):
    items = list(r)
    op = None
    if a and isinstance(a[-1], Symbol) and (b is None):
        op = a[-1].name
        a = a[:-1]
    if a:
        acc = a[0]
    elif items:
        acc = items.pop(0)
    else:
        return None
    for v in items:
        acc = ip.binop(op, acc, v) if op else _call(ip, b, acc, v)
    return acc


def _minmax(ip, r, a, b, want_max, by):
    items = list(r)
    if not items:
        return [] if a else None
    if by:
        ordered = _key_sort(ip, items, lambda x: _call(ip, b, x))
    else:
        ordered = sorted(items, key=_cmp_fn(ip, b))
    if want_max:
        ordered = ordered[::-1]
    return ordered[:int(a[0])] if a else ordered[0]


ARR_M["min"] = lambda ip, r, a, b: _minmax(ip, r, a, b, False, False)
ARR_M["max"] = lambda ip, r, a, b: _minmax(ip, r, a, b, True, False)
ARR_M["min_by"] = lambda ip, r, a, b: _minmax(ip, r, a, b, False, True)
ARR_M["max_by"] = lambda ip, r, a, b: _minmax(ip, r, a, b, True, True)
ARR_M["minmax"] = lambda ip, r, a, b: [_minmax(ip, r, [], b, False, False), _minmax(ip, r, [], b, True, False)]
ARR_M["minmax_by"] = lambda ip, r, a, b: [_minmax(ip, r, [], b, False, True), _minmax(ip, r, [], b, True, True)]


@reg(ARR_M, "sort", "sort!")
def _sort(ip, r, a, b):
    out = sorted(list(r), key=_cmp_fn(ip, b))
    if ip.cur_name == "sort!":
        r[:] = out
        return r
    return out


@reg(ARR_M, "sort_by", "sort_by!")
def _sort_by(ip, r, a, b):
    out = _key_sort(ip, list(r), lambda x: _call(ip, b, x))
    if ip.cur_name == "sort_by!":
        r[:] = out
        return r
    return out


@reg(ARR_M, "uniq", "uniq!")
def _uniq(ip, r, a, b):
    out, keys = [], []
    for v in r:
        k = _call(ip, b, v) if b is not None else v
        if not any(ip.rb_equal(k, x) for x in keys):
            keys.append(k)
            out.append(v)
    if ip.cur_name == "uniq!":
        r[:] = out
        return r
    return out


def _flatten(v, depth):
    out = []
    for x in v:
        if isinstance(x, list) and depth != 0:
            out.extend(_flatten(x, depth - 1))
        else:
            out.append(x)
    return out


@reg(ARR_M, "flatten", "flatten!")
def _flatten_m(ip, r, a, b):
    out = _flatten(r, int(a[0]) if a and a[0] is not None else -1)
    if ip.cur_name == "flatten!":
        r[:] = out
        return r
    return out


from . import builtins_arr_more  # noqa: E402,F401

from .builtins_hash import HASH_M, RANGE_M  # noqa: E402,F401

__all__ = ["ARR_M", "HASH_M", "RANGE_M", "sym_name"]
