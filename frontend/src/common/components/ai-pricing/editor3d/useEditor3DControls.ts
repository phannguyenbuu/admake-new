/**
 * useEditor3DControls.ts - Custom Hook quản lý Bộ 3D Editor 3ds Max (TransformControls, Raycaster, Selection, Material)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TransformMode, CoordinateSpace, SelectedMeshInfo, Text3DParams } from "./editorTypes";
import { SIGNBOARD_MATERIALS, createEditorMaterial } from "./materialsCatalog";
import { build3DTextMesh } from "./text3dBuilder";
import { ensureCenterBottomPivot, generateBoxUVs } from "../signboardMeshBuilder";
import { message } from "antd";

interface UseEditor3DControlsProps {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
  meshGroup: THREE.Group | null;
  onSelectionChange?: (sel: SelectedMeshInfo | null) => void;
  externalMode?: TransformMode;
  externalSpace?: CoordinateSpace;
  externalSnap?: boolean;
}

export function useEditor3DControls({
  scene,
  camera,
  renderer,
  controls,
  meshGroup,
  onSelectionChange,
  externalMode,
  externalSpace,
  externalSnap,
}: UseEditor3DControlsProps) {
  const [mode, setMode] = useState<TransformMode>(externalMode || "translate");
  const [space, setSpace] = useState<CoordinateSpace>(externalSpace || "world");
  const [snap, setSnap] = useState<boolean>(Boolean(externalSnap));
  const [selection, setSelection] = useState<SelectedMeshInfo | null>(null);

  useEffect(() => { if (externalMode && externalMode !== mode) setMode(externalMode); }, [externalMode]);
  useEffect(() => { if (externalSpace && externalSpace !== space) setSpace(externalSpace); }, [externalSpace, space]);
  useEffect(() => { if (externalSnap !== undefined && externalSnap !== snap) setSnap(externalSnap); }, [externalSnap, snap]);
  useEffect(() => { onSelectionChange?.(selection); }, [selection, onSelectionChange]);

  const transformControlsRef = useRef<TransformControls | null>(null);
  const selectedObjectRef = useRef<THREE.Mesh | null>(null);
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const isDraggingGizmoRef = useRef<boolean>(false);
  const justDraggedGizmoRef = useRef<boolean>(false);
  const [snapToSurface, setSnapToSurface] = useState<boolean>(true);
  const snapToSurfaceRef = useRef<boolean>(true);
  useEffect(() => { snapToSurfaceRef.current = snapToSurface; }, [snapToSurface]);
  const undoStackRef = useRef<any[]>([]);
  const dragStartTransformRef = useRef<{ pos: THREE.Vector3; rot: THREE.Euler; scale: THREE.Vector3 } | null>(null);

  // 1. Khởi tạo TransformControls vào Three.js Scene
  useEffect(() => {
    if (!scene || !camera || !renderer || !controls) return;

    const tControls = new TransformControls(camera, renderer.domElement);
    tControls.size = 1.0;
    tControls.setSpace(space);

    const helper = tControls.getHelper();
    scene.add(helper);
    transformControlsRef.current = tControls;

    // Tắt OrbitControls khi người dùng đang kéo trục Gizmo & lưu lịch sử Undo
    tControls.addEventListener("dragging-changed", (event: any) => {
      isDraggingGizmoRef.current = Boolean(event.value);
      controls.enabled = !event.value;
      if (!event.value) {
        justDraggedGizmoRef.current = true;
        setTimeout(() => { justDraggedGizmoRef.current = false; }, 150);
      }
      const obj = selectedObjectRef.current;
      if (event.value && obj) {
        dragStartTransformRef.current = { pos: obj.position.clone(), rot: obj.rotation.clone(), scale: obj.scale.clone() };
      } else if (!event.value && obj && dragStartTransformRef.current) {
        const s = dragStartTransformRef.current;
        if (!s.pos.equals(obj.position) || !s.rot.equals(obj.rotation) || !s.scale.equals(obj.scale)) {
          undoStackRef.current.push({
            type: "transform", object: obj, before: s,
            after: { pos: obj.position.clone(), rot: obj.rotation.clone(), scale: obj.scale.clone() },
          });
        }
        dragStartTransformRef.current = null;
      }
    });

    // Khi di chuyển / xoay / scale bằng chuột: đồng bộ BoxHelper và Inspector Panel
    tControls.addEventListener("change", () => {
      const obj = selectedObjectRef.current;
      if (!obj) return;

      // Tùy chọn Snap bề mặt: tự động bám khít mặt trước biển quảng cáo khi di chuyển
      if (snapToSurfaceRef.current && isDraggingGizmoRef.current && meshGroup && mode === "translate") {
        let frontZ = 0;
        const bbox = new THREE.Box3();
        let found = false;
        meshGroup.children.forEach((c) => {
          if (c instanceof THREE.Mesh && !c.userData?.isText && !c.userData?.isHelper) {
            bbox.expandByObject(c);
            found = true;
          }
        });
        if (found && !bbox.isEmpty()) {
          frontZ = bbox.max.z;
        }
        const extrudeDepth = obj.userData?.textParams?.extrude || 0.04;
        obj.position.z = frontZ + extrudeDepth / 2 + 0.002;
      }

      if (boxHelperRef.current) boxHelperRef.current.update();
      setSelection((prev) => !prev ? null : ({
        ...prev,
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [THREE.MathUtils.radToDeg(obj.rotation.x), THREE.MathUtils.radToDeg(obj.rotation.y), THREE.MathUtils.radToDeg(obj.rotation.z)],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      }));
    });

    // Tạo BoxHelper hiển thị khung bao màu vàng khi vật thể được chọn
    const boxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0xf59e0b);
    boxHelper.visible = false;
    scene.add(boxHelper);
    boxHelperRef.current = boxHelper;

    return () => {
      tControls.dispose();
      scene.remove(tControls.getHelper());
      if (boxHelperRef.current) scene.remove(boxHelperRef.current);
      transformControlsRef.current = null;
      boxHelperRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, camera, renderer, controls]);

  // 2. Cập nhật Mode Gizmo: translate (Move W), rotate (Rotate E), scale (Scale R), select (Q)
  useEffect(() => {
    const tc = transformControlsRef.current;
    if (!tc) return;
    if (mode === "select") {
      tc.detach();
    } else {
      tc.setMode(mode);
      if (selectedObjectRef.current) {
        tc.attach(selectedObjectRef.current);
      }
    }
  }, [mode]);

  // 3. Cập nhật Hệ toạ độ World / Local
  useEffect(() => {
    transformControlsRef.current?.setSpace(space);
  }, [space]);

  // 4. Cập nhật Snap (Bắt điểm bước dịch chuyển)
  useEffect(() => {
    const tc = transformControlsRef.current;
    if (!tc) return;
    if (snap) {
      tc.setTranslationSnap(0.05); // 50mm
      tc.setRotationSnap(THREE.MathUtils.degToRad(15)); // 15 độ
      tc.setScaleSnap(0.1);
    } else {
      tc.setTranslationSnap(null);
      tc.setRotationSnap(null);
      tc.setScaleSnap(null);
    }
  }, [snap]);

  // 5. Chọn vật thể (Selection Handler)
  const selectObject = useCallback((mesh: THREE.Mesh | null) => {
    selectedObjectRef.current = mesh;
    const tc = transformControlsRef.current;
    const bh = boxHelperRef.current;

    if (!mesh) {
      tc?.detach();
      if (bh) bh.visible = false;
      setSelection(null);
      return;
    }

    // Đặt gizmo ở pivot center bottom của vật thể thay vì giữ 1 chỗ
    ensureCenterBottomPivot(mesh);
    mesh.updateMatrixWorld(true);

    if (bh) {
      bh.setFromObject(mesh);
      bh.visible = true;
      bh.update();
    }

    if (tc) {
      if (mode === "select") {
        setMode("translate");
        tc.setMode("translate");
      }
      tc.attach(mesh);
    }

    setSelection({
      uuid: mesh.uuid,
      name: mesh.userData?.name || `Phần tử 3D`,
      type: mesh.userData?.type || "Mesh",
      elementIndex: mesh.userData?.elementIndex,
      position: [mesh.position.x, mesh.position.y, mesh.position.z],
      rotation: [THREE.MathUtils.radToDeg(mesh.rotation.x), THREE.MathUtils.radToDeg(mesh.rotation.y), THREE.MathUtils.radToDeg(mesh.rotation.z)],
      scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      color: mesh.userData?.color || "#ffffff",
      materialId: mesh.userData?.materialId || mesh.userData?.name || `mesh_${mesh.uuid}`,
      isText: Boolean(mesh.userData?.isText),
      textParams: mesh.userData?.textParams,
    });
  }, [mode]);


  // 6. Raycast chọn vật thể khi click chuột vào 3D Viewport (Click ra ngoài -> Bỏ chọn)
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    if (isDraggingGizmoRef.current || justDraggedGizmoRef.current) return;
    if (!camera || !meshGroup || !renderer) return;

    if (pointerDownPosRef.current) {
      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
      if (dx > 8 || dy > 8) return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const tc = transformControlsRef.current;
    if (tc && selectedObjectRef.current) {
      const gizmoIntersects = raycaster.intersectObjects([tc.getHelper()], true);
      if (gizmoIntersects.length > 0) return;
    }

    const intersects = raycaster.intersectObjects(meshGroup.children, true);
    const hit = intersects.find((i) => {
      const o = i.object;
      return (o instanceof THREE.Mesh || (o as any).isMesh || o instanceof THREE.LineSegments) && !o.userData?.isHelper;
    });

    if (hit) {
      let target: THREE.Object3D | null = hit.object;
      while (target && target.parent && target.parent !== meshGroup && target.parent !== scene) {
        if (target.userData?.elementIndex !== undefined) break;
        target = target.parent;
      }
      selectObject((target || hit.object) as THREE.Mesh);
    } else {
      selectObject(null);
    }
  }, [camera, meshGroup, renderer, scene, selectObject]);

  // Lắng nghe pointer events trực tiếp từ Three.js canvas element
  useEffect(() => {
    if (!renderer?.domElement) return;
    const dom = renderer.domElement;
    const onDown = (e: PointerEvent) => { pointerDownPosRef.current = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => { handlePointerUp(e); };
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointerup", onUp);
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointerup", onUp);
    };
  }, [renderer, handlePointerUp]);

  // 7. Cập nhật toạ độ từ Inspector Panel
  const updateTransform = useCallback((pos: [number, number, number], rot: [number, number, number], sc: [number, number, number]) => {
    const obj = selectedObjectRef.current;
    if (!obj) return;
    obj.position.set(pos[0], pos[1], pos[2]);
    obj.rotation.set(THREE.MathUtils.degToRad(rot[0]), THREE.MathUtils.degToRad(rot[1]), THREE.MathUtils.degToRad(rot[2]));
    obj.scale.set(sc[0], sc[1], sc[2]);
    boxHelperRef.current?.update();
    setSelection((prev) => (prev ? { ...prev, position: pos, rotation: rot, scale: sc } : null));
  }, []);

  // 8. Đổi vật liệu cho vật thể được chọn từ danh mục Admake
  const applyMaterialToSelection = useCallback((materialId: string) => {
    const obj = selectedObjectRef.current;
    if (!obj) {
      message.warning("Vui lòng chọn 1 vật thể trước khi đổi vật liệu!");
      return;
    }
    const matOption = SIGNBOARD_MATERIALS.find((m) => m.id === materialId);
    if (!matOption) return;

    let effectiveMat = { ...matOption };
    try {
      const saved = localStorage.getItem(`admake_mat_custom_${materialId}`);
      if (saved) effectiveMat = { ...effectiveMat, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("[useEditor3DControls] Lỗi đọc localStorage:", e);
    }

    obj.material = createEditorMaterial(effectiveMat);
    obj.userData.materialId = materialId;
    obj.userData.color = effectiveMat.color;
    setSelection((prev) => (prev ? { ...prev, materialId, color: effectiveMat.color } : null));
    message.success(`✨ Đã đổi vật liệu sang: ${matOption.name}`);
  }, []);

  // 8b. Cập nhật thông số PBR & Texture Map trực tiếp thời gian thực
  const updateMaterialProperties = useCallback((props: { roughness?: number; metalness?: number; transmission?: number; textureUrl?: string }) => {
    const obj = selectedObjectRef.current;
    if (!obj || !(obj as THREE.Mesh).material) return;
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && !mesh.geometry.attributes.uv) generateBoxUVs(mesh.geometry);
    const mats: any[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    mats.forEach((mat) => {
      if (props.roughness !== undefined && "roughness" in mat) mat.roughness = props.roughness;
      if (props.metalness !== undefined && "metalness" in mat) mat.metalness = props.metalness;
      if (props.transmission !== undefined && "transmission" in mat) {
        mat.transmission = props.transmission;
        mat.transparent = props.transmission > 0.05;
        mat.opacity = 1 - props.transmission * 0.65;
      }
    });

    if (props.textureUrl !== undefined) {
      if (props.textureUrl) {
        new THREE.TextureLoader().load(props.textureUrl, (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          const isTiled = props.textureUrl?.includes("/maps/") || /#(Wood|Stone|Concrete|Brick|Metal)/.test(props.textureUrl || "");
          tex.repeat.set(isTiled ? 2 : 1, isTiled ? 2 : 1);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          mats.forEach((m) => {
            if (m.userData?.originalColor === undefined && m.color) m.userData.originalColor = m.color.getHex();
            if (m.color) m.color.setHex(0xffffff);
            m.map = tex;
            m.needsUpdate = true;
          });
          message.success("✨ Đã áp dụng texture map thành công!");
        }, undefined, () => message.error("Không tải được ảnh texture. Vui lòng thử lại!"));
      } else {
        mats.forEach((m) => {
          m.map = null;
          if (m.userData?.originalColor !== undefined && m.color) m.color.setHex(m.userData.originalColor);
          m.needsUpdate = true;
        });
        message.info("Đã gỡ bỏ texture");
      }
    }
    mats.forEach((m) => { m.needsUpdate = true; });
  }, []);

  // 9. Thêm chữ 3D MỚI (luôn tạo mới, không xóa chữ cũ)
  const createNewTextMesh = useCallback((params: Text3DParams) => {
    if (!meshGroup || !scene) return;
    const newMesh = build3DTextMesh(params);
    let frontZ = 0, centerY = 1.6, centerX = 0;
    if (meshGroup) {
      const bbox = new THREE.Box3();
      let foundSignboard = false;
      meshGroup.children.forEach((c) => {
        if (c instanceof THREE.Mesh && !c.userData?.isText && !c.userData?.isHelper) {
          bbox.expandByObject(c);
          foundSignboard = true;
        }
      });
      if (foundSignboard && !bbox.isEmpty()) {
        frontZ = bbox.max.z;
        centerY = (bbox.min.y + bbox.max.y) / 2;
        centerX = (bbox.min.x + bbox.max.x) / 2;
      }
    }
    const existingTexts = meshGroup.children.filter((c) => (c as THREE.Mesh).userData?.isText);
    const yOffset = existingTexts.length > 0 ? -0.32 * existingTexts.length : 0;
    const extrudeDepth = params.extrude || 0.04;
    newMesh.position.set(centerX, centerY + yOffset, frontZ + extrudeDepth / 2 + 0.002);
    meshGroup.add(newMesh);
    undoStackRef.current.push({ type: "create", object: newMesh, parent: meshGroup });
    selectObject(newMesh);
    message.success("✨ Đã tạo chữ nổi 3D bám trên mặt biển!");
  }, [meshGroup, scene, selectObject]);

  // Cập nhật tham số chữ 3D khi chỉnh sửa thuộc tính trên Panel bên trái
  const updateTextParams = useCallback((params: Text3DParams) => {
    if (!meshGroup) return;
    const oldMesh = selectedObjectRef.current;
    if (!oldMesh || !oldMesh.userData?.isText) return;
    const newMesh = build3DTextMesh(params);
    newMesh.position.copy(oldMesh.position);
    newMesh.rotation.copy(oldMesh.rotation);
    newMesh.scale.copy(oldMesh.scale);
    meshGroup.remove(oldMesh);
    meshGroup.add(newMesh);
    selectObject(newMesh);
  }, [meshGroup, selectObject]);

  // Xử lý xác nhận chữ 3D từ modal (nếu đang chọn chữ thì sửa, ngược lại tạo mới)
  const handleConfirmText3D = useCallback((params: Text3DParams) => {
    if (selectedObjectRef.current?.userData?.isText) {
      updateTextParams(params);
      message.success("✨ Đã cập nhật chữ nổi 3D!");
    } else {
      createNewTextMesh(params);
    }
  }, [createNewTextMesh, updateTextParams]);

  // Tạo chữ 3D trực tiếp (LUÔN TẠO MỚI, KHÔNG XÓA CHỮ CŨ)
  const createText3DDirectly = useCallback((overrideParams?: Partial<Text3DParams>) => {
    createNewTextMesh({
      text: "ADMAKE", fontFamily: "admake-pro", fontSize: 0.25, extrude: 0.04,
      fontStyle: "normal", fontWeight: "bold", bevelType: "round", bevelSize: 0.008,
      color: "#00b4b6", materialId: "mica_admake_teal", glow: false, ...overrideParams,
    });
  }, [createNewTextMesh]);

  // 10. Xoá vật thể & 11. Reset Transform
  const deleteSelected = useCallback(() => {
    const obj = selectedObjectRef.current;
    if (!obj || !meshGroup) return;
    undoStackRef.current.push({ type: "delete", object: obj, parent: meshGroup });
    meshGroup.remove(obj);
    selectObject(null);
    message.info("Đã xóa vật thể khỏi mô hình 3D");
  }, [meshGroup, selectObject]);

  const resetTransform = useCallback(() => {
    const obj = selectedObjectRef.current;
    if (!obj) return;
    undoStackRef.current.push({
      type: "transform", object: obj,
      before: { pos: obj.position.clone(), rot: obj.rotation.clone(), scale: obj.scale.clone() },
      after: { pos: new THREE.Vector3(0, 1.5, 0), rot: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
    });
    obj.position.set(0, 1.5, 0); obj.rotation.set(0, 0, 0); obj.scale.set(1, 1, 1);
    boxHelperRef.current?.update(); selectObject(obj);
    message.info("Đã đặt lại gốc tọa độ vật thể");
  }, [selectObject]);

  const undo = useCallback(() => {
    const act = undoStackRef.current.pop();
    if (!act) { message.info("Không có thao tác nào để hoàn tác (Undo)"); return; }
    if (act.type === "transform") {
      act.object.position.copy(act.before.pos); act.object.rotation.copy(act.before.rot); act.object.scale.copy(act.before.scale);
      boxHelperRef.current?.update(); selectObject(act.object as THREE.Mesh);
      message.success("↩️ Đã hoàn tác vị trí / kích thước!");
    } else if (act.type === "create") {
      if (act.object.parent) act.object.parent.remove(act.object);
      selectObject(null); message.success("↩️ Đã hoàn tác tạo chữ 3D!");
    } else if (act.type === "delete") {
      act.parent.add(act.object); selectObject(act.object as THREE.Mesh);
      message.success("↩️ Đã khôi phục vật thể đã xóa!");
    }
  }, [selectObject]);

  // Phím tắt bàn phím: Esc (bỏ chọn), Ctrl+Z (Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") selectObject(null);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault(); undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectObject, undo]);

  return {
    mode, setMode, space, setSpace, snap, setSnap, selection, selectObject,
    handlePointerDown, handlePointerUp, updateTransform, applyMaterialToSelection,
    updateMaterialProperties, openAddTextModal: createText3DDirectly,
    openEditTextModal: () => {}, createText3DDirectly, handleConfirmText3D,
    updateTextParams, snapToSurface, setSnapToSurface, deleteSelected, resetTransform,
    undo, onDeselect: () => selectObject(null),
  };
}
