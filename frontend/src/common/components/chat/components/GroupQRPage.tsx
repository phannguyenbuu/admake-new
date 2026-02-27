
import React,  { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Group from "../pages/dashboard/Group";
// import type { GroupProps } from "../../../@types/chat.type";
import { useApiHost } from "../../../common/hooks/useApiHost";
import type { WorkSpace } from "../../../@types/work-space.type";
import { useChatGroup } from "../ProviderChat";
import { useUser } from "../../../common/hooks/useUser";

const GroupQRPage = () => {
  const {workspaceEl, setWorkspaceEl} = useChatGroup();
  const { id } = useParams<{ id: string }>();
  const {setUserRoleId} = useUser();
  // Gọi API backend check với id và token
  // Nếu hợp lệ thì render Group, không hợp lệ có thể redirect hoặc báo lỗi

  // Ví dụ gọi API trong useEffect và lưu trạng thái check
  // const [selected, setSelected] = React.useState<WorkSpace | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log("Param", workspaceEl?.role);
    if (!id) return;
    
    // const accessToken = sessionStorage.getItem('accessToken');
    fetch(`${useApiHost()}/group/check-access/${id}/`
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
        if (response.valid) {
          setVerified(true);
          setWorkspaceEl(response.data);
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

  if (loading) return <div>Loading...</div>;
  if (!verified) return <div>Access denied or invalid token</div>;

  return <Group/>;
};

export default GroupQRPage;
