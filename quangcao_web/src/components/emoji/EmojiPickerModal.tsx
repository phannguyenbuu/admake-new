import { Modal } from "antd";
import { SmileOutlined } from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import "../dashboard/work-tables/css/emoji-picker.css";
import type { EmojiPickerModalProps } from "../../@types/emoji.type";

export default function EmojiPickerModal({
  open,
  onCancel,
  onEmojiSelect,
  title = "Chọn Emoji",
  width = 450,
  height = 500,
  searchPlaceholder = "Tìm kiếm biểu tượng cảm xúc",
}: EmojiPickerModalProps) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <SmileOutlined className="text-yellow-500" />
          <span>{title}</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={width}
      centered
      className="emoji-picker-modal"
      bodyStyle={{ padding: 0 }}
      destroyOnClose={true}
    >
      <div className="emoji-picker-container">
        <EmojiPicker
          onEmojiClick={onEmojiSelect}
          theme="dark"
          searchPlaceholder={searchPlaceholder}
          width="100%"
          height={height}
          lazyLoadEmojis={true}
          searchDisabled={false}
          skinTonesDisabled={false}
          emojiStyle="apple"
          autoFocusSearch={false}
        />
      </div>
    </Modal>
  );
}
