import React from 'react';
import { Stack, Box, Button, Typography, SliderTrack } from '@mui/material';
import infors from '../../json/index.json';

const CenteredImage = ({ img }) => (
  <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 180,
      top:0,
      border: 'none'
    }}
  >
    <img src={img}
      alt="Centered"
      style={{width: 280, height: 180,objectFit: 'cover'}}
    />
  </Box>
);

const PartnerPanel = ({startAnimationTime = 0}) => (
  <Box position="relative" width="20vw" height={400} maxWidth={360}
    sx = {{ marginLeft: -40,
      animation: 'slideRightLeft 10s ease-in-out infinite',
      animationDelay: `${startAnimationTime}s`,
        '@keyframes slideRightLeft': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(300px)' },
        },
     }}>
      
      <Stack direction="row">
        {infors.partners.map((el) => <CenteredImage img={el.img}/>)}
      </Stack>
  </Box>
  
);

export default PartnerPanel;
