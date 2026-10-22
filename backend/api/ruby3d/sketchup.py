# -*- coding: utf-8 -*-
"""Mô phỏng tối thiểu SketchUp API: ghi lại hình học (face + pushpull, group, text 3D)."""

from .geom import (
    BoundingBox, Point3d, Transformation, Vector3d, as_transform, to_xyz, vcross, vlen, vnorm,
)
from .runtime import RObj, RubyError, is_num

GEOM_EPS = 1e-6

NAMED_COLORS = {
    "red": (255, 0, 0), "green": (0, 128, 0), "lime": (0, 255, 0), "blue": (0, 0, 255),
    "white": (255, 255, 255), "black": (0, 0, 0), "gray": (128, 128, 128), "grey": (128, 128, 128),
    "silver": (192, 192, 192), "yellow": (255, 255, 0), "orange": (255, 165, 0), "gold": (255, 215, 0),
    "brown": (165, 42, 42), "purple": (128, 0, 128), "pink": (255, 192, 203), "cyan": (0, 255, 255),
    "magenta": (255, 0, 255), "navy": (0, 0, 128), "teal": (0, 128, 128), "maroon": (128, 0, 0),
    "olive": (128, 128, 0), "darkgray": (169, 169, 169), "darkgrey": (169, 169, 169),
    "lightgray": (211, 211, 211), "lightgrey": (211, 211, 211), "dimgray": (105, 105, 105),
    "dimgrey": (105, 105, 105), "slategray": (112, 128, 144), "steelblue": (70, 130, 180),
    "darkblue": (0, 0, 139), "darkred": (139, 0, 0), "darkgreen": (0, 100, 0), "beige": (245, 245, 220),
    "ivory": (255, 255, 240), "khaki": (240, 230, 140), "tan": (210, 180, 140), "skyblue": (135, 206, 235),
    "whitesmoke": (245, 245, 245), "gainsboro": (220, 220, 220), "crimson": (220, 20, 60),
    "firebrick": (178, 34, 34), "forestgreen": (34, 139, 34), "royalblue": (65, 105, 225),
    "deepskyblue": (0, 191, 255), "chocolate": (210, 105, 30), "sienna": (160, 82, 45),
    "goldenrod": (218, 165, 32), "darkorange": (255, 140, 0), "lightblue": (173, 216, 230),
    "darkslategray": (47, 79, 79), "charcoal": (54, 69, 79),
}

FACE_ANC = ("Sketchup::Face", "Sketchup::Drawingelement", "Sketchup::Entity", "Object")
EDGE_ANC = ("Sketchup::Edge", "Sketchup::Drawingelement", "Sketchup::Entity", "Object")
GROUP_ANC = ("Sketchup::Group", "Sketchup::Drawingelement", "Sketchup::Entity", "Object")
INST_ANC = ("Sketchup::ComponentInstance", "Sketchup::Drawingelement", "Sketchup::Entity", "Object")


# ---------------------------------------------------------------- Color / Material
class Color(RObj):
    rb_class_name = "Sketchup::Color"

    def __init__(self, r=255, g=255, b=255, a=255):
        self.r, self.g, self.b, self.a = int(r), int(g), int(b), int(a)

    def rb_red(self, ip, a, b):
        return self.r

    def rb_green(self, ip, a, b):
        return self.g

    def rb_blue(self, ip, a, b):
        return self.b

    def rb_alpha(self, ip, a, b):
        return self.a

    def rb_red_set(self, ip, a, b):
        self.r = int(a[0])
        return a[0]

    def rb_green_set(self, ip, a, b):
        self.g = int(a[0])
        return a[0]

    def rb_blue_set(self, ip, a, b):
        self.b = int(a[0])
        return a[0]

    def rb_alpha_set(self, ip, a, b):
        v = a[0]
        self.a = int(v * 255) if isinstance(v, float) and v <= 1.0 else int(v)
        return v

    def rb_to_a(self, ip, a, b):
        return [self.r, self.g, self.b, self.a]

    def rb_to_i(self, ip, a, b):
        return self.r | (self.g << 8) | (self.b << 16)

    def rb_blend(self, ip, a, b):
        o = make_color(a[0])
        w = float(a[1])
        mix = lambda p, q: int(p * w + q * (1 - w))  # noqa: E731
        return Color(mix(self.r, o.r), mix(self.g, o.g), mix(self.b, o.b))

    def hex(self):
        return "#%02x%02x%02x" % (max(0, min(255, self.r)), max(0, min(255, self.g)), max(0, min(255, self.b)))


