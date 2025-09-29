import { Avatar, Box, Typography, IconButton, Divider, Stack, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { CaretDown, MagnifyingGlass, Phone,VideoCamera } from 'phosphor-react'
import React, { useState } from 'react';
import { useTheme } from "@mui/material/styles";
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
// import { faker } from '@faker-js/faker';
import StyledBadge from '../StyledBadge';
import { ToggleSidebar } from '../../redux/slices/app';
import { useDispatch } from 'react-redux';
import { useUser } from '../../UserContext';


const Header = ({ title, status, onDeleteGroup, onAddMember, onLeaveGroup }) => {
  const {userId, username, userRole, userIcon } = useUser();
  console.log("User_Info", userId, username, userRole );
  const dispatch = useDispatch();
  const theme = useTheme();

    // State đóng mở menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Xử lý các sự kiện menu
  const handleDeleteGroup = () => {
    handleMenuClose();
    if (onDeleteGroup) onDeleteGroup();
  };

  const handleAddMember = () => {
    handleMenuClose();
    if (onAddMember) onAddMember();
  };

  const handleLeaveGroup = () => {
    handleMenuClose();
    if (onLeaveGroup) onLeaveGroup();
  };



  return (
    <Box p={2} sx={{ width:'100%', 
      scale: {xs: 0.6, sm: 1},
      backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper, boxShadow:'0px 0px 2px rgba(0,0,0,0.25)'}}>
    <Stack alignItems={'center'} direction='row' justifyContent={'space-between'}
    sx={{width:'100%', height:'100%'}}>
        <Stack onClick={()=>{
            dispatch(ToggleSidebar());
        }} direction={'row'} spacing={2}>
            <Box>
                <StyledBadge  overlap="circular"
                anchorOrigin={{ // position
                    vertical: "bottom",
                    horizontal: "right",
                }}
                variant="dot">
                    <Avatar alt={title} src={userIcon}/>
                </StyledBadge>
                
            </Box>
            <Stack spacing={0.2}>
                    <Typography variant='subtitle2'>
                        {title}
                    </Typography>
                    <Typography variant='caption'>
                        {status}
                    </Typography>
                </Stack>
        </Stack>
        <Stack direction='row' alignItems='center' spacing={3}>
            {/* <IconButton>
                <VideoCamera/>
            </IconButton>
            <IconButton>
                <Phone/>
            </IconButton> */}
            <IconButton>
                <MagnifyingGlass/>
            </IconButton>
            <Divider orientation='vertical' flexItem/>

            <IconButton onClick={handleMenuOpen} aria-controls={open ? 'group-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
                <CaretDown/>
            </IconButton>

            <Menu
                id="group-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{
                'aria-labelledby': 'group-button',
                }}
            >
              {userRole === 'lead' && 
                <>
                  <MenuItem onClick={handleDeleteGroup}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>Delete this group
                  </MenuItem>
                  <MenuItem>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>Remove member
                  </MenuItem>
                  <Divider />
                </>}

                {userRole !== 'user' && 
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
              </ListItemIcon>Leave this group</MenuItem>



          </Menu>
        </Stack>
    </Stack>
</Box>
  )
}

export default Header