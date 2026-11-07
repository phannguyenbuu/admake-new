import { useEffect, useState } from "react";
import { Input } from "antd";

export function MoneyInput({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(current => Number(current || 0) === value ? current : String(value));
  }, [value]);
  const formatted = Number(text || 0).toLocaleString("vi-VN");
  return <div className="mt-1 min-w-0">
    <Input aria-label={label} inputMode="numeric" autoComplete="off" value={text} suffix={<span className="text-slate-400 text-xs">VND</span>}
      onFocus={event => { if (text === "0") event.target.select(); }}
      onBlur={() => setText(String(value))}
      onChange={event => {
        const digits = event.target.value.replace(/[^0-9]/g, "");
        const amount = Number(digits || 0);
        if (amount > 1e12) return;
        setText(digits); onChange(amount);
      }} />
    <div className="mt-1 text-xs tabular-nums text-slate-400" aria-hidden="true">
      {formatted.split(/(\.)/).map((part, index) => <span key={index} className={part === "." ? "text-slate-300" : undefined}>{part}</span>)}
      <span className="ml-1 text-slate-300">₫</span>
    </div>
  </div>;
}
