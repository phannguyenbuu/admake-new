import { Avatar, Box, Typography, IconButton, Divider, Stack, Menu, MenuItem, ListItemIcon } from '@mui/material';
import React, { useState } from 'react';
import { useTheme } from "@mui/material/styles";
import DeleteIcon from '@mui/icons-material/Delete';
import StyledBadge from '../StyledBadge';
import { useUser } from '../../../../common/hooks/useUser';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Flex } from 'antd';
// import type { GroupProps } from '../../../../@types/chat.type';

interface HeaderProps {
  title: string;
  status: string | null;
  // onGroupDelete?: () => void;
  // onAddMember?: () => void;
  // onLeaveGroup?: () => void;
}

const Header: React.FC<HeaderProps> 
  = ({ title, status }) => {

  const {userRoleId} = useUser();
  const full = userRoleId > 0;
  // const {userId, username, userRole, userIcon } = useUser();
  // console.log("User_Info", userId, username, userRole );
  // const dispatch = useAppDispatch();
  const theme = useTheme();

  //   // State đóng mở menu
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // // Xử lý các sự kiện menu
  // const handleDeleteGroup = () => {
  //   handleMenuClose();
  //   if (onGroupDelete) onGroupDelete();
  // };

  // const handleAddMember = () => {
  //   handleMenuClose();
  //   if (onAddMember) onAddMember();
  // };

  // const handleLeaveGroup = () => {
  //   handleMenuClose();
  //   if (onLeaveGroup) onLeaveGroup();
  // };



  return (
    <Box p={0.2} sx={{ width: full ? '50vw':'100vw', 
      backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : "#fff", 
      boxShadow:'0px 0px 2px rgba(0,0,0,0.25)'}}>
    <Stack alignItems={'center'} direction='row' justifyContent={'space-between'}
    sx={{width:'100%', height:'100%'}}>
        <Stack direction={'row'} spacing={2}>
            <Box>
              <StyledBadge  overlap="circular"
              anchorOrigin={{ // position
                  vertical: "bottom",
                  horizontal: "right",
              }}
              variant="dot">
                  <Avatar alt={title} src={undefined}/>
              </StyledBadge>
            </Box>
            <Stack spacing={0.2} sx={{minWidth:100}}>
              <Typography variant='subtitle2'>
                  {title}
              </Typography>
              <Typography variant='caption'>
                  {status}
              </Typography>
            </Stack>
            {!full && <LogoAdmake/>}
        </Stack>

        {full && 
        <Stack direction='row' alignItems='center' spacing={3}>
            <IconButton>
                <SearchIcon/>
            </IconButton>
            <Divider orientation='vertical' flexItem/>

            <IconButton onClick={handleMenuOpen} 
                aria-controls={open ? 'group-menu' : undefined} 
                aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
                <ArrowDropDownIcon/>
            </IconButton>

            <Menu
                id="group-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                // MenuListProps={{
                // 'aria-labelledby': 'group-button',
                // }}
            >
              {/* {userRole === 'lead' &&  */}
                <>
                  {/* <MenuItem onClick={handleDeleteGroup}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>Xóa Nhóm
                  </MenuItem> */}
                  <Divider />
                  <MenuItem>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>Thay đổi thông tin
                  </MenuItem>
                  
                </> 

                {/* {userRole !== 'user' && 
                <>
                  <MenuItem>
                    <ListItemIcon>
                      <StarIcon fontSize="small" />
                    </ListItemIcon>Rate
                  </MenuItem>
                  <Divider />
                </>}

                <MenuItem onClick={handleAddMember}><ListItemIcon>
                <PersonAddIcon fontSize="small" />
              </ListItemIcon>Add member</MenuItem>
                <MenuItem onClick={handleLeaveGroup}><ListItemIcon>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>Leave this group</MenuItem> */}
          </Menu>
        </Stack>}
    </Stack>
</Box>
  )
}

export default Header

export const LogoAdmake = () => {
  const {userRoleId, isMobile} = useUser();
  return (
    <div style={{marginLeft:isMobile ? 0: 0,  display:'flex' }}>
      <div style={{borderRadius:50, overflow:'hidden'}}>
        <img src="/logo.jpg" alt="logo" 
          style={{width: 40, height: "auto", objectFit: "contain",}} />
      </div>
      
        <img src="/ADMAKE.svg" alt="ADMAKE"  
          style={{width: 80, height: "auto", objectFit: "contain",}}/>
      
    </div>
  )
}