def make_color(v, *rest):
    if isinstance(v, Color):
        return Color(v.r, v.g, v.b, v.a)
    if isinstance(v, Material):
        return Color(v.color.r, v.color.g, v.color.b, v.color.a)
    if rest and is_num(v):
        vals = [v, *rest][:4]
        if all(isinstance(x, float) and x <= 1.0 for x in vals[:3]):
            vals = [x * 255 for x in vals]
        return Color(*vals)
    if isinstance(v, (list, tuple)) and len(v) >= 3:
        return Color(*v[:4])
    if isinstance(v, str):
        s = v.strip()
        if s.startswith("#") and len(s) in (4, 7):
            if len(s) == 4:
                s = "#" + "".join(ch * 2 for ch in s[1:])
            return Color(int(s[1:3], 16), int(s[3:5], 16), int(s[5:7], 16))
        rgb = NAMED_COLORS.get(s.lower().replace(" ", "").replace("_", ""))
        if rgb:
            return Color(*rgb)
        return Color(160, 160, 160)
    if is_num(v):
        iv = int(v)
        return Color(iv & 255, (iv >> 8) & 255, (iv >> 16) & 255)
    return Color(200, 200, 200)


class Material(RObj):
    rb_class_name = "Sketchup::Material"

    def __init__(self, name):
        self.name = name
        self.color = Color(255, 255, 255)
        self.alpha = 1.0
        self.texture = None

    def rb_name(self, ip, a, b):
        return self.name

    rb_display_name = rb_name

    def rb_name_set(self, ip, a, b):
        self.name = str(a[0])
        return a[0]

    def rb_color(self, ip, a, b):
        return self.color

    def rb_color_set(self, ip, a, b):
        self.color = make_color(a[0])
        if self.color.a < 255:
            self.alpha = self.color.a / 255.0
        return a[0]

    def rb_alpha(self, ip, a, b):
        return self.alpha

    def rb_alpha_set(self, ip, a, b):
        self.alpha = float(a[0])
        return a[0]

    def rb_texture(self, ip, a, b):
        return self.texture

    def rb_texture_set(self, ip, a, b):
        self.texture = a[0]
        return a[0]

    def rb_use_alpha_q(self, ip, a, b):
        return self.alpha < 1.0

    def rb_to_s(self, ip, a, b):
        return self.name


class Materials(RObj):
    rb_class_name = "Sketchup::Materials"

    def __init__(self):
        self.items = {}
        self.order = []

    def get(self, name):
        return self.items.get(name)

    def rb_op_idx(self, ip, a, b):
        k = a[0]
        if is_num(k):
            return self.order[int(k)] if int(k) < len(self.order) else None
        return self.items.get(str(k))

    def rb_add(self, ip, a, b):
        name = str(a[0]) if a else f"Material{len(self.order) + 1}"
        base, i = name, 1
        while name in self.items:
            name = f"{base}{i}"
            i += 1
        m = Material(name)
        self.items[name] = m
        self.order.append(m)
        return m

    def rb_to_a(self, ip, a, b):
        return list(self.order)

    def rb_length(self, ip, a, b):
        return len(self.order)

    rb_size = rb_length
    rb_count = rb_length

    def rb_current(self, ip, a, b):
        return self.order[-1] if self.order else None

    def rb_current_set(self, ip, a, b):
        return a[0]

    def rb_remove(self, ip, a, b):
        return True

    def rb_purge_unused(self, ip, a, b):
        return self


def resolve_material(v, model):
    """Giá trị gán cho .material= -> Material/Color hoặc None."""
    if v is None or isinstance(v, (Material, Color)):
        return v
    if isinstance(v, str):
        m = model.materials.get(v) if model else None
        return m if m is not None else make_color(v)
    if isinstance(v, (list, tuple)) or is_num(v):
        return make_color(v)
    return None


