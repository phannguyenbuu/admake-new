import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { message, Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { ClockInSection } from "../work-points/ClockInSection";
import { ClockOutSection } from "../work-points/ClockOutSection";
import { useCheckTask } from "../../../common/hooks/work-space.hook";
import { useGetAttendance } from "../../../common/hooks/attendance.hook";
import {
  getAddressFromCoordinates,
  getLocation,
} from "../../../common/utils/help.util";
import {
  COMMENT_QUERY_KEY,
  useGetCommentById,
} from "../../../common/hooks/comment.hook";

const { Text } = Typography;

interface CheckInOutProps {
  taskId?: string;
}

interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: dayjs.Dayjs | null;
  checkOutTime: dayjs.Dayjs | null;
}

interface AddressState {
  checkIn: string;
  checkOut: string;
}

interface AddressLoadingState {
  in: boolean;
  out: boolean;
}

export default function CheckInOut({ taskId }: CheckInOutProps) {
  const queryClient = useQueryClient();
  const { refetch: refetchComment } = useGetCommentById(taskId || "");
  const [attendance, setAttendance] = useState<AttendanceState>({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null,
  });
  const [addresses, setAddresses] = useState<AddressState>({
    checkIn: "",
    checkOut: "",
  });
  const [addressLoading, setAddressLoading] = useState<AddressLoadingState>({
    in: false,
    out: false,
  });
  const [currentTime, setCurrentTime] = useState(dayjs());

  // State mới để reset form
  const [resetCheckIn, setResetCheckIn] = useState(false);
  const [resetCheckOut, setResetCheckOut] = useState(false);

  const {
    data: attendanceData,
    refetch: refetchAttendance,
    isLoading: isLoadingAttendance,
  } = useGetAttendance();
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckTask();

  // Timer để cập nhật thời gian hiện tại mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Convert coordinates thành địa chỉ
  const convertCoordinatesToAddress = useCallback(async () => {
    if (!attendanceData?.records) return;

    // Xử lý địa chỉ checkin
    if (
      attendanceData.records.in?.longitude &&
      attendanceData.records.in?.latitude
    ) {
      try {
        setAddressLoading((prev) => ({ ...prev, in: true }));
        const address = await getAddressFromCoordinates(
          attendanceData.records.in.latitude,
          attendanceData.records.in.longitude
        );
        setAddresses((prev) => ({ ...prev, checkIn: address }));
      } catch (error) {
        setAddresses((prev) => ({
          ...prev,
          checkIn: "Không xác định được địa chỉ",
        }));
      } finally {
        setAddressLoading((prev) => ({ ...prev, in: false }));
      }
    } else {
      setAddresses((prev) => ({ ...prev, checkIn: "" }));
    }

    // Xử lý địa chỉ checkout
    if (
      attendanceData.records.out?.longitude &&
      attendanceData.records.out?.latitude
    ) {
      try {
        setAddressLoading((prev) => ({ ...prev, out: true }));
        const address = await getAddressFromCoordinates(
          attendanceData.records.out.latitude,
          attendanceData.records.out.longitude
        );
        setAddresses((prev) => ({ ...prev, checkOut: address }));
      } catch (error) {
        setAddresses((prev) => ({
          ...prev,
          checkOut: "Không xác định được địa chỉ",
        }));
      } finally {
        setAddressLoading((prev) => ({ ...prev, out: false }));
      }
    } else {
      setAddresses((prev) => ({ ...prev, checkOut: "" }));
    }
  }, [attendanceData]);

  useEffect(() => {
    convertCoordinatesToAddress();
  }, [convertCoordinatesToAddress]);

  // Cập nhật trạng thái attendance từ API data
  useEffect(() => {
    if (attendanceData?.records?.in?.time) {
      setAttendance((prev) => ({
        ...prev,
        isCheckedIn: true,
        checkInTime: dayjs(attendanceData.records.in.time),
      }));
    } else {
      setAttendance((prev) => ({
        ...prev,
        isCheckedIn: false,
        checkInTime: null,
      }));
    }

    if (attendanceData?.records?.out?.time) {
      setAttendance((prev) => ({
        ...prev,
        checkOutTime: dayjs(attendanceData.records.out.time),
      }));
    } else {
      setAttendance((prev) => ({
        ...prev,
        checkOutTime: null,
      }));
    }
  }, [attendanceData]);

  const resetStates = useCallback(() => {
    setAttendance({
      isCheckedIn: false,
      checkInTime: null,
      checkOutTime: null,
    });
    setAddresses({ checkIn: "", checkOut: "" });
  }, []);

  const performCheck = useCallback(
    async (
      type: "in" | "out",
      note: string,
      imageFile: File,
      location?: { longitude: number; latitude: number }
    ) => {
      if (!taskId) {
        message.error("Không tìm thấy task ID!");
        return;
      }

      // Build FormData và append ảnh nếu có
      const formData = new FormData();
      formData.append("type", type);
      formData.append("note", note || "");

      if (location?.longitude != null)
        formData.append("longitude", String(location.longitude));
      if (location?.latitude != null)
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

      checkIn(
        { body: formData, id: taskId },
        {
          onSuccess: async () => {
            message.success(
              type === "in"
                ? "Điểm danh đến thành công!"
                : "Điểm danh về thành công!"
            );

            // Reset state tương ứng
            if (type === "in") {
              setResetCheckIn(true);
            } else {
              setResetCheckOut(true);
            }

            await refetchAttendance();
            // chờ backend đồng bộ ghi log bình luận rồi mới refetch
            await new Promise((r) => setTimeout(r, 500));
            // Refetch comment theo đúng taskId (nếu có query khớp)
            await refetchComment();
            // Đồng thời invalidate tất cả query comment liên quan taskId để các biến thể dto cũng refetch
            queryClient.invalidateQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown as any[];
                return (
                  key &&
                  key[0] === COMMENT_QUERY_KEY &&
                  key.includes("comment") &&
                  key.includes(taskId)
                );
              },
            });
          },
          onError: () => {
            message.error(
              type === "in"
                ? "Có lỗi khi điểm danh đến!"
                : "Có lỗi khi điểm danh về!"
            );
          },
        }
      );
    },
    [
      taskId,
      checkIn,
      refetchAttendance,
      refetchComment,
      queryClient,
      resetStates,
    ]
  );

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
      let currentAddress =
        type === "in" ? addresses.checkIn : addresses.checkOut;

      if (!currentAddress && !addressLoading[type]) {
        try {
          setAddressLoading((p) => ({ ...p, [type]: true }));
          const addr = await getAddressFromCoordinates(
            location.latitude,
            location.longitude
          );
          currentAddress = addr;
          setAddresses((prev) => ({ ...prev, [type]: addr }));
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
    [addresses, addressLoading, performCheck]
  );

  // Hiển thị loading khi đang fetch data
  if (isLoadingAttendance) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin
          size="large"
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        />
        <Text className="ml-3">Đang tải thông tin điểm danh...</Text>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Improved Grid layout - Better responsive design */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
        {/* ClockInSection */}
        <ClockInSection
          now={currentTime}
          isCheckedIn={attendance.isCheckedIn}
          isCheckingIn={isCheckingIn}
          attendance={attendanceData}
          onResetCheckIn={resetCheckIn}
          setOnResetCheckIn={setResetCheckIn}
          onCheckIn={(file) => handleCheck("in", file)}
        />

        {/* ClockOutSection - chỉ hiển thị khi đã checkin */}
        {attendance.isCheckedIn && (
          <ClockOutSection
            now={currentTime}
            isCheckedIn={attendance.isCheckedIn}
            isCheckingIn={isCheckingIn}
            attendance={attendanceData}
            onCheckOut={(file) => handleCheck("out", file)}
            onResetCheckOut={resetCheckOut}
            setOnResetCheckOut={setResetCheckOut}
          />
        )}
      </div>
    </div>
  );
}
