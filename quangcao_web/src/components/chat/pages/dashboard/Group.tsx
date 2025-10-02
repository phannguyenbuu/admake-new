 import { Box, Button, Stack, Typography, Link, IconButton, Divider } from '@mui/material'
import React, { useState, useEffect } from 'react';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search'
import { MagnifyingGlass, Plus, WindowsLogo, CaretLeft, CaretRight, X } from 'phosphor-react';
import { useTheme } from "@mui/material/styles";

import '../../css/global.css';
import { useSelector } from "react-redux";
import ChatElement from '../../components/ChatElement';
import CreateGroup from '../../sections/main/CreateGroup';
import useApiFlaskReceive from "../../api/ApiFlaskReceive";
import Conversation from "../../components/Conversation";
import { socket } from '../../components/Conversation/socket';
import Contact from '../../components/Contact';
import StarredMessages from '../../components/StarredMessages';
import SharedMessages from '../../components/SharedMessages';
import { useWindowDimensions } from '../../hooks/useResponsive';
import type { GroupProps, MessageTypeProps } from '../../../../@types/chat.type';
import { useUser } from '../../../../common/hooks/useUser';

import { useApiHost, useApiSocket } from '../../../../common/hooks/useApiHost';
interface GroupComponentProps {
  selected: GroupProps | null;
  setSelected: React.Dispatch<React.SetStateAction<GroupProps | null>> | null;
}

const Group: React.FC<GroupComponentProps> = ({ selected, setSelected }) => {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [messageList, setMessages] = useState<MessageTypeProps[]>([]);
    const [title, setTitle] = useState('');
    const [currentGroup, setcurrentGroup] = useState<GroupProps | null>(null);
    const [status, setStatus] = useState<string | undefined>('');
    const [_loading, setLoading] = useState(false);
    const [_error, setError] = useState(null);
    const urlApi = useApiHost();
    const {userRoleId} = useUser();
    const [showFooter, setShowFooter] = useState<boolean>(false);
    const full = userRoleId > 0;

    useEffect(() => {
    if (selected !== null && selected !== undefined) {
      console.log("SLEED", selected);
      handleClick(selected); // Có thể truyền tên trống hoặc lấy từ data thực tế
      setShowFooter(selected?.status === "talk" || selected?.status === "pass");
    }
  }, [selected]);

    const handleDeleteMessage = (el:MessageTypeProps) =>{
     fetch(`${urlApi}/message/${el.message_id}`, { method: 'DELETE' })
         .then(res => {
         if (!res.ok) throw new Error('Delete failed');
         return res.json();
         })
         .then(() => {
            //   Cập nhật lại state messageList để xóa message vừa gọi delete
             console.log('Delete msg:', messageList);
             setMessages(prevMessages => prevMessages.filter(m => m.message_id !== el.message_id));
         })
     .catch(console.error);

 }

 

    //   Xử lý khi click vào group
    const handleClick = (el:GroupProps) => {
        if(setSelected)
        {
            setSelected(el);
        }
        setLoading(true);

        fetch(`${urlApi}/group/${el.id}/messages`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data.messages) {
                    console.log('Data_Message', data.messages);
                    setMessages(data.messages);
                    //  console.log('OK1');
                    setTitle(el.name);
                    //  console.log('OK2');
                    setStatus(el.status);
                    setcurrentGroup(el);
                    //  console.log('OK3');
                }
                setLoading(false);
                //  console.log('OK4');
            })
            .catch((err) => {
                console.error('Error khi lấy dữ liệu:', err);
                setError(err);
                setLoading(false);
            });
        setShowLeft(false);
    };


const [groupList, setGroupList] = useState<GroupProps[]>([]);
  const API_HOST = useApiHost();
  
  useEffect(() => {
    // console.log('!!!API', API_HOST);

    fetch(`${API_HOST}/group/`)
      .then((res) => res.json())
      .then((data: GroupProps[]) => 
        {
        //   console.log('GroupData', data);
          setGroupList(data);
        })
      .catch((error) => console.error("Failed to load group data", error));
  }, []);


  
 useEffect(() => {
    if (!currentGroup) return;

    socket.on('admake/chat/message_deleted', ({ message_id }) => {
        setMessages(prev => prev.filter(m => m.message_id !== message_id));
    });

    //   Join vào room group hiện tại
    socket.emit('admake/chat/join_group', { group_id: currentGroup.id });

    //   Lắng nghe tin nhắn mới realtime
    socket.on('admake/chat/message', (msg) => {
        console.log('Current Group ID', currentGroup, msg);
        if (msg.group_id === currentGroup.id) {  // chỉ thêm tin nhắn cùng group
            setMessages(prev => [...prev, msg]);  // thêm tin nhắn mới vào cuối
        }
    });

    //   Cleanup khi unmount hoặc khi currentGroup thay đổi
    return () => {
        socket.off('admake/chat/message');
        socket.off('admake/chat/message_deleted');
        socket.emit('admake/chat/leave_group', { group_id: currentGroup.id }); // tùy backend có xử lý leave room không
    };
 }, [currentGroup]);



 const theme = useTheme();
