import React from 'react';
import { Tag, Modal, notification } from "antd";
import { Stack, Box, Typography } from "@mui/material";
import { CenterBox } from '../../../components/chat/components/commons/TitlePanel';
import type { WorkDaysProps } from '../../../@types/workpoint';

interface StatisticsMonthDaysProps {
    selectedRecord:WorkDaysProps;
    modalVisible: boolean;
    handleOk: () => void;
}

const StatisticsMonthDays: React.FC<StatisticsMonthDaysProps> = ({ selectedRecord, modalVisible, handleOk }) => {
    console.log('selectedRecord', selectedRecord);

    
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const [totalHour, setTotalHour] = useState<{morning: number,noon: number,evening: number} | null>(null);
      const [mainData, setData] = useState<Workpoint[]>([]);
      const [modalImg, setModalImg] = useState<PeriodData | null>(null);
      const todayDate = new Date().getDate();
    
      // useEffect(() => {
      //   console.log("Rrd", record.items);
      // },[]);
    
      useEffect(() => {
        setData(record.items);
      },[record]);
      
      useEffect(() => {
        const newStatuses = Array(daysInMonth).fill(null).map(() => Array(3).fill(null));
        const total = {morning: 0,noon: 0,evening: 0};
    
        items && items.forEach((data) => {
          const dateObj = new Date(data.createdAt);
          const localTime = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
    
          if (data.checklist && localTime.getFullYear() === year && localTime.getMonth() === month) 
          {
            const dayIndex = localTime.getDate() - 1;
            (Object.keys(data.checklist) as (keyof Checklist)[]).forEach(
              (period) => {
                const periodData = data.checklist[period];
                if (periodData) {
                  if (periodData.out) {
                    total[period] += periodData.workhour || 0;
                    newStatuses[dayIndex][periodMap[period]] = 'out';
                  } else if (periodData.in) {
                    newStatuses[dayIndex][periodMap[period]] = 'in';
                  } else {
                    newStatuses[dayIndex][periodMap[period]] = null;
                  }
                }
              }
            );
          }
        });
    
        leaves && leaves.forEach((data) => {
          const startDate = new Date(data.start_time);
          const endDate = new Date(data.end_time);
    
          const startDay = startDate.getDate() - 1;
          const endDay = endDate.getDate() - 1;
    
          // console.log('leaves >>>>', startDay, endDay);
    
          if (startDay === endDay) {
            if (data.morning) newStatuses[startDay][0] = 'off/' + data.reason;
            if (data.noon) newStatuses[startDay][1] = 'off/' + data.reason;
          } else {
            for (let day = startDay; day <= endDay; day++) {
              newStatuses[day][0] = 'off/' + data.reason; // morning
              newStatuses[day][1] = 'off/' + data.reason; // noon
              newStatuses[day][2] = 'off/' + data.reason; // evening
            }
          }
        });
    
        setTotalHour(total);
    
        // if(username === "Thanh Hiếu Trần")
        // console.log('MMMstatus', username, newStatuses);
        setStatuses(newStatuses);
      }, [items, year, month, daysInMonth]);

    return (
        <Modal
          open={modalVisible}
          onOk={handleOk}
          onCancel={handleOk}
          footer={null}
          title=""
          okText="OK"
          cancelButtonProps={{ style: { display: 'none' } }}
          style={{ padding: 20, minWidth: '80vw' }}
        >
          <CenterBox>
            <Box sx={{borderRadius:10, backgroundColor:"#00B4B6", px:5, py:1}}>
              <Typography sx={{textTransform:"uppercase",color:"#fff",fontWeight:500,textAlign:"center"}}>BẢNG LƯƠNG THÁNG 10</Typography>
              
              
            </Box>

            <Typography>{selectedRecord.username}</Typography>

            <Typography>Tổng giờ làm trong tháng</Typography>
            <Typography>Tổng giờ tăng ca trong tháng</Typography>
            <Typography>Thưởng theo công tác</Typography>
           
          </CenterBox>
          
        </Modal>
      
    );
    
}

export default StatisticsMonthDays;