import { Avatar, Box, Divider, IconButton, Link, Button, Stack, Typography, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState, useContext } from 'react';
import { useUser } from '../../../../common/hooks/useUser';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ReplyIcon from '@mui/icons-material/Reply';
import ReportIcon from '@mui/icons-material/Report';
import FavoriteIcon from '@mui/icons-material/Favorite'; // Heart filled
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // Heart outline
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import PanToolIcon from '@mui/icons-material/PanTool';
import type { MsgTypeProps } from '../../../../@types/chat.type';
import { useApiHost, useApiStatic } from '../../../../common/hooks/useApiHost';
import { Link as RouterLink } from 'react-router-dom';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Rating from '@mui/material/Rating';
import { socket } from './socket';
import { UpdateButtonContext } from '../../../../common/hooks/useUpdateButtonTask';

const baseUrl = useApiStatic();

function get_role_name(role:number):string {
  if(role === -1)
    return "Khách hàng"
  else
  {
    const user = JSON.parse(localStorage.getItem('Admake-User-Access') || '{}');
    return user?.username || '';
  }
}

export function formatTime(datetimeStr: Date): string {
    // const datetimeStr = "2025-09-08T07:40:10.608041+07:00";

    // Tạo đối tượng Date
    const dateObj = new Date(datetimeStr);

    // Lấy các phần riêng biệt
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    // Kết hợp thành chuỗi định dạng "YYYY-MM-DD HH:mm:ss"
    // const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const formatted = `Ngày ${day}/${month}/${year}-${hours}:${minutes}`;

    return(formatted);
}

const DocMsg:React.FC<MsgTypeProps> = ({ el, menu, onDelete }) => {
  if(!el) return;

  const theme = useTheme();
  const fileUrl = `${baseUrl}/${el?.file_url}`;
  // Hàm tải file
  const handleDownload = () => {
    // Lấy url file, thêm hostname đầy đủ nếu cần
     // hoặc URL server của bạn
    // const fileUrl = baseUrl + el?.file_url;
    console.log('Download File', fileUrl);

    const link = document.createElement("a");
    link.href = fileUrl;
    
    const fileName = fileUrl.split("/").pop();
    if (fileName) {
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box
        p={0.2}
        sx={{
          backgroundColor: el.incoming
            ? theme.palette.background.default
            : theme.palette.primary.main,
          borderRadius: 1.5,
          width: "max-content",
        }}
      >
        <Stack spacing={2}>
             <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <Stack
            p={2}
            spacing={3}
            direction="row"
            alignItems="center"
            sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}
          >
            <ImageIcon fontSize="large" />
            <Typography variant="caption">{el.file_url}</Typography>
            <IconButton onClick={handleDownload}>
              <DownloadIcon fontSize="large" />
            </IconButton>
          </Stack>
          <Typography variant="body2" sx={{ color: el.incoming ? "#000" : "#fff" }}>
            {formatTime(el.createdAt)}
          </Typography>
          </a>
        </Stack>
      </Box>
      {menu && <MessageOptions el={el} onDelete={()=>onDelete(el)}/>}
    </Stack>
  );
};

const LinkMsg: React.FC<MsgTypeProps> = ({el,menu,onDelete}) => {
  if(!el) return null;
  const theme = useTheme();
  return (
    <Stack direction='row' justifyContent={el.incoming ? 'start' : 'end'}>
        <Box p={0.2} sx={{
                backgroundColor: el.incoming ? theme.palette.background.default :
                    theme.palette.primary.main, borderRadius: 1.5, width: 'max-content'
            }}>
        <Stack spacing={2}>
            <Stack p={2} spacing={3} alignItems='start'
             sx={{backgroundColor:theme.palette.background.paper, borderRadius: 1}}>
                <img src={el.preview} alt={el.text} style={{maxHeight:210, borderRadius:'10px'}}/>
                <Stack spacing={2}>
                    <Typography variant='subtitle2'>Creating Chat App</Typography>
                    <Typography variant='subtitle2' sx={{color:"#000"}} 
                    component={RouterLink} to="//https://www.youtube.com">www.youtube.com</Typography>
                </Stack>
                <Typography variant='body2' color={el.incoming ? "#000" : '#fff'}>
                    {el.text}
                </Typography>
            </Stack>
        </Stack>
        </Box>
        {menu && <MessageOptions el={el} onDelete={()=>onDelete(el)}/>}
    </Stack>
  )
}

