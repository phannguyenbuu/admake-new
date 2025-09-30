import React, { useState } from 'react';
import { Stack, TextField, Button, Box, Typography } from '@mui/material';
import { useUser } from './UserContext';

const Login = () => {
    const { login } = useUser();
    const [username, setUsername] = useState('tun');
    const [password, setPassword] = useState('Tun@123456');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            console.log('UserId', username, password);
        await login({ username, password }); // Gọi login trong context
        // Login thành công, userId sẽ được cập nhật trong context
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
                label="Username"
                variant="outlined"
                fullWidth
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <TextField
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <Button variant="contained" type="submit" fullWidth>
                Login
            </Button>
            {error && <Typography color="error">{error}</Typography>}
            </Stack>
        </form>
        </Box>
  );
};

export default Login;
