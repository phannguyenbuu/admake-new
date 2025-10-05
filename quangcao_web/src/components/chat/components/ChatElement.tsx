import React, { useState } from 'react';
import { Avatar, Badge, Box, Stack,Button, Checkbox, Typography,  InputLabel, MenuItem, Select  } from '@mui/material';
import {useTheme , styled} from '@mui/material/styles';
import StyledBadge from './StyledBadge';

import {} from '@mui/material';
import CommentDialog from './CommentDialog';


function StatusSelect() {
  const [status, setStatus] = useState('not_yet');

  const handleChange = (event) => {
    setStatus(event.target.value);
  };

  return (
      <Select
        labelId="status-select-label"
        value={status}
        label=""
        onChange={handleChange}
        sx = {{width:200,fontSize:12}}
      >
        <MenuItem value="not_yet">Not started</MenuItem>
        <MenuItem value="resolve">Resolve</MenuItem>
        <MenuItem value="waiting_check">Wait checking</MenuItem>
        <MenuItem value="done">Done</MenuItem>
      </Select>
    
  );
}


//single chat element
const ChatElement = ({id,name, img, msg, time, online, unread, onClick, note}) => {
    const theme = useTheme();
    return (
      <Box onClick={onClick} sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: theme.palette.mode === 'light'? "#fff" : theme.palette.background.default,
        cursor: 'pointer'
      }}
        p={2}>
        <Stack direction="row" alignItems='center' justifyContent='space-between'>
          <Stack direction='row' spacing={2}>
            {online ? <StyledBadge overlap='circular' anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot">
            <Avatar src={img} />
            </StyledBadge> : <Avatar src={img} /> }
            
            <Stack spacing={0.3}>
              <Typography variant='subtitle2'>
                {name}
              </Typography>
              <Typography variant='caption' color="#333" fontStyle="italic">
                {note}
              </Typography>
            </Stack>
            </Stack>
            <Stack spacing={2} alignItems='center'>
              <Typography sx={{fontWeight:600}}  fontStyle= 'italic' fontSize={10}  variant='caption'>
                {time}
              </Typography>
              <Badge color='primary' badgeContent={unread}>

              </Badge>
            </Stack>
          
          
        </Stack>
  
  
      </Box>
    )
  };

  export default ChatElement;


function MuiCheckbox({check}) {
  const [checked, setChecked] = useState(check);

  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  return (

        <Checkbox
          checked={checked}
          onChange={handleChange}
          color="primary"
        />
      
  );
}


export const WorkElement = ({id,
  location_id,assignment_date,start_time,end_time,deadline,group_id,
  description,expected_results,attendance_score,performance_score,
  name, img, msg, time, online, unread, onClick}) => {

  const [open, setOpen] = useState(false);
 
  
  const [dialogTitle, setDialogTitle] = useState(false);

  

  const handleAskClick = (title) => {
    setOpen(true);
    setDialogTitle(title);
  };

    const theme = useTheme();
    return (
      <>
      <Box onClick={onClick} sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: theme.palette.mode === 'light'? "#fff" : theme.palette.background.default,
        cursor: 'pointer'
      }}
        p={2}>
        <Stack direction="row" alignItems='center' justifyContent='space-between'>
          <Stack direction='row' spacing={2}>
            {/* <MuiCheckbox check={location_id.toUpperCase().includes("SITE")}/> */}
             <Stack spacing={2} alignItems='center' p={1} sx={{border:'1px solid #747474', borderRadius: 1}}>
              <Typography sx={{fontWeight:600}}  fontStyle= 'italic' fontSize={10}  variant='caption'>
                {start_time}-{end_time}
              </Typography>
              <Typography sx={{fontWeight:600, color:'red'}}  fontStyle= 'italic' fontSize={10}  variant='caption'>
                Deadline:{deadline}
              </Typography>
              
              <Badge color='primary' badgeContent={unread}>
                <Button onClick={() => handleAskClick('Report about deadline')}>Report</Button>
                <Button onClick={() => handleAskClick('Expand deadline')}>Expand</Button>
              </Badge>
            </Stack>
            
            <Stack spacing={0.3}>
              <Button>
                [{group_id}] {description}
              </Button>
              <Typography variant='caption'>
                {expected_results} when done
              </Typography>
              <Typography variant='caption'>
                - At location <span style={{color:'red'}}>{location_id}</span>
              </Typography>
              <Typography variant='caption'>
                - Assigned at <span style={{color:'red'}}>{assignment_date}</span>
              </Typography>
              <Typography variant='caption'>
                - Scores <span style={{color:'red'}}>{performance_score}/{attendance_score}</span>
              </Typography>
              <Stack direction="row">
                <Button sx={{width:100}} onClick={() => handleAskClick('Question')}>Ask</Button>
                <StatusSelect/>
              </Stack>
            </Stack>
            </Stack>
           
          
          
        </Stack>

  
      </Box>

      <CommentDialog open={open} setOpen={setOpen} dialogTitle={dialogTitle}/>
      </>
    )
  };






