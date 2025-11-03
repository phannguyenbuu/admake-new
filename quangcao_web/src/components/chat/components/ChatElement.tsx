import React, { useState } from 'react';
import { Avatar, Badge, Box, Stack,Button, Checkbox, Typography,  InputLabel, MenuItem, Select  } from '@mui/material';
import {useTheme , styled} from '@mui/material/styles';
import type { WorkSpace } from '../../../@types/work-space.type';
import StyledBadge from './StyledBadge';

import {} from '@mui/material';
import CommentDialog from './CommentDialog';


// function StatusSelect() {
//   const [status, setStatus] = useState('not_yet');

//   const handleChange = (event) => {
//     setStatus(event.target.value);
//   };

//   return (
//       <Select
//         labelId="status-select-label"
//         value={status}
//         label=""
//         onChange={handleChange}
//         sx = {{width:200,fontSize:12}}
//       >
//         <MenuItem value="not_yet">Not started</MenuItem>
//         <MenuItem value="resolve">Resolve</MenuItem>
//         <MenuItem value="waiting_check">Wait checking</MenuItem>
//         <MenuItem value="done">Done</MenuItem>
//       </Select>
    
//   );
// }


interface ChatElementProps {
  selected: boolean;
  workspace: WorkSpace;
  onClick: (event: React.MouseEvent<HTMLDivElement>, workspace: WorkSpace) => void;
}

//single chat element
const ChatElement: React.FC<ChatElementProps> = ({workspace, onClick, selected}) => {
    // const theme = useTheme();
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      onClick(event, workspace);
    };

    
    
    return (
      <Box onClick={handleClick} sx={{
        width: "100%",
        backgroundColor: selected ? "#ccc" : "#fff" ,
        cursor: 'pointer'
      }}
        p={2}>
        <Stack direction="row" alignItems='center' justifyContent='space-between'>
          <Stack direction='row' spacing={2}>
            {/* {online ? <StyledBadge overlap='circular' anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot">
            <Avatar src={img} />
            </StyledBadge> : <Avatar src={img} /> } */}
            
            <Stack spacing={0.3}>
              <Typography variant='subtitle2'>
                {workspace.name}
              </Typography>
              <Typography variant='caption' color="#333" fontStyle="italic">
                {workspace.address}
              </Typography>
            </Stack>
            </Stack>
            {/* <Stack spacing={2} alignItems='center'> */}
              {/* <Typography sx={{fontWeight:600}}  fontStyle= 'italic' fontSize={10}  variant='caption'>
                {time}
              </Typography> */}
              {/* <Badge color='primary' badgeContent={unread}> */}

              {/* </Badge> */}
            {/* </Stack> */}
        </Stack>
      </Box>
    )
  };

  export default ChatElement;
