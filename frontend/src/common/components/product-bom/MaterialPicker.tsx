import { useMemo, useState } from "react";
import { Button, Input, InputNumber, Modal, Select } from "antd";
import type { Extra, Item, Kind } from "./types";
import { kindLabels, money } from "./types";

export function MaterialPicker({ items, open, onClose, onAdd }: { items: Item[]; open: boolean; onClose: () => void; onAdd: (row: Extra) => void }) {
  const [manual, setManual] = useState(false);
  const [itemId, setItemId] = useState<string>();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("bộ");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [kind, setKind] = useState<Kind>("material");
  const item = useMemo(() => items.find(i => i.id === itemId), [items, itemId]);
  return <Modal title="Thêm thành phần" open={open} onCancel={onClose} zIndex={10200} onOk={() => {
    if (!manual && !item || manual && !name.trim()) return;
    onAdd({ id: `extra-${crypto.randomUUID()}`, code: manual ? "" : item!.code, name: manual ? name.trim() : item!.name,
      unit: manual ? unit : item!.unit, quantity, unit_price: manual ? price : item!.price, kind, selected: true });
    onClose();
  }} okText="Thêm" cancelText="Hủy" okButtonProps={{ disabled: manual ? !name.trim() || !unit.trim() : !item }}>
    <div className="flex gap-2 mb-4"><Button type={!manual ? "primary" : "default"} onClick={() => setManual(false)}>Thư viện</Button><Button type={manual ? "primary" : "default"} onClick={() => setManual(true)}>Nhập tay</Button></div>
    <div className="space-y-3">
      {!manual ? <><Select className="w-full" showSearch value={itemId} onChange={setItemId} placeholder="Mã / tên vật tư" optionFilterProp="label" options={items.map(i => ({ value: i.id, label: `${i.code} · ${i.name} · ${money(i.price)}/${i.unit}` }))} />
        {item && <div className="text-xs text-slate-500">{item.specs.map(s => s.spec).join(" · ")}</div>}</> : <><Input placeholder="Tên thành phần" aria-label="Tên thành phần" value={name} onChange={e => setName(e.target.value)} /><div className="flex gap-2"><Input placeholder="Đơn vị" aria-label="Đơn vị" value={unit} onChange={e => setUnit(e.target.value)} /><InputNumber aria-label="Đơn giá" min={0} value={price} onChange={v => setPrice(v ?? 0)} placeholder="Đơn giá" /></div></>}
      <div className="flex gap-2"><Select className="flex-1" value={kind} onChange={setKind} options={Object.entries(kindLabels).map(([value, label]) => ({ value, label }))} /><InputNumber min={0} aria-label="Khối lượng bổ sung" value={quantity} onChange={v => setQuantity(v ?? 0)} addonBefore="SL" /></div>
    </div>
  </Modal>;
}
