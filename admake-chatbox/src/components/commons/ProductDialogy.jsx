import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Stack,
  Grid
} from '@mui/material';

import { StyledButton } from './TitlePanel';
import { ConfirmDialog } from './CommentDialog';

export default function propsDialog({open, setOpen, ...props}) {
  const [comment, setComment] = useState('');
  const [receiver, setReceiver] = useState('');
  const [buyOpen, setBuyOpen] = useState(false);

  const handleBuyClick = () => {
    setBuyOpen(true);
  };

  const handleBuyClose = () => {
    setBuyOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };


  return (
    <>
      <Dialog open={open} onClose={handleClose} sx={{
    '& .MuiPaper-root': {
      minWidth: '80vw',
      height: 500,
      color:"#fff",
      backgroundImage: 'url("images/panelBK_001.svg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: '1px solid rgba(255,255,255,0.5)',
      p: 5,
      borderRadius: 5,
      overflow:'visible',
      display: 'flex', 
      justifyContent: "flex-start"
    },
  }}>
        <DialogTitle>{props.name}</DialogTitle>
        <DialogContent>
          <Stack direction="row" sx={{overflow:'hidden'}} spacing={5}>
            <img src={props.img} style={{width:'auto',height:320}}/>

            <Stack direction="column">
              <Typography variant="body2" color="inherit">
                Material: {props.material}
              </Typography>
              <Typography variant="body2" color="inherit" mt={2}>
                Base Price: ${props.basePrice && props.basePrice.toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                color="inherit"
                component="div"
                mt={2}
              >
                Sizes & Prices:
                <Grid
                  container
                  mt={5}
                  sx={{gap: 2}}
                >
                  {props.sizeDetails && Object.entries(props.sizeDetails).map(([size, {price, stock}], index) => (
                    <Grid
                      container
                      item
                      key={size}
                      sx={{
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 5,
                        minWidth: 200,
                      }}
                      alignItems="center"
                      justifyContent="flex-start" // căn nội dung vào đầu ngang trục chính
                    >
                      <Grid item xs={6} sx={{ padding: 1, width: 50, minWidth: 50, maxWidth: 50}}>
                        <Typography pl={2}>{size}</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ padding: 1, width: 150, minWidth: 150, maxWidth: 150}}>
                        <Typography pl={5} sx={{textDecoration:'italic'}}>In stock: {stock}</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ padding: 1 ,
                        width: 150, minWidth: 150, maxWidth: 150,
                      }}>
                        <Typography>${price.toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleBuyClick} variant="contained">Buy</Button>
        </DialogActions>
      </Dialog>

      <BuyConfirmDialog
        open={buyOpen}
        onClose={handleBuyClose}
        sizeDetails={props.sizeDetails}
      />
    </>
  );
}





function BuyConfirmDialog({ open, onClose, sizeDetails }) {
  const sizes = Object.keys(sizeDetails || {});

  const [selectedSize, setSelectedSize] = useState(sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');


  const [confirmOpen, setConfirmOpen] = useState(false);

  const maxStock = selectedSize ? sizeDetails[selectedSize].stock : 0;

  const isFormValid =
    selectedSize &&
    quantity > 0 &&
    quantity <= maxStock &&
    address.trim() !== '' &&
    phone.trim() !== '' &&
    paymentMethod.trim() !== '';

  const handleSizeChange = (event) => {
    setSelectedSize(event.target.value);
    setQuantity(1); // reset số lượng khi đổi size
  };

  const handleQuantityChange = (event) => {
    let val = Number(event.target.value);
    if (val > maxStock) val = maxStock;
    if (val < 1) val = 1;
    setQuantity(val);
  };

  const handleSubmit = () => {
    const orderInfo = {
      size: selectedSize,
      quantity,
      address,
      phone,
      email,
      paymentMethod,
    };
    console.log('Thông tin đặt hàng:', orderInfo);


    setConfirmOpen(true);

    onClose();
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm buying</DialogTitle>
      
      <DialogContent dividers>
        
        <Box mb={2}>
          <FormControl fullWidth>
            <InputLabel>Size</InputLabel>
            <Select value={selectedSize} label="Size" onChange={handleSizeChange}>
              {sizes.map(size => (
                <MenuItem key={size} value={size} disabled={sizeDetails[size].stock === 0}>
                  {size} (Available: {sizeDetails[size].stock})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box mb={2}>
          <TextField
            label="Number"
            type="number"
            fullWidth
            inputProps={{ min: 1, max: maxStock }}
            value={quantity}
            onChange={handleQuantityChange}
            helperText={`Maximum ${maxStock}`}
            disabled={maxStock === 0}
          />
        </Box>
        <Box mb={2}>
          <TextField
            label="Full Name"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <TextField
            label="Address"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <TextField
            label="Phone Number"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <FormControl fullWidth>
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentMethod}
              label="Phương thức thanh toán"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="cod">Cash On Delivery COD</MenuItem>
              <MenuItem value="crypto">Payment by Crypto</MenuItem>
              <MenuItem value="mastercard">Payment by Mastercard</MenuItem>
              
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid  || maxStock === 0}>
          Confirm Buy
        </Button>
      </DialogActions>
    </Dialog>

    <ConfirmDialog open ={confirmOpen} setOpen={setConfirmOpen} 
      title="Thanks you"
      content="Your order has been processed"
      img ="/images/reception.png"
    />
    </>
  );
}

