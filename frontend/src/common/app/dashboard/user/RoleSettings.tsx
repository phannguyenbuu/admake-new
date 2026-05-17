import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Space, Input, Popconfirm, notification } from "antd";
import { SettingOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { RoleService } from "../../../services/role.service";
import type { Role } from "../../../@types/role.type";
import { useUser } from "../../../common/hooks/useUser";

export default function RoleSettings() {
    const { userLeadId } = useUser();
    const [open, setOpen] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");

    const fetchRoles = async () => {
        if (!userLeadId) return;
        setLoading(true);
        try {
            const { data } = await RoleService.getAll(userLeadId);
            setRoles(data || []);
        } catch (e) {
            console.error(e);
            notification.error({ message: "Không thể lấy danh sách chức danh" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && userLeadId) {
            fetchRoles();
            setEditingId(null);
            setIsAdding(false);
            setNewName("");
        }
    }, [open]);

    const handleSaveEdit = async (id: string) => {
        if (!editName.trim()) {
            notification.warning({ message: "Tên chức danh không được để trống" });
            return;
        }
        const targetRole = roles.find((r) => r.id === id);
        if (!targetRole) return;

        try {
            setLoading(true);
            await RoleService.update(Number(id), { ...targetRole, name: editName.trim() });
            notification.success({ message: "Đã cập nhật chức danh" });
            setEditingId(null);
            await fetchRoles();
        } catch (e: any) {
            notification.error({ message: e?.response?.data?.error || "Cập nhật thất bại" });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) {
            notification.warning({ message: "Tên chức danh không được để trống" });
            return;
        }
        try {
            setLoading(true);
            await RoleService.create({ name: newName.trim(), permissions: [], lead_id: Number(userLeadId) } as any);
            notification.success({ message: "Đã thêm mới chức danh" });
            setIsAdding(false);
            setNewName("");
            await fetchRoles();
        } catch (e: any) {
            notification.error({ message: e?.response?.data?.error || "Thêm mới thất bại" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            await RoleService.delete(Number(id));
            notification.success({ message: "Đã xóa chức danh" });
            await fetchRoles();
        } catch (e: any) {
            notification.error({ message: e?.response?.data?.error || "Xóa thất bại" });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Chức vụ (Role)",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: Role) => {
                if (editingId === record.id) {
                    return (
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onPressEnter={() => handleSaveEdit(record.id!)}
                            autoFocus
                        />
                    );
                }
                return <span className="font-medium text-slate-700">{text}</span>;
            },
        },
        {
            title: "Hành động",
            key: "action",
            width: 150,
            render: (_: any, record: Role) => {
                if (editingId === record.id) {
                    return (
                        <Space>
                            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={() => handleSaveEdit(record.id!)} />
                            <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingId(null)} />
                        </Space>
                    );
                }
                return (
                    <Space>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingId(record.id!);
                                setEditName(record.name || "");
                            }}
                            className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                        />
                        <Popconfirm
                            title="Bạn có chắc chắn muốn xóa chức danh này?"
                            onConfirm={() => handleDelete(record.id!)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <Button
                icon={<SettingOutlined />}
                onClick={() => setOpen(true)}
                size="large"
                className="!bg-slate-100/80 !text-slate-600 hover:!text-cyan-600 hover:!bg-cyan-50 !font-semibold !shadow-sm !h-10 sm:!h-12 !px-3 sm:!px-4 !border-slate-200"
            >
                <span className="hidden sm:inline ml-2">Cài đặt chức danh</span>
            </Button>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-cyan-700">
                        <SettingOutlined /> Cài đặt Chức danh (Roles)
                    </div>
                }
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={600}
                styles={{ body: { paddingBlock: 16 } }}
            >
                <div className="mb-4 flex flex-col gap-3">
                    <div className="text-sm text-slate-500 mb-2">
                        Quản lý các chức danh của nhân viên. Các chức danh đang được gán cho nhân viên sẽ không thể xóa.
                    </div>

                    <Table
                        dataSource={roles}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        loading={loading}
                        size="middle"
                        bordered
                    />

                    {isAdding ? (
                        <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <Input
                                placeholder="Nhập tên chức danh mới..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onPressEnter={handleAdd}
                                autoFocus
                                className="flex-1"
                            />
                            <Button type="primary" icon={<SaveOutlined />} onClick={handleAdd} loading={loading}>Lưu</Button>
                            <Button icon={<CloseOutlined />} onClick={() => setIsAdding(false)}>Hủy</Button>
                        </div>
                    ) : (
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setIsAdding(true)}
                            className="mt-2 text-cyan-600 border-cyan-300 bg-cyan-50 hover:bg-cyan-100"
                            block
                        >
                            Thêm chức danh mới
                        </Button>
                    )}
                </div>
            </Modal>
        </>
    );
}
