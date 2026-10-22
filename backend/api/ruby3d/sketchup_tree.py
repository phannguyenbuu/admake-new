# -*- coding: utf-8 -*-
"""Entities / Group / Component / Model của SketchUp giả lập."""

from .geom import BoundingBox, Point3d, Transformation, as_transform, to_xyz, vcross, vlen, vnorm
from .runtime import RObj, RubyError, is_num, truthy
from . import sketchup as su


def _flatten(args):
    out = []
    for a in args:
        if isinstance(a, list) and not (len(a) in (2, 3) and all(is_num(c) for c in a)):
            out.extend(_flatten(a))
        else:
            out.append(a)
    return out


class Entities(RObj):
    rb_class_name = "Sketchup::Entities"

    def __init__(self, owner, model):
        self.owner = owner
        self.model = model
        self.items = []

    def live(self):
        return [e for e in self.items if not getattr(e, "erased", False)]

    # ---- tạo hình học
    def make_face(self, pts):
        clean = []
        for p in pts:
            if not clean or vlen(tuple(p[i] - clean[-1][i] for i in range(3))) > 1e-6:
                clean.append(p)
        if len(clean) > 2 and vlen(tuple(clean[0][i] - clean[-1][i] for i in range(3))) < 1e-6:
            clean.pop()
        if len(clean) < 3:
            return su.Inert(self)
        face = su.Face(self, clean)
        if vlen(face.normal) < 1e-9:
            return su.Inert(self)
        # Không mô phỏng quirk "mặt ở z=0 luôn hướng xuống" của SketchUp: script AI hầu như
        # không bù trừ nó, nên đi theo chiều vòng điểm mới đúng ý đồ người viết.
        self.model.stats["faces"] += 1
        self.items.append(face)
        return face

    def rb_add_face(self, ip, a, b):
        args = _flatten(a)
        if args and all(isinstance(e, su.Edge) for e in args):
            curve = args[0].curve
            if curve is not None and all(e.curve is curve for e in args):
                pts = list(curve.pts)
                curve.face_made = True
            else:
                pts = [e.p1 for e in args]
        else:
            try:
                pts = [to_xyz(p) for p in args]
            except Exception:
                return su.Inert(self)
        return self.make_face(pts)

    def _curve(self, pts, closed, center=None, radius=0.0):
        curve = su.Curve(pts, closed, center, radius)
        n = len(pts)
        rng = range(n) if closed else range(n - 1)
        edges = [su.Edge(self, pts[i], pts[(i + 1) % n], curve) for i in rng]
        curve.edges = edges
        self.items.extend(edges)
        return edges

    def rb_add_circle(self, ip, a, b):
        c = to_xyz(a[0])
        # Hỗ trợ cả 2 dạng: ents.add_circle(center, radius) và ents.add_circle(center, normal, radius, segs)
        if len(a) >= 2 and is_num(a[1]):
            nrm = (0.0, 0.0, 1.0)
            r = max(1e-4, float(a[1]))
            segs = max(3, int(a[2])) if len(a) > 2 and is_num(a[2]) else 24
        else:
            nrm = vnorm(to_xyz(a[1])) if len(a) > 1 else (0.0, 0.0, 1.0)
            r = max(1e-4, float(a[2])) if len(a) > 2 else 1.0
            segs = max(3, int(a[3])) if len(a) > 3 else 24
        return self._curve(self._ring(c, nrm, r, segs, 0.0, 2 * 3.141592653589793, True), True, c, r)

    def rb_add_ngon(self, ip, a, b):
        return self.rb_add_circle(ip, a, b)

    def _ring(self, c, nrm, r, segs, start, end, closed, xaxis=None):
        import math
        if xaxis is None:
            ref = (0.0, 0.0, 1.0) if abs(nrm[2]) < 0.9 else (1.0, 0.0, 0.0)
            xaxis = vnorm(vcross(nrm, ref))
        yaxis = vcross(nrm, xaxis)
        count = segs if closed else segs + 1
        pts = []
        for i in range(count):
            t = start + (end - start) * i / segs
            ct, st = math.cos(t) * r, math.sin(t) * r
            pts.append(tuple(c[k] + xaxis[k] * ct + yaxis[k] * st for k in range(3)))
        return pts

    def rb_add_arc(self, ip, a, b):
        c = to_xyz(a[0])
        if len(a) >= 4 and is_num(a[1]):
            xaxis = (1.0, 0.0, 0.0)
            nrm = (0.0, 0.0, 1.0)
            r = max(1e-4, float(a[1]))
            start, end = float(a[2]), float(a[3])
            segs = max(1, int(a[4])) if len(a) > 4 and is_num(a[4]) else 12
        else:
            xaxis = vnorm(to_xyz(a[1])) if len(a) > 1 else (1.0, 0.0, 0.0)
            nrm = vnorm(to_xyz(a[2])) if len(a) > 2 else (0.0, 0.0, 1.0)
            r = max(1e-4, float(a[3])) if len(a) > 3 else 1.0
            start, end = (float(a[4]) if len(a) > 4 else 0.0), (float(a[5]) if len(a) > 5 else 3.141592653589793)
            segs = max(1, int(a[6])) if len(a) > 6 else 12
        pts = self._ring(c, nrm, r, segs, start, end, False, xaxis)
        return self._curve(pts, False, c, r)

    def rb_add_line(self, ip, a, b):
        args = _flatten(a)
        e = su.Edge(self, to_xyz(args[0]), to_xyz(args[1]))
        self.items.append(e)
        return e

    def rb_add_edges(self, ip, a, b):
        pts = [to_xyz(p) for p in _flatten(a)]
        edges = [su.Edge(self, pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
        self.items.extend(edges)
        return edges

    def rb_add_curve(self, ip, a, b):
        pts = [to_xyz(p) for p in _flatten(a)]
        return self._curve(pts, False)

    def rb_add_polygon(self, ip, a, b):
        return self.rb_add_face(ip, a, b)

    def rb_add_group(self, ip, a, b):
        g = Group(self)
        for e in _flatten(a):
            if e in self.items:
                self.items.remove(e)
            if hasattr(e, "ents"):
                e.ents = g.entities
            g.entities.items.append(e)
        self.items.append(g)
        self.model.stats["groups"] += 1
        return g

    def rb_add_instance(self, ip, a, b):
        defn = a[0]
        if isinstance(defn, Group):
            defn = defn.definition()
        inst = ComponentInstance(self, defn, as_transform(a[1]) if len(a) > 1 else Transformation())
        self.items.append(inst)
        return inst

    def rb_add_3d_text(self, ip, a, b):
        def _to_f(v, default=0.0):
            try:
                return float(v)
            except Exception:
                return default

        text = str(a[0]) if a else ""
        align = int(a[1]) if len(a) > 1 and is_num(a[1]) else 0
        bold = bool(a[3]) if len(a) > 3 else False
        height = _to_f(a[5], 12.0) if len(a) > 5 else 12.0
        z = _to_f(a[7], 0.0) if len(a) > 7 else 0.0

        # Hỗ trợ độ dày chữ (extrusion) từ a[9] hoặc a[6]
        extrusion = 0.0
        if len(a) > 9 and is_num(a[9]):
            extrusion = _to_f(a[9], 0.0)
        elif len(a) > 6 and is_num(a[6]) and float(a[6]) > 0:
            extrusion = _to_f(a[6], 0.0)
        if extrusion <= 0.0:
            extrusion = max(10.0, height * 0.1)

        # Hỗ trợ vị trí tọa độ đặt chữ nếu truyền ở tham số cuối
        pos_offset = (0.0, 0.0, 0.0)
        for arg in reversed(a[6:]):
            if isinstance(arg, (list, tuple)) and len(arg) == 3 and all(is_num(x) for x in arg):
                pos_offset = (float(arg[0]), float(arg[1]), float(arg[2]))
                break
            elif hasattr(arg, 'x') and hasattr(arg, 'y') and hasattr(arg, 'z'):
                pos_offset = (float(arg.x), float(arg.y), float(arg.z))
                break

        if text.strip():
            for i, line in enumerate(text.split("\n")):
                total_w = max(su.text_width(line, height, bold), height * 0.3)
                x0 = 0.0 if align == 0 else (-total_w / 2 if align == 1 else -total_w)
                cur_x = x0
                has_char_blocks = False
                for ch in line:
                    cw = su.text_width(ch, height, bold)
                    if ch == " ":
                        cur_x += cw
                        continue
                    ch_w = max(cw * 0.85, height * 0.15)
                    ch_base = [
                        (cur_x + pos_offset[0], pos_offset[1] - i * height * 1.25, z + pos_offset[2]),
                        (cur_x + ch_w + pos_offset[0], pos_offset[1] - i * height * 1.25, z + pos_offset[2]),
                        (cur_x + ch_w + pos_offset[0], height + pos_offset[1] - i * height * 1.25, z + pos_offset[2]),
                        (cur_x + pos_offset[0], height + pos_offset[1] - i * height * 1.25, z + pos_offset[2]),
                    ]
                    ch_blk = su.Solid(self, ch_base, (0.0, 0.0, extrusion), None)
                    ch_blk.name = f"Letter_{ch}"
                    self.items.append(ch_blk)
                    cur_x += cw
                    has_char_blocks = True

                if not has_char_blocks:
                    blk = su.TextBlock(self, line, align, height, z + pos_offset[2], extrusion, bold)
                    blk.base = [(p[0] + pos_offset[0], p[1] + pos_offset[1] - i * height * 1.25, p[2]) for p in blk.base]
                    self.items.append(blk)
        return self.items[-1] if self.items else su.Inert(self)

    def _inert(self, ip, a, b):
        e = su.Inert(self)
        return e

    rb_add_text = rb_add_cpoint = rb_add_cline = rb_add_dimension_linear = _inert
    rb_add_dimension_radial = rb_add_section_plane = rb_add_image = _inert

    def rb_fill_from_mesh(self, ip, a, b):
        return True

    rb_add_faces_from_mesh = rb_fill_from_mesh

    def rb_build(self, ip, a, b):
        if b is not None:
            ip.call_proc(b, [self])
        return self

    def rb_to_a(self, ip, a, b):
        return self.live()

    def rb_each(self, ip, a, b):
        if b is not None:
            for e in list(self.live()):
                ip.call_proc(b, [e])
        return self

    def rb_grep(self, ip, a, b):
        pat = a[0] if a else None
        matched = [e for e in list(self.live()) if pat is None or ip.case_eq(pat, e)]
        if b is not None:
            return [ip.call_proc(b, [e]) for e in matched]
        return matched

    def rb_select(self, ip, a, b):
        if b is None:
            return self.live()
        return [e for e in list(self.live()) if truthy(ip.call_proc(b, [e]))]

    rb_filter = rb_find_all = rb_select

    def rb_reject(self, ip, a, b):
        if b is None:
            return self.live()
        return [e for e in list(self.live()) if not truthy(ip.call_proc(b, [e]))]

    def rb_map(self, ip, a, b):
        if b is None:
            return self.live()
        return [ip.call_proc(b, [e]) for e in list(self.live())]

    rb_collect = rb_map

    def rb_length(self, ip, a, b):
        return len(self.live())

    rb_size = rb_count = rb_length

    def rb_op_idx(self, ip, a, b):
        items = self.live()
        i = int(a[0])
        return items[i] if -len(items) <= i < len(items) else None

    def rb_clear_b(self, ip, a, b):
        for e in self.items:
            e.erased = True
        self.items = []
        return self

    def rb_erase_entities(self, ip, a, b):
        for e in _flatten(a):
            if hasattr(e, "erased"):
                e.erased = True
            if e in self.items:
                self.items.remove(e)
        return None

    def rb_transform_entities(self, ip, a, b):
        tr = as_transform(a[0])
        for e in _flatten(a[1:]):
            apply_transform_to_entity(e, tr)
        return True

    def rb_parent(self, ip, a, b):
        return self.owner

    def rb_model(self, ip, a, b):
        return self.model

    def rb_active_section_plane(self, ip, a, b):
        return None

    def bounds_into(self, bb, tr):
        for e in self.live():
            if not getattr(e, "hidden", False):
                e.bounds_into(bb, tr)


def apply_transform_to_entity(e, tr):
    if isinstance(e, (Group, ComponentInstance)):
        e.tr = tr.compose(e.tr)
    elif isinstance(e, su.Face):
        e.pts = [tr.apply_point(p) for p in e.pts]
        e.normal = vnorm(tr.apply_vec(e.normal))
    elif isinstance(e, (su.Solid, su.TextBlock)):
        e.base = [tr.apply_point(p) for p in e.base]
        e.vec = tr.apply_vec(e.vec)
    elif isinstance(e, su.Edge):
        e.p1, e.p2 = tr.apply_point(e.p1), tr.apply_point(e.p2)


class _Placed(su.Entity):
    """Phần chung của Group và ComponentInstance."""

    def __init__(self, ents):
        super().__init__(ents)
        self.tr = Transformation()
        self.name = ""
        self.material = None
        self.locked = False

    def content(self):
        raise NotImplementedError

    def rb_send(self, ip, name, args, blk):
        r = super().rb_send(ip, name, args, blk)
        if r is NotImplemented and (name.startswith(("add_", "fill_from", "build", "grep")) or name in ("each", "select", "reject", "find", "map")):
            # Mã AI hay gọi group.add_group / group.add_face / group.grep: chuyển cho entities
            r = self.content().rb_send(ip, name, args, blk)
        return r

    def responds(self, name):
        return super().responds(name) or (name.startswith("add_") and self.content().responds(name))

    def rb_name(self, ip, a, b):
        return self.name

    def rb_name_set(self, ip, a, b):
        self.name = str(a[0]) if a[0] is not None else ""
        return a[0]

    rb_description_set = lambda self, ip, a, b: a[0]  # noqa: E731

    def rb_material_set(self, ip, a, b):
        self.material = su.resolve_material(a[0], self.ents.model if self.ents else None)
        return a[0]

    def rb_material(self, ip, a, b):
        return self.material

    rb_back_material_set = rb_material_set
    rb_back_material = rb_material

    def rb_transformation(self, ip, a, b):
        return Transformation(self.tr.m)

    def rb_transformation_set(self, ip, a, b):
        self.tr = as_transform(a[0])
        return a[0]

    def rb_transform_b(self, ip, a, b):
        self.tr = as_transform(a[0]).compose(self.tr)
        return self

    def rb_move_b(self, ip, a, b):
        self.tr = as_transform(a[0])
        return self

    def rb_locked_set(self, ip, a, b):
        self.locked = bool(a[0])
        return a[0]

    def rb_locked_q(self, ip, a, b):
        return self.locked

    def rb_make_unique(self, ip, a, b):
        return self

    def rb_manifold_q(self, ip, a, b):
        return True

    def rb_volume(self, ip, a, b):
        return 0.0

    rb_glued_to_set = rb_casts_shadows_set = rb_receives_shadows_set = lambda self, ip, a, b: a[0]  # noqa: E731

    def bounds_into(self, bb, tr):
        self.content().bounds_into(bb, tr.compose(self.tr))

    def rb_explode(self, ip, a, b):
        parent = self.ents
        moved = []
        for e in self.content().live():
            apply_transform_to_entity(e, self.tr)
            if isinstance(e, (su.Face, su.Solid, su.TextBlock)) and getattr(e, "material", None) is None and self.material is not None:
                e.material = self.material
            e.ents = parent
            parent.items.append(e)
            moved.append(e)
        self.content().items = []
        self.rb_erase_b(ip, a, b)
        return moved


class Group(_Placed):
    rb_class_name = "Sketchup::Group"
    ancestors = su.GROUP_ANC

    def __init__(self, ents):
        super().__init__(ents)
        self.entities = Entities(self, ents.model if ents else None)
        self._defn = None

    def content(self):
        return self.entities

    def rb_entities(self, ip, a, b):
        return self.entities

    def definition(self):
        if self._defn is None:
            self._defn = ComponentDefinition(self.entities.model, self.name or "Group", self.entities)
        return self._defn

    def rb_definition(self, ip, a, b):
        return self.definition()

    def rb_copy(self, ip, a, b):
        import copy
        g = copy.copy(self)
        g.tr = Transformation(self.tr.m)
        g.entities = self.entities  # chia sẻ hình học (giống instance)
        self.ents.items.append(g)
        return g

    rb_to_component = _Placed.rb_make_unique


class ComponentDefinition(RObj):
    rb_class_name = "Sketchup::ComponentDefinition"

    def __init__(self, model, name, entities=None):
        self.name = name
        self.entities = entities or Entities(self, model)
        self.instances = []

    def rb_entities(self, ip, a, b):
        return self.entities

    def rb_name(self, ip, a, b):
        return self.name

    def rb_name_set(self, ip, a, b):
        self.name = str(a[0])
        return a[0]

    def rb_instances(self, ip, a, b):
        return list(self.instances)

    def rb_bounds(self, ip, a, b):
        bb = BoundingBox()
        self.entities.bounds_into(bb, Transformation())
        return bb

    rb_description_set = rb_behavior = lambda self, ip, a, b: None  # noqa: E731

    def rb_group_q(self, ip, a, b):
        return False

    def rb_insertion_point(self, ip, a, b):
        return Point3d(0, 0, 0)


class ComponentInstance(_Placed):
    rb_class_name = "Sketchup::ComponentInstance"
    ancestors = su.INST_ANC

    def __init__(self, ents, defn, tr):
        super().__init__(ents)
        self.defn = defn
        self.tr = tr
        if hasattr(defn, "instances") and isinstance(getattr(defn, "instances", None), list):
            defn.instances.append(self)

    def content(self):
        if hasattr(self.defn, "entities"):
            return self.defn.entities
        return None

    def rb_definition(self, ip, a, b):
        return self.defn

    def rb_entities(self, ip, a, b):
        if hasattr(self.defn, "entities"):
            return self.defn.entities
        return self.ents
