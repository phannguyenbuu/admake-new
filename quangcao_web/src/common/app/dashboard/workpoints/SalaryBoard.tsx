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
import dayjs from 'dayjs';

// const IS_SATURDAY_NOON_OFF = true;

// Tăng ca dưới 1 giờ sẽ không tính giờ

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
  const [timeWork, setTimeWork] = useState<number>(0);
  const [periodWork, setPeriodWork] = useState<number>(0);
  const [overTimeWork, setOverTimeWork] = useState<number>(0);
  const [salaryUnit, setSalaryUnit] = useState<number>(0);
  const [totalSalary, setTotalSalary] = useState<number>(0);
  const [bonusSalary, setBonusSalary] = useState<number>(0);
  const {workpointSetting} = useWorkpointSetting();
  const OVERTIME_RATIO = workpointSetting?.multiply_in_night_overtime || 0;
  const {isMobile} = useUser();
  const current_day = new Date();
  const current_month = current_day.getMonth();
  const [rewardList, setRewardList] = useState<RewardProps[]>([]);

  const [tabIndex, setTabIndex] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const isAdmin = !window.location.href.includes('/point/');


  const fetchTaskByUser = async (): Promise<Task[]> => {
    const response = await fetch(`${useApiHost()}/task/${selectedRecord?.user_id}/by_user`);
    
    if (!response.ok) {
      console.log("Error in fetching");
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

  useEffect(()=>{  
    // console.log('selectedRecord', selectedRecord);
    if (!selectedRecord) return;

    const total_hours = getMaxWorkingHours(current_day.getMonth() + 1, 
      current_day.getFullYear());

    let t = 0;
    let over_t = 0;
    let p = 0;

    selectedRecord.items && selectedRecord.items.forEach(item => {
      const checklist = item.checklist;
      if(!checklist) return;

      if(checklist.morning)
      {
        t += checkWorkhour(checklist.morning, 12);
        p += checkWorkPeriod(checklist.morning);
      }
      
      if(checklist.noon)
      {
        t += checkWorkhour(checklist.noon, 17);
        p += checkWorkPeriod(checklist.noon);
      }
      
      if(checklist.evening)
        over_t += checkWorkhour(checklist.evening, 22);
    });

      setTimeWork(t);
      setPeriodWork(p);
      setOverTimeWork(over_t);
      const salary_unit = selectedRecord.salary / total_hours;
      setSalaryUnit(salary_unit);

      setTotalSalary((p * 4  + over_t * OVERTIME_RATIO) * salary_unit);

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
                      <TableCell>Số buổi làm trong tháng</TableCell>
                      <TableCell>{periodWork}</TableCell>
                      <TableCell>{formatMoney(salaryUnit * 4)} ₫</TableCell>
                      <TableCell>{formatMoney(salaryUnit * 4 * periodWork)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng giờ tăng ca trong tháng</TableCell>
                      <TableCell>{overTimeWork.toFixed(3)}</TableCell>
                      <TableCell>{formatMoney(salaryUnit * OVERTIME_RATIO)} ₫</TableCell>
                      <TableCell>{formatMoney(salaryUnit * OVERTIME_RATIO * overTimeWork)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng thưởng</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tổng phạt</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                    </TableRow>
                    {/* {rewardList.map((el: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell style={highlightRow}>+ {el.workspace}</TableCell>
                        <TableCell style={highlightRow}>({el.title})</TableCell>
                        <TableCell style={highlightRow}>-</TableCell>
                        <TableCell style={highlightRow}>{formatMoney(el.reward)} ₫</TableCell>
                      </TableRow>
                    ))} */}
                    
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography style={{marginTop:20, textAlign:'center', color: '#00B5B4'}}>
                Tổng lương: {formatMoney(salaryUnit * 4 * periodWork + salaryUnit * 1.5 * overTimeWork + bonusSalary)} ₫
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
            <JobAsset key="cash-assets" title = 'Thưởng/Phạt' type="bonus-cash" readOnly={!isAdmin}/>
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
                  <TableCell style={{ fontWeight: 700 }}>Lương/ĐVT</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Thành tiền</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Số giờ đi trễ</TableCell>
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
      </TabPanel>
      <TabPanel value={tabIndex} index={3}>
        <JobAsset key="cash-assets" title = 'Ứng tiền cho nhân viên' type="advance-salary" readOnly={!isAdmin}/>
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
