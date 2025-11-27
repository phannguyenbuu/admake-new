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
import { useUser } from "../../../common/hooks/useUser";
import type { Workpoint, WorkDaysProps } from "../../../@types/workpoint";
// import type { Leave } from "../../../@types/leave.type";

import SalaryBoard from "./SalaryBoard";
import { Typography } from "antd";
import UnPermissionBoard from "../unPermissionBoard";

const WorkPointPage: IPage["Component"] = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  const [workpoints, setWorkpoints] = useState<WorkDaysProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WorkDaysProps | null>(null);

  const {userLeadId, canViewPermission} = useUser();

  const handleOpenModal = (record: WorkDaysProps) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  // Fetch data dùng fetch API với params paging và search
  const fetchUsers = async ({ page, limit, search }: typeof query) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${useApiHost()}/workpoint/page?` +
          new URLSearchParams({
            lead: userLeadId.toString(),
            page: String(page),
            limit: String(limit),
            search,
          })
      );
      
      const result = await response.json();
      
      setWorkpoints(result.data);
      setTotal(result.pagination.total);
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

  // useEffect(() => {
  //   console.log('Workpoints', workpoints);
  // },[workpoints]);

  useEffect(()=>{
    console.log('canViewPermission', canViewPermission);
  },[]);

  return canViewPermission?.view_workpoint ?(
    <>
    
    <div className="min-h-screen p-2 w-full">
      <TableComponent<WorkDaysProps>
        columns={columnsWorkPoint(handleOpenModal)}
        dataSource={workpoints}
        loading={isLoading}
        pagination={{
          pageSize: query.limit,
          current: query.page,
          total: total,
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

    {modalVisible && 
            <SalaryBoard 
              selectedRecord={selectedRecord}
              modalVisible={modalVisible} 
              handleOk={handleCloseModal} />}
              </>
  ): <UnPermissionBoard/>;
};

export default WorkPointPage;