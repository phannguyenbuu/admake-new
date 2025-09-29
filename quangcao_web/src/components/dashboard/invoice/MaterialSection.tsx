import { Collapse, Input, InputNumber, Button, Checkbox } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { Material } from "../../../@types/material.type";
import { useMaterialsInfinite } from "../../../common/hooks/material.hook";
import type { PaginationDto } from "../../../@types/common.type";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "../../../common/hooks/useDebounce";
import type { MaterialSectionProps } from "../../../@types/invoice.type";
import { useCheckPermission } from "../../../common/hooks/checkPermission.hook";

const formatVND = (n?: number) => (n ?? 0).toLocaleString("vi-VN") + "đ";

export const MaterialSection: React.FC<MaterialSectionProps> = ({
  selected,
  quantities,
  onCheck,
  onRemove,
  onQuantityChange,
  disabled,
}) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 150);
  const adminMode = useCheckPermission();

  const query: Partial<PaginationDto> = useMemo(
    () => ({ page: 1, limit: 10, search: debouncedSearch }),
    [debouncedSearch]
  );

  const {
    data: pages,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMaterialsInfinite(query);

  // ----- Gộp kết quả phân trang
  const allMaterials: Material[] = useMemo(() => {
    const list = pages?.pages ?? [];
    const merged: Material[] = [];
    const seen = new Set<string>();
    for (const p of list) {
      const payload: any = (p as any)?.data;
      const items: Material[] = payload?.data ?? payload ?? [];
      for (const m of items) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          merged.push(m);
        }
      }
    }
    return merged;
  }, [pages]);

  // ----- Bảo đảm vật liệu đã chọn xuất hiện
  useEffect(() => {
    if (!selected?.length) return;
    const currentIds = new Set(allMaterials.map((m) => m.id));
    const missing = selected.filter((m) => !currentIds.has(m.id));
    if (missing.length > 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [selected, allMaterials, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ----- Ưu tiên vật liệu đã chọn lên trước
  const displayMaterials = useMemo(() => {
    const selectedSet = new Set(selected.map((m) => m.id));
    return [...allMaterials].sort((a, b) => {
      const aSel = selectedSet.has(a.id) ? 1 : 0;
      const bSel = selectedSet.has(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [allMaterials, selected]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const toggleRow = (checked: boolean, m: Material) => {
    if (disabled || !adminMode) return;
    onCheck(checked, m);
  };

  // ===== Infinite scroll (IntersectionObserver + fallback onScroll)
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScroll = useCallback(() => {
    const wrap = scrollRef.current;
    if (!wrap || !hasNextPage || isFetchingNextPage) return;
    const nearBottom =
      wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 48;
    if (nearBottom) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <Collapse
        defaultActiveKey={["1"]}
        bordered={false}
        className="!bg-white !rounded-xl"
        expandIconPosition="end"
      >
        {adminMode && !disabled && (
          <Collapse.Panel
            header={<b>Vật liệu</b>}
            key="1"
            className="!bg-white !rounded-xl"
          >
            <div className="bg-white rounded-xl">
              {/* Search sticky */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-3 pt-2 pb-2 border-b">
                <Input
                  allowClear
                  placeholder="Tìm kiếm vật liệu..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="!rounded-lg !h-10 !text-[15px]"
                />
              </div>

              {/* Danh sách vật liệu – mobile friendly + infinite scroll */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
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

                {displayMaterials.map((m) => {
                  const checked = selected.some((s) => s.id === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleRow(!checked, m)}
                      className="w-full text-left px-3 py-3 border-b last:border-b-0 hover:bg-slate-50 active:bg-slate-100 transition select-none"
                      disabled={disabled || !adminMode}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={checked}
                          onChange={(e) => toggleRow(e.target.checked, m)}
                          onClick={(e) => e.stopPropagation()}
                          className="!scale-110"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">
                            {m.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 sm:text-sm">
                            SL: {m.quantity} {m.unit ? `• ${m.unit}` : ""}
                          </div>
                        </div>
                        <div className="shrink-0 font-semibold text-cyan-600 text-sm sm:text-[14px]">
                          {formatVND(m.price)}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Sentinel cho IntersectionObserver */}
                <div ref={sentinelRef} />

                {/* Fallback nút Tải thêm */}
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

      {/* Vật liệu đã chọn */}
      {adminMode && !disabled && (
        <div className="px-3 pt-3">
          <div className="font-semibold text-sm mb-2">
            Vật liệu đã chọn ({selected.length})
          </div>
        </div>
      )}

      <div
        className="px-3 pb-4 space-y-2 overflow-y-auto"
        style={{ maxHeight: 240, WebkitOverflowScrolling: "touch" }}
      >
        {selected.map((m: any) => {
          const qty = quantities[m._id] || 1;
          return (
            <div
              key={m._id}
              className="rounded-lg border border-slate-200 p-3 bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-cyan-700 font-semibold truncate">
                    {m?.name || "Vật liệu"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Giá: {formatVND(m?.price)}{" "}
                    {m?.unit ? `• ĐVT: ${m.unit}` : ""}
                  </div>
                </div>

                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => onRemove(m._id)}
                  className="!-mr-1"
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-gray-600 text-sm">Số lượng</span>
                <InputNumber
                  min={1}
                  max={m?.quantity || 1}
                  value={qty}
                  onChange={(v) => onQuantityChange(m._id, v)}
                  className="!w-24"
                  size="middle"
                  keyboard={false}
                  disabled={!adminMode || disabled}
                />
                <div className="text-sm font-semibold text-emerald-600">
                  = {formatVND((m?.price || 0) * qty)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
