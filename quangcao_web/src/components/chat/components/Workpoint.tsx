
import React,  { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { User } from "../../../@types/user.type";
import { useApiHost } from "../../../common/hooks/useApiHost";
import CameraDialog from "./Camera/CameraDialog";
import { useLocation } from "react-router-dom";

const Workpoint = () => {
    
  const { id } = useParams<{ id: string }>();

  // Gọi API backend check với id và token
  // Nếu hợp lệ thì render Group, không hợp lệ có thể redirect hoặc báo lỗi

  // Ví dụ gọi API trong useEffect và lưu trạng thái check
  const [selected, setSelected] = React.useState<User | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    console.log("Param", id );
    if (!id) return;
    
    // const accessToken = sessionStorage.getItem('accessToken');
    fetch(`${useApiHost()}/workpoint/check-access/${id}` 
    // , {
    //     method: 'GET',
    //     headers: {
    //     Authorization: `Bearer ${accessToken || ''}`,
    //     },
    // }
    )
    .then((res) => {
        if (res.status === 401 || res.status === 403) {
        // Nếu không hợp lệ thì chuyển hướng về login
        window.location.href = "/login";
        throw new Error("Unauthorized");
        }
        
        return res.json();
    })
    .then(response => {
        console.log(response);
        if (response.valid) {
            setVerified(true);
            setSelected(response.data);
        } else {
        setVerified(false);
            window.location.href = "/login";
        }
        setLoading(false);
    })
    .catch(() => {
        setVerified(false);
        setLoading(false);
    });
    }, [id]);

  if (loading) return <div>Loading...Workpoint</div>;
  if (!verified) return <div>Access denied or invalid token</div>;

  return <CameraDialog userEl = {selected}/>;
};

export default Workpoint;
