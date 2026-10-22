# -*- coding: utf-8 -*-
"""Model, View, UI, hằng số Geom/Sketchup và các module native cho interpreter."""

import math

from .geom import (
    BoundingBox, Point3d, Transformation, Vector3d, make_transformation, to_xyz,
    transformation_class_method,
)
from .runtime import RObj, RubyError, is_num
from . import sketchup as su
from .sketchup_tree import ComponentDefinition, Entities


class NativeModule:
    """Module/Class viết bằng Python (Sketchup, Geom::Point3d, Math, UI...)."""

    def __init__(self, name, smethods=None, consts=None, factory=None, is_class=False):
        self.name = name
        self.smethods = smethods or {}
        self.consts = consts or {}
        self.factory = factory
        self.is_class = is_class

    def __repr__(self):
        return self.name


class Dummy(RObj):
    """Đối tượng không ảnh hưởng hình học: mọi lời gọi trả về chính nó/nil."""

    rb_class_name = "Object"

    def __init__(self, name="Dummy"):
        self.name = name
        self.store = {}

    def rb_send(self, ip, name, args, blk):
        if blk is not None and name in ("add_item", "add_submenu", "set_validation_proc"):
            if not hasattr(ip, "menu_callbacks"):
                ip.menu_callbacks = []
            ip.menu_callbacks.append(blk)
        if name.endswith("=") and name not in ("==", "!="):
            self.store[name[:-1]] = args[0] if args else None
            return args[0] if args else None
        if name == "[]":
            return self.store.get(str(args[0]) if args else "")
        if name == "[]=":
            self.store[str(args[0])] = args[1]
            return args[1]
        if name in ("each", "to_a", "map"):
            return []
        if name in self.store:
            return self.store[name]
        return self

    def responds(self, name):
        return True


class Camera(RObj):
    rb_class_name = "Sketchup::Camera"

    def __init__(self, eye=(0, -1000, 500), target=(0, 0, 0), up=(0, 0, 1)):
        self.eye, self.target, self.up = eye, target, up

    def rb_eye(self, ip, a, b):
        return Point3d(*self.eye)

    def rb_target(self, ip, a, b):
        return Point3d(*self.target)

    def rb_up(self, ip, a, b):
        return Vector3d(*self.up)

    def rb_set(self, ip, a, b):
        self.eye, self.target = to_xyz(a[0]), to_xyz(a[1])
        return self

    def rb_send(self, ip, name, args, blk):
        r = super().rb_send(ip, name, args, blk)
        if r is NotImplemented:
            return args[0] if name.endswith("=") and args else None
        return r


class View(RObj):
    rb_class_name = "Sketchup::View"

    def __init__(self, model):
        self.model = model

    def rb_camera(self, ip, a, b):
        return self.model.camera or Camera()

    def rb_camera_set(self, ip, a, b):
        cam = a[0][0] if isinstance(a[0], list) else a[0]
        if isinstance(cam, Camera):
            self.model.camera = cam
        return a[0]

    def rb_send(self, ip, name, args, blk):
        r = super().rb_send(ip, name, args, blk)
        return self if r is NotImplemented else r


class Selection(RObj):
    rb_class_name = "Sketchup::Selection"

    def __init__(self):
        self.items = []

    def rb_add(self, ip, a, b):
        return len(a)

    rb_remove = rb_toggle = rb_add

    def rb_clear(self, ip, a, b):
        return self

    def rb_to_a(self, ip, a, b):
        return []

    def rb_empty_q(self, ip, a, b):
        return True

    def rb_length(self, ip, a, b):
        return 0

    rb_size = rb_count = rb_length

    def rb_first(self, ip, a, b):
        return None


class Layers(RObj):
    rb_class_name = "Sketchup::Layers"

    def __init__(self):
        self.items = {}

    def rb_add(self, ip, a, b):
        name = str(a[0]) if a else "Layer"
        if name not in self.items:
            d = Dummy("Layer")
            d.store["name"] = name
            d.store["visible?"] = True
            self.items[name] = d
        return self.items[name]

    rb_add_layer = rb_add

    def rb_op_idx(self, ip, a, b):
        return self.items.get(str(a[0]))

    def rb_to_a(self, ip, a, b):
        return list(self.items.values())

    def rb_length(self, ip, a, b):
        return len(self.items)

    rb_size = rb_count = rb_length


class Definitions(RObj):
    rb_class_name = "Sketchup::DefinitionList"

    def __init__(self, model):
        self.model = model
        self.items = []

    def rb_add(self, ip, a, b):
        d = ComponentDefinition(self.model, str(a[0]) if a else "Component")
        self.items.append(d)
        return d

    def rb_load(self, ip, a, b):
        return self.rb_add(ip, ["Loaded"], b)

    def rb_op_idx(self, ip, a, b):
        k = a[0]
        if is_num(k):
            return self.items[int(k)] if int(k) < len(self.items) else None
        return next((d for d in self.items if d.name == k), None)

    def rb_to_a(self, ip, a, b):
        return list(self.items)

    def rb_purge_unused(self, ip, a, b):
        return self


