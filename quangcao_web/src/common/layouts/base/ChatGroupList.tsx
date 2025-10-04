import React,  { useEffect, useState, useRef } from "react";
import { Dropdown, Avatar, Modal } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useApiHost } from "../../hooks/useApiHost";
import type { MenuProps } from "antd/lib";
import Group from '../../../components/chat/pages/dashboard/Group.tsx';
import type { GroupProps } from "../../../@types/chat.type.ts";
import type { MenuInfo } from 'rc-menu/lib/interface';
import { useUser } from "../../hooks/useUser.tsx";
import {Button, Input} from "@mui/material";

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

  return (
    <div className="flex items-center">
      
      <Dropdown menu={{ items, onClick: onMenuClick }}>
        <div className="hidden md:flex items-center">
          <span style={{cursor:"pointer"}} className="text-gray-700 font-semibold text-sm px-3 py-1.5 bg-gray-100 rounded-full">
            Chat Group
          </span>
        </div>
      </Dropdown>

      <Button onClick={() => setAddGroupModalVisible(true)}>+ Group</Button>

      {/* Model popup */}
      <Modal open={modalVisible} onOk={handleOk} onCancel={handleOk} footer={null}
        title={`ID của group là: ${selectedId?.id} - ${selectedId?.name}`}
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
        alert("Tạo nhóm chat mới thành công");

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
