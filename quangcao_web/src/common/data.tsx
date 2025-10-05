import { Tag, Modal } from "antd";
import { Status, StatusLabel } from "./enum/customer.enum";
import { converTime } from "./utils/conver.util";
import type { Role } from "../@types/role.type";
import type { User } from "../@types/user.type";
import HolidayButton from "../components/dashboard/user/HolidayButton";
import dayjs from "dayjs";
import { formatPrice } from "../utils/fomatPrice.util";
import { getDayOfWeek } from "../utils/convert.util";
import React, { useState, useEffect } from 'react';
import { useApiHost, useApiStatic } from "./hooks/useApiHost";
import { Stack, Box, Typography } from "@mui/material";
import QRCode from "../components/chat/components/QRCode";
import { useLocation } from "react-router-dom";
import WorkDays, {QRColumn} from "../app/dashboard/workpoints/WorDays";

export const columnsMaterial = [
  {
    title: "Tên vật liệu",
    dataIndex: "name",
    key: "name",
    width: 200,
    render: (text: string) => (
      <span className="!font-medium !line-clamp-2 !w-[180px] !text-base">
        {text}
      </span>
    ),
  },
  {
    title: "Số lượng tồn",
    dataIndex: "quantity",
    key: "quantity",
    width: 120,
    render: (quantity: number) => (
      <span className="!font-medium !text-base">
        {quantity?.toLocaleString("vi-VN") || 0}
      </span>
    ),
  },
  {
    title: "Đơn vị tính",
    dataIndex: "unit",
    key: "unit",
    width: 130,
    render: (text: string) => (
      <span className="!line-clamp-2 !text-base">{text}</span>
    ),
  },
  {
    title: "Mô tả vật liệu",
    dataIndex: "description",
    key: "description",
    width: 300,
    render: (text: string) => (
      <span className="!line-clamp-2 !w-[280px] !text-base">{text}</span>
    ),
  },
  {
    title: "Nhà cung cấp",
    dataIndex: "supplier",
    key: "supplier",
    width: 200,
    render: (text: string) => (
      <span className="!line-clamp-2 !w-[180px] !text-base">{text}</span>
    ),
  },
  {
    title: "Đơn giá",
    dataIndex: "price",
    key: "price",
    width: 150,
    render: (price: number | string) => (
      <span className="!text-base">
        {typeof price === "number" ? price.toLocaleString("vi-VN") : price}
      </span>
    ),
  },
];

export const columnsCustomer = [
  {
    title: "Tên khách hàng",
    dataIndex: "fullName",
    key: "fullName",
    width: 200,
    render: (text: string) => (
      <span className="!font-medium !line-clamp-2 !w-[180px] !text-base">
        {text}
      </span>
    ),
  },
  {
    title: "Số điện thoại",
    dataIndex: "phone",
    key: "phone",
    width: 150,
    render: (phone: string) => (
      <span className="!line-clamp-1 !text-base">{phone}</span>
    ),
  },
  {
    title: "Thông tin thi công",
    dataIndex: "workInfo",
    key: "workInfo",
    width: 300,
    render: (text: string) => (
      <span className="!line-clamp-2 !w-[280px] !text-base">{text}</span>
    ),
  },
  {
    title: "Đơn giá",
    dataIndex: "workPrice",
    key: "workPrice",
    width: 150,
    render: (price: number | string) => (
      <span className="!text-base">
        {typeof price === "number" ? price.toLocaleString("vi-VN") : price}
      </span>
    ),
  },
  {
    title: "Địa điểm thi công",
    dataIndex: "workAddress",
    key: "workAddress",
    width: 300,
    render: (text: string) => (
      <span className="!line-clamp-2 !w-[280px] !text-base">{text}</span>
    ),
  },
  {
    title: "Thời gian thi công",
    dataIndex: "workStart",
    key: "workStart",
    width: 200,
    render: (_: unknown, record: { workStart: string; workEnd: string }) => (
      <div className="!text-base">
        <div>
          Bắt đầu:{" "}
          <span className="!text-cyan-600 !font-medium">
            {converTime(record.workStart)}
          </span>
        </div>
        <div>
          Kết thúc:{" "}
          <span className="!text-cyan-600 !font-medium">
            {converTime(record.workEnd)}
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status: string) => {
      let color = "";
      if (status === Status.IN_PROGRESS) color = "text-cyan-600";
      else if (status === Status.BOOKED) color = "text-emerald-500";
      else if (status === Status.COMPLETED) color = "text-sky-600";
      else if (status === Status.CANCELLED) color = "text-rose-500";
      return (
        <span className={`font-semibold !text-base ${color}`}>
          {StatusLabel[status?.toUpperCase() as keyof typeof StatusLabel]}
        </span>
      );
    },
  },
];

