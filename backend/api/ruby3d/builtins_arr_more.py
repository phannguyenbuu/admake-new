# -*- coding: utf-8 -*-
"""Phương thức dựng sẵn cho Array (phần tiếp theo của builtins_coll)."""

import random

from .builtins_coll import ARR_M, _call, _flatten, arr_get, norm_index
from .builtins_core import reg
from .runtime import RubyError, is_num, truthy


@reg(ARR_M, "compact", "compact!")
def _compact(ip, r, a, b):
    out = [v for v in r if v is not None]
    if ip.cur_name == "compact!":
        r[:] = out
        return r
    return out


@reg(ARR_M, "reverse", "reverse!")
def _reverse(ip, r, a, b):
    if ip.cur_name == "reverse!":
        r.reverse()
        return r
    return r[::-1]


@reg(ARR_M, "rotate")
def _rotate(ip, r, a, b):
    if not r:
        return []
    k = int(a[0]) % len(r) if a else 1 % len(r)
    return r[k:] + r[:k]


@reg(ARR_M, "push", "append", "<<")
def _push(ip, r, a, b):
    r.extend(a)
    return r


@reg(ARR_M, "pop")
def _pop(ip, r, a, b):
    if a:
        k = int(a[0])
        out = r[-k:] if k else []
        del r[len(r) - len(out):]
        return out
    return r.pop() if r else None


@reg(ARR_M, "shift")
def _shift(ip, r, a, b):
    if a:
        k = int(a[0])
        out = r[:k]
        del r[:k]
        return out
    return r.pop(0) if r else None


@reg(ARR_M, "unshift", "prepend")
def _unshift(ip, r, a, b):
    r[0:0] = a
    return r


@reg(ARR_M, "insert")
def _insert(ip, r, a, b):
    i = int(a[0])
    i = len(r) + i + 1 if i < 0 else i
    r[i:i] = a[1:]
    return r


@reg(ARR_M, "concat")
def _concat(ip, r, a, b):
    for x in a:
        r.extend(ip.splat_list(x))
    return r


@reg(ARR_M, "delete")
def _delete(ip, r, a, b):
    found = None
    keep = []
    for v in r:
        if ip.rb_equal(v, a[0]):
            found = v
        else:
            keep.append(v)
    r[:] = keep
    return found


@reg(ARR_M, "delete_at")
def _delete_at(ip, r, a, b):
    i = norm_index(a[0], len(r))
    return r.pop(i) if 0 <= i < len(r) else None


@reg(ARR_M, "clear")
def _clear(ip, r, a, b):
    r.clear()
    return r


@reg(ARR_M, "replace")
def _replace(ip, r, a, b):
    r[:] = list(a[0])
    return r


@reg(ARR_M, "fill")
def _fill(ip, r, a, b):
    for i in range(len(r)):
        r[i] = _call(ip, b, i) if b is not None else a[0]
    return r


ARR_M.update({
    "length": lambda ip, r, a, b: len(r), "size": lambda ip, r, a, b: len(r),
    "empty?": lambda ip, r, a, b: len(r) == 0, "any": lambda ip, r, a, b: bool(r),
    "to_a": lambda ip, r, a, b: r, "entries": lambda ip, r, a, b: list(r), "to_ary": lambda ip, r, a, b: r,
    "join": lambda ip, r, a, b: (ip.to_s(a[0]) if a and a[0] is not None else "").join(
        ip.to_s(x) for x in _flatten(r, -1)),
    "take": lambda ip, r, a, b: list(r[:int(a[0])]), "drop": lambda ip, r, a, b: list(r[int(a[0]):]),
    "values_at": lambda ip, r, a, b: [arr_get(r, [i]) for i in a],
    "transpose": lambda ip, r, a, b: [list(x) for x in zip(*r)],
    "sample": lambda ip, r, a, b: (r[0] if r else None) if not a else list(r[:int(a[0])]),
    "shuffle": lambda ip, r, a, b: random.Random(42).sample(list(r), len(r)),
    "cycle": lambda ip, r, a, b: [_call(ip, b, v) for _ in range(int(a[0]) if a else 1) for v in list(r)] and None,
    "hash": lambda ip, r, a, b: hash(ip.inspect(r)),
    "eql?": lambda ip, r, a, b: ip.rb_equal(r, a[0]),
    "frozen?": lambda ip, r, a, b: False,
})


