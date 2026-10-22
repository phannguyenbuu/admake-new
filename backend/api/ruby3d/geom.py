# -*- coding: utf-8 -*-
"""Geom::Point3d / Vector3d / Transformation / BoundingBox (đơn vị inch như SketchUp)."""

import math

from .runtime import RObj, RubyError, is_num

EPS = 1e-9


# ---------------------------------------------------------------- helpers
def to_xyz(v):
    if isinstance(v, (Point3d, Vector3d)):
        return (v.x, v.y, v.z)
    if isinstance(v, (list, tuple)) and len(v) in (2, 3) and all(is_num(c) for c in v):
        return (float(v[0]), float(v[1]), float(v[2]) if len(v) == 3 else 0.0)
    pos = getattr(v, "position", None)
    if isinstance(pos, Point3d):
        return (pos.x, pos.y, pos.z)
    raise RubyError("TypeError", f"không chuyển được sang Point3d: {type(v).__name__}")


def is_xyz(v) -> bool:
    try:
        to_xyz(v)
        return True
    except RubyError:
        return False


def vlen(a):
    return math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])


def vnorm(a):
    n = vlen(a)
    if n < EPS:
        return (0.0, 0.0, 0.0)
    return (a[0] / n, a[1] / n, a[2] / n)


def vcross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def vdot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def arbitrary_perp(z):
    z = vnorm(z)
    ref = (0.0, 0.0, 1.0) if abs(z[2]) < 0.9 else (1.0, 0.0, 0.0)
    x = vnorm(vcross(ref, z))
    y = vcross(z, x)
    return x, y


# ---------------------------------------------------------------- Point / Vector
class _XYZ(RObj):
    __slots__ = ("x", "y", "z")

    def __init__(self, x=0.0, y=0.0, z=0.0):
        self.x = float(x)
        self.y = float(y)
        self.z = float(z)

    def t(self):
        return (self.x, self.y, self.z)

    def rb_x(self, ip, a, b):
        return self.x

    def rb_y(self, ip, a, b):
        return self.y

    def rb_z(self, ip, a, b):
        return self.z

    def rb_x_set(self, ip, a, b):
        self.x = float(a[0])
        return a[0]

    def rb_y_set(self, ip, a, b):
        self.y = float(a[0])
        return a[0]

    def rb_z_set(self, ip, a, b):
        self.z = float(a[0])
        return a[0]

    def rb_to_a(self, ip, a, b):
        return [self.x, self.y, self.z]

    def rb_op_idx(self, ip, a, b):
        return self.t()[int(a[0])]

    def rb_op_idxset(self, ip, a, b):
        setattr(self, "xyz"[int(a[0])], float(a[1]))
        return a[1]

    def rb_op_eq(self, ip, a, b):
        try:
            o = to_xyz(a[0])
        except RubyError:
            return False
        return all(abs(p - q) < 1e-6 for p, q in zip(self.t(), o))

    def rb_clone(self, ip, a, b):
        return type(self)(*self.t())

    rb_dup = rb_clone

    def rb_set_b(self, ip, a, b):
        x, y, z = to_xyz(a if len(a) == 3 else a[0])
        self.x, self.y, self.z = x, y, z
        return self

    def rb_to_s(self, ip, a, b):
        return f"({self.x}, {self.y}, {self.z})"

    rb_inspect = rb_to_s

    def rb_transform(self, ip, a, b):
        tr = as_transform(a[0])
        return type(self)(*(tr.apply_point(self.t()) if isinstance(self, Point3d) else tr.apply_vec(self.t())))

    def rb_transform_b(self, ip, a, b):
        r = self.rb_transform(ip, a, b)
        self.x, self.y, self.z = r.x, r.y, r.z
        return self


