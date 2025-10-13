import React,  { useEffect, useState, useRef } from "react";
import { Dropdown, Avatar, Modal, notification } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useApiHost } from "../../hooks/useApiHost";
import type { MenuProps } from "antd/lib";
import Group from '../../../components/chat/pages/dashboard/Group.tsx';
import type { GroupProps } from "../../../@types/chat.type.ts";
import type { MenuInfo } from 'rc-menu/lib/interface';
import { useUser } from "../../hooks/useUser.tsx";
import {Button, Input} from "@mui/material";
import {Box, Stack} from "@mui/material";

const ChatGroupList: React.FC = ({}) => {
  const navigate = useNavigate();
  const [chatGroupList, setChatGroupList] = useState<GroupProps[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<GroupProps | null>(null);
  const API_HOST = useApiHost();
  const {userId, userRoleId} = useUser();


  const [addGroupModalVisible, setAddGroupModalVisible] = useState(false);

  const handleAddGroupOk = async (name: string) => {
    // gọi API POST /group với tên group = name
    setAddGroupModalVisible(false);
  };
  
  useEffect(() => {
    // console.log('!!!API', API_HOST);

    fetch(`${API_HOST}/group/`)
      .then((res) => res.json())
      .then((data: GroupProps[]) => 
        {
          // console.log('GroupData', data);
          setChatGroupList(data);
        })
      .catch((error) => console.error("Failed to load group data", error));
  }, []);

  const items: MenuProps["items"] = (chatGroupList || []).map((group) => ({
    key: group.id,
    label: group.name,
    icon: <UserOutlined />,
  }));

  const onMenuClick: MenuProps["onClick"] = (info: MenuInfo) => {
    // console.log('chatGroupList',chatGroupList, info);
    const group = chatGroupList.find(g => g.id.toString() === info.key);
    if (group) {
      console.log('Selected Group:', group);
      setSelectedId(group);
      setModalVisible(true);
    }
  };

  const handleOk = () => {
    setModalVisible(false);
    setSelectedId(null);
    window.location.reload();
    // Nếu muốn điều hướng sau khi OK
    // navigate("/dashboard/infor");
  };

  const [isHover, setIsHover] = useState(false);

  const spanStyle: React.CSSProperties = {
    cursor: "pointer",
    position: "relative",
    top:-20,
    left: 20,
    marginTop: 15,
    height: 25,
    width: 80,
    fontWeight: 700,
    color: "#777",
    padding: "0px 20px",
    borderRadius: 10,
    transition: "background-color 0.3s",
  };

  return (
    <div className="flex items-center">
      <Stack direction="row" spacing={2} px={0.5}
        sx={{backgroundColor:"#00B4B6", maxHeight:30, borderRadius: 5}}>
        <Dropdown menu={{ items, onClick: onMenuClick }}>
          <Box sx = {{width: 120,height: 25, top: 2,position: "relative",borderRadius: 10,
              backgroundColor: isHover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
              transition: "background-color 1s ease"}}>
            <span style={spanStyle}
              onMouseEnter={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              CHAT
            </span>
          </Box>
        </Dropdown>

        <Button sx={{color:"#fff"}}
          onClick={() => setAddGroupModalVisible(true)}>+ Group</Button>
       </Stack>

      {/* Model popup */}
      <Modal open={modalVisible} onOk={handleOk} onCancel={handleOk} footer={null}
        title={`ID: ${selectedId?.id} - ${selectedId?.name}`}
        okText="OK" cancelButtonProps={{ style: { display: "none" } }}
        style={{ padding:0, minWidth: '96vw'}}
        >
        <Group selected={selectedId} setSelected={setSelectedId}/>
      </Modal>


      <AddGroupModal
        visible={addGroupModalVisible}
        onOk={handleAddGroupOk}
        onCancel={() => setAddGroupModalVisible(false)}
      />

    </div>
  );
};

export default ChatGroupList;

interface AddGroupModalProps {
  visible: boolean;
  onOk: (groupName: string) => void;
  onCancel: () => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ visible, onOk, onCancel }) => {
  const [groupName, setGroupName] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const handleOk = () => {
    onOk(groupName);
    
    fetch(`${useApiHost()}/group/`, 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: groupName,
          address: address,
         }),
      })
      .then((response) => response.json())
      .then((data) => {
        notification.success({message: "Tạo nhóm chat mới thành công",
          description: `Bắt đầu thảo luận công việc và hợp đồng`,
        });

        setTimeout(()=>{
          window.location.reload();
        })
      })
      .catch((err) => console.error(err));
  };
  
  return (
    <Modal
      title="Tạo group mới"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !groupName.trim() }}
    >
      <Input
        placeholder="Nhập tên group"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        autoFocus
        style={{width:300}}
      />
      <Input
        placeholder="Địa chỉ / Ghi chú thêm"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        autoFocus
        style={{width:300}}
      />
    </Modal>
  );
};
