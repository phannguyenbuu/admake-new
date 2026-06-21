import React, {useEffect, useState, useRef} from 'react';
import { Tag, Modal, notification, Button, type MessageArgsProps } from "antd";
import { Tabs, Tab, Stack, Box, Typography } from "@mui/material";
import { CenterBox } from '../../../components/chat/components/commons/TitlePanel';
import type { PeriodData, WorkDaysProps } from '../../../@types/workpoint';
import { Table, TableBody, TableCell, TableContainer, TableRow, TableHead, Paper } from '@mui/material';
import { useWorkpointSetting } from '../../../common/hooks/useWorkpointSetting';
import { useUser } from '../../../common/hooks/useUser';
import { useApiHost } from '../../../common/hooks/useApiHost';
import type { Task } from '../../../@types/work-space.type';
import JobAsset from '../../../components/dashboard/work-tables/task/JobAsset';
import AdvanceSalaryAsset from '../../../components/dashboard/work-tables/task/AdvanceSalaryAsset';
import { useTaskContext } from '../../../common/hooks/useTask';
import dayjs from 'dayjs';
import { number } from 'framer-motion';
import type { MessageTypeProps } from '../../../@types/chat.type';
import { TOKEN_LABEL } from '../../../common/config';

interface SalaryBoardProps {
  selectedRecord: WorkDaysProps | null;
  modalVisible: boolean;
  handleOk: () => void;
  month?: string;  // ✅ "2025-11"
}


function toVNISOString(dt: string, h: number): string {
  const clone = new Date(dt); // clone đối tượng Date
  clone.setHours(h, 0, 0, 0); // chỉnh sửa giờ trên bản clone (local hour)
  return clone.toString();
}

function checkWorkPeriod(item: PeriodData):number { 
  if(!item.in) 
    return 0;
  else
    return 1;
}

function checkWorkhour(item: PeriodData, end_time: number):number { 
  if(!item.in) return 0;
  
  if(!item?.out)
  {
    item.out = {
      img: '',
      lat: item.in.lat,
      long: item.in.long,
      time: toVNISOString(item.in.time, end_time)
    }

    const diffMs = new Date(item.out.time).getTime() 
                - new Date(item.in.time).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    item.workhour = diffHours;
  }
  
  return item?.workhour && item.workhour > 1 ? item.workhour : 0;
}

