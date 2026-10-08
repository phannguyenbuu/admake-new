import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Signboard3DModel, Mesh3DElement } from "../../services/genaiSignboard.service";
import { Button, Tooltip } from "antd";
import {
  RedoOutlined,
  EyeOutlined,
  CameraOutlined,
  BulbOutlined,
  ExpandOutlined,
} from "@ant-design/icons";

interface Signboard3DCanvasProps {
  model: Signboard3DModel | null;
  onSnapshot?: (base64Image: string) => void;
  className?: string;
}

export const Signboard3DCanvas: React.FC<Signboard3DCanvasProps> = ({
  model,
  onSnapshot,
  className = "w-full h-full",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  const [nightMode, setNightMode] = useState<boolean>(false);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [viewAngle, setViewAngle] = useState<"perspective" | "front" | "top">("perspective");

  // Khởi tạo Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(nightMode ? "#0f172a" : "#f8fafc");
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;
    controls.minDistance = 1;
    controlsRef.current = controls;

    // 5. Grid Helper
    const grid = new THREE.GridHelper(30, 30, "#cbd5e1", "#e2e8f0");
    grid.position.y = -0.01;
    scene.add(grid);

    // 6. Nhóm chứa các elements của mô hình
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // 7. Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler with ResizeObserver for true container responsiveness
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  // Cập nhật Ánh sáng theo chế độ Ngày / Đêm
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Xóa đèn cũ
    const existingLights = scene.children.filter((c) => c instanceof THREE.Light);
    existingLights.forEach((l) => scene.remove(l));

    if (nightMode) {
      scene.background = new THREE.Color("#020617");

      // Ambient mờ ban đêm
      const ambLight = new THREE.AmbientLight("#1e293b", 0.4);
      scene.add(ambLight);

      // Đèn vàng rực rỡ từ LED chữ nổi & đèn pha
      const ledGlow = new THREE.PointLight("#fbbf24", 3.5, 15);
      ledGlow.position.set(0, 1.5, 2.5);
      scene.add(ledGlow);

      const spot1 = new THREE.SpotLight("#ffffff", 4);
      spot1.position.set(-4, 5, 4);
      spot1.angle = Math.PI / 4;
      spot1.penumbra = 0.5;
      scene.add(spot1);

      const spot2 = new THREE.SpotLight("#ffffff", 4);
      spot2.position.set(4, 5, 4);
      spot2.angle = Math.PI / 4;
      spot2.penumbra = 0.5;
      scene.add(spot2);
    } else {
      scene.background = new THREE.Color("#f8fafc");

      // Ambient tự nhiên ban ngày
      const ambLight = new THREE.AmbientLight("#ffffff", 0.85);
      scene.add(ambLight);

      // Ánh nắng mặt trời dịu nhẹ
      const dirLight = new THREE.DirectionalLight("#fffbeb", 1.8);
      dirLight.position.set(8, 12, 8);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      // Fill light góc đối diện
      const fillLight = new THREE.DirectionalLight("#e2e8f0", 0.6);
      fillLight.position.set(-8, 6, -8);
      scene.add(fillLight);
    }
  }, [nightMode]);

  // Cập nhật Mô hình 3D (Mesh Elements)
  useEffect(() => {
    const group = meshGroupRef.current;
    if (!group) return;

    // Xóa mesh cũ
    while (group.children.length > 0) {
      const obj = group.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
      group.remove(obj);
    }

    if (!model || !model.elements || model.elements.length === 0) {
      // Mô hình demo mặc định nếu chưa có
      const defaultGeo = new THREE.BoxGeometry(4, 1.8, 0.2);
      const defaultMat = new THREE.MeshStandardMaterial({
        color: "#0891b2",
        roughness: 0.3,
        metalness: 0.2,
      });
      const defaultMesh = new THREE.Mesh(defaultGeo, defaultMat);
      defaultMesh.position.y = 1.2;
      group.add(defaultMesh);
      return;
    }

    // Duyệt và dựng từng element trong model
    model.elements.forEach((el: Mesh3DElement) => {
      let geo: THREE.BufferGeometry;
      const [sx, sy, sz] = el.scale;

      if (el.type === "cylinder") {
        const radius = Math.max(0.05, sx / 2);
        geo = new THREE.CylinderGeometry(radius, radius, sy, 24);
      } else if (el.type === "sphere") {
        geo = new THREE.SphereGeometry(Math.max(0.1, sx / 2), 24, 24);
      } else {
        // Mặc định là box
        geo = new THREE.BoxGeometry(sx, sy, sz);
      }

      const isLedGlowing =
        nightMode &&
        (el.name.toLowerCase().includes("led") ||
          el.name.toLowerCase().includes("chữ") ||
          el.color === "#f59e0b" ||
          el.color === "#ffffff");

      const mat = new THREE.MeshStandardMaterial({
        color: el.color || "#475569",
        wireframe: wireframeMode,
        roughness: 0.35,
        metalness: el.name.toLowerCase().includes("sắt") ? 0.6 : 0.2,
        emissive: isLedGlowing ? new THREE.Color(el.color || "#f59e0b") : new THREE.Color("#000000"),
        emissiveIntensity: isLedGlowing ? 1.5 : 0,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const [px, py, pz] = el.position;
      mesh.position.set(px, py + 1.5, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      group.add(mesh);
    });

    // Căn chỉnh camera theo kích thước thực tế
    if (cameraRef.current && controlsRef.current) {
      const maxDim = Math.max(model.dimensions.width, model.dimensions.height);
      const dist = Math.max(5, maxDim * 1.6);
      cameraRef.current.position.set(0, maxDim * 0.4 + 1.5, dist);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  }, [model, wireframeMode, nightMode]);

  // Đổi góc nhìn nhanh
  const setCameraAngle = useCallback((angle: "perspective" | "front" | "top") => {
    if (!cameraRef.current || !controlsRef.current || !model) return;
    const maxDim = Math.max(model.dimensions?.width || 5, model.dimensions?.height || 2);
    setViewAngle(angle);

    if (angle === "front") {
      cameraRef.current.position.set(0, 1.5, maxDim * 1.5);
      controlsRef.current.target.set(0, 1.5, 0);
    } else if (angle === "top") {
      cameraRef.current.position.set(0, maxDim * 2, 0.01);
      controlsRef.current.target.set(0, 1.5, 0);
    } else {
      cameraRef.current.position.set(maxDim * 0.9, maxDim * 0.7 + 1.5, maxDim * 1.3);
      controlsRef.current.target.set(0, 1.5, 0);
    }
    controlsRef.current.update();
  }, [model]);

  // Chụp ảnh snapshot góc nhìn 3D hiện tại làm ảnh tham chiếu cho GenAI
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    if (onSnapshot) {
      onSnapshot(dataUrl);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden border-0 group select-none">
      {/* Three.js Canvas Container - Full Bleed */}
      <div ref={mountRef} className={className} />

      {/* Floating Control Toolbar (Nền xanh rêu Admake, opacity 75%) */}
      <div
        className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl border border-white/30 shadow-lg text-white backdrop-blur-md"
        style={{ backgroundColor: "rgba(0, 180, 182, 0.75)" }}
      >
        <Tooltip title={nightMode ? "Chuyển sang Ban Ngày" : "Bật Chế Độ Đêm (LED Phát Sáng)"}>
          <button
            type="button"
            onClick={() => setNightMode(!nightMode)}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              nightMode
                ? "bg-amber-400 text-slate-900 shadow-xs"
                : "text-white/90 hover:text-white hover:bg-white/20"
            }`}
          >
            <BulbOutlined />
            <span className="hidden sm:inline">{nightMode ? "Đêm (LED)" : "Ngày"}</span>
          </button>
        </Tooltip>

        <Tooltip title={wireframeMode ? "Xem Bề Mặt Phủ" : "Xem Khung Xương Đan Ô"}>
          <button
            type="button"
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              wireframeMode
                ? "bg-white text-[#006e70] shadow-xs"
                : "text-white/90 hover:text-white hover:bg-white/20"
            }`}
          >
            <EyeOutlined />
            <span className="hidden sm:inline">Khung Sắt</span>
          </button>
        </Tooltip>

        <div className="w-[1px] h-4 bg-white/30 mx-0.5" />

        <Tooltip title="Góc nhìn chính diện">
          <button
            type="button"
            onClick={() => setCameraAngle("front")}
            className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
              viewAngle === "front"
                ? "bg-white text-[#006e70] shadow-xs"
                : "text-white/90 hover:text-white hover:bg-white/20"
            }`}
          >
            Mặt
          </button>
        </Tooltip>

        <Tooltip title="Góc nhìn phối cảnh 3D">
          <button
            type="button"
            onClick={() => setCameraAngle("perspective")}
            className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
              viewAngle === "perspective"
                ? "bg-white text-[#006e70] shadow-xs"
                : "text-white/90 hover:text-white hover:bg-white/20"
            }`}
          >
            3D
          </button>
        </Tooltip>

        <Tooltip title="Chụp ảnh góc 3D này làm mẫu cho GenAI">
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1 transition-all shadow-xs cursor-pointer border-none"
          >
            <CameraOutlined />
            <span className="hidden sm:inline">Lấy Mẫu 3D</span>
          </button>
        </Tooltip>
      </div>

      {/* Guide hint at bottom-left (Nền xanh rêu Admake, opacity 75%) */}
      <div
        className="absolute bottom-18 sm:bottom-16 left-3.5 z-20 text-[10px] sm:text-[11px] text-white font-medium px-2.5 py-1 rounded-lg border border-white/25 shadow-md backdrop-blur-md pointer-events-none"
        style={{ backgroundColor: "rgba(0, 180, 182, 0.75)" }}
      >
        Chuột trái: Xoay 360° • Cuộn chuột: Phóng to/Thu nhỏ • Chuột phải: Di chuyển
      </div>
    </div>
  );
};