# ---------------------------------------------------------------- Drawing elements
class Entity(RObj):
    ancestors = ("Sketchup::Entity", "Object")

    def __init__(self, ents):
        self.ents = ents
        self.erased = False
        self.hidden = False
        self.layer = None
        self.attrs = {}

    def rb_valid_q(self, ip, a, b):
        return not self.erased

    rb_deleted_q = lambda self, ip, a, b: self.erased  # noqa: E731

    def rb_erase_b(self, ip, a, b):
        self.erased = True
        if self.ents is not None and self in self.ents.items:
            self.ents.items.remove(self)
        return None

    def rb_hidden_set(self, ip, a, b):
        self.hidden = bool(a[0])
        return a[0]

    def rb_hidden_q(self, ip, a, b):
        return self.hidden

    rb_visible_set = lambda self, ip, a, b: setattr(self, "hidden", not a[0]) or a[0]  # noqa: E731

    def rb_layer_set(self, ip, a, b):
        self.layer = a[0]
        return a[0]

    rb_tag_set = rb_layer_set

    def rb_layer(self, ip, a, b):
        return self.layer

    def rb_set_attribute(self, ip, a, b):
        self.attrs[(str(a[0]), str(a[1]))] = a[2] if len(a) > 2 else None
        return a[2] if len(a) > 2 else None

    def rb_get_attribute(self, ip, a, b):
        return self.attrs.get((str(a[0]), str(a[1])), a[2] if len(a) > 2 else None)

    def rb_parent(self, ip, a, b):
        return self.ents.owner if self.ents else None

    def rb_model(self, ip, a, b):
        return self.ents.model if self.ents else None

    def rb_entityID(self, ip, a, b):
        return id(self) & 0xFFFFFF

    rb_persistent_id = rb_entityID

    def rb_add_observer(self, ip, a, b):
        return True

    def rb_typename(self, ip, a, b):
        return self.rb_class_name.split("::")[-1]

    def rb_all_connected(self, ip, a, b):
        return [self]

    def bounds_into(self, bb, tr):
        pass

    def rb_bounds(self, ip, a, b):
        bb = BoundingBox()
        self.bounds_into(bb, Transformation())
        return bb


class Vertex(RObj):
    rb_class_name = "Sketchup::Vertex"

    def __init__(self, p):
        self.position = Point3d(*p)

    def rb_position(self, ip, a, b):
        return self.position


class Edge(Entity):
    rb_class_name = "Sketchup::Edge"
    ancestors = EDGE_ANC

    def __init__(self, ents, p1, p2, curve=None):
        super().__init__(ents)
        self.p1, self.p2 = p1, p2
        self.curve = curve
        self.material = None

    def rb_start(self, ip, a, b):
        return Vertex(self.p1)

    def rb_end(self, ip, a, b):
        return Vertex(self.p2)

    def rb_vertices(self, ip, a, b):
        return [Vertex(self.p1), Vertex(self.p2)]

    def rb_length(self, ip, a, b):
        return vlen(tuple(self.p2[i] - self.p1[i] for i in range(3)))

    def rb_line(self, ip, a, b):
        return [Point3d(*self.p1), Vector3d(*(self.p2[i] - self.p1[i] for i in range(3)))]

    def rb_curve(self, ip, a, b):
        return self.curve

    def rb_faces(self, ip, a, b):
        return []

    def rb_material_set(self, ip, a, b):
        self.material = a[0]
        return a[0]

    def rb_material(self, ip, a, b):
        return self.material

    rb_soft_set = rb_smooth_set = rb_casts_shadows_set = rb_width_set = lambda self, ip, a, b: a[0]  # noqa: E731

    def rb_find_faces(self, ip, a, b):
        if self.curve is not None and self.curve.closed and not self.curve.face_made:
            self.curve.face_made = True
            self.ents.make_face(self.curve.pts)
            return 1
        return 0

    def bounds_into(self, bb, tr):
        bb.add_xyz(tr.apply_point(self.p1))
        bb.add_xyz(tr.apply_point(self.p2))


class Curve(RObj):
    rb_class_name = "Sketchup::ArcCurve"

    def __init__(self, pts, closed, center=None, radius=0.0):
        self.pts = pts
        self.closed = closed
        self.center = center
        self.radius = radius
        self.edges = []
        self.face_made = False

    def rb_edges(self, ip, a, b):
        return list(self.edges)

    def rb_vertices(self, ip, a, b):
        return [Vertex(p) for p in self.pts]

    def rb_radius(self, ip, a, b):
        return self.radius

    def rb_center(self, ip, a, b):
        return Point3d(*(self.center or (0, 0, 0)))