class Model(RObj):
    rb_class_name = "Sketchup::Model"

    def __init__(self):
        self.stats = {"faces": 0, "groups": 0}
        self.entities = Entities(self, self)
        self.materials = su.Materials()
        self.layers = Layers()
        self.definitions = Definitions(self)
        self.selection = Selection()
        self.view = View(self)
        self.camera = None
        self.misc = Dummy("Options")

    def rb_entities(self, ip, a, b):
        return self.entities

    rb_active_entities = rb_entities

    def rb_materials(self, ip, a, b):
        return self.materials

    def rb_layers(self, ip, a, b):
        return self.layers

    rb_tags = rb_layers

    def rb_definitions(self, ip, a, b):
        return self.definitions

    def rb_selection(self, ip, a, b):
        return self.selection

    def rb_active_view(self, ip, a, b):
        return self.view

    def rb_start_operation(self, ip, a, b):
        return True

    rb_commit_operation = rb_abort_operation = rb_start_operation

    def rb_bounds(self, ip, a, b):
        bb = BoundingBox()
        self.entities.bounds_into(bb, Transformation())
        return bb

    def rb_title(self, ip, a, b):
        return "Admake"

    def rb_path(self, ip, a, b):
        return ""

    def rb_send(self, ip, name, args, blk):
        r = super().rb_send(ip, name, args, blk)
        if r is NotImplemented:
            # rendering_options, shadow_info, pages, styles, options, active_layer=...
            return self.misc.rb_send(ip, name, args, blk)
        return r


# ---------------------------------------------------------------- build globals
def _xyz_factory(cls):
    def make(ip, args, blk):
        if not args:
            return cls()
        if len(args) == 1:
            return cls(*to_xyz(args[0]))
        return cls(float(args[0]), float(args[1]), float(args[2]) if len(args) > 2 else 0.0)
    return make


def _linear_combination(cls):
    def fn(ip, a, b):
        p1, p2 = to_xyz(a[1]), to_xyz(a[3])
        w1, w2 = float(a[0]), float(a[2])
        return cls(*(w1 * p1[i] + w2 * p2[i] for i in range(3)))
    return fn


def _tr_smethod(name):
    def fn(ip, a, b):
        r = transformation_class_method(name, a)
        if r is NotImplemented:
            raise RubyError("NoMethodError", f"Geom::Transformation.{name}")
        return r
    return fn


def _math_fn(f):
    return lambda ip, a, b: f(*[float(x) for x in a])


