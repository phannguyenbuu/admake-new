import type { IPage } from "../../@types/common.type";
import { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Input, message, notification } from "antd";
import { useUser } from "../../common/hooks/useUser";
import { useApiHost } from "../../common/hooks/useApiHost";
import { Typography, Stack, IconButton, Box, TextField, Switch } from "@mui/material";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { useUserQuery } from "../../common/hooks/user.hook";
import type { PaginationDto } from "../../@types/common.type";
import type { User } from "../../@types/user.type";
import axios from "axios";
import { useDebounce } from "../../common/hooks/useDebounce";
import AddIcon from "@mui/icons-material/Add";
import UserCanViewForm from "./UserCanView";
import type {UserCanViewFormProps} from "./UserCanView";

export const InforDashboard: IPage["Component"] = () => {
  const {userId, username, userRole, userLeadId, fullName, setFullName} = useUser();
  const [query, setQuery] = useState<Partial<PaginationDto>>({
      page: 1,
      limit: 1000,
      lead: userLeadId,
      search: "",
    });
  // const [isRefetching, setIsRefetching] = useState(false);

  const [filterdUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredUsersCanView, setFilteredUsersCanView] = useState<UserCanViewFormProps[]>([]);
  
    // Debounce search value
  const debouncedSearch = useDebounce(query.search, 500);
  const {data: users,isLoading: isLoadingUsers,refetch,
    } = useUserQuery({ ...query, search: debouncedSearch });

  const [form] = Form.useForm();
  const [config, setConfig] = useState({
    openEdit: false,
  });

  
  useEffect(() => {
      // Gán sự kiện hoặc thực hiện tác vụ khi component active
      console.log("InforDashboard active");
      // Ví dụ gọi API, cập nhật state, tạo event listener, ...
      refetch();
      // Nếu có event listener hoặc side-effect cần cleanup:
      return () => {
        console.log("InforDashboard unmount");
        // Cleanup event listener hoặc tác vụ khác
      };
    }, []);


    useEffect(() => {
      async function fetchAllUsersCanView() {
        try {
          const response = await axios.get<{data:UserCanViewFormProps[]}>(`${useApiHost()}/user/${userId}/can-view-all`);
          const users_can_view = response.data;
          console.log('users_can_view',users_can_view);
          setFilteredUsersCanView(users_can_view.data);
        } catch (error) {
          notification.error({message:'Error fetching users can view'});
        }
      }

      fetchAllUsersCanView();
    }, []);


    useEffect(() => {
      async function fetchUsers() {
        try {
          const response = await axios.get<{data:User[]}>(`${useApiHost()}/user/`, {
            params: {
              page: 1,
              limit: 1000,
              lead: userLeadId,
              search: "",
            },
          });
          const users = response.data.data;
          setFilteredUsers(users.filter(u => u.role_id > 0 && u.role_id < 100));
          notification.success({message:'Get users done!'});
        } catch (error) {
          notification.error({message:'Error fetching users', 
            description: error instanceof Error ? error.message : String(error)});
        }
      }

      fetchUsers();
    }, []);

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    };
  };

  const onFinish = async (values: any) => {
    console.log("Form values", values);

    try {
      const response = await fetch(`${useApiHost()}/user/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        notification.error({message:"Lỗi server:", description:data.description});
        // message.error(data.description || "Cập nhật thất bại");
        return;
      }

      setFullName(values.fullName);
      message.success("Cập nhật thông tin thành công");
      setConfig((prev) => ({ ...prev, openEdit: false }));
    } catch (error) {
      console.error("Fetch error:", error);
      message.error("Lỗi server");
    }
  };


  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error("Vui lòng nhập mật khẩu"));
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(value)) {
      return Promise.reject(
        new Error(
          "Mật khẩu phải gồm ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
        )
      );
    }
    return Promise.resolve();
  };

  const fetchApiPostUserCanView = async () => {
    try {
      const response = await fetch(`${useApiHost()}/user/${userId}/can-view`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });

      if (!response.ok) throw new Error('Update failed');

      const data = await response.json();
      // console.log("DATA", data);
      setFilteredUsersCanView(prev => [...prev, data.data]);

      notification.success({ message: 'Tạo quyền xem mới thành công' });
    } catch (error) {
      notification.error({ message: 'Lỗi khi tạo quyền xem' });
    }
  };

  return (
    <>
    <div className="py-3 lg:pt-20 w-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" />

      <div className="w-full max-w-2xl mx-auto relative z-10 px-2">
        {/* Single Card Container */}
        <Card
          className="!shadow-2xl !border-0 !backdrop-blur-xl !rounded-2xl"
          bodyStyle={{ padding: "0" }}
        >
          {/* Header với Avatar */}
          
          <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center relative">
              {/* User Info */}
              <div className="text-center text-white">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-1 drop-shadow-lg">
                  {fullName}
                </h2>
                <p className="text-sm sm:text-base text-cyan-200 drop-shadow-md">
                  {userRole?.name}
                </p>
              </div>

              <Button type="default" onClick={toggle("openEdit")} className="mt-4">
                THAY ĐỔI THÔNG TIN
              </Button>
            </div>
          </div>

          
            <IconButton color="primary" component="span"
              onClick={fetchApiPostUserCanView}
              aria-label="upload picture" size="small"
              sx={{ border: "1px dashed #3f51b5", width: 40, height: 40,}} >
          
              <AddIcon />
              
            </IconButton>

            {filteredUsersCanView.map((el, idx) => 
              <Typography>
                {idx + 1}
              </Typography>
              // <UserCanViewForm key={el.id} {...el} />
              )}

        </Card>
      </div>


      
    </div>

    <Modal
        title="Thay đổi thông tin cá nhân"
        open={config.openEdit}
        onCancel={toggle("openEdit")}
        footer={null}
        // destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} preserve={false}>
          <Form.Item label="Tên" name="fullName" rules={[{ required: false, message: "Vui lòng nhập tên" }]}>
            <Input placeholder="Tên của bạn" defaultValue={fullName ?? ''} />
          </Form.Item>

          <OldPasswordInput userId={userId ?? ''}/>

          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[{ validator: validatePassword }]}
            hasFeedback
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>

  );
};

export const loader = async () => {
  return null;
};


const OldPasswordInput = ({ userId }: { userId: string }) => {
  const [valid, setValid] = useState(true);

  const checkOldPassword = async (e: React.FocusEvent<HTMLInputElement>) => {
    const oldPassword = e.target.value;
    if (!oldPassword) return;

    try {
      const res = await fetch(`${useApiHost()}/user/${userId}/check-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPassword }),
      });
      const data = await res.json();
      console.log('message',data);
      if (data.message = "right password") {
        setValid(true);
        notification.success({message:"Mật khẩu cũ đúng"});
      } else {
        setValid(false);
        notification.error({message:"Mật khẩu cũ không đúng"});
      }
    } catch (error) {
      notification.error({message:"Mật khẩu cũ không đúng"});
    }
  };

  return (
    <Form.Item
      name="old_password"
      label="Mật khẩu cũ"
      validateStatus={valid ? "" : "error"}
      help={valid ? "" : "Mật khẩu cũ không đúng"}
      rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
    >
      <Input.Password onBlur={checkOldPassword} />
    </Form.Item>
  );
};


