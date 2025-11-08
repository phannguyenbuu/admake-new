import { useEffect, useState } from "react";
import { Layout, Dropdown, Avatar, Popover, Modal, message } from "antd";
import { Stack, Checkbox, Box, Typography, FormControlLabel, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useUser } from "../../hooks/useUser";
import { useApiHost } from "../../hooks/useApiHost";
import { notification } from "antd/lib";
import { useWorkpointSetting } from "../../hooks/useWorkpointSetting";

interface NoteWorkpointModalProps {
  questionOpen: boolean;
  onCancel: () => void;
  children?: React.ReactNode; // nếu bạn cần hiển thị nội dung bên trong modal
}

const theme = createTheme({
  typography: {
    fontSize: 12,
    body1: {
      fontWeight: 300,
    },
  },
});

const NoteWorkpointModal: React.FC<NoteWorkpointModalProps> = ({
  questionOpen,
  onCancel,
  children,
}) => {
      const {userLeadId} = useUser();
      const {workpointSetting, setWorkpointSetting} = useWorkpointSetting();
          
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
          setWorkpointSetting(prev => prev ? {...prev, [name]: checked} : prev);
        } else if (type === 'number') {
          const val = value === '' ? 0 : parseFloat(value);
          if (!isNaN(val)) {
            setWorkpointSetting(prev => prev ? {...prev, [name]: val} : prev);
          }
        } else if (name.endsWith('_in_hour') || name.endsWith('_in_minute') || 
                  name.endsWith('_out_hour') || name.endsWith('_out_minute')) {
          // Với input dạng time "hh:mm", tách lấy phần giờ hoặc phút rồi cập nhật number đúng key
          const [hourOrMinute] = value.split(':');
          const num = parseInt(hourOrMinute, 10);
          if (!isNaN(num)) {
            setWorkpointSetting(prev => {
              if (!prev) return prev;
              return {...prev, [name]: num};
            });
          }
        } else {
          // Nếu còn field nào string mà workpointSetting kiểu number | boolean thì cân nhắc chuyển lại kiểu hoặc loại bỏ
        }
      };

      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!workpointSetting) {
              // Xử lý khi workpointSetting chưa được khởi tạo (null)
              console.error('Form state chưa được khởi tạo');
              return;
          }

        // Chuẩn bị dữ liệu gửi về backend, convert string "hh:mm" thành số giờ và phút
        const dataToSend = {
          morning_in_hour: workpointSetting.morning_in_hour,
          morning_in_minute: workpointSetting.morning_in_minute,
          morning_out_hour: workpointSetting.morning_out_hour,
          morning_out_minute: workpointSetting.morning_out_minute,

          noon_in_hour: workpointSetting.noon_in_hour,
          noon_in_minute: workpointSetting.noon_in_minute,
          noon_out_hour: workpointSetting.noon_out_hour,
          noon_out_minute: workpointSetting.noon_out_minute,

          work_in_saturday_noon: workpointSetting.work_in_saturday_noon,

          multiply_in_night_overtime: workpointSetting.multiply_in_night_overtime,
          multiply_in_sun_overtime: workpointSetting.multiply_in_sun_overtime,
        };

        fetch(`${useApiHost()}/workpoint/setting/${userLeadId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        })
          .then(res => {
            if (!res.ok) throw new Error('Lỗi khi cập nhật cấu hình');
            return res.json();
          })
          .then(data => {
            message.success('Cập nhật thành công');
            onCancel(); // Đóng modal sau khi thành công
          })
          .catch(err => {
            message.error(err.message || 'Lỗi mạng');
          });
      };


      
    
    return (
    <Modal open={questionOpen}
          onCancel={onCancel}
          footer={null}
        //   width={600}
          title={`Kí hiệu & cấu hình phần chấm công`}
        >
        <ThemeProvider theme={theme}>
        <Stack direction="row" spacing={10} p={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'none',border:'1px solid #000'}}/>
                <Typography>Chưa check-in</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'green'}}/>
                <Typography>Đã check-in</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'red'}}/>
                <Typography>Đã check-out</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'grey'}}/>
                <Typography>Nghỉ phép</Typography>
            </Stack>
        </Stack>

            <Stack direction="row" spacing={1} sx={{height:72}}>
              <Stack sx={{background:"#999",borderRadius:8, width: 30,pt:2 }}>
                  <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
                    0.00
                  </Typography>
                  <Typography color="#fff" textAlign="center" fontSize={10} fontWeight={300}>
                    0.00
                  </Typography>
              </Stack>
              <Stack sx={{ }}>
                <Typography>Tổng giờ làm hành chính</Typography>
                <Typography sx={{pt:3}}>Tổng giờ tăng ca</Typography>
              </Stack>
            </Stack>
            
          </Stack>
          
          <Stack component="form" onSubmit={handleSubmit} spacing={4}>
                <TableContainer component={Paper}>
                  <Table size="small" aria-label="work times table">
                    <TableHead>
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell>Vào</TableCell>
                        <TableCell>Ra</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['morning', 'noon'].map(period => (
                        <TableRow key={period}>
                          <TableCell>{period === "morning" ? "Sáng" : "Chiều"}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              name={`${period}_in_hour`}
                              value={workpointSetting ? workpointSetting[`${period}_in_hour`] : ''}
                              onChange={handleChange}
                              inputProps={{ min: 0, max: 23 }}
                              label="Giờ vào"
                              required
                              style={{ width: 75 }}
                            />
                            <TextField
                              type="number"
                              name={`${period}_in_minute`}
                              value={workpointSetting ? workpointSetting[`${period}_in_minute`] : ''}
                              onChange={handleChange}
                              inputProps={{ min: 0, max: 59, step: 1 }}
                              label="Phút vào"
                              required
                              style={{ width: 75, marginLeft: 8 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              name={`${period}_out_hour`}
                              value={workpointSetting ? workpointSetting[`${period}_out_hour`] : ''}
                              onChange={handleChange}
                              inputProps={{ min: 0, max: 23 }}
                              label="Giờ ra"
                              required
                              style={{ width: 75 }}
                            />
                            <TextField
                              type="number"
                              name={`${period}_out_minute`}
                              value={workpointSetting ? workpointSetting[`${period}_out_minute`] : ''}
                              onChange={handleChange}
                              inputProps={{ min: 0, max: 59, step: 1 }}
                              label="Phút ra"
                              required
                              style={{ width: 75, marginLeft: 8 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="work_in_saturday_noon"
                        checked={workpointSetting?.work_in_saturday_noon || false}
                        onChange={handleChange}
                      />
                    }
                    label="Làm chiều thứ 7"
                  />

                  <TextField
                    label="Tăng ca đêm"
                    type="number"
                    name="multiply_in_night_overtime"
                    value={workpointSetting?.multiply_in_night_overtime || ''}
                    onChange={handleChange}
                    inputProps={{ min: 1, step: 0.1 }}
                    placeholder="Hours"
                    style={{ width: 150 }}
                  />

                  <TextField
                    label="Tăng ca Chủ Nhật,Lễ,Tết"
                    type="number"
                    name="multiply_in_sun_overtime"
                    value={workpointSetting?.multiply_in_sun_overtime || ''}
                    onChange={handleChange}
                    inputProps={{ min: 1, step: 0.1 }}
                    placeholder="Hours"
                    style={{ width: 150 }}
                  />
                </Stack>

                <Button variant="contained" type="submit">Cập nhật</Button>
              </Stack>

            </ThemeProvider>
          </Modal>)
          }

export default NoteWorkpointModal;