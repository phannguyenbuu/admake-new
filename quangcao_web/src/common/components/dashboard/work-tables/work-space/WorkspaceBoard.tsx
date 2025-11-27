import { useEffect, useState, useCallback, useContext } from "react";
import { Row, Col, Card, Button, message, Modal, notification } from "antd";
import { StarOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import type { ColumnType } from "../../../../@types/work-space.type";
import DragableTaskCard from "./DragableTaskCard";
import { useUser } from "../../../../common/hooks/useUser";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import columnThemes from "../theme.json";
import type { Task } from "../../../../@types/work-space.type";
import { UpdateButtonContext } from "../../../../common/hooks/useUpdateButtonTask";
import { useTaskContext } from "../../../../common/hooks/useTask";

interface WorkspaceBoardProps {
  columns: ColumnType[];
  onDragStart?: (initial: any) => void;
  onDragUpdate?: (update: any) => void;
  onDragEnd: (result: any) => void;
  isDragging?: boolean;
  currentColumn: number;
  setCurrentColumn: (col: number) => void;
  setShowFormTask: (show: boolean) => void;
}

const WorkspaceBoard: React.FC<WorkspaceBoardProps> = ({
  onDragStart,
  onDragUpdate,
  onDragEnd,
  isDragging,
  columns,
  currentColumn,
  setCurrentColumn,
  setShowFormTask
}) => {
    
    const {taskDetail, setTaskDetail} = useTaskContext();
    // const {currentColumn, setCurrentColumn} = useState<number>(0);
    const {workspaces, workspaceId, setWorkspaces, currentWorkspace, isCurrentWorkspaceFree} = useUser();
    
    const [colNames, setColNames] = useState<string[]>(fixedColumns.map(col => col.title));

    

    const updateColumnName = (names:string[]) => {
        setWorkspaces(prev =>
            prev.map(ws => {
            if (ws.id === workspaceId) {
                // console.log('SAME', workspaceId, names);
                return {
                    ...ws,
                    column_open_name: names[0],
                    column_in_progress_name: names[1],
                    column_done_name: names[2],
                    column_reward_name: names[3],
                };
            }
            return ws;
            })
        );
    }

    useEffect(()=>
    {
        if (!workspaces) return;
        const w = workspaces.find(ws => ws.id === workspaceId);
        // console.log('W', w);
        if (!w) return;

        // console.log('WH', w.column_open_name,
        //     w.column_in_progress_name, 
        //     w.column_done_name, 
        //     w.column_reward_name);

        const ls = [w.column_open_name,
            w.column_in_progress_name, 
            w.column_done_name, 
            w.column_reward_name];

        setColNames(ls);
        updateColumnName(ls);
        
    },[workspaceId]);

    
    useEffect(()=>
    {
        updateColumnName(colNames);
       
    },[colNames]);



    return (
    <div className="relative z-10 px-4 sm:px-6 pt-3">
            <DragDropContext
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
            // sensors={adminMode ? undefined : []}
            >
            <Row gutter={[12, 12]} wrap={false} className="pb-6 overflow-x-auto">
                {columns.map((col, colIdx) => {
                // Column color themes
                const theme = columnThemes[colIdx];

                return (
                    <Col
                    key={col.id}
                    className="flex-shrink-0 min-w-[380px] sm:min-w-[260px] max-w-[420px] sm:max-w-[280px]"
                    >
                    <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                        <div className="group relative">
                            {/* Enhanced Column Card */}
                            <Card
                            title={
                                <div className="flex items-center justify-between !text-white !text-sm font-semibold">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                        className="w-2 h-2 bg-white/30 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: "rgba(255,255,255,0.3)",
                                        }}
                                        ></div>
                                        <span className="truncate">{colNames[colIdx]}</span>
                                        <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold border border-white/5 flex-shrink-0">
                                        {/* @ts-ignore */}
                                        {col.tasks.length}
                                        </div>
                                    </div>
                                    {/* <MoreOutlined className="cursor-pointer hover:bg-white/20 rounded-md p-1.5 transition-all duration-200 flex-shrink-0" /> */}
                                    <MoreOptionsModal type={col.type} setColNames={setColNames} idx={colIdx}/>
                                </div>
                            }
                            className={`relative w-full transition-all duration-300 ease-out !border-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                                snapshot.isDraggingOver
                                ? "scale-102 shadow-xl"
                                : "scale-100"
                            } ${col.type === "REWARD" ? "reward-column" : ""}`}
                            style={{
                                background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                                borderRadius: "20px",
                                overflow: "hidden",
                            }}
                            styles={{
                                body: {
                                background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                                padding: "12px",
                                minHeight: "120px",
                                border: "none",
                                },
                                // @ts-ignore
                                Board: {
                                    background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`,
                                    borderRadius: "20px 20px 0 0",
                                    border: "none",
                                    boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
                                },
                            }}
                            >
                            {/* Tasks Container */}
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`!outline-transparent min-h-[120px] transition-all duration-200 ease-in-out rounded-xl ${
                                snapshot.isDraggingOver
                                    ? `${theme.bg} border-2 border-dashed border-gray-200/50 p-2 transform scale-[1.01] backdrop-blur-sm`
                                    : "transform scale-100"
                                }`}
                            >
                                {/* @ts-ignore */}
                                {col.tasks.map((task, idx) => 
                                <DragableTaskCard 
                                                    key={`${idx}`}
                                                    task = {task}
                                                    col = {col}
                                                    idx = {idx}
                                                    theme = {theme}
                                                    // @ts-ignore
                                                    isDragging = {isDragging}
                                                    // @ts-ignore
                                                    setShowFormTask={setShowFormTask}
                                />
                                )}
                                {provided.placeholder}

                                {/* Add Task Button */}
                                {(colIdx === 0 || isCurrentWorkspaceFree ) && (
                                <Button
                                    block
                                    icon={<PlusOutlined />}
                                    className="group/btn relative h-8 sm:h-10 !border-2 !border-dashed !border-white/40 hover:!border-white/70 !bg-transparent hover:!bg-white/20 !text-white hover:!text-white !font-semibold !rounded-xl !mt-3 transition-all duration-200 transform hover:scale-[1.01] backdrop-blur-sm"
                                    onClick={() => {
                                        setCurrentColumn(isCurrentWorkspaceFree ? colIdx : 0);
                                        setTaskDetail(null);
                                        
                                        setShowFormTask(true);
                                        const context = useContext(UpdateButtonContext);
                                        if (!context) 
                                            throw new Error("UpdateButtonContext not found");
                                        else
                                        {
                                          const { setShowUpdateButton } = context;
                                          setShowUpdateButton(0);
                                        }
                                      }}
                                    >
                                    <span className="relative z-10 flex items-center gap-2 text-xs sm:text-sm">
                                    Thêm thẻ mới
                                    </span>
                                    <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200"></div>
                                </Button>
                                )}
                            </div>
                            </Card>
                        </div>
                        )}
                    </Droppable>
                    </Col>
                );
                })}
            </Row>
            </DragDropContext>
        </div>
)}

export default WorkspaceBoard;


import { Input, Form } from "antd";
import { useApiHost } from "../../../../common/hooks/useApiHost";
import { fixedColumns } from "../Managerment";
interface MoreOptionsModalProps {
  type: string;
  idx: number;
  setColNames:React.Dispatch<React.SetStateAction<string[]>>;
}

const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({ type, idx, setColNames }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
    const {workspaceId} = useUser();

  // Mở modal
  const showModal = () => {
    setOpen(true);
  };

  // Đóng modal
  const handleCancel = () => {
    setOpen(false);
  };

  const updateColumnName = async (name: string) => {
    try {
        const response = await fetch(`${useApiHost()}/workspace/${workspaceId}/column_name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, name }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lỗi cập nhật: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        notification.success({message:'Cập nhật thành công:', description: result});

        setColNames(prev=>{
            const ar = [...prev];
            ar[idx] = name;
            return ar;
        })
    } catch (error) {
        notification.error({message:'Lỗi khi cập nhật tên cột:'});
        // Xử lý lỗi, ví dụ show notification
    }
    };


  // Xử lý submit form
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Form values:", values);
        setOpen(false);
        form.resetFields();
        
        updateColumnName(values.name);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <>
      <MoreOutlined
        onClick={showModal}
        style={{ fontSize: 24, cursor: "pointer" }}
        title="More options"
      />

      <Modal
        title="Nhập tên cột"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" name="form_in_modal">
          <Form.Item
            label=""
            name="name"
            rules={[{ required: true, message: "Sửa tên cột!" }]}
          >
            <Input placeholder="Nhập tên cột" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
