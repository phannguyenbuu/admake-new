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
            <Typography>Thưởng theo công vi</Typography>
           
          </CenterBox>
          
        </Modal>
      
    );
    
}

export default StatisticsMonthDays;