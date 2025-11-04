import { useEffect, useState } from "react";
import { Layout, Dropdown, Avatar, Popover, Modal, message } from "antd";
import { Stack, Checkbox, Box, Typography, FormControlLabel, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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

interface DefaultState {
  [key: string]: string | boolean;
  in_morning: string;
  out_morning: string;
  in_noon: string;
  out_noon: string;
  include_saturday_afternoon: boolean;
  night_overtime: string;
  holiday_overtime: string;
}


const defaultState: DefaultState  = {
  
  in_morning: "07:30",
  out_morning: "11:30",
  in_noon: "13:30",
  out_noon: "17:30",
  include_saturday_afternoon: false,
  night_overtime: "1.5",
  holiday_overtime: "2.0",
};

const NoteWorkpointModal: React.FC<NoteWorkpointModalProps> = ({
  questionOpen,
  onCancel,
  children,
}) => {
      const [formState, setFormState] = useState<DefaultState>(defaultState);
    
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      };
    
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Gửi formState lên backend hoặc xử lý
        console.log(formState);
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
                <Box sx={{width:20,height:20,borderRadius:10,background:'red'}}/>
                <Typography>Đã check-in</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'green'}}/>
                <Typography>Đã check-out</Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'grey'}}/>
                <Typography>Nghỉ phép</Typography>
            </Stack>
        </Stack>

            {/* <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'none',border:'1px solid #000'}}/>
                <Typography>Buổi sáng tính từ 5:00AM</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'none',border:'1px solid #000'}}/>
                <Typography>Buổi chiều tính từ 12:00AM</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Box sx={{width:20,height:20,borderRadius:10,background:'none',border:'1px solid #000'}}/>
                <Typography>Buổi tối tính từ 18:00AM</Typography>
              </Stack>
            </Stack> */}
          
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
                    type="time"
                    name={`in_${period}`}
                    value={formState[`in_${period}`]}
                    onChange={handleChange}
                    required
                    inputProps={{step: 300}} // 5 phút
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="time"
                    name={`out_${period}`}
                    value={formState[`out_${period}`]}
                    onChange={handleChange}
                    required
                    inputProps={{step: 300}}
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
                name="include_saturday_afternoon"
                checked={formState.include_saturday_afternoon}
                onChange={handleChange}
            />
            }
            label="Làm chiều thứ 7"
        />

            <TextField
                label="Tăng ca đêm"
                type="number"
                name="night_overtime"
                value={formState.night_overtime}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.5 }}
                placeholder="Hours"
                style={{width:150}}
            />

            <TextField
                label="Tăng ca Chủ Nhật,Lễ,Tết"
                type="number"
                name="holiday_overtime"
                value={formState.holiday_overtime}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.5 }}
                placeholder="Hours"
                style={{width:150}}
            />
            </Stack>

      <Button variant="contained" type="submit">Cập nhật</Button>
    </Stack>
    </ThemeProvider>
          </Modal>)
          }

export default NoteWorkpointModal;