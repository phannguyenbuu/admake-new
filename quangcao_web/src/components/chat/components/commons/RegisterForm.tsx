import React, { useState } from 'react';
import {
  TextField,
  Button,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';

import { notification } from 'antd';

function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rewritePassword: '',
    address: '',
    phoneNumber: '',
    email: '',
    paymentMethod: 'paypal', // paypal, crypto, banking
    visaName: '',
    visaNumber: '',
    visaCCV: '',
    visaExpire: '',
    cryptoType: 'bitcoin',
    cryptoWallet: '',
    bankAccountName: '',
    bankAmount: '',
    bankTransferNote: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.rewritePassword) {
      notification.error({message:"Passwords do not match!"});
      return;
    }
    console.log('Registration Form:', formData);
    // Submit form logic...
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        minWidth: 600,
        margin: 'auto',
        p: 4,
        border: '1px solid #ddd',
        borderRadius: 2,
        bgcolor: 'none',
        color: 'white',
        '& .MuiInputBase-root': {
          color: 'white',
          backgroundColor: '#152238ff',
        },
        '& .MuiFormLabel-root': {
          color: 'white',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#555',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#fff',
        },
        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#1976d2',
        },
      }}
    >
      <Typography variant="h5" gutterBottom>
        Member Registration
      </Typography>

      <Stack spacing={2}>
        {/* Existing fields */}
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Rewrite Password"
          name="rewritePassword"
          type="password"
          value={formData.rewritePassword}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          required
        />

        {/* Payment method radio */}
        <FormControl>
          <FormLabel>Payment Method</FormLabel>
          <RadioGroup
            row
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <FormControlLabel
              value="paypal"
              control={<Radio sx={{ color: 'white' }} />}
              label="PayPal (Visa)"
            />
            <FormControlLabel
              value="crypto"
              control={<Radio sx={{ color: 'white' }} />}
              label="Crypto"
            />
            <FormControlLabel
              value="banking"
              control={<Radio sx={{ color: 'white' }} />}
              label="Bank Transfer"
            />
          </RadioGroup>
        </FormControl>

        {/* Paypal visa section */}
        {formData.paymentMethod === 'paypal' && (
          <Stack spacing={2}>
            <Box
              component="img"
              src="https://blog.basistheory.com/hs-fs/hubfs/anatomy-credit-card.webp?width=800&height=672&name=anatomy-credit-card.webp"
              alt="Visa Card"
              sx={{ width: 600, mb: 2 }}
            />
            <TextField
              label="Name on Visa Card"
              name="visaName"
              value={formData.visaName}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Visa Number"
              name="visaNumber"
              value={formData.visaNumber}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ maxLength: 19 }}
            />
            <TextField
              label="CCV"
              name="visaCCV"
              value={formData.visaCCV}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ maxLength: 4 }}
            />
            <TextField
              label="Expiry Date"
              name="visaExpire"
              value={formData.visaExpire}
              onChange={handleChange}
              type="month"
              fullWidth
              required
            />
          </Stack>
        )}

        {/* Crypto section */}
        {formData.paymentMethod === 'crypto' && (
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Crypto Type</FormLabel>
              <RadioGroup
                name="cryptoType"
                value={formData.cryptoType}
                onChange={handleChange}
                row
              >
                <FormControlLabel
                  value="bitcoin"
                  control={<Radio sx={{ color: 'white' }} />}
                  label="Bitcoin"
                />
                <FormControlLabel
                  value="usdt"
                  control={<Radio sx={{ color: 'white' }} />}
                  label="USDT"
                />
                <FormControlLabel
                  value="tron"
                  control={<Radio sx={{ color: 'white' }} />}
                  label="Tron"
                />
                <FormControlLabel
                  value="doge"
                  control={<Radio sx={{ color: 'white' }} />}
                  label="Dogecoin"
                />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Wallet Address"
              name="cryptoWallet"
              value={formData.cryptoWallet}
              onChange={handleChange}
              fullWidth
              required
            />
            <Button
              variant="contained"
              sx={{ mt: 1 }}
              onClick={() =>
                window.open('https://example.com/download-crypto-app', '_blank')
              }
            >
              Download App to Use Crypto
            </Button>
          </Stack>
        )}

        {/* Banking section */}
        {formData.paymentMethod === 'banking' && (
          <Stack spacing={2}>
            <TextField
              label="Account Holder Name"
              name="bankAccountName"
              value={formData.bankAccountName}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Amount"
              name="bankAmount"
              value={formData.bankAmount}
              onChange={handleChange}
              type="number"
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              label="Transfer Note"
              name="bankTransferNote"
              value={formData.bankTransferNote}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
            <Box
              component="img"
              src="https://cdn.shopify.com/s/files/1/0730/4518/0689/files/4D049EDA-E8DA-45B2-9758-58F7374A12B1_480x480.jpg?v=1678273327"
              alt="Bank Transfer QR Code"
              sx={{ width: 250, height: 250, mt: 2, alignSelf: 'center' }}
            />
          </Stack>
        )}

        <Button variant="contained" type="submit" sx={{ mt: 3 }}>
          Register
        </Button>
      </Stack>
    </Box>
  );
}

export default RegisterForm;
