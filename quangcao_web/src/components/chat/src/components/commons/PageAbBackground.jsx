import React from 'react';
import { Stack, Box, Button, Typography } from '@mui/material';
import infor from '../../json/index.json';
import { CenterBox, StyledButton } from './TitlePanel';
import UseIsMobile from '../hooks/UseIsMobile';
import { StarObj } from './AboutUsBackground';

const PageAbBackground = () => {
  const isMobile = UseIsMobile();
  return (
  <Box position="relative" width="100vw" height='86vh'
    sx = {{ background: 'url("/images/panelBK_001.svg")',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      mt: 0,
     }}>
    <CenterBox>
      <img alt="phone"
        src="/images/partners/rolex.png"
        style={{position:'relative', width: '80vw', 
          marginTop: 100 }}
      />
    </CenterBox>
    
    <Box sx={{position:'absolute', left:150, top:100}}>
      
      <Typography sx={{fontSize:60, fontFamily:'Poppins', fontStyle:'italic', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontWeight:700, color: '#fff'}}>WELCOME TO</Typography>


      <Stack direction="row" spacing={5}>
        <StarObj/>
        <Typography sx={{fontSize:90, mt: 0, ml: -2, fontFamily:'Poppins', 
          textShadow: '0 0 5px rgba(0, 0, 0, 1)',
          fontStyle:'italic', fontWeight:700, color: '#fd2020ff'}}>D-LUX</Typography>
        
        <Typography sx={{fontSize:40, fontFamily:'Poppins', fontStyle:'italic', 
          textShadow: '0 0 5px rgba(0, 0, 0, 1)',
          fontWeight:700, color: '#ff8000ff'}}></Typography>
      </Stack>
      
      <Typography p={1} sx={{paddingLeft:3, paddingRight:5,fontSize:60, mt: 2, 
          ml: -2, fontFamily:'Poppins', borderRadius:5,
          width:'fit-content', backgroundColor:"#fff", fontStyle:'italic', 
          transform:'rotate(-0deg)', zIndex:-1,
          fontWeight:700, color: '#20b3fd'}}>PREMIER SHOPPING TOOL</Typography>

    <StyledButton title="Join Now" hash="contact"/>
    </Box>
  </Box>
);
}

export default PageAbBackground;
