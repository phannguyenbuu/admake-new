import React, { useEffect, useState, useRef, useContext } from "react";
import { Dropdown, Avatar, Modal, notification } from "antd";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";

import { useApiHost } from "../../hooks/useApiHost.ts";
import type { MenuProps } from "antd/lib";
import Group from '../../../components/chat/pages/dashboard/Group.tsx';
// import type { WorkSpace } from "../../../@types/chat.type.ts";
import type { MenuInfo } from 'rc-menu/lib/interface';
import { useUser } from "../../hooks/useUser.tsx";
import { Button, Input } from "@mui/material";
import { Box, Stack } from "@mui/material";

import type { WorkSpace } from "../../../@types/work-space.type.ts";
import { ChatGroupProvider } from "../../../components/chat/ProviderChat.tsx";
import { SearchOutlined } from "@ant-design/icons";
import { Input as AntdInput, Menu } from "antd";
import { useChatGroup } from "../../../components/chat/ProviderChat.tsx";
import { useWorkSpaceQueryTaskById } from "../../hooks/work-space.hook.tsx";

const ChatGroupList = () => {
  const { workspaceEl, setWorkspaceEl } = useChatGroup();
  const [modalVisible, setModalVisible] = useState(false);
  // const [selectedId, setSelectedId] = useState<WorkSpace | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState<WorkSpace[]>([]); // items là danh sách menu gốc
  const { refetch } = useWorkSpaceQueryTaskById(workspaceEl?.id ?? '');
  //@ts-ignore
  const { userId, userRoleId, workspaces, isMobile } = useUser();

  useEffect(() => {
    setFilteredItems(workspaces); // Khởi tạo danh sách đầy đủ khi component load
  }, [workspaces]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value) {
      // Nếu input rỗng, hiện hết danh sách gốc
      setFilteredItems(workspaces);
    } else {
      const filtered = workspaces.filter((el) =>
        el.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const onMenuClick: MenuProps["onClick"] = (info: MenuInfo) => {
    // console.log('workspaces',workspaces, info);
    const group = workspaces.find(g => g.id.toString() === info.key);
    if (group) {
      console.log('Selected Group:', group);
      setWorkspaceEl(group);
      setModalVisible(true);
    }
  };

  const handleOk = () => {
    setModalVisible(false);
    setWorkspaceEl(null);
    refetch();
  };

  const [isHover, setIsHover] = useState(false);

  const spanStyle: React.CSSProperties = {
    cursor: "pointer",
    position: "relative",
    top: -20,
    left: 0,
    marginTop: 0,
    height: 25,
    width: 80,
    fontWeight: 700,
    color: "#fff",
    padding: "0px 20px",
    borderRadius: 10,
    transition: "background-color 0.3s",
  };

  const menu = (
    <div style={{ padding: 8 }}>
      <AntdInput
        allowClear
        placeholder="Tìm kiếm tên khách hàng"
        value={searchText}
        prefix={<SearchOutlined className="!text-cyan-500 !text-xs sm:!text-sm" />}  // Biểu tượng search
        onChange={(e) => handleSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      {filteredItems &&
        <Menu
          items={filteredItems?.map(el => ({
            key: el.id,
            label: el.name,
          }))}
          onClick={onMenuClick}
          style={{ maxHeight: '50vh', overflowY: "auto" }}
        />}
    </div>
  );

  return (

    <div className="flex items-center">
      <Dropdown overlay={menu} trigger={["click"]}>
        <div
          className="flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110"
          title="Chat Groups"
          style={{ width: 44, height: 44 }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08C22 16.03 17.52 20.08 12 20.08C10.74 20.08 9.54 19.86 8.44 19.46L3.31 21.05C3.01 21.14 2.7 20.84 2.79 20.54L4.35 15.54C3.12 14.28 2 12.76 2 11.08C2 6.13 6.48 2.08 12 2.08C17.52 2.08 22 6.13 22 11.08Z" fill="#00B4B6" />
            <circle cx="7.5" cy="11.5" r="1.5" fill="#FFFFFF" />
            <circle cx="12" cy="11.5" r="1.5" fill="#FFFFFF" />
            <circle cx="16.5" cy="11.5" r="1.5" fill="#FFFFFF" />
          </svg>
        </div>
      </Dropdown>

      {/* Model popup */}
      <Modal open={modalVisible} onOk={handleOk} onCancel={handleOk} footer={null}
        title={`${workspaceEl?.name}`}
        okText="OK" cancelButtonProps={{ style: { display: "none" } }}
        style={{ padding: 0, minWidth: '96vw', minHeight: '82vh', top: 60 }}
      >
        <Group />
      </Modal>
    </div>

  );
};

export default ChatGroupList;