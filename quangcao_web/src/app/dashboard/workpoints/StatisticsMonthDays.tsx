import React, {useEffect, useState, useRef} from 'react';
import { Tag, Modal, notification } from "antd";
import { Stack, Box, Typography } from "@mui/material";
import { CenterBox } from '../../../components/chat/components/commons/TitlePanel';
import type { PeriodData, WorkDaysProps } from '../../../@types/workpoint';
import { Table, TableBody, TableCell, TableContainer, TableRow, TableHead, Paper } from '@mui/material';
import { useWorkpointSetting } from '../../../common/hooks/useWorkpointSetting';
import { useUser } from '../../../common/hooks/useUser';
import { useApiHost } from '../../../common/hooks/useApiHost';
import type { Task } from '../../../@types/work-space.type';
import dayjs from 'dayjs';

// const IS_SATURDAY_NOON_OFF = true;

// Tăng ca dưới 1 giờ sẽ không tính giờ

interface StatisticsMonthDaysProps {
    selectedRecord: WorkDaysProps | null;
    modalVisible: boolean;
    handleOk: () => void;
}

function getMaxWorkingHours(month: number, year: number,  work_in_saturday_noon: boolean) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let totalHours = 0;
  
  

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const weekday = date.getDay(); // 0 = Chủ nhật, 6 = Thứ 7

    if (weekday === 0) {
      // Chủ nhật nghỉ
      continue;
    } else if (weekday === 6) {
      // Thứ 7
      totalHours += work_in_saturday_noon ? 8 : 4;
    } else {
      // Ngày thường
      totalHours += 8;
    }
  }

  // console.log("useWorkpointSetting",workpointSetting);
  
  return totalHours;
}

function toVNISOString(dt: string, h: number): string {
  const clone = new Date(dt); // clone đối tượng Date
  clone.setHours(h + 7, 0, 0, 0); // chỉnh sửa giờ trên bản clone
  return clone.toString();
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

const StatisticsMonthDays: React.FC<StatisticsMonthDaysProps> = ({ selectedRecord, modalVisible, handleOk }) => {
  const [timeWork, setTimeWork] = useState<number>(0);
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

  useEffect(()=>{  
    console.log('selectedRecord', selectedRecord);
    if (!selectedRecord) return;

    const total_hours = getMaxWorkingHours(current_day.getMonth() + 1, 
      current_day.getFullYear(),
      workpointSetting?.work_in_saturday_noon ?? false);

    let t = 0;
    let over_t = 0;

    selectedRecord.items && selectedRecord.items.forEach(item => {
      const checklist = item.checklist;
      if(!checklist) return;

      if(checklist.morning)
        t += checkWorkhour(checklist.morning, 12);
      
      if(checklist.noon)
        t += checkWorkhour(checklist.noon, 17);
      
      if(checklist.evening)
        over_t += checkWorkhour(checklist.evening, 22);
    });

      setTimeWork(t);
      setOverTimeWork(over_t);
      const salary_unit = selectedRecord.salary / total_hours;
      setSalaryUnit(salary_unit);

      setTotalSalary((t  + over_t * OVERTIME_RATIO) * salary_unit);

      fetchTaskByUser();

      

    },[selectedRecord, modalVisible]);

    const highlightRow = {fontStyle:"italic", color:'red'};

    return (
      <Modal
          open={modalVisible}
          onOk={handleOk}
          onCancel={handleOk}
          footer={null}
          title=""
          okText="OK"
          cancelButtonProps={{ style: { display: 'none' } }}
          style={{ padding: 20, minWidth: '90vw' }}
        >

        <CenterBox>
          <Box sx={{ borderRadius: 10, backgroundColor: "#00B4B6", px: 5, py: 1, mb: 2 }}>
            <Typography sx={{ textTransform: "uppercase", color: "#fff", fontWeight: 500, textAlign: "center" }}>
              BẢNG LƯƠNG THÁNG {current_day.getMonth() + 1}
            </Typography>
          </Box>

          <Typography>{selectedRecord?.username.toUpperCase()}</Typography>
          <Typography style={{fontWeight:300, fontSize:12, fontStyle:'italic'}}>{selectedRecord?.userrole}</Typography>
          
          <TableContainer component={Paper} sx={{ 
              mt: isMobile ? 0 : 2, 
              width: isMobile ? 400:'100%',
             scale: isMobile ? 0.75 : 1 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell style={{fontWeight:700}}>Nội dung</TableCell>
                  <TableCell style={{fontWeight:700}}>Giá trị</TableCell>
                  <TableCell style={{fontWeight:700}}>Lương giờ</TableCell>
                  <TableCell style={{fontWeight:700}}>Nhân hệ số</TableCell>
                  <TableCell style={{fontWeight:700}}>Thành tiền</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tổng giờ làm trong tháng</TableCell>
                  <TableCell>{timeWork.toFixed(3)}</TableCell>
                  <TableCell>{formatMoney(salaryUnit)} ₫</TableCell>
                  <TableCell>1.0</TableCell>
                  <TableCell>{formatMoney(salaryUnit * 1 * timeWork)} ₫</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tổng giờ tăng ca trong tháng</TableCell>
                  <TableCell>{overTimeWork.toFixed(3)}</TableCell>
                  <TableCell>{formatMoney(salaryUnit)} ₫</TableCell>
                  <TableCell>{OVERTIME_RATIO}</TableCell>
                  <TableCell>{formatMoney(salaryUnit * OVERTIME_RATIO * overTimeWork)} ₫</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Thưởng theo việc</TableCell>
                  <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{formatMoney(bonusSalary)} ₫</TableCell>
                </TableRow>
                {
                  rewardList.map((el) =>
                    <TableRow>
                      <TableCell style={highlightRow}>+ {el.workspace}</TableCell>
                      <TableCell style={highlightRow}>({el.title})</TableCell>
                      <TableCell style={highlightRow}>-</TableCell>
                      <TableCell style={highlightRow}>-</TableCell>
                      <TableCell style={highlightRow}>{formatMoney(el.reward)} ₫</TableCell>
                    </TableRow>)
                }
                <TableRow>
                  <TableCell style={{fontWeight:700}}>Tổng lương</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{formatMoney(salaryUnit * 1 * timeWork + salaryUnit * 1.5 * overTimeWork + bonusSalary)} ₫</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CenterBox>

          
        </Modal>
      
    );
    
}

export default StatisticsMonthDays;