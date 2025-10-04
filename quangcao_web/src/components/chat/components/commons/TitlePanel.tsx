import React, {useState, useEffect} from 'react';
import { Stack, Box, Typography, Button } from '@mui/material';

export function CenterBox({direction='column',top=0, gap=0, ...props}) {
    return <Box id={props.id} sx={{display:'flex', mt:top, gap:gap, 
        justifyContent:'center', alignItems:'center', flexDirection:direction}}>
            {props.children}
        </Box>
}