@reg(ARR_M, "take_while", "drop_while")
def _take_while(ip, r, a, b):
    i = 0
    while i < len(r) and truthy(_call(ip, b, r[i])):
        i += 1
    return list(r[:i]) if ip.cur_name == "take_while" else list(r[i:])


@reg(ARR_M, "zip")
def _zip(ip, r, a, b):
    others = [ip.splat_list(x) for x in a]
    out = [[v] + [o[i] if i < len(o) else None for o in others] for i, v in enumerate(r)]
    if b is not None:
        for row in out:
            _call(ip, b, row)
        return None
    return out


@reg(ARR_M, "product")
def _product(ip, r, a, b):
    out = [[v] for v in r]
    for o in a:
        out = [p + [x] for p in out for x in o]
    return out


@reg(ARR_M, "combination", "permutation")
def _combination(ip, r, a, b):
    import itertools
    k = int(a[0]) if a else len(r)
    fn = itertools.combinations if ip.cur_name == "combination" else itertools.permutations
    out = [list(c) for c in fn(r, k)]
    if b is not None:
        for c in out:
            _call(ip, b, c)
        return r
    return out


@reg(ARR_M, "each_slice", "each_cons")
def _each_slice(ip, r, a, b):
    k = int(a[0])
    if k <= 0:
        raise RubyError("ArgumentError", "invalid size")
    if ip.cur_name == "each_slice":
        groups = [list(r[i:i + k]) for i in range(0, len(r), k)]
    else:
        groups = [list(r[i:i + k]) for i in range(0, len(r) - k + 1)]
    if b is None:
        return groups
    for g in groups:
        _call(ip, b, g)
    return r


@reg(ARR_M, "to_h")
def _to_h(ip, r, a, b):
    from .interp_ops import RHash, hkey
    h = RHash()
    for v in r:
        pair = _call(ip, b, v) if b is not None else v
        h[hkey(pair[0])] = pair[1]
    return h


@reg(ARR_M, "pack")
def _pack(ip, r, a, b):
    return "".join(chr(int(x)) for x in r if is_num(x))


# ---------------------------------------------------------------- Array làm Point3d (SketchUp)
def _as_point(r):
    from .geom import Point3d, to_xyz
    return Point3d(*to_xyz(r))


def _as_vec(r):
    from .geom import Vector3d, to_xyz
    return Vector3d(*to_xyz(r))


def _point_m(name, vec=False):
    def fn(ip, r, a, b):
        obj = _as_vec(r) if vec else _as_point(r)
        res = obj.rb_send(ip, name, a, b)
        if hasattr(res, "t") and name.endswith("!"):
            r[:] = list(res.t())
            return r
        return list(res.t()) if hasattr(res, "t") else res
    return fn


for _n in ("offset", "offset!", "distance", "vector_to", "transform", "transform!", "distance_to_line",
           "distance_to_plane", "project_to_line", "project_to_plane", "on_line?", "on_plane?"):
    ARR_M[_n] = _point_m(_n)
for _n in ("normalize", "normalize!", "cross", "dot", "angle_between", "parallel?", "perpendicular?"):
    ARR_M[_n] = _point_m(_n, vec=True)


def _axis_get(i):
    return lambda ip, r, a, b: r[i] if len(r) > i else None


def _axis_set(i):
    def fn(ip, r, a, b):
        while len(r) <= i:
            r.append(0.0)
        r[i] = a[0]
        return a[0]
    return fn


for _i, _n in enumerate("xyz"):
    ARR_M[_n] = _axis_get(_i)
    ARR_M[_n + "="] = _axis_set(_i)


@reg(ARR_M, "pushpull")
def _arr_pushpull(ip, r, a, b):
    """Hỗ trợ LLM gọi trực tiếp .pushpull(...) trên mảng Edge (do add_circle/add_curve trả về)."""
    for item in r:
        if hasattr(item, "rb_pushpull"):
            return item.rb_pushpull(ip, a, b)
    if r and hasattr(r[0], "ents") and getattr(r[0], "ents"):
        try:
            face = r[0].ents.rb_add_face(ip, [r], None)
            if hasattr(face, "rb_pushpull"):
                return face.rb_pushpull(ip, a, b)
        except Exception:
            pass
    return None

