import type { IPage } from "../../../@types/common.type";
import { useState, useEffect } from "react";
import type { PaginationDto } from "../../../@types/common.type";
import { useMaterialQuery } from "../../../common/hooks/material.hook";
import type { Material } from "../../../@types/material.type";
import FormMaterial from "../../../components/dashboard/material/FormMaterial";
import ButtonComponent from "../../../components/Button";
import TableComponent from "../../../components/table/TableComponent";
import { EditOutlined } from "@ant-design/icons";
import { columnsMaterial } from "../../../common/data";
import { useDebounce } from "../../../common/hooks/useDebounce";

export const MaterialDashboard: IPage["Component"] = () => {
  const [config, setConfig] = useState({
    openCreate: false,
    openUpdate: false,
  });
  const [query, setQuery] = useState<Partial<PaginationDto>>({
    page: 1,
    limit: 10,
    search: "",
  });

  // Debounce search value
  const debouncedSearch = useDebounce(query.search, 500);

  const {
    data: materials,
    isLoading: isLoadingMaterials,
    refetch,
  } = useMaterialQuery({ ...query, search: debouncedSearch });

  const [material, setMaterial] = useState<Material | null>(null);

  const toggle = (key: keyof typeof config) => {
    return () => {
      setConfig({ ...config, [key]: !config[key] });
    };
  };

  const handleCloseModal = (key: keyof typeof config) => {
    return () => {
      setConfig({ ...config, [key]: false });
      // Reset material state khi đóng modal update
      if (key === "openUpdate") {
        setMaterial(null);
      }
    };
  };

  // Handle search
  const handleSearch = (searchValue: string) => {
    setQuery({ ...query, search: searchValue, page: 1 });
  };

  // Reset material state khi chuyển từ update sang create
  useEffect(() => {
    if (config.openCreate && material) {
      setMaterial(null);
    }
  }, [config.openCreate, material]);

  return (
    <div className="min-h-screen p-2 w-full">
      <ButtonComponent
        toggle={toggle("openCreate")}
        refetch={refetch}
        title="Thêm vật liệu"
        onSearch={handleSearch}
      />
      <TableComponent<Material>
        columns={columnsMaterial}
        dataSource={materials?.data}
        loading={isLoadingMaterials}
        rowSelection={{
          type: "radio",
          columnWidth: 100,
          renderCell: (_, record) => {
            return (
              <EditOutlined
                className="!text-cyan-600 !cursor-pointer !text-xl"
                onClick={() => {
                  setMaterial(record);
                  toggle("openUpdate")();
                }}
              />
            );
          },
        }}
        pagination={{
          pageSize: query.limit,
          current: query.page,
          total: (materials as any)?.total || 0,
          onChange: (page, pageSize) => {
            setQuery({ ...query, page, limit: pageSize });
          },
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} vật liệu`,
          style: {
            paddingRight: "15px",
          },
          locale: { items_per_page: "/ Trang" }, // 🔹 Đổi chữ "page" thành "trang"
        }}
      />
      <FormMaterial
        open={config.openCreate}
        onCancel={handleCloseModal("openCreate")}
        buttonText="Tạo"
        onRefresh={() => refetch()}
      />
      <FormMaterial
        open={config.openUpdate}
        onCancel={handleCloseModal("openUpdate")}
        material={material as Material}
        buttonText="Sửa"
        onRefresh={() => refetch()}
      />
    </div>
  );
};
