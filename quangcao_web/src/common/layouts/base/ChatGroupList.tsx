import React,  { useEffect, useState, useRef, useContext } from "react";
import { Dropdown, Avatar, Modal, notification } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useApiHost } from "../../hooks/useApiHost";
import type { MenuProps } from "antd/lib";
import Group from '../../../components/chat/pages/dashboard/Group.tsx';
// import type { WorkSpace } from "../../../@types/chat.type.ts";
import type { MenuInfo } from 'rc-menu/lib/interface';
import { useUser } from "../../hooks/useUser.tsx";
import {Button, Input} from "@mui/material";
import {Box, Stack} from "@mui/material";
import { UpdateButtonContext } from "../../hooks/useUpdateButtonTask.tsx";
import type { WorkSpace } from "../../../@types/work-space.type.ts";
import { SearchOutlined } from "@ant-design/icons";
import { Input as AntdInput, Menu } from "antd";

interface ChatGroupListProps {
  workSpaces?: WorkSpace[];
}

const ChatGroupList: React.FC<ChatGroupListProps> = ({workSpaces}) => {
  const [chatGroupList, setChatGroupList] = useState<WorkSpace[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<WorkSpace | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState<WorkSpace[]>([]); // items là danh sách menu gốc
  
  //@ts-ignore
  const {userId, userRoleId} = useUser();

  


  const [addGroupModalVisible, setAddGroupModalVisible] = useState(false);

  useEffect(() => {
    setFilteredItems(chatGroupList); // Khởi tạo danh sách đầy đủ khi component load
  }, [chatGroupList]);


  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value) {
      // Nếu input rỗng, hiện hết danh sách gốc
      setFilteredItems(chatGroupList);
    } else {
      const filtered = chatGroupList.filter((el) =>
        el.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const handleAddGroupOk = async (name: string) => {
    // gọi API POST /group với tên group = name
    setAddGroupModalVisible(false);
  };
  
  useEffect(() => {
    setChatGroupList(workSpaces);
  }, [workSpaces]);
  

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
    color: "#777",
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
              width: 120,
              height: 25,
              top: 2,
              position: "relative",
              borderRadius: 10,
              backgroundColor: isHover ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
              transition: "background-color 1s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            <span style={spanStyle}>CHAT</span>
          </Box>
        </Dropdown>

        <Button sx={{color:"#fff", whiteSpace:'nowrap'}}
          onClick={() => setAddGroupModalVisible(true)}>Tạo Nhóm</Button>
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
    if(!groupName || !address || groupName === '' || address === '')
    {
      notification.error({message:"Vui lòng nhập tên và địa chỉ !", description:""})
      return;
    }

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
        placeholder="Nhập tên nhóm"
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
