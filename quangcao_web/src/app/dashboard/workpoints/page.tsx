import type { IPage } from "../../../@types/common.type";
// import type { PaginationDto } from "../../../@types/common.type";
// import { useUserQuery } from "../../../common/hooks/user.hook";
// import type { User } from "../../../@types/user.type";
// import FormUser from "../../../components/dashboard/user/FormUser";
// import ButtonComponent from "../../../components/Button";
import TableComponent from "../../../components/table/TableComponent";
// import { EditOutlined } from "@ant-design/icons";
import { columnsWorkPoint } from "../../../common/data";
// import { useDebounce } from "../../../common/hooks/useDebounce";
import { useState, useEffect } from "react";
import { useApiHost } from "../../../common/hooks/useApiHost";
import type { Workpoint, WorkDaysProps } from "../../../@types/workpoint";

export const WorkPointPage: IPage["Component"] = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  const [workpoints, setWorkpoints] = useState<{ data: WorkDaysProps[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data dùng fetch API với params paging và search
  const fetchUsers = async ({ page, limit, search }: typeof query) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${useApiHost()}/workpoint/page?` +
          new URLSearchParams({
            page: String(page),
            limit: String(limit),
            search,
          })
      );
      
      const result = await response.json();
      console.log(result);
      setWorkpoints(result);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi fetch khi query thay đổi
  useEffect(() => {
    fetchUsers(query);
  }, [query]);

  return (
    <div className="min-h-screen p-2 w-full">
      <TableComponent<WorkDaysProps>
        columns={columnsWorkPoint}
        dataSource={workpoints?.data}
        loading={isLoading}
        pagination={{
          pageSize: query.limit,
          current: query.page,
          total: workpoints?.total || 0,
          onChange: (page, pageSize) => {
            setQuery({ ...query, page, limit: pageSize });
          },
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhân sự`,
          style: {
            paddingRight: "15px",
          },
          locale: { items_per_page: "/ Trang" },
        }}
      />
    </div>
  );
};
