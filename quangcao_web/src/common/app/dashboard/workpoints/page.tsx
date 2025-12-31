import type { IPage } from "../../../@types/common.type";
import TableComponent from "../../../components/table/TableComponent";
import { columnsWorkPoint } from "../../../common/data";
import { useState, useEffect } from "react";
import { useApiHost } from "../../../common/hooks/useApiHost";
import { useUser } from "../../../common/hooks/useUser";
import type { Workpoint, WorkDaysProps } from "../../../@types/workpoint";
import { useTaskContext } from "../../../common/hooks/useTask";
import SalaryBoard from "./SalaryBoard";
import UnPermissionBoard from "../unPermissionBoard";
import { Select } from 'antd';

const WorkPointPage: IPage["Component"] = () => {
  // ✅ TẤT CẢ STATE - KHÔNG THIẾU GÌ
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
    month: new Date().getMonth(), // Tháng hiện tại (0-11)
  });

  const { setTaskDetail } = useTaskContext();
  const [workpoints, setWorkpoints] = useState<WorkDaysProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WorkDaysProps | null>(null);
  const { userLeadId, canViewPermission } = useUser();

  // ✅ Tạo danh sách tháng từ 11/2025 đến hiện tại
  const generateMonthOptions = () => {
    const options: { value: number; label: string }[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    for (let year = 2025; year <= currentYear; year++) {
      const startMonth = year === 2025 ? 10 : 0; // Tháng 11 = 10
      const endMonth = year === currentYear ? currentMonth : 11;

      for (let month = startMonth; month <= endMonth; month++) {
        options.push({
          value: month,
          label: `Tháng ${month + 1}/${year}`,
        });
      }
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // ✅ TẤT CẢ FUNCTION HANDLERS
  const handleOpenModal = (record: WorkDaysProps) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  const handleMonthChange = (month: number) => {
    setQuery({ ...query, page: 1, month });
  };

  // ✅ Fetch data HOÀN CHỈNH với month param
  const fetchUsers = async () => {
    const { page, limit, search, month } = query;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${useApiHost()}/workpoint/page?` +
          new URLSearchParams({
            lead: userLeadId.toString(),
            page: String(page),
            limit: String(limit),
            search,
            month: String(month),
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

  // ✅ TẤT CẢ useEffect
  useEffect(() => {
    fetchUsers();
  }, [query]);

  useEffect(() => {
    console.log('canViewPermission', canViewPermission);
    setTaskDetail(null);
  }, []);

  // ✅ RETURN HOÀN CHỈNH
  return canViewPermission?.view_workpoint ? (
    <>
      <div className="min-h-screen p-2 w-full">
        {/* Dropdown chọn tháng */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium">Chọn tháng:</label>
          <Select
            value={query.month}
            onChange={handleMonthChange}
            style={{ width: 200 }}
            options={monthOptions}
          />
        </div>

        <TableComponent<WorkDaysProps>
          columns={columnsWorkPoint(handleOpenModal, query.month)}
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
            style: { paddingRight: "15px" },
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
  ) : <UnPermissionBoard/>;
};

export default WorkPointPage;
