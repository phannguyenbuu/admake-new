import { Card, Tag, Divider, message } from "antd";
import dayjs from "dayjs";
import { convert } from "../../../common/utils/help.util";
import { convertAttendanceStatus } from "../../../utils/convert.util";
import { AttendanceStatus } from "../../../common/enum/attendance.enum";
import type { ClockSectionProps } from "../../../@types/attendance.type";
import { useEffect, useState } from "react";
import ImagePreviewModal from "../../modal/ImagePreviewModal";
import LocationMapModal from "../goong-map/map";
import CheckingForm from "./CheckInForm";
import { prepareImageForUpload } from "../../../utils/prepareImageForUpload";

export const ClockInSection: React.FC<ClockSectionProps> = ({
  now,
  isCheckedIn,
  isCheckingIn,
  attendance,
  onCheckIn,
  onResetCheckIn,
  setOnResetCheckIn,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Hàm xử lý khi user click nút điểm danh
  const handleImageSelected = (selectedFile: File) => {
    if (!selectedFile) {
      message.error("Vui lòng chọn ảnh trước khi điểm danh!");
      return;
    }

    // Gọi onCheckIn để xử lý điểm danh
    onCheckIn?.(selectedFile);
    // cần reset file lại khi điểm danh thành công
  };

  useEffect(() => {
    console.log("🚀 ClockInSection: onResetCheckIn", onResetCheckIn);
    if (onResetCheckIn) {
      // setFile(null);
      setOnResetCheckIn?.(false);
    }
  }, [onResetCheckIn]);

  // Component cho trạng thái đã check-in (tối ưu)
  const CheckedInStatus = () => (
    <Card className="!bg-green-50 !border-green-200 !shadow-sm !h-full !flex !flex-col">
      {/* Header với icon success */}
      <div className="!flex !items-center !justify-center !gap-3 !mb-2">
        <span className="!text-lg !font-semibold !text-green-700">
          Đã điểm danh đến
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
            {attendance?.records?.in?.time
              ? dayjs(attendance.records.in.time).format("HH:mm:ss")
              : "N/A"}
          </span>
        </div>

        {/* Trạng thái với tag */}
        {attendance?.records?.in?.status && (
          <div className="!flex !items-center !gap-1 !justify-center">
            <span className="!text-gray-600 text-[11px] md:text-sm">
              Trạng thái:
            </span>
            <Tag
              color={
                attendance?.records?.in?.status === AttendanceStatus.LATE
                  ? "red"
                  : "green"
              }
              className="!m-0 !text-[11px]"
            >
              {convertAttendanceStatus(attendance?.records?.in?.status)}
            </Tag>
          </div>
        )}

        {/* Thời gian trễ (nếu có) */}
        {attendance?.records?.in?.status === AttendanceStatus.LATE && (
          <div className="!col-span-full !text-center">
            <Tag color="red" className="!text-sm">
              Trễ {convert(attendance?.records?.in?.late)}
            </Tag>
          </div>
        )}
      </div>

      {/* Địa chỉ - Compact layout */}
      {attendance?.records?.in?.map?.address && (
        <>
          <Divider className="!my-4" />
          <div className="!text-center">
            <div className="!flex !items-start !gap-2 !justify-center !mb-2">
              <span className="!text-gray-600 !flex-shrink-0 text-xs">
                Địa chỉ:
              </span>
            </div>
            <p className="!text-gray-900 !font-medium !text-sm !leading-relaxed !max-w-md !mx-auto">
              {attendance?.records?.in?.map?.address}
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
          {attendance?.records?.in?.image && (
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
              document.getElementById("checkin-again-file-input")?.click()
            }
            className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-md border border-orange-200 hover:border-orange-300 shadow-sm"
          >
            <span className="text-xs font-medium">Điểm danh lại</span>
          </div>

          {/* Button xem bản đồ */}
          {attendance?.records?.in?.longitude &&
            attendance?.records?.in?.latitude && (
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
                document.getElementById("checkin-again-file-input")?.click()
              }
              className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded-lg px-4 py-2 cursor-pointer transition-all duration-200 border border-orange-200 hover:border-orange-300 shadow-sm"
            >
              <span className="text-xs font-medium">Điểm danh lại</span>
            </div>
          </div>

          {/* Hàng 2: Xem ảnh và vị trí */}
          {(attendance?.records?.in?.image ||
            attendance?.records?.in?.longitude) && (
            <div className="flex justify-center gap-3">
              {/* Button xem ảnh */}
              {attendance?.records?.in?.image && (
                <div
                  onClick={() => setImageModalOpen(true)}
                  className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm"
                >
                  <span className="text-xs font-medium">Xem ảnh</span>
                </div>
              )}

              {/* Button xem bản đồ */}
              {attendance?.records?.in?.longitude &&
                attendance?.records?.in?.latitude && (
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
          <CheckingForm
            now={now}
            handleImageSelected={handleImageSelected}
            isCheckingIn={isCheckingIn}
            type="in"
          />
        ) : (
          <CheckedInStatus />
        )}
      </div>

      {/* Hidden File Input cho nút "Điểm danh lại" */}
      <input
        id="checkin-again-file-input"
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const selectedFile = e.target.files?.[0] || null;
          if (!selectedFile) return;

          const res = await prepareImageForUpload(selectedFile, { maxMB: 5 });
          console.log("🚀 ClockInSection: res", res);
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
        imageUrl={attendance?.records?.in?.image}
        title="Ảnh điểm danh đến"
        width={600}
        maxHeight={480}
      />

      {/* Location Map Modal */}
      <LocationMapModal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        lat={attendance?.records?.in?.latitude || 0}
        lng={attendance?.records?.in?.longitude || 0}
        title="Vị trí điểm danh đến"
        userName="Nhân viên"
        height={window.innerWidth < 768 ? 350 : 500}
        zoom={16}
      />
    </>
  );
};
