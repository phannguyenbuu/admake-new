import dayjs from "dayjs";

export const getDayOfWeek = (day: number, month: number, year: number) => {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();

  switch (dayOfWeek) {
    case 0:
      return "CN"; // Chủ nhật
    case 1:
      return "T2"; // Thứ 2
    case 2:
      return "T3"; // Thứ 3
    case 3:
      return "T4"; // Thứ 4
    case 4:
      return "T5"; // Thứ 5
    case 5:
      return "T6"; // Thứ 6
    case 6:
      return "T7"; // Thứ 7
    default:
      return "";
  }
};

// Map từ mã API sang mã hiển thị
export const mapResultToDisplay = (result: string) => {
  switch (result) {
    case "T1":
      return "T";
    case "T2":
      return "T+";
    case "T3":
      return "T-";
    case "K1":
      return "K";
    case "K2":
      return "K+";
    case "K3":
      return "K-";
    default:
      return result;
  }
};

export const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

// viết hàm convert attendance status
export const convertAttendanceStatus = (status: string) => {
  switch (status) {
    case "no_need_check":
      return "Nghỉ phép";
    case "normal":
      return "Bình thường";
    case "late":
      return "Trễ giờ";
    case "lack":
      return "Không rõ";
    case "early":
      return "Đến sớm";
    case "overtime":
      return "Tăng ca";
    case "early_leave":
      return "Về sớm";
    default:
      return status;
  }
};

// Function để format thời gian theo tiếng Việt
export const formatTimeAgo = (date: string | Date | React.ReactNode) => {
  if (typeof date !== "string" && !(date instanceof Date)) {
    return "";
  }
  const now = dayjs();
  const targetDate = dayjs(date);
  const diffInMinutes = now.diff(targetDate, "minute");
  const diffInHours = now.diff(targetDate, "hour");
  const diffInDays = now.diff(targetDate, "day");
  const diffInWeeks = now.diff(targetDate, "week");
  const diffInMonths = now.diff(targetDate, "month");
  const diffInYears = now.diff(targetDate, "year");

  if (diffInMinutes < 1) {
    return "Vừa xong";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  } else {
    return `${diffInYears} năm trước`;
  }
};
