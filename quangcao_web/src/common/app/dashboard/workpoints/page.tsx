import type { IPage } from "../../../@types/common.type";
import TableComponent from "../../../components/table/TableComponent";
import { columnsWorkPoint } from "../../../common/data";
import { useState, useEffect } from "react";
import { useApiHost } from "../../../common/hooks/useApiHost";
import { useUser } from "../../../common/hooks/useUser";
import type { Workpoint, WorkDaysProps } from "../../../@types/workpoint";
import { useTaskContext } from "../../../common/hooks/useTask";
import SalaryBoard from "./SalaryBoard";
import { Typography, Select, Row, Col } from "antd";
import UnPermissionBoard from "../unPermissionBoard";
import dayjs from "dayjs";

const { Option } = Select;

const WorkPointPage: IPage["Component"] = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
    month: dayjs().format("YYYY-MM"), // Tháng hiện tại mặc định
  });

  const { setTaskDetail } = useTaskContext();
  const [workpoints, setWorkpoints] = useState<WorkDaysProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WorkDaysProps | null>(null);

  const { userLeadId, canViewPermission } = useUser();

  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = dayjs();
    const startDate = dayjs('2025-11-01');
    
    let current = startDate;
    while (current.isBefore(now) || current.isSame(now, 'month')) {
      options.unshift({
        value: current.format("YYYY-MM"),
        label: current.format("MM/YYYY")
      });
      current = current.add(1, 'month');
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  const handleOpenModal = (record: WorkDaysProps) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  // Reset về page 1 khi đổi tháng/search
  const handleQueryChange = (newQuery: Partial<typeof query>) => {
    setQuery(prev => ({ ...prev, ...newQuery, page: 1 }));
  };

  const fetchUsers = async ({ page, limit, search, month }: typeof query) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${useApiHost()}/workpoint/page?` +
        new URLSearchParams({
          lead: userLeadId.toString(),
          page: String(page),
          limit: String(limit),
          search,
          month, // ← THÊM PARAM THÁNG
        })
      );
      
      const result = await response.json();
      
      setWorkpoints(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error("Failed to fetch workpoints", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(query);
  }, [query]);

  useEffect(() => {
    console.log('canViewPermission', canViewPermission);
    setTaskDetail(null);
  }, []);

  return canViewPermission?.view_workpoint ? (
    <>
      <div className="min-h-screen p-2 w-full">
        {/* DROPDOWN CHỌN THÁNG */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Typography.Text strong>Chọn tháng:</Typography.Text>
            <Select
              value={query.month}
              onChange={(value) => handleQueryChange({ month: value })}
              style={{ width: '100%' }}
              placeholder="Chọn tháng"
            >
              {monthOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

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
            style: { paddingRight: "15px" },
            locale: { items_per_page: "/ Trang" },
          }}
        /> 
      </div>

      {modalVisible && 
        <SalaryBoard 
          selectedRecord={selectedRecord}
          modalVisible={modalVisible} 
          handleOk={handleCloseModal} 
          // month={query.month} // ← Truyền tháng cho SalaryBoard
        />
      }
    </>
  ) : <UnPermissionBoard/>;
};

export default WorkPointPage;
