import {
  Card,
  Space,
  Typography,
  InputNumber,
  Button,
  message,
  DatePicker,
  Tag,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState, useMemo, useCallback } from "react";
import {
  useSettingQuery,
  useUpdateStandardWorkingDays,
} from "../../../common/hooks/setting.hook";
import { SaveOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import type {
  SettingDto,
  StandardWorkingDaysMap,
} from "../../../@types/setting.type";

const { Title, Text } = Typography;
const { MonthPicker } = DatePicker;

const pad2 = (n: number) => String(n).padStart(2, "0");
const monthKeyOf = (d: Dayjs) => `${d.year()}-${pad2(d.month() + 1)}`;

export const WorkDayCard = () => {
  const { data: settings, refetch } = useSettingQuery();
  const { mutate: updateSetting, isPending: isUpdating } =
    useUpdateStandardWorkingDays();

  // Lấy map standard_working_days từ settings
  const swdSetting = useMemo(
    () => settings?.find((s: SettingDto) => s.key === "standard_working_days"),
    [settings]
  );
  const swdMap: StandardWorkingDaysMap = (swdSetting?.value as any) || {};

  // Tháng được chọn để xem/sửa
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [isEditing, setIsEditing] = useState(false);

  // Lấy số ngày công chuẩn của tháng đang chọn
  const selectedKey = monthKeyOf(selectedMonth);
  const currentDays = swdMap?.[selectedKey]?.days ?? undefined;

  // Giá trị đang nhập khi edit
  const [editDays, setEditDays] = useState<number>(currentDays ?? 26);

  // Tháng hiện tại (so sánh theo 'month')
  const now = dayjs();
  const canEditThisMonth =
    selectedMonth.isSame(now, "month") || selectedMonth.isAfter(now, "month");

  // Khi đổi tháng: reset editing theo dữ liệu mới
  const handleChangeMonth = (value: Dayjs | null) => {
    const d = value ?? dayjs();
    setSelectedMonth(d);
    const key = monthKeyOf(d);
    const days = swdMap?.[key]?.days ?? 26;
    setEditDays(days);
    setIsEditing(false);
  };

  const handleStartEdit = useCallback(() => {
    if (!canEditThisMonth) {
      message.info("Chỉ có thể chỉnh sửa tháng hiện tại hoặc các tháng sau.");
      return;
    }
    setEditDays(currentDays ?? 26);
    setIsEditing(true);
  }, [canEditThisMonth, currentDays]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditDays(currentDays ?? 26);
  }, [currentDays]);

  const handleSave = useCallback(() => {
    if (editDays < 0 || editDays > 31) {
      message.error("Số ngày công chuẩn phải từ 0 đến 31.");
      return;
    }

    updateSetting(
      {
        standardWorkingDays: editDays,
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
      },
      {
        onSuccess: () => {
          message.success("Đã cập nhật ngày công chuẩn!");
          setIsEditing(false);
          refetch();
        },
        onError: () => {
          message.error("Có lỗi xảy ra khi cập nhật!");
        },
      }
    );
  }, [editDays, selectedKey, selectedMonth, swdMap, updateSetting, refetch]);

  return (
    <Card
      title={
        <div className="!flex !items-center !justify-between !w-full">
          <Title
            level={5}
            className="!text-[#0891b2] !m-0 !text-lg sm:!text-xl"
          >
            • Ngày công chuẩn theo tháng
          </Title>

          <div className="!flex !items-center !gap-2">
            {!isEditing ? (
              <Button
                type="text"
                icon={
                  <EditOutlined className="!text-lg sm:!text-xl !text-[#0891b2]" />
                }
                onClick={handleStartEdit}
                className="!text-[#0891b2] hover:!text-[#0e7490] !flex !items-center !justify-center !w-8 !h-8 !rounded-lg hover:!bg-[#0891b2]/10 !transition-all !duration-200"
              />
            ) : (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="!text-gray-500 hover:!text-gray-700 !flex !items-center !justify-center !w-8 !h-8 !rounded-lg hover:!bg-gray-100 !transition-all !duration-200"
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={isUpdating}
                  disabled={!canEditThisMonth}
                  className="!bg-[#0891b2] !border-[#0891b2] hover:!bg-[#0e7490] !flex !items-center !justify-center !w-8 !h-8 !rounded-lg !transition-all !duration-200"
                />
              </>
            )}
          </div>
        </div>
      }
      className="!rounded-2xl !bg-white/80 !shadow-xl !h-full !flex !flex-col"
      bodyStyle={{
        paddingTop: 16,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
      bordered
      hoverable
    >
      <Space direction="vertical" size={14} className="!w-full">
        {/* Chọn tháng để xem/sửa */}
        <div className="flex items-center gap-3">
          <Text strong className="!text-sm sm:!text-base">
            Chọn tháng:
          </Text>
          <MonthPicker
            value={selectedMonth}
            onChange={handleChangeMonth}
            format="MM/YYYY"
            className="!text-base"
            // Cho phép xem mọi tháng, nhưng chỉ sửa hiện tại & tương lai
          />
          <Tag color={canEditThisMonth ? "green" : "default"}>
            {canEditThisMonth ? "Có thể chỉnh sửa" : "Chỉ xem"}
          </Tag>
        </div>

        {/* Hiển thị / chỉnh sửa số ngày công chuẩn */}
        {!isEditing ? (
          <div>
            <Text className="!text-sm sm:!text-base">
              Ngày công chuẩn tháng <b>{selectedMonth.format("MM/YYYY")}</b>:{" "}
              <b className="!text-[#0891b2]">
                {currentDays ? currentDays + " ngày công" : "Chưa thiết lập"}
              </b>
            </Text>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Text className="!text-sm sm:!text-base">Ngày công chuẩn:</Text>
            <InputNumber
              value={editDays}
              onChange={(v) => setEditDays(Number(v) || 0)}
              min={1}
              max={30}
              className="!w-[120px]"
              disabled={!canEditThisMonth}
            />
            <Text className="!text-sm sm:!text-base">(1–30)</Text>
          </div>
        )}

        {/* Gợi ý hiển thị nhanh các tháng đã có dữ liệu */}
        {swdMap && Object.keys(swdMap).length > 0 && (
          <div className="mt-2">
            <Text strong className="!text-sm sm:!text-base">
              Các tháng đã thiết lập:
            </Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {/* // chỉ hiện thị 12 tháng gần nhất */}
              {Object.entries(swdMap)
                .sort((a, b) => {
                  const [keyA] = a;
                  const [keyB] = b;
                  return dayjs(keyB).diff(dayjs(keyA));
                })
                .slice(0, 12)
                .map(([k, v]) => (
                  // sử dụng tag để hiển thị
                  <Tag key={k} color="green">
                    {k}: <span className="font-semibold">{v.days} ngày</span>
                  </Tag>
                ))}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};
