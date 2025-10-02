
import React,  { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Group from "../pages/dashboard/Group";
import type { GroupProps } from "../../../@types/chat.type";
import { useApiHost } from "../../../common/hooks/useApiHost";

const GroupQRPage = () => {
  const { id, token } = useParams<{ id: string, token: string }>();

  // Gọi API backend check với id và token
  // Nếu hợp lệ thì render Group, không hợp lệ có thể redirect hoặc báo lỗi

  // Ví dụ gọi API trong useEffect và lưu trạng thái check
  const [selected, setSelected] = React.useState<GroupProps | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log("Param", id, token);
    if (!id || !token) return;
    
    const accessToken = sessionStorage.getItem('accessToken');
    fetch(`${useApiHost()}/group/check-access/${id}/${token}/`, {
        method: 'GET',
        headers: {
        Authorization: `Bearer ${accessToken || ''}`,
        },
    })
    .then((res) => {
    if (res.status === 401 || res.status === 403) {
      // Nếu không hợp lệ thì chuyển hướng về login
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    return res.json();
  })
    .then(response => {
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
    }, [id, token]);

  if (loading) return <div>Loading...</div>;
  if (!verified) return <div>Access denied or invalid token</div>;

  return <Group selected={selected} setSelected={null}/>;
};

export default GroupQRPage;
