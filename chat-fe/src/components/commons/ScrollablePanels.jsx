import React, { useRef, useEffect, useState } from 'react';
import { Box, Stack, Button } from '@mui/material';
import SinglePanel from './SinglePanel';

const isMobile = () => {
  return window.screen.width < 768;
}

const ScrollablePanels = ({ data, ...props }) => {
  const scrollRef = useRef(null);
  let interval = null;
  const [panelWidth, setPanelWidth] = useState(0);
  
  const scrollByOffset = (offset) => {
    if(interval) clearInterval(interval);
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    interval = setInterval(() => {
      scrollByOffset(isMobile() ? 330 : 500);
    }, 3000); // 3 giây scroll một lần

    return () => clearInterval(interval); // cleanup khi component unmount
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {props.children}

      <Box 
        ref={scrollRef} 
        sx={{ 
          width: '90vw', 
          overflow: 'hidden', 
          scrollBehavior: 'smooth'
        }}
      >
        <Stack 
          direction="row" 
          spacing={5} 
          justifyContent="center" 
          alignItems="center"
          sx={{ width: 'max-content', minWidth: '100%' }}
        >
          {data.review.map((el, idx) => (
            <SinglePanel key={idx} {...el}
              width= {isMobile() ? "80vw" : "40vw"}
              sx={{ minWidth: isMobile() ? "80vw" : "40vw" }}
              fontScale = {isMobile() ? 0.8:1}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ mb: 2, marginTop: 5 }}>
        <Button 
          variant="outlined" 
          sx={{ borderRadius: '20px 0 0 20px' }} 
          onClick={() => scrollByOffset( isMobile()? -330: -500)}
        >
          Prev
        </Button>
        <Button 
          variant="outlined" 
          sx={{left: 10, borderRadius: '0 20px 20px 0', ml: -1 }} 
          onClick={() => scrollByOffset(isMobile()? 330: 500)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default ScrollablePanels;
