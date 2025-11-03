import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG  } from 'qrcode.react';
// import type { WorkSpace } from '../../../@types/chat.type';
import { useApiHost } from '../../../common/hooks/useApiHost';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { notification } from 'antd';
import type { WorkSpace } from '../../../@types/work-space.type';

interface RatingButtonsProps {
  groupEl: WorkSpace | null;
  // setShowFooter: React.Dispatch<React.SetStateAction<boolean>>;
}

const RatingButtons: React.FC<RatingButtonsProps> = ({ groupEl }) => {
  const [value, setValue] = React.useState<string | null | undefined>(groupEl?.status);
  
  useEffect(() => {
    if (!groupEl?.status || groupEl?.status === '' || groupEl?.status === '0') {
      setValue("start");
    } else {
      setValue(groupEl?.status);
    }
  }, [groupEl]);

  

  const handleChange = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
        
    if(value === newValue)
      return;
    if (value === "pass")
      return;

    // if(value === "talk" && newValue==="start")
    //   return;

    if (newValue !== null) {
      setValue(newValue);
      // setShowFooter(newValue === "talk" || newValue === "pass");

      const data = { group_id: groupEl?.version };

      
      groupEl && (groupEl.status = newValue);

      fetch(`${useApiHost()}/group/${groupEl?.version}/status`, { // hoặc đường dẫn chính xác endpoint của bạn
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({status: newValue}),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to change group status');
        }
        return response.json();
      })
      .then(json => {
        console.log("Updated group status success !")
      })
      .catch(error => {
        console.error('Error update group status', error);
        // alert('Lỗi khi tạo workspace: ' + error.message);
      });


      if (newValue === 'pass') {
        fetch(`${useApiHost()}/workspace/`, { // hoặc đường dẫn chính xác endpoint của bạn
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
        })
        .then(response => {
          if (!response.ok) {
            if (response.status === 400) {
              return response.json().then(err => {
                
                notification.error({message: 'Dự án đã tồn tại !'})

                // notification.error({
                //   message: "Trùng tên dự án - không thể thêm dự án!",
                //   description: `Vui lòng đổi tên nhóm chat`,
                // });
                throw new Error(err.error || 'Bad Request');
              });
            }
            throw new Error('Failed to create workspace');
          }
          return response.json();
        })
        .then(json => {
          notification.success({message:"Đã tạo thành công dự án",
            description:"Bắt đầu tạo công việc",
          });
          // notification.success({
          //   message: "Đã tạo thành công dự án",
          //   description: `Xem trong bảng công việc: ${json.name}, trang sẽ reload để cập nhật`,
          // });
          
        })
        .catch(error => {
          console.error('Error creating workspace:', error);
          // alert('Lỗi khi tạo workspace: ' + error.message);
        });
      }
    }
  };

  const toggleSize = { width: 80, height: 40, fontSize: 12, borderRadius: 30 };


  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="rating"
      size="small"
      
      sx={{ gap: 0, backgroundColor:'none' }}
    >
      <ToggleButton value="start" 
          sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#ff2a3cff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#ff2a3cff',
            },
          } }} aria-label="start">
        <LockIcon fontSize="small"/>
      </ToggleButton>
      <ToggleButton value="talk"  sx={{ ...toggleSize, whiteSpace:'nowrap',
            '&.Mui-selected': {
            backgroundColor: '#ffaf24ff', // Cam
            color: '#fff',
            '&:hover': {
              backgroundColor: '#ffaf24ff',
            },
          } }} aria-label="talk">
        THẢO LUẬN
      </ToggleButton>

      <ToggleButton value="pass"  
      
      sx={{ ...toggleSize,
            '&.Mui-selected': {
            backgroundColor: '#b7ff00ff', // Cam
            color: '#333',
            '&:hover': {
              backgroundColor: '#00ff04ff',
            },
          } }} aria-label="pass">
        HỢP ĐỒNG
      </ToggleButton>

    </ToggleButtonGroup>
  );
}

export default RatingButtons;