//  const [openDialog, setOpenDialog] = useState(false);

 return (
     <>
         <Stack direction={'row'}>
            { full &&
             <Box sx={{
                backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : "#fff",
                minWidth: '20vw',
                display: {xs: showLeft ? "block" : "none", sm: "block",},
                boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
             }}>
                 <Stack p={0} spacing={2}>
                     <Search>
                         <SearchIconWrapper>
                             <MagnifyingGlass color="#709CE6" />
                         </SearchIconWrapper>
                         
                     </Search>
                    
                     <Divider />
                     <Stack spacing={0.5} className='scrollbar' sx={{ flexGrow: 1, overflowY: 'hidden'}}>
                        <Typography variant='subtitle2' sx={{ color: '#676667' }}>Pinned</Typography>
                        {groupList && groupList.filter(el => el.name === 'TELEGRAM' || el.name === 'APPLE').map((el, idx) => (
                            <ChatElement
                                id={el.id}
                                img={el.img}
                                online={true}
                                time={el.time}
                                name={el.name}
                                msg={el.msg}
                                unread={el.unread}
                                onClick={() => handleClick(el)}
                                key={`ChatElement-${idx}`}
                            />
                        ))}

                        <Typography variant='subtitle2' sx={{ color: '#676667' }}>All Groups</Typography>
                        <Stack spacing={0} sx={{height:'55vh', overflowY:'auto', overflowX:'hidden'}}>
                            
                            {groupList && groupList.filter(el => !el.pinned).map((el, idx) => (
                                <ChatElement
                                    id={el.id}
                                    img={el.img}
                                    online={true}
                                    time={el.time}
                                    name={el.name}
                                    msg={el.msg}
                                    unread={el.unread}
                                    onClick={() => handleClick(el)}
                                    key={`ChatElement-${idx}`}
                                />
                            ))}
                        </Stack> 
                    
                     </Stack>
                 </Stack>
             </Box>}

             
            <Conversation
                setMessages={setMessages}
                messages={messageList}
                title={title}
                status={status || null}
                groupEl={currentGroup}
                userId=''
                username=''
                onDelete={handleDeleteMessage}
                showFooter={showFooter}
            />
        
            {full &&
             <Box sx={{ height: '100%',
                  backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : "#fff",
                 width: 320,
                 display: {
                     xs: showRight ? "block" : "none",
                     sm: "block",
                 },
                 boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'}}>
                    <Contact messages={messageList} groupEl={selected ?? null} setShowFooter={setShowFooter}/>
             </Box>}
         </Stack>

         <Stack
             direction="row"
             spacing={30}
             sx={{display: { xs: "flex", sm: "none" }}}
         >
             <Button sx={{
                 position: "fixed",
                 top: 400,
                 left: -8,
                 justifyContent: "center",
                 display: { xs: "none", sm: "none" },
                 zIndex: 999,
             }}
            
             onClick={() => setShowLeft(!showLeft)}>
                 {!showLeft ? <Box sx={{ml:0}}><CaretRight size={24} weight="bold" /></Box> : <X size={24} weight="bold" />}
             </Button>
             <Button sx={{
                 position: "fixed",
                 top: 390,
                 right: 50,
                
                 justifyContent: "center",
                 display: { xs: "none", sm: "none" },
                 zIndex: 999,
             }} onClick={() => setShowRight(!showRight)}>
                 {!showRight ? <Box sx={{position:'relative', left:20}}>
                     <CaretLeft size={24} weight="bold" />
                 </Box> : <X size={24} weight="bold" />}
             </Button>
         </Stack>

         {/* {openDialog && <CreateGroup open={openDialog} handleClose={handleCloseDialog} />} */}
     </>
 );
};

export default Group;







