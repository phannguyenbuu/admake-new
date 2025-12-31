import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// Mobile Date Picker Modal Component
interface MobileDatePickerModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (date: dayjs.Dayjs | null) => void;
  value: dayjs.Dayjs | null;
  disabledDate?: (current: dayjs.Dayjs) => boolean;
}

export default function MobileDatePickerModal({
  open,
  onCancel,
  onConfirm,
  value,
  disabledDate,
}: MobileDatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(value);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth((prev) => prev.subtract(1, "month"));
    } else {
      setCurrentMonth((prev) => prev.add(1, "month"));
    }
  };

  const handleDateSelect = (date: dayjs.Dayjs) => {
    if (disabledDate && disabledDate(date)) return;
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const handleReset = () => {
    setSelectedDate(null);
  };

  const getDaysInMonth = () => {
    const start = currentMonth.startOf("month");
    const end = currentMonth.endOf("month");
    const startDay = start.day(); // 0 = Chủ nhật, 1 = Thứ 2, ...
    const daysInMonth = end.date();

    const days = [];

    // Thêm các ngày trống ở đầu
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Thêm các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(start.date(i));
    }

    return days;
  };

  const weekDays = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
  const days = getDaysInMonth();

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="90vw"
      style={{ maxWidth: "400px" }}
      centered
      destroyOnHidden
      maskClosable={false}
      className="mobile-date-picker-modal"
      styles={{
        content: {
          borderRadius: "16px",
          overflow: "hidden",
          padding: 0,
        },
        body: {
          padding: 0,
        },
        mask: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <div className="bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Chọn ngày</h3>
          {/* <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button> */}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center p-4 bg-gray-50">
          <button
            onClick={() => handleMonthChange("prev")}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors mr-4"
          >
            <LeftOutlined className="text-gray-600" />
          </button>

          <h4 className="text-lg font-medium text-gray-800">
            Tháng {currentMonth.format("MM YYYY")}
          </h4>

          <button
            onClick={() => handleMonthChange("next")}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors ml-4"
          >
            <RightOutlined className="text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-10" />;
              }

              const isDisabled = disabledDate ? disabledDate(day) : false;
              const isSelected =
                selectedDate && day.isSame(selectedDate, "day");
              const isToday = day.isSame(dayjs(), "day");

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    h-10 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isDisabled
                        ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                        : isSelected
                        ? "text-white bg-orange-500 shadow-lg scale-105"
                        : isToday
                        ? "text-orange-600 bg-orange-50 border border-orange-200"
                        : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                    }
                  `}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <Button
            onClick={handleReset}
            className="flex-1 h-12 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Đặt lại
          </Button>
          <Button
            type="primary"
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-lg bg-green-600 border-green-600 text-white hover:bg-green-700 font-medium"
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