class Point3d(_XYZ):
    rb_class_name = "Geom::Point3d"

    def rb_op_add(self, ip, a, b):
        o = to_xyz(a[0])
        return Point3d(self.x + o[0], self.y + o[1], self.z + o[2])

    def rb_op_sub(self, ip, a, b):
        o = to_xyz(a[0])
        if isinstance(a[0], Vector3d):
            return Point3d(self.x - o[0], self.y - o[1], self.z - o[2])
        return Vector3d(self.x - o[0], self.y - o[1], self.z - o[2])

    def rb_offset(self, ip, a, b):
        v = to_xyz(a[0])
        if len(a) > 1 and a[1] is not None:
            v = vnorm(v)
            d = float(a[1])
            v = (v[0] * d, v[1] * d, v[2] * d)
        return Point3d(self.x + v[0], self.y + v[1], self.z + v[2])

    def rb_offset_b(self, ip, a, b):
        p = self.rb_offset(ip, a, b)
        self.x, self.y, self.z = p.x, p.y, p.z
        return self

    def rb_distance(self, ip, a, b):
        o = to_xyz(a[0])
        return vlen((self.x - o[0], self.y - o[1], self.z - o[2]))

    def rb_vector_to(self, ip, a, b):
        o = to_xyz(a[0])
        return Vector3d(o[0] - self.x, o[1] - self.y, o[2] - self.z)

    def rb_valid_q(self, ip, a, b):
        return True

    def rb_to_point(self, ip, a, b):
        return self

    def rb_op_mul(self, ip, a, b):
        if is_num(a[0]):
            return Point3d(self.x * a[0], self.y * a[0], self.z * a[0])
        raise RubyError("TypeError", "Point3d * không hợp lệ")


class Vector3d(_XYZ):
    rb_class_name = "Geom::Vector3d"

    def rb_length(self, ip, a, b):
        return vlen(self.t())

    def rb_length_set(self, ip, a, b):
        n = vnorm(self.t())
        d = float(a[0])
        self.x, self.y, self.z = n[0] * d, n[1] * d, n[2] * d
        return a[0]

    def rb_normalize(self, ip, a, b):
        return Vector3d(*vnorm(self.t()))

    def rb_normalize_b(self, ip, a, b):
        self.x, self.y, self.z = vnorm(self.t())
        return self

    def rb_cross(self, ip, a, b):
        return Vector3d(*vcross(self.t(), to_xyz(a[0])))

    def rb_op_mul(self, ip, a, b):
        if is_num(a[0]):
            return Vector3d(self.x * a[0], self.y * a[0], self.z * a[0])
        return self.rb_cross(ip, a, b)

    def rb_op_div(self, ip, a, b):
        return Vector3d(self.x / a[0], self.y / a[0], self.z / a[0])

    def rb_dot(self, ip, a, b):
        return vdot(self.t(), to_xyz(a[0]))

    rb_op_mod = rb_dot

    def rb_op_add(self, ip, a, b):
        o = to_xyz(a[0])
        if isinstance(a[0], Point3d):
            return Point3d(self.x + o[0], self.y + o[1], self.z + o[2])
        return Vector3d(self.x + o[0], self.y + o[1], self.z + o[2])

    def rb_op_sub(self, ip, a, b):
        o = to_xyz(a[0])
        return Vector3d(self.x - o[0], self.y - o[1], self.z - o[2])

    def rb_op_neg(self, ip, a, b):
        return Vector3d(-self.x, -self.y, -self.z)

    def rb_reverse(self, ip, a, b):
        return Vector3d(-self.x, -self.y, -self.z)

    def rb_reverse_b(self, ip, a, b):
        self.x, self.y, self.z = -self.x, -self.y, -self.z
        return self

    def rb_parallel_q(self, ip, a, b):
        c = vcross(vnorm(self.t()), vnorm(to_xyz(a[0])))
        return vlen(c) < 1e-6

    def rb_samedirection_q(self, ip, a, b):
        return self.rb_parallel_q(ip, a, b) and vdot(self.t(), to_xyz(a[0])) > 0

    def rb_perpendicular_q(self, ip, a, b):
        return abs(vdot(vnorm(self.t()), vnorm(to_xyz(a[0])))) < 1e-6

    def rb_angle_between(self, ip, a, b):
        u, v = vnorm(self.t()), vnorm(to_xyz(a[0]))
        return math.acos(max(-1.0, min(1.0, vdot(u, v))))

    def rb_valid_q(self, ip, a, b):
        return vlen(self.t()) > EPS

    def rb_unitvector_q(self, ip, a, b):
        return abs(vlen(self.t()) - 1.0) < 1e-6

    def rb_axes(self, ip, a, b):
        x, y = arbitrary_perp(self.t())
        return [Vector3d(*x), Vector3d(*y), Vector3d(*vnorm(self.t()))]

    def rb_to_vector(self, ip, a, b):
        return self


