import React, { useRef, useCallback, useEffect, useState } from "react";

/* ─── Color palette ──────────────────────────────────────────────────────────── */
const COLORS = [
  "#000000", "#434343", "#666666", "#999999",
  "#e53935", "#d81b60", "#8e24aa", "#5e35b1",
  "#1e88e5", "#039be5", "#00897b", "#43a047",
  "#f4511e", "#fb8c00", "#fdd835", "#c0ca33",
];

/* ─── Toolbar button ─────────────────────────────────────────────────────────── */
interface TBtnProps {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const TBtn: React.FC<TBtnProps> = ({ title, active, onClick, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: active ? 700 : 400,
      color: active ? "#0d9488" : "#475569",
      background: active ? "#e0f2f1" : "transparent",
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

/* ─── Main editor ────────────────────────────────────────────────────────────── */
interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  onPasteImage?: (file: File) => Promise<void>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Mô tả chi tiết về công việc cần thực hiện...",
  onPasteImage,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [showColors, setShowColors] = useState(false);
  const colorBtnRef = useRef<HTMLDivElement>(null);

  /* Sync external value → editor (only when value changes externally) */
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && value !== undefined) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  /* Emit changes */
  const emitChange = useCallback(() => {
    if (editorRef.current && onChange) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  /* Execute formatting command */
  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  }, [emitChange]);

  /* Handle paste — strip formatting from text, support image paste */
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/") && onPasteImage) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await onPasteImage(file);
            return;
          }
        }
      }
    }
    // Allow normal paste (keeps formatting from clipboard)
  }, [onPasteImage]);

  /* Close color picker on click outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorBtnRef.current && !colorBtnRef.current.contains(e.target as Node)) {
        setShowColors(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>" || value.replace(/<[^>]*>/g, "").trim() === "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #d1d5db",
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        height: "100%",
        width: "100%",
      }}
      onFocus={() => {
        const el = editorRef.current?.parentElement?.parentElement;
        if (el) {
          el.style.borderColor = "#06b6d4";
          el.style.boxShadow = "0 0 0 2px rgba(6,182,212,0.15)";
        }
      }}
      onBlur={() => {
        const el = editorRef.current?.parentElement?.parentElement;
        if (el) {
          el.style.borderColor = "#d1d5db";
          el.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
        }
      }}
    >
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 8px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <TBtn title="Đậm (Ctrl+B)" onClick={() => exec("bold")}>
          <strong>B</strong>
        </TBtn>
        <TBtn title="Nghiêng (Ctrl+I)" onClick={() => exec("italic")}>
          <em>I</em>
        </TBtn>
        <TBtn title="Gạch chân (Ctrl+U)" onClick={() => exec("underline")}>
          <span style={{ textDecoration: "underline" }}>U</span>
        </TBtn>
        <TBtn title="Gạch ngang" onClick={() => exec("strikeThrough")}>
          <span style={{ textDecoration: "line-through" }}>S</span>
        </TBtn>

        <div
          style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 4px" }}
        />

        {/* Color picker */}
        <div ref={colorBtnRef} style={{ position: "relative" }}>
          <TBtn
            title="Màu chữ"
            onClick={() => setShowColors((v) => !v)}
          >
            <span style={{ fontSize: 15 }}>A</span>
            <span
              style={{
                display: "block",
                width: 14,
                height: 3,
                borderRadius: 1,
                background: "linear-gradient(90deg, #e53935, #1e88e5, #43a047)",
                marginTop: 1,
              }}
            />
          </TBtn>
          {showColors && (
            <div
              style={{
                position: "absolute",
                top: 32,
                left: 0,
                zIndex: 100,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 8,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                width: 140,
              }}
            >
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec("foreColor", c);
                    setShowColors(false);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "2px solid #e2e8f0",
                    background: c,
                    cursor: "pointer",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.15)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
                />
              ))}
            </div>
          )}
        </div>

        <TBtn title="Highlight" onClick={() => exec("hiliteColor", "#fef08a")}>
          <span style={{ background: "#fef08a", padding: "0 3px", borderRadius: 2, fontSize: 12, fontWeight: 600 }}>H</span>
        </TBtn>

        <div
          style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 4px" }}
        />

        <TBtn title="Xoá định dạng" onClick={() => exec("removeFormat")}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>✕</span>
        </TBtn>
      </div>

      {/* ── Editable area ───────────────────────────────────── */}
      <div style={{ position: "relative", flex: 1, minHeight: 120 }}>
        {isEmpty && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              color: "#9ca3af",
              fontSize: 13,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={handlePaste}
          style={{
            padding: "10px 14px",
            minHeight: 120,
            height: "100%",
            outline: "none",
            fontSize: 13,
            lineHeight: 1.7,
            color: "#1e293b",
            overflowY: "auto",
            wordBreak: "break-word",
          }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
