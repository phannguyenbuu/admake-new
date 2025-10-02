import type { IPage } from "../../../@types/common.type";
import { useState } from "react";
import type { PaginationDto } from "../../../@types/common.type";
import { useUserQuery } from "../../../common/hooks/user.hook";
import type { User } from "../../../@types/user.type";
import FormUser from "../../../components/dashboard/user/FormUser";
import ButtonComponent from "../../../components/Button";
import TableComponent from "../../../components/table/TableComponent";
import { EditOutlined } from "@ant-design/icons";
import { columnsWorkPoint } from "../../../common/data";
import { useDebounce } from "../../../common/hooks/useDebounce";

export const WorkPointPage: IPage["Component"] = () => {
  const [config, setConfig] = useState({
    openCreate: false,
    openUpdate: false,
  });
  const [query, setQuery] = useState<Partial<PaginationDto>>({
    page: 1,
    limit: 10,
    search: "",
  });
  const [isRefetching, setIsRefetching] = useState(false);

  // Debounce search value
  const debouncedSearch = useDebounce(query.search, 500);

  const {
    data: users,
    isLoading: isLoadingUsers,
    refetch,
  } = useUserQuery({ ...query, search: debouncedSearch });

  const [user, setUser] = useState<User | null>(null);

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig({ ...config, [key]: !config[key] });
    };
  };

  // Handle search
  const handleSearch = (searchValue: string) => {
    setQuery({ ...query, search: searchValue, page: 1 });
  };

  return (
    <div className="min-h-screen p-2 w-full">
      
      <TableComponent<User>
        columns={columnsWorkPoint}
        dataSource={users?.data}
        loading={isLoadingUsers}
        rowSelection={{
          type: "radio",
          columnWidth: 100,
          renderCell: (_, record) => {
            return (
              <EditOutlined
                className="!text-cyan-600 !cursor-pointer !text-xl"
                onClick={() => {
                  setUser(record);
                  toggle("openUpdate")();
                }}
              />
            );
          },
        }}

        pagination={{
          pageSize: query.limit,
          current: query.page,
          total: (users as any)?.total || 0,
          onChange: (page, pageSize) => {
            setQuery({ ...query, page, limit: pageSize });
          },
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} nhân sự`,
          style: {
            paddingRight: "15px",
          },
          locale: { items_per_page: "/ Trang" },
        }}
      />
    </div>
  );
};

export const loader = async () => {
  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { userId: 1, name: "John Doe" };
};
