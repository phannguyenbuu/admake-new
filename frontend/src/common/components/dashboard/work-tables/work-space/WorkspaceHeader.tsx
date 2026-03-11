import { useEffect, useState } from "react";
import { Button, notification } from "antd";
import { StarOutlined, StarFilled } from "@ant-design/icons";
import { useUser } from "../../../../common/hooks/useUser";
import { useApiHost } from "../../../../common/hooks/useApiHost";

interface WorkspaceHeaderProps {
  workspaceData: any;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ workspaceData }) => {
  const { currentWorkspace, workspaceId, setWorkspaces } = useUser();
  const [pinned, setPinned] = useState<boolean>(currentWorkspace?.pinned || false);

  useEffect(() => {
    setPinned(currentWorkspace?.pinned ?? false);
  }, [currentWorkspace]);

  const togglePin = async () => {
    fetch(`${useApiHost()}/workspace/${workspaceId}/pin`, {
      method: "PUT",
      body: JSON.stringify({ id: workspaceId, pin: !pinned }),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        notification.success({ message: "Ghim bảng công việc thành công!" });

        setWorkspaces((prev) => {
          const updatedWorkspaces = prev.map((ws) =>
            ws.id === currentWorkspace?.id ? { ...ws, pinned: !pinned } : ws
          );

          return [...updatedWorkspaces].sort((a, b) => {
            if (a.pinned === b.pinned) return 0;
            return a.pinned ? -1 : 1;
          });
        });

        return response.json();
      })
      .then(() => {
        setPinned(!pinned);
      })
      .catch(() => {
        notification.error({ message: "Lỗi khi cập nhật trạng thái ghim" });
      });
  };

  return (
    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 sm:px-6 pt-4 pb-3">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        <div className="group relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00B4B6] to-teal-500 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>

          <div className="relative bg-gradient-to-r from-[#00B4B6] to-teal-500 rounded-xl shadow-lg px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 text-white font-bold text-base sm:text-lg border border-white/10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span className="truncate max-w-[150px] sm:max-w-none">{workspaceData?.name}</span>
            <span style={{ fontSize: 10, fontWeight: 300, fontStyle: "italic" }}>{workspaceData?.address}</span>
            <Button
              onClick={togglePin}
              style={{ padding: 0, background: "none", border: "none", color: "yellow" }}
            >
              {pinned ? <StarFilled /> : <StarOutlined />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