const ReplyMsg: React.FC<MsgTypeProps> = ({el, menu, onDelete}) => {
  if(!el) return null;
    const theme = useTheme();
  return (
    <Stack direction='row' justifyContent={el.incoming ? 'start' : 'end'}>
        <Box p={0.2} sx={{
                backgroundColor: el.incoming ? theme.palette.background.default :
                    theme.palette.primary.main, borderRadius: 1.5, width: 'max-content'
            }}>
        <Stack spacing={2}>
            <Stack p={2} direction='column' spacing={3} alignItems='center'
            sx={{backgroundColor:theme.palette.background.paper, borderRadius:1}}>
                <Typography variant='body2' color="#000">
                    {el.text}
                </Typography>    
            </Stack>
            <Typography variant='body2' color={ el.incoming ? "#000" : '#fff'}>
                {el.reply}
            </Typography>
        </Stack>
        </Box>
        {menu && <MessageOptions el={el} onDelete={()=>onDelete(el)}/>}
    </Stack>
  )
}

const MediaMsg: React.FC<MsgTypeProps> = ({ el, menu,onDelete }) => {
  if(!el) return null;
  const theme = useTheme();
  
  const imageUrl = `${baseUrl}/${el.file_url}`;

  return (
    <Stack direction="row" justifyContent={el.incoming ? 'start' : 'end'}>
      <Box
        p={0.2}
        sx={{
          backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
          borderRadius: 1.5,
          width: 'max-content'
        }}
      >
        <Stack spacing={1}>
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={imageUrl} 
              alt={el.text} 
              style={{ maxHeight: 210, borderRadius: '10px', cursor: 'pointer' }} 
            />
          </a>
          <Typography variant='body2'  fontStyle="italic" color={ el.incoming ? "#000" : '#fff'} 
            fontSize='0.5rem' fontWeight={300}>
            {formatTime(el.createdAt)}-{el.user_id}
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOptions el={el} onDelete={()=>onDelete(el)}/>}
    </Stack>
  );
};



const TextMsg: React.FC<MsgTypeProps> = ({el, menu, onDelete}) => {
    if(!el) return null;
    const theme = useTheme();
    const {userRoleId} = useUser();
    const full = userRoleId === -2;

    // const { userId, username } = useUser();
    // const [incoming, setIncoming ] = useState(true);
    // const [bkColor, setBkColor ] = useState("#fff");
    // const [textColor, setTextColor ] = useState("#000");

    const isCustomer = el.role === -1; //username !== el.user_role;
    console.log('TextMsg',el.username, el.role);

    const bkColor = isCustomer
    ? '#fff'
    : el.status === 'sending'
    ? '#b0b0b0'
    : "#00B4B6";

    const textColor = isCustomer ? '#000' : '#fff';

    // console.log('icon', el.icon);
    
    return (
        <Stack key={`DefaultMsg-${el.message_id}-Wrapper`} direction='row' justifyContent={isCustomer ? 'start' : 'end'}>
            <Box key={`DefaultMsg-${el.message_id}-Conatiner`} p={0.5} 
                sx={{ backgroundColor: bkColor, borderRadius: 1.5, width: 'max-content', height:'fit-content'}}>
                {!isCustomer && 
                    <Stack direction='row' alignItems="center" spacing={1}>
                        {full && 
                          <>
                            <Avatar alt={el.username} src={'/images/avatar.png'} sx={{ width: 24, height: 24 }} />
                            <Typography key={`DefaultMsg-${el.message_id}-Username`} 
                              variant="subtitle2" color={textColor} fontSize='0.75rem' fontWeight={500}>
                            {el.username}
                            </Typography>
                          </>
                        }
                    </Stack>
                }

                <Typography key={`DefaultMsg-${el.message_id}-Text`} 
                  variant="body2" p={1} color={textColor} fontSize='0.75rem' fontWeight={300}>
                    {el.text}
                </Typography>
                
                <Typography key={`DefaultMsg-${el.message_id}-Time`} 
                  variant="body2" fontStyle="italic" fontSize='0.5rem' fontWeight={300} color={textColor}>
                    {formatTime(el.createdAt)}-{el.user_id}
                </Typography>
            </Box>
            {menu && <MessageOptions el={el} onDelete={()=>onDelete(el)}/>}
        </Stack>
    )
}

import { useWorkSpaceQueryTaskById } from '../../../../common/hooks/work-space.hook';
import NotifyModal from '../../../../common/layouts/base/NotifyModal';

