import type { IPage } from "../../../@types/common.type";
import { useEffect, useState } from "react";
import type { PaginationDto } from "../../../@types/common.type";
import { useSupplierQuery } from "../../../common/hooks/supplier.hook";
import type { User } from "../../../@types/user.type";
import FormUser from "../../../components/dashboard/user/FormUser";
import ButtonComponent from "../../../components/Button";
import TableComponent from "../../../components/table/TableComponent";
import { EditOutlined } from "@ant-design/icons";
import { columnsUser } from "../../../common/data";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { useUser } from "../../../common/hooks/useUser";
import { QRColumn } from "../workpoints/WorkDays";
import type { WorkDaysProps } from "../../../@types/workpoint";
import UnPermissionBoard from "../unPermissionBoard";

const SupplierDashboard: IPage["Component"] = () => {
  const {userLeadId, canViewPermission} = useUser();
  const [config, setConfig] = useState({
    openCreate: false,
    openUpdate: false,
  });
  const [query, setQuery] = useState<Partial<PaginationDto>>({
    page: 1,
    limit: 10,
    lead: userLeadId,
    search: "",
  });
  const [isRefetching, setIsRefetching] = useState(false);

  // Debounce search value
  const debouncedSearch = useDebounce(query.search, 500);

  const {data: users,isLoading: isLoadingUsers,refetch,
  } = useSupplierQuery({ ...query, search: debouncedSearch });
  const supplierRows = Array.isArray((users as any)?.data?.data)
    ? (users as any).data.data
    : Array.isArray((users as any)?.data)
      ? (users as any).data
      : [];
  const supplierTotal = Number((users as any)?.data?.total ?? (users as any)?.total ?? supplierRows.length);

  // useEffect(()=>{
  //   console.log('users', users);
  // },[users]);

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await refetch();
    } finally {
      // Thêm delay nhỏ để người dùng thấy hiệu ứng
      setTimeout(() => {
        setIsRefetching(false);
      }, 500);
    }
  };

  const [user, setUser] = useState<User | null>(null);

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig({ ...config, [key]: !config[key] });
    };
  };

  // Handle search
  const handleSearch = (searchValue: string) => {
    setQuery({ ...query, search: searchValue, page: 1 });
  };

  return canViewPermission?.view_supplier ?  (
    <>
    
    <div className="min-h-screen p-2 w-full">
      <ButtonComponent
        toggle={toggle("openCreate")}
        refetch={handleRefetch}
        title="Thêm thầu phụ"
        loading={isRefetching}
        onSearch={handleSearch}
      />
      <TableComponent<User>
        columns={columnsUser}
        dataSource={supplierRows}
        loading={isLoadingUsers}
        rowSelection={{
          type: "radio",
          columnWidth: 100,
          renderCell: (_, record) => {
          const item:WorkDaysProps = {
            salary: 0,
              items: [],
              leaves: [],
              user_id: record.id,
              username: record?.fullName ?? '',
              userrole: "supplier"
          }

            return (
              <>
              <EditOutlined
                className="!text-cyan-600 !cursor-pointer !text-xl"
                onClick={() => {
                  setUser(record);
                  toggle("openUpdate")();
                }}
              />

              <QRColumn record = {item}/>
              </>
            );
          },
        }}

        
        pagination={{
          pageSize: query.limit,
          current: query.page,
          total: supplierTotal,
          onChange: (page, pageSize) => {
            setQuery({ ...query, page, limit: pageSize });
          },
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} nhân sự`,
          style: {
            paddingRight: "15px",
          },
          locale: { items_per_page: "/ Trang" },
        }}
      />
      {/* Modal thêm mới */}
      {config.openCreate && (
        <div className="fixed inset-0 z-[50] flex justify-center items-center bg-black/30 px-2 overflow-y-auto min-h-screen py-6 hide-scrollbar">
          <style>{`
            .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="w-full">
            <FormUser
              isAppend={true}
              onCancel={toggle("openCreate")}
              onRefresh={() => {
                // TODO: Implement create user
                toggle("openCreate")();
                handleRefetch();
              }}
              isSupplier={true}
            />
          </div>
        </div>
      )}
      {/* Modal sửa */}
      {config.openUpdate && user && (
        <div className="fixed inset-0 z-[50] flex justify-center items-center bg-black/30 px-2 overflow-y-auto min-h-screen py-6 hide-scrollbar">
          <style>{`
            .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="w-full">
            <FormUser
              isAppend={false}
              onCancel={toggle("openUpdate")}
              onRefresh={() => {
                // TODO: Implement update user
                toggle("openUpdate")();
                handleRefetch();
              }}
              user={user as User}
              isSupplier={true}
            />
          </div>
        </div>
      )}
    </div>  
    </>
  ):  <UnPermissionBoard/>;
};

export const loader = async () => {
  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { userId: 1, name: "John Doe" };
};

export default SupplierDashboard;
