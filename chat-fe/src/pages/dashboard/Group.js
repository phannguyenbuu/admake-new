import { Box, Button, Stack, Typography, Link, IconButton, Divider } from '@mui/material'
import React, { useState, useEffect } from 'react';
import { Search, SearchIconWrapper, StyledInputBase } from '../../components/Search'
import { MagnifyingGlass, Plus, WindowsLogo, CaretLeft, CaretRight, X } from 'phosphor-react';
import { useTheme } from "@mui/material/styles";
import { SimpleBarStyle } from '../../components/Scrollbar';
import '../../css/global.css';
import { useSelector } from "react-redux";
import ChatElement from '../../components/ChatElement';
import CreateGroup from '../../sections/main/CreateGroup';
import useApiFlaskReceive from "../../api/ApiFlaskReceive";
import Conversation from "../../components/Conversation";
import { useUser } from '../../UserContext';
import { socket } from '../../components/Conversation/socket';
import Contact from '../../components/Contact';
import StarredMessages from '../../components/StarredMessages';
import SharedMessages from '../../components/SharedMessages';
import { useWindowDimensions } from '../../hooks/useResponsive';

const isMB = () => {
    return window.innerWidth < 768;
}

const Group = () => {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [messageList, setMessages] = useState([]);
    const [title, setTitle] = useState('');
    const [currentGroupId, setCurrentGroupId] = useState(null);
    const [status, setStatus] = useState('');
    const [_loading, setLoading] = useState(false);
    const [_error, setError] = useState(null);

    const { userId, username } = useUser();
    const { width, height} = useWindowDimensions();

    const handleDeleteMessage = (el) =>{
        console.log('Delete userId:', userId, el);
        if(userId !== el.user_id)
        {
            alert("Cannot erase message of other member in group!")
            return;
        }

        fetch(`${process.env.REACT_APP_API_URL}/api/message/${el.message_id}`, { method: 'DELETE' })
            .then(res => {
            if (!res.ok) throw new Error('Delete failed');
            return res.json();
            })
            .then(() => {
                // Cập nhật lại state messageList để xóa message vừa gọi delete
                console.log('Delete msg:', messageList);
                setMessages(prevMessages => prevMessages.filter(m => m.message_id !== el.message_id));
            })
        .catch(console.error);

    }

    // Xử lý khi click vào group
    const handleClick = (el) => {
        if (!userId) {
            alert('Vui lòng đăng nhập để xem tin nhắn');
            return;
        }

        setLoading(true);

        console.log(currentGroupId, `Start ${process.env.REACT_APP_API_URL}/api/groups/${el.id}?userId=${userId}`);
        // Gửi userId khi gọi API để chỉ lấy message liên quan user
        fetch(`${process.env.REACT_APP_API_URL}/api/groups/${el.id}?userId=${userId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data.messages) {
                    console.log('username', data.messages);
                    setMessages(data.messages);
                    setTitle(el.name);
                    setStatus(`${el.members} member(s)`);
                    setCurrentGroupId(el.id);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error khi lấy dữ liệu:', err);
                setError(err);
                setLoading(false);
            });
        setShowLeft(false);
    };

    const { data: groupList } = useApiFlaskReceive(`${process.env.REACT_APP_API_URL}/api/groups?userId=${userId}`);
    

    useEffect(() => {
        console.log('Current Group groupList', groupList);
        if(groupList && groupList.length > 0)
        {
            handleClick(groupList[0]);
            
            console.log('Change to', groupList[0].id);
        }
     }, [groupList]);

    useEffect(() => {
        if (!currentGroupId) return;

        socket.on('message_deleted', ({ message_id }) => {
            setMessages(prev => prev.filter(m => m.message_id !== message_id));
        });

        // Join vào room group hiện tại
        socket.emit('join_group', { group_id: currentGroupId });

        // Lắng nghe tin nhắn mới realtime
        socket.on('message', (msg) => {
            console.log('Current Group ID', currentGroupId, msg);
            if (msg.group_id === currentGroupId) { // chỉ thêm tin nhắn cùng group
                setMessages(prev => [...prev, msg]); // thêm tin nhắn mới vào cuối
            }
        });

        // Cleanup khi unmount hoặc khi currentGroupId thay đổi
        return () => {
            socket.off('message');
            socket.emit('leave_group', { group_id: currentGroupId }); // tùy backend có xử lý leave room không
        };
    }, [currentGroupId]);

    

    const theme = useTheme();
    const [openDialog, setOpenDialog] = useState(false);

    const handleCloseDialog = () => setOpenDialog(false);

    const { sidebar } = useSelector((store) => store.app);

    return (
        <>
            <Stack direction={'row'} sx={{ width: '100%' }}>
                {/* Left sidebar nhóm */}
                <Box sx={{
                    height: '100vh',
                    backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background,
                    width: 320,
                    
                    display: {
                        xs: showLeft ? "block" : "none", // xs: mobile
                        sm: "block", // sm trở lên show luôn
                    },
                    boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'
                }}>
                    <Stack p={3} spacing={2} sx={{ maxHeight: '100vh' }}>
                        <Typography variant='h5'>{username}</Typography>
                        <Search>
                            <SearchIconWrapper>
                                <MagnifyingGlass color="#709CE6" />
                            </SearchIconWrapper>
                            <StyledInputBase placeholder='Search...' inputProps={{ "aria-label": "search" }} />
                        </Search>
                        
                        <Divider />
                        <Stack spacing={3} className='scrollbar' sx={{ flexGrow: 1, overflowY: 'scroll', height: '100%' }}>
                            <SimpleBarStyle timeout={500} clickOnTrack={false}>
                                <Stack spacing={2.5}>
                                    <Typography variant='subtitle2' sx={{ color: '#676667' }}>Pinned</Typography>
                                    {groupList && groupList.filter(el => el.name === 'TELEGRAM' || el.name === 'APPLE').map((el, idx) => (
                                        <ChatElement
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
                                    {groupList && groupList.filter(el => !el.pinned).map((el, idx) => (
                                        <ChatElement
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
                            </SimpleBarStyle>
                        </Stack>
                    </Stack>
                </Box>

                {/* Center conversation */}
                <Box sx={{height: '90vh',
                    
                    width: {xs:width - 60, sm:width},
                    
                    backgroundColor: theme.palette.mode === 'light' ? 
                        '#F0F4FA' : theme.palette.background.default
                }}>
                    <Conversation
                        setMessages={setMessages}
                        messages={messageList}
                        title={title}
                        status={status}
                        groupId={currentGroupId}
                        userId={userId}
                        username={username}
                        onDelete={handleDeleteMessage}
                    />
                </Box>

                <Box sx={{ height: '100%',
                    backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background,
                    width: 320,
                    display: {
                        xs: showRight ? "block" : "none", // xs: mobile
                        sm: "block", // sm trở lên show luôn
                    },
                    boxShadow: '0px 0px 2px rgba(0,0,0,0.25)'}}>
                    {sidebar.open && (()=>{
                        switch (sidebar.type) {
                        case 'CONTACT':
                            return <Contact messages={messageList} />

                        case 'STARRED':
                            return <StarredMessages messages={messageList}/>

                        case 'SHARED':
                            return <SharedMessages messages={messageList}/>
                        
                        default:
                            break;
                        }
                    })()  }
                </Box>
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
                    display: { xs: "flex", sm: "none" },
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
                    display: { xs: "flex", sm: "none" },
                    zIndex: 999,
                }} onClick={() => setShowRight(!showRight)}>
                    {!showRight ? <Box sx={{position:'relative', left:20}}><CaretLeft sx={{position:'relative', ml:50}} size={24} weight="bold" /></Box> : <X size={24} weight="bold" />}
                </Button>
            </Stack>

            {openDialog && <CreateGroup open={openDialog} handleClose={handleCloseDialog} />}
        </>
    );
};

export default Group;





