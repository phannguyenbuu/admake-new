import React, { useState, useEffect, useRef } from 'react';
import { Stack, Box, Button, Typography, Divider } from '@mui/material';
import infor from '../../json/index.json';
import { StyledButton } from './TitlePanel';
import { StarObj } from './AboutUsBackground';
import { ConfirmDialog } from './CommentDialog';

export const WinnerPanel = ({img,title,content,prizes}) => {
  const colors =["#FDEB2A","#00d2f7ff","#ff5500ff"];

  return (
    <SinglePanel
      backgroundUrl={img}
      title={title}
      content={content}
      width="30vw"
      maxWidth={800}
      imgTop={0}
      height={600}
      sx={{ border: '1px solid #00bbffff', overflow: 'hidden', padding: 1 }}
      fontScale={1.5}
    >
      <Stack spacing={1}>
      {prizes.map((el, idx) => 
        <Box sx={{zIndex:99, marginTop: 0, background:'rgba(0,0,0,0.5)',
          border: 'none', borderRadius: 5,
        }}>
          <Stack direction="row">
            <Box  style={{marginLeft:5,marginTop:20}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 16C15.866 16 19 12.866 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 12.866 8.13401 16 12 16ZM12 6C11.7159 6 11.5259 6.34084 11.1459 7.02251L11.0476 7.19887C10.9397 7.39258 10.8857 7.48944 10.8015 7.55334C10.7173 7.61725 10.6125 7.64097 10.4028 7.68841L10.2119 7.73161C9.47396 7.89857 9.10501 7.98205 9.01723 8.26432C8.92945 8.54659 9.18097 8.84072 9.68403 9.42898L9.81418 9.58117C9.95713 9.74833 10.0286 9.83191 10.0608 9.93531C10.0929 10.0387 10.0821 10.1502 10.0605 10.3733L10.0408 10.5763C9.96476 11.3612 9.92674 11.7536 10.1565 11.9281C10.3864 12.1025 10.7318 11.9435 11.4227 11.6254L11.6014 11.5431C11.7978 11.4527 11.8959 11.4075 12 11.4075C12.1041 11.4075 12.2022 11.4527 12.3986 11.5431L12.5773 11.6254C13.2682 11.9435 13.6136 12.1025 13.8435 11.9281C14.0733 11.7536 14.0352 11.3612 13.9592 10.5763L13.9395 10.3733C13.9179 10.1502 13.9071 10.0387 13.9392 9.93531C13.9714 9.83191 14.0429 9.74833 14.1858 9.58118L14.316 9.42898C14.819 8.84072 15.0706 8.54659 14.9828 8.26432C14.895 7.98205 14.526 7.89857 13.7881 7.73161L13.5972 7.68841C13.3875 7.64097 13.2827 7.61725 13.1985 7.55334C13.1143 7.48944 13.0603 7.39258 12.9524 7.19887L12.8541 7.02251C12.4741 6.34084 12.2841 6 12 6Z"
      fill={`url(#paint0_linear_${idx})`}
    />
    <path
      d="M4.49517 12.9946L2.99206 14.551C2.45194 15.1102 2.18188 15.3898 2.08843 15.6266C1.87548 16.1662 2.05772 16.7648 2.52138 17.0486C2.72486 17.1732 3.09187 17.212 3.82589 17.2897C4.2403 17.3335 4.44755 17.3554 4.6211 17.4219C5.00966 17.5709 5.31191 17.8838 5.45575 18.2861C5.52 18.4658 5.54117 18.6804 5.5835 19.1095C5.65848 19.8695 5.69597 20.2495 5.81628 20.4602C6.09042 20.9403 6.66852 21.129 7.18967 20.9085C7.41837 20.8117 7.68843 20.5321 8.22855 19.9729L10.7106 17.4029C8.01306 16.9924 5.73225 15.314 4.49517 12.9946Z"
      fill={`url(#paint1_linear_${idx})`}
    />
    <path
      d="M13.2894 17.4029L15.7715 19.9729C16.3116 20.5321 16.5816 20.8117 16.8103 20.9085C17.3315 21.129 17.9096 20.9403 18.1837 20.4602C18.304 20.2495 18.3415 19.8695 18.4165 19.1095C18.4588 18.6804 18.48 18.4658 18.5442 18.2861C18.6881 17.8838 18.9903 17.5709 19.3789 17.4219C19.5525 17.3554 19.7597 17.3335 20.1741 17.2897C20.9081 17.212 21.2751 17.1732 21.4786 17.0486C21.9423 16.7648 22.1245 16.1662 21.9116 15.6266C21.8181 15.3898 21.5481 15.1102 21.0079 14.551L19.5048 12.9946C18.2677 15.314 15.9869 16.9924 13.2894 17.4029Z"
      fill={`url(#paint2_linear_${idx})`}
    />
    <defs>
      <linearGradient id={`paint0_linear_${idx}`} x1="12.908" y1="2" x2="12.908" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor={colors[idx % colors.length]} offset="0" />
        <stop stopColor={colors[idx % colors.length]} offset="1" />
      </linearGradient>
      <linearGradient id={`paint1_linear_${idx}`} x1="13.2971" y1="12.9946" x2="13.2971" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor={colors[idx % colors.length]} offset="0" />
        <stop stopColor={colors[idx % colors.length]} offset="1" />
      </linearGradient>
      <linearGradient id={`paint2_linear_${idx}`} x1="13.2971" y1="12.9946" x2="13.2971" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor={colors[idx % colors.length]} offset="0" />
        <stop stopColor={colors[idx % colors.length]} offset="1" />
      </linearGradient>
    </defs>
  </svg>
            </Box>
          <Box>
            <Typography
            sx={{color:'#fff',
              width: 300,
              textAlign:'left',
              padding: 1,
              fontFamily:'Inter', 
              fontSize:12,
            }}>
              {el.title}
            </Typography>

            <Typography
            sx={{color:'#fff',
              width: 300,
              textAlign:'left',
              padding: 1,
              fontFamily:'Inter', 
              fontSize:24,
            }}>
              {el.content}
            </Typography>
          </Box>
          </Stack>
      </Box>
      )}
      </Stack>
    </SinglePanel>
  );
}

export const FamousGiveawayPanel = ({data=infor.famousGiveaway}) => {
  const initial = data.initial;

  const totalSecondsInit = 
    initial.days * 86400 
    + initial.hours * 3600 
    + initial.minutes * 60 
    + initial.seconds;
  
  const [secondsLeft, setSecondsLeft] = useState(totalSecondsInit);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Tính toán lại ngày giờ phút giây từ giây còn lại
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  return (
    <SinglePanel {...data} sx={{ border: '1px solid #00bbffff', overflow: 'hidden' }}
    >
      <StyledButton title="Enter Now" hash="contact"/>

      <Typography
      sx={{backgroundColor:"#050e20",
        color:'#fff',
        width: 300,
        textAlign:'center',
        padding: 1,
        borderRadius: 5,
        fontFamily:'Poppins', fontStyle:'italic',
        fontSize:24,
        border: '1px solid #00bbffff',
        marginLeft: 2,
        marginTop: 2
      }}>
        {days} days {hours}h {minutes}m {seconds}s
      </Typography>
      
    </SinglePanel>
  );
};


export const BigPanel = ({title, content, images, imgHeight=400}) => (
  <SinglePanel img='' title={title} content={content} width='30vw'
      maxWidth={800} imgTop={0} imgHeight = {imgHeight}
      sx={{border:'none', overflow:'hidden'}}
      >
        
          <img src = {images[0]}
            style={{position:'relative', marginTop: 0, 
            width: '100%', maxWidth: 200,
            height:'auto',
            transform: `translate(100px, 100px) rotate(10deg)`,
            transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translate(100px, 80px) rotate(10deg)'}  // nâng lên 20px
            onMouseLeave={e => e.currentTarget.style.transform = 'translate(100px, 100px) rotate(10deg)'}  // hạ về vị trí cũ
          />
        
  </SinglePanel>
);


const SinglePanel = ({title,fontScale = 1,txtTop = '50%', backgroundUrl, p=0, overImg=true,
  content, img, imgTop = -100, width='20vw', maxWidth=360, height=400,...props}) => (

  <Box position="relative" width={width} height={height} maxWidth={maxWidth} p={p}
    sx = {{ background:  backgroundUrl ? `url("${backgroundUrl}")` : 'url("/images/panelBK_001.svg")',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      top: 0,
      borderRadius: 5,
      border: '1px solid rgba(255, 255, 255, 0.5)',
      cursor: 'pointer',
      '&:hover img': {
        transform: 'scale(1.5)',  // Zoom ảnh khi hover Box
        transition: 'transform 0.4s ease',
      },
      overflow: overImg ? "visible": "hidden",
      ...props.sx
     }}>
    {props.children}
    <Box sx={{display:'flex', justifyContent:'center', alignItems:'center'}}>
      {img !== '' && <img src = {img} 
        style={{marginTop: imgTop, width: '100%', maxWidth: 1200,
        height:'auto', transition: 'transform 0.4s ease'}}/>}
    </Box>
        
    <Box sx={{position:'absolute', top: txtTop}}>
      <Typography sx={{marginLeft:2, fontSize:20 * fontScale, fontFamily:'Poppins', fontStyle:'italic', 
        textShadow: '0 0 5px rgba(0, 0, 0, 1)',
        marginTop: 0, pointerEvents: 'none',
        fontWeight:700, color: '#fff'}}>{title}</Typography>
      
      {content && content != '' && content.split('\n').map((el) =>
      <>
        <Stack direction="row">
          <StarObj paddingTop={15}/>
          <Typography sx={{fontSize:16  * fontScale, padding:2, marginLeft:0, 
            marginTop: 0, width: '80%', color:"#fff" }}>
            {el}
          </Typography>
          
        </Stack>
        <Divider color="#333"/>
        </>
      )}
    </Box>

    
  </Box>
);

export default SinglePanel;
