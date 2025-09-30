import React,  { useEffect, useState } from "react";
import { Dropdown, Avatar, Modal } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useApiHost } from "../../hooks/useApiHost";
import type { MenuProps } from "antd/lib";
import Group from '../../../components/chat/pages/dashboard/Group.tsx';
import type { GroupProps } from "../../../@types/chat.type.ts";
import type { MenuInfo } from 'rc-menu/lib/interface';

const ChatGroupList: React.FC = ({}) => {
  const navigate = useNavigate();
  const [chatGroupList, setChatGroupList] = useState<GroupProps[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<GroupProps | null>(null);
  const API_HOST = useApiHost();
  
  useEffect(() => {
    console.log('!!!API', API_HOST);

    fetch(`${API_HOST}/group/`)
      .then((res) => res.json())
      .then((data: GroupProps[]) => 
        {
          console.log('GroupData', data);
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

      {/* Model popup */}
      <Modal visible={modalVisible} onOk={handleOk} onCancel={handleOk} footer={null}
        title={`ID của group là: ${selectedId?.id} - ${selectedId?.name}`}
        okText="OK" cancelButtonProps={{ style: { display: "none" } }}
        style={{ padding:0, minWidth: '96vw'}}
        >
        <Group/>
      </Modal>

    </div>
  );
};

export default ChatGroupList;
