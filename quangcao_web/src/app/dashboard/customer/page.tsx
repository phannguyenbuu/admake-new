import { useState, useEffect } from "react";
import type { IPage, PaginationDto } from "../../../@types/common.type";
import type { Customer } from "../../../@types/customer.type";
import { useCustomerQuery } from "../../../common/hooks/customer.hook";
import ButtonComponent from "../../../components/Button";
import TableComponent from "../../../components/table/TableComponent";
import { EditOutlined } from "@ant-design/icons";
import { columnsCustomer } from "../../../common/data";
import FormCustomer from "../../../components/dashboard/customer-managerment/FormCustomer";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { notification } from "antd";
import { useApiHost } from "../../../common/hooks/useApiHost";
import type { WorkSpace } from "../../../@types/work-space.type";
import { useUser } from "../../../common/hooks/useUser";

export const CustomerDashboard: IPage["Component"] = () => {
  const {userLeadId} = useUser();
  const [query, setQuery] = useState<Partial<PaginationDto>>({
    page: 1,
    limit: 10,
    lead:userLeadId,
    search: "",
  });
  const [config, setConfig] = useState({
    openCreate: false,
    openUpdate: false,
  });

  // Debounce search value
  const debouncedSearch = useDebounce(query.search, 500);

  const {
    data: customers,
    isLoading,
    refetch,
    error,
  } = useCustomerQuery({ ...query, search: debouncedSearch });

  useEffect(() => {
    if (customers) {
      console.log("Received new data:", customers);
    }
  }, [customers]);

  useEffect(() => {
  if (error) {
    console.error("Error fetching customers:", error);
  }
}, [error]);
  

  const [customer, setCustomer] = useState<WorkSpace | null>(null);

  useEffect(() => {
    
      console.log("Current customer:", customer);
    
  }, [customer]);

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig({ ...config, [key]: !config[key] });
    };
  };

  // Handle search
  const handleSearch = (searchValue: string) => {
    setQuery({ ...query, search: searchValue, page: 1 });
  };


const handleDeleteCustomer = () => {
    if (!customer || !customer.owner_id) return;

    fetch(`${useApiHost()}/workspace/${customer.id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          notification.error({message:`Không xóa được khách hàng`});
        }
        return response.json();
      })
      .then(() => {
        notification.success({message:`Xóa khách hàng ${customer.name} thành công`});
        refetch();
      })
      .catch((error) => {
        notification.error({message:`Delete error: ${error}`});
      });
  }



  return (
    <div className="min-h-screen p-2 w-full">
      <ButtonComponent
        toggle={toggle("openCreate")}
        refetch={refetch}
        title="Thêm khách hàng"
        onSearch={handleSearch}
      />
      <TableComponent<WorkSpace>
        columns={columnsCustomer}
        dataSource={customers?.data}
        loading={isLoading}
        rowSelection={{
          type: "radio",
          columnWidth: 100,
          renderCell: (_, record) => {
            return (
              <>
                <EditOutlined
                  className="!text-cyan-600 !cursor-pointer !text-xl"
                  onClick={() => {
                    console.log('CRecord', record);
                    setCustomer(record);
                    toggle("openUpdate")();
                  }}
                />
              </>
            );
          },
        }}
        pagination={{
          pageSize: query.limit,
          current: query.page,
          total: (customers as any)?.total || 0,
          onChange: (page, pageSize) => {
            setQuery({ ...query, page, limit: pageSize });
          },
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} khách hàng`,
          style: {
            paddingRight: "15px",
          },
          locale: { items_per_page: "/ Trang" },
        }}
      />
      <FormCustomer
        // onDelete={null}
        onCancel={toggle("openCreate")}
        open={config.openCreate}
        onRefresh={refetch}
      />
      <FormCustomer
        onDelete={handleDeleteCustomer}
        onCancel={toggle("openUpdate")}
        open={config.openUpdate}
        initialValues={customer as WorkSpace}
        onRefresh={refetch}
      />
    </div>
  );
};

export const loader = async () => {
  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { userId: 1, name: "John Doe" };
};
