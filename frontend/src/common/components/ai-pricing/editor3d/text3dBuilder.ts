/**
 * text3dBuilder.ts - Khởi tạo chữ 3D thật (Authentic 3D TextGeometry) với Three.js
 * Hỗ trợ 100% tiếng Việt có dấu, Độ dày (Extrude) và Bo viền (Bevel: Chamfer, Round, Soft, None)
 */

import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import gentilisBoldData from "three/examples/fonts/gentilis_bold.typeface.json";
import gentilisRegularData from "three/examples/fonts/gentilis_regular.typeface.json";
import type { Text3DParams } from "./editorTypes";
import { SIGNBOARD_MATERIALS, createEditorMaterial } from "./materialsCatalog";

let cachedBoldFont: Font | null = null;
let cachedRegularFont: Font | null = null;

function getFont(isBold: boolean): Font {
  const loader = new FontLoader();
  if (isBold) {
    if (!cachedBoldFont) cachedBoldFont = loader.parse(gentilisBoldData);
    return cachedBoldFont;
  }
  if (!cachedRegularFont) cachedRegularFont = loader.parse(gentilisRegularData);
  return cachedRegularFont;
}

/**
 * Xây dựng Mesh Chữ nổi 3D thật với TextGeometry (hỗ trợ tiếng Việt đầy đủ)
 */
export function build3DTextMesh(params: Text3DParams): THREE.Mesh {
  const {
    text = "ADMAKE",
    fontSize = 0.25,
    extrude = 0.04,
    fontWeight = "bold",
    bevelType = "round",
    color = "#00b4b6",
    materialId,
    glow = false,
  } = params;

  const isBold = fontWeight === "bold" || fontWeight === "600" || fontWeight === "800";
  const font = getFont(isBold);

  // 1. Cấu hình Bevel (Vát mép cạnh chữ)
  let bevelEnabled = true;
  let bevelSegments = 3;
  let bevelThickness = Math.min(0.008, extrude * 0.15);
  let bevelSize = Math.min(0.008, extrude * 0.15);

  if (bevelType === "chamfer") {
    // Vát chéo phẳng cạnh 45 độ (1 phân đoạn)
    bevelSegments = 1;
    bevelThickness = Math.min(0.006, extrude * 0.12);
    bevelSize = Math.min(0.006, extrude * 0.12);
  } else if (bevelType === "round") {
    // Bo tròn tiêu chuẩn (4 phân đoạn cong)
    bevelSegments = 4;
    bevelThickness = Math.min(0.008, extrude * 0.16);
    bevelSize = Math.min(0.008, extrude * 0.16);
  } else if (bevelType === "round_soft") {
    // Bo tròn mềm mại cong mịn (6 phân đoạn)
    bevelSegments = 6;
    bevelThickness = Math.min(0.012, extrude * 0.22);
    bevelSize = Math.min(0.012, extrude * 0.22);
  } else {
    // None: Vuông phẳng sắc cạnh
    bevelEnabled = false;
  }

  // 2. Tạo hình học TextGeometry thực tế (hỗ trợ tối đa 10,000mm = 10m)
  const safeText = text?.trim() || "ADMAKE";
  const safeSize = Math.max(0.01, Math.min(10.0, Number(fontSize) || 0.25));
  const safeExtrude = Math.max(0.002, Math.min(1.0, Number(extrude) || 0.04));

  let geometry: THREE.BufferGeometry;
  try {
    const textGeo = new TextGeometry(safeText, {
      font,
      size: safeSize,
      depth: safeExtrude,
      curveSegments: 8,
      bevelEnabled,
      bevelSegments,
      bevelThickness,
      bevelSize,
      bevelOffset: 0,
    });
    textGeo.computeVertexNormals();
    textGeo.center();
    geometry = textGeo;
  } catch (err) {
    console.warn("Lỗi tạo TextGeometry, sử dụng hình khối fallback:", err);
    geometry = new THREE.BoxGeometry(safeSize * 2, safeSize, safeExtrude);
  }

  // 3. Gán vật liệu
  let mat: THREE.Material;
  const foundMat = SIGNBOARD_MATERIALS.find((m) => m.id === materialId);
  if (foundMat) {
    mat = createEditorMaterial({ ...foundMat, color: color || foundMat.color, glow: glow || foundMat.glow });
  } else {
    const c = new THREE.Color(color);
    mat = new THREE.MeshPhysicalMaterial({
      color: c,
      roughness: 0.04,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.98,
      emissive: glow ? c : new THREE.Color("#000000"),
      emissiveIntensity: glow ? 2.0 : 0,
      side: THREE.DoubleSide,
    });
  }

  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Dữ liệu đánh dấu vật thể Text để Editor nhận biết
  mesh.userData = {
    isText: true,
    textParams: params,
    name: `Chữ 3D: "${safeText}"`,
    type: "text3d",
  };

  return mesh;
}
