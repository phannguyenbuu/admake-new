
import React,  { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { User } from "../../../@types/user.type";
import { useApiHost } from "../../../common/hooks/useApiHost";
import CameraDialog from "./Camera/CameraDialog";
import { useLocation } from "react-router-dom";
import { useWorkpointInfor } from "../../../common/hooks/useWorpointInfor";

const Workpoint = () => {
    
  const { id } = useParams<{ id: string }>();

  const {workpointEl} = useWorkpointInfor();
  const [selected, setSelected] = React.useState<User | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!id) return;
    
    fetch(`${useApiHost()}/workpoint/check-access/${id}`)
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

            localStorage.setItem('Admake-User-Access', 
                JSON.stringify({ user_id: response.data.id, username: response.data.fullName }));

            
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
