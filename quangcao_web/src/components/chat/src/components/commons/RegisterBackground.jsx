import React from 'react';
import { Stack, Box, Button, Typography } from '@mui/material';
import infor from '../../json/index.json';
import { StyledButton } from './TitlePanel';

const RegisterBackground = () => (
  <Box position="relative" width="100vw" height='86vh'
    sx = {{ background: 'url("/images/register/register_banner.png")',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      mt: 0,
     }}>
    
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="724"
      height="756"
      viewBox="0 0 724 756"
      fill="none"
      sx = {{position:'absolute'}}
    >
      <path
        d="M223.06 517.89C216.464 533.71 200.292 539.719 191.06 529.379C172.063 508.105 181.447 420.524 194.324 416.404C207.011 412.344 236.83 484.878 223.06 517.89Z"
        stroke="white"
        strokeOpacity="0.05"
        strokeMiterlimit="10"
      />
      <path
        d="M265.314 478.689C277.921 442.553 188.166 381.875 166.976 406.921C153.946 422.32 155.575 459.599 159.857 489.998C163.876 518.537 180.311 559.315 207.606 569.376C222.096 574.703 242.74 571.505 249.97 560.223C255.564 551.491 253.047 539.704 253.978 537.103C248.857 524.707 246.866 522.888 245.665 513.011C244.094 500.101 261.848 488.627 265.314 478.689Z"
        stroke="white"
        strokeOpacity="0.05"
        strokeMiterlimit="10"
      />
    </svg>
    
    <Box sx={{position:'absolute', left:150, top:100}}>
      
      <Typography sx={{fontSize:60, fontFamily:'Poppins', fontStyle:'italic', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontWeight:700, color: '#fff'}}>REGISTER</Typography>


      <Stack direction="row" spacing={5}>
      <Typography sx={{fontSize:90, mt: 0, ml: -2, fontFamily:'Poppins', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontStyle:'italic', fontWeight:700, color: '#fd2020ff'}}>D-LUX</Typography>
      
      <Typography sx={{fontSize:40, fontFamily:'Poppins', fontStyle:'italic', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontWeight:700, color: '#ff8000ff'}}>& LUXURY LIFE</Typography>
      </Stack>
      
      <Typography p={1} sx={{paddingLeft:3, paddingRight:5,fontSize:60, mt: 2, 
          ml: -2, fontFamily:'Poppins', borderRadius:5,
          width:'fit-content', backgroundColor:"#fff", fontStyle:'italic', 
          transform:'rotate(-0deg)', zIndex:-1,
          fontWeight:700, color: '#20b3fd'}}>ENJOY PROFESSIONAL SERVICES</Typography>

      <Typography sx={{fontSize:18, width: 500, color:"#fff",mt:2,
        textShadow: '0 0 10px rgba(0, 0, 0, 1)'
      }}>
        {infor.home.content}
      </Typography>
  
    <StyledButton title="Register Now" hash="contact"/>
    </Box>
  </Box>
);

export default RegisterBackground;
