import React, {useEffect, useState, useRef} from 'react';
import { Tag, Modal, notification } from "antd";
import { Tabs, Tab, Stack, Box, Typography } from "@mui/material";
import { CenterBox } from '../../../components/chat/components/commons/TitlePanel';
import type { PeriodData, WorkDaysProps } from '../../../@types/workpoint';
import { Table, TableBody, TableCell, TableContainer, TableRow, TableHead, Paper } from '@mui/material';
import { useWorkpointSetting } from '../../../common/hooks/useWorkpointSetting';
import { useUser } from '../../../common/hooks/useUser';
import { useApiHost } from '../../../common/hooks/useApiHost';
import type { Task } from '../../../@types/work-space.type';
import JobAsset from '../../../components/dashboard/work-tables/task/JobAsset';
import { useTaskContext } from '../../../common/hooks/useTask';
import dayjs from 'dayjs';
import { number } from 'framer-motion';

interface SalaryBoardProps {
    selectedRecord: WorkDaysProps | null;
    modalVisible: boolean;
    handleOk: () => void;
}


function toVNISOString(dt: string, h: number): string {
  const clone = new Date(dt); // clone đối tượng Date
  clone.setHours(h + 7, 0, 0, 0); // chỉnh sửa giờ trên bản clone
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

interface RewardProps {
  title: string,
  workspace: string,
  start_time: string,
  end_time: string,
  reward: number
}

const SalaryBoard: React.FC<SalaryBoardProps> = ({ selectedRecord, modalVisible, handleOk }) => {
  // const {workpointSetting, setWorkpointSetting} = useWorkpointSetting();

  const [timeWork, setTimeWork] = useState<number>(0);
  const [periodWork, setPeriodWork] = useState<number>(0);
  const [overTimeWork, setOverTimeWork] = useState<number>(0);
  const [salaryUnit, setSalaryUnit] = useState<number>(0);

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

  useEffect(() => {
    if (taskDetail) {
      const fetchData = async () => {
        try {
          const response = await fetch(`${useApiHost()}/task/${selectedRecord?.user_id}/salary`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          });
          if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
          }
          const data = await response.json();
          setTaskDetail(data.infor);
          setRateTasks(data.rates);
          console.log("Salary tasks data:", data);
        } catch (error) {
          console.error("Fetch error:", error);
        }
      };
      fetchData();
    }
  }, [selectedRecord, modalVisible]);

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
    const response = await fetch(`${useApiHost()}/task/${selectedRecord?.user_id}/by_user`);
    
    if (!response.ok) {
      // console.log("Error in fetching");
      throw new Error(`Error fetching tasks for user ${selectedRecord?.user_id}`);
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
      const now = new Date();

      return endDate.getMonth() === now.getMonth() &&
            endDate.getFullYear() === now.getFullYear();
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

  function parseTime(timeString: string, day: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    // Create a new Date object copying the day date parts
    const date = new Date(day);
    date.setHours(hours, minutes, 0, 0); // set hours, minutes, seconds, ms
    return date;
  }

  function formatHourToTimeString(hour?: number): string {
    if (hour === undefined) return '00:00'; // or any default time string you want
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }


  useEffect(()=>{  
    // console.log('selectedRecord', selectedRecord);
    if (!selectedRecord) return;

    const expectedTimes = {
        morning: { start: workpointSetting?.morning_in_hour, end: workpointSetting?.morning_out_hour },
        noon:{ start: workpointSetting?.noon_in_hour, end: workpointSetting?.noon_in_hour },
      };


    const total_hours = getMaxWorkingHours(current_day.getMonth() + 1, 
      current_day.getFullYear());

    let t = 0;
    let over_t = 0;
    let p = 0;

    let late = 0;
let early = 0;

selectedRecord.items && selectedRecord.items.forEach(item => {
  const checklist = item.checklist;
  if (!checklist) return;

  if (checklist.morning) {
    t += checkWorkhour(checklist.morning, 12);
    p += checkWorkPeriod(checklist.morning);
  }
  if (checklist.noon) {
    t += checkWorkhour(checklist.noon, 17);
    p += checkWorkPeriod(checklist.noon);
  }
  if (checklist.evening) {
    over_t += checkWorkhour(checklist.evening, 22);
  }

  ['morning', 'noon'].forEach(period => {
    const pData = period === "morning" ? checklist.morning : checklist.noon;
    if (!pData) return;

    const expectedStart = parseTime( 
      formatHourToTimeString(period === "morning" ?  
        expectedTimes.morning.start 
      : expectedTimes.noon.start), 
      pData.day);
    const expectedEnd = parseTime(
      formatHourToTimeString(period === "morning" ?  
      expectedTimes.morning.end 
      :  expectedTimes.noon.end), 
      pData.day);

    if (pData.in && pData.in.time) {
      const actualIn = parseTime(pData.in.time, pData.day);
      if (actualIn > expectedStart) {
        late += (actualIn.getTime() - expectedStart.getTime()) / 60000; // minutes
      }
    }
    if (pData.out && pData.out.time) {
      const actualOut = parseTime(pData.out.time, pData.day);
      if (actualOut < expectedEnd) {
        early += (expectedEnd.getTime() - actualOut.getTime()) / 60000;
      }
    }
  });
});

// set or use late and early as needed, e.g.
setLateMinutes(late);
setEarlyMinutes(early);



      setTimeWork(t);
      setPeriodWork(p);
      setOverTimeWork(over_t);
      const salary_unit = selectedRecord.salary / total_hours;
      setSalaryUnit(salary_unit);

      // setTotalSalary((p * 4  + over_t * OVERTIME_RATIO) * salary_unit);

      fetchTaskByUser();

      


      
      
      
    },[selectedRecord, modalVisible]);



    const highlightRow = {fontStyle:"italic", color:'red'};
    const tabStyle = {fontSize: 10, minWidth: 70, maxWidth: 70, 
      paddingLeft: isMobile ? 0: 50,paddingRight: isMobile ? 0: 50,
      whiteSpace:isMobile?'wrap':'nowrap', borderLeft: '1px solid #666'};

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
                BẢNG LƯƠNG THÁNG {current_day.getMonth() + 1}
              </Typography>

              <Typography sx={{ textTransform: "uppercase", color: "#fff"}}>{selectedRecord?.username.toUpperCase()}</Typography>
              {/* <Typography style={{ fontWeight: 300, fontSize: 12, fontStyle: "italic" }}>{selectedRecord?.userrole}</Typography> */}
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
            {taskDetail &&
              <JobAsset key="cash-assets" title = 'Thưởng/Phạt' type="bonus-cash" readOnly={!isAdmin}/>}
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
                  <TableCell style={{ fontWeight: 700 }}>Nội dung</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Giá trị</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Số phút đi trễ</TableCell>
                  <TableCell>{lateMinutes}</TableCell>
                </TableRow>

                {rateTasks && rateTasks.length === 5 &&
                rateTasks.map((val, idx) => 
                <TableRow>
                  <TableCell>Số việc chấm {idx + 1} sao</TableCell>
                  <TableCell>{val}</TableCell>
                </TableRow>)
                }
                
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
      </TabPanel>
      <TabPanel value={tabIndex} index={3}>
        {taskDetail &&
        <JobAsset key="cash-assets" title = 'Ứng tiền cho nhân viên' type="advance-salary-cash" readOnly={!isAdmin}/>}
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
