import React, { useRef } from "react";
import dayjs from "dayjs";
import { Card, Button, message } from "antd";
import { prepareImageForUpload } from "../../../utils/prepareImageForUpload";

type CheckingFormProps = {
  now: dayjs.Dayjs;
  handleImageSelected: (file: File) => void;
  isCheckingIn?: boolean;
  type: "in" | "out";
};

const CheckingForm: React.FC<CheckingFormProps> = ({
  now,
  handleImageSelected,
  isCheckingIn = false,
  type,
}) => {
  //   const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (isCheckingIn) return; // Disable khi đang loading
    fileRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (!selectedFile) return;

    const res = await prepareImageForUpload(selectedFile, { maxMB: 2 });
    if (!res.ok) {
      message.error(res.error);
      e.currentTarget.value = ""; // cho phép chọn lại cùng file
      return;
    }

    // Ok => gửi file đã qua validate/nén
    handleImageSelected(res.file);
    e.currentTarget.value = "";
  };

  return (
    <Card className="!text-center !border-blue-200 !shadow-sm !h-full !flex !flex-col">
      {/* Header */}
      <div className="!flex !items-center !justify-center !gap-2 !mb-4">
        <div className="!w-3 !h-3 !bg-blue-500 !rounded-full" />
        <span className="!text-lg !font-semibold !text-gray-800">
          Điểm danh đến
        </span>
      </div>

      {/* Current Time */}
      <div className="!text-3xl sm:!text-4xl !font-bold !text-blue-600 !mb-6">
        {now.format("HH:mm:ss")}
      </div>

      {/* Actions */}
      <div className="!flex !flex-col !gap-3 !items-center">
        {/* Nút chọn ảnh - chỉ hiện khi chưa có ảnh */}
        <Button
          type="default"
          size="large"
          onClick={openPicker}
          disabled={isCheckingIn}
          className="!border-blue-300 !text-blue-600 !bg-blue-50 hover:!bg-blue-100"
        >
          Điểm danh
        </Button>

        {/* Input file ẩn */}
        <input
          ref={fileRef}
          id={`checkin-${type}-file-input`}
          type="file"
          accept="image/*"
          //   capture="environment"
          onChange={onFileChange}
          className="hidden"
          style={{
            display: "none",
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>
    </Card>
  );
};

export default CheckingForm;
