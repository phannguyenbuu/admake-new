import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Signboard3DModel } from "../../services/genaiSignboard.service";
import { buildSignboardObjects, computeFit, type CameraFit } from "./signboardMeshBuilder";
import { useEditor3DControls } from "./editor3d/useEditor3DControls";
import type { TransformMode, CoordinateSpace, SelectedMeshInfo, Text3DParams } from "./editor3d/editorTypes";

interface Signboard3DCanvasProps {
  model: Signboard3DModel | null;
  onSnapshot?: (base64Image: string) => void;
  className?: string;
  paused?: boolean;
  onSelectionChange?: (sel: SelectedMeshInfo | null) => void;
  externalMode?: TransformMode;
  externalSpace?: CoordinateSpace;
  externalSnap?: boolean;
  timeOfDay?: string;
  lightDirection?: string;
  environmentType?: string;
}

export interface Signboard3DCanvasHandle {
  captureSnapshot: (quality?: number) => string | null;
  setMode: (mode: TransformMode) => void;
  setSpace: (space: CoordinateSpace) => void;
  setSnap: (snap: boolean) => void;
  updateTransform: (pos: [number, number, number], rot: [number, number, number], scale: [number, number, number]) => void;
  applyMaterialToSelection: (materialId: string) => void;
  updateMaterialProperties: (props: { roughness?: number; metalness?: number; transmission?: number; textureUrl?: string }) => void;
  openAddTextModal: () => void;
  openEditTextModal: () => void;
  updateTextParams: (params: Text3DParams) => void;
  setSnapToSurface: (snap: boolean) => void;
  deleteSelected: () => void;
  resetTransform: () => void;
  undo: () => void;
  deselect: () => void;
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = (mesh as any).material as THREE.Material | THREE.Material[] | undefined;
    const disposeMat = (m: THREE.Material) => {
      const map = (m as THREE.MeshBasicMaterial).map;
      if (map) map.dispose();
      m.dispose();
    };
    if (Array.isArray(mat)) mat.forEach(disposeMat);
    else if (mat) disposeMat(mat);
  });
}

