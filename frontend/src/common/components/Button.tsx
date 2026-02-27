import { Button, Input } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function ButtonComponent({
  toggle,
  refetch,
  title,
  loading = false,
  onSearch,
}: {
  toggle: () => void;
  refetch: () => void;
  title: string;
  loading?: boolean;
  onSearch?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white px-4 sm:px-6 py-3 sm:py-4 mb-4 rounded-xl shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          type="primary"
          size="large"
          className="!bg-[#00B4B6] !font-semibold !shadow-md !drop-shadow-lg hover:!brightness-105 !transition-transform hover:!scale-105 focus:!shadow-md active:!shadow-md !text-xs sm:!text-sm !h-10 sm:!h-12 !px-3 sm:!px-4"
          onClick={toggle}
        >
          <PlusOutlined className="!text-xs sm:!text-sm" />
          <span className="!ml-1 sm:!ml-2">{title}</span>
        </Button>
        <Button
          type="primary"
          size="large"
          loading={loading}
          className="!bg-[#00B4B6] !font-semibold !shadow-md !drop-shadow-lg hover:!brightness-105 !transition-transform hover:!scale-105 focus:!shadow-md active:!shadow-md !text-xs sm:!text-sm !h-10 sm:!h-12 !px-3 sm:!px-4"
          onClick={() => refetch()}
        >
          <ReloadOutlined className="!text-xs sm:!text-sm" />
          <span className="!ml-1 sm:!ml-2">
            {loading ? "Đang tải..." : "Tải lại"}
          </span>
        </Button>
      </div>
      <div className="w-full sm:w-auto">
        <Input
          placeholder="Tìm kiếm..."
          prefix={
            <SearchOutlined className="!text-cyan-500 !text-xs sm:!text-sm" />
          }
          onChange={(e) => {
            onSearch?.(e.target.value);
          }}
          className="!w-full sm:!w-[200px] md:!w-[250px] lg:!w-[300px] !rounded-full !border-gray-300 focus:!border-cyan-500 !text-xs sm:!text-sm !transition-colors !shadow-md !drop-shadow-lg focus:!shadow-md active:!shadow-md !h-10 sm:!h-12"
        />
      </div>
    </div>
  );
}