export const columnsUser = [
  {
    title: "Họ và tên",
    dataIndex: "fullName",
    key: "fullName",
    width: 200,
    render: (text: string, record: User) => (
      <div>
        <div>{text}</div>
        <span className="!text-base" style={{fontSize:8,fontStyle:'italic'}}>{record.role?.name}</span>
      </div>
    ),
  },
  
  {
    title: "Tài khoản",
    dataIndex: "username",
    key: "username",
    width: 150,
    render: (username: string) => (
      <span>
        <span className="!text-cyan-700 !line-clamp-2 !text-base">
          {username}
        </span>
      </span>
    ),
  },
  {
    title: "Số điện thoại",
    dataIndex: "phone",
    key: "phone",
    width: 150,
    render: (phone: string) => <span className="!text-base">{phone}</span>,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (status: string) => (
      <Tag
        color={
          status === "inactive" ? "red" : status === "active" ? "green" : "cyan"
        }
        className="font-semibold !text-base"
      >
        {status === "active" ? "Đang hoạt động" : "Nghỉ phép"}
      </Tag>
    ),
  },
  {
    title: "Nghỉ phép",
    dataIndex: "leave",
    key: "leave",
    width: 150,
    render: (_: string, record: User) => <HolidayButton user={record} />,
  },
];

export const holidayTypes = [
  {
    value: "PUBLIC_HOLIDAY",
    label: "Lễ tết",
    icon: "🎆",
    color: "!from-red-100 !to-pink-100 !text-red-600",
  },
  {
    value: "COMPANY_HOLIDAY",
    label: "Nghỉ công ty",
    icon: "🏢",
    color: "!from-blue-100 !to-cyan-100 !text-blue-600",
  },
  {
    value: "PERSONAL_LEAVE",
    label: "Nghỉ phép cá nhân",
    icon: "🛌",
    color: "!from-purple-100 !to-violet-100 !text-purple-600",
  },
  {
    value: "SICK_LEAVE",
    label: "Nghỉ phép ốm",
    icon: "🤒",
    color: "!from-green-100 !to-emerald-100 !text-green-600",
  },
  {
    value: "ANNUAL_LEAVE",
    label: "Nghỉ phép năm",
    icon: "📅",
    color: "!from-blue-100 !to-cyan-100 !text-blue-600",
  },
  {
    value: "OTHER",
    label: "Nghỉ phép khác",
    icon: "📝",
    color: "!from-gray-100 !to-slate-100 !text-gray-600",
  },
];

export const columnsPayRoll = (month: number, year: number) => [
  {
    title: (
      <span className="!text-base md:!text-lg !bg-white !text-[#00b4b6] !font-bold !border-b-4 !border-[#00b4b6]">
        Tháng {dayjs().month(month).year(year).format("MM/YYYY")}
      </span>
    ),
    colSpan: 2,
    className:
      "!bg-white !text-[#00b4b6] !font-bold !border-[#00b4b6] !rounded-tl-xl",
    children: [
      {
        title: (
          <span className="!text-base md:!text-lg !bg-white !text-[#00b4b6]">
            Họ và tên
          </span>
        ),
        dataIndex: "name",
        key: "name",
        fixed: "left" as const,
        className:
          "!text-base md:!text-lg !font-medium !text-left !bg-white !border-[#00b4b6]",
        render: (text: string) => (
          <span className="!text-base md:!text-lg !font-medium">{text}</span>
        ),
      },
      {
        title: (
          <span className="!text-base md:!text-lg !bg-white !text-[#00b4b6]">
            Chức vụ
          </span>
        ),
        dataIndex: "role",
        key: "role",
        className: "!text-base md:!text-lg !bg-white !border-[#00b4b6]",
        render: (text: string) => (
          <span className="!text-base md:!text-lg">{text}</span>
        ),
      },
    ],
  },
  {
    title: (
      <span className="!text-base md:!text-lg !bg-white !text-[#00b4b6] !font-bold !border-b-4 !border-[#00b4b6]">
        TÍNH CÔNG
      </span>
    ),
    colSpan: 4,
    className: "!bg-white !text-[#00b4b6] !font-bold !border-[#00b4b6]",
    children: [
      {
        title: (
          <span className="!text-base !bg-white !text-[#00b4b6]">
            Bậc lương
          </span>
        ),
        dataIndex: "level_salary",
        key: "level_salary",
        align: "center" as const,
        className: "!text-base !bg-white !border-[#00b4b6]",
      },
      {
        title: (
          <span className="!text-base !bg-white !text-[#00b4b6]">
            Số ngày công chuẩn
          </span>
        ),
        dataIndex: "standardWorkingDays",
        key: "standardWorkingDays",
        align: "center" as const,
        className: "!text-base !bg-white !border-[#00b4b6]",
      },
      {
        title: (
          <span className="!text-base !bg-white !text-[#00b4b6]">
            Số ngày làm
          </span>
        ),
        dataIndex: "dayWorking",
        key: "dayWorking",
        align: "center" as const,
        className: "!text-base !bg-white !border-[#00b4b6]",
      },

      {
        title: (
          <span className="!text-base !bg-white !text-[#00b4b6]">
            Số giờ tăng ca
          </span>
        ),
        dataIndex: "overtime",
        key: "overtime",
        align: "center" as const,
        className: "!text-base !bg-white !border-[#00b4b6]",
      },
    ],
  },
  {
    title: (
      <span className="!text-base !bg-[#00b4b6] !text-white">Thực nhận</span>
    ),
    dataIndex: "total_salary",
    key: "total_salary",
    align: "center" as const,
    className: "!text-lg !bg-[#00b4b6] !text-white !font-bold !rounded-br-xl",
    render: (text: string) => (
      <span className="!text-lg !bg-[#00b4b6] !text-white !font-bold block px-2 py-1 rounded-br-xl">
        {formatPrice(Number(text))}
      </span>
    ),
  },
];

