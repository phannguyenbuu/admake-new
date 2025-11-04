import { Card, Tag, Divider, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { convert } from "../../../common/utils/help.util";
import type { ClockSectionProps } from "../../../@types/attendance.type";
import { convertAttendanceStatus } from "../../../utils/convert.util";
import { AttendanceStatus } from "../../../common/enum/attendance.enum";
import { useEffect, useState } from "react";
import ImagePreviewModal from "../../modal/ImagePreviewModal";
import LocationMapModal from "../goong-map/map";
import CheckInForm from "./CheckInForm";
import { prepareImageForUpload } from "../../../utils/prepareImageForUpload";

export const ClockOutSection: React.FC<
  ClockSectionProps & {
    onCheckOut?: (file: File) => void;
    onResetCheckOut?: boolean;
    setOnResetCheckOut?: (value: boolean) => void;
    isCheckingIn?: boolean;
  }
> = ({
  now,
  isCheckedIn,
  attendance,
  onCheckOut,
  onResetCheckOut,
  setOnResetCheckOut,
  isCheckingIn,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Hàm xử lý khi user click nút điểm danh
  const handleImageSelected = (selectedFile: File) => {
    if (!selectedFile) {
      message.error("Vui lòng chọn ảnh trước khi điểm danh!");
      return;
    }

    // Gọi onCheckOut để xử lý điểm danh
    onCheckOut?.(selectedFile);
    // cần reset file lại khi điểm danh thành công
  };

  useEffect(() => {
    console.log("🚀 ClockOutSection: onResetCheckOut", onResetCheckOut);
    if (onResetCheckOut) {
      // setFile(null);
      setOnResetCheckOut?.(false);
    }
  }, [onResetCheckOut]);

  // Component cho trạng thái chưa check-in
  const NotCheckedIn = () => (
    <Card className="!text-center !shadow-sm">
      <div className="!flex !items-center !justify-center !gap-2 !mb-4">
        <div className="!w-3 !h-3 !bg-gray-400 !rounded-full"></div>
        <span className="!text-lg !font-medium !text-gray-600">
          Điểm danh về
        </span>
      </div>
      <div className="!text-gray-500 !text-base !py-4 !flex !items-center !justify-center !gap-2">
        <ExclamationCircleOutlined />
        <span>Chưa điểm danh đến</span>
      </div>
    </Card>
  );

  // Component cho trạng thái đã check-out
  const CheckedOutStatus = () => (
    <Card className="!bg-green-50 !border-green-200 !shadow-sm !h-full !flex !flex-col">
      {/* Header với icon success */}
      <div className="!flex !items-center !justify-center !gap-3 !mb-2">
        <span className="!text-lg !font-semibold !text-green-700">
          Đã điểm danh về
        </span>
      </div>

      {/* Thông tin chính - Layout responsive */}
      <div className="!grid !grid-cols-2 !gap-2 !text-sm">
        {/* Thời gian */}
        <div className="!flex !items-center !gap-1 !justify-center ">
          <span className="!text-gray-600 text-[11px] md:text-sm">
            Thời gian:
          </span>
          <span className="!font-semibold !text-gray-900 text-[11px] md:text-sm">
            {attendance?.records?.out?.time
              ? dayjs(attendance.records.out.time).format("HH:mm:ss")
              : "N/A"}
          </span>
        </div>

        {/* Trạng thái với tag */}
        {attendance?.records?.out?.status && (
          <div className="!flex !items-center !gap-1 !justify-center">
            <span className="!text-gray-600 text-[11px] md:text-sm">
              Trạng thái:
            </span>
            <Tag
              color={
                attendance?.records?.out?.status ===
                AttendanceStatus.EARLY_LEAVE
                  ? "orange"
                  : attendance?.records?.out?.status ===
                    AttendanceStatus.OVERTIME
                  ? "blue"
                  : "green"
              }
              className="!m-0 !text-[11px] md:text-sm"
            >
              {convertAttendanceStatus(attendance?.records?.out?.status)}
            </Tag>
          </div>
        )}

        {/* Thời gian về sớm */}
        {attendance?.records?.out?.status === AttendanceStatus.EARLY_LEAVE &&
          attendance?.records?.out?.early_leave && (
            <div className="!col-span-full !text-center">
              <Tag color="orange" className="!text-sm">
                Về sớm {convert(attendance.records.out.early_leave)}
              </Tag>
            </div>
          )}

        {/* Thời gian tăng ca */}
        {attendance?.records?.out?.status === AttendanceStatus.OVERTIME &&
          attendance?.records?.out?.overtime && (
            <div className="!col-span-full !text-center">
              <Tag color="blue" className="!text-sm">
                Tăng ca {convert(attendance.records.out.overtime)}
              </Tag>
            </div>
          )}
      </div>

      {/* Địa chỉ - Compact layout */}
      {attendance?.records?.out?.map?.address && (
        <>
          <Divider className="!my-4" />
          <div className="!text-center">
            <div className="!flex !items-start !gap-2 !justify-center !mb-2">
              <span className="!text-gray-600 !flex-shrink-0 text-xs">
                Địa chỉ:
              </span>
            </div>
            <p className="!text-gray-900 !font-medium !text-sm !leading-relaxed !max-w-md !mx-auto">
              {attendance?.records?.out?.map?.address}
            </p>
          </div>
        </>
      )}

      {/* Action Buttons - Điểm danh lại, Xem ảnh và bản đồ */}
      <>
        <Divider className="!my-3" />
        {/* Desktop: 3 nút ngang */}
        <div className="hidden sm:flex !justify-center !gap-2 !px-4">
          {/* Button xem ảnh */}
          {attendance?.records?.out?.image && (
            <div
              onClick={() => setImageModalOpen(true)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md border border-blue-200 hover:border-blue-300 shadow-sm"
            >
              <span className="text-xs font-medium">Xem ảnh</span>
            </div>
          )}
          {/* {!file ? ( */}
          <div
            onClick={() =>
              document.getElementById("checkout-again-file-input")?.click()
            }
            className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md border border-orange-200 hover:border-orange-300 shadow-sm"
          >
            <span className="text-xs font-medium">Điểm danh lại</span>
          </div>

          {/* Button xem bản đồ */}
          {attendance?.records?.out?.longitude &&
            attendance?.records?.out?.latitude && (
              <div
                onClick={() => setMapModalOpen(true)}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md border border-green-200 hover:border-green-300 shadow-sm"
              >
                <span className="text-xs font-medium">Xem vị trí</span>
              </div>
            )}
        </div>

        {/* Mobile: 2 hàng - Điểm danh lại trên, Xem ảnh/vị trí dưới */}
        <div className="flex sm:hidden flex-col gap-2 px-3">
          {/* Hàng 1: Nút điểm danh lại */}
          {/* {!file ? ( */}
          <div className="flex justify-center">
            <div
              onClick={() =>
                document.getElementById("checkout-again-file-input")?.click()
              }
              className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded-lg px-4 py-2 cursor-pointer transition-all duration-200 border border-orange-200 hover:border-orange-300 shadow-sm"
            >
              <span className="text-xs font-medium">Điểm danh lại</span>
            </div>
          </div>

          {/* Hàng 2: Xem ảnh và vị trí */}
          {(attendance?.records?.out?.image ||
            attendance?.records?.out?.longitude) && (
            <div className="flex justify-center gap-3">
              {/* Button xem ảnh */}
              {attendance?.records?.out?.image && (
                <div
                  onClick={() => setImageModalOpen(true)}
                  className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm"
                >
                  <span className="text-xs font-medium">Xem ảnh</span>
                </div>
              )}

              {/* Button xem bản đồ */}
              {attendance?.records?.out?.longitude &&
                attendance?.records?.out?.latitude && (
                  <div
                    onClick={() => setMapModalOpen(true)}
                    className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 border border-green-200 hover:border-green-300 shadow-sm"
                  >
                    <span className="text-xs font-medium">Xem vị trí</span>
                  </div>
                )}
            </div>
          )}
        </div>
      </>
    </Card>
  );

  return (
    <>
      <div className="!w-full !max-w-2xl !mx-auto !p-3">
        {!isCheckedIn ? (
          <NotCheckedIn />
        ) : attendance?.records?.out?.time ? (
          <CheckedOutStatus />
        ) : (
          <CheckInForm
            now={now}
            handleImageSelected={handleImageSelected}
            isCheckingIn={isCheckingIn}
            type="out"
          />
        )}
      </div>

      {/* Hidden File Input cho nút "Điểm danh lại" */}
      <input
        id="checkout-again-file-input"
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const selectedFile = e.target.files?.[0] || null;
          if (!selectedFile) return;

          const res = await prepareImageForUpload(selectedFile, { maxMB: 5 });
          console.log("🚀 ClockOutSection: res", res);
          if (!res.ok) {
            message.error(res.error);
            e.currentTarget.value = ""; // cho phép chọn lại cùng file
            return;
          }

          // Ok => gửi file đã qua validate/nén
          handleImageSelected(res.file);
          e.currentTarget.value = "";
        }}
        style={{ display: "none" }}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        imageUrl={attendance?.records?.out?.image}
        title="Ảnh điểm danh về"
        width={600}
        maxHeight={480}
      />

      {/* Location Map Modal */}
      <LocationMapModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        lat={attendance?.records?.out?.latitude || 0}
        lng={attendance?.records?.out?.longitude || 0}
        title="Vị trí điểm danh về"
        userName="Nhân viên"
        height={window.innerWidth < 768 ? 350 : 500}
        zoom={16}
      />
    </>
  );
};
