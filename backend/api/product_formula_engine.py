"""Small arithmetic language for BOM quantities. Never executes Python/user code."""
import ast
import math

def rounded(value, digits=0):
    if digits != int(digits) or abs(digits) > 12:
        raise ValueError("Số chữ số làm tròn không hợp lệ")
    return round(value, int(digits))


FUNCTIONS = {"ceil": math.ceil, "floor": math.floor, "min": min, "max": max,
             "round": rounded, "sqrt": math.sqrt, "abs": abs}
BASE_NAMES = {"L", "W", "H", "A", "P", "V", "F", "pi"}
KINDS = {"material", "labor", "transport", "extra"}


def numeric(value, minimum=0, maximum=1e12):
    if isinstance(value, bool):
        raise ValueError("Số không hợp lệ")
    try:
        result = float(value)
    except (ValueError, TypeError):
        raise ValueError("Số không hợp lệ")
    if not math.isfinite(result) or result < minimum or result > maximum:
        raise ValueError("Số ngoài phạm vi")
    return result


def constraints_for(recipe):
    constraints = recipe.get('constraints')
    if constraints is None:
        return {'dimensions': {}, 'minimum_unit_price': 0, 'minimum_order_price': 0}
    if not isinstance(constraints, dict) or not isinstance(constraints.get('dimensions'), dict):
        raise ValueError('Giới hạn sản phẩm không hợp lệ')
    dimensions = {}
    for axis in ('L', 'H', 'W'):
        bounds = constraints['dimensions'].get(axis)
        if not isinstance(bounds, dict):raise ValueError('Thiếu giới hạn kích thước ' + axis)
        lower = numeric(bounds.get('min'), .0001, 100000)
        dimensions[axis] = {'min': lower}
    return {'dimensions': dimensions,
            'minimum_unit_price': numeric(constraints.get('minimum_unit_price', 0)),
            'minimum_order_price': numeric(constraints.get('minimum_order_price', 0))}


def validate_dimensions(recipe, dimensions):
    if not isinstance(dimensions, dict):
        raise ValueError('Kích thước sản phẩm không hợp lệ')
    policy = constraints_for(recipe)
    labels = {'L': 'Ngang', 'H': 'Cao', 'W': 'Rộng / sâu'}
    for axis, bounds in policy['dimensions'].items():
        value = numeric(dimensions.get(axis), .0001, 100000)
        if value < bounds['min']:
            raise ValueError(f"{labels[axis]} tối thiểu {bounds['min']*10:g} mm")
    return policy


def evaluate(expression, variables):
    if not isinstance(expression, str) or not expression or len(expression) > 500:
        raise ValueError("Công thức không hợp lệ")
    try:
        tree = ast.parse(expression, mode="eval")
        if sum(1 for _ in ast.walk(tree)) > 100:
            raise ValueError("Công thức quá dài")

        def visit(node):
            if isinstance(node, ast.Constant) and type(node.value) in (int, float):
                return numeric(node.value, -1e12)
            if isinstance(node, ast.Name) and node.id in variables:
                return numeric(variables[node.id], -1e12)
            if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
                return visit(node.operand) * (-1 if isinstance(node.op, ast.USub) else 1)
            if isinstance(node, ast.BinOp):
                a, b = visit(node.left), visit(node.right)
                if isinstance(node.op, ast.Add): value = a + b
                elif isinstance(node.op, ast.Sub): value = a - b
                elif isinstance(node.op, ast.Mult): value = a * b
                elif isinstance(node.op, ast.Div): value = a / b
                else: raise ValueError("Chỉ dùng + - * /")
                return numeric(value, -1e12)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in FUNCTIONS:
                if node.keywords or not 1 <= len(node.args) <= 8:
                    raise ValueError("Hàm không hợp lệ")
                return numeric(FUNCTIONS[node.func.id](*[visit(a) for a in node.args]), -1e12)
            raise ValueError("Biến hoặc phép toán không hợp lệ")
        return numeric(visit(tree.body))
    except (SyntaxError, TypeError, ZeroDivisionError, OverflowError, RecursionError) as exc:
        raise ValueError("Lỗi công thức: " + str(exc))


def variables_for(dimensions, parameters, definitions):
    variables = {k: numeric(dimensions.get(k), .0001, 100000) / 100 for k in ("L", "W", "H")}
    variables["F"] = numeric(dimensions.get("F", 1), 1, 2)
    if variables["F"] not in (1, 2):
        raise ValueError("Số mặt phải là 1 hoặc 2")
    variables.update(A=variables["L"] * variables["H"], P=2 * (variables["L"] + variables["H"]),
                     V=variables["L"] * variables["W"] * variables["H"], pi=math.pi)
    for param in definitions:
        key = param["key"]
        if not key.isidentifier() or key in BASE_NAMES or key in FUNCTIONS or key.startswith("_"):
            raise ValueError("Tên tham số không hợp lệ: " + key)
        variables[key] = numeric(parameters.get(key, param.get("default", 0)),
                                 param.get("min", 0), param.get("max", 1e8))
    return variables


