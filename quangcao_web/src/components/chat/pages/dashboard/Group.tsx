 import { Box, Button, Stack, Typography, Link, IconButton, Divider } from '@mui/material'
import React, { useState, useEffect } from 'react';
import { useTheme } from "@mui/material/styles";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import '../../css/global.css';

import ChatElement from '../../components/ChatElement';

import Conversation from "../../components/Conversation";
import { socket } from '../../components/Conversation/socket';
import Contact from '../../components/Contact';
import type { MessageTypeProps } from '../../../../@types/chat.type';
import { useUser } from '../../../../common/hooks/useUser';

import { useApiHost } from '../../../../common/hooks/useApiHost';
import { notification } from 'antd';
import type { WorkSpace } from '../../../../@types/work-space.type';
import { ChatGroupProvider, useChatGroup } from '../../ProviderChat';
// interface GroupComponentProps {
//   selected: WorkSpace | null;
//   setSelected: React.Dispatch<React.SetStateAction<WorkSpace | null>> | null;
// }

const Group = () => {
    const {workspaceEl, setWorkspaceEl} = useChatGroup();
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [messageList, setMessages] = useState<MessageTypeProps[]>([]);
    const [title, setTitle] = useState('');
    // const [currentGroup, setcurrentGroup] = useState<WorkSpace | null>(null);
    const [status, setStatus] = useState<string | undefined>('');
    const [_loading, setLoading] = useState(false);
    const [_error, setError] = useState(null);
    const urlApi = useApiHost();
    const {userRoleId, workspaces, isMobile} = useUser();
    // const [showFooter, setShowFooter] = useState<boolean>(false);

    
    const full = userRoleId === -2;

    useEffect(()=>{
        console.log('Role', userRoleId);
    },[]);

    useEffect(() => {
    if (workspaceEl !== null && workspaceEl !== undefined) {
    //   console.log("SLEED", selected);
      handleClick(workspaceEl);
    }
  }, [workspaceEl]);

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
    const handleClick = (el:WorkSpace) => {
        if(setWorkspaceEl)
            setWorkspaceEl(el);
        
        setLoading(true);

        console.log("EL", el);

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
                    setWorkspaceEl(el);
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
  
    useEffect(() => {
        if (!workspaceEl) return;

        socket.on('admake/chat/message_deleted', ({ message_id }) => {
            setMessages(prev => prev.filter(m => m.message_id !== message_id));
        });

        //   Join vào room group hiện tại
        socket.emit('admake/chat/join_group', { workspace_id: workspaceEl.id });

        //   Lắng nghe tin nhắn mới realtime
        socket.on('admake/chat/message', (msg) => {
            // console.log('Current Group ID', workspaceEl, msg);
            if (msg.workspace_id === workspaceEl.id) {  // chỉ thêm tin nhắn cùng group
                setMessages(prev => [...prev, msg]);  // thêm tin nhắn mới vào cuối
            }
        });

        //   Cleanup khi unmount hoặc khi currentGroup thay đổi
        return () => {
            socket.off('admake/chat/message');
            socket.off('admake/chat/message_deleted');
            socket.emit('admake/chat/leave_group', { group_id: workspaceEl.id }); // tùy backend có xử lý leave room không
        };
    }, [workspaceEl]);

    const theme = useTheme();

    return (
     <>
         <Stack direction={isMobile ? 'column': 'row'}>
            { full &&
             <Box sx={{
                backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : "#fff",
                minWidth: '20vw',
                display: {xs: showLeft ? "block" : "none", sm: "block",},
                boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
             }}>
                 <Stack p={0} spacing={2}>
                     <Stack spacing={0.5} className='scrollbar' sx={{ flexGrow: 1, overflowY: 'hidden'}}>
                        <Stack spacing={0} sx={{height:'72vh', border:'1px solid #ccc', overflowY:'auto', overflowX:'hidden'}}>
                            {workspaces && workspaces.map((el, idx) => (
                                <ChatElement workspace={el}
                                    onClick={() => handleClick(el)}
                                    key={`ChatElement-${idx}`}
                                    selected={workspaceEl?.id === el.id}
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
                // groupEl={currentGroup}
                userId=''
                username=''
                onDelete={handleDeleteMessage}
                // showFooter={showFooter}
                // onGroupDelete={handleDeleteGroup}
            />
              
        
            {full &&
             <Box sx={{ 
                  backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : "#fff",
                 width: 320,
                //  display: {
                //      xs: showRight ? "block" : "none",
                //      sm: "block",
                //  },
                 boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'}}>
                    <Contact messages={messageList}/>
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
                 {!showLeft && <Box sx={{ml:0}}><KeyboardArrowRightIcon fontSize="large"/></Box>}
             </Button>
             <Button sx={{
                 position: "fixed",
                 top: 390,
                 right: 50,
                
                 justifyContent: "center",
                 display: { xs: "none", sm: "none" },
                 zIndex: 999,
             }} onClick={() => setShowRight(!showRight)}>
                 {!showRight && <Box sx={{position:'relative', left:20}}>
                     <KeyboardArrowLeftIcon fontSize="large" />
                 </Box>}
             </Button>
         </Stack>

         {/* {openDialog && <CreateGroup open={openDialog} handleClose={handleCloseDialog} />} */}
     </>
 );
};

export default Group;