const TimeLine: React.FC<MsgTypeProps> = ({ el, menu, onDelete }) => {
  if(!el) return null;

  const {notifyAdmin} = useUser();
  const [value, setValue] = useState<number | null>(el?.react?.rate ?? 0);
  
  const {userRoleId} = useUser();
  const full = userRoleId === -2;
  
  
  useEffect(() => {
      socket.on('admake/chat/rate', (msg) => {
        console.log('Received rate:', msg);
        setValue(msg.rate);
      });
  
      socket.on('admake/chat/rate_ack', data => {
  
      });
  
      return () => {
        socket.off('admake/chat/rate');
      };
    }, [el]);

  const handleReward = async (rate: number | null) => {
    
    console.log("Connected rates", socket.connected, socket.io.opts.host);
    
    if (socket.connected) {
      const data = {
        workspace_id: el.workspace_id,
        message_id: el.message_id,
        rate: rate,
      };

      console.log('Send rate message', el.workspace_id, data);
      notifyAdmin({text:`Khách hàng vừa chấm ${rate} sao`, 
        target: `/dashboard/work-tables/${el?.workspace_id}`});
      
      socket.emit('admake/chat/rate', data);
   
      const context = useContext(UpdateButtonContext);
      if (!context) 
        throw new Error("UpdateButtonContext not found");
      else
      {
        const { setShowUpdateButton } = context;
        setShowUpdateButton(1);
      }
    } else {
      console.warn('Socket.IO not connected.');
    }
  }

  // console.log('Timeline',el.text, userRoleId);
  // const theme = useTheme();

  const handleRatingChange = (event: React.SyntheticEvent<Element, Event>, newValue: number | null) => {
    console.log("Rating value:", newValue, "cho group", el.workspace_id, " message_id", el.message_id);
    setValue(newValue);
    handleReward(newValue);
  };

  const labels: {[index in 1 | 2 | 3 | 4 | 5]: string} = {
    1: 'Quá kém',
    2: 'Kém',
    3: 'Trung bình',
    4: 'Đạt',
    5: 'Rất tốt',
  };

  const disable = el && el.react && el?.react?.rate != 0;
  // console.log(el?.react?.rate != 0, el);

  return (
    <>
    <Stack alignItems='center' justifyContent='space-between' 
      spacing={2} py={5} sx={{backgroundColor:"rgba(0,255,255,0.25)", borderRadius: 5}}>
        <Typography variant='caption' sx={{ color: "#000" }}>
          {el.text}
      </Typography>
      {(userRoleId < 0 || full) && !el.is_favourite &&
      
        <Rating
          name="simple-controlled"
          value={value}
          // defaultValue={el?.react?.rate ?? 0}
          max={5}
          onChange={handleRatingChange}
          sx={{ color: "#ffff00ff" }}

          disabled = {disable}
        />
      
      }
      <Stack direction="row" spacing={2}>
      {value !== null && (
        <Typography sx={{ mt: 1, color: "#333" }}>
          {labels[value as 1 | 2 | 3 | 4 | 5]}
        </Typography>
      )}

      {menu && <MessageOptions el={el} onDelete={()=>onDelete(el)}/>}
        </Stack>
  </Stack>
  </>
  )
  
}

const MessageOptions: React.FC<MsgTypeProps> = ({el, onDelete }) => {
  if(!el) return null;
  // const { userId, username } = useUser();
  const isCustomer = el.role < 0; // username !== el.user_role;

    // console.log('MessageOptions',username, el.user_role);

  const [anchorEl, setAnchorEl] = useState<SVGSVGElement | null>(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  
  const handleDelete = () => {
    handleClose();
    if (onDelete) {
      onDelete(el); // gọi callback truyền từ cha để xóa
    }
  };


  return (
    <>
    <MoreVertIcon  
    id="basic-button"
    // aria-controls={open ? 'basic-menu' : undefined}
    // aria-haspopup="true"
    // aria-expanded={open ? 'true' : undefined}
    onClick={handleClick}
    // size={20}
    fontSize='small'
    />

    <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
      <Stack spacing={1} px={1}>
        {isCustomer &&
        <>
        {/* <MenuItem >
            <ListItemIcon>
                <FavoriteIcon sx={{ color: 'red' }} fontSize="small" />
            </ListItemIcon>
        </MenuItem>
        
        <MenuItem >
            <ListItemIcon>
                <PanToolIcon sx={{ color: 'green',transform: 'rotate(90deg)' }}  fontSize="small" />
            </ListItemIcon>
        </MenuItem>
        <MenuItem >
            <ListItemIcon>
                <SentimentSatisfiedIcon sx={{ color: 'orange' }}  fontSize="small" />
            </ListItemIcon>
        </MenuItem>
        
        <Divider/> */}

        {/* <MenuItem>
            <ListItemIcon>
                <ReplyIcon fontSize="small" />
            </ListItemIcon>Reply
        </MenuItem>

        <MenuItem >
            <ListItemIcon>
                <ReportIcon fontSize="small" />
            </ListItemIcon>Report
        </MenuItem>
        
        </>}
        
        <MenuItem >
            <ListItemIcon>
                <ExitToAppIcon fontSize="small" />
            </ListItemIcon>Forward
        </MenuItem> */}
        
        <MenuItem onClick={handleDelete}>
            <ListItemIcon>
                <DeleteIcon fontSize="small" />
            </ListItemIcon>Delete
        </MenuItem>
          </>}
      </Stack>
      </Menu>
    </>
  )
}


// should not be default export, because we need to export multiple things
export { TimeLine, TextMsg, MediaMsg, ReplyMsg, LinkMsg, DocMsg }