export const Signboard3DCanvas = forwardRef<Signboard3DCanvasHandle, Signboard3DCanvasProps>(({
  model,
  onSnapshot,
  className = "w-full h-full",
  paused = false,
  onSelectionChange,
  externalMode,
  externalSpace,
  externalSnap,
  timeOfDay = "buổi chiều",
  lightDirection = "tây nam",
  environmentType = "đô thị lớn",
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const fitRef = useRef<CameraFit | null>(null);
  const lastFitModelRef = useRef<Signboard3DModel | null>(null);
  const pausedRef = useRef<boolean>(paused);
  pausedRef.current = paused;

  const [nightMode, setNightMode] = useState<boolean>(false);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [sceneContext, setSceneContext] = useState<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    meshGroup: THREE.Group;
  } | null>(null);

  // Hook quản lý Bộ 3D Editor 3ds Max
  const editor = useEditor3DControls({
    scene: sceneContext?.scene || null,
    camera: sceneContext?.camera || null,
    renderer: sceneContext?.renderer || null,
    controls: sceneContext?.controls || null,
    meshGroup: sceneContext?.meshGroup || null,
    onSelectionChange,
    externalMode,
    externalSpace,
    externalSnap,
  });

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

    // 3b. Môi trường phản chiếu HDR Studio (giúp Inox Vàng Gương óng ánh như gương thật)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;
    controls.minDistance = 0.2;
    controlsRef.current = controls;

    // 5. Grid Helper
    const grid = new THREE.GridHelper(30, 30, "#cbd5e1", "#e2e8f0");
    grid.position.y = -0.01;
    scene.add(grid);
    gridRef.current = grid;

    // 5b. Gốc tọa độ 3 chiều xyz màu xám nhỏ mỏng, chiều dài bằng 1/3 gizmo (~0.28m)
    const originAxes = new THREE.Group();
    const axisMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.85 });
    const geoX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.001, 0), new THREE.Vector3(0.28, 0.001, 0)]);
    const geoY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.001, 0), new THREE.Vector3(0, 0.28, 0)]);
    const geoZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.001, 0), new THREE.Vector3(0, 0.001, 0.28)]);
    originAxes.add(new THREE.Line(geoX, axisMat));
    originAxes.add(new THREE.Line(geoY, axisMat));
    originAxes.add(new THREE.Line(geoZ, axisMat));
    originAxes.userData.isHelper = true;
    scene.add(originAxes);

    // 6. Nhóm chứa các elements của mô hình
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;
    setSceneContext({ scene, camera, renderer, controls, meshGroup });

    // 7. Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (pausedRef.current) return;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
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
      setSceneContext(null);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      disposeObject3D(scene);
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      meshGroupRef.current = null;
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật Ánh sáng & Môi trường 3D thời gian thực theo Dropdown (Thời điểm, Hướng, Bối cảnh)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 1. Xóa các đèn cũ (chỉ giữ lại mesh và helper)
    const existingLights = scene.children.filter((c) => c instanceof THREE.Light);
    existingLights.forEach((l) => scene.remove(l));

    // 2. Tính tọa độ hướng ánh sáng (Azimuth Angle)
    const dirLower = (lightDirection || "tây nam").toLowerCase();
    let sunX = -9;
    let sunZ = 9;

    if (dirLower.includes("đông nam")) { sunX = 9; sunZ = 9; }
    else if (dirLower.includes("đông bắc")) { sunX = 9; sunZ = -9; }
    else if (dirLower.includes("tây bắc")) { sunX = -9; sunZ = -9; }
    else if (dirLower.includes("tây nam")) { sunX = -9; sunZ = 9; }
    else if (dirLower.includes("đông")) { sunX = 12; sunZ = 0; }
    else if (dirLower.includes("tây")) { sunX = -12; sunZ = 0; }
    else if (dirLower.includes("nam")) { sunX = 0; sunZ = 12; }
    else if (dirLower.includes("bắc")) { sunX = 0; sunZ = -12; }

    // 3. Xác định profile thời điểm chiếu sáng
    const tod = (timeOfDay || "buổi chiều").toLowerCase();
    const isNightExplicit = tod.includes("tối") || tod.includes("đêm") || nightMode;
    const isMoon = tod.includes("trăng");

    let skyColor = "#f8fafc", fogColor = "#f1f5f9", fogDensity = 0.005;
    let ambColor = "#ffffff", ambIntensity = 0.9, sunColor = "#fffdf0", sunIntensity = 2.2, sunY = 8;
    let rimColor = "#fef08a", rimIntensity = 1.2, envIntensity = 1.0;
    let enableSpotlights = false, enableNightGlow = false;

    if (tod.includes("bình minh")) {
      skyColor = "#ffedd5"; fogColor = "#fed7aa"; fogDensity = 0.012; ambColor = "#ffedd5"; ambIntensity = 0.8;
      sunColor = "#fb923c"; sunIntensity = 2.3; sunY = 4; rimColor = "#f43f5e"; rimIntensity = 1.5; envIntensity = 0.85;
    } else if (tod.includes("buổi sáng")) {
      skyColor = "#e0f2fe"; fogColor = "#bae6fd"; fogDensity = 0.006; ambColor = "#e0f2fe"; ambIntensity = 0.95;
      sunColor = "#fffbeb"; sunIntensity = 2.4; sunY = 10; rimColor = "#fde047"; rimIntensity = 1.0; envIntensity = 1.1;
    } else if (tod.includes("buổi trưa")) {
      skyColor = "#f0f9ff"; fogColor = "#e2e8f0"; fogDensity = 0.003; ambColor = "#ffffff"; ambIntensity = 1.15;
      sunColor = "#ffffff"; sunIntensity = 2.8; sunY = 16; sunX *= 0.5; sunZ *= 0.5; rimColor = "#ffffff"; rimIntensity = 0.8; envIntensity = 1.35;
    } else if (tod.includes("buổi chiều")) {
      skyColor = "#fef3c7"; fogColor = "#fde68a"; fogDensity = 0.008; ambColor = "#fef3c7"; ambIntensity = 0.85;
      sunColor = "#f59e0b"; sunIntensity = 2.4; sunY = 6.5; rimColor = "#fbbf24"; rimIntensity = 1.3; envIntensity = 0.95;
    } else if (tod.includes("hoàng hôn")) {
      skyColor = "#31102f"; fogColor = "#4a044e"; fogDensity = 0.015; ambColor = "#701a75"; ambIntensity = 0.65;
      sunColor = "#ea580c"; sunIntensity = 2.6; sunY = 2.2; rimColor = "#f97316"; rimIntensity = 1.6; envIntensity = 0.7;
      enableSpotlights = true; enableNightGlow = true;
    } else if (isMoon) {
      skyColor = "#03071e"; fogColor = "#0f172a"; fogDensity = 0.018; ambColor = "#1e293b"; ambIntensity = 0.45;
      sunColor = "#bfdbfe"; sunIntensity = 1.6; sunY = 12; rimColor = "#93c5fd"; rimIntensity = 0.8; envIntensity = 0.35;
      enableSpotlights = true; enableNightGlow = true;
    } else if (isNightExplicit) {
      skyColor = "#020617"; fogColor = "#090d16"; fogDensity = 0.02; ambColor = "#0f172a"; ambIntensity = 0.35;
      sunColor = "#334155"; sunIntensity = 0.4; sunY = 5; rimColor = "#1e293b"; rimIntensity = 0.3; envIntensity = 0.25;
      enableSpotlights = true; enableNightGlow = true;
    }

    // 4. Áp dụng bầu trời & sương mù không khí
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    if ("environmentIntensity" in scene) {
      (scene as any).environmentIntensity = envIntensity;
    }

    // 5. Thêm đèn Ambient
    scene.add(new THREE.AmbientLight(ambColor, ambIntensity));

    // 6. Thêm Đèn Mặt Trời / Mặt Trăng
    const sunLight = new THREE.DirectionalLight(sunColor, sunIntensity);
    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 7. Thêm Rim Light ngược hướng
    const rimLight = new THREE.DirectionalLight(rimColor, rimIntensity);
    rimLight.position.set(-sunX * 0.8, sunY * 0.75, -sunZ * 0.8);
    scene.add(rimLight);

    // 8. Đèn SpotLight chiếu rọi biển quảng cáo vào ban đêm / hoàng hôn
    if (enableSpotlights) {
      const spot1 = new THREE.SpotLight("#ffffff", 4.5);
      spot1.position.set(-3.5, 5, 3.5);
      spot1.angle = Math.PI / 4;
      spot1.penumbra = 0.4;
      scene.add(spot1);

      const spot2 = new THREE.SpotLight("#ffffff", 4.5);
      spot2.position.set(3.5, 5, 3.5);
      spot2.angle = Math.PI / 4;
      spot2.penumbra = 0.4;
      scene.add(spot2);
    }

    // 9. Đèn Neon / LED phát quang hắt sáng chữ nổi khi trời tối
    if (enableNightGlow) {
      const ledGlow = new THREE.PointLight("#fbbf24", 3.0, 12);
      ledGlow.position.set(0, 1.8, 1.5);
      scene.add(ledGlow);
    }

    // 10. Đổi màu lưới nền Ground Grid theo bối cảnh môi trường
    const grid = gridRef.current;
    if (grid) {
      const envLower = (environmentType || "đô thị lớn").toLowerCase();
      let gridCenterColor = "#94a3b8";
      let gridGridColor = "#cbd5e1";

      if (envLower.includes("lúa") || envLower.includes("cỏ")) {
        gridCenterColor = isNightExplicit ? "#14532d" : "#65a30d";
        gridGridColor = isNightExplicit ? "#052e16" : "#a3e635";
      } else if (envLower.includes("rừng")) {
        gridCenterColor = isNightExplicit ? "#064e3b" : "#15803d";
        gridGridColor = isNightExplicit ? "#022c22" : "#22c55e";
      } else if (envLower.includes("lộ") || envLower.includes("cao tốc")) {
        gridCenterColor = isNightExplicit ? "#1e293b" : "#475569";
        gridGridColor = isNightExplicit ? "#0f172a" : "#64748b";
      } else if (isNightExplicit) {
        gridCenterColor = "#1e293b";
        gridGridColor = "#0f172a";
      }

      const colors = grid.geometry.attributes.color;
      if (colors) {
        const cCenter = new THREE.Color(gridCenterColor);
        const cGrid = new THREE.Color(gridGridColor);
        for (let i = 0; i < colors.count; i++) {
          const c = i < colors.count / 10 ? cCenter : cGrid;
          colors.setXYZ(i, c.r, c.g, c.b);
        }
        colors.needsUpdate = true;
      }
    }
  }, [timeOfDay, lightDirection, environmentType, nightMode]);

  // Căn camera theo khung bao thực tế của mô hình
  const placeCamera = useCallback((angle: "perspective" | "front" | "top") => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const fit = fitRef.current;
    if (!camera || !controls || !fit) return;
    const { center, dist } = fit;
    if (angle === "front") {
      camera.position.set(center.x, center.y, center.z + dist);
    } else if (angle === "top") {
      camera.position.set(center.x, center.y + dist, center.z + 0.01);
    } else {
      const dir = new THREE.Vector3(0.55, 0.35, 1).normalize().multiplyScalar(dist);
      camera.position.copy(center).add(dir);
    }
    controls.target.copy(center);
    controls.update();
  }, []);

  // Cập nhật Mô hình 3D (Mesh Elements)
  useEffect(() => {
    const group = meshGroupRef.current;
    if (!group) return;

    editor.onDeselect();

    const old = [...group.children];
    old.forEach((obj) => {
      disposeObject3D(obj);
      group.remove(obj);
    });

    if (!model || !model.elements || model.elements.length === 0) {
      return;
    }

    buildSignboardObjects(model, wireframeMode, nightMode).forEach((o) => group.add(o));

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      const fit = computeFit(group, camera.fov);
      fitRef.current = fit;
      controls.maxDistance = Math.max(50, fit.dist * 4);
      camera.far = Math.max(1000, fit.dist * 20);
      camera.updateProjectionMatrix();
      const grid = gridRef.current;
      if (grid) {
        const s = Math.max(1, Math.ceil((fit.maxDim * 2.5) / 30));
        grid.scale.set(s, 1, s);
        grid.position.set(fit.center.x, -0.01, fit.center.z);
      }
      const modelChanged = !lastFitModelRef.current || lastFitModelRef.current.name !== model?.name;
      lastFitModelRef.current = model;
      if (modelChanged) {
        placeCamera("perspective");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, wireframeMode, nightMode]);

  // Expose các phương thức điều khiển 3D ra ngoài ref cho cột trái
  useImperativeHandle(ref, () => ({
    captureSnapshot: (quality = 0.85) => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return null;
      try {
        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL("image/jpeg", quality);
        if (onSnapshot) onSnapshot(dataUrl);
        return dataUrl;
      } catch (err) {
        console.warn("[Signboard3DCanvas] Không chụp được snapshot:", err);
        return null;
      }
    },
    setMode: editor.setMode,
    setSpace: editor.setSpace,
    setSnap: editor.setSnap,
    updateTransform: editor.updateTransform,
    applyMaterialToSelection: editor.applyMaterialToSelection,
    updateMaterialProperties: editor.updateMaterialProperties,
    openAddTextModal: editor.openAddTextModal,
    openEditTextModal: editor.openEditTextModal,
    updateTextParams: editor.updateTextParams,
    setSnapToSurface: editor.setSnapToSurface,
    deleteSelected: editor.deleteSelected,
    resetTransform: editor.resetTransform,
    undo: editor.undo,
    deselect: editor.onDeselect,
  }), [editor, onSnapshot]);

  return (
    <div className="relative w-full h-full overflow-hidden border-0 group select-none">
      {/* Three.js Canvas Container - Hoàn toàn thông thoáng không bị che khuất */}
      <div
        ref={mountRef}
        className={className}
        onPointerDown={editor.handlePointerDown}
        onPointerUp={editor.handlePointerUp}
      />
    </div>
  );
});

Signboard3DCanvas.displayName = "Signboard3DCanvas";
