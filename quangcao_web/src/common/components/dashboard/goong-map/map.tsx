"use client";
import { useEffect, useState } from "react";
import { Modal, Tag, Spin, message } from "antd";
import MapGL, {
  Marker,
  NavigationControl,
  GeolocateControl,
  Popup,
} from "@goongmaps/goong-map-react";
import "@goongmaps/goong-js/dist/goong-js.css";

const MAP_STYLE = "https://tiles.goong.io/assets/goong_map_web.json";
const GOONG_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY as string;
const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY as string;

type Props = {
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  userName?: string;
  title?: string;
  height?: number | string;
  zoom?: number;
};

export default function LocationMapModal({
  open,
  onClose,
  lat,
  lng,
  userName = "Người dùng",
  title = "Vị trí trên bản đồ",
  height = 500,
  zoom = 16,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState<string>("Đang tải địa chỉ…");
  const [showPopup, setShowPopup] = useState(true);

  // ép kiểu toạ độ an toàn
  const safeLng = Number.isFinite(lng) ? lng : 106.70098;
  const safeLat = Number.isFinite(lat) ? lat : 10.77689;

  const [viewport, setViewport] = useState({
    width: "100%",
    height,
    longitude: safeLng,
    latitude: safeLat,
    zoom,
  });

  useEffect(() => setMounted(true), []);

  // sync khi props đổi + lấy địa chỉ
  useEffect(() => {
    setViewport((v) => ({
      ...v,
      width: "100%",
      height,
      longitude: safeLng,
      latitude: safeLat,
      zoom,
      transitionDuration: 500,
    }));

    if (GOONG_API_KEY) {
      fetch(
        `https://rsapi.goong.io/geocode?latlng=${safeLat},${safeLng}&api_key=${GOONG_API_KEY}`
      )
        .then((r) => r.json())
        .then((d) => {
          setAddress(
            d?.results?.[0]?.formatted_address || "Không tìm thấy địa chỉ"
          );
        })
        .catch(() => setAddress("Lỗi khi lấy địa chỉ"));
    } else {
      setAddress("Thiếu VITE_GOONG_MAPTILES_KEY");
    }
  }, [safeLat, safeLng, height, zoom]);

  const coordsText = `${safeLat.toFixed(6)}, ${safeLng.toFixed(6)}`;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title={<div className="text-lg font-semibold">{title}</div>}
      destroyOnHidden
    >
      {!GOONG_KEY ? (
        <div className="p-4 border border-amber-300 bg-amber-50 text-amber-800">
          Thiếu cấu hình <code>VITE_GOONG_MAPTILES_KEY</code>
        </div>
      ) : !mounted ? (
        <Spin />
      ) : (
        <div className="w-full rounded-xl overflow-hidden border border-slate-200">
          <MapGL
            {...viewport}
            onViewportChange={(v: any) => setViewport(v)}
            mapStyle={MAP_STYLE}
            goongApiAccessToken={GOONG_KEY}
            touchAction="pan-y"
            getCursor={(s: any) =>
              s.isDragging ? "grabbing" : s.isHovering ? "pointer" : "grab"
            }
          >
            {/* ===== Pin đỏ kiểu Google – dùng offsetLeft/offsetTop để neo đáy ===== */}
            <Marker
              longitude={safeLng}
              latitude={safeLat}
              offsetLeft={-18} // nửa width (SVG 36px)
              offsetTop={-36} // full height
            >
              <div
                onClick={() => setShowPopup(true)}
                title="Bấm để xem thông tin"
                style={{ cursor: "pointer", position: "relative" }}
              >
                {/* bóng elip */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: -8,
                    transform: "translateX(-50%)",
                    width: 24,
                    height: 6,
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: 999,
                    filter: "blur(1px)",
                    pointerEvents: "none",
                  }}
                />
                {/* pin đỏ */}
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7z"
                    fill="#EA4335"
                  />
                  <circle cx="12" cy="9" r="3.2" fill="#fff" />
                </svg>
              </div>
            </Marker>

            {/* Popup thông tin */}
            {showPopup && (
              // neo ở trên đầu phần ghim Marker
              <Popup
                longitude={safeLng}
                latitude={safeLat}
                closeOnClick={false}
                onClose={() => setShowPopup(false)}
                anchor="top" // neo ở trên đầu phần ghim Marker
              >
                <div className="text-sm">
                  <div className="font-semibold">{userName}</div>
                  <div>{coordsText}</div>
                  <div className="mt-1">{address}</div>
                </div>
              </Popup>
            )}

            {/* Điều khiển zoom */}
            <NavigationControl
              style={{ right: 10, bottom: 35 }}
              showZoom
              showCompass={false}
            />

            {/* Nút định vị + chấm xanh */}
            <GeolocateControl
              style={{ right: 10, bottom: 100 }}
              positionOptions={{ enableHighAccuracy: true }}
              trackUserLocation
              showUserLocation
              onGeolocate={(pos: any) => {
                const { longitude, latitude } = pos.coords;
                setViewport((v) => ({
                  ...v,
                  longitude,
                  latitude,
                  zoom: Math.max(v.zoom, 15),
                  transitionDuration: 500,
                }));
              }}
            />
          </MapGL>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {/* bấm sẽ copy và chuyển map về toạ độ này */}
        <Tag
          onClick={() => {
            navigator.clipboard.writeText(coordsText);
            message.success("Đã copy toạ độ");
            setViewport((v) => ({
              ...v,
              longitude: safeLng,
              latitude: safeLat,
              zoom: 16,
              transitionDuration: 500,
            }));
          }}
          className="cursor-pointer"
        >
          {coordsText}
        </Tag>
        {/* <Button
          type="primary"
          href={`https://www.google.com/maps?q=${safeLat},${safeLng}`}
          target="_blank"
        >
          Xem trên Google Maps
        </Button> */}
      </div>
    </Modal>
  );
}
