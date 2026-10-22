/**
 * editorTypes.ts - Định nghĩa các kiểu dữ liệu cho Bộ 3D Editor kiểu 3ds Max
 */

import type * as THREE from "three";

export type TransformMode = "select" | "translate" | "rotate" | "scale";
export type CoordinateSpace = "world" | "local";
export type BevelType = "round" | "chamfer" | "round_soft" | "none";

export interface Text3DParams {
  text: string;
  fontFamily: string;
  fontSize: number; // mét (vd: 0.25 = 250mm)
  extrude: number; // mét (vd: 0.05 = 50mm)
  fontStyle: "normal" | "italic";
  fontWeight: "normal" | "bold" | "600" | "800";
  bevelType: BevelType;
  bevelSize: number; // mét
  color: string;
  materialId?: string;
  glow?: boolean;
}

export interface SelectedMeshInfo {
  uuid: string;
  name: string;
  type: string;
  elementIndex?: number;
  position: [number, number, number];
  rotation: [number, number, number]; // góc độ (degrees)
  scale: [number, number, number];
  color: string;
  materialId?: string;
  isText?: boolean;
  textParams?: Text3DParams;
}

export interface SignboardMaterialOption {
  id: string;
  name: string;
  category: "alu" | "iron" | "inox" | "mica" | "bat" | "led" | "lumion";
  category_vn: string;
  description: string;
  color: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  transmission?: number;
  ior?: number;
  glow?: boolean;
  emissiveIntensity?: number;
  badge?: string;
  textureUrl?: string;
  mapRepeat?: [number, number];
}

export interface FontOption {
  id: string;
  name: string;
  category: "sans-serif" | "display" | "serif" | "script" | "slab" | "custom";
  category_vn: string;
  weights: number[];
  styles: string[];
  best_for: string;
}
