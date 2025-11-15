import type { IPage } from "../../../@types/common.type";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import ManagermentBoard from "../../../components/dashboard/work-tables/Managerment";
import { useWorkSpaceQueryTaskById } from "../../../common/hooks/work-space.hook";
import { useUser } from "../../../common/hooks/useUser";

const WorkTableDetailPage: IPage["Component"] = () => {
  const { boardId } = useParams();
  const { workspaceId, setWorkspaceId} = useUser();

  useEffect(()=>{
    setWorkspaceId(boardId ?? '');
  },[boardId]);
  
  // Sử dụng hook để lấy task data theo ID
  const {
    data: response,
    isLoading,
    error,
  } = useWorkSpaceQueryTaskById(boardId || "");

  // useEffect(() => {
  //   console.log('W_TABLE', boardId, response);
  // },[response]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <div className="text-xl font-semibold mb-2">Có lỗi xảy ra!</div>
          <div className="text-sm">Không thể tải dữ liệu bảng công việc</div>
        </div>
      </div>
    );
  }

  // Không tìm thấy board
  if (!response) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">
          <div className="text-xl font-semibold mb-2">
            Không tìm thấy bảng công việc!
          </div>
          <div className="text-sm">Board ID: {boardId}</div>
        </div>
      </div>
    );
  }

  // @ts-ignore
  return <ManagermentBoard/>;
};

export const loader = async () => {
  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { userId: 1, name: "John Doe" };
};

export default WorkTableDetailPage;