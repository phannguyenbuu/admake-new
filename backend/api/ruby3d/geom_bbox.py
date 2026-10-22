# -*- coding: utf-8 -*-
"""Geom::BoundingBox (tách từ geom.py)."""

from .geom import Point3d, to_xyz, vlen
from .runtime import RObj, is_num


# ---------------------------------------------------------------- BoundingBox
class BoundingBox(RObj):
    rb_class_name = "Geom::BoundingBox"

    def __init__(self):
        self.lo = None
        self.hi = None

    def add_xyz(self, p):
        if self.lo is None:
            self.lo = list(p)
            self.hi = list(p)
            return
        for i in range(3):
            if p[i] < self.lo[i]:
                self.lo[i] = p[i]
            if p[i] > self.hi[i]:
                self.hi[i] = p[i]

    def add_box(self, other):
        if other.lo is not None:
            self.add_xyz(other.lo)
            self.add_xyz(other.hi)

    def rb_add(self, ip, a, b):
        for v in a:
            if isinstance(v, BoundingBox):
                self.add_box(v)
            elif isinstance(v, list) and v and not is_num(v[0]):
                for p in v:
                    self.add_xyz(to_xyz(p))
            else:
                self.add_xyz(to_xyz(v))
        return self

    def _lo(self):
        return self.lo or [0.0, 0.0, 0.0]

    def _hi(self):
        return self.hi or [0.0, 0.0, 0.0]

    def rb_min(self, ip, a, b):
        return Point3d(*self._lo())

    def rb_max(self, ip, a, b):
        return Point3d(*self._hi())

    def rb_center(self, ip, a, b):
        lo, hi = self._lo(), self._hi()
        return Point3d(*((lo[i] + hi[i]) / 2 for i in range(3)))

    def rb_width(self, ip, a, b):
        return self._hi()[0] - self._lo()[0]

    def rb_height(self, ip, a, b):
        return self._hi()[1] - self._lo()[1]

    def rb_depth(self, ip, a, b):
        return self._hi()[2] - self._lo()[2]

    def rb_diagonal(self, ip, a, b):
        lo, hi = self._lo(), self._hi()
        return vlen((hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]))

    def rb_valid_q(self, ip, a, b):
        return self.lo is not None

    def rb_empty_q(self, ip, a, b):
        return self.lo is None

    def rb_clear(self, ip, a, b):
        self.lo = self.hi = None
        return self

    def rb_corner(self, ip, a, b):
        i = int(a[0])
        lo, hi = self._lo(), self._hi()
        return Point3d(hi[0] if i & 1 else lo[0], hi[1] if i & 2 else lo[1], hi[2] if i & 4 else lo[2])

    def rb_contains_q(self, ip, a, b):
        if self.lo is None:
            return False
        p = to_xyz(a[0])
        return all(self.lo[i] - 1e-9 <= p[i] <= self.hi[i] + 1e-9 for i in range(3))
