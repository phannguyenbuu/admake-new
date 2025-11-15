import { Image } from "antd";
import dayjs from "dayjs";
import type { HeaderSectionProps } from "../../../@types/attendance.type";

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  attendanceDate,
  userInfo,
}) => {
  return (
    <>
      {/* Header Section */}
      <div className="!flex !justify-between !items-center !mb-6">
        <div className="!flex !items-center !gap-2">
          <span className="!text-lg !font-medium !text-black">
            {dayjs(attendanceDate).format("DD/MM/YYYY")}
          </span>
        </div>
      </div>

      {/* User Info Section */}
      <div className="!flex !items-center !gap-3 !mb-6">
        <Image
          src={
            userInfo?.avatar
              ? `${import.meta.env.VITE_API_IMAGE}${userInfo?.avatar}`
              : "https://static.thenounproject.com/png/5034901-200.png"
          }
          className="!w-10 !h-10 !rounded-full"
          preview={false}
        />
        <div className="!flex-1">
          <div className="!text-lg !font-medium !text-black">
            Chào, {userInfo?.fullName}
          </div>
          <div className="!text-sm !text-gray-400">{userInfo?.role?.name}</div>
        </div>
      </div>
    </>
  );
};
