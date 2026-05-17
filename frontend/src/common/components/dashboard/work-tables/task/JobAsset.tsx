import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { notification } from "antd";
import type { MessageTypeProps } from "../../../../@types/chat.type";
import { TOKEN_LABEL } from "../../../../common/config";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { useTaskContext } from "../../../../common/hooks/useTask";
import { useUser } from "../../../../common/hooks/useUser";
import DeleteConfirm from "../../../DeleteConfirm";
import FileUploadWithPreview from "../../../FileUploadWithPreview";
import ImagePasteUpload from "./ImagePasteUpload";

type ItemKind = "asset" | "message";

interface JobAssetProps {
  title?: string;
  type?: string;
  readOnly?: boolean;
  messages?: MessageTypeProps[];
  targetUserId?: string;
}

function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_LABEL) || sessionStorage.getItem(TOKEN_LABEL) || "";
}

function buildAuthHeaders(): HeadersInit | undefined {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function formatDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "_" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function normalizeMessageType(messageType?: string): string {
  return (messageType || "").trim();
}

function isSameType(messageType: string | undefined, currentType: string | undefined): boolean {
  return normalizeMessageType(messageType) === normalizeMessageType(currentType);
}

function hasText(message: MessageTypeProps): boolean {
  return Boolean(message.text && message.text.trim() !== "");
}

function hasFile(message: MessageTypeProps): boolean {
  return Boolean(message.file_url && message.file_url.trim() !== "");
}

function isCashType(type?: string): boolean {
  return Boolean(type && type.includes("cash"));
}

function getFilenameFromUrl(url: string): string {
  return url.substring(url.lastIndexOf("/") + 1);
}

function mergeByMessageId(items: MessageTypeProps[]): MessageTypeProps[] {
  const withId = new Map<string, MessageTypeProps>();
  const withoutId: MessageTypeProps[] = [];

  items.forEach((item) => {
    if (item.message_id) {
      withId.set(item.message_id, item);
      return;
    }
    withoutId.push(item);
  });

  return [...withId.values(), ...withoutId];
}

function formatCashPreview(text?: string): string {
  if (!text) return "";
  const parts = text.split("/");
  const amount = parts[0] || "";
  const hint = parts.length > 1 ? parts[parts.length - 1] : "";
  return hint ? `${amount}[${hint}]` : amount;
}

interface FormDataInput {
  file?: File;
  text?: string;
  includeUsername?: boolean;
  taskId?: string;
  type?: string;
  userId?: string;
  username?: string;
}

function createMessageFormData({
  file,
  text,
  includeUsername = false,
  taskId,
  type,
  userId,
  username,
}: FormDataInput): FormData {
  const formData = new FormData();
  formData.append("time", formatDate(new Date()));
  formData.append("type", type || "");
  formData.append("user_id", userId || "");
  formData.append("task_id", taskId || "");

  if (file) {
    formData.append("file", file);
  }
  if (typeof text === "string") {
    formData.append("text", text);
  }
  if (includeUsername) {
    formData.append("username", username || "");
  }

  return formData;
}

const JobAsset: React.FC<JobAssetProps> = ({
  title,
  type,
  messages,
  targetUserId,
  readOnly = false,
}) => {
  const apiHost = useApiHost();
  const { taskDetail, setTaskDetail } = useTaskContext();
  const {
    userId,
    username,
    fullName,
    generateDatetimeId,
    tmpTaskCreatedAssets,
    setTmpTaskCreatedAssets,
    tmpTaskCreatedMessages,
    setTmpTaskCreatedMessages,
  } = useUser();

  const [listMessages, setListMessages] = useState<MessageTypeProps[]>([]);
  const [assets, setAssets] = useState<MessageTypeProps[]>([]);

  const tmpAssetsByType = useMemo(
    () => tmpTaskCreatedAssets.filter((item) => isSameType(item.type, type)),
    [tmpTaskCreatedAssets, type]
  );
  const tmpMessagesByType = useMemo(
    () => tmpTaskCreatedMessages.filter((item) => isSameType(item.type, type)),
    [tmpTaskCreatedMessages, type]
  );

  useEffect(() => {
    if (taskDetail?.assets) {
      const itemsByType = taskDetail.assets.filter((item) => isSameType(item.type, type));
      setAssets(itemsByType.filter(hasFile));
      setListMessages(itemsByType.filter(hasText));
      return;
    }

    const fallbackMessages = (messages || []).filter((item) =>
      type ? isSameType(item.type, type) : true
    );
    setListMessages(fallbackMessages);
    setAssets([]);
  }, [messages, taskDetail?.assets, taskDetail?.id, type]);

  const visibleMessages = useMemo(() => {
    if (taskDetail) return listMessages;
    return mergeByMessageId([...listMessages, ...tmpMessagesByType]);
  }, [listMessages, taskDetail, tmpMessagesByType]);

  const visibleAssets = useMemo(() => {
    if (taskDetail) return assets;
    return mergeByMessageId([...assets, ...tmpAssetsByType]);
  }, [assets, taskDetail, tmpAssetsByType]);

  const requestJson = useCallback(async <T,>(url: string, init: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return (await response.json()) as T;
  }, []);

  const appendToTaskAssets = useCallback(
    (message: MessageTypeProps) => {
      setTaskDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assets: prev.assets ? [...prev.assets, message] : [message],
        };
      });
    },
    [setTaskDetail]
  );

  const removeFromTaskAssets = useCallback(
    (messageId: string | number | undefined) => {
      setTaskDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assets: prev.assets?.filter((item) => item.message_id !== messageId),
        };
      });
    },
    [setTaskDetail]
  );

  const pushLocalItem = useCallback((kind: ItemKind, message: MessageTypeProps) => {
    if (kind === "asset") {
      setAssets((prev) => mergeByMessageId([...prev, message]));
      return;
    }
    setListMessages((prev) => mergeByMessageId([...prev, message]));
  }, []);

  const removeLocalItem = useCallback((kind: ItemKind, messageId: string | number | undefined) => {
    if (kind === "asset") {
      setAssets((prev) => prev.filter((asset) => asset.message_id !== messageId));
      return;
    }
    setListMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
  }, []);

  const pushDraftItem = useCallback(
    (kind: ItemKind, message: MessageTypeProps) => {
      if (kind === "asset") {
        setTmpTaskCreatedAssets((prev) => mergeByMessageId([...prev, message]));
        return;
      }
      setTmpTaskCreatedMessages((prev) => mergeByMessageId([...prev, message]));
    },
    [setTmpTaskCreatedAssets, setTmpTaskCreatedMessages]
  );

  const removeDraftItem = useCallback(
    (kind: ItemKind, messageId: string | number | undefined) => {
      if (kind === "asset") {
        setTmpTaskCreatedAssets((prev) => prev.filter((asset) => asset.message_id !== messageId));
        return;
      }
      setTmpTaskCreatedMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
    },
    [setTmpTaskCreatedAssets, setTmpTaskCreatedMessages]
  );

  const sendTaskItem = useCallback(
    async (
      kind: ItemKind,
      endpoint: string,
      formData: FormData,
      method: "POST" | "PUT",
      successMessage: string,
      syncTaskAssets: boolean
    ) => {
      const result = await requestJson<{ message: MessageTypeProps }>(endpoint, {
        method,
        headers: buildAuthHeaders(),
        body: formData,
      });

      pushLocalItem(kind, result.message);

      if (syncTaskAssets) {
        appendToTaskAssets(result.message);
      }

      notification.success({ message: successMessage });
    },
    [appendToTaskAssets, pushLocalItem, requestJson]
  );

  const deleteItem = useCallback(
    async (kind: ItemKind, messageId: string | number | undefined, entityLabel: string) => {
      if (!taskDetail) {
        removeDraftItem(kind, messageId);
        return;
      }

      await requestJson<{ message: string }>(`${apiHost}/message/${messageId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      removeLocalItem(kind, messageId);
      removeFromTaskAssets(messageId);
      notification.success({ message: `Đã xóa ${entityLabel}` });
    },
    [apiHost, removeDraftItem, removeFromTaskAssets, removeLocalItem, requestJson, taskDetail]
  );

  const handleAssetSend = useCallback(
    async (file: File) => {
      const formData = createMessageFormData({
        file,
        taskId: taskDetail?.id?.toString(),
        type,
        userId: userId || undefined,
      });

      try {
        if (taskDetail?.id) {
          await sendTaskItem(
            "asset",
            `${apiHost}/task/${taskDetail.id}/upload`,
            formData,
            "PUT",
            "Đã upload thành công!",
            true
          );
          return;
        }

        if (type !== "task") return;

        const result = await requestJson<{ message: MessageTypeProps }>(`${apiHost}/task/new/upload`, {
          method: "PUT",
          headers: buildAuthHeaders(),
          body: formData,
        });

        const draftAsset: MessageTypeProps = {
          ...result.message,
          type: type || result.message?.type,
        };
        pushDraftItem("asset", draftAsset);
        notification.success({ message: "Đã upload thành công!" });
      } catch (error) {
        const err = error as Error;
        notification.error({ message: "Lỗi upload ảnh", description: err.message });
      }
    },
    [apiHost, pushDraftItem, requestJson, sendTaskItem, taskDetail?.id, type, userId]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAssetSend(file);
    }
  };

  const handleAssetDelete = useCallback(
    async (messageId: string | number | undefined) => {
      try {
        await deleteItem("asset", messageId, "tài liệu");
      } catch (error) {
        console.error("Delete asset error:", error);
        notification.error({ message: "Lỗi khi xóa tài liệu" });
      }
    },
    [deleteItem]
  );

  const handleMessageSend = useCallback(
    async (text: string) => {
      const normalizedText = (text || "").trim();
      if (!normalizedText) return;

      const formData = createMessageFormData({
        text: normalizedText,
        includeUsername: true,
        taskId: taskDetail?.id?.toString(),
        type,
        userId: userId || undefined,
        username: username || undefined,
      });

      try {
        if (taskDetail?.id) {
          await sendTaskItem(
            "message",
            `${apiHost}/task/${taskDetail.id}/message`,
            formData,
            "PUT",
            "Đã gửi bình luận thành công!",
            true
          );
          return;
        }

        if (type === "task" || type === "comment") {
          const draftMessage: MessageTypeProps = {
            type,
            message_id: generateDatetimeId(),
            user_id: targetUserId || userId,
            username: fullName || username || "",
            text: normalizedText,
            is_favourite: false,
          };
          pushDraftItem("message", draftMessage);
          return;
        }

        if (isCashType(type)) {
          await sendTaskItem(
            "message",
            `${apiHost}/workpoint/message`,
            formData,
            "POST",
            "Đã lưu thành công!",
            false
          );
        }
      } catch (error) {
        const err = error as Error;
        notification.error({ message: "Lỗi gửi bình luận", description: err.message });
      }
    },
    [
      apiHost,
      fullName,
      generateDatetimeId,
      pushDraftItem,
      sendTaskItem,
      targetUserId,
      taskDetail?.id,
      type,
      userId,
      username,
    ]
  );

  const handleMessageDelete = useCallback(
    async (messageId: string | number | undefined) => {
      try {
        await deleteItem("message", messageId, "tin nhắn");
      } catch (error) {
        console.error("Delete message error:", error);
        notification.error({ message: "Lỗi khi xóa tin nhắn" });
      }
    },
    [deleteItem]
  );

  const handleChangeFavourite = useCallback(
    async (messageId: string, checked: boolean) => {
      setListMessages((prev) =>
        prev.map((item) => (item.message_id === messageId ? { ...item, is_favourite: checked } : item))
      );
      setTmpTaskCreatedMessages((prev) =>
        prev.map((item) => (item.message_id === messageId ? { ...item, is_favourite: checked } : item))
      );

      if (!taskDetail) return;

      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(buildAuthHeaders() || {}),
        };

        await requestJson<{ message: string }>(`${apiHost}/message/${messageId}/favourite`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ favourite: checked }),
        });
        notification.success({ message: "Đã cập nhật đánh dấu" });
      } catch (error) {
        console.error("Favourite update error:", error);
        notification.error({ message: "Lỗi khi cập nhật đánh dấu" });
      }
    },
    [apiHost, requestJson, setTmpTaskCreatedMessages, taskDetail]
  );

  return (
    <Stack sx={{ width: "100%" }}>
      {!readOnly && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
          <label htmlFor={`upload-image-file-${type}`}>
            <IconButton
              color="primary"
              component="span"
              aria-label="upload picture"
              size="small"
              sx={{ border: "1px dashed #3f51b5", width: 40, height: 40 }}
            >
              <AddIcon />
            </IconButton>
          </label>

          <Box sx={{ flexGrow: 1 }}>
            <ImagePasteUpload
              title={title}
              onMessageSend={handleMessageSend}
              onAssetSend={handleAssetSend}
              isCash={isCashType(type)}
            />
          </Box>
        </Stack>
      )}

      {visibleMessages.map((message, index) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          key={message.message_id || `${index}-${message.text || ""}`}
        >
          {(title === "Thông tin từ admin" || type === "comment") && (
            <input
              type="checkbox"
              checked={Boolean(message.is_favourite)}
              onChange={(event) =>
                handleChangeFavourite(message.message_id || "", event.target.checked)
              }
            />
          )}

          <Typography style={{ fontSize: 12, fontWeight: 700 }}>{message.username}:</Typography>
          <Typography style={{ fontSize: 10, fontWeight: 500 }}>
            {isCashType(type) ? formatCashPreview(message.text) : message.text}
          </Typography>

          {!readOnly && (
            <DeleteConfirm
              elId={message.message_id || ""}
              onDelete={handleMessageDelete}
              text="tin nhắn"
            />
          )}
        </Stack>
      ))}

      <Stack direction="row" spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap", width: "100%", minHeight: 200 }}
        >
          {visibleAssets.map((asset, index) => {
            const filename = asset.file_url ? getFilenameFromUrl(asset.file_url) : null;

            return (
              <Stack
                key={asset.message_id || `${index}-${asset.file_url || ""}`}
                direction="column"
                alignItems="center"
                spacing={1}
                sx={{ width: "calc(33.33% - 8px)" }}
              >
                {filename && <FileUploadWithPreview handleSend={handleAssetSend} message={asset} />}

                <Stack direction="row" gap={0}>
                  {!readOnly && (
                    <DeleteConfirm
                      elId={asset.message_id || ""}
                      onDelete={handleAssetDelete}
                      text="tài liệu"
                    />
                  )}
                  <Typography fontSize={12} sx={{ maxWidth: 100, whiteSpace: "nowrap" }}>
                    {filename && filename.length > 9 ? `${filename.substring(0, 9)}...` : filename}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </Stack>

        <input
          key={`file-change-${type}`}
          accept="image/*"
          style={{ display: "none" }}
          id={`upload-image-file-${type}`}
          type="file"
          onChange={handleFileChange}
        />
      </Stack>
    </Stack>
  );
};

export default JobAsset;
