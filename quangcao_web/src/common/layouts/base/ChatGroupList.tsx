import React,  { useEffect, useState } from "react";
import { Dropdown, Avatar, Modal } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useApiHost } from "../../hooks/useApiHost";
import type { MenuProps } from "antd/lib";

interface ChatGroupItem {
  id: number;
  name: string;
  description: string;
}

const ChatGroupList: React.FC = ({}) => {
  const navigate = useNavigate();
  const [ChatGroupList, setChatGroupList] = useState<ChatGroupItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${useApiHost()}/group/`)
      .then((res) => res.json())
      .then((data: ChatGroupItem[]) => 
        {
          console.log('GroupData', data);
          setChatGroupList(data);
        })
      .catch((error) => console.error("Failed to load group data", error));
  }, []);

  const items: MenuProps["items"] = (ChatGroupList || []).map((group) => ({
    key: group.id,
    label: group.name,
    icon: <UserOutlined />,
  }));

  const onMenuClick: MenuProps["onClick"] = (info: { key: string }) => {
    // info.key là workspace.id bạn bấm chọn
    // navigate("/dashboard/infor");
    setSelectedId(info.key);
    setModalVisible(true);
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
      <Modal visible={modalVisible} onOk={handleOk} onCancel={handleOk} 
        title="Workspace Selected" okText="OK" cancelButtonProps={{ style: { display: "none" } }}>
        <p>ID của workspace là: {selectedId}</p>
      </Modal>

    </div>
  );
};

export default ChatGroupList;
