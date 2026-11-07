import { memo, useEffect, useRef, useState } from 'react';
import { Input } from 'antd';

/** Keep keystrokes local; publish only after a pause or leaving the field. */
export const BufferedTextArea = memo(function BufferedTextArea({ value, label, disabled, maxLength, maxRows, placeholder, onCommit, onFocus }: {
  value: string; label: string; disabled?: boolean; maxLength: number; maxRows: number; placeholder?: string;
  onCommit: (text: string) => boolean | void; onFocus?: () => void;
}) {
  const [text, setText] = useState(value);
  const draft = useRef(value);
  const accepted = useRef(value);
  const external = useRef(value);
  const composing = useRef(false);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onCommit);
  callback.current = onCommit;
  external.current = value;
  useEffect(() => {
    accepted.current = value;
    if (!dirty.current) { draft.current = value; setText(value); }
  }, [value]);
  useEffect(() => () => { clearTimeout(timer.current); }, []);
  const flush = () => {
    clearTimeout(timer.current);
    if (!dirty.current || composing.current) return;
    const next = draft.current;
    dirty.current = false;
    if (next === accepted.current) return;
    if (callback.current(next) === false) {
      draft.current = external.current; accepted.current = external.current; setText(external.current);
    } else accepted.current = next;
  };
  const schedule = () => {
    clearTimeout(timer.current);
    if (!composing.current) timer.current = setTimeout(flush, 500);
  };
  return <Input.TextArea value={text} aria-label={label} disabled={disabled} maxLength={maxLength}
    placeholder={placeholder} autoSize={{ minRows: 1, maxRows }} onFocus={onFocus}
    onChange={event => { draft.current = event.target.value; dirty.current = true; setText(event.target.value); schedule(); }}
    onCompositionStart={() => { composing.current = true; clearTimeout(timer.current); }}
    onCompositionEnd={() => { composing.current = false; schedule(); }}
    onBlur={() => { composing.current = false; flush(); }}
    onKeyDown={event => { if (event.key === 'Escape') { composing.current = false; flush(); } }} />;
});
