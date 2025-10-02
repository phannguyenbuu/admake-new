import { Avatar, Box, Divider, IconButton,Button, Stack, Typography, Grid } from '@mui/material'
import React, {useState, useEffect} from 'react';
import { useTheme } from "@mui/material/styles";
import { Camera, Bell, CaretLeft, Image, Info, Key, Airplane, Keyboard, Lock, Note, PencilCircle } from 'phosphor-react';
import { faker } from '@faker-js/faker';
import Shortcuts from '../../sections/settings/Shortcuts';
// import Conversation from '../../components/Conversation';

import { CenterBox } from '../../components/commons/TitlePanel';
import infor from '../../json/attendance.json';
import { useUser } from '../../../../common/hooks/useUser';
import CommentDialog from '../../components/CommentDialog';
import CameraDialog from '../../components/commons/CameraDialog';
// import ReportDialog from '../../components/ReportDialog';

const Settings = () => {
  

  const theme = useTheme();

  const [openShortcuts, setOpenShortcuts] = useState(false);
  const { userId, username } = useUser();

  const [openCamera, setOpenCamera] = useState(false);

  const handleCameraClick = (title) => {
    setOpenCamera(true);
    setDialogTitle(title);
  };

  // const [openAttendance, setOpenAttendance] = useState(false);

  // const handleAttendanceClick = (title) => {
  //   setOpenAttendance(true);
  //   setDialogTitle(title);
  // };

    const handleOpenShortcuts = ()=>{
        setOpenShortcuts(true);
    }

    const handleCloseShortcuts = ()=>{
        setOpenShortcuts(false);
    }

    const iconSize = 32;

    const list = [
      {
        key:0,
        color: "#ffaf32",
        icon: <Camera size={iconSize}/>,
        title: 'Điểm danh tại văn phòng',
        onclick: () =>{handleCameraClick("Attendance on office")}
      },
      {
        key:1,
        color: "#ff5733",
        icon: <Camera size={iconSize}/>,
        title: 'Điểm danh tại công trình',
        onclick: () =>{handleCameraClick("Attendance on site")}
      },
      {
        key:2,
        color: "#3589fd",
        icon: <Info size={iconSize}/>,
        title: 'Điểm danh chỗ khách',
        onclick: () =>{handleAskClick("Assign Overtime")}
      },
      {
        key:3,
        color: "#7da136ec",
        icon: <Key size={iconSize}/>,
        title: 'Đặt lịch nghỉ phép',
        onclick: () =>{handleAskClick("Assign Leavetime")}
      },
      {
        key:4,
        color: "#3357ff",
        icon: <PencilCircle size={iconSize}/>,
        title: 'Đặt lịch hẹn khách',
        //onclick: handleOpenTheme
        onclick: () =>{handleAskClick("Assign Travel for work")}
      },
      {
        key:5,
        color: "#de9ddb",
        icon: <Airplane size={iconSize}/>,
        title: 'Đặt lịch công tác',
        onclick: () =>{handleAskClick("Attendance Report")}
      },
      {
        key:6,
        color: "#ff33c992",
        icon: <Note size={iconSize}/>,
        title: 'Bảng lương',
        onclick: () => {handleAskClick('Salary Report')}
      },
      {
        key:7,
        color: "#eb5656ff",
        icon: <Bell size={iconSize} color="#fff"/>,
        title: 'Bảng công',
        onclick:() =>{handleAskClick("Báo giờ")}
      },
      {
        key:8,
        color: "#74bcd4ff",
        icon: <Info size={iconSize}/>,
        title: 'Bảng công',
        onclick:  handleOpenShortcuts
      },
    ]

    const [open, setOpen] = useState(false);
      const [dialogTitle, setDialogTitle] = useState(false);
      const handleAskClick = (title) => {
        setOpen(true);
    setDialogTitle(title);
  };

  return (
    <>
    <Stack direction='column' sx={{width:'100%', p:2, background:'url("/backGround.png")'}}>
        {/* Left panel */}
        <Box className='scrollbar' sx={{overflow:'scroll', width:'100%'}}>
          
            <CenterBox sx={{width:'80vw'}}>
                <Typography variant='h6'>{username}</Typography>
                
                <Box p ={2} sx={{width:'100%', border:'1px solid #ccc', borderRadius:1 }}>
                  <Stack direction='column' spacing={3} sx={{justifyContent:"center", alignItems:"center"}}>
                    <Avatar sx={{height:150, width:150}} src={'/images/avatar.png'}/>
                    <CurrentDateTime />
                    <Button sx={{background:"#ccc", borderRadius:5}}>Ra Về</Button>
                  </Stack>
                </Box>
                    
                <GridButtons list={list}/>
            </CenterBox>
            
        </Box>
        {/* Right panel */}
      <Typography variant="body1" fontSize={8} textAlign='center' mt={2}>
        Ngày làm tháng này:
      </Typography>
      <Typography variant="body1"fontSize={8} textAlign='center'>
        Ngày nghỉ tháng này:
      </Typography>
    </Stack>
    {openShortcuts && <Shortcuts open={openShortcuts} handleClose={handleCloseShortcuts}/>}
      

      {/* <ReportDialog open={openAttendance} setOpen={setOpenAttendance} dialogTitle={dialogTitle} data={infor}/> */}
      {/* <CameraDialog open={openAttendance} setOpen={setOpenAttendance} dialogTitle={dialogTitle}/> */}
      <CameraDialog open={openCamera} setOpen={setOpenCamera} dialogTitle={dialogTitle}/>
      
     <CommentDialog open={open} setOpen={setOpen} dialogTitle={dialogTitle}/>
    </>
  )
}

export default Settings;




// import React from 'react';


const GridButtons = ({ list }) => {
  return (
    <Grid container spacing={0.5} mt={2}>
      {list.map(({ key, icon, title, onclick, color }, index) => (
        <Grid item xs={4} key={key}>
          <Stack
            spacing={0.5}
            onClick={onclick}
            sx={{ cursor: 'pointer', borderRadius:2, 
              minWidth: 72, maxWidth: 72, 
              minHeight: 80, maxHeight: 80, p:1,
              background: '#ccc', alignItems: 'center' }}
          >
            {/* Icon nằm trên */}
            <div>{icon}</div>
            {/* Title nhỏ hơn, nằm dưới icon */}
            <Typography variant='caption' fontSize={8} textAlign='center'>{title}</Typography>
            {/* Nếu không phải phần tử cuối cùng trong mỗi hàng thì hiển thị Divider */}
            {(index + 1) % 3 !== 0 && key !== 7 && <Divider sx={{ width: '100%' }} />}
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
};

const NowToString = () => {
  const now = new Date();
  const formatted = now.toLocaleString('vi-VN', {
    weekday: 'long', // Thứ dài (Thứ Hai, Thứ Ba...)
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return(formatted);

}

const CurrentDateTime = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // cập nhật mỗi giây để giờ hiện tại luôn mới

    return () => clearInterval(timer); // dọn dẹp khi component unmount
  }, []);

  return (
    <CenterBox>
      <Typography variant="body1">
        {NowToString()} {/* Hiển thị theo định dạng ngày giờ locale */}
      </Typography>
    </CenterBox>
  );
};