def build_globals(ip):
    model = Model()
    ip.model = model

    def native_class(name, **kw):
        return NativeModule(name, is_class=True, **kw)

    geom = NativeModule("Geom", consts={
        "Point3d": native_class("Geom::Point3d", factory=_xyz_factory(Point3d),
                                smethods={"linear_combination": _linear_combination(Point3d)}),
        "Vector3d": native_class("Geom::Vector3d", factory=_xyz_factory(Vector3d),
                                 smethods={"linear_combination": _linear_combination(Vector3d)}),
        "Transformation": native_class(
            "Geom::Transformation", factory=lambda ip_, a, b: make_transformation(a),
            smethods={n: _tr_smethod(n) for n in ("translation", "rotation", "scaling", "axes", "interpolate")}),
        "BoundingBox": native_class("Geom::BoundingBox", factory=lambda ip_, a, b: BoundingBox()),
    }, smethods={
        "intersect_line_line": lambda ip_, a, b: None,
        "intersect_line_plane": lambda ip_, a, b: None,
    })

    def color_factory(ip_, a, b):
        if not a:
            return su.Color()
        return su.make_color(a[0], *a[1:])

    sketchup_consts = {
        "Color": native_class("Sketchup::Color", factory=color_factory,
                              smethods={"names": lambda ip_, a, b: list(su.NAMED_COLORS.keys())}),
        "Camera": native_class("Sketchup::Camera", factory=lambda ip_, a, b: Camera(
            *(to_xyz(x) for x in a[:3])) if len(a) >= 2 else Camera()),
    }
    for cname in ("Face", "Edge", "Group", "ComponentInstance", "ComponentDefinition", "Entity",
                  "Drawingelement", "Material", "Vertex", "Text", "ConstructionPoint", "ConstructionLine",
                  "Entities", "Model", "ArcCurve", "Curve", "Layer", "Image", "Dimension"):
        sketchup_consts[cname] = native_class(f"Sketchup::{cname}")

    sketchup = NativeModule("Sketchup", consts=sketchup_consts, smethods={
        "active_model": lambda ip_, a, b: model,
        "version": lambda ip_, a, b: "23.0.367",
        "version_number": lambda ip_, a, b: 2300000367,
        "undo": lambda ip_, a, b: None,
        "send_action": lambda ip_, a, b: True,
        "status_text=": lambda ip_, a, b: a[0] if a else None,
        "set_status_text": lambda ip_, a, b: None,
        "file_new": lambda ip_, a, b: model,
        "platform": lambda ip_, a, b: "platform_win",
        "is_pro?": lambda ip_, a, b: True,
        "require": lambda ip_, a, b: True,
        "find_support_file": lambda ip_, a, b: None,
        "temp_dir": lambda ip_, a, b: "",
        "focus": lambda ip_, a, b: True,
    })

    def inputbox(ip_, a, b):
        return list(a[1]) if len(a) > 1 and isinstance(a[1], list) else []

    ui = NativeModule("UI", smethods={
        "messagebox": lambda ip_, a, b: 1,
        "inputbox": inputbox,
        "menu": lambda ip_, a, b: Dummy("Menu"),
        "toolbar": lambda ip_, a, b: Dummy("Toolbar"),
        "add_context_menu_handler": lambda ip_, a, b: None,
        "start_timer": lambda ip_, a, b: 0,
        "stop_timer": lambda ip_, a, b: None,
        "beep": lambda ip_, a, b: None,
        "openpanel": lambda ip_, a, b: None,
        "savepanel": lambda ip_, a, b: None,
    }, consts={"Command": native_class("UI::Command", factory=lambda ip_, a, b: Dummy("Command"))})

    math_mod = NativeModule("Math", consts={"PI": math.pi, "E": math.e}, smethods={
        "sin": _math_fn(math.sin), "cos": _math_fn(math.cos), "tan": _math_fn(math.tan),
        "asin": _math_fn(math.asin), "acos": _math_fn(math.acos), "atan": _math_fn(math.atan),
        "atan2": _math_fn(math.atan2), "sqrt": _math_fn(math.sqrt), "hypot": _math_fn(math.hypot),
        "exp": _math_fn(math.exp), "cbrt": _math_fn(lambda x: math.copysign(abs(x) ** (1 / 3), x)),
        "log": lambda ip_, a, b: math.log(float(a[0])) if len(a) == 1 else math.log(float(a[0]), float(a[1])),
        "log10": _math_fn(math.log10), "log2": _math_fn(math.log2), "sinh": _math_fn(math.sinh),
        "cosh": _math_fn(math.cosh), "tanh": _math_fn(math.tanh),
    })

    consts = {
        "Geom": geom,
        "Sketchup": sketchup,
        "UI": ui,
        "Math": math_mod,
        "ORIGIN": Point3d(0, 0, 0),
        "X_AXIS": Vector3d(1, 0, 0),
        "Y_AXIS": Vector3d(0, 1, 0),
        "Z_AXIS": Vector3d(0, 0, 1),
        "IDENTITY": Transformation(),
        "TextAlignLeft": 0, "TextAlignCenter": 1, "TextAlignRight": 2,
        "TextVerticalAlignBaseline": 0, "TextVerticalAlignBoundsTop": 1,
        "TextVerticalAlignCapHeight": 2, "TextVerticalAlignCenter": 3,
        "MB_OK": 0, "MB_OKCANCEL": 1, "MB_YESNO": 4, "IDOK": 1, "IDYES": 6, "IDNO": 7, "IDCANCEL": 2,
        "Float::INFINITY": float("inf"),
        "Length": native_class("Length"),
    }
    for exc in ("StandardError", "RuntimeError", "ArgumentError", "TypeError", "NameError",
                "NoMethodError", "ZeroDivisionError", "IndexError", "KeyError", "RangeError",
                "StopIteration", "NotImplementedError", "Exception", "ScriptError", "LoadError",
                "FloatDomainError", "IOError", "SystemExit"):
        consts[exc] = native_class(exc)
    for core in ("Integer", "Float", "Numeric", "String", "Symbol", "Array", "Hash", "Range", "NilClass",
                 "TrueClass", "FalseClass", "Proc", "Object", "Comparable", "Enumerable", "Kernel",
                 "Struct", "Time", "Fixnum", "BasicObject", "Module", "Class"):
        consts.setdefault(core, native_class(core))
    consts["Float"].consts.update({"INFINITY": float("inf"), "NAN": float("nan"), "EPSILON": 2.220446049250313e-16})
    consts["Time"].smethods["now"] = lambda ip_, a, b: Dummy("Time")
    return consts
