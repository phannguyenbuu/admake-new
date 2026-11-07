/** UI uses millimetres; the existing quotation API stores centimetres. */
export function parsePromptDimensions(text: string): number[] | undefined {
  const token = String.raw`\d+(?:[.,]\d+)?\s*(?:(?:mm|cm)|m(?:\d{1,2}(?!\d))?)?`;
  const match = text.toLowerCase().match(new RegExp(`(${token})\\s*[x×*]\\s*(${token})(?:\\s*[x×*]\\s*(${token}))?`, "i"));
  if (!match) return;
  const parts = match.slice(1).filter(Boolean).map(part => part.replace(/\s/g, ""));
  const units = parts.map(part => part.includes("mm") ? "mm" : part.includes("cm") ? "cm" : part.includes("m") ? "m" : "").filter(Boolean);
  const sharedUnit = units[units.length - 1] || "mm";
  const values = parts.map(part => {
    const shorthand = part.match(/^(\d+)m(\d{1,2})$/);
    if (shorthand) return (Number(shorthand[1]) + Number(`0.${shorthand[2]}`)) * 100;
    const value = Number(part.replace(/mm|cm|m/g, "").replace(",", "."));
    const unit = part.endsWith("mm") ? "mm" : part.endsWith("cm") ? "cm" : part.endsWith("m") ? "m" : sharedUnit;
    return value * (unit === "m" ? 100 : unit === "mm" ? 0.1 : 1);
  });
  return values.every(value => Number.isFinite(value) && value > 0 && value <= 100000) ? values : undefined;
}
