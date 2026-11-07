import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("formula_engine", ROOT / "api/product_formula_engine.py")
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


def recipe():
    return {"parameters": [{"key": "waste", "default": 5}], "lines": [
        {"id": "face", "code": "AL", "formula": "A*F*(1+waste/100)/2.9768", "kind": "material"},
        {"id": "frame", "code": "SH", "formula": "P/6", "kind": "material"},
        {"id": "labor", "code": "LAB", "formula": "A", "kind": "labor"},
        {"id": "delivery", "code": "DEL", "formula": "1", "kind": "transport", "selected": False},
    ]}


ITEMS = {code: {"code": code, "name": code, "unit": unit, "price": price} for code, unit, price in [
    ("AL", "tấm", 383000), ("SH", "cây", 82400), ("LAB", "m²", 150000), ("DEL", "chuyến", 200000)]}
DIMS = {"L": 60, "H": 80, "W": 6, "F": 1, "count": 1}


def test_dimensions_units_faces_and_quantity():
    first = engine.calculate(recipe(), DIMS, {}, ITEMS)
    second = engine.calculate(recipe(), {**DIMS, "L": 120, "H": 160, "W": 12}, {}, ITEMS)
    assert second["rows"][0]["quantity"] == pytest.approx(first["rows"][0]["quantity"] * 4)
    assert second["rows"][1]["quantity"] == pytest.approx(first["rows"][1]["quantity"] * 2)
    double = engine.calculate(recipe(), {**DIMS, "F": 2, "count": 3}, {}, ITEMS)
    assert double["rows"][0]["quantity"] == pytest.approx(first["rows"][0]["quantity"] * 6)
    assert double["rows"][1]["quantity"] == pytest.approx(first["rows"][1]["quantity"] * 3)


def test_overrides_selection_extras_and_rounding():
    result = engine.calculate(recipe(), DIMS, {}, ITEMS, overrides={
        "face": {"quantity": 2, "unit_price": 100}, "frame": {"selected": False},
        "labor": {"quantity": 0}, "delivery": {"selected": True}}, extras=[
        {"id": "extra", "code": "", "name": "Phát sinh", "quantity": 1, "unit_price": 10.5, "kind": "extra"}], markup=30, vat=10)
    assert result["cost"] == 200211
    assert result["subtotals"]["transport"] == 200000
    assert result["profit"] == 60063
    assert result["tax"] == 26027
    assert result["total"] == 286301
    reset = engine.calculate(recipe(), {**DIMS, "L": 100}, {}, ITEMS)
    assert reset["rows"][0]["quantity"] != 2


@pytest.mark.parametrize("expression", ["__import__('os')", "L.__class__", "[L][0]", "2**100000", "1/0", "-1", "1e999", "open('x')", "ceil(x=1)", "unknown+1"])
def test_reject_unsafe_or_invalid_formulas(expression):
    with pytest.raises(ValueError):
        engine.evaluate(expression, {"L": 1})


def test_safe_functions_and_volume():
    v = engine.variables_for(DIMS, {}, [])
    assert v["V"] == pytest.approx(.0288)
    assert engine.evaluate("ceil(A*100) + max(1,round(P))", v) == 51
    assert engine.evaluate("round(1.2345, 2)", v) == 1.23


def test_missing_material_and_zero_price_are_visible():
    missing = engine.calculate(recipe(), DIMS, {}, {})
    assert "Không có mã vật tư: AL" in missing["issues"]
    custom = {"parameters": [], "lines": [{"id": "manual", "name": "Đá", "formula": "L*W", "kind": "material"}]}
    assert engine.calculate(custom, DIMS, {}, {})["issues"] == ["Chưa có đơn giá: Đá"]


