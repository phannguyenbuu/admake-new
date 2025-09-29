import React, {useState, useEffect} from 'react';
import { Stack, Box, Typography, Button } from '@mui/material';

export default function TitlePanel({title, ...props}) {
    const [mLeft, setMLeft] = useState(window.innerWidth < 768 ? 1 : 50);

    useEffect(() => {
        const handleResize = () => {
        setMLeft(window.innerWidth < 768 ? 1 : 50);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup để tránh rò rỉ sự kiện
        return () => {
        window.removeEventListener("resize", handleResize);
        };
    }, []);
        

    return <CenterBox>
                <Typography sx={{ fontSize:40, fontFamily:'Poppins', fontStyle:'italic', 
                        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
                        textAlign: 'center',
                        marginTop: 10,
                        fontWeight:700, color: '#fff'}}>
                        {title}
                        {props.children}
                </Typography>
            </CenterBox>
}

export function CenterBox({direction='column',top=0, gap=0, ...props}) {
    return <Box id={props.id} sx={{display:'flex', mt:top, gap:gap, 
        justifyContent:'center', alignItems:'center', flexDirection:direction}}>
            {props.children}
        </Box>
}

export function StyledButton({title, onClick, hash, DialogComponent , dialogProps, sx}) {
    const [open, setOpen] = useState(false);

    const handleClick = () => {
        if (hash) {
            const element = document.getElementById(hash);
            console.log("Goto hash", hash, element);

            if (element) {
                
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }

    if (onClick) {
        // Nếu onClick trả về true thì mở dialog
        const result = onClick();
        // console.log("Status ok", result);
        if (result) {
            setOpen(true);
        }
    } else {
        setOpen(true);
    }
  };

    return <>
            <Button type="button" sx={{width: 320, height: 60, borderRadius: 5, 
                fontSize: 20, marginTop: 5,
                marginLeft: 2,
                color: '#fff', textTransform: 'none',
                boxShadow: '0 0 15px 5px rgba(165, 219, 255, 0.6)',
                background: 'linear-gradient(0deg, #65ceffff 0%, #00a6ffff 30%,#00a6ffff 70%, #65ceffff 100%)',
                ...sx,
            }}
                
                onClick = {handleClick}
            >
            {title}
          </Button>
          {DialogComponent &&
            <DialogComponent  {...dialogProps}
                open={open}
                setOpen={setOpen}/>}
          </>
}

export function FlareEffect({size=1200, top}) {
    return <Box
          sx={{
            position:'absolute',
            width: size,
            height: size,
            mt: top,
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(103, 235, 255, 0.25) 0%,rgba(103, 235, 255,0.1) 20%, rgba(103, 235, 255,0) 50%)',
          }}
        />;
}