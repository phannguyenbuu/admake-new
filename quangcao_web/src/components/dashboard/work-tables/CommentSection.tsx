import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  List,
  Input,
  Button,
  Image,
  message,
  Tooltip,
  Empty,
  Spin,
} from "antd";
import {
  SendOutlined,
  PictureOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import EmojiPickerModal from "../../emoji/EmojiPickerModal";
import EmojiButton from "../../emoji/EmojiButton";
import { useEmojiPicker } from "../../../common/hooks/useEmojiPicker";
import {
  useCreateComment,
  useGetCommentById,
} from "../../../common/hooks/comment.hook";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import type {
  CommentItem,
  CommentSectionProps,
  ImageState,
} from "../../../@types/comment.type";
import { useInfo } from "../../../common/hooks/info.hook";
import { getAddressFromCoordinates } from "../../../common/utils/help.util";
import LocationMapModal from "../goong-map/map";
import { formatTimeAgo } from "../../../utils/convert.util";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { TextArea } = Input;

// Custom Comment Component
const CustomComment = ({
  actions,
  author,
  avatar,
  content,
  datetime,
  children,
}: {
  actions?: React.ReactNode[];
  author?: React.ReactNode;
  avatar?: React.ReactNode;
  content?: React.ReactNode;
  datetime?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div className="flex gap-2 sm:gap-3 p-2 sm:p-4 border-b border-gray-100 last:border-b-0">
    <div className="flex-shrink-0">{avatar}</div>
    <div className="flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
        <div className="font-semibold text-gray-800 text-sm sm:text-base">
          {author}
        </div>
        <div className="text-gray-400 text-xs sm:text-sm">
          {datetime ? formatTimeAgo(datetime) : ""}
        </div>
      </div>
      <div className="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
        {content}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          {actions}
        </div>
      )}
      {children && (
        <div className="mt-2 sm:mt-3 ml-2 sm:ml-4 border-l-2 border-gray-200 pl-2 sm:pl-4">
          {children}
        </div>
      )}
    </div>
  </div>
);