def newell_normal(pts):
    nx = ny = nz = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1, z1 = pts[i]
        x2, y2, z2 = pts[(i + 1) % n]
        nx += (y1 - y2) * (z1 + z2)
        ny += (z1 - z2) * (x1 + x2)
        nz += (x1 - x2) * (y1 + y2)
    return vnorm((nx, ny, nz))


class Face(Entity):
    rb_class_name = "Sketchup::Face"
    ancestors = FACE_ANC

    def __init__(self, ents, pts):
        super().__init__(ents)
        self.pts = pts
        self.normal = newell_normal(pts)
        self.material = None
        self.back_material = None
        self.pushed = False

    def rb_normal(self, ip, a, b):
        return Vector3d(*self.normal)

    def rb_reverse_b(self, ip, a, b):
        self.pts = list(reversed(self.pts))
        self.normal = tuple(-c for c in self.normal)
        return self

    def rb_material_set(self, ip, a, b):
        self.material = resolve_material(a[0], self.ents.model)
        return a[0]

    def rb_back_material_set(self, ip, a, b):
        self.back_material = resolve_material(a[0], self.ents.model)
        return a[0]

    def rb_material(self, ip, a, b):
        return self.material

    def rb_back_material(self, ip, a, b):
        return self.back_material

    def rb_pushpull(self, ip, a, b):
        val = a[0]
        if hasattr(val, "rb_length"):
            d = float(val.rb_length(ip, [], None))
        elif hasattr(val, "length"):
            d = float(val.length())
        elif hasattr(val, "x") and hasattr(val, "y") and hasattr(val, "z"):
            d = (val.x**2 + val.y**2 + val.z**2)**0.5
        elif isinstance(val, (list, tuple)) and len(val) == 3:
            d = (val[0]**2 + val[1]**2 + val[2]**2)**0.5
        else:
            try:
                d = float(val)
            except Exception:
                d = 1.0
        if abs(d) < GEOM_EPS:
            return None
        vec = tuple(c * d for c in self.normal)
        self.ents.items.append(Solid(self.ents, list(self.pts), vec, self))
        self.pts = [tuple(p[i] + vec[i] for i in range(3)) for p in self.pts]
        self.pushed = True
        return None

    def rb_followme(self, ip, a, b):
        path = a[0] if isinstance(a[0], list) else [a[0]]
        pts = []
        for e in path:
            if isinstance(e, Edge):
                if not pts:
                    pts.append(e.p1)
                pts.append(e.p2)
        for i in range(len(pts) - 1):
            vec = tuple(pts[i + 1][k] - pts[i][k] for k in range(3))
            off = tuple(pts[i][k] - pts[0][k] for k in range(3))
            base = [tuple(p[k] + off[k] for k in range(3)) for p in self.pts]
            self.ents.items.append(Solid(self.ents, base, vec, self))
        self.pushed = True
        return True

    def rb_area(self, ip, a, b):
        n = len(self.pts)
        acc = [0.0, 0.0, 0.0]
        for i in range(n):
            c = vcross(self.pts[i], self.pts[(i + 1) % n])
            acc = [acc[k] + c[k] for k in range(3)]
        return vlen(acc) / 2

    def rb_vertices(self, ip, a, b):
        return [Vertex(p) for p in self.pts]

    def rb_edges(self, ip, a, b):
        n = len(self.pts)
        return [Edge(self.ents, self.pts[i], self.pts[(i + 1) % n]) for i in range(n)]

    def rb_outer_loop(self, ip, a, b):
        return self

    def rb_plane(self, ip, a, b):
        n = self.normal
        p = self.pts[0]
        return [n[0], n[1], n[2], -(n[0] * p[0] + n[1] * p[1] + n[2] * p[2])]

    def rb_position_material(self, ip, a, b):
        return self

    def rb_transform_b(self, ip, a, b):
        tr = as_transform(a[0]) if a else Transformation()
        self.pts = [tr.apply_point(p) for p in self.pts]
        self.normal = newell_normal(self.pts)
        return self

    def rb_offset(self, ip, a, b):
        return self

    def bounds_into(self, bb, tr):
        for p in self.pts:
            bb.add_xyz(tr.apply_point(p))


from .sketchup_solid import Solid, TextBlock, Inert, text_width  # noqa: E402,F401
from .sketchup_tree import Entities, Group, ComponentInstance, ComponentDefinition  # noqa: E402,F401