# ---------------------------------------------------------------- Transformation
def mat_mul(a, b):
    r = [0.0] * 16
    for i in range(4):
        for j in range(4):
            r[i * 4 + j] = sum(a[i * 4 + k] * b[k * 4 + j] for k in range(4))
    return r


IDENT = [1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0]


def translation_m(v):
    return [1.0, 0, 0, v[0], 0, 1.0, 0, v[1], 0, 0, 1.0, v[2], 0, 0, 0, 1.0]


def rotation_m(p, axis, angle):
    x, y, z = vnorm(axis)
    c, s = math.cos(angle), math.sin(angle)
    t = 1 - c
    r = [
        t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0,
        t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0,
        t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0,
        0, 0, 0, 1.0,
    ]
    return mat_mul(translation_m(p), mat_mul(r, translation_m((-p[0], -p[1], -p[2]))))


def scaling_m(p, sx, sy, sz):
    s = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1.0]
    return mat_mul(translation_m(p), mat_mul(s, translation_m((-p[0], -p[1], -p[2]))))


def axes_m(o, x, y, z):
    return [x[0], y[0], z[0], o[0], x[1], y[1], z[1], o[1], x[2], y[2], z[2], o[2], 0, 0, 0, 1.0]


def mat_inverse(m):
    a = [[m[0], m[1], m[2]], [m[4], m[5], m[6]], [m[8], m[9], m[10]]]
    det = (a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
           - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
           + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]))
    if abs(det) < 1e-12:
        raise RubyError("ArgumentError", "Transformation không khả nghịch")
    inv = [[0.0] * 3 for _ in range(3)]
    for i in range(3):
        for j in range(3):
            r = [k for k in range(3) if k != j]
            c = [k for k in range(3) if k != i]
            minor = a[r[0]][c[0]] * a[r[1]][c[1]] - a[r[0]][c[1]] * a[r[1]][c[0]]
            inv[i][j] = ((-1) ** (i + j)) * minor / det
    t = (m[3], m[7], m[11])
    ti = [-(inv[i][0] * t[0] + inv[i][1] * t[1] + inv[i][2] * t[2]) for i in range(3)]
    return [inv[0][0], inv[0][1], inv[0][2], ti[0], inv[1][0], inv[1][1], inv[1][2], ti[1],
            inv[2][0], inv[2][1], inv[2][2], ti[2], 0, 0, 0, 1.0]


