import * as THREE from "three";
import type { Signboard3DModel, Mesh3DElement } from "../../services/genaiSignboard.service";

type Vec3 = [number, number, number];

const LED_RE = /led|đèn|den |light|chữ|chu |neon|glow/i;

interface Bucket {
  color: string;
  opacity: number;
  glow: boolean;
  positions: number[];
}

const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

function newellNormal(pts: Vec3[]): THREE.Vector3 {
  const n = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1, z1] = pts[i];
    const [x2, y2, z2] = pts[(i + 1) % pts.length];
    n.x += (y1 - y2) * (z1 + z2);
    n.y += (z1 - z2) * (x1 + x2);
    n.z += (x1 - x2) * (y1 + y2);
  }
  return n.lengthSq() > 1e-12 ? n.normalize() : new THREE.Vector3(0, 0, 1);
}

/** Tam giác hóa đa giác phẳng 3D (có thể lõm) bằng cách chiếu về mặt phẳng 2D. */
function triangulate(pts: Vec3[]): number[][] {
  if (pts.length === 3) return [[0, 1, 2]];
  const n = newellNormal(pts);
  const ref = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(ref, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u);
  const contour = pts.map((p) => {
    const q = new THREE.Vector3(...p);
    return new THREE.Vector2(q.dot(u), q.dot(v));
  });
  try {
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    if (tris.length) return tris;
  } catch {
    /* rơi xuống quạt tam giác */
  }
  const fan: number[][] = [];
  for (let i = 1; i < pts.length - 1; i++) fan.push([0, i, i + 1]);
  return fan;
}

function pushTri(out: number[], a: Vec3, b: Vec3, c: Vec3) {
  out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}

function pushPrism(out: number[], base: Vec3[], extrude: Vec3) {
  const top = base.map((p) => add3(p, extrude));
  const tris = triangulate(base);
  tris.forEach(([i, j, k]) => {
    pushTri(out, base[k], base[j], base[i]);
    pushTri(out, top[i], top[j], top[k]);
  });
  const len = Math.hypot(...extrude);
  if (len < 1e-5) return;
  for (let i = 0; i < base.length; i++) {
    const j = (i + 1) % base.length;
    pushTri(out, base[i], base[j], top[j]);
    pushTri(out, base[i], top[j], top[i]);
  }
}

