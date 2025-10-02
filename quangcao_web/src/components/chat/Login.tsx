import React, { useState } from 'react';
import { Stack, TextField, Button, Box, Typography } from '@mui/material';
import { useUser } from '../../common/hooks/useUser';

const Login = () => {
  const { login } = useUser();
  const [username, setUsername] = useState('tun');
  const [password, setPassword] = useState('Tun@123456');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      console.log('Tên đăng nhập và mật khẩu:', username, password);
      await login({ username, password }); // Gọi hàm login trong context
      // Nếu login thành công, userId sẽ được cập nhật trong context
    } catch (err) {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={3} sx={{ width: 300 }}>
          <TextField
            label="Tên đăng nhập"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Mật khẩu"
            variant="outlined"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button variant="contained" type="submit" fullWidth>
            Đăng nhập
          </Button>
          {error && <Typography color="error">{error}</Typography>}
        </Stack>
      </form>
    </Box>
  );
};

export default Login;
