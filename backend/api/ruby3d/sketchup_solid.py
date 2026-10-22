# -*- coding: utf-8 -*-
"""Khối hình học sinh ra từ pushpull (Solid), text 3D (TextBlock) và phần tử không hình học (Inert)."""

from .geom import Vector3d, vnorm
from .sketchup import FACE_ANC, Entity, resolve_material


class Solid(Entity):
    """Khối lăng trụ sinh ra từ pushpull (đối với Ruby nó cư xử như các Face bên hông)."""

    rb_class_name = "Sketchup::Face"
    ancestors = FACE_ANC

    def __init__(self, ents, base, vec, face):
        super().__init__(ents)
        self.base = base
        self.vec = vec
        self.face = face
        self.material = None

    def rb_material_set(self, ip, a, b):
        self.material = resolve_material(a[0], self.ents.model)
        return a[0]

    rb_back_material_set = lambda self, ip, a, b: a[0]  # noqa: E731

    def rb_material(self, ip, a, b):
        return self.get_material()

    def get_material(self):
        if self.material is not None:
            return self.material
        if self.face is not None:
            return self.face.material or self.face.back_material
        return None

    def rb_normal(self, ip, a, b):
        return Vector3d(*vnorm(self.vec))

    def rb_pushpull(self, ip, a, b):
        return None

    def rb_reverse_b(self, ip, a, b):
        return self

    def rb_outer_loop(self, ip, a, b):
        return self

    def rb_vertices(self, ip, a, b):
        from .sketchup import Vertex
        return [Vertex(p) for p in self.base]

    def rb_edges(self, ip, a, b):
        from .sketchup import Edge
        n = len(self.base)
        return [Edge(self.ents, self.base[i], self.base[(i + 1) % n]) for i in range(n)]

    def rb_transform_b(self, ip, a, b):
        from .geom import as_transform, Transformation
        tr = as_transform(a[0]) if a else Transformation()
        self.base = [tr.apply_point(p) for p in self.base]
        self.vec = tr.apply_vec(self.vec)
        return self

    def rb_offset(self, ip, a, b):
        return self

    def bounds_into(self, bb, tr):
        for p in self.base:
            bb.add_xyz(tr.apply_point(p))
            bb.add_xyz(tr.apply_point(tuple(p[i] + self.vec[i] for i in range(3))))


def text_width(text, height, bold):
    w = 0.0
    for ch in text:
        if ch == " ":
            w += 0.28
        elif ch in "il.,:;'!|j1I":
            w += 0.28
        elif ch in "mwMW@":
            w += 0.88
        elif ch.isupper():
            w += 0.68
        elif ch.isdigit():
            w += 0.56
        else:
            w += 0.55
    return w * height * (1.08 if bold else 1.0)


class TextBlock(Entity):
    """add_3d_text: xấp xỉ bằng khối chữ nhật, giữ nội dung chữ để frontend vẽ."""

    rb_class_name = "Sketchup::Face"
    ancestors = FACE_ANC

    def __init__(self, ents, text, align, height, z, extrusion, bold):
        super().__init__(ents)
        self.text = text
        self.height = height
        self.width = max(text_width(text, height, bold), height * 0.3)
        x0 = 0.0 if align == 0 else (-self.width / 2 if align == 1 else -self.width)
        self.base = [(x0, 0.0, z), (x0 + self.width, 0.0, z), (x0 + self.width, height, z), (x0, height, z)]
        self.vec = (0.0, 0.0, extrusion)
        self.material = None
        self.bold = bold

    def rb_material_set(self, ip, a, b):
        self.material = resolve_material(a[0], self.ents.model)
        return a[0]

    rb_back_material_set = lambda self, ip, a, b: a[0]  # noqa: E731

    def rb_material(self, ip, a, b):
        return self.material

    def rb_pushpull(self, ip, a, b):
        self.vec = (0.0, 0.0, float(a[0]))
        return None

    def rb_reverse_b(self, ip, a, b):
        return self

    def rb_outer_loop(self, ip, a, b):
        return self

    def rb_vertices(self, ip, a, b):
        from .sketchup import Vertex
        return [Vertex(p) for p in self.base]

    def rb_edges(self, ip, a, b):
        from .sketchup import Edge
        n = len(self.base)
        return [Edge(self.ents, self.base[i], self.base[(i + 1) % n]) for i in range(n)]

    def rb_transform_b(self, ip, a, b):
        from .geom import as_transform, Transformation
        tr = as_transform(a[0]) if a else Transformation()
        self.base = [tr.apply_point(p) for p in self.base]
        self.vec = tr.apply_vec(self.vec)
        return self

    def rb_offset(self, ip, a, b):
        return self

    def bounds_into(self, bb, tr):
        for p in self.base:
            bb.add_xyz(tr.apply_point(p))
            bb.add_xyz(tr.apply_point(tuple(p[i] + self.vec[i] for i in range(3))))


class Inert(Entity):
    """Text 2D, construction point, dimension… không có hình học xuất ra."""

    rb_class_name = "Sketchup::Drawingelement"
    ancestors = FACE_ANC

    def rb_send(self, ip, name, args, blk):
        r = super().rb_send(ip, name, args, blk)
        return None if r is NotImplemented else r