function makeTextPlane(el: Mesh3DElement): THREE.Mesh | null {
  const base = el.base as Vec3[];
  const ex = (el.extrude || [0, 0, 0]) as Vec3;
  if (!base || base.length < 4 || !el.text) return null;
  const top = base.map((p) => add3(p, ex));
  const w = new THREE.Vector3(...top[1]).distanceTo(new THREE.Vector3(...top[0]));
  const h = new THREE.Vector3(...top[3]).distanceTo(new THREE.Vector3(...top[0]));
  if (w < 1e-4 || h < 1e-4) return null;
  const canvas = document.createElement("canvas");
  const ch = 128;
  canvas.height = ch;
  canvas.width = Math.min(4096, Math.max(64, Math.round((ch * w) / h)));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = el.color || "#ffffff";
  ctx.font = `bold ${Math.round(ch * 0.82)}px Arial, sans-serif`;
  ctx.textBaseline = "alphabetic";
  const tw = ctx.measureText(el.text).width || 1;
  ctx.save();
  ctx.scale(Math.min(1, canvas.width / tw), 1);
  ctx.fillText(el.text, 0, ch * 0.86);
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.BufferGeometry();
  // Đẩy nhẹ ra ngoài mặt trên để không bị z-fighting
  const exv = new THREE.Vector3(...ex);
  const n = (exv.lengthSq() > 1e-12 ? exv.normalize() : newellNormal(base)).multiplyScalar(0.002);
  const q = top.map((p) => [p[0] + n.x, p[1] + n.y, p[2] + n.z]);
  geo.setAttribute("position", new THREE.Float32BufferAttribute([...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]], 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}

function buildLegacy(el: Mesh3DElement, wireframe: boolean, night: boolean): THREE.Mesh {
  const [sx, sy, sz] = el.scale || [1, 1, 1];
  let geo: THREE.BufferGeometry;
  if (el.type === "cylinder") geo = new THREE.CylinderGeometry(Math.max(0.05, sx / 2), Math.max(0.05, sx / 2), sy, 24);
  else if (el.type === "sphere") geo = new THREE.SphereGeometry(Math.max(0.1, sx / 2), 24, 24);
  else geo = new THREE.BoxGeometry(sx, sy, sz);
  const glow = night && (LED_RE.test(el.name) || el.color === "#f59e0b" || el.color === "#ffffff");
  const mat = new THREE.MeshStandardMaterial({
    color: el.color || "#475569",
    wireframe,
    roughness: 0.35,
    metalness: el.name.toLowerCase().includes("sắt") ? 0.6 : 0.2,
    emissive: glow ? new THREE.Color(el.color || "#f59e0b") : new THREE.Color("#000000"),
    emissiveIntensity: glow ? 1.5 : 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const [px, py, pz] = el.position || [0, 0, 0];
  mesh.position.set(px, py + 1.5, pz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Dựng toàn bộ mô hình thành các Object3D: phần tử prism/text/line (hình học thật từ mã Ruby)
 * được gộp theo màu để giảm draw call; phần tử box/cylinder/sphere (mẫu cũ) giữ nguyên cách dựng.
 */
export function buildSignboardObjects(model: Signboard3DModel, wireframe: boolean, night: boolean): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];

  model.elements.forEach((el, index) => {
    if (el.type === "prism") {
      const base = el.base as Vec3[] | undefined;
      if (!base || base.length < 3) return;
      const positions: number[] = [];
      pushPrism(positions, base, (el.extrude || [0, 0, 0]) as Vec3);
      if (positions.length === 0) return;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      generateBoxUVs(geo);

      const opacity = el.opacity ?? 1;
      const glow = night && LED_RE.test(el.name);
      const color = el.color || "#b0b8c0";

      const mat = new THREE.MeshStandardMaterial({
        color,
        wireframe,
        roughness: 0.45,
        metalness: el.name?.toLowerCase().includes("sắt") || el.name?.toLowerCase().includes("inox") ? 0.75 : 0.2,
        side: THREE.DoubleSide,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
        emissive: glow ? new THREE.Color(color) : new THREE.Color("#000000"),
        emissiveIntensity: glow ? 1.5 : 0,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = opacity >= 1;
      mesh.receiveShadow = true;
      mesh.userData = {
        elementIndex: index,
        element: el,
        name: el.name || `Khối ${index + 1}`,
        type: "prism",
        color,
        opacity,
      };
      ensureCenterBottomPivot(mesh);
      out.push(mesh);
    } else if (el.type === "text") {
      const plane = makeTextPlane(el);
      if (plane) {
        plane.userData = {
          elementIndex: index,
          element: el,
          name: el.name || `Chữ "${el.text || ''}"`,
          type: "text",
          color: el.color,
        };
        ensureCenterBottomPivot(plane);
        out.push(plane);
      }
    } else if (el.type === "line") {
      const base = el.base as Vec3[] | undefined;
      if (!base || base.length < 2) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute([...base[0], ...base[1]], 3));
      const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: el.color }));
      line.userData = { elementIndex: index, element: el, name: el.name || `Đường nét`, type: "line" };
      out.push(line);
    } else {
      const m = buildLegacy(el, wireframe, night);
      m.userData = { elementIndex: index, element: el, name: el.name || `Hình khối`, type: el.type };
      if (m instanceof THREE.Mesh) ensureCenterBottomPivot(m);
      out.push(m);
    }
  });

  return out;
}

/**
 * Đặt pivot của mesh về đáy trung tâm (Center-Bottom)
 * X: chính giữa bounding box
 * Y: điểm thấp nhất (đáy)
 * Z: chính giữa bounding box
 */
export function ensureCenterBottomPivot(mesh: THREE.Mesh) {
  if (mesh.userData?.__pivotCentered) return;
  if (!mesh.geometry) return;
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  if (!box) return;

  const cx = (box.min.x + box.max.x) / 2;
  const cy = box.min.y;
  const cz = (box.min.z + box.max.z) / 2;

  if (Math.abs(cx) > 1e-4 || Math.abs(cy) > 1e-4 || Math.abs(cz) > 1e-4) {
    mesh.geometry.translate(-cx, -cy, -cz);
    mesh.position.x += cx;
    mesh.position.y += cy;
    mesh.position.z += cz;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }
  mesh.userData.__pivotCentered = true;
}

export interface CameraFit {
  center: THREE.Vector3;
  dist: number;
  maxDim: number;
}

/** Tính tâm + khoảng cách camera để thấy trọn mô hình (thu phóng gần hơn gấp 3 theo yêu cầu). */
export function computeFit(group: THREE.Object3D, fovDeg: number): CameraFit {
  const box = new THREE.Box3().setFromObject(group);
  if (box.isEmpty()) return { center: new THREE.Vector3(0, 1.5, 0), dist: 2.8, maxDim: 4 };
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.5);
  // Khoảng cách camera zoom gần gấp 3 (hệ số 0.45 thay vì 1.35) để vật thể hiển thị to rõ nét
  const dist = ((maxDim / 2) / Math.tan((fovDeg * Math.PI) / 360)) * 0.45;
  return { center, dist: Math.max(1.2, dist), maxDim };
}

/**
 * Tự động tính toán toạ độ UV (Box / Cubic Projection) cho hình học BufferGeometry
 * Đảm bảo các khối Prism từ file Ruby và các tấm billboard panel hiển thị trọn vẹn texture map
 */
export function generateBoxUVs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const sizeX = Math.max(1e-4, box.max.x - box.min.x);
  const sizeY = Math.max(1e-4, box.max.y - box.min.y);
  const sizeZ = Math.max(1e-4, box.max.z - box.min.z);

  const posAttr = geometry.attributes.position;
  if (!posAttr) return;
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }
  const normAttr = geometry.attributes.normal;
  const count = posAttr.count;
  const uvs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    let nx = 0;
    let ny = 0;
    let nz = 1;
    if (normAttr) {
      nx = Math.abs(normAttr.getX(i));
      ny = Math.abs(normAttr.getY(i));
      nz = Math.abs(normAttr.getZ(i));
    }

    if (nz >= nx && nz >= ny) {
      // Mặt trước / sau (mặt chính bảng hiệu, billboard face)
      uvs[i * 2] = (x - box.min.x) / sizeX;
      uvs[i * 2 + 1] = (y - box.min.y) / sizeY;
    } else if (nx >= ny && nx >= nz) {
      // Mặt hông trái / phải
      uvs[i * 2] = (z - box.min.z) / sizeZ;
      uvs[i * 2 + 1] = (y - box.min.y) / sizeY;
    } else {
      // Mặt trên đỉnh / dưới đáy
      uvs[i * 2] = (x - box.min.x) / sizeX;
      uvs[i * 2 + 1] = (z - box.min.z) / sizeZ;
    }
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (geometry.attributes.uv) {
    geometry.attributes.uv.needsUpdate = true;
  }
}