def calculate(recipe, dimensions, parameters, items, overrides=None, extras=None, markup=30, vat=0):
    policy = validate_dimensions(recipe, dimensions)
    variables = variables_for(dimensions, parameters, recipe.get("parameters", []))
    count = numeric(dimensions.get("count", 1), 1, 100000)
    if not count.is_integer():
        raise ValueError("Số sản phẩm phải là số nguyên")
    overrides = overrides or {}
    rows, issues = [], []
    for definition in recipe.get("lines", []):
        code = definition.get("code", "")
        item = items.get(code)
        manual = not code
        override = overrides.get(definition["id"], {})
        try:
            base_quantity = evaluate(definition.get("formula", "1"), variables) * count
        except ValueError as exc:
            base_quantity = 0
            issues.append(f"{definition.get('name') or code}: {exc}")
        if not manual and not item:
            issues.append("Không có mã vật tư: " + code)
        price = item["price"] if item else definition.get("unit_price", 0)
        quantity = numeric(override.get("quantity", base_quantity), maximum=1e10)
        unit_price = numeric(override.get("unit_price", price))
        selected = override.get("selected", definition.get("selected", True)) is True
        name = item["name"] if item else definition.get("name", code or "Nhập tay")
        row = {"id": definition["id"], "code": code, "name": name,
               "unit": item["unit"] if item else definition.get("unit", "bộ"),
               "quantity": quantity, "base_quantity": base_quantity, "unit_price": unit_price,
               "kind": definition.get("kind", "material"), "selected": selected,
               "formula": definition.get("formula", "1"), "manual": manual,
               "note": definition.get("note", ""), "overridden": bool(override)}
        if selected and quantity > 0 and unit_price == 0:
            issues.append("Chưa có đơn giá: " + name)
        row["total"] = math.floor(quantity * unit_price + .5) if selected else 0
        rows.append(row)
    if len(extras or []) > 100:
        raise ValueError("Tối đa 100 dòng bổ sung")
    for extra in extras or []:
        item = items.get(extra.get("code"))
        if extra.get("code") and not item:
            raise ValueError("Mã vật tư bổ sung không hợp lệ")
        qty = numeric(extra.get("quantity", 1), maximum=1e10)
        price = numeric(extra.get("unit_price", item["price"] if item else 0))
        selected = extra.get("selected", True) is True
        row = {"id": str(extra["id"])[:80], "code": item["code"] if item else "",
               "name": item["name"] if item else str(extra.get("name") or "Nhập tay")[:255],
               "unit": item["unit"] if item else str(extra.get("unit") or "bộ")[:50],
               "quantity": qty, "base_quantity": qty, "unit_price": price,
               "kind": extra.get("kind") if extra.get("kind") in KINDS else "extra",
               "selected": selected, "formula": "", "manual": not bool(item), "overridden": True,
               "note": "", "total": math.floor(qty * price + .5) if selected else 0}
        if selected and qty > 0 and price == 0:
            issues.append("Chưa có đơn giá: " + row["name"])
        rows.append(row)
    if len({r["id"] for r in rows}) != len(rows):
        raise ValueError("Trùng ID dòng BOM")
    subtotals = {kind: sum(r["total"] for r in rows if r["kind"] == kind) for kind in KINDS}
    cost = sum(r["total"] for r in rows)
    markup = numeric(markup, 0, 1000)
    profit = math.floor(cost * markup / 100 + .5)
    transport = subtotals['transport']
    transport_sale = transport + math.floor(transport * markup / 100 + .5)
    product_sale = cost + profit - transport_sale
    required_minimum = math.ceil(max(policy['minimum_unit_price'] * count, policy['minimum_order_price']))
    minimum_adjustment = max(0, required_minimum - product_sale)
    price_before_tax = cost + profit + minimum_adjustment
    tax = math.floor(price_before_tax * numeric(vat, 0, 100) / 100 + .5)
    return {"rows": rows, "issues": list(dict.fromkeys(issues)), "subtotals": subtotals,
            "cost": cost, "profit": profit, "tax": tax, "total": price_before_tax + tax,
            "unit_total": math.floor((price_before_tax + tax) / count + .5),
            "minimum_unit_price": policy['minimum_unit_price'], "minimum_order_price": policy['minimum_order_price'],
            "minimum_adjustment": minimum_adjustment, "price_before_tax": price_before_tax}
