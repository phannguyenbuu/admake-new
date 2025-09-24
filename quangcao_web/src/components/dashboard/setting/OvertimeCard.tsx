import { Card, InputNumber, Space, Typography, Button, message } from "antd";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  SettingOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  useSettingQuery,
  useUpdateSetting,
} from "../../../common/hooks/setting.hook";

const { Title, Text } = Typography;

export const OvertimeCard = () => {
  const { data: settings, refetch } = useSettingQuery();
  const { mutate: updateSetting, isPending: isUpdating } = useUpdateSetting();

  // Lấy giá trị số từ settings (fallback = 0)
  const salaryOverTime = useMemo(() => {
    const v = settings?.find((s) => s.key === "salary_overtime")?.value;
    return typeof v === "number" ? v : Number(v ?? 0);
  }, [settings]);

  const salaryOverTimeFixed = useMemo(() => {
    const v = settings?.find((s) => s.key === "salary_overtime_fixed")?.value;
    return typeof v === "number" ? v : Number(v ?? 0);
  }, [settings]);

  const [isEditing, setIsEditing] = useState(false);
  const [hourlyWage, setHourlyWage] = useState<number>(0);
  const [coefficient, setCoefficient] = useState<number>(0);

  // Đồng bộ state khi settings đổi (sau khi fetch/refetch)
  useEffect(() => {
    setHourlyWage(salaryOverTime);
  }, [salaryOverTime]);

  useEffect(() => {
    setCoefficient(salaryOverTimeFixed);
  }, [salaryOverTimeFixed]);

  const handleSave = useCallback(() => {
    // Chuẩn hoá số (tránh NaN)
    const wageValue = Number.isFinite(hourlyWage) ? hourlyWage : 0;
    const coeffValue = Number.isFinite(coefficient) ? coefficient : 0;

    const tasks: Array<Promise<unknown>> = [];

    if (wageValue !== salaryOverTime) {
      tasks.push(
        new Promise((resolve, reject) =>
          updateSetting(
            { key: "salary_overtime", value: wageValue },
            {
              onSuccess: resolve,
              onError: reject,
            }
          )
        )
      );
    }

    if (coeffValue !== salaryOverTimeFixed) {
      tasks.push(
        new Promise((resolve, reject) =>
          updateSetting(
            { key: "salary_overtime_fixed", value: coeffValue },
            {
              onSuccess: resolve,
              onError: reject,
            }
          )
        )
      );
    }

    if (tasks.length === 0) {
      message.info("Không có thay đổi để lưu.");
      setIsEditing(false);
      return;
    }

    Promise.all(tasks)
      .then(() => {
        message.success("Đã lưu cài đặt tăng ca.");
        refetch();
        setIsEditing(false);
      })
      .catch(() => {
        message.error("Có lỗi xảy ra khi lưu cài đặt!");
      });
  }, [
    hourlyWage,
    coefficient,
    salaryOverTime,
    salaryOverTimeFixed,
    updateSetting,
    refetch,
  ]);

  const handleCancel = useCallback(() => {
    setHourlyWage(salaryOverTime);
    setCoefficient(salaryOverTimeFixed);
    setIsEditing(false);
  }, [salaryOverTime, salaryOverTimeFixed]);

  return (
    <Card
      title={
        <div className="!flex !items-center !justify-between !w-full">
          <Title
            level={5}
            className="!text-[#0891b2] !m-0 !text-lg sm:!text-xl"
          >
            • Lương tăng ca
          </Title>
          <div className="!flex !items-center !gap-2">
            {isEditing ? (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="!text-gray-500 hover:!text-gray-700 !flex !items-center !justify-center !w-8 !h-8 !rounded-lg hover:!bg-gray-100 !transition-all !duration-200"
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={isUpdating}
                  className="!bg-[#0891b2] !border-[#0891b2] hover:!bg-[#0e7490] !flex !items-center !justify-center !w-8 !h-8 !rounded-lg !transition-all !duration-200"
                />
              </>
            ) : (
              <Button
                type="text"
                icon={
                  <SettingOutlined className="!text-lg sm:!text-xl !text-[#0891b2]" />
                }
                onClick={() => setIsEditing(true)}
                className="!text-[#0891b2] hover:!text-[#0e7490] !flex !items-center !justify-center !w-8 !h-8 !rounded-lg hover:!bg-[#0891b2]/10 !transition-all !duration-200"
              />
            )}
          </div>
        </div>
      }
      className="!rounded-2xl !bg-white/80 !shadow-xl !h-full !flex !flex-col"
      styles={{
        body: {
          paddingTop: 16,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        },
      }}
      variant="outlined"
      hoverable
    >
      <div className="flex-1 flex flex-col">
        <Text
          type="secondary"
          italic
          className="!text-[#0891b2] !text-sm sm:!text-base"
        >
          (Lương tăng ca được tính từ tiếng thứ 9 trở đi trong 1 ngày công)
        </Text>

        <Space direction="vertical" size={18} className="!w-full !mt-4 flex-1">
          <div>
            <Text strong className="!text-sm sm:!text-base">
              * Tính khoán:
            </Text>
            <br />
            <Text italic className="!text-[#0891b2] !text-sm sm:!text-base">
              Lương tăng ca = Lương giờ x Số giờ tăng ca
            </Text>
            <div className="flex flex-row items-center gap-3 !mt-2">
              <Text className="!text-sm sm:!text-base md:!text-sm lg:!text-base">
                Lương giờ:
              </Text>
              <InputNumber
                value={hourlyWage}
                onChange={(v) => setHourlyWage(Number(v))}
                disabled={!isEditing}
                min={0}
                step={1000}
                className="!w-[180px]"
                formatter={(value) =>
                  `${value ?? 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => {
                  if (!value) return 0;
                  const normalized = value
                    .replace(/\./g, "")
                    .replace(/\s/g, "");
                  return Number(normalized) || 0;
                }}
              />
              <Text className="!text-sm sm:!text-base md:!text-sm lg:!text-base">
                /giờ
              </Text>
            </div>
          </div>

          <div>
            <Text strong className="!text-sm sm:!text-base">
              * Tính tháng:
            </Text>
            <br />
            <Text italic className="!text-[#0891b2] !text-sm sm:!text-base">
              Lương tăng ca = Lương giờ x Hệ số x Số giờ tăng ca
            </Text>
            <div className="!mt-2">
              <Text className="!text-sm sm:!text-base">
                Lương giờ = Bậc lương / Ngày công / 8 tiếng
              </Text>
            </div>

            <div className="flex flex-row items-center gap-2 !mt-2">
              <Text className="!text-sm sm:!text-base md:!text-sm lg:!text-base">
                Hệ số:
              </Text>
              <InputNumber
                value={coefficient}
                onChange={(v) => setCoefficient(Number(v ?? 0))}
                disabled={!isEditing}
                min={0}
                step={1}
                className="!w-[180px]"
              />
              <Text className="!text-sm sm:!text-base md:!text-sm lg:!text-base">
                %
              </Text>
            </div>
          </div>
        </Space>
      </div>
    </Card>
  );
};
