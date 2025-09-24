import type { IPage } from "../../../@types/common.type";
import { message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState, useCallback } from "react";
import { useInfo } from "../../../common/hooks/info.hook";
import {
  useCheckAttendance,
  useGetAttendance,
} from "../../../common/hooks/attendance.hook";
import {
  getAddressFromCoordinates,
  getLocation,
} from "../../../common/utils/help.util";
import { HeaderSection } from "../../../components/dashboard/work-points/HeaderSection";
import { ClockInSection } from "../../../components/dashboard/work-points/ClockInSection";
import { ClockOutSection } from "../../../components/dashboard/work-points/ClockOutSection";

export const WorkPointsPage: IPage["Component"] = () => {
  const { data: info } = useInfo();
  const {
    data: attendance,
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
  } = useGetAttendance();
  const [now, setNow] = useState(dayjs());
  const [config, setConfig] = useState({
    isCheckedIn: false,
  });
  const [address, setAddress] = useState<{
    in: string;
    out: string;
  }>({ in: "", out: "" });

  const [addressLoading, setAddressLoading] = useState<{
    in: boolean;
    out: boolean;
  }>({ in: false, out: false });

  const [resetCheckIn, setResetCheckIn] = useState(false);
  const [resetCheckOut, setResetCheckOut] = useState(false);

  const { mutate: checkIn, isPending: isCheckingIn } = useCheckAttendance();

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user has already checked in/out today
  useEffect(() => {
    if (attendance?.records?.in?.time) {
      setConfig((prev) => ({ ...prev, isCheckedIn: true }));
      // Get address from coordinates for check-in
      if (attendance.records.in.latitude && attendance.records.in.longitude) {
        setAddressLoading((p) => ({ ...p, in: true }));
        getAddressFromCoordinates(
          attendance.records.in.latitude,
          attendance.records.in.longitude
        )
          .then((addr) => setAddress((prev) => ({ ...prev, in: addr })))
          .finally(() => setAddressLoading((p) => ({ ...p, in: false })));
      }
    }

    if (attendance?.records?.out?.time) {
      // Get address from coordinates for check-out
      if (attendance.records.out.latitude && attendance.records.out.longitude) {
        setAddressLoading((p) => ({ ...p, out: true }));
        getAddressFromCoordinates(
          attendance.records.out.latitude,
          attendance.records.out.longitude
        )
          .then((addr) => setAddress((prev) => ({ ...prev, out: addr })))
          .finally(() => setAddressLoading((p) => ({ ...p, out: false })));
      }
    }
  }, [attendance]);

  // Perform actual check-in/out
  const performCheck = useCallback(
    async (
      type: "in" | "out",
      note: string = "",
      imageFile: File | null = null,
      location: { latitude: number; longitude: number }
    ) => {
      try {
        // Build FormData và append ảnh nếu có
        const formData = new FormData();
        formData.append("type", type);
        formData.append("note", note || "");

        // Sử dụng location đã được truyền vào
        formData.append("longitude", String(location.longitude));
        formData.append("latitude", String(location.latitude));

        if (imageFile) {
          // Thêm ảnh vào FormData (bắt buộc phải có)
          formData.append(
            "image",
            imageFile,
            imageFile.name || (type === "in" ? "checkin.jpg" : "checkout.jpg")
          );
        } else {
          // Nếu không có ảnh thì báo lỗi và dừng lại
          message.error("Bắt buộc phải có ảnh để điểm danh!");
          return;
        }

        checkIn(formData, {
          onSuccess: () => {
            message.success(
              type === "in"
                ? "Điểm danh đến thành công!"
                : "Điểm danh về thành công!"
            );
            refetchAttendance();
            if (type === "in") {
              setResetCheckIn(true);
            } else {
              setResetCheckOut(true);
            }
          },
          onError: () => {
            message.error("Có lỗi xảy ra khi điểm danh!");
          },
        });
      } catch (error) {
        message.error("Có lỗi xảy ra khi điểm danh!");
      }
    },
    [checkIn, refetchAttendance]
  );

  // Handle check-in/out directly
  const handleCheck = useCallback(
    async (type: "in" | "out", selectedFile?: File) => {
      if (!selectedFile) {
        message.info("Vui lòng chọn ảnh trước khi điểm danh!");
        return;
      }

      // Bước 1: Kiểm tra và lấy vị trí trước
      let location;
      try {
        location = await getLocation();
        if (!location?.latitude || !location?.longitude) {
          message.error(
            "Không thể lấy vị trí hiện tại! Vui lòng cho phép truy cập vị trí."
          );
          return;
        }
      } catch (error) {
        message.error(
          "Không thể lấy vị trí hiện tại! Vui lòng kiểm tra quyền truy cập vị trí."
        );
        return;
      }

      // Bước 2: Lấy địa chỉ hiện tại
      let currentAddress = type === "in" ? address.in : address.out;

      if (!currentAddress && !addressLoading[type]) {
        try {
          setAddressLoading((p) => ({ ...p, [type]: true }));
          const addr = await getAddressFromCoordinates(
            location.latitude,
            location.longitude
          );
          currentAddress = addr;
          setAddress((prev) => ({ ...prev, [type]: addr }));
          setAddressLoading((p) => ({ ...p, [type]: false }));
        } catch (error) {
          currentAddress = "Không thể xác định địa chỉ";
          setAddressLoading((p) => ({ ...p, [type]: false }));
        }
      }

      // Bước 3: Thực hiện điểm danh
      try {
        await performCheck(type, currentAddress || "", selectedFile, location);
      } catch (error) {
        console.error("Lỗi khi thực hiện điểm danh:", error);
        message.error("Có lỗi xảy ra khi điểm danh!");
      }
    },
    [address, addressLoading, performCheck]
  );

  // Show loading while attendance data is being fetched
  if (isLoadingAttendance) {
    return (
      <div className="!w-full !min-h-screen !flex !items-center !justify-center">
        <div className="!text-center">
          <div className="!animate-spin !rounded-full !h-12 !w-12 !border-b-2 !border-blue-600 !mx-auto !mb-4"></div>
          <p className="!text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="!w-full !min-h-screen !flex !flex-col !p-4">
      {/* Single Main Card */}
      <div className="!bg-white !rounded-2xl !shadow-lg !p-3">
        {/* Header and User Info Section */}
        <HeaderSection attendanceDate={attendance?.date} userInfo={info} />

        {/* Clock in section */}
        <ClockInSection
          now={now}
          isCheckedIn={config.isCheckedIn}
          isCheckingIn={isCheckingIn}
          attendance={attendance}
          onResetCheckIn={resetCheckIn}
          setOnResetCheckIn={setResetCheckIn}
          onCheckIn={(file) => handleCheck("in", file)}
        />

        {/* Divider */}
        <div className="!border-t !border-gray-200 !my-6"></div>

        {/* Clock out section */}
        <ClockOutSection
          now={now}
          isCheckedIn={config.isCheckedIn}
          isCheckingIn={isCheckingIn}
          attendance={attendance}
          onCheckOut={(file) => handleCheck("out", file)}
          onResetCheckOut={resetCheckOut}
          setOnResetCheckOut={setResetCheckOut}
        />
      </div>
    </div>
  );
};

export const loader = async () => {
  return null;
};
