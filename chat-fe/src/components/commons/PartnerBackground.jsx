import React from 'react';
import { Stack, Box, Button, Typography } from '@mui/material';

import { StyledButton } from './TitlePanel';
import AbstractBackground from './AbstractBackground';
import infor from "../../json/partner.json";

const PartnerBackground = () => (
  <Box position="relative" width="100vw" height='86vh'
    sx = {{ background: 'url("images/partners/partner_bk.png")',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
     }}>
       
    <Box sx={{position:'absolute', left:150, top:0}}>
      
      <Typography sx={{fontSize:60, fontFamily:'Poppins', fontStyle:'italic', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontWeight:700, color: '#fff'}}>PARTNER WITH</Typography>


      <Typography sx={{fontSize:90, mt: 0, ml: -2, fontFamily:'Poppins', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontStyle:'italic', fontWeight:700, color: '#fd2020ff'}}>D-LUX</Typography>
      
      
      <Typography p={1} sx={{paddingLeft:3, paddingRight:5,fontSize:60, mt: 2, 
          ml: -2, fontFamily:'Poppins', borderRadius:5,
          width:'fit-content', backgroundColor:"#fff", fontStyle:'italic', 
          transform:'rotate(-0deg)', zIndex:-1,
          fontWeight:700, color: '#20b3fd'}}><span style={{color:"#ff0000ff"}}>&</span>LUXURY LIFE</Typography>
      <Typography sx={{fontSize:40, fontFamily:'Poppins', fontStyle:'italic', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        fontWeight:700, color: '#fcfcfcff'}}>WHAT IS D-LUX?</Typography>
      <Typography sx={{fontSize:18, width: 700, maxWidth: "90vw", color:"#fff",mt:2,
        textShadow: '0 0 10px rgba(0, 0, 0, 1)'
      }}>
        {infor.begin[0]}
      </Typography>
      <Typography sx={{fontSize:18, width: 700, maxWidth: "90vw", color:"#fff",mt:2,
        textShadow: '0 0 10px rgba(0, 0, 0, 1)'
      }}>
        {infor.begin[1]}
      </Typography>
  
    <StyledButton title="Become A Partner" hash="contact"/>
    </Box>
  </Box>
);

export default PartnerBackground;
