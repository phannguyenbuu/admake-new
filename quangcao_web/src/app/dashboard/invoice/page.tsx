import { useState, useMemo, useCallback } from "react";
import type { IPage, PaginationDto } from "../../../@types/common.type";
import {
  Collapse,
  Input,
  Button,
  DatePicker,
  message,
  InputNumber,
  Spin,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  useMaterialQuery,
  useUpdateMaterial,
} from "../../../common/hooks/material.hook";
import { MaterialSection } from "../../../components/dashboard/invoice/MaterialSection";
import { UserSection } from "../../../components/dashboard/invoice/UserSection";
import type { Material } from "../../../@types/material.type";
import { useQuote } from "../../../common/hooks/quote.hook";

export const InvoiceDashboard: IPage["Component"] = () => {
  const query: Partial<PaginationDto> = {
    page: 1,
    limit: 100,
    search: "",
  };
  const { data: materials, refetch: refetchMaterials } =
    useMaterialQuery(query);

  const { mutate: updateMaterial } = useUpdateMaterial();

  const { mutate: quote } = useQuote();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Material[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [coefficient, setCoefficient] = useState<number>(10);
  const [date, setDate] = useState<{
    startDate: Dayjs | null;
    endDate: Dayjs | null;
  }>({
    startDate: null,
    endDate: null,
  });

  // Tính số ngày công dự tính
  const totalDays = useMemo(() => {
    if (!date.startDate || !date.endDate) return 0;
    const days = date.endDate.diff(date.startDate, "day") + 1;
    return Math.max(0, days);
  }, [date.startDate, date.endDate]);

  // Thêm/xóa vật liệu
  const handleCheck = useCallback((checked: boolean, material: Material) => {
    setSelected((prev) =>
      checked ? [...prev, material] : prev.filter((v) => v.id !== material.id)
    );
  }, []);

  // Xóa vật liệu khỏi danh sách đã chọn
  const handleRemove = useCallback((material: string) => {
    setSelected((prev) => prev.filter((v) => v.id !== material));
  }, []);

  // Đổi số lượng
  const handleQuantity = useCallback(
    (material: string, value: number | null) => {
      setQuantities((prev) => ({ ...prev, [material]: value || 1 }));
    },
    []
  );

  // Thêm/xóa nhân sự
  const handleUserCheck = useCallback((checked: boolean, userId: string) => {
    setSelectedUsers((prev) =>
      checked ? [...prev, userId] : prev.filter((v) => v !== userId)
    );
  }, []);

  // Xóa nhân sự khỏi danh sách đã chọn
  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((v) => v !== userId));
  }, []);

  // Validation cho form
  const isFormValid = useMemo(() => {
    return (
      selected.length > 0 &&
      selectedUsers.length > 0 &&
      date.startDate &&
      date.endDate
    );
  }, [selected.length, selectedUsers.length, date.startDate, date.endDate]);

  // Xử lý bấm nút báo giá
  const handleBaoGia = useCallback(() => {
    if (!isFormValid) {
      const errors = [];
      if (selected.length === 0) errors.push("vật liệu");
      if (selectedUsers.length === 0) errors.push("nhân sự");
      if (!date.startDate || !date.endDate) errors.push("thời gian thi công");

      message.warning(`Vui lòng chọn ${errors.join(", ")}!`);
      return;
    }
    // setIsConfirmModalVisible(true);
  }, [
    isFormValid,
    selected.length,
    selectedUsers.length,
    date.startDate,
    date.endDate,
  ]);

  // Xử lý xác nhận báo giá
  const handleConfirmBaoGia = useCallback(async () => {
    if (!selected?.length) {
      message.warning("Vui lòng chọn vật liệu!");
      return;
    }
    if (!selectedUsers?.length) {
      message.warning("Vui lòng chọn nhân sự!");
      return;
    }
    if (!date.startDate || !date.endDate) {
      message.warning("Vui lòng chọn thời gian thi công!");
      return;
    }

    try {
      setLoading(true);
      // 1) Tạo quote TRƯỚC
      const payload = {
        staff_ids: selectedUsers,
        materials: selected.map((material) => ({
          id: material.id,
          quantity: quantities[material.id] || 1,
        })),
        totalDay: totalDays,
        coefficient: coefficient,
      };

      quote(payload, {
        onSuccess: () => {
          message.success("Báo giá đã được tạo thành công!");
          setSelected([]);
          setSelectedUsers([]);
          setQuantities({});
          setDate({ startDate: null, endDate: null });
          refetchMaterials();
          setLoading(false);
        },
        onError: () => {
          message.error("Lỗi tạo báo giá!");
        },
      });

      // 2) Sau khi quote thành công → cập nhật tồn kho
      const updatePromises = selected.map((material) => {
        const materialData = materials?.data?.find(
          (m: Material) => m.id === material.id
        );
        if (!materialData) return Promise.resolve();

        const selectedQty = Math.max(0, quantities[materialData._id] || 1);
        const newQuantity = Math.max(
          0,
          (materialData.quantity || 0) - selectedQty
        );

        const formData = new FormData();
        formData.append("quantity", String(newQuantity));
        formData.append("name", material.name);
        formData.append("unit", material.unit);
        formData.append("price", String(material.price || 0));
        formData.append("description", material.description || "");
        formData.append("supplier", material.supplier || "");

        return new Promise<void>((resolve) => {
          updateMaterial(
            { dto: formData, id: materialData._id },
            {
              onError: () => {
                message.error(`Lỗi cập nhật số lượng ${material.name}!`);
                resolve(); // không reject để không chặn các item khác
              },
            }
          );
        });
      });

      await Promise.all(updatePromises);
    } catch (err) {
      message.error("Lỗi báo giá!");
    }
  }, [
    selected,
    selectedUsers,
    date.startDate,
    date.endDate,
    totalDays,
    quantities,
    materials?.data,
    updateMaterial,
    quote,
    refetchMaterials,
  ]);

  // Tính tổng giá trị vật liệu đã chọn
  const totalMaterialsCost = useMemo(() => {
    return selected.reduce((sum, material) => {
      const materialData = materials?.data?.find(
        (m: Material) => m.id === material.id
      );
      const selectedQuantity = quantities[material.id] || 1;
      const availableQuantity = materialData?.quantity || 0;
      const actualQuantity = Math.min(selectedQuantity, availableQuantity);
      return sum + (materialData?.price || 0) * actualQuantity;
    }, 0);
  }, [selected, materials?.data, quantities]);

  return (
    <div
      className="min-h-screen p-4 w-full"
      style={{ backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
          <Spin size="large" tip="Đang xử lý..." />
        </div>
      )}{" "}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cột trái: Vật liệu + Nhân sự */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Vật liệu */}
          <div className="shadow-lg drop-shadow-md">
            <MaterialSection
              selected={selected}
              quantities={quantities}
              onCheck={handleCheck}
              onRemove={handleRemove}
              onQuantityChange={handleQuantity}
            />
          </div>
          {/* Nhân sự */}
          <div className="shadow-lg drop-shadow-md">
            <UserSection
              selectedUsers={selectedUsers}
              onUserCheck={handleUserCheck}
              onRemoveUser={handleRemoveUser}
            />
          </div>
        </div>
        {/* Cột phải: Thời gian, nút báo giá, tổng */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Thời gian */}
          <div className="bg-white rounded-xl shadow-lg drop-shadow-md p-0">
            <Collapse
              defaultActiveKey={["1"]}
              bordered={false}
              className="!bg-white !rounded-xl !shadow-none"
            >
              <Collapse.Panel
                header={<b>Thời gian</b>}
                key="1"
                className="!bg-white !rounded-xl !shadow-none"
              >
                <div className="bg-white rounded-xl px-4 pb-4">
                  <div className="mb-2 font-semibold">
                    Chọn thời gian thi công:
                  </div>
                  <div className="flex gap-4 items-center">
                    <DatePicker
                      placeholder="Ngày khởi công"
                      value={date.startDate}
                      onChange={(newStartDate) => {
                        setDate((prev) => ({
                          startDate: newStartDate,
                          endDate:
                            prev.endDate &&
                            newStartDate &&
                            newStartDate.isAfter(prev.endDate)
                              ? null
                              : prev.endDate,
                        }));
                      }}
                      className="!text-base"
                    />
                    <DatePicker
                      placeholder="Ngày bàn giao"
                      value={date.endDate}
                      onChange={(newEndDate) => {
                        setDate((prev) => ({
                          ...prev,
                          endDate: newEndDate,
                        }));
                      }}
                      disabled={!date.startDate}
                      disabledDate={(current) => {
                        // Không cho phép chọn ngày trước ngày bắt đầu
                        return date.startDate
                          ? current &&
                              current < dayjs(date.startDate).startOf("day")
                          : false;
                      }}
                      className="!text-base"
                    />
                    <span className="!text-base !text-cyan-600 font-semibold ml-2">
                      {totalDays > 0 ? `${totalDays} ngày` : ""}
                    </span>
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>
          </div>
          <div className="bg-white rounded-xl shadow-lg drop-shadow-md p-0">
            <Collapse
              defaultActiveKey={["1"]}
              bordered={false}
              className="!bg-white !rounded-xl !shadow-none"
            >
              <Collapse.Panel
                header={<b>Hệ số</b>}
                key="1"
                className="!bg-white !rounded-xl !shadow-none"
              >
                <div className="bg-white rounded-xl px-4 pb-4">
                  <div className="mb-2 font-semibold">Chọn hệ số:</div>
                  <div className="flex gap-4 items-center">
                    <InputNumber
                      placeholder="Hệ số"
                      value={coefficient}
                      onChange={(value) => {
                        setCoefficient(value || 10);
                      }}
                      className="!text-base"
                    />
                    <span className="!text-base !text-cyan-600 font-semibold ml-2">
                      {coefficient > 0 ? `${coefficient}%` : ""}
                    </span>
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>
          </div>
          {/* Nút báo giá và tổng */}
          <div className="bg-white rounded-xl shadow-lg drop-shadow-md p-4 flex flex-col items-center">
            <Button
              type="primary"
              className="!text-base !shadow-md !drop-shadow-md mb-4 !bg-[#00B4B6] !font-semibold !w-full"
              onClick={() => {
                handleBaoGia();
                handleConfirmBaoGia();
              }}
              disabled={!isFormValid}
            >
              Báo giá
            </Button>
            <div className="w-full">
              <div className="text-cyan-600 font-semibold mb-1">
                Tổng giá vật liệu:
              </div>
              <Input
                value={totalMaterialsCost.toLocaleString("vi-VN")}
                readOnly
                className="!text-base"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Modal xác nhận báo giá */}
      {/* <ConfirmInvoiceModal
        isVisible={isConfirmModalVisible}
        onConfirm={handleConfirmBaoGia}
        onCancel={handleCancelBaoGia}
        confirmLoading={loading}
        materials={materials?.data || []}
        selectedMaterials={selected}
        quantities={quantities}
        users={users?.data || []}
        selectedUsers={selectedUsers}
        date={date}
        totalDays={totalDays}
        totalMaterialsCost={totalMaterialsCost}
        coefficient={coefficient}
      /> */}
    </div>
  );
};
export const loader = async () => {
  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { userId: 1, name: "John Doe" };
};