export default function CommentSection({
  taskId,
  placeholder = "Viết bình luận...",
  disabled = false,
}: CommentSectionProps) {
  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState("");
  const [mainImages, setMainImages] = useState<ImageState>({
    files: [],
    urls: [],
  });
  const [query, setQuery] = useState({
    limit: 5,
    page: 1,
  });
  const [hasMore, setHasMore] = useState(true);
  const [allComments, setAllComments] = useState<CommentItem[]>([]);
  const { showEmojiPicker, openEmojiPicker, closeEmojiPicker } =
    useEmojiPicker();
  const [open, setOpen] = useState(false);

  // map
  // tối ưu hơn bằng cách gộp lại thành 1 state
  const [mapState, setMapState] = useState<{
    lat: number | null;
    lng: number | null;
    name: string | null;
  }>({
    lat: null,
    lng: null,
    name: null,
  });
  // API hooks
  const { mutate: createCommentMutation } = useCreateComment();

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    isFetching: isFetchingComments,
    refetch: refetchComments,
  } = useGetCommentById(taskId || "", query);

  const { data: info } = useInfo();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache địa chỉ theo commentId để tránh gọi lặp
  const [commentAddressMap, setCommentAddressMap] = useState<
    Record<string, string>
  >({});

  // Transform data directly using useMemo instead of useEffect
  const commentList = useMemo((): CommentItem[] => {
    if (!taskId || !commentsData?.data) return [];

    return commentsData.data.map((comment: any) => ({
      _id: comment._id,
      createdAt: new Date(comment.createdAt),
      updatedAt: new Date(comment.updatedAt),
      content: comment.content,
      image: comment.image
        ? import.meta.env.VITE_API_IMAGE + comment.image
        : null,
      taskId: comment.taskId || taskId,
      createBy: comment.createBy,
      attendance: comment.attendance,
      type: comment.type,
    }));
  }, [taskId, commentsData?.data]);

  //@ts-ignore
  const total = commentsData?.total;
  //@ts-ignore
  const page = commentsData?.page;
  //@ts-ignore
  const limit = commentsData?.limit;

  // Reset comments when taskId changes
  useEffect(() => {
    setAllComments([]);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      limit: 5,
    }));
    setHasMore(true);
  }, [taskId]);

  // Lấy địa chỉ cho các comment có toạ độ (mỗi comment gọi 1 lần)
  useEffect(() => {
    if (!allComments || allComments.length === 0) return;

    const pending = allComments.filter((c) => {
      const t = c?.type as "in" | "out" | undefined;
      const rec = t ? c?.attendance?.records?.[t] : undefined;
      return !!rec?.latitude && !!rec?.longitude && !commentAddressMap[c._id];
    });

    if (pending.length === 0) return;

    pending.forEach(async (c) => {
      try {
        const t = c.type as "in" | "out";
        const rec = c.attendance!.records[t];
        const lat = rec.latitude as number;
        const lon = rec.longitude as number;
        const addr = await getAddressFromCoordinates(lat, lon);
        setCommentAddressMap((prev) => ({ ...prev, [c._id]: addr }));
      } catch (e) {
        setCommentAddressMap((prev) => ({
          ...prev,
          [c._id]: "",
        }));
      }
    });
  }, [allComments, commentAddressMap]);

  useEffect(() => {
    if (!commentList) return;

    setAllComments((prev) => {
      // Nếu là trang đầu tiên: thay thế danh sách bằng dữ liệu mới của trang 1
      if (page === 1) {
        return commentList;
      }

      // Các trang kế tiếp: chỉ nối thêm các comment chưa có
      const existingIds = new Set(prev.map((c) => c._id));
      const newComments = commentList.filter((c) => !existingIds.has(c._id));
      return newComments.length > 0 ? [...prev, ...newComments] : prev;
    });
  }, [commentList, page]);

  // Check if there are more comments to load
  useEffect(() => {
    if (commentsData && typeof total === "number") {
      setHasMore(allComments.length < total);
    }
  }, [commentsData, allComments.length, total]);

  // Cleanup URL objects when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup main images
      mainImages.urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleEmojiSelect = (emojiObject: any) => {
    setValue((prev) => prev + emojiObject.emoji);
  };

  const handleLoadMore = () => {
    if (!isLoadingComments && hasMore && total) {
      const remainingComments = total - allComments.length + 1;
      const newLimit = Math.min(remainingComments, 5);

      setQuery((prev) => ({
        ...prev,
        page: prev.page + 1,
        limit: newLimit,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!value.trim() && mainImages.files.length === 0) {
      message.warning("Vui lòng nhập nội dung hoặc chọn hình ảnh!");
      return;
    }

    if (!taskId) {
      message.error("Không tìm thấy ID của task!");
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData for API
      const formData = new FormData();
      formData.append("content", value);

      if (mainImages.files.length > 0) {
        formData.append("image", mainImages.files[0]);
      }

      // Call API to create comment
      createCommentMutation(
        { dto: formData, id: taskId },
        {
          onSuccess: () => {
            message.success("Gửi bình luận thành công!");
            // Reset form
            setValue("");
            setMainImages({ files: [], urls: [] });
            // Reset to first page and reload comments
            setQuery((prev) => ({
              ...prev,
              page: 1,
              limit: 5,
            }));
            setAllComments([]); // Reset comments to reload from first page
            refetchComments();
          },
          onError: () => {
            message.error("Có lỗi xảy ra khi gửi bình luận!");
          },
        }
      );
    } catch (error) {
      message.error("Có lỗi xảy ra khi gửi bình luận!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      message.error("Vui lòng chọn file hình ảnh!");
      return;
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const selectedFile = imageFiles[0];

    if (selectedFile.size > maxSize) {
      message.error("Kích thước file không được vượt quá 5MB!");
      return;
    }

    // Tạo URL preview
    const newUrl = URL.createObjectURL(selectedFile);
    setMainImages({
      files: [selectedFile],
      urls: [newUrl],
    });

    // Reset file input để có thể chọn lại cùng file
    e.target.value = "";
  };

  const removeImage = (_index: number) => {
    // Cleanup URL objects to prevent memory leaks
    mainImages.urls.forEach((url) => URL.revokeObjectURL(url));
    setMainImages({ files: [], urls: [] });
  };

  const renderImageGrid = (
    imageUrls: string[],
    onRemove: (index: number) => void
  ) => {
    if (imageUrls.length === 0) return null;

    return (
      <div className="mt-2 sm:mt-3">
        <div className="relative group inline-block">
          <Image
            src={imageUrls[0]}
            alt="Preview"
            className="!rounded-lg !w-20 !h-20 sm:!w-24 sm:!h-24 md:!w-32 md:!h-32 object-cover border border-gray-200"
            preview={false}
          />
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => onRemove(0)}
            className="!absolute !top-0.5 !right-0.5 sm:!top-1 sm:!right-1 !bg-red-500 !text-white hover:!bg-red-600 !rounded-full !w-5 !h-5 sm:!w-6 sm:!h-6 !p-0 !flex !items-center !justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            size="small"
          />
        </div>
      </div>
    );
  };

  const renderCommentActions = (comment: CommentItem) => [
    <Tooltip key="datetime" title={comment?.createdAt?.toISOString() || ""}>
      <span className="text-gray-400 text-xs sm:text-sm">
        {formatTimeAgo(comment?.createdAt?.toISOString() || "")}
      </span>
    </Tooltip>,
  ];

  return (
    <div className="rounded-lg">
      {/* Comment Input Section */}
      <div className="p-2 sm:p-4 border-b border-gray-100">
        <div className="flex gap-2 sm:gap-3">
          <Image
            src={
              info?.avatar
                ? import.meta.env.VITE_API_IMAGE + info?.avatar
                : "https://static.thenounproject.com/png/5034901-200.png"
            }
            preview={false}
            className="!w-8 !h-8 sm:!w-10 sm:!h-10 !rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <TextArea
              rows={window.innerWidth < 768 ? 2 : 3}
              onChange={(e) => setValue(e.target.value)}
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              className="!rounded-lg sm:!rounded-xl !border-2 !border-gray-200 focus:!border-blue-500 focus:!shadow-lg resize-none !text-sm sm:!text-base hover:!border-gray-300 transition-all duration-200"
            />

            {/* Image Upload for Main Comment */}
            <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-end">
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="dashed"
                  icon={<PictureOutlined className="!text-sm sm:!text-lg" />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || mainImages.files.length >= 1}
                  className="!rounded-lg !border-2 !border-dashed !border-blue-300 hover:!border-blue-500 !text-blue-600 hover:!text-blue-700 !font-medium !flex !items-center !gap-1 sm:!gap-2 !px-2 sm:!px-4 !py-1 sm:!py-2 !text-xs sm:!text-sm"
                  size="small"
                >
                  <span className="hidden sm:inline">
                    Ảnh ({mainImages.files.length}/1)
                  </span>
                  <span className="sm:hidden">{mainImages.files.length}/1</span>
                </Button>
                <div className="hidden sm:block">
                  <EmojiButton onClick={openEmojiPicker} size="small" />
                </div>
                <div className="block md:hidden">
                  <Button
                    type="primary"
                    icon={<SendOutlined className="!text-sm" />}
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={
                      disabled ||
                      submitting ||
                      (!value.trim() && mainImages.files.length === 0)
                    }
                    className="!bg-gradient-to-r !from-blue-500 !to-purple-500 hover:!from-blue-600 hover:!to-purple-600 !border-0 !rounded-lg !px-3 sm:!px-6 !py-1 sm:!py-2 !font-semibold !text-white shadow-md hover:shadow-lg transition-all duration-200 !text-xs sm:!text-sm w-full sm:w-auto"
                    size="small"
                  >
                    <span className="sm:hidden">Gửi</span>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <Button
                  type="primary"
                  icon={<SendOutlined className="!text-sm" />}
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={
                    disabled ||
                    submitting ||
                    (!value.trim() && mainImages.files.length === 0)
                  }
                  className="!bg-gradient-to-r !from-blue-500 !to-purple-500 hover:!from-blue-600 hover:!to-purple-600 !border-0 !rounded-lg !px-3 sm:!px-6 !py-1 sm:!py-2 !font-semibold !text-white shadow-md hover:shadow-lg transition-all duration-200 !text-xs sm:!text-sm w-full sm:w-auto"
                  size="small"
                >
                  <span className="sm:hidden">Gửi</span>
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e)}
              style={{ display: "none" }}
            />

            {/* Image Preview for Main Comment */}
            {renderImageGrid(mainImages.urls, (index) => removeImage(index))}
          </div>
        </div>
      </div>

      <div className="p-0">
        <>
          {/* Comments List */}
          <div className="p-2 sm:p-4">
            {(isLoadingComments || isFetchingComments) &&
            allComments.length === 0 ? (
              <div className="text-center py-8">
                <Spin
                  size="large"
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
                <div className="mt-2 text-gray-500 text-sm">
                  Đang tải bình luận...
                </div>
              </div>
            ) : (
              <List
                className="comment-list"
                header={
                  <div className="text-sm sm:text-base font-medium text-gray-700">
                    {total} bình luận
                  </div>
                }
                itemLayout="horizontal"
                dataSource={allComments}
                loading={{
                  spinning: isFetchingComments,
                  indicator: <LoadingOutlined style={{ fontSize: 20 }} spin />,
                }}
                rowKey={(comment) => comment._id}
                locale={{
                  emptyText: (
                    <div className="text-center py-6 sm:py-8">
                      <div className="text-gray-400 text-base sm:text-lg mb-2">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Không có bình luận"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  ),
                }}
                renderItem={(comment) => (
                  <li>
                    <CustomComment
                      actions={renderCommentActions(comment)}
                      author={
                        <span className="font-semibold text-gray-800">
                          {comment?.createBy?.fullName}
                        </span>
                      }
                      avatar={
                        <Image
                          src={
                            comment?.createBy?.avatar
                              ? import.meta.env.VITE_API_IMAGE +
                                comment?.createBy?.avatar
                              : "https://static.thenounproject.com/png/5034901-200.png"
                          }
                          alt={comment?.createBy?.fullName}
                          preview={false}
                          className="!rounded-full !w-8 !h-8 sm:!w-10 sm:!h-10"
                        />
                      }
                      content={
                        <div>
                          <p className="text-gray-700 mb-2 text-sm sm:text-base">
                            {comment.content}
                          </p>
                          {comment.type &&
                            comment.attendance?.records[comment.type].map
                              ?.address && (
                              <>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-1 sm:gap-0">
                                  <div
                                    className="flex flex-col sm:flex-row gap-1 cursor-pointer hover:scale-105 transition-all duration-200"
                                    onClick={() => {
                                      setOpen(true);
                                      setMapState({
                                        lat: comment.attendance?.records[
                                          comment.type
                                        ].latitude,
                                        lng: comment.attendance?.records[
                                          comment.type
                                        ].longitude,
                                        name: comment?.createBy?.fullName,
                                      });
                                    }}
                                  >
                                    <p className="text-blue-600 text-sm sm:text-base">
                                      📍 Địa chỉ:{" "}
                                      {
                                        comment.attendance?.records[
                                          comment.type
                                        ].map?.address
                                      }
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}
                          {comment?.image && (
                            <div className="grid grid-cols-1 gap-2 mb-3 max-w-24 sm:max-w-32 md:max-w-40">
                              <Image
                                src={comment?.image}
                                alt={`Comment image`}
                                className="!rounded-lg !w-24 !h-24 sm:!w-32 sm:!h-32 md:!w-40 md:!h-40"
                                preview={true}
                              />
                            </div>
                          )}
                        </div>
                      }
                      datetime={
                        <Tooltip
                          title={comment?.createdAt?.toISOString() || ""}
                        >
                          <span>
                            {formatTimeAgo(comment?.createdAt?.toISOString())}
                          </span>
                        </Tooltip>
                      }
                    ></CustomComment>
                  </li>
                )}
              />
            )}

            {/* Load More Button */}
            {hasMore && !isLoadingComments && allComments.length > 0 && (
              <div className="text-center mt-3 sm:mt-4">
                <Button
                  type="default"
                  onClick={handleLoadMore}
                  className="!border-blue-300 !text-blue-600 hover:!border-blue-500 hover:!text-blue-700 !text-sm sm:!text-base !px-4 sm:!px-6"
                  size="small"
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </div>

          {/* Emoji Picker Modal */}
          <EmojiPickerModal
            open={showEmojiPicker}
            onCancel={closeEmojiPicker}
            onEmojiSelect={handleEmojiSelect}
            title="Chọn Emoji"
            width={window.innerWidth < 768 ? 350 : 450}
            height={window.innerWidth < 768 ? 400 : 500}
            searchPlaceholder="Tìm kiếm biểu tượng cảm xúc"
          />
        </>
      </div>
      {/* Chỉ render LocationMapModal khi cần thiết */}
      {open && (
        <LocationMapModal
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          lat={mapState.lat || 10.77689}
          lng={mapState.lng || 106.70098}
          title={`Vị trí:  ${mapState.name || "khách"}`}
          userName={mapState.name || "Người dùng"}
        />
      )}
    </div>
  );
}
