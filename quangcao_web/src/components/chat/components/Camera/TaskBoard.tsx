import React, { useState, useEffect, useMemo } from "react";
import Modal from "antd/es/modal/Modal";
import JobTimeAndProcess from "../../../dashboard/work-tables/task/JobTimeAndProcess ";
import { Stack, Box, Button, Checkbox, Typography } from "@mui/material";
import { useMutation } from '@tanstack/react-query';
import { useUser } from "../../../../common/hooks/useUser";
import type { Task } from "../../../../@types/work-space.type";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import CommentIcon from '@mui/icons-material/Comment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getTitleByStatus } from "../../../dashboard/work-tables/Managerment";
import { notification } from "antd";

const fetchTaskByUser = async (userId: string): Promise<Task[]> => {
  const response = await fetch(`${useApiHost()}/task/by_user/${userId}`);
  if (!response.ok) {
    throw new Error(`Error fetching tasks for user ${userId}`);
  }
  return response.json();
};

const useTaskByUserMutation = () => {
  return useMutation<Task[], Error, string>({
    mutationFn: fetchTaskByUser,
  });
};

interface TaskBoardProps {
  // mode: { adminMode: boolean; userMode: boolean };
  
  userId?: string;
  open?: boolean;
  onCancel: () => void;
}

const TaskBoard = ({ userId, open, onCancel }: TaskBoardProps) => {
    const { mutate, data, isPending, isError, error } = useTaskByUserMutation();
    const {isMobile} = useUser();

    useEffect(() => {
        if (userId) {
          mutate(userId); // userId đã chắc chắn là string, không undefined
        }
    },[]);

    useEffect(() => {
        if(!data) 
          {
            // notification.error({message:"Unkown task data", description: userId});
            return;
          }
        console.log('Working tasks', data);
    },[data]);

    const btnStyle = {color:"#fff", padding:5, 
        backgroundColor:'#00B5B4',
        whiteSpace:'nowrap', borderRadius:10};

    return (
    <Modal open={open} onCancel={onCancel} footer={null} width={900}>
        
      <Stack spacing = {5} py={2} alignItems="flex-start" justifyContent="flex-start"
        style={{boxSizing:'border-box'}}>
        
        {data && data.length > 0 ?  data.map((el) => 
        <Stack style={{background:'#ddd', padding: 10, borderRadius: 20,
          width: isMobile ? 320:'',
         }}>
            <Stack direction="row" spacing={1} >
              <Box style={btnStyle}><ArrowForwardIcon/>{getTitleByStatus(el.status)}</Box>
              <Typography style={{marginTop:8, fontStyle:'italic', 
                color:'#00B5B4', fontSize:10, fontWeight:500}}>
                {el?.workspace ?? ''}
              </Typography>
            </Stack>

            <JobTimeAndProcess key={el.id} form={null} taskDetail={el ?? null}/>
        </Stack>)
        : 
        <Typography style={{fontStyle:'italic', textAlign:'center'}}>Chưa có nhiệm vụ</Typography>
        }
      </Stack>
    </Modal>
    )
}

export default TaskBoard;
