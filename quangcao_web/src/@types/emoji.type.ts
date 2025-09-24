export interface EmojiButtonProps {
  onClick: () => void;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  className?: string;
  children?: React.ReactNode;
}

export interface EmojiPickerModalProps {
  open: boolean;
  onCancel: () => void;
  onEmojiSelect: (emojiObject: any) => void;
  title?: string;
  width?: number;
  height?: number;
  searchPlaceholder?: string;
}
