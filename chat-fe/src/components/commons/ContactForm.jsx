import { Stack, TextField, Button, Box, Typography, Select, MenuItem } from "@mui/material";
import React, { useEffect, useState } from "react";
import { CenterBox, StyledButton, FlareEffect } from "./TitlePanel";
import CommentDialog,{ConfirmDialog} from "./CommentDialog";
import Autocomplete from '@mui/material/Autocomplete';
// import nations from "../../json/nation.json";

const ContactForm = ({mode="contact"}) => {
  const [country, setCountry] = useState('');
  const [nations, setNations] = useState([]);

  const handleCountryChange = (event, newValue) => {
    console.log("NewValue", event, newValue);
  setCountry(event.target.value);
  setFormData(prev => ({
    ...prev,
    country: newValue ? newValue.name : '',
  }));
};


  useEffect(()=>{
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags,idd')
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setNations(data);
    });
  },[])

  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    address: "",
    phoneNumber: "",
    description: "",
    country: "",
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name,value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // e.preventDefault();

    // Kiểm tra các trường quan trọng
    if (!formData.fullName.trim()) {
      setStatus("Please enter your full name.");
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      setStatus("Please enter your phone number.");
      return false;
    }

    setStatus(null);
    console.log("Form submitted:", formData);
    setCountry("");

    setFormData({
      fullName: "",
      nickname: "",
      address: "",
      email: "",
      phoneNumber: "",
      description: "",
      country: "", // Nếu có
    });

    return true;
  };


  const commonTextFieldProps = {
  
  sx: {
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "none",
        backgroundColor: "rgba(255,255,255,0.1)",
      },
      "&:hover fieldset": {
        borderColor: "white",
      },
      "&.Mui-focused fieldset": {
        borderColor: "white",
      },
      "& input": {  // đảm bảo chữ nhập sáng màu
        color: "white",
      },
    },
    "& label": {
      color: "white"
    }
  },
};


  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: 800,
        mx: "auto",
        mb: 10,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
      }}
    >
      <FlareEffect top={-30}/>
      
      <TextField
        label="Full Name"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        required
        fullWidth
        {...commonTextFieldProps}
      />

      {mode === "contact" &&
      <TextField
        label="Nickname"
        name="nickname"
        value={formData.nickname}
        onChange={handleChange}
        fullWidth
        {...commonTextFieldProps}
      />}

      <TextField
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        fullWidth
        {...commonTextFieldProps}
      />

      <TextField
        label="Phone Number"
        name="phoneNumber"
        type="tel"
        value={formData.phoneNumber}
        onChange={handleChange}
        required
        fullWidth
        {...commonTextFieldProps}
      />
      
      <TextField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        fullWidth
        {...commonTextFieldProps}
      />

      {mode === "partner" && <>
        <TextField label="Business Name" name="business" value={formData.business} 
          onChange={handleChange} fullWidth {...commonTextFieldProps} />
        <TextField label="Your website" name="website" value={formData.website} 
          onChange={handleChange} fullWidth {...commonTextFieldProps} />
        
      </>}
        <Stack direction="row" spacing={5}>
          <Typography color="white" pl={2} pt={2} textTransform="none">Country</Typography>
          <Select
            labelId="country-select-label"
            id="country-select"
            value={country}
            label="Select a country"
            onChange={handleCountryChange}
            sx={{ 
              color: "white",
              width: 300,
              backgroundColor: "rgba(255,255,255,0.1)",
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#000' }
            }}
          >
        {nations && nations.map((nation) => (
          <MenuItem key={nation.cca2} value={nation.name}>
            <img src={nation.flags.svg} alt={nation.name} 
              style={{ width: 24, marginRight: 8, borderRadius: 12 }} />
            {nation.name.common} (+{nation.idd.suffixes[0]})
          </MenuItem>
        ))}
      </Select>
      </Stack>

      <TextField
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={4}
        fullWidth
        {...commonTextFieldProps}
      />

      

      <CenterBox>
        {status && (
          <Typography variant="body2" color="success.main" align="center">
            {status}
          </Typography>
        )}

        <StyledButton title="Submit Now" DialogComponent ={ConfirmDialog} 
          onClick={() => handleSubmit()}
          dialogProps={{title:"Thank you!", 
            img:"/images/reception.png",
          content:"Admin will contact you soon"}}/>
      </CenterBox>

      
    </Box>
  );
};

export default ContactForm;
