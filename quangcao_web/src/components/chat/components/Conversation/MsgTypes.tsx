import { Avatar, Box, Divider, IconButton, Link, Stack, Typography, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DotsThreeVertical, DownloadSimple, Image } from 'phosphor-react';
import React, { useEffect, useState } from 'react';
import { useUser } from '../../UserContext';
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

const baseUrl = useApiStatic();

function get_role_name(role:number):string {
  if(role === -1)
    return "Khách hàng"
  else
    return "Công ty"
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
            <Image size={48} />
            <Typography variant="caption">{el.file_url}</Typography>
            <IconButton onClick={handleDownload}>
              <DownloadSimple />
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
    // const { userId, username } = useUser();
    // const [incoming, setIncoming ] = useState(true);
    // const [bkColor, setBkColor ] = useState("#fff");
    // const [textColor, setTextColor ] = useState("#000");

    const isIncoming = el.role < 0; //username !== el.user_role;
    // console.log('TextMsg',username, el.user_role);

    const bkColor = isIncoming
    ? '#fff'
    : el.status === 'sending'
    ? '#b0b0b0'
    : theme.palette.primary.main;

    const textColor = isIncoming ? '#000' : '#fff';

    // console.log('icon', el.icon);
    
    return (
        <Stack key={`DefaultMsg-${el.message_id}-Wrapper`} direction='row' justifyContent={isIncoming ? 'start' : 'end'}>
            <Box key={`DefaultMsg-${el.message_id}-Conatiner`} p={0.5} 
                sx={{ backgroundColor: bkColor, borderRadius: 1.5, width: 'max-content', height:'fit-content'}}>
                {isIncoming && 
                    <Stack direction='row' alignItems="center" spacing={1}>
                        <Avatar alt={get_role_name(el.role)} src={el.icon || '/images/avatar.png'} sx={{ width: 24, height: 24 }} />
                        <Typography key={`DefaultMsg-${el.message_id}-Username`} 
                          variant="subtitle2" color={textColor} fontSize='0.75rem' fontWeight={500}>
                        {get_role_name(el.role)}
                        </Typography>
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

const TimeLine: React.FC<MsgTypeProps> = ({ el }) => {
  if(!el) return null;
  const theme = useTheme();
  return <Stack direction='row' alignItems='center' justifyContent='space-between'>
      <Divider />
      <Typography variant='caption' sx={{ color: "#000" }}>
          {el.text}
      </Typography>
      <Divider />
  </Stack>
}

const MessageOptions: React.FC<MsgTypeProps> = ({el, onDelete }) => {
  if(!el) return null;
  // const { userId, username } = useUser();
  const isIncoming = el.role < 0; // username !== el.user_role;

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
    <DotsThreeVertical 
    id="basic-button"
    aria-controls={open ? 'basic-menu' : undefined}
    aria-haspopup="true"
    aria-expanded={open ? 'true' : undefined}
    onClick={handleClick}
    size={20}
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
        {isIncoming &&
        <>
        <MenuItem >
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
        
        <Divider/>

        <MenuItem>
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
        </MenuItem>
        
        <MenuItem onClick={handleDelete}>
            <ListItemIcon>
                <DeleteIcon fontSize="small" />
            </ListItemIcon>Delete
        </MenuItem>

      </Stack>
      </Menu>
    </>
  )
}


// should not be default export, because we need to export multiple things
export { TimeLine, TextMsg, MediaMsg, ReplyMsg, LinkMsg, DocMsg }
