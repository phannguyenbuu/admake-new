import { Navigate, Outlet } from "react-router-dom";
import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Stack, Switch } from '@mui/material';
import SideBar from "./SideBar";

const isAuthenticated = true;

const DashboardLayout = () => {





if(!isAuthenticated){
  return <Navigate to='/auth/login'/>;
}

  return (
    <Stack direction='row'>
      {/* SideBar */}
      <SideBar/>
      <Box sx={{ width: '100%' }}>
        <Outlet/>
      </Box>
      <Box>

      </Box>
    </Stack>
    
  );
};

export default DashboardLayout;
