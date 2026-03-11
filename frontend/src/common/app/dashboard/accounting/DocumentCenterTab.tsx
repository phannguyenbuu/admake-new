import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { useUser } from "../../../common/hooks/useUser";
import {
  DocumentCenterService,
  type DocumentCenterDetail,
  type DocumentCenterListItem,
} from "../../../services/document-center.service";
import DocumentFilterBar from "./document-center/DocumentFilterBar";
import DocumentListTable from "./document-center/DocumentListTable";
import DocumentDetailModal from "./document-center/DocumentDetailModal";

export default function DocumentCenterTab() {
  const { userLeadId } = useUser();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailId, setDetailId] = useState<string | null>(null);

  const from = useMemo(() => dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"), [month]);
  const to = useMemo(() => dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"), [month]);

  const metadataQuery = useQuery({
    queryKey: ["document-center-metadata"],
    queryFn: async () => {
      const res = await DocumentCenterService.metadata();
      return res.data;
    },
  });

  const listQuery = useQuery({
    queryKey: ["document-center-list", userLeadId, month, type, status, keyword, page, pageSize],
    enabled: !!userLeadId,
    queryFn: async () => {
      const res = await DocumentCenterService.list({
        lead: userLeadId,
        type: type || undefined,
        status: status || undefined,
        q: keyword || undefined,
        from,
        to,
        page,
        pageSize,
        sort: "-updatedAt",
      });
      return res.data;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["document-center-detail", detailId],
    enabled: !!detailId,
    queryFn: async () => {
      const res = await DocumentCenterService.getById(detailId as string);
      return res.data as DocumentCenterDetail;
    },
  });

  const rows = (listQuery.data?.data || []) as DocumentCenterListItem[];
  const pagination = listQuery.data?.pagination;

  const reloadList = async () => {
    await listQuery.refetch();
  };

  const reloadDetail = async () => {
    if (!detailId) return;
    await detailQuery.refetch();
    await listQuery.refetch();
  };

  const runAction = async (fn: () => Promise<any>, okMessage: string) => {
    try {
      await fn();
      notification.success({ message: okMessage });
      await reloadList();
      if (detailId) {
        await detailQuery.refetch();
      }
    } catch (error: any) {
      console.error(error);
      notification.error({ message: error?.response?.data?.description || "Thao tác thất bại" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Trung tâm chứng từ giúp lọc theo loại, trạng thái, thời gian và truy vết chứng từ nhanh hơn mà vẫn giữ nguyên
        luồng thao tác hiện tại.
      </div>

      <DocumentFilterBar
        month={month}
        type={type}
        status={status}
        keyword={keyword}
        typeOptions={metadataQuery.data?.types || []}
        statusOptions={metadataQuery.data?.statuses || []}
        onMonthChange={(value) => {
          setMonth(value);
          setPage(1);
        }}
        onTypeChange={(value) => {
          setType(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onKeywordChange={(value) => {
          setKeyword(value);
          setPage(1);
        }}
      />

      <DocumentListTable
        loading={listQuery.isLoading}
        rows={rows}
        onOpenDetail={(row) => setDetailId(row.id)}
        onSubmit={(row) => runAction(() => DocumentCenterService.submit(row.id), "Đã trình duyệt chứng từ")}
        onApprove={(row) => runAction(() => DocumentCenterService.approve(row.id), "Đã duyệt chứng từ")}
        onCancel={(row) => runAction(() => DocumentCenterService.cancel(row.id), "Đã hủy chứng từ")}
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          disabled={!pagination || page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Trước
        </button>
        <span className="text-sm text-slate-500">
          Trang {pagination?.page || 1}/{pagination?.totalPages || 1}
        </span>
        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          disabled={!pagination || page >= (pagination.totalPages || 1)}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Sau
        </button>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
          <option value={100}>100 / trang</option>
        </select>
      </div>

      <DocumentDetailModal
        open={!!detailId}
        loading={detailQuery.isLoading}
        detail={detailQuery.data || null}
        onClose={() => setDetailId(null)}
        onReload={reloadDetail}
      />
    </div>
  );
}
