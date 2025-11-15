import { Tag, Modal, notification } from "antd";
import type { User } from "../../../@types/user.type";
import React, { useState, useEffect } from 'react';
import { useApiHost, useApiStatic } from "../../../common/hooks/useApiHost";
import { Stack, Box, Typography, Button } from "@mui/material";
import QRCode from "../../../components/chat/components/QRCode";
import { useLocation } from "react-router-dom";
// import type { Checklist, PeriodData, Checklist } from "../../../@types/CheckListType";
import DownloadIcon from '@mui/icons-material/Download';
import { CenterBox } from "../../../components/chat/components/commons/TitlePanel";
import type { Workpoint, WorkDaysProps, PeriodData, Checklist } from "../../../@types/workpoint";
// import SalaryBoard from "./SalaryBoard";

interface QRColumnProps {
  record: WorkDaysProps;
}

export const QRColumn: React.FC<QRColumnProps> = ({ record }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WorkDaysProps | null>(null);

  const handleOpenModal = () => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  return (
    <>
      <DownloadIcon sx={{width:40, height:40,cursor:'pointer'}} onClick={handleOpenModal}/>
      
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={300}
        title={`Mã QR của ${record.username}`}
      >
        {selectedRecord && (
          <Box display="flex" justifyContent="center">
            <QRCode title="Download và gửi cho nhân sự" filename={`qrcode-admake-${record.user_id}.png`} 
              url={`${window.location.origin}/point/${selectedRecord.user_id}/`} />
          </Box>
        )}
      </Modal>
    </>
  );
};


// interface WorkListProps {
//   checklist: Checklist;
//   createdAt: string;
//   updatedAt: string;
//   id: string;
//   user_id: string;
//   username: string;
// }

const periodMap: Record<keyof Checklist, number> = {morning: 0,noon: 1,evening: 2,};