class Transformation(RObj):
    rb_class_name = "Geom::Transformation"
    __slots__ = ("m",)

    def __init__(self, m=None):
        self.m = list(m) if m is not None else list(IDENT)

    def apply_point(self, p):
        m = self.m
        return (m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
                m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
                m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11])

    def apply_vec(self, p):
        m = self.m
        return (m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
                m[4] * p[0] + m[5] * p[1] + m[6] * p[2],
                m[8] * p[0] + m[9] * p[1] + m[10] * p[2])

    def compose(self, other):
        return Transformation(mat_mul(self.m, other.m))

    def rb_op_mul(self, ip, a, b):
        o = a[0]
        if isinstance(o, Transformation):
            return self.compose(o)
        if isinstance(o, Vector3d):
            return Vector3d(*self.apply_vec(o.t()))
        if isinstance(o, (Point3d, list, tuple)) and is_xyz(o):
            return Point3d(*self.apply_point(to_xyz(o)))
        if isinstance(o, list):
            return [self.rb_op_mul(ip, [x], b) for x in o]
        raise RubyError("TypeError", "Transformation * không hợp lệ")

    def rb_inverse(self, ip, a, b):
        return Transformation(mat_inverse(self.m))

    def rb_invert_b(self, ip, a, b):
        self.m = mat_inverse(self.m)
        return self

    def rb_origin(self, ip, a, b):
        return Point3d(self.m[3], self.m[7], self.m[11])

    def rb_xaxis(self, ip, a, b):
        return Vector3d(self.m[0], self.m[4], self.m[8])

    def rb_yaxis(self, ip, a, b):
        return Vector3d(self.m[1], self.m[5], self.m[9])

    def rb_zaxis(self, ip, a, b):
        return Vector3d(self.m[2], self.m[6], self.m[10])

    def rb_to_a(self, ip, a, b):
        m = self.m
        return [m[r * 4 + c] for c in range(4) for r in range(4)]

    def rb_identity_q(self, ip, a, b):
        return all(abs(p - q) < 1e-9 for p, q in zip(self.m, IDENT))

    def rb_clone(self, ip, a, b):
        return Transformation(self.m)

    def rb_set_b(self, ip, a, b):
        self.m = list(make_transformation(a).m)
        return self


def as_transform(v):
    if isinstance(v, Transformation):
        return v
    if is_xyz(v):
        return Transformation(translation_m(to_xyz(v)))
    raise RubyError("TypeError", "cần Geom::Transformation")


def make_transformation(args):
    """Geom::Transformation.new(...) với các biến thể phổ biến."""
    if not args:
        return Transformation()
    if len(args) == 1:
        a = args[0]
        if isinstance(a, Transformation):
            return Transformation(a.m)
        if is_num(a):
            return Transformation(scaling_m((0, 0, 0), a, a, a))
        if isinstance(a, list) and len(a) == 16:
            return Transformation([float(a[c * 4 + r]) for r in range(4) for c in range(4)])
        return Transformation(translation_m(to_xyz(a)))
    if len(args) == 2:
        o, z = to_xyz(args[0]), to_xyz(args[1])
        x, y = arbitrary_perp(z)
        return Transformation(axes_m(o, x, y, vnorm(z)))
    if len(args) == 3 and is_xyz(args[0]) and is_num(args[2]) and not is_num(args[1]):
        return Transformation(rotation_m(to_xyz(args[0]), to_xyz(args[1]), float(args[2])))
    if len(args) == 4:
        x, y, z, o = (to_xyz(v) for v in args)
        return Transformation(axes_m(o, x, y, z))
    raise RubyError("ArgumentError", "Transformation.new: tham số không hỗ trợ")


def transformation_class_method(name, args):
    if name == "new":
        return make_transformation(args)
    if name == "translation":
        return Transformation(translation_m(to_xyz(args[0])))
    if name == "rotation":
        return Transformation(rotation_m(to_xyz(args[0]), to_xyz(args[1]), float(args[2])))
    if name == "scaling":
        if len(args) == 1:
            s = float(args[0])
            return Transformation(scaling_m((0, 0, 0), s, s, s))
        if len(args) == 3 and all(is_num(v) for v in args):
            return Transformation(scaling_m((0, 0, 0), *map(float, args)))
        if len(args) == 2:
            s = float(args[1])
            return Transformation(scaling_m(to_xyz(args[0]), s, s, s))
        if len(args) == 4:
            return Transformation(scaling_m(to_xyz(args[0]), *map(float, args[1:])))
    if name == "axes":
        o = to_xyz(args[0])
        if len(args) >= 4:
            return Transformation(axes_m(o, to_xyz(args[1]), to_xyz(args[2]), to_xyz(args[3])))
        x, y = to_xyz(args[1]), to_xyz(args[2])
        return Transformation(axes_m(o, x, y, vcross(x, y)))
    if name == "interpolate":
        return Transformation(args[0].m)
    return NotImplemented


from .geom_bbox import BoundingBox  # noqa: E402,F401
