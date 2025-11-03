import { Collapse, Input, Button, Checkbox } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { User } from "../../../@types/user.type";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useDebounce } from "../../../common/hooks/useDebounce";
import type { UserSectionProps } from "../../../@types/invoice.type";
// import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";
import { useUsersInfinite } from "../../../common/hooks/user.hook";

export const UserSection: React.FC<UserSectionProps> = ({
  selectedUsers,
  onUserCheck,
  onRemoveUser,
  disabled,
}) => {
  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebounce(userSearch, 150);
  // const adminMode = useCheckPermission();

  // Cache thông tin user theo id để không bị "Unknown" khi đổi search
  const [userCache, setUserCache] = useState<Record<string, User>>({});

  // Infinite users theo search
  const {
    data: pages,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUsersInfinite({ page: 1, limit: 10, search: debouncedUserSearch });

  // Gộp dữ liệu phân trang
  const allUsers: User[] = useMemo(() => {
    const list = pages?.pages ?? [];
    const merged: User[] = [];
    const seen = new Set<string>();
    for (const p of list) {
      const payload: any = (p as any)?.data;
      const items: User[] = payload?.data ?? payload ?? [];
      for (const u of items) {
        if (!seen.has(u._id)) {
          seen.add(u._id);
          merged.push(u);
        }
      }
    }
    return merged;
  }, [pages]);

  // Cập nhật cache mỗi lần có user mới load về
  useEffect(() => {
    if (!allUsers.length) return;
    setUserCache((prev) => {
      const next = { ...prev };
      for (const u of allUsers) next[u._id] = u;
      return next;
    });
  }, [allUsers]);

  // Đảm bảo selectedUsers có trong data (khi KHÔNG search) → tự fetch thêm
  useEffect(() => {
    if (!selectedUsers?.length || debouncedUserSearch) return;
    const currentIds = new Set(allUsers.map((u) => u._id));
    const missing = selectedUsers.filter((id) => !currentIds.has(id));
    if (missing.length > 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    selectedUsers,
    allUsers,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    debouncedUserSearch,
  ]);

  // Ưu tiên user đã chọn lên đầu
  const displayUsers = useMemo(() => {
    const selectedSet = new Set(selectedUsers);
    return [...allUsers].sort((a, b) => {
      const aSel = selectedSet.has(a._id) ? 1 : 0;
      const bSel = selectedSet.has(b._id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      const aName = (a.fullName || a.username || "").toLowerCase();
      const bName = (b.fullName || b.username || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [allUsers, selectedUsers]);

  const handleUserSearchChange = useCallback((value: string) => {
    setUserSearch(value);
  }, []);

  // Toggle chọn user — lưu luôn user vào cache khi check
  const toggleRow = (user: User, willCheck: boolean) => {
    if (disabled) return;
    if (willCheck) {
      setUserCache((prev) => ({ ...prev, [user._id]: user }));
    }
    onUserCheck(willCheck, user._id);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <Collapse
        defaultActiveKey={["1"]}
        bordered={false}
        className="!bg-white !rounded-xl"
        expandIconPosition="end"
      >
        {!disabled && (
          <Collapse.Panel
            header={<b>Nhân sự</b>}
            key="1"
            className="!bg-white !rounded-xl"
          >
            <div className="bg-white rounded-xl">
              {/* Search sticky */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-3 pt-2 pb-2 border-b">
                <Input
                  allowClear
                  placeholder="Tìm nhân sự..."
                  value={userSearch}
                  onChange={(e) => handleUserSearchChange(e.target.value)}
                  className="!rounded-lg !h-10 !text-[15px]"
                />
              </div>

              {/* Danh sách */}
              <div
                className="relative overflow-y-auto"
                style={{ maxHeight: 340, WebkitOverflowScrolling: "touch" }}
              >
                {(isFetching || isFetchingNextPage) && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Đang tải…</p>
                    </div>
                  </div>
                )}

                {displayUsers.map((u) => {
                  const isChecked = selectedUsers.includes(u._id);
                  const name = u.fullName || u.username || "Người dùng";
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => toggleRow(u, !isChecked)}
                      className={
                        "w-full text-left px-3 py-3 border-b last:border-b-0 transition " +
                        (isChecked ? "bg-cyan-50" : "hover:bg-slate-50")
                      }
                      disabled={disabled}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => toggleRow(u, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="!scale-110"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate ">
                            {name}
                          </div>
                          {u.username && u.fullName && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate sm:text-sm">
                              @{u.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {hasNextPage && (
                  <div className="p-3">
                    <Button
                      block
                      size="middle"
                      onClick={() => fetchNextPage()}
                      loading={isFetchingNextPage}
                      className="!rounded-lg"
                    >
                      Tải thêm
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Collapse.Panel>
        )}
      </Collapse>

      {/* Selected Users dùng cache để luôn có tên */}
      {!disabled && (
        <div className="px-3 pt-3">
          <div className="font-semibold text-sm mb-2">
            Nhân sự đã chọn ({selectedUsers.length})
          </div>
        </div>
      )}

      <div
        className="px-3 pb-4 space-y-2 overflow-y-auto"
        style={{ maxHeight: 240, WebkitOverflowScrolling: "touch" }}
      >
        {selectedUsers.map((userId) => {
          const u = userCache[userId];
          const name = u?.fullName || u?.username || "Đang tải…";
          return (
            <div
              key={userId}
              className="rounded-lg border border-slate-200 p-3 bg-white flex items-center"
            >
              <span className="text-cyan-700 font-semibold truncate flex-1">
                {name}
              </span>
              {/* {adminMode && ( */}
                <Button
                  type="text"
                  icon={<DeleteOutlined className="!text-red-500" />}
                  danger
                  onClick={() => onRemoveUser(userId)}
                  className="!-mr-1 !text-red-500"
                  disabled={disabled}
                />
              
            </div>
          );
        })}
      </div>
    </div>
  );
};
