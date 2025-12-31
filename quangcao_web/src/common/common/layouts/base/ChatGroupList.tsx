import React,  { useEffect, useState, useRef, useContext } from "react";
import { Dropdown, Avatar, Modal, notification } from "antd";
import { UserOutlined } from "@ant-design/icons";

import { useApiHost } from "../../hooks/useApiHost.ts";
import type { MenuProps } from "antd/lib";
import Group from '../../../components/chat/pages/dashboard/Group.tsx';
// import type { WorkSpace } from "../../../@types/chat.type.ts";
import type { MenuInfo } from 'rc-menu/lib/interface';
import { useUser } from "../../hooks/useUser.tsx";
import {Button, Input} from "@mui/material";
import {Box, Stack} from "@mui/material";

import type { WorkSpace } from "../../../@types/work-space.type.ts";
import { ChatGroupProvider } from "../../../components/chat/ProviderChat.tsx";
import { SearchOutlined } from "@ant-design/icons";
import { Input as AntdInput, Menu } from "antd";
import { useChatGroup } from "../../../components/chat/ProviderChat.tsx";
import { useWorkSpaceQueryTaskById } from "../../hooks/work-space.hook.tsx";

const ChatGroupList = () => {
  const {workspaceEl, setWorkspaceEl} = useChatGroup();
  const [modalVisible, setModalVisible] = useState(false);
  // const [selectedId, setSelectedId] = useState<WorkSpace | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState<WorkSpace[]>([]); // items là danh sách menu gốc
  const { refetch } = useWorkSpaceQueryTaskById(workspaceEl?.id ?? '');
  //@ts-ignore
  const {userId, userRoleId, workspaces, isMobile} = useUser();

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
      <Stack
        direction="row"
        spacing={2}
        px={0.5}
        sx={{ backgroundColor: "#00B4B6", maxHeight: 30, borderRadius: 5 }}
      >
        <Dropdown overlay={menu} trigger={["click"]}>
          <Box
            sx={{
              width: 100,
              height: 25,
              top: 2,
              position: "relative",
              borderRadius: 10,
              backgroundColor: isHover ? "rgba(255,255,255,0.5)" : "none",
              transition: "background-color 1s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 12
            }}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            
              <span style={spanStyle}>CHAT</span>
            
          </Box>
        </Dropdown>
       </Stack>

      {/* Model popup */}
      <Modal open={modalVisible} onOk={handleOk} onCancel={handleOk} footer={null}
        title={`${workspaceEl?.name}`}
        okText="OK" cancelButtonProps={{ style: { display: "none" } }}
        style={{ padding:0, minWidth: '96vw', minHeight:'82vh', top:60}}
        >
        <Group/>
      </Modal>
    </div>
    
  );
};

export default ChatGroupList;