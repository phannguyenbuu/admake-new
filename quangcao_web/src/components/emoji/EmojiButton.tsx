import { Button } from "antd";
import type { EmojiButtonProps } from "../../@types/emoji.type";

export default function EmojiButton({
  onClick,
  disabled = false,
  size = "small",
  className = "",
  children = "😊 Icon",
}: EmojiButtonProps) {
  return (
    <Button
      type="dashed"
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={`!rounded-lg !border-2 !border-dashed !border-yellow-300 hover:!border-yellow-500 !text-yellow-600 hover:!text-yellow-700 !font-medium ${className}`}
    >
      {children}
    </Button>
  );
}
