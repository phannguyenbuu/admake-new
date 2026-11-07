import { Checkbox, InputNumber, Button, Tooltip } from "antd";
import { RotateCcw, Trash2 } from "lucide-react";
import type { Item, Kind, Override, Result, Row } from "./types";
import { kindLabels, money } from "./types";

export function BomTable({ items = [], result, editable, onChange, onReset, onRemove }: {
  items?: Item[]; result: Result; editable: boolean; onChange: (row: Row, patch: Override) => void;
  onReset: (id: string) => void; onRemove: (id: string) => void;
}) {
  return <div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full text-sm whitespace-nowrap">
    <thead className="bg-slate-50 text-slate-500 text-xs"><tr>{["", "Thành phần", "ĐVT", "Khối lượng", "Đơn giá", "Thành tiền", ""].map((s, i) => <th key={i} className={`p-2.5 font-medium ${i > 2 ? "text-right" : "text-left"}`}>{s}</th>)}</tr></thead>
    <tbody>{(Object.keys(kindLabels) as Kind[]).map(kind => {
      const rows = result.rows.filter(r => r.kind === kind && (editable || r.selected));
      if (!rows.length) return null;
      return <FragmentGroup items={items} key={kind} title={kindLabels[kind]} rows={rows} editable={editable} onChange={onChange} onReset={onReset} onRemove={onRemove} />;
    })}</tbody>
  </table></div>;
}

function FragmentGroup({ items, title, rows, editable, onChange, onReset, onRemove }: {
  items: Item[]; title: string; rows: Row[]; editable: boolean; onChange: (row: Row, patch: Override) => void; onReset: (id: string) => void; onRemove: (id: string) => void;
}) {
  return <><tr><td colSpan={7} className="px-3 py-2 bg-slate-50/60 text-xs font-semibold text-slate-600">{title}</td></tr>{rows.map(row => <tr key={row.id} className={`border-t border-slate-100 ${row.selected ? "" : "opacity-50"}`}>
    <td className="pl-3">{editable && <Checkbox aria-label={`Chọn ${row.name}`} checked={row.selected} onChange={e => onChange(row, { selected: e.target.checked })} />}</td>
    <td className="p-2.5 min-w-52"><Tooltip color="white" placement="right" zIndex={10500} overlayStyle={{ maxWidth: 460 }}
      title={<MaterialDetails item={items.find(item => item.code === row.code)} row={row} />}>
      <span tabIndex={0} className="font-medium text-slate-800 cursor-help">{row.name}</span>
    </Tooltip><div className="text-xs text-slate-400">{row.code || "Nhập tay"}{row.formula && <Tooltip title={`${row.formula} × số sản phẩm${row.note ? " · " + row.note : ""}`}><span className="ml-2 cursor-help">ƒx {row.overridden ? "· đã chỉnh" : ""}</span></Tooltip>}</div></td>
    <td className="p-2.5 text-slate-500">{row.unit}</td>
    <td className="p-2 text-right">{editable ? <InputNumber aria-label={`Khối lượng ${row.name}`} size="small" min={0} max={1e10} precision={4} className="!w-28" value={row.quantity} onChange={v => onChange(row, { quantity: v ?? 0 })} /> : Number(row.quantity.toFixed(4))}</td>
    <td className="p-2 text-right">{editable ? <InputNumber aria-label={`Đơn giá ${row.name}`} size="small" min={0} max={1e12} className="!w-32" value={row.unit_price} onChange={v => onChange(row, { unit_price: v ?? 0 })} /> : money(row.unit_price)}</td>
    <td className="p-2.5 text-right font-medium tabular-nums">{money(row.total)}</td>
    <td className="p-1">{editable && (row.formula ? row.overridden && <Button type="text" size="small" aria-label={`Khôi phục công thức ${row.name}`} icon={<RotateCcw size={13} />} onClick={() => onReset(row.id)} /> : <Button type="text" size="small" aria-label={`Xóa ${row.name}`} icon={<Trash2 size={13} />} onClick={() => onRemove(row.id)} />)}</td>
  </tr>)}</>;
}

function MaterialDetails({ item, row }: { item?: Item; row: Row }) {
  const fields: [string, string | number | undefined][] = item ? [
    ['Mã', item.code], ['Tên vật tư', item.name], ['SKU', item.sku], ['Nhóm', item.category_name],
    ['Loại', item.item_type], ['Tồn kho đơn vị hiện tại', item.quantity_on_hand == null ? 'Chưa có dữ liệu tồn kho' : `${item.quantity_on_hand.toLocaleString('vi-VN')} ${item.unit}`], ['Giá trị tồn', item.inventory_value == null ? undefined : money(item.inventory_value)], ['Cảnh báo tồn', item.below_min_stock ? 'Dưới mức tồn tối thiểu' : undefined], ['Đơn vị', item.unit], ['Đơn giá kho', money(item.price)],
    ['Giá tiêu chuẩn', item.standard_cost == null ? undefined : money(item.standard_cost)],
    ['Giá bình quân', item.average_cost == null ? undefined : money(item.average_cost)],
    ['Nhà cung cấp', item.default_supplier_name], ['Liên kết nhà cung cấp', item.supplier_link],
    ['Kho mặc định', item.warehouse_name], ['Tồn tối thiểu', item.min_stock_level], ['Trạng thái', item.item_status], ['Ghi chú', item.note],
  ] : [['Tên', row.name], ['Mã', row.code || 'Nhập tay'], ['Đơn vị', row.unit], ['Ghi chú', row.note]];
  return <div className="max-h-96 overflow-y-auto text-xs font-normal text-slate-700 whitespace-normal break-words space-y-2 p-1">
    <div className="font-semibold text-sm">Thông tin kho vật liệu</div>
    {fields.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) =>
      <div key={label}><span className="text-slate-500">{label}: </span>{value}</div>)}
    {!!item?.balances?.length && <div><div className="font-medium">Tồn theo kho</div>{item.balances.map((balance, index) =>
      <div key={index} className="border-t border-slate-100 py-1">{balance.warehouse_name}: {balance.quantity_on_hand.toLocaleString('vi-VN')} {item.unit} · Giá bình quân: {money(balance.average_cost)} · Giá trị: {money(balance.inventory_value)}</div>)}</div>}
    {!!item?.specs?.length && <div><div className="font-medium mb-1">Quy cách</div>{item.specs.map((spec, index) =>
      <div key={index} className="border-t border-slate-100 py-1">{Object.entries(spec).map(([key, value]) => `${key === 'spec' ? 'Quy cách' : key === 'unit' ? 'Đơn vị' : key === 'price' ? 'Đơn giá' : key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(' · ')}</div>)}</div>}
    {!item && <div className="text-slate-400">Thành phần nhập tay hoặc chưa có trong kho.</div>}
  </div>;
}
