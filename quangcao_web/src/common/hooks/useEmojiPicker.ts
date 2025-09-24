import { useState, useCallback } from "react";

interface UseEmojiPickerReturn {
  showEmojiPicker: boolean;
  openEmojiPicker: () => void;
  closeEmojiPicker: () => void;
  toggleEmojiPicker: () => void;
}

export function useEmojiPicker(): UseEmojiPickerReturn {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const openEmojiPicker = useCallback(() => {
    setShowEmojiPicker(true);
  }, []);

  const closeEmojiPicker = useCallback(() => {
    setShowEmojiPicker(false);
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker((prev) => !prev);
  }, []);

  return {
    showEmojiPicker,
    openEmojiPicker,
    closeEmojiPicker,
    toggleEmojiPicker,
  };
}