const formatMoney: (n: number) => string = (n) => {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function getLocalMonthFromISO(isoString: string): number {
  const date = new Date(isoString);
  // Tạo date string theo local timezone Việt Nam
  const localDateStr = date.toLocaleDateString('sv-SE', { 
    timeZone: 'Asia/Ho_Chi_Minh' 
  }); // Format: "2025-12-04"
  const [year, month] = localDateStr.split('-').map(Number);
  return month - 1; // Convert về 0-11
}

interface RewardProps {
  title: string,
  workspace: string,
  start_time: string,
  end_time: string,
  reward: number
}

const SalaryBoard: React.FC<SalaryBoardProps> = ({ 
  selectedRecord, 
  modalVisible, 
  handleOk, 
  month = dayjs().format("YYYY-MM")  // ✅ Default hiện tại
}) => {

  const [timeWork, setTimeWork] = useState<number>(0);
  const [periodWork, setPeriodWork] = useState<number>(0);
  const [overTimeWork, setOverTimeWork] = useState<number>(0);
  const [salaryUnit, setSalaryUnit] = useState<number>(0);

  const [dataMessages, setDataMessages] = useState<MessageTypeProps[]>([]);
  const [totalSalary, setTotalSalary] = useState<number>(0);
  const [bonusSalary, setBonusSalary] = useState<number>(0);
  const [advanceSalary, setAdvanceSalary] = useState<number>(0);
  const [punishSalary, setPunishSalary] = useState<number>(0);
  const [customBonusSalary, setCustomBonusSalary] = useState<number>(0);

  const {workpointSetting} = useWorkpointSetting();
  const OVERTIME_RATIO = workpointSetting?.multiply_in_night_overtime || 0;
  const {isMobile} = useUser();
  const current_day = new Date();
  const current_month = current_day.getMonth();
  const [rewardList, setRewardList] = useState<RewardProps[]>([]);
  const {taskDetail, setTaskDetail} = useTaskContext();
  const [rateTasks, setRateTasks] = useState<number[]>([0,0,0,0,0]);
  const [tabIndex, setTabIndex] = useState(0);

  const [lateMinutes, setLateMinutes] = useState<number>(0);
  const [earlyMinutes, setEarlyMinutes] = useState<number>(0);

  const [diligenceInput, setDiligenceInput] = useState<number>(0);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [payrollRow, setPayrollRow] = useState<any>(null);

  const { userLeadId } = useUser();

  const fetchAdjustments = async () => {
    if (!selectedRecord?.user_id || !userLeadId) return;
    const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await fetch(`${useApiHost()}/workpoint/payroll-adjustments?lead=${userLeadId}&user_id=${selectedRecord.user_id}&month=${month}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        }
      });
      if (response.ok) {
        const data = await response.json();
        const rows = data.rows || [];
        setAdjustments(rows);
        const diligence = rows.find((r: any) => r.adjustment_type === "bonus" && r.note === "Thưởng chuyên cần");
        if (diligence) {
          setDiligenceInput(diligence.amount || 0);
        } else {
          setDiligenceInput(0);
        }
      }
    } catch (e) {
      console.error("Fetch adjustments error:", e);
    }
  };

  const reloadAdvanceData = async () => {
    await fetchAdjustments();
    await fetchPayroll();
    
    if (!modalVisible || !selectedRecord?.user_id) return;
    const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const url = taskDetail
        ? `${useApiHost()}/task/${selectedRecord.user_id}/salary?month=${month}`
        : `${useApiHost()}/workpoint/${selectedRecord.user_id}/salary?month=${month}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (taskDetail) {
          setTaskDetail(data.infor);
          setRateTasks(data.rates);
        }
        setDataMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Reload advance data error:", error);
    }
  };

  const fetchPayroll = async () => {
    if (!selectedRecord?.user_id || !userLeadId) return;
    const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await fetch(`${useApiHost()}/workpoint/payroll-summary?lead=${userLeadId}&month=${month}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        }
      });
      if (response.ok) {
        const data = await response.json();
        const rows = data.rows || [];
        const found = rows.find((r: any) => r.user_id === selectedRecord.user_id);
        if (found) {
          setPayrollRow(found);
        }
      }
    } catch (error) {
      console.error("Fetch payroll error:", error);
    }
  };

  const handleSaveDiligence = async () => {
    if (!selectedRecord?.user_id || !userLeadId) return;
    const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const diligenceAdj = adjustments.find((adj: any) => adj.adjustment_type === "bonus" && adj.note === "Thưởng chuyên cần");

    try {
      if (diligenceInput === 0) {
        if (diligenceAdj) {
          const deleteRes = await fetch(`${useApiHost()}/workpoint/payroll-adjustments/${diligenceAdj.id}`, {
            method: "DELETE",
            headers: authHeaders
          });
          if (deleteRes.ok) {
            notification.success({ message: "Đã xoá thưởng chuyên cần" });
          }
        }
      } else {
        if (diligenceAdj) {
          const updateRes = await fetch(`${useApiHost()}/workpoint/payroll-adjustments/${diligenceAdj.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders
            },
            body: JSON.stringify({ amount: diligenceInput })
          });
          if (updateRes.ok) {
            notification.success({ message: "Đã cập nhật thưởng chuyên cần" });
          }
        } else {
          const createRes = await fetch(`${useApiHost()}/workpoint/payroll-adjustments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders
            },
            body: JSON.stringify({
              lead_id: userLeadId,
              user_id: selectedRecord.user_id,
              type: "bonus",
              note: "Thưởng chuyên cần",
              amount: diligenceInput,
              entry_date: `${month}-01`
            })
          });
          if (createRes.ok) {
            notification.success({ message: "Đã thêm thưởng chuyên cần" });
          }
        }
      }
      await fetchAdjustments();
      await fetchPayroll();
    } catch (e) {
      console.error(e);
      notification.error({ message: "Lỗi lưu thưởng chuyên cần" });
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchAdjustments();
      fetchPayroll();
    }
  }, [selectedRecord, modalVisible, month, userLeadId]);

  const selectedDate = dayjs(month, "YYYY-MM");
  const selectedYear = selectedDate.year();
  const selectedMonthIndex = selectedDate.month();  // 0-11
  

  useEffect(() => {
    if (!modalVisible || !selectedRecord?.user_id) return;

    setDataMessages([]);

    const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    if (taskDetail) {
      const fetchData = async () => {
        try {
          const response = await fetch(`${useApiHost()}/task/${selectedRecord.user_id}/salary?month=${month}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders
            }
          });
          if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
          }
          const data = await response.json();
          setTaskDetail(data.infor);
          setRateTasks(data.rates);
          setDataMessages(data.messages);
          console.log("Salary tasks data:", data);
        } catch (error) {
          console.error("Fetch error:", error);
        }
      };
      fetchData();
    } else {
      const fetchData = async () => {
        try {
          const response = await fetch(`${useApiHost()}/workpoint/${selectedRecord.user_id}/salary?month=${month}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders
            }
          });
          if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
          }
          const data = await response.json();
          setDataMessages(data.messages);
          console.log("Salary tasks data:", selectedRecord.user_id, data);
        } catch (error) {
          console.error("Fetch error:", error);
        }
      };
      fetchData();
    }
  }, [selectedRecord, modalVisible, month, taskDetail, setTaskDetail]);

  useEffect(()=>{
    if(!taskDetail || ! taskDetail.assets) 
    {
      setTotalSalary(0);
      setBonusSalary(0);
      setAdvanceSalary(0);
      setPunishSalary(0);
      setCustomBonusSalary(0);
      setRateTasks([0,0,0,0,0]);
      return;
    }

    let bonus = 0, advance = 0, punish = 0;
    
    taskDetail.assets.forEach(el => {
      if(el.text !== '' && el.text)
      {
        if(el.type === "bonus-cash") 
        {
          const v = Number(el.text.split('/')[0].replace(/\./g, ''));
          bonus += v > 0 ? v : 0;
          punish += v < 0 ? v : 0;
        }
        else if(el.type === "advance-salary-cash") 
          advance += Number(el.text.split('/')[0].replace(/\./g, ''));
      }
    });

    setAdvanceSalary(advance);
    setPunishSalary(punish);
    setCustomBonusSalary(bonus);

  },[taskDetail])

  const handleChange = (_event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const isAdmin = !window.location.href.includes('/point/');

  const fetchTaskByUser = async (): Promise<Task[]> => {
    if (!selectedRecord?.user_id) {
      return [];
    }

    const token = localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${useApiHost()}/task/${selectedRecord.user_id}/by_user?month=${month}`, {
      headers: authHeaders
    });

    if (!response.ok) {
      throw new Error(`Error fetching tasks for user ${selectedRecord.user_id}`);
    }
    
    // Chỉ gọi response.json() một lần
    const json = await response.json();

    // Đảm bảo đúng cấu trúc: json.data và json.reward
    const data: Task[] = json.data ?? [];
    const reward_list: RewardProps[] = json.reward ?? [];

    const filtered = data.filter((item: Task) => {
      if (!item.end_time) return false;
      if (item.status !== "REWARD") return false;

      const endDate = dayjs(item.end_time).toDate();
      return endDate.getMonth() === selectedMonthIndex &&
            endDate.getFullYear() === selectedYear;
    });

    // console.log('response json', json);
    setRewardList(reward_list);

    const totalReward = reward_list.reduce((acc, el) => acc + (el.reward || 0), 0);
    setBonusSalary(totalReward);

    // console.log('res', totalReward);

    return filtered;
  };

  
  function getMaxWorkingHours(month: number, year: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let totalHours = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const weekday = date.getDay(); // 0 = Chủ nhật, 6 = Thứ 7

      if (weekday === 0) {
        //Chủ Nhật
        totalHours += workpointSetting?.work_in_sunday ? 8 : 0;
      } else if (weekday === 6) {
        // Thứ 7
        totalHours += workpointSetting?.work_in_saturday_noon ? 8 : 4;
      } else {
        // Ngày thường
        totalHours += 8;
      }
    }

    // console.log("useWorkpointSetting",workpointSetting);
    
    return totalHours;
  }



    useEffect(() => {
      if (!modalVisible || !selectedRecord?.user_id) return;
      if (!selectedRecord?.items?.length) {
        setTimeWork(0);
        setPeriodWork(0);
        setOverTimeWork(0);
        setLateMinutes(0);
        setEarlyMinutes(0);
        setSalaryUnit(0);
        fetchTaskByUser();
        return;
      }

      // ✅ DÙNG selectedMonthIndex, selectedYear từ props
      const monthItems = selectedRecord.items.filter(item => {
        const checklist = item.checklist;
        if (!checklist) return false;
        
        const timeStr = checklist.morning?.in?.time || checklist.noon?.in?.time;
        if (!timeStr) return false;
        
        const itemDate = new Date(timeStr);
        return itemDate.getMonth() === selectedMonthIndex && 
              itemDate.getFullYear() === selectedYear;
      });

      let t = 0, over_t = 0, p = 0, late = 0, early = 0;

      const morningInHour = workpointSetting?.morning_in_hour ?? 7;
      const morningInMin = workpointSetting?.morning_in_minute ?? 30;
      const noonInHour = workpointSetting?.noon_in_hour ?? 13;
      const noonInMin = workpointSetting?.noon_in_minute ?? 30;

      // Tính trên monthItems
      monthItems.forEach(item => {
        const checklist = item.checklist;
        if (!checklist) return;

        // Debug LỘC
        if (selectedRecord?.username.includes("LỘC")) {
          if (!checklist.morning?.in) console.log("No morning", item);
          if (!checklist.noon?.in) console.log("No noon", item);
        }

        // Morning
        if (checklist.morning?.in) {
          t += checkWorkhour(checklist.morning, 12);
          p += checkWorkPeriod(checklist.morning);

          const inTime = dayjs(checklist.morning.in.time).local();
          const configTime = inTime.hour(morningInHour).minute(morningInMin).second(0).millisecond(0);
          const diff = inTime.diff(configTime, 'minute');
          if (diff > 0) {
            late += diff;
          }
        }
        
        // Noon
        if (checklist.noon?.in) {
          t += checkWorkhour(checklist.noon, 17);
          p += checkWorkPeriod(checklist.noon);

          const inTime = dayjs(checklist.noon.in.time).local();
          const configTime = inTime.hour(noonInHour).minute(noonInMin).second(0).millisecond(0);
          const diff = inTime.diff(configTime, 'minute');
          if (diff > 0) {
            late += diff;
          }
        }
        
        // Evening (overtime)
        if (checklist.evening?.in) {
          over_t += checkWorkhour(checklist.evening, 22);
        }
      });

      // ✅ FIX: DÙNG selectedMonthIndex + 1, selectedYear
      const total_hours = getMaxWorkingHours(selectedMonthIndex + 1, selectedYear);
      const salary_unit = selectedRecord.salary / total_hours;
      
      setTimeWork(t);
      setPeriodWork(p);
      setOverTimeWork(over_t);
      setLateMinutes(late);
      setEarlyMinutes(early);
      setSalaryUnit(salary_unit);
      
      fetchTaskByUser();
    }, [selectedRecord, modalVisible, workpointSetting, selectedMonthIndex, selectedYear]);  // ✅ Dependencies đúng



    const highlightRow = {fontStyle:"italic", color:'red'};
    const tabStyle = {
      fontSize: isMobile ? 10 : 11, 
      fontWeight: 600,
      minWidth: isMobile ? 65 : 90, 
      paddingLeft: isMobile ? 2 : 12,
      paddingRight: isMobile ? 2 : 12,
      whiteSpace: 'nowrap' as const, 
      borderLeft: '1px solid #e2e8f0'
    };

    return (
      <Modal
          open={modalVisible}
          onOk={handleOk}
          onCancel={handleOk}
          footer={null}
          title=""
          okText="OK"
          cancelButtonProps={{ style: { display: 'none' } }}
          
        >

        <CenterBox>
          <Box sx={{ width: "100%" }}>

            <Box sx={{ width:250, borderRadius: 1, backgroundColor: "#00B4B6", px: 1, py: 1, mb: 0,
              position: "relative",
              "&:after": {
                content: '""',
                position: "absolute",
                right: -26,
                top: "50%",
                transform: "translateY(-50%)",
                width: 0,
                height: 0,
                borderTop: "28px solid transparent",
                borderBottom: "28px solid transparent",
                borderLeft: "28px solid #00B4B6",
              },
             }}>
              <Typography sx={{ textTransform: "uppercase", color: "#ccc", fontSize:12,  fontWeight: 500 }}>
                BẢNG LƯƠNG THÁNG {selectedDate.format("MM/YYYY")}
              </Typography>

              <Typography sx={{ textTransform: "uppercase", color: "#fff"}}>{selectedRecord?.username.toUpperCase()}</Typography>
              <Typography style={{ fontWeight: 500, fontSize: 11, color: "#eee", marginTop: 2 }}>
                Lương cơ bản: {formatMoney(selectedRecord?.salary || 0)} ₫
              </Typography>
            </Box>
            
            <Tabs
              value={tabIndex}
              onChange={handleChange}
              aria-label="nav tabs example"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons="auto"
              style={{marginTop: 10}}
            >
              <Tab style={tabStyle} label="Lương" id="nav-tab-0" aria-controls="nav-tabpanel-0" />
              <Tab style={tabStyle} label="Thưởng Phạt" id="nav-tab-1" aria-controls="nav-tabpanel-1" />
              <Tab style={tabStyle} label="Chuyên Cần" id="nav-tab-2" aria-controls="nav-tabpanel-2" />
              <Tab style={tabStyle} label="Ứng Tiền" id="nav-tab-3" aria-controls="nav-tabpanel-3" />
              <Tab style={tabStyle} label="Phiếu Lương" id="nav-tab-4" aria-controls="nav-tabpanel-4" />
            </Tabs>

          <TabPanel value={tabIndex} index={0}>
              <TableContainer
                component={Paper}
                sx={{
                  mt: isMobile ? 0 : 2,
                  ml: isMobile ? -10: 0,
                  width: isMobile ? 400 : "100%",
                  scale: isMobile ? 0.75 : 1,
                }}
              >
                <Table style={{ padding: 0 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ fontWeight: 700 }}>Nội dung</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Giá trị</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Lương/ĐVT</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Thành tiền</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Số buổi làm</TableCell>
                      <TableCell>{periodWork}</TableCell>
                      <TableCell>{formatMoney(salaryUnit * 4)} ₫</TableCell>
                      <TableCell>{formatMoney(salaryUnit * 4 * periodWork)} ₫</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Số giờ làm</TableCell>
                      <TableCell>{timeWork.toLocaleString()}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng giờ tăng ca</TableCell>
                      <TableCell>{overTimeWork.toFixed(3)}</TableCell>
                      <TableCell>{formatMoney(salaryUnit * OVERTIME_RATIO)} ₫</TableCell>
                      <TableCell>{formatMoney(salaryUnit * OVERTIME_RATIO * overTimeWork)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng phụ cấp</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng thưởng</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(customBonusSalary)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng phạt</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(punishSalary)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tạm ứng</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(advanceSalary)} ₫</TableCell>
                    </TableRow>
                    
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography style={{marginTop:20, textAlign:'center', color: '#00B5B4'}}>
                Tổng lương: {formatMoney(salaryUnit * 4 * periodWork 
                    + salaryUnit * 1.5 * overTimeWork 
                    + bonusSalary
                    + customBonusSalary
                    + punishSalary
                    + advanceSalary
                    )} ₫
              </Typography>
              
            </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <TableContainer
                component={Paper}
                sx={{
                  mt: isMobile ? 0 : 2,
                  ml: isMobile ? -10: 0,
                  width: isMobile ? 400 : "100%",
                  scale: isMobile ? 0.75 : 1,
                }}
              >
                <Table style={{ padding: 0 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ fontWeight: 700 }}>Nội dung</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Giá trị</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Lương/ĐVT</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Thành tiền</TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell>Thưởng theo việc</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                    </TableRow>
                    {rewardList.map((el: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell style={highlightRow}>+ {el.workspace}</TableCell>
                        <TableCell style={highlightRow}>({el.title})</TableCell>
                        <TableCell style={highlightRow}>-</TableCell>
                        <TableCell style={highlightRow}>{formatMoney(el.reward)} ₫</TableCell>
                      </TableRow>
                    ))}
                    
                  </TableBody>
                </Table>
              </TableContainer>
            {/* {taskDetail && */}
              <JobAsset key="cash-assets" 
                targetUserId = {selectedRecord?.user_id}
                messages={dataMessages.filter(el => el.type === "bonus-cash")}
                title = 'Thưởng/Phạt' 
                type="bonus-cash" 
                readOnly={!isAdmin}/>
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        <TableContainer
            component={Paper}
            sx={{
              mt: isMobile ? 0 : 2,
              ml: isMobile ? -10: 0,
              width: isMobile ? 400 : "100%",
              scale: isMobile ? 0.75 : 1,
            }}
          >
            <Table style={{ padding: 0 }}>
              <TableBody>
                <TableRow>
                  <TableCell style={{ fontWeight: 700, width: "50%" }}>Nội dung</TableCell>
                  <TableCell style={{ fontWeight: 700, width: "50%" }}>Giá trị</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Số phút đi trễ</TableCell>
                  <TableCell className="font-semibold text-rose-600">{lateMinutes} phút</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div>Đủ 26 công (Đã làm: {(periodWork / 2).toFixed(1)} ngày)</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <span className={`font-semibold ${periodWork / 2 >= 26 ? "text-teal-600" : "text-amber-600"}`}>
                        {periodWork / 2 >= 26 ? "Đủ 26 công" : "Chưa đủ"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          min="0"
                          value={diligenceInput || ""}
                          onChange={(e) => setDiligenceInput(e.target.value ? Number(e.target.value) : 0)}
                          placeholder="Tiền thưởng..."
                          className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none"
                          disabled={!isAdmin}
                        />
                        {isAdmin && (
                          <button
                            onClick={handleSaveDiligence}
                            className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                          >
                            Lưu
                          </button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Tổng số giờ làm</TableCell>
                  <TableCell className="font-semibold">{timeWork.toFixed(2)} giờ</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Số giờ tăng ca</TableCell>
                  <TableCell className="font-semibold text-teal-600">{overTimeWork.toFixed(2)} giờ</TableCell>
                </TableRow>
                
              </TableBody>
            </Table>
          </TableContainer>
      </TabPanel>
      <TabPanel value={tabIndex} index={3}>
        
        <AdvanceSalaryAsset key="cash-assets" 
          targetUserId = {selectedRecord?.user_id}
          messages={dataMessages.filter(el => el.type === "advance-salary-cash")}
          title = 'Ứng tiền cho nhân viên' 
          type="advance-salary-cash" 
          readOnly={!isAdmin}
          reloadAll={reloadAdvanceData}
        />
      </TabPanel>
      <TabPanel value={tabIndex} index={4}>
        {payrollRow ? (
          <div className="flex-1 overflow-y-auto max-w-3xl bg-white">
            {/* Info header */}
            <div className="text-xs text-slate-700 space-y-0.5 mb-3 font-medium">
              <div className="text-sm font-bold text-slate-800">PHIẾU LƯƠNG THÁNG {selectedDate.format("MM/YYYY")}</div>
              <div>TÊN NHÂN VIÊN: <span className="font-bold">{payrollRow.full_name?.toUpperCase()}</span></div>
              <div>VỊ TRÍ: <span className="font-semibold">{(payrollRow.department || "").toUpperCase()}</span></div>
              <div>NGÀY {dayjs(month + "-01").endOf('month').format("DD/MM/YYYY")}</div>
              <div>SỐ TÀI KHOẢN: <span className="font-semibold">{payrollRow.bank_account || "—"}</span></div>
            </div>

            {/* Payslip table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  {["MỤC LỤC", "NỘI DUNG", "THÀNH TIỀN"].map((h) => (
                    <th key={h} className="border border-slate-300 px-2 py-1.5 text-left bg-blue-200 font-bold text-slate-800">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Lương căn bản */}
                <tr className="font-semibold">
                  <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                    Lương căn bản {payrollRow.period_work || 0} CÔNG &nbsp;
                    <span className="text-slate-600">{formatMoney(payrollRow.salary_base)} Đ</span>
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">LÀM ĐƯỢC {payrollRow.period_work || 0} CÔNG</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-bold whitespace-nowrap">
                    {payrollRow.salary_base_total > 0 ? formatMoney(payrollRow.salary_base_total) : ""}
                  </td>
                </tr>
                {/* Rows tĩnh */}
                {[
                  { label: "Lương Hiệu Suất", content: "", amount: 0 },
                  { label: "Thâm niên", content: "Theo chế độ", amount: 0 },
                  {
                    label: "Tăng ca",
                    content: payrollRow.overtime_hours ? `${payrollRow.overtime_hours} Giờ` : "Giờ",
                    amount: payrollRow.salary_overtime_total,
                  },
                  { label: "Hoa Hồng", content: "", amount: 0 },
                ].map(({ label, content, amount }) => (
                  <tr key={label}>
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{label}</td>
                    <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">{content}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                      {amount > 0 ? formatMoney(amount) : ""}
                    </td>
                  </tr>
                ))}
                {/* Phụ cấp */}
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5">Phụ cấp (+)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-sky-600">
                    {(payrollRow.allowance ?? 0) > 0 ? `+${formatMoney(payrollRow.allowance!)} đ` : <span className="text-slate-300 italic text-[10px]">chưa có</span>}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-sky-600">
                    {(payrollRow.allowance ?? 0) > 0 ? formatMoney(payrollRow.allowance!) : ""}
                  </td>
                </tr>
                {/* BHYT */}
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5">BHYT (trừ)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-rose-500">
                    {(payrollRow.bhyt ?? 0) > 0 ? `-${formatMoney(payrollRow.bhyt!)} đ` : <span className="text-slate-300 italic text-[10px]">chưa có</span>}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-rose-500">
                    {(payrollRow.bhyt ?? 0) > 0 ? `-${formatMoney(payrollRow.bhyt!)}` : ""}
                  </td>
                </tr>
                {/* BHXH */}
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5">BHXH (trừ)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-rose-500">
                    {(payrollRow.bhxh ?? 0) > 0 ? `-${formatMoney(payrollRow.bhxh!)} đ` : <span className="text-slate-300 italic text-[10px]">chưa có</span>}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-rose-500">
                    {(payrollRow.bhxh ?? 0) > 0 ? `-${formatMoney(payrollRow.bhxh!)}` : ""}
                  </td>
                </tr>
                {/* Thưởng phạt */}
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5">Tổng Thưởng (+)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-green-600">
                    {(payrollRow.bonus_total ?? 0) > 0 ? `+${formatMoney(payrollRow.bonus_total!)} đ` : ""}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-green-600">
                    {(payrollRow.bonus_total ?? 0) > 0 ? formatMoney(payrollRow.bonus_total!) : ""}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5">Tổng Phạt (-)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-rose-600">
                    {(payrollRow.punish_total ?? 0) < 0 ? `${formatMoney(payrollRow.punish_total!)} đ` : ""}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-rose-600">
                    {(payrollRow.punish_total ?? 0) < 0 ? formatMoney(payrollRow.punish_total!) : ""}
                  </td>
                </tr>
                {/* Tạm ứng */}
                <tr className="bg-yellow-50">
                  <td className="border border-slate-300 px-2 py-1.5">Tạm ứng</td>
                  <td className="border border-slate-300 px-2 py-1.5"></td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-amber-700">
                    {payrollRow.advance_total > 0 ? formatMoney(payrollRow.advance_total) : ""}
                  </td>
                </tr>
                {/* Thực nhận */}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="border border-slate-300 px-2 py-2 text-slate-800">Thực nhận</td>
                  <td className="border border-slate-300 px-2 py-2 text-right text-red-600 text-sm">
                    {formatMoney(payrollRow.net_salary)} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-400 italic text-sm p-4">Đang tải phiếu lương...</div>
        )}
      </TabPanel>
    </Box>

   
        </CenterBox>
          
        </Modal>
      
    );
    
}

export default SalaryBoard;


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`nav-tabpanel-${index}`}
      aria-labelledby={`nav-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: index === 4 ? 0 : 3 }}>{children}</Box>}
    </div>
  );
}
