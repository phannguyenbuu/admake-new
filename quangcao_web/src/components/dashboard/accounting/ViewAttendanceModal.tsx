import React, { useMemo, useState } from "react";
import {
  Modal,
  Descriptions,
  Typography,
  Button,
  Tag,
  Divider,
  Empty,
} from "antd";
import type { AttendanceByKey } from "../../../@types/attendance.type";
import {
  EnvironmentOutlined,
  PictureOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { convertAttendanceStatus } from "../../../utils/convert.util";
<<<<<<< HEAD
import LocationMapModal from "../goong-map/map";
=======
// import LocationMapModal from "../goong-map/map";
>>>>>>> c0e8eb3d11debb508d0dbb29418540c6b17018be
import ImagePreviewModal from "../../modal/ImagePreviewModal";

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  onCancel: () => void;
  attendance: AttendanceByKey | null;
};

type Rec = AttendanceByKey["records"]["in"];

const fmtTime = (s?: string) =>
  s ? dayjs(s).format("HH:mm, DD/MM/YYYY") : "—";

const fmtLatLng = (n?: number) => (typeof n === "number" ? n.toFixed(6) : "—");

const statusColor = (st?: string) => {
  switch ((st || "").toUpperCase()) {
    case "OK":
    case "PRESENT":
      return "green";
    case "LATE":
    case "EARLY_LEAVE":
      return "orange";
    case "ABSENT":
    case "LACK":
      return "red";
    default:
      return "blue";
  }
};

export const ViewAttendanceModal: React.FC<Props> = ({
  open,
  onCancel,
  attendance,
}) => {
  // state cho popup map & ảnh
  const [mapOpen, setMapOpen] = useState(false);
  const [imgOpen, setImgOpen] = useState<null | { url: string; title: string }>(
    null
  );
  const [mapInfo, setMapInfo] = useState<{
    lat?: number;
    lng?: number;
    title?: string;
  }>({});

  const recIn: Rec | null = useMemo(
    () => (attendance?.records?.in ? attendance.records.in : null),
    [attendance]
  );
  const recOut: Rec | null = useMemo(
    () => (attendance?.records?.out ? attendance.records.out : null),
    [attendance]
  );

  const Header = (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white grid place-items-center">
        📆
      </div>
      <div>
        <Title level={5} className="!m-0">
          Chi tiết điểm danh
        </Title>
        <Text type="secondary" className="!text-xs">
          Ngày:{" "}
          {attendance?.date ? dayjs(attendance.date).format("DD/MM/YYYY") : "—"}
        </Text>
      </div>
    </div>
  );

  const RecordBlock: React.FC<{
    label: "Check-in" | "Check-out";
    rec: Rec | null;
  }> = ({ label, rec }) => {
    const title = `${
      label === "Check-in" ? "Điểm danh đến" : "Điểm danh về"
    } • ${fmtTime(rec?.time)}`;
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-100 grid place-items-center">
              {label === "Check-in" ? "🟢" : "🔴"}
            </div>
            <Text strong>
              {label === "Check-in" ? "Điểm danh đến" : "Điểm danh về"}
            </Text>
          </div>
          <Tag color={statusColor(rec?.status)}>
            {convertAttendanceStatus(rec?.status || "")}
          </Tag>
        </div>

        <Descriptions
          column={1}
          size="small"
          labelStyle={{ width: 120 }}
          contentStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item
            label={
              <>
                <span className="flex items-center gap-2 ml-1.5">
                  <FieldTimeOutlined />
                  <span className="text-sm font-semibold">Thời gian</span>
                </span>
              </>
            }
          >
            {fmtTime(rec?.time)}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <span className="flex items-center gap-2 ml-1.5">
                  <EnvironmentOutlined />
                  <span className="text-sm font-semibold">Toạ độ</span>
                </span>
              </>
            }
          >
            {fmtLatLng(rec?.latitude)}, {fmtLatLng(rec?.longitude)}
          </Descriptions.Item>

          {/* <Descriptions.Item label="Số phút (muộn/sớm/thiếu/OT)">
            <Space size={[8, 4]} wrap>
              <Tag color="orange">Muộn: {rec?.late ?? 0}</Tag>
              <Tag color="orange">Về sớm: {rec?.early_leave ?? 0}</Tag>
              <Tag color="red">Thiếu: {rec?.lack ?? 0}</Tag>
              <Tag color="cyan">OT: {rec?.overtime ?? 0}</Tag>
            </Space>
          </Descriptions.Item> */}
        </Descriptions>

        <div className="mt-8px mt-3 flex gap-8px gap-2">
          <Button
            icon={<PictureOutlined />}
            onClick={() => {
              if (rec?.image) setImgOpen({ url: rec.image, title });
            }}
            disabled={!rec?.image}
          >
            Xem ảnh
          </Button>

          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            onClick={() => {
              setMapInfo({
                lat: rec?.latitude,
                lng: rec?.longitude,
                title: `${
                  label === "Check-in"
                    ? "Vị trí điểm danh đến"
                    : "Vị trí điểm danh về"
                } - ${fmtTime(rec?.time)}`,
              });
              setMapOpen(true);
            }}
            disabled={
              typeof rec?.latitude !== "number" ||
              typeof rec?.longitude !== "number"
            }
          >
            Xem bản đồ
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={860}
        title={Header}
        destroyOnClose
      >
        {!attendance ? (
          <Empty description="Không có dữ liệu điểm danh" />
        ) : (
          <div className="flex justify-center items-center gap-3 ">
            <RecordBlock label="Check-in" rec={recIn} />
            <Divider className="!my-3" type="vertical" />
            <RecordBlock label="Check-out" rec={recOut} />
          </div>
        )}
      </Modal>

      {/* Map modal */}
      <LocationMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        lat={mapInfo.lat || 0}
        lng={mapInfo.lng || 0}
        title={mapInfo.title || "Vị trí điểm danh"}
        userName={
          (attendance as any)?.employee?.fullName ||
          (attendance as any)?.employee?.username ||
          "Nhân viên"
        }
      />

      {/* Image preview modal */}
      <ImagePreviewModal
        open={!!imgOpen}
        onCancel={() => setImgOpen(null)}
        imageUrl={imgOpen?.url}
        title={imgOpen?.title || "Ảnh điểm danh"}
        width={680}
        maxHeight={520}
      />
    </>
  );
};
