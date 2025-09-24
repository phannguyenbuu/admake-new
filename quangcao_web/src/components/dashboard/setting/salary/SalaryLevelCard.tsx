import { Card, Button, Input, Space, Typography } from "antd";
import { useState } from "react";
import { useSettingQuery } from "../../../../common/hooks/setting.hook";
import { SalaryLevelModal } from "./SalaryLevelModal";
import type { SalaryLevelItem } from "../../../../@types/setting.type";

const { Title } = Typography;

export const SalaryLevelCard = () => {
  const { data: settings, refetch } = useSettingQuery();

  const [config, setConfig] = useState({
    openUpdate: false,
  });

  const salaryLevelsData =
    (settings?.find((setting) => setting.key === "salary_level")
      ?.value as Array<SalaryLevelItem>) || [];

  return (
    <>
      <Card
        title={
          <div className="!flex !items-center !justify-between !w-full">
            <Title
              level={5}
              className="!text-[#0891b2] !m-0 !text-lg sm:!text-xl"
            >
              • Lương tháng
            </Title>
          </div>
        }
        className="!rounded-2xl !bg-white/80 !shadow-2xl !drop-shadow-xl !shadow-gray-300/50 !h-full !flex !flex-col"
        hoverable
      >
        <div className="flex-1 flex flex-col">
          <Space direction="vertical" size={16} className="!w-full flex-1">
            {salaryLevelsData.map((s) => (
              <div
                key={s.id}
                className="flex flex-row items-center gap-2 w-full"
              >
                <Button
                  type="primary"
                  className="!bg-[#00B4B6] !border-[#00B4B6] !min-w-[70px] !shadow-lg !text-sm sm:!text-base md:!text-sm lg:!text-base"
                >
                  Bậc {s.index}
                </Button>
                <Input
                  value={s.salary.toLocaleString()}
                  readOnly
                  className="!w-[180px] !text-right !text-sm sm:!text-base md:!text-sm lg:!text-base"
                />
              </div>
            ))}
          </Space>
          <div className="mt-auto pt-4">
            <Button
              type="primary"
              className="!bg-gradient-to-r !from-[#00B4B6] !to-[#0891b2] !border-none !shadow-lg !text-sm sm:!text-base md:!text-sm lg:!text-base hover:!shadow-xl hover:!scale-105 !transition-all !duration-300"
              onClick={() => setConfig({ ...config, openUpdate: true })}
            >
              + Thêm
            </Button>
          </div>
        </div>
      </Card>

      <SalaryLevelModal
        open={config.openUpdate}
        onCancel={() => {
          setConfig({ ...config, openUpdate: false });
          refetch();
        }}
        refetchSettings={refetch}
        currentSalaryLevels={salaryLevelsData}
      />
    </>
  );
};
