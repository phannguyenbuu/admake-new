declare module "emoji-picker-react" {
  import React from "react";

  interface EmojiPickerProps {
    onEmojiClick: (emojiObject: any) => void;
    theme?: "light" | "dark";
    searchPlaceholder?: string;
    width?: string | number;
    height?: string | number;
    lazyLoadEmojis?: boolean;
    searchDisabled?: boolean;
    skinTonesDisabled?: boolean;
    emojiStyle?: "native" | "apple" | "google" | "twitter" | "facebook";
    autoFocusSearch?: boolean;
  }

  const EmojiPicker: React.FC<EmojiPickerProps>;
  export default EmojiPicker;
}