export const columnsAttendance = (
  month: number,
  year: number,
  days: number[],
  isSunday: (day: number) => boolean,
  attendance: (key: string, userId: string) => void
) => [
  {
    title: (
      <span className=" !text-black !text-base !font-bold">Tên nhân sự</span>
    ),
    dataIndex: "name",
    key: "name",
    fixed: "left" as const,
    width: 200,
    className: "!text-base !font-bold !bg-white !border-[#00b4b6]",
  },
  {
    title: (
      <span className=" !text-[#00b4b6] !text-base !font-bold">
        Tháng {month + 1}/{year}
      </span>
    ),
    children: days.map((day) => ({
      title: (
        <div className="!text-center">
          <div className="!text-[#00b4b6] !text-base !font-semibold">
            {day < 10 ? `0${day}` : day}
          </div>
          <div className="!text-[#00b4b6] !text-xs !font-medium">
            {getDayOfWeek(day, month, year)}
          </div>
        </div>
      ),
      dataIndex: `d${day - 1}`,
      key: `d${day - 1}`,
      align: "center" as const,
      width: 60,
      className: `!text-base !border-[#00b4b6] ${
        isSunday(day) ? "!bg-yellow-100 " : "!bg-white"
      }`,
      render: (val: string, record: any) => {
        const dayKey = record[`d${day - 1}_key`];
        const dayUserId = record[`d${day - 1}_userId`];

        const handleClick = () => {
          if (dayKey && dayUserId) {
            attendance(dayKey, dayUserId);
          }
        };

        if (isSunday(day)) {
          return <span className="!text-base">&nbsp;</span>; // khoảng trắng để giữ chiều cao
        }
        if (val === "T")
          return (
            <span
              className="!text-base !font-bold cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              T
            </span>
          );
        if (val === "T+")
          return (
            <span
              className="!text-base !font-bold !text-cyan-500 cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              T
            </span>
          );
        if (val === "T-")
          return (
            <span
              className="!text-base !font-bold !text-red-500 cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              T
            </span>
          );
        if (val === "K")
          return (
            <span
              className="!text-base !font-bold cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              K
            </span>
          );
        if (val === "K+")
          return (
            <span
              className="!text-base !font-bold !text-cyan-500 cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              K
            </span>
          );
        if (val === "K-")
          return (
            <span
              className="!text-base !font-bold !text-red-500 cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              T
            </span>
          );
        if (val === "-")
          return (
            <span
              className="!text-base !text-gray-400 cursor-pointer hover:!text-cyan-600"
              onClick={handleClick}
            >
              -
            </span>
          );
        return (
          <span
            className="!text-base cursor-pointer hover:!text-cyan-600"
            onClick={handleClick}
          >
            {val}
          </span>
        );
      },
    })),
  },
];

const today = new Date();
const month = today.getMonth();

export const columnsWorkPoint = [
  {
    title: `QR`,
    dataIndex: "role",
    key: "role",
    width: 40,
    height: 40,
    render:  (text: string, record: User)  => (
     <QRColumn record = {record}/>
    )
  },
  {
    title: "Họ Và Tên",
    dataIndex: "fullName",
    key: "fullName",
    width: 200,
    render: (text: string, record: User) => (
      <div>
        <div>{text}</div>
        <span className="!text-base" style={{fontSize:8,fontStyle:'italic'}}>{record.role?.name}</span>
      </div>
    ),
  },

  {
    title: `Ngày công tác trong tháng ${month + 1}`,
    dataIndex: "role",
    key: "role",
    width: 800,
    render:  (text: string, record: User)  => (
      <div>
        <WorkDays userId={record.id} username={record.fullName ?? null}/>
      </div>
    )
  },
];