export default function WorkDays({record}: {record:WorkDaysProps}) {
  const {items, leaves, user_id, username} = record;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const [totalHour, setTotalHour] = useState<{morning: number,noon: number,evening: number} | null>(null);
  const [mainData, setData] = useState<Workpoint[]>([]);
  const [currentPeriodModalIndex, setCurrentPeriodModalIndex] = useState<number>(0);
  const [modalImg, setModalImg] = useState<PeriodData | null>(null);
  const todayDate = new Date().getDate();

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

  type StatusKey = 'in' | 'out' | 'off' | 'null';

  const colors: Record<StatusKey, string> = {
    in: 'green',
    out: 'red',
    off: '#999',
    null: 'white',
  };

  const [statuses, setStatuses] = useState(
    Array(daysInMonth)
      .fill(null)
      .map(() => Array(3).fill(null))
  );

  const [modalVisible, setModalVisible] = useState(false);
  const handleOk = () => {
    setModalVisible(false);
    setModalImg(null);
  };

return (
  <>
  <Stack direction="row" spacing={1}>
    <Stack sx={{background:"#999",borderRadius:8, width: 30,pt:2 }}>
      <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
        {( (totalHour?.morning || 0) + (totalHour?.noon || 0) ).toFixed(2)}
      </Typography>
      <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
        {(totalHour?.evening || 0).toFixed(2)}
      </Typography>

    </Stack>

    <div style={{ display: 'flex', overflowX: 'auto' }}>
      {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
        const date = new Date(year, month, dayIndex + 1);
        const isSunday = date.getDay() === 0;

        return (
          <div
            key={dayIndex}
            style={{
              borderRight: date.getDate() === todayDate ? '3px solid blue' : 'none',
              textAlign: 'center',
              borderRadius: 1,
              maxWidth: 18,
              marginRight: 1,
            }}
          >
            <div
              style={{
                fontSize: 10,
                marginBottom: 4,
                color: isSunday ? 'red' : 'black',
              }}
            >
              {date.getDate()}
            </div>
            {[0, 1, 2].map((periodIndex) => {
              const status: any = statuses[dayIndex][periodIndex];
              let imgUrl: PeriodData | null = null;

              if (status) {
                if (status.startsWith('off'))
                {
                  imgUrl = {text:status.substring(4), status: 'off', day: date, period: periodIndex};
                }else if (mainData?.length) {
                  // console.log('mainData', status);
                  const periodKey = ['morning', 'noon', 'evening'][periodIndex] as keyof Checklist;

                  for (const item of mainData) 
                  {
                    const itemCreateDate = new Date(item.createdAt);
                    const itemDate = new Date(itemCreateDate.getTime() + 7 * 60 * 60 * 1000);
                    // console.log('itemDate', itemDate);

                    if (
                      itemDate.getDate() === date.getDate() &&
                      itemDate.getMonth() === date.getMonth() &&
                      itemDate.getFullYear() === date.getFullYear()
                    ) {
                      const periodData = item.checklist[periodKey];
                      // console.log('periodData', periodData);
                      if (periodData) {
                        imgUrl = periodData;
                        break; // nếu chỉ cần lấy giá trị đầu tiên thỏa điều kiện
                      }
                    }
                  }
                }
              }

              const bgColor = status && status.startsWith('off') 
                ? '#999' 
                : colors[(status ?? 'null') as StatusKey];

              return (
                <div
                  key={periodIndex}
                  style={{
                    display: 'block',
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: bgColor,
                    border: isSunday ? '1px solid red' : '1px solid #999',
                    marginBottom: 1,
                    cursor: imgUrl ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    // console.log('IMG', imgUrl);
                    if (imgUrl) {
                      setCurrentPeriodModalIndex(periodIndex);
                      setModalImg(imgUrl);
                      setModalVisible(true);
                    }
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  </Stack>

  <Modal
      open={modalVisible}
      onOk={handleOk}
      onCancel={handleOk}
      footer={null}
      title=""
      okText="OK"
      cancelButtonProps={{ style: { display: 'none' } }}
      style={{ padding: 20, minWidth: modalImg?.status !== 'off' ?'90vw':250 }}
    >
      <CenterBox>
        <Box sx={{borderRadius:10, backgroundColor:"#00B4B6", px:5, py:1}}>
          <Typography sx={{textTransform:"uppercase",color:"#fff",fontWeight:500,textAlign:"center"}}>{username}</Typography>
          {modalImg?.out?.img && 
            <Typography sx={{color:"#fff",textAlign:"center",fontSize:10}}>Số giờ làm trong buổi: {modalImg.workhour?.toFixed(2)}</Typography>
          }
        </Box>

        
        {/* <Button onClick={() => {
          console.log("Current", currentPeriodModalIndex);
          console.log("Main data", mainData);
          console.log("Modal infor", modalImg);
          // modalImg.in = ;
        }} 
          sx={{border:'1px solid #00B5B4', margin: 1, padding:'5px 20px', borderRadius:30}}>
          <span style={{color:'1px solid #00B5B4'}}>Reset check-in</span>
        </Button> */}

        {modalImg?.status !== 'off' &&
          <Typography fontSize={10} color="#00B4B6" fontStyle="italic">Nhấp vào hình để xem vị trí trên googlemap</Typography>}
            
        <Stack direction="row" spacing={2} style={{ padding: 20, minHeight: '80vh', width:'fit-content' }}>
          {modalImg?.in?.img && 
            <Stack>
              <Typography textAlign="center">Check in {modalImg?.in?.time}</Typography>
              <img
                src={`${useApiStatic()}/${modalImg.in.img}`}
                alt="Check-in"
                style={{ maxHeight: '80vh', minWidth:300, borderRadius: 8, marginBottom: 8, cursor:'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (modalImg?.in?.lat && modalImg?.in?.long && modalImg?.in?.lat !== '-' && modalImg?.in?.long !== '-') {
                    const url = `https://www.google.com/maps?q=${modalImg?.in?.lat},${modalImg?.in?.long}`;
                    window.open(url, '_blank');
                  } else {
                    notification.error({ message:'Không có tọa độ để mở bản đồ'});
                  }
                }}
              />
            
            </Stack>
          }

          {modalImg?.out?.img && 
            <Stack>
              <Typography textAlign="center">Check out {modalImg?.out?.time}</Typography>
              <img
                src={`${useApiStatic()}/${modalImg.out.img}`}
                alt="Check-out"
                style={{ maxHeight: '80vh',   minWidth:300, borderRadius: 8, marginBottom: 8, cursor:'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (modalImg?.out?.lat && modalImg?.out?.long && modalImg?.out?.lat !== '-' && modalImg?.out?.long !== '-') {
                    const url = `https://www.google.com/maps?q=${modalImg?.out?.lat},${modalImg?.out?.long}`;
                    window.open(url, '_blank');
                  } else {
                    notification.error({message: 'Không có tọa độ để mở bản đồ'});
                  }
                }}
              />
            
            </Stack>
          }

          {modalImg?.status === 'off' && 
            <Stack>
              <Typography textAlign="center" style={{fontWeight: 700}}>XIN NGHỈ PHÉP</Typography>
              <Typography textAlign="center">
                {modalImg.day.getDate().toString().padStart(2, '0') + '-' +
                      (modalImg.day.getMonth() + 1).toString().padStart(2, '0') + '-' +
                      modalImg.day.getFullYear()}
              </Typography>
              <Typography textAlign="center">Buổi {modalImg.period  == 0 ? 'sáng' : (modalImg.period == 1 ? "chiều" : "tối")}</Typography>
              <Typography textAlign="center">Lý do: {modalImg.text}</Typography>
              
            </Stack>
          }
      
        </Stack>
      </CenterBox>
      
    </Modal>
  </>
  );
}