def test_all_79_products_evaluate_at_multiple_dimensions():
    products = json.loads((ROOT / "config/product_formula_seed.json").read_text(encoding="utf-8"))
    assert len(products) == 79
    assert len({p["id"] for p in products}) == 79
    for p in products:
        definition = p["definition"]
        assert definition["lines"], p["name"]
        items = {r["code"]: {"code": r["code"], "name": r["code"], "unit": "test", "price": 100}
                 for r in definition["lines"] if r.get("code")}
        for scale in (0.5, 1, 2):
            dims = {**definition["defaults"], **{k: definition["defaults"][k] * scale for k in ("L", "W", "H")}}
            for axis, bounds in definition.get('constraints', {}).get('dimensions', {}).items():
                dims[axis] = max(bounds['min'], dims[axis])
            result = engine.calculate(definition, dims, {}, items)
            assert not [i for i in result["issues"] if not i.startswith("Chưa có đơn giá")], (p["name"], result["issues"])
            assert result["total"] >= 0
        assert (ROOT / "static" / p["image_url"].removeprefix("/static/")).exists()


def test_no_duplicate_bom_ids_and_no_negative_or_nonfinite_overrides():
    for value in (-1, float('nan'), float('inf')):
        with pytest.raises(ValueError):
            engine.calculate(recipe(), DIMS, {}, ITEMS, {"face": {"quantity": value}})
    with pytest.raises(ValueError):
        engine.calculate(recipe(), DIMS, {}, ITEMS, extras=[{"id": "face", "code": "DEL"}])


def bounded_recipe(unit=500000, order=0):
    result = recipe()
    result['constraints'] = {'dimensions': {'L': {'min': 10, 'max': 300}, 'H': {'min': 10, 'max': 300}, 'W': {'min': .1, 'max': 40}},
                             'minimum_unit_price': unit, 'minimum_order_price': order}
    return result


@pytest.mark.parametrize('axis,value', [('L',9.99),('H',0),('W',float('nan'))])
def test_product_size_limits_reject_out_of_range(axis,value):
    with pytest.raises(ValueError):
        engine.calculate(bounded_recipe(),{**DIMS,axis:value},{},ITEMS)


def test_minimum_price_keeps_cost_and_markup_and_adds_vat_after_floor():
    ordinary = engine.calculate(recipe(),DIMS,{},ITEMS,markup=30,vat=10)
    result = engine.calculate(bounded_recipe(),DIMS,{},ITEMS,markup=30,vat=10)
    assert result['cost'] == ordinary['cost']
    assert result['profit'] == ordinary['profit']
    assert result['price_before_tax'] == 500000
    assert result['minimum_adjustment'] == 500000-result['cost']-result['profit']
    assert result['tax'] == 50000 and result['total'] == 550000
    above_floor = engine.calculate(bounded_recipe(unit=1000),DIMS,{},ITEMS,markup=30,vat=10)
    assert above_floor['minimum_adjustment']==0 and above_floor['total']==ordinary['total']


def test_delivery_cannot_satisfy_the_product_floor_and_quantity_multiplies_floor():
    result = engine.calculate(bounded_recipe(),{**DIMS,'count':3},{},ITEMS,
                              overrides={'delivery':{'selected':True}},markup=30,vat=10)
    transport_sale = result['subtotals']['transport']*1.3
    assert result['price_before_tax']-transport_sale==1500000
    assert result['tax']==round(result['price_before_tax']*.1)


def test_printing_order_floor_and_missing_prices_are_still_visible():
    small = engine.calculate(bounded_recipe(unit=1000,order=100000),DIMS,{}, {})
    assert small['price_before_tax']==100000
    assert small['issues']  # A price floor must not hide missing material prices.
    large = engine.calculate(bounded_recipe(unit=1000,order=100000),{**DIMS,'count':200},{},{})
    assert large['price_before_tax']==200000


def test_every_library_product_has_sane_defaults_and_explicit_policy():
    products = json.loads((ROOT/'config/product_formula_seed.json').read_text(encoding='utf-8'))
    for product in products:
        policy=engine.validate_dimensions(product['definition'],product['definition']['defaults'])
        assert set(policy['dimensions'])=={'L','H','W'}
        assert policy['minimum_unit_price']>0
    by_id={p['id'][:6]:p for p in products}
    assert by_id['1f1bb7']['definition']['defaults']['W']==.01
    assert by_id['71c555']['definition']['defaults']['W']==60


@pytest.mark.parametrize('axis,value', [('L',620),('H',1000),('W',41)])
def test_product_maxima_are_not_enforced_even_for_old_recipes(axis,value):
    result = engine.calculate(bounded_recipe(),{**DIMS,axis:value},{},ITEMS)
    assert result['total'] >= 0
